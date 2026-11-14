'use strict';
/* THEERAM — main: boot, game loop, start / respawn, test hooks */
(function () {
  const $ = id => document.getElementById(id);
  G.scene = new THREE.Scene();
  let last = performance.now(), saveT = 60, ready = false, freeze = 0, slowT = 0, slowS = 1;
  G.hitStop = t => { freeze = Math.max(freeze, t); }; G.slowmo = (d, s) => { slowT = Math.max(slowT, d); slowS = s; if (G.Audio.slow) G.Audio.slow(); };
  function step(dt) {
    G.t += dt; G.dt = dt; G.frame++;
    G.updateEnv(dt);
    G.P.update(dt); G.Wp.update(dt);
    G.Z.update(dt); G.Z.director(dt);
    G.Base.update(dt); G.M.update(dt); G.Loot.update(dt);
    G.FX.update(dt); G.Plus.update(dt); G.Audio.update(dt);
    const S = G.S; if (G.env.hour >= 6 && S.dailyDay !== G.env.day) { const first = S.dailyDay === undefined; S.dailyDay = G.env.day; if (!first) G.Base.daily(); }
    saveT -= dt; if (saveT <= 0) { saveT = 90; if (!G.Base.siegeOn) G.save(); }
  }
  G.step = step;
  function frame(now) {
    requestAnimationFrame(frame); const dt = Math.min(.05, (now - last) / 1000); last = now; if (!ready) return;
    if (G.started) { if (!G.paused) { let d2 = dt; if (freeze > 0) { freeze -= dt; d2 = dt * .04; } else if (slowT > 0) { slowT -= dt; d2 = dt * slowS; } step(d2); } G.UI.update(dt); }
    else { G.t += dt; const a = G.t * .03; G.camera.position.set(G.coast(20) + 26 + Math.cos(a) * 6, 4.2 + Math.sin(a * 2) * .5, 20 + Math.sin(a) * 10); G.camera.rotation.set(-.03, 1.05 + Math.sin(a) * .2, 0, 'YXZ'); G.updateEnv(0); G.FX.update(dt); }
    G.Foliage.update(); G.render(); G.endInput();
  }
  function start(fresh) {
    const S = G.S = fresh ? G.newState() : (G.load() || G.newState()), P = G.P, e = G.env;
    e.hour = S.hour; e.day = S.day; if (S.wx) { e.cloud = e.tCloud = S.wx[0]; e.rain = e.tRain = S.wx[1]; } if (S.day > 1 || S.hour > 6) S.dailyDay = S.hour >= 6 ? S.day : S.day - 1; if (fresh) S.dailyDay = 1;
    G.Z.kills = S.kills || 0;
    if (!S.guns.pistol) G.Wp.give('pistol'); for (const id in S.guns) G.Wp.st.clip[id] = S.clip && S.clip[id] !== undefined ? S.clip[id] : G.Wp.magSize(id);
    P.init(); G.Base.init(); G.M.init(); G.Wp.init(); G.Plus.init();
    if (S.pos) { P.teleport(S.pos[0], S.pos[1], S.pos[2]); P.hp = S.hp || 100; } else P.teleport(G.poi.start.x, G.poi.start.z, -1.25);
    P.tps = G.set.tps === true;
    $('title').classList.add('hidden'); $('hud').classList.remove('hidden');
    G.started = true; G.paused = false; G.Audio.init(); G.lock();
  }
  G.onDeath = () => { const S = G.S; S.stats.deaths++; setTimeout(() => G.UI.dead(), 2200); };
  // retry: back to the start of the current objective, same night.  home: wake at home next morning.
  G.respawn = home => {
    const S = G.S, P = G.P, e = G.env, cp = !home && S.cp; G.Z.clear(); G.boss = null; if (G.Loot && G.Loot.guns) { for (const o of G.Loot.guns) G.scene.remove(o.g); G.Loot.guns.length = 0; }
    if (G.Base.siegeOn) { G.Base.siegeOn = false; G.Base.siege = null; for (const g of G.Base.gates) { g.hp = Math.max(g.hp, 80); G.Base.syncGate(g); } if (cp) S.siegeDay = e.day - 1; }
    P.alive = true; P.stam = 100; P.grabber = null; P.veh = null; P.busy = 0; P.burn = 0; P.pitch = 0; P.recBack = 0;
    if (cp) { S.scrap = Math.floor(S.scrap * .85); P.hp = 80; P.teleport(cp[0], cp[1], cp[2]); e.hour = (e.hour + .25) % 24; }
    else { S.scrap = Math.floor(S.scrap * .6); P.hp = 70; if (e.hour > 7) e.day++; e.hour = 7; S.siegeDay = e.day - 1; S.dailyDay = e.day; P.teleport(G.poi.house.x - 3, G.poi.house.z - 4, Math.PI); }
    for (const id in S.guns) { const D = G.Wp.DEFS[id]; if (G.Wp.st.clip[id] < G.Wp.magSize(id) && S.ammo[D.ammo] < D.mag) G.Wp.addAmmo(D.ammo, D.mag); }
    G.Wp.st.reloading = 0; G.Wp.st.swing = 0; G.M.start(); G.UI.close(); G.UI.msg(cp ? 'Back at the last checkpoint. 15% of your scrap is gone.' : 'You wake at home. 40% of your scrap is gone.', 'red'); G.save();
  };
  /* test hooks (also handy as cheats from the console) */
  window.stepSim = (sec, dt) => { dt = dt || 1 / 30; const pz = G.paused; G.paused = false; for (let t = 0; t < sec; t += dt) { step(dt); G.endInput(); } G.paused = pz; G.UI.update(dt); G.Foliage.update(); G.render(); return { hour: +G.env.hour.toFixed(2), z: G.Z.list.length, hp: Math.round(G.P.hp), kills: G.Z.kills }; };
  window.startGame = fresh => { if (!G.started) start(fresh !== false); return true; };

  // boot (deferred a frame so the title screen paints first)
  requestAnimationFrame(frame);
  setTimeout(() => {
    const t0 = performance.now(); G.buildWorld(G.scene); G.initRender(); G.FX.init(); G.Foliage.init(); G.UI.init();
    G.env.hour = 17.55; G.S = null; ready = true; G.bootMs = Math.round(performance.now() - t0);
    G.Rig.load(() => {
    const bn = $('bNew'), bc = $('bCont'); bn.disabled = false; bn.textContent = 'New game'; bn.onclick = () => { if (G.hasSave() && !confirm('Start again and overwrite your save?')) return; localStorage.removeItem('theeram.save'); start(true); };
    if (G.hasSave()) { bc.classList.remove('hidden'); bc.onclick = () => start(false); bn.classList.remove('pri'); }
    }, () => { $('bNew').textContent = 'Character model failed to load'; });
  }, 60);
})();
