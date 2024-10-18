chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "getMeaning",
    title: "Get Meaning of Selected Word",
    contexts: ["selection"]
  });
  console.log("Context menu created.");
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "getMeaning") {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: getSelectedWordAndSentence
    }, (result) => {
      const { word, sentence } = result[0].result;
      if (word && sentence) {
        // Check if the content script has been injected already
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["content.js"]
        }, () => {
          // After injecting the content script, send the message
          fetchWordMeaning(word, sentence, tab.id);
        });
      }
    });
  }
});

function getSelectedWordAndSentence() {
  const selection = window.getSelection();
  const word = selection.toString().trim();

  if (!word) {
    return null;
  }

  // Get the full text of the node containing the selection
  const anchorNode = selection.anchorNode;
  const text = anchorNode.textContent;

  // Define sentence-ending punctuation characters
  const sentenceEndings = /[.?!]/;

  // Find the start and end of the sentence using the punctuation marks
  const startIndex = text.slice(0, selection.anchorOffset).lastIndexOf('.') + 1 || 
                     text.slice(0, selection.anchorOffset).lastIndexOf('?') + 1 || 
                     text.slice(0, selection.anchorOffset).lastIndexOf('!') + 1 || 
                     0;
                     
  const endIndex = text.slice(selection.focusOffset).search(sentenceEndings) + selection.focusOffset || text.length;

  const sentence = text.slice(startIndex, endIndex).trim();
  
  return { word, sentence };
}

async function fetchWordMeaning(word, sentence, tabId) {
  console.log("Fetching meaning for:", word);  // Log word before calling the API

  let session;

  try {
    const { available } = await ai.assistant.capabilities();
    if (available === "readily") {
      session = await ai.assistant.create();
      const promptText = `Respond with a short meaning of the word "${word}" in the following sentence: "${sentence}".`;
      const result = await session.prompt(promptText);

      console.log("Result from AI:", result);  // Log result from the API

      // Send the meaning back to the content script
      chrome.tabs.sendMessage(tabId, { action: "showMeaning", word: word, meaning: result });
    } else {
      console.error("Gemini Nano model is not available.");
    }
  } catch (error) {
    console.error("Error while fetching meaning:", error);
  } finally {
    if (session) {
      // Destroy the session after use to free resources
      session.destroy();
      console.log("Session destroyed.");
    }
  }
}
