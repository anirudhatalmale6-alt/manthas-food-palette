'use strict';

/*
 * Keeps the Instagram connection alive without anyone touching it.
 *
 * A long-lived Instagram token lasts 60 days. Refreshing one hands back a NEW
 * token string; the old one is not extended. So the refreshed token has to be
 * kept somewhere. GitHub's built-in workflow token can't write repository
 * secrets, and a personal access token would put somebody's credential inside
 * the automation.
 *
 * Instead the refreshed token is encrypted (AES-256-GCM) with TOKEN_KEY, a
 * repository secret, and committed as data/token.json. The repository is
 * public, so that file holds ciphertext only - useless without TOKEN_KEY.
 *
 * Replacing IG_TOKEN by hand always wins. The file records a keyed fingerprint
 * of the IG_TOKEN it descends from; a different IG_TOKEN starts a new chain.
 */

const crypto = require('crypto');
const fs = require('fs');

const SAVE_EVERY_DAYS = 7;   // well inside 60, and refreshes need a token 24h+ old

function keyFrom(b64) {
  if (!b64) return null;
  const k = Buffer.from(b64, 'base64');
  return k.length === 32 ? k : null;
}

function seedOf(key, rootToken) {
  return crypto.createHmac('sha256', key).update(rootToken).digest('base64url').slice(0, 22);
}

function encrypt(key, plain) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([c.update(plain, 'utf8'), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), ct]).toString('base64');
}

function decrypt(key, b64) {
  const buf = Buffer.from(b64, 'base64');
  const d = crypto.createDecipheriv('aes-256-gcm', key, buf.subarray(0, 12));
  d.setAuthTag(buf.subarray(12, 28));
  return Buffer.concat([d.update(buf.subarray(28)), d.final()]).toString('utf8');
}

/* Which token to use this run, and whether it is time to store a fresh one. */
function choose({ rootToken, keyB64, file, now = Date.now() }) {
  const key = keyFrom(keyB64);
  if (!key) return { token: rootToken, key: null, due: false, reason: 'no TOKEN_KEY - using IG_TOKEN, nothing stored' };

  const seed = seedOf(key, rootToken);
  let stored = null;
  try { stored = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (err) { /* none yet */ }

  if (!stored || stored.seed !== seed) {
    const why = stored ? 'IG_TOKEN was replaced - starting from it' : 'nothing stored yet - starting from IG_TOKEN';
    return { token: rootToken, key, seed, due: true, reason: why };
  }
  try {
    const token = decrypt(key, stored.data);
    const age = (now - Date.parse(stored.savedAt)) / 86400000;
    return { token, key, seed, due: !(age < SAVE_EVERY_DAYS), reason: `using the stored token, saved ${age.toFixed(1)} days ago` };
  } catch (err) {
    return { token: rootToken, key, seed, due: true, reason: 'stored token unreadable - starting from IG_TOKEN' };
  }
}

function save({ key, seed, token, file, now = Date.now() }) {
  const body = {
    note: 'Encrypted Instagram token, written by the sync. Unreadable without the TOKEN_KEY secret. Do not edit.',
    seed,
    savedAt: new Date(now).toISOString(),
    data: encrypt(key, token)
  };
  fs.writeFileSync(file, JSON.stringify(body, null, 2) + '\n');
}

module.exports = { choose, save, encrypt, decrypt, seedOf, keyFrom, SAVE_EVERY_DAYS };
