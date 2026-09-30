/* The Mantha Studio — mockup interactions
   Anirudha Talmale · Sept 2026 */
(function () {
  'use strict';

  /* ---------- sticky nav shadow ---------- */
  var nav = document.getElementById('nav');
  var onScroll = function () { nav.classList.toggle('stuck', window.scrollY > 8); };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- lightbox ----------
     Posts open here, on this website. A visitor with no Instagram account
     can still see every picture and caption; the Instagram link is optional. */
  var lb     = document.getElementById('lightbox');
  var lbImg  = document.getElementById('lb-img');
  var lbCap  = document.getElementById('lb-cap');
  var lbStat = document.getElementById('lb-stats');
  var closeB = lb.querySelector('.lb-close');
  var prevB  = lb.querySelector('.lb-prev');
  var nextB  = lb.querySelector('.lb-next');

  var tiles = [];
  var index = 0;
  var lastFocus = null;

  Array.prototype.forEach.call(document.querySelectorAll('.tile'), function (t) {
    tiles.push(t);
    t.addEventListener('click', function () { open(tiles.indexOf(t)); });
  });

  function show(i) {
    var t = tiles[i];
    index = i;
    lbImg.src = t.getAttribute('data-full');
    lbImg.alt = t.querySelector('img').alt;
    lbCap.textContent = t.getAttribute('data-cap') || '';
    lbStat.textContent = t.getAttribute('data-stats') || '';
  }

  function open(i) {
    lastFocus = document.activeElement;
    show(i);
    lb.hidden = false;
    document.body.classList.add('lb-open');
    closeB.focus();
  }

  function close() {
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
