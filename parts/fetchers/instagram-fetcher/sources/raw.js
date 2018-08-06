const fs = require('fs');
const logger = require('./logger');

module.exports = (source, id, json) => {
  if (!process.env.SAVE_RAW_JSON) {
    return false;
  }
  const folder = './raws';
  return fs.mkdir(folder, (folderErr) => {
    if (folderErr && folderErr.code !== 'EEXIST') {
      return logger.warn(`Error during writing raw json folder '${folder}': ${folderErr.code}`);
    }
    const file = `${folder}/${source}_${id}_${new Date().toISOString()}.json`;
    return fs.writeFile(file, JSON.stringify(json), (fileErr) => {
      if (fileErr) {
        logger.warn(`Error during writing raw json file '${file}': ${fileErr.code}`);
      }
    });
  });
};
