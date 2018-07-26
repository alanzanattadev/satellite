const { MongoClient } = require('mongodb');
const logger = require('./logger');
const insertOutput = require('./neo4j');

const url = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DBNAME || 'test';
const inputCollectionName = process.env.MONGODB_COLLECTIONNAME || 'instagram';
const username = process.env.IG_USERID;


const findInput = db => new Promise((resolve, reject) => db
  .collection(inputCollectionName)
  .findOne({ 'profile.username': username }, (err, data) => (err ? reject(err) : resolve(data))));

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
      if (json && json.followers && json.following) {
        logger.debug('Insert relation in neo4j');
        const res = await insertOutput({ json });
        if (!res) {
          logger.error('Error during insertion in neo4j');
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
