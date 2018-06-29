module.exports.REQUESTFINISHED_EVENT = 'requestfinished';

const msleep = ms => new Promise(resolve => setTimeout(resolve, ms));
module.exports.isXHR = res => res.resourceType() === 'xhr';
module.exports.isGraphQLQuery = res => res.url().includes('graphql/query');

module.exports.scrollDown = async (page) => {
  const PAGE_DOWN_KEY = 'PageDown';
  await page.keyboard.press(PAGE_DOWN_KEY);
  await msleep(300);
  await page.keyboard.press(PAGE_DOWN_KEY);
  await msleep(300);
  await page.keyboard.press(PAGE_DOWN_KEY);
};
