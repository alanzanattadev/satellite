const vorpal = require('vorpal')();

const chalk = vorpal.chalk;

vorpal
  .command('sIf', 'Search for following on Instagram')
  .action(function(args, callback) {
    this.log('Not implemented');
    callback();
  });

vorpal
  .delimiter(chalk.magenta('satellite $ '))
  .show();
