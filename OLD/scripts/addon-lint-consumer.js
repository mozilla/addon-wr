#!/usr/bin/env node

/*
  usage:

  ```
  jpm xpi  # makes myaddon.xpi
  npm install addon-linter
  ./node_modules/.bin/addon-linter myaddon.xpi | node addon-lint-consumer.js
  ```

  license:  PUBLIC DOMAIN.


//example .addonlinterrc
ignorerules:
  LOW_LEVEL_MODULE: true
  KNOWN_LIBRARY: true

*/

var yamljs = require('yamljs');

function loadRules (fn) {
  var ignored = {};
  try {
    ignored = (yamljs.load(fn)).ignorerules;
  } catch (err) {
    // ignore
  }
  return ignored;
}

function filterLint(lint, ignored) {
  ['errors', 'notices', 'warnings'].map(function (k) {
    var filtered = lint[k].filter(function (seen) {
      return !(seen.code in ignored);
    });
    lint[k] = filtered;
  });
  return lint;
}

function output(filteredLint) {
  var show = 0;
  ['errors', 'notices', 'warnings'].map(function (k) {
    if (filteredLint[k].length) {
      show = 1;
    }
  });
  if (show) {
    console.error(filteredLint);
  }
  process.exit(show);
}

function doTheWork(content) {
  // your code here
  var ignored = loadRules('.addonlinterrc');
  output(filterLint(JSON.parse(content),ignored));
}

// read in all the stdin
var content = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', function (buf) {
  content += buf.toString();
});
process.stdin.on('end', function () {
  // your code here
  doTheWork(content);
});
