#!/bin/sh
set -euof

doctl auth init --access-token $DIGITALOCEAN_ACCESS_TOKEN
REGISTRY="$(doctl registry get | grep registry | awk '{print $2}')/$CI_PROJECT_NAME"
apk add --no-cache docker-cli
docker build -t $REGISTRY:$CI_COMMIT_SHORT_SHA .
doctl registry login
docker push $REGISTRY:$CI_COMMIT_SHORT_SHA