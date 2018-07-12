# Twitter fetcher

Using an existing (Tweeter Python Scraper)[https://github.com/taspinar/twitterscraper]

### Install dependencies

- pymongo (`pip install pymongo`)
- twitterscraper (`pip install twitterscraper`)

### CLI Tweeter Scraper

```bash
usage: main.py [-h] [-l LIMIT] [-u URL] [-d DATABASE] [-c COLLECTION]
               twitterUser

positional arguments:
  twitterUser           Twitter ID

optional arguments:
  -h, --help            show this help message and exit
  -l LIMIT, --limit LIMIT
                        Limit of tweet that have to be scraped, tweet are
                        retrieved in batches of 20, default: 20
  -u URL, --url URL     Url of the connection mongoDB, default:
                        mongodb://localhost:27017/
  -d DATABASE, --database DATABASE
                        Name of the database to put the information in it,
                        default: twitter_database
  -c COLLECTION, --collection COLLECTION
                        Name of the collection to put the information in it,
                        default: twitter_collection
```
