#!/usr/bin/env python3
import satellipy.utils.cli as cli
import satellipy.configuration.mongo as MongoConf
import satellipy.analysis.emotions as EmotionsAnalysis
import satellipy.analysis.audio as AudioAnalysis

if __name__ == '__main__':

    username = cli.parse_username_from_args()
    mongo_client = MongoConf.get_client(MongoConf.parse_env())
    emotions_collection = mongo_client['collections']['emotions']
    audio_features_collection = mongo_client['collections']['audio_features']

    emotions, _, _ = EmotionsAnalysis.analyse_emotions_of_user(
        username, emotions_collection
    )
    audio_analysis = AudioAnalysis.analyse_audio_for_user(
        username, audio_features_collection
    )

    # Display Results
    print("----------------\nLyrics Emotions\n----------------")
    for emotion in emotions:
        print("%s: %d" % (emotion['type'].title(), emotion['count']))

    print("----------------\nAudio Features\n----------------")
    print('Danceability: %f' % (audio_analysis['averages']['danceability']))
    print('Energy: %f' % (audio_analysis['averages']['energy']))
    print('Valence: %f' % (audio_analysis['averages']['valence']))
    print('Instrumentalness: %f' % (
        audio_analysis['averages']['instrumentalness']
    ))
    print('Speechiness: %f' % (audio_analysis['averages']['speechiness']))
