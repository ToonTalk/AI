window.onload = function() {
    // Initialize scores
    var flowersCollected = 0;
    var flowersMissed = 0;

    // Get the garden and its dimensions
    var garden = document.getElementById('garden');
    var gardenWidth = garden.offsetWidth;
    var gardenHeight = garden.offsetHeight;

    // Function to create a new flower
    function createFlower() {
        var flower = document.createElement('div');
        flower.className = 'flower';

        // Randomly select a flower emoji
        var flowers = ['🌹', '🌼', '🌻'];
        flower.innerText = flowers[Math.floor(Math.random() * flowers.length)];

        // Randomly set the initial left position
        flower.style.left = Math.random() * gardenWidth + 'px';

        flower.style.animationDuration = Math.random() * 10 + 5 + 's';  // Fall duration between 5 and 15 seconds
        return flower;
    }

    // Function to start a flower's fall
    function startFall(flower) {
        // When the flower is clicked, remove it and update score
        flower.onclick = function() {
            //garden.removeChild(this);
            flowersCollected++;
            document.getElementById('collected').innerText = 'Flowers Collected: ' + flowersCollected;

            // Create a new flower to replace the one that was clicked
            var newFlower = createFlower();
            garden.appendChild(newFlower);
            startFall(newFlower);
            // Add the fly class to the flower
            this.classList.add('fly');
        };

        // When the animation ends, check if the flower was missed
        flower.addEventListener('animationend', function() {
            // Check if the flower has gone below the screen and has not been clicked
            if (this.getBoundingClientRect().top > gardenHeight && this.parentElement.id === 'garden') {
                flowersMissed++;
                document.getElementById('missed').innerText = 'Flowers Missed: ' + flowersMissed;

                // Check if more than 5 flowers are missed
                if (flowersMissed > 5) {
                    // Display game over message
                    alert('Game Over since you missed too many flowers');

                    // Stop the game
                    for (var i = 0; i < garden.children.length; i++) {
                        garden.children[i].style.animationPlayState = 'paused';
                    }
                }
            }
        });
    }

    // Create initial flowers
    for (var i = 0; i < 10; i++) {  // Adjust the number of initial flowers as needed
        var flower = createFlower();
        garden.appendChild(flower);
        startFall(flower);
    }
};

