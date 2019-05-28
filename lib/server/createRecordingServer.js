import _ from 'lodash';
import fse from 'fs-extra';
import chalk from 'chalk';
import axios from 'axios';
import express from 'express';
import bodyParser from 'body-parser';
import * as utils from './utils';
import createLogger from './createLogger';

const createRecordingServer = async (config) => {
  const _archive = config.archive;
  const _directory = utils.resolveDirectory(config.archive, config.directory);

  const _target = config.target;
  let _port = config.port;
  let logger;

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

    logger.debug(`Recorded ${method} ${url} [${response.status}]`);
    res.status(response.status);
    res.json(response.data);

    const filename = getRecordingFileName(method, url);
    utils.saveRecording(_directory, filename, req, response);
  });

  let server;
  await new Promise((resolve) => {
    server = app.listen(_port, async () => {
      _port = server.address().port;
      logger = createLogger({
        tag: chalk.red(`[REC ●] [${_port}]`),
        loglevel: config.loglevel,
      });

      logger.debug(`Clearing recording directory ${_directory}`);
      await fse.remove(_directory);

      const command = `yarn node-playback-server record -p ${_port} -d ${_directory} -t ${_target}`;
      logger.info(`Starting playback server\n> ${command}`);
      resolve();
    });
  });

  return {
    port: _port,
    close: _.once(async () => {
      logger.info('Stopping recording server');
      server.close();

      if (_archive) {
        await utils.createArchive(_archive, _directory);
        logger.debug(`Saving archive ${_archive}`);
      }
    }),
  };
};

export default createRecordingServer;
