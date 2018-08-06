const parser = require('../sources/parsing');

const loc = {id: 'id', name: 'name', lat: 'lat', lng: 'lng' };
const hl = { id: 'id', title: 'title' };
const user = { id: 'id', username: 'username' };

test('getJSONFromHTML undefined', () => expect(parser.getJSONFromHTML()).toBeNull());
test('getJSONFromHTML ok', () => expect(parser.getJSONFromHTML('_sharedData = {"test": "test"};<\/script>')).toEqual({test: "test"}));

test('getUser undefined', () => expect(parser.getUser()).toBeNull());
test('getUser bad arg', () => expect(parser.getUser({})).toBeNull());
test('getUser bad arg', () => expect(parser.getUser({ entry_data: {} })).toBeNull());
test('getUser valid arg', () => expect(parser.getUser({ entry_data: { ProfilePage: [{ graphql: { user: 'value' } }]} })).toBe('value'));

test('getPost undefined', () => expect(parser.getPost()).toBeNull());
test('getPost bad arg', () => expect(parser.getPost({})).toBeNull());
test('getPost bad arg', () => expect(parser.getPost({ entry_data: {} })).toBeNull());
test('getPost valid arg', () => expect(parser.getPost({ entry_data: { PostPage: [{ graphql: { shortcode_media: 'value' } }]} })).toBe('value'));

test('getLocation undefined', () => expect(parser.getLocation()).toBeNull());
test('getLocation bad arg', () => expect(parser.getLocation({})).toBeNull());
test('getLocation bad arg', () => expect(parser.getLocation({ entry_data: {} })).toBeNull());
test('getLocation valid arg', () => expect(parser.getLocation({ entry_data: { LocationsPage: [{ graphql: { location: 'value' } }]} })).toBe('value'));

test('parseLocation undefined', () => expect(parser.parseLocation()).toBeNull());
test('parseLocation valid arg', () => expect(parser.parseLocation(loc)).toEqual(loc));

test('parseProfile undefined', () => expect(parser.parseProfile()).toBeNull());
test('parseProfile empty obj', () => expect(parser.parseProfile({})).toBeDefined());
test('parseProfile valid arg', () => expect(parser.parseProfile({
  id: 'id', username: 'username', full_name: 'full_name', profile_pic_url_hd: 'profile_pic_url_hd',
  biography: 'biography', external_url: 'external_url', edge_followed_by: { count: 1 },
  edge_follow: { count: 1 }, edge_owner_to_timeline_media: { count: 1 },
  is_private: true, is_verified: true,
})).toEqual({
    id: 'id', username: 'username', fullname: 'full_name', pictureUrl: 'profile_pic_url_hd',
    biography: 'biography', url: 'external_url', followersCount: 1, followsCount: 1,
    postsCount: 1, isPrivate: true, isVerified: true,
}));

test('parsePost undefined', () => expect(parser.parsePost()).toBeNull());
test('parsePost bad arg', () => expect(parser.parsePost({})).toBeNull());
test('parsePost bad arg', () => expect(parser.parsePost({ node: {} })).toBeNull());
test('parsePost bad arg', () => expect(parser.parsePost({ node: { __typename: 'GraphImage' } })).toBeDefined());
test('parsePost without details valid arg', () => expect(parser.parsePost({
  __typename: 'GraphImage', id: 'id', shortcode: 'shortcode', edge_media_to_caption: { edges: [{ node: { text: 'title' } }] },
  taken_at_timestamp: 'time', edge_media_preview_like: { count: 10 }, edge_media_to_comment: { count: 20 },
  edge_media_to_tagged_user: { edges: [{ node: { user: 'user' } }] }, display_url: 'url',
})).toEqual({
  id: 'id', shortcode: 'shortcode', text: 'title', type: 'image',
  time: 'time', likeCount: 10, commentCount: 20, taggedUser: ['user'],
  medias: [{ id: 'id', url: 'url', type: 'image', taggedUser: ['user'] }],
}));

