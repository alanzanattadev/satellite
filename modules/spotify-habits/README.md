# Spotify Habits

### Dependencies Required

#### PIP

- pymongo
- spotipy
- lyricwikia (https://github.com/enricobacis/lyricwikia)
- neo4j-driver
- tensorflow

#### Infra

- mongo (docker run -it -p 27017:27017 mongo)
- MixedEmotion (docker run -it -p 5000:5000 mixedemotions/05_emotion_hashtags_nuig)
- neo4j (docker run -p 7474:7474 -p 7687:7687 neo4j)

### Run

Get a training set file which is a csv containing on each row:

- spotify user ID
- personality label (ENFP, INTP, ...)

Put this training set file on a server web or locally.

```bash
./fetch_training_set.sh [trainingSetUri]
./get_all_for_user.sh [user id] (go on Mobile Spotify App and share a user to get its user id)
... [user id]
```
