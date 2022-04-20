#!/usr/bin/env bash

cd "$(dirname "$0")/../.."

rm node_modules/react-native/scripts/find-node.sh
touch node_modules/react-native/scripts/find-node.sh

rm ./example-app/node_modules/react-native/scripts/find-node.sh
touch ./example-app/node_modules/react-native/scripts/find-node.sh

rm ./dev-app/node_modules/react-native/scripts/find-node.sh
touch ./dev-app/node_modules/react-native/scripts/find-node.sh
