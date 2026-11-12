/* Glassmorphism folder cards (works navigation): entrance + pointer lean.
   Vanilla port of "Glassmorphism Folder Cards" by Kedhareswer Naidu (21st.dev, MIT). */
(function () {
  var grid = document.querySelector('.works-nav.gf-grid');
  if (!grid) return;
  var cards = Array.prototype.slice.call(grid.querySelectorAll('.gf'));
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function enterAll() { cards.forEach(function (c) { c.setAttribute('data-entered', ''); }); }

  if (reduce || !('IntersectionObserver' in window)) {
    enterAll();
  } else {
    grid.classList.add('gf-js'); // enables the "assemble" start state
    var revealed = window.SiteLoader ? window.SiteLoader.revealed : Promise.resolve();
    revealed.then(function () {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          io.unobserve(e.target);
          var i = cards.indexOf(e.target);
          setTimeout(function () { e.target.setAttribute('data-entered', ''); }, (i % 3) * 110 + Math.floor(i / 3) * 70);
        });
      }, { threshold: 0.2 });
      cards.forEach(function (c) { io.observe(c); });
    });
    // Never leave a folder invisible (e.g. printing, odd viewports).
    setTimeout(enterAll, 9000);
  }

  if (reduce) return;
  // Lean toward the pointer (mouse / pen only).
  cards.forEach(function (card) {
    var px = 0, py = 0, raf = 0;
    function write() { raf = 0; card.style.setProperty('--gf-px', px.toFixed(3)); card.style.setProperty('--gf-py', py.toFixed(3)); }
    card.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      var r = card.getBoundingClientRect();
      px = (e.clientX - r.left) / r.width * 2 - 1;
      py = (e.clientY - r.top) / r.height * 2 - 1;
      if (!raf) raf = requestAnimationFrame(write);
    });
    card.addEventListener('pointerleave', function () { px = 0; py = 0; if (!raf) raf = requestAnimationFrame(write); });
  });
})();
