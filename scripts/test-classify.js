#!/usr/bin/env node
/* Checks the food/art sorting rule. The "real captions" below are copied
 * verbatim from Suvarna's feed, including the ones that used to be misfiled.
 * Run with: node scripts/test-classify.js */
'use strict';

const { classify, title } = require('./sync-instagram.js');

const cases = [
  // --- the tags always win, even against a contradictory caption ---
  ['Mandala in ink #ManthaArt', 'art'],
  ['Sunday lunch #ManthaFood', 'food'],
  ['Recipe for the sauce in this painting #ManthaArt', 'art'],
  ['Plated like a work of art #ManthaFood', 'food'],
  ['#manthaart', 'art'],
  ['#MANTHAFOOD', 'food'],

  // --- real ART captions from her feed ---
  ['Nine colorful butterflies, one happy wall.🦋✨ Dot work on wooden butterflies in acrylic', 'art'],
  ['Another pair of 30 cm dotwork masks added to the collection. 🎨', 'art'],
  ['Little moments, big love! 🐘❤️ Tiny 13x13 cm acrylic painting on wood.', 'art'],
  ['Simple Bird of Paradise painting on a 70/100 cm canvas in acrylics', 'art'],
  ['Divine Strength: Hanuman in Acrylic on Canvas 40/50 cms…', 'art'],
  ['#charcoalsketch#apple#', 'art'],
  ['#keychains#resin#', 'art'],
  ['#bookmarks# resin#', 'art'],
  ['Small Pooja stools with kolam', 'art'],
  ['#mixed media#kartikeya#80/80cms#', 'art'],

  // --- real FOOD captions from her feed ---
  ['Black Gram Vada (Prasad Style)\n\nIngredients\n\n• 500 g black gram\n• 2 tsp salt', 'food'],
  ['🌱 Coriander Rice (Khotimeera Annam)\n\nIngredients\n• 1 tsp cumin', 'food'],
  ['Ulli Kadala Pachadi (Spring Onion Chutney) is a delightful, simple chutney', 'food'],
  ['Masala Cashew Recipe', 'food'],
  ['Perugu Vankaya (South Indian-style Dahi Baingan) A deliciously creamy curry', 'food'],

  // --- negative controls: "art" hiding inside another word ---
  // If these come back "art", the whole-word rule has broken.
  ['Start to finish, this recipe is easy. Ingredients: 2 tsp salt', 'food'],
  ['A hearty breakfast. Ingredients below, 100 grams oats', 'food'],
  ['Party food — recipe and ingredients below, 1 tbsp ghee', 'food'],
  // These three carry only ONE food signal each, so a stray "art" inside
  // "Started" / "hearty" / "Party" would be enough to tip them. They are the
  // controls that actually bite if the word boundary is ever dropped.
  ['Started the dough last night', 'food'],
  ['A hearty chutney', 'food'],
  ['Party time, sweet treats', 'food'],

  // --- genuinely ambiguous: must be handed to a human, never guessed ---
  ['Sunday', null],
  ['', null],
  [null, null]
];

let failed = 0;
for (const [caption, expected] of cases) {
  const got = classify(caption);
  if (got !== expected) {
    failed++;
    console.log(`FAIL  ${JSON.stringify(String(caption).slice(0, 60))}\n      expected ${expected}, got ${got}`);
  }
}

/* the tile shows the first line only */
const titleCases = [
  ['Black Gram Vada (Prasad Style)\n\nIngredients\n• 500 g', 'Black Gram Vada (Prasad Style)'],
  ['\n\n  Spaced out  \nsecond line', 'Spaced out'],
  ['', ''],
  [null, '']
];
for (const [caption, expected] of titleCases) {
  const got = title(caption);
  if (got !== expected) {
    failed++;
    console.log(`FAIL title  ${JSON.stringify(caption)}\n      expected ${JSON.stringify(expected)}, got ${JSON.stringify(got)}`);
  }
}

const total = cases.length + titleCases.length;
console.log(`${total - failed}/${total} passed`);
if (failed) {
  console.error(`${failed} FAILED`);
  process.exit(1);
}

/* ---------- which picture goes at the top ---------- */
const { pickHero } = require('./sync-instagram.js');

const feed = [
  { id: '1', type: 'VIDEO', src: 'v1.mp4' },
  { id: '2', type: 'IMAGE', src: 'i2.jpg' },
  { id: '3', type: 'IMAGE', src: 'i3.jpg' }
];

const heroCases = [
  [[feed, null], '2', 'no pin: newest still photograph, not the newer reel'],
  [[feed, '3'], '3', 'a pinned post wins over the newest'],
  [[feed, 3], '3', 'a numeric id still matches'],
  [[feed, '999'], '2', 'a pin that is not in the feed falls back, it does not blank'],
  [[[{ id: '9', type: 'VIDEO', src: 'v.mp4' }], null], '9', 'reel cover when there are no photographs'],
  [[[], null], null, 'an empty feed picks nothing rather than crashing']
];

let heroFailed = 0;
for (const [[posts, pin], expected, what] of heroCases) {
  const got = pickHero(posts, pin);
  const id = got ? got.id : null;
  if (id !== expected) {
    heroFailed++;
    console.log(`FAIL hero (${what})\n      expected ${expected}, got ${id}`);
  }
}
console.log(`${heroCases.length - heroFailed}/${heroCases.length} hero checks passed`);
if (heroFailed) { process.exit(1); }
