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
const resetAllDataButton = document.getElementById("reset-all-data-button");
const resetStatisticsButton = document.getElementById("reset-statistics-button");
const timerDisplay = document.getElementById("timer-display");
const pauseGameButton = document.getElementById("pause-game-button");
const turnTimeLimitSelect = document.getElementById("turn-time-limit");

// Store the names assigned to X and O.
const playerNames = {
    X: "",
    O: ""
};

// X always takes the first turn.
let currentPlayer = "X";

// A game cannot be played until both names are submitted.
let gameOver = true;
let gamePaused = false;
let timerInterval = null;
let remainingSeconds = 30;
let turnStartedAt = 0;
let turnStartRemaining = 0;

// Keep the scores in memory while the page remains open.
const scores = {
    X: 0,
    O: 0,
    draws: 0
};

// Statistics count completed games separately from the resettable scoreboard.
const defaultStatistics = {
    totalGames: 0,
    xWins: 0,
    oWins: 0,
    draws: 0,
    currentStreakPlayer: "",
    currentStreak: 0,
    bestStreakPlayer: "",
    bestStreak: 0
};
const statistics = Object.assign({}, defaultStatistics);

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
    startingPlayer: "X",   // "X", "O", or "random"
    timerEnabled: "off",   // "on" or "off"
    turnTimeLimit: "30"    // Seconds allowed for each turn
};

// The only values each setting is allowed to have.
const allowedValues = {
    theme: ["light", "dark"],
    sound: ["on", "off"],
    startingPlayer: ["X", "O", "random"],
    timerEnabled: ["on", "off"],
    turnTimeLimit: ["10", "15", "30", "60"]
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
        settings: settings,
        statistics: statistics
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

        if (saved.statistics && typeof saved.statistics === "object") {
            const numberKeys = ["totalGames", "xWins", "oWins", "draws", "currentStreak", "bestStreak"];

            numberKeys.forEach(function (key) {
                const value = saved.statistics[key];
                if (Number.isSafeInteger(value) && value >= 0) {
                    statistics[key] = value;
                }
            });

            ["currentStreakPlayer", "bestStreakPlayer"].forEach(function (key) {
                const value = saved.statistics[key];
                if (value === "X" || value === "O" || value === "") {
                    statistics[key] = value;
                }
            });
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

        const select = settingsForm.querySelector(`select[name="${key}"]`);
        if (select) {
            select.value = settings[key];
        }
    }
}

