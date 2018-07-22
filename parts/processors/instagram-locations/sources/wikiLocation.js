const rp = require('request-promise');
const cheerio = require('cheerio');

const BASE_URL = 'https://en.wikipedia.org/wiki/';
const GEO_SELECTOR = '#coordinates .geo';
const GEO_SEPARATOR = '; ';
const WORDS_SEPARATOR = /[\s,#]+/;

const getLocation = async location => new Promise((resolve) => {
  const url = `${BASE_URL}${location}`;
  return rp({ url }).then((html) => {
    const $ = cheerio.load(html);
    const coordArray = $(GEO_SELECTOR).text().split(GEO_SEPARATOR);
    return resolve(coordArray.length !== 2 ? null : {
      name: location,
      lat: coordArray[0],
      lng: coordArray[1],
    });
  }).catch(() => resolve(null));
});

const analyseText = text => new Promise((resolve, reject) => {
  if (!text) {
    resolve([]);
  }
  const words = text.split(WORDS_SEPARATOR);
  Promise.all(words.map(word => getLocation(word)))
    .then(data => resolve(data.filter(elem => elem !== null)))
    .catch(reject);
});

module.exports.getLocationFromWord = getLocation;
module.exports.getLocationFromText = analyseText;
