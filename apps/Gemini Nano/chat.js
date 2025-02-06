let personas = [];
let isPaused = false; // This will control whether the interactions are paused or active
let aiSession = null; // Will hold the session object for Gemini

// ------------------------------
// AI Interaction Functions
// ------------------------------
async function initializeAI() {
  try {
    const capabilities = await window.ai.languageModel.capabilities();
    // Check that the model is available (i.e. not "no")
    if (capabilities.available !== "no") {
      aiSession = await window.ai.languageModel.create();
    } else {
      console.error("AI capabilities are not available on this device.");
    }
  } catch (error) {
    console.error("Error during AI initialization:", error);
  }
}

async function aiPrompt(prompt, retries = 3) {
  console.log("Prompt being sent to AI:", prompt);
  const model = document.getElementById('apiChoice').value || 'gemini';  // Default to Gemini Nano
  const apiKey = document.getElementById('apiKey').value;

  while (retries > 0) {
    try {
      switch (model) {
        case 'gemini':
          if (!aiSession) {
            await initializeAI();
            if (!aiSession) {
              throw new Error("Unable to create an AI session.");
            }
          }
          console.log('Sending prompt to GeminiNano:', prompt);
          const resultGemini = await aiSession.prompt(prompt);
          if (!resultGemini) throw new Error("Received undefined result from GeminiNano.");
          console.log('Received response from GeminiNano:', resultGemini);
          return resultGemini;

        case 'cohere':
          // The Cohere API call remains unchanged
          if (!apiKey) {
            throw new Error("API key for Cohere is not provided.");
          }
          console.log('Sending prompt to Cohere:', prompt);
          return await callCohere(apiKey, prompt);

        default:
          throw new Error('Unsupported AI model specified');
      }
    } catch (error) {
      console.error(`Attempt failed in aiPrompt using ${model}:`, error);
      retries -= 1;
      if (retries <= 0) {
        throw new Error(`Error during AI interaction after several attempts with ${model}`);
      }
      console.log(`Retrying... attempts left: ${retries}`);
    }
  }
}

// Initialize AI when the script loads
initializeAI();

// ------------------------------
// Persona Functions
// ------------------------------
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
    const safePersonaId = CSS.escape(persona.name);  // Safely escape the persona name for use in a selector
    const existingEntry = document.querySelector(`div[data-persona-id="${safePersonaId}"]`);
    if (!existingEntry) {
      const personaDiv = document.createElement('div');
      personaDiv.setAttribute('data-persona-id', persona.name);  // Helps identify the div later
      personaDiv.innerHTML = `<strong>${escapeHtml(persona.name)}</strong> (${escapeHtml(persona.attributes.personality)}, ${escapeHtml(persona.attributes.role)})`;
      container.appendChild(personaDiv);
    }
  });
}

