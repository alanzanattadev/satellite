# Using lightweight alpine image
FROM python:3.6-alpine

LABEL maintainer="paulrosset96@gmail.com"

# Set working env
RUN addgroup -S -g 1001 app
RUN adduser -S -D -h /app -u 1001 -G app app

RUN apk update
RUN apk add --no-cache libxml2-dev libxslt-dev python-dev build-base
RUN pip install twitterscraper pymongo

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