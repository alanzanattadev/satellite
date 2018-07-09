# Instagram Location Processor

Instagram location processor for the satellite project.

Fetchs intagram data from an user and stores it in a MongoDB collection.

## Usage

Build the docker image:

```
docker build -t instagram-location .
```

Then run the docker image with:

```
docker run --env IG_USERID="username" instagram-location
```

Following variable are used in environment:
- __IG_USERID__: User ID to search for.
- __MONGODB_URL__: MongoDB server's url (default: 'mongodb://localhost:27017')
- __MONGODB_DBNAME__: MongoDB database's name (default: 'test')
- __MONGODB_INPUT_COLLECTIONNAME__: MongoDB input collection's name (default: 'instagram')
- __MONGODB_OUTPUT_COLLECTIONNAME__: MongoDB output collection's name (default: 'instagram-location')
- __LOG_LEVEL__: Log level (default: 'infos')