# autoupdate
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
    runs-on: ubuntu-18.04
    steps:
      - uses: docker://chinthakagodawita/autoupdate-action:v1
        env:
          GITHUB_TOKEN: "${{ secrets.GITHUB_TOKEN }}"
```

This will trigger on all pushes and automatically update any pull requests, if changes are pushed to their destination branch.

For more information on customising event triggers, see [Github's documentation](https://help.github.com/en/actions/automating-your-workflow-with-github-actions/events-that-trigger-workflows#push-event-push).


## Configuration
The following configuration options are supported. To change any of these, simply specify it as an `env` value in your workflow file.

All configuration values, except `GITHUB_TOKEN`, are optional.

* `GITHUB_TOKEN`: _autoupdate_ uses this token to perform its operations on your repository. This should generally be set to `"${{ secrets.GITHUB_TOKEN }}"`.

  You _may_ want to override this if you want the action to run as a different user than the default actions bot.

* `DRY_RUN`: Enables 'dry run' mode, possible values are `"true"` or `"false"` (default).

  In dry run mode, merge/update operations are logged to the console but not performed. This can be useful if you're testing this action or testing a particular configuration value.

* `PR_FILTER`: Controls how _autoupdate_ chooses which pull requests to operate on. Possible values are:
  * `"all"` (default): No filter, _autoupdate_ will monitor and update all pull requests.
  * `"labelled"`: Only monitor PRs with a particular label (or set of labels). Requires the `PR_LABELS` option to be defined to. If `PR_LABELS` is not defined, _autoupdate_ will not monitor any pull requests.
  * `"protected"`: Only monitor PRs that are raised against [protected branches](https://help.github.com/en/github/administering-a-repository/about-protected-branches).

* `PR_LABELS`: Controls which labels _autoupdate_ will look for when monitoring PRs. Only used if `PR_FILTER="labelled"`. This can be either a single label or a comma-separated list of labels.

* `MERGE_MSG`: A custom message to use when creating the merge commit from the destination branch to your pull request's branch.

* `RETRY_COUNT`: The number of times a branch update should be attempted before _autoupdate_ gives up (default: `"5"`).

* `RETRY_SLEEP`: The amount of time (in milliseconds) that _autoupdate_ should wait between branch update attempts (default: `"300"`).

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
          MERGE_MSG: "Branch was auto-updated."
          RETRY_COUNT: "5"
          RETRY_SLEEP: "300"
```

## Limitations
* Branch updates events caused by this action will not trigger any subsequent workflows
  * [This is a documented limitation](https://help.github.com/en/actions/automating-your-workflow-with-github-actions/events-that-trigger-workflows#about-workflow-events) for all GH actions:
  > An action in a workflow run can't trigger a new workflow run. For example, if an action pushes code using the repository's GITHUB_TOKEN, a new workflow will not run even when the repository contains a workflow configured to run when push events occur.
  * There is [an open issue in the Github community forum](https://github.community/t5/GitHub-Actions/Triggering-a-new-workflow-from-another-workflow/td-p/31676) tracking this

## Coming soon
* Conflict handling
* Rebase support
* Label negation support
* Token support in custom merge messages

## Also see
* [automerge](https://github.com/pascalgn/automerge-action/) for automatic merging of PRs
* [autosquash](https://github.com/tibdex/autosquash) for auto-merging with squash support
