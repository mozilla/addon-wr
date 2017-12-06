"use strict";

/**
 * background.js - persistent state and 'all tabs and sites' effects
 *
 * the webExtenion is only started up the user turns the pref on in bootstrap.js
 */


// constants used by particular effects
const WORDS = "dark army distintigration data privacy internet delete".split(/\s+/);
const XHEADERSITES = ['<all_urls>'];
const XHEADERNAME = 'dontdeleteme';
const XHEADERVALUE = '1057'

/**
 * Affect page views for all urls.
 *
 * In particular, the first time any word from wordArray
 * is seen during a session, apply special styling to it.
 */
class PersistentPageModificationEffect {
  /**
   * wordArray: array of words to apply effect to
   * CSS:  string.  Style for .donotdelete classname
   *
   * sets up:
   * this.
   *    wordSet:  Set() of words to 'affect'
   *    CSS
   */
  constructor(wordArray, CSS) {
    if (!CSS) CSS = `
      .donotdelete {
        transform: scaleY(-1);
        display: inline-block;
      }`

    this.wordSet = new Set(wordArray);
    this.insertCSSOnAllTabs();
    this.addListeners();
    this.APPLICABLE_PROTOCOLS = ["http:", "https:", "ftp:", "file:"];
    this.CSS = {
      code: CSS
    };
  }

  addListeners() {
    browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      this.handleMessageFromContent(msg, sender, sendResponse)
    });
  }

  /**
    * msg:  one of
    *   getList  => returns this.wordSet (list of words)
    *   wordUsed => remove a word from this.wordSet
    */
  handleMessageFromContent(msg, sender, sendResponse) {
    switch (msg.type) {
      case "getList":
        sendResponse(this.wordSet);
        break;
      case "wordUsed":
        // remove word from the list
        this.wordSet.delete(msg.word);
        break;
      default:
        throw new Error(`Message type not recognized: ${msg}`);
    }
  }

  /**
    * Ensure that the CSS modification happens for all open and future tabs
    */
  insertCSSOnAllTabs() {
    // When first loaded, add CSS for open tabs.
    var gettingAllTabs = browser.tabs.query({});
    gettingAllTabs.then((tabs) => {
      for (let tab of tabs) {
        if (this.protocolIsApplicable(tab.url)) {
          browser.tabs.insertCSS(tab.id, this.CSS);
        }
      }
    });

    // Each time a tab is updated, add CSS for that tab.
    browser.tabs.onUpdated.addListener((id, changeInfo, tab) => {
      if (this.protocolIsApplicable(tab.url)) {
        browser.tabs.insertCSS(id, this.CSS);
      }
    });
  }

  /*
   * Returns true only if the URL's protocol is in APPLICABLE_PROTOCOLS.
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
      ["blocking", "requestHeaders"]   // blocking = wait before sending
    )
  }
}

/**
 * Once per addon startup, creates the effects
 */
async function runOnce() {
  new PersistentPageModificationEffect(
    WORDS
  );
  new AddHeaderForSpecialPage(
    XHEADERSITES,
    XHEADERNAME,
    XHEADERVALUE
  );

  // when deciding whether to do the effect, check if allowed?
}

// actually start, once per run.
runOnce();
