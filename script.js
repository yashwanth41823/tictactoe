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
const resetStatisticsButton = document.getElementById("reset-statistics-button");

const timerDisplay = document.getElementById("timer-display");
const pauseGameButton = document.getElementById("pause-game-button");
const turnTimeLimitSelect = document.getElementById("turn-time-limit");

const humanSymbolSetting = document.getElementById("human-symbol-setting");
const computerDifficultySetting = document.getElementById(
    "computer-difficulty-setting"
);

const playerXGroup = document.getElementById("player-x-group");
const playerOGroup = document.getElementById("player-o-group");
const playerXLabel = document.getElementById("player-x-label");
const playerOLabel = document.getElementById("player-o-label");

const settingsForm = document.getElementById("settings-form");

const SETTINGS_KEY = "tic-tac-toe-settings";
const APP_DATA_KEY = "tic-tac-toe-app-data";

const playerNames = { X: "", O: "" };
const scores = { X: 0, O: 0, draws: 0 };

const defaultSettings = {
    theme: "light",
    sound: "on",
    startingPlayer: "X",
    gameMode: "player-vs-player",
    humanSymbol: "X",
    difficulty: "easy",
    timerEnabled: "off",
    turnTimeLimit: "30"
};

const allowedValues = {
    theme: ["light", "dark"],
    sound: ["on", "off"],
    startingPlayer: ["X", "O", "random"],
    gameMode: ["player-vs-player", "player-vs-computer"],
    humanSymbol: ["X", "O"],
    difficulty: ["easy", "medium", "hard"],
    timerEnabled: ["on", "off"],
    turnTimeLimit: ["10", "15", "30", "60"]
};

const settings = { ...defaultSettings };

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

const statistics = { ...defaultStatistics };

const winningCombinations = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

let currentPlayer = "X";
let gameOver = true;
let gamePaused = false;

let activeGameMode = "player-vs-player";
let activeHumanSymbol = "X";

let timerInterval = null;
let computerMoveTimeout = null;
let remainingSeconds = 30;
let turnStartedAt = 0;
let turnStartRemaining = 0;

let audioContext = null;

/* ------------------------------
   Local storage and settings
------------------------------ */

function loadSettings() {
    try {
        const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY));

        if (saved && typeof saved === "object") {
            for (const key in allowedValues) {
                if (allowedValues[key].includes(saved[key])) {
                    settings[key] = saved[key];
                }
            }
        } else if (
            localStorage.getItem("tic-tac-toe-theme") === "dark"
        ) {
            settings.theme = "dark";
        }
    } catch (error) {
        // Use default settings if saved data cannot be read.
    }
}

function saveSettings() {
    try {
        localStorage.setItem(
            SETTINGS_KEY,
            JSON.stringify(settings)
        );
    } catch (error) {
        // The game can still work without saved settings.
    }

    saveAppData();
}

function saveAppData() {
    const appData = {
        playerNames,
        scores,
        settings,
        statistics
    };

    try {
        localStorage.setItem(
            APP_DATA_KEY,
            JSON.stringify(appData)
        );
    } catch (error) {
        // Saving is optional for the current game session.
    }
}

function loadAppData() {
    try {
        const saved = JSON.parse(
            localStorage.getItem(APP_DATA_KEY)
        );

        if (!saved || typeof saved !== "object") {
            return;
        }

        if (saved.playerNames) {
            if (typeof saved.playerNames.X === "string") {
                playerNames.X = saved.playerNames.X.trim().slice(0, 30);
                playerXInput.value = playerNames.X;
            }

            if (typeof saved.playerNames.O === "string") {
                playerNames.O = saved.playerNames.O.trim().slice(0, 30);
                playerOInput.value = playerNames.O;
            }
        }

        if (saved.scores) {
            ["X", "O", "draws"].forEach(function (key) {
                const value = saved.scores[key];

                if (Number.isSafeInteger(value) && value >= 0) {
                    scores[key] = value;
                }
            });
        }

        if (saved.settings) {
            for (const key in allowedValues) {
                if (allowedValues[key].includes(saved.settings[key])) {
                    settings[key] = saved.settings[key];
                }
            }
        }

        if (saved.statistics) {
            const numberKeys = [
                "totalGames",
                "xWins",
                "oWins",
                "draws",
                "currentStreak",
                "bestStreak"
            ];

            numberKeys.forEach(function (key) {
                const value = saved.statistics[key];

                if (Number.isSafeInteger(value) && value >= 0) {
                    statistics[key] = value;
                }
            });

            ["currentStreakPlayer", "bestStreakPlayer"].forEach(
                function (key) {
                    const value = saved.statistics[key];

                    if (value === "X" || value === "O" || value === "") {
                        statistics[key] = value;
                    }
                }
            );
        }
    } catch (error) {
        // Ignore invalid saved data and use defaults.
    }
}

