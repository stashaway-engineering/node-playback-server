import _ from 'lodash';
import os from 'os';
import path from 'path';
import fse from 'fs-extra';
import tar from 'tar';
import md5File from 'md5-file/promise';

export const getRequestKey = (method, url) => {
  return `${method}-${_.kebabCase(url)}`;
};

export const createGetRecordingFileName = () => {
  const requestCount = {};

  return (method, url) => {
    const requestKey = getRequestKey(method, url);
    const currentCallIndex = requestCount[requestKey] || 1;
    requestCount[requestKey] = currentCallIndex + 1;
    return `${requestKey}-${currentCallIndex}.json`;
  };
};

export const saveRecording = (directory, filename, request, response) => {
  fse.ensureDirSync(directory);

  const data = {
    method: request.method,
    url: request.url,
    status: response.status,
    data: response.data,
  };

  const filePath = path.join(directory, filename);
  fse.writeFileSync(filePath, JSON.stringify(data, 0, 2));
};

export const isRecordingExist = (directory, filename) => {
  const filePath = path.join(directory, filename);
  return fse.existsSync(filePath);
};

export const readRecording = (directory, filename) => {
  const filePath = path.join(directory, filename);
  return JSON.parse(fse.readFileSync(filePath));
};

export const resolveDirectory = (archive, directory) => {
  if (archive) return path.join(os.tmpdir(), 'node-playback-server', archive);
  return directory;
};

export const createArchive = async (archive, directory) => {
  await fse.ensureFile(archive);
  await tar.c({
    file: archive,
    cwd: directory,
    gzip: true,
  }, ['./']);

  const archiveHash = await md5File(archive);
  const hashFile = path.join(directory, '.hash');
  await fse.writeFile(hashFile, archiveHash);
};

export const extractArchive = async (archive, directory) => {
  await fse.ensureDir(directory);
  await tar.x({
    file: archive,
    cwd: directory,
  });

  const archiveHash = await md5File(archive);
  const hashFile = path.join(directory, '.hash');
  await fse.writeFile(hashFile, archiveHash);
};

export const isDirectoryInSyncWithArchive = async (archive, directory) => {
  const hashFile = path.join(directory, '.hash');
  await fse.ensureFile(hashFile);

  const directoryHash = await fse.readFile(hashFile, { encoding: 'utf8' });
  const archiveHash = await md5File(archive);

  return directoryHash === archiveHash;
};
