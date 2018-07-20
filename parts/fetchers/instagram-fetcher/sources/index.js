const { MongoClient } = require('mongodb');
const logger = require('./logger');
const scraper = require('./scraper');

const url = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DBNAME || 'test';
const collectionName = process.env.MONGODB_COLLECTIONNAME || 'instagram';

const username = process.env.IG_USERID;
const credentials = {
  user: process.env.IG_USERNAME,
  pass: process.env.IG_PASSWORD,
};

(() => {
  if (!username) {
    return logger.error('No username specified in env');
  }
  if (!credentials.user || !credentials.pass) {
    logger.warn('No login credentials specified in env, continu without login');
  }
  return MongoClient.connect(url, (err, client) => {
    if (err) {
      return logger.error(err);
    }
    logger.info('Connected correctly to mongodb server');
    const db = client.db(dbName);
    return scraper.getUserData({
      id: username,
      credentials,
      followers: true,
      following: true,
      highlights: true,
      stories: true,
      posts: true,
    }).then((data) => {
      db.collection(collectionName).replaceOne({ 'profile.username': username }, data, { upsert: true }, (error, r) => {
        if (error) { throw err; }
        if (!r || r.insertedCount !== 1) {
          return logger.error('Error during insertion in mongodb collection');
        }
        logger.info('Data succefully stored');
        return client.close();
      });
    }).catch(logger.error);
  });
})();
