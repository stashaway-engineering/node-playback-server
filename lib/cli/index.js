#!/usr/bin/env node
/* eslint-disable no-console, max-len */

import arg from 'arg';
import chalk from 'chalk';
import createPlaybackServer from '../server/createPlaybackServer';
import createRecordingServer from '../server/createRecordingServer';

const helpMessage = chalk`
  {bold Commands}

      {dim $} node-playback-server record
      {dim $} node-playback-server play

  {bold OPTIONS}

      --port (p)           Server port
      --directory (d)      Recording directory
      --target (t)         Server to forward request onto
`;

const args = arg({
  '--help': Boolean,
  '--port': Number,
  '--mode': String,
  '--directory': String,
  '--target': String,

  '-h': '--help',
  '-p': '--port',
  '-m': '--mode',
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
        directory: args['--directory'],
        target: args['--target'],
      });
      break;
    case 'play':
      server = await createPlaybackServer({
        port: args['--port'],
        directory: args['--directory'],
      });
      break;
    default:
      console.error(chalk.red(`Error: command ${command} not supported`));
      return;
  }

  process.on('SIGINT', server.close);
  process.on('SIGTERM', server.close);
})();
