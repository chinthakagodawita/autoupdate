// Workaround for tests attempting to hit the GH API if running in an env where
// this variable is automatically set.
if ('GITHUB_TOKEN' in process.env) {
  delete process.env.GITHUB_TOKEN;
}

import nock from 'nock';
import config from '../src/config-loader';
import { AutoUpdater } from '../src/autoupdater';

jest.mock('../src/config-loader');

beforeEach(() => {
  jest.resetAllMocks();
});

const owner = 'chinthakagodawita';
const repo = 'not-a-real-repo';
const base = 'master';
const head = 'develop';
const validPull = {
  number: 1,
  merged: false,
  state: 'open',
  labels: [
    {
      id: 1,
      name: 'one',
    },
    {
      id: 2,
      name: 'two',
    },
  ],
  base: {
    ref: base,
    label: base,
  },
  head: {
    label: head,
    ref: head,
    repo: {
      name: repo,
      owner: {
        login: owner,
      },
    },
  },
};
const clonePull = () => JSON.parse(JSON.stringify(validPull));

describe('test `prNeedsUpdate`', () => {
  test('pull request has already been merged', async () => {
    const pull = {
      merged: true,
    };

    // const config = new ConfigLoader();
    const updater = new AutoUpdater(config, {});
    const needsUpdate = await updater.prNeedsUpdate(pull);
    expect(needsUpdate).toEqual(false);
  });

  test('pull request is not open', async () => {
    const pull = {
      merged: false,
      state: 'closed',
    };

    // const config = new ConfigLoader();
    const updater = new AutoUpdater(config, {});
    const needsUpdate = await updater.prNeedsUpdate(pull);
    expect(needsUpdate).toEqual(false);
  });

  test('pull request is not behind', async () => {
    const scope = nock('https://api.github.com:443')
      .get(`/repos/${owner}/${repo}/compare/${head}...${base}`)
      .reply(200, {
        behind_by: 0,
      });

    // const config = new ConfigLoader();
    const updater = new AutoUpdater(config, {});
    const needsUpdate = await updater.prNeedsUpdate(validPull);

    expect(needsUpdate).toEqual(false);
    expect(scope.isDone()).toEqual(true);
  });

  test('no pull request labels were configured', async () => {
    // const config = new ConfigLoader();
    (config.pullRequestFilter as jest.Mock).mockReturnValue('labelled');
    (config.pullRequestLabels as jest.Mock).mockReturnValue([]);

    const scope = nock('https://api.github.com:443')
      .get(`/repos/${owner}/${repo}/compare/${head}...${base}`)
      .reply(200, {
        behind_by: 1,
      });

    const updater = new AutoUpdater(config, {});
    const needsUpdate = await updater.prNeedsUpdate(validPull);

    expect(needsUpdate).toEqual(false);
    expect(scope.isDone()).toEqual(true);
    expect(config.pullRequestFilter).toHaveBeenCalled();
    expect(config.pullRequestLabels).toHaveBeenCalled();
  });

  test('pull request has no labels', async () => {
    // const config = new ConfigLoader();
    (config.pullRequestFilter as jest.Mock).mockReturnValue('labelled');
    (config.pullRequestLabels as jest.Mock).mockReturnValue(['one', 'two']);

    const scope = nock('https://api.github.com:443')
      .get(`/repos/${owner}/${repo}/compare/${head}...${base}`)
      .reply(200, {
        behind_by: 1,
      });

    const updater = new AutoUpdater(config, {});
    const pull = clonePull();
    pull.labels = [];
    const needsUpdate = await updater.prNeedsUpdate(pull);

    expect(needsUpdate).toEqual(false);
    expect(scope.isDone()).toEqual(true);
    expect(config.pullRequestFilter).toHaveBeenCalled();
    expect(config.pullRequestLabels).toHaveBeenCalled();
  });

  test('pull request labels do not match', async () => {
    // const config = new ConfigLoader();
    (config.pullRequestFilter as jest.Mock).mockReturnValue('labelled');
    (config.pullRequestLabels as jest.Mock).mockReturnValue(['three', 'four']);

    const scope = nock('https://api.github.com:443')
      .get(`/repos/${owner}/${repo}/compare/${head}...${base}`)
      .reply(200, {
        behind_by: 1,
      });

    const updater = new AutoUpdater(config, {});
    const needsUpdate = await updater.prNeedsUpdate(validPull);

    expect(needsUpdate).toEqual(false);
    expect(scope.isDone()).toEqual(true);
    expect(config.pullRequestFilter).toHaveBeenCalled();
    expect(config.pullRequestLabels).toHaveBeenCalled();
  });

  test('pull request labels do match', async () => {
    // const config = new ConfigLoader();
    (config.pullRequestFilter as jest.Mock).mockReturnValue('labelled');
    (config.pullRequestLabels as jest.Mock).mockReturnValue(['three', 'four']);

    const scope = nock('https://api.github.com:443')
      .get(`/repos/${owner}/${repo}/compare/${head}...${base}`)
      .reply(200, {
        behind_by: 1,
      });

    const updater = new AutoUpdater(config, {});
    const pull = clonePull();
    pull.labels = [
      {
        id: 3,
        name: 'three',
      },
    ];
    const needsUpdate = await updater.prNeedsUpdate(pull);

    expect(needsUpdate).toEqual(true);
    expect(scope.isDone()).toEqual(true);
  });

  test('pull request is against protected branch', async () => {
    // const config = new ConfigLoader();
    (config.pullRequestFilter as jest.Mock).mockReturnValue('protected');

    const comparePr = nock('https://api.github.com:443')
      .get(`/repos/${owner}/${repo}/compare/${head}...${base}`)
      .reply(200, {
        behind_by: 1,
      });

    const getBranch = nock('https://api.github.com:443')
      .get(`/repos/${owner}/${repo}/branches/${base}`)
      .reply(200, {
        protected: true,
      });

    const updater = new AutoUpdater(config, {});
    const needsUpdate = await updater.prNeedsUpdate(validPull);

    expect(needsUpdate).toEqual(true);
    expect(comparePr.isDone()).toEqual(true);
    expect(getBranch.isDone()).toEqual(true);
    expect(config.pullRequestFilter).toHaveBeenCalled();
  });

  test('pull request is not against protected branch', async () => {
    // const config = new ConfigLoader();
    (config.pullRequestFilter as jest.Mock).mockReturnValue('protected');

    const comparePr = nock('https://api.github.com:443')
      .get(`/repos/${owner}/${repo}/compare/${head}...${base}`)
      .reply(200, {
        behind_by: 1,
      });

    const getBranch = nock('https://api.github.com:443')
      .get(`/repos/${owner}/${repo}/branches/${base}`)
      .reply(200, {
        protected: false,
      });

    const updater = new AutoUpdater(config, {});
    const needsUpdate = await updater.prNeedsUpdate(validPull);

    expect(needsUpdate).toEqual(false);
    expect(comparePr.isDone()).toEqual(true);
    expect(getBranch.isDone()).toEqual(true);
    expect(config.pullRequestFilter).toHaveBeenCalled();
  });

  test('no filters configured', async () => {
    // const config = new ConfigLoader();
    (config.pullRequestFilter as jest.Mock).mockReturnValue('all');

    const comparePr = nock('https://api.github.com:443')
      .get(`/repos/${owner}/${repo}/compare/${head}...${base}`)
      .reply(200, {
        behind_by: 1,
      });

    const updater = new AutoUpdater(config, {});
    const needsUpdate = await updater.prNeedsUpdate(validPull);

    expect(needsUpdate).toEqual(true);
    expect(comparePr.isDone()).toEqual(true);
    expect(config.pullRequestFilter).toHaveBeenCalled();
  });
});

