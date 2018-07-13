#!/usr/bin/env python3
import sys
import os
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
from pymongo import MongoClient
from functools import reduce


def fetch_and_save_playlist(tracks, collection, username):
    for i, item in enumerate(tracks['items']):
        track = item['track']
        artists = track['artists']
        song_name = track['name']
        full_artist_name = reduce(
            (lambda name, artist: name + artist['name']),
            artists,
            ""
        )
        print(" ... => Fetching: %s - %s" % (full_artist_name, song_name))
        collection.insert_one({
            'song_artist': full_artist_name,
            'song_name': song_name,
            'user_id': username,
            'playlist_id': playlist['id']
        })


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
    mongo_collection_name = os.environ.get(
        'MONGO_COLLECTION',
        'playlisted-songs'
    )
    collection = db[mongo_collection_name]

    # Token selection
    if token != "":
        print("Using user token")
        sp = spotipy.Spotify(auth=token)
    else:
        print("Can't get spotify token, using default")
        sp = spotipy.Spotify(
            client_credentials_manager=client_credentials_manager
        )

    # Collection cleaning
    print("Cleaning collection for user")
    collection.delete_many({'user_id': username})

    # Playlist fetching
    playlists = sp.user_playlists(username)
    for playlist in playlists['items']:
        if playlist['owner']['id'] == username:
            print("=> Fetching playlist: %s" % (playlist['name']))
            results = sp.user_playlist(
                username,
                playlist['id'],
                fields="tracks,next"
            )
            tracks = results['tracks']
            print(" ... => Getting page")
            fetch_and_save_playlist(tracks, collection, username)
            while tracks['next']:
                tracks = sp.next(tracks)
                fetch_and_save_playlist(tracks, collection, username)
