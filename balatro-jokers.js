// ============================================================
// BALATRO JOKERS - All 150 joker definitions
// ============================================================
//
// Each joker can implement these hooks:
//   onScore(ctx, vars)         - Step 5: after cards scored, per joker L-to-R
//   onCardScore(ctx, card, vars) - Step 3d: per scoring card
//   onHeldCard(ctx, card, vars)  - Step 4: per held card
//   retrigger(card, ctx, vars)   - Returns # extra triggers for a card
//   onBlindSelect(state, vars)   - When blind is chosen
//   onDiscard(state, cards, vars)- When cards are discarded
//   onRoundEnd(state, vars)      - After beating a blind
//   onHandPlayed(state, vars, handType) - After a hand is played
//   onShopEnter(state, vars)     - Entering the shop
//   onReroll(state, vars)        - Shop reroll
//   onSell(state, vars)          - When this joker is sold
//   onPackSkip(state, vars)      - Booster pack skipped
//   onPackOpen(state, vars)      - Booster pack opened
//   initVars()                   - Returns initial mutable state
//
// ctx fields: chips, mult, handType, scoringCards, heldCards, playedCards,
//             discardsLeft, handsLeft, money, state, isFinalHand

(() => {
  const D = BalatroData;
  const J = D.jokers;

  // Helper: check if played cards contain a sub-hand pattern
  function hasPair(cards) { return countGroups(cards, 2); }
  function hasTwoPair(cards) { return countGroups(cards, 2) >= 2; }
  function hasTrips(cards) { return countGroups(cards, 3); }
  function hasQuads(cards) { return countGroups(cards, 4); }
  function hasStraight(cards) {
    if (cards.length < 5) return false;
    const o = [...new Set(cards.map(c => D.RANK_ORDER[c.rank]))].sort((a, b) => a - b);
    if (o.length < 5) return false;
    for (let i = 0; i <= o.length - 5; i++) { if (o[i+4] - o[i] === 4) return true; }
    return o.includes(14) && o.includes(2) && o.includes(3) && o.includes(4) && o.includes(5);
  }
  function hasFlush(cards) {
    if (cards.length < 5) return false;
    const sc = {};
    cards.forEach(c => {
      const suits = c.enhancement === 'wild' ? D.SUITS : [c.suit];
      suits.forEach(s => { sc[s] = (sc[s] || 0) + 1; });
    });
    return Object.values(sc).some(v => v >= 5);
  }
  function countGroups(cards, size) {
    const rc = {};
    cards.forEach(c => { rc[c.rank] = (rc[c.rank] || 0) + 1; });
    return Object.values(rc).filter(v => v >= size).length;
  }
  function isFace(card) { return D.FACE_RANKS.includes(card.rank); }
  function isEven(card) { return [2,4,6,8,10].includes(D.RANK_ORDER[card.rank]); }
  function isOdd(card) { const r = D.RANK_ORDER[card.rank]; return [3,5,7,9].includes(r) || r === 14; }

  // ================================================================
  // COMMON JOKERS (30)
  // ================================================================

  J.push(
    { id: 'joker', name: 'Joker', desc: '+4 Mult', cost: 2, rarity: 'common',
      onScore(ctx) { ctx.mult += 4; } },

    { id: 'greedy_joker', name: 'Greedy Joker', desc: '+3 Mult per \u2666 scored', cost: 5, rarity: 'common',
      onCardScore(ctx, card) { if (card.suit === 'diamonds' || card.enhancement === 'wild') ctx.mult += 3; } },

    { id: 'lusty_joker', name: 'Lusty Joker', desc: '+3 Mult per \u2665 scored', cost: 5, rarity: 'common',
      onCardScore(ctx, card) { if (card.suit === 'hearts' || card.enhancement === 'wild') ctx.mult += 3; } },

    { id: 'wrathful_joker', name: 'Wrathful Joker', desc: '+3 Mult per \u2660 scored', cost: 5, rarity: 'common',
      onCardScore(ctx, card) { if (card.suit === 'spades' || card.enhancement === 'wild') ctx.mult += 3; } },

    { id: 'gluttonous_joker', name: 'Gluttonous Joker', desc: '+3 Mult per \u2663 scored', cost: 5, rarity: 'common',
      onCardScore(ctx, card) { if (card.suit === 'clubs' || card.enhancement === 'wild') ctx.mult += 3; } },

    { id: 'jolly_joker', name: 'Jolly Joker', desc: '+8 Mult if hand has a Pair', cost: 3, rarity: 'common',
      onScore(ctx) { if (hasPair(ctx.playedCards)) ctx.mult += 8; } },

    { id: 'zany_joker', name: 'Zany Joker', desc: '+12 Mult if hand has Three of a Kind', cost: 4, rarity: 'common',
      onScore(ctx) { if (hasTrips(ctx.playedCards)) ctx.mult += 12; } },

    { id: 'mad_joker', name: 'Mad Joker', desc: '+10 Mult if hand has Two Pair', cost: 4, rarity: 'common',
      onScore(ctx) { if (hasTwoPair(ctx.playedCards)) ctx.mult += 10; } },

    { id: 'crazy_joker', name: 'Crazy Joker', desc: '+12 Mult if hand has a Straight', cost: 4, rarity: 'common',
      onScore(ctx) { if (hasStraight(ctx.playedCards)) ctx.mult += 12; } },

    { id: 'droll_joker', name: 'Droll Joker', desc: '+10 Mult if hand has a Flush', cost: 4, rarity: 'common',
      onScore(ctx) { if (hasFlush(ctx.playedCards)) ctx.mult += 10; } },

    { id: 'sly_joker', name: 'Sly Joker', desc: '+50 Chips if hand has a Pair', cost: 3, rarity: 'common',
      onScore(ctx) { if (hasPair(ctx.playedCards)) ctx.chips += 50; } },

    { id: 'wily_joker', name: 'Wily Joker', desc: '+100 Chips if hand has Three of a Kind', cost: 4, rarity: 'common',
      onScore(ctx) { if (hasTrips(ctx.playedCards)) ctx.chips += 100; } },

    { id: 'clever_joker', name: 'Clever Joker', desc: '+80 Chips if hand has Two Pair', cost: 4, rarity: 'common',
      onScore(ctx) { if (hasTwoPair(ctx.playedCards)) ctx.chips += 80; } },

    { id: 'devious_joker', name: 'Devious Joker', desc: '+100 Chips if hand has a Straight', cost: 4, rarity: 'common',
      onScore(ctx) { if (hasStraight(ctx.playedCards)) ctx.chips += 100; } },

    { id: 'crafty_joker', name: 'Crafty Joker', desc: '+80 Chips if hand has a Flush', cost: 4, rarity: 'common',
      onScore(ctx) { if (hasFlush(ctx.playedCards)) ctx.chips += 80; } },

    { id: 'half_joker', name: 'Half Joker', desc: '+20 Mult if 3 or fewer cards played', cost: 5, rarity: 'common',
      onScore(ctx) { if (ctx.playedCards.length <= 3) ctx.mult += 20; } },

    { id: 'joker_stencil', name: 'Joker Stencil', desc: '\u00d71 Mult per empty Joker slot', cost: 8, rarity: 'common',
      onScore(ctx) {
        const empty = ctx.state.maxJokers - ctx.state.jokers.length;
        if (empty > 0) ctx.mult *= empty;
      } },

    { id: 'four_fingers', name: 'Four Fingers', desc: 'Flushes and Straights can be 4 cards', cost: 7, rarity: 'common' },
    // Effect handled in hand evaluation, no scoring hook needed

    { id: 'mime', name: 'Mime', desc: 'Retrigger all held-in-hand effects', cost: 5, rarity: 'common',
      retriggerHeld: true },

    { id: 'credit_card', name: 'Credit Card', desc: 'Go up to -$20 in debt', cost: 1, rarity: 'common' },
    // Effect handled in money system

    { id: 'ceremonial_dagger', name: 'Ceremonial Dagger', desc: 'When Blind selected, destroy right Joker, add 2\u00d7 its sell value as Mult', cost: 6, rarity: 'common',
      initVars() { return { bonusMult: 0 }; },
      onScore(ctx, vars) { ctx.mult += vars.bonusMult; },
      onBlindSelect(state, vars) {
        const myIdx = state.jokers.findIndex(j => j.defId === 'ceremonial_dagger');
        const right = state.jokers[myIdx + 1];
        if (right) {
          vars.bonusMult += (right.sellValue || 1) * 2;
          state.jokers.splice(myIdx + 1, 1);
        }
      } },

    { id: 'banner', name: 'Banner', desc: '+30 Chips per discard remaining', cost: 5, rarity: 'common',
      onScore(ctx) { ctx.chips += 30 * ctx.discardsLeft; } },

    { id: 'mystic_summit', name: 'Mystic Summit', desc: '+15 Mult when 0 discards remaining', cost: 5, rarity: 'common',
      onScore(ctx) { if (ctx.discardsLeft === 0) ctx.mult += 15; } },

    { id: 'marble_joker', name: 'Marble Joker', desc: 'Adds a Stone card to deck when Blind selected', cost: 6, rarity: 'common',
      onBlindSelect(state) {
        const card = { id: 'stone_' + Date.now(), suit: D.SUITS[Math.floor(Math.random() * 4)],
          rank: D.RANKS[Math.floor(Math.random() * 13)], enhancement: 'stone', edition: 'base', seal: null, chipBonus: 0, debuffed: false };
        state.deck.push(card);
      } },

    { id: 'loyalty_card', name: 'Loyalty Card', desc: '\u00d74 Mult every 6 hands played', cost: 5, rarity: 'common',
      initVars() { return { counter: 0 }; },
      onScore(ctx, vars) { if (vars.counter === 0) ctx.mult *= 4; },
      onHandPlayed(state, vars) { vars.counter = (vars.counter + 1) % 6; } },

    { id: '8_ball', name: '8 Ball', desc: '1/4 chance for each played 8 to create a Tarot', cost: 5, rarity: 'common',
      onCardScore(ctx, card) {
        if (card.rank === '8' && Math.random() < 0.25 * (ctx.state.luckMult || 1)) {
          if (ctx.state.consumables.length < ctx.state.maxConsumables) {
            const t = D.tarots[Math.floor(Math.random() * D.tarots.length)];
            if (t) ctx.state.consumables.push({ type: 'tarot', id: t.id });
          }
        }
      } },

    { id: 'misprint', name: 'Misprint', desc: '+0 to +23 Mult', cost: 4, rarity: 'common',
      onScore(ctx) { ctx.mult += Math.floor(Math.random() * 24); } },

    { id: 'dusk', name: 'Dusk', desc: 'Retrigger all played cards on final hand', cost: 5, rarity: 'common',
      retrigger(card, ctx) { return ctx.isFinalHand ? 1 : 0; } },

    { id: 'raised_fist', name: 'Raised Fist', desc: 'Adds 2\u00d7 rank of lowest held card to Mult', cost: 5, rarity: 'common',
      onScore(ctx) {
        if (ctx.heldCards.length === 0) return;
        const lowest = ctx.heldCards.reduce((min, c) => D.RANK_ORDER[c.rank] < D.RANK_ORDER[min.rank] ? c : min);
        ctx.mult += D.RANK_ORDER[lowest.rank] * 2;
      } },

    { id: 'chaos_the_clown', name: 'Chaos the Clown', desc: '1 free Reroll per shop', cost: 4, rarity: 'common',
      onShopEnter(state) { state.freeRerolls = Math.max(state.freeRerolls, 1); } },
  );

  // ================================================================
  // UNCOMMON JOKERS (72)
  // ================================================================

  J.push(
    { id: 'fibonacci', name: 'Fibonacci', desc: '+8 Mult per A, 2, 3, 5, or 8 scored', cost: 8, rarity: 'uncommon',
      onCardScore(ctx, card) { if (['A','2','3','5','8'].includes(card.rank)) ctx.mult += 8; } },

    { id: 'steel_joker', name: 'Steel Joker', desc: '\u00d70.2 Mult per Steel Card in deck', cost: 7, rarity: 'uncommon',
      onScore(ctx) {
        const steelCount = ctx.state.deck.filter(c => c.enhancement === 'steel').length;
        if (steelCount > 0) ctx.mult *= (1 + 0.2 * steelCount);
      } },

    { id: 'scary_face', name: 'Scary Face', desc: '+30 Chips per face card scored', cost: 4, rarity: 'uncommon',
      onCardScore(ctx, card) { if (isFace(card)) ctx.chips += 30; } },

    { id: 'abstract_joker', name: 'Abstract Joker', desc: '+3 Mult per Joker owned', cost: 4, rarity: 'uncommon',
      onScore(ctx) { ctx.mult += 3 * ctx.state.jokers.length; } },

    { id: 'delayed_gratification', name: 'Delayed Gratification', desc: '$2 per discard if none used', cost: 4, rarity: 'uncommon',
      onRoundEnd(state) {
        if (state.discards === (D.GAME.MAX_DISCARDS + (state.bonusDiscards || 0))) {
          state.money += 2 * state.discards;
        }
      } },

    { id: 'hack', name: 'Hack', desc: 'Retrigger each played 2, 3, 4, or 5', cost: 6, rarity: 'uncommon',
      retrigger(card) { return ['2','3','4','5'].includes(card.rank) ? 1 : 0; } },

    { id: 'pareidolia', name: 'Pareidolia', desc: 'All cards are face cards', cost: 5, rarity: 'uncommon' },
    // Effect handled in card evaluation helpers

    { id: 'gros_michel', name: 'Gros Michel', desc: '+15 Mult. 1/6 chance to be destroyed at end of round', cost: 5, rarity: 'uncommon',
      onScore(ctx) { ctx.mult += 15; },
      onRoundEnd(state, vars) {
        if (Math.random() < 1/6) {
          const idx = state.jokers.findIndex(j => j.defId === 'gros_michel');
          if (idx >= 0) {
            state.jokers.splice(idx, 1);
            // Could spawn Cavendish here in full impl
          }
        }
      } },

    { id: 'even_steven', name: 'Even Steven', desc: '+4 Mult per even card scored (10,8,6,4,2)', cost: 4, rarity: 'uncommon',
      onCardScore(ctx, card) { if (isEven(card)) ctx.mult += 4; } },

    { id: 'odd_todd', name: 'Odd Todd', desc: '+31 Chips per odd card scored (A,9,7,5,3)', cost: 4, rarity: 'uncommon',
      onCardScore(ctx, card) { if (isOdd(card)) ctx.chips += 31; } },

    { id: 'scholar', name: 'Scholar', desc: '+20 Chips and +4 Mult per Ace scored', cost: 4, rarity: 'uncommon',
      onCardScore(ctx, card) { if (card.rank === 'A') { ctx.chips += 20; ctx.mult += 4; } } },

    { id: 'business_card', name: 'Business Card', desc: 'Face cards have 1/2 chance to give $2 when scored', cost: 4, rarity: 'uncommon',
      onCardScore(ctx, card) { if (isFace(card) && Math.random() < 0.5) ctx.money += 2; } },

    { id: 'supernova', name: 'Supernova', desc: '+Mult equal to times hand type played this run', cost: 5, rarity: 'uncommon',
      onScore(ctx) { ctx.mult += (ctx.state.handsPlayedRun[ctx.handType] || 0); } },

    { id: 'ride_the_bus', name: 'Ride the Bus', desc: '+1 Mult per consecutive hand without a face card scoring', cost: 6, rarity: 'uncommon',
      initVars() { return { streak: 0 }; },
      onScore(ctx, vars) { ctx.mult += vars.streak; },
      onHandPlayed(state, vars, handType, scoringCards) {
        if (scoringCards && scoringCards.some(c => isFace(c))) { vars.streak = 0; }
        else { vars.streak++; }
      } },

    { id: 'space_joker', name: 'Space Joker', desc: '1/4 chance to upgrade played hand level', cost: 5, rarity: 'uncommon',
      onHandPlayed(state, vars, handType) {
        if (Math.random() < 0.25) {
          if (!state.handLevels[handType]) state.handLevels[handType] = { level: 1 };
          state.handLevels[handType].level++;
        }
      } },

    { id: 'egg', name: 'Egg', desc: 'Gains $3 sell value at end of round', cost: 4, rarity: 'uncommon',
      initVars() { return { extraSellValue: 0 }; },
      onRoundEnd(state, vars) { vars.extraSellValue += 3; } },

    { id: 'burglar', name: 'Burglar', desc: 'When Blind selected, +3 Hands, lose all discards', cost: 6, rarity: 'uncommon',
      onBlindSelect(state) { state.hands += 3; state.discards = 0; } },

    { id: 'blackboard', name: 'Blackboard', desc: '\u00d73 Mult if all held cards are \u2660 or \u2663', cost: 6, rarity: 'uncommon',
      onScore(ctx) {
        if (ctx.heldCards.length > 0 && ctx.heldCards.every(c => c.suit === 'spades' || c.suit === 'clubs' || c.enhancement === 'wild')) {
          ctx.mult *= 3;
        }
      } },

    { id: 'runner', name: 'Runner', desc: 'Gains +15 Chips if hand has a Straight', cost: 5, rarity: 'uncommon',
      initVars() { return { extraChips: 0 }; },
      onScore(ctx, vars) {
        ctx.chips += vars.extraChips;
        if (hasStraight(ctx.playedCards)) vars.extraChips += 15;
      } },

    { id: 'ice_cream', name: 'Ice Cream', desc: '+100 Chips. -5 Chips per hand played', cost: 5, rarity: 'uncommon',
      initVars() { return { chips: 100 }; },
      onScore(ctx, vars) { ctx.chips += vars.chips; },
      onHandPlayed(state, vars) {
        vars.chips -= 5;
        if (vars.chips <= 0) {
          const idx = state.jokers.findIndex(j => j.defId === 'ice_cream');
          if (idx >= 0) state.jokers.splice(idx, 1);
        }
      } },

    { id: 'dna', name: 'DNA', desc: 'First hand of round: if 1 card, copy it to deck and draw', cost: 8, rarity: 'uncommon' },
    // Complex effect - handled in engine

    { id: 'splash', name: 'Splash', desc: 'Every played card counts in scoring', cost: 3, rarity: 'uncommon' },
    // Effect handled in scoring pipeline

    { id: 'blue_joker', name: 'Blue Joker', desc: '+2 Chips per remaining card in deck', cost: 5, rarity: 'uncommon',
      onScore(ctx) { ctx.chips += 2 * ctx.state.drawPile.length; } },

    { id: 'sixth_sense', name: 'Sixth Sense', desc: 'First hand: if single 6, destroy it and create Spectral', cost: 6, rarity: 'uncommon' },
    // Complex effect - handled in engine

    { id: 'constellation', name: 'Constellation', desc: 'Gains \u00d70.1 Mult per Planet used', cost: 6, rarity: 'uncommon',
      initVars() { return { xMult: 1 }; },
      onScore(ctx, vars) { if (vars.xMult > 1) ctx.mult *= vars.xMult; } },
    // vars.xMult updated by engine when planet used

    { id: 'hiker', name: 'Hiker', desc: 'Every played card permanently gains +5 Chips', cost: 5, rarity: 'uncommon',
      onCardScore(ctx, card) { card.chipBonus = (card.chipBonus || 0) + 5; } },

    { id: 'faceless_joker', name: 'Faceless Joker', desc: '$5 if 3+ face cards discarded at once', cost: 4, rarity: 'uncommon',
      onDiscard(state, cards) {
        if (cards.filter(c => isFace(c)).length >= 3) state.money += 5;
      } },

    { id: 'green_joker', name: 'Green Joker', desc: '+1 Mult per hand played, -1 per discard', cost: 4, rarity: 'uncommon',
      initVars() { return { mult: 0 }; },
      onScore(ctx, vars) { ctx.mult += vars.mult; },
      onHandPlayed(state, vars) { vars.mult++; },
      onDiscard(state, cards, vars) { vars.mult = Math.max(0, vars.mult - 1); } },

    { id: 'superposition', name: 'Superposition', desc: 'Create Tarot if hand has Ace and Straight', cost: 4, rarity: 'uncommon',
      onHandPlayed(state, vars, handType, scoringCards) {
        if (hasStraight(scoringCards || []) && (scoringCards || []).some(c => c.rank === 'A')) {
          if (state.consumables.length < state.maxConsumables) {
            const t = D.tarots[Math.floor(Math.random() * D.tarots.length)];
            if (t) state.consumables.push({ type: 'tarot', id: t.id });
          }
        }
      } },

    { id: 'to_do_list', name: 'To Do List', desc: '$4 if poker hand matches target (changes each round)', cost: 4, rarity: 'uncommon',
      initVars() { return { target: 'Pair' }; },
      onHandPlayed(state, vars, handType) { if (handType === vars.target) state.money += 4; },
      onRoundEnd(state, vars) {
        const hands = D.HAND_TYPES.filter(h => !h.secret).map(h => h.name);
        vars.target = hands[Math.floor(Math.random() * hands.length)];
      } },

    { id: 'cavendish', name: 'Cavendish', desc: '\u00d73 Mult. 1/1000 chance to destroy', cost: 4, rarity: 'uncommon',
      onScore(ctx) { ctx.mult *= 3; },
      onRoundEnd(state) {
        if (Math.random() < 0.001) {
          const idx = state.jokers.findIndex(j => j.defId === 'cavendish');
          if (idx >= 0) state.jokers.splice(idx, 1);
        }
      } },

    { id: 'card_sharp', name: 'Card Sharp', desc: '\u00d73 Mult if hand type already played this round', cost: 6, rarity: 'uncommon',
      onScore(ctx) {
        if ((ctx.state._handTypesThisRound || []).includes(ctx.handType)) ctx.mult *= 3;
      } },

    { id: 'red_card', name: 'Red Card', desc: 'Gains +3 Mult when any Booster Pack is skipped', cost: 5, rarity: 'uncommon',
      initVars() { return { mult: 0 }; },
      onScore(ctx, vars) { ctx.mult += vars.mult; },
      onPackSkip(state, vars) { vars.mult += 3; } },

    { id: 'madness', name: 'Madness', desc: 'When Small/Big Blind selected, \u00d70.5 Mult, destroy random Joker', cost: 7, rarity: 'uncommon',
      initVars() { return { xMult: 1 }; },
      onScore(ctx, vars) { if (vars.xMult > 1) ctx.mult *= vars.xMult; },
      onBlindSelect(state, vars) {
        if (state.blind < 2) {
          vars.xMult += 0.5;
          const others = state.jokers.filter(j => j.defId !== 'madness');
          if (others.length > 0) {
            const victim = others[Math.floor(Math.random() * others.length)];
            const idx = state.jokers.indexOf(victim);
            if (idx >= 0) state.jokers.splice(idx, 1);
          }
        }
      } },

    { id: 'square_joker', name: 'Square Joker', desc: 'Gains +4 Chips if hand has exactly 4 cards', cost: 4, rarity: 'uncommon',
      initVars() { return { chips: 0 }; },
      onScore(ctx, vars) {
        ctx.chips += vars.chips;
        if (ctx.playedCards.length === 4) vars.chips += 4;
      } },

    { id: 'seance', name: 'S\u00e9ance', desc: 'Create Spectral if hand is Straight Flush', cost: 6, rarity: 'uncommon',
      onHandPlayed(state, vars, handType) {
        if ((handType === 'Straight Flush' || handType === 'Royal Flush') && state.consumables.length < state.maxConsumables) {
          const s = D.spectrals[Math.floor(Math.random() * D.spectrals.length)];
          if (s) state.consumables.push({ type: 'spectral', id: s.id });
        }
      } },

    { id: 'riff_raff', name: 'Riff-Raff', desc: 'When Blind selected, create 2 Common Jokers', cost: 6, rarity: 'uncommon',
      onBlindSelect(state) {
        const commons = D.jokers.filter(j => j.rarity === 'common' && !state.jokers.some(o => o.defId === j.id));
        for (let i = 0; i < 2 && commons.length > 0 && state.jokers.length < state.maxJokers; i++) {
          const pick = commons.splice(Math.floor(Math.random() * commons.length), 1)[0];
          state.jokers.push({ defId: pick.id, edition: 'base', sellValue: Math.ceil(pick.cost / 2), vars: pick.initVars ? pick.initVars() : {} });
        }
      } },

    { id: 'vampire', name: 'Vampire', desc: 'Gains \u00d70.1 Mult per Enhanced card scored, removes Enhancement', cost: 7, rarity: 'uncommon',
      initVars() { return { xMult: 1 }; },
      onScore(ctx, vars) { if (vars.xMult > 1) ctx.mult *= vars.xMult; },
      onCardScore(ctx, card, vars) {
        if (card.enhancement && card.enhancement !== 'none') {
          vars.xMult += 0.1;
          card.enhancement = null;
        }
      } },

    { id: 'shortcut', name: 'Shortcut', desc: 'Straights can have gaps of 1 rank', cost: 4, rarity: 'uncommon' },
    // Effect handled in hand evaluation

    { id: 'hologram', name: 'Hologram', desc: 'Gains \u00d70.25 Mult per card added to deck', cost: 7, rarity: 'uncommon',
      initVars() { return { xMult: 1 }; },
      onScore(ctx, vars) { if (vars.xMult > 1) ctx.mult *= vars.xMult; } },

    { id: 'vagabond', name: 'Vagabond', desc: 'Create Tarot if hand played with $4 or less', cost: 7, rarity: 'uncommon',
      onHandPlayed(state) {
        if (state.money <= 4 && state.consumables.length < state.maxConsumables) {
          const t = D.tarots[Math.floor(Math.random() * D.tarots.length)];
          if (t) state.consumables.push({ type: 'tarot', id: t.id });
        }
      } },

    { id: 'baron', name: 'Baron', desc: 'Each King held gives \u00d71.5 Mult', cost: 8, rarity: 'uncommon',
      onHeldCard(ctx, card) { if (card.rank === 'K') ctx.mult *= 1.5; } },

    { id: 'cloud_9', name: 'Cloud 9', desc: '$1 per 9 in full deck at end of round', cost: 7, rarity: 'uncommon',
      onRoundEnd(state) { state.money += state.deck.filter(c => c.rank === '9').length; } },

    { id: 'rocket', name: 'Rocket', desc: '$1 at end of round, +$2 when Boss defeated', cost: 6, rarity: 'uncommon',
      initVars() { return { payout: 1 }; },
      onRoundEnd(state, vars) {
        state.money += vars.payout;
        if (state.blind === 2) vars.payout += 2;
      } },

    { id: 'obelisk', name: 'Obelisk', desc: '\u00d70.2 Mult per consecutive hand without most-played type', cost: 5, rarity: 'uncommon',
      initVars() { return { xMult: 1 }; },
      onScore(ctx, vars) { if (vars.xMult > 1) ctx.mult *= vars.xMult; },
      onHandPlayed(state, vars, handType) {
        const counts = state.handsPlayedRun;
        const maxType = Object.keys(counts).reduce((a, b) => (counts[a] || 0) >= (counts[b] || 0) ? a : b, 'High Card');
        if (handType === maxType) { vars.xMult = 1; }
        else { vars.xMult += 0.2; }
      } },

    { id: 'midas_mask', name: 'Midas Mask', desc: 'Played face cards become Gold cards', cost: 4, rarity: 'uncommon',
      onCardScore(ctx, card) { if (isFace(card)) card.enhancement = 'gold'; } },

    { id: 'luchador', name: 'Luchador', desc: 'Sell to disable current Boss Blind effect', cost: 5, rarity: 'uncommon',
      onSell(state) { state.bossEffect = null; } },

    { id: 'photograph', name: 'Photograph', desc: 'First face card scored gives \u00d72 Mult', cost: 5, rarity: 'uncommon',
      initVars() { return { triggered: false }; },
      onCardScore(ctx, card, vars) {
        if (!vars.triggered && isFace(card)) { ctx.mult *= 2; vars.triggered = true; }
      },
      onHandPlayed(state, vars) { vars.triggered = false; } },

    { id: 'gift_card', name: 'Gift Card', desc: '+$1 sell value to every Joker and Consumable at end of round', cost: 6, rarity: 'uncommon',
      onRoundEnd(state) {
        state.jokers.forEach(j => { j.sellValue = (j.sellValue || 0) + 1; });
      } },

    { id: 'turtle_bean', name: 'Turtle Bean', desc: '+5 hand size, -1 each round', cost: 6, rarity: 'uncommon',
      initVars() { return { bonus: 5 }; },
      onBlindSelect(state, vars) { state._tempHandSizeMod = (state._tempHandSizeMod || 0) + vars.bonus; },
      onRoundEnd(state, vars) {
        vars.bonus--;
        if (vars.bonus <= 0) {
          const idx = state.jokers.findIndex(j => j.defId === 'turtle_bean');
          if (idx >= 0) state.jokers.splice(idx, 1);
        }
      } },

    { id: 'erosion', name: 'Erosion', desc: '+4 Mult per card below 52 in deck', cost: 6, rarity: 'uncommon',
      onScore(ctx) { const diff = 52 - ctx.state.deck.length; if (diff > 0) ctx.mult += 4 * diff; } },

    { id: 'reserved_parking', name: 'Reserved Parking', desc: 'Face cards held in hand: 1/2 chance for $1', cost: 6, rarity: 'uncommon',
      onHeldCard(ctx, card) { if (isFace(card) && Math.random() < 0.5) ctx.money += 1; } },

    { id: 'mail_in_rebate', name: 'Mail-In Rebate', desc: '$5 per discarded card of target rank (changes each round)', cost: 4, rarity: 'uncommon',
      initVars() { return { targetRank: D.RANKS[Math.floor(Math.random() * 13)] }; },
      onDiscard(state, cards, vars) {
        state.money += 5 * cards.filter(c => c.rank === vars.targetRank).length;
      },
      onRoundEnd(state, vars) { vars.targetRank = D.RANKS[Math.floor(Math.random() * 13)]; } },

    { id: 'to_the_moon', name: 'To the Moon', desc: '+$1 interest per $5 at end of round', cost: 5, rarity: 'uncommon',
      onRoundEnd(state) { state.money += Math.floor(state.money / 5); } },

    { id: 'hallucination', name: 'Hallucination', desc: '1/2 chance to create Tarot when Booster opened', cost: 4, rarity: 'uncommon',
      onPackOpen(state) {
        if (Math.random() < 0.5 && state.consumables.length < state.maxConsumables) {
          const t = D.tarots[Math.floor(Math.random() * D.tarots.length)];
          if (t) state.consumables.push({ type: 'tarot', id: t.id });
        }
      } },

    { id: 'fortune_teller', name: 'Fortune Teller', desc: '+1 Mult per Tarot used this run', cost: 6, rarity: 'uncommon',
      onScore(ctx) { ctx.mult += (ctx.state.tarotsUsed || 0); } },

    { id: 'juggler', name: 'Juggler', desc: '+1 hand size', cost: 4, rarity: 'uncommon' },
    // Effect applied when bought: state.permHandSizeBonus++

    { id: 'drunkard', name: 'Drunkard', desc: '+1 discard each round', cost: 4, rarity: 'uncommon' },
    // Effect applied at round start: state.discards++

    { id: 'stone_joker', name: 'Stone Joker', desc: '+25 Chips per Stone Card in deck', cost: 6, rarity: 'uncommon',
      onScore(ctx) { ctx.chips += 25 * ctx.state.deck.filter(c => c.enhancement === 'stone').length; } },

    { id: 'bull', name: 'Bull', desc: '+2 Chips per $1 you have', cost: 6, rarity: 'uncommon',
      onScore(ctx) { ctx.chips += 2 * Math.max(0, ctx.state.money); } },

    { id: 'diet_cola', name: 'Diet Cola', desc: 'Sell to create a free Double Tag', cost: 6, rarity: 'uncommon',
      onSell(state) { state.tags.push({ id: 'double_tag' }); } },

    { id: 'trading_card', name: 'Trading Card', desc: 'First discard of round: if 1 card, destroy it and earn $3', cost: 6, rarity: 'uncommon',
      initVars() { return { usedThisRound: false }; },
      onDiscard(state, cards, vars) {
        if (!vars.usedThisRound && cards.length === 1) {
          vars.usedThisRound = true;
          state.money += 3;
          // Card already removed from hand by discard logic; also remove from deck
          const idx = state.deck.findIndex(c => c.id === cards[0].id);
          if (idx >= 0) state.deck.splice(idx, 1);
        }
      },
      onBlindSelect(state, vars) { vars.usedThisRound = false; } },

    { id: 'flash_card', name: 'Flash Card', desc: 'Gains +2 Mult per shop reroll', cost: 5, rarity: 'uncommon',
      initVars() { return { mult: 0 }; },
      onScore(ctx, vars) { ctx.mult += vars.mult; },
      onReroll(state, vars) { vars.mult += 2; } },

    { id: 'popcorn', name: 'Popcorn', desc: '+20 Mult, -4 Mult per round', cost: 5, rarity: 'uncommon',
      initVars() { return { mult: 20 }; },
      onScore(ctx, vars) { ctx.mult += vars.mult; },
      onRoundEnd(state, vars) {
        vars.mult -= 4;
        if (vars.mult <= 0) {
          const idx = state.jokers.findIndex(j => j.defId === 'popcorn');
          if (idx >= 0) state.jokers.splice(idx, 1);
        }
      } },

    { id: 'spare_trousers', name: 'Spare Trousers', desc: 'Gains +2 Mult if hand has Two Pair', cost: 6, rarity: 'uncommon',
      initVars() { return { mult: 0 }; },
      onScore(ctx, vars) {
        ctx.mult += vars.mult;
        if (hasTwoPair(ctx.playedCards)) vars.mult += 2;
      } },

    { id: 'ramen', name: 'Ramen', desc: '\u00d72 Mult, loses \u00d70.01 per card discarded', cost: 5, rarity: 'uncommon',
      initVars() { return { xMult: 2 }; },
      onScore(ctx, vars) { ctx.mult *= vars.xMult; },
      onDiscard(state, cards, vars) {
        vars.xMult -= 0.01 * cards.length;
        if (vars.xMult <= 1) {
          const idx = state.jokers.findIndex(j => j.defId === 'ramen');
          if (idx >= 0) state.jokers.splice(idx, 1);
        }
      } },

    { id: 'seltzer', name: 'Seltzer', desc: 'Retrigger all played cards for next 10 hands', cost: 6, rarity: 'uncommon',
      initVars() { return { handsLeft: 10 }; },
      retrigger(card, ctx, vars) { return vars.handsLeft > 0 ? 1 : 0; },
      onHandPlayed(state, vars) {
        vars.handsLeft--;
        if (vars.handsLeft <= 0) {
          const idx = state.jokers.findIndex(j => j.defId === 'seltzer');
          if (idx >= 0) state.jokers.splice(idx, 1);
        }
      } },

    { id: 'castle', name: 'Castle', desc: '+3 Chips per discarded card of target suit (changes each round)', cost: 6, rarity: 'uncommon',
      initVars() { return { chips: 0, targetSuit: D.SUITS[Math.floor(Math.random() * 4)] }; },
      onScore(ctx, vars) { ctx.chips += vars.chips; },
      onDiscard(state, cards, vars) {
        vars.chips += 3 * cards.filter(c => c.suit === vars.targetSuit).length;
      },
      onRoundEnd(state, vars) { vars.targetSuit = D.SUITS[Math.floor(Math.random() * 4)]; } },

    { id: 'mr_bones', name: 'Mr. Bones', desc: 'Prevents death if score >= 25% of target. Self destructs', cost: 5, rarity: 'uncommon' },
    // Effect handled in engine endBlind logic

    { id: 'golden_joker', name: 'Golden Joker', desc: '$4 at end of round', cost: 6, rarity: 'uncommon',
      onRoundEnd(state) { state.money += 4; } },

    { id: 'lucky_cat', name: 'Lucky Cat', desc: 'Gains \u00d70.25 Mult each Lucky card trigger', cost: 6, rarity: 'uncommon',
      initVars() { return { xMult: 1 }; },
      onScore(ctx, vars) { if (vars.xMult > 1) ctx.mult *= vars.xMult; } },
    // xMult updated when Lucky card triggers in engine

    { id: 'walkie_talkie', name: 'Walkie Talkie', desc: '+10 Chips and +4 Mult per 10 or 4 scored', cost: 4, rarity: 'uncommon',
      onCardScore(ctx, card) { if (card.rank === '10' || card.rank === '4') { ctx.chips += 10; ctx.mult += 4; } } },
  );

  // ================================================================
  // RARE JOKERS (43)
  // ================================================================

  J.push(
    { id: 'acrobat', name: 'Acrobat', desc: '\u00d73 Mult on final hand of round', cost: 6, rarity: 'rare',
      onScore(ctx) { if (ctx.isFinalHand) ctx.mult *= 3; } },

    { id: 'sock_and_buskin', name: 'Sock and Buskin', desc: 'Retrigger all played face cards', cost: 6, rarity: 'rare',
      retrigger(card) { return isFace(card) ? 1 : 0; } },

    { id: 'swashbuckler', name: 'Swashbuckler', desc: 'Adds sell value of all other Jokers to Mult', cost: 4, rarity: 'rare',
      onScore(ctx) {
        const total = ctx.state.jokers.filter(j => j.defId !== 'swashbuckler')
          .reduce((s, j) => s + (j.sellValue || 0), 0);
        ctx.mult += total;
      } },

    { id: 'troubadour', name: 'Troubadour', desc: '+2 hand size, -1 hand per round', cost: 6, rarity: 'rare' },
    // Effect applied at round start

    { id: 'certificate', name: 'Certificate', desc: 'Add random card with random Seal to hand at round start', cost: 6, rarity: 'rare' },
    // Effect handled in engine

    { id: 'smeared_joker', name: 'Smeared Joker', desc: '\u2665\u2666 count as same suit. \u2660\u2663 count as same suit', cost: 7, rarity: 'rare' },
    // Effect handled in hand evaluation

    { id: 'throwback', name: 'Throwback', desc: '\u00d70.25 Mult per Blind skipped this run', cost: 6, rarity: 'rare',
      onScore(ctx) {
        const bonus = 0.25 * ctx.state.blindsSkipped;
        if (bonus > 0) ctx.mult *= (1 + bonus);
      } },

    { id: 'hanging_chad', name: 'Hanging Chad', desc: 'Retrigger first scored card 2 times', cost: 4, rarity: 'rare',
      retrigger(card, ctx) {
        return (ctx.scoringCards && ctx.scoringCards[0] === card) ? 2 : 0;
      } },

    { id: 'rough_gem', name: 'Rough Gem', desc: '\u2666 cards earn $1 when scored', cost: 7, rarity: 'rare',
      onCardScore(ctx, card) { if (card.suit === 'diamonds') ctx.money += 1; } },

    { id: 'bloodstone', name: 'Bloodstone', desc: '1/3 chance for \u2665 cards to give \u00d71.5 Mult', cost: 7, rarity: 'rare',
      onCardScore(ctx, card) {
        if (card.suit === 'hearts' && Math.random() < (1/3) * (ctx.state.luckMult || 1)) ctx.mult *= 1.5;
      } },

    { id: 'arrowhead', name: 'Arrowhead', desc: '\u2660 cards give +50 Chips when scored', cost: 7, rarity: 'rare',
      onCardScore(ctx, card) { if (card.suit === 'spades') ctx.chips += 50; } },

    { id: 'onyx_agate', name: 'Onyx Agate', desc: '\u2663 cards give +7 Mult when scored', cost: 7, rarity: 'rare',
      onCardScore(ctx, card) { if (card.suit === 'clubs') ctx.mult += 7; } },

    { id: 'glass_joker', name: 'Glass Joker', desc: 'Gains \u00d70.75 Mult per Glass Card destroyed', cost: 6, rarity: 'rare',
      initVars() { return { xMult: 1 }; },
      onScore(ctx, vars) { if (vars.xMult > 1) ctx.mult *= vars.xMult; } },
    // xMult updated when glass card destroyed in engine

    { id: 'showman', name: 'Showman', desc: 'Joker, Tarot, Planet, Spectral may appear multiple times', cost: 5, rarity: 'rare' },
    // Effect handled in shop generation

    { id: 'flower_pot', name: 'Flower Pot', desc: '\u00d73 Mult if hand has all 4 suits', cost: 6, rarity: 'rare',
      onScore(ctx) {
        const suits = new Set();
        ctx.playedCards.forEach(c => {
          if (c.enhancement === 'wild') D.SUITS.forEach(s => suits.add(s));
          else suits.add(c.suit);
        });
        if (suits.size >= 4) ctx.mult *= 3;
      } },

    { id: 'blueprint', name: 'Blueprint', desc: 'Copies ability of Joker to the right', cost: 10, rarity: 'rare',
      isCopy: 'right' },

    { id: 'wee_joker', name: 'Wee Joker', desc: 'Gains +8 Chips per 2 scored', cost: 8, rarity: 'rare',
      initVars() { return { chips: 0 }; },
      onScore(ctx, vars) { ctx.chips += vars.chips; },
      onCardScore(ctx, card, vars) { if (card.rank === '2') vars.chips += 8; } },

    { id: 'merry_andy', name: 'Merry Andy', desc: '+3 discards, -1 hand size', cost: 7, rarity: 'rare' },
    // Effect applied at round start

    { id: 'oops_all_6s', name: 'Oops! All 6s', desc: 'Doubles all probabilities', cost: 4, rarity: 'rare' },
    // Effect: state.luckMult = 2

    { id: 'the_idol', name: 'The Idol', desc: '\u00d72 Mult for target card (changes each round)', cost: 6, rarity: 'rare',
      initVars() { return { targetRank: D.RANKS[Math.floor(Math.random() * 13)], targetSuit: D.SUITS[Math.floor(Math.random() * 4)] }; },
      onCardScore(ctx, card, vars) {
        if (card.rank === vars.targetRank && card.suit === vars.targetSuit) ctx.mult *= 2;
      },
      onRoundEnd(state, vars) {
        vars.targetRank = D.RANKS[Math.floor(Math.random() * 13)];
        vars.targetSuit = D.SUITS[Math.floor(Math.random() * 4)];
      } },

    { id: 'seeing_double', name: 'Seeing Double', desc: '\u00d72 Mult if hand has a scoring \u2663 and another suit', cost: 6, rarity: 'rare',
      onScore(ctx) {
        const hasClub = ctx.scoringCards.some(c => c.suit === 'clubs');
        const hasOther = ctx.scoringCards.some(c => c.suit !== 'clubs');
        if (hasClub && hasOther) ctx.mult *= 2;
      } },

    { id: 'matador', name: 'Matador', desc: '$8 if hand triggers Boss Blind ability', cost: 7, rarity: 'rare' },
    // Effect handled in engine boss blind logic

    { id: 'hit_the_road', name: 'Hit the Road', desc: 'Gains \u00d70.5 Mult per Jack discarded this round', cost: 8, rarity: 'rare',
      initVars() { return { xMult: 1 }; },
      onScore(ctx, vars) { if (vars.xMult > 1) ctx.mult *= vars.xMult; },
      onDiscard(state, cards, vars) {
        vars.xMult += 0.5 * cards.filter(c => c.rank === 'J').length;
      },
      onBlindSelect(state, vars) { vars.xMult = 1; } },

    { id: 'the_duo', name: 'The Duo', desc: '\u00d72 Mult if hand has a Pair', cost: 8, rarity: 'rare',
      onScore(ctx) { if (hasPair(ctx.playedCards)) ctx.mult *= 2; } },

    { id: 'the_trio', name: 'The Trio', desc: '\u00d73 Mult if hand has Three of a Kind', cost: 8, rarity: 'rare',
      onScore(ctx) { if (hasTrips(ctx.playedCards)) ctx.mult *= 3; } },

    { id: 'the_family', name: 'The Family', desc: '\u00d74 Mult if hand has Four of a Kind', cost: 8, rarity: 'rare',
      onScore(ctx) { if (hasQuads(ctx.playedCards)) ctx.mult *= 4; } },

    { id: 'the_order', name: 'The Order', desc: '\u00d73 Mult if hand has a Straight', cost: 8, rarity: 'rare',
      onScore(ctx) { if (hasStraight(ctx.playedCards)) ctx.mult *= 3; } },

    { id: 'the_tribe', name: 'The Tribe', desc: '\u00d72 Mult if hand has a Flush', cost: 8, rarity: 'rare',
      onScore(ctx) { if (hasFlush(ctx.playedCards)) ctx.mult *= 2; } },

    { id: 'stuntman', name: 'Stuntman', desc: '+250 Chips, -2 hand size', cost: 7, rarity: 'rare',
      onScore(ctx) { ctx.chips += 250; } },
    // Hand size penalty applied when bought

    { id: 'invisible_joker', name: 'Invisible Joker', desc: 'After 2 rounds, sell to duplicate a random Joker', cost: 8, rarity: 'rare',
      initVars() { return { rounds: 0 }; },
      onRoundEnd(state, vars) { vars.rounds++; },
      onSell(state, vars) {
        if (vars.rounds >= 2 && state.jokers.length > 0 && state.jokers.length < state.maxJokers) {
          const pick = state.jokers[Math.floor(Math.random() * state.jokers.length)];
          const def = D.findJoker(pick.defId);
          state.jokers.push({ defId: pick.defId, edition: 'base', sellValue: Math.ceil((def ? def.cost : 4) / 2), vars: def && def.initVars ? def.initVars() : {} });
        }
      } },

    { id: 'brainstorm', name: 'Brainstorm', desc: 'Copies ability of leftmost Joker', cost: 10, rarity: 'rare',
      isCopy: 'left' },

    { id: 'satellite', name: 'Satellite', desc: '$1 per unique Planet used this run at end of round', cost: 6, rarity: 'rare',
      onRoundEnd(state) { state.money += (state.planetsUsed ? state.planetsUsed.length : 0); } },

    { id: 'shoot_the_moon', name: 'Shoot the Moon', desc: 'Each Queen held gives +13 Mult', cost: 5, rarity: 'rare',
      onHeldCard(ctx, card) { if (card.rank === 'Q') ctx.mult += 13; } },

    { id: 'drivers_license', name: "Driver's License", desc: '\u00d73 Mult if 16+ Enhanced cards in deck', cost: 7, rarity: 'rare',
      onScore(ctx) {
        if (ctx.state.deck.filter(c => c.enhancement && c.enhancement !== 'none').length >= 16) ctx.mult *= 3;
      } },

    { id: 'cartomancer', name: 'Cartomancer', desc: 'Create Tarot when Blind selected', cost: 6, rarity: 'rare',
      onBlindSelect(state) {
        if (state.consumables.length < state.maxConsumables) {
          const t = D.tarots[Math.floor(Math.random() * D.tarots.length)];
          if (t) state.consumables.push({ type: 'tarot', id: t.id });
        }
      } },

    { id: 'astronomer', name: 'Astronomer', desc: 'All Planet cards and Celestial Packs are free', cost: 8, rarity: 'rare' },
    // Effect handled in shop pricing

    { id: 'burnt_joker', name: 'Burnt Joker', desc: 'Upgrade level of first discarded hand type each round', cost: 8, rarity: 'rare',
      initVars() { return { usedThisRound: false }; },
      onDiscard(state, cards, vars) {
        if (!vars.usedThisRound && cards.length > 0) {
          vars.usedThisRound = true;
          // Evaluate hand type of discarded cards and level it up
          // This is handled by engine since it needs evaluateHand
        }
      },
      onBlindSelect(state, vars) { vars.usedThisRound = false; } },

    { id: 'bootstraps', name: 'Bootstraps', desc: '+2 Mult per $5 you have', cost: 7, rarity: 'rare',
      onScore(ctx) { ctx.mult += 2 * Math.floor(Math.max(0, ctx.state.money) / 5); } },

    { id: 'ancient_joker', name: 'Ancient Joker', desc: 'Target suit cards give \u00d71.5 Mult (changes each round)', cost: 8, rarity: 'rare',
      initVars() { return { targetSuit: D.SUITS[Math.floor(Math.random() * 4)] }; },
      onCardScore(ctx, card, vars) {
        if (card.suit === vars.targetSuit || card.enhancement === 'wild') ctx.mult *= 1.5;
      },
      onRoundEnd(state, vars) { vars.targetSuit = D.SUITS[Math.floor(Math.random() * 4)]; } },

    { id: 'campfire', name: 'Campfire', desc: 'Gains \u00d70.25 Mult per card sold. Resets on Boss win', cost: 8, rarity: 'rare',
      initVars() { return { xMult: 1 }; },
      onScore(ctx, vars) { if (vars.xMult > 1) ctx.mult *= vars.xMult; },
      onRoundEnd(state, vars) { if (state.blind === 2) vars.xMult = 1; } },
    // xMult += 0.25 on any sell, handled in engine

    { id: 'baseball_card', name: 'Baseball Card', desc: 'Uncommon Jokers each give \u00d71.5 Mult', cost: 8, rarity: 'rare',
      onScore(ctx) {
        const uncommonCount = ctx.state.jokers.filter(j => {
          const def = D.findJoker(j.defId);
          return def && def.rarity === 'uncommon';
        }).length;
        for (let i = 0; i < uncommonCount; i++) ctx.mult *= 1.5;
      } },

    { id: 'golden_ticket', name: 'Golden Ticket', desc: 'Gold cards earn $4 when scored', cost: 7, rarity: 'rare',
      onCardScore(ctx, card) { if (card.enhancement === 'gold') ctx.money += 4; } },

    { id: 'lucky_clover', name: 'Lucky Clover', desc: '+3 Mult per Lucky card scored', cost: 4, rarity: 'rare',
      onCardScore(ctx, card) { if (card.enhancement === 'lucky') ctx.mult += 3; } },
  );

  // ================================================================
  // LEGENDARY JOKERS (5)
  // ================================================================

  J.push(
    { id: 'canio', name: 'Canio', desc: '\u00d71 Mult. Gains \u00d71 when face card destroyed', cost: 20, rarity: 'legendary',
      initVars() { return { xMult: 1 }; },
      onScore(ctx, vars) { if (vars.xMult > 1) ctx.mult *= vars.xMult; } },

    { id: 'triboulet', name: 'Triboulet', desc: 'Kings and Queens give \u00d72 Mult when scored', cost: 20, rarity: 'legendary',
      onCardScore(ctx, card) { if (card.rank === 'K' || card.rank === 'Q') ctx.mult *= 2; } },

    { id: 'yorick', name: 'Yorick', desc: '\u00d71 Mult. Gains \u00d71 every 23 cards discarded', cost: 20, rarity: 'legendary',
      initVars() { return { xMult: 1, discardCount: 0 }; },
      onScore(ctx, vars) { if (vars.xMult > 1) ctx.mult *= vars.xMult; },
      onDiscard(state, cards, vars) {
        vars.discardCount += cards.length;
        while (vars.discardCount >= 23) { vars.discardCount -= 23; vars.xMult += 1; }
      } },

    { id: 'chicot', name: 'Chicot', desc: 'Disables every Boss Blind effect', cost: 20, rarity: 'legendary' },
    // Effect handled in engine: if Chicot owned, boss effect is nullified

    { id: 'perkeo', name: 'Perkeo', desc: 'Creates Negative copy of 1 random consumable at end of shop', cost: 20, rarity: 'legendary',
      onShopEnter(state) {
        if (state.consumables.length > 0) {
          const pick = state.consumables[Math.floor(Math.random() * state.consumables.length)];
          // Add a negative copy (doesn't take a slot due to negative edition)
          state.consumables.push({ ...pick, edition: 'negative' });
        }
      } },
  );

})();
