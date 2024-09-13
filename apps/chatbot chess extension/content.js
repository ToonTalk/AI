// content.js
console.log("Content script loaded");

function performCopy() {
  if (window.location.href.includes('chat.openai.com')) {
    const flexDivs = document.querySelectorAll('.flex.max-w-full.flex-col.flex-grow');
    if (flexDivs.length > 0) {
      const lastFlexDiv = flexDivs[flexDivs.length - 1];
      const text = lastFlexDiv.innerText;
      console.log("Copying text from ChatGPT:", text);
      return { text: text };
    }
  } else {
    const notationDisplay = document.getElementById('notationDisplay');
    if (notationDisplay) {
      const text = notationDisplay.textContent || notationDisplay.innerText;
      const items = text.trim().split(/\s+/);
      const lastItem = items[items.length - 1];
      if (lastItem) {
        console.log("Copying text:", lastItem);
        return { text: lastItem };
      }
    }
  }
  console.log("No suitable element found for copying");
  return { error: "No suitable element found for copying" };
}

function triggerInputEvent(element) {
  const inputEvent = new Event('input', { bubbles: true, cancelable: true });
  element.dispatchEvent(inputEvent);
}

function performPaste(text) {
  if (window.location.href.includes('chat.openai.com')) {
    const promptTextarea = document.getElementById('prompt-textarea');
    if (promptTextarea && text) {
      promptTextarea.value = text;
      triggerInputEvent(promptTextarea);
      
      if (promptTextarea.value !== text) {
        console.log("Paste verification failed for ChatGPT. Expected:", text, "Actual:", promptTextarea.value);
        return { error: "Paste verification failed" };
      }
      
      console.log("Text pasted successfully to ChatGPT");
      
      setTimeout(() => {
        const sendButton = document.querySelector('button[data-testid="send-button"]');
        if (sendButton) {
          sendButton.click();
          console.log("Send button clicked for ChatGPT");
        } else {
          console.log("Send button not found for ChatGPT");
        }
      }, 100);
      
      return { success: true };
    } else {
      console.log("ChatGPT textarea not found or no text to paste");
      return { error: "ChatGPT textarea not found or no text to paste" };
    }
  } else {
    const notationInput = document.getElementById('notationInput');
    if (notationInput && text) {
      notationInput.value = text;
      triggerInputEvent(notationInput);
      
      if (notationInput.value !== text) {
        console.log("Paste verification failed for notationInput. Expected:", text, "Actual:", notationInput.value);
        return { error: "Paste verification failed" };
      }
      
      console.log("Text pasted successfully to notationInput");
      
      setTimeout(() => {
        const submitMoveButton = document.querySelector('button[onclick="makeMove()"]');
        if (submitMoveButton) {
          submitMoveButton.click();
          console.log("Submit Move button clicked");
        } else {
          console.log("Submit Move button not found");
        }
      }, 100);
      
      return { success: true };
    } else {
      console.log("notationInput not found or no text to paste");
      return { error: "notationInput not found or no text to paste" };
    }
  }
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log("Message received in content script:", request);
  
  if (request.from === 'background') {
    if (request.action === "ping") {
      sendResponse({ loaded: true });
    } else if (request.action === "copy") {
      sendResponse(performCopy());
    } else if (request.action === "paste") {
      sendResponse(performPaste(request.text));
    }
  }
  return true;
});

function notifyBackgroundScript() {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: 'contentScriptReady' }, response => {
      if (chrome.runtime.lastError) {
        console.error('Error notifying background script:', chrome.runtime.lastError.message);
        chrome.runtime.sendMessage({ 
          action: 'error', 
          error: chrome.runtime.lastError.message 
        });
        reject(chrome.runtime.lastError);
      } else {
        console.log('Background script notified of content script ready');
        resolve(response);
      }
    });
  });
}

async function initializeContentScript() {
  try {
    await notifyBackgroundScript();
  } catch (error) {
    console.error('Failed to initialize content script:', error);
  }
}

initializeContentScript();
