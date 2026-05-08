// ============================================================
// BALATRO - A poker roguelike card game
// ============================================================
//
// How it works:
// 1. Player starts a "run" with a standard 52-card deck.
// 2. Each run has 8 antes, each with 3 blinds (Small, Big, Boss).
// 3. Per blind: deal 8 cards, player selects up to 5 to play
//    as a poker hand. Score = chips × mult. Beat the target
//    score using up to 4 hands and 3 discards.
// 4. Between blinds, visit the shop to buy jokers that boost
//    scoring. Jokers add chips, mult, or multiply mult.
// 5. Win by defeating all 8 antes. Lose if you can't reach
//    the target score before running out of hands.

const Balatro = (() => {

  // ============================================================
  // CONSTANTS
  // ============================================================

  const SUITS = ['spades', 'hearts', 'diamonds', 'clubs'];
  const SUIT_SYMBOLS = { spades: '\u2660', hearts: '\u2665', diamonds: '\u2666', clubs: '\u2663' };
  const RANKS = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
  const RANK_CHIPS = { '2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':10,'Q':10,'K':10,'A':11 };
  const RANK_ORDER = { '2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':11,'Q':12,'K':13,'A':14 };

  // Base chips and mult for each poker hand type
  const HAND_BASE = {
    'Royal Flush':     { chips: 100, mult: 8 },
    'Straight Flush':  { chips: 100, mult: 8 },
    'Four of a Kind':  { chips: 60,  mult: 7 },
    'Full House':      { chips: 40,  mult: 4 },
    'Flush':           { chips: 35,  mult: 4 },
    'Straight':        { chips: 30,  mult: 4 },
    'Three of a Kind': { chips: 30,  mult: 3 },
    'Two Pair':        { chips: 20,  mult: 2 },
    'Pair':            { chips: 10,  mult: 2 },
    'High Card':       { chips: 5,   mult: 1 },
  };

  // Hand leveling: every PLAYS_PER_LEVEL plays of a hand type, it levels up
  const LEVEL_CHIPS_BONUS = 10;
  const LEVEL_MULT_BONUS = 1;
  const PLAYS_PER_LEVEL = 3;

  // Score targets: base amount for small blind per ante
  const ANTE_BASES = [300, 800, 2000, 5000, 11000, 20000, 35000, 50000];
  const BLIND_MULTS = [1, 1.5, 2];
  const BLIND_NAMES = ['Small Blind', 'Big Blind', 'Boss Blind'];

  const BOSS_EFFECTS = [
    { name: 'The Wall',    desc: 'Score target is doubled',       type: 'wall' },
    { name: 'The Needle',  desc: 'Only 1 hand this round',        type: 'needle' },
    { name: 'The Flint',   desc: 'Base Chips and Mult are halved', type: 'flint' },
    { name: 'The Mark',    desc: 'Face cards are debuffed',        type: 'mark' },
    { name: 'The Psychic', desc: 'Must play exactly 5 cards',      type: 'psychic' },
  ];

  const MAX_JOKERS = 5;
  const HAND_SIZE = 8;
  const MAX_HANDS = 4;
  const MAX_DISCARDS = 3;
  const MAX_SELECTED = 5;
  const REROLL_COST = 5;
  const STARTING_MONEY = 4;

  // ============================================================
  // JOKER DEFINITIONS
  // ============================================================

  const JOKER_DEFS = [
    { id: 'joker', name: 'Joker', desc: '+4 Mult',
      cost: 2, rarity: 'common',
      apply(ctx) { ctx.mult += 4; } },

    { id: 'greedy', name: 'Greedy Joker', desc: '+3 Mult per \u2666 scored',
      cost: 5, rarity: 'common',
      apply(ctx) { ctx.mult += 3 * ctx.scoringCards.filter(c => c.suit === 'diamonds').length; } },

    { id: 'lusty', name: 'Lusty Joker', desc: '+3 Mult per \u2665 scored',
      cost: 5, rarity: 'common',
      apply(ctx) { ctx.mult += 3 * ctx.scoringCards.filter(c => c.suit === 'hearts').length; } },

    { id: 'wrathful', name: 'Wrathful Joker', desc: '+3 Mult per \u2660 scored',
      cost: 5, rarity: 'common',
      apply(ctx) { ctx.mult += 3 * ctx.scoringCards.filter(c => c.suit === 'spades').length; } },

    { id: 'gluttonous', name: 'Gluttonous Joker', desc: '+3 Mult per \u2663 scored',
      cost: 5, rarity: 'common',
      apply(ctx) { ctx.mult += 3 * ctx.scoringCards.filter(c => c.suit === 'clubs').length; } },

    { id: 'jolly', name: 'Jolly Joker', desc: '+8 Mult if hand has a Pair',
      cost: 3, rarity: 'common',
      apply(ctx) { if (containsSubHand(ctx.playedCards, 'Pair')) ctx.mult += 8; } },

    { id: 'zany', name: 'Zany Joker', desc: '+12 Mult if hand has Three of a Kind',
      cost: 4, rarity: 'common',
      apply(ctx) { if (containsSubHand(ctx.playedCards, 'Three of a Kind')) ctx.mult += 12; } },

    { id: 'mad', name: 'Mad Joker', desc: '+10 Mult if hand has Two Pair',
      cost: 4, rarity: 'common',
      apply(ctx) { if (containsSubHand(ctx.playedCards, 'Two Pair')) ctx.mult += 10; } },

    { id: 'crazy', name: 'Crazy Joker', desc: '+12 Mult if hand has a Straight',
      cost: 4, rarity: 'uncommon',
      apply(ctx) { if (containsSubHand(ctx.playedCards, 'Straight')) ctx.mult += 12; } },

    { id: 'sly', name: 'Sly Joker', desc: '+50 Chips if hand has a Pair',
      cost: 3, rarity: 'common',
      apply(ctx) { if (containsSubHand(ctx.playedCards, 'Pair')) ctx.chips += 50; } },

    { id: 'wily', name: 'Wily Joker', desc: '+100 Chips if hand has Three of a Kind',
      cost: 4, rarity: 'common',
      apply(ctx) { if (containsSubHand(ctx.playedCards, 'Three of a Kind')) ctx.chips += 100; } },

    { id: 'half', name: 'Half Joker', desc: '+20 Mult if 3 or fewer cards played',
      cost: 5, rarity: 'common',
      apply(ctx) { if (ctx.playedCards.length <= 3) ctx.mult += 20; } },

    { id: 'banner', name: 'Banner', desc: '+30 Chips per discard remaining',
      cost: 5, rarity: 'common',
      apply(ctx) { ctx.chips += 30 * ctx.discardsLeft; } },

    { id: 'mystic', name: 'Mystic Summit', desc: '+15 Mult if 0 discards left',
      cost: 5, rarity: 'common',
      apply(ctx) { if (ctx.discardsLeft === 0) ctx.mult += 15; } },

    { id: 'duo', name: 'The Duo', desc: '\u00d72 Mult if hand has a Pair',
      cost: 8, rarity: 'uncommon',
      apply(ctx) { if (containsSubHand(ctx.playedCards, 'Pair')) ctx.mult *= 2; } },

    { id: 'trio', name: 'The Trio', desc: '\u00d73 Mult if hand has Three of a Kind',
      cost: 8, rarity: 'uncommon',
      apply(ctx) { if (containsSubHand(ctx.playedCards, 'Three of a Kind')) ctx.mult *= 3; } },

    { id: 'family', name: 'The Family', desc: '\u00d74 Mult if hand has Four of a Kind',
      cost: 8, rarity: 'uncommon',
      apply(ctx) { if (containsSubHand(ctx.playedCards, 'Four of a Kind')) ctx.mult *= 4; } },

    { id: 'even', name: 'Even Steven', desc: '+4 Mult per even card scored',
      cost: 4, rarity: 'common',
      apply(ctx) { ctx.mult += 4 * ctx.scoringCards.filter(c => ['2','4','6','8','10'].includes(c.rank)).length; } },

    { id: 'odd', name: 'Odd Todd', desc: '+30 Chips per odd card scored',
      cost: 4, rarity: 'common',
      apply(ctx) { ctx.chips += 30 * ctx.scoringCards.filter(c => ['A','3','5','7','9'].includes(c.rank)).length; } },

    { id: 'fibonacci', name: 'Fibonacci', desc: '+8 Mult per A, 2, 3, 5, or 8 scored',
      cost: 6, rarity: 'uncommon',
      apply(ctx) { ctx.mult += 8 * ctx.scoringCards.filter(c => ['A','2','3','5','8'].includes(c.rank)).length; } },
  ];

  // ============================================================
  // STATE
  // ============================================================

  let state = {};
  let dom = {};

  function freshState() {
    return {
      phase: 'menu',       // menu | playing | scoring | shop | gameover
      deck: [],
      drawPile: [],
      hand: [],
      selected: new Set(),  // indices into hand
      jokers: [],           // array of { id }
      ante: 1,
      blind: 0,             // 0=small, 1=big, 2=boss
      bossEffect: null,
      roundScore: 0,
      scoreTarget: 0,
      hands: MAX_HANDS,
      discards: MAX_DISCARDS,
      money: STARTING_MONEY,
      handLevels: {},       // { 'Pair': { level: 1, plays: 0 }, ... }
      sortByRank: true,
      lastEarnings: null,
    };
  }

  // ============================================================
  // HELPERS
  // ============================================================

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function createDeck() {
    const deck = [];
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        deck.push({ suit, rank });
      }
    }
    return deck;
  }

  function show(el) { if (el) el.classList.remove('hidden'); }
  function hide(el) { if (el) el.classList.add('hidden'); }

  // ============================================================
  // HAND EVALUATION
  // ============================================================

  function evaluateHand(cards) {
    if (!cards || cards.length === 0) return null;

    const rankCounts = {};
    const suitCounts = {};
    cards.forEach(c => {
      rankCounts[c.rank] = (rankCounts[c.rank] || 0) + 1;
      suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1;
    });

    const counts = Object.values(rankCounts).sort((a, b) => b - a);
    const isFlush = cards.length === 5 && Object.values(suitCounts).some(c => c >= 5);

    let isStraight = false;
    if (cards.length === 5) {
      const orders = cards.map(c => RANK_ORDER[c.rank]).sort((a, b) => a - b);
      const unique = [...new Set(orders)];
      if (unique.length === 5) {
        isStraight = unique[4] - unique[0] === 4;
        // Ace-low straight: A-2-3-4-5
        if (!isStraight && unique.includes(14) &&
            unique.includes(2) && unique.includes(3) &&
            unique.includes(4) && unique.includes(5)) {
          isStraight = true;
        }
      }
    }

    const isRoyal = isStraight && isFlush &&
      cards.some(c => RANK_ORDER[c.rank] === 14) &&
      cards.some(c => RANK_ORDER[c.rank] === 13);

    if (isRoyal) return 'Royal Flush';
    if (isStraight && isFlush) return 'Straight Flush';
    if (counts[0] >= 4) return 'Four of a Kind';
    if (counts[0] === 3 && counts.length >= 2 && counts[1] >= 2) return 'Full House';
    if (isFlush) return 'Flush';
    if (isStraight) return 'Straight';
    if (counts[0] === 3) return 'Three of a Kind';
    if (counts[0] === 2 && counts.length >= 2 && counts[1] === 2) return 'Two Pair';
    if (counts[0] === 2) return 'Pair';
    return 'High Card';
  }

  // Check whether the played cards contain a sub-hand pattern.
  // Used by jokers like "if hand contains a Pair". A Full House
  // contains both a Pair and Three of a Kind, etc.
  function containsSubHand(cards, handType) {
    const rankCounts = {};
    const suitCounts = {};
    cards.forEach(c => {
      rankCounts[c.rank] = (rankCounts[c.rank] || 0) + 1;
      suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1;
    });
    const counts = Object.values(rankCounts).sort((a, b) => b - a);

    switch (handType) {
      case 'Pair':
        return counts[0] >= 2;
      case 'Two Pair':
        return counts.length >= 2 && counts[0] >= 2 && counts[1] >= 2;
      case 'Three of a Kind':
        return counts[0] >= 3;
      case 'Four of a Kind':
        return counts[0] >= 4;
      case 'Straight': {
        if (cards.length < 5) return false;
        const orders = [...new Set(cards.map(c => RANK_ORDER[c.rank]))].sort((a, b) => a - b);
        if (orders.length < 5) return false;
        for (let i = 0; i <= orders.length - 5; i++) {
          if (orders[i + 4] - orders[i] === 4) return true;
        }
        return orders.includes(14) && orders.includes(2) &&
               orders.includes(3) && orders.includes(4) && orders.includes(5);
      }
      case 'Flush':
        return cards.length >= 5 && Object.values(suitCounts).some(c => c >= 5);
      default:
        return true;
    }
  }

  // Determine which cards contribute chip value to the hand score.
  // For straights/flushes/full houses all cards score.
  // For pairs/trips/quads only the matching cards score.
  // For high card only the highest card scores.
  function getScoringCards(cards, handType) {
    if (['Straight', 'Flush', 'Full House', 'Straight Flush', 'Royal Flush'].includes(handType)) {
      return [...cards];
    }

    const rankCounts = {};
    cards.forEach(c => { rankCounts[c.rank] = (rankCounts[c.rank] || 0) + 1; });

    if (handType === 'Four of a Kind') {
      const r = Object.keys(rankCounts).find(k => rankCounts[k] >= 4);
      return cards.filter(c => c.rank === r);
    }
    if (handType === 'Three of a Kind') {
      const r = Object.keys(rankCounts).find(k => rankCounts[k] >= 3);
      return cards.filter(c => c.rank === r);
    }
    if (handType === 'Two Pair') {
      const pairs = Object.keys(rankCounts).filter(k => rankCounts[k] >= 2)
        .sort((a, b) => RANK_ORDER[b] - RANK_ORDER[a]).slice(0, 2);
      return cards.filter(c => pairs.includes(c.rank));
    }
    if (handType === 'Pair') {
      const r = Object.keys(rankCounts).find(k => rankCounts[k] >= 2);
      return cards.filter(c => c.rank === r);
    }
    // High Card: highest card only
    return [cards.reduce((best, c) => RANK_ORDER[c.rank] > RANK_ORDER[best.rank] ? c : best)];
  }

  // ============================================================
  // SCORING
  // ============================================================

  function getHandLevel(handType) {
    return state.handLevels[handType] ? state.handLevels[handType].level : 1;
  }

  function levelUpHand(handType) {
    if (!state.handLevels[handType]) {
      state.handLevels[handType] = { level: 1, plays: 0 };
    }
    state.handLevels[handType].plays++;
    if (state.handLevels[handType].plays >= PLAYS_PER_LEVEL) {
      state.handLevels[handType].plays = 0;
      state.handLevels[handType].level++;
    }
  }

  function calculateScore(playedCards, heldCards) {
    const handType = evaluateHand(playedCards);
    if (!handType) return null;

    const base = HAND_BASE[handType];
    const level = getHandLevel(handType);

    let chips = base.chips + (level - 1) * LEVEL_CHIPS_BONUS;
    let mult = base.mult + (level - 1) * LEVEL_MULT_BONUS;

    // Boss: The Flint halves base chips and mult
    if (state.bossEffect && state.bossEffect.type === 'flint') {
      chips = Math.ceil(chips / 2);
      mult = Math.ceil(mult / 2);
    }

    const scoringCards = getScoringCards(playedCards, handType);

    // Add chip value of each scoring card
    scoringCards.forEach(card => {
      // Boss: The Mark debuffs face cards (J, Q, K don't contribute chips)
      if (state.bossEffect && state.bossEffect.type === 'mark' &&
          ['J', 'Q', 'K'].includes(card.rank)) {
        return;
      }
      chips += RANK_CHIPS[card.rank];
    });

    // Apply joker effects in order (order matters for ×Mult)
    const ctx = {
      chips, mult, handType, scoringCards, heldCards, playedCards,
      discardsLeft: state.discards, handsLeft: state.hands,
    };

    state.jokers.forEach(joker => {
      const def = JOKER_DEFS.find(d => d.id === joker.id);
      if (def) def.apply(ctx);
    });

    return {
      chips: Math.floor(ctx.chips),
      mult: Math.floor(ctx.mult),
      total: Math.floor(ctx.chips * ctx.mult),
      handType,
      scoringCards,
      level,
    };
  }

  // ============================================================
  // GAME FLOW
  // ============================================================

  function startRun() {
    Object.assign(state, freshState());
    state.phase = 'playing';
    state.deck = createDeck();
    startBlind();
  }

  function getScoreTarget() {
    const base = ANTE_BASES[Math.min(state.ante - 1, ANTE_BASES.length - 1)];
    let target = Math.floor(base * BLIND_MULTS[state.blind]);
    if (state.bossEffect && state.bossEffect.type === 'wall') {
      target *= 2;
    }
    return target;
  }

  function startBlind() {
    state.phase = 'playing';
    state.roundScore = 0;
    state.hands = MAX_HANDS;
    state.discards = MAX_DISCARDS;
    state.selected = new Set();

    // Boss blind gets a random effect
    if (state.blind === 2) {
      state.bossEffect = BOSS_EFFECTS[Math.floor(Math.random() * BOSS_EFFECTS.length)];
      if (state.bossEffect.type === 'needle') {
        state.hands = 1;
      }
    } else {
      state.bossEffect = null;
    }

    state.scoreTarget = getScoreTarget();

    // Shuffle full deck and deal
    state.drawPile = shuffle([...state.deck]);
    state.hand = state.drawPile.splice(0, HAND_SIZE);
    sortHand();
    render();
  }

  function playHand() {
    if (state.selected.size === 0 || state.hands <= 0 || state.phase !== 'playing') return;

    // Boss: The Psychic requires exactly 5 cards
    if (state.bossEffect && state.bossEffect.type === 'psychic' && state.selected.size !== 5) {
      dom.message.textContent = 'Must play exactly 5 cards!';
      setTimeout(() => { if (state.phase === 'playing') dom.message.textContent = ''; }, 1500);
      return;
    }

    const indices = [...state.selected].sort((a, b) => a - b);
    const playedCards = indices.map(i => state.hand[i]);
    const heldCards = state.hand.filter((_, i) => !state.selected.has(i));

    const result = calculateScore(playedCards, heldCards);
    if (!result) return;

    levelUpHand(result.handType);
    state.roundScore += result.total;
    state.hands--;

    // Remove played cards from hand, draw replacements
    const remaining = state.hand.filter((_, i) => !state.selected.has(i));
    const drawCount = Math.min(indices.length, state.drawPile.length);
    const drawn = state.drawPile.splice(0, drawCount);
    state.hand = [...remaining, ...drawn];
    state.selected = new Set();
    sortHand();

    // Show scoring result briefly
    state.phase = 'scoring';
    render();
    showScoringMessage(result, () => {
      if (state.roundScore >= state.scoreTarget) {
        endBlind(true);
      } else if (state.hands <= 0) {
        endBlind(false);
      } else {
        state.phase = 'playing';
        render();
      }
    });
  }

  function discardCards() {
    if (state.selected.size === 0 || state.discards <= 0 || state.phase !== 'playing') return;

    state.discards--;

    const remaining = state.hand.filter((_, i) => !state.selected.has(i));
    const drawCount = Math.min(state.selected.size, state.drawPile.length);
    const drawn = state.drawPile.splice(0, drawCount);
    state.hand = [...remaining, ...drawn];
    state.selected = new Set();
    sortHand();
    render();
  }

  function endBlind(won) {
    if (!won) {
      state.phase = 'gameover';
      dom.result.textContent = 'Game Over';
      dom.resultDetail.textContent =
        'Reached Ante ' + state.ante + ' \u2013 ' + BLIND_NAMES[state.blind];
      render();
      return;
    }

    // Calculate earnings
    const base = 3;
    const handBonus = state.hands;
    const interest = Math.min(5, Math.floor(state.money / 5));
    state.lastEarnings = { base, handBonus, interest, total: base + handBonus + interest };
    state.money += state.lastEarnings.total;

    // Check win condition: beat ante 8 boss blind
    if (state.ante >= 8 && state.blind >= 2) {
      state.phase = 'gameover';
      dom.result.textContent = 'You Win!';
      dom.resultDetail.textContent =
        'Defeated all 8 antes with $' + state.money;
      render();
      return;
    }

    // Advance to next blind
    state.blind++;
    if (state.blind > 2) {
      state.blind = 0;
      state.ante++;
    }

    state.phase = 'shop';
    generateShop();
    render();
  }

  // ============================================================
  // SHOP
  // ============================================================

  function generateShop() {
    state.shopItems = [];
    const owned = new Set(state.jokers.map(j => j.id));
    const available = JOKER_DEFS.filter(j => !owned.has(j.id));
    const shuffled = shuffle([...available]);
    for (let i = 0; i < Math.min(2, shuffled.length); i++) {
      state.shopItems.push({ ...shuffled[i] });
    }
  }

  function buyJoker(index) {
    const item = state.shopItems[index];
    if (!item || state.money < item.cost || state.jokers.length >= MAX_JOKERS) return;
    state.money -= item.cost;
    state.jokers.push({ id: item.id });
    state.shopItems[index] = null;
    render();
  }

  function sellJoker(index) {
    const joker = state.jokers[index];
    if (!joker) return;
    const def = JOKER_DEFS.find(d => d.id === joker.id);
    state.money += Math.ceil((def ? def.cost : 2) / 2);
    state.jokers.splice(index, 1);
    render();
  }

  function rerollShop() {
    if (state.money < REROLL_COST) return;
    state.money -= REROLL_COST;
    generateShop();
    render();
  }

  // ============================================================
  // SORTING
  // ============================================================

  function sortHand() {
    if (state.sortByRank) {
      state.hand.sort((a, b) =>
        RANK_ORDER[b.rank] - RANK_ORDER[a.rank] ||
        SUITS.indexOf(a.suit) - SUITS.indexOf(b.suit)
      );
    } else {
      state.hand.sort((a, b) =>
        SUITS.indexOf(a.suit) - SUITS.indexOf(b.suit) ||
        RANK_ORDER[b.rank] - RANK_ORDER[a.rank]
      );
    }
  }

  // ============================================================
  // UI RENDERING
  // ============================================================

  function render() {
    const sections = { menu: dom.menu, playing: dom.game, scoring: dom.game,
                       shop: dom.shop, gameover: dom.gameover };
    [dom.menu, dom.game, dom.shop, dom.gameover].forEach(el => hide(el));
    show(sections[state.phase]);

    if (state.phase === 'playing' || state.phase === 'scoring') renderGame();
    if (state.phase === 'shop') renderShop();
  }

  function renderGame() {
    // Top info bar
    dom.topBar.innerHTML =
      '<span class="bal-ante">Ante ' + state.ante + '</span>' +
      '<span class="bal-blind-name">' + BLIND_NAMES[state.blind] + '</span>' +
      '<span class="bal-money">$' + state.money + '</span>';

    // Boss info
    if (state.bossEffect) {
      dom.bossInfo.textContent = state.bossEffect.name + ': ' + state.bossEffect.desc;
      show(dom.bossInfo);
    } else {
      dom.bossInfo.textContent = '';
      hide(dom.bossInfo);
    }

    // Score bar
    const pct = Math.min(100, (state.roundScore / state.scoreTarget) * 100);
    dom.scoreFill.style.width = pct + '%';
    dom.scoreText.textContent =
      state.roundScore.toLocaleString() + ' / ' + state.scoreTarget.toLocaleString();

    // Round stats
    dom.roundStats.innerHTML =
      '<span>Hands: <strong>' + state.hands + '</strong></span>' +
      '<span>Discards: <strong>' + state.discards + '</strong></span>';

    // Joker area
    renderJokerRow(dom.jokerArea, state.jokers, false);

    // Cards in hand
    renderHandCards();

    // Hand type preview
    renderHandPreview();

    // Button states
    const canPlay = state.selected.size > 0 && state.selected.size <= MAX_SELECTED &&
                    state.hands > 0 && state.phase === 'playing';
    const canDiscard = state.selected.size > 0 && state.selected.size <= MAX_SELECTED &&
                       state.discards > 0 && state.phase === 'playing';

    dom.playBtn.disabled = !canPlay;
    dom.discardBtn.disabled = !canDiscard;
    dom.sortBtn.disabled = state.phase !== 'playing';
    dom.playBtn.textContent = 'Play Hand (' + state.hands + ')';
    dom.discardBtn.textContent = 'Discard (' + state.discards + ')';
  }

  function renderHandCards() {
    dom.handArea.innerHTML = '';
    state.hand.forEach((card, index) => {
      const el = document.createElement('div');
      el.className = 'bal-card ' + card.suit +
        (state.selected.has(index) ? ' selected' : '');

      el.innerHTML =
        '<span class="card-tl">' +
          '<span class="card-rank">' + card.rank + '</span>' +
          '<span class="card-suit-sm">' + SUIT_SYMBOLS[card.suit] + '</span>' +
        '</span>' +
        '<span class="card-center">' + SUIT_SYMBOLS[card.suit] + '</span>' +
        '<span class="card-br">' +
          '<span class="card-rank">' + card.rank + '</span>' +
          '<span class="card-suit-sm">' + SUIT_SYMBOLS[card.suit] + '</span>' +
        '</span>';

      el.addEventListener('click', () => toggleCard(index));
      dom.handArea.appendChild(el);
    });
  }

  function renderHandPreview() {
    if (state.selected.size === 0 || state.phase !== 'playing') {
      dom.handType.textContent = '';
      return;
    }
    const selectedCards = [...state.selected].map(i => state.hand[i]);
    const handType = evaluateHand(selectedCards);
    if (handType) {
      const level = getHandLevel(handType);
      const base = HAND_BASE[handType];
      const chips = base.chips + (level - 1) * LEVEL_CHIPS_BONUS;
      const mult = base.mult + (level - 1) * LEVEL_MULT_BONUS;
      dom.handType.innerHTML =
        '<span class="ht-name">' + handType + '</span> ' +
        '<span class="ht-level">lvl ' + level + '</span> ' +
        '<span class="ht-chips">' + chips + '</span> ' +
        '<span class="ht-x">\u00d7</span> ' +
        '<span class="ht-mult">' + mult + '</span>';
    } else {
      dom.handType.textContent = '';
    }
  }

  function renderJokerRow(container, jokers, sellable) {
    container.innerHTML = '';
    if (jokers.length === 0) {
      container.innerHTML = '<span class="bal-no-jokers">' +
        (sellable ? 'No jokers to sell' : 'No jokers') + '</span>';
      return;
    }
    jokers.forEach((joker, index) => {
      const def = JOKER_DEFS.find(d => d.id === joker.id);
      if (!def) return;
      const el = document.createElement('div');
      el.className = 'bal-joker-card' + (sellable ? ' sellable' : '');
      el.innerHTML =
        '<span class="joker-name">' + def.name + '</span>' +
        '<span class="joker-desc">' + def.desc + '</span>' +
        (sellable ? '<span class="joker-sell">Sell $' + Math.ceil(def.cost / 2) + '</span>' : '');

      if (sellable) {
        el.addEventListener('click', () => sellJoker(index));
      }
      container.appendChild(el);
    });
  }

  function renderShop() {
    // Earnings & info
    const e = state.lastEarnings;
    let earningsHtml = '';
    if (e) {
      earningsHtml =
        '<div class="bal-earnings">' +
          '<span>+$' + e.base + ' base</span>' +
          '<span>+$' + e.handBonus + ' hands left</span>' +
          '<span>+$' + e.interest + ' interest</span>' +
        '</div>';
    }

    dom.shopInfo.innerHTML =
      earningsHtml +
      '<div class="bal-shop-meta">' +
        '<span class="bal-money">$' + state.money + '</span>' +
        '<span class="bal-next-blind">Next: Ante ' + state.ante + ' \u2013 ' + BLIND_NAMES[state.blind] + '</span>' +
      '</div>';

    // Shop items (jokers for sale)
    dom.shopItems.innerHTML = '';
    state.shopItems.forEach((item, index) => {
      const el = document.createElement('div');
      if (!item) {
        el.className = 'bal-shop-item sold';
        el.textContent = 'SOLD';
      } else {
        const canBuy = state.money >= item.cost && state.jokers.length < MAX_JOKERS;
        el.className = 'bal-shop-item' + (canBuy ? '' : ' disabled');
        el.innerHTML =
          '<span class="shop-joker-name">' + item.name + '</span>' +
          '<span class="shop-joker-desc">' + item.desc + '</span>' +
          '<span class="shop-joker-cost' + (canBuy ? '' : ' cant-afford') + '">$' + item.cost + '</span>';
        if (canBuy) {
          el.addEventListener('click', () => buyJoker(index));
        }
      }
      dom.shopItems.appendChild(el);
    });

    // Reroll button
    dom.rerollBtn.textContent = 'Reroll $' + REROLL_COST;
    dom.rerollBtn.disabled = state.money < REROLL_COST;

    // Owned jokers (sellable)
    renderJokerRow(dom.ownedJokers, state.jokers, true);
  }

  function showScoringMessage(result, callback) {
    dom.message.innerHTML =
      '<div class="bal-score-anim">' +
        '<div class="score-hand-name">' + result.handType +
          ' <small>lvl ' + result.level + '</small></div>' +
        '<div class="score-calc">' +
          '<span class="score-chips">' + result.chips + '</span>' +
          ' <span class="score-x">\u00d7</span> ' +
          '<span class="score-mult">' + result.mult + '</span>' +
          ' <span class="score-eq">=</span> ' +
          '<span class="score-total">' + result.total.toLocaleString() + '</span>' +
        '</div>' +
      '</div>';

    setTimeout(() => {
      dom.message.textContent = '';
      callback();
    }, 1400);
  }

  function toggleCard(index) {
    if (state.phase !== 'playing') return;
    if (state.selected.has(index)) {
      state.selected.delete(index);
    } else if (state.selected.size < MAX_SELECTED) {
      state.selected.add(index);
    }
    renderHandCards();
    renderHandPreview();

    const canPlay = state.selected.size > 0 && state.hands > 0;
    const canDiscard = state.selected.size > 0 && state.discards > 0;
    dom.playBtn.disabled = !canPlay;
    dom.discardBtn.disabled = !canDiscard;
  }

  // ============================================================
  // INIT
  // ============================================================

  function init() {
    // DOM references - game sections
    dom.menu = document.getElementById('bal-menu');
    dom.game = document.getElementById('bal-game');
    dom.shop = document.getElementById('bal-shop');
    dom.gameover = document.getElementById('bal-gameover');

    // Game view elements
    dom.topBar = document.getElementById('bal-top-bar');
    dom.bossInfo = document.getElementById('bal-boss-info');
    dom.scoreFill = document.getElementById('bal-score-fill');
    dom.scoreText = document.getElementById('bal-score-text');
    dom.roundStats = document.getElementById('bal-round-stats');
    dom.jokerArea = document.getElementById('bal-joker-area');
    dom.message = document.getElementById('bal-message');
    dom.handArea = document.getElementById('bal-hand-area');
    dom.handType = document.getElementById('bal-hand-type');
    dom.playBtn = document.getElementById('bal-play-btn');
    dom.discardBtn = document.getElementById('bal-discard-btn');
    dom.sortBtn = document.getElementById('bal-sort-btn');

    // Shop view elements
    dom.shopInfo = document.getElementById('bal-shop-info');
    dom.shopItems = document.getElementById('bal-shop-items');
    dom.rerollBtn = document.getElementById('bal-reroll-btn');
    dom.nextBtn = document.getElementById('bal-next-btn');
    dom.ownedJokers = document.getElementById('bal-owned-jokers');

    // Game over elements
    dom.result = document.getElementById('bal-result');
    dom.resultDetail = document.getElementById('bal-result-detail');

    // Event listeners
    document.getElementById('bal-new-run').addEventListener('click', startRun);
    document.getElementById('bal-restart').addEventListener('click', startRun);
    dom.playBtn.addEventListener('click', playHand);
    dom.discardBtn.addEventListener('click', discardCards);
    dom.sortBtn.addEventListener('click', () => {
      state.sortByRank = !state.sortByRank;
      state.selected = new Set();
      sortHand();
      render();
    });
    dom.rerollBtn.addEventListener('click', rerollShop);
    dom.nextBtn.addEventListener('click', () => startBlind());

    state = freshState();
    render();
  }

  return { init };
})();
