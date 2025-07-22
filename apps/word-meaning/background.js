// background.js — Chrome Extension service worker (Manifest V3)
// v6.0 — Corrected according to official documentation
// Uses the global LanguageModel object.

/* global LanguageModel, chrome */

const MENU_ID = 'getMeaning';

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: MENU_ID,
    title: 'Get meaning of "%s"',
    contexts: ['selection']
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== MENU_ID || !tab?.id) return;

  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      world: 'MAIN',
      func: () => {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) {
          return null;
        }
        const text = sel.toString().trim();
        const range = sel.getRangeAt(0);
        let containerText = range.startContainer.textContent || '';
        containerText = containerText.replace(/\s+/g, ' ');
        return { word: text, sentence: containerText };
      }
    });

    if (result && result.word) {
      const meaningRes = await fetchMeaning(result.word, result.sentence);
      if (meaningRes.success) {
        notify(`“${result.word}” — ${meaningRes.meaning}`);
      } else {
        notify(`Error: ${meaningRes.error}`);
      }
    } else {
      notify('Please select a single word first.');
    }
  } catch (e) {
    console.error("Error processing context menu click:", e);
    notify("An error occurred. Please try again.");
  }
});

async function fetchMeaning(word, sentence) {
  // Check for the global LanguageModel object's existence.
  if (typeof LanguageModel === 'undefined') {
    return { success: false, error: 'The LanguageModel API is not available in this browser.' };
  }

  try {
    // Check if the model is available or downloadable.
    const availability = await LanguageModel.availability();
    if (availability === 'unavailable') {
      return { success: false, error: 'AI model is unavailable on this device.' };
    }

    // Create a session, setting the persona with an initial system prompt.
    const session = await LanguageModel.create({
      initialPrompts: [{ role: 'system', content: 'You are a concise dictionary.' }]
    });

    const response = await session.prompt(
      `In 15 words or less, define "${word}" as used in the sentence: "${sentence}"`
    );
    
    // Terminate the session to free up resources.
    await session.destroy();

    return { success: true, meaning: response };

  } catch (err) {
    console.error('AI session failed:', err);
    return { success: false, error: err.message };
  }
}

function notify(message) {
  chrome.notifications?.create({
    type: 'basic',
    iconUrl: 'icon.png',
    title: 'Word Meaning Finder',
    message
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'checkAIAvailability') {
    (async () => {
      if (typeof LanguageModel === 'undefined') {
        sendResponse({ available: false, details: 'LanguageModel API not found.' });
        return;
      }
      try {
        const availability = await LanguageModel.availability(); //
        const isAvailable = availability === "available";
        sendResponse({ available: isAvailable, details: `Model status: ${availability}` });
      } catch (e) {
        sendResponse({ available: false, details: e.message });
      }
    })();
    return true; // Keep message channel open for async response.
  }
});