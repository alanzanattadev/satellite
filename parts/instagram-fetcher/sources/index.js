const MongoClient = require('mongodb').MongoClient;
const scraper = require('./scraper');

const url = 'mongodb://172.16.39.139:27017';
const dbName = 'instagram';

const username = 'paulrosset';
const credentials = {
  user: 'moboyafe@larjem.com',
  pass: 'test1234',
};

MongoClient.connect(url, (err, client) => {
  if (err) { throw err }
  console.log("Connected correctly to server");
  const db = client.db(dbName);

  scraper.getUserData({
    id: username,
    credentials,
    //followers: true,
    //following: true,
    //highlights: true,
    //stories: true,
    //posts: true,
  }).then(data => {
    db.collection('inserts').insertOne(data, (err, r) => {

      if (err) { throw err }
      if (!r || r.insertedCount !== 1) {
        return console.log("Error: not inserted");
      }
      console.log("Successfuly inserted");
      client.close();
    });
  }).catch(console.error);
});
