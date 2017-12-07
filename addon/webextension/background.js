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
      }

      .donotdelete-tooltip {
        display: inline-block;
        transform: scaleY(-1) translateY(50%) !important;
        position: absolute;
        visibility: hidden;
        background: #e9e9eb;
        padding: 4px;
        font-size: 12px;
        font-weight: normal;
        min-width: 100px;
        text-align: center;
        border-radius: 3px;
        border: 1px solid #bebdbd;
        box-shadow: var(--standard-box-shadow);
        color: black;
      }

      .donotdelete-tooltip a {
        color: blue !important;
        text-decoration: underline;
      }

      /* Show the tooltip when hovering */
      .donotdelete:hover .donotdelete-tooltip {
        visibility: visible;
        z-index: 50;
      }

      /* Dynamic horizontal centering */
      [data-tooltip-position="top"],
      [data-tooltip-position="bottom"] {
        left: 50%;
        transform: translateX(-50%);
      }

      /* Dynamic vertical centering */
      [data-tooltip-position="right"],
      [data-tooltip-position="left"] {
        top: 50%;
        transform: translateY(-50%);
      }

      [data-tooltip-position="top"] {
        bottom: 100%;
        margin-bottom: 0;
      }

      [data-tooltip-position="right"] {
        left: 100%;
        margin-left: 0;
      }

      [data-tooltip-position="bottom"] {
        top: 100%;
        margin-top: 0;
      }

      [data-tooltip-position="left"] {
        right: 100%;
        margin-right: 0;
      }

      /* Dynamic horizontal centering for the tooltip */
      [data-tooltip-position="top"]:after,
      [data-tooltip-position="bottom"]:after {
        left: 50%;
        margin-left: -6px;
      }

      /* Dynamic vertical centering for the tooltip */
      [data-tooltip-position="right"]:after,
      [data-tooltip-position="left"]:after {
        top: 50%;
        margin-top: -6px;
      }

      [data-tooltip-position="top"]:after {
        bottom: 100%;
        border-width: 6px 6px 0;
        border-top-color: #000;
      }

      [data-tooltip-position="right"]:after {
        left: 100%;
        border-width: 6px 6px 6px 0;
        border-right-color: #000;
      }

      [data-tooltip-position="bottom"]:after {
        top: 100%;
        border-width: 0 6px 6px;
        border-bottom-color: #000;
      }

      [data-tooltip-position="left"]:after {
        right: 100%;
        border-width: 6px 0 6px 6px;
        border-left-color: #000;
      }`;
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
