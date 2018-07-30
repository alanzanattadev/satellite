import http
import satellipy.configuration.emotion as EmotionConf
import urllib
import collections
import json


def fetch_emotions_for_user(username, lyrics_collection, emotions_collection):
        # Get emotions for each lyrics
        emotion_conf = EmotionConf.parse_env()
        conn = http.client.HTTPConnection(emotion_conf['host'], emotion_conf['port'])
        emotions_collection.delete_many({'user_id': username})
        cursor = lyrics_collection.find({'user_id': username})
        for doc in cursor:
            lyrics = doc['lyrics']
            params = urllib.parse.urlencode({
                'algo': "hashTagClassification",
                'i': lyrics,
                'estimator': 'LinearSVC'
            })
            conn.request("GET", "/api/?" + params)
            response = conn.getresponse()
            data = response.read()
            content = json.loads(data)
            emotions = []
            for entry in content['entries']:
                for emotion in entry['emotions']:
                    if isinstance(
                        emotion['onyx:hasEmotion'],
                        collections.Sequence
                    ):
                        for hasEmotion in emotion['onyx:hasEmotion']:
                            if 'onyx:hasEmotionCategory' in hasEmotion.keys():
                                emotions.append({
                                    'type': hasEmotion['onyx:hasEmotionCategory'],
                                    'intensity': hasEmotion.get(
                                        'onyx:hasEmotionIntensity',
                                        -1
                                    ),
                                    'song_name': doc['song_name'],
                                    'song_artist': doc['song_artist'],
                                })
            emotions_collection.insert_one(
                {'user_id': username, 'emotions': emotions}
            )
        conn.close()
