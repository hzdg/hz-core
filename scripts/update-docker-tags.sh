#!/bin/sh

set -e

my_dir="$(dirname "$0")"
source "$my_dir/pre-check.sh"

update_docker_tags () {
  docker build -t $DOCKER_REPOSITORY .
  docker tag $DOCKER_REPOSITORY $DOCKER_REPOSITORY:$CURRENT_VERSION_NUMBER
  docker push $DOCKER_REPOSITORY
}

update_docker_tags
