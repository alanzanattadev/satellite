const puppeteer = require('puppeteer');
process.env.LOG_LEVEL = 'verbose';

const { login } = require('../sources/login');
const userFetcher = require('../sources/user');
const postsFetcher = require('../sources/posts');
const storiesFetcher = require('../sources/stories');

let page = null;
let browser = null;

const credentials = { user: 'moboyafe@larjem.com', pass: 'test1234' };
const timeout = 30000;

beforeAll(async () => {
  browser = await puppeteer.launch({ headless: true });
  page = await browser.newPage();
  return await login(page, credentials.user, credentials.pass);
}, timeout);

afterAll(async () => await browser.close(), 5000);

test('User getData undefined', () => expect(userFetcher.getData(undefined, {})).resolves.toBeNull());
test('User getData bad username', () => expect(userFetcher.getData(page, { id: 'badusernam' })).resolves.toBeNull(), timeout);
test('User getData good username', () => expect(userFetcher.getData(page, { id: 'goodusername' })).resolves.toHaveProperty('profile.id', '2317895834'), timeout);
test('User getData good username', () => expect(userFetcher.getData(page, {
  id: 'paulrosset', followers: true, following: true, posts: true, highlights: true,
})).resolves.toHaveProperty('profile.id', "273448882"), timeout);
test('User getData good private username', () => expect(userFetcher.getData(page, {
  id: 'goodusername', followers: true, following: true, posts: true, highlights: true,
})).resolves.toHaveProperty('profile.id', "2317895834"), timeout);

test('Post getDataFromPost undefined', () => expect(postsFetcher.getDataFromPost()).resolves.toBeNull());
test('Post getDataFromPosts undefined', () => expect(postsFetcher.getDataFromPosts()).resolves.toBeNull());
test('Post getDataFromPost bad code', () => expect(postsFetcher.getDataFromPost(page, 'badcode')).resolves.toBeNull(), timeout);
test('Post getDataFromPost good code', () => expect(postsFetcher.getDataFromPost(page, 'BZMChSuAKYT')).resolves.toHaveProperty('id', '1606670250999326227'), timeout);
test('Post getDataFromPosts undefined', () => expect(postsFetcher.getDataFromPosts(page, {})).resolves.toBeNull());
test('Post getDataFromPosts good', () => expect(postsFetcher.getDataFromPosts(page, { posts: [{ shortcode: 'BZMChSuAKYT' }] })).resolves.toHaveLength(1), timeout);

test('Story getStories undefined', () => expect(storiesFetcher.getStories()).resolves.toBeNull());
test('Story getStories undefined', () => expect(storiesFetcher.getStories(page, {})).resolves.toBeNull());
test('Story getStories bad username', () => expect(storiesFetcher.getStories(page, { profile: { username: 'badusernam' } })).resolves.toBeNull(), timeout);
test('Story getStories good username', () => expect(storiesFetcher.getStories(page, { profile: { username: 'paulrosset' } })).resolves.toBeDefined(), timeout);

test('Story getHighlights undefined', () => expect(storiesFetcher.getHighlights()).resolves.toBeNull());
test('Story getHighlights undefined', () => expect(storiesFetcher.getHighlights(page, {})).resolves.toBeNull());
test('Story getHighlights bad id', () => expect(storiesFetcher.getHighlights(page, { highlights: [{ id: 'badid' }] })).resolves.toEqual([{ id: 'badid' }]), timeout);
test('Story getHighlights good id', () => expect(storiesFetcher.getHighlights(page, { highlights: [{ id: '17928324475022580' }, { id: '17923126783015357' }] })).resolves.toBeDefined(), timeout);
