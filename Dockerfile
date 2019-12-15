FROM node:12-alpine

LABEL com.github.actions.name="Auto-update pull requests with changes from their base branch"
LABEL com.github.actions.description="A GitHub Action that auto-updates PRs with changes from their base branch"
LABEL com.github.actions.icon="git-pull-request"
LABEL com.github.actions.color="blue"

RUN apk add --update --no-cache git ca-certificates \
  && mkdir -p /opt/autoupdate

WORKDIR /opt/autoupdate

COPY . /opt/autoupdate/

RUN yarn global add --frozen-lockfile 'file:/opt/autoupdate' \
  && rm -rf /opt/autoupdate

ENTRYPOINT [ "autoupdate-action" ]
