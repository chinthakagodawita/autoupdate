import { ConfigLoader } from '../src/config-loader';

const tests = [
  {
    name: 'githubToken',
    envVar: 'GITHUB_TOKEN',
    required: true,
    default: null,
    type: 'string',
  },
  {
    name: 'dryRun',
    envVar: 'DRY_RUN',
    required: false,
    default: false,
    type: 'bool',
  },
  {
    name: 'pullRequestFilter',
    envVar: 'PR_FILTER',
    required: false,
    default: 'all',
    type: 'string',
  },
  {
    name: 'pullRequestLabels',
    envVar: 'PR_LABELS',
    required: false,
    default: [],
    type: 'list',
  },
  {
    name: 'excludedLabels',
    envVar: 'EXCLUDED_LABELS',
    required: false,
    default: [],
    type: 'list',
  },
  {
    name: 'mergeMsg',
    envVar: 'MERGE_MSG',
    required: false,
    default: null,
    type: 'string',
  },
  {
    name: 'mergeComment',
    envVar: 'MERGE_COMMENT',
    required: false,
    default: null,
    type: 'string',
  },
  {
    name: 'conflictMsg',
    envVar: 'CONFLICT_MSG',
    required: false,
    default: null,
    type: 'string',
  },
  {
    name: 'retryCount',
    envVar: 'RETRY_COUNT',
    required: false,
    default: 5,
    type: 'int',
  },
  {
    name: 'retrySleep',
    envVar: 'RETRY_SLEEP',
    required: false,
    default: 300,
    type: 'int',
  },
  {
    name: 'mergeConflictAction',
    envVar: 'MERGE_CONFLICT_ACTION',
    required: false,
    default: 'fail',
    type: 'string',
  },
  {
    name: 'githubRef',
    envVar: 'GITHUB_REF',
    required: true,
    default: '',
    type: 'string',
  },
  {
    name: 'githubRepository',
    envVar: 'GITHUB_REPOSITORY',
    required: true,
    default: '',
    type: 'string',
  },
  {
    name: 'pullRequestReadyState',
    envVar: 'PR_READY_STATE',
    required: false,
    default: 'all',
    type: 'string',
  },
];

for (const testDef of tests) {
  test(`test that '${testDef.name}' returns the correct environment value`, () => {
    // All environment variables are technically strings.
    let dummyValue: string;
    let expectedValue: string | number | boolean | string[];
    switch (testDef.type) {
      case 'string':
        dummyValue = 'some-dummy-value';
        expectedValue = dummyValue;
        break;

      case 'int':
        dummyValue = '42';
        expectedValue = 42;
        break;

      case 'bool':
        dummyValue = 'true';
        expectedValue = true;
        break;

      case 'list':
        dummyValue = ' one,two ,three';
        expectedValue = ['one', 'two', 'three'];
        break;

      default:
        fail(
          `Unknown config test '${testDef.type}' for function '${testDef.name}'`,
        );
    }

    process.env[testDef.envVar] = dummyValue;
    const config = new ConfigLoader();
    // Ignore noImplicitAny so we can invoke the function by string index.
    // @ts-ignore
    const value = config[testDef.name]();
    expect(value).toEqual(expectedValue);

    // Restore environment.
    delete process.env[testDef.envVar];
  });

  if (testDef.required) {
    test(`test that '${testDef.name}' throws an error if an env var is not defined`, () => {
      const config = new ConfigLoader();
      expect(() => {
        // Ignore noImplicitAny so we can invoke the function by string index.
        // @ts-ignore
        config[testDef.name]();
      }).toThrowError(
        `Environment variable '${testDef.envVar}' was not provided, please define it and try again.`,
      );
    });
  } else {
    test(`test that '${testDef.name}' returns its default value if an env var is not defined`, () => {
      const config = new ConfigLoader();
      // Ignore noImplicitAny so we can invoke the function by string index.
      // @ts-ignore
      const value = config[testDef.name]();
      expect(value).toEqual(testDef.default);
    });
  }
}
