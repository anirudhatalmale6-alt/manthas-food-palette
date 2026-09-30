#!/usr/bin/env node
/*
 * Pull the Instagram feed into data/posts.json.
 *
 *   node scripts/sync-instagram.js
 *
 * Needs one environment variable:
 *   IG_TOKEN   a long-lived Instagram access token for @manthas_food_palette
 *
 * Sorting rule agreed with the client (30 Sep 2026): a caption containing the
 * whole word "art" is art; a caption containing "recipe" is food. "art" is
 * matched as a WHOLE WORD on purpose — "start", "heart" and "party" must not
 * drag a dish into the art gallery. Hashtags (#manthaart / #manthafood) win
 * over plain words when both appear. Anything we cannot place confidently is
 * written to data/unsorted.json for a human to look at, never silently binned.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const TOKEN = process.env.IG_TOKEN;
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'data', 'posts.json');
const UNSORTED = path.join(ROOT, 'data', 'unsorted.json');

const FIELDS = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp';
const LIMIT = 48;

/* ---------- classification ---------- */

const RE_TAG_ART = /#mantha\s*art\b/i;
const RE_TAG_FOOD = /#mantha\s*food\b/i;
// \b would treat "#art" as a word boundary too, which is what we want here.
const RE_WORD_ART = /\bart\b/i;
const RE_WORD_FOOD = /\brecipes?\b/i;

function classify(caption) {
  const text = caption || '';

  if (RE_TAG_ART.test(text) && !RE_TAG_FOOD.test(text)) return 'art';
  if (RE_TAG_FOOD.test(text) && !RE_TAG_ART.test(text)) return 'food';

  const art = RE_WORD_ART.test(text);
  const food = RE_WORD_FOOD.test(text);

  if (art && !food) return 'art';
  if (food && !art) return 'food';
  return null; // both, or neither — a human decides
}

/* ---------- fetching ---------- */

async function getJSON(url) {
  const res = await fetch(url);
  const body = await res.json();
  if (!res.ok) {
    const msg = (body && body.error && body.error.message) || res.statusText;
    throw new Error(`Instagram API ${res.status}: ${msg}`);
  }
  return body;
}

async function fetchMedia() {
  const url = `https://graph.instagram.com/me/media?fields=${FIELDS}&limit=${LIMIT}&access_token=${TOKEN}`;
  const body = await getJSON(url);
  return Array.isArray(body.data) ? body.data : [];
}

/* Long-lived tokens last 60 days and can be refreshed once they are 24h old.
 * The scheduled job calls this every run so the connection never lapses. */
async function refreshToken() {
  const url = `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${TOKEN}`;
  try {
    const body = await getJSON(url);
    if (body.access_token) {
      console.log(`token refreshed, valid for ${Math.round((body.expires_in || 0) / 86400)} more days`);
      return body.access_token;
    }
  } catch (err) {
    // A refresh failure must not stop the feed from updating.
    console.warn(`token refresh skipped: ${err.message}`);
  }
  return null;
}

/* ---------- main ---------- */

async function main() {
  if (!TOKEN) {
    console.error('IG_TOKEN is not set — refusing to overwrite data/posts.json.');
    process.exit(1);
  }

  const media = await fetchMedia();
  console.log(`fetched ${media.length} posts from Instagram`);

  const posts = [];
  const unsorted = [];

  for (const m of media) {
    const section = classify(m.caption);
    const isVideo = m.media_type === 'VIDEO';

    const post = {
      id: m.id,
      section,
      type: isVideo ? 'VIDEO' : 'IMAGE',
      src: m.media_url,
      poster: isVideo ? (m.thumbnail_url || null) : m.media_url,
      caption: (m.caption || '').trim(),
      permalink: m.permalink,
      timestamp: m.timestamp
    };

    if (section) {
      posts.push(post);
    } else {
      unsorted.push(post);
    }
  }

  const counts = {
    food: posts.filter((p) => p.section === 'food').length,
    art: posts.filter((p) => p.section === 'art').length,
    unsorted: unsorted.length
  };

  // A run that classified nothing means the rule broke, not that she stopped
  // posting. Keep the previous file rather than publishing an empty site.
  if (media.length > 0 && counts.food === 0 && counts.art === 0) {
    console.error('every post came back unsorted — leaving the existing file alone.');
    fs.writeFileSync(UNSORTED, JSON.stringify({ generated: new Date().toISOString(), posts: unsorted }, null, 2));
    process.exit(1);
  }

  fs.writeFileSync(OUT, JSON.stringify({
    source: 'instagram',
    account: 'manthas_food_palette',
    generated: new Date().toISOString(),
    counts,
    posts
  }, null, 2) + '\n');

  fs.writeFileSync(UNSORTED, JSON.stringify({
    generated: new Date().toISOString(),
    note: 'Captions containing both "art" and "recipe", or neither. Decide these by hand.',
    posts: unsorted
  }, null, 2) + '\n');

  console.log(`written: ${counts.food} food, ${counts.art} art, ${counts.unsorted} needing a decision`);

  const fresh = await refreshToken();
  if (fresh && process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `new_token=${fresh}\n`);
  }
}

module.exports = { classify };

if (require.main === module) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
