FROM alekzonder/puppeteer:latest
LABEL maintainer="jacqueslorentzdev@gmail.com"
COPY * /app/
WORKDIR /app/
RUN ["yarn"]
ENTRYPOINT ["node", "index.js"]
