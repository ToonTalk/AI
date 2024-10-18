chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "showMeaning") {
    showCustomPopup(message.word, message.meaning);
  }
});

function showCustomPopup(word, meaning) {
  // Remove existing popup if one exists
  const existingPopup = document.getElementById('custom-popup');
  if (existingPopup) {
    existingPopup.remove();
  }

  // Create the popup element
  const popup = document.createElement('div');
  popup.id = 'custom-popup';
  popup.style.position = 'fixed';
  popup.style.bottom = '20px';
  popup.style.right = '20px';
  popup.style.padding = '15px';
  popup.style.backgroundColor = '#fff';
  popup.style.border = '1px solid #ccc';
  popup.style.borderRadius = '8px';
  popup.style.boxShadow = '0px 4px 8px rgba(0, 0, 0, 0.2)';
  popup.style.zIndex = '10000';
  popup.style.fontFamily = 'Arial, sans-serif';

  // Add content
  popup.innerHTML = `
    <strong>Meaning of "${word}":</strong><br>${meaning}<br>
    <button id="close-popup-btn">Close</button>
  `;

  document.body.appendChild(popup);

  // Add event listener to the close button
  document.getElementById('close-popup-btn').addEventListener('click', () => {
    document.body.removeChild(popup);
  });
}
