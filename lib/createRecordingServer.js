import axios from 'axios';
import express from 'express';
import bodyParser from 'body-parser';
import * as utils from './utils';

const createRecordingServer = async (config) => {
  const app = express();
  app.use(bodyParser.json());

  const getRecordingFileName = utils.createGetRecordingFileName();

  app.use(async (request, res) => {
    const { method, url, body, headers } = request;

    let response;

    try {
      response = await axios.request({
        baseURL: config.target,
        data: body,
        url,
        method,
        headers: { ...headers, host: null },
      });
    } catch (error) {
      response = error.response || { status: 500 };
    }

    res.status(response.status);
    res.json(response.data);

    const filename = getRecordingFileName(method, url);
    utils.saveRecording(config.directory, filename, request, response);
  });

  let server;

  await new Promise((resolve) => { server = app.listen(config.port, resolve); });

  return { close: () => server.close() };
};

export default createRecordingServer;
