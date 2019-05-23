import express from 'express';
import bodyParser from 'body-parser';

const createTargetServer = async (config) => {
  const app = express();
  app.use(bodyParser.json());

  let getCounter = 0;

  app.get('/static', (req, res) => { res.json({ data: 'get-static' }); });
  app.get('/counter', (req, res) => { res.json({ data: `get-counter-${getCounter += 1}` }); });
  app.post('/static', (req, res) => { res.json({ data: `post-static--${req.body.data}` }); });

  let server;

  await new Promise((resolve) => {
    server = app.listen(config.port, resolve);
  });

  return {
    close: () => {
      server.close();
    },
  };
};

export default createTargetServer;