test('parsePost without details valid arg', () => expect(parser.parsePost({
  __typename: 'GraphImage', id: 'id', shortcode: 'shortcode', edge_media_to_caption: { edges: [{ node: { text: 'title' } }] },
  taken_at_timestamp: 'time', edge_media_preview_like: { count: 10, edges: [{ node: user }] },
  edge_media_to_comment: { count: 20, edges: [{ node: { id: 'id', text: 'text', created_at: 'time', owner: user } }] },
  edge_media_to_tagged_user: { edges: [{ node: { user } }] }, display_url: 'url', location: loc,

}, true)).toEqual({
  id: 'id', shortcode: 'shortcode', text: 'title', type: 'image',
  time: 'time', likeCount: 10, commentCount: 20, taggedUser: [user],
  medias: [{ id: 'id', url: 'url', type: 'image', taggedUser: [user] }],
  location: { id: loc.id, name: loc.name }, likes: [user],
  comments: [{ id: 'id', text: 'text', time: 'time', owner: user }],
}));

test('getPostsFromUser undefined', () => expect(parser.getPostsFromUser()).toBeNull());
test('getPostsFromUser bad arg', () => expect(parser.getPostsFromUser({})).toBeNull());
test('getPostsFromUser bad arg', () => expect(parser.getPostsFromUser({ edge_owner_to_timeline_media: {} })).toBeUndefined());
test('getPostsFromUser valid arg', () => expect(parser.getPostsFromUser({ edge_owner_to_timeline_media: { edges: 'value' } })).toBe('value'));

test('getPostsFromResource undefined', () => expect(parser.getPostsFromResource()).toBeNull());
test('getPostsFromResource bad arg', () => expect(parser.getPostsFromResource({})).toBeNull());
test('getPostsFromResource bad arg', () => expect(parser.getPostsFromResource({ data: {} })).toBeNull());
test('getPostsFromResource bad arg', () => expect(parser.getPostsFromResource({ data: { user: {} } })).toBeNull());
test('getPostsFromResource bad arg', () => expect(parser.getPostsFromResource({ data: { user: { edge_owner_to_timeline_media: {} } } })).toBeNull());
test('getPostsFromResource valid arg', () => expect(parser.getPostsFromResource({ data: { user: { edge_owner_to_timeline_media: { edges: 'value' } } } })).toBe('value'));

test('getFollowersFromResource undefined', () => expect(parser.getFollowersFromResource()).toBeNull());
test('getFollowersFromResource bad arg', () => expect(parser.getFollowersFromResource({})).toBeNull());
test('getFollowersFromResource bad arg', () => expect(parser.getFollowersFromResource({ data: {} })).toBeNull());
test('getFollowersFromResource bad arg', () => expect(parser.getFollowersFromResource({ data: { user: {} } })).toBeNull());
test('getFollowersFromResource bad arg', () => expect(parser.getFollowersFromResource({ data: { user: { edge_followed_by: {} } } })).toBeNull());
test('getFollowersFromResource valid arg', () => expect(parser.getFollowersFromResource({ data: { user: { edge_followed_by: { edges: 'value' } } } })).toBe('value'));

test('getFollowingsFromResource undefined', () => expect(parser.getFollowingsFromResource()).toBeNull());
test('getFollowingsFromResource bad arg', () => expect(parser.getFollowingsFromResource({})).toBeNull());
test('getFollowingsFromResource bad arg', () => expect(parser.getFollowingsFromResource({ data: {} })).toBeNull());
test('getFollowingsFromResource bad arg', () => expect(parser.getFollowingsFromResource({ data: { user: {} } })).toBeNull());
test('getFollowingsFromResource bad arg', () => expect(parser.getFollowingsFromResource({ data: { user: { edge_follow: {} } } })).toBeNull());
test('getFollowingsFromResource valid arg', () => expect(parser.getFollowingsFromResource({ data: { user: { edge_follow: { edges: 'value' } } } })).toBe('value'));

