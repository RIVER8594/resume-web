const lionVideo = document.getElementById('lion-video');
const baguaVideo = document.getElementById('bagua-video');
const abilityVideos = document.querySelectorAll('.ability-icon video');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function showAbilityFallback(video) {
  video.pause();
  video.hidden = true;
  const icon = video.closest('.ability-icon');
  icon?.classList.add('is-fallback');
}

// Safari / iOS WebKit ignores the alpha channel in VP9 WebM and draws a black box,
// so swap in transparent animated WebP there.
const ua = navigator.userAgent;
const isWebKitNoAlpha = /iP(hone|ad|od)/.test(ua) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ||
  (/Safari\//.test(ua) && !/(Chrome|Chromium|CriOS|FxiOS|Edg|Android)/.test(ua));

function swapAbilityToAnimatedWebp(video) {
  const src = video.querySelector('source')?.getAttribute('src');
  if (!src) return;
  const img = document.createElement('img');
  img.className = 'ability-icon-anim';
  img.alt = '';
  img.src = src.replace(/\.webm$/, '_anim.webp');
  video.pause();
  video.removeAttribute('autoplay');
  video.querySelector('source')?.remove();
  video.load();
  video.replaceWith(img);
}

function playAbilityIcons() {
  abilityVideos.forEach((video) => {
    if (!video.isConnected) return;
    if (isWebKitNoAlpha && !reduceMotion.matches) {
      swapAbilityToAnimatedWebp(video);
      return;
    }
    if (reduceMotion.matches) {
      video.removeAttribute('autoplay');
      showAbilityFallback(video);
      return;
    }
    video.muted = true;
    const playPromise = video.play();
    if (playPromise) {
      playPromise.catch(() => showAbilityFallback(video));
    }
  });
}

abilityVideos.forEach((video) => {
  video.addEventListener('error', () => showAbilityFallback(video));
  video.querySelector('source')?.addEventListener('error', () => showAbilityFallback(video));
});

function startMedia() {
  if (baguaVideo && !reduceMotion.matches) {
    baguaVideo.play().catch(() => {});
  }

  playAbilityIcons();

  if (lionVideo && !reduceMotion.matches) {
    window.setTimeout(() => {
      lionVideo.play().catch(() => {
        lionVideo.style.display = 'none';
        document.querySelector('.hero-lion-still')?.classList.add('show-fallback');
      });
    }, 900);
  }
}

// Wait for the preloader (loader.js) to reveal the page before starting media.
(window.SiteLoader ? window.SiteLoader.revealed : Promise.resolve()).then(startMedia);
