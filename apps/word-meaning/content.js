// content.js
'use strict';

chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
  console.log("Debug: Content script received message:", message);
  if (message && message.action === "showMeaning") {
    console.log("Debug: Showing popup for word:", message.word);
    console.log("Debug: Meaning to display:", message.meaning);
    showCustomPopup(String(message.word || ''), String(message.meaning || ''));
  }
});

function showCustomPopup(word, meaning) {
  // Remove existing popup if one exists
  const existingHost = document.getElementById('custom-popup-host');
  if (existingHost) existingHost.remove();

  // Host element (positioning lives on the host)
  const host = document.createElement('div');
  host.id = 'custom-popup-host';
  host.style.position = 'fixed';
  host.style.bottom = '20px';
  host.style.right = '20px';
  host.style.zIndex = '2147483647'; // very high
  host.style.maxWidth = '360px';
  host.style.width = 'min(360px, calc(100vw - 40px))';

  // Shadow root to isolate styles from the page
  const shadow = host.attachShadow({ mode: 'open' });

  // Styles inside shadow root (page CSS will not affect these)
  const style = document.createElement('style');
  style.textContent = `
    .popup {
      box-sizing: border-box;
      background: #ffffff;
      color: #111827;
      border: 1px solid #d1d5db;
      border-radius: 12px;
      box-shadow: 0 10px 24px rgba(0,0,0,0.25);
      padding: 12px 12px 10px 12px;
      font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
      font-size: 14px;
      line-height: 1.35;
    }
    .title {
      font-weight: 700;
      margin: 0 0 8px 0;
      font-size: 13px;
    }
    .meaning {
      margin: 0 0 10px 0;
      white-space: pre-wrap; /* keep newlines readable */
      word-break: break-word;
      max-height: 220px;
      overflow: auto;
      padding-right: 4px;
    }
    .row {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }
    button {
      appearance: none;
      border: 1px solid #d1d5db;
      background: #f3f4f6;
      color: #111827;
      border-radius: 10px;
      padding: 6px 10px;
      font-size: 13px;
      cursor: pointer;
    }
    button:hover {
      background: #e5e7eb;
    }
    button:active {
      transform: translateY(1px);
    }
  `;
  shadow.appendChild(style);

  // Popup container
  const popup = document.createElement('div');
  popup.className = 'popup';

  // Title
  const title = document.createElement('div');
  title.className = 'title';
  title.textContent = `Meaning of "${word}":`;
  popup.appendChild(title);

  // Meaning text
  const p = document.createElement('div');
  p.className = 'meaning';
  p.textContent = meaning;
  popup.appendChild(p);

  // Buttons row
  const row = document.createElement('div');
  row.className = 'row';

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.textContent = 'Close';
  closeBtn.addEventListener('click', () => host.remove());

  row.appendChild(closeBtn);
  popup.appendChild(row);

  shadow.appendChild(p);

  // NOTE: p was appended above to popup. Fix: append popup, not p.
  // (Keep code correct below.)
  popup.removeChild(p);
  popup.insertBefore(p, row);

  shadow.appendChild(popup);

  // Add to page
  document.documentElement.appendChild(host);
}
