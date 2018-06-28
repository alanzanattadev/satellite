const { MongoClient } = require('mongodb');
const scraper = require('./scraper');

const url = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DBNAME || 'test';
const collectionName = process.env.MONGODB_COLLECTIONNAME || 'instagram';

const username = process.argv[2] || 'paulrosset';
const credentials = {
  user: process.env.IG_USERNAME || 'moboyafe@larjem.com',
  pass: process.env.IG_PASSWORD || 'test1234',
};

MongoClient.connect(url, (err, client) => {
  if (err) { throw err; }
  console.log('Connected correctly to server');
  const db = client.db(dbName);

  scraper.getUserData({
    id: username,
    credentials,
    followers: true,
    following: true,
    highlights: true,
    stories: true,
    posts: true,
  }).then((data) => {
    db.collection(collectionName).insertOne(data, (error, r) => {
      if (error) { throw err; }
      if (!r || r.insertedCount !== 1) {
        return console.log('Error: not inserted');
      }
      console.log('Successfuly inserted');
      return client.close();
    });
  }).catch(console.error);
});
