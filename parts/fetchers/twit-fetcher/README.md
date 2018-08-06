# Twitter fetcher

Using an existing (Tweeter Python Scraper)[https://github.com/taspinar/twitterscraper]

### Install dependencies

- pymongo (`pip install pymongo`)
- twitterscraper (`pip install twitterscraper`)

### CLI Tweeter Scraper

```bash
usage: main.py [-h] [-l LIMIT] twitterUser

positional arguments:
  twitterUser           Twitter ID

optional arguments:
  -h, --help            show this help message and exit
  -l LIMIT, --limit LIMIT
                        Limit of tweet that have to be scraped, tweet are
                        retrieved in batches of 20, default: 20
```

### Connection to mongoDB

Fill the following env variables to connect to mongoDB:

- `MONGO_HOST`
  - default: `localhost`
- `MONGO_PORT`
  - default: `27017`
- `MONGO_TWITTER_DATABASE`
  - default: `twitter_database`
- `MONGO_TWITTER_COLLECTION`
  - default: `twitter_collection`
