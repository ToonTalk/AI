// Initialize game state
let selectedItems = [];
let foundCategories = [];
let mistakes = 0;

// Example categories and items for demonstration
// const categories = {
//     'FISH': ['Bass', 'Flounder', 'Salmon', 'Trout'],
//     'PLANETS': ['Earth', 'Mars', 'Jupiter', 'Venus'],
//     'COLORS': ['Red', 'Blue', 'Green', 'Yellow'],
//     'FRUITS': ['Apple', 'Banana', 'Cherry', 'Date']
// };

// Initialize categories as an empty object or with some default values
let categories = {};

// Function to populate the grid with items
function populateGrid() {
    // Clear the grid first
    while (grid.firstChild) {
        grid.removeChild(grid.firstChild);
    }
    return shuffleArray(Object.values(categories).reduce((acc, val) => acc.concat(val), []));
}

// Function to update the mistake counter
function updateMistakeCounter() {
    mistakes += 1;
    return mistakes;
}

// Function to update the found categories
function updateFoundCategories(category) {
    foundCategories.push(category);
    return foundCategories;
}

// Function to validate selected items
function validateSelectedItems(selected) {
    // Loop through each category and its corresponding items in the 'categories' object
    for (const [category, items] of Object.entries(categories)) {
        // Check if the number of unique selected items is the same as the number of unique items in the current category
        // This ensures that the user has selected exactly the number of items needed for a valid group
        const uniqueSelectedSize = new Set(selected).size;
        const uniqueCategorySize = new Set(items).size;
        
        // Check if adding the selected items to the items in the current category 
        // results in a set with the same size as the original set of items in the category
        // This ensures that all selected items are actually part of the current category
        const combinedSetSize = new Set([...selected, ...items]).size;
        
        // If both conditions are met, the selected items form a valid group
        if (uniqueSelectedSize === uniqueCategorySize && combinedSetSize === uniqueCategorySize) {
            return [true, category];
        }
    }
    
    // If no valid group is found, return false and null
    return [false, null];
}

// Function to mark correct groups in the grid
function markCorrectGroup(category) {
    const correctItems = categories[category];
    correctItems.forEach((item) => {
        const gridItems = Array.from(document.getElementsByClassName('grid-item'));
        const correctGridItem = gridItems.find((element) => element.textContent === item);
        if (correctGridItem) {
            correctGridItem.classList.add('found');
        }
    });
}

// Function to clear the current selection
function clearSelection() {
    selectedItems = [];
    const selectedGridItems = document.getElementsByClassName('selected');
    Array.from(selectedGridItems).forEach((item) => {
        item.classList.remove('selected');
    });
}

// Function to handle the Submit button click
function handleSubmit() {
    const [isValid, category] = validateSelectedItems(selectedItems);
    if (isValid) {
        updateFoundCategories(category);
        markCorrectGroup(category);  // Mark the correct group
        selectedItems = [];
        return ['Valid group found', foundCategories, mistakes];
    } else {
        updateMistakeCounter();
        selectedItems = [];
        // Add logic to update the UI
        document.querySelectorAll('.grid-item.selected').forEach((item) => {
            item.classList.remove('selected');
        });
        return ['Invalid group', foundCategories, mistakes];
    }
}

// Shuffle an array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Main function to initialize the game
function initGame() {
    // Reset mistakes and found categories
    mistakes = 0;
    foundCategories = [];
    
    // Update the corresponding UI elements
    document.getElementById('mistakeCounter').textContent = `Mistakes: ${mistakes}`;
    document.getElementById('foundCategories').textContent = `Found Categories: `;
    document.getElementById('statusMessage').textContent = '';

    const grid = document.getElementById('grid');
    const items = populateGrid();
    items.forEach((item) => {
        const gridItem = document.createElement('div');
        gridItem.className = 'grid-item';
        gridItem.textContent = item;
        gridItem.addEventListener('click', function() {
            const item = this.textContent;
            
            // Check if the item is already selected
            const index = selectedItems.indexOf(item);
            
            if (index > -1) {
                // Remove the item from selectedItems if it's already selected
                selectedItems.splice(index, 1);
                this.classList.remove('selected');  // Update the UI
            } else {
                // Add the item to selectedItems if it's not already selected
                selectedItems.push(item);
                this.classList.add('selected');  // Update the UI
            }
        });
        grid.appendChild(gridItem);
    });

}

function constructFullPrompt(userPrompt) {
    const jsonStructure = [
        'The output should be in valid JSON format with double quotes, like so:',
        '{',
        '  "FISH": ["Bass", "Flounder", "Salmon", "Trout"], ',
        '  "PLANETS": ["Earth", "Mars", "Jupiter", "Venus"], ',
        '  "COLORS": ["Red", "Blue", "Green", "Yellow"], ',
        '  "FRUITS": ["Apple", "Banana", "Cherry", "Date"]',
        '}. '
    ];
    return [userPrompt, ...jsonStructure].join("\n");
}

