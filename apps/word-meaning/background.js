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
  console.log("Debug: Starting fetchWordMeaning");
  console.log("Debug: Word:", word);
  console.log("Debug: Sentence:", sentence);
  console.log("Debug: TabId:", tabId);

  try {
    console.log("Debug: Creating language model session");
    const session = await ai.languageModel.create().catch(error => {
      console.error("Debug: Error creating session:", error);
      throw error;
    });
    
    if (!session) {
      console.error("Debug: Session creation failed - session is null or undefined");
      throw new Error("Failed to create language model session");
    }
    
    console.log("Debug: Session created successfully:", session);
    
    // Format the prompt with the word and its context
    const promptText = `Define "${word}" as used in this sentence in 10 words or less: "${sentence}".`;
    console.log("Debug: Prompt text:", promptText);
    
    // Get the response
    console.log("Debug: Sending prompt to model");
    const response = await session.prompt(promptText).catch(error => {
      console.error("Debug: Error getting response:", error);
      throw error;
    });
    
    console.log("Debug: Raw response from model:", response);
    
    // Extract the text from the response
    const result = response?.text || response;
    console.log("Debug: Processed result:", result);

    if (!result) {
      throw new Error("No result received from model");
    }

    // Send the meaning back to the content script
    console.log("Debug: Sending message to content script");
    await chrome.tabs.sendMessage(tabId, { 
      action: "showMeaning", 
      word: word, 
      meaning: result 
    });
    console.log("Debug: Message sent to content script");

    // Clean up the session
    try {
      console.log("Debug: Destroying session");
      await session.destroy();
      console.log("Debug: Session destroyed successfully");
    } catch (destroyError) {
      console.error("Debug: Error destroying session:", destroyError);
    }

  } catch (error) {
    console.error("Error while fetching meaning:", error);
    try {
      // Attempt to send error message to content script
      await chrome.tabs.sendMessage(tabId, { 
        action: "showMeaning", 
        word: word, 
        meaning: `Error: Unable to fetch meaning. ${error.message || 'Please try again later.'}`
      });
    } catch (msgError) {
      console.error("Failed to send error message to content script:", msgError);
    }
  }
}