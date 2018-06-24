const parser = require('./parsing');
const { REQUESTFINISHED_EVENT, isXHR, isGraphQLQuery, scrollDown } = require('./utils');

const getLikes = async (page, shortcode, count) => {
  let likes = [];
  page.on(REQUESTFINISHED_EVENT, async (res) => {
    if (isXHR(res) && isGraphQLQuery(res)) {
      const json = await res.response().json();
      const listFromResource = parser.getLikesFromResource(json);
      likes = likes.concat(listFromResource.map(p => parser.parseLike(p)));
      likes = likes.filter(
        (elem, index, self) => index === self.map(e => e.id).indexOf(elem.id)
      );
    }
  });
  const frame = await page.mainFrame();
  try {
    const selector = parser.getLikesLink(shortcode);
    await page.waitFor(selector);
    await frame.click(selector);
    const closeSelector = parser.getLikesDivSelector();
    await page.waitFor(closeSelector);
    await frame.click(closeSelector);
  } catch (err) {
    console.log('Cannot get likes, try to login (maybe the account is private)');
    return [];
  }
  while (count > likes.length) {
    await scrollDown(page);
    console.log(`Likes fetching: ${likes.length} of ${count}`);
  }
  page.removeAllListeners(REQUESTFINISHED_EVENT);
  try {
    await frame.click(parser.getLikesDivCloseButtonSelector());
  } catch (err) {}
  return likes;
}

const POSTS_KEY = 'posts';
const POSTS_URL = 'https://www.instagram.com/p/';

const getDataFromPost = async (page, shortcode) => {
  await page.goto(`${POSTS_URL}${shortcode}/`, {
    waitUntil: 'domcontentloaded',
  });
  const json = parser.getJSONFromHTML(await page.content());
  require('fs').writeFileSync('file.json', JSON.stringify(json));
  const newPost = parser.parsePost(parser.getPost(json), true);
  if (newPost['type'] !== 'video' && newPost['likeCount'] > 10) {
    newPost['likes'] = await getLikes(page, newPost['shortcode'], newPost['likeCount']);
  }
  if (newPost['commentCount'] > 10) {
    newPost['comments'] = [];
  }
  return newPost;
};

module.exports.getDataFromPosts = async (page, userData) => {
  if (!page || !userData || !userData[POSTS_KEY]) {
    return null;
  }
  let posts = [];
  for (index in userData[POSTS_KEY]) {
    posts.push(await getDataFromPost(page, userData[POSTS_KEY][index]['shortcode']));
    console.log(`Post ${index} of ${userData[POSTS_KEY].length}`);
  }
  return posts;
};
