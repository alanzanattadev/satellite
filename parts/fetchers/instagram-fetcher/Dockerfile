FROM alekzonder/puppeteer:latest
LABEL maintainer="jacqueslorentzdev@gmail.com"
COPY * /app/
WORKDIR /app/
RUN ["npm", "install"]
ENTRYPOINT ["node", "index.js"]
