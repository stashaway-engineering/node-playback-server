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

if (args['--help']) {
  console.error(helpMessage);
  process.exit(2);
}

const command = args._[0];

(async () => {
  if (command === 'record') {
    await createRecordingServer({
      port: args['--port'],
      directory: args['--directory'],
      target: args['--target'],
    });
  }

  if (command === 'play') {
    await createPlaybackServer({
      port: args['--port'],
      directory: args['--directory'],
    });
  }
})();
