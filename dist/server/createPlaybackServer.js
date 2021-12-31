"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _lodash = _interopRequireDefault(require("lodash"));

var _chalk = _interopRequireDefault(require("chalk"));

var _express = _interopRequireDefault(require("express"));

var _bodyParser = _interopRequireDefault(require("body-parser"));

var utils = _interopRequireWildcard(require("./utils"));

var _createLogger = _interopRequireDefault(require("./createLogger"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const createPlaybackServer = async config => {
  const _archive = config.archive;

  const _directory = utils.resolveDirectory(config.archive, config.directory);

  const _loglevel = config.loglevel;
  let _port = config.port;
  let logger;
  const app = (0, _express.default)();
  app.use(_bodyParser.default.json());
  const getRecordingFileName = utils.createGetRecordingFileName();
  const latestResponses = {};
  app.use(async (req, res) => {
    const {
      method,
      url
    } = req;
    const response = {};
    const filename = getRecordingFileName(method, url);
    const requestKey = utils.getRequestKey(method, url);

    if (utils.isRecordingExist(_directory, filename)) {
      const data = utils.readRecording(_directory, filename);
      response.status = data.status;
      response.data = data.data;
    } else if (latestResponses[requestKey]) {
      response.status = latestResponses[requestKey].status;
      response.data = latestResponses[requestKey].data;
    }

    latestResponses[requestKey] = response;
    logger.debug(`Replaying ${method} ${url} [${response.status}]`);
    res.status(response.status || 404);
    res.json(response.data);
  });
  let server;
  await new Promise(resolve => {
    server = app.listen(_port, () => {
      _port = server.address().port;
      logger = (0, _createLogger.default)({
        tag: _chalk.default.green(`[PLAY ►] [${_port}]`),
        loglevel: _loglevel
      });
      const command = `yarn node-playback-server play -p ${_port} -d ${_directory}`;
      const altCommand = `yarn node-playback-server play -p ${_port} -x ${_archive}`;
      logger.info(`Starting playback server\n> ${command}\n> ${altCommand}`);
      resolve();
    });
  });

  if (_archive) {
    if (await utils.isDirectoryInSyncWithArchive(_archive, _directory)) {
      logger.info('Recording directory is up to date');
    } else {
      logger.info(`Recording directory is outdated extracting ${_archive}`);
      await utils.extractArchive(_archive, _directory);
    }
  }

  return {
    port: _port,
    close: _lodash.default.once(async () => {
      logger.info('Stopping playback server');
      server.close();
    })
  };
};

var _default = createPlaybackServer;
exports.default = _default;