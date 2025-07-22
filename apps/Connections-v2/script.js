// Initialize game state
let selectedItems = [];
let foundCategories = [];
let mistakes = 0;
let categories = {};
let aiSession = null;  // Global variable to hold the AI session

// ### Core Game Logic ###

// Populates the grid with a given list of items
function populateGrid(itemsToDisplay) {
    const grid = document.getElementById('grid');
    grid.innerHTML = ''; // Clear the grid first

    itemsToDisplay.forEach((itemText) => {
        const gridItem = document.createElement('div');
        gridItem.className = 'grid-item';
        gridItem.textContent = itemText;

        // NEW: If the item text is short, assume it's an emoji and apply the special class
        if (itemText.length <= 2) {
            gridItem.classList.add('grid-item-emoji');
        }

        gridItem.addEventListener('click', handleItemClick);
        grid.appendChild(gridItem);
    });
}

// Handles when a grid item is clicked
function handleItemClick() {
    const itemText = this.textContent;
    const index = selectedItems.indexOf(itemText);

    if (index > -1) {
        // Deselect the item
        selectedItems.splice(index, 1);
        this.classList.remove('selected');
    } else if (selectedItems.length < 4) {
        // Select the item if fewer than 4 are already selected
        selectedItems.push(itemText);
        this.classList.add('selected');
    }
}

// Validates if the selected items form a correct category
function validateSelectedItems(selected) {
    for (const [category, items] of Object.entries(categories)) {
        if (selected.length === items.length && selected.every(item => items.includes(item))) {
            return [true, category];
        }
    }
    return [false, null];
}

// Handles the Submit button click
function handleSubmit() {
    if (selectedItems.length !== 4) {
        updateStatusMessage('Please select exactly 4 items.', 'invalid-message');
        return;
    }

    const [isValid, category] = validateSelectedItems(selectedItems);
    if (isValid) {
        foundCategories.push(category);
        document.getElementById('foundCategories').textContent = `Found Categories: ${foundCategories.join(', ')}`;
        updateStatusMessage('Valid group found!', 'valid-message');

        // Add a class to fade out the correct items
        document.querySelectorAll('.grid-item.selected').forEach(gridItem => {
            gridItem.classList.add('found-fade-out');
        });
        clearSelection();

        // Wait for the fade-out animation to complete, then rebuild the grid
        setTimeout(() => {
            if (foundCategories.length === Object.keys(categories).length) {
                // If all categories are found, handle the win
                updateStatusMessage('Congratulations, you have won the game!', 'valid-message');
                document.getElementById('grid').innerHTML = ''; // Clear the final items
            } else {
                // Rebuild the grid with the remaining items
                let remainingItems = Object.entries(categories)
                    .filter(([cat, _]) => !foundCategories.includes(cat))
                    .flatMap(([_, items]) => items);
                
                // Shuffle the remaining items before re-populating the grid
                populateGrid(shuffleArray(remainingItems));
            }
        }, 500); // This duration should match the CSS transition duration

    } else {
        mistakes++;
        document.getElementById('mistakeCounter').textContent = `Mistakes: ${mistakes}`;
        updateStatusMessage('Invalid group. Try again.', 'invalid-message');
        
        // Check for lose condition
        if (mistakes >= 4) {
            handleLoss();
        }
    }
}


// Handles the game loss condition
function handleLoss() {
    updateStatusMessage('You have lost the game!', 'invalid-message');
    // Reveal all remaining categories
    for (const category in categories) {
        if (!foundCategories.includes(category)) {
            document.querySelectorAll('.grid-item').forEach(gridItem => {
                if (categories[category].includes(gridItem.textContent)) {
                    gridItem.classList.add('lost');
                }
            });
        }
    }
    // Disable further interaction
    document.getElementById('submitBtn').disabled = true;
    document.getElementById('clearBtn').disabled = true;
}

// Clears the current selection
function clearSelection() {
    selectedItems = [];
    document.querySelectorAll('.grid-item.selected').forEach(item => {
        item.classList.remove('selected');
    });
}

// ### AI Interaction and Game Initialization ###

// Initializes the AI session, showing an info panel on failure
async function initializeAI() {
    if (typeof LanguageModel === 'undefined') {
        const infoPanel = document.getElementById('gemini-info-panel');
        if (infoPanel) {
            infoPanel.className = 'info-panel-visible'; // Show the panel
        }
        throw new Error("LanguageModel API not available.");
    }
    try {
        const availability = await LanguageModel.availability();
        if (availability === "available" || availability === "readily" || availability === "after-download") {
            aiSession = await LanguageModel.create();
            console.log("AI session created successfully");
        } else {
            throw new Error(`AI capabilities not available. Status: ${availability}`);
        }
    } catch (error) {
        console.error('Error initializing AI:', error);
        updateStatusMessage(`Error initializing AI: ${error.message}.`, 'invalid-message');
        throw error;
    }
}

