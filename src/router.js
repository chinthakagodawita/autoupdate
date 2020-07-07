const AutoUpdater = require('./autoupdater');

class Router {
  constructor(config, eventData) {
    this.updater = new AutoUpdater(config, eventData, true);
  }

  /**
   * Route a Github event to a handler.
   *
   * @param eventName
   * @returns {Promise<void>}
   */
  async route(eventName) {
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

module.exports = Router;