test('getHighlightsFromResource undefined', () => expect(parser.getHighlightsFromResource()).toBeNull());
test('getHighlightsFromResource bad arg', () => expect(parser.getHighlightsFromResource({})).toBeNull());
test('getHighlightsFromResource bad arg', () => expect(parser.getHighlightsFromResource({ data: {} })).toBeNull());
test('getHighlightsFromResource bad arg', () => expect(parser.getHighlightsFromResource({ data: { user: {} } })).toBeNull());
test('getHighlightsFromResource bad arg', () => expect(parser.getHighlightsFromResource({ data: { user: { edge_highlight_reels: {} } } })).toBeNull());
test('getHighlightsFromResource valid arg', () => expect(parser.getHighlightsFromResource({ data: { user: { edge_highlight_reels: { edges: 'value' } } } })).toBe('value'));

test('getLikesFromResource undefined', () => expect(parser.getLikesFromResource()).toBeNull());
test('getLikesFromResource bad arg', () => expect(parser.getLikesFromResource({})).toBeNull());
test('getLikesFromResource bad arg', () => expect(parser.getLikesFromResource({ data: {} })).toBeNull());
test('getLikesFromResource bad arg', () => expect(parser.getLikesFromResource({ data: { shortcode_media: {} } })).toBeNull());
test('getLikesFromResource bad arg', () => expect(parser.getLikesFromResource({ data: { shortcode_media: { edge_liked_by: {} } } })).toBeNull());
test('getLikesFromResource valid arg', () => expect(parser.getLikesFromResource({ data: { shortcode_media: { edge_liked_by: { edges: 'value' } } } })).toBe('value'));

test('getCommentsFromResource undefined', () => expect(parser.getCommentsFromResource()).toBeNull());
test('getCommentsFromResource bad arg', () => expect(parser.getCommentsFromResource({})).toBeNull());
test('getCommentsFromResource bad arg', () => expect(parser.getCommentsFromResource({ data: {} })).toBeNull());
test('getCommentsFromResource bad arg', () => expect(parser.getCommentsFromResource({ data: { shortcode_media: {} } })).toBeNull());
test('getCommentsFromResource bad arg', () => expect(parser.getCommentsFromResource({ data: { shortcode_media: { edge_media_to_comment: {} } } })).toBeNull());
test('getCommentsFromResource valid arg', () => expect(parser.getCommentsFromResource({ data: { shortcode_media: { edge_media_to_comment: { edges: 'value' } } } })).toBe('value'));

test('parseFollows undefined', () => expect(parser.parseFollows()).toBeNull());
test('parseFollows bad arg', () => expect(parser.parseFollows({})).toBeNull());
test('parseFollows valid arg', () => expect(parser.parseFollows({ node: user })).toEqual(user));

test('getFollowLink undefined', () => expect(parser.getFollowLink()).toBeDefined());
test('getFollowLink valid arg', () => expect(parser.getFollowLink('username', true)).toEqual(expect.stringMatching(/.*username.*followers.*/)));

test('getLikesLink undefined', () => expect(parser.getLikesLink()).toBeDefined());
test('getLikesLink valid arg', () => expect(parser.getLikesLink('shortcode')).toEqual(expect.stringMatching(/.*shortcode.*/)));

test('getCommentsLink valid', () => expect(parser.getCommentsLink()).toBeDefined());

test('parseHighlight undefined', () => expect(parser.parseHighlight()).toBeNull());
test('parseHighlight bad arg', () => expect(parser.parseHighlight({})).toBeNull());
test('parseHighlight valid arg', () => expect(parser.parseHighlight({ node: hl })).toEqual(hl));

test('getFollowDivSelector valid', () => expect(parser.getFollowDivSelector()).toBeDefined());
test('getFollowDivCloseButtonSelector valid', () => expect(parser.getFollowDivCloseButtonSelector()).toBeDefined());
test('getLikesDivSelector valid', () => expect(parser.getLikesDivSelector()).toBeDefined());
test('getLikesDivCloseButtonSelector valid', () => expect(parser.getLikesDivCloseButtonSelector()).toBeDefined());

