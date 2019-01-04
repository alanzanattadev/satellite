import http.client
import satellipy.configuration.emotion as EmotionConf
import urllib
import collections
import json


def fetch_emotions_for_user(username, songs_collection, lyrics_collection, emotions_collection):
        # Get emotions for each lyrics
        emotion_conf = EmotionConf.parse_env()
        conn = http.client.HTTPConnection(emotion_conf['host'], emotion_conf['port'])
        c = songs_collection.find({'user_id': username})
        for d in c:
            emotions_cursor = emotions_collection.find(
                {
                    'song_name': d['song_name'],
                    'song_artist': d['song_artist'],
                }
            )
            if emotions_cursor.count() == 0:
                cursor = lyrics_collection.find({
                    'song_artist': d['song_artist'], 'song_name': d['song_name'],
                    'lyrics': {'$exists': True}
                })
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
                    content = json.loads(data.decode("utf-8"))
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
                                        })
                    emotions_collection.delete_many(
                        {
                            'song_name': doc['song_name'],
                            'song_artist': doc['song_artist'],
                        }
                    )
                    emotions_collection.insert_one(
                        {
                            'song_name': doc['song_name'],
                            'song_artist': doc['song_artist'],
                            'emotions': emotions,
                            'users': [username]
                        }
                    )
                conn.close()
            else:
                emotions_collection.update_one(
                    {
                        'song_name': d['song_name'],
                        'song_artist': d['song_artist'],
                    }, {
                        '$addToSet': {'users': [username]}
                    }
                )
