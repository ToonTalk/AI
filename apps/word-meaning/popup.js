document.addEventListener('DOMContentLoaded', function() {
  const checkButton = document.getElementById('check-ai');
  const statusElement = document.getElementById('status');

  checkButton.addEventListener('click', () => {
    statusElement.textContent = "Checking AI availability...";
    statusElement.className = "";

    chrome.runtime.sendMessage({ action: "checkAIAvailability" }, (response) => {
      if (chrome.runtime.lastError) {
        statusElement.textContent = `Error: ${chrome.runtime.lastError.message}`;
        statusElement.className = "error";
        return;
      }

      if (response && response.available) {
        statusElement.innerHTML = `<div class="success">AI is available! (${response.details || ''})</div>`;
      } else {
        let errorMessage = "AI is not available.";
        if (response && response.details) {
            errorMessage += ` ${response.details}.`;
        }
        errorMessage += " Ensure your browser and device meet all requirements."
        statusElement.innerHTML = `<div class="error">${errorMessage}</div>`;
      }
    });
  });
});