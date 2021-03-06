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

### Dockerize Application

Available images: Alpine Python3.6.6

- Create the images:
  - `docker build -t twitter-scrapper:1.0 ./`
- Run the container:
  - `docker run -it -e [var=value...] --network="host" twitter-scrapper:1.0` (`--network`, option available to share the network with the host)
