// chat.js
let conversationHistory = [];

document.getElementById('send-button').addEventListener('click', sendMessage);
document.getElementById('user-input').addEventListener('keypress', function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        sendMessage();
    }
});

let aiSession = null;

async function initializeAI() {
    const capabilities = await window.ai.assistant.capabilities();
    if (capabilities.available === "readily" || capabilities.available === "after-download") {
        aiSession = await window.ai.assistant.create();
    } else {
        console.error("AI capabilities are not available on this device.");
    }
}

async function sendMessage() {
    const userInput = document.getElementById('user-input').value;
    const chatOutput = document.getElementById('chat-output');
    const sendButton = document.getElementById('send-button');

    if (!userInput.trim()) return;

    sendButton.disabled = true;
    chatOutput.innerHTML += `<div>You: ${userInput}</div>`;
    conversationHistory.push(`You: ${userInput}<ctrl23>`);
    console.log('Sending prompt:', `You: ${userInput}<ctrl23>`);

    if (!aiSession) {
        await initializeAI();
        if (!aiSession) {
            chatOutput.innerHTML += `<div>Sorry, AI capabilities are not available on your device.</div>`;
            sendButton.disabled = false;
            return;
        }
    }

    try {
        const prompt = conversationHistory.join(' ');
        console.log('Full prompt to AI:', prompt);
        const result = await aiSession.prompt(prompt);
        chatOutput.innerHTML += `<div>Gemini Nano:</div><div>${marked.parse(result)}</div>`;
        conversationHistory.push(`Gemini Nano: ${result}<ctrl23>`);
        console.log('Received response:', result);
    } catch (error) {
        console.error('Error prompting Gemini Nano:', error);
        chatOutput.innerHTML += `<div>Error communicating with AI.</div>`;
    }

    document.getElementById('user-input').value = '';
    sendButton.disabled = false;
}

// Initialize AI when the script loads
initializeAI();