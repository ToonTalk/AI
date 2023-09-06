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
    for (const [category, items] of Object.entries(categories)) {
        if (new Set(selected).size === new Set(items).size &&
            new Set([...selected, ...items]).size === new Set(items).size) {
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
        markCorrectGroup(category);  // Mark the correct group
        selectedItems = [];
        return ['Valid group found', foundCategories, mistakes];
    } else {
        updateMistakeCounter();
        selectedItems = [];
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
}

const apiKeyButton = document.getElementById('initializeGame');
apiKeyButton.addEventListener('click', function() {
    const apiKey = document.getElementById('apiKey').value;
    if (apiKey) {
        // Show loading icon when starting the API call
        const loadingIcon = document.getElementById('loadingIcon');
        loadingIcon.className = 'loading-icon-visible';
        const userPrompt = document.getElementById('gpt4Prompt').value;
        const fullPrompt = [
          userPrompt,
          'The output should be in valid JSON format with double quotes, like so:',
          '{',
          '  "FISH": ["Bass", "Flounder", "Salmon", "Trout"], ',
          '  "PLANETS": ["Earth", "Mars", "Jupiter", "Venus"], ',
          '  "COLORS": ["Red", "Blue", "Green", "Yellow"], ',
          '  "FRUITS": ["Apple", "Banana", "Cherry", "Date"]',
          '}. '
        ].join('\n');
        // Prepare the fetch API call for GPT-4
        fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "gpt-4",
                messages: [
                    {"role": "system", "content": "You are a helpful assistant."},
                    {
                      "role": "user", 
                      "content": fullPrompt
                    }
                ]
            })
        })
        .then(response => response.json())
        .then(data => {
              // Hide loading icon when API call is successful
              loadingIcon.className = 'loading-icon-hidden';
              console.log(data.choices[0].message.content);
              // The output is already in JSON format, so you can directly access its properties
              // const jsonString = data.choices[0].message.content.replace(/'/g, '"');
              categories = JSON.parse(data.choices[0].message.content); // Update the 'categories' object         
              initGame();  // Call the existing initGame logic to refresh the game
        }).catch(error => {
              console.error('Error:', error);
              // Hide loading icon when API call fails
              loadingIcon.className = 'loading-icon-hidden';
              // Inform the user
              const statusMessage = document.getElementById('statusMessage');
              statusMessage.textContent = 'Error parsing JSON from GPT-4.';
              statusMessage.className = 'invalid-message';
      
              // Ask whether to try again
              const tryAgain = window.confirm('An error occurred while parsing the JSON data. Would you like to try again?');
              if (tryAgain) {
                  // Trigger the game initialization again (you may want to wrap this in a function)
                  document.getElementById('initializeGame').click();
              }
        });
    } else {
        // Update the message area to notify the user to enter an API key
        const statusMessage = document.getElementById('statusMessage');
        statusMessage.textContent = 'Please enter an API key.';
        statusMessage.className = 'invalid-message';
    }
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