// Helper function to escape HTML special characters
function escapeHtml(unsafe) {
  return unsafe
       .replace(/&/g, "&amp;")
       .replace(/</g, "&lt;")
       .replace(/>/g, "&gt;")
       .replace(/"/g, "&quot;")
       .replace(/'/g, "&#039;");
}

async function generatePersonaName(personality, role) {
  const prompt = `Suggest a single, suitable name (in English) for a persona characterized as '${personality}' and whose profession is '${role}'. The name should be creative and reflect these attributes. Please provide only the name without any explanations or additional text.`;

  try {
    const response = await aiPrompt(prompt);
    if (response && typeof response === 'string') {
      const suggestedName = response.split('\n')[0].trim();
      console.log(`AI suggested name: ${suggestedName}`);
      return suggestedName.replace(/['"]/g, '');
    } else {
      console.error('Invalid response format:', response);
      return null;
    }
  } catch (error) {
    console.error('Error generating persona name:', error);
    return null;
  }
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

function updateActionUI(persona, message, isReaction = false) {
  if (!message) {
    console.error("Attempted to update UI with undefined or null message.");
    return;  // Prevent further processing
  }

  const container = document.getElementById('personas-content');
  const actionDiv = document.createElement('div');
  const lines = message.split('\n');
  const firstLine = lines.shift();  // Remove and return the first line from the array
  const rest = lines.join('\n');  // Join the remaining lines back into a single string

  if (isReaction) {
    actionDiv.innerHTML = `<strong>Reaction to ${persona.name}'s action:</strong> ${firstLine}${rest ? `<br>${rest}` : ''}`;  // Add the reaction header
  } else {
    actionDiv.innerHTML = `<strong>${firstLine}</strong>${rest ? `<br>${rest}` : ''}`;  // Add the action header
  }

  container.appendChild(actionDiv);
}

async function promptForAction(persona) {
  const historySummary = persona.history.slice(-5).join(' ');
  const attributesDescription = `I am ${persona.name}, characterized as ${persona.attributes.personality} and professionally, I am a ${persona.attributes.role}.`;
  const prompt = `${attributesDescription} Given my attributes and recent history: ${historySummary}, what actions am I planning to take next? How will I approach my next challenges or opportunities? Respond as if you are the persona. Please provide a short response in 2 or 3 sentences.`;

  try {
    const result = await aiPrompt(prompt);
    const trimmedResult = result.split('\n')[0].trim(); // Take only the first line
    persona.history.push(`${trimmedResult}<ctrl23>`);
    updateActionUI(persona, trimmedResult);  // Update UI with the action
    return trimmedResult;
  } catch (error) {
    console.error('Error prompting AI for action:', error);
    return "Error in AI interaction";
  }
}

async function processAction(action) {
  for (let persona of personas) {
    if (persona.name === action.persona) continue; // Skip the actor

    const reactionPrompt = `Given my attributes and recent history: I am ${persona.name}, characterized as ${persona.attributes.personality} and professionally, I am a ${persona.attributes.role}. Considering the action '${action.action}' by ${action.persona}, how should I react? Please provide a short response in 2 or 3 sentences.`;

    try {
      const reaction = await aiPrompt(reactionPrompt); // Prompt for reaction
      const trimmedReaction = reaction.split('\n')[0].trim(); // Use only the first line
      persona.logEvent(`Reaction to ${action.persona}'s action: ${trimmedReaction}`);
      updateActionUI(persona, `Reaction to ${action.persona}'s action: ${marked.parse(trimmedReaction)}`, true);

      const communicationPrompt = `Does the following statement involve communication with another persona? Response: "${trimmedReaction}". Please answer 'yes' or 'no'.`;
      const involvesCommunicationHtml = await aiPrompt(communicationPrompt);
      const involvesCommunication = extractText(involvesCommunicationHtml);

      if (involvesCommunication.toLowerCase().trim() === 'yes') {
        const recipientPersona = personas.find(p => p.name === action.persona); // Find the recipient persona object
        if (recipientPersona) {
          await handleCommunication(persona, recipientPersona, 3); // Pass the full recipient persona object
        }
      } else {
        await informGameMaster(action, trimmedReaction);  // Inform Game Master if it's not communication
      }
    } catch (error) {
      console.error(`Error prompting AI for ${persona.name}:`, error);
      updateActionUI(persona, `Error reacting due to AI failure.`);
    }
  }
}

async function gatherAndProcessActions() {
  if (isPaused) {
    console.log("System is paused.");
    return;
  }

  let actions = [];
  for (let persona of personas) {
    let action = await promptForAction(persona);
    actions.push({ persona: persona.name, action: action });
    persona.logEvent(`Action decided: ${action}`);
  }

  shuffleArray(actions);

  for (let action of actions) {
    await processAction(action);
  }
}

async function startActions() {
  for (let persona of personas) {
    // Prompt each persona for an action
    const action = await promptForAction(persona);
    persona.logEvent(`Action taken: ${action}`);
    updateActionUI(persona, action);
  }
  await gatherAndProcessActions();  // Start processing actions after gathering them
}

async function informGameMaster(action, reaction) {
  const gmPrompt = `Game Master needs to update environment based on: ${action.action} which led to: ${reaction}. Provide context and consequences for this update.`;
  const gmUpdate = await aiPrompt(gmPrompt);

  const gmUpdatesList = document.getElementById('gmUpdatesList');
  const updateItem = document.createElement('li');
  updateItem.innerHTML = `<strong>Game Master Update:</strong> ${marked.parse(gmUpdate)}`;
  gmUpdatesList.appendChild(updateItem);

  broadcastEvent(`Game Master Update: ${gmUpdate}`);
}

function extractText(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  return doc.body.textContent || ""; // Get plain text content from parsed HTML
}

async function handleCommunication(initiator, recipient, exchanges) {
  let exchangeCount = 0;
  let lastMessage = ""; // To hold the last message for reference in the next prompt

  while (exchangeCount < exchanges) {
    const initiatorHistory = initiator.history.slice(-5).join(' '); // Last 5 entries from initiator's history
    const recipientHistory = recipient.history.slice(-5).join(' '); // Last 5 entries from recipient's history
    const initiatorAttributes = `Attributes of ${initiator.name}: ${initiator.attributes.personality}, ${initiator.attributes.role}.`;
    const recipientAttributes = `Attributes of ${recipient.name}: ${recipient.attributes.personality}, ${recipient.attributes.role}.`;

    let initiatorPrompt = `As ${initiator.name}, respond to ${recipient.name} who previously said: "${lastMessage}". Please role-play according to your attributes: ${initiatorAttributes} Recent interactions include: ${initiatorHistory}. Keep it short, 2 or 3 sentences.`;
    if (exchangeCount === 0) {
      initiatorPrompt = `As ${initiator.name}, start a conversation with ${recipient.name}. Reflect your personality and role: ${initiatorAttributes} Recent interactions include: ${initiatorHistory}. Keep it short, 2 or 3 sentences.`;
    }

    try {
      const initiatorMessage = await aiPrompt(initiatorPrompt);
      const parsedInitiatorMessage = marked.parse(initiatorMessage);  // Parse Markdown response
      initiator.logEvent(parsedInitiatorMessage);
      updateActionUI(initiator, parsedInitiatorMessage);
      lastMessage = initiatorMessage;

      const recipientPrompt = `As ${recipient.name}, respond to ${initiator.name} who just said: "${lastMessage}". Please role-play according to your attributes: ${recipientAttributes} Recent interactions include: ${recipientHistory}. Keep it short, 2 or 3 sentences.`;
      
      const recipientMessage = await aiPrompt(recipientPrompt);
      const parsedRecipientMessage = marked.parse(recipientMessage);  // Parse Markdown response
      recipient.logEvent(parsedRecipientMessage);
      updateActionUI(recipient, parsedRecipientMessage);
      lastMessage = recipientMessage;

      exchangeCount += 1;
    } catch (error) {
      console.error(`Error handling communication between ${initiator.name} and ${recipient.name}:`, error);
      break;  // Exit the loop if an error occurs
    }
  }
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // ES6 destructuring swap
  }
}

function togglePauseResume() {
  isPaused = !isPaused;
  document.getElementById('pauseResumeButton').textContent = isPaused ? 'Resume' : 'Pause';
}

// ------------------------------
// Event Listeners
// ------------------------------
document.getElementById('createPersonaButton').addEventListener('click', createPersona);
document.getElementById('broadcastButton').addEventListener('click', handleBroadcast);
document.getElementById('start-process-actions-button').addEventListener('click', gatherAndProcessActions);
document.getElementById('pauseResumeButton').addEventListener('click', togglePauseResume);

// ------------------------------
// Cohere API Call Function
// ------------------------------
async function callCohere(apiKey, fullPrompt, retries = 3) {
  const url = 'https://api.cohere.com/v1/generate';  // Correct API endpoint for generation
  let delay = 2000; // Start with a 2-second delay
  const delayIncreaseFactor = 2.5; // Increase the delay more aggressively

  const data = {
    "model": "command",  // Ensure the correct model is specified
    "prompt": fullPrompt,
    "max_tokens": 50,  // Adjust based on the expected length of the response
    "temperature": 0.5,
    "k": 0,
    "p": 0.75,
    "frequency_penalty": 0,
    "presence_penalty": 0,
    "stop_sequences": ["\n"]  // Assuming the response should stop at the first newline
  };

  while (retries > 0) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'Authorization': 'Bearer ' + apiKey
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorDetails = await response.text();  // Try to get more details from the response
        console.error(`API returned non-ok status: ${response.status}, Details: ${errorDetails}`);
        
        if (response.status === 400) {
          throw new Error(`Bad request to API: ${errorDetails}`);
        } else if (response.status === 429) {
          console.error(`Rate limit exceeded, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= delayIncreaseFactor; // Increase the delay exponentially
          retries--; // Decrement retries counter
          continue; // Skip the rest of the loop and retry
        } else {
          throw new Error(`API returned non-ok status: ${response.status}`);
        }
      }

      const result = await response.json();
      if (result && result.generations && result.generations.length > 0 && result.generations[0].text) {
        console.log('Received response from Cohere:', result.generations[0].text);
        return result.generations[0].text.trim(); // Return the trimmed text
      } else {
        throw new Error("No valid text found in Cohere response.");
      }
    } catch (error) {
      console.error('Cohere API Request Error:', error);
      retries--; // Decrement retries counter
      if (retries <= 0) throw new Error("Failed after multiple retries."); // Fail after all retries are exhausted
    }
  }
}
