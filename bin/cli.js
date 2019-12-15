#!/usr/bin/env node
const process = require('process');

const AutoUpdater = require('../src/autoupdater.js');

async function main() {
  updater = new AutoUpdater({
    githubToken: process.env['GITHUB_TOKEN'],
    pullRequest: 'PR-1',
    repository: 'chinthakagodawita/autoupdate-action',
  });
  await updater.run();
}

if (require.main === module) {
  main().catch((e) => {
    process.exitCode = 1;
    console.log(e);
  });
}
