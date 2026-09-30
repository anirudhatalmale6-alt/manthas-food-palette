/* The Mantha Studio — site behaviour
   Anirudha Talmale · Sept 2026

   The galleries in index.html are a working fallback. If data/posts.json is
   reachable (it is rewritten by the Instagram sync) the grids are rebuilt from
   it, so the site keeps working even with JavaScript switched off. */
(function () {
  'use strict';

  /* ---------- sticky nav shadow ---------- */
  var nav = document.getElementById('nav');
  var onScroll = function () { nav.classList.toggle('stuck', window.scrollY > 8); };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- lightbox ----------
     Posts open here, on this website. A visitor with no Instagram account
     still sees the picture, the video and the caption. */
  var lb     = document.getElementById('lightbox');
  var lbImg  = document.getElementById('lb-img');
  var lbVid  = document.getElementById('lb-video');
  var lbCap  = document.getElementById('lb-cap');
  var lbStat = document.getElementById('lb-stats');
  var lbLink = document.getElementById('lb-link');
  var closeB = lb.querySelector('.lb-close');
  var prevB  = lb.querySelector('.lb-prev');
  var nextB  = lb.querySelector('.lb-next');

  var tiles = [];
  var index = 0;
  var lastFocus = null;

  function collectTiles() {
    tiles = Array.prototype.slice.call(document.querySelectorAll('.tile'));
    tiles.forEach(function (t, i) {
      if (t.dataset.bound) { return; }
      t.dataset.bound = '1';
      t.addEventListener('click', function () { open(tiles.indexOf(t)); });
    });
  }

  function show(i) {
    var t = tiles[i];
    if (!t) { return; }
    index = i;

    var video = t.getAttribute('data-video');
    if (video) {
      lbVid.src = video;
      lbVid.poster = t.getAttribute('data-full') || '';
      lbVid.hidden = false;
      lbImg.hidden = true;
    } else {
      lbVid.pause();
      lbVid.removeAttribute('src');
      lbVid.hidden = true;
      lbImg.src = t.getAttribute('data-full');
      lbImg.alt = t.querySelector('img') ? t.querySelector('img').alt : '';
      lbImg.hidden = false;
    }

    lbCap.textContent  = t.getAttribute('data-full-cap') || t.getAttribute('data-cap') || '';
    lbStat.textContent = t.getAttribute('data-stats') || '';
    lbLink.href = t.getAttribute('data-link') || 'https://www.instagram.com/manthas_food_palette/';
    // Instagram withholds the video file on a lot of reels. Say what the link
    // does rather than pretending the post will play here.
    lbLink.textContent = (t.classList.contains('is-video') && !video)
      ? 'Watch this reel on Instagram →'
      : 'Open this post on Instagram →';
  }

  function open(i) {
    lastFocus = document.activeElement;
    show(i);
    lb.hidden = false;
    document.body.classList.add('lb-open');
    closeB.focus();
  }

  function close() {
    lbVid.pause();
    lb.hidden = true;
    document.body.classList.remove('lb-open');
    if (lastFocus) { lastFocus.focus(); }
  }

  function step(d) { show((index + d + tiles.length) % tiles.length); }

  closeB.addEventListener('click', close);
  prevB.addEventListener('click', function () { step(-1); });
  nextB.addEventListener('click', function () { step(1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) { close(); } });
  document.addEventListener('keydown', function (e) {
    if (lb.hidden) { return; }
    if (e.key === 'Escape')     { close(); }
    if (e.key === 'ArrowLeft')  { step(-1); }
    if (e.key === 'ArrowRight') { step(1); }
  });

  collectTiles();

  /* ---------- build the grids from the synced feed ---------- */
  function esc(s) {
    return String(s === null || s === undefined ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  var SHOW_STATS = false;

  function stats(post) {
    if (!SHOW_STATS || typeof post.likes !== 'number') { return ''; }
    var s = post.likes.toLocaleString() + ' likes';
    if (typeof post.comments === 'number') { s += ' · ' + post.comments.toLocaleString() + ' comments'; }
    return s;
  }

  function tileHTML(post) {
    var poster = post.src;
    var isVideo = post.type === 'VIDEO';
    return '<button class="tile' + (isVideo ? ' is-video' : '') + '" type="button"' +
      ' data-full="' + esc(poster) + '"' +
      (post.video ? ' data-video="' + esc(post.video) + '"' : '') +
      ' data-cap="' + esc(post.caption) + '"' +
      ' data-full-cap="' + esc(post.fullCaption || post.caption) + '"' +
      ' data-stats="' + esc(stats(post)) + '"' +
      ' data-link="' + esc(post.permalink) + '">' +
      '<img src="' + esc(poster) + '" alt="' + esc(post.caption).slice(0, 120) + '" loading="lazy" width="700" height="700">' +
      (isVideo ? '<span class="tile-play" aria-hidden="true"></span>' : '') +
      '<span class="tile-body"><span class="tile-cap">' + esc(post.caption) + '</span>' +
      '<span class="tile-stats">' + esc(stats(post)) + '</span></span>' +
      '</button>';
  }

  function render(section, posts) {
    var grid = document.getElementById('grid-' + section);
    if (!grid) { return; }
    var mine = posts.filter(function (p) { return p.section === section; });
    if (!mine.length) { return; }          // keep the fallback rather than empty the grid
    grid.innerHTML = mine.map(tileHTML).join('');
  }

  fetch('data/posts.json', { cache: 'no-cache' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      if (!data || !Array.isArray(data.posts) || !data.posts.length) { return; }
      SHOW_STATS = data.showStats === true;
      render('food', data.posts);
      render('art', data.posts);
      collectTiles();
    })
    .catch(function () { /* keep the fallback grids exactly as they are */ });

  /* ---------- forms ----------
     Neither form is connected to a mailbox yet, so say so rather than
     pretend the message was sent. */
  function wire(formId, noteId, msg) {
    var form = document.getElementById(formId);
    var note = document.getElementById(noteId);
    if (!form) { return; }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        note.className = 'form-note';
        note.textContent = 'Please fill in the required fields.';
        return;
      }
      note.className = 'form-note ok';
      note.textContent = msg;
    });
  }
  wire('contact-form', 'form-note', 'This is a design mockup — the form is not connected to a mailbox yet.');
  wire('astro-form', 'astro-note', 'This is a design mockup — the form is not connected to a mailbox yet.');
})();
