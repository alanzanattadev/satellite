FROM petronetto/docker-python-deep-learning

WORKDIR /usr/src/spotify-habits
RUN pip install -U pip
RUN pip install pymongo spotipy lyricwikia neo4j-driver tensorflow
COPY . .
CMD ["python"]
