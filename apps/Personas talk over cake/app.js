document.addEventListener('DOMContentLoaded', () => {
    const apiKeyForm = document.getElementById('apiKeyForm');
    const rememberKeyCheckbox = document.getElementById('rememberKey');
    const addPersonaForm = document.getElementById('addPersonaForm');
    const startConversationButton = document.getElementById('startConversation');
    const pauseConversationButton = document.getElementById('pauseConversation');
    const animationContainer = document.getElementById('animationContainer');
    const responseDiv = document.getElementById('response');

    let personas = [];
    let conversationHistories = {}; // Object to store conversation history for each persona pair
    let paused = false;
    let running = false;
    let conversationInProgress = false;

    // Load API key from local storage if available
    if (localStorage.getItem('apiKey')) {
        apiKeyForm.apiKey.value = localStorage.getItem('apiKey');
        rememberKeyCheckbox.checked = true;
    }

    // Save API key to local storage if checkbox is checked
    apiKeyForm.addEventListener('submit', (event) => {
        event.preventDefault();
        if (rememberKeyCheckbox.checked) {
            localStorage.setItem('apiKey', apiKeyForm.apiKey.value);
        } else {
            localStorage.removeItem('apiKey');
        }
    });

    // Add a new persona
   addPersonaForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const name = addPersonaForm.personaName.value.trim();
        const initialInstructions = addPersonaForm.initialInstructions.value.trim();
    
        if (!name || !initialInstructions) return;
    
        // Store initial instructions in local storage
        localStorage.setItem(`initialInstructions_${name}`, initialInstructions);
    
        const imageUrl = await fetchWikipediaImage(name);
    
        const personaDiv = document.createElement('div');
        personaDiv.className = 'persona';
        personaDiv.style.left = `${Math.random() * 90}%`;
        personaDiv.style.top = `${Math.random() * 90}%`;
    
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = name;
        personaDiv.appendChild(img);
    
        animationContainer.appendChild(personaDiv);
    
        // Correctly use initialInstructions here instead of initialPrompt
        personas.push({ name, imageUrl, element: personaDiv, initialInstructions: initialInstructions });
    
        addPersonaForm.reset();
    });

    document.getElementById('personaName').addEventListener('input', function() {
        const name = this.value.trim();
        const storedInstructions = localStorage.getItem(`initialInstructions_${name}`);
        if (storedInstructions) {
            document.getElementById('initialInstructions').value = storedInstructions;
        } else {
            document.getElementById('initialInstructions').value = ''; // Clear if no instructions are stored
        }
    });

    // Function to send a prompt to the Cohere API and get a response
    const sendPrompt = async (persona, prompt, history) => {
        try {
            const apiKey = document.getElementById('apiKey').value;  // Use the actual ID of the API key input field
    
            const response = await fetch('https://api.cohere.ai/v1/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`  // Use the variable where the API key is stored
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

    // Add a new cake
    const addCake = () => {
        const cakeDiv = document.createElement('div');
        cakeDiv.className = 'cake';
        cakeDiv.style.left = `${Math.random() * 90}%`;
        cakeDiv.style.top = `${Math.random() * 90}%`;

        const img = document.createElement('img');
        img.src = 'cake.webp'; // Use the new cake image
        img.alt = 'Cake';
        cakeDiv.appendChild(img);

        animationContainer.appendChild(cakeDiv);
    };

    // Fetch image from Wikipedia
    const fetchWikipediaImage = async (name) => {
        try {
            const response = await fetch(`https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=thumbnail&pithumbsize=100&titles=${name}&origin=*`);
            const data = await response.json();
            const pages = data.query.pages;
            const page = Object.values(pages)[0];
            return page.thumbnail ? page.thumbnail.source : 'default.webp'; // Use the new default image
        } catch (error) {
            console.error('Error fetching image from Wikipedia:', error);
            return 'default.webp'; // Use the new default image
        }
    };

    // Function to start the conversation
    const startConversation = async () => {
        if (running) return;
        running = true;
        if (rememberKeyCheckbox.checked) {
            localStorage.setItem('apiKey', apiKeyForm.apiKey.value);
        } else {
            localStorage.removeItem('apiKey');
        }
        startConversationButton.disabled = true;
        pauseConversationButton.disabled = false;

        for (let i = 0; i < 2; i++) {
            addCake();
        }

        while (!paused && running) {
            for (let i = 0; i < personas.length; i++) {
                movePersonaTowardsCake(personas[i]);
            }

            detectCakeCollisions();
            replenishCakes();
            await new Promise(r => setTimeout(r, 1000)); // Move every second
        }

        startConversationButton.disabled = false;
        pauseConversationButton.disabled = true;
        running = false;
    };

    // Replenish cakes once all existing cakes are consumed
    const replenishCakes = () => {
        if (document.querySelectorAll('.cake').length === 0) {
            for (let i = 0; i < 2; i++) {
                addCake();
            }
        }
    };

    // Move a persona towards the nearest cake
    const movePersonaTowardsCake = (persona) => {
        if (persona.conversing) return; // Skip moving if persona is conversing

        let nearestCake = null;
        let minDistance = Infinity;

        document.querySelectorAll('.cake').forEach(cake => {
            const cakeRect = cake.getBoundingClientRect();
            const personaRect = persona.element.getBoundingClientRect();
            const distance = Math.sqrt(Math.pow(cakeRect.left - personaRect.left, 2) + Math.pow(cakeRect.top - personaRect.top, 2));

            if (distance < minDistance) {
                minDistance = distance;
                nearestCake = cake;
            }
        });

        if (nearestCake) {
            const cakeRect = nearestCake.getBoundingClientRect();
            const personaRect = persona.element.getBoundingClientRect();
            const deltaX = cakeRect.left - personaRect.left;
            const deltaY = cakeRect.top - personaRect.top;
            const step = 3; // Increase this value to make the personas move faster

            const angle = Math.atan2(deltaY, deltaX);
            persona.element.style.left = `${parseFloat(persona.element.style.left) + Math.cos(angle) * step}%`;
            persona.element.style.top = `${parseFloat(persona.element.style.top) + Math.sin(angle) * step}%`;
        }
    };
    
    const detectCakeCollisions = () => {
        const cakes = document.querySelectorAll('.cake');
        cakes.forEach(cake => {
            const cakeRect = cake.getBoundingClientRect();
            personas.forEach(persona => {
                if (!persona.conversing && isColliding(cakeRect, persona.element.getBoundingClientRect())) {
                    // Find another persona not conversing and collide
                    const other = personas.find(p => p !== persona && !p.conversing && isColliding(cakeRect, p.element.getBoundingClientRect()));
                    if (other) {
                        handleConversation(persona, other);
                        removeElement(cake); // Remove cake after collision
                    }
                }
            });
        });
    };
    
    const removeElement = (element) => {
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
        }
    };
    
    let recentConversations = new Set(); // Tracks pairs of personas that have recently conversed
    
    const handleConversation = async (persona1, persona2) => {
        if (persona1.conversing || persona2.conversing) return; // Skip if either is already conversing
    
        const pairKey = [persona1.name, persona2.name].sort().join("-");
        if (recentConversations.has(pairKey)) return; // Skip if they've recently conversed
    
        // Mark both personas as conversing
        persona1.conversing = true;
        persona2.conversing = true;
    
        // Add to recent conversations
        recentConversations.add(pairKey);
        setTimeout(() => recentConversations.delete(pairKey), 30000); // Reset after 30 seconds
    
        // Simulate conversation
        for (let i = 0; i < 3; i++) {
            await converse(persona1, persona2);
            await converse(persona2, persona1);
        }
    
        // Reset conversing state after conversation
        persona1.conversing = false;
        persona2.conversing = false;
    };

    // Check if two elements are colliding
    const isColliding = (rect1, rect2) => {
        return !(rect1.right < rect2.left || rect1.left > rect2.right || rect1.bottom < rect2.top || rect1.top > rect2.bottom);
    };

   // Define a property for conversing state
    personas.forEach(persona => {
        persona.conversing = false; // Initially, no one is conversing
    });

    // Perform a conversation exchange
    const converse = async (speaker, listener) => {
        const historyKey = getHistoryKey(speaker.name, listener.name);
        const lastResponse = (conversationHistories[historyKey] || '').split('\n').slice(-3, -2)[0] || speaker.initialInstructions;
        const context = `Here's your earlier conversation with ${speaker.name} for context: ${conversationHistories[historyKey] || ''}\n\nNow please respond to what ${speaker.name} has just said to you: ${lastResponse}`;
        
        let newResponse = await sendPrompt(listener.name, context, conversationHistories[historyKey]);

        if (newResponse) {
            let sentences = newResponse.split('. ');
            if (sentences.length > 1) {
                sentences.pop();
                newResponse = sentences.join('. ') + '.';
            }

            const formattedResponse = `<b>${listener.name} to ${speaker.name}:</b>\n\n${newResponse}\n\n`;
            conversationHistories[historyKey] = `${conversationHistories[historyKey] || ''}${formattedResponse}`;
            responseDiv.innerHTML = Object.values(conversationHistories).join('<br><br>');
        }
    };

    // Function to generate a conversation history key for two personas
    const getHistoryKey = (persona1, persona2) => {
        return [persona1, persona2].sort().join('_');
    };

    // Event listeners
    startConversationButton.addEventListener('click', startConversation);
    pauseConversationButton.addEventListener('click', () => {
        paused = true;
        startConversationButton.disabled = false;
        pauseConversationButton.disabled = true;
    });
});
