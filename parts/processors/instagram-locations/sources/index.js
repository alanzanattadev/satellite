const { MongoClient } = require('mongodb');
const logger = require('./logger');
const { getLocationFromText } = require('./wikiLocation');

const url = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DBNAME || 'test';
const inputCollectionName = process.env.MONGODB_INPUT_COLLECTIONNAME || 'instagram';
const outputCollectionName = process.env.MONGODB_OUTPUT_COLLECTIONNAME || 'instagram-location';
const username = process.env.IG_USERID;

const findInput = db => new Promise((resolve, reject) => db
  .collection(inputCollectionName)
  .findOne({ 'profile.username': username }, (err, data) => (err ? reject(err) : resolve(data))));

const insertOutput = (db, json) => new Promise((resolve, reject) => db
  .collection(outputCollectionName)
  .insertOne(json, (err, data) => (err ? reject(err) : resolve(data.insertedCount === 1))));

(() => {
  if (!username) {
    return logger.error('No username specified in env');
  }
  return MongoClient.connect(url, async (err, client) => {
    if (err) {
      return logger.error(err);
    }
    logger.info('Connected correctly to mongodb server');
    const db = client.db(dbName);

    try {
      const json = await findInput(db);
      if (json && json.posts && json.posts.length > 0) {
        logger.info(`Start guessing location for ${json.posts.length} posts`);
        const array = await Promise.all(json.posts.map(async (e) => {
          const possibleLocations = await getLocationFromText(e.text);
          return { ...e, possibleLocations };
        }));
        const res = await insertOutput(db, { ...json, posts: array });
        if (!res) {
          logger.error('Error during insertion in mongodb collection');
        } else {
          logger.info('Data succefully stored');
        }
      } else {
        logger.warn('There is no posts to analyse..');
      }
    } catch (error) {
      logger.error(error);
    }
    return client.close();
  });
})();
