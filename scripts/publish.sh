#!/bin/bash

set -euo pipefail
IFS=$'\n\t'

echo_help() {
  cat << EOF
USAGE:
    ./scripts/publish.sh reactnativesdk/<version>
EOF
}

if [ $# -ne 1 ]; then
  echo "Error: Branch name is mandatory"
  echo ""
  echo_help
  exit 1
fi

BRANCH_NAME=$1

# Make sure our working dir is the package directory, wherever the script is invoked from
cd "$(dirname "${BASH_SOURCE[0]}")/.."

VERSION=$(node -p "require('./package.json').version")

if [ "$BRANCH_NAME" != "reactnativesdk/$VERSION" ]; then
  echo "Error! Can only publish $VERSION from the 'reactnativesdk/$VERSION' branch, not '$BRANCH_NAME'."
  exit 1
fi

echo "Fetching git remotes"
git fetch origin "$BRANCH_NAME"

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

if [ "$CURRENT_BRANCH" != "$BRANCH_NAME" ]; then
  echo "Error! Must be on branch '$BRANCH_NAME' to publish"
  exit 1
fi

if [ "$(git rev-parse HEAD)" != "$(git rev-parse "origin/$BRANCH_NAME")" ]; then
  echo "Error! Must be up to date with origin/$BRANCH_NAME to publish"
  exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
  echo "Error! Cannot publish with dirty working tree"
  exit 1
fi

echo "Installing dependencies according to lockfile"
yarn -s install --frozen-lockfile

echo "Running tests"
yarn -s run unit-test:android

echo "Linting"
yarn -s run lint

# The version is committed on the release branch before QA, so publish it as-is. npm publish doesn't
# bump the version or create git tags, which would land in the Android repo.
echo "Publishing $VERSION"
npm publish --access=public

echo "Publish successful!"
echo ""
cat << EOF
Remaining manual steps:
  - Tag the published commit $(git rev-parse HEAD) as reactnativesdk/v$VERSION in the Android repo
  - Mirror the public source to stripe/stripe-terminal-react-native, then tag v$VERSION and create
    the GitHub release there: https://github.com/stripe/stripe-terminal-react-native/releases/new
EOF
