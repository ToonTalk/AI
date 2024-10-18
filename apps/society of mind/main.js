// Main script to tie everything together

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('llmSelect').addEventListener('change', toggleApiKeyInput);
    document.getElementById('runSimulation').addEventListener('click', runSimulation);
    document.getElementById('toggleLog').addEventListener('click', () => toggleLog('fullLog'));
    document.getElementById('toggleErrorLog').addEventListener('click', () => toggleLog('errorLog'));

    // Initialize on page load
    toggleApiKeyInput();
    initializeAgents();
});