let {Ci, Cc, Cu} = require('chrome');
Cu.importGlobalProperties(["Blob", "URL"]);

var net_url = require("sdk/net/url");
var { viewFor } = require("sdk/view/core");
var prefs = require("sdk/simple-prefs").prefs;
var windows = require("sdk/windows").browserWindows;
var stylesheet_utils = require("sdk/stylesheet/utils");

const SKEL_STYLESHEET = 'chrome://ftc-skin/content/skeleton.css';

var focused_stylesheet = null;
var unfocused_stylesheet = null;


function load_prefs(focused) {
  var prefix = "focused_";
  if (!focused) {
    prefix = "unfocused_";
  }
  var preferences = `
:root {
    --main-bg-color: ${prefs[prefix + 'main_bg']};
    --main-nav-bg-color: ${prefs[prefix + 'currenttab_bg']};
    --main-url-bg-color: ${prefs[prefix + 'url_bg']};
    --main-url-text-color: ${prefs[prefix + 'url_fg']};
    --main-tab-active-bg-color: ${prefs[prefix + 'currenttab_bg']};
    --main-tab-active-text-color: ${prefs[prefix + 'currenttab_fg']};
    --main-tab-active-hover-bg-color: ${prefs[prefix + 'currenttab_bg']};
    --main-tab-inactive-bg-color: ${prefs[prefix + 'tab_bg']};
    --main-tab-inactive-text-color: ${prefs[prefix + 'tab_fg']};
    --main-tab-inactive-hover-bg-color: ${prefs['focused_tabhover_bg']};
    --main-tab-inactive-hover-text-color: ${prefs['focused_tabhover_fg']};
    --main-selection-background-color: ${prefs['focused_select_bg']};
    --main-selection-color: ${prefs['focused_select_fg']};
}
  `;
  return preferences;
}

// Load ss sync on startup and async on pref change
function onPrefChange(prefName) {
  var use_sync = false;
  if (prefName == null)
    use_sync = true;
  net_url.readURI(SKEL_STYLESHEET, use_sync).then(function success(text) {
    var focused_text = load_prefs(true) + text;
    var unfocused_text = load_prefs(false) + text;
    var focused_blob = new Blob([focused_text], {type: 'text/css'});
    var unfocused_blob = new Blob([unfocused_text], {type: 'text/css'});
    focused_stylesheet = URL.createObjectURL(focused_blob);
    unfocused_stylesheet = URL.createObjectURL(unfocused_blob);

    // Apply focused_stylesheet to current active window
    var chrome_activeWindow = viewFor(windows.activeWindow);
    stylesheet_utils.loadSheet(chrome_activeWindow, focused_stylesheet, "agent");
  }, function failure(reason) {
    console.log(reason);
  });
}
require("sdk/simple-prefs").on("", onPrefChange);
onPrefChange(null);

// I have no idea what I'm doing
windows.on('open', function(window) {
  myOpenWindows.push(window);
});

// Load active sheet on focus
windows.on('activate', function(window) {
  var chromeWindow = viewFor(window);
  stylesheet_utils.removeSheet(chromeWindow, unfocused_stylesheet, "agent");
  stylesheet_utils.loadSheet(chromeWindow, focused_stylesheet, "agent");
});

// Load inactive sheet on focus loss
windows.on('deactivate', function(window) {
  var chromeWindow = viewFor(window);
  stylesheet_utils.removeSheet(chromeWindow, focused_stylesheet, "agent");
  stylesheet_utils.loadSheet(chromeWindow, unfocused_stylesheet, "agent");
});
