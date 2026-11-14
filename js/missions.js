'use strict';
/* THEERAM — missions, loot, pickups, radio jobs, boat travel, save/load */
(function () {
  const M = G.M = { target: null, text: '', timer: 0, cur: null, st: null }, L = G.Loot = { crates: [], picks: [] };
  const poi = k => typeof k === 'string' ? G.poi[k] : k;
  const horde = (n, at, r0, r1, o) => G.Z.horde(n, poi(at).x, poi(at).z, r0, r1, Object.assign({ tag: 'm' }, o || {}));

  /* ---------- story ---------- */
  const MS = M.LIST = [
    { id: 'home', title: 'VEETTILEKKU', sub: 'The Way Home', intro: ['You', 'The ferry never came back. Neither did the people who went looking. Home is past the palms — Thalap.'],
      steps: [
        { t: 'go', at: { x: 100, z: 100 }, r: 12, text: 'Leave Payyambalam beach by the road', enter: () => { G.Z.spawn('walker', 62, 96, { tag: 'm' }); G.Z.spawn('walker', 78, 112, { tag: 'm', rise: true }); } },
        { t: 'kill', n: 4, text: 'Put down the infected  (LMB fire · RMB aim · V machete · F finisher)', enter: () => horde(4, { x: 128, z: 100 }, 4, 14, { types: ['walker'] }) },
        { t: 'go', at: { x: 230, z: 122 }, r: 6, text: 'Follow the Thalap road east to the family home' }
      ], done: () => { G.S.scrap += 30; G.UI.say('Achan', 'Mone! Inside, quickly. Bar the gate. We thought the sea had taken you too.'); G.UI.say('Amma', 'Eat something. Then talk. Then never leave again.'); } },
    { id: 'med', title: 'MARUNNU', sub: 'Medicine', intro: ['Amma', 'Muthassi\'s heart tablets are finished. Thalap Medicals at the junction — the shutter was half down when we ran.'],
      steps: [
        { t: 'go', at: 'pharmacy', r: 11, text: 'Reach Thalap Medicals at the junction', enter: () => horde(6, 'pharmacy', 5, 22, { types: ['walker', 'walker', 'police'] }) },
        { t: 'use', at: 'pharmacy', hold: 1.6, label: 'Search the pharmacy shelves', text: 'Search the pharmacy', done: () => { G.S.meds += 2; G.UI.msg('Found heart tablets and bandages', 'green'); G.Audio.shutter(); G.noise(G.poi.pharmacy.x, G.poi.pharmacy.z, 60); horde(5, 'pharmacy', 22, 34, { types: ['runner', 'runner', 'walker'] }); G.UI.say('You', 'The shutter. Everything on this road heard that.'); } },
        { t: 'go', at: 'home', r: 9, text: 'Bring the medicine home' }
      ], done: () => { G.S.autoOk = true; G.S.meds += 1; bondAll(1); G.UI.say('Muthassi', 'You have your grandfather\'s stubborn legs. Sit, sit.'); G.UI.say('Achan', 'Take the auto keys. And listen — they come for the house after dark. Be behind these walls by half past eight.'); G.UI.msg('Autorickshaw unlocked · Night sieges begin', 'gold'); } },
    { id: 'light', title: 'VILAKKU', sub: 'The Light', intro: ['Meenu', 'Vishnu was on shift at the lighthouse when it started. If the lamp turns tonight, we\'ll know he\'s alive.'],
      steps: [
        { t: 'go', at: 'generator', r: 16, text: 'Go to the Kannur lighthouse, south along the beach road', enter: () => horde(8, 'generator', 4, 20) },
        { t: 'use', at: 'generator', hold: 2, label: 'Start the generator', text: 'Start the lighthouse generator', done: () => { G.Audio.generator(); G.noise(86, 272, 120); } },
        { t: 'defend', at: 'generator', time: 70, every: 8, n: 4, text: 'Hold the generator until the lamp turns' },
        { t: 'use', at: 'lightDoor', hold: .6, label: 'Call up to Vishnu', text: 'Call up the tower' }
      ], done: () => { G.S.lightOn = true; G.Base.addMember('vishnu'); G.Wp.give('revolver'); if (!G.S.slots[1]) G.S.slots[1] = 'revolver'; G.UI.say('Vishnu', 'Chetta?! I counted three hundred of them on the sand. Take this — the keeper\'s revolver.'); G.UI.msg('The lighthouse burns again · .38 Revolver acquired', 'gold'); } },
    { id: 'sea', title: 'KADAL', sub: 'The Sea', intro: ['Vishnu', 'A boat was still working out of Mappila Bay. Rajan chettan. If anyone can move us by water, he can.'],
      steps: [
        { t: 'go', at: { x: 124, z: 690 }, r: 16, text: 'Drive south to Mappila Bay harbour', enter: () => horde(10, { x: 124, z: 690 }, 5, 28, { types: ['walker', 'walker', 'runner', 'bloater'] }) },
        { t: 'multi', at: 'fuel', hold: 1.2, label: 'Take diesel can', text: 'Collect diesel cans' },
        { t: 'use', at: 'rajan', hold: 1, label: 'Hand the diesel to Rajan', text: 'Bring the diesel to the boat at the end of the jetty' },
        { t: 'defend', at: 'rajan', time: 50, every: 7, n: 4, types: ['drowned', 'drowned', 'walker'], text: 'Cover Rajan while he bleeds the engine' }
      ], done: () => { G.Base.addMember('rajan'); G.Wp.give('dbl'); if (!G.S.slots[2]) G.S.slots[2] = 'dbl'; G.Wp.addAmmo('s', 16); G.S.food += 6; G.UI.say('Rajan', 'She runs! Any jetty on this coast, I\'ll take you. And take my father\'s 12-bore — I can\'t steer and shoot.'); G.UI.msg('Boat travel unlocked · Double barrel acquired', 'gold'); } },
    { id: 'witness', title: 'SAAKSHI', sub: 'The Witness', intro: ['Rajan', 'Men with rifles pulled someone off the last train. Not police — grey uniforms, a wave stitched on the sleeve. He was shouting about fish. About cold rooms.'],
      steps: [
        { t: 'go', at: { x: 262, z: 420 }, r: 18, text: 'Go to Kannur railway station', enter: () => { horde(5, { x: 258, z: 430 }, 3, 16, { types: ['raider'] }); horde(5, { x: 258, z: 470 }, 6, 22, { types: ['walker', 'runner'] }); } },
        { t: 'clear', text: 'Deal with the raiders holding the station' },
        { t: 'use', at: { x: 255, z: 447 }, hold: 1.4, label: 'Open the guard\'s van', text: 'Free the man locked in the train' }
      ], done: () => { M.file('anil'); G.S.scrap += 40; G.UI.say('Anil', 'I ran the cold chain for Varuna Biomarine. Tide-7 came ashore on our own trawlers, packed in ice with the catch. They knew for nine days.'); G.UI.say('Anil', 'The proof flew in on a company charter. It never left the airport. Their security is burning everything that carries the wave.'); G.UI.say('You', 'Then we get there before the fire does.'); } },
    { id: 'fort', title: 'KOTTA', sub: 'The Fort', intro: ['Achan', 'The police moved their armoury into St. Angelo fort on the second day. Nobody came out. The rifles are still in there.'],
      steps: [
        { t: 'go', at: { x: 60, z: 560 }, r: 10, text: 'Reach the gate of St. Angelo Fort', enter: () => { horde(15, 'fort', 3, 30, { types: ['walker', 'police', 'police', 'runner'] }); G.Z.spawn('brute', 6, 562, { tag: 'm', aggro: false }); } },
        { t: 'clear', text: 'Clear the fort' },
        { t: 'use', at: 'armoury', hold: 2, label: 'Break open the armoury', text: 'Open the police armoury' }
      ], done: () => { G.S.fort = true; G.Wp.give('insas'); G.S.slots[1] = 'insas'; G.Wp.addAmmo('r', 120); G.Wp.addAmmo('h', 20); G.S.frag += 3; G.S.scrap += 60; bondAll(1); G.UI.msg('INSAS rifle acquired · AK-47 and .303 now craftable', 'gold'); G.UI.say('You', 'Five hundred years of walls. Still couldn\'t keep it out.'); } },
    { id: 'manifest', title: 'PATHRAM', sub: 'The Manifest', intro: ['Meenu', 'The airport is on the plateau past the paddy — take the road east off the highway. Anil says the charter with the blue tail is theirs.'],
      steps: [
        { t: 'go', at: 'airport', r: 22, text: 'Reach Kannur International Airport', enter: () => { horde(6, { x: 490, z: -300 }, 6, 34, { types: ['guard'] }); horde(7, { x: 500, z: -330 }, 8, 40, { types: ['walker', 'riot', 'runner'] }); } },
        { t: 'use', at: { x: 516, z: -246 }, hold: 2, label: 'Search the Varuna charter', text: 'Search the blue-tailed charter on the apron', done: () => M.file('manifest') },
        { t: 'use', at: { x: 505, z: -384.4 }, hold: 2, label: 'Pull the cold-chain ledger', text: 'Break into the Varuna hangar', done: () => { M.file('ledger'); horde(4, { x: 505, z: -360 }, 14, 30, { types: ['guard'] }); G.UI.msg('Varuna security is closing in', 'red'); } },
        { t: 'clear', text: 'Break the Varuna cordon' }
      ], done: () => { G.Wp.give('ak'); if (!G.S.slots[2] || G.S.slots[2] === 'dbl') G.S.slots[2] = 'ak'; G.Wp.addAmmo('r', 90); G.S.scrap += 70; G.UI.say('You', 'Forty crates. Destination: Mappila Bay cold store. They stored it next to the fish market.'); G.UI.msg('AK-47 taken from Varuna security', 'gold'); } },
    { id: 'bridge', title: 'PAALAM', sub: 'The Bridge', intro: ['Muthassi', 'My sister\'s grandchild Unni was at the Payyanur clinic with the doctor. Thirty-five kilometres. One bridge.'],
      steps: [
        { t: 'go', at: { x: 300, z: -518 }, r: 12, text: 'Drive north on NH 66 to Perumba bridge', enter: () => { for (let i = 0; i < 14; i++) G.Z.spawn(pick(['walker', 'walker', 'runner', 'bloater', 'police']), 300 + rnd(-5, 5), -535 - i * 5, { tag: 'm' }); } },
        { t: 'go', at: { x: 302, z: -622 }, r: 8, text: 'Fight across the bridge' },
        { t: 'go', at: 'clinic', r: 10, text: 'Find the clinic in Payyanur town', enter: () => horde(9, 'clinic', 5, 26) },
        { t: 'defend', at: 'clinic', time: 65, every: 8, n: 5, text: 'Hold the clinic door while Dr. Fathima gathers supplies' }
      ], done: () => { G.Base.addMember('fathima'); G.Base.addMember('unni'); G.S.meds += 4; G.UI.say('Dr. Fathima', 'You came across that bridge? On purpose? …Unni, shoes on. We\'re leaving.'); G.UI.msg('Dr. Fathima and Unni will make their way to the house', 'gold'); } },
    { id: 'hill', title: 'MALA', sub: 'The Hill', intro: ['Dr. Fathima', 'The naval station on Ezhimala was still answering on the emergency band. Cross the Kavvayi backwater and climb.'],
      steps: [
        { t: 'go', at: { x: 186, z: -780 }, r: 8, text: 'Take the footbridge over the Kavvayi backwater' },
        { t: 'go', at: 'transmitter', r: 14, text: 'Climb Ezhimala to the signal station', enter: () => { horde(10, 'hilltop', 6, 30); G.Z.spawn('brute', -84, -888, { tag: 'm' }); } },
        { t: 'use', at: 'transmitter', hold: 3, label: 'Power the transmitter', text: 'Start the transmitter' },
        { t: 'defend', at: 'transmitter', time: 100, every: 8, n: 5, brute: 45, text: 'Keep the signal alive' }
      ], done: () => { G.S.flags.evacReady = true; G.S.scrap += 80; G.UI.say('Radio', '…INS Zamorin to Ezhimala station. We read you. One boat, Payyambalam beach, first light after tomorrow. We will not wait.'); G.UI.say('You', 'One more night.'); } },
    { id: 'coldstore', title: 'ARA', sub: 'The Cold Room', intro: ['Anil', 'What is left of Tide-7 is in the ice plant at Mappila Bay — and so is Specimen 0, the first man it took. If that room thaws, the whole coast goes. Burn it.'],
      steps: [
        { t: 'go', at: { x: 156, z: 724 }, r: 16, text: 'Reach the Varuna cold store at Mappila Bay', enter: () => { horde(5, { x: 156, z: 716 }, 8, 26, { types: ['guard'] }); horde(8, { x: 140, z: 700 }, 8, 34, { types: ['drowned', 'walker', 'spitter', 'bloater'] }); } },
        { t: 'multi', at: 'cold', hold: 1.5, label: 'Set charge', text: 'Set charges on the cold store' },
        { t: 'wait', cond: () => G.boss && G.boss.state === 'dead', text: 'Kill SPECIMEN 0', enter: () => { G.boss = G.Z.spawn('brute', 150, 700, { hpMul: 3.2, big: 1.28, tag: 'm', aggro: true }); G.boss.bossName = 'SPECIMEN 0'; G.UI.banner('SPECIMEN 0', 'The cold room door comes off its hinges'); G.Audio.boom(10); G.FX.explode(156, G.hAt(156, 710) + 1, 710, false); } },
        { t: 'go', at: { x: 236, z: 690 }, r: 12, text: 'Get clear of the blast' }
      ], done: () => { for (let i = 0; i < 5; i++) G.FX.explode(150 + i * 3, G.hAt(156, 716) + 2 + i, 712 + i * 2, true); G.FX.fire(156, 716, 7, 60); G.Audio.boom(40); G.P.shake = 1; M.file('zero'); G.S.scrap += 120; G.boss = null; G.UI.say('You', 'That\'s the last of it. Now we just have to live through tonight.'); } },
    { id: 'last', title: 'KARKIDAKAM', sub: 'The Last Night', intro: ['Achan', 'The transmitter woke the whole coast. Tonight they all come. We hold till dawn, then we walk to the sea together.'],
      steps: [
        { t: 'go', at: 'home', r: 10, text: 'Return home and prepare' },
        { t: 'wait', cond: () => G.Base.siegeOn, text: 'Repair the gates, stock ammunition. They come at 20:30  (rest at the door to pass time)', enter: () => { G.S.flags.finalNight = true; } },
        { t: 'wait', cond: () => !G.Base.siegeOn, text: 'Survive until dawn' },
        { t: 'go', at: 'start', r: 16, text: 'Meet the Navy launch at Payyambalam beach', enter: () => { G.S.flags.finalNight = false; } }
      ], done: () => { G.UI.say('Navy officer', 'Orders are orders. Nobody leaves this coast while it is hot. The quarantine stands until the infection is gone.'); G.UI.say('Anil', 'Then we make it gone. Specimen 0 carried the antibody. Varuna cooked a counter-agent from it and sat on it — it is in their campus by the airport, next to the plane that sprays it.'); } },
    { id: 'cure', title: 'MARUNNU MAZHA', sub: 'Medicine Rain', intro: ['Dr. Fathima', 'An aerosol. One pass over the district at dawn and the fever breaks in everything that breathes it. Burn their campus behind you so nobody can ever do this again.'],
      steps: [
        { t: 'go', at: 'varuna', r: 14, text: 'Reach the Varuna Biomarine campus beside the airport', enter: () => { horde(8, { x: 495, z: -86 }, 6, 36, { types: ['guard'] }); horde(8, { x: 505, z: -90 }, 8, 40, { types: ['riot', 'walker', 'spitter', 'runner'] }); } },
        { t: 'clear', text: 'Fight through the campus' },
        { t: 'multi', at: 'vTanks', hold: 1.6, label: 'Set charge', text: 'Set charges on the three reactor tanks' },
        { t: 'use', at: 'vLab', hold: 2.5, label: 'Take the counter-agent canisters', text: 'Take the counter-agent from the lab', done: () => { M.file('cure'); horde(5, { x: 478, z: -84 }, 12, 30, { types: ['guard'] }); } },
        { t: 'go', at: { x: 505, z: -372 }, r: 9, text: 'Carry the canisters to the spray plane at the airport hangar', enter: () => horde(8, { x: 505, z: -350 }, 10, 40) },
        { t: 'defend', at: { x: 505, z: -372 }, time: 70, every: 7, n: 5, brute: 30, text: 'Hold the apron while Anil primes the spray tanks' },
        { t: 'wait', cond: () => G.Plus.cure.done, text: 'Watch the sky', enter: () => G.Plus.launchCure() }
      ], done: () => { G.S.flags.won = true; G.S.flags.cured = true; G.S.flags.noSiege = true; G.S.noSpawn = false; G.UI.ending(); } }
  ];
  const FILES = M.FILES = {
    note1: ['Fisherman\'s note', 'Third day the nets came up wrong. Mathi with white eyes. Kunhiraman cut his hand on one and by evening he would not answer to his name. The ice company man paid double and told us to say nothing.'],
    keeper: ['Lighthouse log', 'Day 2. Counted three hundred on the sand below, all walking out of the surf, none of them drowning. A grey launch stood off the point and watched for an hour. It did not help anyone.'],
    police: ['Constable\'s report', 'Orders from above: hand the fort armoury keys to "Varuna Asset Protection" and stand down. The Circle Inspector refused. We heard the shots from the barracks.'],
    anil: ['Anil\'s statement', 'Tide-7 is a marine pathogen Varuna Biomarine was culturing offshore for an aquaculture vaccine. It crossed to people through the catch. Head office chose containment of the story over containment of the disease.'],
    manifest: ['Charter manifest VB-0417', '40 × insulated crate, "biological reference material, Tide-7". Consignee: Varuna Biomarine cold store, Mappila Bay. Handling note: DO NOT THAW. Signed nine days before the first case.'],
    ledger: ['Cold-chain ledger', 'Crate 1 breached in transit. One handler exposed (ref. SPECIMEN 0), retained on site for observation. Recommendation from site: destroy stock. Reply from head office: retain stock, it is the only asset this quarter.'],
    cure: ['Counter-agent VB-CA-2', 'Derived from SPECIMEN 0 serum on day six. Aerosol efficacy: full remission inside ninety seconds. Note from head office: do not deploy. A cured coast has no further need of us.'],
    zero: ['Specimen 0', 'He was a loader named Sudhakaran. They kept him in the ice room for nine days and wrote down everything except his name.']
  };
  M.file = id => { const S = G.S; if (S.files.includes(id)) return; S.files.push(id); G.UI.banner('FILE FOUND', FILES[id][0]); G.UI.msg('File added — read it in the household panel (Tab)', 'cyan'); G.Audio.objective(); };
  function bondAll(n) { for (const m of G.Base.members) if (m.alive) m.sv.bond = Math.min(5, m.sv.bond + n); G.Base.perks(); }
  const inters = [];
  function clearInters() { for (const i of inters) { const k = G.Inter.indexOf(i); if (k >= 0) G.Inter.splice(k, 1); } inters.length = 0; }
  function enterStep() {
    const S = G.S, m = MS[S.mission]; clearInters(); M.cur = m; M.st = null; M.target = null; M.text = ''; if (!m) { M.text = S.flags.won ? 'Free roam — the coast is yours' : ''; return; }
    const s = M.st = m.steps[S.step]; S.mv = { k0: G.Z.kills, t: s.time || 0, wave: 2, got: [] }; M.text = s.text;
    if (s.at && s.t !== 'multi') M.target = poi(s.at);
    if (s.t === 'use') inters.push(G.addInter({ x: M.target.x, z: M.target.z, r: 2.8, hold: s.hold, label: s.label, fn: () => { if (s.done) s.done(); advance(); } }));
    if (s.t === 'multi') G.poi[s.at].forEach((p, i) => inters.push(G.addInter({ x: p.x, z: p.z, r: 2.6, hold: s.hold, label: s.label, on: () => !S.mv.got.includes(i), fn: () => { S.mv.got.push(i); G.Audio.click(.5); G.UI.msg(`${s.label}: ${S.mv.got.length}/${G.poi[s.at].length}`, 'gold'); if (S.mv.got.length >= G.poi[s.at].length) advance(); } })));
    if (s.enter) s.enter();
  }
  function advance() {
    const S = G.S, m = MS[S.mission]; S.step++; G.Audio.objective();
    if (S.step >= m.steps.length) { for (const z of G.Z.list) if (z.tag === 'm') z.tag = null; S.mission++; S.step = 0; G.UI.banner('MISSION COMPLETE', `${m.title} — ${m.sub}`); if (m.done) m.done(); G.save(); M.startT = 7; M.cur = null; M.st = null; M.target = null; M.text = ''; clearInters(); }
    else enterStep();
  }
  M.start = () => { const m = MS[G.S.mission]; if (!m) { enterStep(); return; } if (G.S.step === 0) { G.UI.banner(m.title, m.sub); if (m.intro) G.UI.say(m.intro[0], m.intro[1]); } enterStep(); };
  M.skip = () => { if (M.st) { if (M.st.done) M.st.done(); advance(); } };
  M.update = dt => {
    const S = G.S, P = G.P, s = M.st; if (M.startT > 0) { M.startT -= dt; if (M.startT <= 0) M.start(); }
    if (ST.streak > 0 && (ST.t -= dt) <= 0) { if (ST.streak >= 5) { const b = ST.streak * 2; S.scrap += b; G.UI.msg('Kill streak ×' + ST.streak + ' — +' + b + ' scrap', 'gold'); } ST.streak = 0; }
    if (S.job) jobUpdate(dt);
    if (!s) return; const v = S.mv;
    if (s.t === 'go') { if (dist2(P.x, P.z, M.target.x, M.target.z) < s.r * s.r) advance(); }
    else if (s.t === 'kill') { const n = G.Z.kills - v.k0; M.text = `${s.text}  ${Math.min(n, s.n)}/${s.n}`; if (n >= s.n) advance(); }
    else if (s.t === 'clear') { const n = G.Z.alive('m'); M.text = `${s.text} — ${n} left`; M.target = null; if (n > 0) { let b = null, bd = 1e9; for (const z of G.Z.list) if (z.tag === 'm' && z.state !== 'dead') { const d = dist2(z.x, z.z, P.x, P.z); if (d < bd) { bd = d; b = z; } } if (b) M.target = { x: b.x, z: b.z }; } else advance(); }
    else if (s.t === 'wait') { if (s.cond()) advance(); }
    else if (s.t === 'defend') {
      const d = Math.hypot(P.x - M.target.x, P.z - M.target.z); if (d < 30) v.t -= dt; M.text = `${s.text} — ${Math.max(0, Math.ceil(v.t))}s${d >= 30 ? '  (GET BACK!)' : ''}`;
      v.wave -= dt; if (v.wave <= 0 && G.Z.alive() < G.Q().zmax + 4) { v.wave = s.every; G.Z.horde(s.n, M.target.x, M.target.z, 24, 38, { tag: 'm', types: s.types, inv: M.target }); if (s.brute && v.t < s.brute && !v.br) { v.br = 1; G.Z.horde(1, M.target.x, M.target.z, 28, 36, { tag: 'm', types: ['brute'] }); G.UI.msg('Something big is coming up the hill', 'red'); } }
      if (v.t <= 0) advance();
    }
  };

  /* ---------- radio side jobs ---------- */
  const JOBS = [{ k: 'nest', txt: l => `Radio job: clear the infected nest at ${l.name}` }, { k: 'sos', txt: l => `Radio job: survivors signalling from ${l.name} — hold the spot` }];
  M.radio = () => {
    const S = G.S; if (S.job) { G.UI.say('Radio', `Still open: ${S.job.text}`); return; }
    const locs = G.locs.filter(l => l.id !== 'home' && Math.hypot(l.x - G.P.x, l.z - G.P.z) > 120), l = pick(locs), j = pick(JOBS);
    S.job = { k: j.k, x: l.x, z: l.z, name: l.name, text: j.txt(l), st: 0, t: 45, k0: 0 }; G.UI.say('Radio', S.job.text + '.'); G.UI.msg('Side job added — marked blue on map', 'cyan');
  };
  function jobUpdate(dt) {
    const j = G.S.job, P = G.P, d = Math.hypot(P.x - j.x, P.z - j.z);
    if (j.st === 0 && d < 45) { j.st = 1; j.k0 = G.Z.kills; j.n = j.k === 'nest' ? 12 : 0; G.Z.horde(j.k === 'nest' ? 12 : 6, j.x, j.z, 4, 26, { tag: 'j', types: j.k === 'nest' ? ['walker', 'walker', 'runner', 'bloater'] : null }); G.UI.msg(j.k === 'nest' ? 'Nest found — kill them all' : 'Hold this position for 45s', 'cyan'); j.w = 6; }
    if (j.st === 1) {
      let ok = false; if (j.k === 'nest') ok = G.Z.alive('j') === 0; else { if (d < 30) j.t -= dt; j.w -= dt; if (j.w <= 0) { j.w = 9; G.Z.horde(4, j.x, j.z, 24, 36, { tag: 'j', inv: j }); } ok = j.t <= 0; }
      if (ok) { const sc = 45 + (Math.random() * 30 | 0); G.S.scrap += sc; G.S.food += 3; G.S.morale = Math.min(100, G.S.morale + 5); G.Wp.addAmmo('p', 24); for (const z of G.Z.list) if (z.tag === 'j') z.tag = null; G.S.job = null; G.UI.banner('JOB DONE', `+${sc} scrap · +3 food · morale up`); G.Audio.objective(); }
    }
  }

  /* ---------- boat travel ---------- */
  const JET = [{ n: 'Payyambalam Beach', x: G.coast ? 0 : 0, z: 0 }];
  M.jetties = () => [{ n: 'Payyambalam Beach', x: G.coast(120) + 10, z: 120 }, { n: 'Mappila Bay Harbour', x: 60, z: 700 }, { n: 'Kavvayi Jetty, Payyanur', x: 172, z: -720 }, { n: 'Ezhimala Sandbar', x: G.coast(-800) + 30, z: -800 }];
  M.sail = i => { const j = M.jetties()[i], S = G.S; if (S.fuel < 0) return; G.UI.fade(() => { G.P.teleport(j.x, j.z); G.env.hour += .7; G.UI.msg(`Rajan lands you at ${j.n}`, 'cyan'); }); };

  /* ---------- loot ---------- */
  const TAB = {
    house: S => [['scrap', 4, 10, 1], ['food', 1, 2, .55], ['p', 6, 14, .4], ['meds', 1, 1, .1], ['s', 2, 5, .15]],
    shop: S => [['food', 1, 3, .8], ['scrap', 3, 8, .8], ['p', 5, 10, .25], ['molotov', 1, 1, .14], ['meds', 1, 1, .08]],
    bakery: S => [['food', 2, 4, 1], ['scrap', 2, 5, .5], ['molotov', 1, 1, .1]],
    plane: S => [['meds', 1, 2, .6], ['food', 1, 3, .8]],
    med: S => [['meds', 1, 2, 1], ['food', 1, 2, .4], ['scrap', 2, 6, .5]],
    police: S => [['p', 12, 26, .9], ['s', 4, 8, .6], ['r', 14, 30, S.fort ? .85 : .35], ['h', 3, 6, S.fort ? .4 : .1], ['frag', 1, 1, .3], ['scrap', 5, 12, .7]]
  };
  const NAMES = { scrap: 'scrap', food: 'food', meds: 'first-aid', p: '9mm/.38', s: 'shells', r: 'rifle rounds', h: '.303', b: 'bolts', f: 'sprayer fuel', bottle: 'bottle', mine: 'tripmine', frag: 'grenade', molotov: 'petrol bomb', fuel: 'diesel' };
  L.give = (k, n, quiet) => { const S = G.S; if ('psrhbf'.includes(k) && k.length === 1) G.Wp.addAmmo(k, n); else S[k] = (S[k] || 0) + n; if (!quiet) G.UI.loot(`+${n} ${NAMES[k]}`); };
  L.init = () => {
    const pts = G.lootPts, g = new THREE.BoxGeometry(.7, .5, .5), mat = new THREE.MeshStandardMaterial({ roughness: .8 }), im = L.mesh = new THREE.InstancedMesh(g, mat, pts.length), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), s = new THREE.Vector3(1, 1, 1), up = new THREE.Vector3(0, 1, 0), c = new THREE.Color();
    const CL = { house: 0x7a5a3a, shop: 0x4a6a8a, med: 0xd8d8d8, police: 0x3a4a2a, bakery: 0xd8a0a0 };
    pts.forEach((p, i) => { p.y = G.groundAt(p.x, p.z); q.setFromAxisAngle(up, i * 1.3); m4.compose(v.set(p.x, p.y + .25, p.z), q, s); im.setMatrixAt(i, m4); im.setColorAt(i, c.set(CL[p.kind]).convertSRGBToLinear()); p.i = i;
      G.addInter({ x: p.x, z: p.z, r: 2, hold: .55, label: 'Search ' + (p.kind === 'med' ? 'medical supplies' : p.kind === 'police' ? 'ammo crate' : p.kind === 'bakery' ? 'bakery shelves' : p.kind === 'shop' ? 'shop stock' : 'household stores'), on: () => G.S.looted[i] === undefined, fn: () => L.open(p) }); });
    im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false; G.scene.add(im); L.refresh();
    const pm = new THREE.MeshStandardMaterial({ color: 0x222222, emissive: new THREE.Color(1, .75, .2), emissiveIntensity: 1.2 }), pg = new THREE.BoxGeometry(.22, .14, .16);
    for (let i = 0; i < 24; i++) { const m = new THREE.Mesh(pg, pm); m.visible = false; m.userData = { life: 0 }; G.scene.add(m); L.picks.push(m); }
  };
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), v4 = new THREE.Vector3(), s4 = new THREE.Vector3(), up4 = new THREE.Vector3(0, 1, 0);
  L.refresh = () => { const S = G.S, d = G.env.day; G.lootPts.forEach((p, i) => { if (S.looted[i] !== undefined && d - S.looted[i] >= 3) delete S.looted[i]; const k = S.looted[i] === undefined ? 1 : .001; q4.setFromAxisAngle(up4, i * 1.3); m4.compose(v4.set(p.x, p.y + .25, p.z), q4, s4.set(k, k, k)); L.mesh.setMatrixAt(i, m4); }); L.mesh.instanceMatrix.needsUpdate = true; };
  L.open = p => { const S = G.S; S.looted[p.i] = G.env.day; let any = false; for (const [k, a, b, pr] of TAB[p.kind](S)) if (Math.random() < pr) { L.give(k, a + Math.floor(Math.random() * (b - a + 1))); any = true; } if (!any) L.give('scrap', 3); G.Audio.pickup(); m4.makeScale(.001, .001, .001); L.mesh.setMatrixAt(p.i, m4); L.mesh.instanceMatrix.needsUpdate = true; };
  let pi = 0;
  L.drop = z => {
    const r = Math.random(), S = G.S; let k = null, n = 0;
    if (z.type === 'brute') { k = 'scrap'; n = 30; L.give('frag', 1); } else if (z.type === 'civilian') return; else if ((z.type === 'police' || z.type === 'riot' || z.type === 'raider' || z.type === 'guard') && r < .7) { k = pick(['p', 'p', S.fort ? 'r' : 'p', 's']); n = k === 'p' ? 10 : k === 'r' ? 12 : 4; }
    else if (r < .2) { const own = []; for (const id of S.slots) if (id) own.push(G.Wp.DEFS[id].ammo); k = pick(own.length ? own : ['p']); n = { p: 7, s: 3, r: 9, h: 2 }[k]; } else if (r < .32) { k = 'scrap'; n = 3 + (Math.random() * 5 | 0); } else if (r < .345) { k = 'meds'; n = 1; }
    if (!k) return; const m = L.picks[pi]; pi = (pi + 1) % L.picks.length; m.position.set(z.x, G.groundAt(z.x, z.z) + .3, z.z); m.visible = true; m.userData = { life: 70, k, n };
  };
  L.update = dt => { const P = G.P; for (const m of L.picks) { if (!m.visible) continue; m.rotation.y += dt * 2; m.userData.life -= dt; if (m.userData.life <= 0) { m.visible = false; continue; } if (dist2(m.position.x, m.position.z, P.x, P.z) < 2.6 && Math.abs(m.position.y - P.y) < 2.5) { m.visible = false; L.give(m.userData.k, m.userData.n); G.Audio.pickup(); } } };
  const ST = G.Style = { streak: 0, t: 0, last: -9, multi: 0 }, BON = { 'SILENT KILL': 12, ROUNDHOUSE: 8, EXECUTION: 10, 'CURB STOMP': 7, ROADKILL: 4, DECAPITATED: 8, 'CUT DOWN': 3, HEADSHOT: 5, 'HEAD POPPED': 7, BURNED: 3, 'BLOWN APART': 5 };
  G.onKill = (z, o) => {
    const S = G.S; S.stats.kills++; if (z.miss.head) S.stats.heads++; ST.streak++; ST.t = 6; ST.multi = G.t - ST.last < 1.3 ? ST.multi + 1 : 1; ST.last = G.t; if (o.npc) return;
    const h = o.how, tag = h === 'kick' ? 'ROUNDHOUSE' : h === 'silent' ? 'SILENT KILL' : h === 'execute' ? 'EXECUTION' : h === 'stomp' ? 'CURB STOMP' : h === 'road' ? 'ROADKILL' : h === 'blast' ? 'BLOWN APART' : h === 'melee' ? (z.miss.head ? 'DECAPITATED' : 'CUT DOWN') : z.miss.head ? 'HEAD POPPED' : z.lastPart === 'head' ? 'HEADSHOT' : z.burn > 0 ? 'BURNED' : null;
    if (tag) { S.scrap += BON[tag]; G.UI.style(tag, BON[tag]); }
    if (z.human) { if (z.type === 'civilian') { S.morale = Math.max(0, S.morale - 6); G.UI.msg('You killed a survivor. Morale −6', 'red'); } else { const b = z.type === 'guard' ? 12 : 8; S.scrap += b; G.UI.style(z.type === 'guard' ? 'VARUNA GUARD DOWN' : 'RAIDER DOWN', b); } return; }
    if (ST.multi === 2) G.UI.style('DOUBLE KILL', 0); else if (ST.multi === 3) { G.UI.style('TRIPLE KILL', 0); G.slowmo(.45, .35); } else if (ST.multi === 5) { G.UI.style('MASSACRE', 0); G.slowmo(.6, .3); }
    if (h === 'execute' || (tag === 'HEAD POPPED' && Math.random() < .25) || z.type === 'brute') G.slowmo(z.type === 'brute' ? .9 : .35, .3);
  };

  /* ---------- save / load ---------- */
  G.save = () => { const S = G.S, P = G.P; if (!P.alive) return; S.hour = G.env.hour; S.day = G.env.day; S.pos = [P.x, P.z, P.yaw]; S.hp = P.hp; S.vehs = G.Vehs.map(v => [+v.x.toFixed(1), +v.z.toFixed(1), +v.yaw.toFixed(2)]); S.clip = G.Wp.st.clip; S.wx = [G.env.cloud, G.env.rain]; S.kills = G.Z.kills; try { localStorage.setItem('theeram.save', JSON.stringify(S)); G.UI && G.UI.saved && G.UI.saved(); } catch (e) { } };
  G.hasSave = () => !!localStorage.getItem('theeram.save');
  G.load = () => { try { const S = JSON.parse(localStorage.getItem('theeram.save')); return S && S.v === 3 ? Object.assign(G.newState(), S) : null; } catch (e) { return null; } };
  M.init = () => {
    const S = G.S;
    G.addInter({ x: G.poi.bench.x, z: G.poi.bench.z, r: 2.6, label: 'Workbench — weapons & loadout', fn: () => G.UI.bench() });
    G.addInter({ x: G.poi.radio.x, z: G.poi.radio.z, r: 2.4, label: 'Radio — listen for jobs', fn: M.radio, on: () => G.S.mission >= 2 });
    M.jetties().forEach((j, i) => G.addInter({ x: j.x, z: j.z, r: 7, label: 'Call Rajan\'s boat', on: () => G.S.boat, fn: () => G.UI.boat(i) }));
    G.poi.cold = [{ x: 150, z: 722.4 }, { x: 164.4, z: 716 }, { x: 156, z: 709.6 }];
    for (const [id, x, z] of [['note1', 126, 686], ['keeper', 77.5, 262.5], ['police', 26, 541]]) G.addInter({ x, z, r: 2.4, label: 'Read the note', on: () => !G.S.files.includes(id), fn: () => M.file(id) });
    L.init(); M.startT = .1;
  };
})();
