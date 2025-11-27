const chalk = require('chalk');

const logger = {
  info: (msg) => console.log(chalk.blue('ℹ') + ' ' + msg),
  success: (msg) => console.log(chalk.green('✔') + ' ' + msg),
  warn: (msg) => console.log(chalk.yellow('⚠') + ' ' + msg),
  error: (msg) => console.log(chalk.red('✖') + ' ' + msg),
  log: (msg) => console.log(msg),
};

module.exports = logger;
