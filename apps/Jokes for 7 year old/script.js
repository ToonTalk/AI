// script.js
document.addEventListener('DOMContentLoaded', () => {
    const pages = [
        { link: "Sallys_Joke_App.html", caption: "I like jokes" },
        { link: "Sallys_Horse_Joke_Quiz.html", caption: "jokes about horses [...] can we let the person try to answer before showing the answer" },
        { link: "Sallys_Talking_Horse_Joke_Quiz.html", caption: "can the page speak" },
        { link: "Sallys_Talking_Horse_Joke_Quiz_With_Image.html", caption: "can we add a cartoon picture of a horse to it" },
        { link: "Sallys_Talking_Horse_Joke_Quiz_With_More_Jokes.html", caption: "can we add more jokes please?" },
        { link: "Sallys_Talking_Horse_Joke_Quiz_With_More_Jokes_With_Sound.html", caption: "what can we do next? [6 ideas presented] sound effects [...] where can I find a sound of a horse laughing" }
    ];

    let currentIndex = 0;

    function updateDisplay() {
        document.getElementById('pageIframe').src = pages[currentIndex].link;
        document.getElementById('urlCaption').textContent = pages[currentIndex].caption;
    }

    function navigate(direction) {
        if (direction === 'next') {
            currentIndex = (currentIndex + 1) % pages.length;
        } else if (direction === 'prev') {
            currentIndex = (currentIndex - 1 + pages.length) % pages.length;
        }
        updateDisplay();
    }

    document.getElementById('nextButton').addEventListener('click', () => navigate('next'));
    document.getElementById('prevButton').addEventListener('click', () => navigate('prev'));

    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') {
            navigate('next');
        } else if (e.key === 'ArrowLeft') {
            navigate('prev');
        }
    });

    updateDisplay();
});