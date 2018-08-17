const puppeteer = require('puppeteer');

const { REQUESTFINISHED_EVENT, isXHR, isGraphQLQuery, scrollDown } = require('../sources/common');

test('REQUESTFINISHED_EVENT definition', () => expect(REQUESTFINISHED_EVENT).toBeDefined());

test('isXHR undefined', () => expect(isXHR()).toBe(false));
test('isXHR not valid resource arg', () => expect(isXHR({})).toBe(false));
test('isXHR not valid resource arg', () => expect(isXHR({ resourceType: '' })).toBe(false));
test('isXHR false', () => expect(isXHR({ resourceType: () => 'media' })).toBe(false));
test('isXHR true', () => expect(isXHR({ resourceType: () => 'xhr' })).toBe(true));

test('isGraphQLQuery undefined', () => expect(isGraphQLQuery()).toBe(false));
test('isGraphQLQuery not valid resource arg', () => expect(isGraphQLQuery({})).toBe(false));
test('isGraphQLQuery not valid resource arg', () => expect(isGraphQLQuery({ url: '' })).toBe(false));
test('isGraphQLQuery not valid resource arg', () => expect(isGraphQLQuery({ url: () => {} })).toBe(false));
test('isGraphQLQuery false', () => expect(isGraphQLQuery({ url: () => 'notValid' })).toBe(false));
test('isGraphQLQuery true', () => expect(isGraphQLQuery({ url: () => 'graphql/query' })).toBe(true));


test('scrollDown undefined', () => expect(scrollDown()).resolves.toBeUndefined());
test('scrollDown ok', async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await scrollDown(page);
  await browser.close();
})
