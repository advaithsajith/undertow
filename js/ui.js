'use strict';
/* THEERAM — ui: HUD, minimap, compass, subtitles, family panel, workbench, map, menus */
(function () {
  const UI = G.UI = { open: null }, $ = id => document.getElementById(id), E = {};
  let subsQ = [], subT = 0, bannerT = 0, dmgA = 0, tick = 0, benchSel = 'pistol', mctx, cctx, fadeFn = null;
  const show = (el, on) => el.classList.toggle('hidden', !on);
  UI.msg = (t, cls) => { const d = document.createElement('div'); d.className = 'm ' + (cls || ''); d.textContent = t; E.feed.prepend(d); while (E.feed.children.length > 6) E.feed.lastChild.remove(); setTimeout(() => d.style.opacity = 0, 5200); setTimeout(() => d.remove(), 6100); };
  UI.loot = t => { const d = document.createElement('div'); d.textContent = t; E.lootf.appendChild(d); while (E.lootf.children.length > 5) E.lootf.firstChild.remove(); setTimeout(() => d.style.opacity = 0, 1700); setTimeout(() => d.remove(), 2400); };
  UI.banner = (h, p) => { E.banner.querySelector('h1').textContent = h; E.banner.querySelector('p').textContent = p || ''; E.banner.style.opacity = 1; bannerT = 4; };
  UI.say = (who, text) => { subsQ.push([who, text]); };
  UI.hurt = (dmg) => { dmgA = Math.min(1, dmgA + .25 + dmg / 60); };
  UI.splat = a => { if (!G.set.gore) return; for (let i = 0; i < 3 + a * 5; i++) { const s = document.createElement('i'), w = 40 + Math.random() * 160 * a; s.style.cssText = `left:${Math.random() * 100}%;top:${Math.random() * 100}%;width:${w}px;height:${w * (.7 + Math.random() * .6)}px;opacity:${.5 + Math.random() * .4};transition:opacity 2.5s`; E.splats.appendChild(s); setTimeout(() => s.style.opacity = 0, 900); setTimeout(() => s.remove(), 3500); } };
  UI.killFeed = () => { };
  UI.style = (tag, bonus) => { const d = document.createElement('div'); d.innerHTML = tag + (bonus ? ' <small>+' + bonus + '</small>' : ''); E.stylef.prepend(d); while (E.stylef.children.length > 4) E.stylef.lastChild.remove(); requestAnimationFrame(() => d.classList.add('in')); setTimeout(() => d.style.opacity = 0, 1900); setTimeout(() => d.remove(), 2500); };
  UI.saved = () => { E.saved.style.opacity = 1; setTimeout(() => E.saved.style.opacity = 0, 1500); };
  UI.fade = fn => { E.fade.style.opacity = 1; fadeFn = fn; setTimeout(() => { if (fadeFn) { fadeFn(); fadeFn = null; } E.fade.style.opacity = 0; }, 600); };
  function modal(id) { if (UI.open) show($(UI.open), false); UI.open = id; if (id) { show($(id), true); G.paused = true; G.unlock(); } else { G.paused = false; if (G.started) G.lock(); } }
  UI.close = () => modal(null);
  UI.pause = on => { if (!G.started || (on && UI.open)) return; if (on) { renderPause(); modal('pause'); } else modal(null); };

  /* ---------- family panel ---------- */
  function renderPanel() {
    const S = G.S, B = G.Base; let h = `<h2>THE HOUSEHOLD</h2><div class="sub">Thalap · Day ${G.env.day} · ${B.siegeOn ? 'UNDER SIEGE' : 'They come for the house every night at 20:30'}</div>
    <div class="rs"><div><span>SCRAP</span>${S.scrap}</div><div><span>FOOD</span>${S.food}</div><div><span>FIRST-AID</span>${S.meds}</div><div><span>MORALE</span>${S.morale}</div><div><span>N GATE</span>${Math.round(B.gates[0].hp)}/${B.gateMax()}</div><div><span>E GATE</span>${Math.round(B.gates[1].hp)}/${B.gateMax()}</div></div><h3>FAMILY</h3><div class="fam">`;
    for (const m of B.members) { if (!m.alive) continue; const roles = B.roles(m.id); h += `<div class="mem"><b>${m.d.name}</b><i>${m.d.full}</i><div class="hb"><div style="width:${clamp(m.hp, 0, 100)}%"></div></div><div>${'♥'.repeat(m.sv.bond)}<span style="opacity:.25">${'♥'.repeat(5 - m.sv.bond)}</span> ${m.down ? '<b style="color:var(--red)"> DOWN — revive!</b>' : m.away ? '<i>out foraging</i>' : ''}</div><div>${roles.map(r => `<button class="${m.sv.role === r ? 'on' : ''}" data-role="${m.id}:${r}">${r}</button>`).join('')}${m.id !== 'unni' && m.id !== 'muthassi' ? `<button class="${m.sv.crew ? 'on' : ''}" data-crew="${m.id}">${m.sv.crew ? '★ in your crew' : 'take along'}</button>` : ''}</div><div class="pk ${m.sv.bond >= 3 ? 'act' : ''}">${m.sv.bond >= 3 ? '★ ' : '♥3 unlocks: '}${m.d.perkTxt}</div></div>`; }
    h += `</div>${S.dead.length ? `<div class="sub" style="margin-top:8px">Lost: ${S.dead.map(d => B.FAM[d].name).join(', ')}</div>` : ''}<h3>FORTIFY</h3>`;
    for (const k in B.UP) { const u = B.UP[k], lv = S.up[k], c = u.cost * (lv + 1); h += `<div class="up"><div>${u.name} <b style="color:var(--gold)">${lv}/${u.max}</b><small>${u.txt}</small></div>${lv >= u.max ? '<span class="sub">built</span>' : `<button data-up="${k}" ${S.scrap < c ? 'disabled' : ''}>${c} scrap</button>`}</div>`; }
    if (S.files.length) { h += `<h3>FILES — VARUNA BIOMARINE</h3><div>${S.files.map(f => `<button data-file="${f}">${G.M.FILES[f][0]}</button> `).join('')}</div><div id="fileT" class="sub" style="margin-top:8px;font-size:14px;line-height:1.5;color:var(--ink)"></div>`; }
    h += `<div class="sub" style="margin-top:12px">Guards shoot from the gates · a cook stretches food · foragers bring scrap and food by day · talk to everyone daily to build bonds.</div><div style="margin-top:10px"><button data-close>Close <kbd>Tab</kbd></button></div>`;
    E.panelC.innerHTML = h;
  }
  /* ---------- workbench ---------- */
  function renderBench() {
    const S = G.S, W = G.Wp, D = W.DEFS; let h = `<h2>WORKBENCH</h2><div class="rs"><div><span>SCRAP</span>${S.scrap}</div><div><span>9MM/.38</span>${S.ammo.p}</div><div><span>SHELLS</span>${S.ammo.s}</div><div><span>RIFLE</span>${S.ammo.r}</div><div><span>.303</span>${S.ammo.h}</div><div><span>GRENADES</span>${S.frag}</div><div><span>PETROL BOMBS</span>${S.molotov}</div></div><div class="bw"><div class="gl"><h3>FIREARMS</h3>`;
    for (const id in D) { const d = D[id], own = S.guns[id], lock = d.lock && !S[d.lock], sl = S.slots.indexOf(id); h += `<button class="${benchSel === id ? 'on' : ''}" data-gun="${id}">${d.name}<small>${own ? (sl >= 0 ? 'slot ' + (sl + 1) : 'owned') : lock ? 'locked' : d.cost + ' scrap'}</small></button>`; }
    h += `<h3>MELEE</h3>`; for (const id in W.MELEE) { const m = W.MELEE[id], own = S.meleeOwned.includes(id); h += `<button class="${S.melee === id ? 'on' : ''}" data-melee="${id}">${m.name}<small>${own ? (S.melee === id ? 'equipped' : 'owned') : m.cost + ' scrap'}</small></button>`; }
    h += `<h3>CRAFT</h3>`; for (const [k, n, c, nm] of CRAFT) h += `<button data-craft="${k}" ${S.scrap < c ? 'disabled' : ''}>${nm} ×${n}<small>${c} scrap</small></button>`;
    const d = D[benchSel], c = S.guns[benchSel]; h += `</div><div><h3>${d.name.toUpperCase()}</h3><div class="sub">${d.desc}</div>`;
    const st = (n, v, t) => `<div class="stat">${n}<div><div style="width:${clamp(v, 0, 1) * 100}%"></div></div>${t}</div>`;
    h += st('DAMAGE', d.dmg * (d.pellets || 1) / 180, d.pellets ? d.dmg + '×' + d.pellets : d.dmg) + st('FIRE RATE', d.rpm / 650, d.rpm) + st('ACCURACY', 1 - d.ads / 4.5, '') + st('CONTROL', 1 - d.rec[0] / 6.5, '') + st('MAGAZINE', d.mag / 34, c ? W.magSize(benchSel) : d.mag) + st('NOISE', d.noise / 70, '');
    if (!c) { const lock = d.lock && !S[d.lock]; h += `<div style="margin-top:14px">${lock ? '<span class="sub">Locked — recover the police armoury at St. Angelo Fort.</span>' : `<button class="pri" data-buy="${benchSel}" ${S.scrap < d.cost ? 'disabled' : ''}>Build for ${d.cost} scrap</button>`}</div>`; }
    else {
      h += `<h3>LOADOUT SLOT</h3><div>${[0, 1, 2].map(i => `<button class="${S.slots[i] === benchSel ? 'on' : ''}" data-slot="${i}">Slot ${i + 1}${S.slots[i] && S.slots[i] !== benchSel ? ' · ' + D[S.slots[i]].name.split(' ')[0] : ''}</button> `).join('')}</div><h3>ATTACHMENTS</h3>`;
      for (const sl in W.ATT) { h += `<div class="at"><span>${sl.toUpperCase()}</span><div>`; for (const o in W.ATT[sl]) { const a = W.ATT[sl][o]; if ((a.only && !a.only.includes(d.cls)) || (a.not && a.not.includes(d.cls)) || (a.notId && a.notId.includes(benchSel))) continue; const own = !a.cost || c.un[sl + '.' + o]; h += `<button class="${c[sl] === o ? 'on' : ''}" data-att="${sl}:${o}" ${!own && S.scrap < a.cost ? 'disabled' : ''}>${a.name}${own ? '' : ' · ' + a.cost}</button>`; } h += `</div></div>`; }
      h += `<h3>SKIN</h3><div class="sk">`; W.SKINS.forEach((s, i) => { const own = c.skins.includes(i); h += `<button class="${c.skin === i ? 'on' : ''}" data-skin="${i}" style="background:${s.a ? `linear-gradient(135deg,${s.a} 50%,${s.b} 50%)` : '#2a2c30'}" ${!own && S.scrap < s.cost ? 'disabled' : ''}>${s.name}${own ? '' : '<br>' + s.cost}</button>`; }); h += `</div>`;
    }
    h += `</div></div><div style="margin-top:12px"><button data-close>Close</button></div>`; E.benchC.innerHTML = h;
  }
  const CRAFT = [['p', 24, 10, '9mm / .38 rounds'], ['s', 8, 10, '12-bore shells'], ['r', 20, 12, 'Rifle rounds'], ['h', 6, 12, '.303 rounds'], ['meds', 1, 25, 'First-aid kit'], ['frag', 1, 30, 'Grenade'], ['molotov', 1, 15, 'Petrol bomb'], ['b', 6, 8, 'Crossbow bolts'], ['f', 60, 10, 'Sprayer fuel'], ['bottle', 3, 3, 'Glass bottles (lure)'], ['mine', 1, 35, 'Tripmine']];
  function benchClick(t) {
    const S = G.S, W = G.Wp, ds = t.dataset; let ok = true;
    if (ds.gun) benchSel = ds.gun;
    else if (ds.buy) { const d = W.DEFS[ds.buy]; if (S.scrap >= d.cost) { S.scrap -= d.cost; W.give(ds.buy); const f = S.slots.indexOf(null); if (f >= 0) S.slots[f] = ds.buy; } }
    else if (ds.slot) { const i = +ds.slot, o = S.slots.indexOf(benchSel); if (o >= 0) S.slots[o] = S.slots[i]; S.slots[i] = benchSel; if (!S.slots.some(x => x)) S.slots[0] = benchSel; W.st.cur = Math.min(W.st.cur, 3); if (W.st.cur < 3 && !S.slots[W.st.cur]) W.st.cur = S.slots.findIndex(x => x); }
    else if (ds.att) { const [sl, o] = ds.att.split(':'), a = W.ATT[sl][o], c = S.guns[benchSel], k = sl + '.' + o; if (a.cost && !c.un[k]) { if (S.scrap < a.cost) return; S.scrap -= a.cost; c.un[k] = 1; } c[sl] = o; }
    else if (ds.skin) { const i = +ds.skin, c = S.guns[benchSel]; if (!c.skins.includes(i)) { if (S.scrap < W.SKINS[i].cost) return; S.scrap -= W.SKINS[i].cost; c.skins.push(i); } c.skin = i; }
    else if (ds.melee) { const m = W.MELEE[ds.melee]; if (!S.meleeOwned.includes(ds.melee)) { if (S.scrap < m.cost) return; S.scrap -= m.cost; S.meleeOwned.push(ds.melee); } S.melee = ds.melee; }
    else if (ds.craft) { const r = CRAFT.find(x => x[0] === ds.craft); if (S.scrap < r[2]) return; S.scrap -= r[2]; G.Loot.give(r[0], r[1], true); }
    else ok = false;
    if (ok) { G.Audio.click(.7); W.rebuild(); renderBench(); }
  }
  UI.bench = () => { const id = G.Wp.curId(); if (id) benchSel = id; renderBench(); modal('bench'); };
  UI.boat = from => { const J = G.M.jetties(); E.boatL.innerHTML = J.map((j, i) => i === from ? '' : `<button data-sail="${i}">${j.n}</button>`).join(''); modal('boat'); };
  UI.ending = () => { const S = G.S; E.endT.innerHTML = `The fog rolled over Kannur at first light and the coast went quiet. Behind you the Varuna campus is still burning. ${G.Base.members.filter(m => m.alive).length} of the household are alive to see the quarantine lifted.<br><br><b>${S.stats.kills}</b> infected put down · <b>${S.stats.heads}</b> heads taken · <b>${G.env.day}</b> days · ${S.dead.length ? 'lost: ' + S.dead.map(d => G.Base.FAM[d].name).join(', ') : 'nobody left behind'}`; modal('end'); };
  UI.dead = () => { E.deadT.textContent = 'Achan drags you back through the gate. You lose some scrap, and a night.'; modal('dead'); };
  function renderPause() { const s = G.set; E.pset.innerHTML = `<div class="at"><span>GRAPHICS</span><div>${G.QUAL.map((q, i) => `<button class="${s.q === i ? 'on' : ''}" data-q="${i}">${q.name}</button>`).join('')}</div></div><div class="at"><span>MOUSE</span><input type="range" min=".3" max="2.5" step=".05" value="${s.sens}" data-set="sens"></div><div class="at"><span>FOV</span><input type="range" min="60" max="100" step="1" value="${s.fov}" data-set="fov"></div><div class="at"><span>VOLUME</span><input type="range" min="0" max="1" step=".05" value="${s.vol}" data-set="vol"></div><div class="at"><span>FOLIAGE</span><input type="range" min="0" max="1.2" step=".05" value="${s.fol}" data-set="fol"></div><div class="at"><span>GORE</span><div><button class="${s.gore ? 'on' : ''}" data-gore="1">Full</button><button class="${!s.gore ? 'on' : ''}" data-gore="0">Reduced</button></div></div>`; }
  function drawBig() {
    const c = $('bigmap'), x = c.getContext('2d'), W = G.W, S = G.S, P = G.P, px = v => (v - W.X0) / 2, pz = v => (v - W.Z0) / 2; x.imageSmoothingEnabled = true; x.drawImage(G.mapCanvas, 0, 0, c.width, c.height);
    x.font = '700 13px "Segoe UI","Nirmala UI"'; x.textAlign = 'center';
    if (S.perk.scout) { x.fillStyle = 'rgba(255,255,255,.75)'; G.lootPts.forEach((p, i) => { if (S.looted[i] === undefined) x.fillRect(px(p.x) - 1, pz(p.z) - 1, 3, 3); }); }
    for (const l of G.locs) { x.fillStyle = 'rgba(0,0,0,.6)'; const w = x.measureText(l.name).width + 10; x.fillRect(px(l.x) - w / 2, pz(l.z) - 22, w, 17); x.fillStyle = l.id === 'home' ? '#e3b54a' : '#f1ece0'; x.fillText(l.name, px(l.x), pz(l.z) - 9); }
    if (S.boat) { x.fillStyle = '#57b8a8'; for (const j of G.M.jetties()) { x.beginPath(); x.arc(px(j.x), pz(j.z), 5, 0, 7); x.fill(); } }
    const dot = (wx, wz, col, r) => { x.fillStyle = col; x.strokeStyle = '#000'; x.lineWidth = 2; x.beginPath(); x.arc(px(wx), pz(wz), r, 0, 7); x.fill(); x.stroke(); };
    for (const v of G.Vehs) dot(v.x, v.z, v.type === 'auto' ? '#e8b818' : '#d0d0d0', 3.5); if (S.job) dot(S.job.x, S.job.z, '#57b8a8', 7); if (G.M.target) dot(G.M.target.x, G.M.target.z, '#e3b54a', 8);
    x.save(); x.translate(px(P.x), pz(P.z)); x.rotate(-P.yaw); x.fillStyle = '#fff'; x.strokeStyle = '#000'; x.beginPath(); x.moveTo(0, -11); x.lineTo(7, 8); x.lineTo(0, 4); x.lineTo(-7, 8); x.closePath(); x.fill(); x.stroke(); x.restore();
  }

  UI.init = () => {
    for (const id of ['loc', 'clock', 'obj', 'job', 'compass', 'mini', 'res', 'siege', 'hp', 'st', 'med', 'wname', 'ammo', 'slots', 'cross', 'hitm', 'ctx', 'busy', 'prompt', 'ptxt', 'hold', 'feed', 'lootf', 'banner', 'subs', 'saved', 'dmg', 'splats', 'scope', 'fade', 'panelC', 'benchC', 'boatL', 'pset', 'deadT', 'endT', 'hud', 'qsel', 'stylef', 'streak']) E[id] = $(id);
    mctx = E.mini.getContext('2d'); cctx = E.compass.getContext('2d'); E.ch = E.cross.querySelectorAll('i');
    const qs = () => { E.qsel.innerHTML = G.QUAL.map((q, i) => `<button class="${G.set.q === i ? 'on' : ''}" data-q="${i}">${q.name}</button>`).join(' '); }; qs();
    document.addEventListener('click', e => {
      const t = e.target.closest('button,[data-close]'); if (!t) return; const ds = t.dataset;
      if (ds.close !== undefined) return UI.close();
      if (ds.q) { G.set.q = +ds.q; G.saveSet(); qs(); if (G.started) { renderPause(); UI.msg('Graphics change fully applies after reload', 'dim'); G.resize(); } return; }
      if (ds.gore) { G.set.gore = +ds.gore; G.saveSet(); renderPause(); return; }
      if (ds.crew) { G.Base.setCrew(ds.crew); renderPanel(); return; }
      if (ds.role) { const [id, r] = ds.role.split(':'); G.S.fam[id].role = r; G.Audio.click(.7); renderPanel(); return; }
      if (ds.up) { G.Base.buy(ds.up); renderPanel(); return; }
      if (ds.file) { const f = G.M.FILES[ds.file]; document.getElementById('fileT').innerHTML = '<b>' + f[0] + '</b><br>' + f[1]; return; }
      if (ds.sail) { UI.close(); G.M.sail(+ds.sail); return; }
      if (t.closest('#benchC')) benchClick(t);
    });
    document.addEventListener('input', e => { const k = e.target.dataset.set; if (!k) return; G.set[k] = +e.target.value; G.saveSet(); if (k === 'vol') G.Audio.vol(G.set.vol); if (k === 'fol') G.Foliage.dirty(); });
    $('bRes').onclick = () => UI.pause(false); $('bSave').onclick = () => { G.save(); UI.msg('Game saved', 'dim'); };
    $('bQuit').onclick = () => { if (confirm('Erase your save and start again?')) { localStorage.removeItem('theeram.save'); location.reload(); } };
    $('bWake').onclick = () => G.respawn(); $('bFree').onclick = () => { UI.close(); G.M.start(); };
    $('game').addEventListener('click', () => { if (G.started && !G.paused && !G.In.locked) G.lock(); });
  };
  const DIRS = [['N', 0], ['NE', 45], ['E', 90], ['SE', 135], ['S', 180], ['SW', 225], ['W', 270], ['NW', 315]];
  UI.update = dt => {
    const P = G.P, S = G.S, W = G.Wp, st = W.st, In = G.In;
    if (G.hit('Tab')) { if (UI.open === 'panel') UI.close(); else if (!UI.open) { renderPanel(); modal('panel'); } }
    if (G.hit('KeyM')) { if (UI.open === 'mapov') UI.close(); else if (!UI.open) { drawBig(); modal('mapov'); } }
    if (G.hit('Escape')) { if (UI.open && UI.open !== 'dead' && UI.open !== 'end') UI.close(); else if (!UI.open) UI.pause(true); }
    if (G.hit('KeyP') && !UI.open) UI.pause(true);
    // timers that run on real time
    if (bannerT > 0) { bannerT -= dt; if (bannerT <= 0) E.banner.style.opacity = 0; }
    if (subT > 0) { subT -= dt; if (subT <= 0) show(E.subs, false); } else if (subsQ.length && !G.paused) { const s = subsQ.shift(); E.subs.innerHTML = `<b>${s[0]}</b>${s[1]}`; show(E.subs, true); subT = 2.4 + s[1].length * .045; }
    if (G.paused) return;
    dmgA = Math.max(P.hp < 30 ? .35 + .15 * Math.sin(G.t * 5) : 0, dmgA - dt * .9); E.dmg.style.opacity = P.grabber ? Math.max(dmgA, .6) : dmgA;
    G.postU.uSat.value = P.alive ? clamp(.45 + P.hp / 60, .35, 1) : .1;
    // crosshair
    const id = W.curId(), D = id && W.DEFS[id], hide = !P.alive || P.veh || st.scoped || (D && st.ads > .6 && D.cls !== 'shotgun');
    show(E.cross, !hide); show(E.scope, st.scoped && !P.veh);
    if (!hide) { const sp = D ? lerp(D.hip, D.ads, st.ads) * (P.speed > 2 ? 1.5 : 1) * (P.crouch ? .75 : 1) + st.bloom : .4, g = st.cur === 3 ? 3 : 5 + sp * 6, c = E.ch; c[0].style.cssText = `left:${-g - 8}px;top:-1px;width:8px;height:2px`; c[1].style.cssText = `left:${g}px;top:-1px;width:8px;height:2px`; c[2].style.cssText = `left:-1px;top:${-g - 8}px;width:2px;height:8px`; c[3].style.cssText = `left:-1px;top:${g}px;width:2px;height:8px`; }
    E.hitm.style.opacity = st.hitT > 0 ? 1 : 0; if (st.hitT > 0) E.hitm.className = st.hitHead ? 'head' : '';
    // prompts
    const n = P.near; show(E.prompt, !!n && P.alive && !P.veh); if (n) { const lb = typeof n.label === 'function' ? n.label() : n.label; E.ptxt.innerHTML = `<kbd>E</kbd>${n.hold ? 'Hold · ' : ''}${lb}`; E.hold.style.width = n.hold ? clamp(P.holdT / n.hold, 0, 1) * 100 + '%' : '0'; }
    const ct = P.grabber ? 'MASH [F] TO BREAK FREE' : (st.swing <= 0 && G.Z.meleeTarget()); show(E.ctx, !!ct && P.alive); if (ct) E.ctx.textContent = typeof ct === 'string' ? ct : '[F] ' + (ct.kind === 'silent' ? 'SILENT KILL' : ct.kind.toUpperCase());
    show(E.busy, P.busy > 0); if (P.busy > 0) E.busy.textContent = P.busyLabel || '';
    tick -= dt; if (tick > 0) return; tick = .1;
    const SK = G.Style; E.streak.style.opacity = SK.streak >= 2 ? 1 : 0; if (SK.streak >= 2) E.streak.innerHTML = '×' + SK.streak + '<small>KILLS</small><i style="width:' + clamp(SK.t / 6, 0, 1) * 100 + '%"></i>';
    E.hp.style.width = P.hp / P.maxHp * 100 + '%'; E.st.style.width = P.stam + '%';
    E.med.innerHTML = `<kbd>H</kbd>First-aid <b>${S.meds}</b> &nbsp; <kbd>G</kbd>${{ frag: 'Grenade', molotov: 'Petrol bomb', bottle: 'Bottle' }[st.throwSel]} <b>${S[st.throwSel] || 0}</b> &nbsp; <kbd>X</kbd>Mine <b>${S.mine || 0}</b>`;
    if (P.veh) { E.wname.textContent = P.veh.T.name; E.ammo.innerHTML = `${Math.round(Math.abs(P.veh.sp) * 3.6)}<small> km/h</small>`; }
    else if (st.cur === 3) { E.wname.textContent = W.MELEE[S.melee].name; E.ammo.innerHTML = `<small>LMB swing · hold RMB heavy</small>`; }
    else if (D) { E.wname.textContent = D.name + (st.reloading ? ' · reloading' : ''); E.ammo.innerHTML = `${st.clip[id]}<small> / ${S.ammo[D.ammo]}</small>`; E.ammo.style.color = st.clip[id] <= Math.ceil(W.magSize(id) * .25) ? '#ff7a66' : ''; }
    E.slots.innerHTML = S.slots.map((g, i) => g ? `<span class="${st.cur === i ? 'on' : ''}">${i + 1} ${W.DEFS[g].name.split(' ').slice(-1)[0]}</span>` : '').join('') + `<span class="${st.cur === 3 ? 'on' : ''}">4 ${W.MELEE[S.melee].name.split(' ')[0]}</span>`;
    const l = G.locAt(P.x, P.z), h = G.env.hour, e = G.env; E.loc.innerHTML = l ? `${l.name}<small>${l.ml}</small>` : (P.x - G.coast(P.z) < 40 ? 'Arabian Sea shore' : 'Kannur district');
    E.clock.textContent = `DAY ${e.day} · ${String(h | 0).padStart(2, '0')}:${String((h % 1 * 60) | 0).padStart(2, '0')} · ${e.rain > .6 ? 'MONSOON DOWNPOUR' : e.rain > .1 ? 'RAIN' : e.cloud > .55 ? 'OVERCAST' : e.night > .5 ? 'CLEAR NIGHT' : 'CLEAR'}${h > 18.5 && h < 20.5 && S.mission >= 2 ? ' · SIEGE AT 20:30' : ''}`;
    E.obj.innerHTML = G.M.text ? `<b>${G.M.cur ? G.M.cur.title : 'OBJECTIVE'}</b>${G.M.text}` : ''; show(E.job, !!S.job); if (S.job) E.job.textContent = S.job.text + (S.job.st === 1 && S.job.k === 'sos' ? ` — ${Math.ceil(S.job.t)}s` : '');
    E.res.innerHTML = `SCRAP <b>${S.scrap}</b> · FOOD <b>${S.food}</b> · ♥ <b>${S.morale}</b>`;
    const B = G.Base, bs = G.boss && G.boss.state !== 'dead' ? G.boss : null; if (bs && !B.siegeOn) { show(E.siege, true); E.siege.textContent = (bs.bossName || 'BOSS') + ' ' + '█'.repeat(Math.ceil(clamp(bs.hp / bs.maxHp, 0, 1) * 24)).padEnd(24, '░'); } else show(E.siege, B.siegeOn); if (B.siegeOn && B.siege) E.siege.textContent = `SIEGE · ${B.siege.left || 0} REMAINING · N GATE ${Math.round(B.gates[0].hp)} · E GATE ${Math.round(B.gates[1].hp)}`;
    // compass
    const c = cctx, bh = -P.yaw; c.clearRect(0, 0, 520, 34); c.fillStyle = 'rgba(0,0,0,.28)'; c.fillRect(0, 0, 520, 34); c.textAlign = 'center'; c.font = '700 13px "Segoe UI"';
    for (const [nm, dg] of DIRS) { const a = angDiff(dg * Math.PI / 180, bh); if (Math.abs(a) < 1.25) { c.fillStyle = nm.length === 1 ? '#f1ece0' : 'rgba(241,236,224,.5)'; c.fillText(nm, 260 + a * 200, 22); } }
    const mark = (t, col) => { const a = clamp(angDiff(Math.atan2(t.x - P.x, -(t.z - P.z)), bh), -1.25, 1.25), d = Math.hypot(t.x - P.x, t.z - P.z); c.fillStyle = col; c.beginPath(); c.moveTo(260 + a * 200, 3); c.lineTo(266 + a * 200, 11); c.lineTo(254 + a * 200, 11); c.fill(); c.font = '700 10px "Segoe UI"'; c.fillText(Math.round(d) + 'm', 260 + a * 200, 32); };
    if (G.M.target) mark(G.M.target, '#e3b54a'); if (S.job) mark(S.job, '#57b8a8');
    // minimap (north up, 150 m across)
    const m = mctx, WD = G.W, R = 88, k = 176 / 150; m.save(); m.beginPath(); m.arc(R, R, R, 0, 7); m.clip(); m.imageSmoothingEnabled = true;
    m.drawImage(G.mapCanvas, (P.x - 75 - WD.X0) / 4, (P.z - 75 - WD.Z0) / 4, 37.5, 37.5, 0, 0, 176, 176);
    const dot = (wx, wz, col, r, edge) => { let dx = (wx - P.x) * k, dz = (wz - P.z) * k; const d = Math.hypot(dx, dz); if (d > R - 5) { if (!edge) return; dx *= (R - 6) / d; dz *= (R - 6) / d; } m.fillStyle = col; m.beginPath(); m.arc(R + dx, R + dz, r, 0, 7); m.fill(); };
    if (S.perk.scout) G.lootPts.forEach((p, i) => { if (S.looted[i] === undefined) dot(p.x, p.z, 'rgba(255,255,255,.8)', 1.6); });
    for (const z of G.Z.list) if (z.state !== 'dead' && (z.chasing || z.dT < 30 || Math.hypot(z.x - P.x, z.z - P.z) < 30)) dot(z.x, z.z, z.human ? (z.T.hostile ? '#ffb030' : '#ffffff') : z.type === 'brute' ? '#ff9020' : '#ff3a2a', z.type === 'brute' ? 4 : 2.6);
    for (const mb of B.members) if (mb.alive && !mb.away) dot(mb.x, mb.z, mb.down ? '#ff3a2a' : '#8fd17a', 3);
    for (const v of G.Vehs) dot(v.x, v.z, v.type === 'auto' ? '#e8b818' : '#d8d8d8', 3, v === G.Veh); dot(230, 150, '#e3b54a', 3, true); if (S.job) dot(S.job.x, S.job.z, '#57b8a8', 5, true); if (G.M.target) dot(G.M.target.x, G.M.target.z, '#ffd24a', 5.5, true);
    m.translate(R, R); m.rotate(-P.yaw); m.fillStyle = '#fff'; m.strokeStyle = '#000'; m.lineWidth = 1.5; m.beginPath(); m.moveTo(0, -8); m.lineTo(5.5, 6); m.lineTo(0, 3); m.lineTo(-5.5, 6); m.closePath(); m.fill(); m.stroke(); m.restore();
  };
})();
