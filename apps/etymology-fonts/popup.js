// popup.js
const toggle = document.getElementById('main-toggle');
const label  = document.getElementById('toggle-label');

// Load saved state
chrome.storage.local.get(['efEnabled'], (result) => {
  const enabled = result.efEnabled !== false;
  toggle.checked = enabled;
  label.textContent = enabled ? 'On' : 'Off';
});

toggle.addEventListener('change', () => {
  const enabled = toggle.checked;
  label.textContent = enabled ? 'On' : 'Off';

  chrome.storage.local.set({ efEnabled: enabled });

  // Tell the active tab's content script
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'EF_TOGGLE', enabled });
    }
  });
});
