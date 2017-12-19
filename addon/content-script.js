"use strict";

/* eslint no-cond-assign:warn */

/**
  * Port to communicate with `background.js`, and messaging machinery
  *
  * This method won't send message to background until it's actually listening,
  * and eliminates race conditions around that.
  */
var myPort = browser.runtime.connect({name: "port-from-cs"});
myPort.onMessage.addListener(function(m) {
  switch (m.type) {
    case "cssLoaded":
      myPort.postMessage({ type: "getList" });
      break;
    case "getList":
      findAndReplace(m.data);
      break;
    default:
      throw new Error(`Message type not recognized: ${m.type}`);
  }
});

const SUPPORTURL = "https://support.mozilla.org/kb/lookingglass";

function findAndReplace(wordList) {
  // the ones we actually find and substitute
  const seen = new Set();
  const combinedRegex = new RegExp("(" + Array.from(wordList).join("|") + ")", "i");
  wrapWith(
    document.body,
    {
      wrapTag: "span",
      wrapClass: "donotdelete",
      re: combinedRegex,
      matchCb: function matchCb(matchObj) {
        const observed = matchObj[0].toLowerCase();
        seen.add(observed); // for debugging

        // Per #22, not doing this after all.
        // tell the background script that word has been used.
        // myPort.postMessage({ type: "wordUsed", word: observed });
      },
    }
  );


  document.querySelectorAll(".donotdelete").forEach((node) => {
    const hoverEle = document.createElement("span");
    hoverEle.classList.add("donotdelete-tooltip");
    hoverEle.setAttribute("data-tooltip-position", "right");
    node.appendChild(hoverEle);

    // eslint-disable-next-line no-unsanitized/property
    hoverEle.innerHTML = `
    Can you trust your perceptions?<br>
    You chose this... a reminder of<br>
    the forces at work in your world.<br>
    If you no longer wish to peer<br>
    through the looking glass, you can<br/>
    <a href="${SUPPORTURL}" target="_blank" rel="noopener noreferrer">
    return to blissful ignorance</a>`;

  });

  document.querySelectorAll(".donotdelete").
    forEach(function(node) {
      const delayToRevert = (10 * Math.random() + 1) * 1000;
      setTimeout(function() {
        node.classList.add("donotdelete-revert");
        setTimeout(() => node.removeChild(node.lastChild), 15000);
      }, delayToRevert);
    });
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
function wrapWith(element, config) {
  const {
    wrapTag,
    wrapClass,
    re,
    matchCb,
  } = config;
  const nodes = document.createTreeWalker(
    // starting element
    element,
    // NodeFilter.SHOW_TEXT:  Only consider nodes that are text nodes (nodeType 3)
    NodeFilter.SHOW_TEXT,
    // optional: Accept node always.  Same a 'no function' here.
    { acceptNode(node) {
      // Logic to determine whether to accept, reject or skip node
      // Only wrap words inside <p> elements
      const tag = node.parentElement.tagName;
      if (tag !== "P") {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
    },
    null
  );
  let node;
  // loop through nodes
  // eslint-disable-next-line no-cond-assign
  while (node = nodes.nextNode()) {
    var p = node.parentNode;
    var text = node.nodeValue;
    var m;
    // eslint-disable-next-line no-cond-assign
    while (m = text.match(re)) {
      // callback on every match
      matchCb(m);
      var front, mid, end;
      front = text.slice(0, m.index); // might be empty ''
      mid = m[0];
      end = text.slice(m.index + mid.length); // might be empty ''
      text = end;
      // todo this line is dangerous
      p.insertBefore(document.createTextNode(front), node);
      var word = p.insertBefore(document.createElement(wrapTag), node);
      word.appendChild(document.createTextNode(mid));
      word.className = wrapClass;
      checkForOverflow(word);
    }
    node.nodeValue = text;
  }
}

// Naive check for overflow:hidden on parent/grandparent element of word
// to have it display properly when it would otherwise be hidden;
// does not catch all cases.
function checkForOverflow(word) {
  const wordParent = word.parentElement;
  const wordParentStyle = getComputedStyle(wordParent);
  const wordGrandparent = wordParent.parentElement;
  const wordGrandparentStyle = getComputedStyle(wordGrandparent);
  if (wordParentStyle.overflow === "hidden") {
    wordParent.style.overflow = "visible";
  } else if (wordGrandparentStyle.overflow === "hidden") {
    wordGrandparent.style.overflow = "visible";
  }
}
