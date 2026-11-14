'use strict';
/* THEERAM — fx: particles, blood decals, gibs, tracers, fire */
(function () {
  const N = 1500, V3 = THREE.Vector3;
  const px = new Float32Array(N * 3), pc = new Float32Array(N * 4), ps = new Float32Array(N), pa = new Float32Array(N);
  const vel = new Float32Array(N * 3), life = new Float32Array(N), grow = new Float32Array(N), grav = new Float32Array(N), drag = new Float32Array(N), fade = new Float32Array(N), kind = new Uint8Array(N);
  let head = 0, pts, U;
  const decals = [], gibs = [], tracers = [], fires = []; let di = 0, gi = 0, ti = 0;
  const FX = G.FX = { fires };
  function emit(x, y, z, vx, vy, vz, r, g, b, a, size, lf, o) {
    const i = head; head = (head + 1) % N; px[i * 3] = x; px[i * 3 + 1] = y; px[i * 3 + 2] = z; vel[i * 3] = vx; vel[i * 3 + 1] = vy; vel[i * 3 + 2] = vz;
    pc[i * 4] = r; pc[i * 4 + 1] = g; pc[i * 4 + 2] = b; pc[i * 4 + 3] = a; ps[i] = size; life[i] = lf; fade[i] = a / lf;
    grow[i] = o && o.grow || 0; grav[i] = o && o.grav !== undefined ? o.grav : 9.8; drag[i] = o && o.drag || 0; pa[i] = o && o.add ? 1 : 0; kind[i] = o && o.kind || 0;
  }
  FX.emit = emit;
  FX.init = () => {
    const g = new THREE.BufferGeometry();
    const dyn = (arr, n) => { const a = new THREE.BufferAttribute(arr, n); a.usage = THREE.DynamicDrawUsage; return a; };
    g.setAttribute('position', dyn(px, 3)); g.setAttribute('aCol', dyn(pc, 4)); g.setAttribute('aSize', dyn(ps, 1)); g.setAttribute('aAdd', dyn(pa, 1));
    U = { uScale: { value: 600 }, uAmb: { value: 1 } };
    pts = new THREE.Points(g, new THREE.ShaderMaterial({
      uniforms: U, transparent: true, depthWrite: false, fog: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
      vertexShader: 'attribute vec4 aCol; attribute float aSize,aAdd; uniform float uScale; varying vec4 vC; varying float vA; void main(){ vC=aCol; vA=aAdd; vec4 mv=viewMatrix*vec4(position,1.); gl_Position=projectionMatrix*mv; gl_PointSize=min(aSize*uScale/max(-mv.z,.1),220.); }',
      fragmentShader: 'uniform float uAmb; varying vec4 vC; varying float vA; void main(){ float d=length(gl_PointCoord-.5); float a=smoothstep(.5,.22,d)*vC.a; if(a<.004) discard; vec3 c=vC.rgb*mix(uAmb,1.,vA); gl_FragColor=vec4(c*a,a*(1.-vA)); }'
    }));
    pts.frustumCulled = false; pts.renderOrder = 10; G.sceneB.add(pts);
    // blood decal textures
    const mk = seed => canvasTex(128, 128, (c, w, h) => { const r = mulberry(seed); c.clearRect(0, 0, w, h); for (let i = 0; i < 26; i++) { const a = r() * 7, d = r() * r() * 46, s = 5 + r() * 20 * (1 - d / 60); c.fillStyle = `rgba(${70 + r() * 50 | 0},${r() * 8 | 0},${r() * 6 | 0},${.75 + r() * .25})`; c.beginPath(); c.arc(64 + Math.cos(a) * d, 64 + Math.sin(a) * d, s, 0, 7); c.fill(); } for (let i = 0; i < 40; i++) { const a = r() * 7, d = 30 + r() * 32; c.fillStyle = 'rgba(90,4,4,.9)'; c.beginPath(); c.arc(64 + Math.cos(a) * d, 64 + Math.sin(a) * d, .8 + r() * 2.6, 0, 7); c.fill(); } }, { repeat: false });
    const dg = new THREE.PlaneGeometry(1, 1); dg.rotateX(-Math.PI / 2);
    const dm = [11, 23, 37, 51].map(s => new THREE.MeshStandardMaterial({ map: mk(s), transparent: true, depthWrite: false, roughness: .16, metalness: 0, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
    for (let i = 0; i < 150; i++) { const m = new THREE.Mesh(dg, dm[i % 4]); m.visible = false; m.receiveShadow = true; m.renderOrder = 2; m.userData = { s: 0, ts: 0, life: 0 }; G.scene.add(m); decals.push(m); }
    const gm = [new THREE.MeshStandardMaterial({ color: col(0x5a0a08), roughness: .3 }), new THREE.MeshStandardMaterial({ color: col(0xcfc6a8), roughness: .6 }), new THREE.MeshStandardMaterial({ color: col(0x7a1a14), roughness: .35 })];
    const gg = [new THREE.BoxGeometry(.11, .08, .14), new THREE.IcosahedronGeometry(.07, 0), new THREE.BoxGeometry(.06, .05, .2)];
    FX.gibMats = gm;
    for (let i = 0; i < 40; i++) { const m = new THREE.Mesh(gg[i % 3], gm[i % 3]); m.visible = false; m.castShadow = true; m.userData = { v: new V3(), w: new V3(), life: 0, bl: 0, own: null }; G.scene.add(m); gibs.push(m); }
    const tg = new THREE.BoxGeometry(.025, .025, 1), tm = new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.1, .9), transparent: true, opacity: .8, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
    for (let i = 0; i < 16; i++) { const m = new THREE.Mesh(tg, tm); m.visible = false; m.userData.life = 0; m.frustumCulled = false; G.sceneB.add(m); tracers.push(m); }
  };
  const nrm = new V3(), upv = new V3(0, 1, 0), q2 = new THREE.Quaternion();
  FX.decal = (x, z, size, grow) => {
    if (G.groundAt(x, z) < .05) return; const m = decals[di]; di = (di + 1) % decals.length; const y = G.groundAt(x, z);
    nrm.set(G.groundAt(x - .4, z) - G.groundAt(x + .4, z), .8, G.groundAt(x, z - .4) - G.groundAt(x, z + .4)).normalize(); if (nrm.y < .6) nrm.set(0, 1, 0);
    m.quaternion.setFromUnitVectors(upv, nrm); q2.setFromAxisAngle(nrm, Math.random() * 7); m.quaternion.premultiply(q2);
    m.position.set(x, y + .025, z); const u = m.userData; u.ts = size; u.s = grow ? size * .25 : size; u.life = 150; u.gr = grow || 0; m.scale.setScalar(u.s); m.visible = true;
  };
  FX.blood = (x, y, z, dx, dy, dz, n, sp) => {
    n = Math.round(n * (G.set.gore ? 1 : .3)); sp = sp || 4;
    for (let i = 0; i < n; i++) { const k = sp * (.3 + Math.random()); emit(x, y, z, dx * k + rnd(-1.4, 1.4), dy * k + rnd(-.5, 2.2), dz * k + rnd(-1.4, 1.4), .32 + Math.random() * .18, .012, .01, 1, .035 + Math.random() * .05, 1.6, { kind: 1 }); }
    for (let i = 0; i < Math.min(4, n / 3); i++) emit(x, y, z, dx * 1.5 + rnd(-.6, .6), rnd(0, .8), dz * 1.5 + rnd(-.6, .6), .3, .02, .02, .55, .16, .5, { grav: 1, grow: .9, drag: 2 });
  };
  FX.gore = (x, y, z, n) => { FX.blood(x, y, z, 0, .6, 0, n, 5); for (let i = 0; i < n / 3; i++) emit(x, y, z, rnd(-1.5, 1.5), rnd(0, 2), rnd(-1.5, 1.5), .35, .02, .02, .6, .3, .7, { grav: 1.5, grow: 1.4, drag: 1.5 }); };
  FX.dust = (x, y, z, n, r, g, b) => { for (let i = 0; i < n; i++) emit(x, y, z, rnd(-1, 1), rnd(.3, 1.8), rnd(-1, 1), r || .5, g || .42, b || .3, .5, .12, .7 + Math.random() * .5, { grav: .6, grow: .7, drag: 1.5 }); };
  FX.sparks = (x, y, z, nx, ny, nz, n) => { for (let i = 0; i < n; i++) emit(x, y, z, nx * 3 + rnd(-3, 3), ny * 3 + rnd(-1, 4), nz * 3 + rnd(-3, 3), 3, 1.8, .5, 1, .03, .25 + Math.random() * .25, { add: 1 }); FX.dust(x, y, z, 3, .45, .42, .4); };
  FX.splash = (x, z, n) => { for (let i = 0; i < n; i++) emit(x + rnd(-.2, .2), .05, z + rnd(-.2, .2), rnd(-1.2, 1.2), rnd(1.5, 4.5), rnd(-1.2, 1.2), .85, .9, .95, .7, .07, .7, {}); };
  FX.smoke = (x, y, z, n, s, dark) => { const c = dark ? .08 : .4; for (let i = 0; i < n; i++) emit(x + rnd(-.3, .3), y, z + rnd(-.3, .3), rnd(-.5, .5), rnd(.6, 2), rnd(-.5, .5), c, c, c, .5, s || .5, 2 + Math.random() * 2, { grav: -.4, grow: .8, drag: .6 }); };
  FX.flame = (x, y, z, s) => emit(x + rnd(-.3, .3) * s, y, z + rnd(-.3, .3) * s, rnd(-.3, .3), rnd(.8, 2.2), rnd(-.3, .3), 2.6, 1.0 + Math.random() * .6, .18, .8, (.3 + Math.random() * .3) * s, .5 + Math.random() * .3, { add: 1, grav: -1.5, grow: -.4 });
  FX.tracer = (ax, ay, az, bx, by, bz) => { const m = tracers[ti]; ti = (ti + 1) % tracers.length; const L = Math.hypot(bx - ax, by - ay, bz - az); m.position.set((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2); m.lookAt(bx, by, bz); m.scale.set(1, 1, L); m.visible = true; m.userData.life = .06; };
  FX.gib = (x, y, z, vx, vy, vz, o) => {
    if (!G.set.gore) return; const m = gibs[gi]; gi = (gi + 1) % gibs.length; const u = m.userData;
    if (u.own) { m.geometry = u.own.g; m.material = u.own.m; u.own = null; }
    if (o && o.geo) { u.own = { g: m.geometry, m: m.material }; m.geometry = o.geo; m.material = o.mat; }
    m.scale.setScalar(o && o.scale || (.7 + Math.random() * .9)); m.position.set(x, y, z); u.v.set(vx, vy, vz); u.w.set(rnd(-9, 9), rnd(-9, 9), rnd(-9, 9)); u.life = 14; u.bl = 1.2; m.visible = true;
  };
  FX.explode = (x, y, z, big) => {
    G.addLight(x, y + 1, z, 0xffa040, big ? 60 : 30, 90, 40);
    for (let i = 0; i < 40; i++) emit(x, y + .5, z, rnd(-9, 9), rnd(2, 12), rnd(-9, 9), 3, 1.6, .4, 1, .09, .5 + Math.random() * .5, { add: 1 });
    for (let i = 0; i < 14; i++) emit(x + rnd(-1, 1), y + .6, z + rnd(-1, 1), rnd(-2, 2), rnd(1, 4), rnd(-2, 2), 3, 1.5, .4, .9, 1.4, .35, { add: 1, grav: -1, grow: 3 });
    FX.smoke(x, y + .5, z, 16, 1.4, true); FX.dust(x, y, z, 14);
  };
  FX.fire = (x, z, r, lf) => fires.push({ x, y: G.groundAt(x, z), z, r, life: lf, t: 0 });
  const birds = [];
  function ambient(dt) {
    const c = G.camera.position, e = G.env, rp = () => [c.x + rnd(-16, 16), c.z + rnd(-16, 16)];
    if (e.night > .5 && e.rain < .2 && Math.random() < dt * 14) { const [x, z] = rp(), g = G.groundAt(x, z); if (g > 2.2) emit(x, g + rnd(.3, 2.2), z, rnd(-.3, .3), rnd(-.1, .2), rnd(-.3, .3), 1.6, 2.2, .5, .9, .035, rnd(1.5, 3.5), { add: 1, grav: 0, drag: .2 }); }
    if (e.dayF > .5 && e.rain < .1 && Math.random() < dt * 10) { const [x, z] = rp(); emit(x, c.y + rnd(-1, 2.5), z, rnd(-.2, .2) + .3, rnd(-.05, .05), rnd(-.2, .2), 1, .95, .8, .22, .02, rnd(3, 6), { grav: 0 }); }
    if (e.dayF > .3 && Math.random() < dt * 2.5 * (.5 + G.windU.uWind.value)) { const [x, z] = rp(), g = G.groundAt(x, z); if (g > 2.3) emit(x, g + rnd(6, 10), z, rnd(.5, 2), -.6, rnd(-.6, .6), .28, .36, .1, 1, .06, rnd(5, 8), { grav: .5, drag: .6 }); }
    if (e.rain > .2) for (let i = 0, n = e.rain * dt * 90; i < n; i++) { const [x, z] = rp(), g = G.groundAt(x, z); emit(x, Math.max(g, 0) + .05, z, rnd(-.4, .4), rnd(.8, 1.6), rnd(-.4, .4), .8, .85, .95, .5, .035, .22, { grav: 9 }); }
    const d = c.x - G.coast(c.z); if (d < 26 && d > -5 && Math.random() < dt * 10) { const z = c.z + rnd(-18, 18), x = G.coast(z) + rnd(-2, 1.5); emit(x, .15, z, rnd(.3, 1.2), rnd(.6, 1.6), rnd(-.3, .3), .9, .95, 1, .35, .25, rnd(.8, 1.6), { grav: 1.5, grow: .5, drag: 1 }); }
    // a loose flock wheeling overhead by day
    if (!birds.length) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, .25, -.75, .1, -.1, 0, 0, -.12, 0, 0, .25, 0, 0, -.12, .75, .1, -.1], 3)); const m = new THREE.MeshBasicMaterial({ color: 0x050505, side: THREE.DoubleSide }); for (let i = 0; i < 16; i++) { const b = new THREE.Mesh(g, m); b.frustumCulled = false; b.userData = { r: 14 + i * 2.3, h: 26 + (i % 5) * 4, o: i * 1.37, s: .16 + (i % 3) * .03 }; G.scene.add(b); birds.push(b); } birds.cx = c.x; birds.cz = c.z; }
    birds.cx += (c.x - birds.cx) * dt * .08; birds.cz += (c.z - birds.cz) * dt * .08; const day = e.dayF > .3 && e.rain < .5;
    for (const b of birds) { b.visible = day; if (!day) continue; const u = b.userData, a = G.t * u.s + u.o; b.position.set(birds.cx + Math.cos(a) * u.r, G.groundAt(birds.cx, birds.cz) + u.h + Math.sin(a * 2.3) * 2, birds.cz + Math.sin(a) * u.r); b.rotation.set(0, -a, Math.sin(a) * .2); b.scale.set(1.5, 1 + Math.sin(G.t * 7 + u.o) * 3.5, 1.5); }
  }
  FX.update = dt => {
    ambient(dt);
    U.uAmb.value = G.env.amb * .85; U.uScale.value = G.rtH * G.camera.projectionMatrix.elements[5] * .5;
    for (let i = 0; i < N; i++) {
      if (life[i] <= 0) continue; life[i] -= dt; const j = i * 3;
      if (life[i] <= 0) { ps[i] = 0; pc[i * 4 + 3] = 0; continue; }
      vel[j + 1] -= grav[i] * dt; if (drag[i]) { const k = Math.max(0, 1 - drag[i] * dt); vel[j] *= k; vel[j + 1] *= k; vel[j + 2] *= k; }
      px[j] += vel[j] * dt; px[j + 1] += vel[j + 1] * dt; px[j + 2] += vel[j + 2] * dt; ps[i] = Math.max(0, ps[i] + grow[i] * dt);
      if (kind[i] === 1) { if (vel[j + 1] < 0 && px[j + 1] < G.groundAt(px[j], px[j + 2]) + .03) { life[i] = 0; ps[i] = 0; if (Math.random() < .3) FX.decal(px[j], px[j + 2], .25 + Math.random() * .55); } }
      else pc[i * 4 + 3] = Math.max(0, pc[i * 4 + 3] - fade[i] * dt * (life[i] < .5 ? 1.6 : .5));
    }
    const g = pts.geometry.attributes; g.position.needsUpdate = g.aCol.needsUpdate = g.aSize.needsUpdate = g.aAdd.needsUpdate = true;
    for (const m of decals) { if (!m.visible) continue; const u = m.userData; if (u.s < u.ts) { u.s = Math.min(u.ts, u.s + u.gr * dt); m.scale.setScalar(u.s); } u.life -= dt; if (u.life < 4) { m.scale.setScalar(u.s * Math.max(0, u.life / 4)); if (u.life <= 0) m.visible = false; } }
    for (const m of gibs) {
      if (!m.visible) continue; const u = m.userData; u.life -= dt; if (u.life <= 0) { m.visible = false; continue; }
      if (u.v.lengthSq() > .02) {
        u.v.y -= 12 * dt; m.position.addScaledVector(u.v, dt); m.rotation.x += u.w.x * dt; m.rotation.y += u.w.y * dt; m.rotation.z += u.w.z * dt;
        if (u.bl > 0) { u.bl -= dt; if (Math.random() < .5) emit(m.position.x, m.position.y, m.position.z, rnd(-.5, .5), rnd(0, 1), rnd(-.5, .5), .4, .012, .01, 1, .04, 1, { kind: 1 }); }
        const gy = G.groundAt(m.position.x, m.position.z) + .05; if (m.position.y < gy) { m.position.y = gy; if (u.v.y < -2) FX.decal(m.position.x, m.position.z, .4 + Math.random() * .4); u.v.y *= -.3; u.v.x *= .5; u.v.z *= .5; u.w.multiplyScalar(.4); if (Math.abs(u.v.y) < .8) u.v.set(0, 0, 0); }
      }
      if (u.life < 1) m.scale.multiplyScalar(.96);
    }
    for (const m of tracers) if (m.visible) { m.userData.life -= dt; if (m.userData.life <= 0) m.visible = false; }
    for (let i = fires.length - 1; i >= 0; i--) {
      const f = fires[i]; f.life -= dt; f.t -= dt; if (f.life <= 0) { fires.splice(i, 1); continue; }
      const n = f.r > 2 ? 3 : 1; for (let k = 0; k < n; k++) { const a = Math.random() * 7, d = Math.sqrt(Math.random()) * f.r, fx = f.x + Math.cos(a) * d, fz = f.z + Math.sin(a) * d; FX.flame(fx, G.groundAt(fx, fz) + .1, fz, 1.2); }
      if (f.t <= 0) { f.t = .25; G.addLight(f.x, f.y + 1.2, f.z, 0xff7020, 9 + Math.random() * 4, 30, 20); if (Math.random() < .4) FX.smoke(f.x, f.y + 1.5, f.z, 1, .8, true); }
    }
  };
})();
