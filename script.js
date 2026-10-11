/*
    Tic Tac Toe
    Player setup, game rules, scoreboard, and animations.
*/

// Find the HTML elements we need.
const cells = document.querySelectorAll(".cell");
const turnMessage = document.getElementById("turn-message");

const themeToggleButton = document.getElementById("theme-toggle-button");
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
const resetAllDataButton = document.getElementById("reset-all-data-button");

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


/* ===================================
   Settings: Theme, Sound, Starting Player
   =================================== */

// The settings panel in the HTML.
const settingsForm = document.getElementById("settings-form");

// The name used to save the settings in localStorage.
const SETTINGS_KEY = "tic-tac-toe-settings";
const APP_DATA_KEY = "tic-tac-toe-app-data";

// The settings used on a first visit.
const defaultSettings = {
    theme: "light",        // "light" or "dark"
    sound: "on",           // "on" or "off"
    startingPlayer: "X"    // "X", "O", or "random"
};

// The only values each setting is allowed to have.
const allowedValues = {
    theme: ["light", "dark"],
    sound: ["on", "off"],
    startingPlayer: ["X", "O", "random"]
};

// The current settings (starts as a copy of the defaults).
const settings = Object.assign({}, defaultSettings);

// Load saved settings from localStorage.
function loadSettings() {
    try {
        const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY));

        if (saved) {
            // Only accept values we know are valid.
            for (const key in allowedValues) {
                if (allowedValues[key].includes(saved[key])) {
                    settings[key] = saved[key];
                }
            }
        } else if (localStorage.getItem("tic-tac-toe-theme") === "dark") {
            // Keep a theme that was saved by the older version of this app.
            settings.theme = "dark";
        }
    } catch (error) {
        // If storage is unavailable or damaged, use the defaults.
    }
}

// Save the current settings to localStorage.
function saveSettings() {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
        // The settings still work for this page session
        // even if the browser cannot save them.
    }

    // Also save the settings alongside player names and scores.
    saveAppData();
}

// Save the information that should survive a page refresh.
function saveAppData() {
    const appData = {
        playerNames: playerNames,
        scores: scores,
        settings: settings
    };

    try {
        localStorage.setItem(APP_DATA_KEY, JSON.stringify(appData));
    } catch (error) {
        // The game can still be played if browser storage is unavailable.
    }
}

// Load saved names, scores, and settings safely.
function loadAppData() {
    try {
        const saved = JSON.parse(localStorage.getItem(APP_DATA_KEY));

        // Missing data, invalid JSON, or an unexpected value is ignored.
        if (!saved || typeof saved !== "object" || Array.isArray(saved)) {
            return;
        }

        if (saved.playerNames && typeof saved.playerNames === "object") {
            if (typeof saved.playerNames.X === "string") {
                playerNames.X = saved.playerNames.X.trim().slice(0, 30);
                playerXInput.value = playerNames.X;
            }

            if (typeof saved.playerNames.O === "string") {
                playerNames.O = saved.playerNames.O.trim().slice(0, 30);
                playerOInput.value = playerNames.O;
            }
        }

        if (saved.scores && typeof saved.scores === "object") {
            ["X", "O", "draws"].forEach(function (key) {
                const value = saved.scores[key];

                // Scores must be non-negative whole numbers.
                if (Number.isSafeInteger(value) && value >= 0) {
                    scores[key] = value;
                }
            });
        }

        if (saved.settings && typeof saved.settings === "object") {
            for (const key in allowedValues) {
                if (allowedValues[key].includes(saved.settings[key])) {
                    settings[key] = saved.settings[key];
                }
            }
        }
    } catch (error) {
        // If saved data is damaged or storage is blocked, use safe defaults.
    }
}

// Select the correct radio button for every setting.
function updateSettingsForm() {
    for (const key in settings) {
        const radio = settingsForm.querySelector(
            `input[name="${key}"][value="${settings[key]}"]`
        );

        if (radio) {
            radio.checked = true;
        }
    }
}

// Apply the selected theme to the page.
function applyTheme(theme) {
    const selectedTheme = theme === "dark" ? "dark" : "light";

    document.documentElement.setAttribute("data-theme", selectedTheme);

    // Update the toggle button label and accessibility state.
    if (selectedTheme === "dark") {
        themeToggleButton.textContent = "☀️ Light Mode";
        themeToggleButton.setAttribute("aria-pressed", "true");
    } else {
        themeToggleButton.textContent = "🌙 Dark Mode";
        themeToggleButton.setAttribute("aria-pressed", "false");
    }
}

