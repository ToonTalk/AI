// content.js
console.log("Content script loaded");

/**
 * Logs the received message in a clear format.
 */
chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
  console.log("Message received in content script:", JSON.stringify(request));

  if (request.action === "ping") {
    sendResponse({ loaded: true });
  } else if (request.action === "testMessage") {
    console.log("Test message received:", request.text);
    sendResponse({ success: true });
  } else if (request.action === "pasteToChatGPT") {
    console.log("Pasting to ChatGPT:", request.text);
    const result = await pasteToChatGPT(request.text);
    sendResponse(result);
  } else if (request.action === "pasteToChessApp") {
    console.log("Pasting to Chess App:", request.text);
    const result = await pasteToChessApp(request.text);
    sendResponse(result);
  }
});

/**
 * Pastes text into ChatGPT input field.
 */
async function pasteToChatGPT(text) {
  try {
    const chatGPTInput = await waitForElement('textarea[data-id="prompt-textarea"]');
    if (chatGPTInput && text) {
      chatGPTInput.value = text;
      triggerInputEvents(chatGPTInput);
      console.log("Text pasted to ChatGPT");

      const sendButton = await waitForElement('button[data-testid="send-button"]');
      if (sendButton) {
        sendButton.click();
        console.log("Send button clicked");
        return { success: true };
      }
    } else {
      return { error: "ChatGPT input not found or no text to paste" };
    }
  } catch (error) {
    console.error("Error in pasteToChatGPT:", error);
    return { error: error.message };
  }
}

/**
 * Pastes text into the chess app's notation input field.
 */
async function pasteToChessApp(text) {
  try {
    const notationInput = await waitForElement('#notationInput');
    if (notationInput && text) {
      notationInput.value = text;
      triggerInputEvents(notationInput);

      console.log("Text pasted to chess app");

      const submitMoveButton = await waitForElement('button[onclick="makeMove()"]');
      if (submitMoveButton) {
        submitMoveButton.click();
        console.log("Submit Move button clicked");
        return { success: true };
      } else {
        return { error: "Submit Move button not found" };
      }
    } else {
      return { error: "notationInput not found or no text to paste" };
    }
  } catch (error) {
    console.error("Error in pasteToChessApp:", error);
    return { error: error.message };
  }
}

/**
 * Triggers input events on an element to simulate typing.
 */
function triggerInputEvents(element) {
  const inputEvent = new Event('input', { bubbles: true, cancelable: true });
  const changeEvent = new Event('change', { bubbles: true, cancelable: true });

  element.dispatchEvent(inputEvent);
  element.dispatchEvent(changeEvent);
}

/**
 * Waits for an element to appear in the DOM.
 */
function waitForElement(selector, timeout = 10000) {
  return new Promise((resolve, reject) => {
    let retries = 0;
    const interval = setInterval(() => {
      const element = document.querySelector(selector);
      retries += 1;

      if (element) {
        clearInterval(interval);
        resolve(element);
      } else if (retries * 100 >= timeout) {
        clearInterval(interval);
        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
      }
    }, 100);
  });
}
