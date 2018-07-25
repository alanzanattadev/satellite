#!/usr/bin/env python3
import satellipy.utils.cli as cli
import satellipy.configuration.spotify as SpotifyConf
import satellipy.configuration.mongo as MongoConf

if __name__ == '__main__':

    username = cli.parse_username_from_args()
    sp = SpotifyConf.get_client(SpotifyConf.parse_env())
    mongo = MongoConf.get_client(MongoConf.parse_env())
    songs_collection = mongo['collections']['songs']
    audio_features_collection = mongo['collections']['audio_features']

    # Audio features fetching
    cursor = songs_collection.find({'user_id': username})
    for doc in cursor:
        artist = doc['song_artist']
        name = doc['song_name']
        id = doc['spotify_id']
        # Clean collection to avoid duplicata
        audio_features_collection.delete_many({
            'song_artist': artist,
            'song_name': name
        })
        # Fetch audio_features
        print("=> Fetching audio features of: %s - %s" % (artist, name))
        try:
            features = sp.audio_features(tracks=[id])
            audio_features = features[0]
            print("... Audio features Found !")
            audio_features_collection.insert_one({
                'song_name': name,
                'song_artist': artist,
                'user_id': username,
                'spotify_id': id,
                'audio_features': audio_features
            })
        except:
            print("Error .")
