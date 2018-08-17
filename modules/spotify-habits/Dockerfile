FROM python:3-alpine

WORKDIR /usr/src/spotify-habits
RUN pip install pymongo spotipy lyricwikia neo4j-driver tensorflow
COPY . .
CMD ["python"]
