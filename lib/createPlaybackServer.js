import fs from 'fs';
import _ from 'lodash';
import express from 'express';
import bodyParser from 'body-parser';

const createPlaybackServer = async (config) => {
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
  const baz = {};

  app.use(async (req, res) => {
    const { method, url, body, headers } = req; // eslint-disable-line

    const response = {};

    const filename = foo(method, url);

    // TODO: Refactor
    if (fs.existsSync(`${config.directory}${filename}`)) {
      const data = JSON.parse(fs.readFileSync(`${config.directory}${filename}`));
      response.status = data.status;
      response.data = data.data;
    } else if (baz[`${method}-${_.kebabCase(url)}`]) {
      response.status = baz[`${method}-${_.kebabCase(url)}`].status;
      response.data = baz[`${method}-${_.kebabCase(url)}`].data;
    }

    baz[`${method}-${_.kebabCase(url)}`] = response;

    res.status(response.status || 404);
    res.json(response.data);
  });

  let server;

  await new Promise((resolve) => { server = app.listen(config.port, resolve); });

  return { close: () => server.close() };
};

export default createPlaybackServer;
