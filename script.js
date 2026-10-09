
/*
    Tic Tac Toe game logic.
*/

// Get all 9 cells from the game board.
const cells = document.querySelectorAll(".cell");

// Get the element that displays the current turn or result.
const turnMessage = document.getElementById("turn-message");

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

        // All 3 cells must contain the current player's symbol.
        if (
            cells[a].textContent === currentPlayer &&
            cells[b].textContent === currentPlayer &&
            cells[c].textContent === currentPlayer
        ) {
            // Highlight the winning cells.
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

// Add click behavior to every cell.
cells.forEach(function (cell) {
    cell.addEventListener("click", function () {

        // Stop if the game has already ended.
        if (gameOver) {
            return;
        }

        // Do not allow a cell to be selected twice.
        if (cell.textContent !== "") {
            return;
        }

        // Place the current player's symbol.
        cell.textContent = currentPlayer;

        // Check for a win FIRST.
        if (checkWinner()) {
            gameOver = true;
            turnMessage.textContent = `Player ${currentPlayer} wins!`;
            return;
        }

        // Only check for a draw if nobody won.
        if (checkDraw()) {
            gameOver = true;
            turnMessage.textContent = "It's a Draw!";
            return;
        }

        // Switch players if the game is still running.
        if (currentPlayer === "X") {
            currentPlayer = "O";
        } else {
            currentPlayer = "X";
        }

        // Show whose turn it is.
        turnMessage.textContent = `Player ${currentPlayer}'s turn`;
    });
});