// Apply the selected theme to the entire application.
// Theme selection is controlled only by the Settings radio buttons.
function applyTheme(theme) {
    const selectedTheme = allowedValues.theme.includes(theme) ? theme : "light";
    document.documentElement.setAttribute("data-theme", selectedTheme);
}

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

    if (key === "timerEnabled" || key === "turnTimeLimit") {
        if (!gameOver && !gamePaused) {
            startTurnTimer(true);
        } else {
            remainingSeconds = Number(settings.turnTimeLimit);
            stopTimer();
            updateTimerDisplay();
        }
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

// Stop the one active interval, if there is one.
function stopTimer() {
    if (timerInterval !== null) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

// Show the countdown only when the optional timer is enabled.
function updateTimerDisplay() {
    const timerEnabled = settings.timerEnabled === "on";
    timerDisplay.hidden = !timerEnabled;

    if (!timerEnabled) {
        timerDisplay.classList.remove("timer-low");
        return;
    }

    timerDisplay.textContent = gamePaused
        ? `Paused — ${remainingSeconds}s remaining`
        : `Time remaining: ${remainingSeconds}s`;
    timerDisplay.classList.toggle("timer-low", remainingSeconds <= 5);
}

// Start a fresh countdown for the player whose turn it is.
function startTurnTimer(resetTime = true) {
    stopTimer();

    if (resetTime) {
        remainingSeconds = Number(settings.turnTimeLimit);
    }

    turnStartedAt = Date.now();
    turnStartRemaining = remainingSeconds;
    updateTimerDisplay();

    if (settings.timerEnabled !== "on" || gameOver || gamePaused) {
        return;
    }

    // There is always at most one interval because stopTimer() runs first.
    timerInterval = setInterval(function () {
        const elapsedSeconds = Math.floor((Date.now() - turnStartedAt) / 1000);
        remainingSeconds = Math.max(0, turnStartRemaining - elapsedSeconds);
        updateTimerDisplay();

        if (remainingSeconds <= 0) {
            stopTimer();
            finishGameByTimeout();
        }
    }, 250);
}

// If the current player runs out of time, the other player wins.
function finishGameByTimeout() {
    if (gameOver || gamePaused || settings.timerEnabled !== "on") {
        return;
    }

    gameOver = true;
    stopTimer();

    const winner = currentPlayer === "X" ? "O" : "X";
    scores[winner]++;
    updateScoreboard();
    recordCompletedGame(winner);
    playSound("win");
    showAnimatedMessage(`${playerNames[winner]} (${winner}) wins — time ran out for ${playerNames[currentPlayer]} (${currentPlayer})!`);
    pauseGameButton.disabled = true;
    pauseGameButton.textContent = "Pause Game";
    updateTimerDisplay();
}

// Pause or resume the current turn without losing its remaining time.
function toggleGamePause() {
    if (gameOver) {
        return;
    }

    if (!gamePaused) {
        // Calculate the remaining time before stopping the interval.
        if (settings.timerEnabled === "on") {
            const elapsedSeconds = Math.floor((Date.now() - turnStartedAt) / 1000);
            remainingSeconds = Math.max(0, turnStartRemaining - elapsedSeconds);
        }
        gamePaused = true;
        stopTimer();
        cells.forEach(function (cell) { cell.disabled = true; });
        pauseGameButton.textContent = "Resume Game";
        updateTimerDisplay();

        if (remainingSeconds <= 0 && settings.timerEnabled === "on") {
            // A timeout that happened just as Pause was clicked still counts.
            gamePaused = false;
            finishGameByTimeout();
        }
        return;
    }

    gamePaused = false;
    cells.forEach(function (cell) {
        cell.disabled = cell.textContent !== "";
    });
    pauseGameButton.textContent = "Pause Game";
    startTurnTimer(false);
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

// Return a percentage safely, avoiding division by zero.
function calculatePercentage(part, total) {
    return total === 0 ? 0 : Math.round((part / total) * 100);
}

// Refresh all statistics shown in the interface.
function updateStatisticsDisplay() {
    document.getElementById("stat-total-games").textContent = statistics.totalGames;
    document.getElementById("stat-x-wins").textContent = statistics.xWins;
    document.getElementById("stat-o-wins").textContent = statistics.oWins;
    document.getElementById("stat-draws").textContent = statistics.draws;

    document.getElementById("stat-x-percentage").textContent =
        calculatePercentage(statistics.xWins, statistics.totalGames) + "%";
    document.getElementById("stat-o-percentage").textContent =
        calculatePercentage(statistics.oWins, statistics.totalGames) + "%";
    document.getElementById("stat-draw-percentage").textContent =
        calculatePercentage(statistics.draws, statistics.totalGames) + "%";

    document.getElementById("stat-current-streak").textContent =
        statistics.currentStreak > 0
            ? `${statistics.currentStreakPlayer}: ${statistics.currentStreak}`
            : "None";
    document.getElementById("stat-best-streak").textContent =
        statistics.bestStreak > 0
            ? `${statistics.bestStreakPlayer}: ${statistics.bestStreak}`
            : "None";
}

// Record exactly one completed game and update the winning streak.
function recordCompletedGame(result) {
    statistics.totalGames++;

    if (result === "draw") {
        statistics.draws++;
        statistics.currentStreakPlayer = "";
        statistics.currentStreak = 0;
    } else {
        if (result === "X") {
            statistics.xWins++;
        } else {
            statistics.oWins++;
        }

        if (statistics.currentStreakPlayer === result) {
            statistics.currentStreak++;
        } else {
            statistics.currentStreakPlayer = result;
            statistics.currentStreak = 1;
        }

        if (statistics.currentStreak > statistics.bestStreak) {
            statistics.bestStreak = statistics.currentStreak;
            statistics.bestStreakPlayer = result;
        }
    }

    updateStatisticsDisplay();
    saveAppData();
}

// Reset only the statistics, leaving the existing scoreboard untouched.
function resetStatistics() {
    Object.assign(statistics, defaultStatistics);
    updateStatisticsDisplay();
    saveAppData();
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
    if (gameOver || gamePaused) {
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
        stopTimer();
        pauseGameButton.disabled = true;

        playSound("win");

        // Add one point to the winner's score.
        scores[currentPlayer]++;

        updateScoreboard();
        recordCompletedGame(currentPlayer);

        // Show and animate the winning message.
        showAnimatedMessage(
            `${playerNames[currentPlayer]} (${currentPlayer}) wins!`
        );

        return;
    }

    // If nobody won and all cells are full, it is a draw.
    if (checkDraw()) {
        gameOver = true;
        stopTimer();
        pauseGameButton.disabled = true;
        scores.draws++;

        playSound("draw");

        updateScoreboard();
        recordCompletedGame("draw");

        // Show and animate the draw message.
        showAnimatedMessage("It's a Draw!");

        return;
    }

    // Play the move sound for the player who just moved.
    playSound(currentPlayer === "X" ? "x" : "o");

    // Switch players.
    currentPlayer = currentPlayer === "X" ? "O" : "X";

    updateTurnMessage();
    startTurnTimer(true);
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
    stopTimer();
    currentPlayer = getStartingPlayer();
    gameOver = false;
    gamePaused = false;
    pauseGameButton.disabled = false;
    pauseGameButton.textContent = "Pause Game";

    // Show the first player's turn and begin its countdown.
    updateTurnMessage();
    startTurnTimer(true);
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

// Pause or resume the current game.
pauseGameButton.addEventListener("click", toggleGamePause);

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
        "Reset all data? This will delete saved player names, scoreboard scores, statistics, and settings."
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
    Object.assign(statistics, defaultStatistics);

    Object.assign(settings, defaultSettings);
    playerXInput.value = "";
    playerOInput.value = "";
    validationMessage.textContent = "";

    // Stop the timer and clear pause state before resetting the board.
    stopTimer();
    gamePaused = false;
    remainingSeconds = Number(defaultSettings.turnTimeLimit);
    pauseGameButton.disabled = true;
    pauseGameButton.textContent = "Pause Game";
    updateTimerDisplay();

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
    updateStatisticsDisplay();
    applyTheme(settings.theme);
    updateSettingsForm();
});

// Reset statistics after asking for confirmation.
resetStatisticsButton.addEventListener("click", function () {
    const confirmed = window.confirm(
        "Reset statistics? This clears game totals, percentages, and streaks but keeps the scoreboard."
    );

    if (confirmed) {
        resetStatistics();
    }
});

// Set up the initial screen.
cells.forEach(function (cell) {
    cell.disabled = true;
});

restartButton.disabled = true;
pauseGameButton.disabled = true;
remainingSeconds = Number(settings.turnTimeLimit);
turnTimeLimitSelect.value = settings.turnTimeLimit;
updateTimerDisplay();

// Enable the restart button once valid names are submitted.
playerForm.addEventListener("submit", function () {
    if (playerNames.X !== "" && playerNames.O !== "") {
        restartButton.disabled = false;
    }
});

// Show the saved scoreboard and statistics on page load.
updateScoreboard();
updateStatisticsDisplay();
/* ===================================
   Hamburger menu navigation
   =================================== */
const menuOpenButton = document.getElementById("menu-open-button");
const menuCloseButton = document.getElementById("menu-close-button");
const appMenu = document.getElementById("app-menu");
const menuBackdrop = document.getElementById("menu-backdrop");
const menuLinks = document.querySelectorAll(".app-menu-link");

function openAppMenu() {
    appMenu.hidden = false;
    menuBackdrop.hidden = false;
    appMenu.setAttribute("aria-hidden", "false");
    menuOpenButton.setAttribute("aria-expanded", "true");
    document.body.classList.add("menu-open");
    menuCloseButton.focus();
}

function closeAppMenu(returnFocus = true) {
    appMenu.hidden = true;
    menuBackdrop.hidden = true;
    appMenu.setAttribute("aria-hidden", "true");
    menuOpenButton.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-open");

    if (returnFocus) {
        menuOpenButton.focus();
    }
}

menuOpenButton.addEventListener("click", openAppMenu);
menuCloseButton.addEventListener("click", function () {
    closeAppMenu();
});

// Clicking the dimmed area outside the sidebar closes the menu.
menuBackdrop.addEventListener("click", function () {
    closeAppMenu();
});

// Escape closes the menu. Tab and Shift+Tab stay within the open menu.
document.addEventListener("keydown", function (event) {
    if (appMenu.hidden) {
        return;
    }

    if (event.key === "Escape") {
        event.preventDefault();
        closeAppMenu();
        return;
    }

    if (event.key === "Tab") {
        const focusableItems = [menuCloseButton, ...menuLinks];
        const firstItem = focusableItems[0];
        const lastItem = focusableItems[focusableItems.length - 1];

        if (event.shiftKey && document.activeElement === firstItem) {
            event.preventDefault();
            lastItem.focus();
        } else if (!event.shiftKey && document.activeElement === lastItem) {
            event.preventDefault();
            firstItem.focus();
        }
    }
});

// Show exactly one top-level app section at a time without reinitializing game state.
function navigateToSection(targetId) {
    const sectionIds = ["game-section", "settings-section", "statistics-section"];
    const targetSection = document.getElementById(targetId);

    if (!targetSection || !sectionIds.includes(targetId)) {
        return;
    }

    sectionIds.forEach(function (sectionId) {
        const section = document.getElementById(sectionId);
        const isActive = sectionId === targetId;

        section.hidden = !isActive;
        section.setAttribute("aria-hidden", String(!isActive));
    });

    menuLinks.forEach(function (link) {
        const isActive = link.dataset.menuTarget === targetId;
        link.classList.toggle("is-active", isActive);

        if (isActive) {
            link.setAttribute("aria-current", "page");
        } else {
            link.removeAttribute("aria-current");
        }
    });

    const targetHeading = targetSection.querySelector("h1, h2");
    targetSection.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth",
        block: "start"
    });

    if (targetHeading) {
        targetHeading.focus({ preventScroll: true });
    }
}

menuLinks.forEach(function (link) {
    link.addEventListener("click", function () {
        closeAppMenu(false);
        navigateToSection(link.dataset.menuTarget);
    });
});

// Let players return directly from Statistics to the game board.
const returnToGameButton = document.getElementById("return-to-game-button");
returnToGameButton.addEventListener("click", function () {
    navigateToSection("game-section");
});

 // Set the initial view and active menu item; this does not reset the board or saved data.
navigateToSection("game-section");
