"use strict";

/* global findAndReplaceDOMText */

if (document.readyState === "complete") {
  onDOMContentLoaded();
} else {
  document.addEventListener("DOMContentLoaded", onDOMContentLoaded);
}

function onDOMContentLoaded() {
  sendMessage({ type: "getList" }).then(findAndReplace);
}

// get word list from background script
function findAndReplace(wordList) {
  // the ones we actually find and substitute
  let seen = new Set();
  for (let word of wordList) {  
    // do over all p, div
    document.querySelectorAll('p, div').forEach(function (node) {
      // attempt a replace
      let r = findAndReplaceDOMText(
        node,
        {find:new RegExp(word,'i'), 
         wrap:'span', 
         wrapClass: word,
         preset:"prose"}
      );
      // if we had a match, a 'revert' will be there.
      if (r.reverts.length) {
        seen.add(word);
        // tell the background script that word has been used.
        sendMessage({ type: "wordUsed", word });
      }
    });
  }

    // append the ones we saw as a result
    if (document.querySelector('#wanted')) {
      document.querySelector('#wanted').innerText="wanted: " + Array.from(wordList);
    }
    if (document.querySelector('#wanted')) {
      document.querySelector('#seen').innerText="seen: " + Array.from(seen);
    }
  }

// set up message passing to background.js
async function sendMessage(msg) {
  switch (msg.type) {
    case "getList":
      // send message to background to ask for words Set
      try {
        return await browser.runtime.sendMessage(msg);
      } catch (error) {
        throw new Error(`Error getting word list: ${error}`);
      }
    case "wordUsed":
      try {
        return await browser.runtime.sendMessage(msg);
      } catch (error) {
        throw new Error(`Error sending word used: ${error}`);
      }
    default:
      throw new Error(`Unknown message type, ${msg.type}`);
  }
}