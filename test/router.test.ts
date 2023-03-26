import config from '../src/config-loader';
import { AutoUpdater } from '../src/autoupdater';
import { Router } from '../src/router';
import { WebhookEvent } from '@octokit/webhooks-types/schema';

jest.mock('../src/config-loader');
jest.mock('../src/autoupdater');

beforeEach(() => {
  jest.resetAllMocks();
});

test('invalid event name', async () => {
  const router = new Router(config, {} as WebhookEvent);
  expect(AutoUpdater).toHaveBeenCalledTimes(1);

  const eventName = 'not-a-real-event';
  await expect(router.route(eventName)).rejects.toThrowError(
    `Unknown event type '${eventName}', only 'push', 'pull_request', 'workflow_run', and 'schedule' are supported.`,
  );

  const autoUpdateInstance = (AutoUpdater as jest.Mock).mock.instances[0];
  expect(autoUpdateInstance.handlePush).toHaveBeenCalledTimes(0);
  expect(autoUpdateInstance.handlePullRequest).toHaveBeenCalledTimes(0);
});

test('"push" events', async () => {
  const router = new Router(config, {} as WebhookEvent);
  expect(AutoUpdater).toHaveBeenCalledTimes(1);

  await router.route('push');

  const autoUpdateInstance = (AutoUpdater as jest.Mock).mock.instances[0];
  expect(autoUpdateInstance.handlePush).toHaveBeenCalledTimes(1);
});

test('"pull_request" events', async () => {
  const router = new Router(config, {} as WebhookEvent);
  expect(AutoUpdater).toHaveBeenCalledTimes(1);

  await router.route('pull_request');

  const autoUpdateInstance = (AutoUpdater as jest.Mock).mock.instances[0];
  expect(autoUpdateInstance.handlePullRequest).toHaveBeenCalledTimes(1);
});

test('"workflow_run" events', async () => {
  const router = new Router(config, {} as WebhookEvent);
  expect(AutoUpdater).toHaveBeenCalledTimes(1);

  await router.route('workflow_run');

  const autoUpdateInstance = (AutoUpdater as jest.Mock).mock.instances[0];
  expect(autoUpdateInstance.handleWorkflowRun).toHaveBeenCalledTimes(1);
});

test('"workflow_dispatch" events', async () => {
  const router = new Router(config, {} as WebhookEvent);
  expect(AutoUpdater).toHaveBeenCalledTimes(1);

  await router.route('workflow_dispatch');

  const autoUpdateInstance = (AutoUpdater as jest.Mock).mock.instances[0];
  expect(autoUpdateInstance.handleWorkflowDispatch).toHaveBeenCalledTimes(1);
});

test('"schedule" events', async () => {
  const router = new Router(config, {} as WebhookEvent);
  expect(AutoUpdater).toHaveBeenCalledTimes(1);

  await router.route('schedule');

  const autoUpdateInstance = (AutoUpdater as jest.Mock).mock.instances[0];
  expect(autoUpdateInstance.handleSchedule).toHaveBeenCalledTimes(1);
});
