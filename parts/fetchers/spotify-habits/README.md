# Spotify Habits

### Dependencies Required

#### PIP

- pymongo
- spotipy
- lyricswikia (https://github.com/enricobacis/lyricwikia)

#### Infra

- mongo (docker run -it -p 27017:27017 mongo)
- MixedEmotion (docker run -it -p 5000:5000 mixedemotions/05_emotion_hashtags_nuig)

### Run

```bash
./get_habits.py [user id] (go on Mobile Spotify App and share a user to get its user id)
./get_lyrics.py [user id]
./get_emotions.py [user id]
```
