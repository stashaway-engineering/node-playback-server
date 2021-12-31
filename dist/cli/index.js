#!/usr/bin/env node

/* eslint-disable no-console, max-len */
"use strict";

var _os = _interopRequireDefault(require("os"));

var _path = _interopRequireDefault(require("path"));

var _fsExtra = _interopRequireDefault(require("fs-extra"));

var _arg = _interopRequireDefault(require("arg"));

var _chalk = _interopRequireDefault(require("chalk"));

var utils = _interopRequireWildcard(require("../server/utils"));

var _createPlaybackServer = _interopRequireDefault(require("../server/createPlaybackServer"));

var _createRecordingServer = _interopRequireDefault(require("../server/createRecordingServer"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const helpMessage = _chalk.default`
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
const args = (0, _arg.default)({
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
  '-l': '--loglevel'
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
      server = await (0, _createRecordingServer.default)({
        port: args['--port'],
        archive: args['--archive'],
        directory: args['--directory'],
        target: args['--target'],
        loglevel: args['--loglevel']
      });
      break;

    case 'play':
      server = await (0, _createPlaybackServer.default)({
        port: args['--port'],
        archive: args['--archive'],
        directory: args['--directory'],
        loglevel: args['--loglevel']
      });
      break;

    case 'clean':
      {
        const tempDirectory = _path.default.join(_os.default.tmpdir(), 'node-playback-server');

        console.error(_chalk.default.green(`Clearing temp directory ${tempDirectory}`));
        await _fsExtra.default.remove(tempDirectory);
        return;
      }

    case 'pack':
      {
        const _archive = args['--archive'];

        const _directory = utils.resolveDirectory(_archive, null);

        await utils.createArchive(_archive, _directory);
        console.error(_chalk.default.green(`Packing archive ${_archive} from ${_directory}`));
        return;
      }

    case 'unpack':
      {
        const _archive = args['--archive'];

        const _directory = utils.resolveDirectory(_archive, null);

        await utils.extractArchive(_archive, _directory);
        console.error(_chalk.default.green(`Unpacking archive ${_archive} to ${_directory}`));
        return;
      }

    case 'migrate':
      {
        const _archive = args['--archive'];

        const _directory = utils.resolveDirectory(_archive, null);

        await utils.extractArchive(_archive, _directory);
        console.error(_chalk.default.green(`Unpacking archive ${_archive} to ${_directory}`));
        console.error(_chalk.default.green('Migrating recording format'));
        await utils.migrateLegacyFormat(_directory);
        await utils.createArchive(_archive, _directory);
        console.error(_chalk.default.green(`Packing archive ${_archive} from ${_directory}`));
        return;
      }

    default:
      console.error(_chalk.default.red(`Error: command ${command} not supported`));
      return;
  }

  process.on('SIGINT', async () => {
    await server.close();
  });
  process.on('SIGTERM', async () => {
    await server.close();
  });
})();