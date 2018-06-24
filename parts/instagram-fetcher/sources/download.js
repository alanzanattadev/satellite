const https = require('https');
const fs = require('fs');

const PROFILE_PIC_FILENAME = 'profile_picture.jpg';
const EXTENSIONS = {
  video: 'mp4',
  image: 'jpg',
};

const saveFile = (url, filename, folder) => {
  if (!url || !filename || !folder) {
    return;
  }
  const file = fs.createWriteStream(`${folder}${filename}`);
  https.get(url, (response) => {
    response.pipe(file);
    console.log(`Media ${filename} saved in ${folder} folder`);
  });
}

const saveMedias = (data, folder, key) => {
  if (!data || !key || !data[key] || !folder) {
    return;
  }
  try {
    fs.mkdirSync(`${folder}${key}`);
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
  for (index in data[key]) {
    const medias = data[key][index]['medias'];
    for (mediaIndex in medias) {
      const media = medias[mediaIndex];
      saveFile(media['url'], `${media['id']}.${EXTENSIONS[media.type]}`, `${folder}${key}/`);
    }
  }
};

module.exports.saveMediasAt = (data, folder) => {
  saveFile(data['profile']['pictureUrl'], PROFILE_PIC_FILENAME, folder);
  saveMedias(data, folder, 'posts');
  saveMedias(data, folder, 'highlights');
  saveMedias(data, folder, 'stories');
};
