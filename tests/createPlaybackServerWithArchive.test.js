import axios from 'axios';
import fse from 'fs-extra';
import createTargetServer from './helpers/createTargetServer';
import { createRecordingServer, createPlaybackServer } from '../lib';

describe('playbackServer (with archive)', () => {
  const TARGET_SERVER_PORT = 9123;
  const TARGET_SERVER_URL = `http://localhost:${TARGET_SERVER_PORT}`;

  let targetServer;
  let recordingServer;
  let playbackServer;

  beforeEach(async () => {
    targetServer = await createTargetServer({
      port: TARGET_SERVER_PORT,
    });
  });

  afterEach(async () => {
    await targetServer.close();
    await recordingServer && recordingServer.close();
    await playbackServer && playbackServer.close();
  });

  it('stores recording in an archive file', async () => {
    const temporaryArchive = `./.recording/${+new Date()}.tgz`;

    // Record
    recordingServer = await createRecordingServer({
      target: TARGET_SERVER_URL,
      archive: temporaryArchive,
      loglevel: 5,
    });
    await axios.get(`http://localhost:${recordingServer.port}/static`);
    await recordingServer.close();

    // Playback
    playbackServer = await createPlaybackServer({
      archive: temporaryArchive,
      loglevel: 5,
    });
    const response = await axios.get(`http://localhost:${playbackServer.port}/static`);
    expect(response.data).toEqual({ data: 'get-static' });
    await playbackServer.close();

    expect(fse.existsSync(temporaryArchive)).toEqual(true);

    // Cleanup
    await fse.remove(temporaryArchive);
  });

  it('replays requests from a fixed archive', async () => {
    const archiveFile = './tests/archive.tgz';

    playbackServer = await createPlaybackServer({
      archive: archiveFile,
      loglevel: 5,
    });

    // Playback
    const response1 = await axios.get(`http://localhost:${playbackServer.port}/counter`);
    const response2 = await axios.get(`http://localhost:${playbackServer.port}/counter`);
    const response3 = await axios.get(`http://localhost:${playbackServer.port}/counter`);
    const response4 = await axios.get(`http://localhost:${playbackServer.port}/counter`);

    expect(response1.data).toEqual({ data: 'get-counter-1' });
    expect(response2.data).toEqual({ data: 'get-counter-2' });
    expect(response3.data).toEqual({ data: 'get-counter-3' });
    expect(response4.data).toEqual({ data: 'get-counter-3' });
  });
});
