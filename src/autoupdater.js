const github = require('@actions/github');
const ghCore = require('@actions/core');

class AutoUpdater {
  constructor(githubToken, eventData) {
    this.eventData = eventData;

    if (githubToken === null || githubToken === void 0) {
      throw new Error(
        `Github token was not provided, please check that you have provided the 'GITHUB_TOKEN' environment variable.`
      );
    }

    this.octokit = new github.GitHub(githubToken);
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
        const isUpdated = await this.update(pull);
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

    // @TODO: Add support for squash & rebase merge types.

    const baseRef = pull.base.ref;
    const headRef = pull.head.ref;
    ghCore.info(
      ` > Updating branch '${ref}' on pull request #${pull.number} with changes from ref '${baseRef}'.`
    );
    const mergeResp = await this.octokit.repos.merge({
      owner: pull.head.repo.owner.login,
      repo: pull.head.repo.name,
      // We want to merge the base branch into this one.
      base: headRef,
      head: baseRef,
      // @TODO: Add custom commit message support.
    });

    // See https://developer.github.com/v3/repos/merging/#perform-a-merge
    const status = mergeResp.status;
    if (status === 200) {
      ghCore.info(
        ` > Branch update succesful, new branch HEAD: ${mergeResp.data.sha}.`
      );
    } else if (status === 204) {
      ghCore.info(
        ` > Branch update not required, branch is already up-to-date.`
      );
    }

    return true;
  }

  async prNeedsUpdate(pull) {
    if (pull.merged === true) {
      ghCore.warning(` > Skipping pull request, already merged.`);
      return false;
    }
    if (pull.state !== 'open') {
      ghCore.warning(
        ` > Skipping pull request, no longer open (current state: ${pull.state}).`
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
      ghCore.warning(
        ` > Skipping pull request, up-to-date with base branch.`
      );
      return false;
    }

    // @TODO: check labels if enabled.

    // @TODO: check protected if only protected enabled.

    return true;
  }
}

module.exports = AutoUpdater;
