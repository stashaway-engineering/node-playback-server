import _ from 'lodash';
import fs from 'fs';
import axios from 'axios';
import express from 'express';
import bodyParser from 'body-parser';

const createRecordingServer = async (config) => {
  const app = express();
  app.use(bodyParser.json());

  // TODO: Refactor
  const bar = {};
  const foo = (method, url) => {
    const xx = `${method}-${_.kebabCase(url)}`;
    bar[xx] = !bar[xx] ? 1 : bar[xx] + 1;
    const callIndex = bar[xx];
    return `${xx}-${callIndex}.json`;
  };

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

    const filename = foo(method, url);

    fs.existsSync(config.directory) || fs.mkdirSync(config.directory, { recursive: true });
    fs.writeFileSync(`${config.directory}${filename}`, JSON.stringify(_.pick(response, ['status', 'data'])));
  });

  let server;

  await new Promise((resolve) => { server = app.listen(config.port, resolve); });

  return { close: () => server.close() };
};

export default createRecordingServer;
