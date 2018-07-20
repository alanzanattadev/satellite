#!/usr/bin/python

from pymongo import MongoClient
from textblob import TextBlob
import os


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


if __name__ == "__main__":
    analysis = TwitterAnalysis()
    count = 0
    for twit in analysis.data:
        print(twit)
        count += 1
    print(count)
    # print(analysis.data)
    # print(analysis.client)
