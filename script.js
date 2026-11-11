const lionVideo = document.getElementById('lion-video');
const baguaVideo = document.getElementById('bagua-video');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (baguaVideo && !reduceMotion.matches) {
  baguaVideo.play().catch(() => {});
}

if (lionVideo && !reduceMotion.matches) {
  window.setTimeout(() => {
    lionVideo.play().catch(() => {
      lionVideo.style.display = 'none';
      document.querySelector('.hero-lion-still')?.classList.add('show-fallback');
    });
  }, 900);
}


