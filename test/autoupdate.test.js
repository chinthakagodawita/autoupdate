const github = require('@actions/github');
const config = require('../src/config-loader');
const AutoUpdater = require('../src/autoupdater');

jest.mock('@actions/github');
jest.mock('@actions/core');

beforeEach(() => {
  jest.resetAllMocks();
})

test('constructor', () => {
  // eslint-disable-next-line no-unused-vars
  const updater = new AutoUpdater(config, {});
  expect(github.GitHub).toHaveBeenCalledTimes(1);
});
