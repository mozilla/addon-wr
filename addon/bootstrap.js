"use strict";

/* global Feature, Services */ // Cu.import
/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "(startup|shutdown|install|uninstall)", "argsIgnorePattern": "^_" }]*/

const { utils: Cu } = Components;
Cu.import("resource://gre/modules/Services.jsm");
const prefs = Services.prefs;

// our pref
const PREFNAME = "browser.display.truth";
if (!prefs.prefHasUserValue(PREFNAME)) {
  prefs.setBoolPref(PREFNAME, false);
}

async function startup(addonData, _reason) {
  const { webExtension } = addonData;

  // set a watcher for that pref.
  // https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIPrefBranch
  prefs.addObserver(PREFNAME, (_aSubject, _aTopic, _aData) => {
    const userOptedIn = prefs.getBoolPref(PREFNAME, false);
    if (userOptedIn) webExtension.startup();
    else webExtension.shutdown();
  });

  // IFF the pref is set, startup
  if (prefs.getBoolPref(PREFNAME, false)) {
    webExtension.startup();
  }
}
