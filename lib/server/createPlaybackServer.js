import _ from 'lodash';
import chalk from 'chalk';
import express from 'express';
import bodyParser from 'body-parser';
import * as utils from './utils';
import createLogger from './createLogger';

const createPlaybackServer = async (config) => {
  const _archive = config.archive;
  const _directory = utils.resolveDirectory(config.archive, config.directory);

  const _loglevel = config.loglevel;
  let _port = config.port;
  let logger;

  const app = express();
  app.use(bodyParser.json());

  const getRecordingFileName = utils.createGetRecordingFileName();
  const latestResponses = {};

  app.use(async (req, res) => {
    const { method, url } = req;

    const response = {};

    const escapedUrl = url.replaceAll('%5B%5D', '[]');
    const filename = getRecordingFileName(method, escapedUrl);
    const requestKey = utils.getRequestKey(method, escapedUrl);

    if (utils.isRecordingExist(_directory, filename)) {
      const data = utils.readRecording(_directory, filename);
      response.status = data.status;
      response.data = data.data;
    } else if (latestResponses[requestKey]) {
      response.status = latestResponses[requestKey].status;
      response.data = latestResponses[requestKey].data;
    }

    latestResponses[requestKey] = response;

    logger.debug(`Replaying ${method} ${escapedUrl} [${response.status}]`);
    res.status(response.status || 404);
    res.json(response.data);
  });

  let server;
  await new Promise((resolve) => {
    server = app.listen(_port, () => {
      _port = server.address().port;
      logger = createLogger({
        tag: chalk.green(`[PLAY ►] [${_port}]`),
        loglevel: _loglevel,
      });

      const command = `yarn node-playback-server play -p ${_port} -d ${_directory}`;
      const altCommand = `yarn node-playback-server play -p ${_port} -x ${_archive}`;
      logger.info(`Starting playback server\n> ${command}\n> ${altCommand}`);
      resolve();
    });
  });

  if (_archive) {
    if (await utils.isDirectoryInSyncWithArchive(_archive, _directory)) {
      logger.info('Recording directory is up to date');
    } else {
      logger.info(`Recording directory is outdated extracting ${_archive}`);
      await utils.extractArchive(_archive, _directory);
    }
  }

  return {
    port: _port,
    close: _.once(async () => {
      logger.info('Stopping playback server');
      server.close();
    }),
  };
};

export default createPlaybackServer;
