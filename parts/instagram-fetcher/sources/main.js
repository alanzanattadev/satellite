const fs = require('fs');

const argv = require('optimist')
    .usage('Scraps Instragram for you.\nUsage: node main.js <username>')
    .alias('u', 'username')
    .describe('u', 'Login user used to scrap')
    .alias('p', 'password')
    .describe('p', 'Login password')
    .alias('q', 'quiet')
    .describe('q', 'Quiet mode')
    .alias('o', 'output')
    .describe('o', 'Output destination for data (default: ./<username>/)')
    .alias('f', 'file')
    .describe('f', 'Output file name for JSON data (default: <username>.json)')
    .alias('d', 'download')
    .describe('d', 'Downloads medias')
    .alias('m', 'post-meta')
    .describe('m', 'Get all post metadata (likes, comments,..). This implies --posts')
    .describe('followers', 'Get followers list')
    .describe('following', 'Get following list')
    .describe('posts', 'Get posts list')
    .describe('highlights', 'Get highlights list')
    .describe('stories', 'Get user stories')
    .alias('a', 'all')
    .describe('a', 'Get all possible data')
    .describe('no-headless', 'Show browser during scrap')
    .demand(1)
    .argv
;

const scraper = require('./scraper');

const options = {
  id: argv._[0],
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
  headless: (argv.headless === false ? false : true),
};

const writeFile = (file, folder, data) => {
  try {
    fs.mkdirSync(folder);
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
  fs.writeFileSync(`${folder}${file}`, JSON.stringify(data));
  console.log(`Data saved at ${folder}${file}`);
};

(async () => {
  console.log(`Start getting user '${options.id}' data`);
  const data = await scraper.getUserData(options);
  /*
  if postMeta
  */

  const folderName = options.output || `./${options.id}`;
  const folder = `${folderName}${folderName.charAt(folderName.length - 1) === '/' ? '' : '/'}`;
  writeFile(options.filename || `${options.id}.json`, folder, data);
  if (options.download) {
    scraper.saveMediasAt(data, folder);
  }
})();

// moboyafe@larjem.com
// test1234
