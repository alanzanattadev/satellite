const logger = require('./logger');

const LOGIN_PAGE_URL = 'https://www.instagram.com/accounts/login/';

const USERNAME_SELECTOR = 'input[name="username"]';
const PASSWORD_SELECTOR = 'input[name="password"]';
const LOGIN_BUTTON_SELECTOR = 'button._5f5mN';

const waitOptions = { waitUntil: 'networkidle0', timeout: 5000 };
const typeOptions = { delay: 80 };

module.exports.login = async (page, username, password) => {
  if (!page || !username || !password) {
    return false;
  }
  logger.info(`Login with the user '${username}'`);
  try {
    await page.goto(LOGIN_PAGE_URL, waitOptions);
    const frame = await page.mainFrame();
    await frame.type(USERNAME_SELECTOR, username, typeOptions);
    await frame.type(PASSWORD_SELECTOR, password, typeOptions);
    await frame.click(LOGIN_BUTTON_SELECTOR);
    await page.waitForNavigation(waitOptions);
    logger.verbose('Successfully logged in');
    return true;
  } catch (err) {
    logger.warn(`Failed to login with user '${username}'`);
  }
  return false;
};
