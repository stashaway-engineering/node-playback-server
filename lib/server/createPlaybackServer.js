import chalk from 'chalk';
import express from 'express';
import bodyParser from 'body-parser';
import * as utils from './utils';
import createLogger from './createLogger';

const createPlaybackServer = async (config) => {
  const _port = config.port;
  const _directory = config.directory;
  const logger = createLogger({
    tag: chalk.green(`[PLAY ►] [${_port}]`),
    loglevel: config.loglevel,
  });

  const app = express();
  app.use(bodyParser.json());

  const getRecordingFileName = utils.createGetRecordingFileName();
  const latestResponses = {};

  app.use(async (req, res) => {
    const { method, url } = req;

    const response = {};

    const filename = getRecordingFileName(method, url);
    const requestKey = utils.getRequestKey(method, url);

    if (utils.isRecordingExist(_directory, filename)) {
      const data = utils.readRecording(_directory, filename);
      response.status = data.status;
      response.data = data.data;
    } else if (latestResponses[requestKey]) {
      response.status = latestResponses[requestKey].status || 404;
      response.data = latestResponses[requestKey].data;
    }

    latestResponses[requestKey] = response;

    logger.info(`Replaying ${method} ${url} [${response.status}]`);
    res.status(response.status);
    res.json(response.data);
  });

  let server;
  await new Promise((resolve) => {
    server = app.listen(_port, () => {
      const command = `yarn node-playback-server play -p ${_port} -d ${_directory}`;
      logger.info(`Starting playback server\n> ${command}`);
      resolve();
    });
  });

  return {
    close: () => {
      logger.info('Stopping playback server');
      server.close();
    },
  };
};

export default createPlaybackServer;
