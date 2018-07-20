# Twitter Analysis

### Install dependencies

- pymongo (`pip install pymongo`)

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
