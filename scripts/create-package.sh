#!/bin/sh

set -e

CYAN='\033[0;36m'
DEFAULT='\033[0m'
YELLOW='\033[0;33m'

create_new_package () {
  read -p "$(echo $CYAN)Name of new package name (without the hz-): $(echo $DEFAULT)" -r RESPONSE
  if [[ ! $RESPONSE =~ ^[a-z0-9]*([-]?[a-z0-9]*)*$ ]]; then
    echo "$(echo $YELLOW)'$RESPONSE' is not a valid package name. Must only contain letters and hyphens.$(echo $DEFAULT)"
  elif [ -d ./packages/hz-$RESPONSE ]; then
    echo "$(echo $YELLOW)Package already exists$(echo $DEFAULT)"
  else
    NEWPATH=./packages/hz-$RESPONSE
    mkdir -p $NEWPATH/src $NEWPATH/tests
    touch $NEWPATH/readme.md $NEWPATH/src/index.js
    cd $NEWPATH
    yarn init
    echo "$(echo $CYAN)Package created in$(echo $DEFAULT) $NEWPATH"
  fi
}

create_new_package
