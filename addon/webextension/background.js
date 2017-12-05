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


async function isEmbedded () {
  let ans;
  return msgHost("embedded?")
    .then(() => true)
    .catch( () => false )
}

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
async function msgHost(msg) {
 try {
    const ans = await browser.runtime.sendMessage(msg);
    return ans;
  } catch (e) {
    console.error("ERROR host addon not listening", msg, e);
    return Promise.reject(`Not embedded: ${msg} ${e}`)
  }
}


class PersistentPageModificationEffect {

}


class AddHeaderForSpecialPage {

}

/** CONFIGURE and INSTRUMENT the BrowserAction button for a specific variation
 *
 *  1. Request 'info' from the hosting Legacy Extension.
 *  2. We only care about the `variation` key.
 *  3. initialize the feature, using our specific variation
 */
async function runOnce() {
  const embedded = await isEmbedded();
  console.log("Embedded?", embedded);
}

// actually start
runOnce()
