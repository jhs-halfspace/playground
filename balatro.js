// ============================================================
// BALATRO UI - Rendering, DOM, events, animations
// ============================================================
//
// Pure UI layer — all game logic lives in BalatroEngine.
// Reads BalatroData for display metadata (names, descriptions).

const Balatro = (() => {
  const D = BalatroData;
  const E = BalatroEngine;

  let state = {};
  let dom = {};

  function show(el) { if (el) el.classList.remove('hidden'); }
  function hide(el) { if (el) el.classList.add('hidden'); }

  const SAVE_KEY = 'balatro-save';

  // ============================================================
  // SAVE / RESUME
  // ============================================================

  function saveState() {
    // Only save during active game phases (not menu or gameover)
    if (!state || state.phase === 'menu' || state.phase === 'gameover') {
      localStorage.removeItem(SAVE_KEY);
      return;
    }
    try {
      // Convert Set to Array for JSON serialization
      const toSave = Object.assign({}, state, {
        selected: [...(state.selected || [])],
      });
      localStorage.setItem(SAVE_KEY, JSON.stringify(toSave));
    } catch (e) { /* storage full or private mode — silently fail */ }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const loaded = JSON.parse(raw);
      // Restore Set from Array
      loaded.selected = new Set(loaded.selected || []);
      return loaded;
    } catch (e) { return null; }
  }

  function clearSave() {
    localStorage.removeItem(SAVE_KEY);
  }

  // ============================================================
  // INIT
  // ============================================================

  function init() {
    cacheDom();
    bindEvents();

    // Check for saved game
    const saved = loadState();
    if (saved && saved.phase && saved.phase !== 'menu' && saved.phase !== 'gameover') {
      state = saved;
    } else {
      state = E.freshState();
    }
    render();
  }

  function cacheDom() {
    dom.menu = document.getElementById('bal-menu');
    dom.deckSelect = document.getElementById('bal-deck-select');
    dom.blindSelect = document.getElementById('bal-blind-select');
    dom.game = document.getElementById('bal-game');
    dom.shop = document.getElementById('bal-shop');
    dom.packOpen = document.getElementById('bal-pack-open');
    dom.cashout = document.getElementById('bal-cashout');
    dom.gameover = document.getElementById('bal-gameover');

    // Game view
    dom.topBar = document.getElementById('bal-top-bar');
    dom.bossInfo = document.getElementById('bal-boss-info');
    dom.scoreFill = document.getElementById('bal-score-fill');
    dom.scoreText = document.getElementById('bal-score-text');
    dom.roundStats = document.getElementById('bal-round-stats');
    dom.jokerArea = document.getElementById('bal-joker-area');
    dom.consumableArea = document.getElementById('bal-consumable-area');
    dom.message = document.getElementById('bal-message');
    dom.deckPile = document.getElementById('bal-deck-pile');
    dom.handArea = document.getElementById('bal-hand-area');
    dom.handType = document.getElementById('bal-hand-type');
    dom.playBtn = document.getElementById('bal-play-btn');
    dom.discardBtn = document.getElementById('bal-discard-btn');
    dom.sortBtn = document.getElementById('bal-sort-btn');

    // Shop view
    dom.shopInfo = document.getElementById('bal-shop-info');
    dom.shopCards = document.getElementById('bal-shop-cards');
    dom.shopPacks = document.getElementById('bal-shop-packs');
    dom.shopVoucher = document.getElementById('bal-shop-voucher');
    dom.rerollBtn = document.getElementById('bal-reroll-btn');
    dom.nextBtn = document.getElementById('bal-next-btn');
    dom.ownedJokers = document.getElementById('bal-owned-jokers');
    dom.ownedConsumables = document.getElementById('bal-owned-consumables');

    // Game over
    dom.result = document.getElementById('bal-result');
    dom.resultDetail = document.getElementById('bal-result-detail');
  }

  function bindEvents() {
    document.getElementById('bal-new-run').addEventListener('click', () => {
      clearSave();
      E.startRun(state);
      render();
    });
    document.getElementById('bal-restart').addEventListener('click', () => {
      clearSave();
      state = E.freshState();
      E.startRun(state);
      render();
    });
    document.getElementById('bal-start-run').addEventListener('click', () => {
      E.applyDeckAndStart(state);
      render();
    });

    dom.playBtn.addEventListener('click', doPlayHand);
    dom.discardBtn.addEventListener('click', doDiscard);
    dom.sortBtn.addEventListener('click', () => {
      state.sortByRank = !state.sortByRank;
      state.selected = new Set();
      E.sortHand(state);
      renderGame();
    });

    document.getElementById('bal-run-info-btn').addEventListener('click', () => {
      renderHandInfo();
      show(document.getElementById('bal-hand-info'));
    });
    document.getElementById('bal-hand-info-close').addEventListener('click', () => {
      hide(document.getElementById('bal-hand-info'));
    });
    // Close on backdrop click
    document.getElementById('bal-hand-info').addEventListener('click', (e) => {
      if (e.target.id === 'bal-hand-info') hide(e.target);
    });

    dom.rerollBtn.addEventListener('click', () => {
      E.rerollShop(state);
      renderShop();
    });
    dom.nextBtn.addEventListener('click', () => {
      E.nextRound(state);
      render();
    });
  }

  // ============================================================
  // MENU (with resume button)
  // ============================================================

  function renderMenu() {
    // Show or hide the resume button based on saved game
    let resumeBtn = document.getElementById('bal-resume-run');
    if (!resumeBtn) {
      // Create resume button dynamically (inserted after New Run)
      const newRunBtn = document.getElementById('bal-new-run');
      resumeBtn = document.createElement('button');
      resumeBtn.id = 'bal-resume-run';
      resumeBtn.className = 'new-game-btn bal-resume-btn';
      resumeBtn.textContent = 'Resume Run';
      resumeBtn.addEventListener('click', () => {
        const saved = loadState();
        if (saved) {
          state = saved;
          render();
        }
      });
      newRunBtn.parentNode.insertBefore(resumeBtn, newRunBtn.nextSibling);
    }

    const saved = loadState();
    if (saved && saved.phase && saved.phase !== 'menu' && saved.phase !== 'gameover') {
      resumeBtn.textContent = 'Resume Run (Ante ' + saved.ante + ')';
      show(resumeBtn);
    } else {
      hide(resumeBtn);
    }
  }

  // ============================================================
  // RENDER DISPATCH
  // ============================================================

  function render() {
    const sections = [dom.menu, dom.deckSelect, dom.blindSelect, dom.game,
                      dom.shop, dom.packOpen, dom.cashout, dom.gameover];
    sections.forEach(s => hide(s));

    switch (state.phase) {
      case 'menu': show(dom.menu); renderMenu(); break;
      case 'deckSelect': show(dom.deckSelect); renderDeckSelect(); break;
      case 'blindSelect': show(dom.blindSelect); renderBlindSelect(); break;
      case 'playing': show(dom.game); renderGame(); break;
      case 'scoring': show(dom.game); renderGame(); break;
      case 'shop': show(dom.shop); renderShop(); break;
      case 'packOpen': show(dom.packOpen); renderPackOpen(); break;
      case 'gameover': show(dom.gameover); renderGameOver(); break;
    }

    // Auto-save after every state change
    saveState();
  }

  // ============================================================
  // DECK SELECT
  // ============================================================

  function renderDeckSelect() {
    const grid = document.getElementById('bal-deck-grid');
    const stakeEl = document.getElementById('bal-stake-select');
    if (!grid || !stakeEl) return;

    grid.innerHTML = '';
    D.decks.forEach(deck => {
      const el = document.createElement('div');
      el.className = 'bal-deck-option' + (state.deckId === deck.id ? ' selected' : '');
      el.innerHTML = '<span class="deck-name">' + deck.name + '</span>' +
        '<span class="deck-desc">' + deck.desc + '</span>';
      el.addEventListener('click', () => {
        state.deckId = deck.id;
        renderDeckSelect();
      });
      grid.appendChild(el);
    });

    stakeEl.innerHTML = '<p class="bal-shop-label">Difficulty</p>';
    const stakeRow = document.createElement('div');
    stakeRow.className = 'bal-stake-row';
    D.stakes.forEach(stake => {
      const el = document.createElement('div');
      el.className = 'bal-stake-chip' + (state.stakeId === stake.id ? ' selected' : '');
      el.style.borderColor = stake.color;
      if (state.stakeId === stake.id) el.style.background = stake.color;
      el.title = stake.name + ': ' + stake.desc;
      el.textContent = stake.name.replace(' Stake', '');
      el.addEventListener('click', () => {
        state.stakeId = stake.id;
        renderDeckSelect();
      });
      stakeRow.appendChild(el);
    });
    stakeEl.appendChild(stakeRow);
  }

  // ============================================================
  // BLIND SELECT
  // ============================================================

  function renderBlindSelect() {
    const container = document.getElementById('bal-blind-options');
    if (!container) return;
    container.innerHTML = '';

    // Ensure boss and skip tags are pre-rolled so we can show them
    E.ensureAnteBoss(state);
    E.ensureSkipTags(state);

    for (let i = 0; i < 3; i++) {
      const name = D.BLIND_NAMES[i];
      const anteBase = D.ANTE_BASES[Math.min(state.ante - 1, D.ANTE_BASES.length - 1)];
      const target = Math.floor(anteBase * D.BLIND_SCORE_MULTS[i]);
      const isCurrent = i === state.blind;
      const isPast = i < state.blind;
      const reward = D.BLIND_REWARDS[i];

      const el = document.createElement('div');
      el.className = 'bal-blind-card' + (isCurrent ? ' current' : '') + (isPast ? ' past' : '');

      // Boss blind info
      let bossDesc = '';
      if (i === 2 && state.anteBoss) {
        bossDesc = '<span class="blind-boss-desc">' +
          state.anteBoss.name + '</span>' +
          '<span class="blind-boss-effect">' + state.anteBoss.desc + '</span>';
      }

      // Skip tag preview (small=0, big=1)
      let skipTagHtml = '';
      if (i < 2 && state._skipTags && state._skipTags[i]) {
        const skipTag = state._skipTags[i];
        skipTagHtml = '<span class="blind-skip-tag">' + skipTag.name + '</span>' +
          '<span class="blind-skip-tag-desc">' + skipTag.desc + '</span>';
      }

      // Reward info
      let rewardHtml = '<span class="blind-reward">Reward: $' + reward + '</span>';
      if (i < 2) {
        rewardHtml += skipTagHtml;
      }

      el.innerHTML =
        '<div class="blind-header">' + name + '</div>' +
        '<div class="blind-ante">Ante ' + state.ante + '</div>' +
        '<div class="blind-target">' + target.toLocaleString() + '</div>' +
        bossDesc +
        rewardHtml +
        (isCurrent ? '<div class="blind-actions">' +
          (i < 2 ? '<button class="ctrl-btn bal-skip-btn">Skip</button>' : '') +
          '<button class="ctrl-btn primary bal-select-btn">Play</button>' +
        '</div>' : '');

      if (isCurrent) {
        setTimeout(() => {
          const selectBtn = el.querySelector('.bal-select-btn');
          const skipBtn = el.querySelector('.bal-skip-btn');
          if (selectBtn) selectBtn.addEventListener('click', () => { E.selectBlind(state); render(); });
          if (skipBtn) skipBtn.addEventListener('click', () => doSkipBlind());
        }, 0);
      }

      container.appendChild(el);
    }

    // Show owned tags
    if (state.tags.length > 0) {
      const tagEl = document.createElement('div');
      tagEl.className = 'bal-tags-display';
      tagEl.innerHTML = '<span class="bal-shop-label">Tags:</span> ' +
        state.tags.map(t => {
          const def = D.tags.find(td => td.id === t.id);
          return '<span class="bal-tag">' + (def ? def.name : t.id) + '</span>';
        }).join(' ');
      container.appendChild(tagEl);
    }

    // Show run info (jokers, money, hand levels)
    const infoEl = document.createElement('div');
    infoEl.className = 'bal-blind-info-bar';
    infoEl.innerHTML =
      '<span class="bal-money">$' + state.money + '</span>' +
      '<span>Jokers: ' + state.jokers.length + '/' + state.maxJokers + '</span>' +
      '<span>Deck: ' + state.deck.length + ' cards</span>';
    container.appendChild(infoEl);
  }

  // ============================================================
  // GAME VIEW
  // ============================================================

  function renderGame() {
    // Top bar
    dom.topBar.innerHTML =
      '<span class="bal-ante">Ante ' + state.ante + '</span>' +
      '<span class="bal-blind-name">' + D.BLIND_NAMES[state.blind] + '</span>' +
      '<span class="bal-money">$' + state.money + '</span>';

    // Boss info
    if (state.bossEffect) {
      const boss = D.findBoss(state.bossEffect);
      if (boss) {
        dom.bossInfo.textContent = boss.name + ': ' + boss.desc;
        show(dom.bossInfo);
      } else { hide(dom.bossInfo); }
    } else { hide(dom.bossInfo); }

    // Score bar
    const pct = Math.min(100, (state.roundScore / state.scoreTarget) * 100);
    dom.scoreFill.style.width = pct + '%';
    dom.scoreText.textContent = state.roundScore.toLocaleString() + ' / ' + state.scoreTarget.toLocaleString();

    // Round stats
    dom.roundStats.innerHTML =
      '<span>Hands: <strong>' + state.hands + '</strong></span>' +
      '<span>Discards: <strong>' + state.discards + '</strong></span>' +
      '<span>Deck: <strong>' + state.drawPile.length + '</strong></span>';

    // Jokers
    renderJokerRow(dom.jokerArea, state.jokers, false);

    // Consumables
    renderConsumables();

    // Deck pile
    renderDeckPile();

    // Hand cards
    renderHandCards();

    // Hand type preview
    renderHandPreview();

    // Controls
    const canPlay = state.selected.size > 0 && state.selected.size <= D.GAME.MAX_PLAY &&
                    state.hands > 0 && state.phase === 'playing';
    const canDiscard = state.selected.size > 0 && state.selected.size <= D.GAME.MAX_PLAY &&
                       state.discards > 0 && state.phase === 'playing';
    dom.playBtn.disabled = !canPlay;
    dom.discardBtn.disabled = !canDiscard;
    dom.sortBtn.disabled = state.phase !== 'playing';
    dom.playBtn.textContent = 'Play Hand (' + state.hands + ')';
    dom.discardBtn.textContent = 'Discard (' + state.discards + ')';
  }

  function renderDeckPile() {
    const n = state.drawPile.length;
    if (n > 0) {
      dom.deckPile.innerHTML =
        '<div class="deck-stack"><div class="deck-card-back"></div></div>' +
        '<span class="deck-count">' + n + '</span>';
    } else {
      dom.deckPile.innerHTML =
        '<div class="deck-stack empty"></div>' +
        '<span class="deck-count">0</span>';
    }
  }

  function renderHandCards() {
    dom.handArea.innerHTML = '';
    state.hand.forEach((card, index) => {
      const el = createCardElement(card, state.selected.has(index));
      el.addEventListener('click', () => toggleCard(index));
      dom.handArea.appendChild(el);
    });
  }

  function createCardElement(card, selected) {
    const el = document.createElement('div');
    const isFaceDown = card._faceDown;

    if (isFaceDown) {
      el.className = 'bal-card face-down' + (selected ? ' selected' : '');
      el.innerHTML = '<span class="card-center">?</span>';
      return el;
    }

    const suitClass = card.enhancement === 'stone' ? 'stone' : card.suit;
    el.className = 'bal-card ' + suitClass +
      (selected ? ' selected' : '') +
      (card.debuffed ? ' debuffed' : '') +
      (card.enhancement ? ' enh-' + card.enhancement : '') +
      (card.edition && card.edition !== 'base' ? ' ed-' + card.edition : '') +
      (card.seal ? ' seal-' + card.seal : '');

    const rankDisplay = card.enhancement === 'stone' ? '' : card.rank;
    const suitSymbol = card.enhancement === 'stone' ? '\u2588' : D.SUIT_SYMBOLS[card.suit];

    // Enhancement label
    let enhLabel = '';
    if (card.enhancement && D.ENHANCEMENTS[card.enhancement]) {
      enhLabel = '<span class="card-enh-label enh-' + card.enhancement + '">' +
        D.ENHANCEMENTS[card.enhancement].name + '</span>';
    }
    // Edition indicator
    let edLabel = '';
    if (card.edition && card.edition !== 'base' && D.EDITIONS[card.edition]) {
      edLabel = '<span class="card-ed-label">' + D.EDITIONS[card.edition].name + '</span>';
    }

    el.innerHTML =
      '<span class="card-tl">' +
        '<span class="card-rank">' + rankDisplay + '</span>' +
        '<span class="card-suit-sm">' + suitSymbol + '</span>' +
      '</span>' +
      '<span class="card-center">' + suitSymbol + '</span>' +
      '<span class="card-br">' +
        '<span class="card-rank">' + rankDisplay + '</span>' +
        '<span class="card-suit-sm">' + suitSymbol + '</span>' +
      '</span>' +
      enhLabel + edLabel +
      (card.seal ? '<span class="card-seal seal-dot-' + card.seal + '"></span>' : '');

    return el;
  }

  function renderHandPreview() {
    if (state.selected.size === 0 || state.phase !== 'playing') {
      dom.handType.textContent = '';
      return;
    }
    const selectedCards = [...state.selected].map(i => state.hand[i]);
    const handType = E.evaluateHand(selectedCards, state);
    if (handType) {
      // Run the full scoring pipeline on cloned data for a non-destructive preview
      const preview = E.previewScore(state, selectedCards);
      if (preview) {
        dom.handType.innerHTML =
          '<span class="ht-name">' + preview.handType + '</span> ' +
          '<span class="ht-level">lvl ' + preview.level + '</span> ' +
          '<span class="ht-chip-badge">' + preview.chips + '</span>' +
          '<span class="ht-x">\u00d7</span>' +
          '<span class="ht-mult-badge">' + preview.mult + '</span>' +
          '<span class="ht-eq">=</span>' +
          '<span class="ht-total">' + preview.total.toLocaleString() + '</span>';
      } else {
        dom.handType.textContent = '';
      }
    } else {
      dom.handType.textContent = '';
    }
  }

  function renderHandInfo() {
    const list = document.getElementById('bal-hand-info-list');
    if (!list) return;
    list.innerHTML = '';

    D.HAND_TYPES.forEach(ht => {
      // Skip secret hands the player hasn't discovered yet
      if (ht.secret && !state.secretHandsPlayed[ht.name]) return;

      const level = E.getHandLevel(state, ht.name);
      const { chips, mult } = E.getHandChipsMult(state, ht.name);
      const playCount = state.handsPlayedRun[ht.name] || 0;

      const row = document.createElement('div');
      row.className = 'hand-info-row' + (level > 1 ? ' leveled' : '');
      row.innerHTML =
        '<div class="hand-info-name">' + ht.name + '</div>' +
        '<div class="hand-info-level">lvl ' + level + '</div>' +
        '<div class="hand-info-stats">' +
          '<span class="ht-chip-badge">' + chips + '</span>' +
          '<span class="ht-x">\u00d7</span>' +
          '<span class="ht-mult-badge">' + mult + '</span>' +
        '</div>' +
        '<div class="hand-info-plays">' + playCount + ' played</div>';
      list.appendChild(row);
    });
  }

  function renderConsumables() {
    if (!dom.consumableArea) return;
    dom.consumableArea.innerHTML = '';

    state.consumables.forEach((cons, idx) => {
      let def;
      if (cons.type === 'tarot') def = D.findTarot(cons.id);
      else if (cons.type === 'planet') def = D.findPlanet(cons.id);
      else if (cons.type === 'spectral') def = D.findSpectral(cons.id);

      // Check if this consumable can be used right now
      // Consumables that need card selection require 'playing' phase (hand visible).
      // Others (planets, non-selection tarots/spectrals) can be used anytime.
      const selCount = state.selected.size;
      const needsHand = def && def.needsSelection;
      let canUse = needsHand ? state.phase === 'playing' : true;
      let selectionHint = '';
      if (needsHand) {
        const min = def.minCards || 1;
        const max = def.maxCards || 5;
        canUse = canUse && selCount >= min && selCount <= max;
        if (min === max) {
          selectionHint = 'Select ' + min + ' card' + (min > 1 ? 's' : '');
        } else {
          selectionHint = 'Select ' + min + '-' + max + ' cards';
        }
      } else if (def && def.canUse) {
        canUse = canUse && def.canUse(state);
      }

      const el = document.createElement('div');
      el.className = 'bal-consumable-card ' + cons.type + (canUse ? ' usable' : '');
      el.innerHTML =
        '<span class="cons-name">' + (def ? def.name : cons.id) + '</span>' +
        (selectionHint ? '<span class="cons-hint">' + selectionHint + '</span>' :
         '<span class="cons-type">' + cons.type + '</span>');
      el.title = def ? def.desc : '';
      el.addEventListener('click', () => {
        if (needsHand) {
          if (state.phase !== 'playing') return;
          const indices = [...state.selected];
          if (indices.length >= (def.minCards || 1) && indices.length <= (def.maxCards || 5)) {
            const moneyBefore = state.money;
            E.useConsumable(state, idx, indices);
            state.selected = new Set();
            const moneyDiff = state.money - moneyBefore;
            const extra = moneyDiff > 0 ? '+$' + moneyDiff : (moneyDiff < 0 ? '-$' + Math.abs(moneyDiff) : '');
            showConsumableMessage(def, cons.type, extra);
            renderGame();
          } else {
            dom.message.textContent = selectionHint + ' first, then click ' + (def ? def.name : 'consumable');
            setTimeout(() => { if (state.phase === 'playing') dom.message.textContent = ''; }, 2000);
          }
        } else {
          const moneyBefore = state.money;
          if (E.useConsumable(state, idx, [])) {
            const moneyDiff = state.money - moneyBefore;
            const extra = moneyDiff > 0 ? '+$' + moneyDiff : (moneyDiff < 0 ? '-$' + Math.abs(moneyDiff) : '');
            showConsumableMessage(def, cons.type, extra);
            renderGame();
          }
        }
      });
      dom.consumableArea.appendChild(el);
    });

    // Empty slot indicators
    for (let i = state.consumables.length; i < state.maxConsumables; i++) {
      const empty = document.createElement('div');
      empty.className = 'bal-consumable-card empty';
      empty.innerHTML = '<span class="cons-name">Empty</span>';
      dom.consumableArea.appendChild(empty);
    }
  }

  // ============================================================
  // JOKER RENDERING
  // ============================================================

  function renderJokerRow(container, jokers, sellable) {
    container.innerHTML = '';
    if (jokers.length === 0) {
      container.innerHTML = '<span class="bal-no-jokers">' +
        (sellable ? 'No jokers to sell' : 'No jokers') + '</span>';
      return;
    }
    jokers.forEach((ji, index) => {
      const def = D.findJoker(ji.defId);
      if (!def) return;
      const el = document.createElement('div');
      el.className = 'bal-joker-card ' + def.rarity + (sellable ? ' sellable' : '') +
        (ji._debuffed ? ' debuffed' : '') +
        (ji.edition && ji.edition !== 'base' ? ' ed-' + ji.edition : '');
      const dynDesc = E.getJokerDynamicDesc(ji);
      el.innerHTML =
        '<span class="joker-name">' + def.name + '</span>' +
        '<span class="joker-desc">' + def.desc + '</span>' +
        (dynDesc ? '<span class="joker-dynamic">' + dynDesc + '</span>' : '') +
        (ji.edition && ji.edition !== 'base' ? '<span class="joker-edition">' + D.EDITIONS[ji.edition].name + '</span>' : '') +
        (sellable ? '<span class="joker-sell">Sell $' + (ji.sellValue || 1) + '</span>' : '');
      el.title = def.desc + (dynDesc ? ' ' + dynDesc : '');

      if (sellable) {
        el.addEventListener('click', () => {
          E.sellJoker(state, index);
          renderShop();
        });
      }
      container.appendChild(el);
    });
  }

  // ============================================================
  // SHOP
  // ============================================================

  function renderShop() {
    // Info bar
    const e = state.lastEarnings;
    let earningsHtml = '';
    if (e) {
      earningsHtml = '<div class="bal-earnings">';
      if (e.base > 0) earningsHtml += '<span>+$' + e.base + ' blind</span>';
      if (e.handBonus > 0) earningsHtml += '<span>+$' + e.handBonus + ' hands</span>';
      if (e.interest > 0) earningsHtml += '<span>+$' + e.interest + ' interest</span>';
      if (e.greenBonus > 0) earningsHtml += '<span>+$' + e.greenBonus + ' green</span>';
      earningsHtml += '</div>';
    }

    dom.shopInfo.innerHTML = earningsHtml +
      '<div class="bal-shop-meta">' +
        '<span class="bal-money">$' + state.money + '</span>' +
        '<span>Jokers: ' + state.jokers.length + '/' + state.maxJokers + '</span>' +
        '<span>Items: ' + state.consumables.length + '/' + state.maxConsumables + '</span>' +
      '</div>' +
      '<div class="bal-shop-meta" style="margin-top:4px">' +
        '<span class="bal-next-blind">Next: Ante ' + state.ante + ' \u2013 ' + D.BLIND_NAMES[state.blind] + '</span>' +
      '</div>';

    // Card slots (jokers / tarots / planets)
    dom.shopCards.innerHTML = '';
    state.shopSlots.forEach((item, idx) => {
      const el = document.createElement('div');
      if (!item || item.sold) {
        el.className = 'bal-shop-item sold';
        el.textContent = 'SOLD';
      } else {
        const canBuy = state.money >= item.cost && (
          item.type === 'joker' ? (state.jokers.length < state.maxJokers || (item.edition === 'negative')) :
          state.consumables.length < state.maxConsumables
        );
        el.className = 'bal-shop-item' + (canBuy ? '' : ' disabled');

        let name = '', desc = '';
        if (item.type === 'joker') {
          const def = D.findJoker(item.defId);
          name = def ? def.name : item.defId;
          desc = def ? def.desc : '';
        } else {
          let def;
          if (item.type === 'tarot') def = D.findTarot(item.id);
          else if (item.type === 'planet') def = D.findPlanet(item.id);
          name = def ? def.name : item.id;
          desc = def ? def.desc : '';
        }

        el.innerHTML =
          '<span class="shop-item-type">' + item.type + '</span>' +
          '<span class="shop-joker-name">' + name + '</span>' +
          '<span class="shop-joker-desc">' + desc + '</span>' +
          '<span class="shop-joker-cost' + (canBuy ? '' : ' cant-afford') + '">$' + item.cost + '</span>';

        if (canBuy) {
          el.addEventListener('click', () => {
            if (!E.buyShopItem(state, idx)) return; // Slot full or can't afford
            renderShop();
          });
        }
      }
      dom.shopCards.appendChild(el);
    });

    // Pack slots
    dom.shopPacks.innerHTML = '';
    state.packSlots.forEach((pack, idx) => {
      const el = document.createElement('div');
      if (!pack || pack.sold) {
        el.className = 'bal-shop-item sold';
        el.textContent = 'SOLD';
      } else {
        const canBuy = state.money >= pack.cost;
        el.className = 'bal-shop-pack' + (canBuy ? '' : ' disabled');
        el.innerHTML =
          '<span class="pack-name">' + pack.name + '</span>' +
          '<span class="pack-info">Choose ' + pack.cardsToChoose + ' of ' + pack.cardsShown + '</span>' +
          '<span class="shop-joker-cost' + (canBuy ? '' : ' cant-afford') + '">$' + pack.cost + '</span>';
        if (canBuy) {
          el.addEventListener('click', () => {
            E.buyPack(state, idx);
            render();
          });
        }
      }
      dom.shopPacks.appendChild(el);
    });

    // Voucher
    dom.shopVoucher.innerHTML = '';
    if (state.voucherSlot && !state.voucherSlot.sold) {
      const vDef = D.findVoucher(state.voucherSlot.id);
      const canBuy = state.money >= state.voucherSlot.cost;
      const el = document.createElement('div');
      el.className = 'bal-shop-voucher-card' + (canBuy ? '' : ' disabled');
      el.innerHTML =
        '<span class="voucher-label">Voucher</span>' +
        '<span class="shop-joker-name">' + (vDef ? vDef.name : '') + '</span>' +
        '<span class="shop-joker-desc">' + (vDef ? vDef.desc : '') + '</span>' +
        '<span class="shop-joker-cost' + (canBuy ? '' : ' cant-afford') + '">$' + state.voucherSlot.cost + '</span>';
      if (canBuy) {
        el.addEventListener('click', () => {
          E.buyVoucher(state);
          renderShop();
        });
      }
      dom.shopVoucher.appendChild(el);
    }

    // Reroll button
    const rerollCost = state.freeRerolls > 0 ? 0 : state.rerollCost;
    dom.rerollBtn.textContent = 'Reroll $' + rerollCost;
    dom.rerollBtn.disabled = state.money < rerollCost && state.freeRerolls <= 0;

    // Owned jokers
    renderJokerRow(dom.ownedJokers, state.jokers, true);

    // Owned consumables (can use non-selection ones directly, or sell)
    if (dom.ownedConsumables) {
      dom.ownedConsumables.innerHTML = '';
      state.consumables.forEach((cons, idx) => {
        let def;
        if (cons.type === 'tarot') def = D.findTarot(cons.id);
        else if (cons.type === 'planet') def = D.findPlanet(cons.id);
        else if (cons.type === 'spectral') def = D.findSpectral(cons.id);

        const canUseHere = def && !def.needsSelection && (!def.canUse || def.canUse(state));
        const el = document.createElement('div');
        el.className = 'bal-consumable-card ' + cons.type + (canUseHere ? ' usable' : '');
        el.innerHTML =
          '<span class="cons-name">' + (def ? def.name : cons.id) + '</span>' +
          (canUseHere
            ? '<span class="cons-use-hint">Tap to use</span>'
            : '<span class="cons-type">' + cons.type + '</span>');
        el.title = def ? def.desc : '';

        if (canUseHere) {
          el.addEventListener('click', () => {
            const moneyBefore = state.money;
            E.useConsumable(state, idx, []);
            const moneyDiff = state.money - moneyBefore;
            const extra = moneyDiff > 0 ? '+$' + moneyDiff + ' (now $' + state.money + ')' :
                          moneyDiff < 0 ? '-$' + Math.abs(moneyDiff) : '';
            // Show brief toast in shop
            const toast = document.createElement('div');
            toast.className = 'bal-shop-toast bal-score-anim';
            toast.innerHTML = '<strong>' + (def ? def.name : 'Used') + '</strong>' +
              (extra ? ' ' + extra : ' applied');
            dom.shopInfo.prepend(toast);
            setTimeout(() => { if (toast.parentNode) toast.remove(); }, 2000);
            renderShop();
          });
        }

        // Long press / right-click to sell
        el.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          E.sellConsumable(state, idx);
          renderShop();
        });

        dom.ownedConsumables.appendChild(el);
      });
    }
  }

  // ============================================================
  // PACK OPENING
  // ============================================================

  function renderPackOpen() {
    const titleEl = document.getElementById('bal-pack-title');
    const contentsEl = document.getElementById('bal-pack-contents');
    const instrEl = document.getElementById('bal-pack-instructions');
    const skipBtn = document.getElementById('bal-pack-skip');

    if (titleEl) titleEl.textContent = state.packDef ? state.packDef.name : 'Pack';
    if (instrEl) instrEl.textContent = 'Choose ' + (state.packChoicesLeft || 0) + ' more';

    if (contentsEl && state.packContents) {
      contentsEl.innerHTML = '';
      state.packContents.forEach((item, idx) => {
        const el = document.createElement('div');
        if (item.picked) {
          el.className = 'bal-shop-item sold';
          el.textContent = 'PICKED';
        } else {
          el.className = 'bal-pack-item';
          let name = '', desc = '';
          if (item.type === 'joker') {
            const def = D.findJoker(item.defId);
            name = def ? def.name : item.defId;
            desc = def ? def.desc : '';
          } else if (item.type === 'playing_card') {
            name = item.card.rank + D.SUIT_SYMBOLS[item.card.suit];
            desc = item.card.enhancement ? D.ENHANCEMENTS[item.card.enhancement].name : 'Base';
          } else {
            let def;
            if (item.type === 'tarot') def = D.findTarot(item.id);
            else if (item.type === 'planet') def = D.findPlanet(item.id);
            else if (item.type === 'spectral') def = D.findSpectral(item.id);
            name = def ? def.name : item.id;
            desc = def ? def.desc : '';
          }
          el.innerHTML =
            '<span class="shop-item-type">' + item.type + '</span>' +
            '<span class="shop-joker-name">' + name + '</span>' +
            '<span class="shop-joker-desc">' + desc + '</span>';
          el.addEventListener('click', () => {
            E.pickFromPack(state, idx);
            render();
          });
        }
        contentsEl.appendChild(el);
      });
    }

    if (skipBtn) {
      skipBtn.onclick = () => {
        E.skipPack(state);
        render();
      };
    }
  }

  // ============================================================
  // GAME OVER
  // ============================================================

  function renderGameOver() {
    if (state.gameResult === 'win') {
      dom.result.textContent = 'You Win!';
      dom.resultDetail.textContent = 'Defeated all 8 Antes with $' + state.money;
    } else {
      dom.result.textContent = 'Game Over';
      dom.resultDetail.textContent = 'Reached Ante ' + state.ante + ' \u2013 ' + D.BLIND_NAMES[state.blind];
    }
  }

  // ============================================================
  // GAME ACTIONS
  // ============================================================

  function toggleCard(index) {
    if (state.phase !== 'playing') return;
    // Cerulean Bell: can't deselect the forced card
    if (state._ceruleanActive && index === state._forcedCardIdx && state.selected.has(index)) return;
    if (state.selected.has(index)) {
      state.selected.delete(index);
    } else if (state.selected.size < D.GAME.MAX_PLAY) {
      state.selected.add(index);
    }
    renderHandCards();
    renderHandPreview();
    const canPlay = state.selected.size > 0 && state.hands > 0;
    const canDiscard = state.selected.size > 0 && state.discards > 0;
    dom.playBtn.disabled = !canPlay;
    dom.discardBtn.disabled = !canDiscard;
  }

  function doPlayHand() {
    if (state.phase !== 'playing') return;
    const result = E.playHand(state);
    if (!result) return;

    if (result.error) {
      dom.message.textContent = result.error;
      setTimeout(() => { if (state.phase === 'playing') dom.message.textContent = ''; }, 1500);
      return;
    }

    // Show scoring animation
    state.phase = 'scoring';
    renderGame();

    const moneyEarned = result.earnedMoney > 0 ?
      '<div class="score-money">+$' + result.earnedMoney + '</div>' : '';
    dom.message.innerHTML =
      '<div class="bal-score-anim">' +
        '<div class="score-hand-name">' + result.handType +
          ' <small>lvl ' + result.level + '</small></div>' +
        '<div class="score-calc">' +
          '<span class="score-chip-badge">' + result.chips + '</span>' +
          '<span class="score-x">\u00d7</span>' +
          '<span class="score-mult-badge">' + result.mult + '</span>' +
          '<span class="score-eq">=</span>' +
          '<span class="score-total">' + result.total.toLocaleString() + '</span>' +
        '</div>' +
        moneyEarned +
      '</div>';

    setTimeout(() => {
      dom.message.textContent = '';
      if (state.roundScore >= state.scoreTarget) {
        E.endBlind(state, true);
      } else if (state.hands <= 0) {
        E.endBlind(state, false);
      } else {
        state.phase = 'playing';
      }
      render();
    }, 1400);
  }

  function showConsumableMessage(def, type, extraInfo) {
    if (!dom.message || !def) return;
    const typeLabel = type === 'planet' ? 'Planet' : type === 'tarot' ? 'Tarot' : 'Spectral';
    dom.message.innerHTML =
      '<div class="bal-score-anim">' +
        '<span class="cons-msg-type">' + typeLabel + '</span> ' +
        '<span class="cons-msg-name">' + def.name + '</span>' +
        '<div class="cons-msg-desc">' + def.desc + '</div>' +
        (extraInfo ? '<div class="cons-msg-extra">' + extraInfo + '</div>' : '') +
      '</div>';
    setTimeout(() => { dom.message.textContent = ''; }, 2200);
  }

  function doSkipBlind() {
    const skippedName = D.BLIND_NAMES[state.blind];
    const moneyBefore = state.money;
    const tag = E.skipBlind(state);
    const moneyDiff = state.money - moneyBefore;

    if (tag) {
      const moneyInfo = moneyDiff > 0 ? '<div class="tag-reward-money">+$' + moneyDiff + ' (now $' + state.money + ')</div>' :
                        moneyDiff < 0 ? '<div class="tag-reward-money">-$' + Math.abs(moneyDiff) + '</div>' : '';
      const container = document.getElementById('bal-blind-options');
      if (container) {
        container.innerHTML =
          '<div class="bal-tag-reward">' +
            '<div class="tag-reward-title">Skipped ' + skippedName + '</div>' +
            '<div class="tag-reward-name">' + tag.name + '</div>' +
            '<div class="tag-reward-desc">' + tag.desc + '</div>' +
            moneyInfo +
          '</div>';
        setTimeout(() => render(), 1800);
      } else {
        render();
      }
    } else {
      render();
    }
  }

  function doDiscard() {
    if (state.phase !== 'playing') return;
    E.discardCards(state);
    renderGame();
    saveState();
  }

  return { init };
})();
