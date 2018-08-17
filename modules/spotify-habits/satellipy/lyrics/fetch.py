import http
import json
import lyricwikia


def fetch_lyrics(username, songs_collection, lyrics_collection):
    # Lyrics fetching
    cursor = songs_collection.find({'user_id': username})
    conn = http.client.HTTPSConnection("api.lyrics.ovh")
    for doc in cursor:
        artist = doc['song_artist']
        name = doc['song_name']
        lyrics_cursor = lyrics_collection.find({
            'song_artist': artist,
            'song_name': name,
        })
        print("=> Checking lyrics of: %s - %s" % (artist, name))
        if lyrics_cursor.count() == 0:
            # Fetch lyrics
            print("... Fetching lyrics of: %s - %s" % (artist, name))
            try:
                lyrics = lyricwikia.get_lyrics(artist, name)
                print("... Lyrics Found !")
                lyrics_collection.insert_one({
                    'song_name': name,
                    'song_artist': artist,
                    'lyrics': lyrics
                })
            except:
                print("... Not found, trying on lyrics.ovh")
                try:
                    conn.request("GET", "/v1/%s/%s" % (artist, name))
                    response = conn.getresponse()
                    if response.code == 200:
                        data = response.read()
                        content = json.loads(data)
                        lyrics = content['lyrics']
                        print("... Lyrics Found !")
                        lyrics_collection.insert_one({
                            'song_name': name,
                            'song_artist': artist,
                            'lyrics': lyrics
                        })
                    else:
                        print("... Not found")
                        lyrics_collection.insert_one({
                            'song_name': name,
                            'song_artist': artist,
                        })
                except:
                    print("... Not english")
                    lyrics_collection.insert_one({
                        'song_name': name,
                        'song_artist': artist,
                    })
        else:
            for d in lyrics_cursor:
                if 'lyrics' in d:
                    print("... Already exists in database")
                else:
                    print("... Wasn't found before")
    # Clean network
    conn.close()
    # Clean database
    lyrics_collection.delete_many({'lyrics': {'$regex': 'ERROR:.*'}})
