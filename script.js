/*
    Tic Tac Toe game logic.
*/

// Get all the cells from the game board.
const cells = document.querySelectorAll(".cell");

// Get the element that displays the current turn.
const turnMessage = document.getElementById("turn-message");

// Keep track of whose turn it is.
// X always starts the game.
let currentPlayer = "X";

// Add a click event to every cell.
cells.forEach(function (cell) {
    cell.addEventListener("click", function () {

        // Do nothing if the cell has already been selected.
        if (cell.textContent !== "") {
            return;
        }

        // Put the current player's symbol inside the cell.
        cell.textContent = currentPlayer;

        // Switch to the other player.
        if (currentPlayer === "X") {
            currentPlayer = "O";
        } else {
            currentPlayer = "X";
        }

        // Display whose turn it is now.
        turnMessage.textContent = `Player ${currentPlayer}'s turn`;
    });
});