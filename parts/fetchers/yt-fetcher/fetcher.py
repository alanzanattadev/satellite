#!/usr/bin/python

import requests
import json
import pymongo


class YTFetcher:
    def __init__(self, apiKey, ytUsername):
        self.apiKey = apiKey
        self.ytUsername = ytUsername

    def getChannelID(self):
        try:
            payload = {"key": self.apiKey,
                       "forUsername": self.ytUsername, "part": "id"}
            r = requests.get(
                "https://www.googleapis.com/youtube/v3/channels", params=payload)
            if r.status_code == 200:
                self.channelID = json.loads(r.content)["items"][0]["id"]
                print "ChannelID of " + self.ytUsername + ": " + self.channelID
            else:
                raise Exception("Error while fetching channelID")
        except Exception as err:
            print err

    def subToChannel(self, maxResultsPerPage=10):
        try:
            isNextPage = True
            pageNb = 0
            payload = {"key": self.apiKey, "channelId": self.channelID,
                       "part": "snippet", "maxResults": maxResultsPerPage}
            while isNextPage:
                r = requests.get(
                    "https://www.googleapis.com/youtube/v3/subscriptions", params=payload)
                if r.status_code == 200:
                    pageNb += 1
                    if "nextPageToken" in json.loads(r.content):
                        nextPageToken = json.loads(r.content)["nextPageToken"]
                        payload["pageToken"] = nextPageToken
                    else:
                        isNextPage = False
                    print "Fetched subscriptions page: " + str(pageNb)
                else:
                    raise Exception(
                        "Error while fetching subscriptions, do not forget to call getChannelId() before!")
        except Exception as err:
            print err


fetch = YTFetcher("AIzaSyCvJT0slEo5IYSbeEd1UeJJVw9vO3vlMLc", "XTRSilent")
fetch.getChannelID()
fetch.subToChannel()
