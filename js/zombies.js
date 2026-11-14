'use strict';
/* THEERAM — zombies: types, limb damage, dismemberment, procedural animation, AI, director */
(function () {
  const Z = G.Z = { list: [], kills: 0, tick: 0, nid: 1 }, V3 = THREE.Vector3, R = G.Rig;
  const SKIN = [0x7d8a72, 0x8a8f7a, 0x6f7f6a, 0x93907c, 0x7a7468], HAIR = [0x111111, 0x1c1410, 0x2a2a2a, 0x555555];
  const SHIRT = [0xc8c2b0, 0x4a6a8a, 0x8a3a34, 0x3d6a4a, 0xb89a3a, 0x6a4a7a, 0x2f2f33, 0xa0a0a8, 0xc86a2a], SARI = [0xb02a4a, 0x2a6ab0, 0xd0a020, 0x2a8a5a, 0x8a2a8a, 0xd06a2a], LUNGI = [0x3a5f8a, 0x7a3a3a, 0x3a6a4a, 0x55557a];
  const TYPES = Z.TYPES = {
    walker: { hp: 100, sp: [.9, 1.5], dmg: 12, r: .35, name: 'Walker' },
    runner: { hp: 70, sp: [4.3, 5.2], dmg: 10, r: .33, name: 'Runner' },
    bloater: { hp: 260, sp: [.75, 1], dmg: 16, r: .55, name: 'Bloater' },
    drowned: { hp: 130, sp: [1.2, 1.7], dmg: 14, r: .36, grab: .45, name: 'Drowned' },
    brute: { hp: 900, sp: [2.4, 2.9], dmg: 34, r: .6, name: 'Brute' },
    civilian: { hp: 55, sp: [1.3, 1.6], dmg: 0, r: .33, name: 'Survivor', human: 1 },
    raider: { hp: 90, sp: [1.7, 2.1], dmg: 9, r: .35, name: 'Raider', human: 1, hostile: 1, range: 13, rof: 1.2, acc: .48 },
    guard: { hp: 140, sp: [1.7, 2.1], dmg: 11, r: .36, name: 'Varuna Security', human: 1, hostile: 1, range: 18, rof: 1.4, burst: 3, acc: .5 },
    riot: { hp: 170, sp: [1.1, 1.6], dmg: 14, r: .37, name: 'Riot Constable' },
    spitter: { hp: 90, sp: [1, 1.5], dmg: 9, r: .35, name: 'Spitter' },
    screamer: { hp: 60, sp: [1.6, 2.2], dmg: 8, r: .33, name: 'Screamer' },
    police: { hp: 120, sp: [1, 1.6], dmg: 12, r: .35, name: 'Constable' }
  };
  const FEM = ['zombieFemaleA', 'humanFemaleA', 'survivorFemaleA', 'skaterFemaleA'], FRESH = [0x9fb8a2, 0x8fae98, 0xa9b59a, 0x93a5a0], ROT = [0xffffff, 0xe8f0e0, 0xd8d8c8, 0xf0e0d0];
  let helmG, vestG, armM, hgunG; const spits = Z.spits = [], pools = Z.pools = [];
  function look(type) {
    const o = { scale: rnd(.96, 1.05) };
    if (type === 'walker') { const s = pick(['zombieA', 'zombieC', 'zombieMaleA', 'zombieFemaleA', 'zombieA', 'zombieMaleA', 'zombieFemaleA', 'humanMaleA', 'humanFemaleA', 'survivorFemaleA', 'criminalMaleA', 'skaterMaleA', 'skaterFemaleA']), fem = FEM.includes(s), v = Math.random(); o.skin = s; o.tint = s.startsWith('zombie') ? pick(ROT) : pick(FRESH); if (fem) o.scale *= .94; if (fem && v < .5) { o.skirt = 'sari'; o.skirtCol = pick(SARI); } else if (!fem && v < .28) { o.skirt = 'mundu'; o.skirtCol = pick([0xd8d2c0, 0xe0dccc, 0xc9b98a]); } else if (!fem && v < .42) { o.skirt = 'lungi'; o.skirtCol = pick(LUNGI); } }
    else if (type === 'police') { o.skin = 'zombieMaleA'; o.tint = 0xd8c890; o.cap = 0x8a7a4e; }
    else if (type === 'runner') { o.skin = pick(['skaterMaleA', 'skaterFemaleA', 'criminalMaleA', 'zombieFemaleA']); o.tint = pick(FRESH); o.scale = rnd(.94, 1.0); }
    else if (type === 'bloater') { o.skin = 'zombieC'; o.fat = 1.5; o.tint = 0xc8d8a8; o.scale = 1.08; o.skirt = 'lungi'; o.skirtCol = pick(LUNGI); }
    else if (type === 'drowned') { o.skin = 'zombieA'; o.tint = 0x7fa8b8; if (Math.random() < .5) { o.skirt = 'lungi'; o.skirtCol = 0x26323a; } }
    else if (type === 'civilian') { const sk = pick(['humanMaleA', 'humanFemaleA', 'skaterMaleA', 'skaterFemaleA', 'survivorFemaleA']); o.skin = sk; if (FEM.includes(sk)) { o.scale = .94; if (Math.random() < .5) { o.skirt = 'sari'; o.skirtCol = pick(SARI); } } else if (Math.random() < .4) { o.skirt = 'mundu'; o.skirtCol = 0xe0dccc; } }
    else if (type === 'raider') { o.skin = pick(['criminalMaleA', 'survivorMaleB', 'criminalMaleA']); o.tint = pick([0xd8c8b8, 0xc8b8a8, 0xffffff]); if (Math.random() < .5) o.cap = pick([0x7a1a1a, 0x1a1a1a, 0x3a4a2a]); }
    else if (type === 'guard') { o.skin = 'criminalMaleA'; o.tint = 0x8e98ac; o.scale = 1.03; }
    else if (type === 'riot') { o.skin = 'zombieMaleA'; o.tint = 0x8898c0; o.scale = 1.04; }
    else if (type === 'spitter') { o.skin = 'zombieC'; o.tint = 0xd8f070; o.fat = 1.15; }
    else if (type === 'screamer') { o.skin = 'zombieFemaleA'; o.tint = 0xfff0ff; o.scale = .95; o.skirt = 'sari'; o.skirtCol = 0xe8e4dc; }
    else if (type === 'brute') { o.skin = 'zombieMaleA'; o.scale = 1.42; o.fat = 1.2; o.tint = 0xa89888; }
    return o;
  }
  Z.spawn = (type, x, z, o = {}) => {
    const T = TYPES[type], rig = G.Rig.make(look(type)), hs = (o.hpMul || 1) * (1 + Math.min(.6, (G.env.day - 1) * .04));
    const zb = { id: Z.nid++, type, T, rig, x, z, y: Math.max(G.groundAt(x, z), -1.3), yaw: Math.random() * TAU, hp: T.hp * hs, maxHp: T.hp * hs, sp: rnd(T.sp[0], T.sp[1]), r: T.r, state: o.rise ? 'rise' : 'idle', st: 0, ph: Math.random() * 6, seed: Math.random(), mv: 0,
      php: { head: 28 * hs, armL: 45, armR: 45, legL: 55, legR: 55 }, miss: {}, crawl: false, stag: 0, stunKind: 0, fall: 1, kx: 0, kz: 0, atkCd: rnd(0, .5), atkDur: type === 'brute' ? 1.15 : .95, atkHit: false,
      lean: type === 'brute' ? .3 : rnd(.12, .38), tilt: rnd(-.35, .35), limp: Math.random() < .3, armStyle: (Math.random() * 3) | 0, chasing: false, dT: 99, tgt: null, inv: null, aggro: 0, think: Math.random() * .25, wx: x, wz: z, wt: 0, hx: x, hz: z,
      flx: 0, fly: 0, oy: 0, vy: 0, lastPart: 'torso', stuck: 0, lx: x, lz: z, side: 0, sideT: 0, siege: !!o.siege, tag: o.tag || null, deadT: 0, burn: 0, bleed: 0, bleedPart: null, groan: rnd(1, 8), dp: null, pooled: false };
    if (T.human) { zb.human = true; zb.lean = .03; zb.tilt = 0; zb.limp = false; zb.armStyle = 2; zb.state = 'idle'; zb.shootCd = rnd(.6, 1.6); zb.alert = 0; zb.bl = 0; zb.aimAt = null; zb.flee = false; zb.hurt = d => Z.damage(zb, 'torso', d, 0, 0, 0, { npc: true });
      if (T.hostile) { const gn = new THREE.Mesh(hgunG || (hgunG = new THREE.BoxGeometry(.045, .07, .62)), armM || (armM = new THREE.MeshLambertMaterial({ color: col(0x1c2a4a) }))); gn.castShadow = true; R.hold(rig, gn); gn.position.set(0, -.07, .2); }
      if (type === 'guard') { const hm = new THREE.Mesh(helmG || (helmG = new THREE.SphereGeometry(.21, 12, 8, 0, 6.283, 0, 1.75)), armM); hm.position.set(0, .2, 0); R.sock(rig, 'Head').add(hm); const vs = new THREE.Mesh(vestG || (vestG = new THREE.BoxGeometry(.5, .46, .34)), armM); vs.position.set(0, .06, .01); R.sock(rig, 'Chest').add(vs); } }
    if (o.big) { rig.root.scale.multiplyScalar(o.big); rig.scale *= o.big; zb.r *= o.big; }
    if (o.aggro) zb.aggro = 30; if (o.inv) zb.inv = { x: o.inv.x, z: o.inv.z, t: 60 };
    zb.armor = 0; zb.spit = false; zb.screamCd = rnd(0, 3); zb.rage = 0;
    if (type === 'riot') { const hm = new THREE.Mesh(helmG || (helmG = new THREE.SphereGeometry(.21, 12, 8, 0, 6.283, 0, 1.75)), armM || (armM = new THREE.MeshLambertMaterial({ color: col(0x1c2a4a) }))); hm.position.set(0, .2, 0); hm.castShadow = true; R.sock(rig, 'Head').add(hm); const vs = new THREE.Mesh(vestG || (vestG = new THREE.BoxGeometry(.5, .46, .34)), armM); vs.position.set(0, .06, .01); vs.castShadow = true; R.sock(rig, 'Chest').add(vs); zb.helm = hm; zb.armor = 70; }
    rig.root.position.set(x, zb.y, z); G.scene.add(rig.root); Z.list.push(zb); return zb;
  };
  Z.horde = (n, cx, cz, r0, r1, o = {}) => { let made = 0; for (let t = 0; t < n * 12 && made < n; t++) { const a = Math.random() * TAU, r = rnd(r0, r1), x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r; if (G.groundAt(x, z) < .3 || G.blocked(x, z, .6) || (G.Base && G.Base.inside(x, z))) continue; const ty = o.types ? pick(o.types) : pickType(null); Z.spawn(ty, x, z, Object.assign({ rise: true, aggro: true }, o)); made++; } return made; };
  Z.regroup = z => { const P = G.P; for (let t = 0; t < 30; t++) { const a2 = Math.random() * TAU, r = rnd(22, 32), x = P.x + Math.cos(a2) * r, zz = P.z + Math.sin(a2) * r; if (G.groundAt(x, zz) < .4 || G.blocked(x, zz, .7) || (G.Base && G.Base.inside(x, zz))) continue; z.x = z.lx = x; z.z = z.lz = zz; z.y = G.groundAt(x, zz); z.stk = 0; z.rig.root.position.set(x, z.y, zz); return true; } return false; };
  Z.hunt = z => { const P = G.P; z.aggro = 30; z.inv = { x: P.x, z: P.z, t: 30 }; if ((z.stk || 0) > 6 || dist2(z.x, z.z, P.x, P.z) > 85 * 85) Z.regroup(z); };
  Z.clear = () => { for (const z of Z.list) G.Rig.dispose(z.rig); Z.list.length = 0; G.P.grabber = null; };
  Z.alive = tag => { let n = 0; for (const z of Z.list) if (z.state !== 'dead' && (!tag || z.tag === tag)) n++; return n; };

  /* ---------- hit testing ---------- */
  const a = new V3(), b = new V3();
  function raySeg(ox, oy, oz, dx, dy, dz, A, B, r) {
    const vx = B.x - A.x, vy = B.y - A.y, vz = B.z - A.z, wx = ox - A.x, wy = oy - A.y, wz = oz - A.z;
    const Bq = dx * vx + dy * vy + dz * vz, C = vx * vx + vy * vy + vz * vz, D = dx * wx + dy * wy + dz * wz, E = vx * wx + vy * wy + vz * wz, den = C - Bq * Bq;
    let tt = den < 1e-6 ? 0 : clamp((E - Bq * D) / den, 0, 1), s = tt * Bq - D; if (s < 0) { s = 0; tt = clamp(E / (C || 1), 0, 1); }
    const px = ox + dx * s - A.x - vx * tt, py = oy + dy * s - A.y - vy * tt, pz = oz + dz * s - A.z - vz * tt, d2 = px * px + py * py + pz * pz;
    return d2 < r * r ? Math.max(0, s - Math.sqrt(r * r - d2)) : -1;
  }
  Z.raycast = (ox, oy, oz, dx, dy, dz, maxT, skip) => {
    let best = null, bt = maxT;
    for (const z of Z.list) {
      if (z.state === 'dead' || z === skip || (skip && skip.indexOf && skip.indexOf(z) >= 0)) continue; const rg = z.rig, sc = rg.scale; R.pt(rg, 'hips', a);
      const cx = a.x - ox, cy = a.y - oy, cz = a.z - oz, tc = cx * dx + cy * dy + cz * dz; if (tc < -1.5 || tc > bt + 1.5) continue; if (cx * cx + cy * cy + cz * cz - tc * tc > 2.4 * sc * sc) continue;
      const test = (A, B, r, part, bias) => { const t = raySeg(ox, oy, oz, dx, dy, dz, A, B, r); if (t >= 0 && t - bias < bt) { bt = t - bias; best = { z, part, t }; } };
      if (!z.miss.head) test(R.pt(rg, 'head', a), R.pt(rg, 'headTop', b), .155 * sc, 'head', .12);
      test(R.pt(rg, 'hips', a), R.pt(rg, 'neck', b), .2 * sc * rg.fat, 'torso', 0);
      if (!z.miss.armL) test(R.pt(rg, 'shL', a), R.pt(rg, 'handL', b), .08 * sc, 'armL', 0);
      if (!z.miss.armR) test(R.pt(rg, 'shR', a), R.pt(rg, 'handR', b), .08 * sc, 'armR', 0);
      test(R.pt(rg, 'hipL', a), R.pt(rg, z.miss.legL ? 'kneeL' : 'footL', b), .105 * sc, 'legL', 0);
      test(R.pt(rg, 'hipR', a), R.pt(rg, z.miss.legR ? 'kneeR' : 'footR', b), .105 * sc, 'legR', 0);
    }
    if (best) best.t = Math.max(0, best.t);
    return best;
  };
  const setS = (z, s, t) => { if (G.P.grabber === z && s !== 'grab') G.P.grabber = null; z.state = s; z.st = t || 0; };
  function sever(z, part, dx, dy, dz) {
    if (z.miss[part]) return; z.miss[part] = true; const rg = z.rig; R.pt(rg, part === 'head' ? 'head' : part === 'armL' ? 'shL' : part === 'armR' ? 'shR' : part === 'legL' ? 'kneeL' : 'kneeR', a); if (part === 'head') a.y += .12 * rg.scale;
    R.sever(rg, part); G.FX.blood(a.x, a.y, a.z, dx * .4, 1, dz * .4, 26, 4.8); z.bleed = 4; z.bleedPart = part;
    if (part === 'head') { G.FX.gore(a.x, a.y, a.z, 30); for (let i = 0; i < 7; i++) G.FX.gib(a.x, a.y, a.z, dx * 3 + rnd(-3, 3), rnd(2, 6.5), dz * 3 + rnd(-3, 3)); G.Audio && G.Audio.gore(1); }
    else { for (let i = 0; i < 3; i++) G.FX.gib(a.x, a.y, a.z, dx * 3 + rnd(-2, 2), rnd(2, 5), dz * 3 + rnd(-2, 2), { scale: 1.6 }); G.Audio && G.Audio.gore(.6); }
    if (part[0] === 'l' && !z.crawl) { z.crawl = true; z.sp = .75; if (z.state !== 'down') { z.fall = -1; setS(z, 'down', .9); } }
  }
  function kill(z, dx, dz, o) {
    const fx = Math.sin(z.yaw), fz = Math.cos(z.yaw); if (z.state !== 'down' && !z.crawl) z.fall = (dx * fx + dz * fz) < .2 ? 1 : -1; if (z.crawl) z.fall = -1;
    const launch = (o.knock || 0) > 2.8 || o.how === 'kick' || o.how === 'road' || o.how === 'blast', kn = o.knock || (o.how === 'kick' ? 7 : o.how === 'blast' ? 5 : 1.6);
    setS(z, 'dead'); z.hp = 0; z.deadT = 0; z.kx = dx * kn; z.kz = dz * kn; if (launch && !z.crawl) { z.vy = rnd(3.2, 5.5); z.oy = .02; }
    if (!o.cure) G.FX.blood(z.x, z.y + 1.1 * z.rig.scale, z.z, dx, .4, dz, 12, 5); if (G.set.gore && !o.cure) G.FX.decal(z.x + dx * rnd(.8, 1.8), z.z + dz * rnd(.8, 1.8), rnd(.7, 1.3));
    z.dp = { aLz: rnd(.3, 1.5), aRz: -rnd(.3, 1.5), aLx: rnd(-1.6, .4), aRx: rnd(-1.6, .4), lLx: rnd(-.5, .3), lRx: rnd(-.5, .3), kL: rnd(0, .9), kR: rnd(0, .9), spZ: rnd(-.3, .3), nkY: rnd(-.9, .9), bRz: rnd(-.25, .25), bRy: rnd(-1, 1) * (launch ? 2.6 : .5), kneel: !launch && z.lastPart === 'head' && !z.crawl && Math.random() < .7 };
    Z.kills++; G.Audio && G.Audio.zdie(z);
    if (z.type === 'bloater') { const y = z.y + 1; G.FX.gore(z.x, y, z.z, 60); for (let i = 0; i < 12; i++) G.FX.gib(z.x, y, z.z, rnd(-6, 6), rnd(2, 8), rnd(-6, 6)); G.FX.smoke(z.x, y, z.z, 6, 1.2); for (let i = 0; i < 5; i++) G.FX.decal(z.x + rnd(-2, 2), z.z + rnd(-2, 2), rnd(1, 2.2)); G.Audio && G.Audio.gore(1.5); z.rig.model.visible = false; if (z.rig.skirt) z.rig.skirt.visible = false; z.pooled = true; Z.blast(z.x, y, z.z, 4.2, 70, z); const d = Math.hypot(G.P.x - z.x, G.P.z - z.z); if (d < 4.2) G.P.hurt(26 * (1 - d / 5), z.x, z.z, 'acid'); }
    if (G.onKill) G.onKill(z, o);
    if (G.Loot) G.Loot.drop(z);
  }
  /* part: head|torso|armL|armR|legL|legR ; o:{stagger,sever,knock,heavy,fire} ; returns true if killed */
  Z.damage = (z, part, dmg, dx, dy, dz, o = {}) => {
    if (z.state === 'dead') return false;
    if (z.human) { z.alert = 12; if (z.type === 'guard' && part === 'torso') dmg *= .6; }
    if (z.type === 'riot') { if (part === 'head' && z.armor > 0) { z.armor -= dmg; R.pt(z.rig, 'head', a); G.FX.sparks(a.x, a.y + .15, a.z, -dx, .5, -dz, 4); if (z.armor <= 0) { z.helm.visible = false; G.FX.gib(a.x, a.y + .2, a.z, dx * 4, 4, dz * 4, { scale: 2 }); if (G.UI) G.UI.style('HELMET OFF', 0); } dmg *= .12; } else if (part === 'torso' && !o.heavy && o.how !== 'blast' && o.how !== 'road') dmg *= .3; }
    const mult = part === 'head' ? (z.type === 'brute' ? 1.7 : 3.2) : part === 'torso' ? 1 : .6, d = dmg * mult; z.hp -= d; z.aggro = 20; z.inv = null; z.lastPart = part; if (!o.npc) { z.lkx = G.P.x; z.lkz = G.P.z; } { const fx = Math.sin(z.yaw), fz = Math.cos(z.yaw), f = dx * fx + dz * fz; z.flx = f < 0 ? -.5 : .45; z.fly = (dx * fz - dz * fx) * .7 + (part === 'armL' ? -.4 : part === 'armR' ? .4 : 0); }
    if (part !== 'torso' && !z.miss[part]) { z.php[part] -= dmg * (o.sever || 1); if (part !== 'head' && z.php[part] <= 0 && z.type !== 'brute') sever(z, part, dx, dy, dz); }
    const popped = part === 'head' && !o.npc && z.php.head <= 0 && z.type !== 'brute' && z !== G.boss && !(z.type === 'riot' && z.armor > 0);
    if (z.hp <= 0 || popped) { z.hp = Math.min(z.hp, 0); if (popped || (part === 'head' && (dmg >= 34 || Math.random() < .5 || o.sever > 1))) sever(z, 'head', dx, dy, dz); kill(z, dx, dz, o); return true; }
    if (z.state === 'rise') return false;
    if (z.type !== 'brute' || o.heavy) {
      z.stag += d * (o.stagger || 1);
      if (o.knock && z.type !== 'brute') Z.knock(z, dx, dz, o.knock);
      else if (z.state === 'down' || z.crawl) { }
      else if (part === 'head' && d >= 45) { setS(z, 'stun', 2.5); z.stunKind = 0; z.stag = 0; }
      else if (part[0] === 'l' && Math.random() < .45) { setS(z, 'stun', 2.7); z.stunKind = 1; z.stag = 0; }
      else if (z.stag > 38 && z.state !== 'stun') { z.stag = 0; setS(z, 'stagger', z.type === 'brute' ? .7 : .45); z.kx = dx * 2.4; z.kz = dz * 2.4; }
    }
    return false;
  };
  Z.knock = (z, dx, dz, pow) => { if (z.state === 'dead') return; const fx = Math.sin(z.yaw), fz = Math.cos(z.yaw); z.fall = z.crawl ? -1 : (dx * fx + dz * fz) < .2 ? 1 : -1; z.kx = dx * pow; z.kz = dz * pow; setS(z, 'down', z.type === 'brute' ? 1.2 : rnd(1.6, 2.8)); };
  Z.blast = (x, y, z0, r, dmg, src) => {
    for (const z of Z.list) { if (z === src || z.state === 'dead') continue; const dx = z.x - x, dz = z.z - z0, d = Math.hypot(dx, dz); if (d > r) continue; const k = 1 - d / r * .7, nx = dx / (d || 1), nz = dz / (d || 1); G.FX.blood(z.x, z.y + 1, z.z, nx, .5, nz, 8); if (k > .6 && Math.random() < .6 && z.type !== 'brute') sever(z, pick(['armL', 'armR', 'legL', 'legR']), nx, 1, nz); if (!Z.damage(z, 'torso', dmg * k, nx, 0, nz, { heavy: true, how: 'blast' })) Z.knock(z, nx, nz, 5 * k); }
  };
  Z.meleeTarget = () => {
    const P = G.P; let best = null, bd = 2.5, kind = null;
    for (const z of Z.list) {
      if (z.state === 'dead') continue; const dx = z.x - P.x, dz = z.z - P.z, d = Math.hypot(dx, dz); if (d > bd) continue; if (Math.abs(angDiff(Math.atan2(dx, dz), P.yaw + Math.PI)) > 1.1) continue;
      let k = z.state === 'stun' ? (z.stunKind ? 'execute' : 'kick') : (z.state === 'down' || z.crawl) ? 'stomp' : null;
      if (!k && P.crouch && z.state === 'idle' && z.aggro <= 0 && !z.chasing && !(z.human && z.alert > 0) && z.type !== 'brute' && (dx * Math.sin(z.yaw) + dz * Math.cos(z.yaw)) > 0) k = 'silent';
      if (!k) continue; bd = d; best = z; kind = k;
    }
    return best ? { z: best, kind } : null;
  };
  G.noise = (x, z, r) => { for (const zb of Z.list) { if (zb.state === 'dead' || zb.aggro > 0) continue; const d = Math.hypot(zb.x - x, zb.z - z); if (d < r) { zb.inv = { x: x + rnd(-3, 3), z: z + rnd(-3, 3), t: 14 }; if (d < r * .4) zb.aggro = 6; } } };

  /* ---------- animation ---------- */
  function pose(z, dt) {
    const r = z.rig, T = r.T, s = Math.sin(z.ph), c = Math.cos(z.ph), t = G.t + z.seed * 10, st = z.state, HP = Math.PI / 2;
    G.Rig.reset(T); let k = 10;
    const run = z.type === 'runner' && z.chasing, amp = z.mv * (run ? 1.15 : .8);
    T.lLx = -s * .55 * amp; T.lRx = s * .55 * amp; T.kL = Math.max(0, c) * .9 * amp + .06; T.kR = Math.max(0, -c) * .9 * amp + .06;
    if (z.limp && !run) { T.lRx *= .35; T.kR = .04; T.spZ += .1; T.hY -= Math.abs(s) * .035 * amp; }
    T.hY -= Math.abs(c) * .025 * amp;
    T.spX = (run ? .5 : z.lean) + .05 * Math.sin(z.ph * 2) * amp; T.spZ += .08 * s * amp + z.tilt * .35; T.spY = .17 * s * amp;
    T.nkX = -(run ? .35 : z.lean * .6) + .08 * Math.sin(t * 1.3); T.nkZ = z.tilt + .06 * Math.sin(t * .7); T.nkY = .14 * Math.sin(t * .5 + z.seed * 6) + (Math.sin(t * 3.7) > .97 ? .5 : 0);
    T.jaw = .25 + .2 * Math.sin(t * 2.1); T.spX += z.flx; T.spY += z.fly; T.nkX += z.flx * .6;
    if (run) { T.aLx = .5 + .7 * s; T.aRx = .5 - .7 * s; T.aLz = .35; T.aRz = -.35; T.eL = T.eR = -.6; if (z.dT < 4) { T.aLx = T.aRx = -1.3; T.eL = T.eR = -.3; } }
    else if (z.chasing && (z.dT < 7 || z.armStyle === 0)) { T.aLx = -1.35 + .12 * s; T.aRx = -1.15 - .12 * s; T.eL = -.25; T.eR = -.4; T.aLz = .12; T.aRz = -.12; if (z.armStyle === 1 && z.dT > 3) { T.aRx = .15 * s; T.eR = -.1; } }
    else { T.aLx = .3 * s * amp + .05; T.aRx = -.3 * s * amp + .05; T.eL = -.15; T.eR = -.2; T.aLz = .12 + .05 * Math.sin(t); T.aRz = -.12; }
    if (z.type === 'brute') { T.aLz += .3; T.aRz -= .3; T.spX += .1; }
    if (z.human) { T.spX = .06 * amp + (z.flee ? .25 : 0) + z.flx; T.spZ = 0; T.nkX = 0; T.nkZ = 0; T.nkY = .2 * Math.sin(t * .4); T.jaw = 0; T.aLx = s * .5 * amp; T.aRx = -s * .5 * amp; T.eL = T.eR = -.3 - (z.flee ? .8 : 0); T.aLz = .1; T.aRz = -.1; if (z.T.hostile) { if (z.aimAt && z.mv < .3) { T.aRx = -1.45; T.eR = -.08; T.aLx = -1.3; T.aLz = -.5; T.eL = -.45; T.spY = .28; } else { T.aRx = -.3; T.eR = -1.0; } } }
    switch (st) {
      case 'rise': { const u = clamp(z.st / 1.8, 0, 1); T.bY = -1.8 * (1 - u) * (1 - u); T.aLx = T.aRx = -2.7 + u * 1.3; T.spX = .3; T.nkX = -.5; k = 14; break; }
      case 'attack': { const u = z.st / z.atkDur; if (u < .38) { const w = u / .38; T.aLx = T.aRx = -1.9 - w * .5; T.eL = T.eR = -.9; T.spX = -.15 * w; T.nkX = -.3; T.jaw = .7; } else if (u < .62) { T.aLx = T.aRx = -1.25; T.eL = T.eR = -.5; T.spX = .78; T.nkX = .1; T.jaw = .95; T.aLz = -.25; T.aRz = .25; T.lLx = -.5; T.kR = .4; } else { T.spX = .45; T.aLx = T.aRx = -.9; T.jaw = .4; } k = 18; break; }
      case 'grab': T.aLx = T.aRx = -1.4; T.eL = T.eR = -.9; T.aLz = -.3; T.aRz = .3; T.spX = .55; T.nkX = .2 + .25 * Math.sin(G.t * 14); T.jaw = .5 + .4 * Math.sin(G.t * 14); k = 16; break;
      case 'scream': T.spX = -.45; T.nkX = -.75; T.aLx = T.aRx = .5; T.aLz = .9; T.aRz = -.9; T.eL = T.eR = -.4; T.spZ = Math.sin(G.t * 40) * .04; T.hY = .9; k = 14; break;
      case 'stagger': T.spX = -.55; T.nkX = -.4; T.aLz = 1.0; T.aRz = -1.0; T.aLx = -.4; T.aRx = -.2; T.lLx = .3; T.kR = .4; k = 20; break;
      case 'stun': if (z.stunKind === 0) { T.spX = .6 + .08 * Math.sin(G.t * 6); T.aLx = T.aRx = -2.0; T.eL = T.eR = -2.1; T.aLz = -.3; T.aRz = .3; T.nkX = .5; T.spZ = .15 * Math.sin(G.t * 3); T.kL = T.kR = .3; T.lLx = T.lRx = -.15; T.hY = .88; } else { T.hY = .56; T.lLx = -1.35; T.kL = 1.5; T.lRx = .25; T.kR = 1.45; T.spX = .45; T.nkX = .3; T.aLx = -.5; T.aRx = .1; T.eL = -.6; } k = 12; break;
      case 'down': T.bRx = -HP * z.fall; T.bY = .16; T.aLz = 1.1; T.aRz = -1.2; T.aLx = T.aRx = -.3; T.lLx = -.25; T.lRx = .15; T.kL = .3; T.nkX = -.2 * z.fall; T.spX = T.spZ = T.spY = 0; T.hY = .94; k = 9; break;
      case 'getup': { const u = clamp(z.st / 1.1, 0, 1); T.bRx = -HP * z.fall * (1 - u); T.bY = .16 * (1 - u); T.spX = .9 * (1 - u) * z.fall + .2; T.kL = T.kR = 1.2 * (1 - u); T.lLx = T.lRx = -.9 * (1 - u); T.aLx = T.aRx = -.8; k = 8; break; }
      case 'dead': { const d = z.dp; if (d.kneel && z.deadT < .5) { T.hY = .56; T.kL = T.kR = 1.5; T.lLx = T.lRx = -.45; T.spX = -.15; T.nkX = -.7; T.aLz = .3; T.aRz = -.3; k = 16; break; } T.bRy = d.bRy; T.bRx = -HP * (d.kneel ? -1 : z.fall); T.bY = .13; T.bRz = d.bRz; T.hY = .94; T.aLz = d.aLz; T.aRz = d.aRz; T.aLx = d.aLx; T.aRx = d.aRx; T.lLx = d.lLx; T.lRx = d.lRx; T.kL = d.kL; T.kR = d.kR; T.spX = 0; T.spZ = d.spZ; T.spY = 0; T.nkY = d.nkY; T.nkX = 0; T.nkZ = 0; T.jaw = .5; k = 7; break; }
    }
    if (z.crawl && st !== 'dead' && st !== 'rise' && st !== 'down') { T.bRx = HP; T.bRz = 0; T.bY = .2; T.hY = .94; T.spX = -.25; T.spZ = .1 * s; T.spY = 0; T.nkX = -.9; T.aLx = -2.7 + .5 * s * z.mv; T.aRx = -2.7 - .5 * s * z.mv; T.eL = -.5 - .4 * Math.max(0, -s); T.eR = -.5 - .4 * Math.max(0, s); T.aLz = .25; T.aRz = -.25; T.lLx = .05; T.lRx = -.05; T.kL = .1; T.kR = .25; if (st === 'attack') { T.aLx = T.aRx = -2.95; T.nkX = -1.15; T.jaw = .95; } k = 9; }
    G.Rig.apply(r, dt * k);
  }

  /* ---------- AI ---------- */
  function canSee(z, P, d) {
    if (!P.alive || P.safe) return false; const n = G.env.night; let sight = lerp(36, 20, n) * (P.crouch ? .55 : 1) * (P.lightOn && n > .4 ? 1.5 : 1) * (1 - G.env.rain * .15) * (P.cover === undefined ? 1 : P.cover); if (P.veh) sight *= 1.3;
    if (d > sight) return false; if (d < (P.cover < .5 ? 2.2 : 5)) return true;
    if (Math.abs(angDiff(Math.atan2(P.x - z.x, P.z - z.z), z.yaw)) > 1.9 && d > 9) return false;
    const h = G.ray(z.x, z.y + 1.5, z.z, (P.x - z.x) / d, (P.y + 1.3 - z.y - 1.5) / d, (P.z - z.z) / d, d); return !h || h.kind === 'water';
  }
  function wander(z) { if (z.wt <= 0) { z.wt = rnd(3, 9); if (Math.random() < .6) { const a2 = Math.random() * TAU, r = rnd(3, 12); z.wx = z.hx + Math.cos(a2) * r; z.wz = z.hz + Math.sin(a2) * r; } else { z.wx = z.x; z.wz = z.z; } } z.gx = z.wx; z.gz = z.wz; }
  function hThink(z, P, dP) {
    z.chasing = false; z.tgt = null; z.gate = null; z.aimAt = null; z.flee = false; const T = z.T; let nz = null, nd = 1e9;
    for (const o of Z.list) { if (o.human || o.state === 'dead') continue; const d = dist2(o.x, o.z, z.x, z.z); if (d < nd) { nd = d; nz = o; } } nd = Math.sqrt(nd);
    if (!T.hostile) { const thr = nz && nd < 14 ? nz : (dP < 22 && (P.loud > .3 || z.alert > 0)) ? P : null; if (thr) { const dx = z.x - thr.x, dz = z.z - thr.z, d = Math.hypot(dx, dz) || 1; z.gx = z.x + dx / d * 14; z.gz = z.z + dz / d * 14; z.chasing = true; z.flee = true; } else wander(z); return; }
    let see = false; if (P.alive && dP < 46) { if (dP < 3) see = true; else { const h = G.ray(z.x, z.y + 1.5, z.z, (P.x - z.x) / dP, (P.y - z.y) / dP, (P.z - z.z) / dP, dP); see = !h || h.kind === 'water' || h.t > dP - .6; } } if (see) z.alert = 7;
    if (z.alert > 0 && P.alive) { const R0 = T.range; z.aimAt = see ? P : null; if (dP > R0 + 5 || !see) { z.gx = P.x; z.gz = P.z; z.chasing = true; } else if (dP < R0 - 6) { z.gx = z.x - (P.x - z.x); z.gz = z.z - (P.z - z.z); z.chasing = true; } else { z.gx = z.x; z.gz = z.z; } }
    else if (nz && nd < 16) { z.aimAt = nz; z.gx = z.x; z.gz = z.z; } else wander(z);
  }
  function hShoot(z, t, td) {
    const P = G.P, T = z.T; R.pt(z.rig, 'handR', a); const dp = Math.hypot(P.x - z.x, P.z - z.z); let hit;
    { const ty = t === P ? P.y + (P.crouch ? .85 : 1.35) : t.y + 1.2, ex = t.x - a.x, ey = ty - a.y, ez = t.z - a.z, el = Math.hypot(ex, ey, ez) || 1, wh = G.ray(a.x, a.y, a.z, ex / el, ey / el, ez / el, el);
      if (wh && wh.kind !== 'water' && wh.t < el - .45) { const hx = a.x + ex / el * wh.t, hy = a.y + ey / el * wh.t, hz = a.z + ez / el * wh.t; G.FX.tracer(a.x, a.y, a.z, hx, hy, hz); G.FX.sparks(hx, hy, hz, wh.nx, wh.ny, wh.nz, 4); G.addLight(a.x, a.y, a.z, 0xffb060, 7, 90, 16); if (G.Audio) G.Audio.farShot(dp * .6); if (t === P && dp < 30) P.shake = Math.max(P.shake, .08); return; } }
    if (t === P) hit = P.dodgeT <= 0 && Math.random() < clamp(T.acc - td * .012 - (P.speed > 4.5 ? .18 : 0) - (P.crouch ? .1 : 0) - (P.veh ? .15 : 0), .06, .85); else hit = Math.random() < .6;
    const o = hit ? .15 : 1.3; G.FX.tracer(a.x, a.y, a.z, t.x + rnd(-o, o), t.y + 1.2 + rnd(-o, o) * .6, t.z + rnd(-o, o)); G.addLight(a.x, a.y, a.z, 0xffb060, 7, 90, 16); if (G.Audio) G.Audio.farShot(dp * .6);
    if (!hit) return; if (t === P) P.hurt(T.dmg, z.x, z.z, 'shot'); else { const nx = (t.x - z.x) / (td || 1), nz2 = (t.z - z.z) / (td || 1); G.FX.blood(t.x, t.y + 1.2, t.z, nx, .2, nz2, 5); Z.damage(t, Math.random() < .25 ? 'head' : 'torso', 34, nx, 0, nz2, { npc: true }); }
  }
  function think(z, P, dP) {
    if (z.human) return hThink(z, P, dP);
    const B = G.Base; z.chasing = false; z.tgt = null;
    const cs = canSee(z, P, dP); if (cs) { z.lkx = P.x; z.lkz = P.z; }
    if (z.aggro > 0 || cs) { if (cs && z.aggro < 8) { if (z.aggro <= 0 && G.Audio) G.Audio.zalert(z); z.aggro = 8; } if (P.alive) { z.tgt = P; z.chasing = true; } }
    if (z.tgt === P && !cs && !z.siege && z.lkx !== undefined && dP > 7) { z.tgt = null; z.chasing = false; z.inv = { x: z.lkx, z: z.lkz, t: 7 }; }
    if (B && B.members) { let bd = z.chasing ? Math.min(dP, 14) : (z.siege ? 400 : 16); for (const m of B.members) { if (!m.alive || m.away || m.down) continue; const d = Math.hypot(m.x - z.x, m.z - z.z); if (d < bd) { bd = d; z.tgt = m; z.chasing = true; } } }
    { let hb = z.tgt === P ? Math.min(dP, 10) : z.tgt ? 0 : 13; for (const h of Z.list) { if (!h.human || h.state === 'dead') continue; const d = Math.hypot(h.x - z.x, h.z - z.z); if (d < hb) { hb = d; z.tgt = h; z.chasing = true; } } }
    if (z.tgt) { z.gx = z.tgt.x; z.gz = z.tgt.z; z.gate = null; if (z.tgt === P && z.type === 'runner' && dP > 4) { z.gx += P.vx * .45; z.gz += P.vz * .45; } if (B) { const w = B.route(z.x, z.z, z.gx, z.gz); if (w) { z.gx = w.x; z.gz = w.z; z.gate = w.gate; } } }
    else if (z.inv) { z.gx = z.inv.x; z.gz = z.inv.z; if (Math.hypot(z.gx - z.x, z.gz - z.z) < 2.5) z.inv = null; }
    else { if (z.wt <= 0) { z.wt = rnd(3, 9); if (Math.random() < .6) { const a2 = Math.random() * TAU, r = rnd(3, 12); z.wx = z.hx + Math.cos(a2) * r; z.wz = z.hz + Math.sin(a2) * r; } else { z.wx = z.x; z.wz = z.z; } } z.gx = z.wx; z.gz = z.wz; }
  }
  function strike(z, P) {
    const t = z.tgt, reach = (z.type === 'brute' ? 2.4 : 1.95) * (z.crawl ? .8 : 1); let dmg = z.T.dmg * ((z.miss.armL ? .6 : 1) * (z.miss.armR ? .6 : 1)) * (z.crawl ? .7 : 1);
    if (z.gate && z.gate.hp > 0 && Math.hypot(z.gate.x - z.x, z.gate.z - z.z) < 2.8) { G.Base.hitGate(z.gate, dmg * .9); return; }
    if (!t) return; const d = Math.hypot(t.x - z.x, t.z - z.z); if (d > reach) return;
    if (t === P) { if (P.dodgeT > 0) return; P.hurt(dmg, z.x, z.z, 'bite'); if (!P.grabber && !z.crawl && !P.veh && z.type !== 'brute' && Math.random() < (z.T.grab || .2) && !(z.miss.armL && z.miss.armR)) { P.grabber = z; P.grabN = 0; setS(z, 'grab'); } if (z.type === 'brute') P.shove(Math.sin(z.yaw) * 9, Math.cos(z.yaw) * 9); }
    else if (t.hurt) t.hurt(dmg, z);
  }
  Z.update = dt => {
    const P = G.P, L = Z.list; Z.tick++;
    for (let i = spits.length - 1; i >= 0; i--) { const s = spits[i]; s.vy -= 12 * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt; G.FX.emit(s.x, s.y, s.z, rnd(-.3, .3), rnd(-.2, .4), rnd(-.3, .3), .5, 1.2, .15, .9, .09, .35, { grav: 2 }); const hitP = P.alive && Math.abs(s.x - P.x) < .6 && Math.abs(s.z - P.z) < .6 && s.y > P.y && s.y < P.y + 1.9; if (hitP || s.y < G.groundAt(s.x, s.z) + .05) { if (hitP || dist2(s.x, s.z, P.x, P.z) < 2) P.hurt(hitP ? 14 : 7, s.x, s.z, 'acid'); pools.push({ x: s.x, z: s.z, t: 5 }); for (let k = 0; k < 10; k++) G.FX.emit(s.x, s.y + .1, s.z, rnd(-2, 2), rnd(1, 3), rnd(-2, 2), .5, 1.1, .15, .9, .08, .5, {}); spits.splice(i, 1); } }
    for (let i = pools.length - 1; i >= 0; i--) { const p = pools[i]; p.t -= dt; if (p.t <= 0) { pools.splice(i, 1); continue; } if (Math.random() < .5) G.FX.emit(p.x + rnd(-1, 1), G.groundAt(p.x, p.z) + .05, p.z + rnd(-1, 1), 0, rnd(.3, .9), 0, .45, 1.0, .12, .7, .1, .6, { grav: -.5, grow: .2 }); if (P.alive && !P.veh && dist2(p.x, p.z, P.x, P.z) < 1.7) P.hurt(7 * dt, p.x, p.z, 'acid'); }
    for (let i = L.length - 1; i >= 0; i--) {
      const z = L[i], dxp = P.x - z.x, dzp = P.z - z.z, dP = Math.hypot(dxp, dzp); z.dT = z.tgt ? Math.hypot(z.tgt.x - z.x, z.tgt.z - z.z) : 99;
      if (z.state === 'dead') {
        z.deadT += dt; if (Math.abs(z.kx) + Math.abs(z.kz) > .05) { z.x += z.kx * dt; z.z += z.kz * dt; z.kx *= 1 - 5 * dt; z.kz *= 1 - 5 * dt; G.resolve(z, z.r, z.y); }
        if (!z.pooled && z.deadT > .7) { z.pooled = true; const o = z.fall * -.9; if (G.set.gore) G.FX.decal(z.x + Math.sin(z.yaw) * o, z.z + Math.cos(z.yaw) * o, rnd(1.3, 2.1), .45); }
        if (z.oy > 0) { z.oy += z.vy * dt; z.vy -= 17 * dt; if (z.oy <= 0) { z.oy = 0; z.kx *= .4; z.kz *= .4; G.FX.dust(z.x, z.y + .1, z.z, 5); if (G.set.gore) G.FX.decal(z.x, z.z, rnd(.9, 1.5)); if (G.Audio && dP < 30) G.Audio.thud(true); } }
        z.y = Math.max(G.groundAt(z.x, z.z), -1.3) - Math.max(0, z.deadT - 40) * .25 + z.oy; if (z.deadT < 2.5) pose(z, dt);
        z.rig.root.position.set(z.x, z.y, z.z);
        if (z.deadT > 46 || dP > 140 || (z.type === 'bloater' && z.deadT > 3)) { G.Rig.dispose(z.rig); L.splice(i, 1); }
        continue;
      }
      if (dP > 150 && !z.tag && !z.siege) { G.Rig.dispose(z.rig); L.splice(i, 1); continue; }
      const far = dP > 75; if (far && (Z.tick + z.id) % 3) continue; const e = far ? dt * 3 : dt;
      z.screamCd -= e; z.rage -= e; z.flx *= Math.max(0, 1 - 9 * e); z.fly *= Math.max(0, 1 - 9 * e); z.st += e; z.atkCd -= e; z.aggro -= e; z.wt -= e; z.think -= e; if (z.inv && (z.inv.t -= e) <= 0) z.inv = null;
      if (z.think <= 0) { z.think = .25 + Math.random() * .1; think(z, P, dP); }
      let speed = 0, canMove = false;
      switch (z.state) {
        case 'rise': if (z.st > 1.8) setS(z, 'idle'); if (Math.random() < .3) G.FX.dust(z.x, z.y + .1, z.z, 1, .35, .2, .12); break;
        case 'stagger': if (z.st <= 0 || z.st > .6) setS(z, 'idle'); z.st -= 2 * e; if (z.st <= 0) setS(z, 'idle'); break;
        case 'stun': z.st -= 2 * e; if (z.st <= 0) setS(z, 'idle'); break;
        case 'down': z.st -= 2 * e; if (z.st <= 0) { if (z.crawl) setS(z, 'idle'); else setS(z, 'getup'); } break;
        case 'getup': if (z.st > 1.1) setS(z, 'idle'); break;
        case 'grab': if (P.grabber !== z || !P.alive) { setS(z, 'idle'); z.atkCd = 1; } else { z.x = P.x - Math.sin(z.yaw) * .62; z.z = P.z - Math.cos(z.yaw) * .62; z.yaw = Math.atan2(dxp, dzp); } break;
        case 'scream': if (z.st > 1.6) setS(z, 'idle'); break;
        case 'attack': if (!z.atkHit && z.st > z.atkDur * .46) { z.atkHit = true; if (z.spit) { z.spit = false; R.pt(z.rig, 'head', a); const tt = clamp(dP / 13, .5, 1.6); spits.push({ x: a.x, y: a.y + .1, z: a.z, vx: dxp / tt, vy: (P.y + 1.1 - a.y) / tt + 6 * tt, vz: dzp / tt }); if (G.Audio) G.Audio.gore(.5); z.atkCd = 2.6; } else strike(z, P); } if (z.st > z.atkDur) { setS(z, 'idle'); z.atkCd = z.type === 'runner' ? .5 : .9; } break;
        default: canMove = true;
      }
      if (canMove) {
        const gx = z.gx === undefined ? z.x : z.gx, gz = z.gz === undefined ? z.z : z.gz; let ddx = gx - z.x, ddz = gz - z.z; const dg = Math.hypot(ddx, ddz);
        const reach = (z.type === 'brute' ? 2.0 : 1.5) * (z.crawl ? .75 : 1);
        if (z.human) { z.alert -= e; const t = z.aimAt; if (z.T.hostile && t && (t === P ? P.alive : t.state !== 'dead')) { const tx = t.x - z.x, tz = t.z - z.z, td = Math.hypot(tx, tz), ty = Math.atan2(tx, tz); if (z.mv < .4) z.yaw += clamp(angDiff(ty, z.yaw), -8 * e, 8 * e); z.shootCd -= e; if (z.shootCd <= 0 && Math.abs(angDiff(ty, z.yaw)) < .5) { if (z.bl <= 0) z.bl = z.T.burst || 1; z.bl--; z.shootCd = z.bl > 0 ? .13 : z.T.rof * rnd(.8, 1.4); hShoot(z, t, td); } } }
        if (z.type === 'spitter' && z.tgt === P && z.dT > 5 && z.dT < 20 && z.atkCd <= 0 && z.chasing && Math.abs(angDiff(Math.atan2(dxp, dzp), z.yaw)) < .6) { setS(z, 'attack'); z.atkHit = false; z.spit = true; }
        if (z.type === 'screamer' && z.tgt === P && z.dT < 26 && z.screamCd <= 0 && z.state === 'idle') { z.screamCd = 16; setS(z, 'scream'); G.noise(z.x, z.z, 80); for (const o of L) if (o !== z && o.state !== 'dead' && dist2(o.x, o.z, z.x, z.z) < 2500) { o.aggro = 16; o.rage = 9; } if (G.Audio) G.Audio.scream(z); if (G.UI && dP < 40) G.UI.msg('A screamer is calling the horde!', 'red'); }
        const atGate = z.gate && z.gate.hp > 0 && Math.hypot(z.gate.x - z.x, z.gate.z - z.z) < 2.4;
        if (((z.tgt && z.dT < reach && !z.gate) || atGate) && z.atkCd <= 0) { const ty = atGate ? Math.atan2(z.gate.x - z.x, z.gate.z - z.z) : Math.atan2(z.tgt.x - z.x, z.tgt.z - z.z); if (Math.abs(angDiff(ty, z.yaw)) < 1) { setS(z, 'attack'); z.atkHit = false; if (G.Audio && dP < 25) G.Audio.zattack(z); } else z.yaw += clamp(angDiff(ty, z.yaw), -6 * e, 6 * e); }
        else if (dg > (z.tgt ? .9 : 1.2)) {
          if (z.sideT > 0) { z.sideT -= e; const px = -ddz / dg * z.side, pz = ddx / dg * z.side; ddx = ddx / dg * .3 + px; ddz = ddz / dg * .3 + pz; }
          const ty = Math.atan2(ddx, ddz); z.yaw += clamp(angDiff(ty, z.yaw), -(z.type === 'runner' ? 7 : 3.6) * e, (z.type === 'runner' ? 7 : 3.6) * e);
          speed = z.crawl ? .75 : z.chasing ? z.sp * (z.type === 'walker' && z.dT < 6 ? 1.45 : 1) : z.inv ? z.sp * .8 : Math.min(z.sp, 1.2) * .5;
          if (z.type === 'runner' && !z.chasing) speed = 1.2; if (z.burn > 0) speed *= 1.3; if (z.rage > 0) speed *= 1.35; if (z.type === 'spitter' && z.tgt === P && z.dT < 9 && z.dT > 3.5) speed = 0;
          if (G.hAt(z.x, z.z) < -.7) speed *= z.type === 'drowned' ? 1.2 : .55;
          const f = Math.max(0, Math.cos(angDiff(ty, z.yaw))); speed *= f;
        }
      }
      // integrate
      const fxv = Math.sin(z.yaw), fzv = Math.cos(z.yaw); z.x += (fxv * speed + z.kx) * e; z.z += (fzv * speed + z.kz) * e; const kd = Math.max(0, 1 - 6 * e); z.kx *= kd; z.kz *= kd;
      z.mv += (clamp(speed / (z.type === 'runner' ? 4 : 1.1), 0, 1) - z.mv) * Math.min(1, e * 8); z.ph += speed * e * (z.type === 'runner' ? 2.7 : z.crawl ? 4 : 5.2 / Math.max(.8, z.rig.scale));
      if (!far) { for (let j = i - 1; j >= 0; j--) { const o = L[j]; if (o.state === 'dead') continue; const sx = z.x - o.x, sz = z.z - o.z, rr = z.r + o.r, d2 = sx * sx + sz * sz; if (d2 < rr * rr && d2 > 1e-6) { const d = Math.sqrt(d2), k = (rr - d) / d * .5, km = Math.abs(z.kx) + Math.abs(z.kz); if (km > 3.5 && z.state === 'down' && o.state !== 'down' && o.state !== 'rise' && o.type !== 'brute') { Z.knock(o, z.kx / km, z.kz / km, km * .65); G.FX.blood(o.x, o.y + 1.1, o.z, z.kx / km, .3, z.kz / km, 3); } z.x += sx * k; z.z += sz * k; o.x -= sx * k; o.z -= sz * k; } }
        if (dP < z.r + .32 && z.state !== 'grab' && !P.veh) { const k = (z.r + .32 - dP) / (dP || 1); z.x -= dxp * k; z.z -= dzp * k; } }
      if (z.state !== 'grab') G.resolve(z, z.r, z.y);
      z.y = Math.max(G.groundAt(z.x, z.z), -1.3);
      // stuck → sidestep
      if (canMove && speed > .3) { z.stuck += e; if (z.stuck > .7) { const m = Math.hypot(z.x - z.lx, z.z - z.lz); if (m < speed * .7 * .3) { z.stk = (z.stk || 0) + 1; z.side = Math.random() < .5 ? 1 : -1; z.sideT = rnd(.9, 1.8); } else z.stk = 0; z.stuck = 0; z.lx = z.x; z.lz = z.z; } }
      // fire / bleed
      if (z.burn > 0) { z.burn -= e; G.FX.flame(z.x, z.y + rnd(.3, 1.5), z.z, .8); if ((Z.tick + z.id) % 12 === 0) { G.addLight(z.x, z.y + 1, z.z, 0xff7020, 6, 20, 12); if (Z.damage(z, 'torso', 9, 0, 0, 0, {})) continue; } }
      else if ((Z.tick + z.id) % 10 === 0) for (const f of G.FX.fires) if (dist2(z.x, z.z, f.x, f.z) < f.r * f.r) z.burn = 5;
      if (z.bleed > 0) { z.bleed -= e; if (Math.random() < .5) { const g = z.rig.stumps[z.bleedPart]; g.getWorldPosition(a); G.FX.emit(a.x, a.y, a.z, rnd(-.6, .6), rnd(.5, 2.2), rnd(-.6, .6), .4, .012, .01, 1, .045, 1.4, { kind: 1 }); } }
      if (z.type === 'drowned' && !far && Math.random() < .08) G.FX.emit(z.x + rnd(-.2, .2), z.y + rnd(.6, 1.5), z.z + rnd(-.2, .2), 0, 0, 0, .6, .7, .75, .6, .03, .8, {});
      if (!far && !z.human && (z.groan -= e) <= 0) { z.groan = rnd(4, 11); if (G.Audio && dP < 40) G.Audio.zgroan(z, dP); }
      pose(z, e); z.rig.root.position.set(z.x, z.y, z.z); z.rig.root.rotation.y = z.yaw;
    }
  };

  /* ---------- director: keeps the world populated around the player ---------- */
  function pickType(loc) {
    const r = Math.random(), d = G.env.day, n = G.env.night, run = .1 + n * .12 + Math.min(.16, d * .02), bl = .05 + Math.min(.05, d * .01), br = d >= 3 ? .012 + n * .01 : 0, urban = loc && (loc.id === 'town' || loc.id === 'fort' || loc.id === 'airport' || loc.id === 'station' || loc.id === 'varuna'), po = urban ? .14 : .03, ri = urban ? .09 : .01, sp = d >= 2 || urban ? .06 : .02, sc = .035 + n * .03;
    let t = br; if (r < t) return 'brute'; if (r < (t += bl)) return 'bloater'; if (r < (t += sp)) return 'spitter'; if (r < (t += sc)) return 'screamer'; if (r < (t += ri)) return 'riot'; if (r < (t += run)) return 'runner'; if (r < (t += po)) return 'police'; return 'walker';
  }
  Z.pickType = pickType; let dTimer = 0, hT = 4; const fw = new V3();
  Z.director = dt => {
    dTimer -= dt; if (dTimer > 0) return; dTimer = .55; const S = G.S; if (!S || S.noSpawn) return;
    if ((hT -= .55) <= 0) { hT = 9; const P0 = G.P, lc = G.locAt(P0.x, P0.z), id = lc ? lc.id : '', m = S.mission, r = Math.random(); let hn = 0; for (const z of Z.list) if (z.human && z.state !== 'dead' && !z.tag) hn++;
      if (hn < 5 && !(G.Base && G.Base.inside(P0.x, P0.z))) { let ty = null, n = 1; if ((id === 'airport' || id === 'varuna' || id === 'ezhimala' || (id === 'harbour' && m >= 9)) && m >= 5) { ty = 'guard'; n = r < .5 ? 3 : 2; } else if ((id === 'town' || id === 'station' || id === 'harbour' || id === 'payyanur' || id === 'bridge') && m >= 3 && r < .55) { ty = 'raider'; n = r < .25 ? 3 : 2; } else if (G.env.dayF > .5 && r < .45) { ty = 'civilian'; n = r < .2 ? 2 : 1; }
        if (ty) for (let t = 0; t < 6; t++) { const a2 = Math.random() * TAU, rr = rnd(40, 58), x = P0.x + Math.cos(a2) * rr, z = P0.z + Math.sin(a2) * rr; if (G.groundAt(x, z) < .4 || G.blocked(x, z, 1) || (G.Base && G.Base.inside(x, z))) continue; for (let i = 0; i < n; i++) Z.spawn(ty, x + rnd(-3, 3), z + rnd(-3, 3), {}); break; } } }
    const P = G.P, loc = G.locAt(P.x, P.z), n = G.env.night, B = G.Base;
    let want = Math.round(G.Q().zmax * clamp((loc ? loc.dens : .45) * .5 * (1 + n * .7) + (G.env.day - 1) * .02, .12, 1));
    if (B && B.inside(P.x, P.z)) want = Math.min(want, B.siegeOn ? 0 : 3 + Math.round(n * 3));
    let cnt = 0; for (const z of Z.list) if (z.state !== 'dead' && !z.tag && !z.siege) cnt++;
    if (cnt >= (S.flags.cured ? Math.min(want, 3) : want)) return; G.camera.getWorldDirection(fw);
    for (let t = 0; t < 6; t++) {
      const a2 = Math.random() * TAU, r = rnd(34, 62), x = P.x + Math.cos(a2) * r, z = P.z + Math.sin(a2) * r, h = G.hAt(x, z), g = G.groundAt(x, z);
      if (x < -200 || x > 600 || Math.abs(z) > 940) continue;
      const sea = g < -.2; if (sea && (h < -1.6 || x - G.coast(z) > 30)) continue; if (!sea && g < .4) continue;
      if (G.blocked(x, z, .7) || (B && (B.inside(x, z) || (n < .3 && dist2(x, z, 230, 150) < 55 * 55)))) continue;
      if (((x - P.x) * fw.x + (z - P.z) * fw.z) / r > .5 && r < 52 && n < .5 && G.env.rain < .4) continue;
      Z.spawn(sea ? 'drowned' : pickType(G.locAt(x, z)), x, z, { rise: !sea && Math.random() < .6 }); break;
    }
  };
})();
