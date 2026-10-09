
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
// Each number represents a cell position in the cells list,
// starting from 0 (the first cell).
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

        // A player wins when all 3 cells contain the same symbol.
        if (
            cells[a].textContent === currentPlayer &&
            cells[b].textContent === currentPlayer &&
            cells[c].textContent === currentPlayer
        ) {
            // Highlight all 3 winning cells.
            cells[a].classList.add("winning-cell");
            cells[b].classList.add("winning-cell");
            cells[c].classList.add("winning-cell");

            return true;
        }
    }

    return false;
}

// Add click behavior to each cell.
cells.forEach(function (cell) {
    cell.addEventListener("click", function () {

        // Ignore clicks after the game ends.
        if (gameOver) {
            return;
        }

        // Ignore clicks on an already occupied cell.
        if (cell.textContent !== "") {
            return;
        }

        // Place the current player's symbol.
        cell.textContent = currentPlayer;

        // Check whether this move wins the game.
        if (checkWinner()) {
            gameOver = true;
            turnMessage.textContent = `Player ${currentPlayer} wins!`;
            return;
        }

        // Switch to the other player if nobody has won.
        if (currentPlayer === "X") {
            currentPlayer = "O";
        } else {
            currentPlayer = "X";
        }

        // Update the turn message.
        turnMessage.textContent = `Player ${currentPlayer}'s turn`;
    });
});