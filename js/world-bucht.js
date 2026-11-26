// Lochfrass! – Welt 2: Sonnenbucht (Strand, Promenade, Hotels, Hafen; Endboss Leuchtturm)
import { THREE, mergeGeometries, MAP, ROADS, BLOCKS, INK, R, pick, rnd, setSeed, P, GE, build, add, cBox, cCyl, cBall, cCone, flat, roadNet, edgeRing,
  person, bin, lamp, bench, building, scatter, freeSpot, canvasTex, speckle, shade, laneOf, MAT, NO_OUTLINE, C, TEX, walkState,
  wheels, addBoss, tube } from './kit.js';

export const env = { sky: ['#47b9ff', '#fff1cf'], fog: 0xfff1cf, hemi: [0xffffff, 0xf2d9a6, 1.6], sun: [0xfff1d6, 2.3], gravity: -30, dust: 0xf6e2b0 };

const SAND = canvasTex(256, (x, s) => { x.fillStyle = '#f6dc9c'; x.fillRect(0, 0, s, s); speckle(x, s, '214,180,110', .5, 500, 2); speckle(x, s, '255,248,225', .6, 300, 2); });
const PLANKS = canvasTex(128, (x, s) => { x.fillStyle = '#dba46c'; x.fillRect(0, 0, s, s); x.strokeStyle = '#b37a47'; x.lineWidth = 3;
  for (let i = 0; i <= 8; i++) { x.beginPath(); x.moveTo(0, i * 16); x.lineTo(s, i * 16); x.stroke(); }
  x.fillStyle = '#8a5a30'; for (let i = 0; i < 8; i++) for (const c of [10, 118]) x.fillRect(c, i * 16 + 6, 3, 3); });
const ROAD = canvasTex(256, (x, s) => { x.fillStyle = '#8d97a8'; x.fillRect(0, 0, s, s); speckle(x, s, '60,66,80', .35, 300); speckle(x, s, '205,210,222', .3, 200); });
const SW = ['#ff5a4e', '#4f8bff', '#ffd23f', '#ff7ac6', '#2fd3b9', '#9b6bff', '#ff8a3d'];   // Badesachen-Farben

// ---------- Leute und Tiere ----------
function swimmer(x, z) {   // Badegast, manche mit Schwimmring
  const c = pick(SW);
  return person(x, z, { shirt: rnd() < 0.5 ? pick(C.skin) : pick(SW), pants: pick(SW),
    extra: rnd() < 0.3 ? () => [P(new THREE.TorusGeometry(0.36, 0.1, 6, 16).toNonIndexed(), c, 0, 0.62, 0, 1, 1, 1, Math.PI / 2)] : null });
}
function crab(x, z) {   // Krabbe: läuft seitwärts
  const c = pick(['#ff5a3c', '#e8452c']), parts = [P(GE.sph, c, 0, 0.16, 0, 0.3, 0.14, 0.22)];
  for (const s of [-1, 1]) {
    parts.push(P(GE.sph, c, s * 0.38, 0.18, 0.14, 0.12, 0.08, 0.1), P(GE.sph, c, s * 0.46, 0.2, 0.24, 0.1, 0.07, 0.08));   // Scheren
    for (let i = 0; i < 3; i++) parts.push(P(GE.cylLo, c, s * 0.3, 0.07, -0.1 + i * 0.1, 0.025, 0.18, 0.025, 0, 0, s * 1.1));   // Beine
    parts.push(P(GE.cylLo, c, s * 0.08, 0.3, 0.12, 0.02, 0.14, 0.02), P(GE.sph, '#ffffff', s * 0.08, 0.38, 0.12, 0.05), P(GE.sph, INK, s * 0.08, 0.39, 0.16, 0.025));
  }
  return add(build(parts), x, z, { v: 1, cols: [cBox(0.34, 0.12, 0.24)], walk: walkState([0.6, 1.3], 0.03, { side: true, hop: 14 }) });
}

