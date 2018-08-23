#!/usr/bin/python

import argparse
from main import TwitterAnalysis
from utils import fromInt64ToInt
from graph import GraphDB
import json


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("twitterUser", type=str, help="Twitter ID")
    parser.add_argument("-f", "--filter", type=str,
                        help="Filter the processed tweet", default={})
    parser.add_argument("-p", "--process", action="store_true",
                        help="Draw a first analysis for each tweet, then insert in database (dbDest)")
    parser.add_argument("-g", "--graph", action="store_true",
                        help="Insert in a Neo4j graph Database the relation for twitter")
    args = parser.parse_args()
    analysis = TwitterAnalysis(
        args.twitterUser, args.filter if args.filter else {})
    if args.process:
        analysis.procOnEachTweet()
    dataProfile = analysis.mapReduceOnEachTweet()
    if args.graph and dataProfile:
        graph = GraphDB(dataProfile)
        graph.fetchNodesRelatedProfile()
    print(json.dumps(dataProfile, default=fromInt64ToInt))


if __name__ == "__main__":
    main()
