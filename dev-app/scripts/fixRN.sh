#!/usr/bin/env bash

cd "$(dirname "$0")/.."

rm node_modules/react-native/scripts/find-node.sh
touch node_modules/react-native/scripts/find-node.sh