describe('test `handlePush`', () => {
  const branch = 'not-a-real-branch';
  const dummyEvent = {
    ref: `refs/heads/${branch}`,
    repository: {
      owner: {
        name: owner,
      },
      name: repo,
    },
  };
  const cloneEvent = () => JSON.parse(JSON.stringify(dummyEvent));

  test('push event on a non-branch', async () => {
    const event = cloneEvent();
    event.ref = 'not-a-branch';

    // const config = new ConfigLoader();
    const updater = new AutoUpdater(config, event);

    const updateSpy = jest.spyOn(updater, 'update').mockResolvedValue(true);

    const updated = await updater.handlePush();

    expect(updated).toEqual(0);
    expect(updateSpy).toHaveBeenCalledTimes(0);
  });

  test('push event on a branch without any PRs', async () => {
    // const config = new ConfigLoader();
    const updater = new AutoUpdater(config, dummyEvent);

    const updateSpy = jest.spyOn(updater, 'update').mockResolvedValue(true);

    const scope = nock('https://api.github.com:443')
      .get(
        `/repos/${owner}/${repo}/pulls?base=${branch}&state=open&sort=updated&direction=desc`,
      )
      .reply(200, []);

    const updated = await updater.handlePush();

    expect(updated).toEqual(0);
    expect(updateSpy).toHaveBeenCalledTimes(0);
    expect(scope.isDone()).toEqual(true);
  });

  test('push event on a branch with PRs', async () => {
    // const config = new ConfigLoader();
    const updater = new AutoUpdater(config, dummyEvent);

    const pullsMock = [];
    const expectedPulls = 5;
    for (let i = 0; i < expectedPulls; i++) {
      pullsMock.push({
        id: i,
        number: i,
      });
    }

    const updateSpy = jest.spyOn(updater, 'update').mockResolvedValue(true);

    const scope = nock('https://api.github.com:443')
      .get(
        `/repos/${owner}/${repo}/pulls?base=${branch}&state=open&sort=updated&direction=desc`,
      )
      .reply(200, pullsMock);

    const updated = await updater.handlePush();

    expect(updated).toEqual(expectedPulls);
    expect(updateSpy).toHaveBeenCalledTimes(expectedPulls);
    expect(scope.isDone()).toEqual(true);
  });
});

