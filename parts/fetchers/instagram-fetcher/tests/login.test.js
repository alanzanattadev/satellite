const puppeteer = require('puppeteer');

const { login } = require('../sources/login');

const testLogin = async (user, pass) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const res = await login(page, user, pass);
  await browser.close();
  return res;
};

test('login undefined args', () => expect(login()).resolves.toBe(false));
test('login bad page', () => expect(login({}, 'user', 'pass')).resolves.toBe(false));
test('login bad credentials', () => expect(testLogin('user', 'pass')).resolves.toBe(false), 30000);
test('login good credentials', () => expect(testLogin('moboyafe@larjem.com', 'test1234')).resolves.toBe(true), 30000);
