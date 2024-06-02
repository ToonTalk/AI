
let personas = [];

async function createPersona() {
    const attributes = getRandomAttributes();  // Retrieves random attributes for the persona
    const name = await generatePersonaName(attributes.personality, attributes.role); // AI generates a name

    if (!name) {
        alert('Failed to generate a name. Please try again.');
        return;
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
    const container = document.getElementById('personas-container');
    container.innerHTML = '';
    personas.forEach((persona, index) => {
        const personaDiv = document.createElement('div');
        personaDiv.innerHTML = `<strong>${persona.name}</strong> (${persona.attributes.personality}, ${persona.attributes.role})`;
        container.appendChild(personaDiv);
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
        persona.logEvent(`Broadcast: ${event}`); // Ensure the log is clear it's a broadcast
        updateUI(persona); // Optionally update the UI if needed
    });
}

function broadcastEvent(event) {
    personas.forEach(persona => {
        persona.logEvent(event);
    });
}

function updateActionUI(persona, action) {
    const container = document.getElementById('personas-container');
    const actionDiv = document.createElement('div');
    
    // Convert Markdown to HTML before adding to the DOM
    const parsedAction = marked.parse(action);  // Use marked.parse to convert Markdown to HTML

    actionDiv.innerHTML = `<strong>${persona.name}</strong> action: ${parsedAction}`;  // Embed the HTML in the DOM
    container.appendChild(actionDiv);
}

async function gatherAndProcessActions() {
    let actions = [];
    for (let persona of personas) {
        // Prompt each persona for an action
        const action = await promptForAction(persona);
        actions.push({ persona: persona.name, action: action });
        persona.logEvent(`Action decided: ${action}`);
        console.log(`${persona.name} took the action: ${action}`);
        updateActionUI(persona, action); // Display action immediately after gathering
    }

    // Shuffle actions to simulate dynamic interactions
    shuffleArray(actions);

    // Process each shuffled action
    for (let action of actions) {
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

        // Updated prompt to limit response length
        const reactionPrompt = `I am ${persona.name}, a ${persona.attributes.personality} ${persona.attributes.role}. Given the action '${action.action}' by ${action.persona}, how should I react? Please keep your response to just 2 or 3 sentences, focusing on my immediate reaction based on my attributes and past interactions.`;

        try {
            const reaction = await aiPrompt('GeminiNano', reactionPrompt); // Prompt for reaction
            persona.logEvent(`My reaction to ${action.persona}'s action: ${reaction}`);
            updateActionUI(persona, `My reaction to ${action.persona}'s action: ${reaction}`);

            // Check if the reaction involves communication
            const communicationPrompt = `Does my reaction involve communication with ${action.persona}? Please respond only with 'yes' or 'no'.`;
            const involvesCommunicationHtml = await aiPrompt('GeminiNano', communicationPrompt);
            const involvesCommunication = extractText(involvesCommunicationHtml);

            if (involvesCommunication.toLowerCase().trim() === 'yes') {
                const recipientPersona = personas.find(p => p.name === action.persona); // Find the recipient persona object
                if (recipientPersona) {
                    await handleCommunication(persona, recipientPersona, 3); // Pass the full recipient persona object
                }
            }
        } catch (error) {
            console.error(`Error prompting AI for ${persona.name}:`, error);
            updateActionUI(persona, `Error reacting due to AI failure.`);
        }
    }
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

async function aiPrompt(model, prompt) {
    if (!aiSession) {  // Check if session exists
        if (await window.ai.canCreateTextSession() === "no") {
            throw new Error("Unable to create an AI session.");
        }
        aiSession = await window.ai.createTextSession();  // Create a session if none
    }

    console.log('Sending prompt to AI:', prompt);  // Log the prompt for debugging

    try {
        const result = await aiSession.prompt(prompt);
        console.log('Received response from AI:', result);  // Log the response for debugging
        return result;  // Return the AI's response
    } catch (error) {
        console.error('Error in aiPrompt:', error);  // Log errors in aiPrompt
        throw new Error("Error during AI interaction");
    }
}

document.getElementById('start-process-actions-button').addEventListener('click', gatherAndProcessActions);
