
let personas = [];
let isPaused = false; // This will control whether the interactions are paused or active

async function createPersona() {
    const attributes = getRandomAttributes();  // Retrieves random attributes for the persona
    let name = await generatePersonaName(attributes.personality, attributes.role); // AI generates a name

    if (!name) {
        alert('Failed to generate a name. Please try again.');
        return;
    }

    let retryCount = 0;
    while (personas.some(persona => persona.name.toLowerCase() === name.toLowerCase())) {
        if (retryCount >= 3) {  // Limit the number of retries to prevent infinite loops
            alert('Failed to generate a unique name after several attempts. Please try again later.');
            return;
        }
        name = await generatePersonaName(attributes.personality, attributes.role); // Try generating a new name
        retryCount++;
    }

    const newPersona = {
        name,
        attributes,
        history: [],
        logEvent: function(event) {
            this.history.push(event);
        }
    };

    personas.push(newPersona);
    updateUI(); // Update the UI with the new persona
}

async function generatePersonaName(personality, role) {
    const prompt = `Suggest a single, suitable name for a persona characterized as '${personality}' and whose profession is '${role}'. The name should be creative and reflect these attributes. Please provide only the name without any explanations or additional text.`;

    try {
        const response = await aiPrompt('GeminiNano', prompt);
        const suggestedName = response.split('\n')[0].trim();  // Takes only the first line to ensure it's just the name
        console.log(`AI suggested name: ${suggestedName}`);
        return suggestedName;
    } catch (error) {
        console.error('Error generating persona name:', error);
        return null;  // Return null if there's an error
    }
}

function getRandomAttributes() {
    const attributes = [
        'curious', 'domineering', 'shy', 'creative', 'witty', 'literal minded', 
        'optimistic', 'pessimistic', 'analytical', 'compassionate', 'adventurous',
        'methodical', 'impulsive', 'pragmatic', 'idealistic', 'introverted', 'extroverted'
    ];
    const roles = [
        'mathematician', 'naturalist', 'linguist', 'engineer', 'poet', 'reporter', 'gossip',
        'scientist', 'historian', 'philosopher', 'artist', 'musician', 'educator', 'technologist',
        'entrepreneur', 'chef', 'politician', 'athlete'
    ];

    // Determine how many attributes to combine (1, 2, or 3)
    const numAttributes = Math.floor(Math.random() * 3) + 1; // Generates 1, 2, or 3
    let selectedAttributes = [];

    for (let i = 0; i < numAttributes; i++) {
        let attribute;
        do {
            attribute = attributes[Math.floor(Math.random() * attributes.length)];
        } while (selectedAttributes.includes(attribute)); // Ensure no duplicate attributes
        selectedAttributes.push(attribute);
    }

    const personality = selectedAttributes.join(' and ');

    const role = roles[Math.floor(Math.random() * roles.length)];
    
    return {
        personality: personality,
        role: role
    };
}

function updateUI() {
    const container = document.getElementById('personas-content');
    // Iterate through personas and update UI with new entries only
    personas.forEach(persona => {
        const existingEntry = document.querySelector(`div[data-persona-id="${persona.name}"]`);
        if (!existingEntry) {
            const personaDiv = document.createElement('div');
            personaDiv.setAttribute('data-persona-id', persona.name);  // Helps identify the div later
            personaDiv.innerHTML = `<strong>${persona.name}</strong> (${persona.attributes.personality}, ${persona.attributes.role})`;
            container.appendChild(personaDiv);
        }
    });
}

function handleBroadcast() {
    const message = document.getElementById('broadcastMessage').value;
    if (message.trim() === '') {
        alert('Please enter a message to broadcast.');
        return;
    }
    broadcastEvent(message);
    document.getElementById('broadcastMessage').value = '';  // Clear the input field after sending
    alert('Message broadcasted to all personas.');
}

function broadcastEvent(event) {
    personas.forEach(persona => {
        persona.logEvent(`Broadcast from Game Master: ${event}`);
        appendBroadcastToUI(persona, event);  // Append new event to each persona's UI without refreshing everything
    });
}

function appendBroadcastToUI(persona, event) {
    const container = document.getElementById('personas-content');
    const personaDiv = document.createElement('div');
    personaDiv.innerHTML = `<strong>${persona.name}:</strong> Broadcast from Game Master: ${event}`;
    container.appendChild(personaDiv);
}

