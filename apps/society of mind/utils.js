// Utility functions

function toggleApiKeyInput() {
    const llmSelect = document.getElementById('llmSelect');
    const apiKeyInput = document.getElementById('apiKeyInput');
    apiKeyInput.style.display = llmSelect.value === 'geminiNano' ? 'none' : 'block';
}

function toggleLog(logId) {
    const logDiv = document.getElementById(logId);
    const toggleBtn = document.getElementById(`toggle${logId.charAt(0).toUpperCase() + logId.slice(1)}`);
    if (logDiv.style.display === 'none') {
        logDiv.style.display = 'block';
        toggleBtn.textContent = `Hide ${logId.charAt(0).toUpperCase() + logId.slice(1)}`;
    } else {
        logDiv.style.display = 'none';
        toggleBtn.textContent = `Show ${logId.charAt(0).toUpperCase() + logId.slice(1)}`;
    }
}