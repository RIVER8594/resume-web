// Play inline videos only while they are on screen; pause when scrolled away.
(function () {
  var vids = document.querySelectorAll('video[data-autoplay]');
  if (!vids.length) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function play(v) {
    if (v.preload === 'none') { v.preload = 'auto'; }
    var p = v.play();
    if (p && p.catch) p.catch(function () {});
  }
  if (!('IntersectionObserver' in window)) {
    if (!reduce) vids.forEach(play);
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var v = e.target;
      if (e.isIntersecting) {
        if (!reduce && !v.dataset.userPaused) play(v);
      } else if (!v.paused) {
        v.dataset.autoPaused = '1';
        v.pause();
      }
    });
  }, { threshold: 0.25 });
  vids.forEach(function (v) {
    // Respect a manual pause from the controls (demo video).
    v.addEventListener('pause', function () {
      if (v.dataset.autoPaused) { delete v.dataset.autoPaused; return; }
      if (v.controls && !v.ended) v.dataset.userPaused = '1';
    });
    v.addEventListener('play', function () { delete v.dataset.userPaused; });
    io.observe(v);
  });
})();
