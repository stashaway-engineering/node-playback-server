import fse from 'fs-extra';
import axios from 'axios';
import FormData from 'form-data';
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

  it('proxies GET request without any body and record them', async () => {
    const requestSpy = jest.spyOn(axios, 'request');
    const response = await axios.get(`${RECORDING_SERVER_URL}/static`);
    expect(requestSpy).toHaveBeenCalledWith({
      baseURL: TARGET_SERVER_URL,
      data: undefined,
      url: '/static',
      method: 'GET',
      headers: expect.any(Object),
    });
    expect(response.data).toEqual({ data: 'get-static' });
    expect(fse.existsSync(`${RECORDING_DIR}/b7d15bb25a0657562f3984f7519cc594-1.json`)).toEqual(true);
  });

  it('proxies POST request and record them', async () => {
    const response = await axios.post(`${RECORDING_SERVER_URL}/static`, { data: 'post-data' });
    expect(response.data).toEqual({ data: 'post-static--post-data' });
    expect(fse.existsSync(`${RECORDING_DIR}/52a1a7a471169f14486d060fdd85653b-1.json`)).toEqual(true);
  });

  it('proxies multipart/form-data request with a single file per field and record them', async () => {
    const data = new FormData();
    data.append('name', 'Fred');
    data.append('file', Buffer.from('hello world'), 'hello.txt');

    const response = await axios({
      url: `${RECORDING_SERVER_URL}/multipart`,
      method: 'post',
      data: data.getBuffer(),
      headers: {
        ...data.getHeaders(),
      },
    });
    expect(response.data).toEqual({ data: 'post-static--multipart' });
    expect(fse.existsSync(`${RECORDING_DIR}/7dc4335c8eff6fe9b981290e2fd42b4a-1.json`)).toEqual(true);
  });

  it('proxies multipart/form-data request with multiple files per field and record them', async () => {
    const data = new FormData();
    data.append('files', Buffer.from('hello world 1'), 'hello_1.txt');
    data.append('files', Buffer.from('hello world 2'), 'hello_2.txt');

    const response = await axios({
      url: `${RECORDING_SERVER_URL}/multipart`,
      method: 'post',
      data: data.getBuffer(),
      headers: {
        ...data.getHeaders(),
      },
    });
    expect(response.data).toEqual({ data: 'post-static--multipart' });
    expect(fse.existsSync(`${RECORDING_DIR}/7dc4335c8eff6fe9b981290e2fd42b4a-1.json`)).toEqual(true);
  });

  it('proxies errors request and record them', async () => {
    await expect(axios.post(`${RECORDING_SERVER_URL}/not-found`)).rejects.toThrow('Request failed with status code 404');
    expect(fse.existsSync(`${RECORDING_DIR}/f96d2745c4cd5944206645d97ed5c5c9-1.json`)).toEqual(true);
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

  it('handles longer url and hash the resulting file accordingly', async () => {
    const response = await axios.get(
      // eslint-disable-next-line max-len
      `${RECORDING_SERVER_URL}/api/v1/goals/templates?goalTypes=ESG%2CGENERAL_INVESTING%2CINCOME%2CMMF%2CRETIREMENT%2CBUY_A_HOME%2CCHILD_EDUCATION%2CVEHICLE%2CEMERGENCY_FUND%2CSTART_BUSINESS%2CWEDDING%2CTRAVEL`,
    );
    expect(response.data).toEqual({ data: 'get-longer-url' });
    expect(fse.existsSync(`${RECORDING_DIR}/9d46377c618dcaf937cfb068bb53d8ea-1.json`)).toEqual(true);
  });
});
