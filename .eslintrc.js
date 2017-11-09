"use strict";

/* All Mozilla specific rules and enviroments at:
 * http://firefox-source-docs.mozilla.org/tools/lint/linters/eslint-plugin-mozilla.html
 */

module.exports = {
  "parserOptions": {
      "ecmaVersion": 8,
      "sourceType": "module",
      "ecmaFeatures": {
          "jsx": false,
          "experimentalObjectRestSpread": true
      }
  },
  env: {
    'es6': true,
    // 'browser-window': false

  },
  extends: [
    "eslint:recommended",
    /* list of rules at:
     * https://dxr.mozilla.org/mozilla-central/source/tools/lint/eslint/eslint-plugin-mozilla/lib/configs/recommended.js
     */
    "plugin:mozilla/recommended",
  ],

  plugins: [
    "json",
    "mozilla"
  ],

  rules: {
    "babel/new-cap": "off",
    "comma-dangle": ["error", "always-multiline"],
    "eqeqeq": "error",
    "indent": ["warn", 2, {SwitchCase: 1}],
    "mozilla/no-aArgs": "warn",
    "mozilla/balanced-listeners": 0,
    "no-console": "warn",
    "no-shadow": ["error"],
    "no-unused-vars": "error",
    "prefer-const": "warn",
    "prefer-spread": "error",
    "semi": ["error", "always"],
  },
};
