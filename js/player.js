'use strict';
/* UNDERTOW — player: over-the-shoulder / first-person controller, animated player character,
   stamina, dodge, grab struggle, interaction, vehicles (autorickshaw, motorcycle, jeep) */
(function () {
  G.hit = c => G.In.p[c];
  const V3 = THREE.Vector3;
  const P = G.P = { x: 0, y: 0, z: 0, vx: 0, vz: 0, vy: 0, ix: 0, iz: 0, yaw: 0, pitch: 0, recBack: 0, hp: 100, maxHp: 100, stam: 100, stamT: 0, alive: true, crouch: false, sprinting: false, onGround: true, speed: 0, speedN: 0, bob: 0, eye: 1.68, slideT: 0, sdx: 0, sdz: 0, sHit: [], shake: 0, dodgeT: 0, dodgeCd: 0, dvx: 0, dvz: 0, loud: 0, lightOn: false, safe: false, grabber: null, grabN: 0, busy: 0, busyFn: null, hurtT: 9, regenT: 0, veh: null, kickPitch: 0, roll: 0, swim: false, deadT: 0, holdT: 0, holdI: null, near: null,
    tps: true, rig: null, byaw: 0, ph: 0, aimT: 0, camBack: 0, muzzle: new V3(), held: null, heldId: null, mvDir: 1 };
  const VT = G.VT = {
    auto: { name: 'Autorickshaw', label: 'Drive autorickshaw', top: 15.5, acc: 9, turn: .22, r: 1.15, mass: 1, seat: [0, .62, .25], cam: 6.2, exit: 1.6 },
    bike: { name: 'Motorcycle', label: 'Ride motorcycle', top: 25, acc: 15, turn: .2, r: .65, mass: .45, seat: [0, .78, -.22], cam: 5, exit: 1.1, lean: true },
    jeep: { name: 'Jeep', label: 'Drive jeep', top: 21, acc: 11, turn: .19, r: 1.45, mass: 2.4, seat: [-.42, .78, -.15], cam: 7.4, exit: 1.9 },
    van: { name: 'Van', label: 'Drive van', top: 19, acc: 10, turn: .2, r: 1.3, mass: 1.7, seat: [-.4, .72, .55], cam: 6.8, exit: 1.7 },
    truck: { name: 'Lorry', label: 'Drive lorry', top: 15, acc: 6, turn: .14, r: 1.9, mass: 4.6, seat: [-.6, 1.45, 2.3], cam: 9.6, exit: 2.3 },
    boat: { name: 'Fishing boat', label: 'Take the boat out', top: 13, acc: 6, turn: .16, r: 1.4, mass: 2, seat: [0, .45, -1.9], cam: 8.2, exit: 1.7, water: true }
  };
  G.Vehs = []; G.Inter = [];
  G.addInter = o => { G.Inter.push(o); return o; };
  P.teleport = (x, z, yaw) => { P.x = x; P.z = z; P.y = Math.max(G.groundAt(x, z), -1.25); P.vx = P.vz = P.vy = 0; if (yaw !== undefined) { P.yaw = yaw; P.byaw = yaw + Math.PI; } };
  P.hurt = (dmg, fx, fz, kind) => {
    if (!P.alive || G.S.god) return; if (P.veh) dmg *= P.veh.type === 'bike' ? .8 : .45; if (G.S.perk && G.S.perk.tough) dmg *= .85;
    if (G.S.armor > 0) { const ab = Math.min(G.S.armor, dmg * .5); G.S.armor -= ab; dmg -= ab; if (G.S.armor <= 0) { G.S.armor = 0; G.UI && G.UI.msg('Your scrap armour falls apart', 'red'); } }
    P.hp -= dmg; P.hurtT = 0; P.regenT = 7; P.shake = Math.max(P.shake, .5); P.hitDir = Math.atan2(fx - P.x, fz - P.z);
    G.UI && G.UI.hurt(dmg, kind); G.Audio && G.Audio.hurt();
    if (P.hp <= 0) { P.hp = 0; P.alive = false; P.deadT = 0; P.grabber = null; if (P.veh) P.veh = null; G.Audio && G.Audio.death(); if (G.onDeath) G.onDeath(); }
  };
  P.shove = (vx, vz) => { P.ix += vx; P.iz += vz; };
  P.heal = n => { P.hp = Math.min(P.maxHp, P.hp + n); };
  const groundP = (x, z, y) => { let h = G.hAt(x, z); for (const p of G.plats) if (x > p.x0 && x < p.x1 && z > p.z0 && z < p.z1 && p.y > h && p.y <= y + .75) h = p.y; return h; };

  /* ---------- vehicles ---------- */
  const M = (c, r, m) => new THREE.MeshStandardMaterial({ color: col(c), roughness: r === undefined ? .5 : r, metalness: m || 0 });
  function mkVeh(type, paint) {
    const g = new THREE.Group(), wheels = [], dk = M(0x0c0c0e, .6), chrome = M(0xb8bcc4, .25, .6), lampM = new THREE.MeshStandardMaterial({ color: 0x222222, emissive: new THREE.Color(1, .9, .6), emissiveIntensity: 0 });
    const B = (w, h, l, x, y, z, m, rx) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, l), m); b.position.set(x, y, z); if (rx) b.rotation.x = rx; b.castShadow = true; g.add(b); return b; };
    const tube = (ax, ay, az, bx, by, bz, r, m) => { const a = new V3(ax, ay, az), b = new V3(bx, by, bz), L = a.distanceTo(b), t = new THREE.Mesh(new THREE.CylinderGeometry(r, r, L, 8), m); t.position.copy(a).add(b).multiplyScalar(.5); t.quaternion.setFromUnitVectors(new V3(0, 1, 0), b.sub(a).normalize()); t.castShadow = true; g.add(t); return t; };
    const ball = (r, x, y, z, sx, sy, sz, m) => { const s = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), m); s.position.set(x, y, z); s.scale.set(sx, sy, sz); s.castShadow = true; g.add(s); return s; };
    const wheel = (r, w, x, y, z) => { const wg = new THREE.Group(), t = new THREE.Mesh(new THREE.TorusGeometry(r - w * .35, w * .5, 8, 18), dk), h = new THREE.Mesh(new THREE.CylinderGeometry(r * .55, r * .55, w * .5, 12), chrome); t.rotation.y = Math.PI / 2; h.rotation.z = Math.PI / 2; t.castShadow = true; wg.add(t, h); wg.position.set(x, y, z); g.add(wg); wheels.push(wg); return wg; };
    let lamp;
    if (type === 'auto') {
      const bl = M(0x1a1a1c, .4), ye = M(0xe8b818, .5);
      B(1.35, .5, 1.9, 0, .6, 0, bl); B(.9, .75, .6, 0, .72, 1.2, bl); B(1.4, .08, 2.05, 0, 1.78, .05, ye); B(1.36, .5, .08, 0, 1.2, -.92, bl); B(1.3, .3, .06, 0, .9, 1.0, bl);
      for (const sx of [-.66, .66]) { B(.05, 1.0, .05, sx, 1.28, .95, bl); B(.05, 1.0, .05, sx, 1.28, -.9, bl); } B(1.2, .1, .5, 0, .85, -.5, M(0x3a2a20, .8));
      wheel(.25, .14, 0, .25, 1.3); wheel(.25, .14, -.65, .25, -.7); wheel(.25, .14, .65, .25, -.7); lamp = ball(.09, 0, .95, 1.52, 1, 1, 1, lampM);
    } else if (type === 'bike') {
      const pt = M(paint || 0x101216, .3, .3), seat = M(0x2a1c12, .8);
      wheel(.36, .13, 0, .36, .74); wheel(.36, .14, 0, .36, -.72);
      tube(-.07, .36, .74, -.07, 1.02, .5, .025, chrome); tube(.07, .36, .74, .07, 1.02, .5, .025, chrome); tube(-.36, 1.07, .46, .36, 1.07, .46, .02, chrome); tube(-.36, 1.07, .46, -.36, 1.02, .38, .025, dk); tube(.36, 1.07, .46, .36, 1.02, .38, .025, dk);
      tube(0, .95, .42, 0, .78, -.5, .04, pt); tube(0, .92, .42, 0, .42, .28, .035, pt); tube(0, .42, .28, 0, .36, -.72, .03, pt); tube(0, .78, -.5, 0, .36, -.72, .03, pt);
      ball(.2, 0, .86, .1, .85, .68, 1.45, pt); B(.27, .09, .62, 0, .82, -.42, seat); B(.3, .06, .36, 0, .64, -.72, pt, .25); B(.26, .05, .3, 0, .7, .74, pt, -.2);
      B(.26, .32, .36, 0, .5, 0, M(0x3a3c40, .4, .5)); ball(.12, 0, .44, 0, 1.3, 1, 1, chrome); tube(.17, .34, .1, .2, .32, -.95, .045, chrome); lamp = ball(.1, 0, .98, .6, 1, 1, .8, lampM); ball(.04, 0, .72, -.92, 1, 1, 1, M(0xaa1010, .4));
    } else if (type === 'jeep') {
      const pt = M(paint || 0x4a5a34, .55), sd = M(0x2a2a26, .8);
      B(1.72, .5, 3.5, 0, .78, 0, pt); B(1.62, .32, 1.15, 0, 1.19, 1.15, pt); B(1.72, .42, .12, 0, 1.24, -1.72, pt); B(.1, .42, 1.5, -.83, 1.24, -.95, pt); B(.1, .42, 1.5, .83, 1.24, -.95, pt); B(1.5, .3, .08, 0, 1.0, 1.75, dk);
      for (let i = 0; i < 6; i++) B(.06, .22, .03, -.4 + i * .16, 1.02, 1.8, chrome); B(1.8, .12, .14, 0, .6, 1.82, dk); B(1.8, .12, .14, 0, .6, -1.82, dk);
      tube(-.8, 1.35, .56, -.8, 1.95, .46, .035, dk); tube(.8, 1.35, .56, .8, 1.95, .46, .035, dk); tube(-.8, 1.95, .46, .8, 1.95, .46, .035, dk);
      tube(-.8, 1.25, -.5, -.8, 2.0, -.5, .04, dk); tube(.8, 1.25, -.5, .8, 2.0, -.5, .04, dk); tube(-.8, 2.0, -.5, .8, 2.0, -.5, .04, dk); tube(-.8, 2.0, -.5, -.8, 1.3, -1.6, .035, dk); tube(.8, 2.0, -.5, .8, 1.3, -1.6, .035, dk);
      B(.5, .12, .5, -.42, 1.02, -.15, sd); B(.5, .5, .1, -.42, 1.3, -.42, sd); B(.5, .12, .5, .42, 1.02, -.15, sd); B(.5, .5, .1, .42, 1.3, -.42, sd); tube(-.42, 1.38, .5, -.42, 1.5, .25, .02, dk);
      wheel(.42, .26, -.86, .42, 1.15); wheel(.42, .26, .86, .42, 1.15); wheel(.42, .26, -.86, .42, -1.15); wheel(.42, .26, .86, .42, -1.15);
      const sp = wheel(.4, .24, 0, 1.2, -1.9); sp.rotation.y = Math.PI / 2; wheels.pop(); lamp = ball(.1, -.6, 1.05, 1.76, 1, 1, .6, lampM); ball(.1, .6, 1.05, 1.76, 1, 1, .6, lampM);
    } else if (type === 'van') {
      const pt = M(paint || 0xe8e8e0, .5), rd2 = M(0xb01818, .5);
      B(1.6, 1.25, 3.4, 0, 1.05, 0, pt); B(1.62, .5, 2.3, 0, 1.38, .35, dk); B(1.4, .55, .06, 0, 1.36, 1.71, dk); B(1.63, .14, 3.42, 0, .86, 0, rd2); B(1.66, .14, .12, 0, .5, 1.72, dk); B(1.66, .14, .12, 0, .5, -1.72, dk); B(.5, .16, .03, 0, 1.2, -1.71, rd2); B(.16, .5, .03, 0, 1.2, -1.72, rd2);
      wheel(.3, .2, -.8, .3, 1.15); wheel(.3, .2, .8, .3, 1.15); wheel(.3, .2, -.8, .3, -1.15); wheel(.3, .2, .8, .3, -1.15); lamp = ball(.09, -.55, .85, 1.7, 1, 1, .6, lampM); ball(.09, .55, .85, 1.7, 1, 1, .6, lampM);
    } else if (type === 'truck') {
      const pt = M(paint || 0xc87818, .5), tarp = M(0x2f5fae, .8), wd = M(0x3a2a1c, .9), yl = M(0xe8c020, .5);
      B(2.2, 1.9, 1.9, 0, 1.85, 2.3, pt); B(1.9, .7, .06, 0, 2.2, 3.26, dk); B(2.24, .3, .08, 0, 2.95, 3.24, yl); B(2.3, .25, 5.4, 0, 1.0, -1.3, wd); B(2.25, 1.5, 5.1, 0, 1.9, -1.35, tarp); B(2.3, .2, .2, 0, .6, 3.3, dk); B(2.3, .25, 7, 0, .75, .2, dk);
      wheel(.5, .3, -1.0, .5, 2.3); wheel(.5, .3, 1.0, .5, 2.3); wheel(.5, .3, -1.0, .5, -1.5); wheel(.5, .3, 1.0, .5, -1.5); wheel(.5, .3, -1.0, .5, -2.7); wheel(.5, .3, 1.0, .5, -2.7); lamp = ball(.11, -.8, 1.2, 3.27, 1, 1, .6, lampM); ball(.11, .8, 1.2, 3.27, 1, 1, .6, lampM);
    } else {
      const pt = M(paint || 0x2a6a9a, .5), wd = M(0x6a4a30, .9), wh = M(0xe8e4d8, .6);
      ball(1, 0, .3, 0, 1.3, .6, 4.3, pt); B(1.9, .08, 5.6, 0, .62, 0, wd); B(1.4, 1.2, 1.7, 0, 1.25, -1.7, wh); B(1.6, .08, 1.9, 0, 1.88, -1.7, pt); B(1.2, .5, .06, 0, 1.4, -.84, dk); tube(0, .6, 1.2, 0, 3.4, 1.2, .05, wd); tube(0, 3.2, 1.2, 0, 1.9, -1.0, .015, dk); B(.4, .6, .5, 0, .7, -3.7, dk); B(2.0, .12, .12, 0, .72, 3.2, wh);
      lamp = ball(.1, 0, 1.0, 3.6, 1, 1, 1, lampM);
    }
    G.scene.add(g);
    const v = { type, T: VT[type], x: 0, z: 0, y: 0, yaw: 0, sp: 0, roll: 0, mesh: g, wheels, lamp, nz: 0 };
    v.inter = { label: () => type === 'auto' && !G.S.autoOk ? 'Achan has the keys' : v.T.label, fn: () => { if (P.grabber) return; if (type === 'auto' && !G.S.autoOk) { G.UI.msg('Achan keeps the auto keys — earn them first', 'dim'); return; } P.veh = v; P.crouch = false; G.vehLight.position.set(0, 1, 1.5); G.vehLight.target.position.set(0, .2, 9); v.mesh.add(G.vehLight, G.vehLight.target); G.Audio && G.Audio.click(.6); G.UI && G.UI.msg('W/S drive · A/D steer · Space brake · E get off'); } };
    G.Vehs.push(v); return v;
  }
  const place = (v, x, z, yaw) => { v.x = x; v.z = z; v.yaw = yaw; v.sp = 0; v.y = v.T.water ? -.12 : G.groundAt(x, z); };
  G.Veh = null;
  P.init = () => {
    G.vehLight = new THREE.SpotLight(0xfff0d0, 0, 48, .6, .6, 1.2); G.scene.add(G.vehLight, G.vehLight.target);
    const S = G.S, a = G.poi.autoStart, def = [['auto', a.x, a.z, a.yaw], ['bike', 244, 122, 1.2, 0x101216], ['bike', 327, 93, .4, 0x7a1414], ['bike', 368, 432, 2, 0x16304a], ['bike', 143, 692, 1.2, 0x101216], ['bike', 262, -704, 1.5, 0x2a3a1a], ['jeep', 66, 546, 1.7, 0x4a5a34], ['jeep', 432, 431, 1.5, 0x1e2c4e], ['jeep', 318, -664, 0, 0x4a5a34], ['van', 345, 79, .2, 0xe8e8e0], ['van', 419, -651, 1.6, 0xe8e8e0], ['truck', 188, 702, 1.5, 0xc87818], ['truck', 336, -108, 0, 0x2e7a4a], ['truck', 484, -352, 1.2, 0x8a8a8a], ['boat', 8, 709, 1.57, 0x2a6a9a], ['boat', G.coast(120) - 16, 122, 3.2, 0xb02a2a], ['boat', 140, -711, 1.5, 0x2a8a5a], ['bike', 446, -300, 2, 0x101216]];
    def.forEach((d, i) => { const v = mkVeh(d[0], d[4]); const sv = S.vehs && S.vehs[i]; if (sv) place(v, sv[0], sv[1], sv[2]); else place(v, d[1], d[2], d[3]); });
    G.Veh = G.Vehs[0];
    const rig = P.rig = G.Rig.make({ skin: 'survivorMaleB', scale: 1 }); G.scene.add(rig.root);
    // laser sight
    const lm = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.5, .1, .05), transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
    P.laser = new THREE.Mesh(new THREE.BoxGeometry(.012, .012, 1), lm); P.dot = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(4, .2, .1), fog: false })); P.laser.frustumCulled = false; P.laser.visible = P.dot.visible = false; G.sceneB.add(P.laser, P.dot);
  };
  P.syncHeld = () => { const W = G.Wp, id = W.st.cur === 3 ? 'm:' + G.S.melee : W.curId(), key = id + JSON.stringify(id && id[1] !== ':' ? G.S.guns[id] : 0); if (key === P.heldId || !P.rig) return; P.heldId = key; if (P.held) P.held.parent.remove(P.held); P.held = W.st.cur === 3 ? W.worldMelee(G.S.melee) : W.worldGun(id); G.Rig.hold(P.rig, P.held); };

  function drive(dt) {
    const In = G.In, k = In.k, acc = (k.KeyW ? 1 : 0) - (k.KeyS ? 1 : 0), steer = (k.KeyA ? 1 : 0) - (k.KeyD ? 1 : 0), V = P.veh, T = V.T;
    if (acc > 0) V.sp += T.acc * (1 - Math.max(0, V.sp) / T.top * .6) * dt; else if (acc < 0) V.sp -= (V.sp > 0 ? 18 : 5) * dt; V.sp *= 1 - dt * (k.Space ? 3.2 : .45); V.sp = clamp(V.sp, -5, T.top);
    const road = G.maskAt(V.x, V.z) === 1; if (!road && !T.water && Math.abs(V.sp) > T.top * .62) V.sp *= 1 - dt * 1.3;
    V.yaw += steer * clamp(V.sp * T.turn, -1.6, 1.6) * dt; V.roll += ((T.lean ? -steer * clamp(V.sp / 16, 0, 1) * .5 : 0) - V.roll) * Math.min(1, dt * 6);
    const fx = Math.sin(V.yaw), fz = Math.cos(V.yaw), ox = V.x, oz = V.z;
    V.x += fx * V.sp * dt; V.z += fz * V.sp * dt;
    if (T.water ? G.hAt(V.x, V.z) > -.7 : G.hAt(V.x, V.z) < -.45) { V.x = ox; V.z = oz; V.sp *= -.2; }
    if (T.water && Math.abs(V.sp) > 2 && Math.random() < .6) G.FX.splash(V.x - fx * 3.4 + rnd(-.6, .6), V.z - fz * 3.4 + rnd(-.6, .6), 2);
    if (G.resolve(V, T.r, V.y, 'gate')) { const s = Math.abs(V.sp); if (s > 4) { P.shake = .6; G.Audio && G.Audio.thud(true); G.FX.sparks(V.x + fx, V.y + .6, V.z + fz, -fx, .5, -fz, 6); } V.sp *= .5; if (T.lean && s > 13) { P.veh = null; P.hurt(8 + s, V.x + fx, V.z + fz, 'crash'); P.shove(fx * s * .6, fz * s * .6); G.UI && G.UI.msg('Thrown off the bike!', 'red'); return; } }
    V.y += ((T.water ? G.seaY(V.x, V.z, G.t) - .12 : groundP(V.x, V.z, V.y)) - V.y) * Math.min(1, dt * 12);
    if (Math.abs(V.sp) > 2.5) for (const z of G.Z.list) { if (z.state === 'dead') continue; const dx = z.x - V.x, dz = z.z - V.z, d = Math.hypot(dx, dz); if (d < T.r + .35 + z.r && (dx * fx + dz * fz) * Math.sign(V.sp) > -.3) { const s = Math.abs(V.sp), sg = Math.sign(V.sp); G.FX.blood(z.x, z.y + 1, z.z, fx, .5, fz, 14); if (!G.Z.damage(z, 'torso', s * 14 * Math.sqrt(T.mass) + 20, fx * sg, 0, fz * sg, { heavy: true, sever: 1.5, how: 'road', knock: s * .8 })) G.Z.knock(z, dx / (d || 1) * .5 + fx * sg, dz / (d || 1) * .5 + fz * sg, s * .8); V.sp *= z.type === 'brute' ? .3 : 1 - .16 / T.mass; P.shake = Math.max(P.shake, .35); G.Audio && G.Audio.thud(true); if (T.lean && (s > 17 || z.type === 'brute')) { P.veh = null; P.hurt(10, z.x, z.z, 'crash'); P.shove(fx * 6, fz * 6); return; } } }
    V.nz -= dt; if (V.nz <= 0) { V.nz = .8; G.noise(V.x, V.z, 24 + Math.abs(V.sp) * 1.5); }
    P.x = V.x; P.z = V.z; P.y = V.y; P.speed = Math.abs(V.sp); P.speedN = 0;
    if (G.hit('KeyE') && Math.abs(V.sp) < 3.5) { P.veh = null; P.x = V.x + Math.cos(V.yaw) * T.exit; P.z = V.z - Math.sin(V.yaw) * T.exit; G.resolve(P, .4, P.y); V.sp = 0; G.Audio && G.Audio.click(.6); }
    G.Audio && G.Audio.engine(Math.abs(V.sp) / T.top, true, V.type);
  }
  function walk(dt) {
    const In = G.In, k = In.k, f = (k.KeyW ? 1 : 0) - (k.KeyS ? 1 : 0), s = (k.KeyD ? 1 : 0) - (k.KeyA ? 1 : 0), W = G.Wp.st;
    const sy = Math.sin(P.yaw), cy = Math.cos(P.yaw); let wx = -sy * f + cy * s, wz = -cy * f - sy * s; const l = Math.hypot(wx, wz); if (l > 1) { wx /= l; wz /= l; }
    const hT = G.hAt(P.x, P.z); P.swim = hT < -1.25 && P.y < -1.2;
    const free = !P.grabber && P.busy <= 0;
    if (G.hit('KeyC') || G.hit('ControlLeft')) { if (free && P.sprinting && P.onGround && P.stam > 12 && P.speed > 5 && !P.swim) { const d0 = Math.hypot(P.vx, P.vz) || 1; P.slideT = .85; P.sdx = P.vx / d0 * 10; P.sdz = P.vz / d0 * 10; P.crouch = true; P.stam -= 12; P.stamT = .8; P.sHit = []; G.Audio && G.Audio.swing(); G.FX.dust(P.x, P.y + .05, P.z, 6); } else P.crouch = !P.crouch; }
    P.sprinting = free && k.ShiftLeft && f > 0 && P.stam > 1 && !P.crouch && W.ads < .3 && !P.swim && W.swing <= 0 && !G.In.mb[0] && !(P.slideT > 0);
    let top = P.swim ? 2.3 : P.crouch ? 2.0 : P.sprinting ? 6.9 : 4.3; if (W.ads > .5) top *= .55; if (hT < -.35 && !P.swim) top *= .62; if (!free) top = 0; if (W.swing > 0) top *= W.quick && W.swingKind === 'light' ? .7 : .15;
    const ac = P.onGround ? 11 : 2.5; P.vx += (wx * top - P.vx) * Math.min(1, dt * ac); P.vz += (wz * top - P.vz) * Math.min(1, dt * ac);
    P.dodgeCd -= dt; P.dodgeT -= dt;
    if (free && G.hit('KeyQ') && P.dodgeCd <= 0 && P.stam >= 20 && P.onGround) { let dx = wx, dz = wz; if (l < .1) { dx = sy; dz = cy; } P.dvx = dx * 10.5; P.dvz = dz * 10.5; P.dodgeT = .34; P.dodgeCd = .75; P.stam -= 22; P.stamT = .9; P.crouch = false; G.Audio && G.Audio.swing(); }
    let mx = P.vx, mz = P.vz; if (P.dodgeT > 0) { mx = P.dvx; mz = P.dvz; }
    if (P.slideT > 0) { P.slideT -= dt; const kS = .3 + .7 * Math.max(0, P.slideT / .85); mx = P.sdx * kS; mz = P.sdz * kS; P.vx = mx; P.vz = mz; if (Math.random() < .5) G.FX.dust(P.x - P.sdx * .05, P.y + .05, P.z - P.sdz * .05, 1);
      if (!P.onGround || G.blocked(P.x + P.sdx * .06, P.z + P.sdz * .06, .3)) P.slideT = 0;
      for (const z of G.Z.list) { if (z.state === 'dead' || P.sHit.includes(z)) continue; const dx = z.x - P.x, dz = z.z - P.z, d = Math.hypot(dx, dz); if (d < 1.25 && dx * P.sdx + dz * P.sdz > 0) { P.sHit.push(z); G.FX.blood(z.x, z.y + .5, z.z, P.sdx * .1, .4, P.sdz * .1, 6); if (!G.Z.damage(z, Math.random() < .5 ? 'legL' : 'legR', 24, P.sdx / 10, 0, P.sdz / 10, { how: 'kick', heavy: true })) G.Z.knock(z, P.sdx / 10, P.sdz / 10, 6); P.shake = Math.max(P.shake, .3); G.Audio && G.Audio.thud(true); G.UI && G.UI.style && G.UI.style('SLIDE TACKLE', 0); } } }
    mx += P.ix; mz += P.iz; const dk = Math.max(0, 1 - dt * 6); P.ix *= dk; P.iz *= dk;
    if (free && G.hit('Space') && P.onGround && !P.swim && P.stam > 6) { P.vy = 5.3; P.onGround = false; P.stam -= 6; P.stamT = .6; P.crouch = false; }
    P.x += mx * dt; P.z += mz * dt; G.resolve(P, .38, P.y, 'gate');
    P.x = clamp(P.x, -330, 598); P.z = clamp(P.z, -935, 935);
    const g = Math.max(groundP(P.x, P.z, P.y), -1.25);
    P.vy -= 15 * dt; P.y += P.vy * dt;
    if (P.y <= g) { if (P.vy < -9) P.hurt((-P.vy - 9) * 6, P.x, P.z, 'fall'); if (!P.onGround && P.vy < -3) { P.shake = Math.max(P.shake, .2); G.Audio && G.Audio.step(P, true); } P.y = g; P.vy = 0; P.onGround = true; }
    else if (P.y - g < .35 && P.vy <= 0) { P.y = g; P.vy = 0; P.onGround = true; } else P.onGround = false;
    P.speed = Math.hypot(mx, mz); P.speedN += (clamp(P.speed / 4.3, 0, 1.5) * (P.onGround ? 1 : 0) - P.speedN) * Math.min(1, dt * 8);
    const pb = P.bob; P.bob += P.speed * dt * (P.sprinting ? 1.55 : 1.9);
    if (P.onGround && P.speed > .5 && Math.floor(P.bob / Math.PI) !== Math.floor(pb / Math.PI)) { G.Audio && G.Audio.step(P, false); if (hT < -.05) G.FX.splash(P.x, P.z, 3); if (!P.crouch) G.noise(P.x, P.z, P.sprinting ? 15 : 7); }
    // character facing: toward the camera heading while aiming/fighting, else toward travel
    const aiming = W.ads > .2 || P.aimT > 0 || W.swing > 0 || P.grabber; let ty = P.yaw + Math.PI;
    if (!aiming && P.speed > .8 && !P.tpsStrafe) ty = Math.atan2(mx, mz);
    P.byaw += angDiff(ty, P.byaw) * Math.min(1, dt * (aiming ? 16 : 9)); P.mvDir = P.speed > .5 && (mx * Math.sin(P.byaw) + mz * Math.cos(P.byaw)) < -.2 ? -1 : 1;
    // stamina
    P.stamT -= dt; if (P.sprinting) { P.stam -= 13 * dt; P.stamT = .8; } else if (P.stamT <= 0) P.stam = Math.min(100, P.stam + (P.speed < .5 ? 26 : 16) * dt);
    P.regenT -= dt; if (P.regenT <= 0 && P.hp < 40) P.hp = Math.min(40, P.hp + 3 * dt);
    if (P.grabber) { P.hurtT = Math.min(P.hurtT, .3); P.hp -= 5 * dt; P.shake = Math.max(P.shake, .35); const z = P.grabber; P.yaw += angDiff(Math.atan2(z.x - P.x, z.z - P.z) + Math.PI, P.yaw) * Math.min(1, dt * 8); if (G.hit('KeyF') || G.hit('KeyE') || In.mp[0]) { P.grabN++; P.shake = .6; if (P.grabN >= 5) { const dx = z.x - P.x, dz = z.z - P.z, d = Math.hypot(dx, dz) || 1; P.grabber = null; G.Z.knock(z, dx / d, dz / d, 5); G.FX.blood(z.x, z.y + 1.4, z.z, dx / d, .3, dz / d, 5); G.Audio && G.Audio.thud(true); P.dodgeT = .6; } } if (P.hp <= 0 && P.alive) P.hurt(1, z.x, z.z, 'bite'); }
    { let inF = false; for (const f of G.FX.fires) if (dist2(P.x, P.z, f.x, f.z) < f.r * f.r * .7 && P.y < f.y + 1) { inF = true; break; } if (inF) { P.fireT = (P.fireT || 0) + dt; if (P.fireT > .35) { P.fireT = 0; P.hurt(5, P.x + .1, P.z, 'fire'); G.UI && G.UI.msg('You are standing in fire!', 'red'); } } }
    if (free && G.hit('KeyH') && G.S.meds > 0 && P.hp < P.maxHp - 1) { P.busy = 1.3; P.busyLabel = 'Bandaging…'; P.busyMax = 1.3; P.busyFn = () => { G.S.meds--; P.heal(55 * (G.S.perk && G.S.perk.medic ? 1.4 : 1)); G.UI && G.UI.msg('Used first-aid kit', 'green'); }; G.Audio && G.Audio.click(.4); }
    if (P.busy > 0) { P.busy -= dt; if (P.busy <= 0) { P.busy = 0; if (P.busyFn) { const fn = P.busyFn; P.busyFn = null; fn(); } } } else if (P.busy !== 0) P.busy = 0;
    if (G.hit('KeyT')) { P.lightOn = !P.lightOn; G.Audio && G.Audio.click(.8); }
    if (G.hit('KeyB')) { P.tps = !P.tps; G.set.tps = P.tps; G.saveSet(); G.UI && G.UI.msg(P.tps ? 'Over-the-shoulder view' : 'First-person view', 'dim'); }
    P.loud = Math.max(0, P.loud - dt * 2);
    // interaction
    let best = null, bd = 1e9; const fxw = -sy, fzw = -cy;
    if (free) {
      for (const it of G.Inter) { if (it.on && !it.on()) continue; const dx = it.x - P.x, dz = it.z - P.z, d = Math.hypot(dx, dz), r = it.r || 2.3; if (d > r) continue; if (d > .9 && (dx * fxw + dz * fzw) / d < .25) continue; if (d < bd) { bd = d; best = it; } }
      if (!best) for (const v of G.Vehs) { const d = dist2(P.x, P.z, v.x, v.z); if (d < sq(v.T.r + 1.5) && d < bd) { bd = d; best = v.inter; } }
    }
    P.near = best;
    if (best && k.KeyE) { if (best.hold) { if (P.holdI !== best) { P.holdI = best; P.holdT = 0; } P.holdT += dt; if (P.holdT >= best.hold) { P.holdT = 0; P.holdI = null; In.k.KeyE = 0; best.fn(best); } } else if (G.hit('KeyE')) best.fn(best); } else { P.holdT = 0; P.holdI = null; }
  }

  /* ---------- the character you see ---------- */
  function pose(dt) {
    const r = P.rig, T = r.T, W = G.Wp.st, id = G.Wp.curId(), D = id && G.Wp.DEFS[id], long = D && D.cls !== 'pistol', R = G.Rig; R.reset(T); let k = 14;
    if (!P.alive) { T.bRx = -Math.PI / 2; T.bY = .13; T.aLz = 1.1; T.aRz = -1.2; T.kL = .5; T.lRx = -.2; T.nkY = .6; R.apply(r, dt * 6); return; }
    if (P.veh) { const b = P.veh.type === 'bike'; T.lLx = T.lRx = b ? -1.15 : -1.45; T.kL = T.kR = b ? 1.25 : 1.4; T.lLz = b ? .35 : .08; T.lRz = b ? -.35 : -.08; T.spX = b ? .28 : .05; T.aLx = T.aRx = b ? -1.05 : -1.2; T.aLz = b ? .28 : -.05; T.aRz = b ? -.28 : .05; T.eL = T.eR = b ? -.35 : -.5; T.nkX = b ? -.25 : 0; const st = ((G.In.k.KeyA ? 1 : 0) - (G.In.k.KeyD ? 1 : 0)); T.aLx += st * .15; T.aRx -= st * .15; R.apply(r, dt * 10); return; }
    P.ph += P.speed * dt * (P.sprinting ? 2.5 : 3.1) * P.mvDir; const s = Math.sin(P.ph), c = Math.cos(P.ph), run = P.sprinting ? 1 : 0, amp = clamp(P.speed / 4.3, 0, 1.25) * (P.onGround ? 1 : .4);
    T.lLx = -s * (.6 + .3 * run) * amp; T.lRx = s * (.6 + .3 * run) * amp; T.kL = Math.max(0, c * P.mvDir) * (1.0 + .5 * run) * amp + .05; T.kR = Math.max(0, -c * P.mvDir) * (1.0 + .5 * run) * amp + .05;
    T.hY = .94 - Math.abs(c) * .035 * amp; T.spX = .05 * amp + .2 * run; T.spY = .13 * s * amp; T.spZ = .03 * c * amp;
    T.aLx = s * (.5 + .4 * run) * amp; T.aRx = -s * (.5 + .4 * run) * amp; T.eL = T.eR = -.2 - .7 * run * amp - .15 * amp; T.nkX = -T.spX * .6;
    if (!P.onGround) { T.lLx = -.5; T.kL = .9; T.lRx = .25; T.kR = .5; T.aLz = .6; T.aRz = -.6; }
    if (P.crouch) { T.hY = .62; T.lLx -= .95; T.lRx -= .55; T.kL += 1.6; T.kR += 1.55; T.spX += .38; T.nkX -= .3; }
    if (P.swim) { T.bRx = 1.15; T.bY = -.2; T.aLx = -2.6 + s * .6; T.aRx = -2.6 - s * .6; T.lLx = s * .4; T.lRx = -s * .4; T.nkX = -.8; }
    const pit = P.pitch, a = Math.max(W.ads, P.aimT > 0 ? 1 : 0), rl = W.reloading && D ? Math.sin(clamp(1 - W.reloadT / D.reload, 0, 1) * Math.PI) : 0;
    if (W.cur !== 3 && D && W.swing <= 0) {
      // weapon carried, then raised to aim
      let rx, rz, re, lx, lz, le, ry = 0;
      if (long) { rx = lerp(-.12 + T.aRx * .15, -1.12 - pit * .9, a); rz = lerp(.05, .12, a); re = lerp(-1.0, -1.3, a); lx = lerp(-.7, -1.45 - pit * .9, a); lz = lerp(-.5, -.42, a); le = lerp(-1.0, -.4, a); T.spY += .34 * a; ry = 0; }
      else { rx = lerp(-.3 + T.aRx * .5, -1.5 - pit * .92, a); rz = lerp(-.05, .2, a); re = lerp(-1.0, -.06, a); lx = lerp(T.aLx, -1.5 - pit * .92, a); lz = lerp(.1, -.32, a); le = lerp(T.eL, -.14, a); }
      T.aRx = rx - W.kick * .1; T.aRz = rz; T.eR = re - W.kick * .12; T.aLx = lx - (long ? W.kick * .06 : 0); T.aLz = lz; T.eL = le; T.spX += -pit * .35 * a - W.kick * .03; T.nkX += -pit * .3 * a;
      if (rl) { T.aRx = lerp(T.aRx, -.75, rl); T.eR = lerp(T.eR, -1.5, rl); T.aLx = lerp(T.aLx, -.95, rl); T.aLz = lerp(T.aLz, -.5, rl); T.eL = lerp(T.eL, -1.95, rl); T.nkX += .25 * rl; }
      if (W.pumpT > 0 && D && (D.pump || D.bolt)) { const pu = Math.sin((1 - W.pumpT / .55) * Math.PI); T.eL += pu * .5; T.aLx += pu * .25; }
    } else if (W.cur === 3 && W.swing <= 0) { T.aRx = -.35 + T.aRx * .5 - W.heavy * 1.5; T.eR = -1.0; T.aRz = -.2 - W.heavy * .3; }
    if (W.swing > 0) {
      const u = 1 - W.swing / W.swingDur, kd = W.swingKind, w = clamp(u / .3, 0, 1), h = clamp((u - .3) / .22, 0, 1), o = clamp((u - .62) / .38, 0, 1); k = 24;
      if (kd === 'kick') { T.lRx = lerp(lerp(0, -1.25, w), -1.6, h) * (1 - o); T.kR = lerp(lerp(0, 1.75, w), .05, h) * (1 - o) + o * .3; T.hRx = -.5 * h * (1 - o); T.spX = -.12 * w - .25 * h * (1 - o); T.lLx = .12; T.kL = .2; T.aLx = T.aRx = -.9; T.eL = T.eR = -1.7; T.aLz = .35; T.aRz = -.35; T.spY = -.35 * h * (1 - o); }
      else if (kd === 'stomp') { T.lRx = lerp(0, -1.45, w) * (1 - h) - .35 * h; T.kR = lerp(0, 1.7, w) * (1 - h) + .1; T.spX = .1 + .45 * h; T.hY = .94 - .1 * h; T.aLz = .6; T.aRz = -.6; T.aLx = T.aRx = -.4 - .5 * w * (1 - h); }
      else if (kd === 'execute') { T.aRx = lerp(-2.9, -.55, h); T.aLx = lerp(-2.8, -.6, h); T.aRz = .25; T.aLz = -.25; T.eR = T.eL = lerp(-.5, -.25, h); T.spX = lerp(-.3, .85, h) * (1 - o * .6); T.hY = .94 - .16 * h; T.kL = T.kR = .5 * h; T.lLx = T.lRx = -.3 * h; }
      else if (kd === 'light' && W.cstep === 2) { T.aRx = lerp(-.6, -1.55, h); T.eR = lerp(-1.6, -.05, h); T.aRz = .15; T.spX += .35 * h * (1 - o); T.spY = .3 * h; T.aLx = -.5; T.eL = -1.3; T.lLx -= .45 * h * (1 - o); T.kL += .4 * h; }
      else { const hv = kd === 'heavy' ? 1.35 : 1; T.aRx = lerp(lerp(T.aRx, -2.5 * hv, w), -.7, h); T.aRz = lerp(-.7 * w, 1.05, h) * (1 - o); T.eR = lerp(-.7, -.15, h); T.spY = lerp(-.55 * w * hv, .7 * hv, h) * (1 - o); T.spX += .28 * h * (1 - o); T.aLx = -.6; T.aLz = .3; T.eL = -1.2; T.lLx -= .2 * h; T.kL += .3 * h; }
    }
    if (P.dodgeT > 0) { T.hY = .66; T.spX = .6; T.lLx = -1.0; T.kL = 1.5; T.lRx = .5; T.kR = 1.0; T.aLx = -.6; T.aRx = -.4; T.eL = T.eR = -1.4; k = 22; }
    if (P.grabber) { const j = Math.sin(G.t * 22) * .12; T.aLx = T.aRx = -1.35 + j; T.eL = T.eR = -1.15; T.aLz = -.2; T.aRz = .2; T.spX = -.3; T.spZ = j; T.nkX = -.35; T.nkY = j * 2; }
    if (P.hurtT < .22) { T.spX -= .3; T.nkX += .3; T.spZ += Math.sin(P.hitDir - P.byaw) * .25; }
    if (P.busy > 0) { T.aLx = -1.2; T.eL = -1.7; T.aRx = -1.0; T.eR = -1.6; T.aRz = .5; T.nkX = .4; }
    R.apply(r, dt * k);
  }
  const f3 = new V3(), rt = new V3(), piv = new V3(), tmp = new V3(), e3 = new V3();
  P.update = dt => {
    if (P.grabber && (P.veh || !P.alive || P.grabber.state !== 'grab' || G.Z.list.indexOf(P.grabber) < 0)) P.grabber = null;
    if (P.veh && P.busy > 0) { P.busy = 0; P.busyFn = null; }
    { const W0 = G.Wp.st; for (const k of ['swing', 'swingDur', 'equipT', 'cool', 'reloadT', 'legT']) if (W0[k] !== W0[k]) W0[k] = 0; }
    const In = G.In, cam = G.camera, W = G.Wp.st, sens = .0021 * G.set.sens * (cam.fov / G.set.fov);
    if (P.alive) {
      P.yaw -= In.mx * sens; P.pitch -= In.my * sens; const ak = In.k; P.yaw += ((ak.ArrowLeft ? 1 : 0) - (ak.ArrowRight ? 1 : 0)) * dt * 2; P.pitch += ((ak.ArrowUp ? 1 : 0) - (ak.ArrowDown ? 1 : 0)) * dt * 1.4;
      const rb = Math.min(P.recBack, dt * .5 + P.recBack * dt * 6); P.pitch -= rb; P.recBack -= rb; P.pitch = clamp(P.pitch, -1.4, 1.4);
      P.aimT -= dt; if (P.veh) drive(dt); else { walk(dt); G.Audio && G.Audio.engine(0, false); }
    } else { P.deadT += dt; P.vy = 0; }
    P.hurtT += dt; P.shake = Math.max(0, P.shake - dt * 2.2);
    const sh = P.shake * P.shake, k = G.In.k, V = P.veh, fpv = !P.tps || W.scoped;
    const eyeT = !P.alive ? .35 : P.slideT > 0 ? .78 : P.swim ? 1.62 : P.crouch ? 1.05 : 1.68; P.eye += (eyeT - P.eye) * Math.min(1, dt * 9);
    const cp = Math.cos(P.pitch), sp = Math.sin(P.pitch); f3.set(-Math.sin(P.yaw) * cp, sp, -Math.cos(P.yaw) * cp); rt.set(Math.cos(P.yaw), 0, -Math.sin(P.yaw));
    if (V) {
      const pc = Math.cos(P.pitch * .6 - .22), d = V.T.cam; cam.position.set(V.x + Math.sin(P.yaw) * d * pc, V.y + 2.3 - Math.sin(P.pitch * .6 - .22) * d, V.z + Math.cos(P.yaw) * d * pc); const gy = G.groundAt(cam.position.x, cam.position.z) + .4; if (cam.position.y < gy) cam.position.y = gy; cam.rotation.set(P.pitch * .6 - .22 + rnd(-1, 1) * sh * .02, P.yaw, 0, 'YXZ');
    } else if (fpv && P.alive) {
      const bobY = Math.abs(Math.cos(P.bob)) * .035 * P.speedN + (P.swim ? Math.sin(G.t * 2) * .05 : 0), sIn = (k.KeyD ? 1 : 0) - (k.KeyA ? 1 : 0); P.roll += (-sIn * .012 * P.speedN + (P.slideT > 0 ? .07 : 0) - P.roll) * Math.min(1, dt * 6);
      cam.position.set(P.x + rnd(-1, 1) * sh * .03, P.y + P.eye + bobY + rnd(-1, 1) * sh * .03, P.z); cam.rotation.set(P.pitch + P.kickPitch + Math.sin(G.t * 1.3) * .004 + Math.sin(G.t * 2.9) * .003 * (1 + P.speedN * 3) + rnd(-1, 1) * sh * .025, P.yaw + Math.sin(G.t * 1.1 + 2) * .003 + rnd(-1, 1) * sh * .02, P.roll + (P.rollK || 0) + Math.sin(P.bob) * .006 * P.speedN + rnd(-1, 1) * sh * .02, 'YXZ'); P.camBack = 0; P.rollK = (P.rollK || 0) * Math.max(0, 1 - dt * 9);
    } else {
      // over the shoulder
      const a = P.alive ? W.ads : 0, side = P.alive ? lerp(.72, .78, a) : 0, back = P.alive ? lerp(3.0, 1.75, a) : 3.4 + Math.min(2, P.deadT), up = lerp(.22, .2, a);
      piv.set(P.x, P.y + (P.alive ? P.eye - .1 : 1.2), P.z); tmp.copy(piv).addScaledVector(rt, side).addScaledVector(f3, -back); tmp.y += up;
      e3.copy(tmp).sub(piv); const L = e3.length(); e3.multiplyScalar(1 / L); let dist = L; const h = G.ray(piv.x, piv.y, piv.z, e3.x, e3.y, e3.z, L + .25); if (h && h.kind !== 'water') dist = Math.max(.35, h.t - .25);
      cam.position.copy(piv).addScaledVector(e3, dist); const gy = G.groundAt(cam.position.x, cam.position.z) + .22; if (cam.position.y < gy) cam.position.y = gy;
      cam.position.x += rnd(-1, 1) * sh * .04; cam.position.y += rnd(-1, 1) * sh * .04; cam.rotation.set(P.pitch + rnd(-1, 1) * sh * .02, P.yaw + rnd(-1, 1) * sh * .02, rnd(-1, 1) * sh * .015, 'YXZ'); P.camBack = back * dist / L + .35;
    }
    // character
    const r = P.rig; r.root.visible = !(fpv && !V) || !P.alive;
    if (V) { const T = V.T, c = Math.cos(V.yaw), s = Math.sin(V.yaw); r.root.position.set(V.x + T.seat[0] * c + T.seat[2] * s, V.y + T.seat[1] - .55, V.z - T.seat[0] * s + T.seat[2] * c); r.root.rotation.set(0, V.yaw, V.roll, 'YXZ'); P.byaw = V.yaw; if (P.held) P.held.visible = P.aimT > 0; }
    else { r.root.position.set(P.x, P.y, P.z); r.root.rotation.set(0, P.byaw, 0); if (P.held) P.held.visible = P.alive; }
    P.syncHeld(); pose(dt);
    G.Rig.pt(r, 'handR', P.muzzle); P.muzzle.x += Math.sin(P.byaw) * .35; P.muzzle.z += Math.cos(P.byaw) * .35; P.muzzle.y += .06 + Math.sin(P.pitch) * .3;
    // laser sight (third person, aiming)
    const las = P.alive && !fpv && !V && W.ads > .6 && W.cur !== 3 && W.swing <= 0 && !W.reloading; P.laser.visible = P.dot.visible = las;
    if (las) { const ox = cam.position.x + f3.x * P.camBack, oy = cam.position.y + f3.y * P.camBack, oz = cam.position.z + f3.z * P.camBack; let t = 90; const wh = G.ray(ox, oy, oz, f3.x, f3.y, f3.z, t); if (wh) t = wh.t; const zh = G.Z.raycast(ox, oy, oz, f3.x, f3.y, f3.z, t); if (zh) t = zh.t; e3.set(ox + f3.x * t, oy + f3.y * t, oz + f3.z * t); const m = P.muzzle, L = m.distanceTo(e3); P.laser.position.copy(m).add(e3).multiplyScalar(.5); P.laser.lookAt(e3); P.laser.scale.set(1, 1, L); P.dot.position.copy(e3).addScaledVector(f3, -.03); P.dot.scale.setScalar(.012 + (t + P.camBack) * .0035); P.dotOn = !!zh; }
    G.flash.intensity += ((P.lightOn && P.alive ? 2.4 : 0) - G.flash.intensity) * Math.min(1, dt * 14);
    // vehicles
    for (const v of G.Vehs) { v.mesh.position.set(v.x, v.y, v.z); v.mesh.rotation.set(0, v.yaw, v.roll, 'YXZ'); for (const w of v.wheels) w.rotation.x += v.sp * dt / .3; const on = P.veh === v && G.env.night > .2; v.lamp.material.emissiveIntensity = on ? 3 : 0; if (P.veh !== v) { v.sp *= 1 - Math.min(1, dt * 3); if (v.T.lean) v.roll += (.22 - v.roll) * Math.min(1, dt * 4); } }
    G.vehLight.intensity = V && G.env.night > .2 ? 2.8 : 0;
  };
})();
