// ============================================================
// CONNECTIONS GAME
// ============================================================
//
// How it works:
// 1. A puzzle with 4 groups of 4 words is chosen at random.
// 2. All 16 words are shuffled and displayed in a 4x4 grid.
// 3. The player selects 4 words they think belong together
//    and hits "Submit".
// 4. If correct, the group is revealed and removed from the grid.
//    If wrong, they lose a "life" (4 mistakes = game over).
// 5. Game ends when all groups are found or mistakes run out.

const Connections = (() => {
  let puzzle = null;        // Current puzzle data
  let selected = new Set(); // Currently selected word strings
  let solved = [];          // Array of solved group objects
  let mistakes = 0;
  let maxMistakes = 4;
  let gameOver = false;
  let remainingWords = [];  // Words still on the board

  // DOM references
  let boardEl, solvedEl, mistakesEl, submitBtn, deselectBtn, newGameBtn;

  // Track which puzzle IDs have been played
  function getPlayedIds() {
    return JSON.parse(localStorage.getItem('connections-played') || '[]');
  }

  function init() {
    boardEl = document.getElementById('connections-board');
    solvedEl = document.getElementById('connections-solved');
    mistakesEl = document.getElementById('connections-mistakes');
    submitBtn = document.getElementById('connections-submit');
    deselectBtn = document.getElementById('connections-deselect');
    newGameBtn = document.getElementById('connections-new-game');

    submitBtn.addEventListener('click', submitGuess);
    deselectBtn.addEventListener('click', deselectAll);
    newGameBtn.addEventListener('click', newGame);

    newGame();
  }

  function newGame() {
    // Pick a puzzle the player hasn't seen yet (if possible)
    const played = getPlayedIds();
    let available = CONNECTIONS_PUZZLES.filter(p => !played.includes(p.id));
    if (available.length === 0) {
      // All puzzles played - reset and allow replays
      localStorage.setItem('connections-played', '[]');
      available = CONNECTIONS_PUZZLES;
    }
    puzzle = available[Math.floor(Math.random() * available.length)];

    // Collect and shuffle all 16 words
    remainingWords = puzzle.groups.flatMap(g => g.words);
    shuffle(remainingWords);

    selected = new Set();
    solved = [];
    mistakes = 0;
    gameOver = false;

    newGameBtn.classList.add('hidden');
    submitBtn.disabled = true;
    solvedEl.innerHTML = '';

    renderBoard();
    renderMistakes();
  }

  // Fisher-Yates shuffle - the standard unbiased shuffle algorithm.
  // It walks backwards through the array, swapping each element with
  // a random earlier element. Every permutation is equally likely.
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // --------------------------------------------------------
  // RENDERING
  // --------------------------------------------------------

  function renderBoard() {
    boardEl.innerHTML = '';
    if (remainingWords.length === 0) return;

    remainingWords.forEach(word => {
      const btn = document.createElement('button');
      btn.classList.add('conn-tile');
      btn.textContent = word;
      if (selected.has(word)) btn.classList.add('selected');
      btn.addEventListener('click', () => toggleWord(word));
      boardEl.appendChild(btn);
    });

    // Enable/disable submit based on selection count
    submitBtn.disabled = selected.size !== 4;

    // Show/hide controls
    const controlsEl = document.getElementById('connections-controls');
    controlsEl.classList.toggle('hidden', gameOver || remainingWords.length === 0);
  }

  function renderMistakes() {
    if (maxMistakes - mistakes > 0 && !gameOver) {
      // Show remaining mistakes as dots (like NYT does)
      const dots = Array(maxMistakes - mistakes).fill('\u25CF').join(' ');
      mistakesEl.textContent = `Mistakes remaining: ${dots}`;
    } else {
      mistakesEl.textContent = '';
    }
  }

  function renderSolvedGroup(group) {
    const div = document.createElement('div');
    div.classList.add('solved-group', `difficulty-${group.difficulty}`);
    div.innerHTML = `
      <div class="group-name">${group.name}</div>
      <div class="group-words">${group.words.join(', ')}</div>
    `;
    solvedEl.appendChild(div);
  }

  // --------------------------------------------------------
  // INTERACTION
  // --------------------------------------------------------

  function toggleWord(word) {
    if (gameOver) return;

    if (selected.has(word)) {
      selected.delete(word);
    } else if (selected.size < 4) {
      selected.add(word);
    }
    renderBoard();
  }

  function deselectAll() {
    selected.clear();
    renderBoard();
  }

  function submitGuess() {
    if (selected.size !== 4 || gameOver) return;

    const selectedArr = [...selected];

    // Check if the selected words exactly match any unsolved group
    const matchedGroup = puzzle.groups.find(group => {
      if (solved.includes(group)) return false;
      return group.words.every(w => selected.has(w));
    });

    if (matchedGroup) {
      // Correct!
      solved.push(matchedGroup);
      renderSolvedGroup(matchedGroup);

      // Remove solved words from the board
      remainingWords = remainingWords.filter(w => !selected.has(w));
      selected.clear();
      renderBoard();
      renderMistakes();

      // Check if all groups found
      if (solved.length === 4) {
        endGame(true);
      }
    } else {
      // Check if they're "one away" (3 of 4 correct in some group)
      const almostGroup = puzzle.groups.find(group => {
        if (solved.includes(group)) return false;
        const overlap = group.words.filter(w => selected.has(w));
        return overlap.length === 3;
      });

      mistakes++;
      selected.clear();
      renderBoard();
      renderMistakes();

      if (almostGroup) {
        mistakesEl.textContent = 'One away!';
        setTimeout(renderMistakes, 1500);
      }

      if (mistakes >= maxMistakes) {
        endGame(false);
      }
    }
  }

  function endGame(won) {
    gameOver = true;

    // Reveal any unsolved groups
    if (!won) {
      puzzle.groups.forEach(group => {
        if (!solved.includes(group)) {
          renderSolvedGroup(group);
        }
      });
      remainingWords = [];
      renderBoard();
      mistakesEl.textContent = 'Better luck next time!';
    } else {
      mistakesEl.textContent = mistakes === 0 ? 'Perfect!' : 'Well done!';
    }

    newGameBtn.classList.remove('hidden');

    // Save played puzzle
    const played = getPlayedIds();
    if (!played.includes(puzzle.id)) {
      played.push(puzzle.id);
      localStorage.setItem('connections-played', JSON.stringify(played));
    }

    // Save stats
    const stats = JSON.parse(localStorage.getItem('connections-stats') || '{"played":0,"won":0}');
    stats.played++;
    if (won) stats.won++;
    localStorage.setItem('connections-stats', JSON.stringify(stats));
  }

  return { init, newGame };
})();
