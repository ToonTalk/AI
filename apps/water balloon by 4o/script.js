
const balloon = document.getElementById('balloon');
let gameArea = document.getElementById('gameArea');
let flowers = document.getElementsByClassName('flower');

document.body.addEventListener('click', function(event) {
    let x = event.clientX;
    let y = event.clientY;
    
    // Set balloon position
    balloon.style.display = 'block';
    balloon.style.left = (x - 15) + 'px';
    balloon.style.top = '0px';
    
    // Start balloon drop
    let dropInterval = setInterval(function() {
        let currentTop = parseInt(balloon.style.top);
        balloon.style.top = (currentTop + 5) + 'px';
        
        // Check if balloon hits a flower
        for (let flower of flowers) {
            let flowerRect = flower.getBoundingClientRect();
            let balloonRect = balloon.getBoundingClientRect();
            
            if (balloonRect.top + balloonRect.height >= flowerRect.top &&
                balloonRect.left + balloonRect.width >= flowerRect.left &&
                balloonRect.left <= flowerRect.right) {
                
                flower.style.transform = 'scale(1.5)';
                flower.style.color = 'initial';  // Reset color
                setTimeout(() => {
                    flower.style.transform = 'scale(1)';
                }, 300);
                
                clearInterval(dropInterval);
                balloon.style.display = 'none';
            }
        }
        
        // Check if balloon is out of bounds
        if (currentTop > window.innerHeight) {
            clearInterval(dropInterval);
            balloon.style.display = 'none';
        }
    }, 20);
});

// Flowers slowly shrink and turn gray over time if not hit
setInterval(function() {
    for (let flower of flowers) {
        let currentSize = parseFloat(getComputedStyle(flower).fontSize);
        if (currentSize > 30) {
            flower.style.fontSize = (currentSize - 0.2) + 'px';
        }
        flower.style.color = 'gray';
    }
}, 1000);
