const url = "https://www.aadl3inscription2024.dz/";
//const url = "http://localhost:8000/";

// first run
chrome.runtime.onInstalled.addListener((details) => {
  console.log("Installed...");
  PresistEntries([]);
});

// listen to network errors and filter them
chrome.webRequest.onErrorOccurred.addListener(onNetworkError, {
  urls: [url, url + "    */"],
});
function onNetworkError(details) {
  LoadEntries((entries) => {
    // is it from the concerned tabs ?
    let target_entry = GetEntryByTabID(entries, details.tabId);
    if (target_entry === null || target_entry === undefined) return;

    // is the entry still running
    if (!target_entry.running) return;

    // we care only about page loading
    if (details.method !== "GET") return;

    // reload tab
    chrome.tabs
      .reload(details.tabId)
      .then((e) => console.log("Reloading tab: " + target_entry.name))
      .catch((e) => {
        console.log("Tried to close: " + target_entry.name + ". Stopping it.");

        target_entry.running = false;
        target_entry.tab_id = -1;

        PresistEntries(entries);
      });
  });
}

// Page loaded
chrome.webNavigation.onCompleted.addListener(onSuccess, { urls: [url] });
function onSuccess(details) {
  LoadEntries((entries) => {
    // is it from the concerned tabs ?
    let target_entry = GetEntryByTabID(entries, details.tabId);
    if (target_entry === null || target_entry === undefined) return;

    // stop it from refreshing
    target_entry.running = false;
    target_entry.success = true;
    PresistEntries(entries);

    // notification
    chrome.notifications.create("AADL3, " + target_entry.name, {
      iconUrl: "images.jpeg",
      title: "AADL3, " + target_entry.name,
      message: "AADL3, " + target_entry.name,
      type: "basic",
    });

    // set it as active
    chrome.tabs.update(target_entry.tab_id, { selected: true });

    console.log("Tab: " + target_entry.name + " - loaded !");

    // inject content script
    chrome.scripting.executeScript({
      target: { tabId: target_entry.tab_id },
      func: FillForms,
      args: [target_entry],
    });
  });
}
function GetEntryByTabID(entries, tab_id) {
  for (entry of entries) if (entry.tab_id === tab_id) return entry;
}

// delete closed tabs
chrome.tabs.onRemoved.addListener((tabId, _) => {
  LoadEntries((entries) => {
    for (entry of entries) {
      if (tabId === entry.tab_id) {
        entry.running = false;
        entry.tab_id = -1;

        PresistEntries(entries);
      }
    }
  });
});

function generateCaptcha(length) {
  let result = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

function waitForElement(selector, callback) {
  var element = document.querySelector(selector);
  if (element) {
    callback(element);
  } else {
    setTimeout(function () {
      waitForElement(selector, callback);
    }, 150);
  }
}
// --------- Injected JS code ----------
function FillForms(entry) {
  document.title = entry.name;
  // enable back: copy, cut, paste anc context menu
  /*const body_html_content = structuredClone( document.body.innerHTML );
    document.body = document.body = document.createElement("body");
    document.body.innerHTML = body_html_content;*/

  // click on the button
  const orange_button = document.getElementById("A14");
  orange_button.click();
  console.log("Clicked !");

  // wait 1 sec
  waitForElement("#A17", function (element) {
    element.value = parseInt(entry.wilaya) + 1;
  });

  waitForElement("#A22", function (element) {
    element.value = person.nin;
  });

  waitForElement("#A27", function (element) {
    element.value = person.nss;
  });

  waitForElement("#A13", function (element) {
    element.value = person.num;
  });

  waitForElement("#A33", function (element) {
    element.value = generateCaptcha(6);
  });

  waitForElement("#A91_1", function (element) {
    if (accept_checkbox) {
      accept_checkbox.checked = true;
    }
  });

  console.log("Form filled !");

  setTimeout(() => {
    const send_form = document.getElementById("A55");
    send_form.click();
  }, 1000);
}

// --------- Storage utility ----------
function LoadEntries(callback) {
  chrome.storage.session.get(["entries"], (result) => {
    let entries = result.entries;
    if (entries === null || entries === undefined) return;

    callback(entries);
  });
}
function PresistEntries(entries) {
  chrome.storage.session.set({
    entries: entries,
  });
}
