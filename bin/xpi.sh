#!/usr/bin/env bash

## Things that will happen.
#
# - Create addon/{install.rdf,chrome.manifest} from templates,
#   using data from package.json
# -
# Create dist/{$XPI_NAME,linked-addon.xpi}



echo "$@"

set -eu
#set -o xtrace

BASE_DIR="$(dirname "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)")"
ADDON_VERSION=$(node -p -e "require('./package.json').version");
ADDON_ID=$(node -p -e "require('./package.json').addon.id")
DEFAULT_XPI_NAME="${ADDON_ID}-${ADDON_VERSION}".xpi
XPI_NAME="${XPI_NAME:-${DEFAULT_XPI_NAME}}"

# fill templates, could be fancier
mustache='./node_modules/.bin/mustache'
echo 'Filling mustache template files...'
$mustache package.json templates/install.rdf.mustache > addon/install.rdf
$mustache package.json templates/chrome.manifest.mustache > addon/chrome.manifest

echo 'Copying all files in `addon/` into the xpi...'

# xpi all of 'addon' to 'dist'
mkdir -p dist

pushd addon > /dev/null
zip -r  "../dist/${XPI_NAME}" .
popd > /dev/null


# also link 'dist/linked-adddon.xpi' to  it.
pushd "${BASE_DIR}"/dist > /dev/null
rm -f linked-addon.xpi
ln -s "${XPI_NAME}" linked-addon.xpi

popd > /dev/null


echo
echo "SUCCESS: xpi at ${BASE_DIR}/dist/${XPI_NAME}"
echo "SUCCESS: symlinked xpi at ${BASE_DIR}/dist/linked-addon.xpi"

ls -alF "${BASE_DIR}"/dist

