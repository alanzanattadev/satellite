#!/usr/bin/env python3
import satellipy.utils.cli as cli
import satellipy.configuration.spotify as SpotifyConf
import satellipy.configuration.mongo as MongoConf
import satellipy.spotify.habits as Habits

if __name__ == '__main__':

    username = cli.parse_username_from_args()
    sp = SpotifyConf.get_client(SpotifyConf.parse_env())
    mongo_client = MongoConf.get_client(MongoConf.parse_env())
    collection = mongo_client['collections']['songs']

    Habits.fetch_and_save_playlists(username, sp, collection)
