#!/bin/sh

set -e

my_dir="$(dirname "$0")"
source "$my_dir/pre-check.sh"

update_docker_tags () {
  docker build -t $DOCKER_RESPOSITRY .
  docker tag $DOCKER_RESPOSITRY $DOCKER_RESPOSITRY:$CURRENT_VERSION_NUMBER
  docker push $DOCKER_RESPOSITRY
}

update_docker_tags
