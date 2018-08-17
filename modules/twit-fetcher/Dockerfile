# Using lightweight alpine image
FROM python:3.6-alpine

LABEL maintainer="paulrosset96@gmail.com"

RUN apk update \
        && apk add --no-cache libxml2-dev libxslt-dev python-dev build-base \
        && pip install twitterscraper textblob langdetect pandas pymongo \
        && addgroup -S -g 1001 app \
        && adduser -S -D -h /app -u 1001 -G app app

# Creating working directory
RUN mkdir /app/src
WORKDIR /app/src
RUN chown -R app.app /app/

# Creating environment
COPY ./* ./
USER app

# Command ran when the container will start.
# CLI: python main.py UserIDTwitter
CMD ["/bin/sh"]