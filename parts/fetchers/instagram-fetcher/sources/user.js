const parser = require('./parsing');
const { REQUESTFINISHED_EVENT, isXHR, isGraphQLQuery, scrollDown } = require('./common');
const logger = require('./logger');

const getAllPosts = async (user, page, postsCount, isPrivate) => {
  let posts = [];
  let morePages = true;

  logger.verbose('Start getting posts from user');
  page.on(REQUESTFINISHED_EVENT, async (res) => {
    if (isXHR(res) && isGraphQLQuery(res)) {
      const json = await res.response().json();
      const postsFromResource = parser.getPostsFromResource(json);
      posts = posts.concat(postsFromResource.map(p => parser.parsePost(p)));

      logger.verbose(`Posts fetching: ${posts.length} of ${postsCount}`);
      morePages = parser.isMorePostsResources(json);
    }
  });
  const postsFromUserPage = parser.getPostsFromUser(user);
  posts = posts.concat(postsFromUserPage.map(p => parser.parsePost(p)));
  if (posts.length === 0 && isPrivate) {
    logger.error('Cannot get posts, try to login (maybe the account is private)');
    morePages = false;
  }
  while (morePages && postsCount > posts.length) {
    await scrollDown(page);
  }
  page.removeAllListeners(REQUESTFINISHED_EVENT);
  return posts;
};

const getFollows = async (page, username, followersOrFollowing, count) => {
  let list = [];
  let morePages = true;

  logger.verbose(`Start getting follow${followersOrFollowing ? 'er' : 'ing'}s from user`);
  page.on(REQUESTFINISHED_EVENT, async (res) => {
    if (isXHR(res) && isGraphQLQuery(res)) {
      const json = await res.response().json();
      const listFromResource = (
        followersOrFollowing
          ? parser.getFollowersFromResource(json)
          : parser.getFollowingsFromResource(json)
      );
      list = list.concat(listFromResource.map(f => parser.parseFollows(f)));

      logger.verbose(`Follow${followersOrFollowing ? 'er' : 'ing'}s fetching: ${list.length} of ${count}`);
      morePages = (
        followersOrFollowing
          ? parser.isMoreFollowersResources(json)
          : parser.isMoreFollowingsResources(json)
      );
    }
  });
  const frame = await page.mainFrame();
  try {
    const selector = parser.getFollowLink(username, followersOrFollowing);
    await page.waitFor(selector, { timeout: 5000 });
    await frame.click(selector);

    const closeSelector = parser.getFollowDivSelector();
    await page.waitFor(closeSelector, { timeout: 3000 });
    await frame.click(closeSelector);
  } catch (err) {
    logger.error(`Cannot get follow${followersOrFollowing ? 'er' : 'ing'}s, try to login (maybe the account is private)`);
    morePages = false;
  }
  while (morePages && count > list.length) {
    await scrollDown(page);
  }
  page.removeAllListeners(REQUESTFINISHED_EVENT);
  try {
    await frame.click(parser.getFollowDivCloseButtonSelector());
  } catch (err) {
    logger.warn(`Cannot close follow${followersOrFollowing ? 'er' : 'ing'}s div`);
  }
  return list;
};

const getHighlights = page => new Promise((resolve) => {
  if (!page) {
    resolve([]);
  }
  page.on(REQUESTFINISHED_EVENT, async (res) => {
    if (isXHR(res) && parser.isHighlightResource(res.url())) {
      const highlightsFromResource = parser.getHighlightsFromResource(await res.response().json());
      page.removeAllListeners(REQUESTFINISHED_EVENT);

      logger.verbose(`User's highlights found (${highlightsFromResource.length} items)`);
      resolve(highlightsFromResource.map(h => parser.parseHighlight(h)));
    }
  });
  setTimeout(() => resolve([]), 15 * 1000);
});

module.exports.getData = async (page, { id, followers, following, posts, highlights }) => {
  if (!page || !id) {
    return null;
  }

  let hlPromise = null;
  if (highlights === true) {
    hlPromise = getHighlights(page);
  }

  logger.verbose(`Go on user '${id}' profile page`);
  await page.goto(`https://www.instagram.com/${id}/`, { waitUntil: 'networkidle0' });
  const json = parser.getJSONFromHTML(await page.content());
  const user = parser.getUser(json);

  if (!user) {
    logger.error(`User ${id} not found...`);
    return null;
  }

  logger.verbose('Parse profile from user');
  const profile = parser.parseProfile(user);
  return {
    profile,
    posts: (posts !== true ? null
      : await getAllPosts(user, page, profile.postsCount, profile.isPrivate)),
    followers: (followers !== true ? null
      : await getFollows(page, id, true, profile.followersCount)),
    following: (following !== true ? null
      : await getFollows(page, id, false, profile.followsCount)),
    highlights: (highlights !== true || hlPromise === null ? null : await hlPromise),
  };
};
