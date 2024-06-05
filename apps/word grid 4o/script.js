document.addEventListener('DOMContentLoaded', function() {
  const grid = document.getElementById('grid');
  const scoreDisplay = document.getElementById('score');
  const gridSize = 10;
  const allFoodWords = ["APPLE", "BANANA", "CHERRY", "DATE", "EGGPLANT", "FIG", "GRAPE", "HONEYDEW", "KIWI", "LEMON", "MANGO", "NECTARINE", "ORANGE", "PAPAYA", "QUINCE", "RASPBERRY", "STRAWBERRY", "TOMATO", "UGLI", "VANILLA", "WATERMELON", "XIGUA", "YAM", "ZUCCHINI"];
  let words = getRandomWords(allFoodWords, 4);
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let matrix = Array.from({length: gridSize}, () => new Array(gridSize).fill(''));
  let selectedCells = [];
  let score = 0;

  function getRandomWords(wordList, count) {
    let selectedWords = [];
    while (selectedWords.length < count) {
      const randomIndex = Math.floor(Math.random() * wordList.length);
      const word = wordList[randomIndex];
      if (!selectedWords.includes(word)) {
        selectedWords.push(word);
      }
    }
    return selectedWords;
  }

  function placeWords() {
    words.forEach(word => {
      let placed = false;
      while (!placed) {
        let vertical = Math.random() > 0.5;
        let row = Math.floor(Math.random() * gridSize);
        let col = Math.floor(Math.random() * gridSize);
        let spaceAvailable = true;

        for (let i = 0; i < word.length; i++) {
          let newRow = row + (vertical ? i : 0);
          let newCol = col + (vertical ? 0 : i);
          if (newRow >= gridSize || newCol >= gridSize || (matrix[newRow][newCol] !== '' && matrix[newRow][newCol] !== word[i])) {
            spaceAvailable = false;
            break;
          }
        }

        if (spaceAvailable) {
          for (let i = 0; i < word.length; i++) {
            matrix[row + (vertical ? i : 0)][col + (vertical ? 0 : i)] = word[i];
          }
          placed = true;
        }
      }
    });
  }

  function fillEmptySpaces() {
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        if (matrix[row][col] === '') {
          matrix[row][col] = letters.charAt(Math.floor(Math.random() * letters.length));
        }
      }
    }
  }

  function drawGrid() {
    for (let row = 0; row < gridSize; row++) {
      const tr = grid.insertRow();
      for (let col = 0; col < gridSize; col++) {
        const td = tr.insertCell();
        td.textContent = matrix[row][col];
        td.addEventListener('click', () => handleCellClick(td, row, col));
      }
    }
  }

  function handleCellClick(cell, row, col) {
    if (cell.classList.contains('selected')) {
      cell.classList.remove('selected');
      selectedCells = selectedCells.filter(([r, c]) => r !== row || c !== col);
    } else {
      cell.classList.add('selected');
      selectedCells.push([row, col]);
    }
    checkForWord();
  }

  function checkForWord() {
    const selectedWord = selectedCells.map(([row, col]) => matrix[row][col]).join('');
    if (words.includes(selectedWord)) {
      score++;
      scoreDisplay.textContent = score;
      alert(`You found a word: ${selectedWord}`);
      selectedCells.forEach(([row, col]) => {
        const cell = grid.rows[row].cells[col];
        cell.classList.remove('selected');
        cell.classList.add('found');
      });
      selectedCells = [];
    }
  }

  words = getRandomWords(allFoodWords, 4);
  placeWords();
  fillEmptySpaces();
  drawGrid();
});
