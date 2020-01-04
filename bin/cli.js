#!/usr/bin/env node
const process = require('process');
const fs = require('fs');

const ghCore = require('@actions/core');

const AutoUpdater = require('../src/autoupdater.js');

async function main() {
  const eventPath = process.env['GITHUB_EVENT_PATH'];
  const eventName = process.env['GITHUB_EVENT_NAME'];

  const rawEventData = fs.readFileSync(eventPath, 'utf8');
  const eventData = JSON.parse(rawEventData);
  
  ghCore.debug(`EVENT NAME: ${eventName}`);
  ghCore.debug(`EVENT DATA: ${rawEventData}`);

  if (eventName === 'pull_reqeust') {
    ghCore.info('Running on a pull request');
  } else if (eventName === 'push') {
    ghCore.info('Running on a push');
  } else {
    throw new Error(
      `Unknown event type '${eventName}', only 'push' and 'pull_request' are supported.`
    );
  }

  // updater = new AutoUpdater({
  //   githubToken: process.env['GITHUB_TOKEN'],
  //   pullRequest: process.env[],
  //   repository: process.env['GITHUB_REPOSITORY'],
  // });
  // await updater.run();
}

if (require.main === module) {
  main().catch((e) => {
    process.exitCode = 1;
    ghCore.setFailed(e.message);
  });
}