describe('test `handlePullRequest`', () => {
  test('pull request event with an update triggered', async () => {
    // const config = new ConfigLoader();
    const updater = new AutoUpdater(config, {
      action: 'dummy-action',
    });

    const updateSpy = jest.spyOn(updater, 'update').mockResolvedValue(true);
    const updated = await updater.handlePullRequest();

    expect(updated).toEqual(true);
    expect(updateSpy).toHaveBeenCalledTimes(1);
  });

  test('pull request event without an update', async () => {
    // const config = new ConfigLoader();
    const updater = new AutoUpdater(config, {
      action: 'dummy-action',
    });

    const updateSpy = jest.spyOn(updater, 'update').mockResolvedValue(false);
    const updated = await updater.handlePullRequest();

    expect(updated).toEqual(false);
    expect(updateSpy).toHaveBeenCalledTimes(1);
  });
});

describe('test `update`', () => {
  test('when a pull request does not need an update', async () => {
    // const config = new ConfigLoader();
    const updater = new AutoUpdater(config, {});
    const updateSpy = jest
      .spyOn(updater, 'prNeedsUpdate')
      .mockResolvedValue(false);
    const needsUpdate = await updater.update(<any>validPull);
    expect(needsUpdate).toEqual(false);
    expect(updateSpy).toHaveBeenCalledTimes(1);
  });

  test('dry run mode', async () => {
    // const config = new ConfigLoader();
    (config.dryRun as jest.Mock).mockReturnValue(true);
    const updater = new AutoUpdater(config, {});
    const updateSpy = jest
      .spyOn(updater, 'prNeedsUpdate')
      .mockResolvedValue(true);
    const mergeSpy = jest.spyOn(updater, 'merge');
    const needsUpdate = await updater.update(<any>validPull);

    expect(needsUpdate).toEqual(true);
    expect(updateSpy).toHaveBeenCalledTimes(1);
    expect(mergeSpy).toHaveBeenCalledTimes(0);
  });

  test('custom merge message', async () => {
    // const config = new ConfigLoader();
    const mergeMsg = 'dummy-merge-msg';
    (config.mergeMsg as jest.Mock).mockReturnValue(mergeMsg);
    const updater = new AutoUpdater(config, {});

    const updateSpy = jest
      .spyOn(updater, 'prNeedsUpdate')
      .mockResolvedValue(true);
    const mergeSpy = jest.spyOn(updater, 'merge').mockResolvedValue(true);
    const needsUpdate = await updater.update(<any>validPull);

    const expectedMergeOpts = {
      owner: validPull.head.repo.owner.login,
      repo: validPull.head.repo.name,
      commit_message: mergeMsg,
      base: validPull.head.ref,
      head: validPull.base.ref,
    };

    expect(needsUpdate).toEqual(true);
    expect(updateSpy).toHaveBeenCalledTimes(1);
    expect(mergeSpy).toHaveBeenCalledWith(expectedMergeOpts);
  });

  test('merge with no message', async () => {
    // const config = new ConfigLoader();
    (config.mergeMsg as jest.Mock).mockReturnValue('');
    const updater = new AutoUpdater(config, {});

    const updateSpy = jest
      .spyOn(updater, 'prNeedsUpdate')
      .mockResolvedValue(true);
    const mergeSpy = jest.spyOn(updater, 'merge').mockResolvedValue(true);
    const needsUpdate = await updater.update(<any>validPull);

    const expectedMergeOpts = {
      owner: validPull.head.repo.owner.login,
      repo: validPull.head.repo.name,
      commit_message: '',
      base: validPull.head.ref,
      head: validPull.base.ref,
    };

    expect(needsUpdate).toEqual(true);
    expect(updateSpy).toHaveBeenCalledTimes(1);
    expect(mergeSpy).toHaveBeenCalledWith(expectedMergeOpts);
  });
});

