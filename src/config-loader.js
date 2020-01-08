class ConfigLoader {
  constructor() {
    this.env = process.env;
  }

  githubToken() {
    return this.getValue('GITHUB_TOKEN', true);
  }

  dryRun() {
    const val = this.getValue('DRY_RUN', false, 'false');
    return val === 'true';
  }

  pullRequestFilter() {
    // one of 'all', 'protected' or 'labelled'.
    return this.getValue('PR_FILTER', false,  'all');
  }

  pullRequestLabels() {
    const rawLabels = this.getValue('PR_LABELS', false,  '');
    return rawLabels.split(',').map((label) => label.trim());
  }

  mergeMsg() {
    const msg = this.getValue(
      'MERGE_MSG',
      false,
      ''
    ).toString().trim();

    if (msg === '') {
      return null;
    }
    return msg;
  }

  conflictMsg() {
    return this.getValue(
      'CONFLICT_MSG',
      false,
      ''
    ).toString().trim();
  }

  getValue(key, required = false, defaulVal = null) {
    if (key in this.env
      && this.env[key] !== null
      && this.env[key] !== void 0) {
      return this.env[key];
    }

    if (required) {
      throw new Error(
        `Environment variable '${key}' was not provided, please define it and try again.`
      );
    }

    return defaulVal;
  }
}

module.exports = new ConfigLoader();
