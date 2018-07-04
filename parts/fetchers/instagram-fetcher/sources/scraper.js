const puppeteer = require('puppeteer');

const { login } = require('./login');
const logger = require('./logger');
const downloader = require('./download');
const userScraper = require('./user');
const storiesScraper = require('./stories');
const postsScraper = require('./posts');

let browser = null;

const cancelImages = async (page) => {
  await page.setRequestInterception(true);
  page.on('request', (interceptedRequest) => {
    if (interceptedRequest.url().endsWith('.png') || interceptedRequest.url().endsWith('.jpg')) {
      interceptedRequest.abort();
    } else {
      interceptedRequest.continue();
    }
  });
};

const open = async ({ headless, credentials }) => {
  logger.verbose('Start browser and open page');
  browser = await puppeteer.launch({
    headless,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ],
  });
  const page = await browser.newPage();
  if (credentials) {
    await login(page, credentials.user, credentials.pass);
  }
  return page;
};

const close = async () => {
  if (browser) {
    logger.verbose('Wait for browser to close');
    await browser.close();
  }
  return null;
};

const getHighlightsData = async (page, userData) => {
  if (!page || !userData) {
    return userData;
  }
  const highlights = await storiesScraper.getHighlights(page, userData);
  return { ...userData, ...{ highlights } };
};

const getPostsMetaData = async (page, userData) => {
  if (!page || !userData) {
    return userData;
  }
  const posts = await postsScraper.getDataFromPosts(page, userData);
  return { ...userData, ...{ posts } };
};

module.exports.getPostData = async (options) => {
  if (!options) {
    logger.verbose('Missing scraper options');
    return null;
  }
  const page = await open(options);
  await cancelImages(page);
  logger.info('Get post informations');
  const post = await postsScraper.getDataFromPost(page, options.id);
  await close();
  return post;
};

module.exports.getUserData = async (options) => {
  if (!options) {
    logger.verbose('Missing scraper options');
    return null;
  }
  const page = await open(options);
  await cancelImages(page);

  logger.info('Get user informations');
  let userData = await userScraper.getData(page, options);
  if (userData) {
    logger.info(`Success to get ${userData.profile.username}'s profile (\
${userData.posts ? userData.posts.length : 0} posts, \
${userData.followers ? userData.followers.length : 0} followers, \
${userData.following ? userData.following.length : 0} followings)`);

    if (options.highlights === true) {
      logger.info('Get user\'s highlights');
      userData = await getHighlightsData(page, userData);
    }
    if (options.stories === true) {
      logger.info('Get user\'s stories');
      const stories = await storiesScraper.getStories(page, userData);
      if (stories) {
        userData.stories = stories;
      }
    }
    if (options.postMeta === true) {
      logger.info('Get user\'s posts metadata');
      userData = await getPostsMetaData(page, userData);
    }
  }
  await close();
  return userData;
};

module.exports.saveMediasAt = downloader.saveMediasAt;