function updateSettingsForm() {
    for (const key in settings) {
        const radio = settingsForm.querySelector(
            `input[name="${key}"][value="${settings[key]}"]`
        );

        if (radio) {
            radio.checked = true;
        }

        const select = settingsForm.querySelector(
            `select[name="${key}"]`
        );

        if (select) {
            select.value = settings[key];
        }
    }
}

function applyTheme(theme) {
    const selectedTheme = theme === "dark" ? "dark" : "light";

    document.documentElement.setAttribute(
        "data-theme",
        selectedTheme
    );

    if (selectedTheme === "dark") {
        themeToggleButton.textContent = "☀️ Light Mode";
        themeToggleButton.setAttribute("aria-pressed", "true");
    } else {
        themeToggleButton.textContent = "🌙 Dark Mode";
        themeToggleButton.setAttribute("aria-pressed", "false");
    }
}

themeToggleButton.addEventListener("click", function () {
    settings.theme =
        settings.theme === "dark" ? "light" : "dark";

    applyTheme(settings.theme);
    updateSettingsForm();
    saveSettings();
});

settingsForm.addEventListener("change", function (event) {
    const key = event.target.name;
    const value = event.target.value;

    if (!allowedValues[key] || !allowedValues[key].includes(value)) {
        return;
    }

    settings[key] = value;
    saveSettings();

    if (key === "theme") {
        applyTheme(value);
    }

    if (key === "sound") {
        playSound("on");
    }

    if (key === "gameMode" || key === "humanSymbol") {
        updatePlayerSetupFields();
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

/* ------------------------------
   Player setup and game mode
------------------------------ */

function updatePlayerSetupFields() {
    const computerMode =
        settings.gameMode === "player-vs-computer";

    humanSymbolSetting.hidden = !computerMode;
    computerDifficultySetting.hidden = !computerMode;

    if (computerMode) {
        const humanIsX = settings.humanSymbol === "X";

        playerXGroup.hidden = !humanIsX;
        playerOGroup.hidden = humanIsX;

        playerXLabel.textContent = humanIsX
            ? "Your Name (X)"
            : "Computer (X)";

        playerOLabel.textContent = humanIsX
            ? "Computer (O)"
            : "Your Name (O)";

        playerXInput.required = humanIsX;
        playerOInput.required = !humanIsX;
    } else {
        playerXGroup.hidden = false;
        playerOGroup.hidden = false;

        playerXLabel.textContent = "Player 1 (X)";
        playerOLabel.textContent = "Player 2 (O)";

        playerXInput.required = true;
        playerOInput.required = true;
    }
}

function getStartingPlayer() {
    if (settings.startingPlayer === "random") {
        return Math.random() < 0.5 ? "X" : "O";
    }

    return settings.startingPlayer;
}

function isComputerTurn() {
    return (
        activeGameMode === "player-vs-computer" &&
        currentPlayer !== activeHumanSymbol
    );
}

function updateCellAvailability() {
    const computerIsPlaying = isComputerTurn();

    cells.forEach(function (cell) {
        cell.disabled =
            gameOver ||
            gamePaused ||
            computerIsPlaying ||
            cell.textContent !== "";
    });
}

/* ------------------------------
   Sound effects
------------------------------ */

function playTone(frequency, delay, duration) {
    const startTime = audioContext.currentTime + delay;
    const oscillator = audioContext.createOscillator();
    const volume = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = frequency;

    volume.gain.setValueAtTime(0.0001, startTime);
    volume.gain.exponentialRampToValueAtTime(
        0.15,
        startTime + 0.01
    );
    volume.gain.exponentialRampToValueAtTime(
        0.0001,
        startTime + duration
    );

    oscillator.connect(volume);
    volume.connect(audioContext.destination);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.02);
}

function playSound(name) {
    if (settings.sound !== "on") {
        return;
    }

    try {
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
        // Sound is optional.
    }
}

/* ------------------------------
   Timer and pause controls
------------------------------ */

function stopTimer() {
    if (timerInterval !== null) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function stopComputerMove() {
    if (computerMoveTimeout !== null) {
        clearTimeout(computerMoveTimeout);
        computerMoveTimeout = null;
    }
}

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

    timerDisplay.classList.toggle(
        "timer-low",
        remainingSeconds <= 5
    );
}

function startTurnTimer(resetTime = true) {
    stopTimer();

    if (resetTime) {
        remainingSeconds = Number(settings.turnTimeLimit);
    }

    turnStartedAt = Date.now();
    turnStartRemaining = remainingSeconds;

    updateTimerDisplay();

    if (
        settings.timerEnabled !== "on" ||
        gameOver ||
        gamePaused
    ) {
        return;
    }

    timerInterval = setInterval(function () {
        const elapsedSeconds = Math.floor(
            (Date.now() - turnStartedAt) / 1000
        );

        remainingSeconds = Math.max(
            0,
            turnStartRemaining - elapsedSeconds
        );

        updateTimerDisplay();

        if (remainingSeconds <= 0) {
            stopTimer();
            finishGameByTimeout();
        }
    }, 250);
}

function finishGameByTimeout() {
    if (
        gameOver ||
        gamePaused ||
        settings.timerEnabled !== "on"
    ) {
        return;
    }

    gameOver = true;
    stopTimer();
    stopComputerMove();

    const winner = currentPlayer === "X" ? "O" : "X";

    scores[winner]++;

    updateScoreboard();
    recordCompletedGame(winner);
    playSound("win");

    showAnimatedMessage(
        `${playerNames[winner]} (${winner}) wins — time ran out for ${playerNames[currentPlayer]} (${currentPlayer})!`
    );

    pauseGameButton.disabled = true;
    pauseGameButton.textContent = "Pause Game";

    updateCellAvailability();
    updateTimerDisplay();
}

function toggleGamePause() {
    if (gameOver) {
        return;
    }

    if (!gamePaused) {
        if (settings.timerEnabled === "on") {
            const elapsedSeconds = Math.floor(
                (Date.now() - turnStartedAt) / 1000
            );

            remainingSeconds = Math.max(
                0,
                turnStartRemaining - elapsedSeconds
            );
        }

        gamePaused = true;
        stopTimer();
        stopComputerMove();

        updateCellAvailability();
        pauseGameButton.textContent = "Resume Game";
        updateTimerDisplay();

        if (
            remainingSeconds <= 0 &&
            settings.timerEnabled === "on"
        ) {
            gamePaused = false;
            finishGameByTimeout();
        }

        return;
    }

    gamePaused = false;
    pauseGameButton.textContent = "Pause Game";

    updateCellAvailability();
    startTurnTimer(false);

    if (isComputerTurn()) {
        scheduleComputerMove();
    }
}

pauseGameButton.addEventListener("click", toggleGamePause);

/* ------------------------------
   Scoreboard and statistics
------------------------------ */

function updateScoreboard() {
    scoreXName.textContent = playerNames.X || "Player X";
    scoreOName.textContent = playerNames.O || "Player O";

    scoreXDisplay.textContent = scores.X;
    scoreODisplay.textContent = scores.O;
    scoreDrawsDisplay.textContent = scores.draws;
}

function updatePlayerDisplay() {
    displayPlayerX.textContent = playerNames.X;
    displayPlayerO.textContent = playerNames.O;

    updateScoreboard();
}

function calculatePercentage(part, total) {
    return total === 0 ? 0 : Math.round((part / total) * 100);
}

function updateStatisticsDisplay() {
    document.getElementById("stat-total-games").textContent =
        statistics.totalGames;

    document.getElementById("stat-x-wins").textContent =
        statistics.xWins;

    document.getElementById("stat-o-wins").textContent =
        statistics.oWins;

    document.getElementById("stat-draws").textContent =
        statistics.draws;

    document.getElementById("stat-x-percentage").textContent =
        calculatePercentage(
            statistics.xWins,
            statistics.totalGames
        ) + "%";

    document.getElementById("stat-o-percentage").textContent =
        calculatePercentage(
            statistics.oWins,
            statistics.totalGames
        ) + "%";

    document.getElementById("stat-draw-percentage").textContent =
        calculatePercentage(
            statistics.draws,
            statistics.totalGames
        ) + "%";

    document.getElementById("stat-current-streak").textContent =
        statistics.currentStreak > 0
            ? `${statistics.currentStreakPlayer}: ${statistics.currentStreak}`
            : "None";

    document.getElementById("stat-best-streak").textContent =
        statistics.bestStreak > 0
            ? `${statistics.bestStreakPlayer}: ${statistics.bestStreak}`
            : "None";
}

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

function resetStatistics() {
    Object.assign(statistics, defaultStatistics);

    updateStatisticsDisplay();
    saveAppData();
}

resetStatisticsButton.addEventListener("click", function () {
    const confirmed = window.confirm(
        "Reset statistics? This keeps the scoreboard unchanged."
    );

    if (confirmed) {
        resetStatistics();
    }
});

/* ------------------------------
   Board helpers and win detection
------------------------------ */

function getBoardState() {
    return Array.from(cells).map(function (cell) {
        return cell.textContent || "";
    });
}

function getAvailableMoves(board) {
    const availableMoves = [];

    for (let index = 0; index < board.length; index++) {
        if (board[index] === "") {
            availableMoves.push(index);
        }
    }

    return availableMoves;
}

function getWinnerFromBoard(board) {
    for (const combination of winningCombinations) {
        const [a, b, c] = combination;

        if (
            board[a] !== "" &&
            board[a] === board[b] &&
            board[b] === board[c]
        ) {
            return board[a];
        }
    }

    return null;
}

function checkWinner() {
    for (const combination of winningCombinations) {
        const [a, b, c] = combination;

        if (
            cells[a].textContent === currentPlayer &&
            cells[b].textContent === currentPlayer &&
            cells[c].textContent === currentPlayer
        ) {
            cells[a].classList.add("winning-cell");
            cells[b].classList.add("winning-cell");
            cells[c].classList.add("winning-cell");

            return true;
        }
    }

    return false;
}

function checkDraw() {
    return Array.from(cells).every(function (cell) {
        return cell.textContent !== "";
    });
}

function showAnimatedMessage(message) {
    turnMessage.textContent = message;

    turnMessage.classList.remove("win-message");
    void turnMessage.offsetWidth;
    turnMessage.classList.add("win-message");
}

function updateTurnMessage() {
    turnMessage.textContent =
        `${playerNames[currentPlayer]}'s turn (${currentPlayer})`;
}

/* ------------------------------
   Easy AI: random valid move
------------------------------ */

function getEasyMove(board) {
    const availableMoves = getAvailableMoves(board);

    if (availableMoves.length === 0) {
        return null;
    }

    const randomIndex = Math.floor(
        Math.random() * availableMoves.length
    );

    return availableMoves[randomIndex];
}

/* ------------------------------
   Medium AI: win or block
------------------------------ */

function findWinningMove(board, symbol) {
    const availableMoves = getAvailableMoves(board);

    for (const index of availableMoves) {
        board[index] = symbol;

        const wins = getWinnerFromBoard(board) === symbol;

        // Undo the temporary move so the real board is unchanged.
        board[index] = "";

        if (wins) {
            return index;
        }
    }

    return null;
}

function getMediumMove(board) {
    const computerSymbol = currentPlayer;
    const humanSymbol = activeHumanSymbol;

    // First, win immediately if possible.
    const winningMove = findWinningMove(
        board,
        computerSymbol
    );

    if (winningMove !== null) {
        return winningMove;
    }

    // Otherwise, block the human's immediate winning move.
    const blockingMove = findWinningMove(
        board,
        humanSymbol
    );

    if (blockingMove !== null) {
        return blockingMove;
    }

    // Prefer the center if it is available.
    if (board[4] === "") {
        return 4;
    }

    // Otherwise, prefer an available corner.
    const corners = [0, 2, 6, 8].filter(function (index) {
        return board[index] === "";
    });

    if (corners.length > 0) {
        return corners[
            Math.floor(Math.random() * corners.length)
        ];
    }

    // If no corner is available, choose an empty side.
    return getEasyMove(board);
}

/* ------------------------------
   Hard AI: Minimax algorithm
------------------------------ */

function minimax(board, depth, maximizing, computerSymbol, humanSymbol) {
    const winner = getWinnerFromBoard(board);

    // A computer win is a good result.
    if (winner === computerSymbol) {
        return 10 - depth;
    }

    // A human win is a bad result for the computer.
    if (winner === humanSymbol) {
        return depth - 10;
    }

    // If no cells remain, the game is a draw.
    const availableMoves = getAvailableMoves(board);

    if (availableMoves.length === 0) {
        return 0;
    }

    if (maximizing) {
        let bestScore = -Infinity;

        for (const index of availableMoves) {
            board[index] = computerSymbol;

            const score = minimax(
                board,
                depth + 1,
                false,
                computerSymbol,
                humanSymbol
            );

            board[index] = "";
            bestScore = Math.max(bestScore, score);
        }

        return bestScore;
    }

    let bestScore = Infinity;

    for (const index of availableMoves) {
        board[index] = humanSymbol;

        const score = minimax(
            board,
            depth + 1,
            true,
            computerSymbol,
            humanSymbol
        );

        board[index] = "";
        bestScore = Math.min(bestScore, score);
    }

    return bestScore;
}

function getHardMove(board) {
    const computerSymbol = currentPlayer;
    const humanSymbol = activeHumanSymbol;
    const availableMoves = getAvailableMoves(board);

    let bestMove = null;
    let bestScore = -Infinity;

    for (const index of availableMoves) {
        // Try this possible computer move.
        board[index] = computerSymbol;

        // Imagine the human and computer taking turns optimally.
        const score = minimax(
            board,
            0,
            false,
            computerSymbol,
            humanSymbol
        );

        // Undo the test move.
        board[index] = "";

        if (score > bestScore) {
            bestScore = score;
            bestMove = index;
        }
    }

    return bestMove;
}

/* ------------------------------
   Select a move for the computer
------------------------------ */

function getComputerMove() {
    const board = getBoardState();

    if (settings.difficulty === "medium") {
        return getMediumMove(board);
    }

    if (settings.difficulty === "hard") {
        return getHardMove(board);
    }

    return getEasyMove(board);
}

function scheduleComputerMove() {
    stopComputerMove();
    updateCellAvailability();

    if (gameOver || gamePaused || !isComputerTurn()) {
        return;
    }

    turnMessage.textContent =
        `${playerNames[currentPlayer]} (${currentPlayer}) is thinking...`;

    computerMoveTimeout = setTimeout(function () {
        computerMoveTimeout = null;

        if (gameOver || gamePaused || !isComputerTurn()) {
            return;
        }

        const moveIndex = getComputerMove();

        if (moveIndex === null || moveIndex === undefined) {
            return;
        }

        makeMove(moveIndex);
    }, 500);
}

/* ------------------------------
   Game move handling
------------------------------ */

function handleCellClick(cell) {
    if (
        gameOver ||
        gamePaused ||
        isComputerTurn() ||
        cell.textContent !== ""
    ) {
        return;
    }

    makeMove(Array.from(cells).indexOf(cell));
}

function makeMove(boardIndex) {
    if (
        gameOver ||
        gamePaused ||
        boardIndex < 0 ||
        boardIndex >= cells.length ||
        cells[boardIndex].textContent !== ""
    ) {
        return;
    }

    stopComputerMove();

    const cell = cells[boardIndex];

    cell.textContent = currentPlayer;
    cell.setAttribute(
        "aria-label",
        `Cell ${boardIndex + 1}: ${currentPlayer}`
    );

    cell.classList.remove("mark-pop");
    void cell.offsetWidth;
    cell.classList.add("mark-pop");

    if (checkWinner()) {
        gameOver = true;

        stopTimer();
        stopComputerMove();

        pauseGameButton.disabled = true;

        playSound("win");

        scores[currentPlayer]++;

        updateScoreboard();
        recordCompletedGame(currentPlayer);

        showAnimatedMessage(
            `${playerNames[currentPlayer]} (${currentPlayer}) wins!`
        );

        updateCellAvailability();
        updateTimerDisplay();

        return;
    }

    if (checkDraw()) {
        gameOver = true;

        stopTimer();
        stopComputerMove();

        pauseGameButton.disabled = true;

        scores.draws++;

        playSound("draw");

        updateScoreboard();
        recordCompletedGame("draw");

        showAnimatedMessage("It's a Draw!");

        updateCellAvailability();
        updateTimerDisplay();

        return;
    }

    playSound(currentPlayer === "X" ? "x" : "o");

    // Switch to the other player.
    currentPlayer = currentPlayer === "X" ? "O" : "X";

    updateTurnMessage();
    updateCellAvailability();

    // Each new turn receives a fresh countdown.
    startTurnTimer(true);

    // Automatically schedule a computer move if needed.
    if (isComputerTurn()) {
        scheduleComputerMove();
    }
}

cells.forEach(function (cell) {
    cell.addEventListener("click", function () {
        handleCellClick(cell);
    });
});

/* ------------------------------
   Start and restart games
------------------------------ */

function restartGame() {
    stopTimer();
    stopComputerMove();

    cells.forEach(function (cell, index) {
        cell.textContent = "";
        cell.disabled = false;

        cell.setAttribute("aria-label", `Cell ${index + 1}`);

        cell.classList.remove("winning-cell", "mark-pop");
    });

    turnMessage.classList.remove("win-message");

    activeGameMode = settings.gameMode;
    activeHumanSymbol = settings.humanSymbol;

    currentPlayer = getStartingPlayer();

    gameOver = false;
    gamePaused = false;

    pauseGameButton.disabled = false;
    pauseGameButton.textContent = "Pause Game";

    updateTurnMessage();
    updateCellAvailability();

    startTurnTimer(true);

    if (isComputerTurn()) {
        scheduleComputerMove();
    }
}

playerForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const nameX = playerXInput.value.trim();
    const nameO = playerOInput.value.trim();

    if (settings.gameMode === "player-vs-computer") {
        const humanName =
            settings.humanSymbol === "X" ? nameX : nameO;

        if (humanName === "") {
            validationMessage.textContent =
                "Please enter your name.";

            return;
        }

        playerNames.X =
            settings.humanSymbol === "X"
                ? humanName
                : "Computer";

        playerNames.O =
            settings.humanSymbol === "O"
                ? humanName
                : "Computer";
    } else {
        if (nameX === "" || nameO === "") {
            validationMessage.textContent =
                "Please enter a name for both players.";

            return;
        }

        playerNames.X = nameX;
        playerNames.O = nameO;
    }

    validationMessage.textContent = "";

    updatePlayerDisplay();

    restartGame();

    restartButton.disabled = false;

    saveAppData();
});

