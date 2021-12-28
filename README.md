# autoupdate

![Tests](https://github.com/chinthakagodawita/autoupdate/workflows/Tests/badge.svg?event=push) [![codecov](https://codecov.io/gh/chinthakagodawita/autoupdate/branch/master/graph/badge.svg)](https://codecov.io/gh/chinthakagodawita/autoupdate)

**autoupdate** is a GitHub Action that auto-updates pull requests branches whenever changes land on their destination branch.

## Usage

Create a file, in your repository, at `.github/workflows/autoupdate.yaml` with the following:

```yaml
name: autoupdate
on:
  # This will trigger on all pushes to all branches.
  push: {}
  # Alternatively, you can only trigger if commits are pushed to certain branches, e.g.:
  # push:
  #   branches:
  #     - master
  #     - unstable
jobs:
  autoupdate:
    name: autoupdate
    runs-on: ubuntu-20.04
    steps:
      - uses: docker://chinthakagodawita/autoupdate-action:v1
        env:
          GITHUB_TOKEN: '${{ secrets.GITHUB_TOKEN }}'
```

This will trigger on all pushes and automatically update any pull requests, if changes are pushed to their destination branch.

For more information on customising event triggers, see [Github's documentation](https://help.github.com/en/actions/automating-your-workflow-with-github-actions/events-that-trigger-workflows#push-event-push).

The following events are supported:

- push
- pull_request
- workflow_run
- workflow_dispatch
- schedule

## Configuration

The following configuration options are supported. To change any of these, simply specify it as an `env` value in your workflow file.

All configuration values, except `GITHUB_TOKEN`, are optional.

- `GITHUB_TOKEN`: _autoupdate_ uses this token to perform its operations on your repository. This should generally be set to `"${{ secrets.GITHUB_TOKEN }}"`.

  You _may_ want to override this if you want the action to run as a different user than the default actions bot.

- `DRY_RUN`: Enables 'dry run' mode, possible values are `"true"` or `"false"` (default).

  In dry run mode, merge/update operations are logged to the console but not performed. This can be useful if you're testing this action or testing a particular configuration value.

- `PR_FILTER`: Controls how _autoupdate_ chooses which pull requests to operate on. Possible values are:

  - `"all"` (default): No filter, _autoupdate_ will monitor and update all pull requests.
  - `"labelled"`: Only monitor PRs with a particular label (or set of labels). Requires the `PR_LABELS` option to be defined to. If `PR_LABELS` is not defined, _autoupdate_ will not monitor any pull requests.
  - `"protected"`: Only monitor PRs that are raised against [protected branches](https://help.github.com/en/github/administering-a-repository/about-protected-branches).
  - `"auto_merge"`: Only monitor PRs that have ['auto merge'](https://docs.github.com/en/github/collaborating-with-pull-requests/incorporating-changes-from-a-pull-request/automatically-merging-a-pull-request) enabled

- `PR_LABELS`: Controls which labels _autoupdate_ will look for when monitoring PRs. Only used if `PR_FILTER="labelled"`. This can be either a single label or a comma-separated list of labels.

- `PR_READY_STATE`: Controls how _autoupdate_ monitors pull requests based on their current [draft / ready for review](https://help.github.com/en/github/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/changing-the-stage-of-a-pull-request) state. Possible values are:

  - `"all"`: (default): No filter, _autoupdate_ will monitor and update pull requests regardless of ready state.
  - `"ready_for_review"`: Only monitor PRs that are not currently in the draft state.
  - `"draft"`: Only monitor PRs that are currently in the draft state.

- `EXCLUDED_LABELS`: Controls which labels _autoupdate_ will ignore when evaluating otherwise-included PRs. This option works with all `PR_FILTER` options and can be either a single label or a comma-separated list of labels.

- `MERGE_MSG`: A custom message to use when creating the merge commit from the destination branch to your pull request's branch.

- `RETRY_COUNT`: The number of times a branch update should be attempted before _autoupdate_ gives up (default: `"5"`).

- `RETRY_SLEEP`: The amount of time (in milliseconds) that _autoupdate_ should wait between branch update attempts (default: `"300"`).

- `MERGE_CONFLICT_ACTION`: Controls how _autoupdate_ handles a merge conflict when updating a PR. Possible values are:
  - `"fail"` (default): _autoupdate_ will report a failure on each PR that has a merge conflict.
  - `"ignore"`: _autoupdate_ will silently ignore merge conflicts.

Here's an example workflow file with all of the above options specified:

```yaml
name: autoupdate
on:
  push: {}
jobs:
  autoupdate:
    name: autoupdate
    runs-on: ubuntu-18.04
    steps:
      - uses: docker://chinthakagodawita/autoupdate-action:v1
        env:
          GITHUB_TOKEN: "${{ secrets.GITHUB_TOKEN }}"
          DRY_RUN: "false"
          PR_FILTER: "labelled"
          PR_LABELS: "autoupdate,keep up-to-date,integration"
          EXCLUDED_LABELS: "dependencies,wontfix"
          MERGE_MSG: "Branch was auto-updated."
          RETRY_COUNT: "5"
          RETRY_SLEEP: "300"
          MERGE_CONFLICT_ACTION: "fail"
```

## Outputs

| Name         | Description                                                                 |
| ------------ | --------------------------------------------------------------------------- |
| `conflicted` | `true` or `false` which indicates whether merge conflicts were found or not |

Here's an example workflow file with the outputs above:

```yaml
name: autoupdate
on:
  push: {}
jobs:
  autoupdate:
    name: autoupdate
    runs-on: ubuntu-18.04
    steps:
      - uses: docker://chinthakagodawita/autoupdate-action:v1
        id: autoupdate
        env:
          GITHUB_TOKEN: "${{ secrets.GITHUB_TOKEN }}"
          MERGE_CONFLICT_ACTION: "ignore"

      - run: echo 'Merge conflicts found!'
        if: ${{ steps.autoupdate.outputs.conflicted }}

      - run: echo 'No merge conflicts'
        if: ${{ !steps.autoupdate.outputs.conflicted }}
```

## Examples

See [chinthakagodawita/autoupdate-test/pulls](https://github.com/chinthakagodawita/autoupdate-test/pulls?q=is%3Apr+is%3Aopen+sort%3Aupdated-desc) for a repository where autoupdate is enabled. This is currently configured to only run on PRs that have the `autoupdate` tag added to them.

Here's a screenshot:

![An example of autoupdate running on a pull request](/docs/images/autoupdate-example.png)

## Limitations

- Branch updates events caused by this action will not trigger any subsequent workflows
  - [This is a documented limitation](https://help.github.com/en/actions/automating-your-workflow-with-github-actions/events-that-trigger-workflows#about-workflow-events) for all GH actions:
    > An action in a workflow run can't trigger a new workflow run. For example, if an action pushes code using the repository's GITHUB_TOKEN, a new workflow will not run even when the repository contains a workflow configured to run when push events occur.
  - There is [an open issue in the Github community forum](https://github.community/t5/GitHub-Actions/Triggering-a-new-workflow-from-another-workflow/td-p/31676) tracking this

## Coming soon

- Rebase support
- Token support in custom merge messages

## Also see

- [automerge](https://github.com/pascalgn/automerge-action/) for automatic merging of PRs
- [autosquash](https://github.com/tibdex/autosquash) for auto-merging with squash support
