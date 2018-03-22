#!/bin/sh

set -e

my_dir="$(dirname "$0")"
source "$my_dir/pre-check.sh"

set_github_tag () {
  yarn version --new-version $1
  git push origin --tags
  git push origin $CURRENT_BRANCH
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