function updateActionUI(persona, action) {
    const actionDiv = document.createElement('div');
    const parsedAction = marked.parse(action);  // Convert Markdown to HTML
    
    // Determine the correct container based on whether the update is for a persona or the Game Master
    let container = persona ? document.getElementById('personas-content') : document.getElementById('gmUpdatesList');

    // Prepare the content format depending on the target
    if (persona) {
        // For persona updates, display with persona's name
        actionDiv.innerHTML = `<strong>${persona.name}</strong> action: ${parsedAction}`;
    } else {
        // For Game Master updates, use list item tags to match the list format
        actionDiv.innerHTML = `<li>${parsedAction}</li>`;
    }

    container.appendChild(actionDiv);
}

async function gatherAndProcessActions() {
    if (isPaused) {
        console.log("Action processing is paused.");
        return; // Exit the function if the system is paused
    }

    let actions = [];
    for (let persona of personas) {
        const action = await promptForAction(persona);
        actions.push({ persona: persona.name, action: action });
        persona.logEvent(`Action decided: ${action}`);
        console.log(`${persona.name} took the action: ${action}`);
        updateActionUI(persona, action);
    }

    shuffleArray(actions);

    for (let action of actions) {
        if (isPaused) {
            console.log("Processing paused during action handling.");
            return; // Check again if paused during processing loop
        }
        await processAction(action);
    }
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // ES6 destructuring swap
    }
}

async function promptForAction(persona) {
    const historySummary = persona.history.slice(-5).join(' ');
    const attributesDescription = `I am ${persona.name}, characterized as ${persona.attributes.personality} and professionally, I am a ${persona.attributes.role}.`;

    const prompt = `Pretend you are ${persona.name}, a ${persona.attributes.personality} ${persona.attributes.role}. Based on your attributes and recent history: ${historySummary}, what specific actions are you planning to take next? How will you approach your next challenges or opportunities? Please respond in just 2 or 3 sentences.`;

    try {
        const result = await aiPrompt('GeminiNano', prompt);
        persona.history.push(`${result}<ctrl23>`);
        return result;
    } catch (error) {
        console.error('Error prompting AI for:', error);
        return "Error in AI interaction";
    }
}

async function processAction(action) {
    for (let persona of personas) {
        if (persona.name === action.persona) continue; // Skip the actor

        const reactionPrompt = `I am ${persona.name}, a ${persona.attributes.personality} ${persona.attributes.role}. Given the action '${action.action}' by ${action.persona}, how should I react?`;

        try {
            const reaction = await aiPrompt('GeminiNano', reactionPrompt);
            persona.logEvent(`My reaction to ${action.persona}'s action: ${reaction}`);
            updateActionUI(persona, `My reaction to ${action.persona}'s action: ${reaction}`);

            if (shouldInformGameMaster(reaction)) {
                await informGameMaster(action, reaction);
            }
        } catch (error) {
            console.error(`Error prompting AI for ${persona.name}:`, error);
            updateActionUI(persona, `Error reacting due to AI failure.`);
        }
    }
}

async function isCommunication(reaction) {
    // Construct a prompt asking the AI if the reaction involves communication
    const prompt = `Does the following statement involve communication with another persona? Response: "${reaction}". Please answer 'yes' or 'no'.`;
    
    try {
        const response = await aiPrompt('GeminiNano', prompt); // Using the aiPrompt function to query the AI
        console.log('AI determined:', response.trim().toLowerCase());
        return response.trim().toLowerCase() === 'yes';
    } catch (error) {
        console.error('Error querying AI to determine if the reaction is communication:', error);
        return false; // Assume no communication if there's an error
    }
}

async function shouldInformGameMaster(reaction) {
    // Use the AI to determine if the reaction is communicative
    const isComm = await isCommunication(reaction);
    return !isComm; // Inform the Game Master if it is not a communication
}

async function processAction(action) {
    for (let persona of personas) {
        const reaction = await aiPrompt('GeminiNano', `Reaction prompt for ${persona.name}`);
        persona.logEvent(`My reaction: ${reaction}`);
        updateActionUI(persona, reaction);

        if (await shouldInformGameMaster(reaction)) {
            await informGameMaster(action, reaction);
        }
    }
}

async function informGameMaster(action, reaction) {
    // Assume some mechanism to inform the Game Master
    const gameMasterContext = `Game Master needs to update environment based on: ${action.action} which led to: ${reaction}`;
    const environmentUpdate = await aiPrompt('GeminiNano', gameMasterContext);
    
    broadcastEvent(`Game Master has updated the environment: ${environmentUpdate}`);
    updateActionUI(null, environmentUpdate); // Assuming updateActionUI can handle null persona for GM updates
}

