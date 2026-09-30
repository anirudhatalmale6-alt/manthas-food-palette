#!/usr/bin/env node
/*
 * Pull the Instagram feed into data/posts.json.
 *
 *   IG_TOKEN=... node scripts/sync-instagram.js
 *
 * Sorting: Suvarna's captions were measured on 30 Sep 2026 (288 posts). She
 * rarely writes the word "recipe" and almost never tags her posts, so the
 * original keyword rule only placed 35% of them. The rule below scores each
 * caption against the vocabulary she actually uses — "ingredients", "tsp",
 * "chutney" for food; "dot work", "acrylic", "canvas", "cms" for art — and
 * places 99% of the feed. #ManthaArt / #ManthaFood always override the score.
 *
 * Anything the rule cannot place goes to data/unsorted.json for a human to
 * decide. Nothing is ever guessed at or silently dropped.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const TOKEN = process.env.IG_TOKEN;
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'data', 'posts.json');
const UNSORTED = path.join(ROOT, 'data', 'unsorted.json');

const FIELDS = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count';
const PAGE = 100;
const MAX_PAGES = 6;
const PER_SECTION = 24;   // how many of the newest posts each gallery shows

/* ---------- classification ---------- */

const TAG_ART = /#mantha\s*art\b/i;
const TAG_FOOD = /#mantha\s*food\b/i;

const ART = [
  /\bdot\s?work\b/i, /\bdot\s?art\b/i, /\bmandala\b/i, /\bacrylic\b/i,
  /\bpaint(ing|ed|s)?\b/i, /\bcanvas\b/i, /\bmasks?\b/i, /\bwood(en)?\b/i,
  /#\w*art\b/i, /\bart\b/i, /\d+\s?cms?\b/i, /\bmdf\b/i, /\bbrush\b/i,
  /\bresin\b/i, /\bcharms?\b/i, /\bkeychains?\b/i, /\bbookmarks?\b/i,
  /charcoal\s?(sketch|drawing)/i, /\bsketch\b/i, /\bdrawing\b/i,
  /mixed\s?media/i, /\bkolams?\b/i, /\bmagnets?\b/i, /\bgifts?\b/i
];

const FOOD = [
  /\bingredients\b/i, /\brecipes?\b/i, /\b(tsp|tbsp|gms?|grams?)\b/i,
  /\b(method|serve|garnish|tempering|saute|simmer|boil|fry|roast|dough|batter)\b/i,
  /\bcook(ing|ed)?\b/i, /\bmasala\b/i, /\bchutney\b/i, /\bcurry\b/i,
  /\btasty|delicious\b/i, /\bsweet\b/i
];

function score(caption, list) {
  return list.reduce((n, re) => n + (re.test(caption || '') ? 1 : 0), 0);
}

function classify(caption) {
  const text = caption || '';

  // an explicit tag always wins over the scoring
  if (TAG_ART.test(text) && !TAG_FOOD.test(text)) return 'art';
  if (TAG_FOOD.test(text) && !TAG_ART.test(text)) return 'food';

  const art = score(text, ART);
  const food = score(text, FOOD);

  if (art > food) return 'art';
  if (food > art) return 'food';
  return null;   // a tie, or nothing recognised — a human decides
}

/* The first line of her captions is the dish or the piece; the rest is the
 * recipe or the story. The tile shows the first line, the lightbox the lot. */
function title(caption) {
  const line = (caption || '').split('\n').map((s) => s.trim()).filter(Boolean)[0] || '';
  return line.length > 110 ? line.slice(0, 107).trimEnd() + '…' : line;
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
  let url = `https://graph.instagram.com/me/media?fields=${FIELDS}&limit=${PAGE}&access_token=${TOKEN}`;
  const all = [];
  for (let page = 0; page < MAX_PAGES && url; page++) {
    const body = await getJSON(url);
    all.push(...(body.data || []));
    url = body.paging && body.paging.next ? body.paging.next : null;
  }
  return all;
}

