#!/usr/bin/env node
const process = require('process');
const fs = require('fs');

const ghCore = require('@actions/core');

const AutoUpdater = require('../src/autoupdater.js');

async function main() {
  const eventPath = process.env['GITHUB_EVENT_PATH'];

  const eventData = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
  
  ghCore.debug(eventData);

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
