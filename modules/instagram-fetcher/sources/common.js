module.exports.REQUESTFINISHED_EVENT = 'requestfinished';

const msleep = ms => new Promise(resolve => setTimeout(resolve, ms));

module.exports.isXHR = (res) => {
  if (!res || !res.resourceType || typeof res.resourceType !== 'function') {
    return false;
  }
  return res.resourceType() === 'xhr';
};

module.exports.isGraphQLQuery = (res) => {
  if (!res || !res.url || typeof res.url !== 'function') {
    return false;
  }
  const url = res.url();
  return (typeof url === 'string' ? url.includes('graphql/query') : false);
};

module.exports.scrollDown = async (page) => {
  if (page) {
    const PAGE_DOWN_KEY = 'PageDown';
    await page.keyboard.press(PAGE_DOWN_KEY);
    await msleep(300);
    await page.keyboard.press(PAGE_DOWN_KEY);
    await msleep(300);
    await page.keyboard.press(PAGE_DOWN_KEY);
  }
};
