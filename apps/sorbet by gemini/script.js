document.addEventListener('DOMContentLoaded', () => {
    // --- ICON REPLACEMENT ---
    lucide.createIcons();

    // --- DOM ELEMENTS ---
    const dom = {
        app: document.getElementById('app-container'),
        gameView: document.getElementById('game-view'),
        settingsView: document.getElementById('settings-view'),
        instructionsView: document.getElementById('instructions-view'),
        gameArea: document.getElementById('game-area'),
        containersWrapper: document.getElementById('containers-wrapper'),
        gameTitle: document.getElementById('game-title'),
        scoreDisplay: document.getElementById('score'),
        livesDisplay: document.getElementById('lives'),
        gameStats: document.getElementById('game-stats'),
        pauseButton: document.getElementById('pause-button'),
        menuOverlay: document.getElementById('menu-overlay'),
        pauseOverlay: document.getElementById('pause-overlay'),
        gameOverOverlay: document.getElementById('game-over-overlay'),
        finalScoreDisplay: document.getElementById('final-score'),
        feedbackMessage: document.getElementById('feedback-message'),
        settingsContent: document.getElementById('settings-content'),
    };

    // --- GAME STATE ---
    let state = {
        gameState: 'menu', // 'menu', 'playing', 'paused', 'gameOver'
        score: 0,
        lives: 5,
        gameSpeed: 1,
        itemAppearanceCount: {}, // Tracks how many times each item has appeared
        currentDataSet: 'trash',
        fallingObjects: [],
        containers: [],
        dataSets: {
            trash: {
                name: 'Trash Degradation Time',
                categories: [
                    { id: 'weeks', name: 'Weeks to Months', color: '#22c55e' },
                    { id: 'years', name: '1-10 Years', color: '#eab308' },
                    { id: 'decades', name: '10+ Years', color: '#ef4444' }
                ],
                items: [
                    { id: 1, name: 'Apple Core', category: 'weeks', imageUrl: 'https://i.imgur.com/u1qYJ0m.png' },
                    { id: 2, name: 'Paper Bag', category: 'weeks', imageUrl: 'https://i.imgur.com/GTnJ1Gk.png' },
                    { id: 3, name: 'Orange Peel', category: 'weeks', imageUrl: 'https://i.imgur.com/uVwVLsW.png' },
                    { id: 4, name: 'Cigarette Butt', category: 'years', imageUrl: 'https://i.imgur.com/dLLZzxy.png' },
                    { id: 5, name: 'Plastic Bag', category: 'decades', imageUrl: 'https://i.imgur.com/s6p4R1C.png' },
                    { id: 6, name: 'Aluminum Can', category: 'decades', imageUrl: 'https://i.imgur.com/9lV8iJt.png' },
                    { id: 7, name: 'Glass Bottle', category: 'decades', imageUrl: 'https://i.imgur.com/3Cv1J2P.png' },
                    { id: 8, name: 'Plastic Bottle', category: 'decades', imageUrl: 'https://i.imgur.com/dSS5S4c.png' }
                ]
            },
            art: {
                name: 'Art Movements',
                categories: [
                    { id: 'classical', name: 'Classical (Pre-1800)', color: '#3b82f6' },
                    { id: 'modern', name: 'Modern (1800-1945)', color: '#8b5cf6' },
                    { id: 'contemporary', name: 'Contemporary (1945+)', color: '#ec4899' }
                ],
                items: [
                    { id: 9, name: 'Mona Lisa', category: 'classical', imageUrl: 'https://i.imgur.com/2sVpqtQ.jpg' },
                    { id: 10, name: 'The Starry Night', category: 'modern', imageUrl: 'https://i.imgur.com/G5231s1.jpg' },
                    { id: 11, name: 'Campbell\'s Soup Cans', category: 'contemporary', imageUrl: 'https://i.imgur.com/QkR4DGr.jpg' },
                    { id: 12, name: 'The Birth of Venus', category: 'classical', imageUrl: 'https://i.imgur.com/0sE8v5k.jpg' },
                    { id: 13, name: 'Les Demoiselles d\'Avignon', category: 'modern', imageUrl: 'https://i.imgur.com/sYn8xS2.jpg' },
                    { id: 14, name: 'Girl with a Pearl Earring', category: 'classical', imageUrl: 'https://i.imgur.com/A4b2n5I.jpg' },
                    { id: 15, name: 'The Persistence of Memory', category: 'modern', imageUrl: 'https://i.imgur.com/TCp5X4h.jpg' }
                ]
            }
        },
    };

    // --- DRAG STATE ---
    let dragState = {
        isDragging: false,
        draggedElement: null,
        objId: null,
        offsetX: 0,
        offsetY: 0,
    };
    
    // --- GAME LOOP & TIMING ---
    let animationFrameId = null;
    let lastSpawnTime = 0;
    
    // --- RENDERING FUNCTIONS ---
    
    const renderHeader = () => {
        const currentData = state.dataSets[state.currentDataSet];
        if (!currentData) { // Handle case where dataset is deleted
             state.currentDataSet = Object.keys(state.dataSets)[0];
             if (!state.currentDataSet) return; // No datasets left
             renderHeader();
             return;
        }
        dom.gameTitle.textContent = currentData.name;
        dom.scoreDisplay.textContent = `Score: ${state.score}`;
        
        dom.livesDisplay.innerHTML = '';
        for (let i = 0; i < 5; i++) {
            const heart = document.createElement('span');
            heart.innerHTML = i < state.lives ? '<i data-lucide="heart" class="heart"></i>' : '<i data-lucide="heart" class="heart empty"></i>';
            dom.livesDisplay.appendChild(heart);
        }
        lucide.createIcons();
    };

    const renderContainers = () => {
        const currentData = state.dataSets[state.currentDataSet];
        if (!currentData) return;
        state.containers = currentData.categories.map(cat => ({ ...cat, items: [] }));
        
        dom.containersWrapper.innerHTML = '';
        dom.containersWrapper.style.gridTemplateColumns = `repeat(${state.containers.length}, 1fr)`;
        
        state.containers.forEach(container => {
            const containerEl = document.createElement('div');
            containerEl.className = 'container';
            containerEl.innerHTML = `
                <div class="container-title" style="background-color: ${container.color};">${container.name}</div>
                <div class="container-droppable" data-container-id="${container.id}"></div>
            `;
            dom.containersWrapper.appendChild(containerEl);
        });
    };
    
    const renderFallingObjects = () => {
        dom.gameArea.querySelectorAll('.falling-item').forEach(el => el.remove());
        
        state.fallingObjects.forEach(obj => {
            const objEl = document.createElement('div');
            objEl.className = 'falling-item';
            objEl.dataset.id = obj.id;
            objEl.style.left = `${obj.x}px`;
            objEl.style.top = `${obj.y}px`;
            objEl.style.transform = `rotate(${obj.rotation}deg)`;
            
            if (obj.imageUrl) {
                objEl.innerHTML = `
                    <img src="${obj.imageUrl}" alt="${obj.name}" class="item-image" onerror="this.style.display='none'">
                    <span class="item-name">${obj.name}</span>`;
            } else {
                 objEl.innerHTML = `<span class="item-name">${obj.name}</span>`;
            }
            
            dom.gameArea.appendChild(objEl);
        });
    };

    const renderGameState = () => {
        // Overlays
        dom.menuOverlay.classList.toggle('hidden', state.gameState !== 'menu');
        dom.pauseOverlay.classList.toggle('hidden', state.gameState !== 'paused');
        dom.gameOverOverlay.classList.toggle('hidden', state.gameState !== 'gameOver');
        
        // Header
        dom.gameStats.classList.toggle('hidden', state.gameState === 'menu');
        dom.pauseButton.classList.toggle('hidden', state.gameState !== 'playing');
        
        if (state.gameState === 'gameOver') {
            dom.finalScoreDisplay.textContent = `Final Score: ${state.score}`;
        }
    };
    
    // --- GAME LOGIC ---
    
    const startGame = () => {
        const currentData = state.dataSets[state.currentDataSet];
        if (!currentData || currentData.items.length === 0) {
            alert('The current dataset has no items to sort. Please add items in the settings.');
            return;
        }
        state.gameState = 'playing';
        state.score = 0;
        state.lives = 5;
        state.fallingObjects = [];
        state.itemAppearanceCount = {}; // Reset the item counter for the new game
        lastSpawnTime = Date.now();
        renderHeader();
        renderContainers();
        renderGameState();
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(gameLoop);
    };
    
    const resetGame = () => {
        state.gameState = 'menu';
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        state.fallingObjects = [];
        renderFallingObjects();
        renderGameState();
        renderHeader();
        renderContainers();
    };

    const togglePause = () => {
        if (state.gameState === 'playing') {
            state.gameState = 'paused';
            dom.pauseButton.innerHTML = '<i data-lucide="play"></i><span>Resume</span>';
            lucide.createIcons();
            cancelAnimationFrame(animationFrameId);
            renderGameState();
        } else if (state.gameState === 'paused') {
            state.gameState = 'playing';
            dom.pauseButton.innerHTML = '<i data-lucide="pause"></i><span>Pause</span>';
            lucide.createIcons();
            animationFrameId = requestAnimationFrame(gameLoop);
            renderGameState();
        }
    };
    
    const spawnObject = () => {
        const currentData = state.dataSets[state.currentDataSet];
        if (!currentData || currentData.items.length === 0) return;

        const spawnInterval = 4000 / state.gameSpeed;
        if (Date.now() - lastSpawnTime > spawnInterval) {
            
            // Filter for items that are not on screen and have appeared less than twice
            const availableItems = currentData.items.filter(item => {
                const isNotOnScreen = !state.fallingObjects.some(obj => obj.id === item.id);
                const appearanceCount = state.itemAppearanceCount[item.id] || 0;
                return isNotOnScreen && appearanceCount < 2;
            });

            if (availableItems.length > 0) {
                const randomItem = availableItems[Math.floor(Math.random() * availableItems.length)];
                
                // Increment appearance count for the chosen item
                const itemId = randomItem.id;
                state.itemAppearanceCount[itemId] = (state.itemAppearanceCount[itemId] || 0) + 1;

                const newObject = {
                    ...randomItem,
                    domId: `obj_${Date.now()}`,
                    x: Math.random() * (dom.gameArea.clientWidth - 90),
                    y: -100,
                    rotation: Math.random() * 40 - 20,
                };
                state.fallingObjects.push(newObject);
                lastSpawnTime = Date.now();
            }
        }
    };
    
    const updateObjects = () => {
        const gameAreaHeight = dom.gameArea.clientHeight;
        const objectsToRemove = [];

        state.fallingObjects.forEach(obj => {
            if (dragState.objId !== obj.id) {
                obj.y += 1.2 * state.gameSpeed;
                obj.rotation += 0.5 * state.gameSpeed * (obj.rotation > 0 ? 1 : -1);
            }
            if (obj.y > gameAreaHeight) {
                objectsToRemove.push(obj.id);
                handleMissedObject();
            }
        });
        
        state.fallingObjects = state.fallingObjects.filter(obj => !objectsToRemove.includes(obj.id));
    };
    
    const handleMissedObject = () => {
        state.lives--;
        showFeedback('Missed!', 'wrong');
        renderHeader();
        if (state.lives <= 0) {
            state.gameState = 'gameOver';
            renderGameState();
        }
    };
    
    const checkDrop = (x, y) => {
        const droppedElement = state.fallingObjects.find(o => o.id === dragState.objId);
        if (!droppedElement) return;

        let droppedOnContainer = null;
        dom.containersWrapper.querySelectorAll('[data-container-id]').forEach(containerEl => {
            const rect = containerEl.getBoundingClientRect();
            if (x > rect.left && x < rect.right && y > rect.top && y < rect.bottom) {
                droppedOnContainer = state.containers.find(c => c.id === containerEl.dataset.containerId);
            }
        });
        
        if (droppedOnContainer) {
            if (droppedElement.category === droppedOnContainer.id) {
                // Correct drop
                state.score += 10;
                showFeedback('Correct! +10', 'correct');
                const container = state.containers.find(c => c.id === droppedOnContainer.id);
                container.items.push(droppedElement);
                updateSortedItems(droppedOnContainer.id, container.items);
            } else {
                // Wrong drop
                state.lives--;
                const correctContainer = state.containers.find(c => c.id === droppedElement.category);
                showFeedback(`Wrong! Belongs in "${correctContainer.name}"`, 'wrong');
            }
            
            state.fallingObjects = state.fallingObjects.filter(obj => obj.id !== droppedElement.id);
            renderHeader();
            if (state.lives <= 0) {
                state.gameState = 'gameOver';
                renderGameState();
            }
        }
    };

    const updateSortedItems = (containerId, items) => {
        const containerEl = dom.containersWrapper.querySelector(`[data-container-id="${containerId}"]`);
        if (!containerEl) return;

        containerEl.innerHTML = ''; // Clear previous items
        items.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'sorted-item';
            let imgHtml = '';
            if (item.imageUrl) {
                imgHtml = `<img src="${item.imageUrl}" class="sorted-item-img" alt="${item.name}" onerror="this.style.display='none'"/>`;
            }
            itemEl.innerHTML = `${imgHtml}<span>${item.name}</span>`;
            containerEl.appendChild(itemEl);
        });

        containerEl.classList.toggle('has-items', items.length > 0);
    };

    let feedbackTimeout;
    const showFeedback = (message, type) => {
        clearTimeout(feedbackTimeout);
        dom.feedbackMessage.textContent = message;
        dom.feedbackMessage.className = `feedback ${type} show`;
        feedbackTimeout = setTimeout(() => {
            dom.feedbackMessage.classList.remove('show');
        }, 2000);
    };

    // --- GAME LOOP ---
    const gameLoop = () => {
        if (state.gameState !== 'playing') {
            cancelAnimationFrame(animationFrameId);
            return;
        }
        
        spawnObject();
        updateObjects();
        renderFallingObjects();
        
        animationFrameId = requestAnimationFrame(gameLoop);
    };
    
    // --- EVENT HANDLERS ---
    
    const handleMouseDown = (e) => {
        const target = e.target.closest('.falling-item');
        if (!target || state.gameState !== 'playing') return;
        
        e.preventDefault();
        const objId = parseInt(target.dataset.id);
        const obj = state.fallingObjects.find(o => o.id === objId);
        if (!obj) return;

        dragState.isDragging = true;
        dragState.draggedElement = target;
        dragState.objId = obj.id;
        
        const rect = target.getBoundingClientRect();
        dragState.offsetX = e.clientX - rect.left;
        dragState.offsetY = e.clientY - rect.top;
        
        target.classList.add('is-dragging');
        target.style.transform = ''; // Remove rotation while dragging
    };
    
    const handleMouseMove = (e) => {
        if (!dragState.isDragging || !dragState.draggedElement) return;
        
        e.preventDefault();
        const gameAreaRect = dom.gameArea.getBoundingClientRect();
        
        let x = e.clientX - gameAreaRect.left - dragState.offsetX;
        let y = e.clientY - gameAreaRect.top - dragState.offsetY;

        // Constrain to game area
        x = Math.max(0, Math.min(x, gameAreaRect.width - dragState.draggedElement.offsetWidth));
        y = Math.max(0, Math.min(y, gameAreaRect.height - dragState.draggedElement.offsetHeight));
        
        dragState.draggedElement.style.left = `${x}px`;
        dragState.draggedElement.style.top = `${y}px`;
        
        const obj = state.fallingObjects.find(o => o.id === dragState.objId);
        if (obj) {
            obj.x = x;
            obj.y = y;
        }
    };
    
    const handleMouseUp = (e) => {
        if (!dragState.isDragging) return;
        
        checkDrop(e.clientX, e.clientY);
        
        dragState.draggedElement?.classList.remove('is-dragging');
        dragState.isDragging = false;
        dragState.draggedElement = null;
        dragState.objId = null;
    };
    
    const handleAppClick = (e) => {
        const target = e.target.closest('[data-action]');
        if (!target) return;
        
        const action = target.dataset.action;
        
        switch(action) {
            case 'start': startGame(); break;
            case 'reset': resetGame(); break;
            case 'toggle-pause': togglePause(); break;
            case 'show-settings': showView('settings'); break;
            case 'show-instructions': showView('instructions'); break;
            case 'show-game': showView('game'); break;
            case 'add-item':
                {
                    const nameInput = document.getElementById('new-item-name');
                    const fileInput = document.getElementById('new-item-image');
                    const categoryInput = document.getElementById('new-item-category');
                    
                    const name = nameInput.value.trim();
                    if (!name) {
                        alert('Please enter an item name.');
                        return;
                    }

                    const file = fileInput.files[0];
                    const category = categoryInput.value;

                    const addNewItem = (imageUrl) => {
                        const newItem = {
                            id: Date.now(),
                            name: name,
                            category: category,
                            imageUrl: imageUrl || ''
                        };
                        state.dataSets[state.currentDataSet].items.push(newItem);
                        renderSettings();
                    };

                    if (file) {
                        // **FIX:** Use FileReader to get a persistent Data URL
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            addNewItem(e.target.result); // e.target.result contains the data: URL
                        };
                        reader.readAsDataURL(file);
                    } else {
                        addNewItem(null);
                    }
                }
                break;
            case 'delete-item':
                {
                    const itemId = parseInt(target.dataset.itemId);
                    const currentItems = state.dataSets[state.currentDataSet].items;
                    state.dataSets[state.currentDataSet].items = currentItems.filter(item => item.id !== itemId);
                    renderSettings();
                }
                break;
            case 'save-dataset':
                {
                    const currentData = state.dataSets[state.currentDataSet];
                    const jsonString = JSON.stringify(currentData, null, 2);
                    const blob = new Blob([jsonString], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `dataset-${currentData.name.toLowerCase().replace(/\s+/g, '-')}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }
                break;
            case 'load-dataset':
                {
                    document.getElementById('load-file-input').click();
                }
                break;
        }
    };
    
    const handleFileLoad = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const loadedDataset = JSON.parse(e.target.result);
                // Basic validation
                if (loadedDataset.name && loadedDataset.categories && loadedDataset.items) {
                    const datasetKey = `loaded_${Date.now()}`;
                    state.dataSets[datasetKey] = loadedDataset;
                    state.currentDataSet = datasetKey;
                    alert(`Dataset "${loadedDataset.name}" loaded successfully!`);
                    renderSettings();
                    resetGame();
                } else {
                    alert('Invalid dataset file. Missing required properties.');
                }
            } catch (error) {
                alert('Failed to parse the file. Please make sure it is a valid JSON dataset file.');
                console.error("File parsing error:", error);
            }
        };
        reader.readAsText(file);
        // Clear the input so the same file can be loaded again
        event.target.value = '';
    };

    // --- VIEW MANAGEMENT ---
    const showView = (view) => {
        dom.gameView.classList.add('hidden');
        dom.settingsView.classList.add('hidden');
        dom.instructionsView.classList.add('hidden');
        
        if (view === 'game') dom.gameView.classList.remove('hidden');
        else if (view === 'settings') {
            renderSettings();
            dom.settingsView.classList.remove('hidden');
        }
        else if (view === 'instructions') dom.instructionsView.classList.remove('hidden');
    };

    // --- SETTINGS LOGIC ---
    const renderSettings = () => {
        const currentData = state.dataSets[state.currentDataSet];

        dom.settingsContent.innerHTML = `
            <div class="settings-section">
                <div class="settings-section-header"><h3>Dataset</h3></div>
                <div class="form-group">
                    <select id="dataset-select">
                        ${Object.entries(state.dataSets).map(([key, ds]) => 
                            `<option value="${key}" ${state.currentDataSet === key ? 'selected' : ''}>${ds.name}</option>`
                        ).join('')}
                    </select>
                    <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                        <button class="button button-green" data-action="save-dataset" style="flex-grow:1;"><i data-lucide="save"></i>Save Current</button>
                        <button class="button button-blue" data-action="load-dataset" style="flex-grow:1;"><i data-lucide="folder-open"></i>Load from File</button>
                    </div>
                    <input type="file" id="load-file-input" class="hidden" accept=".json">
                </div>
            </div>

            <div class="settings-section">
                <div class="settings-section-header"><h3>Game Speed</h3></div>
                <div class="form-group">
                    <input type="range" id="speed-slider" min="0.5" max="2.5" step="0.1" value="${state.gameSpeed}">
                    <span id="speed-value">${state.gameSpeed}x</span>
                </div>
            </div>

            <div class="settings-section">
                <div class="settings-section-header"><h3>Items for ${currentData.name}</h3></div>
                <div id="items-list" class="form-group" style="max-height: 200px; overflow-y: auto; gap: 0.5rem;">
                    ${currentData.items.map(item => `
                        <div class="list-item">
                           ${item.imageUrl ? `<img src="${item.imageUrl}" class="sorted-item-img" />` : '<div class="sorted-item-img" style="background: #eee;"></div>'}
                           <span style="flex-grow: 1;">${item.name}</span>
                           <button class="button button-icon danger" data-action="delete-item" data-item-id="${item.id}"><i data-lucide="trash-2" style="pointer-events:none;"></i></button>
                        </div>
                    `).join('') || '<p>No items in this dataset yet.</p>'}
                </div>
                <hr style="margin: 1rem 0;" />
                <div class="form-group">
                    <h4>Add New Item</h4>
                    <input type="text" id="new-item-name" placeholder="Item Name">
                    <select id="new-item-category">
                        ${currentData.categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('')}
                    </select>
                    <label for="new-item-image">Image (optional):</label>
                    <input type="file" id="new-item-image" accept="image/*">
                    <button class="button button-purple" data-action="add-item" style="align-self: flex-start;">
                        <i data-lucide="plus"></i><span>Add Item</span>
                    </button>
                </div>
            </div>
        `;
        lucide.createIcons();

        // Add event listeners for settings controls
        document.getElementById('dataset-select').addEventListener('change', (e) => {
            state.currentDataSet = e.target.value;
            renderSettings();
            resetGame();
        });
        
        document.getElementById('load-file-input').addEventListener('change', handleFileLoad);
        
        const speedSlider = document.getElementById('speed-slider');
        const speedValue = document.getElementById('speed-value');
        speedSlider.addEventListener('input', (e) => {
            state.gameSpeed = parseFloat(e.target.value);
            speedValue.textContent = `${state.gameSpeed.toFixed(1)}x`;
        });
    };
    
    // --- INITIALIZATION ---
    const init = () => {
        // Global Listeners
        dom.app.addEventListener('click', handleAppClick);
        dom.gameArea.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        
        // Initial Render
        resetGame();
    };

    init();
});