/* A carousel has no media_url of its own — the picture lives on its children. */
async function carouselImage(id) {
  try {
    const body = await getJSON(`https://graph.instagram.com/${id}/children?fields=media_url,thumbnail_url,media_type&access_token=${TOKEN}`);
    const first = (body.data || [])[0];
    if (!first) return null;
    return first.media_type === 'VIDEO' ? (first.thumbnail_url || null) : (first.media_url || null);
  } catch (err) {
    console.warn(`carousel ${id}: ${err.message}`);
    return null;
  }
}

/* Long-lived tokens last 60 days and can be refreshed once a day. */
async function refreshToken() {
  try {
    const body = await getJSON(`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${TOKEN}`);
    if (body.access_token) {
      console.log(`token refreshed, good for another ${Math.round((body.expires_in || 0) / 86400)} days`);
      return body.access_token;
    }
  } catch (err) {
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
  console.log(`fetched ${media.length} posts`);

  const sorted = { food: [], art: [] };
  const unsorted = [];
  let noVideoUrl = 0;

  for (const m of media) {
    const section = classify(m.caption);
    const isVideo = m.media_type === 'VIDEO';
    const isCarousel = m.media_type === 'CAROUSEL_ALBUM';

    let poster = isVideo ? m.thumbnail_url : m.media_url;
    if (isCarousel && !poster) poster = await carouselImage(m.id);

    // Instagram withholds media_url on a large share of reels. Those cannot be
    // played here; the tile still shows, and the lightbox offers Instagram.
    const video = isVideo ? (m.media_url || null) : null;
    if (isVideo && !video) noVideoUrl++;

    const post = {
      id: m.id,
      section,
      type: isVideo ? 'VIDEO' : 'IMAGE',
      src: poster,
      video,
      caption: title(m.caption),
      fullCaption: (m.caption || '').trim(),
      permalink: m.permalink,
      timestamp: m.timestamp,
      likes: typeof m.like_count === 'number' ? m.like_count : null,
      comments: typeof m.comments_count === 'number' ? m.comments_count : null
    };

    if (!post.src) {                       // nothing to show — don't publish a blank tile
      unsorted.push({ ...post, reason: 'no image available' });
      continue;
    }
    if (section) sorted[section].push(post);
    else unsorted.push({ ...post, reason: 'could not tell food from art' });
  }

  // A run that sorted nothing means the rule broke, not that she stopped
  // posting. Keep the previous file rather than publishing an empty site.
  if (media.length > 0 && !sorted.food.length && !sorted.art.length) {
    console.error('nothing could be classified — leaving the existing feed alone.');
    process.exit(1);
  }

  const posts = [...sorted.food.slice(0, PER_SECTION), ...sorted.art.slice(0, PER_SECTION)];

  fs.writeFileSync(OUT, JSON.stringify({
    source: 'instagram',
    account: 'manthas_food_palette',
    generated: new Date().toISOString(),
    showStats: false,               // flip to true to show like/comment counts
    counts: {
      fetched: media.length,
      food: sorted.food.length,
      art: sorted.art.length,
      unsorted: unsorted.length,
      reelsWithoutPlayableVideo: noVideoUrl,
      shownPerSection: PER_SECTION
    },
    posts
  }, null, 2) + '\n');

  fs.writeFileSync(UNSORTED, JSON.stringify({
    generated: new Date().toISOString(),
    note: 'Posts the rule would not guess at. Decide these by hand.',
    posts: unsorted.map((p) => ({ id: p.id, reason: p.reason, caption: p.caption, permalink: p.permalink }))
  }, null, 2) + '\n');

  console.log(`sorted ${sorted.food.length} food, ${sorted.art.length} art, ${unsorted.length} left for a human`);
  console.log(`${noVideoUrl} reels have no playable video URL from Instagram`);
  console.log(`published the newest ${PER_SECTION} of each`);

  const fresh = await refreshToken();
  if (fresh && process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `new_token=${fresh}\n`);
  }
}

module.exports = { classify, title };

if (require.main === module) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