// Calls Gemini Nano with the provided prompt
async function geminiNano(prompt) {
    if (!aiSession) {
        try {
            await initializeAI();
        } catch (error) {
            return;
        }
    }
    try {
        return await aiSession.prompt(prompt);
    } catch (error) {
        console.error('Error in Gemini Nano prompt:', error);
        updateStatusMessage('Error during AI interaction.', 'invalid-message');
        throw error;
    }
}

// Calls the OpenAI API
async function callOpenAI(apiKey, fullPrompt) {
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: "gpt-4", messages: [{ "role": "user", "content": fullPrompt }] })
        });
        const data = await response.json();
        if (data.choices && data.choices.length > 0) return data.choices[0].message.content;
        throw new Error("Invalid response format from OpenAI.");
    } catch (error) {
        console.error('Error:', error);
        updateStatusMessage('Error communicating with OpenAI.', 'invalid-message');
        throw error;
    }
}

// Calls the Cohere API
async function callCohere(apiKey, fullPrompt) {
    try {
        const response = await fetch('https://api.cohere.com/v1/chat', {
            method: 'POST',
            headers: { 'accept': 'application/json', 'content-type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({ "message": fullPrompt })
        });
        const data = await response.json();
        if (data.text) return data.text;
        throw new Error("No valid JSON data found in Cohere response.");
    } catch (error) {
        console.error('API Request Error:', error);
        updateStatusMessage('Error making API request to Cohere.', 'invalid-message');
        throw error;
    }
}

// Calls the Google AI Gemini Flash API
async function callGeminiFlash(apiKey, fullPrompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "contents": [{
                    "parts": [{ "text": fullPrompt }]
                }]
            })
        });
        const data = await response.json();
        if (data.candidates && data.candidates.length > 0) {
            return data.candidates[0].content.parts[0].text;
        } else if (data.error) {
            throw new Error(data.error.message);
        }
        throw new Error("Invalid response format from Gemini Flash.");
    } catch (error) {
        console.error('Error:', error);
        updateStatusMessage(`Error communicating with Gemini Flash: ${error.message}`, 'invalid-message');
        throw error;
    }
}

// Validates the categories object from the AI
function validateCategories(categoriesData) {
    if (Object.keys(categoriesData).length !== 4) return false;
    
    const allWords = Object.values(categoriesData).flat();
    const uniqueWords = new Set(allWords);

    // Check for exactly 16 unique words, which also covers the duplicate check.
    if (uniqueWords.size !== 16 || allWords.length !== 16) {
        return false;
    }
    
    return true;
}

// Handles the AI response with validation and a re-prompt loop
async function handleApiResponse(apiResponse, originalUserPrompt, apiConfig, attempt = 1) {
    const maxAttempts = 3;

    if (!apiResponse) {
        updateStatusMessage("No valid response from AI.", "invalid-message");
        return;
    }

    try {
        const jsonMatch = apiResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("No JSON object found in the response.");
        }
        
        const parsedCategories = JSON.parse(jsonMatch[0]);

        if (validateCategories(parsedCategories)) {
            // Success! Initialize the game.
            categories = parsedCategories;
            initGame();
        } else {
            // Validation failed, re-prompt if under max attempts.
            if (attempt >= maxAttempts) {
                throw new Error("AI failed to provide a valid game after multiple attempts.");
            }
            
            updateStatusMessage(`AI response was invalid. Retrying... (Attempt ${attempt + 1})`, 'invalid-message');
            
            // Construct a new prompt with corrective instructions
            const repromptInstructions = "The previous response was invalid. Please try again. Ensure the new response contains exactly 4 categories, each with exactly 4 unique words, for a total of 16 unique words with no duplicates. The entire output must be only a single JSON object.";
            const newFullPrompt = constructFullPrompt(`${repromptInstructions}\n\nOriginal request: ${originalUserPrompt}`);
            
            // Call the same AI again with the new prompt
            let result;
            switch (apiConfig.choice) {
                case 'openai': result = await callOpenAI(apiConfig.key, newFullPrompt); break;
                case 'cohere': result = await callCohere(apiConfig.key, newFullPrompt); break;
                case 'gemini-flash': result = await callGeminiFlash(apiConfig.key, newFullPrompt); break;
                case 'gemini': result = await geminiNano(newFullPrompt); break;
            }
            // Recursively call this handler for the new response
            await handleApiResponse(result, originalUserPrompt, apiConfig, attempt + 1);
        }
    } catch (error) {
        console.error('Error processing API response:', error, 'Original String:', apiResponse);
        updateStatusMessage(`Failed to process AI response: ${error.message}`, "invalid-message");
    }
}

