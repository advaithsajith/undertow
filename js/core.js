'use strict';
/* THEERAM — core: namespace, math, input, settings, save */
const G = window.G = { t: 0, dt: 0.016, paused: true, started: false, frame: 0 };
const TAU = Math.PI * 2;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const sm = (a, b, x) => { x = clamp((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };
const rnd = (a = 1, b) => b === undefined ? Math.random() * a : a + Math.random() * (b - a);
const pick = a => a[(Math.random() * a.length) | 0];
const sq = x => x * x;
function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hash2(x, z) { const n = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return n - Math.floor(n); }
function vnoise(x, z) { const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi, u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf); return lerp(lerp(hash2(xi, zi), hash2(xi + 1, zi), u), lerp(hash2(xi, zi + 1), hash2(xi + 1, zi + 1), u), v); }
function fbm(x, z) { return vnoise(x, z) * .5 + vnoise(x * 2.1 + 5, z * 2.1 + 3) * .25 + vnoise(x * 4.3 + 1, z * 4.3 + 9) * .125; }
const col = h => new THREE.Color(h).convertSRGBToLinear();
const angDiff = (a, b) => { let d = (a - b) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
const dist2 = (ax, az, bx, bz) => (ax - bx) * (ax - bx) + (az - bz) * (az - bz);

/* ---------- canvas texture helper ---------- */
function canvasTex(w, h, draw, opt = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (opt.srgb !== false) t.encoding = THREE.sRGBEncoding;
  if (opt.repeat !== false) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = opt.aniso || 4;
  return t;
}

/* ---------- input ---------- */
const In = G.In = { k: {}, p: {}, mx: 0, my: 0, mb: [0, 0, 0], mp: [0, 0, 0], wheel: 0, locked: false, nolock: false };
addEventListener('keydown', e => {
  if (e.code === 'Tab' || e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
  if (!e.repeat) In.p[e.code] = 1; In.k[e.code] = 1;
});
addEventListener('keyup', e => { In.k[e.code] = 0; });
addEventListener('blur', () => { In.k = {}; In.mb = [0, 0, 0]; });
addEventListener('mousemove', e => { if (In.locked || (In.nolock && !G.paused)) { In.mx += e.movementX || 0; In.my += e.movementY || 0; } });
addEventListener('mousedown', e => { if (e.target.closest && e.target.closest('.ui')) return; In.mb[e.button] = 1; In.mp[e.button] = 1; });
addEventListener('mouseup', e => { In.mb[e.button] = 0; });
addEventListener('wheel', e => { In.wheel += Math.sign(e.deltaY); }, { passive: true });
addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('pointerlockchange', () => { In.locked = !!document.pointerLockElement; if (!In.locked && G.started && !G.paused && !In.nolock && G.UI && !G.UI.open) G.UI.pause(true); });
G.lock = () => { const el = document.getElementById('game'); try { const p = el.requestPointerLock(); if (p && p.catch) p.catch(() => { In.nolock = true; }); } catch (e) { In.nolock = true; } };
G.unlock = () => { if (document.pointerLockElement) document.exitPointerLock(); };
G.endInput = () => { In.p = {}; In.mp[0] = In.mp[1] = In.mp[2] = 0; In.mx = In.my = 0; In.wheel = 0; };

/* ---------- settings ---------- */
G.set = Object.assign({ q: 2, sens: 1, fov: 78, vol: 0.7, gore: 1, fol: .3, body: 1 }, JSON.parse(localStorage.getItem('theeram.set') || '{}'));
if (!G.set.v3) { G.set.v3 = 1; G.set.q = 2; } if (!G.set.v5) { G.set.v5 = 1; G.set.fol = .3; G.set.body = 1; } if (G.set.q > 3) G.set.q = 2;
G.saveSet = () => localStorage.setItem('theeram.set', JSON.stringify(G.set));
G.QUAL = [
  { name: 'PS2 480p', h: 480, ps2: 1, shadow: 1024, ssr: 12, ao: 0, rays: 1, zmax: 24, fol: .6, folMax: 5000, spotShadow: false },
  { name: 'HD 720p', h: 720, shadow: 2048, ssr: 20, ao: 1, rays: 1, zmax: 30, fol: .8, folMax: 8000, spotShadow: false },
  { name: 'Full HD', h: 1080, shadow: 2048, ssr: 28, ao: 1, rays: 1, zmax: 36, fol: 1, folMax: 11000, spotShadow: true },
  { name: '4K', h: 2160, shadow: 4096, ssr: 32, ao: 1, rays: 1, zmax: 42, fol: 1.15, folMax: 11000, spotShadow: true }
];
G.Q = () => G.QUAL[G.set.q];
