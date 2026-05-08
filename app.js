// ============================================================
// APP SHELL
// ============================================================
//
// This file does two things:
// 1. Registers the service worker (making it a PWA)
// 2. Handles navigation between the home screen and games

// --------------------------------------------------------
// SERVICE WORKER REGISTRATION
// --------------------------------------------------------

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then(reg => console.log('SW registered:', reg.scope))
      .catch(err => console.log('SW registration failed:', err));
  });
}

// --------------------------------------------------------
// NAVIGATION
// --------------------------------------------------------

const screens = {
  home: document.getElementById('home-screen'),
  wordle: document.getElementById('wordle-screen'),
  connections: document.getElementById('connections-screen')
};

const headerTitle = document.getElementById('header-title');
const backBtn = document.getElementById('back-btn');

let wordleInitialized = false;
let connectionsInitialized = false;

function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');

  if (name === 'home') {
    headerTitle.textContent = 'Word Games';
    backBtn.classList.add('hidden');
  } else {
    headerTitle.textContent = name === 'wordle' ? 'Wordle' : 'Connections';
    backBtn.classList.remove('hidden');
  }
}

document.querySelectorAll('.game-card').forEach(card => {
  card.addEventListener('click', () => {
    const game = card.dataset.game;
    showScreen(game);

    if (game === 'wordle' && !wordleInitialized) {
      Wordle.init();
      wordleInitialized = true;
    }
    if (game === 'connections' && !connectionsInitialized) {
      Connections.init();
      connectionsInitialized = true;
    }
  });
});

backBtn.addEventListener('click', () => {
  // If inside a connections puzzle, go back to the puzzle picker first
  if (screens.connections.classList.contains('active') && Connections.isInGame()) {
    Connections.showPicker();
    return;
  }
  showScreen('home');
});
