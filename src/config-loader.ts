export class ConfigLoader {
  env: NodeJS.ProcessEnv;

  constructor() {
    this.env = process.env;
  }

  githubToken(): string {
    return this.getValue('GITHUB_TOKEN', true);
  }

  dryRun(): boolean {
    const val = this.getValue('DRY_RUN', false, 'false');
    return val === 'true';
  }

  pullRequestFilter(): string {
    // one of 'all', 'protected' or 'labelled'.
    return this.getValue('PR_FILTER', false, 'all');
  }

  pullRequestLabels(): Array<string> {
    const rawLabels = this.getValue('PR_LABELS', false, '').toString().trim();
    if (rawLabels === '') {
      return [];
    }
    return rawLabels.split(',').map((label: string) => label.trim());
  }

  mergeMsg(): string {
    const msg = this.getValue('MERGE_MSG', false, '').toString().trim();
    return msg === '' ? null : msg;
  }

  conflictMsg(): string {
    const msg = this.getValue('CONFLICT_MSG', false, '').toString().trim();
    return msg === '' ? null : msg;
  }

  retryCount(): number {
    return parseInt(this.getValue('RETRY_COUNT', false, 5), 10);
  }

  retrySleep(): number {
    // In milliseconds.
    return parseInt(this.getValue('RETRY_SLEEP', false, 300), 10);
  }

  mergeConflictAction(): string {
    // one of 'fail' or 'ignore'.
    return this.getValue('MERGE_CONFLICT_ACTION', false, 'fail');
  }

  getValue(key: string, required = false, defaultVal?: any): any {
    if (
      key in this.env &&
      this.env[key] !== null &&
      this.env[key] !== undefined
    ) {
      return this.env[key];
    }

    if (required) {
      throw new Error(
        `Environment variable '${key}' was not provided, please define it and try again.`,
      );
    }

    return defaultVal;
  }
}

export default new ConfigLoader();
