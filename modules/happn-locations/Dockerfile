FROM python:2-alpine
LABEL maintainer="jacqueslorentzdev@gmail.com"
WORKDIR /usr/src/app

RUN ["apk", "update"]
RUN ["apk", "add", "git"]
RUN ["git", "clone", "https://github.com/rickhousley/happn"]
RUN ["pip", "install", "requests", "pprint", "logging", "argparse", "python-decouple", "neo4j-driver"]
COPY script.py ./happn/
ENTRYPOINT ["/bin/sh"]
