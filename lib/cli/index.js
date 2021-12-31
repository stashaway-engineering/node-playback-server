#!/usr/bin/env node
/* eslint-disable no-console, max-len */

import os from 'os';
import path from 'path';
import fse from 'fs-extra';
import arg from 'arg';
import chalk from 'chalk';
import * as utils from '../server/utils';
import createPlaybackServer from '../server/createPlaybackServer';
import createRecordingServer from '../server/createRecordingServer';

const helpMessage = chalk`
  {bold Commands}

      {dim $} node-playback-server record  Start a recording server
      {dim $} node-playback-server play    Start a playback server
      {dim $} node-playback-server clean   Clears temp directory
      {dim $} node-playback-server pack    Pack temp directory to a tarball
      {dim $} node-playback-server unpack  Unpack tarbal to temp directory

  {bold OPTIONS}

      --port (p)           Server port (optional)
      --archive (x)        Recording archive (use either archive or directory)
      --directory (d)      Recording directory (use either archive or directory)
      --target (t)         Server to forward request onto (record mode)
      --loglevel (l)       Server log level (1 to 5)
`;

const args = arg({
  '--help': Boolean,
  '--port': Number,
  '--mode': String,
  '--archive': String,
  '--directory': String,
  '--target': String,
  '--loglevel': Number,

  '-h': '--help',
  '-p': '--port',
  '-m': '--mode',
  '-x': '--archive',
  '-d': '--directory',
  '-t': '--target',
  '-l': '--loglevel',
});

(async () => {
  if (args['--help']) {
    console.error(helpMessage);
    process.exit(2);
  }

  const command = args._[0];

  let server;

  switch (command) {
    case 'record':
      server = await createRecordingServer({
        port: args['--port'],
        archive: args['--archive'],
        directory: args['--directory'],
        target: args['--target'],
        loglevel: args['--loglevel'],
      });
      break;
    case 'play':
      server = await createPlaybackServer({
        port: args['--port'],
        archive: args['--archive'],
        directory: args['--directory'],
        loglevel: args['--loglevel'],
      });
      break;
    case 'clean': {
      const tempDirectory = path.join(os.tmpdir(), 'node-playback-server');
      console.error(chalk.green(`Clearing temp directory ${tempDirectory}`));
      await fse.remove(tempDirectory);
      return;
    }
    case 'pack': {
      const _archive = args['--archive'];
      const _directory = utils.resolveDirectory(_archive, null);

      await utils.createArchive(_archive, _directory);
      console.error(chalk.green(`Packing archive ${_archive} from ${_directory}`));
      return;
    }
    case 'unpack': {
      const _archive = args['--archive'];
      const _directory = utils.resolveDirectory(_archive, null);

      await utils.extractArchive(_archive, _directory);
      console.error(chalk.green(`Unpacking archive ${_archive} to ${_directory}`));
      return;
    }
    case 'migrate': {
      const _archive = args['--archive'];
      const _directory = utils.resolveDirectory(_archive, null);

      await utils.extractArchive(_archive, _directory);
      console.error(chalk.green(`Unpacking archive ${_archive} to ${_directory}`));

      console.error(chalk.green('Migrating recording format'));
      await utils.migrateLegacyFormat(_directory);

      await utils.createArchive(_archive, _directory);
      console.error(chalk.green(`Packing archive ${_archive} from ${_directory}`));

      return;
    }
    default:
      console.error(chalk.red(`Error: command ${command} not supported`));
      return;
  }

  process.on('SIGINT', async () => { await server.close(); });
  process.on('SIGTERM', async () => { await server.close(); });
})();
