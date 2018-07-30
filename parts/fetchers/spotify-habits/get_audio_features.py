#!/usr/bin/env python3
import satellipy.utils.cli as cli
import satellipy.configuration.spotify as SpotifyConf
import satellipy.configuration.mongo as MongoConf
import satellipy.spotify.audio as Audio

if __name__ == '__main__':

    username = cli.parse_username_from_args()
    sp = SpotifyConf.get_client(SpotifyConf.parse_env())
    mongo = MongoConf.get_client(MongoConf.parse_env())
    songs_collection = mongo['collections']['songs']
    audio_features_collection = mongo['collections']['audio_features']

    Audio.fetch_audio_features(sp, username, songs_collection, audio_features_collection)
