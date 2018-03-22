#!/bin/sh

set -e

CURRENT_VERSION_NUMBER=$(node -p "require('./package.json').version")
CURRENT_BRANCH=$(git symbolic-ref --short -q HEAD)
DOCKER_REPOSITORY=hzdg/hz-core

LOCAL_BRANCH=$CURRENT_BRANCH
REMOTE_BRANCH=origin/$CURRENT_BRANCH
nA2B=$(git rev-list --count $LOCAL_BRANCH..$REMOTE_BRANCH)
nB2A=$(git rev-list --count $REMOTE_BRANCH..$LOCAL_BRANCH)

CYAN='\033[0;36m'
DEFAULT='\033[0m'
YELLOW='\033[0;33m'
RED='\033[0;31m'

check_clean_working_tree () {
  if ! git diff-files --quiet --ignore-submodules --
  then
      echo >&2 "${RED}Cannot update project version: you have unstaged changes.${DEFAULT}"
      git diff-files --name-status -r --ignore-submodules -- >&2
      err=1
      exit 1
  elif [ ! $nA2B -eq 0 -o ! $nB2A -eq 0 ];
  then
    echo >&2 "${RED}Cannot update project version: $LOCAL_BRANCH does not match $REMOTE_BRANCH.${DEFAULT}"
    err=1
    exit 1
  fi
}

set_github_tag () {
  yarn version --new-version $1
  git push origin --tags
  echo "$(echo $CYAN)Updated main package version and created Github tag $1 ...$(echo $DEFAULT)"
}

set_docker_tag () {
  docker build -t $DOCKER_REPOSITORY .
  docker tag $DOCKER_REPOSITORY $DOCKER_REPOSITORY:$1
  docker push $DOCKER_REPOSITORY
  echo "$(echo $CYAN)Created and pushed corresponding docker tag $1 ...$(echo $DEFAULT)"
}

update_tags () {
  echo "$(echo $CYAN)Updating remote Git and Docker tags...$(echo $DEFAULT)"

  check_clean_working_tree

  read -p "$(echo $CYAN)New library tag version number (current: $CURRENT_VERSION_NUMBER): $(echo $DEFAULT)" -r RESPONSE

  if [[ $RESPONSE =~ ^([0-9]+\.){2}([0-9]+)$ ]]
  then
    set_github_tag $RESPONSE
    set_docker_tag $RESPONSE
  else
    echo "${RED}Invalid version number. Needs to be all numbers in the format of x.x.x"
  fi
}

update_tags
