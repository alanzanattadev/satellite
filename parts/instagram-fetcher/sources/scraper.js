const puppeteer = require('puppeteer');

const { login } = require('./login');
const downloader = require('./download');
const userScraper = require('./user');
const storiesScraper = require('./stories');
const postsScraper = require('./posts');

let browser = null;

const open = async ({ headless, credentials }) => {
  browser = await puppeteer.launch({ headless });
  const page = await browser.newPage();
  if (credentials) {
    await login(page, credentials.user, credentials.pass);
  }
  return page;
};

const close = async () => {
  if (browser) {
    await browser.close();
  }
};

const getHighlightsData = async (page, userData) => {
  if (!page || !userData) {
    return userData;
  }
  const highlights = await storiesScraper.getHighlights(page, userData);
  return {...userData, ...{ highlights }};
};

const getPostsMetaData = async (page, userData) => {
  if (!page || !userData) {
    return userData;
  }
  const posts = await postsScraper.getDataFromPosts(page, userData);
  return {...userData, ...{ posts }};
};

module.exports.getUserData = async (options) => {
  const page = await open(options);
  let userData = await userScraper.getData(page, options);

  if (options.highlights === true) {
    userData = await getHighlightsData(page, userData);
  }
  if (options.stories === true) {
    userData['stories'] = await storiesScraper.getStories(page, userData);
  }
  if (options.postMeta === true) {
    userData = await getPostsMetaData(page, userData);
  }
  await close();
  return userData;
}

module.exports.saveMediasAt = downloader.saveMediasAt;
