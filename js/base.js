'use strict';
/* THEERAM — base: game state, the family, the Thalap home, gates, upgrades, night sieges */
(function () {
  const B = G.Base = { members: [], gates: [], siegeOn: false, siege: null, threat: false, built: {} };
  const R = { x0: 208, x1: 252, z0: 128, z1: 172 };
  B.inside = (x, z) => x > R.x0 && x < R.x1 && z > R.z0 && z < R.z1;
  const FAM = B.FAM = {
    achan: { name: 'Achan', full: 'Raghavan · Father', role: 'guard', look: { skin: 'humanMaleA', skirt: 'mundu', skirtCol: 0xe8e4d6 }, perk: 'reload', perkTxt: 'Drilled by Achan — reload 18% faster',
      lines: ['Mone, check your magazine before you check the door.', 'This house stood through three floods. It will stand through this.', 'Your grandfather kept that 12-bore oiled for forty years. Now we know why.', 'Shoot the head or the legs. The chest only makes them angry.'] },
    amma: { name: 'Amma', full: 'Sathi · Mother', role: 'cook', look: { skin: 'humanFemaleA', skirt: 'sari', skirtCol: 0x2a6a5a, scale: .94 }, perk: 'tough', perkTxt: 'Amma\'s kanji — take 15% less damage',
      lines: ['Eat first. The dead can wait ten minutes.', 'I counted the rice again. Bring more when you can, kanna.', 'Don\'t stay out after the lamps. Promise me.', 'When this is over I am making payasam for the whole lane.'] },
    muthassi: { name: 'Muthassi', full: 'Devaki · Grandmother', role: 'healer', look: { skin: 'humanFemaleA', tint: 0xd0d0d0, skirt: 'sari', skirtCol: 0xe6e2d8, scale: .87 }, perk: 'medic', perkTxt: 'Muthassi\'s remedies — first-aid heals 40% more',
      lines: ['Karkidakam was always the month of sickness. Never like this.', 'Turmeric and neem on every bite. Do not argue with me.', 'I have seen the sea take villages. It gives them back wrong.', 'Light the lamp at dusk. Some things still matter.'] },
    meenu: { name: 'Meenu', full: 'Meenakshi · Sister', role: 'scout', look: { skin: 'survivorFemaleA', scale: .93 }, perk: 'scout', perkTxt: 'Meenu\'s notes — unsearched supplies show on your map',
      lines: ['I marked every shop I remember on the map. Half are probably still stocked.', 'The runners come out more at night. I timed them from the roof.', 'Teach me the rifle. I\'m serious, chetta.', 'The radio said Ezhimala was still transmitting last week.'] },
    vishnu: { name: 'Vishnu', full: 'Brother', role: 'guard', look: { skin: 'skaterMaleA' }, perk: 'ads', perkTxt: 'Vishnu spots for you — headshots stagger longer',
      lines: ['Three days up that tower. I could see them walking out of the surf.', 'I\'ll take the north gate. You sleep.', 'From the lamp room the whole coast was dark. Except our house.'] },
    rajan: { name: 'Rajan', full: 'Fisherman · Mappila Bay', role: 'forage', look: { skin: 'criminalMaleA', tint: 0xd0b098, skirt: 'lungi', skirtCol: 0x3a5f8a }, perk: 'boat', perkTxt: 'Rajan\'s boat — travel between jetties',
      lines: ['The sea is the only road they don\'t walk well. Mostly.', 'Mathi and ayala are still running. The fish don\'t know the world ended.', 'Any jetty, any time. Just bring diesel.'] },
    fathima: { name: 'Dr. Fathima', full: 'Doctor · Payyanur', role: 'healer', look: { skin: 'skaterFemaleA', tint: 0xe8f0ff, scale: .95 }, perk: 'revive', perkTxt: 'Dr. Fathima — the wounded hold on twice as long; rest heals fully',
      lines: ['The bite isn\'t what turns them. It\'s the fever after. Keep wounds clean.', 'Forty beds, three nurses, one night. That was Payyanur.', 'Sit. Let me look at that arm.'] },
    unni: { name: 'Unni', full: 'Cousin · age 9', role: 'rest', look: { skin: 'skaterMaleA', scale: .64 }, perk: 'morale', perkTxt: 'Unni keeps everyone smiling — morale never drops below 30',
      lines: ['Chetta, did you get any monsters today?', 'I drew our house. That\'s you with the big gun.', 'Muthassi says I can light the lamp tonight!'] }
  };
  const UP = B.UP = {
    walls: { name: 'Reinforced gates', max: 3, cost: 70, txt: 'Gate strength +150 each level' }, tower: { name: 'Watchtower', max: 1, cost: 120, txt: 'Guards see and shoot further' },
    lights: { name: 'Floodlights', max: 1, cost: 80, txt: 'Guards shoot better at night' }, spikes: { name: 'Spike rows', max: 3, cost: 60, txt: 'Hurts anything clawing at a gate' }, garden: { name: 'Kitchen garden', max: 3, cost: 50, txt: '+2 food every morning per level' }
  };
  G.newState = () => ({
    v: 3, files: [], scrap: 40, food: 8, meds: 1, frag: 1, molotov: 1, fuel: 0, ammo: { p: 60, s: 0, r: 0, h: 0, b: 0, f: 0 }, bottle: 2, mine: 0, guns: {}, slots: ['pistol', null, null], melee: 'machete', meleeOwned: ['machete'],
    mission: 0, step: 0, mv: {}, flags: {}, lightOn: false, autoOk: false, boat: false, fort: false, noSpawn: false, god: false,
    fam: { achan: { hp: 100, bond: 1, role: 'guard', talk: 0 }, amma: { hp: 100, bond: 1, role: 'cook', talk: 0 }, muthassi: { hp: 100, bond: 1, role: 'rest', talk: 0 }, meenu: { hp: 100, bond: 1, role: 'rest', talk: 0 } },
    dead: [], gate: { N: 300, E: 300 }, up: { walls: 0, tower: 0, lights: 0, spikes: 0, garden: 0 }, morale: 70, perk: {}, looted: {}, stats: { kills: 0, heads: 0, shots: 0, deaths: 0 }, siegeDay: 0, armor: 0, cp: null, job: null, hour: 16.9, day: 1
  });
  B.gateMax = () => 300 + G.S.up.walls * 150;

  /* ---------- gates ---------- */
  function mkGate(id, x, z, yaw) {
    const g = new THREE.Group(), y = G.hAt(x, z), wood = new THREE.MeshStandardMaterial({ color: col(0x6a4a30), roughness: .9 }), sheet = new THREE.MeshStandardMaterial({ color: col(0x7a8086), roughness: .5, metalness: .3 }), planks = [];
    g.position.set(x, y, z); g.rotation.y = yaw;
    for (let i = 0; i < 7; i++) { const p = new THREE.Mesh(new THREE.BoxGeometry(.9, .16, .08), i % 3 === 1 ? sheet : wood); p.scale.x = 7; p.position.set(0, .3 + i * .36, rnd(-.03, .03)); p.rotation.z = rnd(-.05, .05); p.castShadow = true; g.add(p); planks.push(p); }
    for (const sx of [-2, 0, 2]) { const p = new THREE.Mesh(new THREE.BoxGeometry(.14, 2.8, .12), wood); p.position.set(sx, 1.4, .1); p.rotation.z = sx * .06; p.castShadow = true; g.add(p); planks.push(p); }
    const sp = new THREE.Group(); for (let i = 0; i < 9; i++) { const s = new THREE.Mesh(new THREE.ConeGeometry(.07, 1.1, 5), wood); s.position.set(-3 + i * .75, .45, -1.3); s.rotation.x = -.7; sp.add(s); } sp.visible = false; g.add(sp);
    G.scene.add(g);
    const horiz = Math.abs(Math.sin(yaw)) < .5, box = G.addBox(x, z, horiz ? 3.5 : .3, horiz ? .3 : 3.5, 0, y - 1, y + 2.9, 'gate');
    const gate = { id, x, z, yaw, hp: 300, mesh: g, planks, box, spikes: sp, nx: horiz ? 0 : 1, nz: horiz ? -1 : 0, shake: 0 };
    G.addInter({ x: x - gate.nx * .9, z: z - gate.nz * .9, r: 3, hold: .8, label: () => gate.hp <= 0 ? `Rebuild ${id === 'N' ? 'north' : 'east'} gate (20 scrap)` : `Repair gate ${Math.round(gate.hp)}/${B.gateMax()} (5 scrap)`, on: () => gate.hp < B.gateMax(), fn: () => { const S = G.S, c = gate.hp <= 0 ? 20 : 5; if (S.scrap < c) { G.UI.msg('Not enough scrap', 'red'); return; } S.scrap -= c; gate.hp = Math.min(B.gateMax(), Math.max(0, gate.hp) + (c === 20 ? 150 : 70)); B.syncGate(gate); G.Audio.thud(false); G.UI.msg('Gate repaired', 'green'); } });
    return gate;
  }
  B.syncGate = g => { const f = clamp(g.hp / B.gateMax(), 0, 1); g.box.on = g.hp > 0; g.planks.forEach((p, i) => { const on = g.hp > 0 && i / g.planks.length < f * .9 + .15; if (on) { p.visible = true; if (p.userData.fallen) { p.userData.fallen = false; p.position.y = p.userData.y0; p.rotation.x = 0; } } else if (!p.userData.fallen) { p.userData.fallen = true; p.userData.y0 = p.position.y; p.position.y = .08; p.rotation.x = 1.4; } }); g.spikes.visible = G.S.up.spikes > 0; G.S.gate[g.id] = g.hp; };
  B.hitGate = (g, dmg) => { if (g.hp <= 0) return; g.hp -= dmg; g.shake = .3; G.FX.dust(g.x, G.hAt(g.x, g.z) + 1.2, g.z, 3, .4, .3, .2); G.Audio.gateHit(Math.hypot(G.P.x - g.x, G.P.z - g.z)); if (g.hp <= 0) { g.hp = 0; G.UI.msg(`${g.id === 'N' ? 'NORTH' : 'EAST'} GATE BREACHED`, 'red'); G.UI.banner('GATE BREACHED', 'They are inside the compound'); G.Audio.boom(20); } B.syncGate(g); };
  // waypoint for anything crossing the compound wall
  B.route = (x, z, tx, tz) => {
    const a = B.inside(x, z), b = B.inside(tx, tz); if (a === b) return null; let best = null, bc = 1e9;
    for (const g of B.gates) { const c = (Math.hypot(g.x - x, g.z - z) + Math.hypot(g.x - tx, g.z - tz)) * (g.hp <= 0 ? .45 : 1); if (c < bc) { bc = c; best = g; } }
    const g = best, s = a ? -1 : 1, ox = g.x + g.nx * 1.5 * s, oz = g.z + g.nz * 1.5 * s;
    if (g.hp > 0) return { x: ox, z: oz, gate: g };
    if (Math.hypot(x - ox, z - oz) > 2) return { x: ox, z: oz, gate: null };
    return { x: g.x - g.nx * 3 * s, z: g.z - g.nz * 3 * s, gate: null };
  };

  /* ---------- family ---------- */
  const gunG = new THREE.BoxGeometry(.04, .06, .7), gunM = new THREE.MeshStandardMaterial({ color: col(0x3a2a1c), roughness: .6 });
  B.addMember = (id, silent) => {
    if (B.members.find(m => m.id === id) || G.S.dead.includes(id)) return; const d = FAM[id], S = G.S; if (!S.fam[id]) S.fam[id] = { hp: 100, bond: 1, role: d.role === 'forage' ? 'forage' : d.role === 'guard' ? 'guard' : 'rest', talk: 0 };
    const rig = G.Rig.make(Object.assign({ scale: 1 }, d.look)), i = B.members.length, post = G.poi.posts[i % G.poi.posts.length];
    const gun = new THREE.Mesh(gunG, gunM); gun.castShadow = true; G.Rig.hold(rig, gun); gun.position.set(0, -.07, .22);
    const m = { id, d, rig, sv: S.fam[id], x: post[0], z: post[1], y: 0, yaw: Math.random() * 6, alive: true, down: false, downT: 0, away: false, cd: rnd(0, 1.5), ph: 0, mv: 0, aim: null, gun, post, hurt: (dmg, z) => B.hurtMember(m, dmg, z) };
    m.hp = m.sv.hp; G.scene.add(rig.root); B.members.push(m);
    G.addInter({ get x() { return m.x; }, get z() { return m.z; }, r: 2.4, label: () => m.down ? `Revive ${d.name} (hold)` : `Talk to ${d.name}`, on: () => m.alive && !m.away, get hold() { return m.down ? 2.2 : 0; }, fn: () => B.talk(m) });
    if (!silent) { G.UI.msg(`${d.name} joined the household`, 'gold'); B.perks(); }
  };
  B.perks = () => { const S = G.S; S.perk = {}; for (const m of B.members) if (m.alive && m.sv.bond >= 3) S.perk[m.d.perk] = true; if (B.members.find(m => m.id === 'rajan' && m.alive)) S.boat = true; };
  B.talk = m => {
    const S = G.S; if (m.down) { m.down = false; m.hp = m.sv.hp = 50; G.UI.msg(`${m.d.name} is back on their feet`, 'green'); G.UI.say(m.d.name, 'I\'m alright… I\'m alright. Thank you.'); return; }
    G.UI.say(m.d.name, pick(m.d.lines));
    if (m.sv.talk !== G.env.day) { m.sv.talk = G.env.day; if (m.sv.bond < 5) { m.sv.bond++; G.UI.msg(`Bond with ${m.d.name} ♥ ${m.sv.bond}/5`, 'gold'); if (m.sv.bond === 3) { G.UI.banner('BOND', m.d.perkTxt); B.perks(); } } S.morale = Math.min(100, S.morale + 1); }
    if (m.id === 'fathima' && G.P.hp < G.P.maxHp) { G.P.heal(100); G.UI.msg('Dr. Fathima patched you up', 'green'); }
  };
  B.hurtMember = (m, dmg, z) => { if (!m.alive || m.down) return; m.hp -= dmg; m.sv.hp = Math.max(1, m.hp); G.FX.blood(m.x, m.y + 1.2, m.z, 0, .5, 0, 6); if (m.hp <= 0) { m.down = true; m.downT = G.S.perk.revive ? 150 : 75; G.UI.msg(`${m.d.name} is down! Revive them!`, 'red'); G.Audio.hurt(); } };
  function killMember(m) { m.alive = false; m.down = false; G.S.dead.push(m.id); delete G.S.fam[m.id]; G.S.morale = Math.max(0, G.S.morale - 25); G.UI.banner(`${m.d.name.toUpperCase()} IS GONE`, 'The house is quieter now.'); G.Rig.dispose(m.rig); B.perks(); }
  B.setCrew = id => { const m = B.members.find(x => x.id === id); if (!m || !m.alive) return; if (!m.sv.crew && B.members.filter(x => x.sv.crew && x.alive).length >= 2) { G.UI.msg('Only two can come with you', 'red'); return; } m.sv.crew = !m.sv.crew; G.UI.msg(m.sv.crew ? m.d.name + ' is coming with you' : m.d.name + ' heads home', 'gold'); if (!m.sv.crew) { m.x = m.post[0]; m.z = m.post[1]; } };
  B.roles = id => id === 'unni' ? ['rest'] : id === 'muthassi' ? ['rest', 'cook'] : ['guard', 'cook', 'forage', 'rest'];
  const tmp = new THREE.Vector3();
  function memberUpdate(m, dt, near) {
    const r = m.rig, T = r.T, S = G.S, P = G.P, role = m.sv.role; G.Rig.reset(T);
    m.away = !m.sv.crew && role === 'forage' && G.env.hour > 8 && G.env.hour < 16 && !B.siegeOn; r.root.visible = !m.away; if (m.away) { m.x = 228; m.z = 120; return; }
    m.gun.visible = (role === 'guard' || !!m.sv.crew) && !m.down;
    if (m.down) { m.downT -= dt; T.bRx = -Math.PI / 2; T.bY = .14; T.aLz = 1; T.aRz = -1; T.kL = .4; G.Rig.apply(r, dt * 8); r.root.position.set(m.x, G.groundAt(m.x, m.z), m.z); if (m.downT <= 0) killMember(m); return; }
    // where to stand
    let tx = m.post[0], tz = m.post[1]; const i = B.members.indexOf(m);
    if (role === 'guard') { const g = B.gates[i % 2]; tx = g.x - g.nx * 4 + (i > 1 ? 2 : -2) * Math.abs(g.nz); tz = g.z - g.nz * 4 + (i > 1 ? 2 : -2) * Math.abs(g.nx); if (S.up.tower && i === 0) { tx = 248; tz = 168; } }
    else if (B.threat) { tx = G.poi.house.x - 6 + i * 1.7; tz = G.poi.house.z + .6; }
    else if (role === 'cook') { tx = G.poi.fire.x + 1.3; tz = G.poi.fire.z + .6; }
    if (m.sv.crew) { const P0 = G.P, ci = B.members.filter(x => x.sv.crew).indexOf(m), a0 = P0.yaw + (ci ? -.9 : .9), far = dist2(m.x, m.z, P0.x, P0.z); tx = P0.x + Math.sin(a0) * 2.6; tz = P0.z + Math.cos(a0) * 2.6; if (far > 45 * 45 || (P0.veh && far > 144)) { m.x = tx; m.z = tz; } }
    const dx = tx - m.x, dz = tz - m.z, d = Math.hypot(dx, dz); let sp = 0;
    if (d > (m.sv.crew ? 1.2 : .5)) { sp = m.sv.crew ? (d > 5 ? 6.4 : 3) : B.threat ? 3 : 1.4; m.yaw += angDiff(Math.atan2(dx, dz), m.yaw) * Math.min(1, dt * 6); m.x += dx / d * sp * dt; m.z += dz / d * sp * dt; G.resolve(m, .3, m.y, 'gate'); }
    m.mv += ((sp > 0 ? 1 : 0) - m.mv) * Math.min(1, dt * 8); m.ph += sp * dt * 4.4; m.y = G.groundAt(m.x, m.z); if (tz > 155 && Math.abs(m.x - G.poi.house.x) < 8.5 && m.z > G.poi.house.z - 2.3) m.y = Math.max(m.y, G.poi.house.y);
    const s = Math.sin(m.ph), c = Math.cos(m.ph), t = G.t + i * 2; T.lLx = -s * .5 * m.mv; T.lRx = s * .5 * m.mv; T.kL = Math.max(0, c) * .7 * m.mv; T.kR = Math.max(0, -c) * .7 * m.mv; T.aLx = s * .4 * m.mv; T.aRx = -s * .4 * m.mv; T.spZ = .02 * Math.sin(t * .8); T.nkY = .25 * Math.sin(t * .37); T.spX = .03;
    // guards shoot
    m.cd -= dt; m.aim = null;
    if ((role === 'guard' && near) || m.sv.crew) {
      const range = (S.up.tower ? 40 : 27) * (S.morale < 30 ? .8 : 1); let bz = null, bd = range;
      for (const z of G.Z.list) { if (z.state === 'dead' || z.state === 'rise' || (z.human && !z.T.hostile)) continue; const dd = Math.hypot(z.x - m.x, z.z - m.z); if (dd < bd && (B.inside(z.x, z.z) || !B.inside(m.x, m.z) || dd < range)) { bd = dd; bz = z; } }
      if (bz) {
        m.aim = bz; m.yaw += angDiff(Math.atan2(bz.x - m.x, bz.z - m.z), m.yaw) * Math.min(1, dt * 7); T.aRx = -1.5; T.eR = -.08; T.aLx = -1.25; T.aLz = -.55; T.eL = -.5; T.spY = .25; T.nkY = -.2; T.lLx = T.lRx = 0; T.kL = T.kR = 0;
        if (m.cd <= 0 && (sp === 0 || m.sv.crew)) {
          m.cd = rnd(1.1, 1.9) * (S.morale < 30 ? 1.4 : 1); const acc = clamp(.62 - bd * .008 + (G.env.night > .5 ? (S.up.lights ? .05 : -.18) : .05) + m.sv.bond * .03, .15, .9);
          m.gun.getWorldPosition(tmp); const hy = bz.y + 1.2; G.FX.tracer(tmp.x, tmp.y, tmp.z, bz.x + rnd(-.3, .3), hy + rnd(-.3, .3), bz.z + rnd(-.3, .3)); G.addLight(tmp.x, tmp.y, tmp.z, 0xffb060, 6, 80, 14); G.Audio.farShot(Math.hypot(P.x - m.x, P.z - m.z));
          if (Math.random() < acc) { const hd = Math.random() < .2, nx = (bz.x - m.x) / bd, nz = (bz.z - m.z) / bd; G.FX.blood(bz.x, hy, bz.z, nx, .2, nz, 5); G.Z.damage(bz, hd ? 'head' : Math.random() < .25 ? 'legL' : 'torso', 36, nx, 0, nz, { npc: true }); }
        }
      }
    }
    G.Rig.apply(r, dt * 10); r.root.position.set(m.x, m.y, m.z); r.root.rotation.y = m.yaw;
  }

  /* ---------- build / upgrades ---------- */
  B.buy = k => { const S = G.S, u = UP[k]; if (S.up[k] >= u.max) return; const c = u.cost * (S.up[k] + 1); if (S.scrap < c) { G.UI.msg('Not enough scrap', 'red'); return; } S.scrap -= c; S.up[k]++; B.syncUp(); G.UI.msg(`${u.name} built`, 'gold'); G.Audio.thud(false); if (k === 'walls') for (const g of B.gates) { g.hp += 150; B.syncGate(g); } };
  B.syncUp = () => {
    const S = G.S, M = (c, r) => new THREE.MeshStandardMaterial({ color: col(c), roughness: r || .9 }), add = (k, fn) => { if (S.up[k] && !B.built[k]) { B.built[k] = new THREE.Group(); fn(B.built[k]); G.scene.add(B.built[k]); } if (B.built[k]) B.built[k].visible = !!S.up[k]; };
    add('tower', g => { const y = G.hAt(248, 168), w = M(0x6a4a30); for (const q of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(.09, .11, 4.4, 6), w); p.position.set(248 + q[0] * 1.1, y + 2.2, 168 + q[1] * 1.1); p.castShadow = true; g.add(p); } const f = new THREE.Mesh(new THREE.BoxGeometry(2.8, .12, 2.8), w); f.position.set(248, y + 3.4, 168); f.castShadow = true; g.add(f); const rf = new THREE.Mesh(new THREE.ConeGeometry(2.3, 1, 4), M(0x8a4130)); rf.position.set(248, y + 5.6, 168); rf.rotation.y = Math.PI / 4; rf.castShadow = true; g.add(rf); });
    add('lights', g => { const mt = new THREE.MeshStandardMaterial({ color: 0x333333, emissive: new THREE.Color(1, .95, .8), emissiveIntensity: 3 }); for (const q of [[211, 131], [249, 131], [249, 169], [211, 169]]) { const y = G.hAt(q[0], q[1]); const p = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 5, 5), M(0x555555, .5)); p.position.set(q[0], y + 2.5, q[1]); g.add(p); const l = new THREE.Mesh(new THREE.BoxGeometry(.5, .3, .3), mt); l.position.set(q[0], y + 5, q[1]); g.add(l); } g.userData.mat = mt; });
    add('garden', g => { const y = G.hAt(214, 148), so = M(0x3a2212), gr = M(0x2f7a22); for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(1.6, .25, 5), so); b.position.set(211.5 + i * 2.2, y + .1, 150); g.add(b); for (let k = 0; k < 6; k++) { const p = new THREE.Mesh(new THREE.ConeGeometry(.28, .7, 5), gr); p.position.set(211.5 + i * 2.2, y + .55, 148 + k * .8); p.castShadow = true; g.add(p); } } });
    for (const g of B.gates) B.syncGate(g);
  };

  /* ---------- sieges ---------- */
  B.startSiege = final => {
    if (B.siegeOn) return; const d = G.env.day, total = final ? 78 : Math.min(46, 8 + d * 3 + Math.round(G.S.mission * 1.5));
    B.siege = { total, spawned: 0, t: 2, final: !!final, k0: G.Z.kills }; B.siegeOn = true; G.S.siegeDay = d;
    G.UI.banner(final ? 'KARKIDAKAM' : `NIGHT ${d}`, final ? 'Everything the sea took is coming home' : 'They are coming for the house. Hold the gates.'); G.Audio.siren();
  };
  function siegeUpdate(dt) {
    const s = B.siege, h = G.env.hour; s.t -= dt;
    if (s.spawned < s.total && s.t <= 0 && G.Z.alive() < G.Q().zmax + 6) {
      s.t = s.final ? 6 : 9; const n = Math.min(s.total - s.spawned, s.final ? 7 : 4 + Math.round(Math.random() * 2)), a = Math.random() * TAU; let made = 0;
      for (let i = 0, t = 0; made < n && t < 60; t++) { const an = a + rnd(-.7, .7), r = rnd(38, 54), x = 230 + Math.cos(an) * r, z = 150 + Math.sin(an) * r; if (G.groundAt(x, z) < .4 || G.blocked(x, z, .7)) continue; const p = Math.random(), ty = s.final && p < .07 ? 'brute' : p < .12 ? 'bloater' : p < .34 ? 'runner' : (s.spawned % 13 === 12 && G.env.day > 2 ? 'brute' : 'walker'); G.Z.spawn(ty, x, z, { siege: true, rise: true, aggro: true }); made++; s.spawned++; }
    }
    let left = 0; for (const z of G.Z.list) if (z.siege && z.state !== 'dead') left++;
    if (s.spawned >= s.total && left > 0) { s.lt = (s.lt || 0) + dt; if (left <= 4) { s.ht = (s.ht || 0) - dt; if (s.ht <= 0) { s.ht = 2; for (const z of G.Z.list) if (z.siege && z.state !== 'dead') G.Z.hunt(z); } }
      if (s.lt > (left <= 4 ? 60 : 150)) { for (const z of G.Z.list) z.siege = false; left = 0; G.UI.msg('The last of them drift back into the dark', 'dim'); } }
    s.left = left + (s.total - s.spawned);
    if ((s.spawned >= s.total && left === 0) || (h > 5.4 && h < 12)) {
      B.siegeOn = false; for (const z of G.Z.list) if (z.siege) { z.siege = false; if (h > 5.4 && h < 12 && z.state !== 'dead') z.burn = 9; }
      const rw = 15 + s.total; G.S.scrap += rw; G.S.morale = Math.min(100, G.S.morale + 6); G.UI.banner('THE HOUSE STANDS', `Night survived · +${rw} scrap salvaged from the dead`); if (B.onSiegeEnd) B.onSiegeEnd(s); B.siege = null; G.save && G.save();
    }
  }
  B.daily = () => {
    const S = G.S, n = B.members.filter(m => m.alive).length; let eat = n + 1, msg = []; if (B.members.find(m => m.alive && m.sv.role === 'cook')) eat = Math.ceil(eat * .75);
    let got = S.up.garden * 2; for (const m of B.members) { if (!m.alive) continue; if (m.sv.role === 'forage') { got += m.id === 'rajan' ? 4 : 2; const sc = 6 + (Math.random() * 6 | 0); S.scrap += sc; msg.push(`${m.d.name} brought ${sc} scrap`); } if (m.id === 'muthassi') { S.meds++; msg.push('Muthassi made a first-aid kit'); } if (!m.down) m.hp = m.sv.hp = Math.min(100, m.hp + 30); }
    S.food += got - eat; if (S.food < 0) { S.food = 0; S.morale = Math.max(S.perk.morale ? 30 : 0, S.morale - 15); msg.push('NOT ENOUGH FOOD — morale falling'); } else S.morale = Math.min(100, S.morale + 2);
    G.UI.banner(`DAY ${G.env.day}`, `Food ${got - eat >= 0 ? '+' : ''}${got - eat} (${S.food} left) · Morale ${S.morale}`); msg.forEach(t => G.UI.msg(t, 'dim')); if (G.Loot) G.Loot.refresh(); G.save && G.save();
  };
  B.rest = () => { const P = G.P; if (B.siegeOn || B.threat) { G.UI.msg('Not safe to rest', 'red'); return; } G.UI.fade(() => { G.env.hour = Math.min(G.env.hour + 4, G.env.hour < 20.2 && G.env.hour + 4 > 20.2 ? 20.2 : 99); if (G.env.hour >= 24) { G.env.hour -= 24; G.env.day++; B.daily(); } P.heal(G.S.perk.revive ? 100 : 60); P.stam = 100; G.UI.msg('You rest a few hours', 'dim'); }); };

  B.init = () => {
    const S = G.S; B.members.length = 0; B.gates.length = 0; B.siegeOn = false; B.siege = null;
    B.gates.push(mkGate('N', 230, 128, 0), mkGate('E', 252, 150, Math.PI / 2)); for (const g of B.gates) g.hp = S.gate[g.id];
    for (const id in S.fam) B.addMember(id, true); B.perks(); B.syncUp();
    G.addInter({ x: G.poi.house.x, z: G.poi.house.z + 1.6, r: 2.4, label: 'Rest (pass 4 hours, heal)', fn: B.rest, on: () => !B.siegeOn });
  };
  let tk = 0;
  B.update = dt => {
    const P = G.P, S = G.S, near = dist2(P.x, P.z, 230, 150) < 150 * 150, h = G.env.hour; tk -= dt;
    if (tk <= 0) { tk = .5; B.threat = false; for (const z of G.Z.list) if (z.state !== 'dead' && !(z.human && !z.T.hostile) && dist2(z.x, z.z, 230, 150) < 46 * 46) { B.threat = true; break; }
      if (S.up.spikes) for (const g of B.gates) for (const z of G.Z.list) if (z.state !== 'dead' && !B.inside(z.x, z.z) && dist2(z.x, z.z, g.x, g.z) < 9) { G.FX.blood(z.x, z.y + .5, z.z, 0, 1, 0, 2); G.Z.damage(z, Math.random() < .5 ? 'legL' : 'legR', 5 * S.up.spikes, 0, 0, 0, {}); }
      // dusk: siege begins (or is resolved off-screen if you are far away)
      if (!B.siegeOn && S.siegeDay !== G.env.day && h >= 20.5 && S.mission >= 2 && !S.flags.noSiege) { if (near) B.startSiege(S.flags.finalNight); else { S.siegeDay = G.env.day; const def = B.members.filter(m => m.alive && m.sv.role === 'guard').length * 12 + S.up.tower * 8 + S.up.spikes * 6 + S.up.lights * 5 + (B.gates[0].hp + B.gates[1].hp) / 40, thr = 10 + G.env.day * 4; if (def < thr) { for (const g of B.gates) { g.hp = Math.max(20, g.hp - (thr - def) * 6); B.syncGate(g); } G.UI.msg('Radio: "They hit the house while you were out. The gates are hurt."', 'red'); } else G.UI.msg('Radio: "Quiet night at home. Gates held."', 'dim'); } }
    }
    if (B.siegeOn) siegeUpdate(dt);
    for (const g of B.gates) { if (g.shake > 0) { g.shake -= dt; g.mesh.rotation.x = Math.sin(G.t * 60) * g.shake * .08; } const open = g.hp > 0 && dist2(P.x, P.z, g.x, g.z) < 9 && !B.threat; g.mesh.position.y += ((G.hAt(g.x, g.z) - (open ? 2.4 : 0)) - g.mesh.position.y) * Math.min(1, dt * 5); }
    for (const m of B.members) if (m.alive) memberUpdate(m, dt, near);
    // hearth + lamps
    const n = G.env.night, f = G.poi.fire; if (near && n > .2) { if (Math.random() < .6) G.FX.flame(f.x, f.y, f.z, .7); G.fireLight.position.set(f.x, f.y + .8, f.z); G.fireLight.intensity = (2.2 + Math.sin(G.t * 11) * .4 + Math.sin(G.t * 23) * .3) * n * (S.up.lights ? 1.6 : 1); G.fireLight.distance = S.up.lights ? 44 : 26; } else G.fireLight.intensity = 0;
    if (B.built.lights && B.built.lights.userData.mat) B.built.lights.userData.mat.emissiveIntensity = n * 4;
    P.safe = false;
  };
})();
