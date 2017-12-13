# PUG ARG Experience

## Getting started

```sh
# install dependencies
npm install

## build
npm run eslint
npm run build

## build and run
npm run firefox
```

### Details

First, make sure you are on npm 5+ installed so that the proper dependencies are installed using the package-lock.json file.

```sh
npm install -g npm
```

After cloning the repo (`git clone https://github.com/gregglind/addon-wr.git`), you can run the following commands from the top level directory, one after another:

```sh
npm install
npm run build
```

This packages the add-on into `dist/linked-addon.xpi`. This file is the add-on you load into Firefox.

**Note:** `linked-addon.xpi` is a symbolic link to the extension's true XPI, which is named based on the study's unique `addon.id` specified in `package.json`.


## User Experience / Functionality

See [TESTPLAN.md](./TESTPLAN.md)

## Interesting files / dirs

1. `npm run build`.  Built add-ons go in `dist/`.
2. `addon/` contains all files that go into the Embedded WebExtension.
3. `bin/xpi.sh` zips up the add-on directory into the add-on.
