#!/usr/bin/env python3
import sys
import os
import http.client
import json
from pymongo import MongoClient
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials

if __name__ == '__main__':

    # Params parsing
    if len(sys.argv) > 1:
        username = sys.argv[1]
        print("Username: ", username)
    else:
        print("Enter username, you can get it by sharing from the mobile app")
        print("usage: python main.py [username]")
        sys.exit()

    # Spotify token initialization
    token = os.environ.get('SPOTIFY_TOKEN', "")
    client_credentials_manager = SpotifyClientCredentials()

    # Mongo connection
    mongo_host = os.environ.get('MONGO_HOST', "localhost")
    mongo_port = os.environ.get('MONGO_PORT', 27017)
    mongo_client = MongoClient(mongo_host, mongo_port)
    mongo_database_name = os.environ.get('MONGO_DATABASE', 'spotify-habits')
    db = mongo_client[mongo_database_name]
    mongo_songs_collection_name = os.environ.get(
        'MONGO_SONGS_COLLECTION',
        'playlisted-songs'
    )
    songs_collection = db[mongo_songs_collection_name]
    mongo_audio_features_collection_name = os.environ.get(
        'MONGO_AUDIO_FEATURES_COLLECTION',
        'audio-features'
    )
    audio_features_collection = db[mongo_audio_features_collection_name]

    # Token selection
    if token != "":
        print("Using user token")
        sp = spotipy.Spotify(auth=token)
    else:
        print("Can't get spotify token, using default")
        sp = spotipy.Spotify(
            client_credentials_manager=client_credentials_manager
        )

    # Audio features fetching
    cursor = songs_collection.find({'user_id': username})
    for doc in cursor:
        artist = doc['song_artist']
        name = doc['song_name']
        id = doc['spotify_id']
        # Clean collection to avoid duplicata
        audio_features_collection.delete_many({
            'song_artist': artist,
            'song_name': name
        })
        # Fetch audio_features
        print("=> Fetching audio features of: %s - %s" % (artist, name))
        try:
            features = sp.audio_features(tracks=[id])
            audio_features = features[0]
            print("... Audio features Found !")
            audio_features_collection.insert_one({
                'song_name': name,
                'song_artist': artist,
                'user_id': username,
                'spotify_id': id,
                'audio_features': audio_features
            })
        except:
            print("Error .")