test('isHighlightResource undefined', () => expect(parser.isHighlightResource()).toEqual(false));
test('isHighlightResource bad arg', () => expect(parser.isHighlightResource({})).toEqual(false));
test('isHighlightResource false', () => expect(parser.isHighlightResource('badvalue')).toEqual(false));
test('isHighlightResource true', () => expect(parser.isHighlightResource('goodvalue_include_highlight_reels%22%3Atrue')).toEqual(true));

test('parseStories undefined', () => expect(parser.parseStories()).toBeNull());
test('parseStories bad arg', () => expect(parser.parseStories({})).toBeNull());
test('parseStories bad arg', () => expect(parser.parseStories({ data: {} })).toBeNull());
test('parseStories bad arg', () => expect(parser.parseStories({ data: { reels_media: [] } })).toBeNull());
test('parseStories bad arg', () => expect(parser.parseStories({ data: { reels_media: [{}] } })).toBeNull());
test('parseStories bad arg', () => expect(parser.parseStories({ data: { reels_media: [{}] } })).toBeNull());
test('parseStories bad arg', () => expect(parser.parseStories({ data: { reels_media: [{ owner: '', items: [{}] }] } })).toBeNull());
test('parseStories valid arg', () => expect(parser.parseStories({ data: { reels_media: [{ id: 'id', owner: { id: 'id4' }, items: [{
  id: 'id2', __typename: 'GraphStoryImage', display_url: 'url', taken_at_timestamp: 'time', expiring_at_timestamp: 'expiringTime', owner: { id: 'id3' }
}] }] } })).toEqual({
  id: 'id', owner: 'id4', medias: [{
    id: 'id2', type: 'image', url: 'url',
    time: 'time', expiringTime: 'expiringTime', owner: 'id3',
  }],
}));

test('parseLike undefined', () => expect(parser.parseLike()).toBeNull());
test('parseLike bad arg', () => expect(parser.parseLike({}, 'user')).toBeNull());
test('parseLike valid arg', () => expect(parser.parseLike({ user }, 'user')).toEqual(user));


test('parseComment undefined', () => expect(parser.parseComment()).toBeNull());
test('parseComment bad arg', () => expect(parser.parseComment({})).toBeNull());
test('parseComment bad arg', () => expect(parser.parseComment({ node: {} })).toBeNull());
test('parseComment valid arg', () => expect(parser.parseComment({
  node: { id: 'id', text: 'text', created_at: 'time', owner: user },
})).toEqual({
  id: 'id', text: 'text', time: 'time', owner: user
}));

test('isMorePostsResources undefined', () => expect(parser.isMorePostsResources()).toBe(true));
test('isMorePostsResources bad arg', () => expect(parser.isMorePostsResources({})).toBe(true));
test('isMorePostsResources bad arg', () => expect(parser.isMorePostsResources({ data: {} })).toBe(true));
test('isMorePostsResources bad arg', () => expect(parser.isMorePostsResources({ data: { user: {} } })).toBe(true));
test('isMorePostsResources bad arg', () => expect(parser.isMorePostsResources({ data: { user: { edge_owner_to_timeline_media: {} } } })).toBe(true));
test('isMorePostsResources valid arg', () => expect(parser.isMorePostsResources({ data: { user: { edge_owner_to_timeline_media: { page_info: {} } } } })).toBe(true));
test('isMorePostsResources valid arg', () => expect(parser.isMorePostsResources({ data: { user: { edge_owner_to_timeline_media: { page_info: { has_next_page: false } } } } })).toBe(false));

