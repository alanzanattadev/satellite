#!/usr/bin/env python3
import sys
import os
import subprocess
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
    mongo_songs_collection_name = os.environ.get(
        'MONGO_SONGS_COLLECTION',
        'playlisted-songs'
    )
    songs_collection = db[mongo_songs_collection_name]
    mongo_lyrics_collection_name = os.environ.get(
        'MONGO_LYRICS_COLLECTION',
        'lyrics'
    )
    lyrics_collection = db[mongo_lyrics_collection_name]

    # Lyrics fetching
    cursor = songs_collection.find({'user_id': username})
    for doc in cursor:
        artist = doc['song_artist']
        name = doc['song_name']
        # Clean collection to avoid duplicata
        lyrics_collection.delete_many({
            'song_artist': artist,
            'song_name': name
        })
        # Fetch lyrics
        print("=> Fetching lyrics of: %s - %s" % (artist, name))
        completed_process = subprocess.Popen(
            ["lyrics", artist, name],
            stdout=subprocess.PIPE
        )
        output = completed_process.communicate()[0].decode(
            'utf-8',
            errors='ignore'
        )
        if "ERROR: Cannot download lyrics" not in output:
            print("... Lyrics Found !")
            lyrics = output
            # Save lyrics
            lyrics_collection.insert_one({
                'song_name': name,
                'song_artist': artist,
                'user_id': username,
                'lyrics': lyrics
            })
        else:
            print("... Not found")

    # Clean database
    lyrics_collection.delete_many({'lyrics': {'$regex': 'ERROR:.*'}})
