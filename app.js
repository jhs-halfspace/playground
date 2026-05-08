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
  connections: document.getElementById('connections-screen'),
  balatro: document.getElementById('balatro-screen')
};

const headerTitle = document.getElementById('header-title');
const backBtn = document.getElementById('back-btn');

let wordleInitialized = false;
let connectionsInitialized = false;
let balatroInitialized = false;

function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');

  // Theme the page for immersive game screens
  document.body.dataset.screen = name;

  if (name === 'home') {
    headerTitle.textContent = 'Games';
    backBtn.classList.add('hidden');
  } else {
    const titles = { wordle: 'Wordle', connections: 'Connections', balatro: 'Balatro' };
    headerTitle.textContent = titles[name] || name;
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
    if (game === 'balatro' && !balatroInitialized) {
      Balatro.init();
      balatroInitialized = true;
    }
  });
});

backBtn.addEventListener('click', () => {
  // If inside a game puzzle, go back to the puzzle picker first
  if (screens.wordle.classList.contains('active') && Wordle.isInGame()) {
    Wordle.showPicker();
    return;
  }
  if (screens.connections.classList.contains('active') && Connections.isInGame()) {
    Connections.showPicker();
    return;
  }
  showScreen('home');
});
