const $ = jQuery;

// jquery calls this function when page content "onReady" event fires
// this function can't be async into jQuery
$(function doOnReady() {
  console.log("onReady fired");
  sendMessage({ type: "getList" }).then(handleResponse);
  // get word list from background script
  function handleResponse(wordList) {
    for (let word of wordList) {
      if (isWordInPage()) {
        // TODO bdanforth: substitute word (turn it upside down)
        // tell the background script that word has been used.
        sendMessage({ type: "wordUsed", word });
      }
    }
  }

  $("div").replaceText("Dark", "light");
});

// TODO bdanforth: use Gregg's logic to know this
function isWordInPage() {
  return true;
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