#!/bin/sh

set -euof

doctl auth init --access-token $DIGITALOCEAN_ACCESS_TOKEN

REGISTRY="$(doctl registry get | grep registry | awk '{print $2}')/$CI_PROJECT_NAME"

doctl kubernetes cluster kubeconfig save "wonderland-${CI_ENVIRONMENT_NAME}" --set-current-context

helm upgrade $CI_PROJECT_NAME helm --install \
    --set image.tag=$CI_COMMIT_SHORT_SHA \
    --set image.repository=$REGISTRY \
    --set secrets.MAZE_SERVICE=$MAZE_SERVICE \
    --set secrets.DATABASE_SERVICE=$DATABASE_SERVICE \
    --set secrets.NODE_ENV=$CI_ENVIRONMENT_NAME \
    --set secrets.REDIS_URL=$REDIS_URL \
    --set secrets.CRON_JOB_WEBHOOK=$CRON_JOB_WEBHOOK \
    --set secrets.CONTRACT_ADDRESS=$CONTRACT_ADDRESS \
    --set 'imagePullSecrets[0].name'=digitalocean-registry \
    -n $CI_ENVIRONMENT_NAME
