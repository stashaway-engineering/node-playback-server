import fse from 'fs-extra';
import axios from 'axios';
import createTargetServer from './createTargetServer';
import { createRecordingServer, createPlaybackServer } from '../lib';

describe('playbackserver', () => {
  const TARGET_SERVER_PORT = 9123;
  const TARGET_SERVER_URL = `http://localhost:${TARGET_SERVER_PORT}`;

  const RECORDING_SERVER_PORT = 9124;
  const RECORDING_SERVER_URL = `http://localhost:${RECORDING_SERVER_PORT}`;

  const PLAYBACK_SERVER_PORT = 9125;
  const PLAYBACK_SERVER_URL = `http://localhost:${PLAYBACK_SERVER_PORT}`;

  const RECORDING_DIR = './tests/recording/';

  let targetServer;
  let recordingServer;
  let playbackServer;

  beforeEach(async () => {
    await fse.remove(RECORDING_DIR);

    targetServer = await createTargetServer({
      port: TARGET_SERVER_PORT,
    });

    recordingServer = await createRecordingServer({
      target: TARGET_SERVER_URL,
      port: RECORDING_SERVER_PORT,
      directory: RECORDING_DIR,
      loglevel: 5,
    });

    playbackServer = await createPlaybackServer({
      port: PLAYBACK_SERVER_PORT,
      directory: RECORDING_DIR,
      loglevel: 5,
    });
  });

  afterEach(async () => {
    await targetServer.close();
    await recordingServer.close();
    await playbackServer.close();
  });

  describe('targetServer', () => {
    it('returns static data for /static', async () => {
      const response = await axios.get(`${TARGET_SERVER_URL}/static`);
      expect(response.data).toEqual({ data: 'get-static' });
    });

    it('returns dynamic data for /counter', async () => {
      const response1 = await axios.get(`${TARGET_SERVER_URL}/counter`);
      const response2 = await axios.get(`${TARGET_SERVER_URL}/counter`);
      const response3 = await axios.get(`${TARGET_SERVER_URL}/counter`);
      const response4 = await axios.get(`${TARGET_SERVER_URL}/counter`);

      expect(response1.data).toEqual({ data: 'get-counter-1' });
      expect(response2.data).toEqual({ data: 'get-counter-2' });
      expect(response3.data).toEqual({ data: 'get-counter-3' });
      expect(response4.data).toEqual({ data: 'get-counter-4' });
    });

    it('returns static data for /static', async () => {
      const response = await axios.post(`${TARGET_SERVER_URL}/static`, { data: 'post-data' });
      expect(response.data).toEqual({ data: 'post-static--post-data' });
    });

    it('returns not-found for undefined routes', async () => {
      await expect(axios.post(`${TARGET_SERVER_URL}/not-found`)).rejects.toThrow('Request failed with status code 404');
    });
  });

  describe('recordingServer', () => {
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

  describe('playbackServer', () => {
    it('replays simple request', async () => {
      // Record
      await axios.get(`${RECORDING_SERVER_URL}/static`);

      // Playback
      const response = await axios.get(`${PLAYBACK_SERVER_URL}/static`);
      expect(response.data).toEqual({ data: 'get-static' });
    });

    it('replays changing requests', async () => {
      // Record
      await axios.get(`${RECORDING_SERVER_URL}/counter`);
      await axios.get(`${RECORDING_SERVER_URL}/counter`);
      await axios.get(`${RECORDING_SERVER_URL}/counter`);

      // Playback
      const response1 = await axios.get(`${PLAYBACK_SERVER_URL}/counter`);
      const response2 = await axios.get(`${PLAYBACK_SERVER_URL}/counter`);
      const response3 = await axios.get(`${PLAYBACK_SERVER_URL}/counter`);
      const response4 = await axios.get(`${PLAYBACK_SERVER_URL}/counter`);

      expect(response1.data).toEqual({ data: 'get-counter-1' });
      expect(response2.data).toEqual({ data: 'get-counter-2' });
      expect(response3.data).toEqual({ data: 'get-counter-3' });

      // Use the last recording since we only record 3 calls
      expect(response4.data).toEqual({ data: 'get-counter-3' });
    });
  });
});
