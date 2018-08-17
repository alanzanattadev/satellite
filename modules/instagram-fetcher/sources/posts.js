const parser = require('./parsing');
const { REQUESTFINISHED_EVENT, isXHR, isGraphQLQuery, scrollDown } = require('./common');
const logger = require('./logger');
const saveRaw = require('./raw');

const filterById = (elem, index, self) => index === self.map(e => e.id).indexOf(elem.id);

const getLikes = async (page, shortcode, count) => {
  let likes = [];
  let morePages = true;

  logger.verbose('Start getting likes for post');
  page.on(REQUESTFINISHED_EVENT, async (res) => {
    if (isXHR(res) && isGraphQLQuery(res)) {
      const json = await res.response().json();
      saveRaw('postlikesresource', shortcode, json);
      const listFromResource = parser.getLikesFromResource(json) || [];
      likes = likes.concat(listFromResource.map(p => parser.parseLike(p)));
      likes = likes.filter(filterById);
      logger.verbose(`Likes fetching: ${likes.length} of ${count}`);
      morePages = parser.isMoreLikesResources(json);
    }
  });
  const frame = await page.mainFrame();
  try {
    const selector = parser.getLikesLink(shortcode);
    await page.waitFor(selector, { timeout: 5000 });
    await frame.click(selector);
    const closeSelector = parser.getLikesDivSelector();
    await page.waitFor(closeSelector, { timeout: 3000 });
    await frame.click(closeSelector);
  } catch (err) {
    logger.error('Cannot get likes, try to login (maybe the account is private)');
    return [];
  }
  while (morePages && likes.length < count) {
    await scrollDown(page);
  }
  page.removeAllListeners(REQUESTFINISHED_EVENT);
  try {
    await frame.click(parser.getLikesDivCloseButtonSelector());
  } catch (err) {
    logger.warn('Cannot close likes div');
  }
  return likes;
};

const getComments = async (page, count, shortcode) => {
  let comments = [];
  let morePages = true;
  logger.verbose('Start getting comments for post');
  page.on(REQUESTFINISHED_EVENT, async (res) => {
    if (isXHR(res) && isGraphQLQuery(res)) {
      const json = await res.response().json();
      saveRaw('postcommentsresource', shortcode, json);
      const listFromResource = parser.getCommentsFromResource(json) || [];
      comments = comments.concat(listFromResource.map(p => parser.parseComment(p)));
      comments = comments.filter(filterById);
      logger.verbose(`Comments fetching: ${comments.length} of ${count}`);
      morePages = parser.isMoreCommentsResources(json);
    }
  });
  const selector = parser.getCommentsLink();
  const frame = await page.mainFrame();
  while (morePages && comments.length < count) {
    try {
      await page.waitFor(selector, { timeout: 3000 });
      await frame.click(selector);
    } catch (err) {
      logger.debug(err);
    }
  }
  page.removeAllListeners(REQUESTFINISHED_EVENT);
  return comments;
};

const LOCATION_URL = 'https://www.instagram.com/explore/locations/';

const getLocationData = async (page, id) => {
  logger.verbose(`Get details for location '${id}'`);
  await page.goto(`${LOCATION_URL}${id}/`, {
    waitUntil: 'domcontentloaded',
  });
  const json = parser.getJSONFromHTML(await page.content());
  saveRaw('locationpage', id, json);
  return parser.parseLocation(parser.getLocation(json));
};

const POSTS_URL = 'https://www.instagram.com/p/';

const getDataFromPost = async (page, shortcode) => {
  if (!page || !shortcode) {
    return null;
  }
  logger.verbose(`Get details for post '${shortcode}'`);
  await page.goto(`${POSTS_URL}${shortcode}/`, {
    waitUntil: 'domcontentloaded',
  });
  const json = parser.getJSONFromHTML(await page.content());
  saveRaw('postpage', shortcode, json);
  const newPost = parser.parsePost(parser.getPost(json), true);
  if (newPost === null) {
    return null;
  }
  if (newPost.type !== 'video' && newPost.likeCount > 10) {
    newPost.likes = await getLikes(page, newPost.shortcode, newPost.likeCount);
  }
  if (newPost.commentCount > 40) {
    const newComments = await getComments(page, newPost.commentCount - 40, shortcode);
    newPost.comments = newPost.comments.concat(newComments);
  }
  if (newPost.location) {
    newPost.location = await getLocationData(page, newPost.location.id);
  }
  return newPost;
};

module.exports.getDataFromPost = getDataFromPost;
module.exports.getDataFromPosts = async (page, userData) => {
  if (!page || !userData || !userData.posts) {
    return null;
  }
  const posts = [];
  logger.verbose(`Get details for ${userData.posts.length} posts`);

  for (let index = 0; index < userData.posts.length; index += 1) {
    posts.push(await getDataFromPost(page, userData.posts[index].shortcode));
    logger.verbose(`Details get for ${(userData.profile || {}).username}'s post \
'${userData.posts[index].shortcode}' [${index} of ${userData.posts.length}]`);
  }
  return posts;
};
