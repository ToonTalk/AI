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

// Define global variables for API details
const API_DETAILS = {
    'OpenAI': {
        endpoint: 'https://api.openai.com/v1/chat/completions',
        prepareHeaders: function(apiKey) {
            return {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            };
        },
        body: function(userPrompt) {
            return JSON.stringify({
                model: "gpt-4",
                messages: [
                    {"role": "system", "content": "You are a helpful assistant."},
                    {"role": "user", "content": userPrompt}
                ]
            });
        }
    },
    'Cohere': {
        endpoint: 'https://api.cohere.com/v1/chat',
        prepareHeaders: function(apiKey) {
            return {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            };
        },
        body: function(userPrompt) {
            return JSON.stringify({
                "chat_history": [
                    {"role": "USER", "message": userPrompt},
                    {"role": "CHATBOT", "message": "Generating categories based on your input."}
                ],
                "message": "Further details about the categories are as follows:",
                "model": "latest",
                "temperature": 0.5,
                "max_tokens": 250
            });
        }
    }
};

// Main function to initialize the game based on selected API
function initializeGame(apiName) {
    const apiDetails = API_DETAILS[apiName];
    const apiKey = document.getElementById('apiKey').value;

    if (!apiKey) {
        console.error('No API key provided.');
        document.getElementById('statusMessage').textContent = 'Please enter an API key.';
        document.getElementById('statusMessage').className = 'invalid-message';
        return;
    }

    const headers = apiDetails.prepareHeaders(apiKey);
    const body = apiDetails.body(document.getElementById('gpt4Prompt').value);

    const loadingIcon = document.getElementById('loadingIcon');
    loadingIcon.className = 'loading-icon-visible';

    fetch(apiDetails.endpoint, {
        method: 'POST',
        headers: headers,
        body: body
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        loadingIcon.className = 'loading-icon-hidden';
        console.log('API Response:', data);
        // Handle the response properly based on the API structure
        populateGrid(); // Adjust accordingly
    })
    .catch(error => {
        console.error('Request Failed:', error);
        loadingIcon.className = 'loading-icon-hidden';
        document.getElementById('statusMessage').textContent = 'API error: ' + error.message;
        document.getElementById('statusMessage').className = 'invalid-message';
    });
}

// Function to build the full JSON prompt for API requests
function buildFullJSONPrompt(userInput, apiName) {
    // Example for Cohere API, adjust for others if necessary
    if (apiName === 'Cohere') {
        return JSON.stringify({
            "chat_history": [
                {"role": "USER", "message": userInput},
                {"role": "CHATBOT", "message": "Generating categories based on your input."}
            ],
            "message": "Further details about the categories are as follows:",
            "model": "latest", // or another model as required by your configuration
            "temperature": 0.5,  // This can be adjusted or removed based on your need
            "max_tokens": 250
        });
    } else {
        return JSON.stringify({
            model: "gpt-4",
            prompt: userInput,
            max_tokens: 150
        });
    }
}

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
    // Attach event listener to the Initialize Game button
    const initializeBtn = document.getElementById('initializeGame');
    initializeBtn.addEventListener('click', function() {
        const selectedApi = document.getElementById('apiSelector').value;
        initializeGame(selectedApi); // Initialize the game with the selected API
    });

    // Attach event listener to the API selector if you want to perform any action on API switch
    const apiSelector = document.getElementById('apiSelector');
    apiSelector.addEventListener('change', function() {
        // Optionally, you can do something when the API is switched
        console.log('Switched to:', this.value);
        // Clear any status messages or reset the game state if needed
        document.getElementById('statusMessage').textContent = '';
    });

    // Initialize the game for the first time (optional, you can also wait for user action)
    // initGame('OpenAI');
});

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


