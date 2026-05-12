// ============================================================
// BALATRO ENGINE - Game logic, scoring pipeline, state machine
// ============================================================
//
// Pure game logic — no DOM access. Called by balatro.js (UI layer).
// Reads from BalatroData for all definitions and constants.

const BalatroEngine = (() => {
  const D = BalatroData;
  let cardIdCounter = 0;

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

  function isFaceCard(card, state) {
    if (state && state.jokers.some(j => j.defId === 'pareidolia' && !j._debuffed)) return true;
    return D.FACE_RANKS.includes(card.rank);
  }

  // ============================================================
  // CARD CREATION
  // ============================================================

  function createCard(suit, rank) {
    return {
      id: 'card_' + (cardIdCounter++),
      suit: suit,
      rank: rank,
      enhancement: null,
      edition: 'base',
      seal: null,
      chipBonus: 0,
      debuffed: false,
    };
  }

  function createStandardDeck() {
    const deck = [];
    D.SUITS.forEach(suit => {
      D.RANKS.forEach(rank => {
        deck.push(createCard(suit, rank));
      });
    });
    return deck;
  }

  function createDeckForRun(deckId) {
    let deck = createStandardDeck();
    const deckDef = D.findDeck(deckId);
    if (deckDef && deckDef.modifyDeck) {
      const modified = deckDef.modifyDeck(deck);
      if (modified) {
        // modifyDeck may return plain objects, ensure they are proper cards
        deck = modified.map(c => c.id ? c : createCard(c.suit, c.rank));
      }
    }
    return deck;
  }

  // ============================================================
  // HAND EVALUATION
  // ============================================================

  function getJokerFlags(state) {
    const flags = { fourFingers: false, shortcut: false, smeared: false, splash: false };
    if (!state) return flags;
    state.jokers.forEach(j => {
      if (j._debuffed) return;
      if (j.defId === 'four_fingers') flags.fourFingers = true;
      if (j.defId === 'shortcut') flags.shortcut = true;
      if (j.defId === 'smeared_joker') flags.smeared = true;
      if (j.defId === 'splash') flags.splash = true;
    });
    return flags;
  }

  function getEffectiveSuits(card, flags) {
    if (card.enhancement === 'wild') return [...D.SUITS];
    if (flags && flags.smeared) {
      if (card.suit === 'hearts' || card.suit === 'diamonds') return ['hearts', 'diamonds'];
      if (card.suit === 'spades' || card.suit === 'clubs') return ['spades', 'clubs'];
    }
    return [card.suit];
  }

  function checkFlush(cards, flags, minCards) {
    const suitCounts = {};
    cards.forEach(c => {
      getEffectiveSuits(c, flags).forEach(s => {
        suitCounts[s] = (suitCounts[s] || 0) + 1;
      });
    });
    return Object.values(suitCounts).some(v => v >= minCards);
  }

  function checkStraight(cards, flags) {
    const minCards = (flags && flags.fourFingers) ? 4 : 5;
    if (cards.length < minCards) return false;
    const orders = [...new Set(cards.map(c => D.RANK_ORDER[c.rank]))].sort((a, b) => a - b);
    if (orders.length < minCards) return false;

    const gap = (flags && flags.shortcut) ? 1 : 0; // allow gaps of 1 rank

    // Standard consecutive check
    for (let i = 0; i <= orders.length - minCards; i++) {
      let valid = true;
      for (let j = 1; j < minCards; j++) {
        const diff = orders[i + j] - orders[i + j - 1];
        if (diff < 1 || diff > 1 + gap) { valid = false; break; }
      }
      if (valid) return true;
    }

    // Ace-low: A as 1
    if (orders.includes(14)) {
      const withLowAce = [1, ...orders.filter(o => o !== 14)].sort((a, b) => a - b);
      for (let i = 0; i <= withLowAce.length - minCards; i++) {
        let valid = true;
        for (let j = 1; j < minCards; j++) {
          const diff = withLowAce[i + j] - withLowAce[i + j - 1];
          if (diff < 1 || diff > 1 + gap) { valid = false; break; }
        }
        if (valid) return true;
      }
    }
    return false;
  }

  function evaluateHand(cards, state) {
    if (!cards || cards.length === 0) return null;
    const flags = getJokerFlags(state);
    const minFlush = flags.fourFingers ? 4 : 5;

    // Count ranks
    const rankCounts = {};
    cards.forEach(c => {
      const r = (c.enhancement === 'stone') ? '__stone__' : c.rank;
      rankCounts[r] = (rankCounts[r] || 0) + 1;
    });
    // Filter out stone cards for rank-based hands
    const nonStone = cards.filter(c => c.enhancement !== 'stone');
    const rc = {};
    nonStone.forEach(c => { rc[c.rank] = (rc[c.rank] || 0) + 1; });
    const counts = Object.values(rc).sort((a, b) => b - a);

    const isFlush = cards.length >= minFlush && checkFlush(cards, flags, minFlush);
    const isStraight = nonStone.length >= (flags.fourFingers ? 4 : 5) && checkStraight(nonStone, flags);

    // Check royal (10-J-Q-K-A all present and flush)
    const isRoyal = isStraight && isFlush &&
      nonStone.some(c => D.RANK_ORDER[c.rank] === 14) &&
      nonStone.some(c => D.RANK_ORDER[c.rank] === 13) &&
      nonStone.some(c => D.RANK_ORDER[c.rank] === 12) &&
      nonStone.some(c => D.RANK_ORDER[c.rank] === 11) &&
      nonStone.some(c => D.RANK_ORDER[c.rank] === 10);

    // Check in priority order
    if (counts[0] >= 5 && isFlush) return 'Flush Five';
    if (counts[0] >= 3 && counts.length >= 2 && counts[1] >= 2 && isFlush) return 'Flush House';
    if (counts[0] >= 5) return 'Five of a Kind';
    if (isRoyal) return 'Royal Flush';
    if (isStraight && isFlush) return 'Straight Flush';
    if (counts[0] >= 4) return 'Four of a Kind';
    if (counts[0] >= 3 && counts.length >= 2 && counts[1] >= 2) return 'Full House';
    if (isFlush) return 'Flush';
    if (isStraight) return 'Straight';
    if (counts[0] >= 3) return 'Three of a Kind';
    if (counts[0] >= 2 && counts.length >= 2 && counts[1] >= 2) return 'Two Pair';
    if (counts[0] >= 2) return 'Pair';
    return 'High Card';
  }

  // ============================================================
  // SCORING CARDS DETERMINATION
  // ============================================================

  function getScoringCards(cards, handType, state) {
    const flags = getJokerFlags(state);

    // Splash joker: all played cards score
    if (flags.splash) return [...cards];

    // Stone cards always score
    const stoneCards = cards.filter(c => c.enhancement === 'stone');
    const nonStone = cards.filter(c => c.enhancement !== 'stone');

    let scoring = [];

    if (['Straight', 'Flush', 'Full House', 'Straight Flush', 'Royal Flush',
         'Flush Five', 'Flush House', 'Five of a Kind'].includes(handType)) {
      scoring = [...nonStone];
    } else {
      const rc = {};
      nonStone.forEach(c => { rc[c.rank] = (rc[c.rank] || 0) + 1; });

      if (handType === 'Four of a Kind') {
        const r = Object.keys(rc).find(k => rc[k] >= 4);
        scoring = nonStone.filter(c => c.rank === r);
      } else if (handType === 'Three of a Kind') {
        const r = Object.keys(rc).find(k => rc[k] >= 3);
        scoring = nonStone.filter(c => c.rank === r);
      } else if (handType === 'Two Pair') {
        const pairs = Object.keys(rc).filter(k => rc[k] >= 2)
          .sort((a, b) => D.RANK_ORDER[b] - D.RANK_ORDER[a]).slice(0, 2);
        scoring = nonStone.filter(c => pairs.includes(c.rank));
      } else if (handType === 'Pair') {
        const r = Object.keys(rc).find(k => rc[k] >= 2);
        scoring = nonStone.filter(c => c.rank === r);
      } else {
        // High Card: just the highest
        if (nonStone.length > 0) {
          scoring = [nonStone.reduce((best, c) =>
            D.RANK_ORDER[c.rank] > D.RANK_ORDER[best.rank] ? c : best)];
        }
      }
    }

    // Add stone cards (they always score)
    return [...scoring, ...stoneCards];
  }

  // ============================================================
  // HAND LEVEL
  // ============================================================

  function getHandLevel(state, handType) {
    return (state.handLevels[handType] && state.handLevels[handType].level) || 1;
  }

  function getHandChipsMult(state, handType) {
    const def = D.HAND_TYPE_MAP[handType];
    if (!def) return { chips: 0, mult: 0 };
    const level = getHandLevel(state, handType);
    return {
      chips: def.baseChips + (level - 1) * def.lvlChips,
      mult: def.baseMult + (level - 1) * def.lvlMult,
    };
  }

  // ============================================================
  // JOKER RESOLUTION (Blueprint / Brainstorm)
  // ============================================================

  function resolveJokerDef(state, jokerInst, idx) {
    const def = D.findJoker(jokerInst.defId);
    if (!def) return null;
    if (jokerInst._debuffed) return null;

    if (def.isCopy === 'right') {
      const rightInst = state.jokers[idx + 1];
      if (rightInst && rightInst.defId !== 'blueprint' && rightInst.defId !== 'brainstorm') {
        return D.findJoker(rightInst.defId);
      }
      return null;
    }
    if (def.isCopy === 'left') {
      const leftInst = state.jokers[0];
      if (leftInst && leftInst !== jokerInst && leftInst.defId !== 'blueprint' && leftInst.defId !== 'brainstorm') {
        return D.findJoker(leftInst.defId);
      }
      return null;
    }
    return def;
  }

  // ============================================================
  // SCORING PIPELINE
  // ============================================================

  // Preview scoring without side effects — uses shallow clones of cards
  // and joker vars so mutations from hooks don't persist.
  function previewScore(state, playedCards) {
    // Clone cards so chipBonus mutations (Hiker) don't persist
    const clonedCards = playedCards.map(c => Object.assign({}, c));
    const clonedHand = state.hand.map(c =>
      playedCards.includes(c) ? clonedCards[playedCards.indexOf(c)] : Object.assign({}, c)
    );
    // Clone joker vars so stateful joker mutations don't persist
    const savedVars = state.jokers.map(j => j.vars ? JSON.parse(JSON.stringify(j.vars)) : {});

    // Temporarily swap hand for scoring context (heldCards derived from state.hand)
    const origHand = state.hand;
    state.hand = clonedHand;

    const result = scoreHand(state, clonedCards);

    // Restore originals
    state.hand = origHand;
    state.jokers.forEach((j, i) => { j.vars = savedVars[i]; });

    return result;
  }

  function scoreHand(state, playedCards) {
    const handType = evaluateHand(playedCards, state);
    if (!handType) return null;

    const heldCards = state.hand.filter(c => !playedCards.includes(c));
    const scoringCards = getScoringCards(playedCards, handType, state);

    // Step 1-2: Base chips and mult from hand type + level
    const base = getHandChipsMult(state, handType);
    let chips = base.chips;
    let mult = base.mult;

    // Step 3: Boss blind base modification
    const boss = state.bossEffect ? D.findBoss(state.bossEffect) : null;
    if (boss && boss.halveBase) {
      chips = Math.ceil(chips / 2);
      mult = Math.ceil(mult / 2);
    }
    if (boss && boss.onTargetCalc) {
      // onTargetCalc modifies target, not base - skip here
    }

    const isFinalHand = state.hands <= 1;
    const ctx = {
      chips, mult, handType, scoringCards, heldCards, playedCards,
      discardsLeft: state.discards, handsLeft: state.hands,
      money: 0, state, isFinalHand,
    };

    // Step 4: Per scoring card (left to right)
    scoringCards.forEach(card => {
      if (card.debuffed) return;
      const triggers = 1 + getCardRetriggers(card, ctx, 'played');

      for (let t = 0; t < triggers; t++) {
        // 4a: Card chip value
        if (card.enhancement === 'stone') {
          ctx.chips += 50 + (card.chipBonus || 0);
        } else {
          ctx.chips += D.RANK_CHIPS[card.rank] + (card.chipBonus || 0);
        }

        // 4b: Enhancement effects
        applyEnhancement(card, ctx);

        // 4c: Edition effects
        applyEdition(card.edition, ctx);

        // 4d: Seal (Gold Seal = $3 when scored)
        if (card.seal === 'gold') ctx.money += 3;

        // 4e: Per-card joker hooks
        state.jokers.forEach((ji, idx) => {
          const def = resolveJokerDef(state, ji, idx);
          if (def && def.onCardScore) {
            def.onCardScore(ctx, card, ji.vars);
          }
        });
      }
    });

    // Step 5: Held card effects
    heldCards.forEach(card => {
      if (card.debuffed) return;
      const triggers = 1 + getCardRetriggers(card, ctx, 'held');

      for (let t = 0; t < triggers; t++) {
        // Steel enhancement: x1.5 mult while held
        if (card.enhancement === 'steel') ctx.mult *= 1.5;

        // Gold card: $3 at end of round (tracked but not in mult/chips)
        if (card.enhancement === 'gold') ctx.money += 3;

        // Per-held-card joker hooks
        state.jokers.forEach((ji, idx) => {
          const def = resolveJokerDef(state, ji, idx);
          if (def && def.onHeldCard) {
            def.onHeldCard(ctx, card, ji.vars);
          }
        });
      }
    });

    // Step 6: Per joker effects (left to right)
    state.jokers.forEach((ji, idx) => {
      const def = resolveJokerDef(state, ji, idx);
      if (def && def.onScore) {
        def.onScore(ctx, ji.vars);
      }

      // Joker's own edition
      if (ji.edition && ji.edition !== 'base' && !ji._debuffed) {
        applyEdition(ji.edition, ctx);
      }
    });

    // Plasma deck: balance chips and mult
    if (state.plasmaDeck) {
      const avg = Math.floor((ctx.chips + ctx.mult) / 2);
      ctx.chips = avg;
      ctx.mult = avg;
    }

    // Step 7: Final score
    const level = getHandLevel(state, handType);
    return {
      chips: Math.max(0, Math.floor(ctx.chips)),
      mult: Math.max(0, Math.floor(ctx.mult)),
      total: Math.max(0, Math.floor(ctx.chips * ctx.mult)),
      handType,
      level,
      scoringCards,
      earnedMoney: ctx.money,
    };
  }

  function applyEnhancement(card, ctx) {
    const enh = card.enhancement;
    if (!enh) return;
    const def = D.ENHANCEMENTS[enh];
    if (!def) return;

    if (def.chips) ctx.chips += def.chips;
    if (def.mult) ctx.mult += def.mult;
    if (def.xMult && enh !== 'steel') ctx.mult *= def.xMult; // Steel handled in held cards

    // Lucky card
    if (enh === 'lucky') {
      const luck = ctx.state.luckMult || 1;
      if (Math.random() < def.multChance * luck) ctx.mult += def.multReward;
      if (Math.random() < def.moneyChance * luck) ctx.money += def.moneyReward;
      // Update Lucky Cat joker
      ctx.state.jokers.forEach(j => {
        if (j.defId === 'lucky_cat' && j.vars) j.vars.xMult = (j.vars.xMult || 1) + 0.25;
      });
    }
  }

  function applyEdition(edition, ctx) {
    if (!edition || edition === 'base') return;
    const def = D.EDITIONS[edition];
    if (!def) return;
    if (def.chips) ctx.chips += def.chips;
    if (def.mult) ctx.mult += def.mult;
    if (def.xMult) ctx.mult *= def.xMult;
  }

  function getCardRetriggers(card, ctx, type) {
    let extra = 0;
    // Red seal
    if (card.seal === 'red') extra++;

    // Joker retrigger hooks
    ctx.state.jokers.forEach((ji, idx) => {
      const def = resolveJokerDef(ctx.state, ji, idx);
      if (def && def.retrigger) {
        extra += def.retrigger(card, ctx, ji.vars);
      }
      // Mime retriggers held cards
      if (type === 'held' && def && def.retriggerHeld) extra++;
    });
    return extra;
  }

  // ============================================================
  // GAME STATE
  // ============================================================

  function freshState(deckId, stakeId) {
    return {
      phase: 'menu',
      deck: [],
      drawPile: [],
      hand: [],
      selected: new Set(),
      jokers: [],
      maxJokers: D.GAME.MAX_JOKERS,
      consumables: [],
      maxConsumables: D.GAME.MAX_CONSUMABLES,
      ante: 1,
      blind: 0,
      bossEffect: null,
      roundScore: 0,
      scoreTarget: 0,
      hands: D.GAME.MAX_HANDS,
      discards: D.GAME.MAX_DISCARDS,
      handSize: D.GAME.HAND_SIZE,
      money: D.GAME.STARTING_MONEY,
      interestCap: D.GAME.INTEREST_CAP,
      handLevels: {},
      deckId: deckId || 'red_deck',
      stakeId: stakeId || 'white',
      vouchers: [],
      tags: [],
      shopSlots: [],
      packSlots: [],
      voucherSlot: null,
      rerollCost: D.GAME.REROLL_BASE_COST,
      rerollDiscount: 0,
      freeRerolls: 0,
      sortByRank: true,
      lastEarnings: null,
      handsPlayedRun: {},
      blindsSkipped: 0,
      tarotsUsed: 0,
      planetsUsed: [],
      lastConsumedId: null,
      lastConsumedType: null,
      bonusHands: 0,
      bonusDiscards: 0,
      permHandSizeBonus: 0,  // permanent: Juggler, Stuntman, Paint Brush, etc.
      luckMult: 1,
      shopDiscount: 0,
      unusedDiscards: 0,
      secretHandsPlayed: {},
      anteBoss: null,         // pre-rolled boss for current ante (for preview)
      _handTypesThisRound: [],
      shopCardSlotCount: 2,
    };
  }

  // ============================================================
  // GAME FLOW
  // ============================================================

  function startRun(state) {
    const fresh = freshState(state.deckId, state.stakeId);
    Object.assign(state, fresh);
    state.phase = 'deckSelect';

    // Apply stake modifiers
    const stakeDef = D.stakes.find(s => s.id === state.stakeId);
    if (stakeDef && stakeDef.modifiers.includes('minus_discard')) {
      state.bonusDiscards--;
    }

    // Oops! All 6s luck multiplier
    state.luckMult = 1;
  }

  function applyDeckAndStart(state) {
    // Create deck
    state.deck = createDeckForRun(state.deckId);

    // Apply deck effects
    const deckDef = D.findDeck(state.deckId);
    if (deckDef && deckDef.apply) deckDef.apply(state);

    state.phase = 'blindSelect';
  }

  // Pre-roll boss blind for current ante (called when entering blindSelect)
  function ensureAnteBoss(state) {
    if (state.anteBoss) return;
    if (state.jokers.some(j => j.defId === 'chicot' && !j._debuffed)) {
      state.anteBoss = { id: null, name: 'Disabled', desc: 'Chicot disables Boss Blinds' };
    } else {
      state.anteBoss = D.bossBlinds[Math.floor(Math.random() * D.bossBlinds.length)];
    }
  }

  // Pre-roll skip tags for small and big blinds so they can be shown before the player decides
  function ensureSkipTags(state) {
    if (state._skipTags) return;
    const tagPool = D.tags.filter(t => {
      if (state.ante <= 1 && ['top_up_tag', 'handy_tag', 'garbage_tag', 'negative_tag',
          'standard_tag', 'meteor_tag', 'buffoon_tag', 'ethereal_tag', 'orbital_tag'].includes(t.id)) return false;
      return true;
    });
    state._skipTags = [
      tagPool[Math.floor(Math.random() * tagPool.length)],
      tagPool[Math.floor(Math.random() * tagPool.length)],
    ];
  }

  function selectBlind(state) {
    state._handTypesThisRound = [];
    state._pillarPlayed = null;
    state._houseActive = false;
    state._fishActive = false;
    state._markActive = false;

    // Set hands and discards for this round
    state.hands = D.GAME.MAX_HANDS + state.bonusHands;
    state.discards = D.GAME.MAX_DISCARDS + state.bonusDiscards;

    // Calculate hand size: base + permanent bonuses + per-round joker bonuses
    let tempHandSizeBonus = 0;

    // Jokers that modify on blind select
    state.jokers.forEach(j => {
      if (j._debuffed) return;
      if (j.defId === 'drunkard') state.discards++;
      if (j.defId === 'troubadour') { tempHandSizeBonus += 2; state.hands--; }
      if (j.defId === 'merry_andy') { state.discards += 3; tempHandSizeBonus--; }
    });

    // Clamp
    state.hands = Math.max(1, state.hands);
    state.discards = Math.max(0, state.discards);

    // Boss blind effect
    if (state.blind === 2) {
      ensureAnteBoss(state);
      if (state.anteBoss && state.anteBoss.id) {
        state.bossEffect = state.anteBoss.id;
        const boss = D.findBoss(state.bossEffect);
        if (boss && boss.onBlindStart) boss.onBlindStart(state);
      } else {
        state.bossEffect = null;
      }
    } else {
      state.bossEffect = null;
    }

    // Calculate score target
    const anteBase = D.ANTE_BASES[Math.min(state.ante - 1, D.ANTE_BASES.length - 1)];
    state.scoreTarget = Math.floor(anteBase * D.BLIND_SCORE_MULTS[state.blind]);
    const boss2 = state.bossEffect ? D.findBoss(state.bossEffect) : null;
    if (boss2 && boss2.onTargetCalc) {
      state.scoreTarget = boss2.onTargetCalc(state.scoreTarget);
    }
    if (state.plasmaDeck) state.scoreTarget *= 2;

    state.roundScore = 0;

    // Fire joker onBlindSelect hooks
    state.jokers.forEach((ji, idx) => {
      const def = resolveJokerDef(state, ji, idx);
      if (def && def.onBlindSelect) def.onBlindSelect(state, ji.vars);
    });

    // Shuffle and deal
    state.drawPile = shuffle([...state.deck]);
    const bossTempSize = state._tempHandSizeMod || 0;
    state._tempHandSizeMod = 0; // consume temporary mods
    const handSize = state.handSize + state.permHandSizeBonus + tempHandSizeBonus + bossTempSize;
    state.hand = state.drawPile.splice(0, Math.max(1, handSize));

    // Apply boss debuffs to hand
    applyBossDebuffs(state);

    state.selected = new Set();
    state.phase = 'playing';
  }

  function skipBlind(state) {
    state.blindsSkipped++;

    // Use the pre-rolled tag for this blind (0=small, 1=big)
    ensureSkipTags(state);
    const tag = state._skipTags ? state._skipTags[state.blind] : null;
    let awardedTag = null;
    if (tag) {
      awardedTag = tag;
      if (tag.apply) tag.apply(state);
      if (tag.onShopEnter) state.tags.push({ id: tag.id });
    }

    // Advance blind
    state.blind++;
    if (state.blind > 2) { state.blind = 0; state.ante++; state.anteBoss = null; }
    // Clear pre-rolled tags when moving to a new ante
    if (state.blind === 0) state._skipTags = null;
    state.phase = 'blindSelect';

    return awardedTag;
  }

  function applyBossDebuffs(state) {
    // Clear all debuffs first
    state.hand.forEach(c => { c.debuffed = false; });

    const boss = state.bossEffect ? D.findBoss(state.bossEffect) : null;
    if (boss && boss.debuffCards) boss.debuffCards(state);
  }

  function playHand(state) {
    if (state.selected.size === 0 || state.hands <= 0 || state.phase !== 'playing') return null;

    const boss = state.bossEffect ? D.findBoss(state.bossEffect) : null;

    // Boss: The Psychic
    if (boss && boss.requireExact && state.selected.size !== boss.requireExact) {
      return { error: 'Must play exactly ' + boss.requireExact + ' cards!' };
    }

    const indices = [...state.selected].sort((a, b) => a - b);
    const playedCards = indices.map(i => state.hand[i]);

    // Evaluate hand type
    const handType = evaluateHand(playedCards, state);

    // Boss: The Eye (no repeat hand types)
    if (boss && boss.validateHand && !boss.validateHand(state, handType)) {
      return { error: 'Cannot play ' + handType + ' again this round!' };
    }

    // Boss: The Mouth (only one hand type)
    if (boss && boss.id === 'the_mouth' && boss.validateHand && !boss.validateHand(state, handType)) {
      return { error: 'Must play ' + (state._mouthType || '') + ' this round!' };
    }

    // Score the hand
    const result = scoreHand(state, playedCards);
    if (!result) return null;

    // Update hand plays tracking
    if (!state.handsPlayedRun[handType]) state.handsPlayedRun[handType] = 0;
    state.handsPlayedRun[handType]++;
    state._handTypesThisRound.push(handType);

    // Track secret hands
    if (['Five of a Kind', 'Flush House', 'Flush Five'].includes(handType)) {
      state.secretHandsPlayed[handType] = true;
    }

    state.roundScore += result.total;
    state.money += result.earnedMoney;
    state.hands--;

    // Remove played cards from hand FIRST, then draw replacements.
    // This must happen before boss/joker onHandPlayed hooks which may
    // further modify the hand (e.g., The Hook discards 2 more cards).
    const remaining = state.hand.filter((_, i) => !state.selected.has(i));
    const drawCount = Math.min(indices.length, state.drawPile.length);
    const drawn = state.drawPile.splice(0, drawCount);
    state.hand = [...remaining, ...drawn];
    state.selected = new Set();

    // Fire joker onHandPlayed hooks (after card replacement)
    state.jokers.forEach((ji, idx) => {
      const def = resolveJokerDef(state, ji, idx);
      if (def && def.onHandPlayed) def.onHandPlayed(state, ji.vars, handType, result.scoringCards);
    });

    // Boss onHandPlayed (after card replacement — e.g., The Hook discards from new hand)
    if (boss && boss.onHandPlayed) boss.onHandPlayed(state, playedCards, handType);

    // Glass card destruction
    playedCards.forEach(card => {
      if (card.enhancement === 'glass' && Math.random() < 0.25) {
        const deckIdx = state.deck.findIndex(c => c.id === card.id);
        if (deckIdx >= 0) state.deck.splice(deckIdx, 1);
        // Update Glass Joker
        state.jokers.forEach(j => {
          if (j.defId === 'glass_joker' && j.vars) j.vars.xMult = (j.vars.xMult || 1) + 0.75;
        });
      }
    });

    // Re-apply boss debuffs to new hand
    applyBossDebuffs(state);

    // Sort hand
    sortHand(state);

    return result;
  }

  function discardCards(state) {
    if (state.selected.size === 0 || state.discards <= 0 || state.phase !== 'playing') return;

    const indices = [...state.selected].sort((a, b) => a - b);
    const discardedCards = indices.map(i => state.hand[i]);

    state.discards--;

    // Purple seal: create tarot when discarded
    discardedCards.forEach(card => {
      if (card.seal === 'purple' && state.consumables.length < state.maxConsumables) {
        const t = D.tarots[Math.floor(Math.random() * D.tarots.length)];
        if (t) state.consumables.push({ type: 'tarot', id: t.id });
      }
    });

    // Fire joker onDiscard hooks
    state.jokers.forEach((ji, idx) => {
      const def = resolveJokerDef(state, ji, idx);
      if (def && def.onDiscard) def.onDiscard(state, discardedCards, ji.vars);
    });

    // Remove from hand and draw replacements
    const remaining = state.hand.filter((_, i) => !state.selected.has(i));
    const drawCount = Math.min(indices.length, state.drawPile.length);
    const drawn = state.drawPile.splice(0, drawCount);
    state.hand = [...remaining, ...drawn];
    state.selected = new Set();

    applyBossDebuffs(state);
    sortHand(state);
  }

  function endBlind(state, won) {
    if (!won) {
      // Mr. Bones check
      const mrBones = state.jokers.find(j => j.defId === 'mr_bones');
      if (mrBones && state.roundScore >= state.scoreTarget * 0.25) {
        // Survive, destroy Mr. Bones
        const idx = state.jokers.indexOf(mrBones);
        if (idx >= 0) state.jokers.splice(idx, 1);
        won = true;
      }
    }

    if (!won) {
      state.phase = 'gameover';
      state.gameResult = 'lose';
      return;
    }

    // Calculate earnings
    const blindReward = D.BLIND_REWARDS[state.blind];
    const stakeDef = D.stakes.find(s => s.id === state.stakeId);
    const noSmallReward = stakeDef && stakeDef.modifiers.includes('no_small_reward') && state.blind === 0;
    const base = noSmallReward ? 0 : blindReward;
    const handBonus = state.hands;
    const interest = Math.min(state.interestCap, Math.floor(Math.max(0, state.money) / D.GAME.INTEREST_RATE));

    // Green deck special earnings
    let greenBonus = 0;
    if (state.greenDeck) {
      greenBonus = state.hands * 2 + state.discards * 1;
    }

    const total = base + handBonus + interest + greenBonus;
    state.lastEarnings = { base, handBonus, interest, greenBonus, total };
    state.money += total;

    // Track unused discards for Garbage Tag
    state.unusedDiscards = (state.unusedDiscards || 0) + state.discards;

    // Investment tag bonus
    if (state.blind === 2 && state._investmentBonus) {
      state.money += state._investmentBonus;
      state._investmentBonus = 0;
    }

    // Fire joker onRoundEnd hooks
    state.jokers.forEach((ji, idx) => {
      const def = resolveJokerDef(state, ji, idx);
      if (def && def.onRoundEnd) def.onRoundEnd(state, ji.vars);
    });

    // Blue seal: create planet cards for final hand type
    state.hand.forEach(card => {
      if (card.seal === 'blue' && state._handTypesThisRound.length > 0) {
        const lastHand = state._handTypesThisRound[state._handTypesThisRound.length - 1];
        const planetInfo = D.PLANET_MAP[lastHand];
        if (planetInfo && state.consumables.length < state.maxConsumables) {
          state.consumables.push({ type: 'planet', id: planetInfo.id });
        }
      }
    });

    // Check win: Ante 8 boss blind defeated
    if (state.ante >= D.GAME.ANTE_COUNT && state.blind >= 2) {
      state.phase = 'gameover';
      state.gameResult = 'win';
      return;
    }

    // Advance blind
    state.blind++;
    if (state.blind > 2) {
      state.blind = 0;
      state.ante++;
      state.anteBoss = null; // Re-roll boss for next ante
      state._skipTags = null; // Re-roll skip tags for next ante
      // Anaglyph deck: Double Tag after boss
      if (state.anaglyphDeck) state.tags.push({ id: 'double_tag' });
    }

    state.phase = 'shop';
    generateShop(state);
  }

  // ============================================================
  // SHOP
  // ============================================================

  function generateShop(state) {
    state.rerollCost = Math.max(0, D.GAME.REROLL_BASE_COST - (state.rerollDiscount || 0));
    state.freeRerolls = 0;

    // Apply tag effects that modify shop
    state.tags.forEach(tag => {
      const def = D.tags.find(t => t.id === tag.id);
      if (def && def.onShopEnter) def.onShopEnter(state);
    });

    // Joker shop-enter hooks
    state.jokers.forEach((ji, idx) => {
      const def = resolveJokerDef(state, ji, idx);
      if (def && def.onShopEnter) def.onShopEnter(state, ji.vars);
    });

    // Generate card slots
    const slotCount = state.shopCardSlotCount || 2;
    state.shopSlots = [];
    for (let i = 0; i < slotCount; i++) {
      state.shopSlots.push(generateShopItem(state));
    }

    // Handle tag-guaranteed items
    if (state._tagGuaranteeRarity) {
      const rarity = state._tagGuaranteeRarity;
      const pool = D.jokers.filter(j => j.rarity === rarity && !state.jokers.some(o => o.defId === j.id));
      if (pool.length > 0) {
        const pick = pool[Math.floor(Math.random() * pool.length)];
        state.shopSlots[0] = { type: 'joker', defId: pick.id, cost: 0, edition: 'base' };
      }
      state._tagGuaranteeRarity = null;
    }

    if (state._tagEditionFree) {
      if (state.shopSlots[0] && state.shopSlots[0].type === 'joker') {
        state.shopSlots[0].edition = state._tagEditionFree;
        state.shopSlots[0].cost = 0;
      }
      state._tagEditionFree = null;
    }

    if (state._tagNegativeFree) {
      if (state.shopSlots[0] && state.shopSlots[0].type === 'joker') {
        state.shopSlots[0].edition = 'negative';
        state.shopSlots[0].cost = 0;
      }
      state._tagNegativeFree = null;
    }

    if (state._couponActive) {
      state.shopSlots.forEach(s => { s.cost = 0; });
      state._couponActive = false;
    }

    // Generate booster pack slots (2)
    state.packSlots = [];
    for (let i = 0; i < 2; i++) {
      state.packSlots.push(generateBoosterPack(state));
    }

    // Generate voucher (1 per ante, first shop of the ante)
    if (state.blind === 0 || !state.voucherSlot) {
      state.voucherSlot = generateVoucher(state);
    }

    // Clear consumed tags
    state.tags = state.tags.filter(t => !D.tags.find(td => td.id === t.id && td.onShopEnter));
  }

  function generateShopItem(state) {
    // Weighted: 60% joker, 20% tarot, 20% planet
    const roll = Math.random() * 100;
    if (roll < 60) {
      return generateShopJoker(state);
    } else if (roll < 80) {
      const pool = D.tarots;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      return { type: 'tarot', id: pick.id, cost: 3 };
    } else {
      const pool = D.planets.filter(p => !p.secret || state.secretHandsPlayed[p.handType]);
      const pick = pool[Math.floor(Math.random() * pool.length)];
      return { type: 'planet', id: pick.id, cost: 3 };
    }
  }

  function generateShopJoker(state) {
    const rarity = rollRarity();
    const owned = new Set(state.jokers.map(j => j.defId));
    const showman = state.jokers.some(j => j.defId === 'showman');
    const pool = D.jokers.filter(j => j.rarity === rarity && (showman || !owned.has(j.id)));
    if (pool.length === 0) return generateShopJoker(state); // retry with different rarity
    const pick = pool[Math.floor(Math.random() * pool.length)];
    let cost = pick.cost;
    if (state.shopDiscount) cost = Math.max(1, Math.floor(cost * (1 - state.shopDiscount)));
    return { type: 'joker', defId: pick.id, cost, edition: 'base' };
  }

  function rollRarity() {
    const r = Math.random() * 100;
    if (r < D.RARITY_WEIGHTS.common) return 'common';
    if (r < D.RARITY_WEIGHTS.common + D.RARITY_WEIGHTS.uncommon) return 'uncommon';
    if (r < D.RARITY_WEIGHTS.common + D.RARITY_WEIGHTS.uncommon + D.RARITY_WEIGHTS.rare) return 'rare';
    return 'legendary';
  }

  function generateBoosterPack(state) {
    // Weighted random pack selection
    const weights = [];
    D.boosterPacks.forEach(p => {
      const w = D.PACK_WEIGHTS[p.type] ? D.PACK_WEIGHTS[p.type][p.size] || 1 : 1;
      weights.push({ pack: p, weight: w });
    });
    const total = weights.reduce((s, w) => s + w.weight, 0);
    let r = Math.random() * total;
    for (const w of weights) {
      r -= w.weight;
      if (r <= 0) {
        let cost = w.pack.cost;
        if (state.shopDiscount) cost = Math.max(1, Math.floor(cost * (1 - state.shopDiscount)));
        return { ...w.pack, cost };
      }
    }
    return { ...weights[0].pack };
  }

  function generateVoucher(state) {
    const owned = new Set(state.vouchers);
    // Available: tier 1 not owned, or tier 2 whose tier 1 is owned
    const pool = D.vouchers.filter(v => {
      if (owned.has(v.id)) return false;
      if (v.tier === 2 && v.requires && !owned.has(v.requires)) return false;
      return true;
    });
    if (pool.length === 0) return null;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    return { id: pick.id, cost: pick.cost };
  }

  function buyShopItem(state, slotIndex) {
    const item = state.shopSlots[slotIndex];
    if (!item || item.sold) return false;

    const cost = item.cost || 0;
    if (state.money < cost) return false;

    if (item.type === 'joker') {
      if (state.jokers.length >= state.maxJokers) {
        // Negative edition adds a slot
        if (item.edition !== 'negative') return false;
      }
      state.money -= cost;
      const def = D.findJoker(item.defId);
      const inst = {
        defId: item.defId,
        edition: item.edition || 'base',
        sellValue: Math.ceil((def ? def.cost : cost) / 2),
        vars: def && def.initVars ? def.initVars() : {},
      };
      state.jokers.push(inst);

      // Handle Negative edition joker slot
      if (inst.edition === 'negative') state.maxJokers++;
      // Oops! All 6s
      if (inst.defId === 'oops_all_6s') state.luckMult = 2;
      // Juggler: permanent +1 hand size
      if (inst.defId === 'juggler') state.permHandSizeBonus++;
      // Stuntman: permanent -2 hand size
      if (inst.defId === 'stuntman') state.permHandSizeBonus -= 2;
    } else if (item.type === 'tarot' || item.type === 'planet' || item.type === 'spectral') {
      if (state.consumables.length >= state.maxConsumables) return false;
      state.money -= cost;
      state.consumables.push({ type: item.type, id: item.id || item.defId });
    }

    item.sold = true;
    return true;
  }

  function buyVoucher(state) {
    if (!state.voucherSlot || state.voucherSlot.sold) return false;
    if (state.money < state.voucherSlot.cost) return false;

    state.money -= state.voucherSlot.cost;
    const vDef = D.findVoucher(state.voucherSlot.id);
    if (vDef) {
      state.vouchers.push(vDef.id);
      vDef.apply(state);
    }
    state.voucherSlot.sold = true;
    return true;
  }

  function buyPack(state, packIndex) {
    const pack = state.packSlots[packIndex];
    if (!pack || pack.sold) return false;
    if (state.money < pack.cost) return false;

    state.money -= pack.cost;
    pack.sold = true;

    // Generate pack contents
    const contents = generatePackContents(state, pack);
    state.packContents = contents;
    state.packChoicesLeft = pack.cardsToChoose;
    state.packDef = pack;
    state.phase = 'packOpen';

    // Hallucination joker
    state.jokers.forEach((ji, idx) => {
      const def = resolveJokerDef(state, ji, idx);
      if (def && def.onPackOpen) def.onPackOpen(state, ji.vars);
    });

    return true;
  }

  function generatePackContents(state, pack) {
    const contents = [];
    for (let i = 0; i < pack.cardsShown; i++) {
      if (pack.contentType === 'tarot') {
        const pool = D.tarots;
        contents.push({ type: 'tarot', id: pool[Math.floor(Math.random() * pool.length)].id });
      } else if (pack.contentType === 'planet') {
        const pool = D.planets.filter(p => !p.secret || state.secretHandsPlayed[p.handType]);
        contents.push({ type: 'planet', id: pool[Math.floor(Math.random() * pool.length)].id });
      } else if (pack.contentType === 'spectral') {
        const pool = D.spectrals;
        contents.push({ type: 'spectral', id: pool[Math.floor(Math.random() * pool.length)].id });
      } else if (pack.contentType === 'joker') {
        const rarity = rollRarity();
        const pool = D.jokers.filter(j => j.rarity === rarity);
        if (pool.length > 0) {
          const pick = pool[Math.floor(Math.random() * pool.length)];
          contents.push({ type: 'joker', defId: pick.id, cost: pick.cost });
        }
      } else if (pack.contentType === 'playing_card') {
        const suit = D.SUITS[Math.floor(Math.random() * 4)];
        const rank = D.RANKS[Math.floor(Math.random() * D.RANKS.length)];
        const card = createCard(suit, rank);
        // Maybe add enhancement/edition/seal
        if (state.illusionActive) {
          if (Math.random() < 0.3) {
            const enhs = Object.keys(D.ENHANCEMENTS);
            card.enhancement = enhs[Math.floor(Math.random() * enhs.length)];
          }
        }
        contents.push({ type: 'playing_card', card });
      }
    }
    return contents;
  }

  function pickFromPack(state, contentIndex) {
    if (!state.packContents || state.packChoicesLeft <= 0) return false;
    const item = state.packContents[contentIndex];
    if (!item || item.picked) return false;

    item.picked = true;
    state.packChoicesLeft--;

    if (item.type === 'joker') {
      if (state.jokers.length < state.maxJokers) {
        const def = D.findJoker(item.defId);
        state.jokers.push({
          defId: item.defId, edition: 'base',
          sellValue: Math.ceil((def ? def.cost : 4) / 2),
          vars: def && def.initVars ? def.initVars() : {},
        });
      }
    } else if (item.type === 'tarot' || item.type === 'planet' || item.type === 'spectral') {
      if (state.consumables.length < state.maxConsumables) {
        state.consumables.push({ type: item.type, id: item.id });
      }
    } else if (item.type === 'playing_card') {
      state.deck.push(item.card);
      // Hologram joker
      state.jokers.forEach(j => {
        if (j.defId === 'hologram' && j.vars) j.vars.xMult = (j.vars.xMult || 1) + 0.25;
      });
    }

    if (state.packChoicesLeft <= 0) {
      state.phase = 'shop';
      state.packContents = null;
    }
    return true;
  }

  function skipPack(state) {
    // Fire pack skip hooks
    state.jokers.forEach((ji, idx) => {
      const def = resolveJokerDef(state, ji, idx);
      if (def && def.onPackSkip) def.onPackSkip(state, ji.vars);
    });
    state.phase = 'shop';
    state.packContents = null;
  }

  function sellJoker(state, index) {
    const ji = state.jokers[index];
    if (!ji) return;

    const def = D.findJoker(ji.defId);
    state.money += ji.sellValue || Math.ceil((def ? def.cost : 2) / 2);

    // Fire onSell hook
    if (def && def.onSell) def.onSell(state, ji.vars);

    // Campfire joker bonus
    state.jokers.forEach(j => {
      if (j.defId === 'campfire' && j.vars) j.vars.xMult = (j.vars.xMult || 1) + 0.25;
    });

    // Verdant leaf check
    if (state._verdantActive) state._verdantActive = false;

    state.jokers.splice(index, 1);

    // Update Oops All 6s
    if (ji.defId === 'oops_all_6s') state.luckMult = 1;
  }

  function sellConsumable(state, index) {
    if (index < 0 || index >= state.consumables.length) return;
    state.money += 1; // Consumables sell for $1
    state.consumables.splice(index, 1);
  }

  function useConsumable(state, index, selectedCardIndices) {
    const cons = state.consumables[index];
    if (!cons) return false;

    let def;
    if (cons.type === 'tarot') def = D.findTarot(cons.id);
    else if (cons.type === 'planet') def = D.findPlanet(cons.id);
    else if (cons.type === 'spectral') def = D.findSpectral(cons.id);
    if (!def) return false;

    // Check selection requirements
    if (def.needsSelection) {
      if (!selectedCardIndices || selectedCardIndices.length < def.minCards) return false;
      if (selectedCardIndices.length > def.maxCards) return false;
    }

    // Check canUse
    if (def.canUse && !def.canUse(state)) return false;

    const selectedCards = selectedCardIndices ? selectedCardIndices.map(i => state.hand[i]) : [];

    // Apply effect
    def.apply(state, selectedCards);

    // Track usage
    if (cons.type === 'tarot') {
      state.tarotsUsed = (state.tarotsUsed || 0) + 1;
      state.lastConsumedId = cons.id;
      state.lastConsumedType = 'tarot';
    } else if (cons.type === 'planet') {
      state.lastConsumedId = cons.id;
      state.lastConsumedType = 'planet';
    }

    // Remove consumable
    state.consumables.splice(index, 1);
    return true;
  }

  function rerollShop(state) {
    const cost = state.freeRerolls > 0 ? 0 : state.rerollCost;
    if (state.money < cost) return false;

    state.money -= cost;
    if (state.freeRerolls > 0) state.freeRerolls--;
    else state.rerollCost++;

    // Fire reroll hooks
    state.jokers.forEach((ji, idx) => {
      const def = resolveJokerDef(state, ji, idx);
      if (def && def.onReroll) def.onReroll(state, ji.vars);
    });

    // Regenerate card slots only
    const slotCount = state.shopCardSlotCount || 2;
    state.shopSlots = [];
    for (let i = 0; i < slotCount; i++) {
      state.shopSlots.push(generateShopItem(state));
    }
    return true;
  }

  function nextRound(state) {
    state.phase = 'blindSelect';
  }

  // ============================================================
  // SORTING
  // ============================================================

  function sortHand(state) {
    if (state.sortByRank) {
      state.hand.sort((a, b) =>
        D.RANK_ORDER[b.rank] - D.RANK_ORDER[a.rank] ||
        D.SUITS.indexOf(a.suit) - D.SUITS.indexOf(b.suit)
      );
    } else {
      state.hand.sort((a, b) =>
        D.SUITS.indexOf(a.suit) - D.SUITS.indexOf(b.suit) ||
        D.RANK_ORDER[b.rank] - D.RANK_ORDER[a.rank]
      );
    }
  }

  // ============================================================
  // PUBLIC API
  // ============================================================

  return {
    // Card
    createCard, createStandardDeck, createDeckForRun,
    // Hand eval
    evaluateHand, getScoringCards, getJokerFlags, getHandLevel, getHandChipsMult,
    // Scoring
    scoreHand, previewScore, resolveJokerDef,
    // State
    freshState,
    // Game flow
    startRun, applyDeckAndStart, selectBlind, skipBlind, ensureAnteBoss, ensureSkipTags, playHand, discardCards, endBlind,
    // Shop
    generateShop, buyShopItem, buyVoucher, buyPack, sellJoker, sellConsumable,
    useConsumable, rerollShop, nextRound,
    // Pack
    pickFromPack, skipPack,
    // Helpers
    shuffle, sortHand, isFaceCard,
  };
})();
