"use strict";

/* global  __SCRIPT_URI_SPEC__  */
/* global Feature, Services */ // Cu.import
/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "(startup|shutdown|install|uninstall)" }]*/

const { utils: Cu } = Components;
Cu.import("resource://gre/modules/Console.jsm");
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

const CONFIGPATH = `${__SCRIPT_URI_SPEC__}/../Config.jsm`;
const { config } = Cu.import(CONFIGPATH, {});

const STUDYUTILSPATH = `${__SCRIPT_URI_SPEC__}/../${config.studyUtilsPath}`;
const { studyUtils } = Cu.import(STUDYUTILSPATH, {});

const REASONS = studyUtils.REASONS;

// QA NOTE: Study Specific Modules - package.json:addon.chromeResouce
const BASE = `template-shield-study-button-study`;
XPCOMUtils.defineLazyModuleGetter(this, "Feature", `resource://${BASE}/lib/Feature.jsm`);


// var log = createLog(studyConfig.study.studyName, config.log.bootstrap.level);  // defined below.
// log("LOG started!");

/* Example addon-specific module imports.  Remember to Unload during shutdown!

  // https://developer.mozilla.org/en-US/docs/Mozilla/JavaScript_code_modules/Using


   Ideally, put ALL your feature code in a Feature.jsm file,
   NOT in this bootstrap.js.

  const BASE=`template-shield-study`;
  XPCOMUtils.defineLazyModuleGetter(this, "SomeExportedSymbol",
    `resource://${BASE}/SomeModule.jsm");

  XPCOMUtils.defineLazyModuleGetter(this, "Preferences",
    "resource://gre/modules/Preferences.jsm");
*/

async function startup(addonData, reason) {
  // `addonData`: Array [ "id", "version", "installPath", "resourceURI", "instanceID", "webExtension" ]  bootstrap.js:48
  console.log("startup", REASONS[reason] || reason);

  /* Configuration of Study Utils*/
  studyUtils.setup({
    ...config,
    addon: { id: addonData.id, version: addonData.version },
  });
  // choose the variation for this particular user, then set it.
  const variation = getVariationFromPref(config.weightedVariations) ||
    await studyUtils.deterministicVariation(
      config.weightedVariations
    );
  studyUtils.setVariation(variation);
  console.log(`studyUtils has config and variation.name: ${variation.name}.  Ready to send telemetry`);


  /** addon_install ONLY:
    * - note first seen,
    * - check eligible
    */
  if ((REASONS[reason]) === "ADDON_INSTALL") {
    //  telemetry "enter" ONCE
    studyUtils.firstSeen();
    const eligible = await config.isEligible(); // addon-specific
    if (!eligible) {
      // 1. uses config.endings.ineligible.url if any,
      // 2. sends UT for "ineligible"
      // 3. then uninstalls addon
      await studyUtils.endStudy({reason: "ineligible"});
      return;
    }
  }

  // startup for eligible users.
  // 1. sends `install` ping IFF ADDON_INSTALL.
  // 2. sets activeExperiments in telemetry environment.
  await studyUtils.startup({reason});

  // if you have code to handle expiration / long-timers, it could go here
  (function fakeTrackExpiration() {})();

  // IFF your study has an embedded webExtension, start it.
  const { webExtension } = addonData;
  if (webExtension) {
    webExtension.startup().then(api => {
      const {browser} = api;
      /** spec for messages intended for Shield =>
        * {shield:true,msg=[info|endStudy|telemetry],data=data}
        */
      browser.runtime.onMessage.addListener(studyUtils.respondToWebExtensionMessage);
      // other browser.runtime.onMessage handlers for your addon, if any
    });
  }

  // log what the study variation and other info is.
  console.log(`info ${JSON.stringify(studyUtils.info())}`);

  // Actually Start up your feature
  new Feature({variation, studyUtils, reasonName: REASONS[reason]});
}

/** Shutdown needs to distinguish between USER-DISABLE and other
  * times that `endStudy` is called.
  *
  * studyUtils._isEnding means this is a '2nd shutdown'.
  */
function shutdown(addonData, reason) {
  console.log("shutdown", REASONS[reason] || reason);
  // FRAGILE: handle uninstalls initiated by USER or by addon
  if (reason === REASONS.ADDON_UNINSTALL || reason === REASONS.ADDON_DISABLE) {
    console.log("uninstall or disable");
    if (!studyUtils._isEnding) {
      // we are the first 'uninstall' requestor => must be user action.
      console.log("probably: user requested shutdown");
      studyUtils.endStudy({reason: "user-disable"});
      return;
    }
    // normal shutdown, or 2nd uninstall request

    // QA NOTE:  unload addon specific modules here.
    Cu.unload();


    // clean up our modules.
    Cu.unload(CONFIGPATH);
    Cu.unload(STUDYUTILSPATH);
  }
}

function uninstall(addonData, reason) {
  console.log("uninstall", REASONS[reason] || reason);
}

function install(addonData, reason) {
  console.log("install", REASONS[reason] || reason);
  // handle ADDON_UPGRADE (if needful) here
}



// helper to let Dev or QA set the variation name
function getVariationFromPref(weightedVariations) {
  const key = "shield.test.variation";
  const name = Services.prefs.getCharPref(key, "");
  if (name !== "") {
    const variation = weightedVariations.filter(x => x.name === name)[0];
    if (!variation) {
      throw new Error(`about:config => shield.test.variation set to ${name}, but not variation with that name exists`);
    }
    return variation;
  }
  return name; // undefined
}


// logging, unfinished
// function createLog(name, levelWord) {
//  Cu.import("resource://gre/modules/Log.jsm");
//  var L = Log.repository.getLogger(name);
//  L.addAppender(new Log.ConsoleAppender(new Log.BasicFormatter()));
//  L.level = Log.Level[levelWord] || Log.Level.Debug; // should be a config / pref
//  return L;
// }

