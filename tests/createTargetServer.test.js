import axios from 'axios';
import createTargetServer from './helpers/createTargetServer';

describe('targetServer', () => {
  const TARGET_SERVER_PORT = 9123;
  const TARGET_SERVER_URL = `http://localhost:${TARGET_SERVER_PORT}`;

  let targetServer;

  beforeEach(async () => {
    targetServer = await createTargetServer({
      port: TARGET_SERVER_PORT,
    });
  });

  afterEach(async () => {
    await targetServer.close();
  });

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
