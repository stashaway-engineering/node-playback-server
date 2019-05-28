#!/usr/bin/env node
/* eslint-disable no-console, max-len */

import os from 'os';
import path from 'path';
import fse from 'fs-extra';
import arg from 'arg';
import chalk from 'chalk';
import createPlaybackServer from '../server/createPlaybackServer';
import createRecordingServer from '../server/createRecordingServer';

const helpMessage = chalk`
  {bold Commands}

      {dim $} node-playback-server record  Start a recording server
      {dim $} node-playback-server play    Start a playback server
      {dim $} node-playback-server clean   Clears temp directory

  {bold OPTIONS}

      --port (p)           Server port (optional)
      --archive (x)        Recording archive (use either archive or directory)
      --directory (d)      Recording directory (use either archive or directory)
      --target (t)         Server to forward request onto (record mode)
`;

const args = arg({
  '--help': Boolean,
  '--port': Number,
  '--mode': String,
  '--archive': String,
  '--directory': String,
  '--target': String,

  '-h': '--help',
  '-p': '--port',
  '-m': '--mode',
  '-x': '--archive',
  '-d': '--directory',
  '-t': '--target',
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
      });
      break;
    case 'play':
      server = await createPlaybackServer({
        port: args['--port'],
        archive: args['--archive'],
        directory: args['--directory'],
      });
      break;
    case 'clean': {
      const tempDirectory = path.join(os.tmpdir(), 'node-playback-server');
      console.error(chalk.green(`Clearing temp directory ${tempDirectory}`));
      await fse.remove(tempDirectory);
      return;
    }
    default:
      console.error(chalk.red(`Error: command ${command} not supported`));
      return;
  }

  process.on('SIGINT', async () => { await server.close(); });
  process.on('SIGTERM', async () => { await server.close(); });
})();
