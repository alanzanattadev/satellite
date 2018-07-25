#!/usr/bin/env python3
from functools import reduce
import satellipy.utils.cli as cli
import satellipy.configuration.spotify as SpotifyConf
import satellipy.configuration.mongo as MongoConf


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
        spotify_id = track['id']
        print(" ... => Fetching: %s - %s" % (full_artist_name, song_name))
        collection.insert_one({
            'song_artist': full_artist_name,
            'song_name': song_name,
            'user_id': username,
            'playlist_id': playlist['id'],
            'spotify_id': spotify_id
        })


if __name__ == '__main__':

    username = cli.parse_username_from_args()
    sp = SpotifyConf.get_client(SpotifyConf.parse_env())
    mongo_client = MongoConf.get_client(MongoConf.parse_env())
    collection = mongo_client['collections']['songs']

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
