#!/usr/bin/python

from pymongo import MongoClient
import os


def setUpSourceDb():
    mongo_host = os.environ.get("MONGO_HOST", "localhost")
    mongo_port = os.environ.get("MONGO_PORT", 27017)
    mongo_database = os.environ.get(
        "MONGO_TWITTER_DATABASE", "twitter_database")
    mongo_collection = os.environ.get(
        "MONGO_TWITTER_COLLECTION", "twitter_collection")
    client = MongoClient(mongo_host, mongo_port)[
        mongo_database][mongo_collection]
    return client


class TwitterAnalysis:
    def __init__(self):
        self.clientSource = self.setUpDb()
        self.clientDest = self.setUpDb("twitter_analysis")

    def setUpDb(self, collection="twitter_collection"):
        try:
            mongo_host = os.environ.get("MONGO_HOST", "localhost")
            mongo_port = os.environ.get("MONGO_PORT", 27017)
            mongo_database = os.environ.get(
                "MONGO_TWITTER_DATABASE", "twitter_database")
            mongo_collection = os.environ.get(
                "MONGO_TWITTER_COLLECTION", collection)
            client = MongoClient(mongo_host, mongo_port)[
                mongo_database][mongo_collection]
            return client
        except Exception as err:
            print("Error when connecting to source database:" + err)

        except Exception as err:
            print("Error when connecting to destination database:" + err)

    def getDataFromDb(self):
        self.data = self.clientSource.find()


if __name__ == "__main__":
    analysis = TwitterAnalysis()
    analysis.getDataFromDb()
    count = 0
    for twit in analysis.data:
        print(twit)
        count += 1
    print(count)
    # print(analysis.data)
    # print(analysis.client)
