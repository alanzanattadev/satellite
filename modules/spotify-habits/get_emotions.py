#!/usr/bin/env python3
import satellipy.utils.cli as CliUtils
import satellipy.configuration.mongo as MongoConf
import satellipy.emotions.musics as Emotions

if __name__ == '__main__':
    username = CliUtils.parse_username_from_args()
    mongo_client = MongoConf.get_client(MongoConf.parse_env())
    songs_collection = mongo_client['collections']['songs']
    emotions_collection = mongo_client['collections']['emotions']
    lyrics_collection = mongo_client['collections']['lyrics']

    Emotions.fetch_emotions_for_user(username, songs_collection, lyrics_collection, emotions_collection)
