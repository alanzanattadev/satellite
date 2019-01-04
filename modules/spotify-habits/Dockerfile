FROM tensorflow/tensorflow:1.10.1-py3

WORKDIR /usr/src/spotify-habits
RUN pip install -U pip
RUN pip install pymongo spotipy lyricwikia neo4j-driver tensorflow
COPY . .
