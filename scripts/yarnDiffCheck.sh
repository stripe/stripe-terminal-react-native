#!/usr/bin/env bash

git diff $1
if ! git diff --exit-code $1; then
  echo "Changes were detected in yarn.lock file after running 'yarn install', which is not expected. Please run 'yarn install' locally and commit the changes.";
  exit 1;
fi
