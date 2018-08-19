FROM node:latest

LABEL maintainer="paulrosset96@gmail.com"

RUN apt-get update
RUN apt-get install -y apt-transport-https

RUN curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add -
RUN touch /etc/apt/sources.list.d/kubernetes.list
RUN echo "deb http://apt.kubernetes.io/ kubernetes-xenial main" | tee -a /etc/apt/sources.list.d/kubernetes.list

RUN apt-get update
RUN apt-get install -y librdkafka-dev unzip git kubectl

COPY * /home/node/
WORKDIR /home/node/

RUN git clone https://github.com/alanzanattadev/satellite

RUN ["yarn", "--production=true"]

EXPOSE 8000
ENTRYPOINT ["node", "index.js", "--loadPluginsDir", "./satellite/plugins"]
