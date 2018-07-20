# Using lightweight alpine image
FROM python:3.6-alpine

RUN apk update \
        && apk add --no-cache git openssh-client libxml2-dev libxslt-dev python-dev build-base \
        && pip install pipenv twitterscraper  \
        && addgroup -S -g 1001 app \
        && adduser -S -D -h /app -u 1001 -G app app

# Creating working directory
RUN mkdir /app/src
WORKDIR /app/src
RUN chown -R app.app /app/

# Creating environment
COPY ./* ./
USER app

CMD ["/bin/sh"]