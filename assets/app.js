/* Mantha's Food Palette — mockup interactions */
(function () {
  'use strict';

  // shadow under the nav once the page scrolls
  var nav = document.getElementById('nav');
  var onScroll = function () {
    nav.classList.toggle('stuck', window.scrollY > 8);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // the form is not wired to a mailbox yet — say so rather than pretend it sent
  var form = document.getElementById('contact-form');
  var note = document.getElementById('form-note');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.checkValidity()) {
      note.className = 'form-note';
      note.textContent = 'Please fill in your name, email and message.';
      return;
    }
    note.className = 'form-note ok';
    note.textContent = 'This is a design mockup — the form is not connected to a mailbox yet.';
  });
})();
