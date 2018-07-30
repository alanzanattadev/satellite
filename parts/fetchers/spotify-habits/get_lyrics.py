#!/usr/bin/env python3
import satellipy.utils.cli as CliUtils
import satellipy.configuration.mongo as MongoConf
import satellipy.lyrics.fetch as Lyrics

if __name__ == '__main__':

    username = CliUtils.parse_username_from_args()
    mongo_client = MongoConf.get_client(MongoConf.parse_env())
    # Mongo connection
    songs_collection = mongo_client['collections']['songs']
    lyrics_collection = mongo_client['collections']['lyrics']

    Lyrics.fetch_lyrics(username, songs_collection, lyrics_collection)
