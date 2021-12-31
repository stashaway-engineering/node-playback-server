"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.migrateLegacyFormat = exports.getMultipartPayload = exports.isFormRequest = exports.isDirectoryInSyncWithArchive = exports.extractArchive = exports.createArchive = exports.resolveDirectory = exports.readRecording = exports.isRecordingExist = exports.saveRecording = exports.createGetRecordingFileName = exports.getRequestKey = void 0;

var _lodash = _interopRequireDefault(require("lodash"));

var _os = _interopRequireDefault(require("os"));

var _path = _interopRequireDefault(require("path"));

var _fsExtra = _interopRequireDefault(require("fs-extra"));

var _tar = _interopRequireDefault(require("tar"));

var _promise = _interopRequireDefault(require("md5-file/promise"));

var _md = _interopRequireDefault(require("md5"));

var _formData = _interopRequireDefault(require("form-data"));

var _formidable = _interopRequireDefault(require("formidable"));

var _promises = _interopRequireDefault(require("fs/promises"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// eslint-disable-next-line import/no-unresolved
const getRequestKey = (method, url) => {
  return `${method}-${_lodash.default.kebabCase(url)}`;
};

exports.getRequestKey = getRequestKey;

const createGetRecordingFileName = () => {
  const requestCount = {};
  return (method, url) => {
    const requestKey = getRequestKey(method, url);
    const hashedRequestKey = (0, _md.default)(requestKey);
    const currentCallIndex = requestCount[requestKey] || 1;
    requestCount[requestKey] = currentCallIndex + 1;
    return `${hashedRequestKey}-${currentCallIndex}.json`;
  };
};

exports.createGetRecordingFileName = createGetRecordingFileName;

const saveRecording = (directory, filename, request, response) => {
  _fsExtra.default.ensureDirSync(directory);

  const data = {
    method: request.method,
    url: request.url,
    status: response.status,
    data: response.data
  };

  const filePath = _path.default.join(directory, filename);

  _fsExtra.default.writeFileSync(filePath, JSON.stringify(data, 0, 2));
};

exports.saveRecording = saveRecording;

const isRecordingExist = (directory, filename) => {
  const filePath = _path.default.join(directory, filename);

  return _fsExtra.default.existsSync(filePath);
};

exports.isRecordingExist = isRecordingExist;

const readRecording = (directory, filename) => {
  const filePath = _path.default.join(directory, filename);

  return JSON.parse(_fsExtra.default.readFileSync(filePath));
};

exports.readRecording = readRecording;

const resolveDirectory = (archive, directory) => {
  if (archive) return _path.default.join(_os.default.tmpdir(), 'node-playback-server', archive);
  return directory;
};

exports.resolveDirectory = resolveDirectory;

const createArchive = async (archive, directory) => {
  await _fsExtra.default.ensureFile(archive);
  await _tar.default.c({
    file: archive,
    cwd: directory,
    gzip: true
  }, ['./']);
  const archiveHash = await (0, _promise.default)(archive);

  const hashFile = _path.default.join(directory, '.hash');

  await _fsExtra.default.writeFile(hashFile, archiveHash);
};

exports.createArchive = createArchive;

const extractArchive = async (archive, directory) => {
  await _fsExtra.default.remove(directory);
  await _fsExtra.default.ensureDir(directory);
  await _tar.default.x({
    file: archive,
    cwd: directory
  });
  const archiveHash = await (0, _promise.default)(archive);

  const hashFile = _path.default.join(directory, '.hash');

  await _fsExtra.default.writeFile(hashFile, archiveHash);
};

exports.extractArchive = extractArchive;

const isDirectoryInSyncWithArchive = async (archive, directory) => {
  const hashFile = _path.default.join(directory, '.hash');

  await _fsExtra.default.ensureFile(hashFile);
  const directoryHash = await _fsExtra.default.readFile(hashFile, {
    encoding: 'utf8'
  });
  const archiveHash = await (0, _promise.default)(archive);
  return directoryHash === archiveHash;
};

exports.isDirectoryInSyncWithArchive = isDirectoryInSyncWithArchive;

const isFormRequest = request => {
  return /^multipart\/form-data/.test(request.headers['content-type']);
};

exports.isFormRequest = isFormRequest;

const getMultipartPayload = async request => {
  const {
    files,
    fields
  } = await parseForm(request);
  const data = new _formData.default();
  Object.entries(fields).forEach(([key, value]) => {
    data.append(key, value);
  });
  await Promise.all(Object.entries(files).map(async ([key, value]) => {
    const buffer = await _promises.default.readFile(value.path);
    data.append(key, buffer, value.name);
  }));
  return {
    headers: { // let axios set content-length automatically
      ..._lodash.default.omit(request.headers, 'content-length'),
      ...data.getHeaders()
    },
    data: data.getBuffer()
  };
};

exports.getMultipartPayload = getMultipartPayload;

function parseForm(request) {
  return new Promise((resolve, reject) => {
    const form = (0, _formidable.default)({
      multiples: true
    });
    form.parse(request, (error, fields, files) => {
      if (error) reject(error);
      resolve({
        fields,
        files
      });
    });
  });
}

const LEGACY_FORMAT_REGEX = /(.*)-(\d+)\.json$/;

const migrateLegacyFormat = async directory => {
  const files = await _fsExtra.default.readdir(directory);

  for (let i = 0; i < files.length; i += 1) {
    const file = files[i];
    const match = file.match(LEGACY_FORMAT_REGEX);

    if (match) {
      const [, requestKey, callIndex] = match;
      const newFile = `${(0, _md.default)(requestKey)}-${callIndex}.json`; // eslint-disable-next-line no-console

      console.log(`Renaming ${file} \t ${newFile}`); // eslint-disable-next-line no-await-in-loop

      await _fsExtra.default.rename(`${directory}/${file}`, `${directory}/${newFile}`);
    }
  }
};

exports.migrateLegacyFormat = migrateLegacyFormat;