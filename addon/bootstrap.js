"use strict";

/**
 * @TODO - watch pref changes
 *
 */

/* global Feature, Services */ // Cu.import
/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "(startup|shutdown|install|uninstall)" }]*/

const { utils: Cu } = Components;
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");


class Feature () {
  constructor () {
    // watch pref for changes
  }
  optedIn () {
    const key = "browser.whiterose";
    const name = Services.prefs.getBoolPref(key, false);
    return name;
  }
}

const feature = new Feature ();

async function startup(addonData, reason) {
  const { webExtension } = addonData;
  webExtension.startup().then(api => {
    const {browser} = api;
    browser.runtime.onMessage.addListener(function allEmbeddedMessages(msg, sender, respond) {
      if (msg === "optedIn?") {
        respond(feature.isOptedIn());
      }
      if (msg === "watchOptIn") {
        // @TODO - glind, figure this out
      }
    });
  });
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

