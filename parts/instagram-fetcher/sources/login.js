const LOGIN_PAGE_URL = 'https://www.instagram.com/accounts/login/';

const USERNAME_SELECTOR = 'input[name="username"]';
const PASSWORD_SELECTOR = 'input[name="password"]';
const LOGIN_BUTTON_SELECTOR = 'button._5f5mN';

const waitOptions = { waitUntil: 'networkidle0' };
const typeOptions = { delay: 50 };

module.exports.login = async (page, username, password) => {
  if (!page || !username, !password) {
    return;
  }
  console.log(`Login with the user '${username}'`);
  await page.goto(LOGIN_PAGE_URL, waitOptions);
  const frame = await page.mainFrame();
  await frame.type(USERNAME_SELECTOR, username, typeOptions);
  await frame.type(PASSWORD_SELECTOR, password, typeOptions);
  await frame.click(LOGIN_BUTTON_SELECTOR);
  await page.waitForNavigation(waitOptions);
};
