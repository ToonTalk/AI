const palette = document.getElementById('palette');
const drawingArea = document.getElementById('drawingArea');

// Some fun emojis to start with 
const emojis = ['😀', '😎', '🍕', '🐶', '🌈'];

// Create buttons for our emoji palette
emojis.forEach(emoji => {
    const emojiButton = document.createElement('button');
    emojiButton.textContent = emoji;
    emojiButton.addEventListener('click', () => {
        // Copy and append emoji to the drawing area
        const newEmoji = emojiButton.cloneNode(true); 
        drawingArea.appendChild(newEmoji);
    });
    palette.appendChild(emojiButton);
});
