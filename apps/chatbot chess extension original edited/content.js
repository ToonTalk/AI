// content.js
console.log("Content script loaded");

function performCopy() {
  const notationDisplay = document.getElementById('notationDisplay');
  if (notationDisplay) {
    const text = notationDisplay.textContent || notationDisplay.innerText;
    const items = text.trim().split(/\s+/);
    const lastItem = items[items.length - 1];
    if (lastItem) {
      console.log("Copying text:", lastItem);
      return { text: lastItem };
    } else {
      console.log("No text found in notationDisplay");
      return { error: "No text found in notationDisplay" };
    }
  } else {
    const flexDivs = document.querySelectorAll('.flex.max-w-full.flex-col.flex-grow');
    if (flexDivs.length > 0) {
      const lastFlexDiv = flexDivs[flexDivs.length - 1];
      const text = lastFlexDiv.innerText;
      console.log("Copying text from flex div:", text);
      return { text: text };
    } else {
      console.log("No suitable element found for copying");
      return { error: "No suitable element found for copying" };
    }
  }
}

function triggerInputEvents(element) {
  const inputEvent = new Event('input', { bubbles: true, cancelable: true });
  const changeEvent = new Event('change', { bubbles: true, cancelable: true });
  element.dispatchEvent(inputEvent);
  element.dispatchEvent(changeEvent);
  
  // Additional events that might be needed
  element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
  element.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter', bubbles: true, cancelable: true }));
  element.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true, cancelable: true }));
}

function performPaste(text) {
  const promptTextarea = document.getElementById('prompt-textarea');
  if (promptTextarea && text) {
    promptTextarea.value = text;
    triggerInputEvents(promptTextarea);
    
    console.log("Text pasted successfully");
    
    // Click the send button
    setTimeout(() => {
      const sendButton = document.getElementById('send-button');
      if (sendButton) {
        sendButton.click();
        console.log("Send button clicked");
      } else {
        console.log("Send button not found");
      }
    }, 100);  // Short delay to ensure the paste is processed
    
    return { success: true };
  } else {
    console.log("prompt-textarea not found or no text to paste");
    return { error: "prompt-textarea not found or no text to paste" };
  }
}

function pasteToNotationInput(text) {
//  const notationInput = document.getElementById('notationInput'); // KK
const promptTextarea = document.querySelector('#prompt-textarea');
  if (notationInput && text) {
    notationInput.value = text;
    triggerInputEvents(notationInput);
    
    console.log("Text pasted to notationInput successfully");
    
    // Click the Submit Move button
    setTimeout(() => {
      const submitMoveButton = document.querySelector('button[onclick="makeMove()"]');
      if (submitMoveButton) {
        submitMoveButton.click();
        console.log("Submit Move button clicked");
      } else {
        console.log("Submit Move button not found");
      }
    }, 100);  // Short delay to ensure the paste is processed
    
    return { success: true };
  } else {
    console.log("notationInput not found or no text to paste");
    return { error: "notationInput not found or no text to paste" };
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
    } else if (request.action === "pasteToNotationInput") {
      sendResponse(pasteToNotationInput(request.text));
    }
  }
  return true;
});

// Notify background script that content script is loaded
chrome.runtime.sendMessage({ action: 'contentScriptReady' }, response => {
  if (chrome.runtime.lastError) {
    console.error('Error notifying background script:', chrome.runtime.lastError);
  } else {
    console.log('Background script notified of content script ready');
  }
});