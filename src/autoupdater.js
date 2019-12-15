const github = require('@actions/github');

class AutoUpdater {
  pullRequest;
  repoName;
  repoOwner;
  octoKit;

  constructor({
    githubToken = null,
    pullRequest = null,
    repository = null,
  } = {}) {
    this.pullRequest = pullRequest;
    
    const repoParts = repository.split('/');
    if (repoParts.length !== 2) {
      throw new Error(
        `Invalid format for repository, expected 'owner/repository', got '${repository}'.`
      )
    }

    this.repoOwner = repoParts[0];
    this.repoName = repoParts[1];

    if (githubToken !== null && githubToken !== void 0) {
      this.octoKit = new github.GitHub(githubToken);
    }
  }
  
  async run() {
    console.log(await this.octoKit.pulls.list({
      owner: this.repoOwner,
      repo: this.repoName,
    }));
    console.log('running yo')
  }
}

module.exports = AutoUpdater;
