// Lochfrass! – Welt 1: Vorstadt
import { THREE, MAP, ROADS, BLOCKS, INK, R, pick, rnd, setSeed, P, GE, build, add, cBox, cCyl, cBall, cCone, TEX, flat, roadNet, edgeRing,
  person, bin, lamp, bench, tree, pine, bush, building, scatter, freeSpot, setBoss, canvasTex, toon, C, laneOf, MAT } from './kit.js';

export const env = { sky: ['#4fb8ff', '#d6f1ff'], fog: 0xd6f1ff, hemi: [0xffffff, 0xb5d99a, 1.6], sun: [0xfff4e0, 2.2], gravity: -30 };

function hydrant(x, z) {
  return add(build([P(GE.cyl, '#ff4136', 0, 0.3, 0, 0.18, 0.6, 0.18), P(GE.sph, '#ff4136', 0, 0.6, 0, 0.18, 0.14, 0.18),
    P(GE.cyl, '#ffd23f', 0, 0.38, 0, 0.08, 0.5, 0.08, 0, 0, Math.PI / 2)]), x, z, { v: 1, cols: [cCyl(0.3, 0.19), cBall(0.17, 0, 0.6)] });
}
function small(x, z) {   // Hütchen, Briefkasten, Blumenkübel, Schild
  const k = rnd();
  if (k < 0.3) return add(build([P(GE.rbox, '#ff8a3d', 0, 0.04, 0, 0.5, 0.08, 0.5), P(GE.cone, '#ff8a3d', 0, 0.35, 0, 0.2, 0.6, 0.2),
    P(GE.cyl, '#ffffff', 0, 0.33, 0, 0.14, 0.1, 0.14)]), x, z, { v: 1, cols: [cBox(0.25, 0.04, 0.25), cCone(0.3, 0.2, 0, 0.35)] });
  if (k < 0.55) return add(build([P(GE.cylLo, '#3a4152', 0, 0.45, 0, 0.05, 0.9, 0.05), P(GE.rbox, '#ffd23f', 0, 1.0, 0, 0.42, 0.4, 0.3),
    P(GE.rbox, INK, 0, 1.05, 0.16, 0.25, 0.05, 0.02)]), x, z, { v: 1, ry: R(0, 6.28), cols: [cCyl(0.45, 0.06), cBox(0.21, 0.2, 0.15, 0, 1.0)] });
  if (k < 0.8) return add(build([P(GE.cyl, '#d9774a', 0, 0.25, 0, 0.32, 0.5, 0.32), P(GE.sph, pick(C.leaf), 0, 0.6, 0, 0.3, 0.22, 0.3),
    P(GE.sph, pick(['#ff7ac6', '#ffd23f', '#ff5a4e', '#ffffff']), 0.1, 0.78, 0.05, 0.09), P(GE.sph, pick(['#ff7ac6', '#9b6bff', '#ffffff']), -0.12, 0.74, -0.04, 0.08)]),
    x, z, { v: 1, cols: [cCyl(0.25, 0.32), cBall(0.27, 0, 0.62)] });
  const m = build([P(GE.cylLo, '#9aa3b5', 0, 0.9, 0, 0.05, 1.8, 0.05), P(GE.cyl, pick(['#4f8bff', '#ff5a4e', '#ffd23f']), 0, 1.9, 0, 0.32, 0.06, 0.32, Math.PI / 2)]);
  return add(m, x, z, { v: 1, ry: R(0, 6.28), cols: [cCyl(0.9, 0.06, 0, 0.9), cCyl(0.03, 0.32, 0, 1.9, 0, Math.PI / 2, 0)] });
}
export function car(x, z, ry, drive, cols = C.car) {
  const c = pick(cols);
  const parts = [P(GE.carBody, c, 0, 0.66, 0), P(GE.carCab, '#a8dcf5', -0.2, 1.3, 0), P(GE.rbox, c, -0.2, 1.68, 0, 1.95, 0.14, 1.55),
    P(GE.sph, '#fff6c8', 1.66, 0.75, 0.52, 0.12), P(GE.sph, '#fff6c8', 1.66, 0.75, -0.52, 0.12),
    P(GE.sph, '#ff4136', -1.68, 0.75, 0.55, 0.09), P(GE.sph, '#ff4136', -1.68, 0.75, -0.55, 0.09)];
  for (const [wx, wz] of [[1.1, 0.8], [-1.1, 0.8], [1.1, -0.8], [-1.1, -0.8]]) {
    parts.push(P(GE.cyl, '#2a2d36', wx, 0.4, wz, 0.4, 0.3, 0.4, Math.PI / 2)); parts.push(P(GE.cyl, '#d9dde5', wx, 0.4, wz * 1.07, 0.18, 0.3, 0.18, Math.PI / 2));
  }
  return add(build(parts), x, z, { v: 14, ry, cols: [cBox(1.7, 0.53, 0.86, 0, 0.53), cBox(0.95, 0.4, 0.75, -0.2, 1.3)], ...(drive ? { drive } : {}) });
}
function fountain(x, z) {
  return add(build([P(GE.cyl, '#cfd6e0', 0, 0.3, 0, 2.1, 0.6, 2.1), P(GE.cyl, '#5cc8f5', 0, 0.58, 0, 1.85, 0.08, 1.85),
    P(GE.cyl, '#cfd6e0', 0, 1.2, 0, 0.3, 1.6, 0.3), P(GE.cyl, '#cfd6e0', 0, 1.95, 0, 0.9, 0.2, 0.9),
    P(GE.sph, '#5cc8f5', 0, 2.35, 0, 0.4), P(GE.sph, '#5cc8f5', 0, 2.9, 0, 0.22)]), x, z,
    { v: 22, cols: [cCyl(0.3, 2.1), cCyl(0.8, 0.3, 0, 1.2), cCyl(0.12, 0.9, 0, 1.95)] });
}
// Endboss: riesiges Hochhaus. Es passt nur ins Loch, wenn das Loch die ganze Grundfläche umschließt, und fällt dann senkrecht hinein.
const GLASS = canvasTex(128, (x, s) => {
  const g = x.createLinearGradient(0, 0, s, s); g.addColorStop(0, '#5fb4f0'); g.addColorStop(1, '#9ad8ff'); x.fillStyle = g; x.fillRect(0, 0, s, s);
  x.fillStyle = 'rgba(255,255,255,.35)'; x.beginPath(); x.moveTo(10, 128); x.lineTo(60, 0); x.lineTo(80, 0); x.lineTo(30, 128); x.fill();
  x.fillStyle = '#eef3f8'; x.fillRect(0, 0, s, 10); x.fillRect(0, 0, 8, s); x.fillRect(64, 0, 5, s);
  x.strokeStyle = INK; x.lineWidth = 3; x.strokeRect(0, 0, s, s);
});
function boss(x, z) {
  const g = new THREE.Group(), mats = [], parts = [], cols = [cBox(6.7, 1.5, 6.7)];
  parts.push(P(GE.rbox, '#cfd6e0', 0, 1.5, 0, 13.4, 3, 13.4), P(GE.rbox, '#3a4152', 0, 1.4, 6.75, 4, 2.6, 0.3),
    P(GE.rbox, '#ff5a4e', 0, 3.1, 7.4, 5.5, 0.25, 1.4));
  let y = 3;
  for (const [s, hh] of [[12, 22], [9.5, 18], [7, 14]]) {
    const t = GLASS.clone(); t.needsUpdate = true; t.repeat.set(Math.round(s / 2), Math.round(hh / 2.5));
    const m = toon({ map: t }); mats.push(m);
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(s, hh, s).translate(0, y + hh / 2, 0), m);
    mesh.castShadow = mesh.receiveShadow = true; g.add(mesh);
    cols.push(cBox(s / 2, hh / 2, s / 2, 0, y + hh / 2));
    y += hh; parts.push(P(GE.rbox, '#e9eef5', 0, y, 0, s + 0.8, 0.7, s + 0.8));
  }
  parts.push(P(GE.cone, '#ffd23f', 0, y + 3, 0, 4, 6, 4), P(GE.cylLo, '#3a4152', 0, y + 8.5, 0, 0.25, 6, 0.25),
    P(GE.sph, '#ff4136', 0, y + 11.6, 0, 0.7));
  const em = MAT.clone(); mats.push(em); const ex = build(parts, em); g.add(ex);
  const o = add(g, x, z, { v: 1500, boss: true, cols, s: 10, mats });
  o.h = y + 12.3; o.footR = 9.5; o.need = 10.5; o.fk = 1;
  setBoss(o); return o;
}

