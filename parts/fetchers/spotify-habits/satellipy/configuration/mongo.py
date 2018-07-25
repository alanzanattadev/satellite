import os
from pymongo import MongoClient


def parse_env():
    # Mongo connection
    mongo_host = os.environ.get('MONGO_HOST', "localhost")
    mongo_port = os.environ.get('MONGO_PORT', 27017)
    mongo_database_name = os.environ.get('MONGO_DATABASE', 'spotify-habits')
    mongo_songs_collection_name = os.environ.get(
        'MONGO_SONGS_COLLECTION',
        'playlisted-songs'
    )
    mongo_emotions_collection_name = os.environ.get(
        'MONGO_EMOTIONS_COLLECTION',
        'emotions'
    )
    mongo_lyrics_collection_name = os.environ.get(
        'MONGO_LYRICS_COLLECTION',
        'lyrics'
    )
    mongo_audio_features_collection_name = os.environ.get(
        'MONGO_AUDIO_FEATURES_COLLECTION',
        'audio-features'
    )
    mongo_personalities_collection_name = os.environ.get(
        'MONGO_COLLECTION',
        'personalities'
    )
    return {
        'host': mongo_host,
        'port': mongo_port,
        'database': mongo_database_name,
        'collections': {
            'songs': mongo_songs_collection_name,
            'emotions': mongo_emotions_collection_name,
            'lyrics': mongo_lyrics_collection_name,
            'audio_features':
                mongo_audio_features_collection_name,
            'personalities':
                mongo_personalities_collection_name
        }
    }


def get_client(configuration):
        mongo_client = MongoClient(configuration['host'], configuration['port'])
        db = mongo_client[configuration['database']]
        return {
            'client': mongo_client,
            'database': db,
            'collections': {
                'lyrics': db[configuration['collections']['lyrics']],
                'songs': db[configuration['collections']['songs']],
                'emotions': db[configuration['collections']['emotions']],
                'audio_features': db[
                    configuration['collections']['audio_features']
                ],
                'personalities': db[
                    configuration['collections']['personalities']
                ]
            }
        }
