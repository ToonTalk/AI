console.log("Background script loaded");

let lastTabId = null;
let copiedText = null;
let readyTabs = new Set();

function injectContentScript(tabId) {
  return new Promise((resolve, reject) => {
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('Error injecting script: ', chrome.runtime.lastError.message);
        reject(chrome.runtime.lastError);
      } else {
        console.log('Content script injected successfully');
        resolve();
      }
    });
  });
}

function sendMessageToTab(tabId, message) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, { ...message, from: 'background' }, response => {
      if (chrome.runtime.lastError) {
        console.error('Error sending message to tab: ', chrome.runtime.lastError.message);
        reject(chrome.runtime.lastError);
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
      await injectContentScript(tabId);
      await new Promise(resolve => setTimeout(resolve, 100)); // Short delay to ensure script is ready
      await sendMessageToTab(tabId, { action: 'ping' });
      readyTabs.add(tabId);
    } catch (error) {
      console.error('Error ensuring content script is loaded:', error);
      throw error;
    }
  }
}

async function handleTabChange(tabId) {
  console.log("Handling tab change for tab:", tabId);
  
  if (lastTabId !== null && lastTabId !== tabId) {
    try {
      await ensureContentScriptLoaded(lastTabId);
      console.log("Attempting to copy from tab:", lastTabId);
      const copyResponse = await sendMessageToTab(lastTabId, {action: "copy"});
      
      if (copyResponse && copyResponse.text) {
        copiedText = copyResponse.text;
        console.log("Text copied:", copiedText);

        await ensureContentScriptLoaded(tabId);
        console.log("Attempting to paste to tab:", tabId);
        const pasteResponse = await sendMessageToTab(tabId, {action: "paste", text: copiedText});
        
        if (pasteResponse && pasteResponse.success) {
          console.log("Text pasted successfully");
        } else {
          console.log("No 'prompt-textarea' found for pasting");
        }
      } else if (copyResponse && copyResponse.error) {
        console.log("Copy error:", copyResponse.error);
      }
    } catch (error) {
      console.error("Error during tab change handling:", error);
    }
  }
  
  // Always try to paste to notationInput when switching tabs
  try {
    await ensureContentScriptLoaded(tabId);
    if (copiedText) {
      const notationInputResponse = await sendMessageToTab(tabId, {action: "pasteToNotationInput", text: copiedText});
      if (notationInputResponse && notationInputResponse.success) {
        console.log("Text pasted to notationInput");
      }
    }
  } catch (error) {
    console.error("Error pasting to notationInput:", error);
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
  }
});