import axios from 'axios';
import createTargetServer from './createTargetServer';
import createRecordingServer from '../lib/createRecordingServer';

describe('mockserver', () => {
  const targetServerPort = 9123;
  const targetServerUrl = `http://localhost:${targetServerPort}`;

  const recordingServerPort = 9124;
  const recordingServerUrl = `http://localhost:${recordingServerPort}`;

  let targetServer;
  let recordingServer;

  beforeEach(async () => {
    targetServer = await createTargetServer({
      port: targetServerPort,
    });
    recordingServer = await createRecordingServer({
      target: targetServerUrl,
      port: recordingServerPort,
    });
  });

  afterEach(async () => {
    await targetServer.close();
    await recordingServer.close();
  });

  describe('targetServer', () => {
    it('returns static data for /static', async () => {
      const response = await axios.get(`${targetServerUrl}/static`);
      expect(response.data).toEqual({ data: 'get-static' });
    });

    it('returns dynamic data for /counter', async () => {
      const response1 = await axios.get(`${targetServerUrl}/counter`);
      const response2 = await axios.get(`${targetServerUrl}/counter`);
      const response3 = await axios.get(`${targetServerUrl}/counter`);
      const response4 = await axios.get(`${targetServerUrl}/counter`);

      expect(response1.data).toEqual({ data: 'get-counter-1' });
      expect(response2.data).toEqual({ data: 'get-counter-2' });
      expect(response3.data).toEqual({ data: 'get-counter-3' });
      expect(response4.data).toEqual({ data: 'get-counter-4' });
    });

    it('returns static data for /static', async () => {
      const response = await axios.post(`${targetServerUrl}/static`, { data: 'post-data' });
      expect(response.data).toEqual({ data: 'post-static--post-data' });
    });

    it('returns not-found for undefined routes', async () => {
      await expect(axios.post(`${targetServerUrl}/not-found`)).rejects.toThrow('Request failed with status code 404');
    });
  });

  describe('recordingServer', () => {
    describe('proxies requests', () => {
      it('proxies GET', async () => {
        const response = await axios.get(`${recordingServerUrl}/static`);
        expect(response.data).toEqual({ data: 'get-static' });
      });

      it('proxies POST', async () => {
        const response = await axios.post(`${recordingServerUrl}/static`, { data: 'post-data' });
        expect(response.data).toEqual({ data: 'post-static--post-data' });
      });

      it('proxies errors', async () => {
        await expect(axios.post(`${recordingServerUrl}/not-found`)).rejects.toThrow('Request failed with status code 404');
      });
    });
  });
});
