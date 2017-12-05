"use strict";

browser.runtime.onMessage.addListener(handleMessage);

const wordList = getWordList();

function handleMessage(msg, sender, sendResponse) {
  switch (msg.type) {
    case "getList":
      console.log(wordList);
      sendResponse(wordList);
      break;
    case "wordUsed":
      // remove word from the list
      wordList.delete(msg.word);
      console.log(wordList);
      break;
    default:
      throw new Error(`Message type not recognized: ${msg}`);
  }
}

// TODO glind: get wordList from bootstrap
// sends back list under these conditions:
// if running as a pure web extension, send the list
// if running as an embedded web extension, only send the list if the pref is set
function getWordList() {
  const wordList = new Set();
  wordList.add("dark");
  wordList.add("wizard");
  return wordList;
}

const CSS = { code: `body {
  border: 20px solid red;
    transform: scaleY(-1);
}`};

function insertCSSOnAllTabs() {
  /*
  When first loaded, initialize the page action for all tabs.
  */
  var gettingAllTabs = browser.tabs.query({});
  gettingAllTabs.then((tabs) => {
    for (let tab of tabs) {
      if (protocolIsApplicable(tab.url)) {
        browser.tabs.insertCSS(tab.id, CSS);
      }
    }
  });

  /*
  Each time a tab is updated, reset the page action for that tab.
  */
  browser.tabs.onUpdated.addListener((id, changeInfo, tab) => {
    if (protocolIsApplicable(tab.url)) {
      browser.tabs.insertCSS(id, CSS);
    }
  });

  const APPLICABLE_PROTOCOLS = ["http:", "https:", "ftp:", "file:"];

  /*
  Returns true only if the URL's protocol is in APPLICABLE_PROTOCOLS.
  */
  function protocolIsApplicable(url) {
    var anchor =  document.createElement('a');
    anchor.href = url;
    return APPLICABLE_PROTOCOLS.includes(anchor.protocol);
  }
}

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
  insertCSSOnAllTabs();
}

// actually start
runOnce();
