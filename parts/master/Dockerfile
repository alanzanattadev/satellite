FROM node:latest
LABEL maintainer="paulrosset96@gmail.com"

COPY * /home/node/
WORKDIR /home/node/
RUN ["yarn", "--production=true"]

EXPOSE 8000
ENTRYPOINT ["node", "index.js"]
