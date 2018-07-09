#!/usr/bin/python

import requests
import json
import pymongo
from utils import insertOne


class YTFetcher():
    def __init__(self, apiKey, ytUsername):
        self.apiKey = apiKey
        self.ytUsername = ytUsername
        self.channelID = None
        self.client = pymongo.MongoClient(
            "localhost", 27017)  # Mettre variable d'env
        self.db = self.client["test-ytFetcher"]
        self.subscription = self.db["subscriptions"]
        self.playlists = self.db["playlists"]

    def getChannelID(self):
        try:
            payload = {"key": self.apiKey,
                       "forUsername": self.ytUsername, "part": "id"}
            r = requests.get(
                "https://www.googleapis.com/youtube/v3/channels", params=payload)
            data = json.loads(r.content)
            if r.status_code == 200 and len(data["items"]) != 0:
                self.channelID = data["items"][0]["id"]
                print "ChannelID of " + self.ytUsername + ": " + self.channelID
            else:
                raise Exception(
                    "Error while fetching channelID, you may not need to get your channelID")
        except Exception as err:
            print err

    def fetcher(self, typeFetching, collectionDep, maxResultsPerPage=10):
        try:
            isNextPage = True
            pageNb = 0
            itemsNb = 0
            payload = {"key": self.apiKey, "channelId": self.channelID if self.channelID is not None else self.ytUsername,
                       "part": "snippet", "maxResults": maxResultsPerPage}
            while isNextPage:
                r = requests.get(
                    "https://www.googleapis.com/youtube/v3/" + typeFetching, params=payload)
                data = json.loads(r.content)
                if r.status_code == 200:
                    pageNb += 1
                    if "nextPageToken" in data:
                        nextPageToken = data["nextPageToken"]
                        payload["pageToken"] = nextPageToken
                    else:
                        isNextPage = False
                    for item in data["items"]:
                        insertOne(item["snippet"], collectionDep)
                        itemsNb += 1
                        print "Entry added " + str(itemsNb)
                    print "Fetched page: " + str(pageNb)
                else:
                    raise Exception(
                        "Error while fetching, if you have a custom channelId make sure to call getChannelId() method!")
        except Exception as err:
            print err

    def fetcherPlaylistMusic(self, collectionDep, maxResultsPerPage=10):


fetch = YTFetcher("AIzaSyCvJT0slEo5IYSbeEd1UeJJVw9vO3vlMLc",
                  "XTRSilent")
fetch.getChannelID()
fetch.fetcher("playlists", fetch.playlists, 5)
