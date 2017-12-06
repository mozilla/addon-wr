"use strict";

const targetUrl = "https://www.whatismybrowser.com/detect/*";

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
  constructor() {
    this.insertCSSOnAllTabs();
    this.addListeners();
    this.APPLICABLE_PROTOCOLS = ["http:", "https:", "ftp:", "file:"];
    this.CSS = { code:
      `.dark {
        background-color: black;
        color:white;
      }
      .light {
        color: yellow
      }
      .thing {
        background-color: pink;
        transform: scaleY(-1);
        display: inline-block;
      }`
    };
  }

  addListeners() {
    browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      this.handleMessage(msg, sender, sendResponse)
    });
  }

  handleMessage(msg, sender, sendResponse) {
    switch (msg.type) {
      case "getList":
        this.wordList = this.getWordList();
        sendResponse(this.wordList);
        break;
      case "wordUsed":
        // remove word from the list
        this.wordList.delete(msg.word);
        // TODO glind: setWordList in bootstrap.js?
        break;
      default:
        throw new Error(`Message type not recognized: ${msg}`);
    }
  }

  // TODO glind: get wordList from bootstrap
  // sends back list under these conditions:
  // if running as a pure web extension, send the list
  // if running as an embedded web extension, only send the list if the pref is set
  getWordList() {
    const wordList = new Set();
    wordList.add("dark");
    wordList.add("light");
    wordList.add("thing");
    wordList.add("not-here");
    return wordList;
  }

  insertCSSOnAllTabs() {
    /*
    When first loaded, add CSS for open tabs.
    */
    var gettingAllTabs = browser.tabs.query({});
    gettingAllTabs.then((tabs) => {
      for (let tab of tabs) {
        if (this.protocolIsApplicable(tab.url)) {
          browser.tabs.insertCSS(tab.id, this.CSS);
        }
      }
    });

    /*
    Each time a tab is updated, add CSS for that tab.
    */
    browser.tabs.onUpdated.addListener((id, changeInfo, tab) => {
      if (this.protocolIsApplicable(tab.url)) {
        browser.tabs.insertCSS(id, this.CSS);
      }
    });
  }

  /*
  Returns true only if the URL's protocol is in APPLICABLE_PROTOCOLS.
  */
  protocolIsApplicable(url) {
    var anchor =  document.createElement('a');
    anchor.href = url;
    return this.APPLICABLE_PROTOCOLS.includes(anchor.protocol);
  }
}

/**
 * For certain domains, add a special header, using blocking requestHeaders API
 *
 * https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/webRequest/onBeforeSendHeaders
 */
class AddHeaderForSpecialPage {
  /**
   * matchingUrls:  array of url matches
   * headerName:  string single x-header to add to request
   * value:  value for the header value
   */
  constructor(matchingUrls, headerName, headerValue) {
    this.matchingUrls = matchingUrls;
    this.headerName = headerName;
    this.headerValue = headerValue;
    this.registerHeaderListener();
  }

  listener(details) {
    details.requestHeaders.push({name: this.headerName, value: this.headerValue});
    return {requestHeaders: details.requestHeaders};
  }

  registerHeaderListener() {
    browser.webRequest.onBeforeSendHeaders.addListener(
      this.listener.bind(this),
      {urls: this.matchingUrls},
      ["blocking", "requestHeaders"]
    )
  }
}

async function runOnce() {
  const embedded = await isEmbedded();
  console.log("Embedded?", embedded);
  // @TODO glind, do different things based on embedded and pref setting.
  new PersistentPageModificationEffect();
  // new AddHeaderForSpecialPage()
}

// actually start, once per run.
runOnce();
