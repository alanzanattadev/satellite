def fetch_audio_features(sp, username, songs_collection, audio_features_collection):
    # Audio features fetching
    cursor = songs_collection.find({'user_id': username})
    for doc in cursor:
        artist = doc['song_artist']
        name = doc['song_name']
        id = doc['spotify_id']
        print("=> Checking audio features of: %s - %s" % (artist, name))
        if audio_features_collection.find({
            'spotify_id': id
        }).count() == 0:
            # Fetch audio_features
            print("... Fetching audio features of: %s - %s" % (artist, name))
            try:
                features = sp.audio_features(tracks=[id])
                audio_features = features[0]
                print("... Audio features Found !")
                audio_features_collection.insert_one({
                    'song_name': name,
                    'song_artist': artist,
                    'spotify_id': id,
                    'audio_features': audio_features,
                    'users': [username]
                })
            except:
                print("Error .")
        else:
            print("... Already in database")
            audio_features_collection.update_one({'spotify_id': id}, {
                '$addToSet': {
                    'users': username
                }
            })
