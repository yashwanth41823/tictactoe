
/*
    Tic Tac Toe game logic.
*/

// Get all 9 cells from the game board.
const cells = document.querySelectorAll(".cell");

// Get the turn message and New Game button.
const turnMessage = document.getElementById("turn-message");
const restartButton = document.getElementById("restart-button");

// X always starts the game.
let currentPlayer = "X";

// Track whether the game has ended.
let gameOver = false;

// All 8 possible winning combinations.
const winningCombinations = [
    // Rows
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],

    // Columns
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],

    // Diagonals
    [0, 4, 8],
    [2, 4, 6]
];

// Check whether the current player has won.
function checkWinner() {
    for (const combination of winningCombinations) {
        const [a, b, c] = combination;

        if (
            cells[a].textContent === currentPlayer &&
            cells[b].textContent === currentPlayer &&
            cells[c].textContent === currentPlayer
        ) {
            // Highlight the three winning cells.
            cells[a].classList.add("winning-cell");
            cells[b].classList.add("winning-cell");
            cells[c].classList.add("winning-cell");

            return true;
        }
    }

    return false;
}

// Check whether all 9 cells are occupied.
function checkDraw() {
    return Array.from(cells).every(function (cell) {
        return cell.textContent !== "";
    });
}

// Handle clicks on the game board.
cells.forEach(function (cell) {
    cell.addEventListener("click", function () {

        // Do nothing if the game has ended.
        if (gameOver) {
            return;
        }

        // Do not allow an occupied cell to be selected again.
        if (cell.textContent !== "") {
            return;
        }

        // Place the current player's symbol.
        cell.textContent = currentPlayer;

        // Check for a win before checking for a draw.
        if (checkWinner()) {
            gameOver = true;
            turnMessage.textContent = `Player ${currentPlayer} wins!`;
            return;
        }

        // Check for a draw if nobody won.
        if (checkDraw()) {
            gameOver = true;
            turnMessage.textContent = "It's a Draw!";
            return;
        }

        // Switch to the other player.
        if (currentPlayer === "X") {
            currentPlayer = "O";
        } else {
            currentPlayer = "X";
        }

        // Update the turn indicator.
        turnMessage.textContent = `Player ${currentPlayer}'s turn`;
    });
});

// Start a fresh game.
function restartGame() {
    // Clear every cell and remove winning highlights.
    cells.forEach(function (cell) {
        cell.textContent = "";
        cell.classList.remove("winning-cell");
    });

    // Reset the game state.
    currentPlayer = "X";
    gameOver = false;

    // Reset the turn message.
    turnMessage.textContent = "Player X's turn";
}

// Restart when the button is clicked.
restartButton.addEventListener("click", restartGame);