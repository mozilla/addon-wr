"use strict";

/* All Mozilla specific rules and enviroments at:
 * http://firefox-source-docs.mozilla.org/tools/lint/linters/eslint-plugin-mozilla.html
 */

module.exports = {
  parserOptions: {
    ecmaFeatures: {
      jsx: false,
      experimentalObjectRestSpread: true,
    },
    ecmaVersion: 8,
    sourceType: "module",
  },

  env: {
    browser: true,
    es6: true,
    webextensions: true,
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
    "mozilla",
  ],

  root: true,

  rules: {
    "babel/new-cap": "off",
    "mozilla/no-aArgs": "warn",
    "mozilla/balanced-listeners": "off",

    "comma-dangle": ["error", "always-multiline"],
    "eqeqeq": "error",
    "indent": ["warn", 2, {SwitchCase: 1}],
    "no-console": "warn",
    "no-shadow": "error",
    "no-unused-vars": "error",
    "prefer-const": "warn",
    "prefer-spread": "error",
    "semi": ["error", "always"],
  },
};
