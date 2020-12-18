#!/usr/bin/env bash

set -e
set -o nounset

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
REPO="chinthakagodawita/autoupdate-action"

pushd "${SCRIPT_DIR}/.." > /dev/null

set -x

docker build -t "${REPO}:v1" .
docker tag "${REPO}:v1" "${REPO}:latest"
docker push "${REPO}:v1"
docker push "${REPO}:latest"

set +x

popd > /dev/null
