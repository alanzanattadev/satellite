#!/usr/bin/python

import argparse
from main import TwitterAnalysis


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("twitterUser", type=str, help="Twitter ID")
    parser.add_argument("-f", "--filter", type=str,
                        help="Filter the processed tweet", default={})
    parser.add_argument("-p", "--process", action="store_true",
                        help="Draw a first analysis for each tweet, then insert in database (dbDest)")
    args = parser.parse_args()
    analysis = TwitterAnalysis(
        args.twitterUser, args.filter if args.filter else {})
    if args.process:
        analysis.procOnEachTweet()
    dataProfile = analysis.mapReduceOnEachTweet()
    print(dataProfile)


if __name__ == "__main__":
    main()
