// background.js — Chrome Extension service worker (Manifest V3)
//
// Features:
// - Context menu item "Get meaning in context" on selected text
// - Uses on-device Gemini Nano via LanguageModel API
// - Shows result in-page (content.js) when possible; falls back to Chrome notifications
// - Clicking a notification opens a popup window with full text (no notification.html required)

'use strict';

// ===== Config =====
const MENU_ID = 'meaning-in-context';
const ICON_URL = 'icon.png'; // make sure this exists in your extension root

let session = null;

// Store full HTML payload for each notification id so click can open full view
const notifStore = new Map();

// ===== Small utilities =====
function escapeHtml(str) {
  return (str || '').replace(/[&<>"']/g, (m) => (
    m === '&' ? '&amp;'
      : m === '<' ? '&lt;'
        : m === '>' ? '&gt;'
          : m === '"' ? '&quot;'
            : '&#039;'
  ));
}

function markdownToPlain(md) {
  return (md || '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/[#>*_`]/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function shorten(text, maxLen = 240) {
  const t = (text || '').trim();
  if (t.length <= maxLen) return t;
  return t.slice(0, maxLen - 1) + '…';
}

// Minimal markdown-ish -> HTML (enough for readable display)
function mdToHtml(md) {
  const safe = escapeHtml(md || '');

  let html = safe
    .replace(/^### (.*)$/gm, '<h3>$1</h3>')
    .replace(/^## (.*)$/gm, '<h2>$1</h2>')
    .replace(/^# (.*)$/gm, '<h1>$1</h1>');

  html = html.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  html = html.replace(/\*(.+?)\*/g, '<i>$1</i>');

  // bullets
  html = html.replace(/^\s*-\s+(.*)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>');

  html = html.replace(/\n/g, '<br>');

  return `<div class="box">${html}</div>`;
}

function randomId(prefix = 'id') {
  try {
    if (globalThis.crypto?.randomUUID) return `${prefix}-${crypto.randomUUID()}`;
  } catch {}
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

// ===== Full-text popup window (no external file needed) =====
function openFullResultWindow(title, html) {
  const doc = `<!doctype html>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>
  body {
    font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
    line-height: 1.5;
    padding: 16px;
    background: #f6f7f9;
  }
  h1 { font-size: 16px; margin: 0 0 8px; }
  .box {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 12px;
  }
  pre { overflow: auto; background: #f8fafc; padding: 8px; border-radius: 8px; }
  code { background: #f8fafc; padding: 0 4px; border-radius: 4px; }
  blockquote {
    border-left: 4px solid #e5e7eb;
    margin: 8px 0;
    padding: 4px 8px;
    color: #374151;
    background: #fbfdff;
  }
  a { color: #2563eb; }
</style>
<h1>${escapeHtml(title)}</h1>
${html}
`;

  // Data URL avoids needing notification.html in your package.
  // If you ever generate extremely large outputs, this can hit URL size limits.
  const url = 'data:text/html;charset=utf-8,' + encodeURIComponent(doc);
  chrome.windows.create({ url, type: 'popup', width: 520, height: 640 });
}

// ===== Gemini Nano session handling =====
async function getOrCreateSession() {
  if (session) return session;

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

// ===== Selection + context extraction =====
async function getSelectionAndContext(tabId) {
  const [res] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const selection = window.getSelection();
      const text = (selection && selection.toString() || '').trim();

      const anchorNode = selection && selection.anchorNode;
      let container = anchorNode && (anchorNode.nodeType === Node.ELEMENT_NODE ? anchorNode : anchorNode.parentElement);

      let sentence = '';
      let paragraph = '';
      let heading = '';

      if (container) {
        const h = container.closest('h1,h2,h3,h4,h5,h6');
        heading = h ? h.textContent.trim() : '';

        const p = container.closest('p,li,blockquote,div,span');
        paragraph = p ? (p.textContent || '').trim() : (container.textContent || '').trim();

        if (paragraph && text) {
          const idx = paragraph.toLowerCase().indexOf(text.toLowerCase());
          if (idx >= 0) {
            const before = paragraph.slice(0, idx);
            const after = paragraph.slice(idx + text.length);

            const start = Math.max(before.lastIndexOf('.'), before.lastIndexOf('!'), before.lastIndexOf('?'));
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

      const title = document.title || '';
      return { text, sentence, paragraph, heading, title };
    },
  });

  return res?.result || { text: '', sentence: '', paragraph: '', heading: '', title: '' };
}

// ===== Main action: define selected text in context =====
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
    const preview = shorten(plain, 240);

    // First try to show in-page via content.js
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

    // Notification fallback
    const notifId = randomId('def');
    const fullTitle = `Meaning of: ${text.slice(0, 80)}${text.length > 80 ? '…' : ''}`;
    notifStore.set(notifId, {
      title: fullTitle,
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

// ===== Notification click opens full text =====
chrome.notifications.onClicked.addListener((id) => {
  const item = notifStore.get(id);
  if (!item) return;
  openFullResultWindow(item.title, item.html);
});

// ===== Context menu wiring =====
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

// Toolbar icon click:
// Note: if you have a default_popup, this won't fire. In that case, trigger define from popup.js instead.
chrome.action.onClicked.addListener((tab) => {
  if (tab?.id != null) defineSelectedInContext(tab);
});

// ===== Messages from popup (availability check, etc.) =====
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
    return true;
  }

  if (msg?.action === 'defineSelection') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab?.id != null) defineSelectedInContext(tab);
      sendResponse({ ok: true });
    });
    return true;
  }
});

// ===== Install/startup =====
chrome.runtime.onInstalled.addListener(() => {
  ensureContextMenu();
});
chrome.runtime.onStartup.addListener(() => {
  ensureContextMenu();
});
