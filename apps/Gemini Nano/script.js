document.getElementById('apiChoice').addEventListener('change', function () {
    const apiKeyContainer = document.getElementById('apiKeyContainer');
    if (this.value === 'cohere') {
        apiKeyContainer.style.display = 'block';
    } else {
        apiKeyContainer.style.display = 'none';
    }
});