// ---------- Strandkram ----------
function beachBall(x, z) {
  const r = R(0.28, 0.4), cs = ['#ff5a4e', '#ffffff', '#4f8bff', '#ffd23f'], parts = [P(GE.sph, '#ffffff', 0, r, 0, r)];
  for (let i = 0; i < 4; i++) parts.push(P(GE.sph, cs[i], 0, r, 0, r * 1.01, r * 1.01, r * 0.3, 0, i * Math.PI / 4, 0));
  return add(build(parts), x, z, { v: 1, cols: [cBall(r)] });
}
function bucket(x, z) {   // Eimer + Schaufel
  const c = pick(SW);
  return add(build([P(GE.frust, c, 0, 0.2, 0, 0.2, 0.4, 0.2, Math.PI), P(GE.torus, shade(c, 0.7), 0, 0.4, 0, 0.2, 0.2, 0.2, Math.PI / 2),
    P(GE.rbox, pick(SW), 0.32, 0.05, 0.1, 0.12, 0.04, 0.5)]), x, z, { v: 1, ry: R(0, 6.28), cols: [cCyl(0.2, 0.2), cBox(0.07, 0.03, 0.25, 0.32, 0.03, 0.1)] });
}
function surfboard(x, z) {   // Surfbrett, steckt im Sand
  const c = pick(SW);
  return add(build([P(GE.sph, c, 0, 1.05, 0, 0.3, 1.05, 0.06), P(GE.box, '#ffffff', 0, 1.05, 0.055, 0.06, 1.6, 0.01)]), x, z,
    { v: 2, ry: R(0, 6.28), cols: [cBox(0.28, 1.0, 0.06, 0, 1.05)] });
}
function parasol(x, z) {   // Sonnenschirm: hoch und dünn, kippt gern
  const c = pick(SW), h = R(2.0, 2.4);
  return add(build([P(GE.cylLo, '#f4f4f4', 0, h / 2, 0, 0.045, h, 0.045), P(GE.cone, c, 0, h + 0.15, 0, 1.0, 0.42, 1.0),
    P(GE.cone, '#ffffff', 0, h + 0.18, 0, 0.5, 0.42, 0.5), P(GE.sph, c, 0, h + 0.4, 0, 0.08)]), x, z,
    { v: 4, ry: R(0, 6.28), cols: [cCyl(h / 2, 0.05), cCone(0.21, 1.0, 0, h + 0.15)] });
}
function deckChair(x, z, ry = R(0, 6.28)) {   // Liegestuhl
  const c = pick(SW), w = '#c98a52', parts = [P(GE.rbox, w, 0, 0.3, 0, 0.62, 0.08, 1.5), P(GE.rbox, c, 0, 0.36, 0.1, 0.55, 0.05, 1.2),
    P(GE.rbox, c, 0, 0.62, -0.72, 0.55, 0.05, 0.6, -0.9)];
  for (const [lx, lz] of [[0.28, 0.5], [-0.28, 0.5], [0.28, -0.5], [-0.28, -0.5]]) parts.push(P(GE.rbox, w, lx, 0.15, lz, 0.06, 0.3, 0.06));
  return add(build(parts), x, z, { v: 2, ry, cols: [cBox(0.31, 0.2, 0.75), cBox(0.28, 0.25, 0.25, 0, 0.6, -0.72)] });
}
function towel(x, z, ry = R(0, 6.28)) {
  const c = pick(SW), c2 = pick(['#ffffff', '#ffd23f', '#4f8bff']);
  return add(build([P(GE.box, c, 0, 0.02, 0, 0.9, 0.04, 1.8), P(GE.box, c2, 0, 0.025, 0.5, 0.9, 0.04, 0.25), P(GE.box, c2, 0, 0.025, -0.5, 0.9, 0.04, 0.25)]),
    x, z, { v: 1, ry, cols: [cBox(0.45, 0.03, 0.9)] });
}
function strandkorb(x, z, ry = R(-0.6, 0.6)) {   // Strandkorb mit Haube
  const c = pick(['#4f8bff', '#ff5a4e', '#2fd3b9', '#ffd23f']), wk = '#e8cf9a';
  return add(build([P(GE.rbox, wk, 0, 0.45, 0, 1.4, 0.9, 0.95), P(GE.rbox, wk, 0, 1.25, -0.25, 1.4, 0.8, 0.5),
    P(GE.hemi, wk, 0, 1.6, -0.1, 0.72, 0.45, 0.55), P(GE.rbox, c, 0, 0.95, 0.12, 1.2, 0.12, 0.6), P(GE.rbox, c, 0, 1.3, 0.02, 1.2, 0.55, 0.08)]),
    x, z, { v: 5, ry, cols: [cBox(0.7, 0.45, 0.48), cBox(0.7, 0.62, 0.28, 0, 1.4, -0.22)] });
}
function sandcastle(x, z) {
  const s = '#e8c77d', parts = [P(GE.box, s, 0, 0.25, 0, 1.0, 0.5, 1.0)];
  for (const [cx, cz] of [[-0.45, -0.45], [0.45, -0.45], [-0.45, 0.45], [0.45, 0.45]]) parts.push(P(GE.cyl, s, cx, 0.4, cz, 0.18, 0.8, 0.18), P(GE.cone, '#d9b56a', cx, 0.92, cz, 0.2, 0.25, 0.2));
  parts.push(P(GE.cylLo, '#ffffff', 0, 0.9, 0, 0.02, 0.8, 0.02), P(GE.box, '#ff5a4e', 0.12, 1.15, 0, 0.22, 0.14, 0.02));
  return add(build(parts), x, z, { v: 2, cols: [cBox(0.62, 0.45, 0.62)] });
}
function palm(x, z) {   // Palme: krummer Stamm, Wedel, Kokosnüsse
  const h = R(3.2, 4.4), lean = R(0.3, 0.8), a = R(0, 6.28), parts = [];
  for (let i = 0; i < 6; i++) { const t = i / 6, t2 = (i + 1) / 6, k = 0.2 - t * 0.06;
    parts.push(P(GE.cyl, i % 2 ? '#b07a45' : '#9a6236', Math.cos(a) * lean * t * t, h * (t + t2) / 2, Math.sin(a) * lean * t * t, k, h / 6 + 0.05, k)); }
  const tx = Math.cos(a) * lean, tz = Math.sin(a) * lean;
  for (let i = 0; i < 7; i++) { const b = i / 7 * 6.283 + R(-0.2, 0.2);
    parts.push(P(GE.sph, pick(['#3fae4b', '#56c457', '#2f9e45']), tx + Math.cos(b) * 0.95, h + 0.05, tz + Math.sin(b) * 0.95, 1.05, 0.13, 0.32, 0, -b, -0.35)); }
  for (let i = 0; i < 3; i++) { const b = i * 2.1; parts.push(P(GE.sph, '#7a4a2a', tx + Math.cos(b) * 0.22, h - 0.2, tz + Math.sin(b) * 0.22, 0.15)); }
  return add(build(parts), x, z, { v: 9, cols: [cCyl(h / 2, 0.2), cBall(1.1, tx, h - 0.3, tz)] });
}
function lifeguard(x, z, ry = 0) {   // Rettungsturm
  const parts = [], w = '#ffffff', r = '#ff5a4e';
  for (const [lx, lz] of [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]]) parts.push(P(GE.cylLo, w, lx, 1, lz, 0.08, 2, 0.08));
  parts.push(P(GE.rbox, '#dba46c', 0, 2.05, 0, 1.9, 0.15, 1.9), P(GE.rbox, r, 0, 2.75, -0.2, 1.6, 1.3, 1.3), P(GE.box, '#a8dcf5', 0, 2.85, 0.46, 1.2, 0.6, 0.05),
    P(GE.prism, w, 0, 3.4, -0.2, 1.9, 0.6, 1.6), P(GE.cylLo, w, 0.9, 3.6, 0.8, 0.03, 1.6, 0.03), P(GE.box, r, 1.15, 4.15, 0.8, 0.5, 0.32, 0.02),
    P(GE.rbox, w, 0, 1.0, 1.3, 0.5, 0.08, 1.4, 0.9));
  return add(build(parts), x, z, { v: 12, ry, cols: [cBox(0.85, 1.0, 0.85), cBox(0.95, 0.9, 0.95, 0, 2.9)] });
}
function shellFountain(x, z) {   // Muschelbrunnen auf dem Platz
  return add(build([P(GE.cyl, '#f3e2c2', 0, 0.3, 0, 2.1, 0.6, 2.1), P(GE.cyl, '#5cc8f5', 0, 0.58, 0, 1.85, 0.08, 1.85),
    P(GE.hemi, '#ffb3c7', 0, 0.6, 0, 0.9, 1.0, 0.9), P(GE.sph, '#fff6e8', 0, 1.75, 0, 0.35), P(GE.sph, '#5cc8f5', 0, 2.25, 0, 0.3)]), x, z,
    { v: 22, cols: [cCyl(0.3, 2.1), cBall(0.9, 0, 1.0)] });
}
function hut(x, z, ry = 0) {   // bunte Strandhütte
  return building(x, z, R(2.4, 3), R(2.2, 2.6), 1, { fh: 2.6, roof: 'pitched', base: false, awning: false, tile: 9, ry, rh: 0.4,
    wall: pick(['#7fd3ff', '#ffb3c7', '#fff09a', '#b8f0c0', '#ffffff']), roofCol: pick(['#ff5a4e', '#4f8bff', '#ffffff', '#ffd23f']) });
}
function containers(x, z, ry) {   // Container-Stapel am Hafen (fallen gemeinsam)
  const n = 1 + Math.floor(rnd() * 3), stack = [];
  for (let k = 0; k < n; k++) {
    const c = pick(['#ff5a4e', '#4f8bff', '#2fd3b9', '#ffd23f', '#ff8a3d']), parts = [P(GE.box, c, 0, 1.3, 0, 6, 2.6, 2.4)];
    for (let i = -2; i <= 2; i++) parts.push(P(GE.box, shade(c, 0.8), i * 1.15, 1.3, 1.22, 0.18, 2.3, 0.05), P(GE.box, shade(c, 0.8), i * 1.15, 1.3, -1.22, 0.18, 2.3, 0.05));
    stack.push(add(build(parts), x, z, { v: 15, ry, y: k * 2.6, cols: [cBox(3, 1.3, 1.2)] }));
  }
  for (const o of stack) o.link = stack;
}
function boat(x, z, ry) {   // Ruderboot am Strand
  const c = pick(['#ffffff', '#4f8bff', '#ff5a4e', '#ffd23f']);
  return add(build([P(GE.sph, c, 0, 0.35, 0, 1.6, 0.42, 0.7), P(GE.sph, '#8a5634', 0, 0.5, 0, 1.4, 0.2, 0.55), P(GE.rbox, '#c98a52', 0, 0.55, 0, 0.3, 0.08, 1.2)]),
    x, z, { v: 6, ry, cols: [cBox(1.5, 0.35, 0.65, 0, 0.35)] });
}
export function buggy(x, z, ry, drive) {   // Strandbuggy (vorne = +x)
  const c = pick(['#ff5a4e', '#ffd23f', '#2fd3b9', '#ff7ac6', '#4f8bff', '#ff8a3d']);
  const parts = [P(GE.rbox, c, 0, 0.75, 0, 3.0, 0.55, 1.6), P(GE.rbox, shade(c, 0.85), 0.9, 1.05, 0, 1.0, 0.3, 1.4), P(GE.rbox, '#3a4152', -0.3, 1.1, 0, 0.9, 0.35, 1.3),
    P(new THREE.TorusGeometry(0.75, 0.07, 6, 18).toNonIndexed(), '#3a4152', -0.3, 1.3, 0, 1, 1, 1, 0, Math.PI / 2, 0)];
  if (rnd() < 0.5) parts.push(P(GE.sph, pick(['#ffffff', '#ffd23f', '#ff7ac6']), -0.3, 2.1, 0, 1.3, 0.06, 0.32));   // Surfbrett auf dem Dach
  wheels(parts, [[1.05, 0.85], [-1.05, 0.85], [1.05, -0.85], [-1.05, -0.85]], 0.45, 0.35);
  return add(build(parts), x, z, { v: 14, ry, cols: [cBox(1.5, 0.55, 0.85, 0, 0.6), cBox(0.6, 0.45, 0.7, -0.3, 1.4)], ...(drive ? { drive } : {}) });
}