export function create() {
  setSeed(7);
  flat(600, 600, 0, 0, 0, TEX.grass, 9);
  roadNet();
  edgeRing(['#4fb83a', '#5ccf3f']);
  const PLAZAS = ['15,-15', '-45,45', '75,-45', '-75,-75', '45,75'];
  for (const bx of BLOCKS) for (const bz of BLOCKS) {
    const cd = Math.max(Math.abs(bx), Math.abs(bz)), r0 = rnd();
    if (bx === -15 && bz === -15) {   // Endboss-Block
      boss(bx, bz);
      for (const [ox, oz] of [[-10, -10], [10, -10], [-10, 10], [10, 10]]) tree(bx + ox, bz + oz);
      continue;
    }
    const kind = PLAZAS.includes(bx + ',' + bz) ? 'plaza' : r0 < 0.2 ? 'park' : r0 < 0.28 ? 'parking' : (cd <= 15 && r0 < 0.75) || (cd <= 45 && r0 < 0.42) ? 'tower' : 'houses';
    if (kind === 'houses') {
      for (const ox of [-5, 5]) for (const oz of [-5, 5]) {
        if (rnd() < 0.12) { building(bx + ox, bz + oz, R(2.4, 3), R(2.2, 2.6), 1, { fh: 2.4, roof: 'pitched', base: false, awning: false, tile: 9,
          wall: pick(['#e0b07a', '#c98a52', '#bfe3c4', '#ffe2b0']), rh: 0.45 }); continue; }   // Gartenhaus
        // kleine Häuser: 1 Etage · mittlere: 2 · große: 3
        const k = rnd() + (cd < 50 ? 0.2 : 0), fl = k < 0.38 ? 1 : k < 0.82 ? 2 : 3;
        const sz = fl === 1 ? [4.5, 5.5] : fl === 2 ? [5.5, 7] : [6.5, 8];
        building(bx + ox, bz + oz, R(sz[0], sz[1]), R(sz[0], sz[1] - 0.3), fl, { roof: rnd() < 0.65 ? 'pitched' : 'flat' });
      }
      for (let i = 0; i < 5; i++) { const p = freeSpot(bx, bz); if (p) bush(...p); }
      for (let i = 0; i < 2; i++) { const p = freeSpot(bx, bz, 9.5, 1.4); if (p) (rnd() < 0.3 ? pine : tree)(...p); }
    } else if (kind === 'tower') {   // Wohnblock: 5 bis 9 Etagen
      building(bx, bz - 1, R(12, 15), R(11, 13), Math.round(R(5, 7)) + (cd <= 15 ? 2 : 0), { roof: 'flat', awning: false, balcony: pick(['#ff8a3d', '#4f8bff', '#2fd3b9', null]) });
      for (const [ox, oz] of [[-9, 9], [9, 9]]) tree(bx + ox, bz + oz);
      bench(bx - 4, bz + 9, Math.PI); bin(bx + 3, bz + 9.5);
    } else if (kind === 'park') {
      flat(9, 6, bx + R(-3, 3), bz + R(-3, 3), 0.012, TEX.water, 6);
      for (let i = 0; i < 12; i++) { const p = freeSpot(bx, bz, 10, 1.3); if (p) (rnd() < 0.35 ? pine : tree)(...p); }
      for (let i = 0; i < 7; i++) { const p = freeSpot(bx, bz, 10, 0.7); if (p) bush(...p); }
      for (let i = 0; i < 4; i++) { const p = freeSpot(bx, bz, 8, 1); if (p) bench(...p, R(0, 6)); }
      for (let i = 0; i < 2; i++) { const p = freeSpot(bx, bz, 9, 0.5); if (p) bin(...p); }
    } else if (kind === 'parking') {
      flat(22, 22, bx, bz, 0.012, TEX.asphalt, 8);
      for (const oz of [-5, 5]) for (let i = 0; i < 5; i++) if (rnd() < 0.8) car(bx - 8 + i * 4, bz + oz, Math.PI / 2 * (oz > 0 ? 1 : -1));
      lamp(bx - 10, bz); lamp(bx + 10, bz);
    } else {
      flat(22, 22, bx, bz, 0.012, TEX.plaza, 4);
      fountain(bx, bz);
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.4; bench(bx + Math.cos(a) * 5.5, bz + Math.sin(a) * 5.5, -a - Math.PI / 2); }
      for (const [lx, lz] of [[-8, -8], [8, -8], [-8, 8], [8, 8]]) lamp(bx + lx, bz + lz);
      building(bx + 7, bz - 7.5, 3.5, 3, 1, { fh: 2.8, roof: 'pitched', base: false, rh: 0.4 });   // Kiosk
      for (let i = 0; i < 4; i++) { const p = freeSpot(bx, bz, 9, 0.5); if (p) bin(...p); }
      for (let i = 0; i < 4; i++) { const p = freeSpot(bx, bz, 10, 0.7); if (p) bush(...p); }
    }
  }
  for (const rc of ROADS) {   // Gehweg-Ausstattung + parkende Autos
    let step = 0;
    for (let t = -MAP + 3; t < MAP - 2; t += 10, step++) {
      if (ROADS.some(r => Math.abs(t - r) < 7)) continue;
      const s = step % 2 ? 1 : -1;
      lamp(t, rc + s * 4.4); lamp(rc + s * 4.4, t);
      if (rnd() < 0.35) bin(t + 2, rc - s * 4.4);
      if (rnd() < 0.35) bin(rc - s * 4.4, t + 2);
      if (rnd() < 0.15) hydrant(t - 2, rc + s * 4.5);
      if (rnd() < 0.3) small(t + 4, rc + s * 4.2); if (rnd() < 0.3) small(rc - s * 4.2, t - 4);
    }
    for (let t = -MAP + 6; t < MAP - 4; t += R(8, 13)) {
      if (ROADS.some(r => Math.abs(t - r) < 9)) continue;
      if (rnd() < 0.45) car(t, rc + pick([-1, 1]) * 2.4, 0);
      if (rnd() < 0.45) car(rc + pick([-1, 1]) * 2.4, t, Math.PI / 2);
    }
  }
  // Fahrende Autos: Rechtsverkehr, biegen an Kreuzungen ab und wenden am Kartenrand
  for (let i = 0; i < 30; i++) {
    const ax = rnd() < 0.5 ? 'x' : 'z', rc = pick(ROADS), dir = pick([-1, 1]), t = R(-MAP + 8, MAP - 8);
    const drive = { ax, rc, dir, sp: R(3.5, 5.5), curve: null, pending: null, decided: null };
    if (ax === 'x') car(t, laneOf('x', rc, dir), dir > 0 ? 0 : Math.PI, drive);
    else car(laneOf('z', rc, dir), t, dir > 0 ? -Math.PI / 2 : Math.PI / 2, drive);
  }
  scatter(300, (x, z) => person(x, z), { r: 0.3 });   // Menschen
  scatter(160, small, { r: 0.4 });                     // Kleinkram verstreut
}
