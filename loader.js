/* Site preloader: keeps the page behind a branded overlay until its resources are ready.
   Loaded synchronously in <head>; exposes window.SiteLoader.revealed (a Promise). */
(function () {
  var root = document.documentElement;
  root.classList.add('js-loading');

  var MIN_MS = 800, MAX_MS = 8000;
  var start = Date.now();
  var resolveReveal;
  var revealed = new Promise(function (r) { resolveReveal = r; });
  window.SiteLoader = { revealed: revealed };

  var total = 0, done = 0, shown = 0, target = 0, finished = false, raf = 0;
  var loader, bar, pct;

  function track(promise) {
    total++;
    promise.then(tick, tick);
  }
  function tick() { done++; target = total ? done / total : 1; maybeFinish(); }

  function render() {
    shown += (target - shown) * 0.18;
    if (target - shown < 0.002) shown = target;
    if (bar) bar.style.transform = 'scaleX(' + shown.toFixed(3) + ')';
    if (pct) pct.textContent = Math.round(shown * 100) + '%';
    if (!finished || shown < 1) raf = requestAnimationFrame(render);
  }

  function imgReady(img) {
    if (img.complete) return Promise.resolve();
    return new Promise(function (res) {
      img.addEventListener('load', res, { once: true });
      img.addEventListener('error', res, { once: true });
    });
  }
  function videoReady(v) {
    if (v.readyState >= 2 || v.preload === 'none') return Promise.resolve();
    if (v.networkState === 3) return Promise.resolve(); // NETWORK_NO_SOURCE
    return new Promise(function (res) {
      ['loadeddata', 'error', 'stalled', 'suspend'].forEach(function (e) { v.addEventListener(e, res, { once: true }); });
      // A failing <source> child fires 'error' on itself, not on the video.
      v.querySelectorAll('source').forEach(function (s) { s.addEventListener('error', res, { once: true }); });
    });
  }

  function maybeFinish(force) {
    if (finished) return;
    if (!force && done < total) return;
    var wait = Math.max(0, MIN_MS - (Date.now() - start));
    finished = true;
    target = 1;
    setTimeout(reveal, force ? 0 : wait + 220);
  }

  function reveal() {
    root.classList.remove('js-loading');
    if (loader) {
      loader.classList.add('is-leaving');
      loader.setAttribute('aria-hidden', 'true');
      setTimeout(function () { cancelAnimationFrame(raf); loader.remove(); }, 700);
    }
    resolveReveal();
  }

  document.addEventListener('DOMContentLoaded', function () {
    loader = document.getElementById('site-loader');
    if (!loader) { reveal(); return; }
    bar = loader.querySelector('.site-loader__bar span');
    pct = loader.querySelector('.site-loader__pct');
    var waitFor = loader.getAttribute('data-wait') || 'load';

    // Reduced motion: freeze the logo animation on its completed frame (1.8s of the 2.6s loop).
    var mark = loader.querySelector('svg.site-loader__mark');
    if (mark && mark.pauseAnimations && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      mark.pauseAnimations();
      mark.setCurrentTime(1.8);
    }

    // Autoplay videos start only after the reveal (page scripts call play()).
    document.querySelectorAll('video').forEach(function (v) {
      if (v.autoplay) { v.autoplay = false; v.pause(); }
      if (v.preload !== 'none') track(videoReady(v));
    });
    document.querySelectorAll('img').forEach(function (img) {
      if (loader.contains(img) || img.loading === 'lazy') return;
      track(imgReady(img));
    });
    if (document.fonts && document.fonts.ready) track(document.fonts.ready);
    if (waitFor === 'load') {
      track(new Promise(function (res) {
        if (document.readyState === 'complete') res(); else window.addEventListener('load', res, { once: true });
      }));
    }
    raf = requestAnimationFrame(render);
    if (total === 0) maybeFinish();
  });

  setTimeout(function () { maybeFinish(true); }, MAX_MS);
})();
