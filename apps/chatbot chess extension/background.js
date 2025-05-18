// background.js — Chrome Extension service worker (Manifest V3)
// v2 — 2025‑05‑18
// Adds support for the **new Prompt‑API shape** (window.ai.assistant.create)
// while keeping the Origin‑Trial path and the older createTextSession fallback.

/* global chrome */

// ───────────────────────────────────────────────────────────────────────────────
// 1 Context‑menu setup
// ───────────────────────────────────────────────────────────────────────────────
const MENU_ID = 'getMeaning';

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create(
    {
      id: MENU_ID,
      title: 'Get meaning of "%s"',
      contexts: ['selection']
    },
    () => console.log('Context menu created successfully.')
  );
});

// ───────────────────────────────────────────────────────────────────────────────
// 2 Context‑menu click handler
// ───────────────────────────────────────────────────────────────────────────────
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== MENU_ID || !tab?.id) return;
  console.log('Context menu clicked:', MENU_ID);

  // 2‑A Grab the selected word + its sentence from the page’s MAIN world
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    world: 'MAIN',
    func: () => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) {
        return { word: '', sentence: '', error: 'Nothing selected' };
      }
      const text = sel.toString().trim();
      const range = sel.getRangeAt(0);
      let containerText = range.startContainer.textContent || '';
      containerText = containerText.replace(/\s+/g, ' ');
      const sentences = containerText.match(/[^.!?]*[.!?]/g) || [containerText];
      const sentence =
        sentences.find((s) => s.includes(text))?.trim() || containerText.trim();
      return { word: text, sentence };
    }
  });
  console.log('Got selection result:', result);

  if (!result.word) {
    notify('Please select a single word first.');
    return;
  }

  const meaningRes = await fetchMeaning(result.word, result.sentence, tab.id);
  console.log('AI object result:', meaningRes);

  if (meaningRes.success) {
    notify(`“${result.word}” — ${meaningRes.meaning}`);
  } else {
    notify(`Error: ${meaningRes.error}`);
  }
});

// ───────────────────────────────────────────────────────────────────────────────
// 3 AI helper (Gemini Nano via Origin‑Trial → Prompt‑API fallbacks)
// ───────────────────────────────────────────────────────────────────────────────
/**
 * Get the definition of a word in context.
 * Tries, in order:
 *   1. chrome.aiOriginTrial.languageModel    (stable Origin‑Trial)
 *   2. window.ai.assistant.create            (Prompt‑API ≥ Chromium 129)
 *   3. window.ai.createTextSession           (early Prompt‑API ≤ 128)
 * @param {string} word
 * @param {string} sentence
 * @param {number} tabId
 * @returns {Promise<{success:boolean, meaning?:string, error?:string, method?:string}>}
 */
async function fetchMeaning(word, sentence, tabId) {
  const SYSTEM_PROMPT =
    'You are a concise dictionary. Reply with ≤15 words, no examples.';

  // 3‑A Preferred path: chrome.aiOriginTrial.languageModel
  if (chrome?.aiOriginTrial?.languageModel) {
    try {
      const caps = await chrome.aiOriginTrial.languageModel.capabilities();
      if (caps.available !== 'no') {
        const session = await chrome.aiOriginTrial.languageModel.create({
          systemPrompt: SYSTEM_PROMPT
        });
        const reply = await session.prompt(
          `Define “${word}” as used in: “${sentence}”`
        );
        await session.destroy?.();
        return {
          success: true,
          meaning: reply,
          method: 'chrome.aiOriginTrial.languageModel'
        };
      }
    } catch (err) {
      console.warn('aiOriginTrial failed:', err);
    }
  }

  // 3‑B Prompt‑API in the page context
  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId },
      world: 'MAIN',
      func: async (w, s, sysPrompt) => {
        const ai = window.ai;
        if (!ai) return { ok: false, err: 'window.ai undefined' };

        // helper to run a prompt with any session‑creation function
        async function tryCreate(createFn, label) {
          try {
            const session = await createFn({ systemPrompt: sysPrompt });
            const answer = await session.prompt(`Define “${w}” as used in: “${s}”`);
            await session.destroy?.();
            return { ok: true, answer, label };
          } catch (e) {
            return { ok: false, err: e.toString() };
          }
        }

        // Newest API: ai.languageModel (post‑129)
        if (ai?.languageModel?.create) {
          const r = await tryCreate(ai.languageModel.create.bind(ai.languageModel),
                                    'window.ai.languageModel.create');
          if (r.ok) return r;
        }

        // Next‑newer API: ai.assistant.create()
        if (ai?.assistant?.create) {
          const r = await tryCreate(ai.assistant.create.bind(ai.assistant),
                                    'window.ai.assistant.create');
          if (r.ok) return r;
        }

        // Older API: ai.createTextSession()
        if (ai?.createTextSession) {
          const r = await tryCreate(ai.createTextSession.bind(ai),
                                    'window.ai.createTextSession');
          if (r.ok) return r;
        }

        return { ok: false, err: 'No supported window.ai APIs' };
      },
      args: [word, sentence, SYSTEM_PROMPT]
    });

    if (result?.ok) {
      return {
        success: true,
        meaning: result.answer,
        method: result.label
      };
    }

    return { success: false, error: result?.err || 'Unknown Prompt‑API error' };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// 4 Utility helpers
// ───────────────────────────────────────────────────────────────────────────────
function notify(message) {
  chrome.notifications?.create({
    type: 'basic',
    iconUrl: 'icon.png',
    title: 'Meaning of Words',
    message
  });
}
