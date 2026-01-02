// background.js — Chrome Extension service worker (Manifest V3)
// Core logic:
//  - Build/maintain a right-click context menu for selected text
//  - Collect selection + light context from the active tab
//  - Use on-device Gemini Nano (LanguageModel API) to define in context
//  - Prefer in-page UI via content.js; fall back to notifications

'use strict';

// ====== Config ======
const MENU_ID = 'meaning-in-context';
const ICON_URL = 'icon.png'; // ensure this exists in your extension root

let session = null;

// Store full HTML for clickable notifications (we show preview in notification, full on click)
const notifStore = new Map();

// ====== Utilities ======
function clampText(s, maxLen) {
  s = (s || '').trim();
  if (s.length <= maxLen) return s;
  return s.slice(0, maxLen - 1) + '…';
}

function escapeHtml(str) {
  return (str || '').replace(/[&<>"']/g, (m) => (
    m === '&' ? '&amp;'
      : m === '<' ? '&lt;'
        : m === '>' ? '&gt;'
          : m === '"' ? '&quot;'
            : '&#039;'
  ));
}

// Very small markdown -> HTML converter (safe-ish for our use)
function mdToHtml(md) {
  const safe = escapeHtml(md || '');
  // headings
  let html = safe
    .replace(/^### (.*)$/gm, '<h3>$1</h3>')
    .replace(/^## (.*)$/gm, '<h2>$1</h2>')
    .replace(/^# (.*)$/gm, '<h1>$1</h1>');
  // bold / italics
  html = html.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  html = html.replace(/\*(.+?)\*/g, '<i>$1</i>');
  // bullets
  html = html.replace(/^\s*-\s+(.*)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>');
  // line breaks
  html = html.replace(/\n/g, '<br>');
  return `<div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; padding: 10px;">${html}</div>`;
}

function markdownToPlain(md) {
  // crude but effective for notification previews
  return (md || '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/[#>*_`]/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function shortenForToast(text, maxLen = 250) {
  const t = (text || '').trim();
  if (t.length <= maxLen) return t;
  return t.slice(0, maxLen - 1) + '…';
}

// ====== Gemini Nano session handling ======
async function getOrCreateSession() {
  if (session) return session;

  // LanguageModel is currently available in Chromium builds that support Gemini Nano on-device
  if (typeof LanguageModel === 'undefined') {
    throw new Error('LanguageModel API not available in this browser build.');
  }

  const availability = await LanguageModel.availability();
  console.log('[AI] Availability:', availability);
  if (availability !== 'available') {
    throw new Error(`AI availability is "${availability}".`);
  }

  console.log('Creating new AI session...');
  session = await LanguageModel.create({
    monitor(m) {
      m.addEventListener('downloadprogress', (e) => {
        console.log(`[AI] Gemini Nano download: ${Math.round(e.loaded * 100)}%`);
      });
    },
  });

  console.log('[AI] Session ready.');
  return session;
}

// ====== Selection + context extraction ======
async function getSelectionAndContext(tabId) {
  const [res] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const selection = window.getSelection();
      const text = (selection && selection.toString() || '').trim();

      // best effort context capture
      const anchorNode = selection && selection.anchorNode;
      let container = anchorNode && (anchorNode.nodeType === Node.ELEMENT_NODE ? anchorNode : anchorNode.parentElement);

      // walk up a bit to find a meaningful block
      let sentence = '';
      let paragraph = '';
      let heading = '';

      if (container) {
        // try nearest heading
        const h = container.closest('h1,h2,h3,h4,h5,h6');
        heading = h ? h.textContent.trim() : '';

        // paragraph-like container
        const p = container.closest('p,li,blockquote,div,span');
        paragraph = p ? (p.textContent || '').trim() : (container.textContent || '').trim();

        // sentence approximation: try splitting paragraph around selected text
        if (paragraph && text) {
          const idx = paragraph.toLowerCase().indexOf(text.toLowerCase());
          if (idx >= 0) {
            // find sentence boundaries around idx
            const before = paragraph.slice(0, idx);
            const after = paragraph.slice(idx + text.length);
            const start = Math.max(
              before.lastIndexOf('.'),
              before.lastIndexOf('!'),
              before.lastIndexOf('?')
            );
            const endDot = after.indexOf('.');
            const endEx = after.indexOf('!');
            const endQ = after.indexOf('?');
            const endRel = [endDot, endEx, endQ].filter(x => x >= 0).sort((a, b) => a - b)[0];
            const startIdx = start >= 0 ? start + 1 : 0;
            const endIdx = endRel != null ? (idx + text.length + endRel + 1) : paragraph.length;
            sentence = paragraph.slice(startIdx, endIdx).trim();
          } else {
            sentence = paragraph.split(/(?<=[.!?])\s+/)[0] || paragraph;
          }
        }
      }

      // Title
      const title = document.title || '';

      return { text, sentence, paragraph, heading, title };
    },
  });

  return res?.result || { text: '', sentence: '', paragraph: '', heading: '', title: '' };
}

/* ===================== Define in context ===================== */
async function defineSelectedInContext(tab) {
  try {
    const { text, sentence, paragraph, heading, title } = await getSelectionAndContext(tab.id);
    if (!text) {
      await chrome.notifications.create({
        type: 'basic',
        iconUrl: ICON_URL,
        title: 'No text selected',
        message: 'Select a word or phrase first.',
        priority: 0,
        requireInteraction: true,
      });
      return;
    }

    const sess = await getOrCreateSession();

    // System prompt tuned for short, in-context meaning
    const prompt = `
You are a concise, accurate assistant that defines the selected word/phrase in its context.
Return:
1) A brief meaning (1-2 sentences).
2) If ambiguous, list up to 3 plausible senses and pick the best match for the provided sentence.
3) Provide one short paraphrase of the sentence using the chosen sense.
4) Provide one synonym (if appropriate).
Avoid hallucinations. If you can't infer, say so.

Selected: "${text}"

Page title: "${title}"
Heading: "${heading}"

Sentence: "${sentence}"
Paragraph (may include noise): "${paragraph}"
`.trim();

    const result = await sess.prompt(prompt);

    const markdown = `## Meaning (in context)\n${result}\n`;
    const plain = markdownToPlain(markdown);
    const preview = shortenForToast(plain, 240);
    const notifId  = 'def-' + (crypto?.randomUUID?.() || Date.now());

    // Prefer an in-page popup via content.js (more reliable than OS notifications).
    // If messaging fails (e.g., content script not injected, restricted page), fall back to a notification.
    try {
      await chrome.tabs.sendMessage(tab.id, {
        action: 'showMeaning',
        word: text,
        meaning: plain,
      });
      return;
    } catch (e) {
      console.warn('Could not show in-page result; falling back to notification:', e);
    }

    notifStore.set(notifId, {
      title: `Meaning of: ${text.slice(0, 80)}${text.length > 80 ? '…' : ''}`,
      html: mdToHtml(markdown),
    });

    await chrome.notifications.create(notifId, {
      type: 'basic',
      iconUrl: ICON_URL,
      title: `Meaning of: ${text.slice(0, 48)}${text.length > 48 ? '…' : ''}`,
      message: preview + (plain.length > preview.length ? '\n\n(Click to view full result)' : ''),
      priority: 2,
      requireInteraction: true,
    });
  } catch (err) {
    console.error('Define error:', err);
    await chrome.notifications.create({
      type: 'basic',
      iconUrl: ICON_URL,
      title: 'AI error',
      message: (err && err.message) || String(err),
      priority: 1,
      requireInteraction: true,
    });
  }
}

/* ===================== Messages from popup ===================== */
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.action === 'checkAIAvailability') {
    (async () => {
      try {
        if (typeof LanguageModel === 'undefined') {
          sendResponse({ available: false, detail: 'LanguageModel API not available.' });
          return;
        }
        const availability = await LanguageModel.availability();
        sendResponse({ available: availability === 'available', detail: availability });
      } catch (e) {
        sendResponse({ available: false, detail: (e && e.message) || String(e) });
      }
    })();
    return true; // async response
  }

  // If the popup asks to show a stored notification detail
  if (msg?.action === 'getNotificationHtml' && msg?.id) {
    const entry = notifStore.get(msg.id);
    sendResponse({ ok: !!entry, ...entry });
    return;
  }
});

/* ===================== Notification click handling ===================== */
chrome.notifications.onClicked.addListener((notificationId) => {
  const entry = notifStore.get(notificationId);
  if (!entry) return;

  // Open an extension page to show full HTML
  const url = chrome.runtime.getURL(`notification.html?id=${encodeURIComponent(notificationId)}`);
  chrome.tabs.create({ url });
});

/* ===================== Context menu ===================== */
function ensureContextMenu() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MENU_ID,
      title: 'Get meaning in context',
      contexts: ['selection'],
    }, () => {
      if (chrome.runtime.lastError) {
        console.warn('Context menu create error:', chrome.runtime.lastError.message);
      }
    });
  });
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === MENU_ID && tab?.id != null) {
    defineSelectedInContext(tab);
  }
});

// If your manifest does NOT define a default_popup for the action, this will fire when the
// user clicks the extension icon. If you DO have a default_popup, you need to trigger
// defineSelectedInContext from popup.js instead.
chrome.action.onClicked.addListener((tab) => {
  if (tab?.id != null) defineSelectedInContext(tab);
});

chrome.runtime.onInstalled.addListener(() => {
  ensureContextMenu();
});
chrome.runtime.onStartup.addListener(() => {
  ensureContextMenu();
});
