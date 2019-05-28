import fse from 'fs-extra';
import axios from 'axios';
import createTargetServer from './helpers/createTargetServer';
import { createRecordingServer } from '../lib';

describe('recordingServer', () => {
  const TARGET_SERVER_PORT = 9123;
  const TARGET_SERVER_URL = `http://localhost:${TARGET_SERVER_PORT}`;

  const RECORDING_SERVER_PORT = 9124;
  const RECORDING_SERVER_URL = `http://localhost:${RECORDING_SERVER_PORT}`;

  const RECORDING_DIR = './tests/recording/';

  let targetServer;
  let recordingServer;

  beforeEach(async () => {
    targetServer = await createTargetServer({
      port: TARGET_SERVER_PORT,
    });

    recordingServer = await createRecordingServer({
      target: TARGET_SERVER_URL,
      port: RECORDING_SERVER_PORT,
      directory: RECORDING_DIR,
      loglevel: 5,
    });
  });

  afterEach(async () => {
    await targetServer.close();
    await recordingServer.close();
  });

  it('proxies GET request and record them', async () => {
    const response = await axios.get(`${RECORDING_SERVER_URL}/static`);
    expect(response.data).toEqual({ data: 'get-static' });
    expect(fse.existsSync(`${RECORDING_DIR}/GET-static-1.json`)).toEqual(true);
  });

  it('proxies POST request and record them', async () => {
    const response = await axios.post(`${RECORDING_SERVER_URL}/static`, { data: 'post-data' });
    expect(response.data).toEqual({ data: 'post-static--post-data' });
    expect(fse.existsSync(`${RECORDING_DIR}/POST-static-1.json`)).toEqual(true);
  });

  it('proxies errors request and record them', async () => {
    await expect(axios.post(`${RECORDING_SERVER_URL}/not-found`)).rejects.toThrow('Request failed with status code 404');
    expect(fse.existsSync(`${RECORDING_DIR}/POST-not-found-1.json`)).toEqual(true);
  });

  it('records multiple calls to the same endpoint as different recordings', async () => {
    const response1 = await axios.get(`${RECORDING_SERVER_URL}/counter`);
    const response2 = await axios.get(`${RECORDING_SERVER_URL}/counter`);
    const response3 = await axios.get(`${RECORDING_SERVER_URL}/counter`);
    const response4 = await axios.get(`${RECORDING_SERVER_URL}/counter`);

    expect(response1.data).toEqual({ data: 'get-counter-1' });
    expect(response2.data).toEqual({ data: 'get-counter-2' });
    expect(response3.data).toEqual({ data: 'get-counter-3' });
    expect(response4.data).toEqual({ data: 'get-counter-4' });
  });
});
