const boardElement = document.getElementById('board');
const notationDisplay = document.getElementById('notationDisplay');
const errorDisplay = document.createElement('div');
errorDisplay.id = 'errorDisplay';
document.body.appendChild(errorDisplay);

let board = [];
let currentPlayer = 'white';

const pieces = {
    'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚', 'p': '♟',
    'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔', 'P': '♙'
};

const initialBoard = [
    ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
    ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
    ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
];

function setupBoard() {
    if (board.length === 0) {
        board = initialBoard.map(row => [...row]);
    }
    boardElement.innerHTML = '';
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            square.classList.add('square', (row + col) % 2 === 0 ? 'light' : 'dark');
            square.dataset.row = row;
            square.dataset.col = col;
            if (board[row][col]) {
                square.textContent = pieces[board[row][col]];
            }
            square.addEventListener('dragover', allowDrop);
            square.addEventListener('drop', drop);
            if (square.textContent) {
                square.draggable = true;
                square.addEventListener('dragstart', drag);
            }
            boardElement.appendChild(square);
        }
    }
}

function drag(event) {
    event.dataTransfer.setData('text', event.target.dataset.row + ',' + event.target.dataset.col);
}

function allowDrop(event) {
    event.preventDefault();
}

function drop(event) {
    event.preventDefault();
    const data = event.dataTransfer.getData('text').split(',');
    const fromRow = parseInt(data[0]);
    const fromCol = parseInt(data[1]);
    const toRow = parseInt(event.target.dataset.row);
    const toCol = parseInt(event.target.dataset.col);

    if (isValidMove(fromRow, fromCol, toRow, toCol)) {
        makeMoveOnBoard(fromRow, fromCol, toRow, toCol);
        displayNotation(fromRow, fromCol, toRow, toCol);
        switchPlayer();
    } else {
        displayError('Invalid move');
    }
}

function isValidMove(fromRow, fromCol, toRow, toCol) {
    // Simplified validation for the sake of this example
    return true;
}

function makeMoveOnBoard(fromRow, fromCol, toRow, toCol) {
    board[toRow][toCol] = board[fromRow][fromCol];
    board[fromRow][fromCol] = '';
    setupBoard();
}

function displayNotation(fromRow, fromCol, toRow, toCol) {
    const moveNotation = `${String.fromCharCode(97 + fromCol)}${8 - fromRow}-${String.fromCharCode(97 + toCol)}${8 - toRow}`;
    notationDisplay.textContent += `${currentPlayer}: ${moveNotation}\n`;
}

function switchPlayer() {
    currentPlayer = currentPlayer === 'white' ? 'black' : 'white';
}

function makeMove() {
    const notationInput = document.getElementById('notationInput').value;
    const move = parseNotation(notationInput);
    if (move) {
        makeMoveOnBoard(move.fromRow, move.fromCol, move.toRow, move.toCol);
        displayNotation(move.fromRow, move.fromCol, move.toRow, move.toCol);
        switchPlayer();
        clearError();
    } else {
        displayError('Invalid notation');
    }
}

function parseNotation(notation) {
    const pieceRegex = /^[KQRBN]?([a-h][1-8])[x-]?([a-h][1-8])$/;
    const pawnCaptureRegex = /^([a-h])x([a-h][1-8])$/;
    const simpleMoveRegex = /^([a-h][1-8])-([a-h][1-8])$/;
    
    let match;
    if ((match = notation.match(pieceRegex)) || (match = notation.match(pawnCaptureRegex)) || (match = notation.match(simpleMoveRegex))) {
        const from = match[1];
        const to = match[2];
        const fromCol = from.length === 2 ? from.charCodeAt(0) - 97 : notation.charCodeAt(0) - 97;
        const fromRow = from.length === 2 ? 8 - parseInt(from[1]) : -1;
        const toCol = to.charCodeAt(0) - 97;
        const toRow = 8 - parseInt(to[1]);
        return { fromRow, fromCol, toRow, toCol };
    }
    return null;
}

function displayError(message) {
    errorDisplay.textContent = message;
    errorDisplay.style.display = 'block';
}

function clearError() {
    errorDisplay.style.display = 'none';
}

setupBoard();
