// ============================================================
// BALATRO DATA - Constants, tables, and registries
// ============================================================
//
// This file creates the BalatroData namespace that all other
// balatro-*.js files populate. Must be loaded first.

const BalatroData = (() => {

  // ---- Card constants ----
  const SUITS = ['spades', 'hearts', 'diamonds', 'clubs'];
  const SUIT_SYMBOLS = { spades: '\u2660', hearts: '\u2665', diamonds: '\u2666', clubs: '\u2663' };
  const SUIT_COLORS = { spades: 'black', hearts: 'red', diamonds: 'red', clubs: 'black' };
  const RANKS = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
  const RANK_CHIPS = { '2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':10,'Q':10,'K':10,'A':11 };
  const RANK_ORDER = { '2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':11,'Q':12,'K':13,'A':14 };
  const FACE_RANKS = ['J','Q','K'];

  // ---- Hand types with per-type level scaling ----
  // Order matters: checked highest-first during evaluation
  const HAND_TYPES = [
    { name: 'Flush Five',      baseChips: 160, baseMult: 16, lvlChips: 50, lvlMult: 3, secret: true },
    { name: 'Flush House',     baseChips: 140, baseMult: 14, lvlChips: 40, lvlMult: 4, secret: true },
    { name: 'Five of a Kind',  baseChips: 120, baseMult: 12, lvlChips: 35, lvlMult: 3, secret: true },
    { name: 'Royal Flush',     baseChips: 100, baseMult: 8,  lvlChips: 40, lvlMult: 4 },
    { name: 'Straight Flush',  baseChips: 100, baseMult: 8,  lvlChips: 40, lvlMult: 4 },
    { name: 'Four of a Kind',  baseChips: 60,  baseMult: 7,  lvlChips: 30, lvlMult: 3 },
    { name: 'Full House',      baseChips: 40,  baseMult: 4,  lvlChips: 25, lvlMult: 2 },
    { name: 'Flush',           baseChips: 35,  baseMult: 4,  lvlChips: 15, lvlMult: 2 },
    { name: 'Straight',        baseChips: 30,  baseMult: 4,  lvlChips: 30, lvlMult: 3 },
    { name: 'Three of a Kind', baseChips: 30,  baseMult: 3,  lvlChips: 20, lvlMult: 2 },
    { name: 'Two Pair',        baseChips: 20,  baseMult: 2,  lvlChips: 20, lvlMult: 1 },
    { name: 'Pair',            baseChips: 10,  baseMult: 2,  lvlChips: 15, lvlMult: 1 },
    { name: 'High Card',       baseChips: 5,   baseMult: 1,  lvlChips: 10, lvlMult: 1 },
  ];

  // Quick lookup by name
  const HAND_TYPE_MAP = {};
  HAND_TYPES.forEach(h => { HAND_TYPE_MAP[h.name] = h; });

  // ---- Ante score targets ----
  const ANTE_BASES = [300, 800, 2000, 5000, 11000, 20000, 35000, 50000];
  const BLIND_SCORE_MULTS = [1, 1.5, 2]; // small, big, boss
  const BLIND_NAMES = ['Small Blind', 'Big Blind', 'Boss Blind'];
  const BLIND_REWARDS = [3, 4, 5]; // $ earned for small, big, boss

  // ---- Card enhancements ----
  const ENHANCEMENTS = {
    bonus:  { name: 'Bonus',  desc: '+30 Chips',               chips: 30 },
    mult:   { name: 'Mult',   desc: '+4 Mult',                 mult: 4 },
    wild:   { name: 'Wild',   desc: 'Counts as every suit' },
    glass:  { name: 'Glass',  desc: '\u00d72 Mult, 1/4 chance to destroy', xMult: 2, destroyChance: 0.25 },
    steel:  { name: 'Steel',  desc: '\u00d71.5 Mult while held in hand',   xMult: 1.5, heldEffect: true },
    stone:  { name: 'Stone',  desc: '+50 Chips, no rank/suit, always scores', chips: 50 },
    gold:   { name: 'Gold',   desc: '$3 if held at end of round', money: 3, heldEffect: true },
    lucky:  { name: 'Lucky',  desc: '1/5 for +20 Mult, 1/15 for $20', multChance: 0.2, multReward: 20, moneyChance: 1/15, moneyReward: 20 },
  };

  // ---- Card editions ----
  const EDITIONS = {
    base:        { name: 'Base' },
    foil:        { name: 'Foil',        desc: '+50 Chips',    chips: 50 },
    holographic: { name: 'Holographic', desc: '+10 Mult',     mult: 10 },
    polychrome:  { name: 'Polychrome',  desc: '\u00d71.5 Mult', xMult: 1.5 },
    negative:    { name: 'Negative',    desc: '+1 Joker slot', slots: 1 },
  };

  // ---- Card seals ----
  const SEALS = {
    gold:   { name: 'Gold',   desc: '$3 when scored',               money: 3 },
    red:    { name: 'Red',    desc: 'Retrigger this card',          retrigger: 1 },
    blue:   { name: 'Blue',   desc: 'Creates Planet if held at end' },
    purple: { name: 'Purple', desc: 'Creates Tarot when discarded' },
  };

  // ---- Game balance constants ----
  const GAME = {
    MAX_JOKERS: 5,
    HAND_SIZE: 8,
    MAX_HANDS: 4,
    MAX_DISCARDS: 3,
    MAX_PLAY: 5,
    MAX_CONSUMABLES: 2,
    REROLL_BASE_COST: 5,
    STARTING_MONEY: 4,
    INTEREST_RATE: 5,    // $1 per $5 held
    INTEREST_CAP: 5,     // max $5 interest (upgradeable)
    ANTE_COUNT: 8,
  };

  // ---- Rarity weights for shop joker generation ----
  const RARITY_WEIGHTS = { common: 70, uncommon: 25, rare: 4, legendary: 1 };

  // ---- Booster pack weights (shop spawn frequency) ----
  const PACK_WEIGHTS = {
    standard:  { normal: 4,   jumbo: 2,   mega: 0.5 },
    arcana:    { normal: 4,   jumbo: 2,   mega: 0.5 },
    celestial: { normal: 4,   jumbo: 2,   mega: 0.5 },
    buffoon:   { normal: 1.2, jumbo: 0.6, mega: 0.15 },
    spectral:  { normal: 0.6, jumbo: 0.3, mega: 0.07 },
  };

  // ---- Planet card mapping (hand type -> planet name) ----
  const PLANET_MAP = {
    'High Card':       { id: 'pluto',    name: 'Pluto' },
    'Pair':            { id: 'mercury',  name: 'Mercury' },
    'Two Pair':        { id: 'uranus',   name: 'Uranus' },
    'Three of a Kind': { id: 'venus',    name: 'Venus' },
    'Straight':        { id: 'saturn',   name: 'Saturn' },
    'Flush':           { id: 'jupiter',  name: 'Jupiter' },
    'Full House':      { id: 'earth',    name: 'Earth' },
    'Four of a Kind':  { id: 'mars',     name: 'Mars' },
    'Straight Flush':  { id: 'neptune',  name: 'Neptune' },
    'Five of a Kind':  { id: 'planet_x', name: 'Planet X' },
    'Flush House':     { id: 'ceres',    name: 'Ceres' },
    'Flush Five':      { id: 'eris',     name: 'Eris' },
  };

  // ---- Registries (populated by other files) ----
  const jokers = [];
  const tarots = [];
  const planets = [];
  const spectrals = [];
  const vouchers = [];
  const tags = [];
  const decks = [];
  const stakes = [];
  const bossBlinds = [];
  const boosterPacks = [];

  // ---- Helpers for other files ----
  function findJoker(id) { return jokers.find(j => j.id === id); }
  function findTarot(id) { return tarots.find(t => t.id === id); }
  function findPlanet(id) { return planets.find(p => p.id === id); }
  function findSpectral(id) { return spectrals.find(s => s.id === id); }
  function findVoucher(id) { return vouchers.find(v => v.id === id); }
  function findDeck(id) { return decks.find(d => d.id === id); }
  function findBoss(id) { return bossBlinds.find(b => b.id === id); }

  return {
    SUITS, SUIT_SYMBOLS, SUIT_COLORS, RANKS, RANK_CHIPS, RANK_ORDER, FACE_RANKS,
    HAND_TYPES, HAND_TYPE_MAP,
    ANTE_BASES, BLIND_SCORE_MULTS, BLIND_NAMES, BLIND_REWARDS,
    ENHANCEMENTS, EDITIONS, SEALS,
    GAME, RARITY_WEIGHTS, PACK_WEIGHTS, PLANET_MAP,
    // Registries
    jokers, tarots, planets, spectrals, vouchers, tags, decks, stakes, bossBlinds, boosterPacks,
    // Lookup helpers
    findJoker, findTarot, findPlanet, findSpectral, findVoucher, findDeck, findBoss,
  };
})();
