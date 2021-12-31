"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _lodash = _interopRequireDefault(require("lodash"));

var _fsExtra = _interopRequireDefault(require("fs-extra"));

var _chalk = _interopRequireDefault(require("chalk"));

var _axios = _interopRequireDefault(require("axios"));

var _express = _interopRequireDefault(require("express"));

var _bodyParser = _interopRequireDefault(require("body-parser"));

var utils = _interopRequireWildcard(require("./utils"));

var _createLogger = _interopRequireDefault(require("./createLogger"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const createRecordingServer = async config => {
  const _archive = config.archive;

  const _directory = utils.resolveDirectory(config.archive, config.directory);

  const _target = config.target;
  let _port = config.port;
  let logger;
  const app = (0, _express.default)();
  app.use(_bodyParser.default.json());
  const getRecordingFileName = utils.createGetRecordingFileName();
  app.use(async (req, res) => {
    const {
      method,
      url
    } = req;
    const {
      headers,
      data
    } = utils.isFormRequest(req) ? await utils.getMultipartPayload(req) : {
      headers: req.headers,
      data: req.body
    };
    const response = await _axios.default.request({
      baseURL: _target,
      data,
      url,
      method,
      headers: { ...headers,
        host: null,
        'Cache-Control': 'no-cache'
      }
    }).catch(error => error.response);
    logger.debug(`Recorded ${method} ${url} [${response.status}]`);
    res.status(response.status || 500);
    res.json(response.data);
    const filename = getRecordingFileName(method, url);
    utils.saveRecording(_directory, filename, req, response);
  });
  let server;
  await new Promise(resolve => {
    server = app.listen(_port, async () => {
      _port = server.address().port;
      logger = (0, _createLogger.default)({
        tag: _chalk.default.red(`[REC ●] [${_port}]`),
        loglevel: config.loglevel
      });
      logger.debug(`Clearing recording directory ${_directory}`);
      await _fsExtra.default.remove(_directory);
      const command = `yarn node-playback-server record -p ${_port} -d ${_directory} -t ${_target}`;
      const altCommand = `yarn node-playback-server play -p ${_port} -x ${_archive} -t ${_target}`;
      logger.info(`Starting recording server\n> ${command}\n> ${altCommand}`);
      resolve();
    });
  });
  return {
    port: _port,
    close: _lodash.default.once(async () => {
      logger.info('Stopping recording server');
      server.close();

      if (_archive) {
        await utils.createArchive(_archive, _directory);
        logger.info(`Saving archive ${_archive}`);
      }
    })
  };
};

var _default = createRecordingServer;
exports.default = _default;