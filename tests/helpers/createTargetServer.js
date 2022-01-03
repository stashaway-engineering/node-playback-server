import express from 'express';
import bodyParser from 'body-parser';

const createTargetServer = async (config) => {
  const _port = config.port;

  const app = express();
  app.use(bodyParser.json());

  let getCounter = 0;

  app.get('/static', (req, res) => {
    res.json({ data: 'get-static' });
  });

  app.get('/counter', (req, res) => {
    res.json({ data: `get-counter-${getCounter += 1}` });
  });

  app.post('/static', (req, res) => {
    res.json({ data: `post-static--${req.body.data}` });
  });

  app.post('/multipart', (req, res) => {
    res.json({ data: 'post-static--multipart' });
  });

  app.get(
    // eslint-disable-next-line max-len
    '/api/v1/goals/templates',
    (req, res) => {
      res.json({ data: 'get-longer-url' });
    },
  );

  let server;
  await new Promise((resolve) => {
    server = app.listen(_port, resolve);
  });

  return {
    port: server.address().port,
    close: () => {
      server.close();
    },
  };
};

export default createTargetServer;
