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
- __MONGODB_COLLECTIONNAME__: MongoDB input collection's name (default: 'instagram')
- __NEO4J_URL__: Neo4j server's url (default: 'bolt://localhost')
- __NEO4J_USER__: Neo4j authentication user name (default: 'neo4j')
- __NEO4J_PASS__: Neo4j authentication password (default: 'neo4j')
- __LOG_LEVEL__: Log level (default: 'debug')