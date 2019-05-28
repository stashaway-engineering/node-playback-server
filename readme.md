# node-playback-server 🇸🇬

[![npm version](https://badge.fury.io/js/node-playback-server.svg)](https://badge.fury.io/js/node-playback-server) [![CircleCI](https://circleci.com/gh/stashaway-engineering/node-playback-server.svg?style=svg)](https://circleci.com/gh/stashaway-engineering/node-playback-server)


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

## TODO

Write better readme