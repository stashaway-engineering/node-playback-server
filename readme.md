# node-playback-server 🇸🇬

[![npm version](https://badge.fury.io/js/node-playback-server.svg)](https://badge.fury.io/js/node-playback-server) [![CircleCI](https://circleci.com/gh/stashaway-engineering/node-playback-server.svg?style=svg)](https://circleci.com/gh/stashaway-engineering/node-playback-server)

Node-playback-server allows you to run your e2e tests against a mock server. See the diagram below for a quick overview.

![Screen Shot 2021-09-03 at 10 17 20 AM](https://user-images.githubusercontent.com/4867178/131940571-38ba4f21-0f6d-4346-b124-58bbd00250e0.png)


## Usage (CLI)

```js
Commands
	
  $ node-playback-server record  Start a recording server
  $ node-playback-server play    Start a playback server
  $ node-playback-server clean   Clears temp directory
	
OPTIONS
	
  --port (p)           Server port (optional)
  --archive (x)        Recording archive (use either archive or directory)
  --directory (d)      Recording directory (use either archive or directory)
  --target (t)         Server to forward request onto (record mode)
  --loglevel (l)       Server log level (1 to 5)
```


## Usage (Node)

### Record
	
```
import { createRecordingServer } from 'node-playback-server';

describe('login', () => {
  let recordingServer;

  beforeEach(async () => {
    recordingServer = await createRecordingServer({
      target: 'https://api.stashaway.sg',
      archive: './recording/login.tgz',
    });
  });

  afterEach(async () => {
    await recordingServer.close();
  });

  it('serves response from archive', async () => {
    const baseURL = `http://localhost:${recordingServer.port}`;
    // Now any request to baseURL will be proxied to target ('https://api.stashaway.sg') 
    // and recorded to archive './recording/login.tgz'
  });
});
```

### Playback
	
```
import { createPlaybackServer } from 'node-playback-server';

describe('login', () => {
  let playbackServer;

  beforeEach(async () => {
    playbackServer = await createPlaybackServer({
      archive: './recording/login.tgz',
    });
  });

  afterEach(async () => {
    await playbackServer();
  });

  it('proxies GET request and record them', async () => {
    const baseURL = `http://localhost:${recordingServer.port}`;
    // Now any request to baseURL will be served from stored response 
  });
});
```

## Difference from prior works

1. Integrates nicely with node ecosystem so you can spawn a playback-server on your test runner.
2. Handles cases when the recording responses changes.
    - e.g. `GET /user/profile` responses might changes depending whether user has finished onboarding, this library records them as 2 separate JSON files.

## Improvements

1. Allows forwarding of multipart-form data (Currently, it only works for JSON responses)
