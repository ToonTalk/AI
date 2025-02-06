chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Debug: Content script received message:", message);
  if (message.action === "showMeaning") {
    console.log("Debug: Showing popup for word:", message.word);
    console.log("Debug: Meaning to display:", message.meaning);
    showCustomPopup(message.word, message.meaning);
  }
});

function showCustomPopup(word, meaning) {
  console.log("Debug: showCustomPopup called with word:", word, "and meaning:", meaning);
  
  // Remove existing popup if one exists
  const existingPopup = document.getElementById('custom-popup');
  if (existingPopup) {
    console.log("Debug: Removing existing popup");
    existingPopup.remove();
  }

  // Create the popup element
  console.log("Debug: Creating new popup");
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
  popup.style.maxWidth = '300px';

  // Add content
  popup.innerHTML = `
    <strong>Meaning of "${word}":</strong><br>
    <p style="margin: 10px 0;">${meaning}</p>
    <button id="close-popup-btn" style="padding: 5px 10px; cursor: pointer;">Close</button>
  `;

  console.log("Debug: Appending popup to document body");
  document.body.appendChild(popup);

  // Add event listener to the close button
  document.getElementById('close-popup-btn').addEventListener('click', () => {
    console.log("Debug: Close button clicked");
    document.body.removeChild(popup);
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Debug: Content script received message:", message);
  if (message.action === "showMeaning") {
    console.log("Debug: Showing popup for word:", message.word);
    console.log("Debug: Meaning to display:", message.meaning);
    showCustomPopup(message.word, message.meaning);
  }
});