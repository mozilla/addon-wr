"use strict";

/** `background.js` example for embedded webExtensions.
  * - As usual for webExtensions
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

/**  Re-usable code for talking to the chrome privileged addon host` using `browser.runtime.sendMessage`
  *
  *  - Host listens and responds at `bootstrap.js`:
  *
  *   `browser.runtime.onMessage.addListener(studyUtils.respondToWebExtensionMessage)`;
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

async function runOnce() {
  const embedded = await isEmbedded();
  console.log("Embedded?", embedded);
}

// actually start
runOnce()
