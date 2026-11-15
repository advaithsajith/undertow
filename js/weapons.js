'use strict';
/* THEERAM — weapons: guns, attachments, skins, first-person viewmodels, melee, throwables */
(function () {
  const V3 = THREE.Vector3, Wp = G.Wp = {};
  const DEFS = Wp.DEFS = {
    pistol: { name: '9mm Pistol', cls: 'pistol', ammo: 'p', dmg: 30, rpm: 380, mag: 12, reload: 1.5, hip: 1.5, ads: .3, rec: [1.5, .5], range: 70, noise: 38, cost: 0, desc: 'Service sidearm. Reliable, quick to draw.' },
    revolver: { name: '.38 Police Revolver', cls: 'pistol', ammo: 'p', dmg: 64, rpm: 150, mag: 6, reload: 2.4, hip: 1.3, ads: .22, rec: [3.8, .8], range: 80, noise: 45, cost: 120, desc: 'Kerala Police issue. Six heavy hits.' },
    smg: { name: 'Sterling Carbine', cls: 'smg', ammo: 'p', dmg: 22, rpm: 620, mag: 34, reload: 2.1, hip: 2.3, ads: .9, rec: [.9, .6], auto: true, range: 55, noise: 40, cost: 220, desc: 'Side-fed 9mm carbine. Sprays crowds.' },
    dbl: { name: '12-Bore Double Barrel', cls: 'shotgun', ammo: 's', dmg: 19, pellets: 9, rpm: 220, mag: 2, reload: 2.2, hip: 5.5, ads: 4.2, rec: [6, 1.5], range: 28, noise: 55, cost: 150, knock: 4, desc: 'Every planter\'s gun. Two barrels of removal.' },
    pump: { name: 'Pump Shotgun', cls: 'shotgun', ammo: 's', dmg: 16, pellets: 9, rpm: 70, mag: 6, reload: .5, shell: true, pump: true, hip: 5, ads: 3.6, rec: [5, 1.2], range: 30, noise: 55, cost: 320, knock: 3.5, desc: 'Six shells, loaded one at a time.' },
    insas: { name: 'INSAS Rifle', cls: 'rifle', ammo: 'r', dmg: 38, rpm: 600, mag: 20, reload: 2.4, hip: 2.6, ads: .26, rec: [1.3, .5], auto: true, range: 140, noise: 60, cost: 480, pen: 1, lock: 'fort', desc: 'Army 5.56. Accurate and controllable.' },
    ak: { name: 'AK-47', cls: 'rifle', ammo: 'r', dmg: 47, rpm: 560, mag: 30, reload: 2.6, hip: 3, ads: .5, rec: [1.9, .9], auto: true, range: 120, noise: 65, cost: 650, pen: 1, lock: 'fort', desc: 'Hits hard, kicks hard.' },
    enfield: { name: '.303 Lee-Enfield', cls: 'sniper', ammo: 'h', dmg: 175, rpm: 46, mag: 10, reload: 3.2, hip: 4, ads: .04, rec: [5, .6], range: 320, noise: 70, cost: 400, pen: 3, bolt: true, lock: 'fort', desc: 'Bolt action. One round, one body — or three.' },
    crossbow: { name: 'Crossbow', cls: 'bow', ammo: 'b', dmg: 150, rpm: 40, mag: 1, reload: 1.5, hip: 1.2, ads: .1, rec: [1.2, .2], range: 90, noise: 5, cost: 180, pen: 1, desc: 'Silent. One bolt at a time, pulled back by hand.' },
    flamer: { name: 'Flamethrower', cls: 'flame', ammo: 'f', dmg: 7, rpm: 900, mag: 100, reload: 3, hip: 0, ads: 0, rec: [0, 0], auto: true, range: 10, noise: 20, cost: 340, desc: 'A crop sprayer and a pilot light. Burns crowds, burns fuel.' }
  };
  const MELEE = Wp.MELEE = {
    machete: { name: 'Vettukathi (Machete)', dmg: 58, sever: 3, rate: .5, reach: 2.2, arc: 1.0, cost: 0, desc: 'Fast. Takes limbs.' },
    bat: { name: 'Cricket Bat', dmg: 42, stagger: 3, knock: 3, rate: .62, reach: 2.2, arc: 1.2, cost: 60, desc: 'Knocks them flat.' },
    axe: { name: 'Kodali (Axe)', dmg: 130, sever: 4, rate: 1.0, reach: 2.3, arc: .8, cost: 160, desc: 'Slow. Final.' },
    vaal: { name: 'Vaal (Sword)', dmg: 72, sever: 3.5, rate: .44, reach: 2.6, arc: 1.0, cost: 140, desc: 'Kalari long sword. Slash, backhand, thrust.' },
    urumi: { name: 'Urumi (Whip-sword)', dmg: 46, sever: 2.6, rate: .62, reach: 3.7, arc: 2.0, multi: true, cost: 220, desc: 'Flexible steel. Cuts everything around you.' },
    spear: { name: 'Fishing Spear', dmg: 88, sever: .4, rate: .6, reach: 3.5, arc: .45, stab: true, cost: 90, desc: 'Long reach. Every strike is a thrust.' }
  };
  const ATT = Wp.ATT = {
    sight: { iron: { name: 'Iron sights', cost: 0 }, reddot: { name: 'Red dot', cost: 60 }, holo: { name: 'Holo sight', cost: 90 }, scope: { name: '4× scope', cost: 150, only: ['rifle', 'sniper'] } },
    muzzle: { none: { name: 'None', cost: 0 }, supp: { name: 'Suppressor', cost: 100, not: ['shotgun', 'bow', 'flame'] }, comp: { name: 'Compensator', cost: 70 } },
    mag: { std: { name: 'Standard', cost: 0 }, ext: { name: 'Extended', cost: 90, notId: ['dbl'] } },
    under: { none: { name: 'None', cost: 0 }, grip: { name: 'Foregrip', cost: 60, not: ['pistol'] }, laser: { name: 'Laser', cost: 70 } },
    ammo: { fmj: { name: 'Standard', cost: 0 }, hollow: { name: 'Hollow point', cost: 80 }, fire: { name: 'Incendiary', cost: 140 } }
  };
  const SKINS = Wp.SKINS = [
    { name: 'Factory', cost: 0 }, { name: 'Laterite', cost: 40, a: '#8f4a32', b: '#c9744e', k: 'block' }, { name: 'Monsoon', cost: 40, a: '#4a5a66', b: '#8a9aa6', k: 'streak' }, { name: 'Backwater', cost: 40, a: '#2f4a2a', b: '#6a7a3a', k: 'camo' },
    { name: 'Theyyam', cost: 80, a: '#b01810', b: '#f0a020', k: 'flame' }, { name: 'Kasavu', cost: 80, a: '#ece4cc', b: '#c9a23a', k: 'border' }, { name: 'Malabar Tiger', cost: 80, a: '#d07a18', b: '#1a1208', k: 'tiger' }, { name: 'Arabian Sea', cost: 60, a: '#12324a', b: '#2a9a9a', k: 'wave' }, { name: 'Swarnam (Gold)', cost: 400, a: '#c9a030', b: '#f6e08a', k: 'gold' }
  ];
  const skinTex = {};
  function skinT(i) {
    if (skinTex[i]) return skinTex[i]; const s = SKINS[i], r = mulberry(i * 17 + 3);
    return skinTex[i] = canvasTex(128, 128, (c, w, h) => {
      c.fillStyle = s.a; c.fillRect(0, 0, w, h); c.fillStyle = c.strokeStyle = s.b;
      if (s.k === 'block') for (let j = 0; j < 8; j++) for (let x = -1; x < 5; x++) { c.globalAlpha = .3 + r() * .5; c.fillRect(x * 32 + (j % 2) * 16 + 1, j * 16 + 1, 30, 14); }
      else if (s.k === 'streak') for (let x = 0; x < 60; x++) { c.globalAlpha = .2 + r() * .5; c.fillRect(r() * w, r() * h, 1 + r() * 2, 20 + r() * 60); }
      else if (s.k === 'camo') for (let x = 0; x < 40; x++) { c.globalAlpha = .7; c.fillStyle = r() < .5 ? s.b : '#1c2a18'; c.beginPath(); c.ellipse(r() * w, r() * h, 6 + r() * 16, 4 + r() * 9, r() * 3, 0, 7); c.fill(); }
      else if (s.k === 'flame') { for (let x = 0; x < 16; x++) { c.globalAlpha = .9; c.fillStyle = x % 2 ? s.b : '#fff0c0'; c.beginPath(); const bx = x * 8; c.moveTo(bx, h); c.quadraticCurveTo(bx + 4, h - 30 - r() * 50, bx + 2 + r() * 6, h - 70 - r() * 40); c.quadraticCurveTo(bx + 8, h - 30, bx + 8, h); c.fill(); } c.fillStyle = '#101010'; c.globalAlpha = 1; for (let x = 0; x < 9; x++) { c.beginPath(); c.arc(8 + x * 14, 14, 4, 0, 7); c.fill(); } }
      else if (s.k === 'border') { c.fillRect(0, 0, w, 14); c.fillRect(0, 20, w, 3); c.fillRect(0, h - 14, w, 14); c.fillRect(0, h - 23, w, 3); }
      else if (s.k === 'tiger') for (let x = 0; x < 16; x++) { c.lineWidth = 3 + r() * 6; c.beginPath(); const bx = x * 9 + r() * 4; c.moveTo(bx, 0); c.bezierCurveTo(bx + 14, 40, bx - 14, 80, bx + 6, 128); c.stroke(); }
      else if (s.k === 'wave') for (let j = 0; j < 12; j++) { c.lineWidth = 2; c.globalAlpha = .4 + r() * .5; c.beginPath(); for (let x = 0; x <= w; x += 4) c.lineTo(x, j * 11 + Math.sin(x * .12 + j) * 4); c.stroke(); }
      else if (s.k === 'gold') { const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, s.a); g.addColorStop(.5, s.b); g.addColorStop(1, s.a); c.fillStyle = g; c.fillRect(0, 0, w, h); }
    });
  }
  const PH = (hex, sh, o) => new THREE.MeshPhongMaterial(Object.assign({ color: hex, shininess: sh || 30, specular: 0x333333 }, o || {}));
  const MT = { metal: PH(0x3c4048, 70, { specular: 0x666666 }), steel: PH(0x5a5d63, 80, { specular: 0x777777 }), wood: PH(0x6a4226, 18), poly: PH(0x28282c, 16), furn: PH(0x9a5a2a, 22), brass: PH(0xb89a3a, 80), skinH: PH(0x9a6a48, 8), sleeve: PH(0x3a4a3a, 4), red: new THREE.MeshBasicMaterial({ color: 0xff2010 }), lens: PH(0x101820, 120, { specular: 0x88aacc }), blade: PH(0x9a9ea6, 120, { specular: 0xcccccc }), pants: PH(0x2a2a30, 4), boot: PH(0x151515, 20) };
  const bx = (p, w, h, l, x, y, z, m, rx) => { const g = new THREE.Mesh(new THREE.BoxGeometry(w, h, l), m); g.position.set(x, y, z); if (rx) g.rotation.x = rx; p.add(g); return g; };
  const cy = (p, r, l, x, y, z, m, seg) => { const g = new THREE.Mesh(new THREE.CylinderGeometry(r, r, l, seg || 10), m); g.rotation.x = Math.PI / 2; g.position.set(x, y, z); p.add(g); return g; };
  function arm(p, hx, hy, hz, ex, ey, ez) { const a = new V3(hx, hy, hz), b = new V3(ex, ey, ez), L = a.distanceTo(b), g = new THREE.Group(); g.position.copy(a); g.lookAt(b); p.add(g); const f = new THREE.Mesh(new THREE.CylinderGeometry(.03, .04, L, 8), MT.skinH); f.rotation.x = Math.PI / 2; f.position.z = L / 2; g.add(f); const s = new THREE.Mesh(new THREE.CylinderGeometry(.043, .05, L * .55, 8), MT.sleeve); s.rotation.x = Math.PI / 2; s.position.z = L * .74; g.add(s); const h = new THREE.Mesh(new THREE.SphereGeometry(.036, 8, 6), MT.skinH); h.scale.set(1, .9, 1.25); g.add(h); return g; }

  function buildGun(id, cfg, world) {
    const d = DEFS[id], g = new THREE.Group(), S = cfg.skin ? PH(0xffffff, 40, { map: skinT(cfg.skin) }) : null;
    const body = S || MT.metal, wood = S || MT.wood, furn = S || MT.furn, poly = S || MT.poly; let mz = -.2, sy = .045, hgz = -.2, sz = -.05, long = true, mag = null, part = null, hgy = -.03;
    if (id === 'pistol') { part = bx(g, .028, .034, .19, 0, .022, -.085, body); bx(g, .026, .02, .15, 0, -.002, -.07, MT.poly); bx(g, .027, .1, .042, 0, -.055, -.005, poly, .22); mag = bx(g, .02, .03, .036, 0, -.1, .008, MT.steel, .22); bx(g, .004, .009, .006, 0, .043, -.172, MT.metal); bx(g, .014, .008, .006, 0, .042, -.004, MT.metal); mz = -.185; sy = .046; long = false; hgz = -.1; hgy = -.012; sz = -.06; }
    else if (id === 'revolver') { bx(g, .022, .046, .1, 0, .012, -.04, body === MT.metal ? MT.steel : body); part = cy(g, .0215, .044, 0, .014, -.046, MT.steel, 8); cy(g, .009, .13, 0, .025, -.15, MT.steel); bx(g, .008, .012, .11, 0, .008, -.14, MT.steel); bx(g, .028, .095, .04, 0, -.05, .005, wood, .3); bx(g, .004, .01, .006, 0, .04, -.21, MT.metal); mz = -.215; sy = .044; long = false; hgz = -.12; hgy = -.005; sz = -.04; }
    else if (id === 'smg') { cy(g, .02, .42, 0, .01, -.2, body); cy(g, .008, .08, 0, .01, -.44, MT.steel); mag = bx(g, .17, .028, .034, -.1, .01, -.2, MT.steel); bx(g, .026, .09, .04, 0, -.05, -.04, MT.poly, .2); bx(g, .006, .006, .3, .015, -.02, .13, MT.steel); bx(g, .006, .006, .3, -.015, -.02, .13, MT.steel); bx(g, .04, .07, .012, 0, -.02, .28, MT.steel); bx(g, .004, .014, .006, 0, .036, -.38, MT.metal); bx(g, .016, .012, .008, 0, .035, -.02, MT.metal); mz = -.48; sy = .042; hgz = -.3; sz = -.1; }
    else if (id === 'dbl') { cy(g, .011, .6, .012, .012, -.42, MT.steel); cy(g, .011, .6, -.012, .012, -.42, MT.steel); bx(g, .04, .03, .22, 0, -.008, -.3, wood); part = bx(g, .042, .05, .12, 0, .006, -.06, body); bx(g, .036, .07, .3, 0, -.035, .15, wood, -.14); bx(g, .028, .06, .04, 0, -.045, .0, wood, .5); cy(g, .003, .006, 0, .026, -.715, MT.brass); mz = -.72; sy = .042; hgz = -.3; }
    else if (id === 'pump') { cy(g, .011, .55, 0, .02, -.4, MT.steel); cy(g, .011, .42, 0, -.004, -.34, MT.steel); part = bx(g, .042, .04, .16, 0, -.006, -.3, poly); bx(g, .04, .06, .2, 0, .005, -.06, body); bx(g, .036, .07, .28, 0, -.03, .16, poly, -.12); bx(g, .028, .07, .04, 0, -.05, .01, MT.poly, .4); cy(g, .003, .006, 0, .034, -.665, MT.brass); mz = -.68; sy = .048; hgz = -.3; }
    else if (id === 'insas') { bx(g, .038, .06, .26, 0, .005, -.1, body); bx(g, .042, .045, .22, 0, .004, -.34, furn); cy(g, .008, .26, 0, .012, -.56, MT.steel); bx(g, .012, .03, .012, 0, .035, -.5, MT.metal); bx(g, .02, .014, .1, 0, .042, -.06, MT.metal); mag = bx(g, .024, .13, .05, 0, -.085, -.12, PH(0x5a4020, 60, { transparent: true, opacity: .9 }), .12); bx(g, .028, .08, .04, 0, -.055, .0, furn, .3); bx(g, .034, .06, .26, 0, -.012, .15, furn); cy(g, .012, .05, 0, .012, -.68, MT.metal); mz = -.71; sy = .056; hgz = -.34; sz = -.1; }
    else if (id === 'ak') { bx(g, .038, .055, .27, 0, .005, -.1, body); bx(g, .042, .042, .2, 0, .0, -.33, wood); cy(g, .009, .2, 0, .028, -.33, wood); cy(g, .008, .28, 0, .008, -.56, MT.steel); bx(g, .01, .04, .012, 0, .035, -.62, MT.metal); bx(g, .02, .012, .03, 0, .04, -.2, MT.metal); mag = new THREE.Group(); g.add(mag); bx(mag, .026, .09, .05, 0, -.07, -.13, MT.metal, .2); bx(mag, .026, .08, .05, 0, -.14, -.155, MT.metal, .45); bx(g, .028, .08, .04, 0, -.055, .0, wood, .3); bx(g, .034, .065, .27, 0, -.02, .16, wood, -.08); mz = -.71; sy = .052; hgz = -.33; sz = -.1; }
    else if (id === 'enfield') { bx(g, .04, .045, .75, 0, -.005, -.3, wood); cy(g, .009, .2, 0, .02, -.72, MT.steel); bx(g, .036, .05, .2, 0, .022, -.06, body); part = new THREE.Group(); g.add(part); part.position.set(.02, .03, -.02); cy(part, .007, .06, .03, 0, 0, MT.steel).rotation.set(0, 0, Math.PI / 2); const kb = new THREE.Mesh(new THREE.SphereGeometry(.013, 8, 6), MT.steel); kb.position.set(.062, -.005, 0); part.add(kb); mag = bx(g, .03, .045, .07, 0, -.05, -.1, MT.metal); bx(g, .036, .09, .3, 0, -.04, .19, wood, -.1); bx(g, .004, .012, .006, 0, .036, -.8, MT.metal); bx(g, .02, .01, .02, 0, .05, -.16, MT.metal); mz = -.82; sy = .046; hgz = -.4; sz = -.08; }
    else if (id === 'crossbow') { bx(g, .04, .05, .5, 0, -.005, -.1, wood); bx(g, .03, .02, .42, 0, .03, -.3, MT.metal); bx(g, .52, .022, .03, 0, .03, -.5, MT.poly); bx(g, .12, .03, .05, .2, .03, -.47, MT.poly).rotation.y = .5; bx(g, .12, .03, .05, -.2, .03, -.47, MT.poly).rotation.y = -.5; bx(g, .46, .004, .004, 0, .036, -.36, MT.steel); part = cy(g, .005, .36, 0, .046, -.34, MT.steel); bx(g, .028, .08, .04, 0, -.055, .0, MT.poly, .3); mz = -.56; sy = .058; hgz = -.3; sz = -.08; }
    else if (id === 'flamer') { cy(g, .05, .3, .075, -.07, .06, PH(0xa02018, 30)); cy(g, .045, .26, -.075, -.07, .06, PH(0x2a5a8a, 30)); bx(g, .045, .06, .36, 0, 0, -.12, body); cy(g, .013, .5, 0, .012, -.5, MT.steel); cy(g, .024, .06, 0, .012, -.76, MT.metal); const pl = new THREE.Mesh(new THREE.SphereGeometry(.008, 6, 4), MT.red); pl.position.set(0, .034, -.77); g.add(pl); bx(g, .028, .08, .04, 0, -.055, .0, MT.poly, .3); mz = -.79; sy = .05; hgz = -.36; sz = -.08; }
    // attachments
    let zoom = 1;
    if (cfg.sight === 'reddot' || cfg.sight === 'holo') { const h = cfg.sight === 'holo'; bx(g, .03, .008, .05, 0, sy - .002, sz, MT.metal); bx(g, .003, h ? .034 : .028, .008, .015, sy + .018, sz - .02, MT.metal); bx(g, .003, h ? .034 : .028, .008, -.015, sy + .018, sz - .02, MT.metal); bx(g, .033, .003, .008, 0, sy + (h ? .036 : .033), sz - .02, MT.metal); const dot = new THREE.Mesh(new THREE.SphereGeometry(h ? .0018 : .0014, 6, 4), MT.red); dot.position.set(0, sy + .018, sz - .02); g.add(dot); if (h) { const rg = new THREE.Mesh(new THREE.TorusGeometry(.007, .0006, 4, 16), MT.red); rg.position.copy(dot.position); g.add(rg); } sy += .018; zoom = 1.15; }
    else if (cfg.sight === 'scope') { cy(g, .017, .17, 0, sy + .024, sz - .02, MT.metal); cy(g, .021, .03, 0, sy + .024, sz - .1, MT.metal); cy(g, .02, .025, 0, sy + .024, sz + .06, MT.metal); bx(g, .012, .02, .02, 0, sy + .005, sz - .06, MT.metal); bx(g, .012, .02, .02, 0, sy + .005, sz + .02, MT.metal); sy += .024; zoom = 4; }
    if (cfg.muzzle === 'supp') { cy(g, .017, .15, 0, id === 'dbl' ? .012 : (id === 'pump' ? .02 : (id === 'pistol' ? .022 : id === 'revolver' ? .025 : .011)), mz - .07, MT.poly); mz -= .15; }
    else if (cfg.muzzle === 'comp') { bx(g, .024, .024, .04, 0, id === 'pump' ? .02 : (id === 'pistol' ? .022 : id === 'revolver' ? .025 : .011), mz - .015, MT.steel); mz -= .035; }
    if (cfg.mag === 'ext' && mag) { if (id === 'smg') { mag.scale.x = 1.4; mag.position.x -= .03; } else { mag.scale.y = 1.45; mag.position.y -= .025; } }
    if (cfg.under === 'grip') cy(g, .012, .08, 0, hgy - .06, hgz, MT.poly).rotation.x = 0;
    else if (cfg.under === 'laser') { bx(g, .016, .016, .05, long ? .028 : 0, long ? .0 : hgy - .01, hgz, MT.metal); const ld = new THREE.Mesh(new THREE.SphereGeometry(.003, 6, 4), MT.red); ld.position.set(long ? .028 : 0, long ? 0 : hgy - .01, hgz - .026); g.add(ld); }
    // hands
    if (!world) arm(g, 0, -.05, .0, .1, -.26, .34); if (world) { } else if (long) arm(g, 0, hgy - (cfg.under === 'grip' ? .07 : .01), hgz, -.17, -.27, hgz + .2); else arm(g, -.012, -.07, -.0, -.2, -.26, .3);
    // muzzle flash
    const fl = new THREE.Group(), fm = new THREE.MeshBasicMaterial({ color: 0xffd080, transparent: true, opacity: .95, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    for (let i = 0; i < 3; i++) { const p = new THREE.Mesh(new THREE.PlaneGeometry(.16, .05), fm); p.rotation.z = i * Math.PI / 3; fl.add(p); } const p2 = new THREE.Mesh(new THREE.PlaneGeometry(.05, .28), fm); p2.rotation.x = Math.PI / 2; p2.position.z = -.1; fl.add(p2);
    fl.position.set(0, id === 'pistol' ? .022 : id === 'revolver' ? .025 : id === 'pump' ? .02 : .011, mz - .03); fl.visible = false; g.add(fl);
    g.userData = { mz, sy, mag, part, flash: fl, zoom, long, magY: mag ? mag.position.y : 0 };
    return g;
  }
  function buildMelee(id, world) {
    const g = new THREE.Group();
    if (id === 'machete') { bx(g, .028, .03, .13, 0, 0, .0, MT.wood); bx(g, .004, .055, .44, 0, .008, -.29, MT.blade); bx(g, .004, .03, .08, 0, .03, -.5, MT.blade, .5); }
    else if (id === 'bat') { cy(g, .016, .3, 0, 0, -.05, MT.wood); bx(g, .022, .075, .5, 0, 0, -.44, PH(0xc9a66a, 20)); bx(g, .024, .02, .5, 0, 0, -.44, PH(0xb02020, 10)); }
    else if (id === 'vaal') { bx(g, .03, .035, .16, 0, 0, .02, MT.wood); bx(g, .13, .02, .025, 0, 0, -.07, MT.brass); bx(g, .005, .052, .84, 0, 0, -.5, MT.blade); bx(g, .005, .034, .07, 0, 0, -.95, MT.blade); }
    else if (id === 'urumi') { cy(g, .017, .17, 0, 0, .0, MT.wood); bx(g, .05, .05, .02, 0, 0, -.09, MT.brass); for (let i = 0; i < 3; i++) { const b = bx(g, .003, .028, .62, (i - 1) * .012, 0, -.4, MT.blade); b.rotation.y = (i - 1) * .05; const b2 = bx(g, .003, .028, .6, (i - 1) * .05, .1 + i * .04, -.95, MT.blade, .32 + i * .1); b2.rotation.y = (i - 1) * .14; bx(g, .003, .028, .5, (i - 1) * .12, .34 + i * .1, -1.4, MT.blade, .62 + i * .12); } }
    else if (id === 'spear') { cy(g, .014, 1.5, 0, 0, -.55, MT.wood); bx(g, .006, .05, .22, 0, 0, -1.4, MT.blade); bx(g, .05, .006, .1, 0, 0, -1.3, MT.blade); }
    else { cy(g, .015, .62, 0, 0, -.2, MT.wood); bx(g, .028, .13, .1, 0, -.03, -.47, MT.blade); bx(g, .034, .05, .07, 0, .01, -.47, MT.metal); }
    if (!world) arm(g, 0, -.02, .02, .12, -.24, .36); g.userData = { melee: true };
    return g;
  }

  const linC = new Map();
  function toWorld(g) { g.traverse(m => { if (!m.isMesh) return; let n = linC.get(m.material); if (!n) { n = m.material.clone(); if (n.color && !n.isMeshBasicMaterial) n.color.convertSRGBToLinear(); linC.set(m.material, n); } m.material = n; m.castShadow = true; }); if (g.userData.flash) g.userData.flash.visible = false; return g; }
  Wp.worldGun = id => toWorld(buildGun(id, G.S.guns[id] || { sight: 'iron', muzzle: 'none', mag: 'std', under: 'none', ammo: 'fmj', skin: 0, un: {}, skins: [0] }, true));
  Wp.worldMelee = id => toWorld(buildMelee(id, true));
  /* ---------- state ---------- */
  const st = Wp.st = { cur: 0, gun: null, meleeVM: null, leg: null, clip: {}, cool: 0, reloading: 0, reloadT: 0, equipT: 0, kick: 0, kickR: 0, bloom: 0, ads: 0, sway: new V3(), flashT: 0, swing: 0, swingDur: 0, swingHit: false, swingKind: '', quick: false, legT: 0, pumpT: 0, heavy: 0, throwSel: 'frag', hitT: 0, hitHead: false, zoom: 1, scoped: false };
  const vm = new THREE.Group(), proj = []; st.cstep = 0; st.comboT = 0; st.fovK = 0;
  for (const id in DEFS) if (DEFS[id].cost) DEFS[id].cost = Math.round(DEFS[id].cost * .55 / 5) * 5;
  Wp.cfgOf = id => G.S.guns[id];
  Wp.curId = () => st.cur === 3 ? null : G.S.slots[st.cur];
  Wp.magSize = id => Math.round(DEFS[id].mag * (G.S.guns[id].mag === 'ext' ? 1.5 : 1));
  Wp.give = id => { if (!G.S.guns[id]) G.S.guns[id] = { sight: 'iron', muzzle: 'none', mag: 'std', under: 'none', ammo: 'fmj', skin: 0, un: {}, skins: [0] }; st.clip[id] = Wp.magSize(id); };
  Wp.rebuild = () => {
    G.P.heldId = null;
    if (st.gun) vm.remove(st.gun); st.gun = null; if (st.meleeVM) vm.remove(st.meleeVM); st.meleeVM = buildMelee(G.S.melee); st.meleeVM.visible = false; vm.add(st.meleeVM);
    const id = Wp.curId(); if (id) { st.gun = buildGun(id, G.S.guns[id]); vm.add(st.gun); if (st.clip[id] === undefined) st.clip[id] = Wp.magSize(id); st.clip[id] = Math.min(st.clip[id], Wp.magSize(id)); st.zoom = st.gun.userData.zoom; }
  };
  Wp.init = () => {
    G.sceneVM.add(vm);
    const lg = st.leg = new THREE.Group(); const th = new THREE.Mesh(new THREE.CylinderGeometry(.075, .095, .75, 8), MT.pants); th.rotation.x = Math.PI / 2; th.position.z = .3; lg.add(th); const bt = new THREE.Mesh(new THREE.BoxGeometry(.11, .26, .1), MT.boot); bt.position.set(0, .06, -.1); lg.add(bt); lg.visible = false; G.sceneVM.add(lg);
    Wp.rebuild();
  };
  Wp.equip = slot => { if (slot === st.cur || st.swing > 0) return; if (slot < 3 && !G.S.slots[slot]) return; st.cur = slot; st.reloading = 0; st.equipT = .32; st.cool = .3; Wp.rebuild(); G.Audio && G.Audio.click(.5); };
  Wp.addAmmo = (k, n) => { G.S.ammo[k] = Math.min(999, (G.S.ammo[k] || 0) + n); };

  /* ---------- shooting ---------- */
  const o = new V3(), d = new V3(), rt = new V3(), up = new V3(), fw = new V3(), e3 = new THREE.Euler(), mzp = new V3();
  function fire(id) {
    const D = DEFS[id], c = G.S.guns[id], P = G.P, cam = G.camera, supp = c.muzzle === 'supp' || D.cls === 'bow';
    if (D.cls === 'flame') {
      st.clip[id]--; st.cool = 60 / D.rpm; P.aimT = .5; cam.getWorldDirection(fw); const tp = P.tps && !st.scoped, sx = tp ? P.muzzle.x : cam.position.x + fw.x * .6 - fw.z * .12, sy2 = tp ? P.muzzle.y : cam.position.y - .14 + fw.y * .6, sz = tp ? P.muzzle.z : cam.position.z + fw.z * .6 + fw.x * .12;
      for (let i = 0; i < 3; i++) G.FX.emit(sx, sy2, sz, fw.x * rnd(9, 13) + rnd(-1, 1), fw.y * 11 + rnd(-.6, 1.2), fw.z * rnd(9, 13) + rnd(-1, 1), 2.8, 1.1 + Math.random() * .7, .2, .85, .12, .55 + Math.random() * .3, { add: 1, grav: -2, grow: 1.5, drag: 1.2 });
      if ((G.frame & 3) === 0) { G.addLight(sx + fw.x * 3, sy2, sz + fw.z * 3, 0xff7020, 10, 40, 20); for (const z of G.Z.list) { if (z.state === 'dead') continue; const dx = z.x - P.x, dz = z.z - P.z, dd = Math.hypot(dx, dz); if (dd > D.range || (dx * fw.x + dz * fw.z) / (dd || 1) < .8) continue; z.burn = Math.max(z.burn, 6); G.Z.damage(z, 'torso', D.dmg * 4, fw.x, 0, fw.z, { how: 'fire' }); } G.noise(P.x, P.z, D.noise); if (G.Audio) G.Audio.shot('flame'); P.shake = Math.max(P.shake, .12); }
      return;
    }
    st.clip[id]--; st.cool = 60 / D.rpm; if (D.pump || D.bolt) st.pumpT = Math.min(.55, 60 / D.rpm * .8);
    cam.getWorldDirection(fw); rt.crossVectors(fw, cam.up).normalize(); up.crossVectors(rt, fw);
    o.copy(cam.position); mzp.copy(o).addScaledVector(fw, .7).addScaledVector(rt, .13 * (1 - st.ads)).addScaledVector(up, -.1 * (1 - st.ads) - .02);
    P.aimT = .7; const tp = P.tps && !st.scoped && !P.veh; if (tp) { o.addScaledVector(fw, P.camBack); mzp.copy(P.muzzle); }
    if (P.veh) { const V = P.veh, t0 = V.T.cam + 2, sx = o.x + fw.x * t0, sy = o.y + fw.y * t0, sz = o.z + fw.z * t0; let tt = 120; const wh0 = G.ray(sx, sy, sz, fw.x, fw.y, fw.z, tt); if (wh0) tt = wh0.t; const zh0 = G.Z.raycast(sx, sy, sz, fw.x, fw.y, fw.z, tt); if (zh0) tt = zh0.t;
      const tx = sx + fw.x * tt, ty = sy + fw.y * tt, tz = sz + fw.z * tt; o.set(V.x + Math.cos(V.yaw) * .35, V.y + 1.75, V.z - Math.sin(V.yaw) * .35); fw.set(tx - o.x, ty - o.y, tz - o.z).normalize(); o.addScaledVector(fw, V.T.r + .4); rt.crossVectors(fw, cam.up).normalize(); up.crossVectors(rt, fw); mzp.copy(o); }
    let spread = lerp(D.hip, D.ads, st.ads) * (c.under === 'laser' ? lerp(.55, 1, st.ads) : c.under === 'grip' ? lerp(.75, 1, st.ads) : 1) * (c.sight !== 'iron' ? lerp(1, .8, st.ads) : 1);
    spread *= P.veh ? 1.25 + Math.min(1, Math.abs(P.veh.sp) / 25) : (P.speed > 2 ? 1.5 : 1) * (P.crouch ? .75 : 1) * (P.onGround ? 1 : 2); spread += st.bloom; const pel = D.pellets || 1;
    let dmg = D.dmg * (supp ? .93 : 1) * (c.ammo === 'hollow' ? 1.22 : 1), pen = c.ammo === 'hollow' ? 0 : (D.pen || 0), anyHit = false, head = false, killed = 0;
    for (let i = 0; i < pel; i++) {
      const a = Math.random() * TAU, r = Math.sqrt(Math.random()) * spread * Math.PI / 180;
      d.copy(fw).addScaledVector(rt, Math.cos(a) * r).addScaledVector(up, Math.sin(a) * r).normalize();
      const wh = G.ray(o.x, o.y, o.z, d.x, d.y, d.z, D.range * 1.6); let maxT = wh ? wh.t : D.range * 1.6, left = pen, skip = [], endT = maxT, dm = dmg;
      for (; ;) {
        const h = G.Z.raycast(o.x, o.y, o.z, d.x, d.y, d.z, maxT, skip); if (!h) break;
        const px = o.x + d.x * h.t, py = o.y + d.y * h.t, pz = o.z + d.z * h.t, fall = h.t > D.range ? .5 : 1;
        G.FX.blood(px, py, pz, d.x, d.y * .3, d.z, h.part === 'head' ? 10 : 6, 3.5); G.Rig.wound(h.z.rig, h.part, px, py, pz);
        const kn = D.knock && h.t < 7 ? D.knock * (1 - h.t / 10) : 0;
        const k = G.Z.damage(h.z, h.part, dm * fall, d.x, d.y, d.z, { knock: kn > 2.4 && i === 0 ? kn : 0, heavy: D.cls === 'shotgun' || D.cls === 'sniper', sever: D.cls === 'shotgun' ? 1.6 : D.cls === 'sniper' ? 3 : 1, stagger: D.cls === 'shotgun' ? 1.2 : 1, how: 'gun' });
        if (c.ammo === 'fire' && Math.random() < (pel > 1 ? .12 : .4)) h.z.burn = 5;
        anyHit = true; if (h.part === 'head') head = true; if (k) killed++;
        if (left-- <= 0) { endT = h.t; break; } skip.push(h.z); dm *= .7;
      }
      if (endT === maxT && wh && wh.obj && wh.obj.haz && G.Plus) G.Plus.hitHaz(wh.obj.haz, dm);
      if (endT === maxT && wh) { const x = o.x + d.x * wh.t, y = o.y + d.y * wh.t, z = o.z + d.z * wh.t; if (wh.kind === 'water') G.FX.splash(x, z, 5); else if (wh.kind === 'ground') G.FX.dust(x, y + .05, z, 3); else G.FX.sparks(x + wh.nx * .05, y, z + wh.nz * .05, wh.nx, wh.ny, wh.nz, 4); }
      if (i % 3 === 0) G.FX.tracer(mzp.x, mzp.y, mzp.z, o.x + d.x * endT, o.y + d.y * endT, o.z + d.z * endT);
    }
    if (killed && (head || D.cls === 'shotgun' || D.cls === 'sniper')) G.hitStop(.045);
    if (anyHit) { st.hitT = .18; st.hitHead = head; G.Audio && G.Audio.hit(head, killed); if (killed && G.UI) G.UI.killFeed(head); }
    const rk = (c.muzzle === 'comp' ? .7 : 1) * (c.under === 'grip' ? .85 : 1) * (P.crouch ? .8 : 1) * lerp(1, .75, st.ads);
    P.pitch += D.rec[0] * rk * Math.PI / 180; P.recBack += D.rec[0] * rk * Math.PI / 180 * .62; P.yaw += rnd(-1, 1) * D.rec[1] * rk * Math.PI / 180;
    st.kick = Math.min(1.6, st.kick + D.rec[0] * .22 + .25); st.kickR += rnd(-1, 1) * .45; P.rollK = (P.rollK || 0) + rnd(-1, 1) * D.rec[0] * .007; P.shake = Math.max(P.shake, Math.min(.55, D.rec[0] * .07 + .1)); st.fovK = Math.min(1, st.fovK + D.rec[0] * .14); st.bloom = Math.min(3, st.bloom + (D.auto ? .28 : .5));
    st.flashT = supp ? .02 : .05; G.vmFlash.intensity = supp ? .6 : 2.6;
    if (tp && !supp) for (let i = 0; i < 3; i++) G.FX.emit(mzp.x + fw.x * i * .09, mzp.y + fw.y * i * .09, mzp.z + fw.z * i * .09, fw.x * 2, fw.y * 2, fw.z * 2, 3.5, 2.2, .8, .9, .24 - i * .06, .055, { add: 1, grav: 0 });
    if (!supp) G.addLight(mzp.x, mzp.y, mzp.z, 0xffb060, 14, 160, 26);
    G.FX.emit(mzp.x - fw.x * .4 + rt.x * .1, mzp.y, mzp.z - fw.z * .4 + rt.z * .1, rt.x * 2 + rnd(-.5, .5), 2.5, rt.z * 2 + rnd(-.5, .5), .8, .6, .2, 1, .02, .9, {});
    G.FX.emit(mzp.x, mzp.y, mzp.z, fw.x * 2, .5, fw.z * 2, .5, .5, .5, .3, .1, .5, { grav: -.5, grow: .6, drag: 2 });
    G.noise(P.x, P.z, D.noise * (supp ? .28 : 1)); P.loud = supp ? .3 : 1;
    G.Audio && G.Audio.shot(D.cls, supp, id);
    if (G.S.stats) G.S.stats.shots++;
  }
  function reloadStart(id) { const D = DEFS[id]; if (st.reloading || st.clip[id] >= Wp.magSize(id) || !(G.S.ammo[D.ammo] > 0)) return; st.reloading = 1; st.reloadT = D.shell ? D.reload : D.reload * (G.S.perk && G.S.perk.reload ? .82 : 1); G.Audio && G.Audio.reload(0); }
  function reloadDone(id) { const D = DEFS[id], m = Wp.magSize(id); if (D.shell) { st.clip[id]++; G.S.ammo[D.ammo]--; G.Audio && G.Audio.reload(1); if (st.clip[id] < m && G.S.ammo[D.ammo] > 0 && !G.In.mb[0]) { st.reloadT = D.reload; return; } st.reloading = 0; st.pumpT = .4; return; } const n = Math.min(m - st.clip[id], G.S.ammo[D.ammo]); st.clip[id] += n; G.S.ammo[D.ammo] -= n; st.reloading = 0; G.Audio && G.Audio.reload(1); }

  /* ---------- melee ---------- */
  function swingStart(kind, quick) { if (st.swing > 0) return; const M = MELEE[G.S.melee]; st.swingKind = kind; st.quick = quick; st.swingHit = false;
    if (kind === 'light') { st.cstep = M.stab ? 2 : (st.comboT > 0 && !quick ? (st.cstep + 1) % 3 : 0); if (st.cstep === 2) G.P.shove(-Math.sin(G.P.yaw) * 4.5, -Math.cos(G.P.yaw) * 4.5); } else st.cstep = 0;
    st.swingDur = kind === 'kick' || kind === 'stomp' ? .55 : kind === 'execute' ? .7 : kind === 'heavy' ? M.rate * 1.5 : M.rate * (st.cstep === 2 ? 1.2 : st.cstep === 1 ? .9 : 1); st.swing = st.swingDur; st.reloading = 0; if (kind === 'kick' || kind === 'stomp') { st.legT = st.swingDur; st.leg.visible = true; } G.Audio && G.Audio.swing(); G.P.stam = Math.max(0, G.P.stam - (kind === 'heavy' ? 18 : 8)); }
  function swingHit() {
    const P = G.P, M = MELEE[G.S.melee], k = st.swingKind, fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw); let n = 0;
    if (k === 'execute' || k === 'stomp') { const t = st.ctxT; if (t && t.state !== 'dead') { const y = k === 'stomp' ? t.y + .3 : t.y + 1.5; const hx = k === 'stomp' ? t.x + Math.sin(t.yaw) * -1.5 * t.fall : t.x, hz = k === 'stomp' ? t.z + Math.cos(t.yaw) * -1.5 * t.fall : t.z; G.FX.gore(hx, y, hz, 30); G.Z.damage(t, 'head', 9999, fx, 0, fz, { sever: 5, heavy: true, how: st.silent ? 'silent' : k }); G.UI && G.UI.splat(.8); G.Audio && G.Audio.gore(1.2); P.shake = .5; n = 1; } }
    else {
      const stab = k === 'light' && st.cstep === 2, reach = (k === 'kick' ? 2.6 : M.reach + (stab ? .5 : 0)) + (P.veh ? P.veh.T.r + .6 : 0), arc = k === 'kick' ? 1.1 : stab ? Math.min(M.arc, .42) : M.arc;
      for (const z of G.Z.list) {
        if (z.state === 'dead') continue; const dx = z.x - P.x, dz = z.z - P.z, dd = Math.hypot(dx, dz); if (dd > reach + z.r || Math.abs(z.y - P.y) > 2) continue; if (dd > .6 && Math.abs(angDiff(Math.atan2(dx, dz), P.yaw + Math.PI)) > arc) continue;
        const nx = dx / (dd || 1), nz = dz / (dd || 1), hy = z.y + (z.crawl || z.state === 'down' ? .3 : 1.25) * z.rig.scale;
        if (k === 'kick') { G.FX.blood(z.x, hy, z.z, nx, .3, nz, 5); if (!G.Z.damage(z, 'torso', 70, nx, 0, nz, { heavy: true, how: 'kick' })) G.Z.knock(z, nx, nz, 7); }
        else { const hv = k === 'heavy' ? 1.8 : stab ? 1.75 : 1 + st.cstep * .12, part = stab ? (Math.random() < .3 ? 'head' : 'torso') : z.state === 'stun' && z.stunKind === 0 ? 'head' : Math.random() < .3 ? 'head' : Math.random() < .5 ? pick(['armL', 'armR']) : 'torso'; G.FX.blood(z.x - nx * .3, hy, z.z - nz * .3, -nx * .5 + nz, .6, -nz * .5 - nx, 10 * hv, 4); G.Z.damage(z, part, M.dmg * hv * (P.stam < 5 ? .6 : 1), nx, 0, nz, { sever: stab ? .3 : (M.sever || 1), stagger: M.stagger || 1.5, knock: (M.knock || 0) * hv > 2.5 ? (M.knock || 0) * hv : 0, heavy: hv > 1, how: 'melee' }); if (dd < 1.6) G.UI && G.UI.splat(.3); }
        if (stab) { G.FX.blood(z.x + nx * .35, hy, z.z + nz * .35, nx, .2, nz, 16, 6.5); if (z.state === 'dead' && G.UI.style) G.UI.style('IMPALED', 4); } n++; if (k !== 'kick' && k !== 'heavy' && !M.multi && n >= (stab ? 1 : 2)) break;
      }
      if (!n) { const h = G.ray(P.x, P.y + 1.3, P.z, fx, -.1, fz, 2); if (h && h.kind !== 'water') { G.FX.sparks(P.x + fx * h.t, P.y + 1.3 - .1 * h.t, P.z + fz * h.t, h.nx, h.ny, h.nz, 3); n = -1; } }
    }
    if (n > 0) G.hitStop(k === 'execute' || k === 'stomp' ? .11 : k === 'kick' ? .08 : .06);
    if (n) { G.Audio && G.Audio.thud(n > 0); P.shake = Math.max(P.shake, .25); if (!st.silent) G.noise(P.x, P.z, 9); st.silent = false; }
  }
  Wp.context = () => { const t = G.Z.meleeTarget(); if (!t || st.swing > 0) return false; st.ctxT = t.z; const P = G.P; P.yaw = Math.atan2(t.z.x - P.x, t.z.z - P.z) + Math.PI; P.dodgeT = .5; st.silent = t.kind === 'silent'; swingStart(st.silent ? 'execute' : t.kind, true); return true; };
  Wp.throwIt = () => {
    const S = G.S, k = st.throwSel; if (!(S[k] > 0) || st.cool > 0) return; S[k]--; st.cool = .7; const P = G.P, cam = G.camera; cam.getWorldDirection(fw);
    const m = new THREE.Mesh(k === 'frag' ? new THREE.IcosahedronGeometry(.07, 1) : new THREE.CylinderGeometry(.04, .05, .2, 8), new THREE.MeshStandardMaterial({ color: k === 'frag' ? 0x2a3a22 : 0x6a4a20, roughness: .5 })); m.castShadow = true; m.position.copy(cam.position).addScaledVector(fw, .5); if (P.veh) { const V = P.veh; m.position.set(V.x, V.y + 1.9, V.z).addScaledVector(fw, V.T.r + .5); } G.scene.add(m);
    proj.push({ m, k, v: new V3(fw.x * 15 + P.vx * .5, fw.y * 15 + 4.5, fw.z * 15 + P.vz * .5), t: k === 'frag' ? 2.3 : 9 }); G.Audio && G.Audio.swing(); st.kick = .8;
  };
  function boom(p) {
    const x = p.m.position.x, y = p.m.position.y, z = p.m.position.z, P = G.P; G.scene.remove(p.m);
    if (p.k === 'bottle') { G.noise(x, z, 50); G.FX.sparks(x, y + .1, z, 0, 1, 0, 7); G.Audio && G.Audio.click(1.7); return; }
    if (p.k === 'frag') { G.FX.explode(x, y, z, true); G.Z.blast(x, y, z, 7, 280); const dd = Math.hypot(P.x - x, P.z - z); if (dd < 6.5) P.hurt(70 * (1 - dd / 6.5), x, z, 'blast'); G.noise(x, z, 90); G.Audio && G.Audio.boom(dd); P.shake = Math.max(P.shake, clamp(1.4 - dd / 20, 0, 1)); G.FX.decal(x, z, 0); }
    else { G.FX.fire(x, z, 4.6, 14); G.FX.fire(x + rnd(-2, 2), z + rnd(-2, 2), 2.6, 11); G.FX.explode(x, y, z, false); for (let i = 0; i < 14; i++) G.FX.flame(x + rnd(-3, 3), y + rnd(0, 1.2), z + rnd(-3, 3), 1.4); for (const zb of G.Z.list) if (zb.state !== 'dead' && dist2(zb.x, zb.z, x, z) < 25) { zb.burn = 9; zb.aggro = 0; } G.addLight(x, y + 1, z, 0xff7020, 30, 60, 40); G.noise(x, z, 40); G.Audio && G.Audio.boom(Math.hypot(P.x - x, P.z - z)); G.Audio && G.Audio.gore && G.Audio.gore(.4); }
  }

  /* ---------- per-frame ---------- */
  Wp.update = dt => {
    const P = G.P, In = G.In, id = Wp.curId(), D = id && DEFS[id], gun = st.gun, canAct = P.alive && !P.grabber && !G.paused && !P.busy, inV = !!P.veh, bikeV = inV && P.veh.T.lean;
    st.comboT -= dt; st.cool -= dt; st.equipT = Math.max(0, st.equipT - dt); st.kick = Math.max(0, st.kick - dt * 7); st.kickR *= Math.max(0, 1 - dt * 9); st.bloom = Math.max(0, st.bloom - dt * 3.2); st.hitT -= dt; st.pumpT = Math.max(0, st.pumpT - dt);
    if (st.flashT > 0) { st.flashT -= dt; if (st.flashT <= 0) G.vmFlash.intensity = 0; }
    for (let i = proj.length - 1; i >= 0; i--) { const p = proj[i]; p.t -= dt; p.v.y -= 16 * dt; const m = p.m; m.position.addScaledVector(p.v, dt); m.rotation.x += dt * 9; m.rotation.z += dt * 6; if (p.k === 'molotov') { G.FX.flame(m.position.x, m.position.y + .1, m.position.z, .5); if ((G.frame & 3) === 0) G.addLight(m.position.x, m.position.y, m.position.z, 0xff8030, 4, 12, 6); } const gy = G.groundAt(m.position.x, m.position.z) + .07; let hit = m.position.y < gy; if (hit) { m.position.y = gy; p.v.y *= -.35; p.v.x *= .55; p.v.z *= .55; } else if (G.blocked(m.position.x, m.position.z, .1) && m.position.y < gy + 3) { p.v.x *= -.4; p.v.z *= -.4; hit = true; } if (!hit && p.k === 'molotov') for (const zb of G.Z.list) if (zb.state !== 'dead' && Math.abs(m.position.y - zb.y - 1) < 1.1 && dist2(zb.x, zb.z, m.position.x, m.position.z) < .5) { hit = true; break; }
      if (p.t <= 0 || (hit && p.k !== 'frag')) { boom(p); proj.splice(i, 1); } }
    if (canAct) {
      for (let i = 0; i < 3; i++) if (G.hit('Digit' + (i + 1))) Wp.equip(i); if (G.hit('Digit4')) Wp.equip(3);
      if (In.wheel) { let s = st.cur; for (let i = 0; i < 4; i++) { s = (s + (In.wheel > 0 ? 1 : 3)) % 4; if (s === 3 || G.S.slots[s]) break; } Wp.equip(s); }
      if (G.hit('Digit5')) { const TS = ['frag', 'molotov', 'bottle']; st.throwSel = TS[(TS.indexOf(st.throwSel) + 1) % 3]; G.UI && G.UI.msg({ frag: 'Grenade', molotov: 'Petrol bomb', bottle: 'Bottle (noise lure)' }[st.throwSel] + ' selected'); }
      if (G.hit('KeyG')) Wp.throwIt();
      if (G.hit('KeyF') && !inV) Wp.context();
      if (G.hit('KeyV') && st.swing <= 0 && (!inV || bikeV || P.veh.type === 'auto')) swingStart('light', st.cur !== 3);
      if (st.swing <= 0 && st.equipT <= 0) {
        if (st.cur === 3 && inV && !bikeV && P.veh.type !== 'auto') { }
        else if (st.cur === 3) { if (In.mb[2]) st.heavy += dt; if (In.mp[0]) swingStart('light', false); else if (!In.mb[2] && st.heavy > 0) { if (st.heavy > .25 && P.stam > 10) swingStart('heavy', false); st.heavy = 0; } }
        else if (D) {
          if (G.hit('KeyR')) reloadStart(id);
          const want = D.auto ? In.mb[0] : In.mp[0];
          if (want && st.cool <= 0 && !P.sprinting) { if (st.clip[id] > 0) { if (st.reloading && D.shell) st.reloading = 0; if (!st.reloading) fire(id); } else if (In.mp[0]) { G.Audio && G.Audio.click(1); reloadStart(id); } }
          if (st.clip[id] <= 0 && !st.reloading && st.cool <= 0 && G.S.ammo[D.ammo] > 0 && !In.mb[0]) reloadStart(id);
        }
      }
    }
    if (st.reloading) { st.reloadT -= dt; if (st.reloadT <= 0) reloadDone(id); }
    if (st.swing > 0) { st.swing -= dt; const u = 1 - st.swing / st.swingDur; if (!st.swingHit && u > (st.swingKind === 'kick' || st.swingKind === 'stomp' ? .4 : .38)) { st.swingHit = true; swingHit(); } if (st.swing <= 0) { st.leg.visible = false; st.quick = false; st.comboT = .6; } }
    // ADS
    const adsOn = canAct && In.mb[2] && st.cur !== 3 && !st.reloading && !P.sprinting && st.swing <= 0 && D; st.ads += clamp((adsOn ? 1 : 0) - st.ads, -dt * 7, dt * 7); st.scoped = st.ads > .85 && st.zoom >= 4;
    G.camera.fov += ((G.set.fov / (1 + (st.zoom * (D && D.cls === 'sniper' && st.zoom < 4 ? 1.6 : 1) - 1 + .22) * st.ads)) * (P.sprinting ? 1.06 : 1) - G.camera.fov) * Math.min(1, dt * 14); G.camera.updateProjectionMatrix();
    // viewmodel pose
    const showMelee = st.cur === 3 || (st.swing > 0 && st.quick && st.swingKind !== 'kick' && st.swingKind !== 'stomp'), mv = st.meleeVM; vm.visible = !P.veh && P.alive && !st.scoped && !P.tps;
    if (gun) gun.visible = !showMelee; mv.visible = showMelee;
    const bob = Math.sin(P.bob) * P.speedN, bob2 = Math.cos(P.bob * 2) * P.speedN, t = G.t;
    st.sway.x += (clamp(-In.mx * .0006, -.03, .03) - st.sway.x) * Math.min(1, dt * 9); st.sway.y += (clamp(In.my * .0006, -.03, .03) - st.sway.y) * Math.min(1, dt * 9);
    const eq = st.equipT / .32, low = P.sprinting && st.swing <= 0 ? 1 : 0; st.low = (st.low || 0) + (low - (st.low || 0)) * Math.min(1, dt * 8);
    if (showMelee) {
      let u = st.swing > 0 ? 1 - st.swing / st.swingDur : 0; const sw = st.swing > 0 ? Math.sin(Math.min(1, u * 1.25) * Math.PI) : 0, pr = u < .3 ? u / .3 : 1, ex = st.swingKind === 'execute';
      mv.position.set(.24 - (ex ? .2 : .42) * (u > .25 ? Math.min(1, (u - .25) / .3) : 0) * (st.swing > 0 ? 1 : 0) + st.sway.x + bob * .012, -.2 + (ex ? .22 * pr - .4 * (u > .35 ? Math.min(1, (u - .35) / .2) : 0) : .1 * sw) + bob2 * .01 - eq * .3 - st.low * .06 + st.heavy * .05, -.42 - (ex ? .1 : .18) * sw);
      mv.rotation.set(ex ? -.2 - 1.2 * (u > .35 ? Math.min(1, (u - .35) / .2) : -pr * .5) : .5 - 1.5 * sw * (u > .3 ? 1 : .3) - st.heavy * .6, .25 + (ex ? 0 : 1.1 * (u > .25 && st.swing > 0 ? Math.min(1, (u - .25) / .3) : 0)), ex ? 0 : -.5 + 1.6 * (st.swing > 0 ? Math.min(1, u * 2) : 0));
      if (st.swing > 0 && st.swingKind === 'light' && st.cstep === 1) { mv.position.x = -.26 + .5 * (u > .25 ? Math.min(1, (u - .25) / .3) : 0); mv.rotation.y = -mv.rotation.y; mv.rotation.z = -mv.rotation.z; }
      else if (st.swing > 0 && st.swingKind === 'light' && st.cstep === 2) { const th = u < .3 ? -u / .3 * .2 : Math.sin(Math.min(1, (u - .3) / .22) * Math.PI * .5) * .55 * (1 - Math.max(0, (u - .62) / .38)); mv.position.set(.15 + st.sway.x, -.15 + bob2 * .01, -.38 - th); mv.rotation.set(.04 + th * .1, .1, -.12); }
    } else if (gun) {
      const U = gun.userData, a = st.ads, rl = st.reloading ? Math.sin(clamp(1 - st.reloadT / (D.shell ? D.reload : D.reload), 0, 1) * Math.PI) : 0;
      const hx = U.long ? .14 : .13, hy = U.long ? -.175 : -.155, hz = U.long ? -.35 : -.37;
      gun.position.set(lerp(hx, 0, a) + st.sway.x * (1 - a * .7) + bob * .011 * (1 - a * .8) + st.low * .06, lerp(hy, -U.sy - .009, a) + st.sway.y * (1 - a * .7) + Math.abs(bob2) * .008 * (1 - a * .8) - eq * .3 - rl * .09 - st.low * .07 + Math.sin(t * 1.6) * .0025 * (1 - a), lerp(hz, U.long ? -.44 : -.36, a) + st.kick * .045);
      gun.rotation.set(st.kick * .11 * (U.long ? 1 : 1.9) - st.sway.y * 2.6 - rl * .45 + eq * .9 - st.low * .25, st.low * .7 + st.sway.x * 3.4 + rl * .25 + st.kickR * .05, st.kickR * .1 + rl * .5 + st.sway.x * -3);
      if (U.mag) U.mag.position.y = U.magY - (st.reloading && !D.shell ? Math.sin(clamp((1 - st.reloadT / D.reload) * 1.4, 0, 1) * Math.PI) * .22 : 0);
      if (U.part && (D.pump || D.bolt)) { const pu = st.pumpT > 0 ? Math.sin((1 - st.pumpT / .55) * Math.PI) : 0; if (D.pump) U.part.position.z = -.3 + pu * .09; else { U.part.position.z = -.02 + pu * .07; U.part.rotation.z = pu * .9; } }
      if (id === 'pistol' && U.part) U.part.position.z = -.085 + Math.min(.03, st.kick * .03);
      U.flash.visible = st.flashT > 0; if (U.flash.visible) { U.flash.rotation.z = Math.random() * 3; U.flash.scale.setScalar(.7 + Math.random() * .7); }
    }
    if (P.tps) st.leg.visible = false;
    if (st.leg.visible) { const u = 1 - st.swing / st.swingDur, k = Math.sin(Math.min(1, u * 1.15) * Math.PI), stp = st.swingKind === 'stomp'; st.leg.position.set(.08, -.62 + k * (stp ? .1 : .3), -.25 - k * (stp ? .2 : .55)); st.leg.rotation.set(stp ? -.9 + k * .5 : .25 - k * .2, 0, 0); P.kickPitch = stp ? -k * .22 : k * .05; } else P.kickPitch = 0;
  };
})();
