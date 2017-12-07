"use strict";

module.exports = {
  env: {
    mocha: true,
  },

  globals: {
    assert: false,
    By: false,
    clipboardy: false,
    Context: false,
    MAX_TIMES_TO_SHOW: false,
    MOZILLA_ORG: false,
    postTestReset: false,
    until: false,
    utils: false,
  },

  rules: {
    "no-console": "off",
  },
};
