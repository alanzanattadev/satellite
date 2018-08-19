#!/usr/bin/python

from pymongo import MongoClient
from textblob import TextBlob
from langdetect import detect
from datetime import datetime
import pandas as pd
import os
import re
import collections


class TwitterAnalysis:
    def __init__(self, ownerOfTheSetOfTweet, filterOnTwit={}):
        self.owner = ownerOfTheSetOfTweet
        self.clientSource = self.setUpDb(
            "MONGO_HOST", "MONGO_PORT", "MONGO_TWITTER_DATABASE", "twitter_collection-"+ownerOfTheSetOfTweet)
        self.clientDest = self.setUpDb(
            "MONGO_HOST_DEST", "MONGO_PORT_DEST", "MONGO_TWITTER_DATABASE_DEST", "twitter_collection_dest-"+ownerOfTheSetOfTweet)
        self.data = self.getDataFromDb(filterOnTwit)

    def setUpDb(self, host, port, db, collection):
        try:
            mongo_host = os.environ.get(host, "localhost")
            mongo_port = os.environ.get(port, 27017)
            mongo_database = os.environ.get(
                db, "twitter_database")
            client = MongoClient(mongo_host, mongo_port)[
                mongo_database][collection]
            if collection == "twitter_collection-"+self.owner and client.count() == 0:
                raise Exception(
                    "There is no data in the source database: " + collection)
            return client
        except Exception as err:
            print("Error when connecting to SOURCE database: " + str(err))
            exit(2)

    def getDataFromDb(self, filter):
        return self.clientSource.find(filter)

    def procOnEachTweet(self):
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

    def checkRelationsOnCreatorTweet(self, tweet, object):
        ownerOfTweet = tweet["owner"]
        lang = tweet["language"]
        date = tweet["publish-date"]
        if ownerOfTweet != self.owner:
            if not ownerOfTweet in object["relations"]:
                object["relations"][ownerOfTweet] = {}
                object["relations"][ownerOfTweet].update(
                    {"count": 1, "first_interac": date, "langs": [lang]})
            else:
                path = object["relations"][ownerOfTweet]
                path.update(
                    {"count": path["count"] + 1, "first_interac": min(path["first_interac"], date)})
                if not lang in path["langs"]:
                    path["langs"].append(lang)

    def checkRelationOnTagUser(self, tweet, object):
        date = tweet["publish-date"]
        lang = tweet["language"]
        for tag_user in tweet["tag_user"]:
            if tag_user != self.owner:
                if not tag_user in object["relations"]:
                    object["relations"][tag_user] = {}
                    object["relations"][tag_user].update(
                        {"count": 1, "first_interac": date, "langs": [lang]})
                else:
                    path = object["relations"][tag_user]
                    path.update(
                        {"count": path["count"] + 1, "first_interac": min(path["first_interac"], date)})
                    if not lang in path["langs"]:
                        path["langs"].append(lang)

    def checkBasic(self, tweet, object, field):
        fetchedTweet = tweet[field]
        if not fetchedTweet in object[field]:
            object[field][fetchedTweet] = 1
        else:
            object[field][fetchedTweet] = object[field][fetchedTweet] + 1

    def checkHashTags(self, tweet, object):
        for tags in tweet["hash_tags"]:
            if not tags in object["hashtags"]:
                object["hashtags"][tags] = 1
            else:
                object["hashtags"][tags] = object["hashtags"][tags] + 1

    def getTweetPerDay(self, tweet, object):
        publishDate = tweet["publish-date"].strftime("%Y-%m-%d")
        if tweet["owner"] == self.owner:
            if not publishDate in object["tweetPerDay"]:
                object["tweetPerDay"][publishDate] = 1
            else:
                object["tweetPerDay"][publishDate] = object["tweetPerDay"][publishDate] + 1

    def analysisByTime(self, setOfTweetPerDay, dataSet):
        for key, value in setOfTweetPerDay.items():
            dataSet["time"].append(key)
            dataSet["Nbtweet"].append(value)

    def createDfBasedOnTime(self, dataSet):
        df = pd.DataFrame(
            dataSet, columns=["time", "Nbtweet"])
        df['time'] = pd.to_datetime(df['time'])
        # df.index = df["time"]
        # del df["time"]
        minDate = df["time"].min()
        maxDate = df["time"].max()
        diff = maxDate - minDate
        nbTweetTotal = df["Nbtweet"].sum()
        maxTweetOnOneDay = df["Nbtweet"].max()
        return {
            "historical": {
                "firstTweet": minDate.strftime("%Y-%m-%d"),
                "lastTweet": maxDate.strftime("%Y-%m-%d"),
                "diff": str(diff.days)
            },
            "stats": {
                "TweetPerDay": float(nbTweetTotal / diff.days),
                "maxTweetOnOneDay": maxTweetOnOneDay
            }
        }

    def mapReduceOnEachTweet(self, filter={}):
        setOfTweet = self.clientDest.find(filter)
        profile = {
            "relations": {},
            "sentiment": {},
            "language": {},
            "lang": {},
            "hashtags": {},
            "tweetPerDay": {},
            "analysisDataFrame": None,
            "profileUser": self.owner
        }
        timeSet = {
            "time": [],
            "Nbtweet": []
        }
        for tweetEntry in setOfTweet:
            self.checkRelationsOnCreatorTweet(
                tweetEntry, profile)
            self.checkRelationOnTagUser(
                tweetEntry, profile)
            self.checkBasic(tweetEntry, profile, "sentiment")
            self.checkBasic(tweetEntry, profile, "language")
            self.checkHashTags(tweetEntry, profile)
            self.getTweetPerDay(tweetEntry, profile)
        self.analysisByTime(profile["tweetPerDay"], timeSet)
        df = self.createDfBasedOnTime(timeSet)
        profile["analysisDataFrame"] = df
        self.setUpDb("MONGO_HOST", "MONGO_PORT", "MONGO_TWITTER_DATABASE",
                     "twitter_collection_res-"+self.owner).insert_one(profile)
        print(
            "INFO: Global result inserted in base, at: twitter_collection_res-"+self.owner)
        return profile
