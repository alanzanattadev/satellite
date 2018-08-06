import os
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials


def parse_env():
    # Spotify token initialization
    token = os.environ.get('SPOTIFY_TOKEN', "")
    return {
        'token': token
    }


def get_client(configuration):
    client_credentials_manager = SpotifyClientCredentials()
    token = configuration['token']
    # Token selection
    if token != "":
        print("Using user token")
        sp = spotipy.Spotify(auth=token)
    else:
        print("Can't get spotify token, using default")
        sp = spotipy.Spotify(
            client_credentials_manager=client_credentials_manager
        )
    return sp
