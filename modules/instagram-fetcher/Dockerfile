FROM alekzonder/puppeteer:latest
LABEL maintainer="jacqueslorentzdev@gmail.com"
COPY * /app/
WORKDIR /app/
RUN ["yarn", "--production=true"]
ENTRYPOINT ["node", "index.js"]
