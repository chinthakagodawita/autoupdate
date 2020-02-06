const github = require('@actions/github');
const ghCore = require('@actions/core');

class AutoUpdater {
  constructor(config, eventData) {
    this.eventData = eventData;
    this.config = config;
    this.octokit = new github.GitHub(this.config.githubToken());
  }

  async handlePush() {
    const { ref, repository } = this.eventData;

    ghCore.info(`Handling push event on ref '${ref}'`);

    if (!ref.startsWith('refs/heads/')) {
      ghCore.warning('Push event was not on a branch, skipping.');
      return;
    }

    const baseBranch = ref.replace('refs/heads/', '');

    const pulls = await this.octokit.pulls.list({
      owner: repository.owner.name,
      repo: repository.name,
      base: baseBranch,
      state: 'open',
      sort: 'updated',
      direction: 'desc',
    });

    if (pulls.data.length === 0) {
      ghCore.info(
        `Base branch '${baseBranch}' has no pull requests that point to it, skipping autoupdate.`
      );
      return;
    }

    let updated = 0;
    for await (const pullsPage of this.octokit.paginate.iterator(pulls)) {
      for (const pull of pulls.data) {
        ghCore.startGroup(`PR-${pull.number}`);
        const isUpdated = await this.update(pull);
        ghCore.endGroup();

        if (isUpdated) {
          updated++;
        }
      }
    }

    ghCore.info(
      `Auto update complete, ${updated} pull request(s) that point to base branch '${baseBranch}' were updated.`
    );
  }

  async handlePullRequest() {
    const { action } = this.eventData;

    ghCore.info(`Handling pull_request event triggered by action '${action}'`);

    const isUpdated = await this.update(this.eventData.pull_request);
    if (isUpdated) {
      ghCore.info(
        `Auto update complete, pull request branch was updated with changes from the base branch.`
      );
    } else {
      ghCore.info(`Auto update complete, no changes were made.`);
    }
  }

  async update(pull) {
    const { ref } = pull.head;
    ghCore.info(`Evaluating pull request #${pull.number}...`);

    const prNeedsUpdate = await this.prNeedsUpdate(pull);
    if (!prNeedsUpdate) {
      return false;
    }

    const baseRef = pull.base.ref;
    const headRef = pull.head.ref;
    ghCore.info(
      `Updating branch '${ref}' on pull request #${pull.number} with changes from ref '${baseRef}'.`
    );

    if (this.config.dryRun()) {
      ghCore.warning(
        `Would have merged ref '${headRef}' into ref '${baseRef}' but DRY_RUN was enabled.`
      );
      return true;
    }

    const mergeMsg = this.config.mergeMsg();
    const mergeOpts = {
      owner: pull.head.repo.owner.login,
      repo: pull.head.repo.name,
      // We want to merge the base branch into this one.
      base: headRef,
      head: baseRef,
    };

    if (mergeMsg !== null && mergeMsg.length > 0) {
      mergeOpts.commit_message = mergeMsg;
    }

    await this.merge(mergeOpts);

    return true;
  }

  async prNeedsUpdate(pull) {
    if (pull.merged === true) {
      ghCore.warning(`Skipping pull request, already merged.`);
      return false;
    }
    if (pull.state !== 'open') {
      ghCore.warning(
        `Skipping pull request, no longer open (current state: ${pull.state}).`
      );
      return false;
    }

    const { data: comparison } = await this.octokit.repos.compareCommits({
      owner: pull.head.repo.owner.login,
      repo: pull.head.repo.name,
      // This base->head, head->base logic is intentional, we want
      // to see what would happen if we merged the base into head not
      // vice-versa.
      base: pull.head.label,
      head: pull.base.label,
    });

    if (comparison.behind_by === 0) {
      ghCore.info(`Skipping pull request, up-to-date with base branch.`);
      return false;
    }

    const prFilter = this.config.pullRequestFilter();

    ghCore.info(
      `PR_FILTER=${prFilter}, checking if this PR's branch needs to be updated.`
    );

    if (prFilter === 'labelled') {
      const labels = this.config.pullRequestLabels();
      if (labels.length === 0) {
        ghCore.warning(
          `Skipping pull request, no labels were defined (env var PR_LABELS is empty or not defined).`
        );
        return false;
      }
      ghCore.info(
        `Checking if this PR has a label in our list (${labels.join(', ')}).`
      );

      if (pull.labels.length === 0) {
        ghCore.info(`Skipping pull request, it has no labels.`);
        return false;
      }

      for (const label of pull.labels) {
        if (labels.includes(label.name)) {
          ghCore.info(
            `Pull request has label '${label.name}' and PR branch is behind base branch.`
          );
          return true;
        }
      }

      ghCore.info(
        `Pull request does not match any of the defined labels, skipping update.`
      );
      return false;
    }

    if (this.config.pullRequestFilter() === 'protected') {
      ghCore.info('Checking if this PR is against a protected branch.');
      const { data: branch } = this.octokit.repos.getBranch({
        owner: pull.head.repo.owner.login,
        repo: pull.head.repo.name,
        branch: pull.base.ref,
      });

      if (branch.protected) {
        ghCore.info(
          `Pull request is against a protected branch and is behind base branch.`
        );
        return true;
      } else {
        ghCore.info(
          `Pull request is not against a protected branch, skipping update.`
        );
        return false;
      }
    }

    const exclidedLabels = this.config.excludedLabels();
    for (const label of pull.labels) {
      if (exclidedLabels.includes(label.name)) {
        ghCore.info(
          `Pull request has excluded label '${label.name}', skipping update.`
        );
        return false;
      }
    }

    ghCore.info('All checks pass and PR branch is behind base branch.');
    return true;
  }

  async merge(mergeOpts) {
    const sleep = (timeMs) => {
      return new Promise((resolve) => {
        setTimeout(resolve, timeMs);
      });
    };

    const doMerge = async () => {
      const mergeResp = await this.octokit.repos.merge(mergeOpts);

      // See https://developer.github.com/v3/repos/merging/#perform-a-merge
      const status = mergeResp.status;
      if (status === 200) {
        ghCore.info(
          `Branch update succesful, new branch HEAD: ${mergeResp.data.sha}.`
        );
      } else if (status === 204) {
        ghCore.info(`Branch update not required, branch is already up-to-date.`);
      }

      return true;
    };

    const retryCount = this.config.retryCount();
    const retrySleep = this.config.retrySleep();
    let retries = 0;

    while (true) {
      try {
        ghCore.info('Attempting branch update...');
        await doMerge();
        break;
      } catch (e) {
        ghCore.error(`Caught error trying to update branch: ${e.message}`);

        if (retries < retryCount) {
          ghCore.info(
            `Branch update failed, will retry in ${retrySleep}ms, retry #${retries} of ${retryCount}.`
          );

          retries++;
          await sleep(retrySleep);
        } else {
          throw e;
        }
      }
    }
  }
}

module.exports = AutoUpdater;
