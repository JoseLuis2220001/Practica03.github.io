// Variables globales
let isFirstClick = true;
let gameOver = false;
let currentLevel = '';
let currentCols = 0;
let currentRows = 0;
let flagCount = 0; 
let minesLeft = 0; 
let totalMines = 0;
let timerInterval;
let timeElapsed = 0;
let board = []; // Definimos el tablero a nivel global

// Función para iniciar el juego
function startGame(level, cols = 5, rows = 5, customMines = null) {
    document.getElementById("levelSelection").style.display = "none";
    document.getElementById("homeButton").style.display = "block";
    document.getElementById("gameBoardContainer").style.display = "flex";
    document.getElementById("gameInfo").style.display = "flex";
    
    // Asegúrate de ocultar el modal al inicio del juego
    document.getElementById("gameOverModal").style.display = "none";

    currentLevel = level;
    gameOver = false; // Reinicia el estado del juego

    if (level === 'custom') {
        cols = parseInt(document.getElementById("customCols").value);
        rows = parseInt(document.getElementById("customRows").value);
        const minePercentage = parseInt(document.getElementById("customMines").value) / 100;
        totalMines = Math.round(cols * rows * minePercentage);
    } else {
        switch (level) {
            case 'easy':
                cols = 5; rows = 5; totalMines = 6;
                break;
            case 'medium':
                cols = 8; rows = 8; totalMines = 9;
                break;
            case 'hard':
                cols = 16; rows = 16; totalMines = 40;
                break;
            case 'hardcore':
                cols = 30; rows = 16; totalMines = 99;
                break;
            case 'legend':
                cols = 30; rows = 24; totalMines = 130;
                break;
            default:
                console.error("Nivel no válido seleccionado");
                return;
        }
    }

    currentCols = cols;
    currentRows = rows;

    flagCount = totalMines;
    minesLeft = totalMines;
    document.getElementById("currentLevelName").textContent = level.charAt(0).toUpperCase() + level.slice(1);
    document.getElementById("mineCounter").textContent = flagCount;

    resetTimer();
    isFirstClick = true;

    initializeBoard(cols, rows);
}

// Función para mostrar el modal de "Juego terminado"
function showGameOver(message) {
    if (!gameOver) return; // Asegúrate de que solo se muestre si el juego realmente ha terminado
    const modal = document.getElementById("gameOverModal");
    const modalMessage = document.getElementById("modalMessage");
    modalMessage.textContent = message;
    modal.style.display = 'flex';
}

// Función para finalizar el juego al perder o ganar
function handleCellClick(row, col) {
    if (gameOver) return;

    const cell = board[row][col];

    if (isFirstClick) {
        isFirstClick = false;
        startTimer();

        placeMines(row, col); 
        revealCell(row, col);
    } else {
        if (cell.revealed || cell.mark === 1) return;

        if (cell.mine) {
            gameOver = true;
            stopTimer();
            revealBoard(false); // Revela todo el tablero al perder
            showGameOver("Juego terminado!"); // Llama a showGameOver solo si realmente se perdió el juego
            return;
        }

        revealCell(row, col);
    }

    checkWinCondition();
}

// Función para verificar la condición de victoria
function checkWinCondition() {
    let hasWon = true;
    board.forEach(row => {
        row.forEach(cell => {
            if (!cell.mine && !cell.revealed) {
                hasWon = false;
            }
        });
    });

    if (hasWon && minesLeft === 0) { 
        gameOver = true;
        stopTimer();
        showGameOver("You Win!"); // Solo se muestra el modal si realmente ganaste
    }
}

// Función para colocar minas en el tablero, excluyendo la primera celda seleccionada
function placeMines(excludeRow, excludeCol) {
    let placedMines = 0;

    while (placedMines < totalMines) {
        const row = Math.floor(Math.random() * currentRows);
        const col = Math.floor(Math.random() * currentCols);

        const cell = board[row][col];

        if ((row === excludeRow && col === excludeCol) || isAdjacentTo(row, col, excludeRow, excludeCol) || cell.mine) continue;

        cell.mine = true;
        placedMines++;
    }
}

// Función para verificar si una celda es adyacente a la posición del primer clic
function isAdjacentTo(row, col, excludeRow, excludeCol) {
    return (
        row >= excludeRow - 1 && row <= excludeRow + 1 &&
        col >= excludeCol - 1 && col <= excludeCol + 1
    );
}

