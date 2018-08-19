#!/usr/bin/python
# -*- coding: utf-8 -*-

from twitterscraper import query_tweets
import json
from pymongo import MongoClient
import argparse
import os


def fetch(opts):
    tweets = []
    count = 0
    for tweet in query_tweets(opts["twitterUser"], opts["limit"]):
        post = {
            "_id": tweet.id,
            "fullname": tweet.fullname.encode("UTF-8", "ignore").decode(),
            "likes": tweet.likes,
            "replies": tweet.replies,
            "retweets": tweet.retweets,
            "text": tweet.text.encode("UTF-8", 'ignore').decode(),
            "timestamp": tweet.timestamp,
            "user": tweet.user
        }
        opts["mongoClient"].replace_one(
            {"_id": tweet.id}, post, upsert=True)
        tweets.append(post)
        count += 1
        print("INFO: [" + str(count) + "] Tweet inserted in database.")
    return tweets


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("twitterUser", type=str, help="Twitter ID")
    parser.add_argument("-l", "--limit", type=int,
                        help="Limit of tweet that have to be scraped, tweet are retrieved in batches of 20, default: 20", default=20)
    args = parser.parse_args()
    mongo_host = os.environ.get("MONGO_HOST", "localhost")
    mongo_port = os.environ.get("MONGO_PORT", 27017)
    mongo_database = os.environ.get(
        "MONGO_TWITTER_DATABASE", "twitter_database")
    mongo_collection = "twitter_collection-" + args.twitterUser
    client = MongoClient(mongo_host, mongo_port)[
        mongo_database][mongo_collection]
    fetch({
        "twitterUser": args.twitterUser,
        "limit": args.limit,
        "mongoClient": client
    })  # Possibly return the collection of tweet in python format readable
    print("Number of tweets inserted in " +
          mongo_collection + ": " + str(client.count()))


if __name__ == "__main__":
    main()