document.getElementById('initializeGame').addEventListener('click', async function() {
    const apiKey = document.getElementById('apiKey').value;
    const apiChoice = document.getElementById('apiChoice').value;
    const userPrompt = document.getElementById('gpt4Prompt').value;
    const fullPrompt = constructFullPrompt(userPrompt);

    showLoadingIcon();

    try {
        let result;
        switch (apiChoice) {
            case 'openai':
                result = await callOpenAI(apiKey, fullPrompt);
                break;
            case 'cohere':
                result = await callCohere(apiKey, fullPrompt);
                break;
            case 'gemini':
                result = await geminiNano(fullPrompt);
                break;
            default:
                throw new Error("Unsupported AI provider selected.");
        }
        handleApiResponse(result);
    } catch (error) {
        console.error('Error during API interaction:', error);
        updateStatusMessage(error.message, "invalid-message");
    } finally {
        hideLoadingIcon();
    }
});

document.getElementById('apiChoice').addEventListener('change', function() {
    var selectedAI = this.value;
    var apiKeyContainer = document.getElementById('apiKeyContainer');
    if (selectedAI === 'openai' || selectedAI === 'cohere') {
        apiKeyContainer.style.display = 'block'; // Show API key input for OpenAI or Cohere
    } else {
        apiKeyContainer.style.display = 'none';  // Hide for Gemini or no selection
    }
});

