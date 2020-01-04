const github = require('@actions/github');
const ghCore = require('@actions/core');

class AutoUpdater {
  eventData;
  runningOnGithub;
  octokit;

  constructor(githubToken, eventData, runningOnGithub = true) {
    this.eventData = eventData;
    this.runningOnGithub = this.runningOnGithub;
    // const repoParts = repository.split('/');
    // if (repoParts.length !== 2) {
    //   throw new Error(
    //     `Invalid format for repository, expected 'owner/repository', got '${repository}'.`
    //   )
    // }

    // this.repoOwner = repoParts[0];
    // this.repoName = repoParts[1];

    if (githubToken !== null && githubToken !== void 0) {
      this.octokit = new github.GitHub(githubToken);
    } else {
      throw new Error("Github token was not provided, please check that you have provided the 'GITHUB_TOKEN' environment variable.");
    }
  }

  async handlePush() {
    const { ref, repository } = this.eventData;

    ghCore.info(`Handling push event on ref '${ref}'`);

    if (!ref.startsWith('refs/heads/')) {
      ghCore.info('Push event was not on a branch.');
      return;
    }

    const baseBranch = ref.replace('refs/heads/', '');

    let pulls;
    try {
      pulls = await this.octokit.pulls.list({
        owner: repository.owner.name,
        repo: repository.name,
        base: baseBranch,
        // owner: 'lendingworks',
        // repo: 'pam',
        state: 'open',
        sort: 'updated',
        direction: 'desc',
      });
    } catch (e) {
      throw new Error(`Failed to list PRs: ${e.message}`);
    }

    if (pulls.data.length === 0) {
      ghCore.info(`Base branch '${baseBranch}' has no pull requests that point to it, skipping autoupdate.`);
      return;
    }

    let updated = 0;
    for await (const pullsPage of this.octokit.paginate.iterator(pulls)) {
      for (const pull of pulls.data) {
        const isUpdated = await this.update(pull, baseBranch);
        if (isUpdated) {
          updated++;
        }
      }
    }

    ghCore.info(`Auto update complete, ${updated} pull request(s) that point to base branch '${baseBranch}' were updated.`);
  }

  async handlePullRequest() {
    const { ref, repository } = this.eventData;

    ghCore.info(`Handling push event on ref '${ref}'`);
    ghCore.error('Direct pull request support coming soon');
  }

  async update(pull, baseBranch) {
    const { ref } = pull.head;
    ghCore.info(`Evaluating pull request #${pull.number}...`);

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

    const prNeedsUpdate = await this.prNeedsUpdate(pull);
    if (!prNeedsUpdate) {
      return false;
    }

    const baseRef = pull.base.label;
    const headRef = pull.head.label;
    ghCore.info(` > Updating branch '${ref}' on pull request #${pull.number} with changes from branch '${baseBranch}'.`);
    const mergeResp = await this.octokit.repos.merge({
      owner: pull.head.repo.owner.login,
      repo: pull.head.repo.name,
      base: baseRef,
      head: headRef,
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
    const { data: comparison } = await this.octokit.repos.compareCommits({
      owner: pull.head.repo.owner.login,
      repo: pull.head.repo.name,
      // This base->head, head->base logic is intentional, we want
      // to see what would happen if we merged the base into head not
      // vice-versa.
      base: pull.head.label,
      head: pull.base.label,
    });

    return comparison.behind_by > 0;
  }
  
  async run() {
    console.log(await this.octokit.pulls.list({
      owner: this.repoOwner,
      repo: this.repoName,
    }));
    console.log('running yo')
  }
}

module.exports = AutoUpdater;
