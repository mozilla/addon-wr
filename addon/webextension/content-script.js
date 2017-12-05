// jquery calls this function when page content "onReady" event fires
const $ = jQuery;

$(function doOnReady() {
  console.log("onReady fired");
  $("div").replaceText("Dark", "light");
});