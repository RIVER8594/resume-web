import * as THREE from 'three';
// Bundle the texture to support double-clicking index.html (file://) as well as HTTP.
import shadowUrl from '../assets/images/Plant_Shadow.png';

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;
const fragmentShader = `
  uniform sampler2D uShadow;
  uniform float uTime;
  uniform vec2 uCrop;
  varying vec2 vUv;
  void main() {
    // Match object-fit: cover, using the original image's 2400:1731 aspect ratio.
    vec2 uv = (vUv - 0.5) * uCrop + 0.5;
    vec2 p = uv;
    // Continuous 8-second loop with no rest: every term is a whole multiple
    // of the base frequency, so mod(uTime, 8.0) wraps seamlessly.
    float t = mod(uTime, 8.0) * 0.7853982;
    // Wind travels across the image; nearby branches move together.
    float ph = (p.x * 0.45 + 0.08 * (1.0 + sin(p.y * 4.0))) * 2.0;
    float gust = 0.6 + 0.4 * sin(t - ph);
    float branch = 0.85 * (0.7 * sin(t - ph) + 0.3 * sin(2.0 * t - ph * 1.3 + 1.1));
    float flutter = sin(6.0 * t + p.x * 7.0 + p.y * 5.0) * gust;
    float tip = 0.38 + 0.62 * p.y;
    vec2 wind = vec2((branch * 0.028 + flutter * 0.0035) * tip,
                     (branch * 0.0016 + flutter * 0.0007) * tip);
    // Pin the image boundary so the full-width background never reveals gaps.
    vec2 edge = smoothstep(vec2(0.0), vec2(0.08), vUv)
              * smoothstep(vec2(0.0), vec2(0.08), 1.0 - vUv);
    uv += wind * edge.x * edge.y;
    gl_FragColor = texture2D(uShadow, uv);
    #include <colorspace_fragment>
  }
`;

async function initLeafShadow(host) {
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (preference.matches) return;
  const texture = await new THREE.TextureLoader().loadAsync(shadowUrl);
  texture.colorSpace = THREE.SRGBColorSpace;
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.domElement.setAttribute('aria-hidden', 'true');
  const material = new THREE.ShaderMaterial({
    uniforms: { uShadow: { value: texture }, uTime: { value: 0 }, uCrop: { value: new THREE.Vector2(1, 1) } },
    vertexShader, fragmentShader, transparent: true, depthWrite: false,
  });
  const scene = new THREE.Scene();
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  host.appendChild(renderer.domElement);
  let lost = false;
  function resize() {
    const width = Math.max(1, host.clientWidth);
    const height = Math.max(1, host.clientHeight);
    renderer.setSize(width, height, false);
    const relativeAspect = (width / height) / (2400 / 1731);
    material.uniforms.uCrop.value.set(Math.min(1, relativeAspect), Math.min(1, 1 / relativeAspect));
    if (!lost) renderer.render(scene, camera);
  }
  resize();
  host.classList.add('has-three');
  let frame = 0;
  let inView = false;
  let lastTime = 0;
  function draw(now) {
    frame = 0;
    if (lastTime) material.uniforms.uTime.value += Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    renderer.render(scene, camera);
    frame = requestAnimationFrame(draw);
  }
  function sync() {
    const active = inView && !document.hidden && !preference.matches && !lost;
    host.classList.toggle('has-three', !lost && !preference.matches);
    if (active && !frame) { lastTime = 0; frame = requestAnimationFrame(draw); }
    if (!active && frame) { cancelAnimationFrame(frame); frame = 0; lastTime = 0; }
  }
  new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; sync(); }).observe(host);
  new ResizeObserver(resize).observe(host);
  document.addEventListener('visibilitychange', sync);
  preference.addEventListener('change', sync);
  renderer.domElement.addEventListener('webglcontextlost', event => {
    event.preventDefault(); lost = true; sync();
  });
  renderer.domElement.addEventListener('webglcontextrestored', () => {
    lost = false; resize(); sync();
  });
}

const host = document.querySelector('.profile-background');
if (host) {
  // Use the actual viewport width, excluding the scrollbar, at every breakpoint.
  const align = () => {
    host.style.width = `${document.documentElement.clientWidth}px`;
    host.style.left = `${-host.parentElement.getBoundingClientRect().left}px`;
    host.style.transform = 'none';
  };
  align();
  new ResizeObserver(align).observe(document.documentElement);
  window.addEventListener('resize', align);
  initLeafShadow(host).catch(error => {
    host.classList.remove('has-three');
    console.warn('Plant shadow animation unavailable; displaying the original image.', error);
  });
}
