// ============================================================
// CONNECTIONS GAME
// ============================================================
//
// How it works:
// 1. The player picks a numbered puzzle from the picker grid.
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
  let animating = false;    // True during correct-guess animation
  let remainingWords = [];  // Words still on the board

  // DOM references
  let boardEl, solvedEl, mistakesEl, submitBtn, deselectBtn, shuffleBtn, newGameBtn;
  let pickerEl, gameEl, puzzleGridEl;

  // Track which puzzle IDs have been completed (won)
  function getCompletedIds() {
    return JSON.parse(localStorage.getItem('connections-completed') || '[]');
  }

  function saveCompleted(id) {
    const completed = getCompletedIds();
    if (!completed.includes(id)) {
      completed.push(id);
      localStorage.setItem('connections-completed', JSON.stringify(completed));
    }
  }

  function init() {
    boardEl = document.getElementById('connections-board');
    solvedEl = document.getElementById('connections-solved');
    mistakesEl = document.getElementById('connections-mistakes');
    submitBtn = document.getElementById('connections-submit');
    deselectBtn = document.getElementById('connections-deselect');
    shuffleBtn = document.getElementById('connections-shuffle');
    newGameBtn = document.getElementById('connections-new-game');
    pickerEl = document.getElementById('connections-picker');
    gameEl = document.getElementById('connections-game');
    puzzleGridEl = document.getElementById('connections-puzzle-grid');

    submitBtn.addEventListener('click', submitGuess);
    deselectBtn.addEventListener('click', deselectAll);
    shuffleBtn.addEventListener('click', shuffleBoard);
    newGameBtn.addEventListener('click', showPicker);

    renderPicker();
  }

  // --------------------------------------------------------
  // PUZZLE PICKER
  // --------------------------------------------------------

  function renderPicker() {
    const completed = getCompletedIds();
    puzzleGridEl.innerHTML = '';

    CONNECTIONS_PUZZLES.forEach(p => {
      const btn = document.createElement('button');
      btn.classList.add('puzzle-pick-btn');
      if (completed.includes(p.id)) btn.classList.add('completed');
      btn.textContent = p.id;
      btn.addEventListener('click', () => startPuzzle(p.id));
      puzzleGridEl.appendChild(btn);
    });
  }

  function showPicker() {
    // Clean up any flying tiles from interrupted animations
    document.querySelectorAll('.conn-tile-flying').forEach(c => c.remove());
    animating = false;

    gameEl.classList.add('hidden');
    pickerEl.classList.remove('hidden');
    renderPicker();
  }

  function isInGame() {
    return gameEl && !gameEl.classList.contains('hidden');
  }

  function startPuzzle(id) {
    puzzle = CONNECTIONS_PUZZLES.find(p => p.id === id);
    if (!puzzle) return;

    pickerEl.classList.add('hidden');
    gameEl.classList.remove('hidden');

    // Collect and shuffle all 16 words
    remainingWords = puzzle.groups.flatMap(g => g.words);
    shuffle(remainingWords);

    selected = new Set();
    solved = [];
    mistakes = 0;
    gameOver = false;
    animating = false;

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

  function shuffleBoard() {
    if (gameOver) return;
    shuffle(remainingWords);
    renderBoard();
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
    if (selected.size !== 4 || gameOver || animating) return;

    const selectedArr = [...selected];

    // Check if the selected words exactly match any unsolved group
    const matchedGroup = puzzle.groups.find(group => {
      if (solved.includes(group)) return false;
      return group.words.every(w => selected.has(w));
    });

    if (matchedGroup) {
      // Correct! Animate tiles flying to solved area
      animating = true;

      const selectedTiles = Array.from(boardEl.querySelectorAll('.conn-tile.selected'));
      const tileRects = selectedTiles.map(t => t.getBoundingClientRect());
      const solvedRect = solvedEl.getBoundingClientRect();

      // Create flying clones at the original tile positions
      const clones = selectedTiles.map((tile, i) => {
        const rect = tileRects[i];
        const clone = tile.cloneNode(true);
        clone.classList.remove('selected');
        clone.classList.add('conn-tile-flying');
        Object.assign(clone.style, {
          position: 'fixed',
          left: rect.left + 'px',
          top: rect.top + 'px',
          width: rect.width + 'px',
          height: rect.height + 'px',
          zIndex: '1000',
          margin: '0',
          boxSizing: 'border-box',
        });
        document.body.appendChild(clone);
        return clone;
      });

      // Hide original selected tiles
      selectedTiles.forEach(t => t.style.visibility = 'hidden');

      // Animate clones flying up to the solved area
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const targetY = solvedRect.bottom;
          const segWidth = solvedRect.width / 4;
          clones.forEach((clone, i) => {
            clone.style.left = (solvedRect.left + i * segWidth) + 'px';
            clone.style.top = targetY + 'px';
            clone.style.width = segWidth + 'px';
            clone.style.height = '48px';
            clone.style.opacity = '0';
          });
        });
      });

      // After animation, update state and render the solved group
      setTimeout(() => {
        clones.forEach(c => c.remove());

        solved.push(matchedGroup);
        renderSolvedGroup(matchedGroup);
        remainingWords = remainingWords.filter(w => !selected.has(w));
        selected.clear();
        renderBoard();
        renderMistakes();
        animating = false;

        if (solved.length === 4) {
          endGame(true);
        }
      }, 450);
    } else {
      // Wrong guess
      // Check if they're "one away" (3 of 4 correct in some group)
      const almostGroup = puzzle.groups.find(group => {
        if (solved.includes(group)) return false;
        const overlap = group.words.filter(w => selected.has(w));
        return overlap.length === 3;
      });

      mistakes++;
      renderBoard();
      renderMistakes();

      // Shake the selected tiles
      const selectedTiles = boardEl.querySelectorAll('.conn-tile.selected');
      selectedTiles.forEach(t => t.classList.add('shake'));
      setTimeout(() => {
        selectedTiles.forEach(t => t.classList.remove('shake'));
      }, 600);

      if (almostGroup) {
        mistakesEl.textContent = 'One away!';
        mistakesEl.classList.add('one-away');
        setTimeout(() => {
          mistakesEl.classList.remove('one-away');
          renderMistakes();
        }, 3000);
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
      saveCompleted(puzzle.id);
    }

    newGameBtn.classList.remove('hidden');

    // Save played puzzle
    const played = JSON.parse(localStorage.getItem('connections-played') || '[]');
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

  return { init, showPicker, isInGame };
})();
