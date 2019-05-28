import chalk from 'chalk';
import axios from 'axios';
import express from 'express';
import bodyParser from 'body-parser';
import * as utils from './utils';
import createLogger from './createLogger';

const createRecordingServer = async (config) => {
  const _port = config.port;
  const _directory = config.directory;
  const _target = config.target;
  const logger = createLogger({
    tag: chalk.red(`[REC ●] [${_port}]`),
    loglevel: config.loglevel,
  });

  const app = express();
  app.use(bodyParser.json());

  const getRecordingFileName = utils.createGetRecordingFileName();

  app.use(async (req, res) => {
    const { method, url, body, headers } = req;

    let response;

    try {
      response = await axios.request({
        baseURL: _target,
        data: body,
        url,
        method,
        headers: { ...headers, host: null },
      });
    } catch (error) {
      response = error.response || { status: 500 };
    }

    logger.info(`Recorded ${method} ${url} [${response.status}]`);
    res.status(response.status);
    res.json(response.data);

    const filename = getRecordingFileName(method, url);
    utils.saveRecording(_directory, filename, req, response);
  });

  let server;
  await new Promise((resolve) => {
    server = app.listen(_port, () => {
      const command = `yarn node-playback-server record -p ${_port} -d ${_directory} -t ${_target}`;
      logger.info(`Starting playback server\n> ${command}`);
      resolve();
    });
  });

  return {
    close: () => {
      logger.info('Stopping recording server');
      server.close();
    },
  };
};

export default createRecordingServer;
