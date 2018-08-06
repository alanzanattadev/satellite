const parser = require('./parsing');
const { REQUESTFINISHED_EVENT, isXHR, isGraphQLQuery } = require('./common');
const logger = require('./logger');
const saveRaw = require('./raw');

const getStoryFromResource = (page, isHighLight, id) => new Promise((resolve) => {
  if (!page) {
    resolve(null);
  }
  page.on(REQUESTFINISHED_EVENT, async (res) => {
    if (isXHR(res) && isGraphQLQuery(res)) {
      page.removeAllListeners(REQUESTFINISHED_EVENT);
      const json = await res.response().json();
      saveRaw(`${isHighLight ? 'highlight' : 'story'}resource`, id, json);
      resolve(parser.parseStories(json));
    }
  });
  return setTimeout(() => resolve(null), 15000);
});

const STORIES_URL = 'https://www.instagram.com/stories/';

module.exports.getHighlights = async (page, userData) => {
  if (!page || !userData || !userData.highlights) {
    return null;
  }
  const { id, username } = userData.profile;
  logger.verbose(`Get details for ${username}'s highlights`);
  const highlights = [];
  for (let index = 0; index < userData.highlights.length; index += 1) {
    const hl = userData.highlights[index];
    const promise = getStoryFromResource(page, true, id);
    await page.goto(`${STORIES_URL}highlights/${hl.id}/`);
    const newHL = await promise;
    logger.verbose(`Details get for highlight [${index} of ${userData.highlights.length}]`);
    highlights.push({ ...hl, ...newHL });
  }
  return highlights;
};

module.exports.getStories = async (page, userData) => {
  if (!page || !userData || !userData.profile) {
    return null;
  }
  const { id, username } = userData.profile;
  logger.verbose(`Get details for ${username}'s stories`);
  const promise = getStoryFromResource(page, false, id);
  await page.goto(`${STORIES_URL}${username}/`);
  const stories = await promise;
  logger.verbose(`Get ${stories ? stories.medias.length : 0} medias for user's stories`);
  return (stories ? [stories] : null);
};