function handleApiResponse(result) {
    console.log("API response:", result);  // Log the API result for debugging purposes

    if (result) {
        let jsonSubstring = "";
        try {
            // Normalize the JSON string by removing potentially problematic control characters
            result = result.replace(/\r?\n|\r|\t/g, '').trim();

            // Handle case-insensitive 'json' block detection and removal of backticks
            const jsonStart = result.toLowerCase().indexOf('```json') + 7;  // Use toLowerCase() for case-insensitive matching
            if (jsonStart > 6) {  // Check if '```json' was actually found
                const jsonEnd = result.indexOf('```', jsonStart);  // Find the end index of the JSON data
                jsonSubstring = result.substring(jsonStart, jsonEnd).trim();  // Extract the JSON string
                jsonSubstring = jsonSubstring.replace(/```/g, '').trim();  // Ensure removal of any backticks around JSON
            } else {
                // Assume the response is plain JSON if no markdown backticks found
                jsonSubstring = result.trim();
            }

            console.log("Processed JSON string before parsing:", jsonSubstring);  // Log the JSON string for debugging

            // Parse the JSON string
            categories = JSON.parse(jsonSubstring);
            initGame();  // Initialize the game with new categories
        } catch (error) {
            console.error('Error parsing JSON:', error, 'JSON String:', jsonSubstring);
            updateStatusMessage("Failed to parse JSON from the API response.", "invalid-message");
        }
    } else {
        console.error("No valid response from AI.");
        updateStatusMessage("No valid response from AI.", "invalid-message");
    }
}

function updateStatusMessage(message, className) {
    const statusMessage = document.getElementById('statusMessage');
    statusMessage.textContent = message;
    statusMessage.className = className;
}

function constructFullPrompt(userPrompt) {
    const jsonStructure = [
        'The output should be 4 categories in valid JSON format with double quotes, like so:',
        '{',
        '  "FISH": ["Bass", "Flounder", "Salmon", "Trout"], ',
        '  "PLANETS": ["Earth", "Mars", "Jupiter", "Venus"], ',
        '  "COLORS": ["Red", "Blue", "Green", "Yellow"], ',
        '  "FRUITS": ["Apple", "Banana", "Cherry", "Date"]',
        '}. Be sure to quote each entry properly.'
    ];
    return [userPrompt, ...jsonStructure].join("\n");
}

function callAPI(apiKey, fullPrompt, apiFunction) {
    apiFunction(apiKey, fullPrompt);
}

function showLoadingIcon() {
    const loadingIcon = document.getElementById('loadingIcon');
    loadingIcon.className = 'loading-icon-visible';
}

function hideLoadingIcon() {
    const loadingIcon = document.getElementById('loadingIcon');
    loadingIcon.className = 'loading-icon-hidden';
}

function callOpenAI(apiKey, fullPrompt) {
    console.log("Calling OpenAI with prompt:", fullPrompt);
    showLoadingIcon();

    return fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: "gpt-4",
            messages: [
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": fullPrompt}
            ]
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.choices && data.choices.length > 0) {
            return data.choices[0].message.content; // Return the response content directly
        } else {
            throw new Error("Invalid response format from OpenAI.");
        }
    })
    .catch(error => {
        console.error('Error:', error);
        updateStatusMessage('Error communicating with OpenAI.', 'invalid-message');
        throw error;  // Re-throw to be caught by caller
    })
    .finally(() => {
        hideLoadingIcon();
    });
}

function callCohere(apiKey, fullPrompt) {
    showLoadingIcon();
    const url = 'https://api.cohere.com/v1/chat';
    const data = {
        "chat_history": [
            {"role": "USER", "message": fullPrompt}
        ],
        "message": "Generate 4 categories of words with 4 unique words each, formatted as JSON."
    };

    return fetch(url, {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'Authorization': 'Bearer ' + apiKey
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.text) {
            return data.text; // Return the response text directly
        } else {
            throw new Error("No valid JSON data found in Cohere response.");
        }
    })
    .catch(error => {
        console.error('API Request Error:', error);
        updateStatusMessage('Error making API request to Cohere.', 'invalid-message');
        throw error;  // Re-throw to be caught by caller
    })
    .finally(() => {
        hideLoadingIcon();
    });
}

function updateGameWithCategories(categories) {
    console.log("Received categories:", categories);
    // Here you'd call a function to update your game state and UI with these categories
    // For example, clearing old categories, setting new ones, and reinitializing the game grid
    initGameWithNewCategories(categories);
}

let aiSession = null;  // Global variable to hold the session

async function initializeAI() {
    try {
        const capabilities = await window.ai.assistant.capabilities();
        if (capabilities.available === "readily" || capabilities.available === "after-download") {
            aiSession = await window.ai.assistant.create();
            console.log("AI session created successfully");
        } else {
            throw new Error("AI capabilities are not available on this device.");
        }
    } catch (error) {
        console.error('Error initializing AI:', error);
        const statusMessage = document.getElementById('statusMessage');
        statusMessage.innerHTML = 'Error initializing AI. Please refer to the <a href="https://docs.google.com/document/d/1VG8HIyz361zGduWgNG7R_R8Xkv0OOJ8b5C9QKeCjU0c/edit?pli=1#heading=h.5s2qlonhpm36" target="_blank">documentation</a> for troubleshooting.';
        statusMessage.className = 'invalid-message';
        throw error;
    }
}

async function geminiNano(prompt) {
    if (!aiSession) {
        await initializeAI();
    }

    try {
        const result = await aiSession.prompt(prompt);
        return result;  // Return the AI's response
    } catch (error) {
        console.error('Error in Gemini Nano prompt:', error);
        throw new Error("Error during AI interaction");
    }
}

// Call this function when the page loads or when the user selects Gemini Nano
initializeAI().catch(error => {
    console.error("Failed to initialize AI:", error);
    // Handle the error appropriately in your UI
});

// Get the modal
var modal = document.getElementById("instructionsModal");

// Get the button that opens the modal
var btn = document.getElementById("instructionsButton");

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];

// When the user clicks the button, open the modal 
btn.onclick = function() {
  modal.style.display = "block";
}

// When the user clicks on <span> (x), close the modal
span.onclick = function() {
  modal.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}

document.addEventListener('DOMContentLoaded', (event) => {
    // Attach event listener to the Submit button
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.addEventListener('click', function() {
        const [message, foundCats, mistakeCount] = handleSubmit();
        document.getElementById('mistakeCounter').textContent = `Mistakes: ${mistakes}`;
        // Check if the user has reached the maximum number of mistakes
        if (mistakes >= 4) {
            // Inform the user they've lost
            const statusMessage = document.getElementById('statusMessage');
            statusMessage.textContent = 'You have lost the game! ';
            statusMessage.className = 'invalid-message';
    
            // Reveal the categories and words not yet found
            let notFoundText = 'Categories not found: ';
            for (const [category, words] of Object.entries(categories)) {
                if (!foundCategories.includes(category)) {
                    notFoundText += `\n${category}: ${words.join(', ')}`;
                }
            }
            
            // Append the notFoundText to the statusMessage
            const notFoundElement = document.createElement('pre');
            notFoundElement.textContent = notFoundText;
            statusMessage.appendChild(notFoundElement);
    
            // Optionally, disable further gameplay or reset the game
            return;
        }
        
        document.getElementById('foundCategories').textContent = `Found Categories: ${foundCats.join(', ')}`;
        
        const statusMessage = document.getElementById('statusMessage');
        statusMessage.textContent = message;
    
        // Update the message area with appropriate styling
        if (message === 'Valid group found') {
            statusMessage.className = 'valid-message';
        } else {
            statusMessage.className = 'invalid-message';
        }
    });

    // Add event listener for the Clear button
    const clearBtn = document.getElementById('clearBtn');
    clearBtn.addEventListener('click', function() {
        clearSelection();
    });
    
    // Initialize the game for the first time
    initGame();
});


