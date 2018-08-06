const fs = require('fs');

const { argv } = require('optimist')
  .usage('Scraps Instragram for you.\nUsage: node main.js <user|post> <username|post_shortcode>')
  .alias('u', 'username')
  .describe('u', 'Login user used to scrap')
  .alias('p', 'password')
  .describe('p', 'Login password')
  .alias('q', 'quiet')
  .describe('q', 'Quiet mode')
  .alias('o', 'output')
  .describe('o', 'Output destination for data (default: ./<username|post_shortcode>/)')
  .alias('f', 'file')
  .describe('f', 'Output file name for JSON data (default: <username|post_shortcode>.json)')
  .alias('d', 'download')
  .describe('d', 'Downloads medias')
  .alias('m', 'post-meta')
  .describe('m', 'Get all post metadata (likes, comments,..). This implies --posts')
  .describe('followers', 'Get followers list (for user only)')
  .describe('following', 'Get following list (for user only)')
  .describe('posts', 'Get posts list (for user only)')
  .describe('highlights', 'Get highlights list (for user only)')
  .describe('stories', 'Get stories (for user only)')
  .alias('a', 'all')
  .describe('a', 'Get all possible data')
  .describe('no-headless', 'Show browser during scrap')
  .describe('raw', 'Save raw JSON get from browser')
  .alias('v', 'verbose')
  .describe('verbose', 'Change log level to verbose')
  .demand(2);

const options = {
  type: argv._[0],
  id: argv._[1],
  credentials: (argv.u && argv.p ? {
    user: argv.u,
    pass: argv.p,
  } : null),
  quiet: argv.q || false,
  filename: argv.f || null,
  output: argv.o || null,
  download: argv.a || argv.d || false,
  postMeta: argv.a || argv.m || false,
  followers: argv.a || argv.followers || false,
  following: argv.a || argv.following || false,
  highlights: argv.a || argv.highlights || false,
  stories: argv.a || argv.stories || false,
  posts: argv.a || argv.m || argv.posts || false,
  raw: argv.raw || false,
  headless: !(argv.headless === false),
  logLevel: (argv.verbose ? 'verbose' : 'info'),
};

// MUST BE BEFORE REQUIRES
process.env.LOG_LEVEL = (options.quiet ? 'error' : options.logLevel);

const logger = require('./logger');
const scraper = require('./scraper');

const writeFile = (file, folder, data) => {
  try {
    fs.mkdirSync(folder);
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
  fs.writeFileSync(`${folder}${file}`, JSON.stringify(data));
  logger.info(`Data saved at ${folder}${file}`);
};

(async () => {
  if (options.type !== 'user' && options.type !== 'post') {
    return logger.error(`Unrecognize option ${options.type}`);
  }
  logger.info(`Start getting ${options.type} '${options.id}' data`);
  const data = (
    options.type === 'user'
      ? await scraper.getUserData(options)
      : await scraper.getPostData(options)
  );
  const folderName = options.output || `./${options.id}`;
  const folder = `${folderName}${folderName.charAt(folderName.length - 1) === '/' ? '' : '/'}`;
  writeFile(options.filename || `${options.id}.json`, folder, data);
  if (options.download) {
    logger.info(`Start saving medias from ${options.type} '${options.id}'`);
    scraper.saveMediasAt(options.type === 'user', data, folder);
  }
  return null;
})();

// moboyafe@larjem.com
// test1234
