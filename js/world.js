'use strict';
/* THEERAM — world: Kannur coast terrain, roads, colliders, buildings, vegetation */
(function () {
  const W = G.W = { X0: -560, Z0: -1010, SX: 1240, SZ: 2020, CELL: 5 };
  const R = mulberry(1947), rr = (a, b) => a + R() * (b - a), rp = a => a[(R() * a.length) | 0];

  /* ---------- shape of the land ---------- */
  G.coast = z => 40 * Math.sin(z * .0035 + .6) + 18 * Math.sin(z * .011 + 2) - 95 * Math.exp(-sq((z - 560) / 55)) + 70 * Math.exp(-sq((z - 700) / 90));
  G.hwx = z => 330 + 30 * Math.sin(z * .003);
  const riverZ = x => -560 + 25 * Math.sin(x * .012);
  function height(x, z) {
    const d = x - G.coast(z);
    let h = d < 0 ? -14 * (1 - Math.exp(d / 90)) : 2.6 * (1 - Math.exp(-d / 22));
    if (d > 0) h += sm(40, 140, d) * (1.2 + 3.5 * fbm(x * .008, z * .008)) + .25 * vnoise(x * .07, z * .07) * sm(0, 20, d);
    const pk = sm(110, 135, x) * (1 - sm(285, 300, x)) * sm(-460, -440, z) * (1 - sm(-140, -120, z));
    h = lerp(h, 2.3, pk);
    const ck = (1 - sm(10, 22, Math.abs(x - G.hwx(z)))) * sm(-660, -630, z) * (1 - sm(-490, -460, z));
    h = lerp(h, 3.4, ck);
    const rk = 1 - sm(16, 34, Math.abs(z - riverZ(x)));
    h = lerp(h, Math.min(h, -3.2), rk);
    const lk = sm(92, 108, d) * (1 - sm(200, 216, d)) * (1 - sm(-590, -570, z));
    h = lerp(h, -2.2, lk);
    h += 78 * Math.exp(-(sq(x + 90) + sq(z + 900)) / 12800);
    h += 3.5 * Math.exp(-(sq(x - 10) + sq(z - 560)) / 4050);
    h += sm(545, 700, x) * (38 + 20 * vnoise(x * .01, z * .006));
    h = lerp(h, 12, sm(405, 432, x) * sm(-455, -430, z) * (1 - sm(-45, -20, z)));
    return h;
  }
  const NX = W.SX / W.CELL, NZ = W.SZ / W.CELL, HG = new Float32Array((NX + 1) * (NZ + 1));
  for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) HG[j * (NX + 1) + i] = height(W.X0 + i * W.CELL, W.Z0 + j * W.CELL);
  G.hAt = (x, z) => {
    let fx = clamp((x - W.X0) / W.CELL, 0, NX - .001), fz = clamp((z - W.Z0) / W.CELL, 0, NZ - .001);
    const i = fx | 0, j = fz | 0; fx -= i; fz -= j; const k = j * (NX + 1) + i;
    return lerp(lerp(HG[k], HG[k + 1], fx), lerp(HG[k + NX + 1], HG[k + NX + 2], fx), fz);
  };
  G.plats = [];
  G.groundAt = (x, z) => { let h = G.hAt(x, z); for (const p of G.plats) if (x > p.x0 && x < p.x1 && z > p.z0 && z < p.z1 && p.y > h) h = p.y; return h; };
  G.seaY = (x, z, t) => Math.sin(t * .7) * .1 + (x - G.coast(z) < -10 ? .22 * Math.sin(x * .1 + z * .03 + t * .9) : 0);

  /* ---------- places ---------- */
  G.locs = [
    { id: 'home', name: 'Thalap — Home', ml: 'തളാപ്പ്', x: 230, z: 150, r: 60, dens: .5 },
    { id: 'thalap', name: 'Thalap Junction', ml: 'തളാപ്പ് ജംഗ്ഷൻ', x: 335, z: 100, r: 70, dens: 1 },
    { id: 'beach', name: 'Payyambalam Beach', ml: 'പയ്യാമ്പലം', x: 70, z: 110, r: 110, dens: .8 },
    { id: 'light', name: 'Kannur Lighthouse', ml: 'ലൈറ്റ് ഹൗസ്', x: 72, z: 260, r: 60, dens: 1 },
    { id: 'town', name: 'Kannur Town', ml: 'കണ്ണൂർ', x: 380, z: 420, r: 120, dens: 1.6 },
    { id: 'fort', name: 'St. Angelo Fort', ml: 'കണ്ണൂർ കോട്ട', x: 10, z: 560, r: 80, dens: 1.4 },
    { id: 'harbour', name: 'Mappila Bay', ml: 'മാപ്പിള ബേ', x: 120, z: 700, r: 90, dens: 1.3 },
    { id: 'paddy', name: 'Paddy Fields', ml: 'വയൽ', x: 200, z: -290, r: 170, dens: .5 },
    { id: 'bridge', name: 'Perumba Bridge', ml: 'പെരുമ്പ പാലം', x: 300, z: -565, r: 70, dens: 1.5 },
    { id: 'payyanur', name: 'Payyanur', ml: 'പയ്യന്നൂർ', x: 360, z: -710, r: 130, dens: 1.6 },
    { id: 'kavvayi', name: 'Kavvayi Backwaters', ml: 'കവ്വായി', x: 120, z: -760, r: 110, dens: .7 },
    { id: 'ezhimala', name: 'Ezhimala', ml: 'ഏഴിമല', x: -70, z: -880, r: 110, dens: 1.2 },
    { id: 'airport', name: 'Kannur International Airport', ml: 'വിമാനത്താവളം', x: 500, z: -290, r: 110, dens: 1.3 },
    { id: 'varuna', name: 'Varuna Biomarine Campus', ml: 'വരുണ ബയോമറൈൻ', x: 505, z: -84, r: 62, dens: 1.4 },
    { id: 'station', name: 'Kannur Railway Station', ml: 'റെയിൽവേ സ്റ്റേഷൻ', x: 258, z: 430, r: 45, dens: 1.5 }
  ];
  G.locAt = (x, z) => { let b = null, bd = 1e9; for (const l of G.locs) { const d = Math.hypot(x - l.x, z - l.z) / l.r; if (d < bd) { bd = d; b = l; } } return bd < 1.25 ? b : null; };
  G.poi = {};
  G.lootPts = [];

  /* ---------- colliders ---------- */
  const boxes = G.boxes = [], circles = G.circles = [], grid = new Map(), CS = 20;
  const gk = (i, j) => (i + 200) * 1000 + (j + 200);
  function gins(o, x0, x1, z0, z1) { for (let i = Math.floor((x0 - 2) / CS); i <= Math.floor((x1 + 2) / CS); i++) for (let j = Math.floor((z0 - 2) / CS); j <= Math.floor((z1 + 2) / CS); j++) { const k = gk(i, j); let a = grid.get(k); if (!a) grid.set(k, a = []); a.push(o); } }
  G.addBox = (x, z, hw, hd, yaw, y0, y1, tag) => { const c = Math.cos(yaw), s = Math.sin(yaw), e = Math.abs(hw * c) + Math.abs(hd * s), f = Math.abs(hw * s) + Math.abs(hd * c); const b = { box: 1, x, z, hw, hd, c, s, y0, y1, tag, on: true }; boxes.push(b); gins(b, x - e, x + e, z - f, z + f); return b; };
  G.addCircle = (x, z, r, y1, tag) => { const c = { x, z, r, y0: -20, y1: y1 === undefined ? 99 : y1, tag, on: true }; circles.push(c); gins(c, x - r, x + r, z - r, z + r); return c; };
  const EMPTY = [];
  G.near = (x, z) => grid.get(gk(Math.floor(x / CS), Math.floor(z / CS))) || EMPTY;
  // push a circle (pos p{x,z}, radius r, feet y) out of colliders; returns true if touched
  G.resolve = (p, r, y, skip) => {
    let hit = false; const a = G.near(p.x, p.z);
    for (let n = 0; n < a.length; n++) {
      const o = a[n]; if (!o.on || o.tag === skip || y > o.y1 - .3 || y + 1.6 < o.y0) continue;
      if (o.box) {
        const dx = p.x - o.x, dz = p.z - o.z, lx = dx * o.c - dz * o.s, lz = dx * o.s + dz * o.c;
        const cx = clamp(lx, -o.hw, o.hw), cz = clamp(lz, -o.hd, o.hd); let ex = lx - cx, ez = lz - cz, d = ex * ex + ez * ez;
        if (d > r * r) continue; hit = true;
        if (d < 1e-8) { const px = o.hw - Math.abs(lx), pz = o.hd - Math.abs(lz); if (px < pz) { ex = (lx > 0 ? 1 : -1) * (px + r); ez = 0; } else { ez = (lz > 0 ? 1 : -1) * (pz + r); ex = 0; } }
        else { d = Math.sqrt(d); const k = (r - d) / d; ex *= k; ez *= k; }
        p.x += ex * o.c + ez * o.s; p.z += -ex * o.s + ez * o.c;
      } else {
        const dx = p.x - o.x, dz = p.z - o.z, rs = r + o.r, d = dx * dx + dz * dz;
        if (d < rs * rs && d > 1e-8) { const l = Math.sqrt(d), k = (rs - l) / l; p.x += dx * k; p.z += dz * k; hit = true; }
      }
    }
    return hit;
  };
  G.blocked = (x, z, r) => { const a = G.near(x, z), p = { x, z }; for (const o of a) { if (!o.on) continue; if (o.box) { const dx = x - o.x, dz = z - o.z, lx = dx * o.c - dz * o.s, lz = dx * o.s + dz * o.c; if (Math.abs(lx) < o.hw + r && Math.abs(lz) < o.hd + r) return true; } else if (dist2(x, z, o.x, o.z) < sq(o.r + r)) return true; } return false; };
  // ray against world. returns {t, kind:'ground'|'water'|'wall'|'tree', nx,ny,nz} or null
  G.ray = (ox, oy, oz, dx, dy, dz, maxT) => {
    let best = maxT, kind = null, nx = 0, ny = 1, nz = 0, obj = null;
    // terrain march
    let t = 0, st = .6, pt = 0;
    while (t < best) {
      t += st; st = Math.min(st * 1.08, 6);
      const y = oy + dy * t; if (y > 90 && dy >= 0) break;
      if (y < G.groundAt(ox + dx * t, oz + dz * t)) { let a = pt, b = t; for (let i = 0; i < 7; i++) { const m = (a + b) / 2; if (oy + dy * m < G.groundAt(ox + dx * m, oz + dz * m)) b = m; else a = m; } best = b; kind = 'ground'; break; }
      pt = t;
    }
    if (dy < 0 && oy > 0) { const tw = -oy / dy; if (tw < best && G.hAt(ox + dx * tw, oz + dz * tw) < 0) { best = tw; kind = 'water'; } }
    const ex = ox + dx * best, ez = oz + dz * best, mnx = Math.min(ox, ex) - 30, mxx = Math.max(ox, ex) + 30, mnz = Math.min(oz, ez) - 30, mxz = Math.max(oz, ez) + 30;
    for (let n = 0; n < boxes.length; n++) {
      const o = boxes[n]; if (!o.on || o.x < mnx || o.x > mxx || o.z < mnz || o.z > mxz) continue;
      const px = ox - o.x, pz = oz - o.z, lx = px * o.c - pz * o.s, lz = px * o.s + pz * o.c, ldx = dx * o.c - dz * o.s, ldz = dx * o.s + dz * o.c;
      let t0 = 0, t1 = best, ax = 0, sg = 0;
      // slabs x, y, z
      let lo, hi, s;
      if (Math.abs(ldx) < 1e-9) { if (Math.abs(lx) > o.hw) continue; } else { lo = (-o.hw - lx) / ldx; hi = (o.hw - lx) / ldx; s = -1; if (lo > hi) { const q = lo; lo = hi; hi = q; s = 1; } if (lo > t0) { t0 = lo; ax = 0; sg = s; } if (hi < t1) t1 = hi; if (t0 > t1) continue; }
      if (Math.abs(dy) < 1e-9) { if (oy < o.y0 || oy > o.y1) continue; } else { lo = (o.y0 - oy) / dy; hi = (o.y1 - oy) / dy; s = -1; if (lo > hi) { const q = lo; lo = hi; hi = q; s = 1; } if (lo > t0) { t0 = lo; ax = 1; sg = s; } if (hi < t1) t1 = hi; if (t0 > t1) continue; }
      if (Math.abs(ldz) < 1e-9) { if (Math.abs(lz) > o.hd) continue; } else { lo = (-o.hd - lz) / ldz; hi = (o.hd - lz) / ldz; s = -1; if (lo > hi) { const q = lo; lo = hi; hi = q; s = 1; } if (lo > t0) { t0 = lo; ax = 2; sg = s; } if (hi < t1) t1 = hi; if (t0 > t1) continue; }
      if (t0 > 0 && t0 < best) { best = t0; kind = 'wall'; obj = o; if (ax === 1) { nx = 0; ny = sg; nz = 0; } else if (ax === 0) { nx = sg * o.c; ny = 0; nz = -sg * o.s; } else { nx = sg * o.s; ny = 0; nz = sg * o.c; } }
    }
    for (let n = 0; n < circles.length; n++) {
      const o = circles[n]; if (!o.on || o.x < mnx || o.x > mxx || o.z < mnz || o.z > mxz) continue;
      const px = ox - o.x, pz = oz - o.z, a = dx * dx + dz * dz; if (a < 1e-9) continue;
      const b = px * dx + pz * dz, c = px * px + pz * pz - o.r * o.r, disc = b * b - a * c; if (disc < 0) continue;
      const tt = (-b - Math.sqrt(disc)) / a; if (tt <= 0 || tt >= best) continue;
      const y = oy + dy * tt; if (y > o.y1) continue;
      best = tt; kind = 'tree'; obj = o; nx = (px + dx * tt) / o.r; ny = 0; nz = (pz + dz * tt) / o.r;
    }
    if (!kind) return null;
    if (kind === 'ground') { const x = ox + dx * best, z = oz + dz * best; nx = G.hAt(x - .5, z) - G.hAt(x + .5, z); nz = G.hAt(x, z - .5) - G.hAt(x, z + .5); ny = 1; const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l; }
    if (kind === 'water') { nx = 0; ny = 1; nz = 0; }
    return { t: best, kind, nx, ny, nz, obj: kind === 'wall' || kind === 'tree' ? obj : null };
  };

  /* ---------- geometry buckets ---------- */
  const BK = {};
  function bk(name, z) { const band = clamp(((z - W.Z0) / 202) | 0, 0, 9), k = name + band; return BK[k] || (BK[k] = { name, p: [], n: [], u: [], c: [], i: [] }); }
  function quad(b, ax, ay, az, bx, by, bz, cx, cy, cz, dx, dy, dz, c, u0, v0, u1, v1, cb) {
    const i = b.p.length / 3, ux = bx - ax, uy = by - ay, uz = bz - az, vx = dx - ax, vy = dy - ay, vz = dz - az;
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    b.p.push(ax, ay, az, bx, by, bz, cx, cy, cz, dx, dy, dz); b.n.push(nx, ny, nz, nx, ny, nz, nx, ny, nz, nx, ny, nz);
    b.u.push(u0, v0, u1, v0, u1, v1, u0, v1); const e = cb || c; b.c.push(e.r, e.g, e.b, e.r, e.g, e.b, c.r, c.g, c.b, c.r, c.g, c.b); b.i.push(i, i + 1, i + 2, i, i + 2, i + 3);
  }
  function box(name, x, y, z, sx, sy, sz, yaw, c, uvs) {
    const b = bk(name, z), co = Math.cos(yaw), s = Math.sin(yaw), hx = sx / 2, hz = sz / 2, Y = y + sy; uvs = uvs || .4;
    const gk = (name === 'plaster' || name === 'lat') && sy > .6 ? clamp(.95 - sy * .07, .6, .85) : 0, cb = gk ? { r: c.r * gk, g: c.g * gk * .97, b: c.b * gk * .9 } : null;
    const P = (lx, lz) => [x + lx * co + lz * s, z - lx * s + lz * co];
    const A = P(-hx, hz), Bq = P(hx, hz), C = P(hx, -hz), D = P(-hx, -hz), o = (x * .37 + z * .61) % 1;
    quad(b, A[0], y, A[1], Bq[0], y, Bq[1], Bq[0], Y, Bq[1], A[0], Y, A[1], c, o, y * uvs, o + sx * uvs, Y * uvs, cb);
    quad(b, C[0], y, C[1], D[0], y, D[1], D[0], Y, D[1], C[0], Y, C[1], c, o, y * uvs, o + sx * uvs, Y * uvs, cb);
    quad(b, Bq[0], y, Bq[1], C[0], y, C[1], C[0], Y, C[1], Bq[0], Y, Bq[1], c, o, y * uvs, o + sz * uvs, Y * uvs, cb);
    quad(b, D[0], y, D[1], A[0], y, A[1], A[0], Y, A[1], D[0], Y, D[1], c, o, y * uvs, o + sz * uvs, Y * uvs, cb);
    quad(b, A[0], Y, A[1], Bq[0], Y, Bq[1], C[0], Y, C[1], D[0], Y, D[1], c, o, o, o + sx * uvs, o + sz * uvs);
  }
  function hip(name, x, y, z, sx, sz, h, yaw, c) {
    if (sz > sx) { const q = sx; sx = sz; sz = q; yaw += Math.PI / 2; }
    const b = bk(name, z), co = Math.cos(yaw), s = Math.sin(yaw), hx = sx / 2, hz = sz / 2, rx = Math.max(0, hx - hz * .85), Y = y + h, sl = Math.hypot(hz, h) * .5;
    const P = (lx, lz) => [x + lx * co + lz * s, z - lx * s + lz * co];
    const A = P(-hx, hz), Bq = P(hx, hz), C = P(hx, -hz), D = P(-hx, -hz), R1 = P(rx, 0), R0 = P(-rx, 0);
    quad(b, A[0], y, A[1], Bq[0], y, Bq[1], R1[0], Y, R1[1], R0[0], Y, R0[1], c, 0, 0, sx * .5, sl);
    quad(b, C[0], y, C[1], D[0], y, D[1], R0[0], Y, R0[1], R1[0], Y, R1[1], c, 0, 0, sx * .5, sl);
    quad(b, Bq[0], y, Bq[1], C[0], y, C[1], R1[0], Y, R1[1], R1[0], Y, R1[1], c, 0, 0, sz * .5, sl);
    quad(b, D[0], y, D[1], A[0], y, A[1], R0[0], Y, R0[1], R0[0], Y, R0[1], c, 0, 0, sz * .5, sl);
  }
  function cyl(name, x, y, z, r0, r1, h, seg, c, cap) {
    const b = bk(name, z), i0 = b.p.length / 3, sl = (r0 - r1) / h;
    for (let k = 0; k <= seg; k++) { const a = k / seg * TAU, ca = Math.cos(a), sa = Math.sin(a), l = Math.hypot(1, sl); b.p.push(x + ca * r0, y, z + sa * r0, x + ca * r1, y + h, z + sa * r1); b.n.push(ca / l, sl / l, sa / l, ca / l, sl / l, sa / l); b.u.push(k / seg * 3, y * .3, k / seg * 3, (y + h) * .3); b.c.push(c.r, c.g, c.b, c.r, c.g, c.b); }
    for (let k = 0; k < seg; k++) { const a = i0 + k * 2; b.i.push(a, a + 1, a + 2, a + 2, a + 1, a + 3); }
    if (cap) { const ci = b.p.length / 3; b.p.push(x, y + h, z); b.n.push(0, 1, 0); b.u.push(.5, .5); b.c.push(c.r, c.g, c.b); for (let k = 0; k <= seg; k++) { const a = k / seg * TAU; b.p.push(x + Math.cos(a) * r1, y + h, z + Math.sin(a) * r1); b.n.push(0, 1, 0); b.u.push(.5, .5); b.c.push(c.r, c.g, c.b); } for (let k = 0; k < seg; k++) b.i.push(ci, ci + k + 2, ci + k + 1); }
  }
  function ball(name, x, y, z, rx, ry, rz, yaw, c, half) {
    const b = bk(name, z), i0 = b.p.length / 3, NU = 10, NV = half ? 4 : 7, co = Math.cos(yaw), s = Math.sin(yaw);
    for (let v = 0; v <= NV; v++) { const ph = half ? v / NV * Math.PI / 2 : v / NV * Math.PI, sp = Math.sin(ph), cp = Math.cos(ph); for (let u = 0; u <= NU; u++) { const th = u / NU * TAU, lx = Math.cos(th) * sp, lz = Math.sin(th) * sp; const wx = lx * rx, wz = lz * rz, nx0 = lx / rx, nz0 = lz / rz, ny0 = cp / ry, l = Math.hypot(nx0, ny0, nz0); b.p.push(x + wx * co + wz * s, y + cp * ry, z - wx * s + wz * co); b.n.push((nx0 * co + nz0 * s) / l, ny0 / l, (-nx0 * s + nz0 * co) / l); b.u.push(u / NU, v / NV); b.c.push(c.r, c.g, c.b); } }
    for (let v = 0; v < NV; v++) for (let u = 0; u < NU; u++) { const a = i0 + v * (NU + 1) + u, d = a + NU + 1; b.i.push(a, a + 1, d, d, a + 1, d + 1); }
  }
  function sign(x, y, z, w, h, yaw, idx, both) {
    const b = bk('sign', z), co = Math.cos(yaw), s = Math.sin(yaw), cx = idx % 8, cy = (idx / 8) | 0, u0 = cx / 8, u1 = u0 + .125, v1 = 1 - cy / 16, v0 = v1 - .0625, WH = { r: 1, g: 1, b: 1 };
    const P = (lx, lz) => [x + lx * co + lz * s, z - lx * s + lz * co], A = P(-w / 2, .06), Bq = P(w / 2, .06);
    quad(b, A[0], y, A[1], Bq[0], y, Bq[1], Bq[0], y + h, Bq[1], A[0], y + h, A[1], WH, u0, v0, u1, v1);
    if (both) { const C = P(w / 2, -.06), D = P(-w / 2, -.06); quad(b, C[0], y, C[1], D[0], y, D[1], D[0], y + h, D[1], C[0], y + h, C[1], WH, u0, v0, u1, v1); }
    else box('paint', x, y - .05, z, w + .1, h + .1, .08, yaw, K.steel);
  }

  /* ---------- palette ---------- */
  const K = {};
  Object.entries({ lat: 0xffa086, latD: 0xd88468, white: 0xe8e4d8, cream: 0xe6d7a8, yellow: 0xe0b848, blue: 0x7fb4cf, pink: 0xd99a9a, green: 0x8fc49a, teal: 0x4fa39a, tile: 0xfff4ec, tileD: 0xb8a898, conc: 0x86837a, concD: 0x77746c, wood: 0x6a4a30, woodD: 0x3e2a1c, steel: 0x6c7076, dark: 0x14161a, black: 0x1a1a1c, red: 0xb8281e, gold: 0xc9a23a, ksrtc: 0xc62828, sheet: 0x8a9096, rust: 0x8a4a2a, tarp: 0x2f5fae, sandc: 0xc8b48a, autoY: 0xe8b818, glow: 0xffd890, stone: 0x5c5850 }).forEach(([k, v]) => K[k] = col(v));
  const WALLS = ['white', 'cream', 'yellow', 'blue', 'pink', 'green', 'white', 'cream'];
  const lw = (o, lx, lz) => [o.x + lx * o.c + lz * o.s, o.z - lx * o.s + lz * o.c];
  const O = (x, z, yaw) => ({ x, z, yaw, c: Math.cos(yaw), s: Math.sin(yaw) });
  const houses = [];
  const palms = [], blobs = [];

  /* ---------- builders ---------- */
  function house(x, z, yaw, w, d, tint, o = {}) {
    const g = G.hAt(x, z), y0 = g - .4, t = O(x, z, yaw), wh = o.h || 3.1;
    box('lat', x, y0, z, w + .5, .8, d + .5, yaw, K.lat);
    box('plaster', x, y0 + .8, z, w, wh, d, yaw, K[tint]);
    hip('tile', x, y0 + .8 + wh, z, w + 1.6, d + 1.6, 1.9 + d * .09, yaw, R() < .25 ? K.tileD : K.tile);
    let p = lw(t, 0, d / 2 + .03); box('wood', p[0], y0 + .8, p[1], 1, 2.05, .08, yaw, K.woodD);
    for (const sx of [-w * .3, w * .3]) { p = lw(t, sx, d / 2 + .03); box('dark', p[0], y0 + 1.8, p[1], 1.1, 1.1, .08, yaw, o.lit && R() < .5 ? K.glow : K.dark); }
    p = lw(t, w / 2 + .03, 0); box('dark', p[0], y0 + 1.8, p[1], .08, 1.1, 1.1, yaw, K.dark);
    for (const sx of [-w * .3, w * .3]) { p = lw(t, sx, d / 2 + .3); box('plaster', p[0], y0 + 2.98, p[1], 1.75, .07, .6, yaw, K.white); }
    p = lw(t, w / 2 + .3, 0); box('plaster', p[0], y0 + 2.98, p[1], .6, .07, 1.75, yaw, K.white);
    for (const sx of [-w * .25, w * .25]) { p = lw(t, sx, -d / 2 - .03); box('dark', p[0], y0 + 1.8, p[1], 1, 1.05, .08, yaw, K.dark); p = lw(t, sx, -d / 2 - .1); box('paint', p[0], y0 + 1.7, p[1], 1.3, .1, .16, yaw, K.conc); p = lw(t, sx, -d / 2 - .3); box('plaster', p[0], y0 + 2.98, p[1], 1.6, .07, .6, yaw, K.white); }
    p = lw(t, -w / 2 - .03, 0); box('dark', p[0], y0 + 1.8, p[1], .08, 1.05, 1, yaw, K.dark); p = lw(t, -w / 2 - .3, 0); box('plaster', p[0], y0 + 2.98, p[1], .6, .07, 1.6, yaw, K.white);
    // sit-out porch
    p = lw(t, 0, d / 2 + 1.3); hip('tile', p[0], y0 + 3.1, p[1], 4.2, 3, .9, yaw, K.tile); box('lat', p[0], y0, p[1], 3.6, .75, 2.4, yaw, K.latD);
    for (const sx of [-1.6, 1.6]) { const q = lw(t, sx, d / 2 + 2.3); cyl('paint', q[0], y0 + .7, q[1], .11, .11, 2.4, 6, K.white); G.addCircle(q[0], q[1], .14, y0 + 3.2); }
    // detail: shutters, sills, grilles, door frame, steps, eave boards, water tank, tulsi thara, compound wall, upper storey
    for (const sx of [-w * .3, w * .3]) { for (const sd of [-.72, .72]) { p = lw(t, sx + sd, d / 2 + .06); box('wood', p[0], y0 + 1.74, p[1], .3, 1.22, .05, yaw, R() < .5 ? K.woodD : K.wood); } p = lw(t, sx, d / 2 + .1); box('paint', p[0], y0 + 1.68, p[1], 1.5, .1, .16, yaw, K.conc); for (let i = -1; i <= 1; i++) { const q = lw(t, sx + i * .28, d / 2 + .07); box('paint', q[0], y0 + 1.8, q[1], .03, 1.1, .03, yaw, K.black); } }
    p = lw(t, 0, d / 2 + .05); box('wood', p[0], y0 + .8, p[1], 1.24, 2.2, .06, yaw, K.wood); p = lw(t, 0, d / 2 + 2.9); box('lat', p[0], y0, p[1], 2.2, .4, .8, yaw, K.latD);
    for (const q of [[0, d / 2 + .78, w + 1.5, .1], [0, -d / 2 - .78, w + 1.5, .1], [w / 2 + .78, 0, .1, d + 1.5], [-w / 2 - .78, 0, .1, d + 1.5]]) { p = lw(t, q[0], q[1]); box('wood', p[0], y0 + .62 + wh, p[1], q[2], .2, q[3], yaw, K.woodD); }
    const rv = R();
    if (rv < .5) { p = lw(t, -w / 2 - 1.6, -d / 4); for (const q of [[-.5, -.5], [.5, -.5], [-.5, .5], [.5, .5]]) { const u = lw(t, -w / 2 - 1.6 + q[0], -d / 4 + q[1]); cyl('paint', u[0], y0, u[1], .05, .05, 3.6, 4, K.steel); } cyl('paint', p[0], y0 + 3.6, p[1], .75, .7, 1.2, 10, K.black, true); G.addCircle(p[0], p[1], .8, y0 + 4.8); }
    if (rv > .35) { p = lw(t, -w * .32, d / 2 + 4.2); box('plaster', p[0], y0 + .3, p[1], .8, .9, .8, yaw, K.white); box('plaster', p[0], y0 + 1.2, p[1], .5, .3, .5, yaw, K.white); blobs.push([p[0], y0 + 1.9, p[1], .45, .55, .45, 0x3a7a2a]); G.addCircle(p[0], p[1], .5, y0 + 1.6); }
    if (!o.nowall && rv > .2 && rv < .85) { const fz = d / 2 + 6.2, hw2 = w / 2 + 2.5; for (const sx of [-1, 1]) { const a0 = lw(t, sx * hw2, fz), a1 = lw(t, sx * 1.6, fz), sB = lw(t, sx * hw2, d / 2 - 1); wall(a0[0], a0[1], a1[0], a1[1], 1.25, .3, 'lat', K.lat); box('lat', a1[0], G.hAt(a1[0], a1[1]) - .3, a1[1], .5, 2.1, .5, yaw, K.latD); wall(a0[0], a0[1], sB[0], sB[1], 1.25, .3, 'lat', K.lat); } }
    if (rv > .7) { box('plaster', x, y0 + .8 + wh, z, w * .62, 2.7, d * .7, yaw, K[tint]); hip('tile', x, y0 + 3.5 + wh, z, w * .62 + 1.4, d * .7 + 1.4, 1.6, yaw, K.tile); p = lw(t, 0, d * .35 + .04); box('dark', p[0], y0 + 1.6 + wh, p[1], 1.2, 1.1, .08, yaw, K.dark); p = lw(t, 0, d * .35 + .7); box('paint', p[0], y0 + .78 + wh, p[1], w * .62, .1, 1.3, yaw, K.conc); p = lw(t, 0, d * .35 + 1.32); box('paint', p[0], y0 + .88 + wh, p[1], w * .62, .8, .06, yaw, K.woodD); }
    G.addBox(x, z, w / 2, d / 2, yaw, y0, y0 + 6.5, 'house');
    houses.push([x, z, Math.max(w, d) / 2 + 3]);
    p = lw(t, w * .3, d / 2 + 2.6); G.lootPts.push({ x: p[0], z: p[1], kind: 'house' });
  }
  function shop(x, z, yaw, sgn, tint, kind) {
    const g = G.hAt(x, z), y0 = g - .3, t = O(x, z, yaw), w = 7.4, d = 6;
    box('plaster', x, y0, z, w, 3.7, d, yaw, K[tint || 'cream']);
    box('paint', x, y0 + 3.7, z, w + .3, .25, d + .3, yaw, K.concD);
    let p = lw(t, 0, d / 2 + .04); box('paint', p[0], y0 + .35, p[1], w - 1.2, 2.5, .1, yaw, R() < .5 ? K.sheet : K.dark);
    p = lw(t, 0, d / 2 + 1.1); box('paint', p[0], y0 + 3.0, p[1], w, .08, 2.2, yaw, rp([K.sheet, K.tarp, K.rust]));
    if (sgn >= 0) { p = lw(t, 0, d / 2 + .12); sign(p[0], y0 + 3.75, p[1], 5.2, 1.3, yaw, sgn, false); }
    G.addBox(x, z, w / 2, d / 2, yaw, y0, y0 + 4.2, 'shop');
    houses.push([x, z, 6]);
    p = lw(t, 1.5, d / 2 + 1.4); G.lootPts.push({ x: p[0], z: p[1], kind: kind || 'shop' });
  }
  function bakery(x, z, yaw, sgn) {
    const g = G.hAt(x, z), y0 = g - .3, t = O(x, z, yaw), w = 8.4, d = 6.4;
    box('plaster', x, y0, z, w, 3.9, d, yaw, K.cream); box('paint', x, y0 + 3.9, z, w + .3, .25, d + .3, yaw, K.concD);
    let p = lw(t, 0, d / 2 + .04); box('glow', p[0], y0 + .9, p[1], w - 1.4, 2.2, .1, yaw, K.glow); p = lw(t, 0, d / 2 + .08); box('paint', p[0], y0 + .3, p[1], w - 1.2, .6, .1, yaw, K.wood);
    for (let i = 0; i < 8; i++) { p = lw(t, -w / 2 + .55 + i * 1.05, d / 2 + 1.0); box('paint', p[0], y0 + 3.05, p[1], 1.05, .07, 2.0, yaw, i % 2 ? K.red : K.white); }
    p = lw(t, 0, d / 2 + .95); box('paint', p[0], y0 + .3, p[1], w - 2.4, .9, .7, yaw, K.wood); G.addBox(p[0], p[1], (w - 2.4) / 2, .35, yaw, y0, y0 + 1.3);
    for (let i = 0; i < 6; i++) { p = lw(t, -2.4 + i * .95, d / 2 + .95); box('paint', p[0], y0 + 1.2, p[1], .5, .2 + (i % 3) * .08, .45, yaw, [K.pink, K.cream, K.wood, K.white, K.yellow, K.red][i]); }
    p = lw(t, 0, d / 2 + .12); sign(p[0], y0 + 3.95, p[1], 6.4, 1.5, yaw, sgn, false);
    G.addBox(x, z, w / 2, d / 2, yaw, y0, y0 + 4.4, 'shop'); houses.push([x, z, 6.5]); p = lw(t, 2.6, d / 2 + 2.2); G.lootPts.push({ x: p[0], z: p[1], kind: 'bakery' });
  }
  function tower(x, z, yaw, w, d, fl, tint) {
    const g = G.hAt(x, z), y0 = g - .4, t = O(x, z, yaw), H = fl * 3.2 + .6;
    box('plaster', x, y0, z, w, H, d, yaw, K[tint]);
    box('paint', x, y0 + H, z, w + .2, .7, d + .2, yaw, K.concD);
    for (let f = 0; f < fl; f++) for (let b = 0; b < Math.floor(w / 3); b++) for (const sd of [1, -1]) { const lx = -w / 2 + 1.5 + b * 3 + (w % 3) / 2, p = lw(t, lx, sd * (d / 2 + .03)); if (f === 0 && sd === 1) box('paint', p[0], y0 + .5, p[1], 2.4, 2.4, .08, yaw, R() < .5 ? K.sheet : K.dark); else box('dark', p[0], y0 + 1.7 + f * 3.2, p[1], 1.5, 1.3, .08, yaw, R() < .06 ? K.glow : K.dark); }
    const p = lw(t, w * .2, -d * .2); cyl('paint', p[0], y0 + H + .7, p[1], .8, .8, 1.3, 10, K.black, true);
    G.addBox(x, z, w / 2, d / 2, yaw, y0, y0 + H + 1, 'tower');
    houses.push([x, z, Math.max(w, d) / 2 + 2]);
    const q = lw(t, 0, d / 2 + 1.5); G.lootPts.push({ x: q[0], z: q[1], kind: 'shop' });
  }
  function shed(x, z, yaw, w, d, h, roofC, tiled) {
    const g = G.hAt(x, z), t = O(x, z, yaw);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const p = lw(t, sx * (w / 2 - .3), sz * (d / 2 - .3)); cyl('paint', p[0], g - .3, p[1], .1, .1, h + .3, 6, K.wood); G.addCircle(p[0], p[1], .14, g + h); }
    if (tiled) hip('tile', x, g + h, z, w + 1, d + 1, 1.3, yaw, K.tile); else box('paint', x, g + h, z, w + .8, .1, d + .8, yaw, roofC || K.sheet);
  }
  function auto(x, z, yaw) {
    const g = G.hAt(x, z), t = O(x, z, yaw);
    box('paint', x, g + .35, z, 1.35, .95, 1.9, yaw, K.black); let p = lw(t, 0, 1.2); box('paint', p[0], g + .35, p[1], .9, .8, .6, yaw, K.black);
    box('paint', x, g + 1.3, z, 1.4, .45, 2.0, yaw, K.autoY); p = lw(t, 0, 1.0); box('dark', p[0], g + 1.25, p[1], 1.0, .5, .1, yaw, K.dark);
    for (const q of [[0, 1.3], [-.65, -.7], [.65, -.7]]) { p = lw(t, q[0], q[1]); box('dark', p[0], g, p[1], .16, .5, .5, yaw, K.dark); }
    G.addCircle(x, z, 1.15, g + 1.8, 'car');
  }
  function car(x, z, yaw, c) {
    const g = G.hAt(x, z), t = O(x, z, yaw);
    box('paint', x, g + .3, z, 1.7, .65, 4.1, yaw, c); const p = lw(t, 0, -.2); box('dark', p[0], g + .95, p[1], 1.5, .55, 2.1, yaw, K.dark); box('paint', p[0], g + 1.5, p[1], 1.52, .06, 2.0, yaw, c);
    for (const sx of [-.8, .8]) for (const sz of [-1.3, 1.3]) { const q = lw(t, sx, sz); box('dark', q[0], g, q[1], .2, .6, .6, yaw, K.dark); }
    G.addBox(x, z, .9, 2.1, yaw, g - 1, g + 1.6, 'car');
  }
  function bus(x, z, yaw, c, c2) {
    const g = G.hAt(x, z), t = O(x, z, yaw);
    box('paint', x, g + .5, z, 2.5, 1.2, 9.4, yaw, c); box('dark', x, g + 1.7, z, 2.52, .85, 9.0, yaw, K.dark); box('paint', x, g + 2.55, z, 2.5, .4, 9.4, yaw, c2 || K.white); box('paint', x, g + 1.1, z, 2.54, .18, 9.42, yaw, c2 || K.autoY);
    for (const sx of [-1.2, 1.2]) for (const sz of [-3, 3]) { const q = lw(t, sx, sz); box('dark', q[0], g, q[1], .26, .9, .9, yaw, K.dark); }
    G.addBox(x, z, 1.3, 4.75, yaw, g - 1, g + 3, 'car');
  }
  function boat(x, z, yaw, len, c, y) {
    const g = y === undefined ? G.hAt(x, z) : y;
    ball('paint', x, g + .35, z, .75, .6, len / 2, yaw, c); box('dark', x, g + .52, z, 1.0, .12, len * .7, yaw, K.woodD);
    ball('paint', x, g + .5, z, .78, .12, len / 2 + .05, yaw, rp([K.white, K.autoY, K.red]));
    G.addBox(x, z, .8, len / 2, yaw, g - 1, g + 1.0, 'boat');
  }
  function pole(x, z, lamp) {
    const g = G.hAt(x, z); cyl('paint', x, g - .3, z, .12, .09, 7.5, 6, K.concD); box('paint', x, g + 6.6, z, 1.8, .1, .1, R() * 3, K.woodD);
    if (lamp) { box('paint', x + .5, g + 6.0, z, 1.2, .08, .08, 0, K.steel); box('glow', x + 1, g + 5.9, z, .5, .1, .25, 0, K.glow); G.lamps.push([x + 1, g + 5.8, z]); }
    G.addCircle(x, z, .16, g + 7.2, 'pole');
  }
  function wall(x0, z0, x1, z1, h, th, name, c, y) {
    const L = Math.hypot(x1 - x0, z1 - z0), yaw = Math.atan2(-(z1 - z0), x1 - x0), mx = (x0 + x1) / 2, mz = (z0 + z1) / 2;
    let g = y; if (g === undefined) g = Math.min(G.hAt(x0, z0), G.hAt(x1, z1), G.hAt(mx, mz)) - .5;
    const top = (y === undefined ? Math.max(G.hAt(x0, z0), G.hAt(x1, z1), G.hAt(mx, mz)) : y) + h;
    box(name || 'lat', mx, g, mz, L, top - g, th, yaw, c || K.lat, .35);
    return G.addBox(mx, mz, L / 2, th / 2, yaw, g, top, 'wall');
  }
  function tree(x, z, s) {
    const g = G.hAt(x, z); cyl('bark', x, g - .3, z, .28 * s, .18 * s, 3.2 * s, 8, K.woodD); cyl('bark', x + .5 * s, g + 2.2 * s, z, .1 * s, .05 * s, 1.6 * s, 5, K.woodD); cyl('bark', x - .4 * s, g + 2.4 * s, z + .3 * s, .09 * s, .05 * s, 1.4 * s, 5, K.woodD); G.addCircle(x, z, .3 * s, g + 3 * s, 'tree');
    const gc = [0x2f5a22, 0x3a6a26, 0x274d1e, 0x40702a];
    for (let i = 0; i < 4; i++) blobs.push([x + rr(-1.6, 1.6) * s, g + (3.4 + rr(0, 1.8)) * s, z + rr(-1.6, 1.6) * s, rr(1.8, 2.8) * s, rr(1.4, 2) * s, rr(1.8, 2.8) * s, rp(gc)]);
  }
  function temple(x, z, sgnIdx) {
    const g = G.hAt(x, z);
    wall(x - 13, z - 13, x + 13, z - 13, 1.6, .5); wall(x - 13, z + 13, x - 3, z + 13, 1.6, .5); wall(x + 3, z + 13, x + 13, z + 13, 1.6, .5); wall(x - 13, z - 13, x - 13, z + 13, 1.6, .5); wall(x + 13, z - 13, x + 13, z + 13, 1.6, .5);
    box('lat', x, g - .4, z, 9, 1.3, 9, 0, K.latD); box('paint', x, g + .9, z, 6.4, 2.6, 6.4, 0, K.wood);
    hip('tile', x, g + 3.5, z, 10.5, 10.5, 2.4, 0, K.tile); box('paint', x, g + 5.6, z, 3.4, 1.1, 3.4, 0, K.woodD); hip('tile', x, g + 6.7, z, 5.6, 5.6, 2.2, 0, K.tileD);
    cyl('paint', x, g + 8.9, z, .12, .02, 1.1, 6, K.gold);
    cyl('paint', x, g, z + 9, .5, .35, .5, 8, K.stone, true); for (let i = 0; i < 6; i++) cyl('paint', x, g + .5 + i * .5, z + 9, .42 - i * .05, .2, .12, 8, K.gold, true); cyl('paint', x, g + .5, z + 9, .07, .07, 3.2, 6, K.gold, true);
    box('dark', x, g + .9, z + 3.22, 1.2, 2, .08, 0, K.gold);
    G.addBox(x, z, 4.5, 4.5, 0, g - 1, g + 8, 'temple'); G.addCircle(x, z + 9, .5, g + 3.6);
    houses.push([x, z, 16]);
    G.lootPts.push({ x: x + 6, z: z + 8, kind: 'house' });
  }

  /* ---------- textures & materials ---------- */
  function makeMaterials() {
    const d = new Uint8Array(256 * 256 * 4), r = mulberry(7); for (let i = 0; i < d.length; i++) d[i] = (r() * 255) | 0;
    const nt = G.noiseTex = new THREE.DataTexture(d, 256, 256, THREE.RGBAFormat); nt.wrapS = nt.wrapT = THREE.RepeatWrapping; nt.minFilter = THREE.LinearMipmapLinearFilter; nt.magFilter = THREE.LinearFilter; nt.generateMipmaps = true; nt.needsUpdate = true;
    const lat = canvasTex(256, 256, (c, w, h) => {
      c.fillStyle = '#c9c1b8'; c.fillRect(0, 0, w, h);
      for (let j = 0; j < 8; j++) for (let i = -1; i < 4; i++) { const v = 200 + r() * 55; c.fillStyle = `rgb(${v},${v - 8},${v - 14})`; c.fillRect(i * 64 + (j % 2) * 32 + 2, j * 32 + 2, 60, 28); }
      for (let i = 0; i < 2600; i++) { const v = r(); c.fillStyle = v < .6 ? 'rgba(60,20,10,.35)' : 'rgba(255,230,200,.25)'; c.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 2); }
      for (let i = 0; i < 40; i++) { c.fillStyle = 'rgba(30,50,20,.12)'; c.beginPath(); c.arc(r() * w, r() * h, 6 + r() * 18, 0, 7); c.fill(); }
    });
    const plaster = canvasTex(256, 256, (c, w, h) => {
      c.fillStyle = '#f2f0ea'; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 70; i++) { const x = r() * w, l = 30 + r() * 150, g = c.createLinearGradient(0, h - l, 0, h); g.addColorStop(0, 'rgba(40,50,30,0)'); g.addColorStop(1, 'rgba(40,50,30,.22)'); c.fillStyle = g; c.fillRect(x, h - l, 2 + r() * 10, l); }
      for (let i = 0; i < 50; i++) { const x = r() * w, l = 20 + r() * 90, g = c.createLinearGradient(0, 0, 0, l); g.addColorStop(0, 'rgba(30,30,25,.28)'); g.addColorStop(1, 'rgba(30,30,25,0)'); c.fillStyle = g; c.fillRect(x, 0, 2 + r() * 7, l); }
      for (let i = 0; i < 900; i++) { c.fillStyle = 'rgba(90,80,60,.10)'; c.fillRect(r() * w, r() * h, 1 + r() * 4, 1 + r() * 4); }
    });
    const tile = canvasTex(256, 256, (c, w, h) => {
      for (let j = 0; j < 16; j++) { for (let i = 0; i < 16; i++) { const v = .78 + r() * .22; c.fillStyle = `rgb(${255 * v | 0},${240 * v | 0},${228 * v | 0})`; c.fillRect(i * 16, j * 16, 16, 16); const g = c.createLinearGradient(i * 16, 0, i * 16 + 16, 0); g.addColorStop(0, 'rgba(0,0,0,.4)'); g.addColorStop(.3, 'rgba(0,0,0,0)'); g.addColorStop(.8, 'rgba(255,255,255,.12)'); g.addColorStop(1, 'rgba(0,0,0,.3)'); c.fillStyle = g; c.fillRect(i * 16, j * 16, 16, 16); } c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(0, j * 16, w, 2); }
      for (let i = 0; i < 30; i++) { c.fillStyle = 'rgba(25,40,15,.3)'; c.beginPath(); c.arc(r() * w, r() * h, 5 + r() * 20, 0, 7); c.fill(); }
    });
    const paint = canvasTex(64, 64, (c, w, h) => { c.fillStyle = '#fff'; c.fillRect(0, 0, w, h); for (let i = 0; i < 300; i++) { c.fillStyle = `rgba(0,0,0,${r() * .1})`; c.fillRect(r() * w, r() * h, 2, 2); } });
    const SG = [['കണ്ണൂർ', 'KANNUR  8', '#0d6b3a'], ['തളാപ്പ്', 'THALAP', '#0d6b3a'], ['പയ്യാമ്പലം ബീച്ച്', 'PAYYAMBALAM BEACH', '#1d4f91'], ['പയ്യന്നൂർ', 'PAYYANUR', '#0d6b3a'],
    ['കണ്ണൂർ കോട്ട', 'ST. ANGELO FORT', '#6b3a1a'], ['മാപ്പിള ബേ', 'MAPPILA BAY HARBOUR', '#1d4f91'], ['ചായക്കട', 'TEA · SNACKS', '#c9a020'], ['തളാപ്പ് മെഡിക്കൽസ്', 'THALAP MEDICALS', '#157a4a'],
    ['കവ്വായി', 'KAVVAYI BOAT JETTY', '#1d4f91'], ['ഏഴിമല', 'EZHIMALA', '#0d6b3a'], ['ബസ് സ്റ്റാൻഡ്', 'BUS STAND', '#b02a20'], ['മത്സ്യ മാർക്കറ്റ്', 'FISH MARKET', '#1a6a8a'],
    ['ഹോട്ടൽ ശ്രീകൃഷ്ണ', 'MEALS READY', '#a02a2a'], ['കെ.എസ്.ആർ.ടി.സി', 'KSRTC', '#c62828'], ['പെരുമ്പ പാലം', 'PERUMBA BRIDGE', '#0d6b3a'], ['ലൈറ്റ് ഹൗസ്', 'LIGHTHOUSE', '#1d4f91'],
    ['അപകടം!', 'DANGER · INFECTED ZONE', '#c01010'], ['ബേക്കറി', 'MALABAR BAKERY', '#b0601a'], ['പെട്രോൾ', 'PETROL · DIESEL', '#1a3a8a'], ['റേഷൻ കട', 'RATION SHOP', '#555'],
    ['ദൈവമേ കാക്കണേ', 'GOD SAVE US', '#201010'], ['പോലീസ്', 'POLICE', '#1a2a5a'], ['തുണിക്കട', 'KANNUR HANDLOOM', '#7a2a6a'], ['ക്ലിനിക്', 'CLINIC  +', '#157a4a'],
    ['പച്ചക്കറി', 'VEGETABLES', '#2a7a2a'], ['മൊബൈൽസ്', 'MOBILES · RECHARGE', '#d04a10'], ['സ്വർണ്ണം', 'JEWELLERY', '#8a6a10'], ['ഹാർഡ്‌വെയർ', 'HARDWARE · TOOLS', '#4a4a4a'],
    ['പയ്യന്നൂർ', 'PAYYANUR  35', '#0d6b3a'], ['നാവിക അക്കാദമി', 'NAVAL STATION', '#12305a'], ['സുരക്ഷിത മേഖല', 'SAFE ZONE →', '#c9a020'], ['ഐസ് പ്ലാന്റ്', 'ICE PLANT', '#3a7a9a'],
    ['കണ്ണൂർ', 'KANNUR JN.', '#e8c020', '#111'], ['വിമാനത്താവളം', 'KANNUR INTERNATIONAL AIRPORT', '#12305a'], ['മലബാർ ബേക്കറി', 'MALABAR BAKERY · CAKES', '#b0401a'], ['കേക്ക്സ് & ബേക്ക്സ്', 'KANNUR CAKES & BAKES', '#7a1a4a'],
    ['ഹൽവ ഹൗസ്', 'HALWA HOUSE · SWEETS', '#c97a10'], ['കിണ്ണത്തപ്പം', 'KINNATHAPPAM · SNACKS', '#2a6a3a'], ['തലശ്ശേരി ബിരിയാണി', 'THALASSERY BIRIYANI', '#a02a2a'], ['കൂൾ ബാർ', 'COOL BAR · FRESH JUICE', '#1a7a9a'],
    ['കാൽടെക്സ്', 'CALTEX JUNCTION', '#1d4f91'], ['ഫോർട്ട് റോഡ്', 'FORT ROAD', '#1d4f91'], ['സ്റ്റേഷൻ റോഡ്', 'STATION ROAD', '#1d4f91'], ['സൗത്ത് ബസാർ', 'SOUTH BAZAR', '#1d4f91'],
    ['താവക്കര', 'THAVAKKARA BUS STAND', '#b02a20'], ['അറക്കൽ മ്യൂസിയം', 'ARAKKAL MUSEUM', '#6b3a1a'], ['വിമാനത്താവളം →', 'AIRPORT · MATTANNUR', '#0d6b3a'], ['റെയിൽവേ സ്റ്റേഷൻ', 'RAILWAY STATION', '#0d6b3a'],
    ['പള്ളിക്കുന്ന്', 'PALLIKKUNNU', '#1d4f91'], ['ചിറക്കൽ', 'CHIRAKKAL', '#1d4f91'], ['പുറപ്പെടൽ', 'DEPARTURES', '#12305a'], ['കൈത്തറി', 'LAND OF LOOMS AND LORES', '#7a2a6a'], ['വരുണ', 'VARUNA BIOMARINE · COLD CHAIN', '#0e3a4a']];
    const signT = canvasTex(2048, 2048, (c, w, h) => {
      c.fillStyle = '#333'; c.fillRect(0, 0, w, h); c.textAlign = 'center'; c.textBaseline = 'middle';
      SG.forEach((s, i) => { const x = (i % 8) * 256, y = ((i / 8) | 0) * 128; c.fillStyle = s[2]; c.fillRect(x, y, 256, 128); c.strokeStyle = s[3] || 'rgba(255,255,255,.85)'; c.lineWidth = 4; c.strokeRect(x + 6, y + 6, 244, 116); c.fillStyle = s[3] || '#fff'; c.font = 'bold 40px "Nirmala UI","Noto Sans Malayalam","Kartika",sans-serif'; c.fillText(s[0], x + 128, y + 46, 230); c.font = 'bold 21px Arial,sans-serif'; c.fillText(s[1], x + 128, y + 94, 230); for (let k = 0; k < 25; k++) { c.fillStyle = 'rgba(40,25,10,.18)'; c.fillRect(x + r() * 256, y + r() * 128, 2 + r() * 14, 1 + r() * 5); } });
    }, { repeat: false, aniso: 8 });
    const M = G.mats = {
      lat: new THREE.MeshStandardMaterial({ map: lat, vertexColors: true, roughness: .95, metalness: 0 }),
      plaster: new THREE.MeshStandardMaterial({ map: plaster, vertexColors: true, roughness: .9, metalness: 0 }),
      tile: new THREE.MeshStandardMaterial({ map: tile, vertexColors: true, roughness: .8, metalness: 0 }),
      paint: new THREE.MeshStandardMaterial({ map: paint, vertexColors: true, roughness: .6, metalness: .05 }),
      dark: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .25, metalness: .2 }),
      glow: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .5, emissive: col(0xffc060), emissiveIntensity: 0 }),
      sign: new THREE.MeshStandardMaterial({ map: signT, vertexColors: true, roughness: .7 })
    };
    const TL = new THREE.TextureLoader(), T = G.T = (n, srgb) => { const t = TL.load('assets/tex/' + n + '.jpg'); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; if (srgb) t.encoding = THREE.sRGBEncoding; return t; };
    M.lat.map = T('large_sandstone_blocks_01_diff', 1); M.lat.normalMap = T('large_sandstone_blocks_01_nor_gl'); M.lat.color.setScalar(1.5);
    M.plaster.map = T('painted_plaster_wall_diff', 1); M.plaster.normalMap = T('painted_plaster_wall_nor_gl'); M.plaster.color.setScalar(1.3); M.plaster.normalScale.set(.6, .6);
    M.tile.map = T('clay_roof_tiles_02_diff', 1); M.tile.normalMap = T('clay_roof_tiles_02_nor_gl'); M.tile.color.setScalar(1.5);
    M.wood = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .85, map: T('distressed_painted_planks_diff', 1), normalMap: T('distressed_painted_planks_nor_gl') }); M.wood.color.setScalar(1.7);
    M.bark = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .95, map: T('bark_brown_02_diff', 1), normalMap: T('bark_brown_02_nor_gl') }); M.bark.color.setScalar(2.2);
    { const peel = T('peeling_painted_wall_diff', 1), peelN = T('peeling_painted_wall_nor_gl');
      M.plaster.onBeforeCompile = sh => { sh.uniforms.tPeel = { value: peel }; sh.uniforms.tNz = { value: G.noiseTex };
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWp;').replace('#include <project_vertex>', '#include <project_vertex>\nvWp = (modelMatrix * vec4(transformed, 1.0)).xyz;');
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D tPeel, tNz; varying vec3 vWp;').replace('#include <map_fragment>', `#include <map_fragment>
          float nA = texture2D(tNz, vWp.xz * .009 + vWp.y * .004).r * .6 + texture2D(tNz, (vWp.xz + vWp.y) * .06).r * .4;
          float peelM = smoothstep(.62, .74, nA) * .6;
          vec3 pc = texture2D(tPeel, vUv * .8).rgb; pc *= pc; pc = mix(vec3(dot(pc, vec3(.3, .59, .11))), pc, .5);
          diffuseColor.rgb = mix(diffuseColor.rgb, diffuse * pc * 1.15, peelM * .9);
          float sk = texture2D(tNz, vec2((vWp.x + vWp.z) * .5, vWp.y * .012)).r;
          diffuseColor.rgb *= 1. - smoothstep(.6, .93, sk) * .3;`); };
      M.plaster.customProgramCacheKey = () => 'plasterPeel'; }
    return M;
  }

  /* ---------- terrain ---------- */
  function buildTerrain(scene) {
    // mask: R road, G dirt, B paddy  (2 m per pixel)
    const mc = document.createElement('canvas'); mc.width = W.SX / 2; mc.height = W.SZ / 2; const c = mc.getContext('2d');
    c.fillStyle = '#000'; c.fillRect(0, 0, mc.width, mc.height); c.globalCompositeOperation = 'lighter'; c.lineCap = c.lineJoin = 'round';
    const px = x => (x - W.X0) / 2, pz = z => (z - W.Z0) / 2;
    c.fillStyle = '#0000ff'; c.fillRect(px(122), pz(-448), (290 - 122) / 2, (448 - 132) / 2);
    const road = G.roads = [];
    const line = (pts, w, ch) => { road.push({ pts, w, ch }); c.strokeStyle = ch === 'g' ? '#00ff00' : '#ff0000'; c.lineWidth = w / 2; c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(px(p[0]), pz(p[1])) : c.moveTo(px(p[0]), pz(p[1]))); c.stroke(); };
    let pts = []; for (let z = -1010; z <= 1010; z += 20) pts.push([G.hwx(z), z]); line(pts, 11, 'r');
    line([[339, 100], [95, 100]], 7, 'r');
    pts = []; for (let z = 100; z <= 500; z += 20) pts.push([G.coast(z) + 72, z]); pts.push([80, 540], [110, 620], [125, 690]); line(pts, 6, 'r');
    line([[360, 540], [80, 540], [56, 558]], 6, 'r'); line([[356, 690], [100, 690]], 7, 'r');
    line([[250, 380], [470, 380]], 8, 'r'); line([[250, 460], [470, 460]], 8, 'r'); line([[410, 350], [410, 500]], 7, 'r'); line([[262, 420], [372, 420]], 7, 'r'); line([[300, 380], [300, 540]], 6, 'r'); line([[306, -290], [452, -290]], 8, 'r'); line([[545, -422], [545, -160]], 30, 'r'); line([[476, -290], [545, -290]], 60, 'r'); line([[476, -370], [476, -210]], 10, 'r'); line([[436, -250], [436, -84], [456, -84]], 7, 'r'); line([[250, 330], [250, 905]], 5, 'g');
    line([[200, -700], [480, -700]], 8, 'r'); line([[380, -820], [380, -640]], 7, 'r'); line([[200, -700], [186, -720]], 5, 'r');
    line([[230, 128], [230, 102]], 5, 'g'); line([[186, -722], [186, -780]], 3, 'g'); line([[55, -780], [20, -820], [-30, -860], [-70, -885], [-90, -900]], 3.5, 'g');
    line([[300, -290], [200, -290]], 3, 'g'); line([[200, -290], [200, -130], [215, 84]], 2.5, 'g'); line([[72, 258], [100, 262]], 4, 'g');
    c.fillStyle = '#00ff00'; c.fillRect(px(208), pz(128), 22, 22); c.beginPath(); c.arc(px(200), pz(-290), 9, 0, 7); c.fill(); c.fillRect(px(-28), pz(522), 38, 38); c.fillRect(px(368), pz(398), 19, 22);
    c.beginPath(); c.arc(px(72), pz(260), 8, 0, 7); c.fill(); c.fillRect(px(100), pz(668), 34, 26);
    const md = c.getImageData(0, 0, mc.width, mc.height).data;
    G.maskAt = (x, z) => { const i = clamp(px(x) | 0, 0, mc.width - 1), j = clamp(pz(z) | 0, 0, mc.height - 1), k = (j * mc.width + i) * 4; return md[k] > 90 ? 1 : md[k + 1] > 90 ? 2 : md[k + 2] > 90 ? 3 : 0; };
    const mt = new THREE.CanvasTexture(mc); mt.flipY = false; mt.minFilter = THREE.LinearFilter; mt.generateMipmaps = false;
    // mesh
    const n = (NX + 1) * (NZ + 1), pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), idx = new Uint32Array(NX * NZ * 6);
    for (let j = 0, k = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++, k++) {
      const x = W.X0 + i * W.CELL, z = W.Z0 + j * W.CELL; pos[k * 3] = x; pos[k * 3 + 1] = HG[k]; pos[k * 3 + 2] = z;
      const hx = HG[j * (NX + 1) + Math.max(i - 1, 0)] - HG[j * (NX + 1) + Math.min(i + 1, NX)], hz = HG[Math.max(j - 1, 0) * (NX + 1) + i] - HG[Math.min(j + 1, NZ) * (NX + 1) + i], l = Math.hypot(hx, 10, hz);
      nor[k * 3] = hx / l; nor[k * 3 + 1] = 10 / l; nor[k * 3 + 2] = hz / l;
    }
    for (let j = 0, q = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i, b = a + 1, d = a + NX + 1, e = d + 1; idx[q++] = a; idx[q++] = d; idx[q++] = b; idx[q++] = b; idx[q++] = d; idx[q++] = e; }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); geo.setIndex(new THREE.BufferAttribute(idx, 1));
    const mat = new THREE.MeshStandardMaterial({ roughness: .95, metalness: 0 });
    G.terrU = { tMask: { value: mt }, tNoise: { value: G.noiseTex }, uWet: { value: 0 }, tSand: { value: G.T('coast_sand_01_diff') }, tSandN: { value: G.T('coast_sand_01_nor_gl') }, tGrass: { value: G.T('leafy_grass_diff') }, tGrassN: { value: G.T('leafy_grass_nor_gl') }, tSoil: { value: G.T('red_laterite_soil_stones_diff') }, tSoilN: { value: G.T('red_laterite_soil_stones_nor_gl') }, tRoad: { value: G.T('asphalt_02_diff') }, tRoadN: { value: G.T('asphalt_02_nor_gl') } };
    mat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, G.terrU);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWp; varying vec3 vWn;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvWp = (modelMatrix*vec4(transformed,1.)).xyz; vWn = normal;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWp; varying vec3 vWn; uniform sampler2D tMask,tNoise,tSand,tSandN,tGrass,tGrassN,tSoil,tSoilN,tRoad,tRoadN; uniform float uWet; float terrRough=1.; vec3 terrN=vec3(0.);')
        .replace('#include <map_fragment>', `
        vec2 muv = vec2((vWp.x+560.)/1240., (vWp.z+1010.)/2020.); vec4 mk = texture2D(tMask, muv);
        float n1 = texture2D(tNoise, vWp.xz*.0035).r, n2 = texture2D(tNoise, vWp.xz*.0005).g, n3 = texture2D(tNoise, vWp.xz*.00008+.5).b;
        float h = vWp.y; vec2 uvg = vWp.xz;
        float wetS = 1. - smoothstep(.1,.85,h + n2*.3);
        float sandy = 1. - smoothstep(2.2, 3.0, h + n2*.6 - .2);
        float grassy = smoothstep(.3,.55, n3*.5+n2*.4+n1*.25);
        float rd = smoothstep(.35,.6, mk.r + (n1-.5)*.3), dirt = mk.g*(.55+.45*n1);
        float wSand = sandy*(1.-rd)*(1.-dirt), wGrass = (1.-sandy)*grassy*(1.-rd)*(1.-dirt), wSoil = (1.-rd) - wSand - wGrass;
        vec3 ts = texture2D(tSand, uvg*.23).rgb, tg = texture2D(tGrass, uvg*.2).rgb, to = texture2D(tSoil, uvg*.18).rgb, tr = texture2D(tRoad, uvg*.16).rgb;
        vec3 c = ts*ts*vec3(1.75,1.6,1.35)*mix(1.,.5,wetS)*wSand + tg*tg*mix(vec3(.34,.95,.26), vec3(.6,1.1,.28), n2)*wGrass + to*to*vec3(1.9,1.3,1.1)*wSoil + tr*tr*.42*rd;
        terrN = (texture2D(tSandN, uvg*.23).xyz*2.-1.)*wSand + (texture2D(tGrassN, uvg*.2).xyz*2.-1.)*wGrass + (texture2D(tSoilN, uvg*.18).xyz*2.-1.)*wSoil + (texture2D(tRoadN, uvg*.16).xyz*2.-1.)*rd;
        c *= .78 + .44*n2;
        c = mix(c, c*vec3(.8,1.,.65), .5*smoothstep(8.,20.,h));
        vec3 paddy = mix(vec3(.07,.22,.02), vec3(.18,.34,.05), n1) * (.8+.2*sin(vWp.x*4.));
        c = mix(c, paddy, mk.b*(1.-rd));
        terrRough = mix(.95, .8, rd);
        terrRough = mix(terrRough, .22, wetS*sandy);
        c *= mix(1., .6, uWet*(1.-sandy*.5));
        terrRough = mix(terrRough, mix(.4, .08, step(.5,n1)*max(rd,mk.g)), uWet*.9);
        diffuseColor.rgb = c;`)
        .replace('#include <roughnessmap_fragment>', 'float roughnessFactor = terrRough;').replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n normal = normalize((viewMatrix * vec4(normalize(vWn + vec3(terrN.x, 0., terrN.y) * .85), 0.)).xyz);');
    };
    const mesh = new THREE.Mesh(geo, mat); mesh.receiveShadow = true; mesh.frustumCulled = false; scene.add(mesh); G.terrain = mesh;
  }

  /* ---------- populate ---------- */
  function populate() {
    G.lamps = [];
    const P = G.poi;
    /* HOME — Thalap tharavadu */
    P.home = { x: 230, z: 150 }; P.gateN = { x: 230, z: 128 }; P.gateE = { x: 252, z: 150 };
    wall(208, 128, 226.6, 128, 2.6, .6); wall(233.4, 128, 252, 128, 2.6, .6); wall(208, 172, 252, 172, 2.6, .6); wall(208, 128, 208, 172, 2.6, .6); wall(252, 128, 252, 146.6, 2.6, .6); wall(252, 153.4, 252, 172, 2.6, .6);
    for (const q of [[226.6, 128], [233.4, 128], [252, 146.6], [252, 153.4]]) { const g = G.hAt(q[0], q[1]); box('lat', q[0], g - .3, q[1], .9, 3.5, .9, 0, K.latD); box('glow', q[0], g + 3.2, q[1], .35, .3, .35, 0, K.glow); }
    { const x = 236, z = 163, g = G.hAt(x, z), y0 = g - .4;
      box('lat', x, y0, z, 17, .9, 11, 0, K.lat); box('plaster', x, y0 + .9, z, 16, 3.2, 10, 0, K.white); hip('tile', x, y0 + 4.1, z, 19, 13, 3.0, 0, K.tile);
      box('paint', x, y0 + 4.7, z - 3, 5, 1.4, 3.5, 0, K.wood); hip('tile', x, y0 + 6.1, z - 3, 7, 5.5, 1.6, 0, K.tileD);
      hip('tile', x, y0 + 3.5, z - 7.6, 17.5, 5.6, 1.1, 0, K.tile); box('lat', x, y0, z - 7.4, 17, .8, 4.6, 0, K.latD);
      for (let i = 0; i < 5; i++) { cyl('paint', x - 8 + i * 4, y0 + .8, z - 9.4, .16, .14, 2.8, 8, K.woodD); G.addCircle(x - 8 + i * 4, z - 9.4, .2, y0 + 3.6); }
      box('dark', x, y0 + .9, z - 5.04, 1.3, 2.2, .1, 0, K.woodD); for (const sx of [-5, -2.6, 2.6, 5]) box('dark', x + sx, y0 + 1.9, z - 5.04, 1.1, 1.2, .1, 0, sx > 0 ? K.glow : K.dark);
      G.addBox(x, z, 8, 5, 0, y0, y0 + 9, 'house'); houses.push([x, z, 14]); P.house = { x, z: z - 7.4, y: y0 + .8 };
    }
    { const g = G.hAt(214, 164); cyl('lat', 214, g - .2, 164, 1.1, 1.1, 1.0, 12, K.lat, false); cyl('dark', 214, g + .1, 164, .95, .95, .05, 12, K.dark, true); cyl('paint', 212.9, g, 164, .07, .07, 2.3, 5, K.wood); cyl('paint', 215.1, g, 164, .07, .07, 2.3, 5, K.wood); box('paint', 214, g + 2.2, 164, 2.5, .1, .1, 0, K.wood); G.addCircle(214, 164, 1.2, g + 1); }
    shed(246, 138, 0, 5, 4, 2.5, K.sheet); { const g = G.hAt(246, 138); box('paint', 246, g, 138.8, 2.6, .9, .9, 0, K.wood); box('paint', 247.8, g, 137, .8, 1.7, .6, 0, K.steel); G.addBox(246, 138.8, 1.3, .45, 0, g, g + 1, 'bench'); P.bench = { x: 246, z: 137.6 }; P.locker = { x: 247.8, z: 136.2 }; }
    { const g = G.hAt(219, 141); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; box('paint', 219 + Math.cos(a) * .55, g, 141 + Math.sin(a) * .55, .3, .22, .3, a, K.stone); } P.fire = { x: 219, y: g + .3, z: 141 }; G.addCircle(219, 141, .6, g + .5); }
    P.radio = { x: 231, z: 154.8 }; { const g = P.house.y; box('paint', 231, g, 155.2, 1.2, .8, .6, 0, K.wood); box('dark', 231, g + .8, 155.2, .5, .32, .25, 0, K.black); }
    P.posts = [[226, 133], [247, 148], [224, 156], [240, 156], [215, 148], [236, 146], [244, 156], [228, 160]];
    for (let i = 0; i < 4; i++) tree(212 + (i % 2) * 34, 133 + ((i / 2) | 0) * 36 + (i === 1 ? 6 : 0), .9);
    P.autoStart = { x: 238, z: 121, yaw: Math.PI / 2 };

    /* THALAP road houses + junction */
    for (const x of [118, 148, 178, 212, 262, 296]) house(x, 85, 0, rr(9, 12), rr(7, 9), rp(WALLS), { lit: true });
    for (const x of [122, 152, 182, 278, 304]) house(x, 116, Math.PI, rr(9, 12), rr(7, 9), rp(WALLS));
    shop(353, 86, -Math.PI / 2, 7, 'green', 'med'); P.pharmacy = { x: 347.5, z: 86 };
    bakery(353, 96.6, -Math.PI / 2, 34); shop(353, 112, -Math.PI / 2, 19, 'white'); shop(353, 122, -Math.PI / 2, 25, 'yellow');
    shed(322, 88, 0, 6, 4.5, 2.6, null, true); { const g = G.hAt(322, 88); box('paint', 322, g, 86.6, 4, 1, .8, 0, K.wood); box('paint', 322, g, 90.6, 3.5, .45, .4, 0, K.woodD); sign(322, g + 2.7, 90.4, 3.6, .9, 0, 6, true); G.addBox(322, 86.6, 2, .4, 0, g, g + 1); G.lootPts.push({ x: 324, z: 91.5, kind: 'shop' }); }

    { const g = G.hAt(326, 108); sign(326, g + 3.2, 108, 4.4, 1.5, Math.PI / 2, 1, true); cyl('paint', 326, g, 106.2, .08, .08, 3.3, 5, K.steel); cyl('paint', 326, g, 109.8, .08, .08, 3.3, 5, K.steel); }
    temple(285, 55);
    bus(336, 132, .1, K.ksrtc, K.autoY); auto(330, 94, 1.2); car(343, 70, .15, col(0xd8d8d8));
    /* BEACH */
    { const g = G.hAt(92, 100); sign(98, g + 2.6, 96, 5, 1.6, Math.PI / 2, 2, true); cyl('paint', 98, g, 94, .08, .08, 2.7, 5, K.steel); cyl('paint', 98, g, 98, .08, .08, 2.7, 5, K.steel); }
    for (let i = 0; i < 9; i++) { const z = 30 + i * 22 + rr(-6, 6), x = G.coast(z) + rr(14, 30); boat(x, z, rr(-.5, .5) + Math.PI / 2, rr(6, 9), rp([K.blue, K.teal, K.red, K.green, K.autoY, K.white])); }
    for (let i = 0; i < 5; i++) { const z = 76 + i * 12, x = G.coast(z) + 58; shed(x, z, 0, 3.2, 3.2, 2.3, rp([K.tarp, K.sheet, K.rust])); const g = G.hAt(x, z); box('paint', x, g, z, 2.2, .9, 1.2, 0, K.wood); G.addBox(x, z, 1.1, .6, 0, g, g + 1); if (i % 2) G.lootPts.push({ x: x + 2, z: z + 1.8, kind: 'shop' }); }
    { const x = G.coast(140) + 48, z = 140, g = G.hAt(x, z); box('paint', x, g - .2, z, 9, .7, 5, .3, K.conc); ball('paint', x, g + 1.4, z, 3.6, 1.3, 1.4, .3, K.sandc); ball('paint', x + 2.6, g + 2.3, z - .8, .9, 1, .8, .3, K.sandc); ball('paint', x - 1, g + 2.3, z, 1.2, .7, .8, .3, K.sandc); G.addBox(x, z, 4.5, 2.5, .3, g - 1, g + 3); }
    P.start = { x: G.coast(60) + 16, z: 60 };
    /* LIGHTHOUSE */
    { const x = 72, z = 260, g = G.hAt(x, z);
      cyl('lat', x, g - .5, z, 5.2, 5.2, 1.6, 16, K.latD, true);
      for (let i = 0; i < 6; i++) cyl('paint', x, g + 1.1 + i * 3.6, z, 3.1 - i * .24, 3.1 - (i + 1) * .24, 3.6, 16, i % 2 ? K.white : K.red);
      cyl('paint', x, g + 22.7, z, 2.6, 2.6, .25, 16, K.steel, true); cyl('glow', x, g + 22.95, z, 1.3, 1.3, 2.0, 12, K.glow); cyl('paint', x, g + 24.95, z, 1.6, .1, 1.3, 12, K.red);
      G.addCircle(x, z, 5.2, g + 1.1); G.addCircle(x, z, 3.2, g + 26); P.lightTop = { x, y: g + 24, z }; P.lightDoor = { x: x + 4.2, z: z + 3.4 };
      box('dark', x + 2.35, g + 1.1, z + 1.9, 1.1, 2.1, .3, -.9, K.woodD);
      house(92, 246, Math.PI / 2 + Math.PI, 9, 7, 'white'); shed(86, 272, 0, 4, 3.4, 2.4, K.rust); const g2 = G.hAt(86, 272); box('paint', 86, g2, 272, 1.8, 1.1, 1.0, 0, col(0x2d6a3a)); cyl('paint', 86.6, g2 + 1.1, 272, .07, .07, .9, 5, K.steel); G.addBox(86, 272, .9, .5, 0, g2, g2 + 1.2); P.generator = { x: 86, z: 273.3 };
      sign(96, g2 + 2.4, 262, 4, 1.3, Math.PI / 2, 15, true); cyl('paint', 96, g2, 262, .08, .08, 2.5, 5, K.steel);
      wall(60, 240, 60, 282, 1.3, .4); wall(60, 282, 100, 282, 1.3, .4);
    }
    /* FORT — St. Angelo */
    { const T = 10.5, B = -3.5, c = K.latD;
      const fw = (x0, z0, x1, z1) => wall(x0, z0, x1, z1, T - B, 3.2, 'lat', c, B);
      fw(-30, 520, 50, 520); fw(-30, 600, 50, 600); fw(-30, 520, -30, 600); fw(50, 520, 50, 554); fw(50, 566, 50, 600);
      box('lat', 50, 7.6, 560, 3.2, T - 7.6, 12, 0, c); // arch top
      for (const q of [[-30, 520], [50, 520], [-30, 600], [50, 600]]) { cyl('lat', q[0], B, q[1], 9, 8, T + 1.2 - B, 14, K.lat, true); G.addCircle(q[0], q[1], 9, T + 1.2); for (let i = 0; i < 3; i++) { const a = Math.atan2(q[1] - 560, q[0] - 10) + (i - 1) * .5; cyl('dark', q[0] + Math.cos(a) * 6.5, T + 1.2, q[1] + Math.sin(a) * 6.5, .28, .22, .6, 6, K.black, true); } }
      for (let i = 0; i < 16; i++) { box('lat', -26 + i * 5, T, 518.6, 2.2, 1.1, .5, 0, K.lat); box('lat', -26 + i * 5, T, 601.4, 2.2, 1.1, .5, 0, K.lat); }
      const g = G.hAt(10, 560);
      box('lat', -8, g - .5, 585, 30, 4.6, 8, 0, K.lat); hip('tile', -8, g + 4.1, 585, 32, 10, 2.4, 0, K.tileD); G.addBox(-8, 585, 15, 4, 0, g - 1, g + 7); for (let i = 0; i < 6; i++) box('dark', -20 + i * 4.8, g + .2, 580.96, 1.6, 2.6, .1, 0, K.dark);
      box('lat', 30, g - .5, 534, 12, 5, 8, 0, K.lat); box('paint', 30, g + 4.5, 534, 12.4, .4, 8.4, 0, K.concD); G.addBox(30, 534, 6, 4, 0, g - 1, g + 5.5); box('dark', 30, g + .1, 538.05, 1.8, 2.6, .12, 0, K.steel); sign(30, g + 3, 538.1, 3, .9, 0, 21, false); P.armoury = { x: 30, z: 539.4 };
      box('plaster', -12, g - .4, 540, 7, 5, 10, 0, K.white); hip('tile', -12, g + 4.6, 540, 8, 11, 2.6, 0, K.tile); G.addBox(-12, 540, 3.5, 5, 0, g - 1, g + 7);
      for (const q of [[4, 552, .4], [14, 570, 2.2], [-18, 562, 1]]) { const gg = G.hAt(q[0], q[1]); box('paint', q[0], gg, q[1], .7, .5, 1.2, q[2], K.woodD); ball('dark', q[0], gg + .7, q[1], .22, .22, 1.3, q[2], K.black); G.addCircle(q[0], q[1], .7, gg + 1); }
      tree(18, 590, 1.2); tree(-2, 530, 1);
      sign(62, G.hAt(62, 552) + 2.4, 552, 4.6, 1.4, Math.PI / 2, 4, true); cyl('paint', 62, G.hAt(62, 552), 552, .08, .08, 2.5, 5, K.steel);
      G.lootPts.push({ x: 20, z: 578, kind: 'police' }, { x: -20, z: 548, kind: 'police' }, { x: 40, z: 590, kind: 'house' });
      P.fort = { x: 10, z: 560 };
    }
    /* HARBOUR — Mappila Bay */
    { G.plats.push({ x0: 18, x1: 102, z0: 696, z1: 704, y: 2.0 }); box('paint', 60, 1.6, 700, 84, .4, 8, 0, K.conc); for (let i = 0; i < 9; i++) for (const s of [-3.4, 3.4]) cyl('paint', 22 + i * 9.5, -5, 700 + s, .35, .35, 6.7, 6, K.concD);
      for (let i = 0; i < 8; i++) { cyl('paint', 24 + i * 10, 2, 696.2, .12, .12, .7, 5, K.steel, true); cyl('paint', 24 + i * 10, 2, 703.8, .12, .12, .7, 5, K.steel, true); }
      shed(132, 676, 0, 22, 12, 4.2, K.sheet); const g = G.hAt(132, 676); for (let i = 0; i < 5; i++) { box('paint', 124 + i * 4, g, 674, 2.6, .85, 1.3, 0, K.conc); box('paint', 124 + i * 4, g, 679, 2.6, .85, 1.3, 0, K.conc); G.addBox(124 + i * 4, 674, 1.3, .65, 0, g, g + .9); G.addBox(124 + i * 4, 679, 1.3, .65, 0, g, g + .9); }
      sign(132, g + 3.2, 682.2, 6, 1.5, 0, 11, true);
      tower(156, 716, 0, 14, 10, 2, 'blue'); sign(156, G.hAt(156, 716) + 5, 721.1, 5, 1.3, 0, 31, false); sign(156, G.hAt(156, 716) + 3.3, 721.1, 6.4, 1.5, 0, 52, false);
      { const gg = G.hAt(116, 714); box('paint', 116, gg, 714, 3.4, .2, 2, 0, K.conc); box('paint', 115.3, gg + .2, 714, .6, 1.5, .5, 0, K.red); box('paint', 116.7, gg + .2, 714, .6, 1.5, .5, 0, K.green); shed(116, 714, 0, 5, 4, 3.6, K.white); sign(116, gg + 3.7, 716, 3.6, 1, 0, 18, true); G.addBox(116, 714, 1.1, .3, 0, gg, gg + 1.8); }
      // mosque
      { const x = 180, z = 748, gg = G.hAt(x, z); box('plaster', x, gg - .4, z, 14, 5.4, 11, 0, K.white); box('paint', x, gg + 5, z, 14.4, .5, 11.4, 0, K.green); ball('paint', x, gg + 5.5, z, 3.2, 3.2, 3.2, 0, K.teal, true); cyl('paint', x - 8.5, gg - .4, z + 4.5, .9, .7, 11, 8, K.white); ball('paint', x - 8.5, gg + 10.6, z + 4.5, .9, 1.3, .9, 0, K.teal, true); for (let i = 0; i < 4; i++) box('dark', x - 4.5 + i * 3, gg + .6, z + 5.54, 1.3, 2.4, .1, 0, K.dark); G.addBox(x, z, 7, 5.5, 0, gg - 1, gg + 9); G.addCircle(x - 8.5, z + 4.5, 1, gg + 12); houses.push([x, z, 12]); G.lootPts.push({ x, z: z + 8, kind: 'house' }); }
      for (let i = 0; i < 7; i++) { const z = 640 + i * 16 + rr(-4, 4), x = G.coast(z) + rr(8, 22); boat(x, z, rr(-.6, .6) + Math.PI / 2, rr(7, 11), rp([K.blue, K.teal, K.red, K.green, K.white])); }
      sign(112, G.hAt(112, 686) + 2.8, 686, 5, 1.5, Math.PI / 2, 5, true); cyl('paint', 112, G.hAt(112, 686), 686, .08, .08, 2.9, 5, K.steel);
      P.fuel = [{ x: 116, z: 716.6 }, { x: 140, z: 683.5 }, { x: 40, z: 700 }]; P.rajan = { x: 22, z: 700 };
      G.lootPts.push({ x: 126, z: 684, kind: 'shop' }, { x: 70, z: 700, kind: 'house' }, { x: 148, z: 708, kind: 'shop' });
      bus(210, 694, Math.PI / 2 + .1, col(0x2a6ab0)); auto(160, 688, 1.4); auto(240, 687, -1.2);
    }
    /* TOWN — Kannur */
    { shed(387, 420, 0, 30, 40, 5.2, K.sheet); for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) { const x = 377 + i * 10, z = 405 + j * 10, g = G.hAt(x, z); cyl('paint', x, g, z, .3, .3, 5.2, 8, K.conc); G.addCircle(x, z, .35, g + 5); }
      bus(380, 412, 0, K.ksrtc, K.autoY); bus(386, 428, .05, K.ksrtc, K.autoY); bus(394, 414, -.3, col(0x2e8b57), K.white); bus(372, 446, 1.3, col(0x3a5fcd), K.autoY);
      sign(387, G.hAt(387, 399) + 5.3, 399.4, 8, 2, Math.PI, 10, true); sign(366, G.hAt(366, 420) + 3, 420, 3, 1, -Math.PI / 2, 13, true);
      const SI = [12, 17, 22, 24, 25, 26, 27, 19, 23, 6, 16];
      for (let x = 256; x <= 466; x += 8.6) { if (Math.abs(x - G.hwx(380)) < 13 || Math.abs(x - 410) < 8) continue; shop(x, 370, 0, rp(SI), rp(WALLS), R() < .2 ? 'med' : 'shop'); if ((x > 275 && x < 365 && Math.abs(x - 300) > 9) || x > 420) shop(x, 390.5, Math.PI, rp(SI), rp(WALLS)); }
      for (let x = 262; x <= 462; x += 17) { if (Math.abs(x - G.hwx(460)) < 17 || Math.abs(x - 410) < 12 || x < 285 || Math.abs(x - 300) < 11) continue; tower(x, 447.5, 0, 14, 10, 2 + (R() * 3 | 0), rp(WALLS)); tower(x, 473, Math.PI, 14, 11, 2 + (R() * 3 | 0), rp(WALLS)); }
      { const x = 410, z = 420, g = G.hAt(x, z); box('plaster', x + 14, g - .3, z, 8, 9, 8, 0, K.cream); G.addBox(x + 14, z, 4, 4, 0, g - 1, g + 10); cyl('paint', x + 14, g + 8.7, z, 2, 1.6, 4, 8, K.white); hip('tile', x + 14, g + 12.7, z, 5, 5, 2, 0, K.tile); box('dark', x + 14, g + 9.8, z + 1.9, 1.5, 1.5, .1, 0, K.white); houses.push([x + 14, z, 6]); }
      { const g = G.hAt(346, 350); sign(346, g + 4.2, 350, 6, 2, 0, 0, true); cyl('paint', 343.4, g, 350, .1, .1, 4.3, 5, K.steel); cyl('paint', 348.6, g, 350, .1, .1, 4.3, 5, K.steel); G.addCircle(343.4, 350, .15, g + 4); G.addCircle(348.6, 350, .15, g + 4); }
      { const x = 440, z = 420, g = G.hAt(x, z); box('plaster', x, g - .3, z, 16, 4.2, 10, 0, K.blue); box('paint', x, g + 3.9, z, 16.4, .4, 10.4, 0, K.concD); sign(x, g + 2.9, z + 5.1, 4, 1.1, 0, 21, false); box('dark', x, g, z + 5.04, 2, 2.4, .1, 0, K.dark); G.addBox(x, z, 8, 5, 0, g - 1, g + 4.6); houses.push([x, z, 10]); G.lootPts.push({ x: x + 4, z: z + 6.6, kind: 'police' }, { x: x - 5, z: z + 6.6, kind: 'police' }); car(x - 6, z + 9, 1.5, col(0x1a2a5a)); }
      P.town = { x: 387, z: 420 };
    }
    /* PADDY + KAVU */
    { const x = 200, z = -290, g = G.hAt(x, z); for (let i = 0; i < 14; i++) { const a = i / 14 * TAU + rr(-.2, .2), r = rr(9, 15); tree(x + Math.cos(a) * r, z + Math.sin(a) * r, rr(1.1, 1.6)); }
      box('lat', x, g - .2, z, 5, .8, 5, 0, K.latD); box('lat', x, g + .6, z, 2.2, 1.6, 2.2, 0, K.lat); hip('tile', x, g + 2.2, z, 3.6, 3.6, 1.4, 0, K.tileD); box('paint', x, g + .9, z + 1.12, .8, .9, .06, 0, K.red);
      for (const q of [[-2, 2], [2, 2]]) { cyl('paint', x + q[0], g + .6, z + q[1], .1, .1, 1.3, 6, K.stone, true); box('glow', x + q[0], g + 1.9, z + q[1], .22, .16, .22, 0, K.glow); G.lamps.push([x + q[0], g + 2, z + q[1]]); }
      G.addBox(x, z, 1.2, 1.2, 0, g, g + 3.6); P.kavu = { x, z: z + 4 }; G.lootPts.push({ x: x + 3.4, z: z + 3.4, kind: 'house' });
      for (let i = 0; i < 6; i++) house(rr(140, 280), -110 + rr(0, 14), rr(0, 6), 10, 8, rp(WALLS));
    }
    /* BRIDGE — Perumba */
    { const x = 300; G.plats.push({ x0: x - 7.5, x1: x + 7.5, z0: -612, z1: -528, y: 3.4 }); box('paint', x, 2.7, -570, 15, .7, 84, 0, K.conc);
      for (const s of [-7.2, 7.2]) { box('paint', x + s, 3.4, -570, .35, 1.0, 84, 0, K.white); G.addBox(x + s, -570, .25, 42, 0, 3, 4.6, 'rail'); }
      for (let i = 0; i < 5; i++) for (const s of [-5, 5]) cyl('paint', x + s, -6, -604 + i * 17, 1.1, 1.1, 8.8, 8, K.concD);
      bus(x - 2.5, -572, .35, K.ksrtc, K.autoY); car(x + 4, -590, .1, col(0xb0b0b0)); car(x + 3.5, -548, -.4, col(0x8a1a1a)); auto(x - 3, -545, .5);
      const g = G.hAt(x + 12, -522); sign(x + 12, g + 3, -522, 5, 1.5, Math.PI, 14, true); cyl('paint', x + 12, g, -522, .08, .08, 3, 5, K.steel);
      sign(x - 12, g + 2.6, -518, 4.6, 1.4, Math.PI, 16, true); cyl('paint', x - 12, g, -518, .08, .08, 2.7, 5, K.steel);
      P.bridge = { x, z: -570 };
    }
    /* PAYYANUR */
    { const SI = [12, 17, 22, 24, 25, 26, 27, 19, 23, 6];
      for (let x = 206; x <= 476; x += 8.6) { if (Math.abs(x - G.hwx(-700)) < 13 || Math.abs(x - 380) < 8) continue; if (R() < .8) shop(x, -710.5, 0, rp(SI), rp(WALLS), R() < .15 ? 'med' : 'shop'); if (R() < .8) shop(x, -689.5, Math.PI, rp(SI), rp(WALLS)); }
      temple(452, -775); P.temple = { x: 452, z: -760 };
      { const x = 412, z = -772, g = G.hAt(x, z); box('lat', x, g - .6, z, 26, .9, 20, 0, K.latD); box('lat', x, g - .5, z, 23, .85, 17, 0, K.lat); box('dark', x, g - .4, z, 20, .8, 14, 0, col(0x10352a)); G.addBox(x, z, 13, 10, 0, g - 1, g + .9); P.pond = { x, z: z + 12 }; }
      { const x = 290, z = -716, g = G.hAt(x, z); cyl('paint', x, g, z, 1.4, 1.2, 1.6, 10, K.conc, true); cyl('paint', x, g + 1.6, z, .28, .2, 1.5, 8, K.stone); ball('paint', x, g + 3.3, z, .28, .3, .28, 0, K.stone); G.addCircle(x, z, 1.4, g + 3.5); }
      tower(340, -665, 0, 16, 12, 3, 'cream'); tower(425, -665, 0, 14, 10, 2, 'pink'); sign(425, G.hAt(425, -665) + 4.2, -659.9, 4, 1.2, 0, 23, false); P.clinic = { x: 425, z: -658 };
      const g = G.hAt(316, -640); sign(316, g + 4, -640, 6, 2, 0, 28, true); cyl('paint', 313.4, g, -640, .1, .1, 4.1, 5, K.steel); cyl('paint', 318.6, g, -640, .1, .1, 4.1, 5, K.steel);
      bus(330, -702, Math.PI / 2, col(0xd08a1a), K.white); auto(250, -703, 1.7); auto(400, -697, -1.3); car(360, -704, 1.4, col(0xeeeeee));
      // Kavvayi jetty + footbridge
      G.plats.push({ x0: 148, x1: 188, z0: -723.5, z1: -716.5, y: 2.0 }); box('paint', 168, 1.7, -720, 40, .3, 7, 0, K.wood); for (let i = 0; i < 5; i++) for (const s of [-3, 3]) cyl('paint', 151 + i * 8, -3.5, -720 + s, .2, .2, 5.4, 5, K.woodD);
      G.plats.push({ x0: 52, x1: 188, z0: -781.6, z1: -778.4, y: 2.6 }); box('paint', 120, 2.4, -780, 136, .2, 3.2, 0, K.wood); for (let i = 0; i < 18; i++) for (const s of [-1.5, 1.5]) cyl('paint', 55 + i * 7.7, -3.5, -780 + s, .12, .12, 7, 5, K.woodD);
      for (const s of [-1.55, 1.55]) { box('paint', 120, 3.4, -780 + s, 136, .08, .08, 0, K.woodD); G.addBox(120, -780 + s, 68, .12, 0, 2.5, 3.6, 'rail'); }
      shed(192, -727, 0, 5, 4, 2.6, null, true); sign(192, G.hAt(192, -727) + 2.7, -724.9, 4, 1.1, 0, 8, true); P.jetty = { x: 150, z: -720 };
      for (let i = 0; i < 5; i++) boat(G.coast(-700 - i * 14) + 214 + rr(0, 5), -700 - i * 14, rr(-.4, .4), rr(6, 9), rp([K.blue, K.green, K.white, K.red]));
    }
    /* EZHIMALA */
    { const x = -90, z = -900, g = G.hAt(x, z); for (const q of [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]]) cyl('paint', x + q[0], g - .5, z + q[1], .12, .05, 24, 4, K.red); for (let i = 0; i < 6; i++) box('paint', x, g + 3 + i * 3.6, z, 3 - i * .4, .1, 3 - i * .4, i * .5, K.white); box('glow', x, g + 23.4, z, .4, .4, .4, 0, col(0xff3020)); G.addCircle(x, z, 2, g + 24);
      box('plaster', x + 9, g - 1.5, z + 6, 8, 4.5, 6, .4, K.white); box('paint', x + 9, g + 3, z + 6, 8.4, .3, 6.4, .4, K.concD); G.addBox(x + 9, z + 6, 4, 3, .4, g - 2, g + 3.6); box('dark', x + 7.6, g + .3, z + 9.2, 1.1, 2, .1, .4, K.steel);
      sign(x + 16, g + 1.2, z + 14, 4, 1.2, .5, 29, true); cyl('paint', x + 16, g - 2, z + 14, .08, .08, 3.3, 5, K.steel);
      P.transmitter = { x: x + 6.8, z: z + 10.2 }; P.hilltop = { x, z }; G.lootPts.push({ x: x + 13, z: z + 2, kind: 'police' });
    }
    /* ---------- landmarks added in the detail pass ---------- */
    const street = (x, z, yaw, idx) => { const g = G.hAt(x, z); cyl('paint', x, g, z, .06, .06, 3.1, 5, K.steel); sign(x, g + 2.4, z, 3.2, .85, yaw, idx, true); G.addCircle(x, z, .1, g + 3); };
    /* Kannur International Airport — on its tabletop plateau east of the highway */
    { const y = 12; P.airport = { x: 452, z: -290 };
      for (let z = -410; z < -170; z += 14) box('paint', 545, y + .02, z, .5, .03, 7, 0, K.white);
      for (let i = 0; i < 8; i++) { box('paint', 535.2 + i * 2.8, y + .02, -415, 1.4, .03, 9, 0, K.white); box('paint', 535.2 + i * 2.8, y + .02, -168, 1.4, .03, 9, 0, K.white); }
      box('plaster', 462, y - .5, -290, 20, 9.5, 84, 0, K.white); box('dark', 472.05, y + 1, -290, .1, 6.5, 78, 0, K.dark); box('dark', 451.95, y + 1, -290, .1, 5, 64, 0, K.dark); box('glow', 451.9, y + .2, -290, .1, 2.6, 6, 0, K.glow);
      for (let i = 0; i < 4; i++) ball('paint', 462, y + 9, -322 + i * 21.4, 12.5, 3.4, 11.6, 0, K.white, true);
      G.addBox(462, -290, 10, 42, 0, y - 1, y + 13, 'tower'); houses.push([462, -290, 46]);
      sign(451.85, y + 6.6, -290, 24, 3, -Math.PI / 2, 33, false); sign(451.85, y + 4.2, -310, 6, 1.5, -Math.PI / 2, 50, false);
      for (let i = 0; i < 6; i++) { cyl('paint', 446, y, -315 + i * 10, .25, .25, 5.2, 8, K.white); G.addCircle(446, -315 + i * 10, .3, y + 5); } box('paint', 447.5, y + 5.2, -290, 8, .3, 56, 0, K.white);
      cyl('paint', 492, y, -200, 2.3, 1.9, 21, 12, K.white); cyl('dark', 492, y + 21, -200, 3.3, 3.9, 3, 12, K.dark); cyl('paint', 492, y + 24, -200, 4.1, .6, 1.2, 12, K.white, true); cyl('paint', 492, y + 25.2, -200, .06, .04, 4, 4, K.red); G.addCircle(492, -200, 2.5, y + 26);
      box('paint', 505, y, -398, 32, 9, 24, 0, K.sheet); ball('paint', 505, y + 9, -398, 16.4, 5, 12.4, 0, K.sheet, true); box('dark', 505, y, -385.9, 22, 7.5, .2, 0, K.dark); sign(505, y + 7.7, -385.8, 12, 2.4, 0, 52, false); G.addBox(505, -398, 16, 12, 0, y - 1, y + 14, 'tower'); houses.push([505, -398, 20]);
      const plane = (x, z, yaw, tail) => { const t = O(x, z, yaw), g = y;
        ball('paint', x, g + 3.7, z, 2, 2, 19, yaw, K.white); box('dark', x, g + 4.1, z, 4.02, .32, 25, yaw, K.dark); let p = lw(t, 0, 16.2); box('dark', p[0], g + 4.3, p[1], 2.6, .6, 1.6, yaw, K.dark);
        for (const sx of [-1, 1]) { p = lw(t, sx * 9.2, -.5); box('paint', p[0], g + 2.9, p[1], 17, .34, 4.4, yaw + sx * .3, K.white); p = lw(t, sx * 5.6, 2.2); ball('paint', p[0], g + 2, p[1], 1.05, 1.05, 2.5, yaw, K.steel); p = lw(t, sx * 3.6, -16.6); box('paint', p[0], g + 4.6, p[1], 6.4, .26, 2.6, yaw + sx * .3, K.white); p = lw(t, sx * 2.6, -1); cyl('dark', p[0], g, p[1], .35, .35, 1.9, 6, K.black); }
        p = lw(t, 0, -16.2); box('paint', p[0], g + 5.2, p[1], .4, 6.2, 5, yaw, tail); p = lw(t, 0, 13); cyl('dark', p[0], g, p[1], .3, .3, 1.9, 6, K.black);
        G.addBox(x, z, 2.1, 18.5, yaw, g, g + 6, 'plane'); p = lw(t, 0, -.5); G.addBox(p[0], p[1], 18, 2.2, yaw, g + 2.6, g + 3.6, 'plane'); };
      plane(512, -330, .5, K.red); plane(520, -250, 2.2, col(0x1a4a9a)); P.plane = { x: 505, z: -322 };
      bus(480, -345, .4, K.white, K.autoY); car(486, -262, 1.2, K.white); car(440, -270, .2, col(0xe8c020)); car(438, -305, 3.2, col(0xe8c020)); auto(441, -322, .6);
      for (const q of [[448, -270], [448, -306], [476, -330], [498, -385], [476, -240]]) G.lootPts.push({ x: q[0], z: q[1], kind: q[0] > 470 ? 'police' : 'shop' });
      G.lootPts.push({ x: 449, z: -262, kind: 'med' });
      { const g = G.hAt(318, -284); sign(318, g + 3.6, -284, 5.4, 1.7, 0, 46, true); cyl('paint', 316, g, -284, .09, .09, 3.7, 5, K.steel); cyl('paint', 320, g, -284, .09, .09, 3.7, 5, K.steel); }
    }
    /* Railway — Kannur station, the line south toward the fort and harbour, a stranded express */
    { const X = 250, gS = G.hAt(256, 430);
      for (let z = 332; z < 902; z += 1.3) box('paint', X, G.hAt(X, z) + .02, z, 2.7, .12, .3, 0, K.woodD);
      for (let z = 332; z < 900; z += 10) for (const sx of [-.76, .76]) box('paint', X + sx, (G.hAt(X, z) + G.hAt(X, z + 10)) / 2 + .13, z + 5, .09, .15, 10.1, 0, K.steel);
      box('paint', X, G.hAt(X, 331), 331, 3, 1.2, .5, 0, K.red); G.addBox(X, 331, 1.5, .3, 0, G.hAt(X, 331) - 1, G.hAt(X, 331) + 1.3);
      G.plats.push({ x0: 252.6, x1: 259.4, z0: 385, z1: 475, y: gS + .7 }); box('paint', 256, gS - .4, 430, 6.8, 1.1, 90, 0, K.conc);
      box('paint', 256, gS + 4.7, 430, 7.6, .12, 82, 0, K.sheet); for (let z = 392; z <= 468; z += 9.5) for (const sx of [253.2, 258.8]) { cyl('paint', sx, gS + .7, z, .09, .09, 4, 5, K.steel); G.addCircle(sx, z, .12, gS + 4.6); }
      box('plaster', 266, gS - .3, 430, 9, 5.4, 56, 0, K.cream); hip('tile', 266, gS + 5.1, 430, 11, 58, 2.6, 0, K.tile); G.addBox(266, 430, 4.5, 28, 0, gS - 1, gS + 8, 'tower'); houses.push([266, 430, 30]);
      for (let i = 0; i < 6; i++) { box('dark', 261.45, gS + .9, 408 + i * 9, .1, 2.6, 2.2, 0, K.woodD); box('dark', 270.55, gS + .9, 408 + i * 9, .1, 2.6, 2.2, 0, i % 2 ? K.glow : K.woodD); }
      sign(256, gS + 2.9, 389.5, 5, 1.7, 0, 32, true); sign(256, gS + 2.9, 470.5, 5, 1.7, 0, 32, true); cyl('paint', 253.8, gS + .7, 389.5, .07, .07, 2.3, 5, K.black); cyl('paint', 258.2, gS + .7, 389.5, .07, .07, 2.3, 5, K.black); cyl('paint', 253.8, gS + .7, 470.5, .07, .07, 2.3, 5, K.black); cyl('paint', 258.2, gS + .7, 470.5, .07, .07, 2.3, 5, K.black);
      sign(270.6, gS + 5.6, 430, 10, 2, Math.PI / 2, 47, false);
      const coach = (z, yaw, dx, c, stripe, loco) => { const x = X + dx, g = G.hAt(X, z); box('paint', x, g + .95, z, 3, loco ? 3.3 : 2.9, loco ? 17 : 20.6, yaw, c); if (!loco) box('dark', x, g + 2.3, z, 3.04, .8, 18.6, yaw, K.dark); else { const t = O(x, z, yaw), p = lw(t, 0, 6.6); box('dark', p[0], g + 3.0, p[1], 3.04, .9, 3, yaw, K.dark); }
        box('paint', x, g + 1.8, z, 3.06, .26, loco ? 17.02 : 20.62, yaw, stripe); box('paint', x, g + (loco ? 4.25 : 3.85), z, 2.5, .22, loco ? 15 : 20, yaw, K.sheet); const t = O(x, z, yaw); for (const sz of [-6.5, 6.5]) { const p = lw(t, 0, sz); box('dark', p[0], g + .2, p[1], 2.4, .75, 3.4, yaw, K.black); } G.addBox(x, z, 1.55, loco ? 8.5 : 10.3, yaw, g - 1, g + 4.2, 'train'); };
      const IR = col(0x2a4f8a), IRs = col(0x9ac4e8);
      coach(397, 0, 0, col(0x8a2a1a), col(0xe8a020), true); coach(417, 0, 0, IR, IRs); coach(438.5, 0, 0, IR, IRs); coach(460.5, .1, .9, IR, IRs); coach(482, -.16, 2.6, IR, IRs); coach(700, .5, 3, col(0x6a3a22), col(0xd8c8a0));
      G.lootPts.push({ x: 262.5, z: 400, kind: 'shop' }, { x: 255, z: 448, kind: 'house' }, { x: 255, z: 412, kind: 'police' }); P.station = { x: 258, z: 430 };
      street(274, 416, 0, 42); street(304, 376, Math.PI / 2, 43); street(G.hwx(380) - 10, 375, 0, 40); street(G.hwx(540) - 10, 536, 0, 41); street(366, 397, 0, 44); street(G.hwx(100) - 12, 96, 0, 1); street(G.hwx(-40) + 9, -40, 0, 48); street(G.hwx(-200) + 9, -200, 0, 49);
    }
    /* bakeries, snack stalls — Kannur's sweet tooth */
    for (let i = 0, x = 284; x <= 350; x += 9.4, i++) { if (Math.abs(x - 300) < 8) continue; if (i % 2) shop(x, 410.5, 0, rp([12, 22, 25, 27, 38, 39]), rp(WALLS)); else bakery(x, 410.2, 0, [34, 35, 36, 37][(i / 2 | 0) % 4]); }
    bakery(389, -750, -Math.PI / 2, 35); bakery(371, -800, Math.PI / 2, 36); bakery(200, 549, Math.PI, 37); bakery(318, 549, Math.PI, 34);
    /* Arakkal Museum — the old palace of the Arakkal Ali Rajas by Mappila Bay */
    { const x = 232, z = 742, g = G.hAt(x, z), y0 = g - .4;
      box('lat', x, y0, z, 31, .9, 11, 0, K.lat); box('plaster', x, y0 + .9, z, 30, 6.4, 10, 0, K.white); hip('tile', x, y0 + 7.3, z, 33, 13, 3, 0, K.tile);
      box('paint', x, y0 + 3.9, z - 6.2, 30, .2, 2.6, 0, K.woodD); for (let i = 0; i < 9; i++) { cyl('paint', x - 14 + i * 3.5, y0 + .9, z - 7.3, .14, .12, 6.3, 6, K.woodD); G.addCircle(x - 14 + i * 3.5, z - 7.3, .18, y0 + 7); }
      for (let i = 0; i < 8; i++) for (const fl of [0, 1]) box('dark', x - 12.3 + i * 3.5, y0 + 1.5 + fl * 3.1, z - 5.04, 1.3, 1.9, .1, 0, fl ? K.woodD : K.dark);
      hip('tile', x, y0 + 7.1, z - 6.4, 31, 3.4, .9, 0, K.tileD); sign(x, y0 + 1.2, z - 10.5, 5, 1.5, Math.PI, 45, true); cyl('paint', x - 2, g, z - 10.5, .08, .08, 1.3, 5, K.steel); cyl('paint', x + 2, g, z - 10.5, .08, .08, 1.3, 5, K.steel);
      G.addBox(x, z, 15, 5, 0, y0, y0 + 11, 'tower'); houses.push([x, z, 20]); G.lootPts.push({ x: x - 8, z: z - 9, kind: 'house' }, { x: x + 9, z: z - 9, kind: 'police' }); P.arakkal = { x, z: z - 9 };
    }
    /* Varuna Biomarine research campus — on the plateau north of the airport */
    { const y = 12; P.varuna = { x: 450, z: -84 }; P.vTanks = [{ x: 521, z: -58.6 }, { x: 540, z: -80.6 }, { x: 521, z: -104.6 }]; P.vLab = { x: 478, z: -73.4 };
      const fw2 = (x0, z0, x1, z1) => wall(x0, z0, x1, z1, 3.2, .4, 'plaster', K.conc, y);
      fw2(455, -40, 560, -40); fw2(455, -128, 560, -128); fw2(560, -40, 560, -128); fw2(455, -40, 455, -78); fw2(455, -90, 455, -128);
      box('paint', 455, y, -77.5, .8, 4, .8, 0, K.concD); box('paint', 455, y, -90.5, .8, 4, .8, 0, K.concD); box('paint', 455, y + 3.8, -84, .5, .5, 13.8, 0, K.concD); sign(454.7, y + 4.4, -84, 9, 1.9, -Math.PI / 2, 52, false);
      box('paint', 451, y, -93.5, 2.6, 2.6, 2.6, 0, K.white); box('dark', 449.68, y + 1.1, -93.5, .05, 1, 1.6, 0, K.dark); G.addBox(451, -93.5, 1.3, 1.3, 0, y, y + 2.8);
      box('plaster', 478, y - .3, -60, 30, 11, 24, 0, K.white); box('paint', 478, y + 10.7, -60, 30.6, .6, 24.6, 0, K.concD);
      for (let f = 0; f < 3; f++) { box('dark', 478, y + 1.4 + f * 3.4, -72.06, 26, 1.5, .1, 0, f ? K.dark : K.glow); box('dark', 462.94, y + 1.4 + f * 3.4, -60, .1, 1.5, 20, 0, K.dark); }
      box('dark', 478, y, -72.12, 3, 2.6, .14, 0, K.steel); box('paint', 478, y + 2.9, -73.2, 6, .2, 2.4, 0, K.teal); sign(478, y + 8.2, -72.15, 12, 2.4, Math.PI, 52, false);
      G.addBox(478, -60, 15, 12, 0, y - 1, y + 12, 'tower'); houses.push([478, -60, 26]);
      box('paint', 470, y + 11.3, -56, 5, 2, 4, 0, K.sheet); cyl('paint', 488, y + 11.3, -62, 1.2, 1.2, 2.2, 10, K.steel, true);
      for (const q of [[521, -66], [540, -88], [521, -112]]) { cyl('paint', q[0], y, q[1], 6.2, 6.2, 11, 16, K.white, true); cyl('paint', q[0], y + 7, q[1], 6.26, 6.26, 1.3, 16, K.teal); cyl('paint', q[0], y + 11, q[1], 1, .8, 1.4, 8, K.steel, true); G.addCircle(q[0], q[1], 6.3, y + 12.5); box('paint', q[0] - 9, y + 2.2, q[1], 6, .5, .5, 0, K.steel); }
      box('paint', 506, y + 2.2, -89, .5, .5, 50, 0, K.steel); for (let i = 0; i < 6; i++) cyl('paint', 506, y, -112 + i * 9.5, .12, .12, 2.2, 5, K.steel);
      cyl('paint', 548, y, -54, 1.9, 1.3, 30, 12, K.conc); cyl('paint', 548, y + 26, -54, 1.36, 1.3, 1.6, 12, K.red); G.addCircle(548, -54, 2, y + 31);
      for (const q of [[470, -104, 0, 0x1e6a7a], [470, -110.4, 0, 0x8a3a1a], [473, -117, .1, 0x1e6a7a], [488, -119, 1.57, 0x4a4a4a]]) { box('paint', q[0], y, q[1], 2.5, 2.6, 6.1, q[2], col(q[3])); G.addBox(q[0], q[1], 1.25, 3.05, q[2], y, y + 2.7); }
      box('paint', 470, y + 2.6, -107, 2.5, 2.6, 6.1, .06, col(0x9a8a1a));
      for (const q of [[458, -44], [556, -44], [556, -124], [458, -124]]) { cyl('paint', q[0], y, q[1], .12, .12, 9, 5, K.steel); box('glow', q[0], y + 9, q[1], .8, .3, .5, 0, K.glow); G.lamps.push([q[0], y + 9, q[1]]); }
      for (const q of [[462, -84], [490, -90], [500, -50], [530, -90], [545, -112], [476, -122]]) G.lootPts.push({ x: q[0], z: q[1], kind: q[0] > 495 ? 'police' : 'med' });
    }
    /* scatter homes */
    const areas = [[110, 320, 180, 340, 26], [110, 320, -100, 70, 22], [380, 520, -60, 330, 26], [200, 520, -900, -730, 30], [380, 520, -640, -480, 12], [150, 520, 500, 900, 34], [370, 520, -440, -130, 12]];
    for (const a of areas) for (let n = 0, t = 0; n < a[4] && t < 500; t++) {
      const x = rr(a[0], a[1]), z = rr(a[2], a[3]); if (G.hAt(x, z) < 2.4 || x - G.coast(z) < 70 || (x > 395 && z > -465 && z < -8)) continue;
      let ok = true; for (const h of houses) if (dist2(x, z, h[0], h[1]) < sq(h[2] + 12)) { ok = false; break; } if (!ok) continue;
      for (let i = -1; i <= 1 && ok; i++) for (let j = -1; j <= 1; j++) if (G.maskAt(x + i * 8, z + j * 8)) { ok = false; break; } if (!ok) continue;
      house(x, z, rp([0, Math.PI / 2, Math.PI, -Math.PI / 2]) + rr(-.2, .2), rr(9, 13), rr(7, 9.5), rp(WALLS), { lit: R() < .3 }); n++;
      if (R() < .3) car(x + rr(-2, 2), z + 11, rr(0, 6), rp([col(0xd8d8d8), col(0x8a1a1a), col(0x30405a), col(0xe8e8e0)]));
    }
    /* road dressing */
    for (let z = -1000; z < 1000; z += 44) { const x = G.hwx(z); if (z > -625 && z < -515) continue; pole(x + 7.5, z, true); }
    for (let x = 110; x < 330; x += 44) pole(x, 105.5, x % 88 < 44);
    for (let z = -980; z < 980; z += rr(45, 110)) { if (z > -620 && z < -520) continue; const x = G.hwx(z) + rr(-3.5, 3.5), t = R(); if (G.blocked(x, z, 5)) continue; if (t < .35) car(x, z, rr(-.5, .5) + (R() < .5 ? 0 : Math.PI), rp([col(0xd8d8d8), col(0x8a1a1a), col(0x30405a), col(0x222222), col(0xc8a020)])); else if (t < .6) auto(x, z, rr(0, 6)); else if (t < .72) bus(x, z, rr(-.25, .25), rp([K.ksrtc, col(0x2e8b57), col(0x3a5fcd)]), K.autoY); }
    for (const q of [[352, 20, 0], [320, -150, 3], [352, 300, 0], [318, -470, 28]]) { const g = G.hAt(q[0], q[1]); sign(q[0], g + 3.6, q[1], 5, 1.7, 0, q[2], true); cyl('paint', q[0] - 2, g, q[1], .09, .09, 3.7, 5, K.steel); cyl('paint', q[0] + 2, g, q[1], .09, .09, 3.7, 5, K.steel); }
    /* vegetation */
    for (let t = 0; t < 26000 && palms.length < 1500; t++) {
      const x = rr(-100, 560), z = rr(-1000, 1000), d = x - G.coast(z), h = G.hAt(x, z); if (h < 1.3 || h > 40 || G.maskAt(x, z) || G.blocked(x, z, 1.4)) continue;
      let p = d < 30 ? 0 : d < 150 ? .85 : .3; const l = G.locAt(x, z); if (l && (l.id === 'town' || l.id === 'payyanur')) p *= .35; if (h > 10) p *= .4;
      if (x > 208 && x < 252 && z > 128 && z < 172) p = (x < 213 || z > 168) ? .5 : 0;
      if (x > -32 && x < 52 && z > 518 && z < 602) p = 0;
      p *= .35 + .9 * vnoise(x * .02, z * .02); if (R() > p) continue;
      palms.push([x, h, z, rr(7, 12.5), rr(.2, 1.6), rr(0, TAU), rr(.75, 1.1)]); G.addCircle(x, z, .22, h + 9, 'tree');
    }
    for (let t = 0; t < 9000; t++) {
      const x = rr(60, 560), z = rr(-1000, 1000), d = x - G.coast(z), h = G.hAt(x, z); if (d < 120 || h < 2.3 || G.maskAt(x, z) || G.blocked(x, z, 3)) continue;
      if (x > 205 && x < 255 && z > 125 && z < 175) continue;
      if (R() < .05 * (.3 + vnoise(x * .015 + 9, z * .015))) tree(x, z, rr(.8, 1.5));
    }
    const bc = [0x2c5a20, 0x3d6b24, 0x4a7a2a, 0x355f1f, 0x587a2c];
    for (let t = 0; t < 2600; t++) { const x = rr(-60, 560), z = rr(-1000, 1000), h = G.hAt(x, z), d = x - G.coast(z); if (h < 1.6 || d < 34 || G.maskAt(x, z) === 1 || G.blocked(x, z, 1.5)) continue; if (x > 209 && x < 251 && z > 129 && z < 171) continue; const s = rr(.5, 1.3); blobs.push([x, h + s * .35, z, s * rr(1, 1.6), s * .8, s * rr(1, 1.6), rp(bc)]); }
    for (let t = 0; t < 5000; t++) { const x = rr(-40, 420), z = rr(-1000, -500), h = G.hAt(x, z), d = x - G.coast(z); if (h < -.5 || h > .9 || d < 80) continue; const s = rr(1.4, 2.4); blobs.push([x, h + 1.5 * s, z, s * 1.5, s, s * 1.5, rp([0x2a5a2a, 0x1f4a25, 0x336a30])]); cyl('paint', x, h - .5, z, .5 * s, .12, 1.5 * s, 5, K.woodD); G.addCircle(x, z, .5, h + 3, 'tree'); }
  }

  function finalize(scene) {
    const M = G.mats, grp = new THREE.Group(); scene.add(grp);
    for (const k in BK) { const b = BK[k], g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(b.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(b.n, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(b.u, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(b.c, 3)); g.setIndex(b.i); g.computeBoundingSphere(); const m = new THREE.Mesh(g, M[b.name]); m.castShadow = b.name !== 'glow' && b.name !== 'sign'; m.receiveShadow = true; m.matrixAutoUpdate = false; grp.add(m); delete BK[k]; }
    // palms (two levels of detail)
    const mkTrunk = (NR, NA) => { const tp = [], ti = [], tu = []; for (let j = 0; j <= NR; j++) { const t = j / NR, r = .02 * (1.25 - .45 * t) * (j === 0 ? 1.5 : 1); for (let i = 0; i <= NA; i++) { const a = i / NA * TAU; tp.push(.12 * t * t + Math.cos(a) * r, t, Math.sin(a) * r); tu.push(i / NA, t * 4); } } for (let j = 0; j < NR; j++) for (let i = 0; i < NA; i++) { const a = j * (NA + 1) + i; ti.push(a, a + NA + 1, a + 1, a + 1, a + NA + 1, a + NA + 2); } const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(tp, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(tu, 2)); g.setIndex(ti); g.computeVertexNormals(); return g; };
    const mkCrown = (NF, NS) => { const cp = [], cu = [], ci = []; for (let f = 0; f < NF; f++) { const dead = NF > 9 && f % 6 === 5, u0 = dead ? .5 : 0, a = f / NF * TAU + (f % 2) * .25, L = (3.3 + (f % 3) * .45) * (dead ? .85 : 1), lift = dead ? -.9 : f % 2 ? .5 : 1.0, ca = Math.cos(a), sa = Math.sin(a), b0 = cp.length / 3; for (let s = 0; s <= NS; s++) { const t = s / NS, r = L * t, y = lift * 1.7 * t - 2.5 * t * t * (1.15 - lift * .35), w = .7 * Math.pow(Math.sin(Math.PI * (.08 + .9 * t)), .7) * (NF < 10 ? 1.5 : 1); cp.push(ca * r - sa * w, y - .4 * w, sa * r + ca * w, ca * r, y, sa * r, ca * r + sa * w, y - .4 * w, sa * r - ca * w); cu.push(u0, t, u0 + .25, t, u0 + .5, t); } for (let s = 0; s < NS; s++) { const q = b0 + s * 3; ci.push(q, q + 3, q + 1, q + 1, q + 3, q + 4, q + 1, q + 4, q + 2, q + 2, q + 4, q + 5); } } const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(cp, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(cu, 2)); g.setIndex(ci); g.computeVertexNormals(); return g; };
    const tg = mkTrunk(8, 8), cg = mkCrown(18, 8), tgL = mkTrunk(2, 3), cgL = mkCrown(7, 2);
    const nutG = (() => { const pp = [], nn = []; for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + .3, g = new THREE.IcosahedronGeometry(.12 + (k % 3) * .015, 1).toNonIndexed(), p = g.attributes.position, n = g.attributes.normal; for (let i = 0; i < p.count; i++) { pp.push(p.getX(i) + Math.cos(a) * .2, p.getY(i) * 1.12 - .25 - (k % 2) * .12, p.getZ(i) + Math.sin(a) * .2); nn.push(n.getX(i), n.getY(i), n.getZ(i)); } } const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pp, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nn, 3)); return g; })();
    const nutM = new THREE.MeshStandardMaterial({ color: 0x5f6a2a, roughness: .55 });
    const ft = canvasTex(256, 512, (c, w, h) => { c.clearRect(0, 0, w, h); const rq = mulberry(9); c.lineCap = 'round';
      for (const [ox, dead] of [[0, 0], [128, 1]]) { const mx = ox + 64;
        for (let y = h - 6; y > 4; y -= 5) { const ta = 1 - y / h, L = 60 * Math.pow(Math.sin(Math.PI * (.05 + .9 * ta)), .75) + 3;
          for (const sd of [-1, 1]) { const ex = mx + sd * L * .97, ey = y - L * .42 - rq() * 4, sh = .8 + rq() * .35;
            const g = c.createLinearGradient(mx, y, ex, ey); if (dead) { g.addColorStop(0, `rgb(${120 * sh | 0},${88 * sh | 0},${48 * sh | 0})`); g.addColorStop(1, `rgb(${165 * sh | 0},${128 * sh | 0},${72 * sh | 0})`); } else { g.addColorStop(0, `rgb(${58 * sh | 0},${100 * sh | 0},${30 * sh | 0})`); g.addColorStop(.7, `rgb(${96 * sh | 0},${150 * sh | 0},${46 * sh | 0})`); g.addColorStop(1, rq() < .25 ? `rgb(${150 * sh | 0},${150 * sh | 0},${70 * sh | 0})` : `rgb(${110 * sh | 0},${160 * sh | 0},${52 * sh | 0})`); }
            c.strokeStyle = g; c.lineWidth = 3.4 - ta * 1.2; c.beginPath(); c.moveTo(mx, y); c.quadraticCurveTo(mx + sd * L * .5, y - L * .12, ex, ey); c.stroke(); } }
        c.fillStyle = dead ? '#7a5a30' : '#7c8a3a'; c.beginPath(); c.moveTo(mx - 4, h); c.lineTo(mx + 4, h); c.lineTo(mx + .8, 0); c.lineTo(mx - .8, 0); c.fill(); }
    }, { repeat: false });
    const tm = new THREE.MeshStandardMaterial({ color: new THREE.Color(1.25, 1.2, 1.1), roughness: .95, map: G.T('palm_tree_bark_diff', 1), normalMap: G.T('palm_tree_bark_nor_gl') });
    const cm = new THREE.MeshStandardMaterial({ map: ft, alphaTest: .4, side: THREE.DoubleSide, roughness: .7 }); cm.color.setScalar(1.4);
    G.windU = { uTime: { value: 0 }, uWind: { value: .5 } };
    const sway = sh => { Object.assign(sh.uniforms, G.windU); sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uTime,uWind;').replace('#include <begin_vertex>', '#include <begin_vertex>\n float ph = instanceMatrix[3].x*.31 + instanceMatrix[3].z*.17; float amp = length(position.xz)*uWind; transformed.y += sin(uTime*1.7+ph+position.x*.8)*.07*amp; transformed.x += sin(uTime*1.1+ph)*.05*amp + uWind*.06*amp; transformed.z += cos(uTime*1.3+ph*1.3)*.04*amp;'); };
    cm.onBeforeCompile = sway;
    const dm = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: ft, alphaTest: .4 }); dm.onBeforeCompile = sway;
    const cells = (arr, zi) => { const m = new Map(); for (const p of arr) { const k = Math.floor(p[0] / 150) + ',' + Math.floor(p[zi] / 150); let a = m.get(k); if (!a) m.set(k, a = []); a.push(p); } return m; };
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), s = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), tc = new THREE.Color();
    const sphere = (arr, zi, pad) => { let cx = 0, cz = 0, cy = 0; for (const p of arr) { cx += p[0]; cz += p[zi]; cy += p[1]; } cx /= arr.length; cz /= arr.length; cy /= arr.length; let r = 0; for (const p of arr) r = Math.max(r, Math.hypot(p[0] - cx, p[zi] - cz)); return new THREE.Sphere(new THREE.Vector3(cx, cy + pad * .5, cz), r + pad); };
    const veg = G.veg = [];
    cells(palms, 2).forEach(arr => {
      const bs = sphere(arr, 2, 14), ch = { c: bs.center, r: bs.radius, hi: [], lo: [], far: 780 };
      for (const lod of [0, 1]) {
        const g1 = (lod ? tgL : tg).clone(), g2 = (lod ? cgL : cg).clone(); g1.boundingSphere = bs; g2.boundingSphere = bs;
        const tr = new THREE.InstancedMesh(g1, tm, arr.length), cr = new THREE.InstancedMesh(g2, cm, arr.length), cn = lod ? null : new THREE.InstancedMesh((() => { const g = nutG.clone(); g.boundingSphere = bs; return g; })(), nutM, arr.length);
        arr.forEach((p, i) => { q.setFromAxisAngle(up, p[5]); const k = 8 * p[6]; m4.compose(v.set(p[0], p[1] - .3, p[2]), q, s.set(k * p[4], p[3], k)); tr.setMatrixAt(i, m4); v.set(.12, 1, 0).applyMatrix4(m4); q.setFromAxisAngle(up, p[5] * 3); m4.compose(v, q, s.set(p[6] * 1.15, p[6] * 1.15, p[6] * 1.15)); cr.setMatrixAt(i, m4); if (cn) cn.setMatrixAt(i, m4); const gq = .75 + (i * 37 % 10) / 28; cr.setColorAt(i, tc.setRGB(gq * .9, gq, gq * .8)); });
        tr.castShadow = cr.castShadow = !lod; tr.receiveShadow = !lod; cr.customDepthMaterial = dm; tr.visible = cr.visible = !!lod; grp.add(tr, cr); (lod ? ch.lo : ch.hi).push(tr, cr); if (cn) { cn.castShadow = true; cn.visible = false; grp.add(cn); ch.hi.push(cn); }
      }
      veg.push(ch);
    });
    // blobs (tree canopies, bushes, mangroves)
    const ig = new THREE.IcosahedronGeometry(1, 1), ip = ig.attributes.position; for (let i = 0; i < ip.count; i++) { const k = 1 + (hash2(ip.getX(i) * 9.1 + ip.getY(i) * 3.3, ip.getZ(i) * 7.7) - .5) * .5; ip.setXYZ(i, ip.getX(i) * k, ip.getY(i) * k, ip.getZ(i) * k); } ig.computeVertexNormals();
    const igL = new THREE.IcosahedronGeometry(1.05, 0);
    for (const g of [ig, igL]) { const p = g.attributes.position, n = g.attributes.normal, v3 = new THREE.Vector3(); for (let i = 0; i < p.count; i++) { v3.fromBufferAttribute(p, i).normalize(); v3.y = v3.y * .7 + .3; v3.normalize(); n.setXYZ(i, v3.x, v3.y, v3.z); } }
    const bm = new THREE.MeshStandardMaterial({ roughness: .9 });
    const lt = canvasTex(512, 512, (c, w, h) => { c.clearRect(0, 0, w, h); const rq = mulberry(5);
      const leaf = (x, y, a, L, W, sh) => { c.save(); c.translate(x, y); c.rotate(a); const gr = c.createLinearGradient(0, -W, 0, W); gr.addColorStop(0, `rgb(${Math.min(255, 196 * sh) | 0},${Math.min(255, 238 * sh) | 0},${Math.min(255, 168 * sh) | 0})`); gr.addColorStop(1, `rgb(${150 * sh | 0},${196 * sh | 0},${120 * sh | 0})`); c.fillStyle = gr; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(L * .45, -W, L, 0); c.quadraticCurveTo(L * .45, W, 0, 0); c.fill(); c.strokeStyle = 'rgba(250,255,230,.3)'; c.lineWidth = 1; c.beginPath(); c.moveTo(1, 0); c.lineTo(L * .9, 0); c.stroke(); c.restore(); };
      for (let i = 0; i < 460; i++) { const a = rq() * TAU, r = Math.sqrt(rq()) * 196, x = 220 + Math.cos(a) * r, y = 256 + Math.sin(a) * r; leaf(x, y, rq() * TAU, 24 + rq() * 22, 7 + rq() * 5, .62 + rq() * .38 + (1 - r / 196) * .12); }
      c.save(); c.beginPath(); c.rect(448, 0, 64, 512); c.clip(); c.fillStyle = 'rgb(118,156,92)'; c.fillRect(448, 0, 64, 512); for (let i = 0; i < 220; i++) leaf(440 + rq() * 80, rq() * 512, rq() * TAU, 16 + rq() * 12, 5 + rq() * 3, .6 + rq() * .4); c.restore();
    }, { repeat: false, aniso: 4 });
    const lm = new THREE.MeshStandardMaterial({ map: lt, alphaTest: .45, side: THREE.DoubleSide, roughness: .85 }); lm.onBeforeCompile = sway;
    const ldm = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: lt, alphaTest: .45 });
    const mkLeaf = (det, NC) => { const pp = [], nn = [], uu = [], rq = mulberry(11), V3 = THREE.Vector3, up = new V3(0, 1, 0);
      const core = new THREE.IcosahedronGeometry(.8, det).toNonIndexed(), cp2 = core.attributes.position; for (let i = 0; i < cp2.count; i++) { const x = cp2.getX(i), y = cp2.getY(i), z = cp2.getZ(i), l = Math.hypot(x, y * .7 + .3, z) || 1; pp.push(x, y, z); nn.push(x / l, (y * .7 + .3) / l, z / l); uu.push(.885 + .1 * (.5 + Math.atan2(z, x) / TAU), .5 + .45 * y); }
      for (let k = 0; k < NC; k++) { const n = new V3(rq() * 2 - 1, rq() * 1.6 - .5, rq() * 2 - 1).normalize(), ce = n.clone().multiplyScalar(.55 + rq() * .2), t1 = new V3().crossVectors(n, Math.abs(n.y) > .9 ? new V3(1, 0, 0) : up).normalize(), t2 = new V3().crossVectors(n, t1), sz = .75 + rq() * .25, rot = rq() * TAU, ca = Math.cos(rot) * sz, sa = Math.sin(rot) * sz;
        const cor = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => ce.clone().addScaledVector(t1, a * ca - b * sa).addScaledVector(t2, a * sa + b * ca)), uv = [[0, 0], [.86, 0], [.86, 1], [0, 1]];
        for (const j of [0, 1, 2, 0, 2, 3]) { const p = cor[j], l = Math.hypot(p.x, p.y * .7 + .3, p.z) || 1; pp.push(p.x, p.y, p.z); nn.push(p.x / l, (p.y * .7 + .3) / l, p.z / l); uu.push(uv[j][0], uv[j][1]); } }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pp, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nn, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uu, 2)); return g; }, leafG = mkLeaf(1, 18), leafGL = mkLeaf(0, 7);
    cells(blobs, 2).forEach(arr => { const bs = sphere(arr, 2, 5), ch = { c: bs.center, r: bs.radius, hi: [], lo: [], far: 520 }; for (const lod of [0, 1]) { const g = (lod ? leafGL : leafG).clone(); g.boundingSphere = bs; const im = new THREE.InstancedMesh(g, lm, arr.length); if (!lod) im.customDepthMaterial = ldm; arr.forEach((b, i) => { q.setFromAxisAngle(up, i * 1.7); m4.compose(v.set(b[0], b[1], b[2]), q, s.set(b[3], b[4], b[5])); im.setMatrixAt(i, m4); im.setColorAt(i, tc.set(b[6]).convertSRGBToLinear()); }); im.castShadow = !lod; im.receiveShadow = !lod; im.visible = !!lod; grp.add(im); (lod ? ch.lo : ch.hi).push(im); } veg.push(ch); });
    G.updateVeg = cam => { for (const ch of veg) { const d = Math.hypot(cam.x - ch.c.x, cam.z - ch.c.z) - ch.r, hi = d < 95, on = d < ch.far; for (const m of ch.hi) m.visible = hi; for (const m of ch.lo) m.visible = !hi && on; } };
    grp.updateMatrixWorld(true);
    G.worldStats = { palms: palms.length, blobs: blobs.length, boxes: boxes.length, circles: circles.length, loot: G.lootPts.length };
  }

  /* ---------- minimap canvas ---------- */
  function buildMap() {
    const mw = 310, mh = 505, c = document.createElement('canvas'); c.width = mw; c.height = mh; const x = c.getContext('2d'), im = x.createImageData(mw, mh), d = im.data;
    for (let j = 0; j < mh; j++) for (let i = 0; i < mw; i++) { const wx = W.X0 + i * 4, wz = W.Z0 + j * 4, h = G.hAt(wx, wz), k = (j * mw + i) * 4, m = G.maskAt(wx, wz); let r, g, b; if (h < 0) { const t = clamp(-h / 8, 0, 1); r = 40 - 25 * t; g = 110 - 50 * t; b = 130 - 40 * t; } else if (h < 2.3) { r = 190; g = 170; b = 120; } else { const t = clamp((h - 2.3) / 30, 0, 1); r = 60 + 30 * t; g = 105 - 20 * t; b = 50; } if (m === 1) { r = 50; g = 50; b = 55; } else if (m === 2) { r = 150; g = 100; b = 70; } else if (m === 3) { r = 110; g = 160; b = 60; } d[k] = r; d[k + 1] = g; d[k + 2] = b; d[k + 3] = 255; }
    x.putImageData(im, 0, 0); x.fillStyle = 'rgba(40,25,20,.85)'; for (const b of boxes) if (b.tag === 'house' || b.tag === 'shop' || b.tag === 'tower' || b.tag === 'wall' || b.tag === 'temple') { x.save(); x.translate((b.x - W.X0) / 4, (b.z - W.Z0) / 4); x.rotate(-Math.atan2(b.s, b.c)); x.fillRect(-b.hw / 4, -b.hd / 4, Math.max(1, b.hw / 2), Math.max(1, b.hd / 2)); x.restore(); }
    G.mapCanvas = c;
  }

  G.buildWorld = scene => { makeMaterials(); buildTerrain(scene); populate(); finalize(scene); buildMap(); };
})();
