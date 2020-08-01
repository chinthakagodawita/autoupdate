import config from '../src/config-loader';
import { AutoUpdater } from '../src/autoupdater';
import { Router } from '../src/router';

jest.mock('../src/config-loader');
jest.mock('../src/autoupdater');

beforeEach(() => {
  jest.resetAllMocks();
});

test('invalid event name', async () => {
  const router = new Router(config, {});
  expect(AutoUpdater).toHaveBeenCalledTimes(1);

  const eventName = 'not-a-real-event';
  await expect(router.route(eventName)).rejects.toThrowError(
    `Unknown event type '${eventName}', only 'push' and 'pull_request' are supported.`,
  );

  const autoUpdateInstance = (AutoUpdater as jest.Mock).mock.instances[0];
  expect(autoUpdateInstance.handlePush).toHaveBeenCalledTimes(0);
  expect(autoUpdateInstance.handlePullRequest).toHaveBeenCalledTimes(0);
});

test('"push" events', async () => {
  const router = new Router(config, {});
  expect(AutoUpdater).toHaveBeenCalledTimes(1);

  await router.route('push');

  const autoUpdateInstance = (AutoUpdater as jest.Mock).mock.instances[0];
  expect(autoUpdateInstance.handlePush).toHaveBeenCalledTimes(1);
});

test('"pull_request" events', async () => {
  const router = new Router(config, {});
  expect(AutoUpdater).toHaveBeenCalledTimes(1);

  await router.route('pull_request');

  const autoUpdateInstance = (AutoUpdater as jest.Mock).mock.instances[0];
  expect(autoUpdateInstance.handlePullRequest).toHaveBeenCalledTimes(1);
});
