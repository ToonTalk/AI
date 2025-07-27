// Initialize game state
let selectedItems = [];
let foundCategories = [];
let mistakes = 0;
let categories = {};
let aiSession = null;

// Function to populate the grid with items
function populateGrid() {
    const grid = document.getElementById('grid');
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
    for (const [category, items] of Object.entries(categories)) {
        const uniqueSelectedSize = new Set(selected).size;
        const uniqueCategorySize = new Set(items).size;
        const combinedSetSize = new Set([...selected, ...items]).size;
        
        if (uniqueSelectedSize === uniqueCategorySize && combinedSetSize === uniqueCategorySize) {
            return [true, category];
        }
    }
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
        markCorrectGroup(category);
        selectedItems = [];
        return ['Valid group found', foundCategories, mistakes];
    } else {
        updateMistakeCounter();
        selectedItems = [];
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

// Initialize the AI session
async function initializeAI() {
    try {
        const capabilities = await window.ai.languageModel.capabilities();
        if (capabilities.available === "readily" || capabilities.available === "after-download") {
            aiSession = await window.ai.languageModel.create({
                monitor(m) {
                    m.addEventListener("downloadprogress", e => {
                        console.log(`Downloaded ${e.loaded} of ${e.total} bytes.`);
                    });
                }
            });
            console.log("AI session created successfully");
            return true;
        } else {
            throw new Error("AI capabilities are not available on this device.");
        }
    } catch (error) {
        console.error('Error initializing AI:', error);
        const statusMessage = document.getElementById('statusMessage');
        statusMessage.innerHTML = 'Error initializing AI. Please check device requirements and try again.';
        statusMessage.className = 'invalid-message';
        throw error;
    }
}

// Function to handle AI responses and parse JSON
async function handleApiResponse(result) {
    console.log("API response:", result);

    if (result) {
        let jsonSubstring = "";
        try {
            // Normalize the JSON string
            result = result.replace(/\r?\n|\r|\t/g, '').trim();

            // Handle case-insensitive 'json' block detection
            const jsonStart = result.toLowerCase().indexOf('```json') + 7;
            if (jsonStart > 6) {
                const jsonEnd = result.indexOf('```', jsonStart);
                jsonSubstring = result.substring(jsonStart, jsonEnd).trim();
                jsonSubstring = jsonSubstring.replace(/```/g, '').trim();
            } else {
                jsonSubstring = result.trim();
            }

            console.log("Processed JSON string before parsing:", jsonSubstring);

            // Parse the JSON string
            categories = JSON.parse(jsonSubstring);
            initGame();
        } catch (error) {
            console.error('Error parsing JSON:', error, 'JSON String:', jsonSubstring);
            updateStatusMessage("Failed to parse categories from the AI response.", "invalid-message");
        }
    } else {
        console.error("No valid response from AI.");
        updateStatusMessage("No valid response received.", "invalid-message");
    }
}

// Function to call Gemini Nano
async function geminiNano(prompt) {
    if (!aiSession) {
        await initializeAI();
    }

    try {
        const result = await aiSession.prompt(prompt);
        return result;
    } catch (error) {
        console.error('Error in Gemini Nano prompt:', error);
        if (error instanceof DOMException && error.name === 'InvalidStateError') {
            // Session was destroyed, try to recreate it
            await initializeAI();
            return await aiSession.prompt(prompt);
        }
        throw new Error("Error during AI interaction");
    }
}

// Function to update status messages
function updateStatusMessage(message, className) {
    const statusMessage = document.getElementById('statusMessage');
    statusMessage.textContent = message;
    statusMessage.className = className;
}

// Function to show/hide loading icon
function showLoadingIcon() {
    const loadingIcon = document.getElementById('loadingIcon');
    loadingIcon.className = 'loading-icon-visible';
}

function hideLoadingIcon() {
    const loadingIcon = document.getElementById('loadingIcon');
    loadingIcon.className = 'loading-icon-hidden';
}

// Main function to initialize the game
function initGame() {
    // Reset game state
    mistakes = 0;
    foundCategories = [];
    
    // Update UI elements
    document.getElementById('mistakeCounter').textContent = `Mistakes: ${mistakes}`;
    document.getElementById('foundCategories').textContent = `Found Categories: `;
    document.getElementById('statusMessage').textContent = '';

    const grid = document.getElementById('grid');
    const items = populateGrid();
    
    // Create grid items
    items.forEach((item) => {
        const gridItem = document.createElement('div');
        gridItem.className = 'grid-item';
        gridItem.textContent = item;
        gridItem.addEventListener('click', function() {
            const item = this.textContent;
            const index = selectedItems.indexOf(item);
            
            if (index > -1) {
                selectedItems.splice(index, 1);
                this.classList.remove('selected');
            } else {
                selectedItems.push(item);
                this.classList.add('selected');
            }
        });
        grid.appendChild(gridItem);
    });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', (event) => {
    // Initialize AI
    initializeAI().catch(console.error);

    // Submit button handler
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.addEventListener('click', function() {
        const [message, foundCats, mistakeCount] = handleSubmit();
        document.getElementById('mistakeCounter').textContent = `Mistakes: ${mistakes}`;
        
        // Check for game over
        if (mistakes >= 4) {
            const statusMessage = document.getElementById('statusMessage');
            statusMessage.textContent = 'Game Over! ';
            statusMessage.className = 'invalid-message';
            
            // Show unfound categories
            let notFoundText = 'Categories not found: ';
            for (const [category, words] of Object.entries(categories)) {
                if (!foundCategories.includes(category)) {
                    notFoundText += `\n${category}: ${words.join(', ')}`;
                }
            }
            
            const notFoundElement = document.createElement('pre');
            notFoundElement.textContent = notFoundText;
            statusMessage.appendChild(notFoundElement);
            return;
        }
        
        // Update UI
        document.getElementById('foundCategories').textContent = `Found Categories: ${foundCats.join(', ')}`;
        const statusMessage = document.getElementById('statusMessage');
        statusMessage.textContent = message;
        statusMessage.className = message === 'Valid group found' ? 'valid-message' : 'invalid-message';
    });

    // Clear button handler
    const clearBtn = document.getElementById('clearBtn');
    clearBtn.addEventListener('click', clearSelection);

    // Initialize game button handler
    const initializeGameBtn = document.getElementById('initializeGame');
    initializeGameBtn.addEventListener('click', async function() {
        const userPrompt = document.getElementById('gpt4Prompt').value;
        showLoadingIcon();

        try {
            const result = await geminiNano(userPrompt);
            await handleApiResponse(result);
        } catch (error) {
            console.error('Error:', error);
            updateStatusMessage('Error generating categories. Please try again.', 'invalid-message');
        } finally {
            hideLoadingIcon();
        }
    });

    // Initial game setup
    initGame();
});

// Modal functionality
const modal = document.getElementById("instructionsModal");
const instructionsBtn = document.getElementById("instructionsButton");
const closeSpan = document.getElementsByClassName("close")[0];

instructionsBtn.onclick = function() {
    modal.style.display = "block";
}

closeSpan.onclick = function() {
    modal.style.display = "none";
}

window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}
