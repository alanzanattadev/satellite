process.env.LOG_LEVEL = 'verbose';
const scraper = require('../sources/scraper');

const timeout = 30000;

test('getUserData undefined', () => expect(scraper.getUserData()).resolves.toBeNull());
test('getUserData undefined', () => expect(scraper.getUserData({})).resolves.toBeNull());
test('getUserData basic options', () => expect(scraper.getUserData({
  id: 'paulrosset',
})).resolves.toHaveProperty('profile.id', '273448882'), timeout);
test('getUserData basic with login options', () => expect(scraper.getUserData({
  id: 'paulrosset', credentials: { user: 'moboyafe@larjem.com', pass: 'test1234' },
})).resolves.toHaveProperty('profile.id', '273448882'), timeout);
test('getUserData full options', () => expect(scraper.getUserData({
  id: 'paulrosset', credentials: { user: 'moboyafe@larjem.com', pass: 'test1234' },
  postMeta: true, followers: true, following: true, highlights: true, stories: true, posts: true,
})).resolves.toHaveProperty('profile.id', '273448882'), timeout * 10);

test('getPostData undefined', () => expect(scraper.getPostData()).resolves.toBeNull());
test('getPostData undefined', () => expect(scraper.getPostData({})).resolves.toBeNull());
test('getPostData basic options', () => expect(scraper.getPostData({
  id: 'BZMChSuAKYT',
})).resolves.toHaveProperty('id', '1606670250999326227'), timeout);
test('getPostData with login options', () => expect(scraper.getPostData({
  id: 'BZMChSuAKYT', credentials: { user: 'moboyafe@larjem.com', pass: 'test1234' },
})).resolves.toHaveProperty('id', '1606670250999326227'), timeout);
