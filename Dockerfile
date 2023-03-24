FROM node:16-alpine as builder

RUN mkdir -p /opt/github-autoupdate/dist

WORKDIR /opt/github-autoupdate

COPY . /opt/github-autoupdate/

RUN yarn install --frozen-lockfile && yarn run build

FROM node:16-alpine as runner

LABEL com.github.actions.name="Auto-update pull requests with changes from their base branch"
LABEL com.github.actions.description="A GitHub Action that auto-updates PRs with changes from their base branch"
LABEL com.github.actions.icon="git-pull-request"
LABEL com.github.actions.color="blue"

RUN apk add --update --no-cache ca-certificates \
  && mkdir -p /opt/github-autoupdate

WORKDIR /opt/github-autoupdate

COPY --from=builder /opt/github-autoupdate/dist/index.js /opt/github-autoupdate/index.js

ENTRYPOINT [ "node", "/opt/github-autoupdate/index.js" ]
