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

  const updater = new AutoUpdater(
    process.env['GITHUB_TOKEN'],
    eventData,
    true,
  );

  if (eventName === 'pull_request') {
    ghCore.info('Running on a pull request');
    await updater.handlePullRequest();
  } else if (eventName === 'push') {
    ghCore.info('Running on a push');
    await updater.handlePush();
  } else {
    throw new Error(
      `Unknown event type '${eventName}', only 'push' and 'pull_request' are supported.`
    );
  }
}

if (require.main === module) {
  main().catch((e) => {
    process.exitCode = 1;
    ghCore.setFailed(e.message);
  });
}
