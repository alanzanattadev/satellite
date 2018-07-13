#!/usr/bin/env python3
import sys
import os
import json
from pymongo import MongoClient
import http.client
import urllib.parse
import collections

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
    mongo_lyrics_collection_name = os.environ.get(
        'MONGO_LYRICS_COLLECTION',
        'lyrics'
    )
    lyrics_collection = db[mongo_lyrics_collection_name]

    # Emotion API Connection
    emotion_host = os.environ.get('EMOTION_HOST', 'localhost')
    emotion_port = os.environ.get('EMOTION_PORT', 5000)

    # Get emotions for each lyrics
    conn = http.client.HTTPConnection(emotion_host, emotion_port)
    emotions_collection.delete_many({'user_id': username})
    cursor = lyrics_collection.find({'user_id': username})
    for doc in cursor:
        lyrics = doc['lyrics']
        params = urllib.parse.urlencode({
            'algo': "hashTagClassification",
            'i': lyrics,
            'estimator': 'LinearSVC'
        })
        conn.request("GET", "/api/?" + params)
        response = conn.getresponse()
        data = response.read()
        content = json.loads(data)
        emotions = []
        for entry in content['entries']:
            for emotion in entry['emotions']:
                if isinstance(
                    emotion['onyx:hasEmotion'],
                    collections.Sequence
                ):
                    for hasEmotion in emotion['onyx:hasEmotion']:
                        if 'onyx:hasEmotionCategory' in hasEmotion.keys():
                            emotions.append({
                                'type': hasEmotion['onyx:hasEmotionCategory'],
                                'intensity': hasEmotion.get(
                                    'onyx:hasEmotionIntensity',
                                    -1
                                ),
                                'song_name': doc['song_name'],
                                'song_artist': doc['song_artist'],
                            })
        emotions_collection.insert_one(
            {'user_id': username, 'emotions': emotions}
        )
    conn.close()
