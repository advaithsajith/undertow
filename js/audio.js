'use strict';
/* THEERAM — audio: everything synthesised with WebAudio (guns, zombies, sea, rain, crickets, tension drone) */
(function () {
  const A = G.Audio = {}; let ctx = null, master, nbuf, amb = null, last = {};
  const now = () => ctx.currentTime;
  A.init = () => {
    if (ctx) return; try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    master = ctx.createGain(); master.gain.value = G.set.vol; const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 6; master.connect(comp); { const L = ctx.sampleRate * 2.4 | 0, ib = ctx.createBuffer(2, L, ctx.sampleRate); for (let c = 0; c < 2; c++) { const d = ib.getChannelData(c); let lp = 0; for (let i = 0; i < L; i++) { const t = i / L; lp += ((Math.random() * 2 - 1) - lp) * (.5 - .4 * t); d[i] = lp * Math.pow(1 - t, 2.6) * (i < 400 ? i / 400 : 1); } } const cv = ctx.createConvolver(); cv.buffer = ib; rev = ctx.createGain(); rev.gain.value = .55; rev.connect(cv); cv.connect(comp); } comp.connect(ctx.destination);
    nbuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const d = nbuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const loop = (type, f, q) => { const s = ctx.createBufferSource(); s.buffer = nbuf; s.loop = true; const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q || .7; const g = ctx.createGain(); g.gain.value = 0; s.connect(fl); fl.connect(g); g.connect(master); s.start(); return { g, fl }; };
    amb = { sea: loop('lowpass', 420, .5), surf: loop('bandpass', 1400, .6), rain: loop('highpass', 2600, .5), wind: loop('bandpass', 260, 1.2), eng: null, drone: null };
    const o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), lf = ctx.createBiquadFilter(), dg = ctx.createGain(); o1.type = o2.type = 'sawtooth'; o1.frequency.value = 55; o2.frequency.value = 55.6; lf.type = 'lowpass'; lf.frequency.value = 160; dg.gain.value = 0; o1.connect(lf); o2.connect(lf); lf.connect(dg); dg.connect(master); o1.start(); o2.start(); amb.drone = { g: dg, lf, o2 };
    const eo = ctx.createOscillator(), ef = ctx.createBiquadFilter(), eg = ctx.createGain(); eo.type = 'sawtooth'; eo.frequency.value = 60; ef.type = 'lowpass'; ef.frequency.value = 500; eg.gain.value = 0; eo.connect(ef); ef.connect(eg); eg.connect(master); eo.start(); amb.eng = { o: eo, g: eg };
  };
  A.vol = v => { if (master) master.gain.value = v; };
  let rev = null, wet = 0;
  function out(pan) { let n = master; if (pan && ctx.createStereoPanner) { n = ctx.createStereoPanner(); n.pan.value = clamp(pan, -1, 1); n.connect(master); } if (wet > 0 && rev) { const g = ctx.createGain(); g.gain.value = wet; g.connect(rev); if (n === master) { const j = ctx.createGain(); j.connect(master); j.connect(g); return j; } n.connect(g); } return n; }
  const W = (w, fn) => { wet = w; try { fn(); } finally { wet = 0; } };
  function tone(f0, f1, dur, vol, type, pan, delay) { if (!ctx || vol < .003) return; const t = now() + (delay || 0), o = ctx.createOscillator(), g = ctx.createGain(); o.type = type || 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0008, t + dur); o.connect(g); g.connect(out(pan)); o.start(t); o.stop(t + dur + .02); }
  function nz(dur, vol, type, f0, f1, q, pan, delay) { if (!ctx || vol < .003) return; const t = now() + (delay || 0), s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = nbuf; s.playbackRate.value = .8 + Math.random() * .4; fl.type = type || 'lowpass'; fl.frequency.setValueAtTime(f0, t); fl.frequency.exponentialRampToValueAtTime(Math.max(30, f1 || f0), t + dur); fl.Q.value = q || .8; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0008, t + dur); s.connect(fl); fl.connect(g); g.connect(out(pan)); s.start(t, Math.random()); s.stop(t + dur + .02); }
  const sp = (x, z, ref) => { const P = G.P, dx = x - P.x, dz = z - P.z, d = Math.hypot(dx, dz); return { v: 1 / (1 + (d / (ref || 8)) * (d / (ref || 8))), pan: d < .5 ? 0 : Math.sin(Math.atan2(dx, dz) - P.yaw - Math.PI) * -.8 }; };
  const thr = (k, t) => { const n = G.t; if (last[k] && n - last[k] < t) return true; last[k] = n; return false; };
  A.shot = (cls, supp, id) => W(supp ? .12 : .5, () => shot0(cls, supp, id));
  const shot0 = (cls, supp, id) => {
    if (cls === 'flame') { nz(.3, .2, 'bandpass', 900, 500, .8); nz(.3, .12, 'lowpass', 300, 120, 1); return; }
    if (supp) { nz(.09, .35, 'bandpass', 1800, 600, 1); tone(300, 80, .06, .2, 'triangle'); return; }
    if (cls === 'pistol') { nz(.16, .7, 'lowpass', id === 'revolver' ? 2600 : 3800, 300); tone(id === 'revolver' ? 170 : 240, 50, .12, .6, 'triangle'); nz(.5, .12, 'lowpass', 900, 200, .5, 0, .04); }
    else if (cls === 'smg') { nz(.1, .55, 'lowpass', 4200, 500); tone(260, 70, .07, .45, 'square'); }
    else if (cls === 'shotgun') { nz(.3, .95, 'lowpass', 2400, 120); tone(120, 35, .25, .9, 'triangle'); nz(.9, .2, 'lowpass', 700, 120, .5, 0, .05); }
    else if (cls === 'rifle') { nz(.14, .75, 'lowpass', 5200, 400); tone(200, 55, .1, .6, 'sawtooth'); nz(.6, .14, 'lowpass', 1000, 200, .5, 0, .04); }
    else { nz(.3, 1, 'lowpass', 3400, 150); tone(140, 30, .3, .9, 'sawtooth'); nz(1.4, .25, 'lowpass', 800, 100, .5, 0, .06); }
  };
  A.farShot = d => W(.8, () => farShot0(d));
  const farShot0 = d => { const v = clamp(1 - d / 160, 0, 1) * .3; nz(.2, v, 'lowpass', 1600, 200); tone(150, 50, .1, v * .7, 'triangle'); };
  A.reload = n => { if (n) { tone(900, 500, .03, .2, 'square'); nz(.05, .25, 'highpass', 2500, 2500, 1, 0, .05); } else { nz(.06, .2, 'bandpass', 1800, 900, 2); tone(500, 300, .04, .12, 'square', 0, .08); } };
  A.click = p => tone(1400 * (p || 1), 700, .03, .12, 'square');
  A.swing = () => nz(.22, .22, 'bandpass', 500, 1800, 1.5);
  A.thud = hit => { tone(hit ? 150 : 220, 45, .14, .55, 'sine'); nz(.1, hit ? .5 : .3, 'lowpass', hit ? 900 : 2000, 200); if (hit) nz(.16, .3, 'bandpass', 700, 300, 2, 0, .02); };
  A.hit = (head, killed) => { if (head) { tone(1900, 900, .07, .16, 'triangle'); nz(.1, .3, 'lowpass', 1200, 300, 1, 0, .01); } else tone(700, 400, .04, .08, 'triangle'); if (killed) tone(520, 260, .16, .12, 'sine', 0, .04); };
  A.gore = v => { tone(70, 35, .12, .5 * v, 'sine'); nz(.3, .5 * v, 'lowpass', 900, 150, 1.4); nz(.18, .35 * v, 'bandpass', 500, 250, 3, 0, .03); tone(110, 40, .2, .3 * v, 'sine'); };
  A.hurt = () => { if (thr('hurt', .25)) return; tone(190, 110, .22, .35, 'sawtooth'); nz(.12, .3, 'lowpass', 800, 300); };
  A.death = () => { tone(160, 40, 1.4, .5, 'sawtooth'); nz(1.2, .3, 'lowpass', 500, 80); };
  A.step = (P, land) => { const m = G.maskAt(P.x, P.z), wet = G.hAt(P.x, P.z) < 0, v = (P.crouch ? .05 : P.sprinting ? .2 : .12) * (land ? 2 : 1); if (wet) nz(.2, v * 1.6, 'bandpass', 900, 1600, .8); else if (m === 1) { nz(.05, v, 'lowpass', 1500, 500); tone(110, 70, .04, v * .6, 'sine'); } else nz(.09, v * 1.1, 'bandpass', G.groundAt(P.x, P.z) < 2.3 ? 2400 : 900, 500, .7); };
  function voice(f, dur, vol, pan, rough) { if (!ctx || vol < .004) return; const t = now(), o = ctx.createOscillator(), g = ctx.createGain(), fl = ctx.createBiquadFilter(), lfo = ctx.createOscillator(), lg = ctx.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f, t); o.frequency.linearRampToValueAtTime(f * (.7 + Math.random() * .5), t + dur); lfo.frequency.value = rough || 28; lg.gain.value = f * .25; lfo.connect(lg); lg.connect(o.frequency); fl.type = 'bandpass'; fl.frequency.setValueAtTime(500 + Math.random() * 300, t); fl.frequency.linearRampToValueAtTime(900 + Math.random() * 500, t + dur); fl.Q.value = 3; g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(vol, t + dur * .25); g.gain.exponentialRampToValueAtTime(.0008, t + dur); o.connect(fl); fl.connect(g); g.connect(out(pan)); o.start(t); lfo.start(t); o.stop(t + dur + .05); lfo.stop(t + dur + .05); nz(dur, vol * .25, 'bandpass', 700, 400, 2, pan); }
  const zf = z => z.type === 'brute' ? 55 : z.type === 'bloater' ? 70 : z.type === 'runner' ? 150 : 95 + z.seed * 40;
  A.zgroan = (z) => { const s = sp(z.x, z.z, 9); voice(zf(z), .9 + Math.random() * .9, .32 * s.v, s.pan, 18 + z.seed * 20); };
  A.zalert = z => { if (thr('al', .4)) return; const s = sp(z.x, z.z, 14); voice(zf(z) * 1.5, .7, .5 * s.v, s.pan, 40); };
  A.zattack = z => { const s = sp(z.x, z.z, 8); voice(zf(z) * 1.8, .35, .5 * s.v, s.pan, 55); };
  A.scream = z => { const s = sp(z.x, z.z, 22); for (let i = 0; i < 3; i++) voice(620 + i * 140, 1.3, .5 * s.v, s.pan, 70); nz(1.2, .25 * s.v, 'bandpass', 2600, 1800, 3, s.pan); };
  A.zdie = z => { const s = sp(z.x, z.z, 10); voice(zf(z) * 1.2, .5, .3 * s.v, s.pan, 12); };
  A.slow = () => { nz(.7, .25, 'lowpass', 900, 90, 1.5); tone(220, 60, .6, .12, 'sine'); };
  A.boom = d => W(.8, () => { const v = clamp(1.2 - d / 70, .1, 1); nz(1.2, v, 'lowpass', 1800, 60); tone(90, 25, .9, v, 'sine'); nz(2.2, v * .3, 'lowpass', 500, 80, .5, 0, .1); });
  A.thunder = () => W(.9, () => { nz(3.5, .7, 'lowpass', 300, 50, .6, 0, .6 + Math.random()); nz(.4, .5, 'lowpass', 2500, 200, 1, 0, .5); });
  A.gateHit = d => { if (thr('gate', .12)) return; const v = clamp(1 - d / 60, 0, 1) * .6; tone(130, 60, .15, v, 'square'); nz(.2, v, 'bandpass', 600, 300, 2); };
  A.siren = () => { for (let i = 0; i < 3; i++) { tone(440, 660, .7, .16, 'sawtooth', 0, i * 1.4); tone(660, 440, .7, .16, 'sawtooth', 0, i * 1.4 + .7); } };
  A.objective = () => { tone(660, 660, .12, .14, 'triangle'); tone(880, 880, .2, .14, 'triangle', 0, .11); };
  A.pickup = () => { tone(900, 1300, .08, .12, 'triangle'); };
  A.shutter = () => { nz(1.1, .7, 'bandpass', 1200, 400, 3); for (let i = 0; i < 8; i++) tone(300 + i * 30, 200, .05, .2, 'square', 0, i * .12); };
  A.generator = () => { for (let i = 0; i < 4; i++) nz(.2, .5, 'lowpass', 400, 150, 2, 0, i * .3); tone(50, 90, 2.5, .4, 'sawtooth', 0, 1.2); };
  A.engine = (v, on, type) => { if (!amb) return; const b = type === 'bike', j = type === 'jeep'; amb.eng.g.gain.value += ((on ? .07 + v * .08 : 0) - amb.eng.g.gain.value) * .15; amb.eng.o.frequency.value = (b ? 70 : j ? 38 : 48) + v * (b ? 150 : 80) + Math.sin(G.t * (b ? 47 : 31)) * (b ? 6 : 3); };
  let cr = 0, hb = 0, bird = 4;
  A.update = dt => {
    if (!amb) return; const P = G.P, e = G.env, d = P.x - G.coast(P.z), near = clamp(1 - Math.max(0, d) / 260, 0, 1), sw = .5 + .5 * Math.sin(G.t * .7), k = Math.min(1, dt * 3);
    const set = (n, v) => { n.g.gain.value += (v - n.g.gain.value) * k; };
    set(amb.sea, near * (.10 + .05 * sw)); set(amb.surf, near * near * (.02 + .06 * sw * sw)); set(amb.rain, e.rain * .16); set(amb.wind, .015 + e.cloud * .03 + e.rain * .05); amb.wind.fl.frequency.value = 240 + Math.sin(G.t * .3) * 90;
    let ch = 0; for (const z of G.Z.list) if (z.state !== 'dead' && z.chasing && z.dT < 30) ch++; const tens = clamp(ch / 8 + (G.Base.siegeOn ? .5 : 0), 0, 1); set(amb.drone, tens * .11); amb.drone.lf.frequency.value = 120 + tens * 260; amb.drone.o2.frequency.value = 55.6 + tens * 1.5;
    if (e.night > .5 && e.rain < .3) { cr -= dt; if (cr <= 0) { cr = .09 + (Math.random() < .2 ? .5 + Math.random() * .8 : 0); tone(4300 + Math.random() * 300, 4200, .035, .02 * e.night, 'sine', Math.random() * 2 - 1); } }
    else if (e.dayF > .6 && e.rain < .2) { bird -= dt; if (bird <= 0) { bird = 5 + Math.random() * 14; const p = Math.random() * 2 - 1; if (Math.random() < .5) for (let i = 0; i < 3; i++) voice(520, .22, .05, p, 60); else for (let i = 0; i < 4; i++) tone(2400 + Math.random() * 900, 3000, .07, .025, 'sine', p, i * .13); } }
    if (P.alive && P.hp < 35) { hb -= dt; if (hb <= 0) { hb = .55 + P.hp / 70; tone(62, 40, .12, .5, 'sine'); tone(55, 38, .12, .35, 'sine', 0, .16); } }
  };
})();