// Función para alternar banderas y signos de interrogación en las celdas
function handleRightClick(row, col) {
    if (gameOver) return;

    const cell = board[row][col];
    const cellElement = document.querySelector(`.cell[data-row='${row}'][data-col='${col}']`);

    if (cell.revealed) return;

    if (isFirstClick) {
        isFirstClick = false;
        startTimer();
        placeMines(row, col); 
    }

    if (cell.mark === 0) {
        cell.mark = 1;
        cellElement.textContent = "🚩";
        flagCount--; 
        if (cell.mine) minesLeft--;
    } else if (cell.mark === 1) {
        cell.mark = 2;
        cellElement.textContent = "?";
        flagCount++; 
        if (cell.mine) minesLeft++; 
    } else {
        cell.mark = 0;
        cellElement.textContent = "";
    }

    document.getElementById("mineCounter").textContent = flagCount; 

    checkWinCondition(); 
}

// Inicializa el tablero y los datos de cada celda
function initializeBoard(cols, rows) {
    board = [];
    for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
            row.push({ revealed: false, mine: false, neighborMines: 0, mark: 0 });
        }
        board.push(row);
    }
    renderBoard();
}

// Función para mostrar el tablero en la interfaz
function renderBoard() {
    const gameBoard = document.getElementById('game-board');
    gameBoard.innerHTML = '';
    gameBoard.style.gridTemplateColumns = `repeat(${currentCols}, 30px)`;
    gameBoard.style.gridTemplateRows = `repeat(${currentRows}, 30px)`;

    board.forEach((row, r) => {
        row.forEach((cell, c) => {
            const cellElement = document.createElement('div');
            cellElement.classList.add('cell');
            cellElement.dataset.row = r;
            cellElement.dataset.col = c;

            cellElement.addEventListener('click', () => {
                handleCellClick(r, c);
            });

            cellElement.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                handleRightClick(r, c);
            });

            gameBoard.appendChild(cellElement);
        });
    });
}

// Función para iniciar el cronómetro
function startTimer() {
    timerInterval = setInterval(() => {
        timeElapsed++;

        const hours = Math.floor(timeElapsed / 3600);
        const minutes = Math.floor((timeElapsed % 3600) / 60);
        const seconds = timeElapsed % 60;

        const formattedTime = 
            String(hours).padStart(2, '0') + ':' +
            String(minutes).padStart(2, '0') + ':' +
            String(seconds).padStart(2, '0');

        document.getElementById("timeCounter").textContent = formattedTime;
    }, 1000);
}

// Reinicia el cronómetro
function resetTimer() {
    clearInterval(timerInterval);
    timeElapsed = 0;
    document.getElementById("timeCounter").textContent = "00:00:00";
}

// Detiene el cronómetro
function stopTimer() {
    clearInterval(timerInterval);
}

// Función para destapar celdas
function revealCell(row, col) {
    if (row < 0 || col < 0 || row >= currentRows || col >= currentCols) return;

    const cell = board[row][col];
    if (cell.revealed || cell.mine || cell.mark === 1) return;

    cell.revealed = true;
    const cellElement = document.querySelector(`.cell[data-row='${row}'][data-col='${col}']`);
    cellElement.classList.add('revealed');
    const neighbors = countNeighborMines(row, col);

    if (neighbors > 0) {
        cellElement.textContent = neighbors;
    } else {
        revealCell(row - 1, col);
        revealCell(row + 1, col);
        revealCell(row, col - 1);
        revealCell(row, col + 1);
        revealCell(row - 1, col - 1);
        revealCell(row - 1, col + 1);
        revealCell(row + 1, col - 1);
        revealCell(row + 1, col + 1);
    }
}

// Función para contar minas adyacentes
function countNeighborMines(row, col) {
    let mineCount = 0;
    for (let r = row - 1; r <= row + 1; r++) {
        for (let c = col - 1; c <= col + 1; c++) {
            if (r >= 0 && r < currentRows && c >= 0 && c < currentCols) {
                if (board[r][c].mine) mineCount++;
            }
        }
    }
    return mineCount;
}

// Oculta el modal de "Juego terminado" y reinicia el juego
function restartGame() {
    closeGameOver(); 
    resetTimer();
    startGame(currentLevel, currentCols, currentRows);
}

// Función para cerrar el modal
function closeGameOver() {
    document.getElementById("gameOverModal").style.display = "none";
}
