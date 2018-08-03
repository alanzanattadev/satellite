# Twitter Analysis

### Install dependencies

`pip install ...`

- pymongo
- langdetect
- textblob
- pandas
- neo4j-driver

### Connection to mongoDB

Fill the following env variables to connect to mongoDB:

###### Source MongoDB

- `MONGO_HOST`
  - default: `localhost`
- `MONGO_PORT`
  - default: `27017`
- `MONGO_TWITTER_DATABASE`
  - default: `twitter_database`
- `MONGO_TWITTER_COLLECTION`
  - default: `twitter_collection`

###### Destination MongoDB

- `MONGO_HOST_DEST`
  - default: `localhost`
- `MONGO_PORT_DEST`
  - default: `27017`
- `MONGO_TWITTER_DATABASE_DEST`
  - default: `twitter_database`
- `MONGO_TWITTER_COLLECTION_DEST`
  - default: `twitter_analysis`

### Using Pandas

I'm using pandas as data analyser for analysis for create an intelligent relation depending on the publish date of the tweets.

### Methods

- Constructor: `TwitterAnalysis(ownerOfTheSetOfTweet, filter)`:

  - `filter`: If you want to just process an analyze on only a certain set of tweet, give a filter
  - `ownerOfTheSetOfTweet`: _Important_, give the user name of the set of tweet owner, in order to give you the most accurate data analysis.
    > At launch two databases connections will be establish (`dbSrc`, `dbDest`) thank's to connection argument given above.

- `procOnEachTweet()`: Draw a first analysis, then insert in database (`dbDest`) depending the filter when initalized
  > If the tweet is already processed and inserted in database, he will not be re-inserted again. The target/destination database will be the one given above.
- `checkRelationsOnCreatorTweet()`: Process tweets that didnt come from you, to create relation, given:
  - `tweet`: The tweet
  - `Object`: Where the data will be stored
- `checkRelationOnTagUser()`: Process user name that are present on user tags.
  - `tweet`: The tweet
  - `Object`: Where the data will be stored
- `checkSentiment()`: Draw a global analysis based on sentiment thank's to the previous generated data above (`textProcOnTweet()`)
  - `tweet`: The tweet
  - `Object`: Where the data will be stored
- `checkLanguages()`: Draw a global analysis based on language used in tweet thank's to the previous generated data above (`textProcOnTweet()`).
  - `tweet`: The tweet
  - `Object`: Where the data will be stored
- `checkHashTags()`: Draw a global analysis based on hash_tags used in tweet thank's to the previous generated data above (`textProcOnTweet()`)
  - `tweet`: The tweet
  - `Object`: Where the data will be stored
- `getTweetPerDay()`: Draw an object, where we can see the number of tweet tweeted each days.
  - `tweet`: The tweet
  - `Object`: Where the data will be stored
- `analysisByTime()`: Thank's to the data stored above, draw an object prepared for creating a dataframe for pandas
  - `setOfTweetPerDay`: Previous object of the form {"date": nbOfTweetOnThatDay}
  - `dataSet`: Where the data will be stored
- `createDfBasedOnTime()`: Create the final dataframe and load on pandas, to get a readable dataframe to process analysis on it.
  - `dataSet`: Object where data live in.
  - `df`: Then return a dataframe after processed informations related to Nbtweet per each day and date that the tweet have been emitted.
- `mapReduceOnEachTweet()`: The main loop that goes through the `dbDest` after a first processed pass on each tweet.
  - `filter`: Can give a filter as parameter to filter the `dbDest`, that are of the follwing format:
  ```json
  {
    "_id": "321296536401223682",
    "sentiment": "positive",
    "polarity": 0.375,
    "subjectivity": 0.75,
    "language": "fr",
    "hash_tags": [],
    "tag_user": ["Doigby"],
    "owner": "RossetPaul",
    "publish-date": ISODate("2013-04-08T16:20:38.000Z"),
    "interactions": 0
  }
  ```
  - `profile`: Then return the profile of the user.
    .

### Docker

Docker Image available:

- To create the image: `docker build -t twitter-analysis:1.0 ./`
- To start the container: `docker run -it [-e var=value...] twitter-analysis:1.0`

### CLI

```
usage: cli.py [-h] [-f FILTER] [-p] twitterUser

positional arguments:
  twitterUser           Twitter ID

optional arguments:
  -h, --help            show this help message and exit
  -f FILTER, --filter FILTER
                        Filter the processed tweet
  -p, --process         Draw a first analysis for each tweet, then insert in
                        database (dbDest)
```

### Neo4j

Graph Database

#### Connecting to Neo4j

Make sure to fill the following env variables:

- `NEO_URI`
  - default: `bolt://localhost:7687`
- `ǸEO_USER`
  - default: `neo4j`
- `NEO_PASS`

  - default: `neo4j`

- Delete all detected languages that are present only one time, to avoid biased data.

Available class: `GraphDB`
