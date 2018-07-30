#!/usr/bin/env python3
import time
import satellipy.configuration.mongo as MongoConf
import satellipy.configuration.spotify as SpotifyConf
import satellipy.spotify.habits as Habits
import satellipy.spotify.audio as Audio
import satellipy.lyrics.fetch as Lyrics
import satellipy.emotions.musics as Emotions
import satellipy.personalities as Personalities


if __name__ == "__main__":
    mongo_client = MongoConf.get_client(MongoConf.parse_env())
    sp = SpotifyConf.get_client(SpotifyConf.parse_env())

    personalities_collection = mongo_client['collections']['personalities']
    songs_collection = mongo_client['collections']['songs']
    lyrics_collection = mongo_client['collections']['lyrics']
    emotions_collection = mongo_client['collections']['emotions']
    audio_features_collection = mongo_client['collections']['audio_features']
    print("Getting training set")
    cursor = personalities_collection.find({ 'predicted': False, 'processed': False })
    for doc in cursor:
        user_id = doc['user_id']
        print("--------- For user %s -----------" % (user_id))
        print("=========== Getting habits")
        Habits.fetch_and_save_playlists(user_id, sp, songs_collection)
        print("=========== Getting lyrics")
        Lyrics.fetch_lyrics(user_id, songs_collection, lyrics_collection)
        print("=========== Getting emotions")
        Emotions.fetch_emotions_for_user(user_id, songs_collection, lyrics_collection, emotions_collection)
        print("=========== Getting audio features")
        Audio.fetch_audio_features(sp, user_id, songs_collection, audio_features_collection)
        print("----------------------------------")
        Personalities.set_user_as_fetched(user_id, personalities_collection)
        print("Sleeping 60s ...")
        time.sleep(60)
