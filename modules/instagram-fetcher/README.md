# Instagram Scrap

Instagram scraper for the satellite project.

Fetchs intagram data from an user and stores it in a MongoDB collection.

## Usage

Build the docker image:

```
docker build -t instagram-fetcher .
```

Then run the docker image with:

```
docker run --env IG_USERID="username" instagram-fetcher
```

Following variable are used in environment:
- __IG_USERID__: User ID to search for.
- __IG_USERNAME__, __IG_PASSWORD__: Credentials for the account used to scrap.
- __MONGODB_URL__: MongoDB server's url (default: 'mongodb://localhost:27017')
- __MONGODB_DBNAME__: MongoDB database's name (default: 'test')
- __MONGODB_COLLECTIONNAME__: MongoDB collection's name (default: 'instagram')
- __LOG_LEVEL__: Log level (default: 'infos')