# Using lightweight alpine image
FROM python:3.6-alpine

LABEL maintainer="paulrosset96@gmail.com"

# Manage user privilieges
RUN addgroup -S -g 1001 app
RUN adduser -S -D -h /app -u 1001 -G app app

# Installing dependencies
RUN apk update
RUN apk add --no-cache libxml2-dev libxslt-dev python-dev build-base
RUN pip install pymongo

# Creating working directory
RUN mkdir /app/src
WORKDIR /app/src
RUN chown -R app.app /app/

# Creating environment
COPY ./* ./
USER app

# Determine the entrypoint
# Launch the service:
# python cli.py [-p] [-g] TwitterIDUser
CMD ["/bin/sh"]