module.exports.getJSONFromHTML = html => JSON.parse(
  /_sharedData = (.*);<\/script>/.exec(html)[1].replace(/\n/, '\\n')
);

module.exports.getUser = json => {
  if (!json['entry_data'] || !json['entry_data']['ProfilePage']) {
    return null;
  }
  return json['entry_data']['ProfilePage'][0]['graphql']['user'];
};

module.exports.getPost = json => {
    if (!json['entry_data'] || !json['entry_data']['PostPage']) {
      return null;
    }
    return json['entry_data']['PostPage'][0]['graphql']['shortcode_media'];
};

module.exports.parseProfile = user => ({
  id: user['id'],
  username: user['username'],
  fullname: user['full_name'],
  pictureUrl: user['profile_pic_url_hd'],
  biography: user['biography'],
  url: user['external_url'],
  followersCount: user['edge_followed_by']['count'],
  followsCount: user['edge_follow']['count'],
  postsCount: user['edge_owner_to_timeline_media']['count'],
  isPrivate: user['is_private'],
  isVerified: user['is_verified'],
  //mutual_followers
});

const parseUser = (json, nodeName) => ({
  id: json[nodeName || 'node']['id'],
  username: json[nodeName || 'node']['username'],
  //fullname: json['node']['full_name'],
});

const getMediaMeta = node => {
  const type = node['__typename'].replace('Graph', '').toLowerCase();
  return {
    id: node['id'],
    url: (type === 'video') ? node['video_url'] : node['display_url'],
    type,
    taggedUser: (
      !node['edge_media_to_tagged_user'] ? [] :
      node['edge_media_to_tagged_user']['edges'].map(edge => edge['node']['user'])
    ),
  };
};

module.exports.parsePost = (json, withDetails) => {
  const node = json['node'] || json;
  const type = node['__typename'].replace('Graph', '').toLowerCase();
  const isVideo = node['is_video'];

  const text = (
    node['edge_media_to_caption']['edges'].length > 0 ?
    node['edge_media_to_caption']['edges'][0]['node']['text'] :
    null
  );
  const medias = (
    type !== 'sidecar' ?
    [ getMediaMeta(node) ] :
    node['edge_sidecar_to_children']['edges'].map(edge => getMediaMeta(edge['node']))
  );
  const post = {
      id: node['id'],
      shortcode: node['shortcode'],
      text,
      type,
      time: node['taken_at_timestamp'],
      likeCount: node['edge_media_preview_like']['count'],
      commentCount: node['edge_media_to_comment']['count'],
      taggedUser: (
        !node['edge_media_to_tagged_user'] ? [] :
        node['edge_media_to_tagged_user']['edges'].map(edge => edge['node']['user'])
      ),
      medias,
  };
  return (withDetails ? {
    ...post,
    location: (!node['location'] ? null : {
      id: node['location']['id'],
      name: node['location']['name'],
    }),
    likes: node['edge_media_preview_like']['edges'].map(edge => parseUser(edge)),
    comments: node['edge_media_to_comment']['edges'].map(edge => ({
      id: edge['node']['id'],
      text: edge['node']['text'],
      time: edge['node']['created_at'],
      owner: parseUser(edge['node'], 'owner'),
    })),
  } : post);
};

const getFromResource = (json, secondKey, firstKey) => {
    const obj = json['data'][firstKey ? firstKey : 'user'];
    return (!obj || !obj[secondKey]) ? [] : obj[secondKey]['edges'];
};

module.exports.getPostsFromUser = user => user['edge_owner_to_timeline_media']['edges'];
module.exports.getPostsFromResource = json => getFromResource(json, 'edge_owner_to_timeline_media');
module.exports.getFollowersFromResource = json => getFromResource(json, 'edge_followed_by');
module.exports.getFollowingsFromResource = json => getFromResource(json, 'edge_follow');
module.exports.getHighlightsFromResource = json => getFromResource(json, 'edge_highlight_reels');
module.exports.getLikesFromResource = json => getFromResource(json, 'edge_liked_by', 'shortcode_media');

module.exports.parseFollows = json => parseUser(json);

module.exports.getFollowLink = (username, followersOrFollowing) => `a[href="/${username}/${
  followersOrFollowing ? 'followers' : 'following'
}/"]`;
module.exports.getLikesLink = (shortcode) => `a[href="/p/${shortcode}/liked_by/"]`;

module.exports.parseHighlight = json => ({
  id: json['node']['id'],
  title: json['node']['title'],
});

module.exports.getFollowDivSelector = () => '.j6cq2';
module.exports.getFollowDivCloseButtonSelector = () => '.ckWGn';
module.exports.getLikesDivSelector = () => '.wwxN2';
module.exports.getLikesDivCloseButtonSelector = () => '.Gzt1P';

module.exports.isHighlightResource = url => url.includes('include_highlight_reels%22%3Atrue');

const parseStoryMedia = node => {
  const type = node['__typename'].replace('GraphStory', '').toLowerCase();
  return {
    id: node['id'],
    type,
    url: (type === 'video') ? node['video_resources'][0]['src'] : node['display_url'],
    time: node['taken_at_timestamp'],
    expiringTime: node['expiring_at_timestamp'],
    owner: node['owner']['id'],
  };
};

module.exports.parseStories = json => {
  if (!json['data'] || !json['data']['reels_media']) {
    return null;
  }
  const node = json['data']['reels_media'][0];
  return {
    id: node['id'],
    owner: node['owner']['id'],
    medias: node['items'].map(s => parseStoryMedia(s)),
  };
};

module.exports.parseLike = parseUser;
