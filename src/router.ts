import { AutoUpdater } from '../src/autoupdater';
import { ConfigLoader } from '../src/config-loader';

export class Router {
  eventData: any;
  updater: AutoUpdater;

  constructor(
    config: ConfigLoader,
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    eventData: any,
  ) {
    this.updater = new AutoUpdater(config, eventData);
  }

  /**
   * Route a Github event to a handler.
   *
   * @param eventName
   * @returns {Promise<void>}
   */
  async route(eventName: string | undefined): Promise<void> {
    if (eventName === 'pull_request') {
      await this.updater.handlePullRequest();
    } else if (eventName === 'push') {
      await this.updater.handlePush();
    } else {
      throw new Error(
        `Unknown event type '${eventName}', only 'push' and 'pull_request' are supported.`,
      );
    }
  }
}
