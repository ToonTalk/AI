// background.js
console.log("Background script loaded");

let lastTabId = null;
let copiedText = null;
let readyTabs = new Set();

function isValidTab(tabId) {
  return new Promise((resolve) => {
    chrome.tabs.get(tabId, (tab) => {
      if (chrome.runtime.lastError) {
        resolve(false);
      } else {
        resolve(!tab.url.startsWith("chrome://") && !tab.url.startsWith("edge://"));
      }
    });
  });
}

function injectContentScript(tabId) {
  return new Promise(async (resolve, reject) => {
    if (!(await isValidTab(tabId))) {
      console.log("Skipping script injection for invalid or browser URL");
      resolve(false);
      return;
    }

    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    }, (results) => {
      if (chrome.runtime.lastError) {
        console.error('Error injecting script: ', chrome.runtime.lastError.message);
        reject(chrome.runtime.lastError);
      } else {
        console.log('Content script injected successfully');
        resolve(true);
      }
    });
  });
}

function sendMessageToTab(tabId, message, retries = 3) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, { ...message, from: 'background' }, response => {
      if (chrome.runtime.lastError) {
        console.error('Error sending message to tab: ', chrome.runtime.lastError.message);
        if (retries > 0) {
          console.log(`Retrying... (${retries} attempts left)`);
          setTimeout(() => {
            sendMessageToTab(tabId, message, retries - 1)
              .then(resolve)
              .catch(reject);
          }, 500); // Increased delay between retries
        } else {
          reject(chrome.runtime.lastError);
        }
      } else {
        console.log('Message sent successfully, response: ', response);
        resolve(response);
      }
    });
  });
}

async function ensureContentScriptLoaded(tabId) {
  if (!readyTabs.has(tabId)) {
    try {
      const injected = await injectContentScript(tabId);
      if (!injected) {
        console.log("Content script not injected. Skipping this tab.");
        return false;
      }
      await new Promise(resolve => setTimeout(resolve, 500)); // Increased delay to ensure script is ready
      await sendMessageToTab(tabId, { action: 'ping' });
      readyTabs.add(tabId);
      return true;
    } catch (error) {
      console.error('Error ensuring content script is loaded:', error);
      return false;
    }
  }
  return true;
}

async function handleTabChange(tabId) {
  console.log("Handling tab change for tab:", tabId);
  
  if (lastTabId !== null && lastTabId !== tabId) {
    const sourceTabValid = await isValidTab(lastTabId);
    const destTabValid = await isValidTab(tabId);

    if (sourceTabValid) {
      try {
        const sourceScriptLoaded = await ensureContentScriptLoaded(lastTabId);
        if (sourceScriptLoaded) {
          console.log("Attempting to copy from tab:", lastTabId);
          const copyResponse = await sendMessageToTab(lastTabId, {action: "copy"});
          
          if (copyResponse && copyResponse.text) {
            copiedText = copyResponse.text;
            console.log("Text copied:", copiedText);
          } else if (copyResponse && copyResponse.error) {
            console.log("Copy error:", copyResponse.error);
          }
        } else {
          console.log("Skipping copy operation. Content script not loaded in source tab.");
        }
      } catch (error) {
        console.error("Error during copy operation:", error);
      }
    } else {
      console.log("Skipping copy operation. Source tab is not valid.");
    }

    if (destTabValid && copiedText) {
      try {
        const destScriptLoaded = await ensureContentScriptLoaded(tabId);
        if (destScriptLoaded) {
          console.log("Attempting to paste to tab:", tabId);
          const pasteResponse = await sendMessageToTab(tabId, {action: "paste", text: copiedText});
          
          if (pasteResponse && pasteResponse.success) {
            console.log("Text pasted successfully");
          } else {
            console.log("No suitable element found for pasting or paste verification failed");
          }
        } else {
          console.log("Skipping paste operation. Content script not loaded in destination tab.");
        }
      } catch (error) {
        console.error("Error during paste operation:", error);
      }
    } else {
      console.log("Skipping paste operation. Destination tab is not valid or no text to paste.");
    }
  }
  
  lastTabId = tabId;
}

chrome.tabs.onActivated.addListener(function(activeInfo) {
  console.log("Tab activated:", activeInfo.tabId);
  handleTabChange(activeInfo.tabId).catch(error => {
    console.error("Error in tab activation handler:", error);
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'contentScriptReady') {
    console.log('Content script ready in tab:', sender.tab.id);
    readyTabs.add(sender.tab.id);
    sendResponse({received: true});
  } else if (message.action === 'error') {
    console.error('Error from content script:', message.error);
  }
});