// ---------- Endboss: Leuchtturm ----------
function lighthouse(x, z) {
  const g = new THREE.Group(), mats = [], parts = [], cols = [cCyl(1.5, 9.0)];
  parts.push(P(tube(7.9, 8.3, 3, 40), '#a7afbf', 0, 1.5, 0), P(tube(8.0, 8.0, 0.4, 40), '#8a93a5', 0, 3.1, 0));   // Steinsockel
  for (let i = 0; i < 22; i++) { const a = i / 22 * 6.283; parts.push(P(GE.dodec, pick(['#8a93a5', '#a7afbf', '#7d8699']), Math.cos(a) * 8.3, 0.6, Math.sin(a) * 8.3, R(0.85, 1.05))); }   // Felsen ringsum
  let y = 3.3; const segs = 6, hs = 5;
  for (let i = 0; i < segs; i++) {   // rot-weiß gestreifter Turm, nach oben schmaler
    const r0 = 5.4 - i * 0.3, r1 = r0 - 0.3;
    parts.push(P(tube(r1, r0, hs), i % 2 ? '#ffffff' : '#ff4136', 0, y + hs / 2, 0));
    if (i % 2) parts.push(P(GE.rbox, '#3a4152', 0, y + hs / 2, r0 - 0.2, 0.9, 1.5, 0.4));   // Fenster
    y += hs;
  }
  parts.push(P(GE.rbox, '#8a5634', 0, 4.7, 5.25, 1.6, 2.6, 0.4));   // Tür
  parts.push(P(tube(4.8, 4.8, 0.5, 32), '#3a4152', 0, y + 0.25, 0));
  for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283; parts.push(P(GE.cylLo, '#3a4152', Math.cos(a) * 4.5, y + 1.0, Math.sin(a) * 4.5, 0.07, 1.2, 0.07)); }
  parts.push(P(new THREE.TorusGeometry(4.5, 0.1, 6, 40).toNonIndexed(), '#3a4152', 0, y + 1.6, 0, 1, 1, 1, Math.PI / 2));
  parts.push(P(tube(2.6, 2.6, 3.6), '#fff3a8', 0, y + 2.3, 0), P(GE.cone, '#ff4136', 0, y + 5.2, 0, 3.2, 2.2, 3.2), P(GE.sph, '#3a4152', 0, y + 6.5, 0, 0.4));
  cols.push(cCyl(15, 5.0, 0, 18.3), cCyl(3.5, 3.2, 0, y + 3.5));
  const em = MAT.clone(); mats.push(em); g.add(build(parts, em));
  // Lichtkegel, der sich dreht
  const bm = new THREE.MeshBasicMaterial({ color: 0xfff6b0, transparent: true, opacity: 0.4, depthWrite: false, toneMapped: false }); bm.userData = NO_OUTLINE;
  const beam = new THREE.Mesh(beamGeo(), bm); beam.position.y = y + 2.3; g.add(beam);
  const o = addBoss(g, x, z, cols, mats, y + 7, 9.3);
  o.anim = dt => { beam.rotation.y += dt * 1.1; };
  return o;
}
function beamGeo() {   // zwei Lichtkegel, die vom Licht nach außen breiter werden
  const a = new THREE.ConeGeometry(2.2, 16, 16, 1, true).rotateZ(-Math.PI / 2).translate(-9, 0, 0);
  return mergeGeometries([a, a.clone().rotateY(Math.PI)]);
}

