"use strict";

/*eslint no-cond-assign: "warn"*/

function findAndReplace(wordList) {
  // the ones we actually find and substitute
  let seen = new Set();
  const combinedRegex = new RegExp('(' + Array.from(wordList).join('|') + ')', 'i');
  wrapWith(
    document.body,
    {
      wrapTag: 'span',
      wrapClass: 'donotdelete',
      re: combinedRegex,
      //re: /(dark|life|your)/i
      matchCb: function matchCb (matchObj) {
        const observed = matchObj[0].toLowerCase();
        seen.add(observed);
        sendMessage({ type: "wordUsed", word: observed });
      }
    }
  );

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

  // For using with debug / and test pages.
  if (document.querySelector('#wanted')) {
    document.querySelector('#wanted').innerText="wanted: " + Array.from(wordList);
  }
  if (document.querySelector('#wanted')) {
    document.querySelector('#seen').innerText="seen: " + Array.from(seen);
  }
}

/**
 * element:  root of the dom you want to traverse
 * config:  all keys required.
 * - wrapTag:  string. name of tag to wrap with:
 * - wrapClass: string, name the class.
 * - re: a regex to use to decide what to replace
 * - matchCb: (badly implemented) callback function of what to do with a match.
 *     - note, very incomplete.
 *     - arity:
 *       - m:  the matchObj for re if exists.
 *
 * uses the magic of TreeWalker:
 * - https://developer.mozilla.org/en-US/docs/Web/API/NodeFilter
 *
 */
function wrapWith (element, config) {
  const {
    wrapTag,
    wrapClass,
    re,
    matchCb
  } = config;
  let nodes = document.createTreeWalker(
    // starting element
    element,
    // NodeFilter.SHOW_TEXT:  Only consider nodes that are text nodes (nodeType 3)
    NodeFilter.SHOW_TEXT,
    // optional: Accept node always.  Same a 'no function' here.
    { acceptNode: function(node) {
      // Logic to determine whether to accept, reject or skip node
      return NodeFilter.FILTER_ACCEPT;
      //
      }
    },
    null
  );
  let node;
  // loop through nodes
  while (node = nodes.nextNode()) {
    var p = node.parentNode;
    var text = node.nodeValue;
    var m;
    while(m = text.match(re)) {
      // callback on every match
      matchCb(m);
      var front, mid, end;
      front = text.slice(0,m.index);    // might be empty ''
      mid = m[0];
      end = text.slice(m.index + mid.length);  // might be empty ''
      text = end;
      // todo this line is dangerous
      p.insertBefore(document.createTextNode(front), node);
      var word = p.insertBefore(document.createElement(wrapTag), node);
      word.appendChild(document.createTextNode(mid));
      word.className = wrapClass;
    }
    node.nodeValue = text;
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
//findAndReplace()
