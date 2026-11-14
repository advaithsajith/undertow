'use strict';
/* UNDERTOW — foliage: walk-through grass, reeds, ferns, flowers, taro and paddy, streamed around the camera.
   One instanced draw call; plants sway in the wind and bend away from the player. */
(function () {
  const F = G.Foliage = { max: 11000, R: 56, cell: 7 }, cache = new Map();
  let mesh, U, aCell, lastX = 1e9, lastZ = 1e9;
  // atlas: 4 x 2 cells — grass, tall grass, hibiscus, ixora/jasmine, fern, paddy, beach morning-glory, taro
  function atlas() {
    return canvasTex(1024, 512, (c, w, h) => {
      const r = mulberry(4242); c.clearRect(0, 0, w, h); c.lineCap = 'round';
      const cell = (i, fn) => { c.save(); c.translate((i % 4) * 256, ((i / 4) | 0) * 256); c.beginPath(); c.rect(0, 0, 256, 256); c.clip(); fn(); c.restore(); };
      const blade = (x0, lean, len, wd, c0, c1) => { const g = c.createLinearGradient(0, 256, 0, 256 - len); g.addColorStop(0, c0); g.addColorStop(1, c1); c.strokeStyle = g; c.lineWidth = wd; c.beginPath(); c.moveTo(x0, 258); c.quadraticCurveTo(x0 + lean * .3, 256 - len * .6, x0 + lean, 256 - len); c.stroke(); };
      const leaf = (x, y, rx, ry, a, col) => { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, rx, ry, a, 0, 7); c.fill(); };
      cell(0, () => { for (let i = 0; i < 70; i++) blade(40 + r() * 176, (r() - .5) * 110, 90 + r() * 140, 3 + r() * 4, `rgb(${20 + r() * 20 | 0},${60 + r() * 30 | 0},${14 + r() * 10 | 0})`, `rgb(${90 + r() * 70 | 0},${150 + r() * 60 | 0},${40 + r() * 30 | 0})`); });
      cell(1, () => { for (let i = 0; i < 34; i++) { const x = 60 + r() * 136, ln = (r() - .5) * 90, L = 170 + r() * 80; blade(x, ln, L, 2.5 + r() * 2.5, '#2a4a18', `rgb(${150 + r() * 50 | 0},${160 + r() * 40 | 0},${70 + r() * 30 | 0})`); if (r() < .45) leaf(x + ln, 256 - L, 4, 13, ln * .01, '#d8c890'); } });
      const bush = (cols, n) => { for (let i = 0; i < 240; i++) { const a = r() * 7, d = Math.sqrt(r()) * 100; leaf(128 + Math.cos(a) * d, 150 + Math.sin(a) * d * .85, 9 + r() * 8, 5 + r() * 4, r() * 3, `rgb(${18 + r() * 30 | 0},${70 + r() * 60 | 0},${20 + r() * 20 | 0})`); } c.fillStyle = '#2a3a14'; c.fillRect(120, 220, 16, 40); for (let i = 0; i < n; i++) cols(128 + (r() - .5) * 180, 150 + (r() - .5) * 150); };
      cell(2, () => bush((x, y) => { for (let k = 0; k < 5; k++) { const a = k / 5 * 6.283; leaf(x + Math.cos(a) * 9, y + Math.sin(a) * 9, 10, 7, a, k % 2 ? '#d81828' : '#f02838'); } leaf(x, y, 4, 4, 0, '#ffd040'); }, 9));
      cell(3, () => bush((x, y) => { const cl = r() < .5 ? ['#ff7a18', '#ffb030'] : ['#fff8e8', '#ffe890']; for (let k = 0; k < 9; k++) leaf(x + (r() - .5) * 16, y + (r() - .5) * 16, 4.5, 4.5, 0, cl[k % 2]); }, 13));
      cell(4, () => { for (let f = 0; f < 9; f++) { const a = -1.57 + (f - 4) * .33 + (r() - .5) * .1, L = 150 + r() * 70, col = `rgb(${30 + r() * 20 | 0},${105 + r() * 50 | 0},${30 + r() * 20 | 0})`; for (let s = 0; s < 22; s++) { const t = s / 22, bx = 128 + Math.cos(a) * L * t + Math.sin(t * 2) * (f - 4) * 4, by = 250 + Math.sin(a) * L * t + t * t * 40, wl = 20 * (1 - t) + 3; leaf(bx + Math.cos(a + 1.57) * wl * .5, by + Math.sin(a + 1.57) * wl * .5, wl * .55, 3.2, a + 1.57, col); leaf(bx - Math.cos(a + 1.57) * wl * .5, by - Math.sin(a + 1.57) * wl * .5, wl * .55, 3.2, a + 1.57, col); } } });
      cell(5, () => { for (let i = 0; i < 80; i++) { const x = 20 + r() * 216, ln = (r() - .5) * 40, L = 150 + r() * 90; blade(x, ln, L, 2.4 + r() * 2, '#3a6a14', `rgb(${150 + r() * 50 | 0},${190 + r() * 40 | 0},${50 + r() * 30 | 0})`); if (r() < .3) { c.strokeStyle = '#d8c060'; c.lineWidth = 3.5; c.beginPath(); c.moveTo(x + ln, 256 - L); c.quadraticCurveTo(x + ln + 14, 256 - L - 6, x + ln + 22, 256 - L + 22); c.stroke(); } } });
      cell(6, () => { for (let i = 0; i < 60; i++) { const x = 20 + r() * 216, y = 150 + r() * 100; leaf(x, y, 16 + r() * 8, 11 + r() * 5, r() * 3, `rgb(${40 + r() * 20 | 0},${110 + r() * 40 | 0},${50 + r() * 20 | 0})`); } for (let i = 0; i < 11; i++) { const x = 30 + r() * 196, y = 130 + r() * 100; leaf(x, y, 15, 15, 0, '#d868c8'); leaf(x, y, 9, 9, 0, '#f0a0e0'); leaf(x, y, 4, 4, 0, '#7a1a6a'); } });
      cell(7, () => { for (let i = 0; i < 6; i++) { const a = -1.57 + (i - 2.5) * .42, L = 120 + r() * 80, x = 128 + Math.cos(a) * L, y = 250 + Math.sin(a) * L; c.strokeStyle = '#4a7a2a'; c.lineWidth = 6; c.beginPath(); c.moveTo(128, 258); c.quadraticCurveTo(128 + Math.cos(a) * L * .3, 200, x, y); c.stroke(); leaf(x, y - 8, 46 + r() * 14, 30 + r() * 10, a + 1.57, `rgb(${30 + r() * 20 | 0},${110 + r() * 40 | 0},${40 + r() * 20 | 0})`); c.strokeStyle = 'rgba(160,210,110,.7)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - Math.cos(a) * 36, y - 8 - Math.sin(a) * 36); c.lineTo(x + Math.cos(a) * 40, y - 8 + Math.sin(a) * 40); c.stroke(); } });
    }, { repeat: false, aniso: 4 });
  }
  // kind → [cell, width, height]
  const KIND = [[0, 1.3, .75], [1, 1.5, 1.6], [2, 1.9, 1.7], [3, 1.6, 1.4], [4, 1.5, 1.0], [5, 1.25, .95], [6, 1.5, .45], [7, 1.9, 1.5]];
  function genCell(ix, iz) {
    const k = ix * 4099 + iz; let a = cache.get(k); if (a) return a; a = []; const r = mulberry(ix * 73856093 ^ iz * 19349663), C = F.cell, x0 = ix * C, z0 = iz * C;
    const lc = G.locAt(x0 + C / 2, z0 + C / 2), urban = lc && (lc.id === 'town' || lc.id === 'payyanur' || lc.id === 'station' || lc.id === 'airport' || lc.id === 'thalap' || lc.id === 'harbour') ? .3 : 1;
    for (let t = 0; t < 44; t++) {
      const x = x0 + r() * C, z = z0 + r() * C, rv = r(), sv = r(), h = G.hAt(x, z); if (h < .25) { if (h > -.35 && x - G.coast(z) > 60 && rv < .5) a.push(x, h, z, 1, .9 + sv * .5, sv); continue; }
      const m = G.maskAt(x, z); if (m === 1) continue; if (urban < 1 && m !== 3 && r() > urban) continue; if (x > 209 && x < 251 && z > 129 && z < 171 && rv > .12) continue;
      let kind = -1; const pat = vnoise(x * .05, z * .05), d = x - G.coast(z);
      if (m === 3) kind = 5;
      else if (m === 2) { if (rv < .1) kind = 0; }
      else if (h < 2.35 && d < 70) { if (rv < .1 * pat + .02) kind = 1; else if (rv > .93) kind = 6; }
      else { const fl = vnoise(x * .11 + 31, z * .11 + 7); if (rv < .5 + pat * .3) kind = 0; else if (rv < .68) kind = pat > .55 ? 4 : 1; else if (rv < .8 && fl > .6) kind = sv < .5 ? 2 : 3; else if (rv < .85 && pat > .5) kind = 7; else if (rv < .9 && fl > .7) kind = 3; }
      if (kind < 0) continue; if (kind !== 5) { let nl = false; for (const lp of G.lootPts) if (Math.abs(lp.x - x) < 2.6 && Math.abs(lp.z - z) < 2.6) { nl = true; break; } if (nl) continue; } if (kind !== 5 && kind !== 0 && G.blocked(x, z, .5)) continue; if (kind === 0 && G.blocked(x, z, .2)) continue;
      a.push(x, h, z, kind, .75 + sv * .6, sv);
    }
    if (cache.size > 1400) cache.clear(); cache.set(k, a); return a;
  }
  F.init = () => {
    const g = new THREE.BufferGeometry(), p = [], uv = [], n = [], idx = [];
    for (let q = 0; q < 2; q++) { const c = q ? 0 : 1, s = q ? 1 : 0, b = q * 4; p.push(-.5 * c, 0, -.5 * s, .5 * c, 0, .5 * s, .5 * c, 1, .5 * s, -.5 * c, 1, -.5 * s); uv.push(0, 0, 1, 0, 1, 1, 0, 1); n.push(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0); idx.push(b, b + 1, b + 2, b, b + 2, b + 3, b, b + 2, b + 1, b, b + 3, b + 2); }
    g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('normal', new THREE.Float32BufferAttribute(n, 3)); g.setIndex(idx);
    aCell = new THREE.InstancedBufferAttribute(new Float32Array(F.max * 2), 2); g.setAttribute('aCell', aCell);
    const mat = new THREE.MeshLambertMaterial({ map: atlas(), alphaTest: .45 });
    U = F.U = { uTime: { value: 0 }, uWind: { value: .5 }, uPl: { value: new THREE.Vector3() }, uCam: { value: new THREE.Vector3() }, uFar: { value: F.R } };
    mat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec2 aCell; uniform float uTime,uWind,uFar; uniform vec3 uPl,uCam;')
        .replace('#include <uv_vertex>', '#include <uv_vertex>\n vUv = uv*vec2(.248,.496) + aCell + .001;')
        .replace('#include <project_vertex>', `
        vec4 wp0 = instanceMatrix * vec4(0.,0.,0.,1.); vec4 wpos = instanceMatrix * vec4(transformed,1.); float top = position.y;
        float ph = wp0.x*.7 + wp0.z*.9, hgt = wpos.y - wp0.y;
        wpos.x += (sin(uTime*1.7+ph)*.10 + sin(uTime*3.1+ph*1.7)*.04 + uWind*.08) * hgt * uWind * 1.6;
        wpos.z += cos(uTime*1.3+ph*1.3)*.07 * hgt * uWind * 1.6;
        vec2 dp = wp0.xz - uPl.xz; float dd = length(dp); float push = (1.-smoothstep(.25,1.5,dd)) * top * step(abs(wp0.y-uPl.y), 2.5);
        wpos.xz += normalize(dp + vec2(.001)) * push * .55; wpos.y -= push * hgt * .45;
        float fd = distance(wp0.xz, uCam.xz); wpos.xyz = mix(wp0.xyz, wpos.xyz, 1.-smoothstep(uFar*.7, uFar*.97, fd));
        vec4 mvPosition = viewMatrix * wpos; gl_Position = projectionMatrix * mvPosition;`);
    };
    mesh = F.mesh = new THREE.InstancedMesh(g, mat, F.max); mesh.frustumCulled = false; mesh.receiveShadow = true; mesh.instanceColor = new THREE.BufferAttribute(new Float32Array(F.max * 3).fill(1), 3); mesh.count = 0; G.scene.add(mesh);
  };
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), s = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), col3 = new THREE.Color();
  F.rebuild = (cx, cz) => {
    const C = F.cell, R = F.R * (G.Q().fol || 1), n0 = Math.floor((cx - R) / C), n1 = Math.floor((cx + R) / C), m0 = Math.floor((cz - R) / C), m1 = Math.floor((cz + R) / C), max = Math.min(F.max, G.Q().folMax || F.max); let n = 0; U.uFar.value = R; const dens = G.set.fol === undefined ? .5 : G.set.fol;
    for (let ix = n0; ix <= n1 && n < max; ix++) for (let iz = m0; iz <= m1 && n < max; iz++) {
      if (sq((ix + .5) * C - cx) + sq((iz + .5) * C - cz) > sq(R + C)) continue; const a = genCell(ix, iz);
      for (let i = 0; i < a.length && n < max; i += 6) { const K = KIND[a[i + 3]], sc = a[i + 4], sv = a[i + 5]; if (((i / 6 * .618034) % 1) > dens * (a[i + 3] === 5 ? 1.5 : 1)) continue; q.setFromAxisAngle(up, sv * 6.283); m4.compose(v.set(a[i], a[i + 1] - .04, a[i + 2]), q, s.set(K[1] * sc, K[2] * sc, K[1] * sc)); mesh.setMatrixAt(n, m4); aCell.array[n * 2] = (K[0] % 4) * .25; aCell.array[n * 2 + 1] = K[0] < 4 ? .5 : 0; const b = .72 + sv * .4; mesh.setColorAt(n, col3.setRGB(b, b * (1 + (sv - .5) * .15), b * .9)); n++; }
    }
    mesh.count = n; mesh.instanceMatrix.needsUpdate = true; aCell.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true; F.count = n;
  };
  F.dirty = () => { lastX = 1e9; };
  F.tallNear = (x, z) => { const C = F.cell, a = genCell(Math.floor(x / C), Math.floor(z / C)); for (let i = 0; i < a.length; i += 6) { const k = a[i + 3]; if ((k === 1 || k === 2 || k === 3 || k === 5 || k === 7) && Math.abs(a[i] - x) < 1.4 && Math.abs(a[i + 2] - z) < 1.4) return true; } return false; };
  F.update = () => {
    const c = G.camera.position, P = G.P; U.uTime.value = G.t; U.uWind.value = G.windU.uWind.value; U.uCam.value.copy(c);
    if (G.started) U.uPl.value.set(P.x, P.y, P.z); else U.uPl.value.set(0, -99, 0);
    const fx = G.started && P.tps ? P.x : c.x, fz = G.started && P.tps ? P.z : c.z;
    if (Math.abs(fx - lastX) + Math.abs(fz - lastZ) > 7) { lastX = fx; lastZ = fz; F.rebuild(fx, fz); }
  };
})();
