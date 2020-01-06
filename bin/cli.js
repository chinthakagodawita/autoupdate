#!/usr/bin/env node
const fs = require('fs');

const ghCore = require('@actions/core');

const AutoUpdater = require('../src/autoupdater');
const config = require('../src/lib/config');

async function main() {
  const eventPath = process.env['GITHUB_EVENT_PATH'];
  const eventName = process.env['GITHUB_EVENT_NAME'];

  const rawEventData = fs.readFileSync(eventPath, 'utf8');
  const eventData = JSON.parse(rawEventData);

  ghCore.debug(`EVENT NAME: ${eventName}`);
  ghCore.debug(`EVENT DATA: ${rawEventData}`);

  if (config.dryRun()) {
    ghCore.info(
      `Detected DRY_RUN=true, running in dry mode - no merges will be made.`
    );
  }

  const updater = new AutoUpdater(
    config,
    eventData,
  );

  if (eventName === 'pull_request') {
    await updater.handlePullRequest();
  } else if (eventName === 'push') {
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
