#!/usr/bin/env node

const { program } = require('commander');
const run = require('../lib/commands/run');
const build = require('../lib/commands/build');
const create = require('../lib/commands/create');
const pkg = require('../package.json');

program
    .name('sumjs')
    .version(pkg.version)
    .description('A futuristic CLI for building React + Neutralino apps');

program
    .command('run')
    .description('Run the app in development mode')
    .action(run);

program
    .command('build')
    .description('Build the app for production')
    .action(build);

program
    .command('create <projectName>')
    .description('Create a new futuristic React + Neutralino project')
    .action(create);

program.parse(process.argv);
