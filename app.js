// ============================================================
// APP SHELL
// ============================================================
//
// This file does three things:
// 1. Gates access behind a simple client-side login
// 2. Registers the service worker (making it a PWA)
// 3. Handles navigation between the home screen and games
//
// SECURITY NOTE: This login is purely client-side. The username
// and password are in this JS file. Anyone who views source or
// opens dev tools can bypass it. This is fine for keeping
// strangers away from a personal game app, but it's NOT real
// authentication. Real auth requires a server.

// --------------------------------------------------------
// LOGIN GATE
// --------------------------------------------------------

const AUTH_KEY = 'word-games-auth';
const VALID_USER = 'playground';
const VALID_PASS = 'playground';

const loginScreen = document.getElementById('login-screen');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const header = document.getElementById('header');

function unlockApp() {
  loginScreen.classList.remove('active');
  header.classList.remove('hidden');
  showScreen('home');
}

// Check if already authenticated from a previous session
if (localStorage.getItem(AUTH_KEY) === 'true') {
  unlockApp();
}

loginForm.addEventListener('submit', e => {
  e.preventDefault();
  const user = document.getElementById('login-user').value;
  const pass = document.getElementById('login-pass').value;

  if (user === VALID_USER && pass === VALID_PASS) {
    localStorage.setItem(AUTH_KEY, 'true');
    loginError.classList.add('hidden');
    unlockApp();
  } else {
    loginError.classList.remove('hidden');
  }
});

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
  // Hide all screens (including login)
  loginScreen.classList.remove('active');
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

backBtn.addEventListener('click', () => showScreen('home'));
