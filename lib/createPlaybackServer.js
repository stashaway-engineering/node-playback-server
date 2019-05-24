import express from 'express';
import bodyParser from 'body-parser';
import * as utils from './utils';

const createPlaybackServer = async (config) => {
  const app = express();
  app.use(bodyParser.json());

  const getRecordingFileName = utils.createGetRecordingFileName();
  const latestResponses = {};

  app.use(async (req, res) => {
    const { method, url } = req;

    const response = {};

    const filename = getRecordingFileName(method, url);
    const requestKey = utils.getRequestKey(method, url);

    if (utils.isRecordingExist(config.directory, filename)) {
      const data = utils.readRecording(config.directory, filename);
      response.status = data.status;
      response.data = data.data;
    } else if (latestResponses[requestKey]) {
      response.status = latestResponses[requestKey].status;
      response.data = latestResponses[requestKey].data;
    }

    latestResponses[requestKey] = response;

    res.status(response.status || 404);
    res.json(response.data);
  });

  let server;

  await new Promise((resolve) => { server = app.listen(config.port, resolve); });

  return { close: () => server.close() };
};

export default createPlaybackServer;