restartButton.addEventListener("click", function () {
    if (!playerNames.X || !playerNames.O) {
        return;
    }

    restartGame();
});

resetScoresButton.addEventListener("click", function () {
    scores.X = 0;
    scores.O = 0;
    scores.draws = 0;

    updateScoreboard();
    saveAppData();
});

/* ------------------------------
   Reset all saved app data
------------------------------ */

resetAllDataButton.addEventListener("click", function () {
    const confirmed = window.confirm(
        "Reset all data? This deletes player names, scores, statistics, and settings."
    );

    if (!confirmed) {
        return;
    }

    try {
        localStorage.removeItem(APP_DATA_KEY);
        localStorage.removeItem(SETTINGS_KEY);
        localStorage.removeItem("tic-tac-toe-theme");
    } catch (error) {
        // Continue resetting the visible app.
    }

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

    stopTimer();
    stopComputerMove();

    gamePaused = false;
    gameOver = true;
    currentPlayer = "X";

    activeGameMode = defaultSettings.gameMode;
    activeHumanSymbol = defaultSettings.humanSymbol;

    remainingSeconds = Number(defaultSettings.turnTimeLimit);

    cells.forEach(function (cell, index) {
        cell.textContent = "";
        cell.disabled = true;

        cell.setAttribute("aria-label", `Cell ${index + 1}`);

        cell.classList.remove("winning-cell", "mark-pop");
    });

    restartButton.disabled = true;

    pauseGameButton.disabled = true;
    pauseGameButton.textContent = "Pause Game";

    turnMessage.textContent = "Enter player names to start.";
    turnMessage.classList.remove("win-message");

    updatePlayerDisplay();
    updateStatisticsDisplay();
    updatePlayerSetupFields();
    updateCellAvailability();

    applyTheme(settings.theme);
    updateSettingsForm();
    updateTimerDisplay();
});

/* ------------------------------
   Initialize the application
------------------------------ */

loadSettings();
loadAppData();

applyTheme(settings.theme);
updateSettingsForm();
updatePlayerSetupFields();

cells.forEach(function (cell, index) {
    cell.disabled = true;
    cell.setAttribute("aria-label", `Cell ${index + 1}`);
});

restartButton.disabled = true;
pauseGameButton.disabled = true;

remainingSeconds = Number(settings.turnTimeLimit);

turnTimeLimitSelect.value = settings.turnTimeLimit;

updateTimerDisplay();
updateScoreboard();
updateStatisticsDisplay();