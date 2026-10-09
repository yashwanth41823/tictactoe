
/*
    Tic Tac Toe
    Player setup, game rules, scoreboard, and animations.
*/

// Find the HTML elements we need.
const cells = document.querySelectorAll(".cell");
const turnMessage = document.getElementById("turn-message");

const playerForm = document.getElementById("player-form");
const playerXInput = document.getElementById("player-x-name");
const playerOInput = document.getElementById("player-o-name");
const validationMessage = document.getElementById("validation-message");

const displayPlayerX = document.getElementById("display-player-x");
const displayPlayerO = document.getElementById("display-player-o");

const scoreXName = document.getElementById("score-x-name");
const scoreOName = document.getElementById("score-o-name");
const scoreXDisplay = document.getElementById("score-x");
const scoreODisplay = document.getElementById("score-o");
const scoreDrawsDisplay = document.getElementById("score-draws");

const restartButton = document.getElementById("restart-button");
const resetScoresButton = document.getElementById("reset-scores-button");

// Store the names assigned to X and O.
const playerNames = {
    X: "",
    O: ""
};

// X always takes the first turn.
let currentPlayer = "X";

// A game cannot be played until both names are submitted.
let gameOver = true;

// Keep the scores in memory while the page remains open.
const scores = {
    X: 0,
    O: 0,
    draws: 0
};

// The eight possible winning combinations.
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

// Restart a CSS animation whenever it needs to play again.
function playAnimation(element, className) {
    element.classList.remove(className);

    // Force the browser to recognize the removal before re-adding the class.
    void element.offsetWidth;

    element.classList.add(className);
}

// Display whose turn it is.
function updateTurnMessage() {
    turnMessage.textContent =
        `${playerNames[currentPlayer]}'s turn (${currentPlayer})`;
}

// Update the scoreboard display from the stored scores.
function updateScoreboard() {
    scoreXName.textContent = playerNames.X || "Player X";
    scoreOName.textContent = playerNames.O || "Player O";

    scoreXDisplay.textContent = scores.X;
    scoreODisplay.textContent = scores.O;
    scoreDrawsDisplay.textContent = scores.draws;
}

// Display the names and symbols assigned to each player.
function updatePlayerDisplay() {
    displayPlayerX.textContent = playerNames.X;
    displayPlayerO.textContent = playerNames.O;

    updateScoreboard();
}

// Check all possible winning combinations.
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

// Check whether every cell is occupied.
function checkDraw() {
    return Array.from(cells).every(function (cell) {
        return cell.textContent !== "";
    });
}

// Display a message and animate its appearance.
function showAnimatedMessage(message) {
    turnMessage.textContent = message;
    playAnimation(turnMessage, "win-message");
}

// Handle a player clicking a cell.
function handleCellClick(cell) {
    // Prevent moves before setup or after the game ends.
    if (gameOver) {
        return;
    }

    // Prevent a cell from being selected twice.
    if (cell.textContent !== "") {
        return;
    }

    // Place X or O.
    cell.textContent = currentPlayer;

    // Animate the new symbol.
    playAnimation(cell, "mark-pop");

    // Check for a win BEFORE checking for a draw.
    if (checkWinner()) {
        gameOver = true;

        // Add one point to the winner's score.
        scores[currentPlayer]++;

        updateScoreboard();

        // Show and animate the winning message.
        showAnimatedMessage(
            `${playerNames[currentPlayer]} (${currentPlayer}) wins!`
        );

        return;
    }

    // If nobody won and all cells are full, it is a draw.
    if (checkDraw()) {
        gameOver = true;
        scores.draws++;

        updateScoreboard();

        // Show and animate the draw message.
        showAnimatedMessage("It's a Draw!");

        return;
    }

    // Switch players.
    currentPlayer = currentPlayer === "X" ? "O" : "X";

    updateTurnMessage();
}

// Start a new game without resetting the scoreboard.
function restartGame() {
    // Clear symbols, animations, and winning highlights.
    cells.forEach(function (cell) {
        cell.textContent = "";

        cell.classList.remove(
            "winning-cell",
            "mark-pop"
        );

        cell.disabled = false;
    });

    // Remove the previous message animation.
    turnMessage.classList.remove("win-message");

    // Reset the current game state.
    currentPlayer = "X";
    gameOver = false;

    // Show the first player's turn.
    updateTurnMessage();
}

// Validate names and begin a new game.
playerForm.addEventListener("submit", function (event) {
    // Prevent the browser from reloading the page.
    event.preventDefault();

    // Remove spaces at the beginning and end of each name.
    const nameX = playerXInput.value.trim();
    const nameO = playerOInput.value.trim();

    // Both names are required.
    if (nameX === "" || nameO === "") {
        validationMessage.textContent =
            "Please enter a name for both Player 1 and Player 2.";

        return;
    }

    // Save the valid names.
    playerNames.X = nameX;
    playerNames.O = nameO;

    // Clear any previous validation message.
    validationMessage.textContent = "";

    // Update the names shown in the interface.
    updatePlayerDisplay();

    // A valid submission starts a fresh game.
    restartGame();
});

// Attach one click listener to each cell.
cells.forEach(function (cell) {
    cell.addEventListener("click", function () {
        handleCellClick(cell);
    });
});

// Restart the game while keeping the scores.
restartButton.addEventListener("click", function () {
    // Do not restart until both player names are set.
    if (playerNames.X === "" || playerNames.O === "") {
        return;
    }

    restartGame();
});

// Reset only the scores. Do not affect the current game.
resetScoresButton.addEventListener("click", function () {
    scores.X = 0;
    scores.O = 0;
    scores.draws = 0;

    updateScoreboard();
});

// Set up the initial screen.
cells.forEach(function (cell) {
    cell.disabled = true;
});

restartButton.disabled = true;

// Enable the restart button once valid names are submitted.
playerForm.addEventListener("submit", function () {
    if (playerNames.X !== "" && playerNames.O !== "") {
        restartButton.disabled = false;
    }
});

// Show the initial zero scores.
updateScoreboard();