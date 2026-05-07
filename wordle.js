// ============================================================
// WORDLE GAME
// ============================================================
//
// How it works:
// 1. A random word is picked from WORDLE_ANSWERS.
// 2. The player types guesses using the on-screen keyboard
//    (or physical keyboard on desktop).
// 3. After each guess, tiles flip and reveal colors:
//    - Green: correct letter in correct position
//    - Yellow: correct letter in wrong position
//    - Gray: letter not in the word
// 4. Game ends on correct guess or after 6 attempts.
//
// State is stored in a simple object. The UI is built by
// directly manipulating the DOM (no framework needed).

const Wordle = (() => {
  // Game state
  let answer = '';
  let guesses = [];       // Array of submitted guess strings
  let currentGuess = '';   // What the player is currently typing
  let gameOver = false;
  let maxGuesses = 6;

  // DOM references (set in init)
  let boardEl, messageEl, keyboardEl, newGameBtn;

  // Keyboard layout - matches the standard QWERTY layout
  const KEYBOARD_ROWS = [
    ['Q','W','E','R','T','Y','U','I','O','P'],
    ['A','S','D','F','G','H','J','K','L'],
    ['ENTER','Z','X','C','V','B','N','M','DEL']
  ];

  // Track the "best" status for each letter on the keyboard.
  // Priority: correct > present > absent
  let letterStates = {};

  function init() {
    boardEl = document.getElementById('wordle-board');
    messageEl = document.getElementById('wordle-message');
    keyboardEl = document.getElementById('wordle-keyboard');
    newGameBtn = document.getElementById('wordle-new-game');

    buildKeyboard();
    newGameBtn.addEventListener('click', newGame);

    // Listen for physical keyboard input
    document.addEventListener('keydown', handleKeydown);

    newGame();
  }

  function newGame() {
    // Pick a random answer
    answer = WORDLE_ANSWERS[Math.floor(Math.random() * WORDLE_ANSWERS.length)].toUpperCase();
    guesses = [];
    currentGuess = '';
    gameOver = false;
    letterStates = {};
    messageEl.textContent = '';
    newGameBtn.classList.add('hidden');

    buildBoard();
    updateKeyboard();
  }

  // --------------------------------------------------------
  // BOARD: 6 rows x 5 columns of tiles
  // --------------------------------------------------------

  function buildBoard() {
    boardEl.innerHTML = '';
    for (let row = 0; row < maxGuesses; row++) {
      for (let col = 0; col < 5; col++) {
        const tile = document.createElement('div');
        tile.classList.add('wordle-tile');
        tile.dataset.row = row;
        tile.dataset.col = col;
        boardEl.appendChild(tile);
      }
    }
  }

  function getTile(row, col) {
    return boardEl.querySelector(`[data-row="${row}"][data-col="${col}"]`);
  }

  // Update the current row to show what the player is typing
  function renderCurrentGuess() {
    const row = guesses.length;
    for (let col = 0; col < 5; col++) {
      const tile = getTile(row, col);
      const letter = currentGuess[col] || '';
      tile.textContent = letter;
      tile.classList.toggle('filled', letter !== '');
    }
  }

  // --------------------------------------------------------
  // KEYBOARD: on-screen buttons
  // --------------------------------------------------------

  function buildKeyboard() {
    keyboardEl.innerHTML = '';
    KEYBOARD_ROWS.forEach(row => {
      const rowEl = document.createElement('div');
      rowEl.classList.add('keyboard-row');
      row.forEach(key => {
        const btn = document.createElement('button');
        btn.classList.add('key');
        btn.textContent = key;
        btn.dataset.key = key;
        if (key === 'ENTER' || key === 'DEL') btn.classList.add('wide');
        btn.addEventListener('click', () => handleInput(key));
        rowEl.appendChild(btn);
      });
      keyboardEl.appendChild(rowEl);
    });
  }

  function updateKeyboard() {
    keyboardEl.querySelectorAll('.key').forEach(btn => {
      const key = btn.dataset.key;
      btn.classList.remove('correct', 'present', 'absent');
      if (letterStates[key]) {
        btn.classList.add(letterStates[key]);
      }
    });
  }

  // --------------------------------------------------------
  // INPUT HANDLING
  // --------------------------------------------------------

  function handleKeydown(e) {
    // Only handle keys when Wordle screen is active
    if (!document.getElementById('wordle-screen').classList.contains('active')) return;

    if (e.key === 'Enter') handleInput('ENTER');
    else if (e.key === 'Backspace') handleInput('DEL');
    else if (/^[a-zA-Z]$/.test(e.key)) handleInput(e.key.toUpperCase());
  }

  function handleInput(key) {
    if (gameOver) return;

    if (key === 'DEL') {
      currentGuess = currentGuess.slice(0, -1);
      renderCurrentGuess();
      return;
    }

    if (key === 'ENTER') {
      submitGuess();
      return;
    }

    // Regular letter
    if (currentGuess.length < 5) {
      currentGuess += key;
      renderCurrentGuess();
    }
  }

  // --------------------------------------------------------
  // GUESS EVALUATION
  // --------------------------------------------------------
  //
  // The algorithm for coloring letters is trickier than it looks.
  // Consider: answer = "ABBOT", guess = "BOOST"
  //
  // Naive approach would color both B's as "present", but really
  // one B is correct (position 2) and there are only 2 B's in
  // the answer, so we need to be careful about double-counting.
  //
  // Steps:
  // 1. First pass: mark exact matches (green).
  // 2. Second pass: for remaining letters, check if they exist
  //    in remaining (unmatched) positions of the answer.

  function evaluateGuess(guess) {
    const result = Array(5).fill('absent');
    const answerLetters = answer.split('');
    const guessLetters = guess.split('');

    // First pass: find exact matches (correct/green)
    for (let i = 0; i < 5; i++) {
      if (guessLetters[i] === answerLetters[i]) {
        result[i] = 'correct';
        answerLetters[i] = null; // Mark as used
        guessLetters[i] = null;
      }
    }

    // Second pass: find present letters (yellow)
    for (let i = 0; i < 5; i++) {
      if (guessLetters[i] === null) continue; // Already matched
      const idx = answerLetters.indexOf(guessLetters[i]);
      if (idx !== -1) {
        result[i] = 'present';
        answerLetters[idx] = null; // Mark as used
      }
    }

    return result;
  }

  function submitGuess() {
    if (currentGuess.length !== 5) {
      showMessage('Not enough letters');
      return;
    }

    if (!WORDLE_VALID_GUESSES.has(currentGuess.toLowerCase())) {
      showMessage('Not in word list');
      return;
    }

    const guess = currentGuess;
    const result = evaluateGuess(guess);
    const row = guesses.length;

    guesses.push(guess);
    currentGuess = '';

    // Animate tile reveals with staggered delays.
    // Each tile flips after a short delay so they reveal left-to-right.
    result.forEach((state, col) => {
      const tile = getTile(row, col);
      setTimeout(() => {
        tile.classList.add('reveal');
        // Apply color at the halfway point of the flip animation
        setTimeout(() => {
          tile.classList.add(state);
        }, 250);
      }, col * 300); // 300ms between each tile
    });

    // Update letter states for the keyboard
    // Priority: correct > present > absent (never downgrade)
    const priority = { correct: 3, present: 2, absent: 1 };
    for (let i = 0; i < 5; i++) {
      const letter = guess[i];
      const current = letterStates[letter];
      if (!current || priority[result[i]] > priority[current]) {
        letterStates[letter] = result[i];
      }
    }

    // Wait for all animations to finish, then check win/lose
    setTimeout(() => {
      updateKeyboard();

      if (guess === answer) {
        const messages = ['Genius!', 'Magnificent!', 'Impressive!', 'Splendid!', 'Great!', 'Phew!'];
        showMessage(messages[row] || 'Nice!');
        endGame(true);
      } else if (guesses.length >= maxGuesses) {
        showMessage(`The word was ${answer}`);
        endGame(false);
      }
    }, 5 * 300 + 300);
  }

  function showMessage(msg) {
    messageEl.textContent = msg;
    // Clear non-permanent messages after 2 seconds
    if (!gameOver) {
      setTimeout(() => {
        if (messageEl.textContent === msg) messageEl.textContent = '';
      }, 2000);
    }
  }

  function endGame(won) {
    gameOver = true;
    newGameBtn.classList.remove('hidden');

    // Save stats to localStorage
    const stats = JSON.parse(localStorage.getItem('wordle-stats') || '{"played":0,"won":0,"distribution":[0,0,0,0,0,0]}');
    stats.played++;
    if (won) {
      stats.won++;
      stats.distribution[guesses.length - 1]++;
    }
    localStorage.setItem('wordle-stats', JSON.stringify(stats));
  }

  // Public API - init is called by app.js when navigating to Wordle
  return { init, newGame };
})();
