#!/usr/bin/env node
/* Checks the food/art sorting rule against captions that must NOT be
 * misfiled. Run with: node scripts/test-classify.js */
'use strict';

const { classify } = require('./sync-instagram.js');

const cases = [
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