// The header button switches the theme and keeps the settings panel in sync.
themeToggleButton.addEventListener("click", function () {
    settings.theme = settings.theme === "dark" ? "light" : "dark";

    applyTheme(settings.theme);
    updateSettingsForm();
    saveSettings();
});

// When any radio button in the settings panel changes.
settingsForm.addEventListener("change", function (event) {
    const key = event.target.name;
    const value = event.target.value;

    // Ignore anything that is not a known setting.
    if (!allowedValues[key] || !allowedValues[key].includes(value)) {
        return;
    }

    settings[key] = value;
    saveSettings();

    if (key === "theme") {
        applyTheme(value);
    }

    // Play a short beep so the player can hear that sound is on.
    if (key === "sound") {
        playSound("on");
    }
});


/* ===================================
   Sound (made with the browser, no sound files needed)
   =================================== */

// Created the first time a sound is played.
let audioContext = null;

// Play one short beep.
function playTone(frequency, delay, duration) {
    const startTime = audioContext.currentTime + delay;

    const oscillator = audioContext.createOscillator();
    const volume = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = frequency;

    // Fade in and out quickly so the beep does not click.
    volume.gain.setValueAtTime(0.0001, startTime);
    volume.gain.exponentialRampToValueAtTime(0.15, startTime + 0.01);
    volume.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    oscillator.connect(volume);
    volume.connect(audioContext.destination);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.02);
}

// Play a named sound, but only when Sound is set to "on".
function playSound(name) {
    if (settings.sound !== "on") {
        return;
    }

    try {
        // Browsers only allow audio after a click, so create it here.
        if (!audioContext) {
            const AudioContextClass =
                window.AudioContext || window.webkitAudioContext;

            if (!AudioContextClass) {
                return;
            }

            audioContext = new AudioContextClass();
        }

        if (audioContext.state === "suspended") {
            audioContext.resume();
        }

        if (name === "x") {
            playTone(520, 0, 0.12);
        } else if (name === "o") {
            playTone(390, 0, 0.12);
        } else if (name === "win") {
            playTone(523, 0, 0.14);
            playTone(659, 0.14, 0.14);
            playTone(784, 0.28, 0.28);
        } else if (name === "draw") {
            playTone(260, 0, 0.18);
            playTone(220, 0.18, 0.28);
        } else if (name === "on") {
            playTone(660, 0, 0.1);
        }
    } catch (error) {
        // If sound fails, the game keeps working silently.
    }
}

// Choose who goes first in a new game, using the Starting Player setting.
function getStartingPlayer() {
    if (settings.startingPlayer === "random") {
        return Math.random() < 0.5 ? "X" : "O";
    }

    return settings.startingPlayer;
}

// Restore settings first, then the complete saved application data.
loadSettings();
loadAppData();
applyTheme(settings.theme);
updateSettingsForm();

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

        playSound("win");

        // Add one point to the winner's score.
        scores[currentPlayer]++;

        updateScoreboard();
        saveAppData();

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

        playSound("draw");

        updateScoreboard();
        saveAppData();

        // Show and animate the draw message.
        showAnimatedMessage("It's a Draw!");

        return;
    }

    // Play the move sound for the player who just moved.
    playSound(currentPlayer === "X" ? "x" : "o");

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
    // The Starting Player setting decides who goes first.
    currentPlayer = getStartingPlayer();
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

    // Save the names and current scores.
    saveAppData();
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
    saveAppData();
});

// Delete all saved application data only after confirmation.
resetAllDataButton.addEventListener("click", function () {
    const confirmed = window.confirm(
        "Reset all data? This will delete saved player names, scores, and settings."
    );

    if (!confirmed) {
        return;
    }

    // Remove current and older storage keys used by this app.
    try {
        localStorage.removeItem(APP_DATA_KEY);
        localStorage.removeItem(SETTINGS_KEY);
        localStorage.removeItem("tic-tac-toe-theme");
    } catch (error) {
        // Continue resetting the visible app even if storage is unavailable.
    }

    // Restore the in-memory defaults.
    playerNames.X = "";
    playerNames.O = "";
    scores.X = 0;
    scores.O = 0;
    scores.draws = 0;

    Object.assign(settings, defaultSettings);
    playerXInput.value = "";
    playerOInput.value = "";
    validationMessage.textContent = "";

    // Clear the board and return the game to its initial state.
    cells.forEach(function (cell) {
        cell.textContent = "";
        cell.disabled = true;
        cell.classList.remove("winning-cell", "mark-pop");
    });

    gameOver = true;
    currentPlayer = "X";
    restartButton.disabled = true;
    turnMessage.textContent = "Enter both player names to start.";
    turnMessage.classList.remove("win-message");

    updatePlayerDisplay();
    applyTheme(settings.theme);
    updateSettingsForm();
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