function broadcastEvent(event) {
    personas.forEach(persona => {
        persona.logEvent(`Broadcast from Game Master: ${event}`);
    });
    updateUI(); // Update the UI with the new game master's broadcast
}

function extractText(html) {
    // Use DOMParser to parse HTML string and extract text
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    return doc.body.textContent || ""; // Get plain text content from parsed HTML
}

async function handleCommunication(initiator, recipient, exchanges) {
    let exchangeCount = 0;
    let lastMessage = "";  // To hold the last message for reference in the next prompt

    while (exchangeCount < exchanges) {
        // Gathering the necessary context
        const initiatorHistory = initiator.history.slice(-5).join(' '); // Last 5 entries from initiator's history
        const recipientHistory = recipient.history.slice(-5).join(' '); // Last 5 entries from recipient's history
        const initiatorAttributes = `${initiator.name} is a ${initiator.attributes.personality}, ${initiator.attributes.role}.`;
        const recipientAttributes = `${recipient.name} is a ${recipient.attributes.personality}, ${recipient.attributes.role}.`;

        // Create the prompt for the initiator with a brevity directive
        let initiatorPrompt;
        if (exchangeCount === 0) {
            initiatorPrompt = `As ${initiator.name}, start a conversation with ${recipient.name}. You are a ${initiator.attributes.personality}, ${initiator.attributes.role}. Recent history includes: ${initiatorHistory}. Respond in just 2 or 3 sentences.`;
        } else {
            initiatorPrompt = `As ${initiator.name}, respond to ${recipient.name} who just said: "${lastMessage}". You are a ${initiator.attributes.personality}, ${initiator.attributes.role}. Recent history includes: ${initiatorHistory}. Keep your response to 2 or 3 sentences.`;
        }

        try {
            // Initiator speaks
            const initiatorMessage = await aiPrompt('GeminiNano', initiatorPrompt);
            initiator.logEvent(initiatorMessage);
            updateActionUI(initiator, initiatorMessage);
            lastMessage = initiatorMessage;  // Update lastMessage to the most recent one

            // Prepare the prompt for the recipient with a similar brevity directive
            const recipientPrompt = `As ${recipient.name}, respond to ${initiator.name} who just said: "${lastMessage}". You are a ${recipient.attributes.personality}, ${recipient.attributes.role}. Recent history includes: ${recipientHistory}. Please keep your response to just 2 or 3 sentences.`;
            
            // Recipient responds
            const recipientMessage = await aiPrompt('GeminiNano', recipientPrompt);
            recipient.logEvent(recipientMessage);
            updateActionUI(recipient, recipientMessage);
            lastMessage = recipientMessage;  // Update lastMessage to the most recent one

            exchangeCount += 1;
        } catch (error) {
            console.error(`Error handling communication between ${initiator.name} and ${recipient.name}:`, error);
            break;  // Exit the loop if an error occurs
        }
    }
}

let aiSession = null;  // Global variable to hold the session

async function aiPrompt(model, prompt, retries = 3) {
    while (retries > 0) {
        try {
            if (!aiSession) {  // Check if session exists
                if (await window.ai.canCreateTextSession() === "no") {
                    throw new Error("Unable to create an AI session.");
                }
                aiSession = await window.ai.createTextSession();  // Create a session if none
            }

            console.log('Sending prompt to AI:', prompt);  // Log the prompt for debugging
            const result = await aiSession.prompt(prompt);
            console.log('Received response from AI:', result);  // Log the response for debugging
            return result;  // Return the AI's response
        } catch (error) {
            console.error('Attempt failed in aiPrompt:', error);  // Log attempt failure
            retries -= 1;  // Decrement the retry counter
            if (retries <= 0) {
                throw new Error("Error during AI interaction after several attempts");
            }
            console.log(`Retrying... attempts left: ${retries}`);
        }
    }
}

function togglePauseResume() {
    isPaused = !isPaused; // Toggle the pause state
    document.getElementById('pauseResumeButton').textContent = isPaused ? 'Resume' : 'Pause'; // Update button text based on state
    console.log(isPaused ? "System is paused." : "System is resumed.");
}

document.getElementById('start-process-actions-button').addEventListener('click', gatherAndProcessActions);
