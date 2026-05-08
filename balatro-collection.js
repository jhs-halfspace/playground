// ============================================================
// BALATRO COLLECTION - Boss blinds, vouchers, tags, decks,
//                      stakes, and booster packs
// ============================================================

(() => {
  const D = BalatroData;

  // ================================================================
  // BOSS BLIND EFFECTS (28)
  // ================================================================
  // Each boss can implement:
  //   onTargetCalc(target) -> modified target
  //   onBlindStart(state)  -> modify state at round start
  //   onHandPlayed(state, playedCards) -> per-hand effect
  //   onCardDraw(state, card) -> per-drawn-card effect
  //   debuffCards(state) -> mark cards as debuffed
  //   desc: string

  D.bossBlinds.push(
    { id: 'the_hook', name: 'The Hook',
      desc: 'Discards 2 random cards per hand played',
      onHandPlayed(state) {
        for (let i = 0; i < 2 && state.hand.length > 0; i++) {
          const idx = Math.floor(Math.random() * state.hand.length);
          state.hand.splice(idx, 1);
        }
      } },

    { id: 'the_ox', name: 'The Ox',
      desc: 'Playing your most played hand type sets money to $0',
      onHandPlayed(state, played, handType) {
        const counts = state.handsPlayedRun || {};
        const maxType = Object.keys(counts).reduce((a, b) => (counts[a] || 0) >= (counts[b] || 0) ? a : b, 'High Card');
        if (handType === maxType) state.money = 0;
      } },

    { id: 'the_house', name: 'The House',
      desc: 'All cards drawn face down on first hand',
      onBlindStart(state) { state._houseActive = true; },
      onHandPlayed(state) { state._houseActive = false; } },

    { id: 'the_wall', name: 'The Wall',
      desc: 'Extra large blind (4\u00d7 base)',
      onTargetCalc(target) { return target * 2; } },
      // Boss is already 2x, this makes it 4x

    { id: 'the_wheel', name: 'The Wheel',
      desc: '1 in 7 cards drawn face down',
      onCardDraw(state, card) { if (Math.random() < 1/7) card._faceDown = true; } },

    { id: 'the_arm', name: 'The Arm',
      desc: 'Decreases level of played hand by 1',
      onHandPlayed(state, played, handType) {
        if (state.handLevels[handType] && state.handLevels[handType].level > 1) {
          state.handLevels[handType].level--;
        }
      } },

    { id: 'the_club', name: 'The Club',
      desc: 'All Club cards are debuffed',
      debuffCards(state) { state.hand.forEach(c => { if (c.suit === 'clubs') c.debuffed = true; }); } },

    { id: 'the_fish', name: 'The Fish',
      desc: 'Cards drawn after playing are face down',
      onHandPlayed(state) { state._fishActive = true; } },

    { id: 'the_psychic', name: 'The Psychic',
      desc: 'Must play exactly 5 cards',
      requireExact: 5 },

    { id: 'the_goad', name: 'The Goad',
      desc: 'All Spade cards are debuffed',
      debuffCards(state) { state.hand.forEach(c => { if (c.suit === 'spades') c.debuffed = true; }); } },

    { id: 'the_water', name: 'The Water',
      desc: 'Start with 0 discards',
      onBlindStart(state) { state.discards = 0; } },

    { id: 'the_window', name: 'The Window',
      desc: 'All Diamond cards are debuffed',
      debuffCards(state) { state.hand.forEach(c => { if (c.suit === 'diamonds') c.debuffed = true; }); } },

    { id: 'the_manacle', name: 'The Manacle',
      desc: '-1 hand size this round',
      onBlindStart(state) { state.bonusHandSize = (state.bonusHandSize || 0) - 1; } },

    { id: 'the_serpent', name: 'The Serpent',
      desc: 'Always draw 3 cards after play or discard',
      drawOverride: 3 },

    { id: 'the_pillar', name: 'The Pillar',
      desc: 'Cards played previously this round are debuffed',
      onHandPlayed(state, playedCards) {
        if (!state._pillarPlayed) state._pillarPlayed = [];
        playedCards.forEach(c => state._pillarPlayed.push(c.id));
      },
      debuffCards(state) {
        if (state._pillarPlayed) {
          state.hand.forEach(c => {
            if (state._pillarPlayed.includes(c.id)) c.debuffed = true;
          });
        }
      } },

    { id: 'the_head', name: 'The Head',
      desc: 'All Heart cards are debuffed',
      debuffCards(state) { state.hand.forEach(c => { if (c.suit === 'hearts') c.debuffed = true; }); } },

    { id: 'the_plant', name: 'The Plant',
      desc: 'All face cards are debuffed',
      debuffCards(state) { state.hand.forEach(c => { if (D.FACE_RANKS.includes(c.rank)) c.debuffed = true; }); } },

    { id: 'the_needle', name: 'The Needle',
      desc: 'Only 1 hand this round',
      onBlindStart(state) { state.hands = 1; } },

    { id: 'the_flint', name: 'The Flint',
      desc: 'Base Chips and Mult are halved',
      halveBase: true },

    { id: 'the_mark', name: 'The Mark',
      desc: 'All face cards are drawn face down',
      onBlindStart(state) { state._markActive = true; } },

    { id: 'the_eye', name: 'The Eye',
      desc: 'No repeat hand types this round',
      onBlindStart(state) { state._eyeHandTypes = []; },
      validateHand(state, handType) {
        if (state._eyeHandTypes && state._eyeHandTypes.includes(handType)) return false;
        return true;
      },
      onHandPlayed(state, played, handType) {
        if (state._eyeHandTypes) state._eyeHandTypes.push(handType);
      } },

    { id: 'the_mouth', name: 'The Mouth',
      desc: 'Only play one hand type this round',
      onBlindStart(state) { state._mouthType = null; },
      validateHand(state, handType) {
        if (state._mouthType && state._mouthType !== handType) return false;
        return true;
      },
      onHandPlayed(state, played, handType) {
        if (!state._mouthType) state._mouthType = handType;
      } },

    { id: 'the_tooth', name: 'The Tooth',
      desc: 'Lose $1 per card played',
      onHandPlayed(state, playedCards) { state.money -= playedCards.length; } },

    { id: 'the_violet', name: 'The Violet',
      desc: '-1 hand size this round',
      onBlindStart(state) { state.bonusHandSize = (state.bonusHandSize || 0) - 1; } },

    { id: 'the_amber', name: 'The Amber',
      desc: 'No discards this round',
      onBlindStart(state) { state.discards = 0; } },

    { id: 'crimson_heart', name: 'Crimson Heart',
      desc: 'One random Joker debuffed each hand',
      onHandPlayed(state) {
        // Clear previous debuff
        state.jokers.forEach(j => { j._debuffed = false; });
        if (state.jokers.length > 0) {
          state.jokers[Math.floor(Math.random() * state.jokers.length)]._debuffed = true;
        }
      } },

    { id: 'cerulean_bell', name: 'Cerulean Bell',
      desc: 'One card is always forced selected',
      onBlindStart(state) {
        if (state.hand.length > 0) {
          state._forcedCardId = state.hand[Math.floor(Math.random() * state.hand.length)].id;
        }
      } },

    { id: 'verdant_leaf', name: 'Verdant Leaf',
      desc: 'All cards debuffed until a Joker is sold',
      onBlindStart(state) { state._verdantActive = true; },
      debuffCards(state) {
        if (state._verdantActive) state.hand.forEach(c => { c.debuffed = true; });
      } },
  );

  // ================================================================
  // VOUCHERS (32: 16 base + 16 upgraded)
  // ================================================================
  // All cost $10. Tier 2 requires owning the tier 1 version.

  D.vouchers.push(
    // --- Tier 1 ---
    { id: 'overstock', name: 'Overstock', tier: 1, cost: 10,
      desc: '+1 card slot in shop',
      apply(state) { state.shopSlots = (state.shopSlots || 2) + 1; } },

    { id: 'clearance_sale', name: 'Clearance Sale', tier: 1, cost: 10,
      desc: 'All shop items 25% off',
      apply(state) { state.shopDiscount = (state.shopDiscount || 0) + 0.25; } },

    { id: 'hone', name: 'Hone', tier: 1, cost: 10,
      desc: 'Foil, Holo, Polychrome appear 2\u00d7 more often',
      apply(state) { state.editionMult = (state.editionMult || 1) * 2; } },

    { id: 'reroll_surplus', name: 'Reroll Surplus', tier: 1, cost: 10,
      desc: 'Rerolls cost $2 less',
      apply(state) { state.rerollDiscount = (state.rerollDiscount || 0) + 2; } },

    { id: 'crystal_ball', name: 'Crystal Ball', tier: 1, cost: 10,
      desc: '+1 consumable slot',
      apply(state) { state.maxConsumables++; } },

    { id: 'telescope', name: 'Telescope', tier: 1, cost: 10,
      desc: 'Celestial Packs always have your most played hand\'s Planet',
      apply(state) { state.telescopeActive = true; } },

    { id: 'grabber', name: 'Grabber', tier: 1, cost: 10,
      desc: '+1 hand per round',
      apply(state) { state.bonusHands = (state.bonusHands || 0) + 1; } },

    { id: 'wasteful', name: 'Wasteful', tier: 1, cost: 10,
      desc: '+1 discard per round',
      apply(state) { state.bonusDiscards = (state.bonusDiscards || 0) + 1; } },

    { id: 'tarot_merchant', name: 'Tarot Merchant', tier: 1, cost: 10,
      desc: 'Tarot cards appear 2\u00d7 more in shop',
      apply(state) { state.tarotWeight = (state.tarotWeight || 1) * 2; } },

    { id: 'planet_merchant', name: 'Planet Merchant', tier: 1, cost: 10,
      desc: 'Planet cards appear 2\u00d7 more in shop',
      apply(state) { state.planetWeight = (state.planetWeight || 1) * 2; } },

    { id: 'seed_money', name: 'Seed Money', tier: 1, cost: 10,
      desc: 'Interest cap raised to $10',
      apply(state) { state.interestCap = 10; } },

    { id: 'blank', name: 'Blank', tier: 1, cost: 10,
      desc: 'Does nothing',
      apply() {} },

    { id: 'magic_trick', name: 'Magic Trick', tier: 1, cost: 10,
      desc: 'Playing cards can appear in shop',
      apply(state) { state.playingCardsInShop = true; } },

    { id: 'hieroglyph', name: 'Hieroglyph', tier: 1, cost: 10,
      desc: '-1 Ante, -1 hand per round',
      apply(state) { state.ante = Math.max(1, state.ante - 1); state.bonusHands = (state.bonusHands || 0) - 1; } },

    { id: 'directors_cut', name: "Director's Cut", tier: 1, cost: 10,
      desc: 'Reroll Boss Blind 1 time per Ante ($10)',
      apply(state) { state.bossRerolls = 1; } },

    { id: 'paint_brush', name: 'Paint Brush', tier: 1, cost: 10,
      desc: '+1 hand size',
      apply(state) { state.bonusHandSize = (state.bonusHandSize || 0) + 1; } },

    // --- Tier 2 (require tier 1) ---
    { id: 'overstock_plus', name: 'Overstock Plus', tier: 2, requires: 'overstock', cost: 10,
      desc: '+1 card slot in shop (total +2)',
      apply(state) { state.shopSlots = (state.shopSlots || 3) + 1; } },

    { id: 'liquidation', name: 'Liquidation', tier: 2, requires: 'clearance_sale', cost: 10,
      desc: 'All shop items 50% off',
      apply(state) { state.shopDiscount = (state.shopDiscount || 0.25) + 0.25; } },

    { id: 'glow_up', name: 'Glow Up', tier: 2, requires: 'hone', cost: 10,
      desc: 'Foil, Holo, Polychrome appear 4\u00d7 more often',
      apply(state) { state.editionMult = (state.editionMult || 2) * 2; } },

    { id: 'reroll_glut', name: 'Reroll Glut', tier: 2, requires: 'reroll_surplus', cost: 10,
      desc: 'Rerolls cost $4 less total',
      apply(state) { state.rerollDiscount = (state.rerollDiscount || 2) + 2; } },

    { id: 'omen_globe', name: 'Omen Globe', tier: 2, requires: 'crystal_ball', cost: 10,
      desc: 'Spectral cards may appear in Arcana Packs',
      apply(state) { state.omenGlobe = true; } },

    { id: 'observatory', name: 'Observatory', tier: 2, requires: 'telescope', cost: 10,
      desc: 'Planet cards in consumables give \u00d71.5 Mult for their hand',
      apply(state) { state.observatoryActive = true; } },

    { id: 'nacho_tong', name: 'Nacho Tong', tier: 2, requires: 'grabber', cost: 10,
      desc: '+1 hand per round (total +2)',
      apply(state) { state.bonusHands = (state.bonusHands || 1) + 1; } },

    { id: 'recyclomancy', name: 'Recyclomancy', tier: 2, requires: 'wasteful', cost: 10,
      desc: '+1 discard per round (total +2)',
      apply(state) { state.bonusDiscards = (state.bonusDiscards || 1) + 1; } },

    { id: 'tarot_tycoon', name: 'Tarot Tycoon', tier: 2, requires: 'tarot_merchant', cost: 10,
      desc: 'Tarot cards appear 4\u00d7 more in shop',
      apply(state) { state.tarotWeight = (state.tarotWeight || 2) * 2; } },

    { id: 'planet_tycoon', name: 'Planet Tycoon', tier: 2, requires: 'planet_merchant', cost: 10,
      desc: 'Planet cards appear 4\u00d7 more in shop',
      apply(state) { state.planetWeight = (state.planetWeight || 2) * 2; } },

    { id: 'money_tree', name: 'Money Tree', tier: 2, requires: 'seed_money', cost: 10,
      desc: 'Interest cap raised to $20',
      apply(state) { state.interestCap = 20; } },

    { id: 'antimatter', name: 'Antimatter', tier: 2, requires: 'blank', cost: 10,
      desc: '+1 Joker slot',
      apply(state) { state.maxJokers++; } },

    { id: 'illusion', name: 'Illusion', tier: 2, requires: 'magic_trick', cost: 10,
      desc: 'Shop playing cards may have Enhancement, Edition, Seal',
      apply(state) { state.illusionActive = true; } },

    { id: 'petroglyph', name: 'Petroglyph', tier: 2, requires: 'hieroglyph', cost: 10,
      desc: '-1 Ante, -1 discard per round',
      apply(state) { state.ante = Math.max(1, state.ante - 1); state.bonusDiscards = (state.bonusDiscards || 0) - 1; } },

    { id: 'retcon', name: 'Retcon', tier: 2, requires: 'directors_cut', cost: 10,
      desc: 'Reroll Boss Blind unlimited times ($10 each)',
      apply(state) { state.bossRerolls = 999; } },

    { id: 'palette', name: 'Palette', tier: 2, requires: 'paint_brush', cost: 10,
      desc: '+1 hand size (total +2)',
      apply(state) { state.bonusHandSize = (state.bonusHandSize || 1) + 1; } },
  );

  // ================================================================
  // TAGS (24)
  // ================================================================
  // Tags are rewards for skipping blinds.
  // Each has an apply function or a shop modifier.

  D.tags.push(
    { id: 'uncommon_tag', name: 'Uncommon Tag', desc: 'Free Uncommon Joker in next shop',
      onShopEnter(state) { state._tagGuaranteeRarity = 'uncommon'; } },

    { id: 'rare_tag', name: 'Rare Tag', desc: 'Free Rare Joker in next shop',
      onShopEnter(state) { state._tagGuaranteeRarity = 'rare'; } },

    { id: 'negative_tag', name: 'Negative Tag', desc: 'Next shop Joker is free and Negative',
      onShopEnter(state) { state._tagNegativeFree = true; } },

    { id: 'foil_tag', name: 'Foil Tag', desc: 'Next shop Joker is free and Foil',
      onShopEnter(state) { state._tagEditionFree = 'foil'; } },

    { id: 'holographic_tag', name: 'Holographic Tag', desc: 'Next shop Joker is free and Holographic',
      onShopEnter(state) { state._tagEditionFree = 'holographic'; } },

    { id: 'polychrome_tag', name: 'Polychrome Tag', desc: 'Next shop Joker is free and Polychrome',
      onShopEnter(state) { state._tagEditionFree = 'polychrome'; } },

    { id: 'top_up_tag', name: 'Top-up Tag', desc: 'Create up to 2 Common Jokers',
      apply(state) {
        const commons = D.jokers.filter(j => j.rarity === 'common' && !state.jokers.some(o => o.defId === j.id));
        for (let i = 0; i < 2 && commons.length > 0 && state.jokers.length < state.maxJokers; i++) {
          const pick = commons.splice(Math.floor(Math.random() * commons.length), 1)[0];
          state.jokers.push({ defId: pick.id, edition: 'base', sellValue: Math.ceil(pick.cost / 2), vars: pick.initVars ? pick.initVars() : {} });
        }
      } },

    { id: 'investment_tag', name: 'Investment Tag', desc: '+$25 after defeating Boss Blind',
      apply(state) { state._investmentBonus = (state._investmentBonus || 0) + 25; } },

    { id: 'economy_tag', name: 'Economy Tag', desc: 'Doubles money (max +$40)',
      apply(state) { state.money += Math.min(state.money, 40); } },

    { id: 'handy_tag', name: 'Handy Tag', desc: '$1 per hand played this run',
      apply(state) {
        const total = Object.values(state.handsPlayedRun || {}).reduce((s, v) => s + v, 0);
        state.money += total;
      } },

    { id: 'garbage_tag', name: 'Garbage Tag', desc: '$1 per unused discard this run',
      apply(state) { state.money += (state.unusedDiscards || 0); } },

    { id: 'speed_tag', name: 'Speed Tag', desc: '$5 per Blind skipped this run',
      apply(state) { state.money += Math.max(5, 5 * (state.blindsSkipped || 0)); } },

    { id: 'coupon_tag', name: 'Coupon Tag', desc: 'Initial shop items are free',
      onShopEnter(state) { state._couponActive = true; } },

    { id: 'voucher_tag', name: 'Voucher Tag', desc: 'Adds a Voucher to next shop',
      onShopEnter(state) { state._extraVoucher = true; } },

    { id: 'd6_tag', name: 'D6 Tag', desc: 'Rerolls start at $0 in next shop',
      onShopEnter(state) { state._freeRerollStart = true; } },

    { id: 'boss_tag', name: 'Boss Tag', desc: 'Rerolls the next Boss Blind',
      apply(state) { state._rerollBoss = true; } },

    { id: 'double_tag', name: 'Double Tag', desc: 'Copies the next Tag selected',
      isDouble: true },

    { id: 'juggle_tag', name: 'Juggle Tag', desc: '+3 hand size next round',
      apply(state) { state.bonusHandSize = (state.bonusHandSize || 0) + 3; } },

    { id: 'orbital_tag', name: 'Orbital Tag', desc: 'Upgrades a random poker hand by 3 levels',
      apply(state) {
        const hands = D.HAND_TYPES.filter(h => !h.secret).map(h => h.name);
        const pick = hands[Math.floor(Math.random() * hands.length)];
        if (!state.handLevels[pick]) state.handLevels[pick] = { level: 1 };
        state.handLevels[pick].level += 3;
      } },

    { id: 'standard_tag', name: 'Standard Tag', desc: 'Free Mega Standard Pack',
      apply(state) { state._freePackType = 'standard_mega'; } },

    { id: 'charm_tag', name: 'Charm Tag', desc: 'Free Mega Arcana Pack',
      apply(state) { state._freePackType = 'arcana_mega'; } },

    { id: 'meteor_tag', name: 'Meteor Tag', desc: 'Free Mega Celestial Pack',
      apply(state) { state._freePackType = 'celestial_mega'; } },

    { id: 'buffoon_tag', name: 'Buffoon Tag', desc: 'Free Mega Buffoon Pack',
      apply(state) { state._freePackType = 'buffoon_mega'; } },

    { id: 'ethereal_tag', name: 'Ethereal Tag', desc: 'Free Spectral Pack',
      apply(state) { state._freePackType = 'spectral_normal'; } },
  );

  // ================================================================
  // DECKS (15)
  // ================================================================

  D.decks.push(
    { id: 'red_deck', name: 'Red Deck', desc: '+1 discard every round',
      apply(state) { state.bonusDiscards = (state.bonusDiscards || 0) + 1; } },

    { id: 'blue_deck', name: 'Blue Deck', desc: '+1 hand every round',
      apply(state) { state.bonusHands = (state.bonusHands || 0) + 1; } },

    { id: 'yellow_deck', name: 'Yellow Deck', desc: 'Start with extra $10',
      apply(state) { state.money += 10; } },

    { id: 'green_deck', name: 'Green Deck', desc: '$2/hand, $1/discard remaining; no interest',
      apply(state) { state.greenDeck = true; state.interestCap = 0; } },

    { id: 'black_deck', name: 'Black Deck', desc: '+1 Joker slot, -1 hand per round',
      apply(state) { state.maxJokers++; state.bonusHands = (state.bonusHands || 0) - 1; } },

    { id: 'magic_deck', name: 'Magic Deck', desc: 'Start with Crystal Ball voucher + 2 Fool tarots',
      apply(state) {
        state.vouchers.push('crystal_ball');
        state.maxConsumables++;
        state.consumables.push({ type: 'tarot', id: 'the_fool' });
        state.consumables.push({ type: 'tarot', id: 'the_fool' });
      } },

    { id: 'nebula_deck', name: 'Nebula Deck', desc: 'Start with Telescope voucher, -1 consumable slot',
      apply(state) {
        state.vouchers.push('telescope');
        state.telescopeActive = true;
        state.maxConsumables = Math.max(0, state.maxConsumables - 1);
      } },

    { id: 'ghost_deck', name: 'Ghost Deck', desc: 'Spectral cards may appear in shop, start with Hex',
      apply(state) {
        state.spectralInShop = true;
        state.consumables.push({ type: 'spectral', id: 'hex' });
      } },

    { id: 'abandoned_deck', name: 'Abandoned Deck', desc: 'No face cards in starting deck',
      modifyDeck(deck) { return deck.filter(c => !D.FACE_RANKS.includes(c.rank)); } },

    { id: 'checkered_deck', name: 'Checkered Deck', desc: '26 Spades and 26 Hearts only',
      modifyDeck() {
        const deck = [];
        D.RANKS.forEach(r => {
          deck.push({ suit: 'spades', rank: r });
          deck.push({ suit: 'spades', rank: r });
          deck.push({ suit: 'hearts', rank: r });
          deck.push({ suit: 'hearts', rank: r });
        });
        return deck;
      } },

    { id: 'zodiac_deck', name: 'Zodiac Deck', desc: 'Start with Tarot Merchant, Planet Merchant, Overstock',
      apply(state) {
        ['tarot_merchant', 'planet_merchant', 'overstock'].forEach(v => {
          state.vouchers.push(v);
          const def = D.findVoucher(v);
          if (def) def.apply(state);
        });
      } },

    { id: 'painted_deck', name: 'Painted Deck', desc: '+2 hand size, -1 Joker slot',
      apply(state) { state.bonusHandSize = (state.bonusHandSize || 0) + 2; state.maxJokers = Math.max(1, state.maxJokers - 1); } },

    { id: 'anaglyph_deck', name: 'Anaglyph Deck', desc: 'Double Tag after each Boss Blind',
      apply(state) { state.anaglyphDeck = true; } },

    { id: 'plasma_deck', name: 'Plasma Deck', desc: 'Balance Chips and Mult; 2\u00d7 blind size',
      apply(state) { state.plasmaDeck = true; } },

    { id: 'erratic_deck', name: 'Erratic Deck', desc: 'All ranks and suits randomized',
      modifyDeck(deck) {
        deck.forEach(c => {
          c.rank = D.RANKS[Math.floor(Math.random() * D.RANKS.length)];
          c.suit = D.SUITS[Math.floor(Math.random() * 4)];
        });
        return deck;
      } },
  );

  // ================================================================
  // STAKES (8)
  // ================================================================

  D.stakes.push(
    { id: 'white',  name: 'White Stake',  color: '#e0e0e0', desc: 'Base difficulty', modifiers: [] },
    { id: 'red',    name: 'Red Stake',    color: '#dc3545', desc: '+No Small Blind reward', modifiers: ['no_small_reward'] },
    { id: 'green',  name: 'Green Stake',  color: '#28a745', desc: '+Faster score scaling', modifiers: ['no_small_reward', 'faster_scaling'] },
    { id: 'black',  name: 'Black Stake',  color: '#1a1a2e', desc: '+Eternal stickers', modifiers: ['no_small_reward', 'faster_scaling', 'eternal_chance'] },
    { id: 'blue',   name: 'Blue Stake',   color: '#2563eb', desc: '+-1 Discard', modifiers: ['no_small_reward', 'faster_scaling', 'eternal_chance', 'minus_discard'] },
    { id: 'purple', name: 'Purple Stake', color: '#7b2d8e', desc: '+Even faster scaling', modifiers: ['no_small_reward', 'faster_scaling', 'eternal_chance', 'minus_discard', 'fastest_scaling'] },
    { id: 'orange', name: 'Orange Stake', color: '#e67e22', desc: '+Perishable stickers', modifiers: ['no_small_reward', 'faster_scaling', 'eternal_chance', 'minus_discard', 'fastest_scaling', 'perishable_chance'] },
    { id: 'gold',   name: 'Gold Stake',   color: '#ffd700', desc: '+Rental stickers', modifiers: ['no_small_reward', 'faster_scaling', 'eternal_chance', 'minus_discard', 'fastest_scaling', 'perishable_chance', 'rental_chance'] },
  );

  // ================================================================
  // BOOSTER PACKS (5 types x 3 sizes = 15)
  // ================================================================

  const packTypes = [
    { type: 'standard',  label: 'Standard Pack',  contentType: 'playing_card' },
    { type: 'arcana',    label: 'Arcana Pack',     contentType: 'tarot' },
    { type: 'celestial', label: 'Celestial Pack',  contentType: 'planet' },
    { type: 'buffoon',   label: 'Buffoon Pack',    contentType: 'joker' },
    { type: 'spectral',  label: 'Spectral Pack',   contentType: 'spectral' },
  ];

  const sizes = [
    { size: 'normal', label: '',      cost: 4 },
    { size: 'jumbo',  label: 'Jumbo', cost: 6 },
    { size: 'mega',   label: 'Mega',  cost: 8 },
  ];

  // Cards shown / cards to choose per pack
  const packCards = {
    standard:  { normal: [3, 1], jumbo: [5, 1], mega: [5, 2] },
    arcana:    { normal: [3, 1], jumbo: [5, 1], mega: [5, 2] },
    celestial: { normal: [3, 1], jumbo: [5, 1], mega: [5, 2] },
    buffoon:   { normal: [2, 1], jumbo: [4, 1], mega: [4, 2] },
    spectral:  { normal: [2, 1], jumbo: [4, 1], mega: [4, 2] },
  };

  packTypes.forEach(pt => {
    sizes.forEach(sz => {
      const [shown, choose] = packCards[pt.type][sz.size];
      D.boosterPacks.push({
        id: pt.type + '_' + sz.size,
        name: (sz.label ? sz.label + ' ' : '') + pt.label,
        type: pt.type,
        size: sz.size,
        contentType: pt.contentType,
        cost: sz.cost,
        cardsShown: shown,
        cardsToChoose: choose,
      });
    });
  });

})();