describe('test `merge`', () => {
  const mergeOpts = {
    owner: validPull.head.repo.owner.login,
    repo: validPull.head.repo.name,
    commit_message: 'dummy-msg',
    base: validPull.head.ref,
    head: validPull.base.ref,
  };

  const responseCodeTests = [
    {
      code: 204,
      description: 'branch update not required',
      success: true,
    },
    {
      code: 200,
      description: 'merge successful',
      success: true,
    },
    {
      code: 503,
      description: 'merge error',
      success: false,
    },
  ];

  for (const responseTest of responseCodeTests) {
    test(responseTest.description, async () => {
      (config.retryCount as jest.Mock).mockReturnValue(0);
      (config.retrySleep as jest.Mock).mockReturnValue(0);
      (config.mergeConflictAction as jest.Mock).mockReturnValue(null);
      const updater = new AutoUpdater(config, {});

      const scope = nock('https://api.github.com:443')
        .post(`/repos/${owner}/${repo}/merges`, {
          commit_message: mergeOpts.commit_message,
          base: mergeOpts.base,
          head: mergeOpts.head,
        })
        .reply(responseTest.code);

      if (responseTest.success) {
        await updater.merge(mergeOpts);
      } else {
        await expect(updater.merge(mergeOpts)).rejects.toThrowError();
      }

      expect(scope.isDone()).toEqual(true);
    });
  }

  test('retry logic', async () => {
    const retryCount = 3;
    (config.retryCount as jest.Mock).mockReturnValue(retryCount);
    (config.mergeConflictAction as jest.Mock).mockReturnValue(null);
    const updater = new AutoUpdater(config, {});

    const scopes = [];
    for (let i = 0; i <= retryCount; i++) {
      const scope = nock('https://api.github.com:443')
        .post(`/repos/${owner}/${repo}/merges`, {
          commit_message: mergeOpts.commit_message,
          base: mergeOpts.base,
          head: mergeOpts.head,
        })
        .reply(503);
      scopes.push(scope);
    }

    await expect(updater.merge(mergeOpts)).rejects.toThrowError();

    for (const scope of scopes) {
      expect(scope.isDone()).toEqual(true);
    }
  });

  test('ignore merge conflicts', async () => {
    (config.retryCount as jest.Mock).mockReturnValue(0);
    (config.mergeConflictAction as jest.Mock).mockReturnValue('ignore');
    const updater = new AutoUpdater(config, {});

    const scope = nock('https://api.github.com:443')
      .post(`/repos/${owner}/${repo}/merges`, {
        commit_message: mergeOpts.commit_message,
        base: mergeOpts.base,
        head: mergeOpts.head,
      })
      .reply(409, {
        message: 'Merge conflict',
      });

    await updater.merge(mergeOpts);

    expect(scope.isDone()).toEqual(true);
  });

  test('not ignoring merge conflicts', async () => {
    (config.retryCount as jest.Mock).mockReturnValue(0);
    (config.mergeConflictAction as jest.Mock).mockReturnValue(null);
    const updater = new AutoUpdater(config, {});

    const scope = nock('https://api.github.com:443')
      .post(`/repos/${owner}/${repo}/merges`, {
        commit_message: mergeOpts.commit_message,
        base: mergeOpts.base,
        head: mergeOpts.head,
      })
      .reply(409, {
        message: 'Merge conflict',
      });

    await expect(updater.merge(mergeOpts)).rejects.toThrowError(
      'Merge conflict',
    );

    expect(scope.isDone()).toEqual(true);
  });
});
