# Happn Location Processor

Happn location processor for the satellite project.

Fetchs happn location data from 'near you' notidication and put them in Neo4j

## Usage

Build the docker image:

```
docker build -t happn-location .
```

Then run the docker image with:

```
docker run --env HAPPN_TOKEN="token" happn
```

Following variable are used in environment:
- __HAPPN_TOKEN__: Token to access Happn account
- __NEO4J_URL__: Neo4j server's url (default: 'bolt://localhost')
- __NEO4J_USER__: Neo4j authentication user name (default: 'neo4j')
- __NEO4J_PASS__: Neo4j authentication password (default: 'neo4j')
- __HAPPN_ID__: Specify target happn id (no filtering by default)


To get Happn access token, go to https://www.facebook.com/dialog/oauth?client_id=247294518656661&redirect_uri=https://www.happn.fr&scope=basic_info&response_type=token, you will be redirect to a page like https://www.happn.com/en/#access_token=XXXXX&expires_in=5183805 and you can see the token in query params.