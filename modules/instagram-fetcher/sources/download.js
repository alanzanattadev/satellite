const https = require('https');
const fs = require('fs');

const logger = require('./logger');

const PROFILE_PIC_FILENAME = 'profile_picture.jpg';
const EXTENSIONS = {
  video: 'mp4',
  image: 'jpg',
};

const saveFile = (url, filename, folder) => new Promise((resolve, reject) => {
  if (!url || !filename || !folder) {
    return reject();
  }
  const file = fs.createWriteStream(`${folder}${filename}`);
  return https.get(url, (response) => {
    response.pipe(file);
    response.on('end', resolve);
    response.on('error', reject);
  });
});

const saveMedias = (folder, item) => Promise.all(item.medias.map((media) => {
  const filename = `${media.id}.${EXTENSIONS[media.type]}`;
  return new Promise(resolve => saveFile(media.url, filename, folder)
    .then(() => resolve(logger.verbose(`Successfuly download media ${filename}`)))
    .catch(() => resolve(logger.warn(`Failed to download media ${filename}`))));
}));

const saveMediasFromKey = async (data, folder, key) => {
  if (!data || !key || !data[key] || !folder) {
    return null;
  }
  logger.info(`Save medias for user ${key} (${data[key].length} items)`);
  try {
    fs.mkdirSync(`${folder}${key}`);
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
  for (let index = 0; index < data[key].length; index += 1) {
    const value = data[key][index];

    logger.verbose(`Save ${value.medias.length} medias for ${key} ${value.id} \
(${(parseInt(index, 10) + 1)} / ${data[key].length})`);

    await saveMedias(`${folder}${key}/`, value);
  }
  return null;
};

module.exports.saveMediasAt = async (isUser, data, folder) => {
  if (!isUser) {
    logger.verbose(`Save medias for post ${data.id}`);
    await saveMedias(folder, data);
    return null;
  }
  try {
    await saveFile(data.profile.pictureUrl, PROFILE_PIC_FILENAME, folder);
    logger.verbose('Successfuly download profile picture media');
  } catch (err) {
    logger.warn('Failed to download profile picture media');
  }
  await saveMediasFromKey(data, folder, 'posts');
  await saveMediasFromKey(data, folder, 'highlights');
  await saveMediasFromKey(data, folder, 'stories');
  return null;
};
