#!/usr/bin/env python3
import sys
import os
import lyricwikia
import http.client
import json
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
    conn = http.client.HTTPSConnection("api.lyrics.ovh")
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
        try:
            lyrics = lyricwikia.get_lyrics(artist, name)
            print("... Lyrics Found !")
            lyrics_collection.insert_one({
                'song_name': name,
                'song_artist': artist,
                'user_id': username,
                'lyrics': lyrics
            })
        except:
            print("... Not found, trying on lyrics.ovh")
            conn = http.client.HTTPConnection("api.lyrics.ovh")
            try:
                conn.request("GET", "/v1/%s/%s" % (artist, name))
                response = conn.getresponse()
                if response.code == 200:
                    data = response.read()
                    content = json.loads(data)
                    lyrics = content['lyrics']
                    print("... Lyrics Found !")
                    lyrics_collection.insert_one({
                        'song_name': name,
                        'song_artist': artist,
                        'user_id': username,
                        'lyrics': lyrics
                    })
                else:
                    print("... Not found")
            except:
                print("... Not english")

    # Clean network
    conn.close()
    # Clean database
    lyrics_collection.delete_many({'lyrics': {'$regex': 'ERROR:.*'}})
