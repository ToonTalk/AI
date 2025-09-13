// background.js — Chrome Extension service worker (Manifest V3)
// v12 — paragraph-vs-sentence context, clean notifications, click-to-expand

/* global LanguageModel, chrome */
'use strict';

const MENU_ID   = 'getMeaning';
const NOTIF_ID  = 'ai-download';       // used for model download progress
const ICON_URL  = 'icon.png';          // ensure this exists in your extension root
let session = null;

// Store full results keyed by notification id (for click-to-open)
const notifStore = new Map();

/* ===================== Badge helpers ===================== */
function showBadge(text) {
  if (chrome.action?.setBadgeText) {
    chrome.action.setBadgeBackgroundColor({ color: '#3b82f6' });
    chrome.action.setBadgeText({ text });
  }
}
function clearBadge() {
  if (chrome.action?.setBadgeText) chrome.action.setBadgeText({ text: '' });
}

/* ===================== Markdown helpers ===================== */
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Convert common Markdown → plain text for notifications (toasts can't render MD)
function mdToPlain(md) {
  let s = String(md || '');
  s = s.replace(/```[\s\S]*?```/g, (m) => m.replace(/```/g, '').trim()); // code blocks
  s = s.replace(/`([^`]+)`/g, '$1');                                     // inline code
  s = s.replace(/(\*\*|__)(.*?)\1/g, '$2');                              // bold
  s = s.replace(/(\*|_)(.*?)\1/g, '$2');                                 // italic
  s = s.replace(/~~(.*?)~~/g, '$1');                                     // strike
  s = s.replace(/!\[.*?\]\(.*?\)/g, '');                                 // images
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');                  // links
  s = s.replace(/^\s{0,3}#{1,6}\s+/gm, '');                              // headings
  s = s.replace(/^\s{0,3}>\s?/gm, '');                                   // quotes
  s = s.replace(/^\s*[-*+]\s+/gm, '• ');                                 // bullets
  s = s.replace(/^\s*\d+\.\s+/gm, (m) => m.replace(/\d+\./, '•'));       // ordered
  s = s.replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim();            // tidy
  return s;
}

// Minimal, safe-ish Markdown → HTML for the full view window
function mdToHtml(md) {
  let html = escapeHtml(String(md || ''));
  html = html.replace(/```([\s\S]*?)```/g, (_m, p1) => `<pre><code>${escapeHtml(p1)}</code></pre>`);   // code blocks
  html = html.replace(/`([^`]+)`/g, (_m, p1) => `<code>${escapeHtml(p1)}</code>`);                      // inline code
  html = html.replace(/(\*\*|__)(.*?)\1/g, (_m, _p, p2) => `<strong>${p2}</strong>`);                  // bold
  html = html.replace(/(\*|_)(.*?)\1/g, (_m, _p, p2) => `<em>${p2}</em>`);                             // italic
  html = html.replace(/~~(.*?)~~/g, (_m, p1) => `<del>${p1}</del>`);                                   // strike
  html = html.replace(/!\[.*?\]\((.*?)\)/g, '');                                                        // drop images
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g,
    (_m, text, url) => `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(text)}</a>`);
  html = html.replace(/^\s{0,3}######\s+(.*)$/gm, '<h6>$1</h6>')
             .replace(/^\s{0,3}#####\s+(.*)$/gm, '<h5>$1</h5>')
             .replace(/^\s{0,3}####\s+(.*)$/gm, '<h4>$1</h4>')
             .replace(/^\s{0,3}###\s+(.*)$/gm, '<h3>$1</h3>')
             .replace(/^\s{0,3}##\s+(.*)$/gm, '<h2>$1</h2>')
             .replace(/^\s{0,3}#\s+(.*)$/gm, '<h1>$1</h1>');
  html = html.replace(/^\s{0,3}>\s?(.*)$/gm, '<blockquote>$1</blockquote>');                           // quotes
  // Simple paragraphs (avoid double-wrapping block elements)
  html = html.replace(/^(?!<h\d|<pre>|<blockquote>|<p>|<\/)(.+)$/gm, '<p>$1</p>');
  return html;
}

function truncateForToast(s, max = 240) {
  s = String(s || '');
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + '…';
}

/* ===================== Notification helpers ===================== */
async function createOrUpdateProgressNotification(pct, subtitle = '') {
  const options = {
    type: 'progress',
    iconUrl: ICON_URL,
    title: 'Downloading on-device AI',
    message: subtitle || 'Chrome is preparing the model…',
    progress: Math.max(0, Math.min(100, Math.floor(pct))),
    priority: 2,
    requireInteraction: true, // keep visible until it’s done
  };
  try {
    await chrome.notifications.update(NOTIF_ID, options).catch(async () => {
      await chrome.notifications.create(NOTIF_ID, options);
    });
  } catch (e) {
    console.warn('[notif] progress failed', e, chrome.runtime.lastError);
  }
}

async function showReadyNotification() {
  try {
    await chrome.notifications.update(NOTIF_ID, {
      type: 'basic',
      iconUrl: ICON_URL,
      title: 'AI ready',
      message: 'The on-device model is available.',
      priority: 1,
      requireInteraction: true,
    }).catch(async () => {
      await chrome.notifications.create(NOTIF_ID, {
        type: 'basic',
        iconUrl: ICON_URL,
        title: 'AI ready',
        message: 'The on-device model is available.',
        priority: 1,
        requireInteraction: true,
      });
    });
  } catch (e) {
    console.warn('[notif] ready failed', e, chrome.runtime.lastError);
  }
}

// Clicking the result toast opens a small rendered view
chrome.notifications.onClicked.addListener((id) => {
  const item = notifStore.get(id);
  if (!item) return;
  openFullResultWindow(item.title, item.html);
});
chrome.notifications.onClosed?.addListener((id) => {
  notifStore.delete(id);
});

// Open a small window that shows the full (rendered) result
function openFullResultWindow(title, html) {
  const doc = `
<!doctype html>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>
  body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
         line-height: 1.5; padding: 16px; background:#f6f7f9; }
  h1 { font-size: 16px; margin: 0 0 8px; }
  .box { background:#fff; border:1px solid #e5e7eb; border-radius:12px; padding:12px; }
  pre { overflow:auto; background:#f8fafc; padding:8px; border-radius:8px; }
  code { background:#f8fafc; padding:0 4px; border-radius:4px; }
  blockquote { border-left:4px solid #e5e7eb; margin:8px 0; padding:4px 8px; color:#374151; background:#fbfdff; }
  a { color:#2563eb; }
</style>
<h1>${escapeHtml(title)}</h1>
<div class="box">${html}</div>
`;
  const url = 'data:text/html;charset=utf-8,' + encodeURIComponent(doc);
  chrome.windows.create({ url, type: 'popup', width: 520, height: 640 });
}

/* ===================== AI session ===================== */
async function getOrCreateSession() {
  if (session) return session;

  if (typeof LanguageModel === 'undefined') {
    throw new Error('The LanguageModel API is not available in this browser.');
  }

  const availability = await LanguageModel.availability();
  console.log('[AI] Availability:', availability);
  if (availability === 'unavailable') throw new Error('AI model is unavailable on this device.');

  console.log('Creating new AI session...');
  // Even if "available", Chrome may emit 0→100% instantly; still show a hint.
  createOrUpdateProgressNotification(0, availability === 'available' ? 'Checking model…' : 'Starting download…');
  showBadge(availability === 'available' ? '…' : '0%');

  const controller = new AbortController();
  const timeout = setTimeout(() => {
    console.warn('[AI] Session creation timed out; aborting.');
    controller.abort();
    clearBadge();
    chrome.notifications.create({
      type: 'basic',
      iconUrl: ICON_URL,
      title: 'AI download paused',
      message: 'Timed out. Check network/policies and try again.',
      priority: 1,
      requireInteraction: true,
    });
  }, 180_000);

  try {
    session = await LanguageModel.create({
      initialPrompts: [{ role: 'system', content: 'You are a concise dictionary.' }],
      signal: controller.signal,
      monitor(m) {
        m.addEventListener('downloadprogress', (e) => {
          const pct = Math.floor((e.loaded || 0) * 100);
          console.log(`[AI] Gemini Nano download: ${pct}%`);
          createOrUpdateProgressNotification(pct);
          showBadge(`${pct}%`);
        });
      },
    });
    console.log('[AI] Session ready.');
    showReadyNotification();
    clearBadge();
    return session;
  } finally {
    clearTimeout(timeout);
  }
}

/* ===================== Context extraction ===================== */
// Returns selection + best context:
// - Prefer the enclosing paragraph (≤ PAR_MAX chars)
// - Otherwise, sentence containing the selection ± its neighbor sentence
async function getSelectionAndContext(tabId) {
  const [res] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const sel = window.getSelection?.();
      const text = (sel && sel.toString()) || '';
      if (!text) return { text: '', sentence: '', paragraph: '', heading: '', title: document.title || '' };

      // Find the nearest block ancestor (paragraph/list/etc.)
      function findBlock(node) {
        let n = node && (node.nodeType === 3 ? node.parentNode : node);
        const BLOCK_TAGS = /^(P|LI|DD|DT|BLOCKQUOTE|ARTICLE|SECTION|MAIN|ASIDE|DIV)$/i;
        while (n && n !== document.body) {
          if (n.nodeType === 1 && BLOCK_TAGS.test(n.tagName)) return n;
          n = n.parentNode;
        }
        return document.body;
      }

      const anchorNode = sel.anchorNode || document.body;
      const block = findBlock(anchorNode);
      const paragraph = (block?.innerText || block?.textContent || '').replace(/\s+/g, ' ').trim();

      // Try to capture a nearby heading for extra context
      let heading = '';
      for (let el = block; el; el = el.previousElementSibling) {
        if (el.tagName && /^H[1-6]$/i.test(el.tagName)) { heading = el.innerText.trim(); break; }
      }

      // Extract the sentence containing the selection
      const idxInPar = paragraph ? paragraph.indexOf(text) : -1;
      let sentence = '';
      if (idxInPar >= 0) {
        let segments = [];
        try {
          if ('Intl' in window && Intl.Segmenter) {
            const seg = new Intl.Segmenter(undefined, { granularity: 'sentence' });
            for (const s of seg.segment(paragraph)) {
              segments.push({ start: s.index, end: s.index + s.segment.length, s: s.segment });
            }
          }
        } catch (_) {}
        if (!segments.length) {
          const parts = paragraph.split(/(?<=[.!?])\s+/);
          let pos = 0;
          segments = parts.map(p => { const start = pos; pos += p.length + 1; return { start, end: start + p.length, s: p }; });
        }
        sentence = (segments.find(seg => seg.start <= idxInPar && idxInPar < seg.end)?.s || '').trim();
      }

      return { text, sentence, paragraph, heading, title: document.title || '' };
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

    // Choose context
    const PAR_MAX = 1200;
    let context = '';
    if (paragraph && paragraph.length <= PAR_MAX) {
      context = paragraph;
    } else if (paragraph) {
      // Use sentence ± neighbor when paragraph is too long
      const parts = paragraph.split(/(?<=[.!?])\s+/);
      const i = parts.findIndex(p => p.includes(text));
      const bundle = [parts[i - 1], parts[i], parts[i + 1]].filter(Boolean).join(' ');
      context = bundle || sentence || paragraph.slice(0, PAR_MAX);
    } else {
      context = sentence || '';
    }

    const metaTitle = heading || title || '';
    const prompt =
`You are a precise glossary assistant.
Given the passage, explain the highlighted phrase IN CONTEXT in ≤ 50 words.
Prefer the sense most consistent with the passage; if still ambiguous, say so.

Title: ${metaTitle || '(none)'}
Passage:
${context || '(no additional context available)'}

Phrase: "${text}"
Definition:`;

    const markdown = await sess.prompt(prompt);

    // Toast: plain text (no Markdown), truncated so OS doesn't hard-cut mid-sentence
    const plain    = mdToPlain(markdown);
    const preview  = truncateForToast(plain, 240);
    const notifId  = 'def-' + (crypto?.randomUUID?.() || Date.now());

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
          sendResponse({ available: false, details: 'LanguageModel API not found' });
          return;
        }
        const availability = await LanguageModel.availability();
        // Optionally kick off creation so the user sees progress
        getOrCreateSession().catch(console.warn);
        sendResponse({ available: availability === 'available', details: availability });
      } catch (e) {
        sendResponse({ available: false, details: String(e?.message || e) });
      }
    })();
    return true; // async sendResponse
  }
  return false;
});

/* ===================== Lifecycle & menu ===================== */
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

chrome.runtime.onInstalled.addListener(() => {
  ensureContextMenu();
});
chrome.runtime.onStartup.addListener(() => {
  ensureContextMenu();
});
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === MENU_ID && tab?.id != null) defineSelectedInContext(tab);
});
