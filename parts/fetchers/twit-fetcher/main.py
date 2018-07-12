#!/usr/bin/python
# -*- coding: utf-8 -*-

from twitterscraper import query_tweets
import json
from pymongo import MongoClient
import argparse


def fetch(opts):
    tweets = []
    for tweet in query_tweets(opts["twitterUser"], opts["limit"]):
        post = {
            "fullname": tweet.fullname.encode('ascii', 'ignore').decode('ascii'),
            "likes": tweet.likes,
            "replies": tweet.replies,
            "retweets": tweet.retweets,
            "text": tweet.text.encode('ascii', 'ignore').decode('ascii'),
            "timestamp": tweet.timestamp,
            "user": tweet.user
        }
        post_id = opts["mongoClient"].insert_one(post).inserted_id
        tweets.append(post)
        print("INFO: Tweet " + str(post_id) + " inserted in database.")
    return tweets


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("twitterUser", type=str, help="Twitter ID")
    parser.add_argument("-l", "--limit", type=int,
                        help="Limit of tweet that have to be scraped, tweet are retrieved in batches of 20, default: 20", default=20)
    parser.add_argument("-u", "--url", type=str,
                        help="Url of the connection mongoDB, default: mongodb://localhost:27017/", default="mongodb://localhost:27017/")
    parser.add_argument("-d", "--database", type=str,
                        help="Name of the database to put the information in it, default: twitter_database", default="twitter_database")
    parser.add_argument("-c", "--collection", type=str,
                        help="Name of the collection to put the information in it, default: twitter_collection", default="twitter_collection")
    args = parser.parse_args()
    client = MongoClient(args.url)[args.database][args.collection]
    fetch({
        "twitterUser": args.twitterUser,
        "limit": args.limit,
        "mongoClient": client
    })  # Possibly return the collection of tweet in python format readable


if __name__ == "__main__":
    main()
