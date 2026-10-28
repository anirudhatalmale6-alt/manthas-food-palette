'use strict';
/* node scripts/test-token-store.js — checks the encrypted token store. */

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const s = require('./token-store');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tokstore-'));
const file = path.join(dir, 'token.json');
const KEY = crypto.randomBytes(32).toString('base64');
const OTHER = crypto.randomBytes(32).toString('base64');
const ROOT = 'IGAA' + 'r'.repeat(60);
const FRESH = 'IGAA' + 'f'.repeat(60);
const DAY = 86400000;
let passed = 0;
const check = (name, fn) => { fn(); passed++; };

check('round trip', () => {
  const k = s.keyFrom(KEY);
  assert.strictEqual(s.decrypt(k, s.encrypt(k, FRESH)), FRESH);
});
check('wrong key is refused', () => {
  const c = s.encrypt(s.keyFrom(KEY), FRESH);
  assert.throws(() => s.decrypt(s.keyFrom(OTHER), c));
});
check('tampered ciphertext is refused', () => {
  const buf = Buffer.from(s.encrypt(s.keyFrom(KEY), FRESH), 'base64');
  buf[buf.length - 1] ^= 1;
  assert.throws(() => s.decrypt(s.keyFrom(KEY), buf.toString('base64')));
});
check('no key: use IG_TOKEN, store nothing', () => {
  const p = s.choose({ rootToken: ROOT, keyB64: '', file });
  assert.strictEqual(p.token, ROOT); assert.strictEqual(p.due, false); assert.strictEqual(p.key, null);
});
check('a key of the wrong length counts as no key', () => {
  const p = s.choose({ rootToken: ROOT, keyB64: Buffer.alloc(16).toString('base64'), file });
  assert.strictEqual(p.key, null);
});
check('nothing stored: start from IG_TOKEN and store', () => {
  const p = s.choose({ rootToken: ROOT, keyB64: KEY, file });
  assert.strictEqual(p.token, ROOT); assert.strictEqual(p.due, true);
});

const t0 = Date.parse('2026-11-01T00:00:00Z');
const first = s.choose({ rootToken: ROOT, keyB64: KEY, file });
s.save({ key: first.key, seed: first.seed, token: FRESH, file, now: t0 });

check('the file never holds the token in plain text', () => {
  const raw = fs.readFileSync(file, 'utf8');
  assert.ok(!raw.includes(FRESH) && !raw.includes(ROOT) && !raw.includes('IGAA'));
});
check('stored and recent: use it, nothing to do', () => {
  const p = s.choose({ rootToken: ROOT, keyB64: KEY, file, now: t0 + 2 * DAY });
  assert.strictEqual(p.token, FRESH); assert.strictEqual(p.due, false);
});
check('stored a week ago: use it, and refresh', () => {
  const p = s.choose({ rootToken: ROOT, keyB64: KEY, file, now: t0 + s.SAVE_EVERY_DAYS * DAY });
  assert.strictEqual(p.token, FRESH); assert.strictEqual(p.due, true);
});
check('IG_TOKEN replaced by hand: the new one wins', () => {
  const p = s.choose({ rootToken: 'IGAA' + 'n'.repeat(60), keyB64: KEY, file, now: t0 + DAY });
  assert.strictEqual(p.token, 'IGAA' + 'n'.repeat(60)); assert.strictEqual(p.due, true);
});
check('TOKEN_KEY changed: fall back to IG_TOKEN', () => {
  const p = s.choose({ rootToken: ROOT, keyB64: OTHER, file, now: t0 + DAY });
  assert.strictEqual(p.token, ROOT); assert.strictEqual(p.due, true);
});
check('unreadable store: fall back to IG_TOKEN', () => {
  const bad = JSON.parse(fs.readFileSync(file, 'utf8')); bad.data = 'AAAA';
  const f2 = path.join(dir, 'bad.json'); fs.writeFileSync(f2, JSON.stringify(bad));
  const p = s.choose({ rootToken: ROOT, keyB64: KEY, file: f2, now: t0 + DAY });
  assert.strictEqual(p.token, ROOT); assert.strictEqual(p.due, true);
});
check('missing date: treat as due', () => {
  const bad = JSON.parse(fs.readFileSync(file, 'utf8')); delete bad.savedAt;
  const f3 = path.join(dir, 'nodate.json'); fs.writeFileSync(f3, JSON.stringify(bad));
  const p = s.choose({ rootToken: ROOT, keyB64: KEY, file: f3, now: t0 + DAY });
  assert.strictEqual(p.token, FRESH); assert.strictEqual(p.due, true);
});

fs.rmSync(dir, { recursive: true, force: true });
console.log(`${passed}/13 token-store checks passed`);
