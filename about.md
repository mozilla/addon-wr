# Shield Study Template

`Shield-Study-Template` contains files for for making a **Shield Study Addon**.  Shield Study Addons are **LEGACY ADDONS** for Firefox that include the **SHIELD-STUDIES-ADDON-UTILS**  (`studyUtils.jsm`) file (4.1.x series).

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Contents**

- [`npm` commands for `Shield-Study-Template`](#npm-commands-for-shield-study-template)
- [What is a Shield Study?](#what-is-a-shield-study)
- [tl;dr - Running the Template Study](#tldr---running-the-template-study)
- [Folder Contents](#folder-contents)
- [Parts of A Shield Study (General)](#parts-of-a-shield-study-general)
  - [Shield-Studies-Addon-Utils (`studyUtils.jsm`)](#shield-studies-addon-utils-studyutilsjsm)
  - [Legacy Addons](#legacy-addons)
  - [Building Your Feature, with Variations](#building-your-feature-with-variations)
- [<span id="shield-telemetry">All About Shield Telemetry</span>](#span-idshield-telemetryall-about-shield-telemetryspan)
  - [Shield Study Telemetry Probe Life cycle](#shield-study-telemetry-probe-life-cycle)
  - [Expected ping counts](#expected-ping-counts)
  - [How Probes are Sent from `studyUtils.jsm`](#how-probes-are-sent-from-studyutilsjsm)
- [Send your own probes](#send-your-own-probes)
- [Viewing Sent Telemetry Probes](#viewing-sent-telemetry-probes)
  - [client](#client)
  - [Collector (example s.t.m.o query)](#collector-example-stmo-query)
- [Engineering Side-by-Side (a/b) Feature Variations](#engineering-side-by-side-ab-feature-variations)
- [Kittens or Puppers, the Critical Study We have all been waiting for](#kittens-or-puppers-the-critical-study-we-have-all-been-waiting-for)
- [Get More Help](#get-more-help)
- [Gotchas / FAQ / Ranting](#gotchas--faq--ranting)
  - [General](#general)
  - [studyUtils](#studyutils)
  - [Legacy Addons](#legacy-addons-1)
  - [s.t.m.o - sql.telemetry.mozilla.org](#stmo---sqltelemetrymozillaorg)
- [Glossary](#glossary)
- [OTHER DOCS](#other-docs)
  - [Configuration](#configuration)
  - [Lifecycle](#lifecycle)
  - [Running](#running)
  - [TODO](#todo)
- [Links and References](#links-and-references)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## `npm` commands for `Shield-Study-Template`


```
    "eslint": "eslint addon --ext jsm --ext js --ext json",
    "prebuild": "cp node_modules/shield-studies-addon-utils/dist/StudyUtils.jsm addon/",
    "build": "bash ./bin/xpi.sh",
    "test": "export XPI=dist/linked-addon.xpi && npm run build && mocha test/functional_tests.js --retry 2",
    "harness_test": "export XPI=dist/linked-addon.xpi && mocha test/functional_tests.js --retry 2 --reporter json",
    "firefox": "export XPI=dist/linked-addon.xpi && npm run build && node run-firefox.js",
    "watch": "onchange 'addon/**' 'package.json' 'template/**' -e addon/install.rdf -e addon/chrome.manifest -e addon/StudyUtils.jsm -- npm run build -- '{{event}} {{changed}} $(date)'",
    "sign": "echo 'TBD, see: https://bugzilla.mozilla.org/show_bug.cgi?id=1407757'"
```

## What is a Shield Study?

**Shield Study Addons** do these actions:

- implement variations (1+) of a feature
- report common study and addon lifecycle events to Telemetry
- report study-specific data about how users react to and interact with a specific variations
- respond coherently to addon life-cycle events (`install`, `startup`, `disable`, `uninstall`).


## tl;dr - Running the Template Study

1.  **One time**:

    * Clone this directory

    ```
    git clone template
    rm -rf {.git,docs}/
    git init
    ```

    * install dependencies, including [`mozilla/shield-studies-addon-utils`][mozilla-ssau].

   ```
   npm install
   ```

    * install **Firefox Nightly** for easier development

2. Edit and examine files:

	- `addon/bootstrap.js`
	- `addon/Config.jsm`
	- `package.json`
	- `addon/lib/*`

3.  Build the legacy addon xpi.  Run **Nightly** with addon

	`npm run firefox`

4.  Debug using

    - [`browser console`][link-browser-console]
    - `about:debugging`.

5.  Restart / re-run after addon changes.

Repeat Steps 2-5 as necessary.


## Direcotry Contents

```
├── .circleci/            # setup for Circle-CI integration
|
├── .eslintignore         #
├── .eslintrc.js          # linting rules: mozilla, json
|
├── .git/
├── .gitignore
|
├── README.md             # (this file)
├── TELEMETRY.md          # Telemetry examples for this addon
├── TESTPLAN.md           # Manual QA test plan
|
├── addon                 # Files that will go into the addon
│   ├── Config.jsm
│   ├── StudyUtils.jsm    # (copied in during `prebuild`)
│   ├── bootstrap.js      # LEGACY Bootstrap.js
│   ├── chrome.manifest   # (derived from templates)
│   ├── install.rdf       # (derived from templates)
│   │
│   ├── lib               # JSM (Firefox modules)
│   │   ├── AddonPrefs.jsm
│   │   └── Feature.jsm
|   |
│   └── webextension      # webExtension for Feature and UI
│       ├── .eslintrc.json
│       ├── background.js
│       └── manifest.json
│
├── bin                   # Scripts / commands
│   └── xpi.sh            # build the XPI from contents of `addon/`
│
├── dist                  # built xpi's (addons)
│   ├── @template-shield-study.mozilla.com-1.1.0.xpi
│   └── linked-addon.xpi -> @template-shield-study.mozilla.com-1.1.0.xpi
│
├── package-lock.json
├── package.json
├── run-firefox.js        # command
├── sign/                 # "LEGACY-SIGNED" addons.  used by `npm sign` (TBD)
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
    ├── functional_tests.js  # Edit these
    ├── test-share-study.js  # Examples from another study
    ├── test_harness.js
    ├── test_printer.py
    └── utils.js

```


## Parts of A Shield Study (General)

Note: see [about the #kittens study](#kittens) for architecture of the particulars of the example study.

- Shield-Studies-Addon-Utils
- Legacy Addon framing code
- UI / Feature

    - (optional) Web Extension, embedded
    - (optional) Various Firefox modules (`.jsm` files)

More details on each follow.

### Shield-Studies-Addon-Utils (`studyUtils.jsm`)

`studyUtils.jsm` is a Firefox JavaScript module that provides these capabilities:

1. **suggest variation for a client**
  - deterministic and predicatable:  every startup will suggest the same variation for a particular client
  - per client: uses sha256 hash of (Telemetry Id, study name)

  ```javascript
  const variation = await studyUtils.deterministicVariation(myWeightedVariations);
  studyUtils.setVariation(variation);
  ```
2. **Report lifecycle data** using Telemetry
  - `shield-study` Telemetry bucket
  - [about Shield Telemetry](#shield-telemetry)

  ```javascript
  // some study state events
  studyUtils.firstSeen();
  studyUtils.endStudy(reason);
  studyUtils.startup(ADDON_INSTALL);
  ```
3. **Report feature interaction and success data** using Telemetry
  - `shield-study-addon` Telemetry bucket

  ```javascript
  // values must be strings
  studyUtils.telemetry({evt:"click", button:"share", times:"3"})
  ```
4. **Annotate Telemetry Enviroment** to mark the user as special, and copy every `main` and other ping to a special bucket for faster analysis.

**Links** for `studyUtils` code:

- `npm install shield-studies-addon-utils`
- `node_modules/shield-studies-addon-utils/dist/studyUtils.jsm`
- Github: [mozilla/shield-studies-addon-utils](https://github.com/mozilla/shield-studies-addon-utils)


### Legacy Addons

**Note**: to send Telemetry and see the ClientId, study addons require `Components.utils` (Chrome) privileges.  Firefox webExtensions do not have those privileges.  All Study Addons must be [Legacy Extensions][link-legacy].

A **Legacy Addon** consists of:

* files

  - `bootstrap.js`
  - `install.rdf`
  - optional `chrome.manifest`, `update.rdf` etc.

* build process to turn these files an `xpi`.
* signing process using the [Legacy Signing Key][legacy-signing], to enable running in Beta and Release.

### Your Feature, with Variations

If you have UI:

- embedded web extension - suggested (where possible).  See [link-extensions]
- jsm files

If you do not have UI

- jsm files



## <span id="shield-telemetry">Shield Telemetry Details</span>

### Shield Study Life-Cycle Telemetry

```
    time ------------->

    ENTRY +-> INSTALL +----> ENDINGS +------> EXIT


    enter +-> install +----> user-disable     exit (all states)
       +      +  +  +
       |      |  |  +------> ended-positive
       |      |  |
       |      |  +---------> ended-neutral
       |      |
       |      +------------> ended-negative
       |      |
       |      +------------> expired
       |
       |
       | (only if not installed)
       +-------------------> inelegible       exit

```


### Expected ping counts

All **N** enters will eventually have an ending and an exit.

There will be **i** installs ( \\( i \le N \\) ).

There will be **x** ineligibles ( \\( x \le N \\) ).

\\( N = i + x \\)


```
     enter  ==  exit
            ==  (install + ineligible)

    install == user-disable + expired + ended-*
```

### How Probes are Sent from `studyUtils.jsm`

Note:

`const su = Cu.import("resource://path/to/StudyUtils.jsm")`

`study_state` | `studyUtils` call | when to call it
--- | --- | ---
`enter` | `su.firstSeen()` |   call ONCE per study  during `ADDON_INSTALL`
`install` | `su.startup(ADDON_INSTALL)`  |  During `boostrap.js:startup`
none sent | `su.startup(<other reasons>)` |  Never
**ENDINGS** | | Affected by the `endings` config value.
`user-disable` | `su.endStudy("user-disable")` | Implies user uninstalled or disabled addon, or (BUG) Normandy uninstalled it.
`expired` | `su.endStudy("expired")` | Time-limited study reached expiration.
`ended-positive` | `su.endStudy("ended-positive")` | General study-defined 'good ending', such as attempting to use feature.
`ended-negative` | `su.endStudy("ended-negative")` | General study-defined 'bad ending', such as clicking 'I do not like this feature'.
`ended-neutral` | `su.endStudy("ended-neutral")` | General study-defined 'neutral ending'.
`ineligible` | `su.endStudy("ineligible")` |  During install, client actually not appropriate for study, for some study-specific reason.
**EXIT** | |
`exit` | | automatically sent as part of `endStudy`


**Note**:  Every user should have

- exactly 1 each of ENTER, EXIT
- exactly 1 of either INSTALL or INELGIBLE
- exactly one 'ending' ping (which might be INELIGIBLE, EXPIRED, USER-DISABLE, ENDED-*)

**Note**: [Full Schemas - gregglind/shield-study-schemas](https://github.com/gregglind/shield-study-schemas/tree/master/schemas-client)


### Send your own probes

Use: `shieldStudy.telemetry(anObjectWithStringValues)`

This will send data to the `shield-study-addon` bucket.  The `key=>string` map will be the `payload.data.attributes` key.

Example:

```javascript
// values must be strings
studyUtils.telemetry({evt:"click", button:"share", times:"3"})
```

### Defining Custom Study Endings

Suppose you want some 'early endings', such as:

- positive:  user reached "end of the built UI".
- negative:  user clicked on "no thanks".

Define in `endings`:

```
endings: {
  /** User defined endings */
  "user-attempted-signup": {
    "baseUrl": "http://www.example.com/?reason=too-popular",
    "study_state": "ended-positive",  // neutral is default
  }
}
```

Then:

```
studyUtils.endStudy("user-attempted-signup");
```


## Viewing Sent Telemetry Probes

### client

1.  **Use the QA Helper Addon**

    The QA-Shield-Study-Helper lists the `payload.data` field for every `shield-study` and `shield-study-addon` ping.

    [Bugzilla for QA Helper Addon](https://bugzilla.mozilla.org/show_bug.cgi?id=1407757
    )
    [direct install link for Signed XPI for @qa-shield-study-helper-1.0.0.xpi][qa-helper-addon-direct]

    Example output:

    ```text
    // common fields

    branch        up-to-expectations-1        // should describe Question text
    study_name    57-perception-shield-study
    addon_version 1.0.0
    version       3


    2017-10-09T14:16:18.042Z shield-study
    {
      "study_state": "enter"
    }
    2017-10-09T14:16:18.055Z shield-study
    {
      "study_state": "installed"
    }
    2017-10-09T14:16:18.066Z shield-study-addon
    {
      "attributes": {
        "event": "prompted",
        "promptType": "notificationBox-strings-1"
      }
    }
    2017-10-09T16:29:44.109Z shield-study-addon
    {
      "attributes": {
        "promptType": "notificationBox-strings-1",
        "event": "answered",
        "yesFirst": "1",
        "score": "0",
        "label": "not sure",
        "branch": "up-to-expectations-1",
        "message": "Is Firefox performing up to your expectations?"
      }
    }
    2017-10-09T16:29:44.188Z shield-study
    {
      "study_state": "ended-neutral",
      "study_state_fullname": "voted"
    }
    2017-10-09T16:29:44.191Z shield-study
    {
      "study_state": "exit"
    }
    ```

2.  Use `about:telemetry`, and look for `shield-study` or `shield-study-addon` probes.



### Collector (example s.t.m.o query)

[Example s.t.m.o study states query for "Pioneer Enrollement"][stmo-study-states] shows the Study lifecycle for every client in the Pioneer Enrollment study.



## Engineering Side-by-Side (a/b) Feature Variations

Note: this is a gloss / summary.


1.  Your feature has a `startup` or `configuration` method that does different things depending on which variation is chosen.

    ```javascript
    // bootstrap.js startup()...
   const variation = await studyUtils.deterministicVariation(myWeightedVariations);
    studyUtils.setVariation(variation);

    //...

    // start the feature
    TheFeature.startup(variation)
    ```

2.  Ensure that your Feature measures every variation, including the Control (no-effect).


## Kittens or Puppers, the Critical Study We have all been waiting for

Style:

- Embedded Web Extension
- Telmetry on 'button click'
- has one "end early" condition:  3 or more button presses during a sesson.
- Goal: test if 'interest rate is higher for kittens or puppies, using a PROXY MEASURE -- "button clicks"







## Get More Help

- slack: `#shield`



## Gotchas / FAQ / Ranting

### General

I am on Windows.  How can I build?

- (see TODO link to the issue and instructions by JCrawford)

### studyUtils



### The lifecycle and deployment of the add-on once it gets released

The add-on for the experiment is remotely installed to the users which are selected for the experiment. (Note that this leads to an environment-change and a subsequent main ping)

Main telemetry is tagged with the user's currently running experiments so that the main telemetry data and shield ping data can be cross-referenced later. 

After the experiment, the add-on is remotely uninstalled. In rare occasions, it remains installed until a new Firefox update is released.  



### Legacy Addons

Debugging `Cu.import`.

- use `run-firefox` to 'try again' after any change to modules.  "Reload addon" will probably not work.
- Based on `chrome.manifest` files.
- `chrome.manifest` paths can't have `@ # ; : ? /`
- `chrome.manifest` isn't read yet in `bootstrap.js` main scope, OR during `install`.  It is read during `startup` and `shutdown`
- Remember to uninstall your modules.
- [browser console][link-browser-console] will show errors sometimes.


### s.t.m.o - [sql.telemetry.mozilla.org](http://sql.telemetry.mozilla.org/)


#### Where are my pings?

1.  Are you seeing them in `about:telemetry` and / or the QA-Study-Helper.  If YES, then they are being reported at client, good!  If NO:   check the config settings for your study for `telemetry.send => true`
2. Is pref set weirdly:  `toolkit.telemetry.server => https://incoming.telemetry.mozilla.org`.  If you are running from `run_firefox` and maybe lots of other contexts, this pref will not be properly set (because we don’t usually want to send telemetry!)   BAD RESULT:  “toolkit.telemetry.server”, Pref::new(“https://%(server)s/dummy/telemetry/“))
3.  Have you waited… 3-5 minutes?


- All error messages are misleading.  They almost always indicate issues with syntax.   Sometimes they indicate mis-spelled fields.
- No SEMI-COLONS at the end of your sql!
- Athena >> Presto (10-20x faster!)
- Be careful with single and double-quotes.

## Glossary

- **Probe**.  A Telemetry measure, or ping.  More broadly:  any measure sent anywhere.
- **Variation**.  synonyms (branch, arm):
   - which *specific* version / configuration a specific client is randomized into.
   - A JSON object describing the configuration for that specific choice, with keys like `name`.

## OTHER DOCS

- template/README.md

    - should be edited for YOUR STUDY
    - move the general npm commands there
    - links to 'about shield stuides' (in general)
    - shield-study-addon-utils api


## `StudyUtils.jsm` api used in `bootstrap.js`

### Configuration

- `studyUtils.setup`

    Needed to send any telemetry

    Minimal setup:

    ```
    {
        "studyName": "a-study-name",
        "endings": {},
        "telemetry": {
          "send": true, // assumed false. Actually send pings?
          "removeTestingFlag": false,  // Marks pings as testing, set true for actual release
        }
    }
    ```


- `studyUtils.deterministicVariation(weightedVariations)`

    Suggest a variation.

- `studyUtils.setVariation(anObjectWithNameKey)`

    Actually set the variation.


### Lifecycle

- `studyUtils.firstSeen()`

    - Send the `enter` ping.
    - Future:  Record first entry.

- `await studyUtils.startup({reason})`

    If 'install', send an install ping.

- `studyUtils.endStudy(endingName)`;

    - Send ending ping
    - Open a url for that ending if defined
    - Uninstalls addon


### Running

- `await studyUtils.info()`

    Return configuration info

- `studyUtils.respondToWebExtensionMessage`

    "Do shield things" (`telemetry`, `info`, `endStudy`)

- `studyUtils._isEnding`

    Useful flag for knowing if something is already calling an ending, to help prevent race conditions and "double endings"

- `studyUtils.telemetry(stringStringObject)`

    Send a 'study specific' ping to `shield-study-addon` bucket.



### TODO

Change SSAU api to this:

- suggestVariation
- setup(includes branch)
- install() => firstSeen() => ping('enter');
-
- alreadyEnding()
- endStudy()?  tryEndStudy()?   # first in.

- info
- respondToWebExtension / respond?
- telemetry


## FIXES

```
startup(reason) {
  const isEligible = some Fn();
  studyUtils.startup(reason, isEligible)

  if INSTALL {
    if !isEliglbe endStudy('ineligible')

  }
  startup(reason)

  ==> utils.startup(reason)
    if INSTALL, then send install
    else send nothing
}

```

```
install
- elgible
- not eligible


specialPing("enter")
sendEnterPing
sendInstallPing
endStudy

endStudy()

telemetry();

```

## TODO

- debuggin and setting localstore?  Prefs are 1000x easier
- debug both halves.


## Template

- see the cloneable template HERE
- see some other examples HERE

if at template...
say
Acutally, read the docs at SSAU there.


## Getting QA of your addons

https://mana.mozilla.org/wiki/display/PI/PI+Request

## Links and References

[link-browser-console]: https://developer.mozilla.org/en-US/docs/Tools/Browser_Console

[link-legacy]:  https://developer.mozilla.org/en-US/Add-ons/Legacy_add_ons


[link-webextensions]:  https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Examples

[link-embedded]: https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Embedded_WebExtensions

[stmo-study-states]: https://sql.telemetry.mozilla.org/queries/47604/source#table

[qa-helper-addon-direct]: https://bugzilla.mozilla.org/attachment.cgi?id=8917534

[legacy-signing]:  see TODO link

[mozilla-ssau]: https://github.com/mozilla/shield-studies-addon-utils
