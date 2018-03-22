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
      echo >&2 "${RED}Can not run script: you have unstaged changes:${DEFAULT}"
      git diff-files --name-status -r --ignore-submodules -- >&2
      err=1
      exit 1
  elif [ ! $nA2B -eq 0 -o ! $nB2A -eq 0 ];
  then
    echo >&2 "${RED}Can not run script: $LOCAL_BRANCH does not match $REMOTE_BRANCH.${DEFAULT}"
    err=1
    exit 1
  fi
}
check_clean_working_tree
