"use strict";

/**
 * background.js - persistent state and 'all tabs and sites' effects
 *
 * the webExtenion is only started up the user turns the pref on in bootstrap.js
 */


// constants used by particular effects
const WORDS =
`
puppet
one
zero
congo
rewind
fuck
71
fsociety
encrypt
decrypt
control
illusion
dark
army
evil
robot
disintegration
hack
society
white
rose
revolution
subroutine
backdoor
undo
society
corporation
economy
mask
system
truth
debt
cryptocurrency
kernel panic
privacy
`.trim().split(/\s+/);
const XHEADERSITES = [
  "https://www.red-wheelbarrow.com/forkids/*",
  "https://www.whatismybrowser.com/detect/*",
  "https://red-wheelbarrow-stage.apps.nbcuni.com/forkids/*"
];
const XHEADERNAME = 'x-1057';
const XHEADERVALUE = 'true'

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
        /* scaleY does not work for inline elements */
        display: inline-block;
      }

      .donotdelete-revert {
        transform: scaleY(1);
        transition: transform 1s ease-in;
      }

      /* after revert, revert the tooltip */
      .donotdelete-revert .donotdelete-tooltip {
        transform: scaleY(1) translateY(-50%);
        transition: transform 1s ease-in;
      }

      .donotdelete-tooltip {
        visibility: hidden !important;
        display: inline-block;
        position: absolute;
        min-height: 50px;
        max-width: 200px;
        min-width: 200px;
        padding: 5px;
        text-align: center;
        border-radius: 3px;
        border: 1px solid #bebdbd;
        box-shadow: var(--standard-box-shadow);
        z-index: 50 !important;
        /* Neutralizing styles */
        font-style: normal !important;
        transform: scaleY(-1) translateY(50%);
        color: black !important;
        text-shadow: none !important;
        line-height: 16px !important;
        font-family: sans-serif !important;
        font-size: 12px !important;
        font-weight: normal !important;
        background-color: #ffffff !important;
        letter-spacing: 0 !important;
        text-transform: none !important;
      }

      .donotdelete-tooltip a {
        color: blue !important;
        text-decoration: underline !important;
        font-weight: normal !important;
      }

      /* Neutralizes case where <a> have after pseudoelements like ">>" */
      .donotdelete-tooltip a::after {
        display: none;
      }

      /*
      * Ensures hover effect is always on top; needed when two or more
      * match words with hover effects occur directly next to one another
      * in a given text node
      */
      .donotdelete:hover {
        z-index: 999 !important;
      }

      /* Show the tooltip when hovering */
      .donotdelete:hover .donotdelete-tooltip {
        visibility: visible !important;
      }


      /* Vertical centering */
      [data-tooltip-position] {
        top: 50%;
        /*
        * transform: translateY(-50%);
        * (if we weren't already transforming this element)
        */
      }

      [data-tooltip-position="right"] {
        left: 100%;
        margin-left: 0;
      }

      [data-tooltip-position="left"] {
        right: 100%;
        margin-right: 0;
      }`;
    this.wordSet = new Set(wordArray);
    this.insertCSSOnAllTabs().then(() => this.addListeners());
    this.portFromCS = null;
    this.APPLICABLE_PROTOCOLS = ["http:", "https:", "file:"];
    this.CSS = {
      code: CSS
    };
  }

  addListeners() {
    browser.runtime.onConnect.addListener((port) => this.connected(port));
  }

  /**
    * msg:  one of
    *   getList  => returns this.wordSet (list of words)
    *   wordUsed => remove a word from this.wordSet
    */
  connected(p) {
    this.portFromCS = p;
    this.portFromCS.postMessage({type: "backgroundConnected"});
    this.portFromCS.onMessage.addListener((m) => {
      switch (m.type) {
        case "getList":
          this.portFromCS.postMessage({ type: "getList", data: this.wordSet });
          break;
        case "wordUsed":
          // remove word from the list
          this.wordSet.delete(m.word);
          break;
        default:
          throw new Error(`Message type not recognized: ${m.type}`);
        }
    });
  }

  /**
    * Ensure that the CSS modification happens for all open and future tabs
    */
  async insertCSSOnAllTabs() {
    // When first loaded, add CSS for open tabs.
    var gettingAllTabs = browser.tabs.query({});
    gettingAllTabs.then(async (tabs) => {
      for (let tab of tabs) {
        if (this.protocolIsApplicable(tab.url)) {
          await browser.tabs.insertCSS(tab.id, this.CSS);
        }
      }
    });

    // Each time a tab is updated, add CSS for that tab.
    browser.tabs.onUpdated.addListener(async (id, changeInfo, tab) => {
      if (this.protocolIsApplicable(tab.url) && tab.status === "complete") {
        await browser.tabs.insertCSS(id, this.CSS);
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
