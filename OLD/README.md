# Base Template for Shield Studies Addons

## Features

- `eslint`

    - es6 for lib, data, test
    - browser, not node for `data/`

- `addons-linter` with `.addonslinterrc`

- ci with Travis OR CircleCi (TODO)

- ability to do code coverage, using `grunt-istanbul` and [`istanbul-jpm`](https://github.com/freaktechnik/istanbul-jpm)

- uses Grunt to do some of the heavy lifting.  Sorry if you hate Grunt.  [I do as well](#1).

- TODO:  Allow better build of React type things for front ends

## General Setup and Install

1.  Clone / copy the directory
2.  `npm install`

## Adding a new npm library

```
npm install --save-dev somelibrary
#edit .jpmignore to allow it in
```

## Contribute

Issues on this Github :)

## Assumptions and Opinions

1.  All code lives in `lib` and is ES6.
2.  All website stuff (web-workers, ui) lives in `data`
3.  Index at `lib/index.js`
4.  Grunt, b/c it makes instrument / coverage easier

    - `grunt-istanbul` + `istanbul-jpm`
    - if you want or need `make`, `gulp`, `webpack` you absolutely can

5.  All the testing happens in a create `testing-env` folder, so that

    - it can use a custom `.jpmignore` file
    - it can do coverage with less silliness

6.  As built, the tests will fail, until you fix the facade tests.
7.  We use `chai` for testing.  If you don't, remove it where it happens.
8.  You are somewhere with some resemblence to Unix cli (Linux or OSX).