// Main function to initialize or reset the game
function initGame() {
    mistakes = 0;
    foundCategories = [];
    selectedItems = [];

    document.getElementById('mistakeCounter').textContent = `Mistakes: 0`;
    document.getElementById('foundCategories').textContent = `Found Categories: `;
    updateStatusMessage('', '');
    document.getElementById('submitBtn').disabled = false;
    document.getElementById('clearBtn').disabled = false;

    const allItems = shuffleArray(Object.values(categories).flat());
    populateGrid(allItems);
}

// ### UI and Utility Functions ###

// Constructs the full prompt for the AI
function constructFullPrompt(userPrompt) {
    const jsonStructure = [
        'The output must be only a single valid JSON object containing exactly 4 categories with 4 unique string items each. Use double quotes.',
        'Example:',
        '{',
        '  "FISH": ["Bass", "Flounder", "Salmon", "Trout"],',
        '  "PLANETS": ["Earth", "Mars", "Jupiter", "Venus"],',
        '  "COLORS": ["Red", "Blue", "Green", "Yellow"],',
        '  "FRUITS": ["Apple", "Banana", "Cherry", "Date"]',
        '}'
    ];
    return [userPrompt, ...jsonStructure].join("\n");
}

// Updates the status message display
function updateStatusMessage(message, className) {
    const statusMessage = document.getElementById('statusMessage');
    statusMessage.innerHTML = message;
    statusMessage.className = className;
}

// Shuffles an array randomly
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Toggles visibility of the loading icon
function toggleLoadingIcon(show) {
    document.getElementById('loadingIcon').style.display = show ? 'inline-block' : 'none';
}

// ### Event Listeners ###

document.addEventListener('DOMContentLoaded', () => {
    // Modal setup
    const modal = document.getElementById("instructionsModal");
    const btn = document.getElementById("instructionsButton");
    const span = document.getElementsByClassName("close")[0];
    if (btn) btn.onclick = () => { if(modal) modal.style.display = "block"; };
    if (span) span.onclick = () => { if(modal) modal.style.display = "none"; };
    window.onclick = (event) => { if (event.target == modal) modal.style.display = "none"; };
    
    // Info Panel Close Button
    const closePanelBtn = document.getElementById('close-info-panel');
    if (closePanelBtn) {
        closePanelBtn.addEventListener('click', function() {
            const infoPanel = document.getElementById('gemini-info-panel');
            if (infoPanel) {
                infoPanel.className = 'info-panel-hidden';
            }
        });
    }

    // Initialize game button
    const initializeGameBtn = document.getElementById('initializeGame');
    if (initializeGameBtn) {
        initializeGameBtn.addEventListener('click', async function() {
            const apiKey = document.getElementById('apiKey').value;
            const apiChoice = document.getElementById('apiChoice').value;
            const userPrompt = document.getElementById('gpt4Prompt').value;
            const apiConfig = { choice: apiChoice, key: apiKey };

            toggleLoadingIcon(true);
            try {
                const fullPrompt = constructFullPrompt(userPrompt);
                let result;
                switch (apiChoice) {
                    case 'openai': result = await callOpenAI(apiKey, fullPrompt); break;
                    case 'cohere': result = await callCohere(apiKey, fullPrompt); break;
                    case 'gemini-flash': result = await callGeminiFlash(apiKey, fullPrompt); break;
                    case 'gemini': result = await geminiNano(fullPrompt); break;
                    default: 
                        updateStatusMessage('Please select an AI Provider.', 'invalid-message');
                        toggleLoadingIcon(false);
                        return;
                }
                // Initial call to the response handler
                await handleApiResponse(result, userPrompt, apiConfig);

            } catch (error) {
                console.error('Error during API interaction:', error);
            } finally {
                toggleLoadingIcon(false);
            }
        });
    }

    // Toggle API key input visibility
    const apiChoiceEl = document.getElementById('apiChoice');
    if(apiChoiceEl) {
        apiChoiceEl.addEventListener('change', function() {
            const apiKeyContainer = document.getElementById('apiKeyContainer');
            if (apiKeyContainer) {
                const needsApiKey = this.value === 'openai' || this.value === 'cohere' || this.value === 'gemini-flash';
                apiKeyContainer.style.display = needsApiKey ? 'block' : 'none';
            }
        });
    }

    // Game action buttons
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) submitBtn.addEventListener('click', handleSubmit);
    
    const clearBtn = document.getElementById('clearBtn');
    if (clearBtn) clearBtn.addEventListener('click', clearSelection);

    // Initial game setup
    categories = {
        'FISH': ['Bass', 'Flounder', 'Salmon', 'Trout'],
        'PLANETS': ['Earth', 'Mars', 'Jupiter', 'Venus'],
        'COLORS': ['Red', 'Blue', 'Green', 'Yellow'],
        'FRUITS': ['Apple', 'Banana', 'Cherry', 'Date']
    };
    initGame();
    
    // Attempt to initialize Gemini Nano on load
    initializeAI().catch(e => console.log("AI not available on load. Panel will be shown on first use."));
});