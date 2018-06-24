const parser = require('./parsing');
const { REQUESTFINISHED_EVENT, isXHR, isGraphQLQuery } = require('./utils');

const getStoryFromResource = page => new Promise((resolve) => {
  if (!page) {
    resolve([]);
  }
  page.on(REQUESTFINISHED_EVENT, async (res) => {
    if (isXHR(res) && isGraphQLQuery(res)) {
      resolve(parser.parseStories(await res.response().json()));
    }
  });
});

const HIGHLIGHTS_KEY = 'highlights';
const PROFILE_KEY = 'profile';
const STORIES_URL = 'https://www.instagram.com/stories/';

module.exports.getHighlights = async (page, userData) => {
  if (!page || !userData || !userData[HIGHLIGHTS_KEY]) {
    return null;
  }
  let highlights = [];
  for (index in userData[HIGHLIGHTS_KEY]) {
    const hl = userData[HIGHLIGHTS_KEY][index];
    const promise = getStoryFromResource(page);
    await page.goto(`${STORIES_URL}highlights/${hl['id']}/`);
    const newData = await promise;
    page.removeAllListeners(REQUESTFINISHED_EVENT);
    highlights.push({...hl, ...newData});
  }
  return highlights;
};

module.exports.getStories = async (page, userData) => {
  if (!page || !userData || !userData[PROFILE_KEY]) {
    return null;
  }
  const promise = getStoryFromResource(page);
  const username = userData[PROFILE_KEY]['username'];
  await page.goto(`${STORIES_URL}${username}/`);
  const stories = await promise;
  page.removeAllListeners(REQUESTFINISHED_EVENT);
  return [ stories ];
}
