// ============================================================
// BALATRO CONSUMABLES - Tarot, Planet, and Spectral cards
// ============================================================
//
// Consumables are held in the consumable slots (max 2 by default)
// and used during the playing phase. Tarots modify playing cards,
// Planets level up hand types, Spectrals have powerful effects.

(() => {
  const D = BalatroData;

  // ================================================================
  // TAROT CARDS (22)
  // ================================================================
  // Each tarot has:
  //   needsSelection: bool - whether it needs cards selected from hand
  //   minCards / maxCards: selection range (if needsSelection)
  //   apply(state, selectedCards): performs the effect

  D.tarots.push(
    { id: 'the_fool', name: 'The Fool', num: '0',
      desc: 'Creates the last Tarot or Planet card used this run (excludes itself)',
      needsSelection: false,
      canUse(state) { return !!state.lastConsumedId && state.lastConsumedId !== 'the_fool'; },
      apply(state) {
        const last = state.lastConsumedId;
        const lastType = state.lastConsumedType;
        if (last && state.consumables.length < state.maxConsumables) {
          state.consumables.push({ type: lastType, id: last });
        }
      } },

    { id: 'the_magician', name: 'The Magician', num: 'I',
      desc: 'Enhances up to 2 selected cards to Lucky Cards',
      needsSelection: true, minCards: 1, maxCards: 2,
      apply(state, cards) { cards.forEach(c => { c.enhancement = 'lucky'; }); } },

    { id: 'the_high_priestess', name: 'The High Priestess', num: 'II',
      desc: 'Creates up to 2 random Planet cards',
      needsSelection: false,
      apply(state) {
        for (let i = 0; i < 2 && state.consumables.length < state.maxConsumables; i++) {
          const pool = D.planets.filter(p => !p.secret || state.secretHandsPlayed[p.handType]);
          const p = pool[Math.floor(Math.random() * pool.length)];
          if (p) state.consumables.push({ type: 'planet', id: p.id });
        }
      } },

    { id: 'the_empress', name: 'The Empress', num: 'III',
      desc: 'Enhances up to 2 selected cards to Mult Cards',
      needsSelection: true, minCards: 1, maxCards: 2,
      apply(state, cards) { cards.forEach(c => { c.enhancement = 'mult'; }); } },

    { id: 'the_emperor', name: 'The Emperor', num: 'IV',
      desc: 'Creates up to 2 random Tarot cards',
      needsSelection: false,
      apply(state) {
        for (let i = 0; i < 2 && state.consumables.length < state.maxConsumables; i++) {
          const t = D.tarots[Math.floor(Math.random() * D.tarots.length)];
          if (t) state.consumables.push({ type: 'tarot', id: t.id });
        }
      } },

    { id: 'the_hierophant', name: 'The Hierophant', num: 'V',
      desc: 'Enhances up to 2 selected cards to Bonus Cards',
      needsSelection: true, minCards: 1, maxCards: 2,
      apply(state, cards) { cards.forEach(c => { c.enhancement = 'bonus'; }); } },

    { id: 'the_lovers', name: 'The Lovers', num: 'VI',
      desc: 'Enhances 1 selected card into a Wild Card',
      needsSelection: true, minCards: 1, maxCards: 1,
      apply(state, cards) { cards[0].enhancement = 'wild'; } },

    { id: 'the_chariot', name: 'The Chariot', num: 'VII',
      desc: 'Enhances 1 selected card into a Steel Card',
      needsSelection: true, minCards: 1, maxCards: 1,
      apply(state, cards) { cards[0].enhancement = 'steel'; } },

    { id: 'justice', name: 'Justice', num: 'VIII',
      desc: 'Enhances 1 selected card into a Glass Card',
      needsSelection: true, minCards: 1, maxCards: 1,
      apply(state, cards) { cards[0].enhancement = 'glass'; } },

    { id: 'the_hermit', name: 'The Hermit', num: 'IX',
      desc: 'Doubles your money (max $20)',
      needsSelection: false,
      apply(state) { state.money += Math.min(state.money, 20); } },

    { id: 'the_wheel_of_fortune', name: 'The Wheel of Fortune', num: 'X',
      desc: '1 in 4 chance to add Foil, Holo, or Polychrome to a random Joker',
      needsSelection: false,
      apply(state) {
        if (Math.random() < 0.25 * (state.luckMult || 1) && state.jokers.length > 0) {
          const j = state.jokers[Math.floor(Math.random() * state.jokers.length)];
          const editions = ['foil', 'holographic', 'polychrome'];
          j.edition = editions[Math.floor(Math.random() * 3)];
        }
      } },

    { id: 'strength', name: 'Strength', num: 'XI',
      desc: 'Increases rank of up to 2 selected cards by 1',
      needsSelection: true, minCards: 1, maxCards: 2,
      apply(state, cards) {
        cards.forEach(c => {
          const idx = D.RANKS.indexOf(c.rank);
          if (idx < D.RANKS.length - 1) c.rank = D.RANKS[idx + 1];
          // Ace wraps to 2 (or stays at A depending on interpretation - staying at A if already max)
        });
      } },

    { id: 'the_hanged_man', name: 'The Hanged Man', num: 'XII',
      desc: 'Destroys up to 2 selected cards',
      needsSelection: true, minCards: 1, maxCards: 2,
      apply(state, cards) {
        cards.forEach(c => {
          // Remove from hand
          let idx = state.hand.indexOf(c);
          if (idx >= 0) state.hand.splice(idx, 1);
          // Remove from deck
          idx = state.deck.findIndex(d => d.id === c.id);
          if (idx >= 0) state.deck.splice(idx, 1);
        });
      } },

    { id: 'death', name: 'Death', num: 'XIII',
      desc: 'Converts left card into right card (suit and rank)',
      needsSelection: true, minCards: 2, maxCards: 2,
      apply(state, cards) {
        // Left card becomes copy of right card's suit and rank
        cards[0].suit = cards[1].suit;
        cards[0].rank = cards[1].rank;
      } },

    { id: 'temperance', name: 'Temperance', num: 'XIV',
      desc: 'Gives total sell value of all Jokers (max $50)',
      needsSelection: false,
      apply(state) {
        const total = state.jokers.reduce((s, j) => s + (j.sellValue || 0), 0);
        state.money += Math.min(total, 50);
      } },

    { id: 'the_devil', name: 'The Devil', num: 'XV',
      desc: 'Enhances 1 selected card into a Gold Card',
      needsSelection: true, minCards: 1, maxCards: 1,
      apply(state, cards) { cards[0].enhancement = 'gold'; } },

    { id: 'the_tower', name: 'The Tower', num: 'XVI',
      desc: 'Enhances 1 selected card into a Stone Card',
      needsSelection: true, minCards: 1, maxCards: 1,
      apply(state, cards) { cards[0].enhancement = 'stone'; } },

    { id: 'the_star', name: 'The Star', num: 'XVII',
      desc: 'Converts up to 3 selected cards to \u2666',
      needsSelection: true, minCards: 1, maxCards: 3,
      apply(state, cards) { cards.forEach(c => { c.suit = 'diamonds'; }); } },

    { id: 'the_moon', name: 'The Moon', num: 'XVIII',
      desc: 'Converts up to 3 selected cards to \u2663',
      needsSelection: true, minCards: 1, maxCards: 3,
      apply(state, cards) { cards.forEach(c => { c.suit = 'clubs'; }); } },

    { id: 'the_sun', name: 'The Sun', num: 'XIX',
      desc: 'Converts up to 3 selected cards to \u2665',
      needsSelection: true, minCards: 1, maxCards: 3,
      apply(state, cards) { cards.forEach(c => { c.suit = 'hearts'; }); } },

    { id: 'judgement', name: 'Judgement', num: 'XX',
      desc: 'Creates a random Joker card',
      needsSelection: false,
      apply(state) {
        if (state.jokers.length < state.maxJokers) {
          const pool = D.jokers.filter(j => !state.jokers.some(o => o.defId === j.id));
          if (pool.length > 0) {
            const pick = pool[Math.floor(Math.random() * pool.length)];
            state.jokers.push({
              defId: pick.id, edition: 'base',
              sellValue: Math.ceil(pick.cost / 2),
              vars: pick.initVars ? pick.initVars() : {},
            });
          }
        }
      } },

    { id: 'the_world', name: 'The World', num: 'XXI',
      desc: 'Converts up to 3 selected cards to \u2660',
      needsSelection: true, minCards: 1, maxCards: 3,
      apply(state, cards) { cards.forEach(c => { c.suit = 'spades'; }); } },
  );

  // ================================================================
  // PLANET CARDS (12)
  // ================================================================
  // Each planet levels up a specific hand type by 1 level,
  // adding that hand type's lvlChips and lvlMult.

  const PLANET_DEFS = [
    { id: 'pluto',    name: 'Pluto',    handType: 'High Card' },
    { id: 'mercury',  name: 'Mercury',  handType: 'Pair' },
    { id: 'uranus',   name: 'Uranus',   handType: 'Two Pair' },
    { id: 'venus',    name: 'Venus',    handType: 'Three of a Kind' },
    { id: 'saturn',   name: 'Saturn',   handType: 'Straight' },
    { id: 'jupiter',  name: 'Jupiter',  handType: 'Flush' },
    { id: 'earth',    name: 'Earth',    handType: 'Full House' },
    { id: 'mars',     name: 'Mars',     handType: 'Four of a Kind' },
    { id: 'neptune',  name: 'Neptune',  handType: 'Straight Flush' },
    { id: 'planet_x', name: 'Planet X', handType: 'Five of a Kind',  secret: true },
    { id: 'ceres',    name: 'Ceres',    handType: 'Flush House',     secret: true },
    { id: 'eris',     name: 'Eris',     handType: 'Flush Five',      secret: true },
  ];

  PLANET_DEFS.forEach(p => {
    const ht = D.HAND_TYPE_MAP[p.handType];
    D.planets.push({
      id: p.id,
      name: p.name,
      handType: p.handType,
      secret: p.secret || false,
      desc: 'Lvl up ' + p.handType + ' (+' + ht.lvlChips + ' Chips, +' + ht.lvlMult + ' Mult)',
      needsSelection: false,
      apply(state) {
        if (!state.handLevels[p.handType]) {
          state.handLevels[p.handType] = { level: 1 };
        }
        state.handLevels[p.handType].level++;
        // Track unique planets used
        if (!state.planetsUsed) state.planetsUsed = [];
        if (!state.planetsUsed.includes(p.id)) state.planetsUsed.push(p.id);
        // Update Constellation joker
        state.jokers.forEach(j => {
          if (j.defId === 'constellation' && j.vars) {
            j.vars.xMult = (j.vars.xMult || 1) + 0.1;
          }
        });
      },
    });
  });

  // ================================================================
  // SPECTRAL CARDS (18)
  // ================================================================

  D.spectrals.push(
    { id: 'familiar', name: 'Familiar',
      desc: 'Destroy 1 random card in hand, add 3 random Enhanced face cards',
      needsSelection: false,
      apply(state) {
        if (state.hand.length === 0) return;
        // Destroy random card
        const victimIdx = Math.floor(Math.random() * state.hand.length);
        const victim = state.hand.splice(victimIdx, 1)[0];
        const deckIdx = state.deck.findIndex(c => c.id === victim.id);
        if (deckIdx >= 0) state.deck.splice(deckIdx, 1);
        // Add 3 enhanced face cards
        const enhancements = Object.keys(D.ENHANCEMENTS);
        for (let i = 0; i < 3; i++) {
          const rank = D.FACE_RANKS[Math.floor(Math.random() * 3)];
          const suit = D.SUITS[Math.floor(Math.random() * 4)];
          const enh = enhancements[Math.floor(Math.random() * enhancements.length)];
          const card = { id: 'fam_' + Date.now() + '_' + i, suit, rank, enhancement: enh, edition: 'base', seal: null, chipBonus: 0, debuffed: false };
          state.deck.push(card);
        }
      } },

    { id: 'grim', name: 'Grim',
      desc: 'Destroy 1 random card in hand, add 2 random Enhanced Aces',
      needsSelection: false,
      apply(state) {
        if (state.hand.length === 0) return;
        const victimIdx = Math.floor(Math.random() * state.hand.length);
        const victim = state.hand.splice(victimIdx, 1)[0];
        const deckIdx = state.deck.findIndex(c => c.id === victim.id);
        if (deckIdx >= 0) state.deck.splice(deckIdx, 1);
        const enhancements = Object.keys(D.ENHANCEMENTS);
        for (let i = 0; i < 2; i++) {
          const suit = D.SUITS[Math.floor(Math.random() * 4)];
          const enh = enhancements[Math.floor(Math.random() * enhancements.length)];
          const card = { id: 'grim_' + Date.now() + '_' + i, suit, rank: 'A', enhancement: enh, edition: 'base', seal: null, chipBonus: 0, debuffed: false };
          state.deck.push(card);
        }
      } },

    { id: 'incantation', name: 'Incantation',
      desc: 'Destroy 1 random card in hand, add 4 random Enhanced number cards (2-10)',
      needsSelection: false,
      apply(state) {
        if (state.hand.length === 0) return;
        const victimIdx = Math.floor(Math.random() * state.hand.length);
        const victim = state.hand.splice(victimIdx, 1)[0];
        const deckIdx = state.deck.findIndex(c => c.id === victim.id);
        if (deckIdx >= 0) state.deck.splice(deckIdx, 1);
        const numRanks = ['2','3','4','5','6','7','8','9','10'];
        const enhancements = Object.keys(D.ENHANCEMENTS);
        for (let i = 0; i < 4; i++) {
          const rank = numRanks[Math.floor(Math.random() * numRanks.length)];
          const suit = D.SUITS[Math.floor(Math.random() * 4)];
          const enh = enhancements[Math.floor(Math.random() * enhancements.length)];
          const card = { id: 'inc_' + Date.now() + '_' + i, suit, rank, enhancement: enh, edition: 'base', seal: null, chipBonus: 0, debuffed: false };
          state.deck.push(card);
        }
      } },

    { id: 'talisman', name: 'Talisman',
      desc: 'Add a Gold Seal to 1 selected card',
      needsSelection: true, minCards: 1, maxCards: 1,
      apply(state, cards) { cards[0].seal = 'gold'; } },

    { id: 'aura', name: 'Aura',
      desc: 'Add Foil, Holo, or Polychrome to 1 selected card',
      needsSelection: true, minCards: 1, maxCards: 1,
      apply(state, cards) {
        const editions = ['foil', 'holographic', 'polychrome'];
        cards[0].edition = editions[Math.floor(Math.random() * 3)];
      } },

    { id: 'wraith', name: 'Wraith',
      desc: 'Creates a random Rare Joker, sets money to $0',
      needsSelection: false,
      apply(state) {
        if (state.jokers.length < state.maxJokers) {
          const pool = D.jokers.filter(j => j.rarity === 'rare' && !state.jokers.some(o => o.defId === j.id));
          if (pool.length > 0) {
            const pick = pool[Math.floor(Math.random() * pool.length)];
            state.jokers.push({ defId: pick.id, edition: 'base', sellValue: Math.ceil(pick.cost / 2), vars: pick.initVars ? pick.initVars() : {} });
          }
        }
        state.money = 0;
      } },

    { id: 'sigil', name: 'Sigil',
      desc: 'Converts ALL cards in hand to a single random suit',
      needsSelection: false,
      apply(state) {
        const suit = D.SUITS[Math.floor(Math.random() * 4)];
        state.hand.forEach(c => { c.suit = suit; });
      } },

    { id: 'ouija', name: 'Ouija',
      desc: 'Converts ALL cards in hand to a single random rank, -1 Hand Size',
      needsSelection: false,
      apply(state) {
        const rank = D.RANKS[Math.floor(Math.random() * D.RANKS.length)];
        state.hand.forEach(c => { c.rank = rank; });
        state.permHandSizeBonus = (state.permHandSizeBonus || 0) - 1;
      } },

    { id: 'ectoplasm', name: 'Ectoplasm',
      desc: 'Add Negative to a random Joker, -1 Hand Size',
      needsSelection: false,
      apply(state) {
        if (state.jokers.length > 0) {
          const j = state.jokers[Math.floor(Math.random() * state.jokers.length)];
          j.edition = 'negative';
          state.maxJokers++;
        }
        state.permHandSizeBonus = (state.permHandSizeBonus || 0) - 1;
      } },

    { id: 'immolate', name: 'Immolate',
      desc: 'Destroys 5 random cards in hand, gain $20',
      needsSelection: false,
      apply(state) {
        const toDestroy = Math.min(5, state.hand.length);
        for (let i = 0; i < toDestroy; i++) {
          const idx = Math.floor(Math.random() * state.hand.length);
          const card = state.hand.splice(idx, 1)[0];
          const deckIdx = state.deck.findIndex(c => c.id === card.id);
          if (deckIdx >= 0) state.deck.splice(deckIdx, 1);
        }
        state.money += 20;
      } },

    { id: 'ankh', name: 'Ankh',
      desc: 'Creates copy of 1 random Joker, destroys all others',
      needsSelection: false,
      apply(state) {
        if (state.jokers.length === 0) return;
        const pick = state.jokers[Math.floor(Math.random() * state.jokers.length)];
        const def = D.findJoker(pick.defId);
        const copy = { defId: pick.defId, edition: 'base', sellValue: Math.ceil((def ? def.cost : 4) / 2), vars: def && def.initVars ? def.initVars() : {} };
        state.jokers.length = 0;
        state.jokers.push(copy);
      } },

    { id: 'deja_vu', name: 'Deja Vu',
      desc: 'Add a Red Seal to 1 selected card',
      needsSelection: true, minCards: 1, maxCards: 1,
      apply(state, cards) { cards[0].seal = 'red'; } },

    { id: 'hex', name: 'Hex',
      desc: 'Add Polychrome to a random Joker, destroys all others',
      needsSelection: false,
      apply(state) {
        if (state.jokers.length === 0) return;
        const pick = state.jokers[Math.floor(Math.random() * state.jokers.length)];
        pick.edition = 'polychrome';
        const saved = { ...pick, vars: { ...pick.vars } };
        state.jokers.length = 0;
        state.jokers.push(saved);
      } },

    { id: 'trance', name: 'Trance',
      desc: 'Add a Blue Seal to 1 selected card',
      needsSelection: true, minCards: 1, maxCards: 1,
      apply(state, cards) { cards[0].seal = 'blue'; } },

    { id: 'medium', name: 'Medium',
      desc: 'Add a Purple Seal to 1 selected card',
      needsSelection: true, minCards: 1, maxCards: 1,
      apply(state, cards) { cards[0].seal = 'purple'; } },

    { id: 'cryptid', name: 'Cryptid',
      desc: 'Creates 2 copies of 1 selected card in hand',
      needsSelection: true, minCards: 1, maxCards: 1,
      apply(state, cards) {
        const src = cards[0];
        for (let i = 0; i < 2; i++) {
          const copy = {
            id: 'crypt_' + Date.now() + '_' + i,
            suit: src.suit, rank: src.rank,
            enhancement: src.enhancement, edition: src.edition, seal: src.seal,
            chipBonus: src.chipBonus, debuffed: false,
          };
          state.deck.push(copy);
          state.hand.push(copy);
        }
        // Update hologram joker if present
        state.jokers.forEach(j => {
          if (j.defId === 'hologram' && j.vars) j.vars.xMult = (j.vars.xMult || 1) + 0.5;
        });
      } },

    { id: 'the_soul', name: 'The Soul',
      desc: 'Creates a random Legendary Joker',
      needsSelection: false,
      apply(state) {
        if (state.jokers.length < state.maxJokers) {
          const pool = D.jokers.filter(j => j.rarity === 'legendary' && !state.jokers.some(o => o.defId === j.id));
          if (pool.length > 0) {
            const pick = pool[Math.floor(Math.random() * pool.length)];
            state.jokers.push({ defId: pick.id, edition: 'base', sellValue: Math.ceil(pick.cost / 2), vars: pick.initVars ? pick.initVars() : {} });
          }
        }
      } },

    { id: 'black_hole', name: 'Black Hole',
      desc: 'Upgrades every poker hand by 1 level',
      needsSelection: false,
      apply(state) {
        D.HAND_TYPES.forEach(ht => {
          if (!state.handLevels[ht.name]) state.handLevels[ht.name] = { level: 1 };
          state.handLevels[ht.name].level++;
        });
      } },
  );

})();
