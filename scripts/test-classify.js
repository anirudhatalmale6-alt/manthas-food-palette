#!/usr/bin/env node
/* Checks the food/art sorting rule against captions that must NOT be
 * misfiled. Run with: node scripts/test-classify.js */
'use strict';

const { classify } = require('./sync-instagram.js');

const cases = [
  // --- the real tags the client uses, initial caps (confirmed 30 Sep 2026) ---
  ['Mandala in ink #ManthaArt', 'art'],
  ['Sunday lunch #ManthaFood', 'food'],
  // the tag must win even when the caption reads like the other section
  ['Recipe for the sauce in this painting #ManthaArt', 'art'],
  ['Plated like a work of art #ManthaFood', 'food'],
  // Instagram tags are case-insensitive, so these must behave identically
  ['#manthaart', 'art'],
  ['#MANTHAFOOD', 'food'],
  // "#ManthaArt" must not also trip the bare-word "art" rule
  ['#ManthaArt', 'art'],

  // --- must be ART ---
  ['Ink mandala, three evenings of small circles. #manthaart', 'art'],
  ['New art on paper today', 'art'],
  ['Some ART for the wall', 'art'],
  ['line art, ink only', 'art'],
  ['#art #mandala', 'art'],

  // --- must be FOOD ---
  ['Full recipe in the caption below', 'food'],
  ['Two recipes this week #manthafood', 'food'],
  ['RECIPE: paneer tikka', 'food'],

  // --- negative controls: the word "art" hiding inside another word ---
  // If any of these come back "art", the whole-word rule has broken.
  ['Start to finish, the recipe is easy', 'food'],
  ['A hearty breakfast recipe', 'food'],
  ['Party food, recipe below', 'food'],
  ['Smart little dessert, recipe soon', 'food'],
  ['Started the dough last night', null],
  ['My heart is full', null],

  // --- genuinely ambiguous: must be handed to a human, not guessed ---
  ['Food art — recipe below', null],
  ['Sunday', null],
  ['', null],
  [null, null]
];

let failed = 0;
for (const [caption, expected] of cases) {
  const got = classify(caption);
  const ok = got === expected;
  if (!ok) {
    failed++;
    console.log(`FAIL  ${JSON.stringify(caption)}\n      expected ${expected}, got ${got}`);
  }
}

console.log(`${cases.length - failed}/${cases.length} passed`);
if (failed) {
  console.error(`${failed} FAILED`);
  process.exit(1);
}
