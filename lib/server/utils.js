import _ from 'lodash';
import path from 'path';
import fse from 'fs-extra';

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
