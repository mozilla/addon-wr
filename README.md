# Shield Study Embedded Web Extension Template

**Note**:  This is toy / demonstration [Shield Study](https://wiki.mozilla.org/Firefox/Shield/Shield_Studies) Legacy Addon.  Use this as a template for yours


## Getting started

```
# install depndencies
npm install

## build
npm run eslint 
npm run build

## build and run
npm run firefox
```

### Details

First, make sure you are on NPM 5+ installed so that the proper dependencies are installed using the package-lock.json file.

`$ npm install -g npm`

After cloning the repo, you can run the following commands from the top level directory, one after another:

```
$ npm install
$ npm run build
```

This packages the add-on into `dist/linked-addon.xpi`. This file is the addon you load into Firefox.

Note: `linked-addon.xpi` is a symbolic link to the extension's true XPI, which is named based on the study's unique addon ID specified in `package.json`.


## About This Study

(Note: get these from your PHD).

Goal:  Determine which if any TOOLBAR BUTTONS DESIGNS is the most enticing to the user.


## User Experience / Functionality

During INSTALL ONLY users see:

- a notification bar

    -  introducing the feature. 
    -  allowing them to opt out 

During FIRST INSTALL and EVERY OTHER STARTUP, users see:

- a 'toolbar button' (webExtension BrowserAction)

    - with one of 3 images (Cat, Dog, Lizard)

Clicking on the button

- changes the badge
- sends telemetry

Icon will be the same every run.

If the user clicks on the badge more than 3 times, it ends the study.


## Data Collected / Telemetry Pings

Measure:
- Button (BrowserAction) usage.

see [TELEMETRY.md](./TELEMETRY.md)

## Test plan

see [TESTPLAN](./TESTPLAN.md)


# Directory Structure and Files


```
├── .circleci/            # setup for .circle ci integration
├── .eslintignore
├── .eslintrc.js          # mozilla, json
├── .git/
├── .gitignore
├── README.md             # (this file)
├── TELEMETRY.md          # Telemetry examples for this addon
├── TESTPLAN.md           # Manual QA test plan
├── addon                 # Files that will go into the addon
│   ├── Config.jsm
│   ├── StudyUtils.jsm    # (copied in during `prebuild`)
│   ├── bootstrap.js      # LEGACY Bootstrap.js
│   ├── chrome.manifest   # (derived from templates)
│   ├── install.rdf       # (derived from templates)
│   │
│   ├── lib               # JSM (Firefox modules)
│   │   └── AddonPrefs.jsm 
│   │   └── Feature.jsm   # does `introduction`
|   |
│   └── webextension      # modern, embedded webextesion
│       ├── .eslintrc.json
│       ├── background.js
│       ├── icons
│       │   ├── Anonymous-Lizard.svg
│       │   ├── DogHazard1.svg
│       │   ├── Grooming-Cat-Line-Art.svg
│       │   ├── isolatedcorndog.svg
│       │   ├── kittens.svg
│       │   ├── lizard.svg
│       │   └── puppers.svg
│       └── manifest.json
│
├── bin                   # Scripts / commands
│   └── xpi.sh            # build the XPI
│
├── dist                  # built xpis (addons)
│   ├── @template-shield-study.mozilla.com-1.1.0.xpi
│   └── linked-addon.xpi -> @template-shield-study.mozilla.com-1.1.0.xpi
│
├── package-lock.json
├── package.json
├── run-firefox.js        # command
├── sign/                 # "LEGACY-SIGNED" addons.  used by `npm sign`
│
│
├── templates             # mustache templates, filled from `package.json`
│   ├── chrome.manifest.mustache
│   └── install.rdf.mustache
│
│
└── test                  # Automated tests `npm test` and circle
    ├── Dockerfile
    ├── docker_setup.sh
    ├── functional_tests.js
    ├── test-share-study.js
    ├── test_harness.js
    ├── test_printer.py
    └── utils.js


>> tree -a -I node_modules

```

## General Shield Study Engineering

Shield study add-ons are legacy (`addon/bootstrap.js`) add-ons with an optional embedded web extension (`addon/webextension/background.js`).

The web extension needs to be packaged together with a legacy add-on in order to be able to access Telemetry data, user preferences etc that are required for collecting relevant data for [Shield Studies](https://wiki.mozilla.org/Firefox/Shield/Shield_Studies).

It is recommended to build necessary logic and user interface using in the context of the webextension and communicate with the legacy add-on code through messaging whenever privileged access is required.

For more information, see [./about.md]


### Similar repositories

[https://github.com/benmiroglio/shield-study-embedded-webextension-hello-world-example]() - A repository that was created this week specifically to help new Shield/Pioneer engineers to quickly get up and running with a Shield add-on. It was however built upon an older and much more verbose addon template, which makes it's file structure hard to follow.
[https://github.com/gregglind/template-shield-study]() - The incubation repo for the updated structure and contents of this repo. Use this repo instead.   


### Loading the Web Extension in Firefox

You can have Firefox automatically launched and the add-on installed by running:

`$ npm run firefox`

To load the extension manually instead, open (preferably) the [Developer Edition of Firefox](https://www.mozilla.org/firefox/developer/) and load the `.xpi` using the following steps:

* Navigate to *about:config* and set `extensions.legacy.enabled` to `true`. This permits the loading of the embedded Web Extension since new versions of Firefox are becoming restricted to pure Web Extensions only.
* Navigate to *about:debugging* in your URL bar
* Select "Load Temporary Add-on"
* Find and select the `linked-addon.xpi` file you just built.

### Seeing the add-on in action

To debug installation and loading of extensions loaded in this manner, use the Browser Console which can be open from Firefox's top toolbar in `Tools > Web Developer > Browser Console`. This will display Shield (loading/telemetry) and `console.log()` output from the extensions that we build.

You should see a green puzzle piece icon in the browser address bar. You should also see the following in the Browser Console (`Tools > Web Developer > Browser Console`), which comes from this add-on:

```
install 5  bootstrap.js:125
startup ADDON_INSTALL  bootstrap.js:33
info {"studyName":"mostImportantExperiment","addon":{"id":"template-shield-study@mozilla.com","version":"1.0.0"},"variation":{"name":"kittens"},"shieldId":"8bb19b5c-99d0-cc48-ba95-c73f662bd9b3"}  bootstrap.js:67
1508111525396	shield-study-utils	DEBUG	log made: shield-study-utils
1508111525398	shield-study-utils	DEBUG	setting up!
1508111525421	shield-study-utils	DEBUG	firstSeen
1508111525421	shield-study-utils	DEBUG	telemetry in:  shield-study {"study_state":"enter"}
1508111525421	shield-study-utils	DEBUG	getting info
1508111525423	shield-study-utils	DEBUG	telemetry: {"version":3,"study_name":"mostImportantExperiment","branch":"kittens","addon_version":"1.0.0","shield_version":"4.1.0","type":"shield-study","data":{"study_state":"enter"},"testing":true}
1508111525430	shield-study-utils	DEBUG	startup 5
1508111525431	shield-study-utils	DEBUG	getting info
1508111525431	shield-study-utils	DEBUG	marking TelemetryEnvironment: mostImportantExperiment
1508111525476	shield-study-utils	DEBUG	telemetry in:  shield-study {"study_state":"installed"}
1508111525477	shield-study-utils	DEBUG	getting info
1508111525477	shield-study-utils	DEBUG	telemetry: {"version":3,"study_name":"mostImportantExperiment","branch":"kittens","addon_version":"1.0.0","shield_version":"4.1.0","type":"shield-study","data":{"study_state":"installed"},"testing":true}
1508111525479	shield-study-utils	DEBUG	getting info
1508111525686	shield-study-utils	DEBUG	getting info
1508111525686	shield-study-utils	DEBUG	respondingTo: info
init kittens  background.js:29:5
```

Note: This add-on force assigns users to the `kitten` group/variation (in `addon/Config.jsm`), which is why the console will always report `init kittens`.

Click on the web extension's green 'puzzle piece' icon to trigger additional console output and sending of telemetry data.

To end early: Click on button multiple times until the 'too-popular' endpoint is reached. This will result in the uninstallation of the extension, and the user will be sent to the URL specified in `addon/Config.jsm` under `endings -> too-popular`.

That's it! The rest is up to you. Fork the repo and hack away.

### Developing

You can automatically build recent changes and package them into a `.xpi` by running the following from the top level directory:

`$ npm run watch`

Now, anytime a file is changed and saved, node will repackage the add-on. You must reload the add-on as before, or by clicking the "Reload" under the add-on in *about:debugging*. Note that a hard re-load is recommended to clear local storage. To do this, simply remove the add-on and reload as before.

### Description of what goes on when this addon is started

During `bootstrap.js:startup(data, reason)`:

    a. `shieldUtils` imports and sets configuration from `Config.jsm`
    b. `bootstrap.js:chooseVariation` explicitly and deterministically chooses a variation from `studyConfig.weightedVariations`
    c.  the WebExtension starts up
    d.  `boostrap.js` listens for requests from the `webExtension` that are study related:  `["info", "telemetry", "endStudy"]`
    e.  `webExtension` (`background.js`) asks for `info` from `studyUtils` using `askShield` function.
    f.  Feature starts using the `variation` from that info.
    g.  Feature instruments user button to send `telemetry` and to `endStudy` if the button is clicked enough.

Tip: It is particularly useful to compare the source code of previously deployed shield studies with this template (and each other) to get an idea of what is actually relevant to change between studies vs what is mostly untouched boilerplate.

### Getting Data

Telemetry pings are loaded into S3 and re:dash. You can use this [Example Query](https://sql.telemetry.mozilla.org/queries/46999/source#table) as a starting point.

### Testing

Run the following to run the example set of functional tests:

`$ npm test`

Note: The functional tests are using async/await, so make sure you are running Node 7.6+

The functional testing set-up is imported from [https://github.com/mozilla/share-button-study]() which contains plenty of examples of functional tests relevant to Shield study addons.
