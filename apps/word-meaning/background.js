// background.js — Chrome Extension service worker (Manifest V3)
// v7.0 — Updated to reuse the AI session for better performance

/* global LanguageModel, chrome */

const MENU_ID = 'getMeaning';
let session; // Declare session variable in the global scope

// Helper function to create or retrieve the AI session
async function getOrCreateSession() {
  // If the session already exists, we can reuse it.
  // The service worker might be terminated and restarted, clearing this variable.
  if (session) {
    return session;
  }
  
  // Check for the global LanguageModel object's existence.
  if (typeof LanguageModel === 'undefined') {
    throw new Error('The LanguageModel API is not available in this browser.');
  }
  
  // Check if the model is available.
  const availability = await LanguageModel.availability();
  if (availability === 'unavailable') {
    throw new Error('AI model is unavailable on this device.');
  }

  // Create a session, setting the persona with an initial system prompt.
  console.log("Creating new AI session...");
  session = await LanguageModel.create({
    initialPrompts: [{ role: 'system', content: 'You are a concise dictionary.' }]
  });
  return session;
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: MENU_ID,
    title: 'Get meaning of "%s"',
    contexts: ['selection']
  });
  // We can optionally pre-warm the session here, but it's fine to do it on first use.
  getOrCreateSession().catch(err => console.error("Initial session creation failed:", err));
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== MENU_ID || !tab?.id) return;

  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      world: 'MAIN',
      func: () => {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return null;
        const text = sel.toString().trim();
        const range = sel.getRangeAt(0);
        let containerText = range.startContainer.textContent || '';
        containerText = containerText.replace(/\s+/g, ' ');
        return { word: text, sentence: containerText };
      }
    });

    if (result && result.word) {
      const meaning = await fetchMeaning(result.word, result.sentence);
      notify(`“${result.word}” — ${meaning}`);
    } else {
      notify('Please select a single word first.');
    }
  } catch (e) {
    console.error("Error processing context menu click:", e);
    notify(`An error occurred: ${e.message}`);
    session = null; // Reset session on error
  }
});

async function fetchMeaning(word, sentence) {
  try {
    const aiSession = await getOrCreateSession();
    
    const response = await aiSession.prompt(
      `In 15 words or less, define "${word}" as used in the sentence: "${sentence}"`
    );
    
    // With a shared session, we no longer destroy it after each use.
    // await aiSession.destroy(); 
    
    return response;

  } catch (err) {
    console.error('AI session failed:', err);
    session = null; // Reset session on error
    // Re-throw the error to be caught by the caller
    throw err;
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

// The onMessage listener for the popup remains the same.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'checkAIAvailability') {
    (async () => {
      if (typeof LanguageModel === 'undefined') {
        sendResponse({ available: false, details: 'LanguageModel API not found.' });
        return;
      }
      try {
        const availability = await LanguageModel.availability();
        const isAvailable = availability === "available";
        sendResponse({ available: isAvailable, details: `Model status: ${availability}` });
      } catch (e) {
        sendResponse({ available: false, details: e.message });
      }
    })();
    return true; // Keep message channel open for async response.
  }
});