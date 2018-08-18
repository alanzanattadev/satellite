FROM node:latest

LABEL maintainer="paulrosset96@gmail.com"

RUN apt update
RUN apt install -y librdkafka-dev
RUN apt-get update
RUN apt-get install -y librdkafka-dev
RUN apt-get install -y apt-transport-https unzip
RUN curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add -
RUN touch /etc/apt/sources.list.d/kubernetes.list
RUN echo "deb http://apt.kubernetes.io/ kubernetes-xenial main" | tee -a /etc/apt/sources.list.d/kubernetes.list
RUN apt-get update
RUN apt-get install -y kubectl

COPY ../plugins /home/node/plugins
COPY * /home/node/
WORKDIR /home/node/

RUN ["yarn", "--production=true"]

EXPOSE 8000
ENTRYPOINT ["node", "index.js", "--loadPluginsDir", "./plugins"]
