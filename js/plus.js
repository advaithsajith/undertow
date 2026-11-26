'use strict';
/* UNDERTOW — plus: bodycam overlay, stealth meter, world markers, explosive hazards, tripmines,
   loot glints, traders, lightning bolts, and the cure-fog flight of the finale */
(function () {
  const Plus = G.Plus = { haz: [], mines: [], cure: { on: false, t: 0, done: false }, traders: [] }, V3 = THREE.Vector3;
  let rec, eye, wp, glow, glowT = 0, bolt, boltT = 0, lastFlash = 0, lastLoc = null, plane, shopEl;
  const el = (id, css, parent) => { const d = document.createElement('div'); d.id = id; d.style.cssText = css; (parent || document.getElementById('hud')).appendChild(d); return d; };

  /* ---------- explosive hazards ---------- */
  let lpgG, drumG, capG, lpgM, drumM, rustM;
  function addHaz(x, z, kind) {
    if (G.blocked(x, z, .3)) return; const y = G.groundAt(x, z), drum = kind === 'drum';
    if (!lpgG) { lpgG = new THREE.CylinderGeometry(.17, .17, .52, 10); capG = new THREE.CylinderGeometry(.09, .12, .14, 8); drumG = new THREE.CylinderGeometry(.3, .3, .92, 12); lpgM = new THREE.MeshLambertMaterial({ color: col(0xc01818) }); drumM = new THREE.MeshLambertMaterial({ color: col(0x1e4a8a) }); rustM = new THREE.MeshLambertMaterial({ color: col(0x8a3a1a) }); }
    const g = new THREE.Group(), m = new THREE.Mesh(drum ? drumG : lpgG, drum ? (Math.random() < .5 ? drumM : rustM) : lpgM); m.position.y = drum ? .46 : .26; m.castShadow = true; g.add(m);
    if (!drum) { const c = new THREE.Mesh(capG, lpgM); c.position.y = .58; g.add(c); }
    g.position.set(x, y, z); G.scene.add(g);
    const h = { x, y, z, kind, hp: drum ? 60 : 40, mesh: g, fuse: -1, dead: false }; h.col = G.addCircle(x, z, drum ? .32 : .2, y + (drum ? .95 : .7), 'haz'); h.col.haz = h; Plus.haz.push(h);
  }
  Plus.hitHaz = (h, dmg) => { if (h.dead) return; h.hp -= dmg; G.FX.sparks(h.x, h.y + .5, h.z, 0, 1, 0, 3); if (h.hp <= 0 && h.fuse < 0) h.fuse = .05; };
  function blowHaz(h) {
    h.dead = true; h.col.on = false; G.scene.remove(h.mesh); const P = G.P, d = Math.hypot(P.x - h.x, P.z - h.z), r = h.kind === 'drum' ? 7.5 : 6.5;
    G.FX.explode(h.x, h.y + .4, h.z, true); G.Z.blast(h.x, h.y, h.z, r, 320); if (h.kind === 'drum') G.FX.fire(h.x, h.z, 3.4, 12); else for (let i = 0; i < 6; i++) G.FX.gib(h.x, h.y + .5, h.z, rnd(-8, 8), rnd(4, 11), rnd(-8, 8), { scale: 1.4 });
    if (d < r) P.hurt(65 * (1 - d / r), h.x, h.z, 'blast'); P.shake = Math.max(P.shake, clamp(1.5 - d / 18, 0, 1)); G.noise(h.x, h.z, 95); G.Audio.boom(d);
    for (const o of Plus.haz) if (!o.dead && o.fuse < 0 && dist2(o.x, o.z, h.x, h.z) < 42) o.fuse = .18 + Math.random() * .3;
  }
  /* ---------- tripmines ---------- */
  function placeMine() {
    const S = G.S, P = G.P; if (!(S.mine > 0) || P.veh || !P.alive) return; S.mine--; const x = P.x - Math.sin(P.yaw) * .9, z = P.z - Math.cos(P.yaw) * .9, y = G.groundAt(x, z);
    const m = new THREE.Mesh(new THREE.BoxGeometry(.3, .09, .2), new THREE.MeshLambertMaterial({ color: col(0x3a4a2a) })); m.position.set(x, y + .05, z); m.rotation.y = P.yaw; const led = new THREE.Mesh(new THREE.SphereGeometry(.025, 6, 4), new THREE.MeshBasicMaterial({ color: 0xff2010 })); led.position.y = .06; m.add(led); G.scene.add(m);
    Plus.mines.push({ x, y, z, m, led, arm: 1.4 }); G.Audio.click(.5); G.UI.msg('Tripmine set — arms in a moment', 'dim');
  }
  /* ---------- traders: named people who stayed ---------- */
  function trader(o) {
    const rig = G.Rig.make({ skin: o.skin, tint: o.tint, skirt: o.skirt, skirtCol: o.skirtCol, scale: 1 }); rig.root.position.set(o.x, G.groundAt(o.x, o.z), o.z); rig.root.rotation.y = o.yaw; G.scene.add(rig.root); o.rig = rig; Plus.traders.push(o);
    G.addInter({ x: o.x + Math.sin(o.yaw) * 1.3, z: o.z + Math.cos(o.yaw) * 1.3, r: 2.6, label: 'Trade with ' + o.name, fn: () => openShop(o) });
  }
  Plus.SHOP = [['revolver', 1.2], ['smg', 1.25], ['pump', 1.25], ['crossbow', 1.2], ['insas', 1.3, 'fort']];
  Plus.buyGun = id => { const S = G.S, W = G.Wp, D = W.DEFS[id]; W.give(id); const f = S.slots.indexOf(null); if (f >= 0) S.slots[f] = id; W.addAmmo(D.ammo, D.mag * 2); W.rebuild(); G.UI.banner('NEW WEAPON', D.name + (f >= 0 ? ' · slot ' + (f + 1) : ' · fit it to a slot at the workbench')); };
  Plus.gunStock = () => Plus.SHOP.map(([id, mk, lk]) => { const D = G.Wp.DEFS[id], c = Math.round(D.cost * mk / 5) * 5; return [D.name + ' + ammo' + (lk ? ' (after Kotta)' : ''), c, () => Plus.buyGun(id), () => !G.S.guns[id] && G.S.scrap >= c && (!lk || G.S[lk])]; });
  function openShop(o) {
    if (G.UI.open) return; const S = G.S;
    const draw = () => { shopEl.querySelector('h2').textContent = o.name.toUpperCase(); shopEl.querySelector('.sub').textContent = o.sub + ' · you have ' + S.scrap + ' scrap'; const L = shopEl.querySelector('#shopL'); L.innerHTML = ''; o.items.forEach(it => { const b = document.createElement('button'); const can = it[3] ? it[3]() : S.scrap >= it[1]; b.innerHTML = it[0] + '<small style="float:right;color:var(--gold)">' + (it[1] > 0 ? it[1] + ' scrap' : '+' + (-it[1]) + ' scrap') + '</small>'; b.disabled = !can; b.style.textAlign = 'left'; b.onclick = () => { S.scrap -= it[1]; it[2](); G.Audio.pickup(); draw(); }; L.appendChild(b); }); };
    draw(); shopEl.classList.remove('hidden'); G.UI.open = 'shop'; G.paused = true; G.unlock(); G.UI.say(o.name, o.line);
  }
  /* ---------- the cure flight ---------- */
  function mkPlane() {
    const g = new THREE.Group(), M = c => new THREE.MeshLambertMaterial({ color: col(c) }), yl = M(0xe8c020), wh = M(0xe8e8e0), dk = M(0x1a1a1c), tl = M(0x1e8a8a);
    const B = (w, h, l, x, y, z, m) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, l), m); b.position.set(x, y, z); b.castShadow = true; g.add(b); return b; };
    const fus = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), yl); fus.scale.set(.7, .8, 3.6); fus.position.y = 1.5; fus.castShadow = true; g.add(fus);
    B(10.5, .14, 1.5, 0, 1.25, .6, yl); B(3.6, .1, .9, 0, 1.7, -3.2, yl); B(.12, 1.4, 1.0, 0, 2.3, -3.2, tl); B(.9, .6, 1.2, 0, 2.15, .3, dk); B(9.6, .08, .12, 0, .95, .05, dk);
    for (const sx of [-1.1, 1.1]) { B(.12, 1.0, .12, sx, .7, .9, dk); const w = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, .16, 10), dk); w.rotation.z = Math.PI / 2; w.position.set(sx, .3, .9); g.add(w); }
    const prop = B(2.6, .12, .06, 0, 1.5, 3.65, dk); g.userData.prop = prop; B(.4, .4, .3, 0, 1.5, 3.5, wh);
    g.position.set(505, 12, -372); g.rotation.y = Math.PI / 2; G.scene.add(g); return g;
  }
  Plus.launchCure = () => { const c = Plus.cure; if (c.on) return; c.on = true; c.t = 0; c.done = false; c.blown = 0; G.S.noSpawn = true; G.UI.banner('MEDICINE RAIN', 'Anil has the stick. Stand clear of the prop.'); G.UI.say('Anil', 'Tanks are primed. If this works, tell them a cold-chain clerk did it.'); };
  function cureUpdate(dt) {
    const c = Plus.cure, P = G.P, p = plane.position; c.t += dt; const t = c.t; plane.userData.prop.rotation.z += dt * 40;
    if (t < 4) { p.x = lerp(505, 545, sm(0, 4, t)); p.z = -372; plane.rotation.y = lerp(Math.PI / 2, 0, sm(2.5, 4, t)); }
    else if (t < 11) { const u = (t - 4) / 7; p.x = 545; p.z = -372 + u * u * 215; p.y = 12 + sm(.55, 1, u) * 26; plane.rotation.set(-sm(.55, 1, u) * .25, 0, 0); }
    else { const a = (t - 11) * .11 - 1.2, R = 300 - Math.min(140, (t - 11) * 3), cx = 330, cz = 60, k = sm(11, 22, t); const tx = cx + Math.cos(a) * R, tz = cz + Math.sin(a) * R; p.x = lerp(545, tx, k); p.z = lerp(-157, tz, k); p.y = lerp(38, 85, k); plane.rotation.set(0, Math.atan2(-Math.sin(a), Math.cos(a)), -.35 * k); }
    if (t > 8) for (let i = 0; i < 3; i++) G.FX.emit(p.x + rnd(-3, 3), p.y - 1, p.z + rnd(-3, 3), rnd(-2, 2), rnd(-5, -2), rnd(-2, 2), .55, .95, .85, .34, 5 + Math.random() * 4, 7, { grav: .4, grow: 3.5, drag: .3 });
    if (t > 14) for (let i = 0; i < 2; i++) G.FX.emit(P.x + rnd(-22, 22), P.y + rnd(3, 12), P.z + rnd(-22, 22), rnd(-.5, .5), rnd(-1.6, -.5), rnd(-.5, .5), .6, .95, .88, .16, 2.5 + Math.random() * 3, 5, { grav: .1, grow: .8, drag: .2 });
    // the campus goes up
    if (t > 6 && c.blown < 9 && t > 6 + c.blown * .45) { const q = [[521, -66], [540, -88], [521, -112], [478, -60], [506, -89], [548, -54], [470, -106], [490, -62], [530, -100]][c.blown++]; G.FX.explode(q[0], 16 + Math.random() * 6, q[1], true); G.FX.fire(q[0], q[1], 6, 150); const d = Math.hypot(P.x - q[0], P.z - q[1]); G.Audio.boom(d * .5); P.shake = Math.max(P.shake, clamp(1.3 - d / 260, .15, 1)); for (let i = 0; i < 4; i++) G.FX.emit(q[0], 20, q[1], rnd(-3, 3), rnd(5, 11), rnd(-3, 3), .08, .08, .08, .7, 6, 9, { grav: -1, grow: 4, drag: .3 }); }
    // the fever breaks
    if (t > 15 && (G.frame & 3) === 0) { const L = G.Z.list.filter(z => !z.human && z.state !== 'dead'); if (L.length) { const z = pick(L); G.Z.damage(z, 'torso', 1e6, 0, 0, 0, { npc: true, cure: true }); } }
    const cf = sm(12, 24, t) * (1 - sm(52, 70, t)); if (cf > 0) { const f = G.scene.fog, lum = f.color.r * .3 + f.color.g * .5 + f.color.b * .2 + .05; f.color.lerp(tmpC.setRGB(lum * .75, lum * 1.25, lum * 1.12), cf * .8); f.density += cf * .006; }
    if (t > 46 && !c.done) { c.done = true; }
    if (t > 75) { c.on = false; plane.visible = false; }
  }
  const tmpC = new THREE.Color(), v = new V3();

  Plus.init = () => {
    G.camVM.fov = 62; G.camVM.updateProjectionMatrix();
    rec = el('rec', 'position:absolute;left:50%;bottom:14px;transform:translateX(-50%);font:700 13px Consolas,monospace;letter-spacing:.12em;color:#f1ece0;opacity:.85;display:none');
    eye = el('eye', 'position:absolute;left:50%;top:52px;transform:translateX(-50%);font:800 12px "Segoe UI";letter-spacing:.3em;display:none');
    wp = el('wpt', 'position:absolute;transform:translate(-50%,-100%);text-align:center;color:#ffd24a;font:700 12px "Segoe UI";white-space:nowrap;display:none'); wp.innerHTML = '<div style="width:12px;height:12px;border:2px solid #ffd24a;background:rgba(255,210,74,.35);transform:rotate(45deg);margin:0 auto 5px"></div><span></span>';
    shopEl = document.createElement('div'); shopEl.id = 'shop'; shopEl.className = 'ov ui hidden'; shopEl.innerHTML = '<div class="card" style="width:470px"><h2></h2><div class="sub"></div><div id="shopL" class="grid"></div><button data-close style="margin-top:12px">Leave</button></div>'; document.body.appendChild(shopEl);
    // hazards: gas cylinders by shops and bakeries, fuel drums at the working yards
    G.lootPts.forEach((p, i) => { if ((p.kind === 'shop' || p.kind === 'bakery') && i % 3 === 0) addHaz(p.x + 1.3, p.z + .7, 'lpg'); });
    for (const q of [[112, 716], [118, 710], [144, 686], [60, 702], [480, -340], [498, -376], [512, -356], [466, -100], [484, -116], [512, -96], [300, -596], [303, -546], [262, 404], [258, 466], [36, 544], [-6, 574], [330, 96], [240, 124], [380, 404], [396, 436]]) addHaz(q[0], q[1], 'drum');
    // loot glints
    const gp = new Float32Array(G.lootPts.length * 3), gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.BufferAttribute(gp, 3));
    const gt = canvasTex(32, 32, c => { const g = c.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.3, 'rgba(255,220,120,.7)'); g.addColorStop(1, 'rgba(255,200,80,0)'); c.fillStyle = g; c.fillRect(0, 0, 32, 32); }, { repeat: false });
    glow = new THREE.Points(gg, new THREE.PointsMaterial({ map: gt, size: .55, sizeAttenuation: true, color: new THREE.Color(2.2, 1.7, .6), transparent: true, opacity: .9, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); glow.frustumCulled = false; G.sceneB.add(glow);
    // lightning bolt
    bolt = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: new THREE.Color(14, 15, 20), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); bolt.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(60 * 6), 3)); bolt.frustumCulled = false; bolt.visible = false; G.sceneB.add(bolt);
    // traders
    const S = G.S, P = G.P;
    trader({ name: 'Kunjappan', sub: 'Tea shop, Thalap junction', line: 'Chaya is hot. The end of the world can wait till the glass is empty.', x: 322, z: 85.5, yaw: 0, skin: 'humanMaleA', skirt: 'mundu', skirtCol: 0xe0dccc, items: [['Chaya and parippuvada (+30 health)', 4, () => P.heal(30)], ['Rice and dried fish (+3 food)', 10, () => { S.food += 3; }], ['First-aid kit', 22, () => { S.meds++; }], ['Glass bottles ×3 (noise lure)', 3, () => { S.bottle = (S.bottle || 0) + 3; }], ['Petrol bomb', 14, () => { S.molotov++; }]] });
    trader({ name: 'Ummer Haji', sub: 'Fish market, Mappila Bay', line: 'Everything has a price, mone. Even now. Especially now.', x: 139.5, z: 676.5, yaw: -Math.PI / 2, skin: 'criminalMaleA', tint: 0xe8d8c8, skirt: 'lungi', skirtCol: 0x7a3a3a, items: [['9mm / .38 ×30', 12, () => G.Wp.addAmmo('p', 30)], ['12-bore shells ×10', 12, () => G.Wp.addAmmo('s', 10)], ['Rifle rounds ×30', 16, () => G.Wp.addAmmo('r', 30)], ['Crossbow bolts ×8', 10, () => G.Wp.addAmmo('b', 8)], ['Sprayer fuel ×80', 12, () => G.Wp.addAmmo('f', 80)], ['Grenade', 28, () => { S.frag++; }], ['Tripmine', 30, () => { S.mine = (S.mine || 0) + 1; }], ['Sell 3 food', -14, () => { S.food -= 3; }, () => S.food >= 3]].concat(Plus.gunStock()) });
    plane = mkPlane();
  };

  Plus.update = dt => {
    const P = G.P, S = G.S, e = G.env, cam = G.camera, body = G.postU.uBody.value > .5;
    // stealth: cover from tall plants, darkness, stillness
    let cov = 1; if (P.crouch && G.Foliage.tallNear(P.x, P.z)) cov *= .3; if (e.night > .5 && !P.lightOn) cov *= .8; if (P.speed < .3) cov *= .9; if (P.loud > .3) cov = 1; P.cover = cov;
    let hunted = 0; for (const z of G.Z.list) if (z.state !== 'dead' && z.tgt === P) hunted++;
    const es = !P.alive || P.veh ? '' : hunted ? 'SPOTTED' : cov < .5 ? 'HIDDEN' : P.crouch ? 'SNEAKING' : ''; eye.style.display = es ? 'block' : 'none'; if (es) { eye.textContent = (hunted ? '◉ ' : '◌ ') + es; eye.style.color = hunted ? '#ff7a66' : cov < .5 ? '#8fd17a' : '#f1ece0'; }
    rec.style.display = body ? 'block' : 'none'; if (body && (G.frame & 15) === 0) { const h = e.hour, s = (h * 3600) | 0; rec.innerHTML = '<span style="color:#ff3a2a">●</span> REC &nbsp; CAM-01 &nbsp; DAY ' + e.day + ' &nbsp; ' + String((s / 3600 | 0) % 24).padStart(2, '0') + ':' + String((s / 60 | 0) % 60).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); }
    // objective marker in the world
    if (G.guide && Math.hypot(G.guide.x - P.x, G.guide.z - P.z) < 5) { G.UI.msg('You are at ' + G.guide.label, 'gold'); G.guide = null; }
    const tg = G.guide || G.M.target; if (tg && P.alive && !G.UI.open) { v.set(tg.x, G.groundAt(tg.x, tg.z) + 2.4, tg.z).project(cam); const d = Math.hypot(tg.x - P.x, tg.z - P.z), behind = v.z > 1; let x = (v.x * .5 + .5), y = (-v.y * .5 + .5); if (behind) { x = 1 - x; y = .92; } x = clamp(x, .06, .94); y = clamp(y, .12, .9); wp.style.display = d > 6 ? 'block' : 'none'; wp.style.left = x * 100 + '%'; wp.style.top = y * 100 + '%'; wp.lastChild.textContent = Math.round(d) + ' m'; } else wp.style.display = 'none';
    // entering a place
    const lc = G.locAt(P.x, P.z); if (lc && lc !== lastLoc) G.UI.msg(lc.name + ' · ' + lc.ml, 'dim'); if (lc) lastLoc = lc;
    // hazards and mines
    for (const h of Plus.haz) if (!h.dead && h.fuse >= 0 && (h.fuse -= dt) <= 0) blowHaz(h);
    if (G.hit('KeyX')) placeMine();
    for (let i = Plus.mines.length - 1; i >= 0; i--) { const m = Plus.mines[i]; m.arm -= dt; m.led.visible = m.arm > 0 ? true : (G.t * 3 % 1) < .5; if (m.arm > 0) continue; let trip = false; for (const z of G.Z.list) if (z.state !== 'dead' && !(z.human && !z.T.hostile) && dist2(z.x, z.z, m.x, m.z) < 3.2) { trip = true; break; } if (!trip) continue; G.scene.remove(m.m); Plus.mines.splice(i, 1); const d = Math.hypot(P.x - m.x, P.z - m.z); G.FX.explode(m.x, m.y + .3, m.z, true); G.Z.blast(m.x, m.y, m.z, 6.5, 320); if (d < 5.5) P.hurt(60 * (1 - d / 5.5), m.x, m.z, 'blast'); P.shake = Math.max(P.shake, clamp(1.3 - d / 16, 0, 1)); G.noise(m.x, m.z, 85); G.Audio.boom(d); }
    // loot glints
    if ((glowT -= dt) <= 0) { glowT = 1.2; const a = glow.geometry.attributes.position.array; let n = 0; G.lootPts.forEach((p, i) => { if (S.looted[i] === undefined && dist2(p.x, p.z, P.x, P.z) < 70 * 70) { a[n++] = p.x; a[n++] = p.y + .85; a[n++] = p.z; } }); glow.geometry.setDrawRange(0, n / 3); glow.geometry.attributes.position.needsUpdate = true; }
    glow.material.opacity = .55 + .35 * Math.sin(G.t * 4);
    // lightning
    if (e.flash > .9 && lastFlash < .5) { const a = bolt.geometry.attributes.position.array, az = Math.random() * TAU, d = rnd(260, 620); let x = P.x + Math.cos(az) * d, z = P.z + Math.sin(az) * d, y = 420, n = 0; while (y > 0 && n < 58) { const nx = x + rnd(-22, 22), nz = z + rnd(-22, 22), ny = y - rnd(18, 34); a[n * 6] = x; a[n * 6 + 1] = y; a[n * 6 + 2] = z; a[n * 6 + 3] = nx; a[n * 6 + 4] = ny; a[n * 6 + 5] = nz; x = nx; y = ny; z = nz; n++; if (Math.random() < .25 && n < 57) { a[n * 6] = x; a[n * 6 + 1] = y; a[n * 6 + 2] = z; a[n * 6 + 3] = x + rnd(-50, 50); a[n * 6 + 4] = y - rnd(20, 60); a[n * 6 + 5] = z + rnd(-50, 50); n++; } } bolt.geometry.setDrawRange(0, n * 2); bolt.geometry.attributes.position.needsUpdate = true; bolt.visible = true; boltT = .22; }
    lastFlash = e.flash; if (boltT > 0 && (boltT -= dt) <= 0) bolt.visible = false; else if (boltT > 0) bolt.material.opacity = Math.random() < .3 ? .2 : 1;
    // traders breathe
    for (const o of Plus.traders) { const T = o.rig.T; G.Rig.reset(T); T.nkY = .3 * Math.sin(G.t * .5 + o.x); T.spZ = .02 * Math.sin(G.t * .8); T.aLx = -.2; T.eL = -.9; G.Rig.apply(o.rig, dt * 5); }
    if (Plus.cure.on) cureUpdate(dt);
  };
})();
