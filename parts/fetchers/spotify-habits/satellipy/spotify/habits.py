from functools import reduce

def fetch_and_save_playlist(tracks, collection, username, playlist):
    for i, item in enumerate(tracks['items']):
        track = item['track']
        artists = track['artists']
        song_name = track['name']
        full_artist_name = reduce(
            (lambda name, artist: name + ("" if name == "" else " ") + artist['name']),
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


def fetch_and_save_playlists(username, sp, collection):
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
            fetch_and_save_playlist(tracks, collection, username, playlist)
            while tracks['next']:
                tracks = sp.next(tracks)
                fetch_and_save_playlist(tracks, collection, username, playlist)
