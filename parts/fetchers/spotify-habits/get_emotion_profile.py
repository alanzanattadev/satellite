#!/usr/bin/env python3
import sys
import os
from pymongo import MongoClient

if __name__ == '__main__':
    # Params parsing
    if len(sys.argv) > 1:
        username = sys.argv[1]
        print("Username: ", username)
    else:
        print("Enter username, you can get it by sharing from the mobile app")
        print("usage: python main.py [username]")
        sys.exit()

    # Mongo connection
    mongo_host = os.environ.get('MONGO_HOST', "localhost")
    mongo_port = os.environ.get('MONGO_PORT', 27017)
    mongo_client = MongoClient(mongo_host, mongo_port)
    mongo_database_name = os.environ.get('MONGO_DATABASE', 'spotify-habits')
    db = mongo_client[mongo_database_name]
    mongo_emotions_collection_name = os.environ.get(
        'MONGO_EMOTIONS_COLLECTION',
        'emotions'
    )
    emotions_collection = db[mongo_emotions_collection_name]
    mongo_audio_features_collection_name = os.environ.get(
        'MONGO_AUDIO_FEATURES_COLLECTION',
        'audio_features'
    )
    audio_features_collection = db[mongo_audio_features_collection_name]

    # Compute profile
    anger = {'type': 'anger', 'count': emotions_collection.find({'user_id': username, 'emotions.type': "anger"}).count()}
    surprise = {'type': 'surprise', 'count': emotions_collection.find({'user_id': username, 'emotions.type': "surprise"}).count()}
    fear = {'type': 'fear', 'count': emotions_collection.find({'user_id': username, 'emotions.type': "fear"}).count()}
    disgust = {'type': 'disgust', 'count': emotions_collection.find({'user_id': username, 'emotions.type': "disgust"}).count()}
    joy = {'type': 'joy', 'count': emotions_collection.find({'user_id': username, 'emotions.type': "joy"}).count()}
    sadness = {'type': 'sadness', 'count': emotions_collection.find({'user_id': username, 'emotions.type': "sadness"}).count()}

    emotions = [anger, surprise, fear, disgust, joy, sadness]
    emotions.sort(key=lambda a: a['count'], reverse=True)
    for emotion in emotions:
        print("%s: %d" % (emotion['type'].title(), emotion['count']))
