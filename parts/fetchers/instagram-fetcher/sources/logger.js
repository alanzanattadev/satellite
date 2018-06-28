const winston = require('winston');
const path = require('path');

const { combine, timestamp, printf } = winston.format;

const logFormat = printf(info => `${info.timestamp} [${info.level.toUpperCase()}] ${info.message}`);
const filename = path.join(__dirname, 'instagram-scraper.log');

module.exports = winston.createLogger({
  level: process.env.LOG_LEVEL,
  format: combine(timestamp(), logFormat),
  transports: [
    new winston.transports.Console(),
    // new winston.transports.File({ filename }),
  ],
});
