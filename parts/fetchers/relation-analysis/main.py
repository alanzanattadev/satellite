#!/usr/bin/python

from pymongo import MongoClient
from textblob import TextBlob
from langdetect import detect
from datetime import datetime
import functools
import os
import re
import operator
from collections import OrderedDict


class TwitterAnalysis:
    def __init__(self, filterOnTwit={}):
        self.clientSource = self.setUpDb(
            "MONGO_HOST", "MONGO_PORT", "MONGO_TWITTER_DATABASE", "MONGO_TWITTER_COLLECTION")
        self.clientDest = self.setUpDb(
            "MONGO_HOST_DEST", "MONGO_PORT_DEST", "MONGO_TWITTER_DATABASE_DEST", "MONGO_TWITTER_COLLECTION_DEST", "twitter_analysis")
        self.data = self.getDataFromDb(filterOnTwit)

    def setUpDb(self, host, port, db, collection, dev="twitter_collection"):
        try:
            mongo_host = os.environ.get(host, "localhost")
            mongo_port = os.environ.get(port, 27017)
            mongo_database = os.environ.get(
                db, "twitter_database")
            mongo_collection = os.environ.get(
                collection, dev)
            client = MongoClient(mongo_host, mongo_port)[
                mongo_database][mongo_collection]
            return client
        except Exception as err:
            print("Error when connecting to SOURCE database: " + err)

    def getDataFromDb(self, filter):
        return self.clientSource.find(filter)

    def textProcOnTweet(self):
        count = 0
        for tweet in self.data:
            try:
                procText = TextBlob(self.cleaningTweet(tweet["text"]))
                polarity = procText.sentiment.polarity
                post = {
                    "_id": tweet["_id"],
                    "sentiment": "positive" if polarity >= 0.1 else "negative" if polarity <= -0.1 else "neutral",
                    "polarity": float(polarity),
                    "subjectivity": float(procText.sentiment.subjectivity),
                    "language": detect(tweet["text"]),
                    "hash_tags": re.findall(r"#(\w+)", tweet["text"]),
                    "tag_user": re.findall(r"@(\w+)", tweet["text"]),
                    "owner": tweet["user"],
                    "publish-date": tweet["timestamp"],
                    "interactions": int(tweet["likes"]) + int(tweet["replies"]) + int(tweet["retweets"])
                }
                self.clientDest.replace_one(
                    {"_id": tweet["_id"]}, post, upsert=True)
                count += 1
                print("INFO:" + str(count) +
                      "th Tweet Analysed inserted in database.")
            except Exception as err:
                print("Cannot insert analysed tweet in database cause: " + str(err))

    def cleaningTweet(self, tweet):
        tweet = re.sub(
            r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\(\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', '', tweet)
        tweet = re.sub(r'\bthats\b', 'that is', tweet)
        tweet = re.sub(r'\bive\b', 'i have', tweet)
        tweet = re.sub(r'\bim\b', 'i am', tweet)
        tweet = re.sub(r'\bya\b', 'yeah', tweet)
        tweet = re.sub(r'\bcant\b', 'can not', tweet)
        tweet = re.sub(r'\bwont\b', 'will not', tweet)
        tweet = re.sub(r'\bid\b', 'i would', tweet)
        tweet = re.sub(r'wtf', 'what the fuck', tweet)
        tweet = re.sub(r'\bwth\b', 'what the hell', tweet)
        tweet = re.sub(r'\br\b', 'are', tweet)
        tweet = re.sub(r'\bu\b', 'you', tweet)
        tweet = re.sub(r'\bk\b', 'OK', tweet)
        tweet = re.sub(r'\bsux\b', 'sucks', tweet)
        tweet = re.sub(r'\bno+\b', 'no', tweet)
        tweet = re.sub(r'\bcoo+\b', 'cool', tweet)
        return tweet

    def setProfile(self, entryProcessed, x):
        profile = {
            "neutral": lambda x: x + 1,
            "positive": lambda x: x + 1,
            "negative": lambda x: x + 1,
        }
        return profile[entryProcessed](x)

    def checkRelationsOnCreatorTweet(self, tweet, object, ownerOfTheSetOfTweet):
        ownerOfTweet = tweet["owner"]
        if ownerOfTweet != ownerOfTheSetOfTweet:
            if not ownerOfTweet in object["relations"]:
                object["relations"][ownerOfTweet] = 1
            else:
                object["relations"][ownerOfTweet] = object["relations"][ownerOfTweet] + 1

    def checkRelationOnTagUser(self, tweet, object, ownerOfTheSetOfTweet):
        for tag_user in tweet["tag_user"]:
            if tag_user != ownerOfTheSetOfTweet:
                if not tag_user in object["relations"]:
                    object["relations"][tag_user] = 1
                else:
                    object["relations"][tag_user] = object["relations"][tag_user] + 1

    def mapReduceOnEachTweet(self, ownerOfTheSetOfTweet, filter={}):
        setOfTweet = self.clientDest.find(filter)
        profile = {
            "relations": {}
        }
        for tweetEntry in setOfTweet:
            self.checkRelationsOnCreatorTweet(
                tweetEntry, profile, ownerOfTheSetOfTweet)
            self.checkRelationOnTagUser(
                tweetEntry, profile, ownerOfTheSetOfTweet)
        profile["relations"] = dict((x, y) for x, y in sorted(
            profile["relations"].items(), key=lambda x: x[1], reverse=True))  # Relations with people
        print(profile)


if __name__ == "__main__":
    analysis = TwitterAnalysis()
    analysis.mapReduceOnEachTweet("RossetPaul")
    # analysis.textProcOnTweet()

    # print(analysis.data)
    # print(analysis.client)
