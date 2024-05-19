document.addEventListener('DOMContentLoaded', () => {
    const apiKeyInput = document.getElementById('apiKey');
    const rememberKeyCheckbox = document.getElementById('rememberKey');
    const addPersonaButton = document.getElementById('addPersona');
    const startConversationButton = document.getElementById('startConversation');
    const pauseConversationButton = document.getElementById('pauseConversation');
    const personasDiv = document.getElementById('personas');
    const responseDiv = document.getElementById('response');

    let personas = [];
    let conversationHistories = {}; // Object to store conversation history for each persona pair
    let paused = false;
    let lastSpeaker = null;

    // Load API key from local storage if available
    if (localStorage.getItem('apiKey')) {
        apiKeyInput.value = localStorage.getItem('apiKey');
        rememberKeyCheckbox.checked = true;
    }

    // Save API key to local storage if checkbox is checked
    const saveApiKey = () => {
        if (rememberKeyCheckbox.checked) {
            localStorage.setItem('apiKey', apiKeyInput.value);
        } else {
            localStorage.removeItem('apiKey');
        }
    };

    // Add a new persona input section
    const addPersona = () => {
        const personaId = `persona${personas.length}`;
        const personaDiv = document.createElement('div');
        personaDiv.className = 'persona';
        personaDiv.innerHTML = `
            <div class="form-group">
                <label for="${personaId}Name">Name:</label>
                <input type="text" id="${personaId}Name" placeholder="Enter persona name" onblur="fillInstructions('${personaId}')">
            </div>
            <div class="form-group">
                <label for="${personaId}Instructions">Initial Instructions:</label>
                <textarea id="${personaId}Instructions" rows="2" placeholder="Enter initial instructions"></textarea>
            </div>
        `;
        personasDiv.appendChild(personaDiv);
        personas.push(personaId);
    };

    // Fill instructions from local storage if available
    window.fillInstructions = (personaId) => {
        const nameInput = document.getElementById(`${personaId}Name`);
        const instructionsTextarea = document.getElementById(`${personaId}Instructions`);
        const storedInstructions = localStorage.getItem(nameInput.value);
        if (storedInstructions) {
            instructionsTextarea.value = storedInstructions;
        }
    };

    // Function to generate a conversation history key for two personas
    const getHistoryKey = (persona1, persona2) => {
        return [persona1, persona2].sort().join('_');
    };

    // Function to send a prompt to the Cohere API and get a response
    const sendPrompt = async (persona, prompt, history) => {
        try {
            const response = await fetch('https://api.cohere.ai/v1/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKeyInput.value}`
                },
                body: JSON.stringify({
                    model: 'command-r-plus',
                    prompt: `${persona} says: ${prompt}\n\n${history || ''}`,
                    max_tokens: 300
                })
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Error: ${response.status} ${response.statusText} - ${errorData.message}`);
            }
    
            const data = await response.json();
            return data.generations[0].text.trim();
        } catch (error) {
            console.error('Error:', error);
            responseDiv.innerText = `An error occurred: ${error.message}`;
            return null;
        }
    };

    // Function to start the conversation
    const startConversation = async () => {
        saveApiKey();
        startConversationButton.disabled = true;
        pauseConversationButton.disabled = false;

        // Gather initial prompts for each persona
        const initialPrompts = personas.map(personaId => {
            const name = document.getElementById(`${personaId}Name`).value;
            const instructions = document.getElementById(`${personaId}Instructions`).value;
            localStorage.setItem(name, instructions); // Save instructions to local storage
            return { name, instructions };
        });

        // Initialize conversation histories with initial prompts
        for (let { name, instructions } of initialPrompts) {
            let response = await sendPrompt(name, instructions, '');
            if (response) {
                conversationHistories[getHistoryKey(name, name)] = `<b>${name}:</b> ${response}\n\n`;
                responseDiv.innerHTML = Object.values(conversationHistories).join('<br><br>');
            }
        }

        // Continue the conversation
        while (!paused) {
            let activePersonaIndex = Math.floor(Math.random() * initialPrompts.length);
            let activePersona = initialPrompts[activePersonaIndex].name;

            // Ensure the same persona doesn't speak twice in a row
            while (activePersona === lastSpeaker) {
                activePersonaIndex = Math.floor(Math.random() * initialPrompts.length);
                activePersona = initialPrompts[activePersonaIndex].name;
            }

            let otherPersonas = initialPrompts.filter((_, i) => i !== activePersonaIndex);
            const otherPersonaIndex = Math.floor(Math.random() * otherPersonas.length);
            const otherPersona = otherPersonas[otherPersonaIndex].name;

            const historyKey = getHistoryKey(activePersona, otherPersona);
            let lastResponse = (conversationHistories[historyKey] || '').split('\n').slice(-3, -2)[0];
            if (!lastResponse) lastResponse = `Hello, ${otherPersona}! What are your thoughts?`; // Default initial message
            lastResponse = lastResponse.split(': ').pop();

            // Construct the context for the conversation
            const context = `Here's your earlier conversation with ${activePersona} for context: ${conversationHistories[historyKey] || ''}\n\nNow please respond to what ${activePersona} has just said to you: ${lastResponse}`;
            let newResponse = await sendPrompt(otherPersona, context, conversationHistories[historyKey]);

            // Ignore partial sentences by trimming to the last complete sentence
            if (newResponse) {
                let sentences = newResponse.split('. ');
                if (sentences.length > 1) {
                    sentences.pop();
                    newResponse = sentences.join('. ') + '.';
                }

                // Add the new response to the conversation history
                conversationHistories[historyKey] = `${conversationHistories[historyKey] || ''}<b>${otherPersona}:</b> ${newResponse}\n\n`;
                responseDiv.innerHTML = Object.values(conversationHistories).join('<br><br>');
                lastSpeaker = otherPersona;
            }
        }

        startConversationButton.disabled = false;
        pauseConversationButton.disabled = true;
    };

    // Event listeners
    addPersonaButton.addEventListener('click', addPersona);
    startConversationButton.addEventListener('click', startConversation);
    pauseConversationButton.addEventListener('click', () => {
        paused = true;
        startConversationButton.disabled = false;
        pauseConversationButton.disabled = true;
    });
});
