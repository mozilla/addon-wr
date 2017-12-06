"use strict";

/* global findAndReplaceDOMText */

function findAndReplace(wordList) {
  // the ones we actually find and substitute
  let seen = new Set();
  for (let word of wordList) {
    // do over all p, div
    document.querySelectorAll("p, h1, h2, h3").forEach(function (node) {
      // attempt a replace
      let r = findAndReplaceDOMText(
        node,
        {
          find:new RegExp(word,"ig"),
          wrap:"span",
          wrapClass: "donotdelete",
          preset: "prose",
        }
      );
      // if we had a match, a 'revert' will be there.
      if (r.reverts.length) {
        seen.add(word);
        // tell the background script that word has been used.
        sendMessage({ type: "wordUsed", word });
      }
    });
  }

  document.querySelectorAll(".donotdelete").forEach((node) => {
    const hoverEle = document.createElement("span");
    hoverEle.innerHTML = `
      Mr. Robot something something.
      <br>
      <a href="http://www.mozilla.org" target="_blank">
        Learn more
      </a>`;
    hoverEle.classList.add("donotdelete-tooltip");
    hoverEle.setAttribute("data-tooltip-position", "right");
    node.appendChild(hoverEle);
  });

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

// get word list from background script, then do it!
sendMessage({ type: "getList" }).then(findAndReplace);
