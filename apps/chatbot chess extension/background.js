// background.js
console.log("Background script loaded");

let copiedText = "Sample move";  // Default text for testing pasting actions.

/**
 * Sends a message to a specific tab.
 */
async function sendMessageToTab(tabId, message, retries = 3) {
  return new Promise((resolve, reject) => {
    // Ping the tab to see if the content script is ready
    console.log(`Pinging tab ${tabId} to check if content script is loaded...`);

    chrome.tabs.sendMessage(tabId, { action: 'ping' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error(`Error pinging tab ${tabId}: ${chrome.runtime.lastError.message}`);
        if (retries > 0) {
          console.log(`Retrying... ${retries} attempts left.`);
          setTimeout(() => sendMessageToTab(tabId, message, retries - 1).then(resolve).catch(reject), 1000);
        } else {
          reject(chrome.runtime.lastError.message);
        }
      } else if (response && response.loaded) {
        console.log(`Content script is loaded in tab ${tabId}. Sending message.`);
        // Content script is ready, send the actual message
        chrome.tabs.sendMessage(tabId, message, (response) => {
          if (chrome.runtime.lastError) {
            console.error(`Error sending message to tab ${tabId}: ${chrome.runtime.lastError.message}`);
            reject(chrome.runtime.lastError.message);
          } else {
            resolve(response);
          }
        });
      } else {
        console.log(`Content script not loaded in tab ${tabId}.`);
        if (retries > 0) {
          console.log(`Retrying... ${retries} attempts left.`);
          setTimeout(() => sendMessageToTab(tabId, message, retries - 1).then(resolve).catch(reject), 1000);
        } else {
          reject('Content script not loaded');
        }
      }
    });
  });
}

/**
 * Manually trigger paste to ChatGPT.
 */
async function triggerPasteToChatGPT() {
  const tabs = await chrome.tabs.query({ url: "*://*.chatgpt.com/*" });
  if (tabs.length > 0) {
    const tabId = tabs[0].id;
    try {
      console.log(`Manually pasting text to ChatGPT in tab ${tabId}:`, copiedText);
      await sendMessageToTab(tabId, { action: 'pasteToChatGPT', text: copiedText });
    } catch (error) {
      console.error(`Error in manual paste to ChatGPT (tab ${tabId}):`, error);
    }
  } else {
    console.error("ChatGPT tab not found for manual paste.");
  }
}

/**
 * Manually trigger paste to Chess App.
 */
async function triggerPasteToChessApp() {
  const tabs = await chrome.tabs.query({ url: "*://toontalk.github.io/*" });
  if (tabs.length > 0) {
    const tabId = tabs[0].id;
    try {
      console.log(`Manually pasting text to Chess app in tab ${tabId}:`, copiedText);
      await sendMessageToTab(tabId, { action: 'pasteToChessApp', text: copiedText });
    } catch (error) {
      console.error(`Error in manual paste to Chess app (tab ${tabId}):`, error);
    }
  } else {
    console.error("Chess app tab not found for manual paste.");
  }
}

/**
 * Handles copy-paste actions between ChatGPT and the chess app.
 */
chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
  if (request.action === "copyFromChess") {
    copiedText = request.text;
    console.log("Text copied from chess tab:", copiedText);
    sendResponse({ success: true });
  }
});

/**
 * Test commands (send from console)
 */
chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
  if (request.action === "manualPasteToChatGPT") {
    triggerPasteToChatGPT();
  }

  if (request.action === "manualPasteToChessApp") {
    triggerPasteToChessApp();
  }
});