test('isMoreFollowersResources undefined', () => expect(parser.isMoreFollowersResources()).toBe(true));
test('isMoreFollowersResources bad arg', () => expect(parser.isMoreFollowersResources({})).toBe(true));
test('isMoreFollowersResources bad arg', () => expect(parser.isMoreFollowersResources({ data: {} })).toBe(true));
test('isMoreFollowersResources bad arg', () => expect(parser.isMoreFollowersResources({ data: { user: {} } })).toBe(true));
test('isMoreFollowersResources bad arg', () => expect(parser.isMoreFollowersResources({ data: { user: { edge_followed_by: {} } } })).toBe(true));
test('isMoreFollowersResources valid arg', () => expect(parser.isMoreFollowersResources({ data: { user: { edge_followed_by: { page_info: {} } } } })).toBe(true));
test('isMoreFollowersResources valid arg', () => expect(parser.isMoreFollowersResources({ data: { user: { edge_followed_by: { page_info: { has_next_page: false } } } } })).toBe(false));

test('isMoreFollowingsResources undefined', () => expect(parser.isMoreFollowingsResources()).toBe(true));
test('isMoreFollowingsResources bad arg', () => expect(parser.isMoreFollowingsResources({})).toBe(true));
test('isMoreFollowingsResources bad arg', () => expect(parser.isMoreFollowingsResources({ data: {} })).toBe(true));
test('isMoreFollowingsResources bad arg', () => expect(parser.isMoreFollowingsResources({ data: { user: {} } })).toBe(true));
test('isMoreFollowingsResources bad arg', () => expect(parser.isMoreFollowingsResources({ data: { user: { edge_follow: {} } } })).toBe(true));
test('isMoreFollowingsResources valid arg', () => expect(parser.isMoreFollowingsResources({ data: { user: { edge_follow: { page_info: {} } } } })).toBe(true));
test('isMoreFollowingsResources valid arg', () => expect(parser.isMoreFollowingsResources({ data: { user: { edge_follow: { page_info: { has_next_page: false } } } } })).toBe(false));

test('isMoreCommentsResources undefined', () => expect(parser.isMoreCommentsResources()).toBe(true));
test('isMoreCommentsResources bad arg', () => expect(parser.isMoreCommentsResources({})).toBe(true));
test('isMoreCommentsResources bad arg', () => expect(parser.isMoreCommentsResources({ data: {} })).toBe(true));
test('isMoreCommentsResources bad arg', () => expect(parser.isMoreCommentsResources({ data: { shortcode_media: {} } })).toBe(true));
test('isMoreCommentsResources bad arg', () => expect(parser.isMoreCommentsResources({ data: { shortcode_media: { edge_media_to_comment: {} } } })).toBe(true));
test('isMoreCommentsResources valid arg', () => expect(parser.isMoreCommentsResources({ data: { shortcode_media: { edge_media_to_comment: { page_info: {} } } } })).toBe(true));
test('isMoreCommentsResources valid arg', () => expect(parser.isMoreCommentsResources({ data: { shortcode_media: { edge_media_to_comment: { page_info: { has_next_page: false } } } } })).toBe(false));

test('isMoreLikesResources undefined', () => expect(parser.isMoreLikesResources()).toBe(true));
test('isMoreLikesResources bad arg', () => expect(parser.isMoreLikesResources({})).toBe(true));
test('isMoreLikesResources bad arg', () => expect(parser.isMoreLikesResources({ data: {} })).toBe(true));
test('isMoreLikesResources bad arg', () => expect(parser.isMoreLikesResources({ data: { shortcode_media: {} } })).toBe(true));
test('isMoreLikesResources bad arg', () => expect(parser.isMoreLikesResources({ data: { shortcode_media: { edge_liked_by: {} } } })).toBe(true));
test('isMoreLikesResources valid arg', () => expect(parser.isMoreLikesResources({ data: { shortcode_media: { edge_liked_by: { page_info: {} } } } })).toBe(true));
test('isMoreLikesResources valid arg', () => expect(parser.isMoreLikesResources({ data: { shortcode_media: { edge_liked_by: { page_info: { has_next_page: false } } } } })).toBe(false));
