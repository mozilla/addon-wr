"use strict";

/** `background.js` example for embedded webExtensions.
  * - As usual for webExtensions, controls BrowserAction (toolbar button)
  *   look, feel, interactions.
  *
  * - Also handles 2-way communication with the HOST (Legacy Addon)
  *
  *   - all communication to the Legacy Addon is via `browser.runtime.sendMessage`
  *
  *   - Only the webExtension can initiate messages.  see `msgStudy('info')` below.
  */


/**  Re-usable code for talking to `studyUtils` using `browser.runtime.sendMessage`
  *  - Host listens and responds at `bootstrap.js`:
  *
  *   `browser.runtime.onMessage.addListener(studyUtils.respondToWebExtensionMessage)`;
  *
  *  - `msg` calls the corresponding studyUtils API call.
  *
  *     - info: current studyUtils configuration, including 'variation'
  *     - endStudy: for ending a study
  *     - telemetry: send a 'shield-study-addon' packet
  */
async function msgStudyUtils(msg, data) {
  const allowed = ["endStudy", "telemetry", "info"];
  if (!allowed.includes(msg)) throw new Error(`shieldUtils doesn't know ${msg}, only knows ${allowed}`);
  try {
    // the 'shield' key is how the Host listener knows it's for shield.
    const ans = await browser.runtime.sendMessage({shield: true, msg, data});
    return ans;
  } catch (e) {
    console.error("ERROR msgStudyUtils", msg, data, e);
    throw e
  }
}

/** `telemetry`
  *
  * - check all pings for validity as 'shield-study-addon' pings
  * - tell Legacy Addon to send
  *
  * Good practice: send all Telemetry from one function for easier
  * logging, debugging, validation
  *
  * Note: kyes, values must be strings to fulfill the `shield-study-addon`
  *   ping-type validation.  This allows `payload.data.attributes` to store
  *   correctly at Parquet at s.t.m.o.
  *
  *   Bold claim:  catching errors here
  *
  */
function telemetry (data) {
  function throwIfInvalid (obj) {
    // Check: all keys and values must be strings,
    for (const k in obj) {
      if (typeof k !== 'string') throw new Error(`key ${k} not a string`);
      if (typeof obj[k] !== 'string') throw new Error(`value ${k} ${obj[k]} not a string`);
    }
    return true
  }
  throwIfInvalid(data);
  return msgStudyUtils("telemetry", data);
}


class BrowserActionButtonChoiceFeature {
  /**
    * - set image, text, click handler (telemetry)
    * - tell Legacy Addon to send
    */
  constructor(variation) {
    console.log("initilizing BrowserActionButtonChoiceFeature:", variation.name);
    this.timesClickedInSession = 0;

    // modify BrowserAction (button) ui for this particular {variation}
    console.log("path:", `icons/${variation.name}.svg`)
    browser.browserAction.setIcon({path: `icons/${variation.name}.svg`});
    browser.browserAction.setTitle({title: variation.name});
    browser.browserAction.onClicked.addListener(() => this.handleButtonClick());
  }

  /** handleButtonClick
    *
    * - instrument browserAction button clicks
    * - change label
    */
  handleButtonClick() {
    // note: doesn't persist across a session, unless you use localStorage or similar.
    this.timesClickedInSession += 1;
    console.log("got a click", this.timesClickedInSession);
    browser.browserAction.setBadgeText({text: this.timesClickedInSession.toString()});

    // telemetry: FIRST CLICK
    if (this.timesClickedInSession == 1) {
      this.telemetry({"event": "button-first-click-in-session"});
    }

    // telemetry EVERY CLICK
    telemetry({"event": "button-click", timesClickedInSession: ""+this.timesClickedInSession});

    // webExtension-initiated ending for "used-often"
    //
    // - 3 timesClickedInSession in a session ends the study.
    // - see `../Config.jsm` for what happens during this ending.
    if (this.timesClickedInSession >= 3) {
      msgStudyUtils("endStudy", {reason: "used-often"});
    }
  }
}

/** CONFIGURE and INSTRUMENT the BrowserAction button for a specific variation
 *
 *  1. Request 'info' from the hosting Legacy Extension.
 *  2. We only care about the `variation` key.
 *  3. initialize the feature, using our specific variation
 */
function runOnce() {
  msgStudyUtils("info").then(
    ({variation}) => new BrowserActionButtonChoiceFeature(variation)
  ).catch(function defaultSetup() {
    // Errors here imply that this is NOT embedded.
    console.log("you must be running as part of `web-ext`.  You get 'corn dog'!");
    new BrowserActionButtonChoiceFeature({"name": "isolatedcorndog"})
  });
}

// actually start
runOnce()
