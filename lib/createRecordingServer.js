import axios from 'axios';
import express from 'express';
import bodyParser from 'body-parser';

const createRecordingServer = async (config) => {
  const app = express();
  app.use(bodyParser.json());

  app.use(async (req, res) => {
    const { method, url, body, headers } = req; // eslint-disable-line

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
      response = error.response || {};
    }

    res.status(response.status || 500);
    res.json(response.data);
  });

  let server;

  await new Promise((resolve) => { server = app.listen(config.port, resolve); });

  process.on('exit', () => server.close());
  process.on('SIGINT', () => server.close());
  process.on('SIGTERM', () => server.close());
  return { close: () => server.close() };
};

export default createRecordingServer;
