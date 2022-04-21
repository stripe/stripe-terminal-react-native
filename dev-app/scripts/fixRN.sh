#!/usr/bin/env bash

cd "$(dirname "$0")/../.."

BASE_FIND=./node_modules/react-native/scripts/find-node.sh
DEV_FIND=./dev-app/node_modules/react-native/scripts/find-node.sh
EXAMPLE_FIND=./example-app/node_modules/react-native/scripts/find-node.sh

if [[ -f "$BASE_FIND" ]]; then
  rm $BASE_FIND
  touch $BASE_FIND
fi

if [[ -f "$EXAMPLE_FIND" ]]; then
  rm $EXAMPLE_FIND
  touch $EXAMPLE_FIND
fi

if [[ -f "$DEV_FIND" ]]; then
  rm $DEV_FIND
  touch $DEV_FIND
fi
