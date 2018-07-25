
def analyse_audio_for_user(username, audio_features_collection):
    cursor = audio_features_collection.aggregate([
        {
            '$match': {
                'user_id': username,
            }
        },
        {
            '$group': {
                '_id': "$user_id",
                'danceabilityAvg': {'$avg': "$audio_features.danceability"},
                'energyAvg': {'$avg': '$audio_features.energy'},
                'valenceAvg': {'$avg': '$audio_features.valence'},
                'instrumentalnessAvg': {'$avg': '$audio_features.instrumentalness'},
                'speechinessAvg': {'$avg': '$audio_features.speechiness'}
            }
        }
    ])
    for result in cursor:
        return {
            'averages': {
                'danceability': result['danceabilityAvg'],
                'energy': result['energyAvg'],
                'valence': result['valenceAvg'],
                'instrumentalness': result['instrumentalnessAvg'],
                'speechiness': result['speechinessAvg']
            }
        }