// ---------- Welt bauen ----------
export function create() {
  setSeed(21);
  flat(700, 700, 0, 0, -0.03, TEX.water, 10);                       // Meer rundherum
  flat(2 * MAP + 26, 2 * MAP + 26, 0, 0, 0, SAND, 10);              // Sandinsel
  roadNet({ walk: PLANKS, road: ROAD, walkScale: 4, curbs: false });
  edgeRing(['#e8c87a', '#f0d590', '#dcb868'], [1.1, 1.6]);           // Dünen am Rand
  const PLAZAS = ['15,15', '-45,-15', '75,45', '-75,-45', '45,-75'];
  const BOSS = '45,-45';
  for (const bx of BLOCKS) for (const bz of BLOCKS) {
    const cd = Math.max(Math.abs(bx), Math.abs(bz)), r0 = rnd(), key = bx + ',' + bz;
    if (key === BOSS) { lighthouse(bx, bz); for (const [ox, oz] of [[-11, -11], [11, -11], [-11, 11], [11, 11]]) palm(bx + ox, bz + oz); continue; }
    const kind = PLAZAS.includes(key) ? 'plaza' : r0 < 0.17 ? 'beach' : r0 < 0.25 ? 'harbor' : r0 < 0.31 ? 'palms'
      : (cd <= 15 && r0 < 0.8) || (cd <= 45 && r0 < 0.56) ? 'hotel' : 'huts';
    if (kind === 'huts') {   // Strandhütten und Ferienhäuser
      for (const ox of [-5, 5]) for (const oz of [-5, 5]) {
        if (rnd() < 0.2) { hut(bx + ox, bz + oz); continue; }
        const k = rnd() + (cd < 50 ? 0.25 : 0.05), fl = k < 0.38 ? 1 : k < 0.82 ? 2 : 3, sz = fl === 1 ? [4.5, 5.5] : fl === 2 ? [5.5, 7] : [6.5, 8];
        building(bx + ox, bz + oz, R(sz[0], sz[1]), R(sz[0], sz[1] - 0.3), fl, { roof: rnd() < 0.6 ? 'pitched' : 'flat',
          wall: pick(['#ffffff', '#fff1d6', '#d4f2ff', '#ffe0e8', '#fff7b8']), roofCol: pick(['#4f8bff', '#2fd3b9', '#ff8a3d', '#ff5a4e']), awnCol: pick(SW) });
      }
      for (let i = 0; i < 3; i++) { const p = freeSpot(bx, bz, 9.5, 1.4); if (p) palm(...p); }
      for (let i = 0; i < 3; i++) { const p = freeSpot(bx, bz, 9.5, 0.5); if (p) (rnd() < 0.5 ? surfboard : bucket)(...p); }
    } else if (kind === 'hotel') {   // Hotel mit Balkonen
      building(bx, bz - 1, R(12, 14.5), R(10.5, 12.5), Math.round(R(5, 7)) + (cd <= 15 ? 2 : 0), { roof: 'flat', awning: false,
        wall: pick(['#ffffff', '#fff1d6', '#ffe0e8', '#d4f2ff']), balcony: pick(['#4f8bff', '#2fd3b9', '#ff8a3d', '#ff7ac6']), band: '#ffffff' });
      for (const [ox, oz] of [[-9, 9], [9, 9]]) palm(bx + ox, bz + oz);
      deckChair(bx - 4, bz + 9, Math.PI / 2); deckChair(bx - 2.6, bz + 9, Math.PI / 2); parasol(bx + 3, bz + 9.5);
    } else if (kind === 'beach') {   // Strand: Handtücher, Schirme, Liegestühle, Strandkörbe
      for (let i = 0; i < 9; i++) { const p = freeSpot(bx, bz, 10, 1.0); if (p) towel(...p); }
      for (let i = 0; i < 6; i++) { const p = freeSpot(bx, bz, 10, 1.2); if (p) parasol(...p); }
      for (let i = 0; i < 6; i++) { const p = freeSpot(bx, bz, 10, 0.9); if (p) deckChair(...p); }
      for (let i = 0; i < 3; i++) { const p = freeSpot(bx, bz, 10, 1.0); if (p) strandkorb(...p); }
      for (let i = 0; i < 4; i++) { const p = freeSpot(bx, bz, 10, 0.5); if (p) beachBall(...p); }
      for (let i = 0; i < 2; i++) { const p = freeSpot(bx, bz, 9, 0.8); if (p) sandcastle(...p); }
      for (let i = 0; i < 2; i++) { const p = freeSpot(bx, bz, 9, 1.8); if (p) boat(...p, R(0, 6.28)); }
      const p = freeSpot(bx, bz, 7, 1.5); if (p) lifeguard(...p, R(-0.5, 0.5));
    } else if (kind === 'palms') {   // Palmenhain mit Pool
      flat(8, 5, bx + R(-3, 3), bz + R(-3, 3), 0.012, TEX.water, 6);
      for (let i = 0; i < 11; i++) { const p = freeSpot(bx, bz, 10, 1.4); if (p) palm(...p); }
      for (let i = 0; i < 6; i++) { const p = freeSpot(bx, bz, 10, 0.9); if (p) deckChair(...p); }
      for (let i = 0; i < 3; i++) { const p = freeSpot(bx, bz, 9, 1.2); if (p) parasol(...p); }
      for (let i = 0; i < 2; i++) { const p = freeSpot(bx, bz, 9, 0.5); if (p) bin(...p); }
    } else if (kind === 'harbor') {   // Hafen: Container und Buggys
      flat(22, 22, bx, bz, 0.012, TEX.asphalt, 8);
      for (const oz of [-6, 0, 6]) for (const ox of [-4.5, 4.5]) if (rnd() < 0.8) containers(bx + ox, bz + oz, 0);
      for (let i = 0; i < 3; i++) buggy(bx - 7 + i * 7, bz + 10, 0);
      lamp(bx - 10, bz - 10, '#ffffff', '#bfe9ff'); lamp(bx + 10, bz - 10, '#ffffff', '#bfe9ff');
    } else {   // Platz an der Promenade
      flat(22, 22, bx, bz, 0.012, TEX.plaza, 4);
      shellFountain(bx, bz);
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.4; bench(bx + Math.cos(a) * 5.5, bz + Math.sin(a) * 5.5, -a - Math.PI / 2, '#ffffff'); }
      for (const [lx, lz] of [[-8, -8], [8, -8], [-8, 8], [8, 8]]) lamp(bx + lx, bz + lz, '#ffffff', '#bfe9ff');
      building(bx + 7, bz - 7.5, 3.5, 3, 1, { fh: 2.8, roof: 'pitched', base: false, rh: 0.4, wall: '#ffe0e8', roofCol: '#ff7ac6', awnCol: '#ffd23f' });   // Eisdiele
      for (let i = 0; i < 3; i++) { const p = freeSpot(bx, bz, 9, 0.5); if (p) bin(...p); }
      for (let i = 0; i < 3; i++) { const p = freeSpot(bx, bz, 10, 1.4); if (p) palm(...p); }
    }
  }
  for (const rc of ROADS) {   // Promenade: Laternen, Mülleimer, Kleinkram, parkende Buggys
    let step = 0;
    for (let t = -MAP + 3; t < MAP - 2; t += 10, step++) {
      if (ROADS.some(r => Math.abs(t - r) < 7)) continue;
      const s = step % 2 ? 1 : -1;
      lamp(t, rc + s * 4.4, '#ffffff', '#bfe9ff'); lamp(rc + s * 4.4, t, '#ffffff', '#bfe9ff');
      if (rnd() < 0.35) bin(t + 2, rc - s * 4.4);
      if (rnd() < 0.35) bin(rc - s * 4.4, t + 2);
      if (rnd() < 0.35) surfboard(t + 4, rc + s * 4.3); if (rnd() < 0.35) bucket(rc - s * 4.2, t - 4);
      if (rnd() < 0.3) palm(t - 4, rc - s * 4.4); if (rnd() < 0.3) palm(rc + s * 4.4, t - 4);   // Palmen an der Promenade
    }
    for (let t = -MAP + 6; t < MAP - 4; t += R(8, 13)) {
      if (ROADS.some(r => Math.abs(t - r) < 9)) continue;
      if (rnd() < 0.45) buggy(t, rc + pick([-1, 1]) * 2.4, 0);
      if (rnd() < 0.45) buggy(rc + pick([-1, 1]) * 2.4, t, Math.PI / 2);
    }
  }
  for (let i = 0; i < 34; i++) {   // fahrende Buggys
    const ax = rnd() < 0.5 ? 'x' : 'z', rc = pick(ROADS), dir = pick([-1, 1]), t = R(-MAP + 8, MAP - 8);
    const drive = { ax, rc, dir, sp: R(3.5, 5.5), curve: null, pending: null, decided: null };
    if (ax === 'x') buggy(t, laneOf('x', rc, dir), dir > 0 ? 0 : Math.PI, drive);
    else buggy(laneOf('z', rc, dir), t, dir > 0 ? -Math.PI / 2 : Math.PI / 2, drive);
  }
  scatter(260, swimmer, { r: 0.3 });   // Badegäste
  scatter(70, crab, { r: 0.3 });       // Krabben
  scatter(100, (x, z) => (rnd() < 0.4 ? beachBall : rnd() < 0.5 ? bucket : towel)(x, z), { r: 0.4 });
}
