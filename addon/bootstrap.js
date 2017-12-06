"use strict";

/* global Services */ // Cu.import
/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "(startup|shutdown|install|uninstall)", "argsIgnorePattern": "^_" }]*/

const { utils: Cu } = Components;
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "LegacyExtensionsUtils",
  "resource://gre/modules/LegacyExtensionsUtils.jsm");

const prefs = Services.prefs;

// our pref
const PREFNAME = "browser.display.truth";
if (!prefs.prefHasUserValue(PREFNAME)) {
  prefs.setBoolPref(PREFNAME, false);
}

async function startup(addonData, _reason) {
  // set a watcher for that pref.
  // https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIPrefBranch
  prefs.addObserver(PREFNAME, (_aSubject, _aTopic, _aData) => {
    const userOptedIn = prefs.getBoolPref(PREFNAME, false);

    /* per https://dxr.mozilla.org/mozilla-central/source/toolkit/mozapps/extensions/internal/XPIProvider.jsm#4387-4400
     * only 'startup' is exposed, not 'shutdown'
     *
     * use this method:
     * - https://searchfox.org/mozilla-central/source/browser/extensions/screenshots/bootstrap.js#168
     */
    const realWebExtension = LegacyExtensionsUtils.getEmbeddedExtensionFor(addonData);

    if (userOptedIn) realWebExtension.startup();
    else realWebExtension.shutdown();
  });

  // IFF the pref is set, startup
  if (prefs.getBoolPref(PREFNAME, false)) {
    webExtension.startup();
  }
}
