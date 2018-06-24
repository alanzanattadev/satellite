const parser = require('./parsing');
const { REQUESTFINISHED_EVENT, isXHR, isGraphQLQuery, scrollDown } = require('./utils');

const getAllPosts = async (user, page, postsCount, isPrivate) => {
  let posts = [];
  page.on(REQUESTFINISHED_EVENT, async (res) => {
    if (isXHR(res) && isGraphQLQuery(res)) {
      const postsFromResource = parser.getPostsFromResource(await res.response().json());
      posts = posts.concat(postsFromResource.map(p => parser.parsePost(p)));
    }
  });
  const postsFromUserPage = parser.getPostsFromUser(user);
  posts = posts.concat(postsFromUserPage.map(p => parser.parsePost(p)));
  if (posts.length === 0 && isPrivate) {
    console.log('Cannot get posts, this account is private.. (and you are not friends)');
    return [];
  }
  while (postsCount > posts.length) {
    await scrollDown(page);
    console.log(`Posts fetching: ${posts.length} of ${postsCount}`);
  }
  page.removeAllListeners(REQUESTFINISHED_EVENT);
  return posts;
};

const getFollows = async (page, username, followersOrFollowing, count) => {
  let list = [];
  page.on(REQUESTFINISHED_EVENT, async (res) => {
    if (isXHR(res) && isGraphQLQuery(res)) {
      const json = await res.response().json();
      const listFromResource = (
        followersOrFollowing ?
        parser.getFollowersFromResource(json) :
        parser.getFollowingsFromResource(json)
      );
      list = list.concat(listFromResource.map(f => parser.parseFollows(f)));
    }
  });
  const frame = await page.mainFrame();
  try {
    const selector = parser.getFollowLink(username, followersOrFollowing);
    await page.waitFor(selector);
    await frame.click(selector);

    const closeSelector = parser.getFollowDivSelector();
    await page.waitFor(closeSelector);
    await frame.click(closeSelector);
  } catch (err) {
    console.log('Cannot get followers/following, try to login (maybe the account is private)');
    return [];
  }
  while (count > list.length) {
    await scrollDown(page);
    console.log(`Follow${followersOrFollowing ? 'er' : 'ing'}s fetching: ${list.length} of ${count}`);
  }
  page.removeAllListeners(REQUESTFINISHED_EVENT);
  try {
    await frame.click(parser.getFollowDivCloseButtonSelector());
  } catch (err) {}
  return list;
}

const getHighlights = page => new Promise((resolve) => {
  if (!page) {
    resolve([]);
  }
  page.on(REQUESTFINISHED_EVENT, async (res) => {
    if (isXHR(res) && parser.isHighlightResource(res.url())) {
      const highlightsFromResource = parser.getHighlightsFromResource(await res.response().json());
      resolve(highlightsFromResource.map(h => parser.parseHighlight(h)));
    }
  });
});

module.exports.getData = async (page, { id, followers, following, posts, highlights }) => {
  const username = id;

  let hlPromise = null;
  if (highlights === true) {
    hlPromise = getHighlights(page);
  }

  await page.goto(`https://www.instagram.com/${username}/`, { waitUntil: 'networkidle0' });
  const json = parser.getJSONFromHTML(await page.content());
  const user = parser.getUser(json);

  if (!user) {
    return console.error(`User ${username} not found...`);
  }
  let result = {
    'profile': parser.parseProfile(user),
  };
  if (highlights === true) {
    result['highlights'] = (hlPromise ? await hlPromise : []);
    page.removeAllListeners(REQUESTFINISHED_EVENT);
  }
  if (posts === true) {
    result['posts'] = await getAllPosts(user, page, result['profile'].postsCount, result['profile'].isPrivate);
  }
  if (followers === true) {
    result['followers'] = await getFollows(page, username, true, result['profile'].followersCount);
  }
  if (following === true) {
    result['following'] = await getFollows(page, username, false, result['profile'].followsCount);
  }
  return result;
};
