'use strict';
/* UNDERTOW — rig: skinned human characters (Kenney CC0 mesh + skins) driven by a procedural pose.
   The pose (rig.T → rig.P) is written in a simple convention — model faces +z, limbs hang down,
   +x rotation swings a limb backward — and retargeted onto the real skeleton every frame. */
(function () {
  const Rig = G.Rig = { ready: false }, Q = THREE.Quaternion, V3 = THREE.Vector3;
  let tpl = null, info = {}, K = 1, Y0 = 0; const texC = {}, matC = {}, geoC = {};
  const DRIVE = ['Hips', 'Spine', 'Chest', 'UpperChest', 'Neck', 'Head', 'LeftArm', 'LeftForeArm', 'LeftHand', 'RightArm', 'RightForeArm', 'RightHand', 'LeftUpLeg', 'LeftLeg', 'LeftFoot', 'RightUpLeg', 'RightLeg', 'RightFoot', 'Head_end', 'LeftShoulder', 'RightShoulder'];
  Rig.SKINS = ['zombieA', 'zombieC', 'zombieMaleA', 'zombieFemaleA', 'humanMaleA', 'humanFemaleA', 'survivorMaleB', 'survivorFemaleA', 'skaterMaleA', 'skaterFemaleA', 'criminalMaleA', 'cyborgFemaleA'];
  Rig.load = (done, fail) => {
    new THREE.FBXLoader().load('assets/kenney/characterMedium.fbx', o => {
      tpl = o; const B = {}; o.traverse(n => { if (n.isBone) B[n.name] = n; if (n.isSkinnedMesh) { n.castShadow = true; n.frustumCulled = false; } });
      // nudge the toy proportions toward a real person: smaller head, longer legs
      B.Head.scale.multiplyScalar(.62); B.LeftUpLeg.scale.y *= 1.28; B.RightUpLeg.scale.y *= 1.28; B.Neck.scale.y *= 1.15;
      o.updateMatrixWorld(true); const p = new V3(), c = new V3(), down = new V3(0, -1, 0);
      for (const n of DRIVE) { const b = B[n]; if (!b) continue; const W = b.getWorldQuaternion(new Q()); info[n] = { rest: b.quaternion.clone(), W, Wi: W.clone().invert(), s0: b.scale.clone() }; }
      for (const [n, ch] of [['LeftArm', 'LeftForeArm'], ['RightArm', 'RightForeArm']]) { p.setFromMatrixPosition(B[n].matrixWorld); c.setFromMatrixPosition(B[ch].matrixWorld).sub(p).normalize(); const A = new Q().setFromUnitVectors(c, down); info[n].A = A; info[n].Ai = A.clone().invert(); }
      const top = p.setFromMatrixPosition(B.Head_end.matrixWorld).y, bot = c.setFromMatrixPosition(B.LeftToes.matrixWorld).y - 1.3; K = 1.74 / (top - bot); Y0 = -bot * K;
      Rig.ready = true; done && done();
    }, undefined, e => { console.error('character model failed to load', e); fail && fail(e); });
  };
  function tex(name) { if (!texC[name]) { const t = texC[name] = new THREE.TextureLoader().load('assets/kenney/' + name + '.png'); t.encoding = THREE.sRGBEncoding; t.anisotropy = 2; } return texC[name]; }
  function mat(skin, tint) { const k = skin + (tint || 0xffffff); return matC[k] || (matC[k] = new THREE.MeshLambertMaterial({ map: tex(skin), color: col(tint || 0xffffff), skinning: true })); }
  const stumpM = Rig.stumpM = new THREE.MeshLambertMaterial({ color: col(0x7a0d0a) }), stumpG = new THREE.SphereGeometry(1, 8, 6), woundG = new THREE.SphereGeometry(.05, 6, 4);
  const plain = hex => matC['p' + hex] || (matC['p' + hex] = new THREE.MeshLambertMaterial({ color: col(hex), side: THREE.DoubleSide }));
  /* o: {skin, tint, scale, fat, skirt:'mundu'|'lungi'|'sari', skirtCol, cap:hex} */
  Rig.make = o => {
    const model = THREE.SkeletonUtils.clone(tpl), root = new THREE.Group(), body = new THREE.Group(), lift = new THREE.Group(), bones = {}, sc = o.scale || 1, fat = o.fat || 1;
    model.traverse(n => { if (n.isBone) bones[n.name] = n; if (n.isSkinnedMesh) { n.material = mat(o.skin, o.tint); n.castShadow = true; n.frustumCulled = false; } });
    model.scale.setScalar(K); model.position.y = Y0; lift.add(model); body.add(lift); root.add(body); root.scale.setScalar(sc);
    if (fat > 1) { bones.Spine.scale.x *= fat; bones.Spine.scale.z *= fat; bones.Neck.scale.x /= fat; bones.Neck.scale.z /= fat; }
    const rig = { root, body, lift, model, bones, scale: sc, fat, socks: {}, stumps: {}, miss: {}, wounds: 0, skin: o.skin,
      P: { bRx: 0, bRy: 0, bRz: 0, bY: 0, hY: .94, spX: 0, spY: 0, spZ: 0, nkX: 0, nkY: 0, nkZ: 0, jaw: 0, aLx: 0, aLy: 0, aLz: .1, aRx: 0, aRy: 0, aRz: -.1, eL: 0, eR: 0, lLx: 0, lRx: 0, lLz: 0, lRz: 0, kL: 0, kR: 0, hLx: 0, hRx: 0 } };
    rig.T = Object.assign({}, rig.P);
    if (o.skirt) { const L = o.skirt === 'sari' ? .78 : o.skirt === 'lungi' ? .42 : .66, k = 'sk' + L, g = geoC[k] || (geoC[k] = new THREE.CylinderGeometry(.19, .2 + L * .12, L, 10, 1, true).translate(0, -L / 2 + .06, 0)); const m = new THREE.Mesh(g, plain(o.skirtCol)); m.castShadow = true; m.scale.set(1.05 * fat, 1, .8 * fat); Rig.sock(rig, 'Hips').add(m); rig.skirt = m; }
    if (o.cap) { const g = geoC.cap || (geoC.cap = new THREE.CylinderGeometry(.115, .13, .08, 10)); const m = new THREE.Mesh(g, plain(o.cap)); m.position.set(0, .25, .0); Rig.sock(rig, 'Head').add(m); }
    Rig.apply(rig, 1);
    return rig;
  };
  // a child group on a bone whose axes match the pose convention and whose units are metres
  Rig.sock = (r, name) => {
    if (r.socks[name]) return r.socks[name]; const b = r.bones[name], I = info[name], g = new THREE.Group(), arm = name.startsWith('Left') ? info.LeftArm : name.startsWith('Right') ? info.RightArm : null, isArm = arm && /Arm|Hand/.test(name);
    g.quaternion.copy(I.Wi); if (isArm) g.quaternion.multiply(arm.Ai);
    const ws = b.getWorldScale(new V3()), rs = r.root.getWorldScale(new V3()); g.scale.set(rs.x / ws.x, rs.y / ws.y, rs.z / ws.z); b.add(g); return r.socks[name] = g;
  };
  const KEYS = Object.keys({ bRx: 0, bRy: 0, bRz: 0, bY: 0, hY: 0, spX: 0, spY: 0, spZ: 0, nkX: 0, nkY: 0, nkZ: 0, jaw: 0, aLx: 0, aLy: 0, aLz: 0, aRx: 0, aRy: 0, aRz: 0, eL: 0, eR: 0, lLx: 0, lRx: 0, lLz: 0, lRz: 0, kL: 0, kR: 0, hLx: 0, hRx: 0 });
  Rig.reset = T => { for (let i = 0; i < KEYS.length; i++) T[KEYS[i]] = 0; T.hY = .94; T.aLz = .1; T.aRz = -.1; };
  const e = new THREE.Euler(), d = new Q(), q = new Q();
  function drive(r, name, x, y, z, mode) {
    const b = r.bones[name], I = info[name]; d.setFromEuler(e.set(x, y, z, 'XYZ'));
    if (mode === 1) d.multiply(I.A); else if (mode === 2) { const A = name[0] === 'L' ? info.LeftArm : info.RightArm; q.copy(A.Ai).multiply(d).multiply(A.A); d.copy(q); }
    b.quaternion.copy(I.rest).multiply(I.Wi).multiply(d).multiply(I.W);
  }
  Rig.apply = (r, k) => {
    const P = r.P, T = r.T; k = Math.min(1, k); for (let i = 0; i < KEYS.length; i++) { const n = KEYS[i]; P[n] += (T[n] - P[n]) * k; }
    r.body.rotation.set(P.bRx, P.bRy, P.bRz); r.body.position.y = P.bY; r.lift.position.y = P.hY - .94;
    drive(r, 'Spine', P.spX * .5, P.spY * .5, P.spZ * .5); drive(r, 'Chest', P.spX * .5, P.spY * .5, P.spZ * .5);
    drive(r, 'Neck', P.nkX * .5, P.nkY * .5, P.nkZ * .5); drive(r, 'Head', P.nkX * .5, P.nkY * .5, P.nkZ * .5);
    drive(r, 'LeftArm', P.aLx, P.aLy, P.aLz + .12, 1); drive(r, 'RightArm', P.aRx, P.aRy, P.aRz - .12, 1);
    drive(r, 'LeftForeArm', P.eL, 0, 0, 2); drive(r, 'RightForeArm', P.eR, 0, 0, 2);
    drive(r, 'LeftUpLeg', P.lLx, 0, P.lLz); drive(r, 'RightUpLeg', P.lRx, 0, P.lRz); drive(r, 'LeftLeg', P.kL, 0, 0); drive(r, 'RightLeg', P.kR, 0, 0);
    drive(r, 'LeftFoot', P.hLx, 0, 0); drive(r, 'RightFoot', P.hRx, 0, 0);
    if (r.skirt) r.skirt.rotation.x = (P.lLx + P.lRx) * .3;
  };
  const PT = { hips: 'Hips', neck: 'Neck', head: 'Head', headTop: 'Head_end', chest: 'UpperChest', shL: 'LeftArm', elbL: 'LeftForeArm', handL: 'LeftHand', shR: 'RightArm', elbR: 'RightForeArm', handR: 'RightHand', hipL: 'LeftUpLeg', kneeL: 'LeftLeg', footL: 'LeftFoot', hipR: 'RightUpLeg', kneeR: 'RightLeg', footR: 'RightFoot' };
  Rig.pt = (r, name, out) => out.setFromMatrixPosition(r.bones[PT[name]].matrixWorld);
  const SEV = { head: ['Head', 'Neck', .075], armL: ['LeftArm', 'LeftShoulder', .06], armR: ['RightArm', 'RightShoulder', .06], legL: ['LeftLeg', 'LeftUpLeg', .075], legR: ['RightLeg', 'RightUpLeg', .075] };
  Rig.sever = (r, part) => {
    if (r.miss[part]) return; r.miss[part] = true; const [bn, pn, rad] = SEV[part], b = r.bones[bn], s = Rig.sock(r, pn), m = new THREE.Mesh(stumpG, stumpM), p = new V3();
    r.root.updateMatrixWorld(true); p.setFromMatrixPosition(b.matrixWorld); s.worldToLocal(p); m.position.copy(p); m.scale.setScalar(rad); s.add(m); r.stumps[part] = m; b.scale.setScalar(.0001);
  };
  const WB = { torso: 'Chest', head: 'Head', armL: 'LeftArm', armR: 'RightArm', legL: 'LeftUpLeg', legR: 'RightUpLeg' };
  Rig.wound = (r, part, wx, wy, wz) => { if (r.wounds >= 7 || r.miss[part]) return; const s = Rig.sock(r, WB[part]), m = new THREE.Mesh(woundG, stumpM); s.worldToLocal(m.position.set(wx, wy, wz)); m.scale.set(1, 1.2, 1); s.add(m); r.wounds++; };
  // hold something in the right hand: barrel (-z of the object) runs along the forearm
  Rig.hold = (r, obj, side) => { const s = Rig.sock(r, side === 'L' ? 'LeftHand' : 'RightHand'); obj.rotation.set(-Math.PI / 2, 0, Math.PI); obj.position.set(0, -.07, .03); s.add(obj); return s; };
  Rig.dispose = r => { if (r.root.parent) r.root.parent.remove(r.root); };
})();
