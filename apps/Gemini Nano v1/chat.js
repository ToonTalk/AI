// chat.js
let conversationHistory = []; // Continue using the renamed array to avoid conflicts

document.getElementById('send-button').addEventListener('click', sendMessage);
document.getElementById('user-input').addEventListener('keypress', function(event) {
    if (event.key === "Enter") {
        event.preventDefault(); // Prevent the default action to avoid form submission
        sendMessage();
    }
});

async function sendMessage() {
    const userInput = document.getElementById('user-input').value;
    const chatOutput = document.getElementById('chat-output');
    const sendButton = document.getElementById('send-button');

    if (!userInput.trim()) return;

    sendButton.disabled = true; // Disable the button to prevent re-entry during processing
    chatOutput.innerHTML += `<div>You: ${userInput}</div>`;
    conversationHistory.push(`You: ${userInput}<ctrl23>`); // Update conversation history
    console.log('Sending prompt:', `You: ${userInput}<ctrl23>`); // Log the prompt

    const canCreate = await window.ai.canCreateTextSession();
    if (canCreate === "no") {
        chatOutput.innerHTML += `<div>Sorry, your device does not support this feature.</div>`;
        sendButton.disabled = false;
        return;
    }

    const session = await window.ai.createTextSession();
    let prompt = conversationHistory.join(' ');
    if (prompt.length > 950) {
        conversationHistory = conversationHistory.slice(-5);
        prompt = conversationHistory.join(' ');
    }

    console.log('Full prompt to AI:', prompt); // Log the full prompt being sent to AI
    try {
        const result = await session.prompt(prompt);
        chatOutput.innerHTML += `<div>Gemini Nano:</div><div>${marked.parse(result)}</div>`;
        conversationHistory.push(`Gemini Nano: ${result}<ctrl23>`);
        console.log('Received response:', result); // Log the response from AI
    } catch (error) {
        console.error('Error prompting Gemini Nano:', error);
        chatOutput.innerHTML += `<div>Error communicating with AI.</div>`;
    }

    document.getElementById('user-input').value = '';
    sendButton.disabled = false;
}
