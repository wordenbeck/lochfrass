// Lochfrass! – Welt 4: Rummelplatz (Buden, Fahrgeschäfte, Zirkus; Endboss Freifallturm)
import { THREE, MAP, ROADS, BLOCKS, INK, R, pick, rnd, setSeed, P, GE, build, add, cBox, cCyl, cBall, cCone, cHull, flat, roadNet, edgeRing, blocked,
  person, bin, lamp, bench, tree, bush, building, scatter, freeSpot, canvasTex, speckle, shade, laneOf, MAT, TEX, walkState,
  wheels, addBoss, tube } from './kit.js';

export const env = { sky: ['#5aa8ff', '#ffe3f1'], fog: 0xffe3f1, hemi: [0xffffff, 0xf0c8d8, 1.6], sun: [0xfff0e0, 2.2], gravity: -30, dust: 0xf6e2c0 };

const GRAVEL = canvasTex(256, (x, s) => { x.fillStyle = '#eadcc0'; x.fillRect(0, 0, s, s); speckle(x, s, '190,170,135', .5, 500, 3); speckle(x, s, '255,250,235', .6, 300, 2); });
const PAVE = canvasTex(128, (x, s) => { x.fillStyle = '#d9826a'; x.fillRect(0, 0, s, s); x.strokeStyle = '#b8604a'; x.lineWidth = 3;
  for (let r = 0; r < 8; r++) { x.beginPath(); x.moveTo(0, r * 16); x.lineTo(s, r * 16); x.stroke();
    for (let c = 0; c < 4; c++) { const px = c * 32 + (r % 2) * 16; x.beginPath(); x.moveTo(px, r * 16); x.lineTo(px, r * 16 + 16); x.stroke(); } } });
const PLATE = canvasTex(128, (x, s) => { x.fillStyle = '#6d7686'; x.fillRect(0, 0, s, s); x.strokeStyle = '#8a93a5'; x.lineWidth = 3;
  for (let i = -8; i < 8; i++) { x.beginPath(); x.moveTo(i * 16, 0); x.lineTo(i * 16 + s, s); x.stroke(); } });
const BAL = ['#ff5a4e', '#ffd23f', '#4f8bff', '#2fd3b9', '#ff7ac6', '#9b6bff'];
const RIM = new THREE.TorusGeometry(1, 0.025, 6, 48).toNonIndexed();

// Streifen nach Winkel einfärben (für Zelte, Dächer, Plattformen)
function stripes(g, c1, c2, n) {
  const pos = g.attributes.position, col = g.attributes.color, A = new THREE.Color(c1), B = new THREE.Color(c2);
  for (let i = 0; i < pos.count; i += 3) {
    const cx = pos.getX(i) + pos.getX(i + 1) + pos.getX(i + 2), cz = pos.getZ(i) + pos.getZ(i + 1) + pos.getZ(i + 2);
    const k = Math.floor(((Math.atan2(cz, cx) / 6.2832 + 1) % 1) * n) % 2 ? B : A;
    for (let j = 0; j < 3; j++) col.setXYZ(i + j, k.r, k.g, k.b);
  }
  return g;
}

// ---------- Leute ----------
function visitor(x, z) {   // manche mit Luftballon
  return person(x, z, { extra: rnd() < 0.25 ? () => [P(GE.cylLo, '#ffffff', 0.3, 1.75, 0, 0.012, 1.4, 0.012), P(GE.sph, pick(BAL), 0.3, 2.7, 0, 0.3, 0.36, 0.3)] : null });
}
function clown(x, z) {
  return person(x, z, { shirt: pick(['#ff5a4e', '#ffd23f', '#4f8bff']), pants: pick(['#2fd3b9', '#ff7ac6', '#9b6bff']), hair: pick(['#ff5a4e', '#2fd3b9', '#ff8a3d']),
    extra: () => [P(GE.sph, '#ff4136', 0, 1.3, 0.21, 0.07), P(GE.sph, pick(BAL), 0, 1.42, -0.03, 0.3, 0.12, 0.3), P(GE.cone, '#ffd23f', 0, 1.68, 0, 0.12, 0.3, 0.12)] });
}
function ghost(x, z) {   // Gespenst aus der Geisterbahn: schwebt herum
  const parts = [P(GE.sph, '#ffffff', 0, 1.3, 0, 0.42, 0.5, 0.42), P(GE.cyl, '#ffffff', 0, 0.95, 0, 0.42, 0.7, 0.42)];
  for (let i = 0; i < 5; i++) { const a = i / 5 * 6.283; parts.push(P(GE.sph, '#ffffff', Math.cos(a) * 0.3, 0.62, Math.sin(a) * 0.3, 0.14)); }
  parts.push(P(GE.sph, INK, 0.14, 1.4, 0.36, 0.07, 0.1, 0.05), P(GE.sph, INK, -0.14, 1.4, 0.36, 0.07, 0.1, 0.05), P(GE.sph, INK, 0, 1.15, 0.39, 0.08, 0.06, 0.04));
  return add(build(parts), x, z, { v: 1, cols: [cCyl(0.8, 0.42)], walk: walkState([0.4, 0.9], 0.35, { hop: 2.5 }) });
}

// ---------- Kleinkram ----------
function small(x, z) {   // Eis, Popcorn, Becher, Teddy, Lutscher, Quietscheente
  const k = rnd();
  if (k < 0.2) return add(build([P(GE.cone, '#e0a95c', 0, 0.25, 0, 0.16, 0.5, 0.16, Math.PI), P(GE.sph, pick(['#ffd6e8', '#fff1b8', '#c98a52', '#b8f0c0']), 0, 0.55, 0, 0.2)]),
    x, z, { v: 1, cols: [cCone(0.25, 0.16), cBall(0.2, 0, 0.55)] });
  if (k < 0.4) return add(build([P(GE.frust, '#ff5a4e', 0, 0.3, 0, 0.25, 0.6, 0.25, Math.PI), P(GE.box, '#ffffff', 0, 0.3, 0, 0.27, 0.6, 0.06), P(GE.sph, '#fff6c8', 0, 0.62, 0, 0.26, 0.14, 0.26)]),
    x, z, { v: 1, cols: [cCyl(0.35, 0.25)] });
  if (k < 0.55) return add(build([P(GE.frust, pick(BAL), 0, 0.25, 0, 0.18, 0.5, 0.18, Math.PI), P(GE.cyl, '#ffffff', 0, 0.52, 0, 0.19, 0.04, 0.19), P(GE.cylLo, '#ff4136', 0.05, 0.7, 0, 0.02, 0.4, 0.02, 0, 0, 0.2)]),
    x, z, { v: 1, cols: [cCyl(0.27, 0.18)] });
  if (k < 0.75) { const c = pick(['#c98a52', '#ffb3c7', '#fff1d6', '#a8dcf5']);
    return add(build([P(GE.sph, c, 0, 0.3, 0, 0.3, 0.3, 0.25), P(GE.sph, c, 0, 0.72, 0, 0.22), P(GE.sph, c, 0.17, 0.9, 0, 0.08), P(GE.sph, c, -0.17, 0.9, 0, 0.08),
      P(GE.sph, INK, 0.07, 0.76, 0.2, 0.03), P(GE.sph, INK, -0.07, 0.76, 0.2, 0.03), P(GE.sph, c, 0.25, 0.12, 0.1, 0.1), P(GE.sph, c, -0.25, 0.12, 0.1, 0.1)]),
      x, z, { v: 1, ry: R(0, 6.28), cols: [cBox(0.3, 0.5, 0.25)] }); }
  if (k < 0.9) return add(build([P(GE.cylLo, '#ffffff', 0, 0.5, 0, 0.03, 1.0, 0.03), P(GE.cyl, pick(BAL), 0, 1.15, 0, 0.32, 0.08, 0.32, Math.PI / 2), P(GE.cyl, '#ffffff', 0, 1.15, 0.01, 0.18, 0.09, 0.18, Math.PI / 2)]),
    x, z, { v: 1, ry: R(0, 6.28), cols: [cCyl(0.5, 0.05), cBox(0.32, 0.32, 0.05, 0, 1.15)] });
  return add(build([P(GE.sph, '#ffd23f', 0, 0.22, 0, 0.3, 0.22, 0.36), P(GE.sph, '#ffd23f', 0, 0.48, 0.18, 0.18), P(GE.sph, '#ff8a3d', 0, 0.45, 0.36, 0.09, 0.04, 0.09),
    P(GE.sph, INK, 0.08, 0.52, 0.32, 0.03), P(GE.sph, INK, -0.08, 0.52, 0.32, 0.03)]), x, z, { v: 1, ry: R(0, 6.28), cols: [cBox(0.3, 0.33, 0.38)] });
}
function balloons(x, z) {   // Ballonstand: kippt leicht um
  const parts = [P(GE.cyl, '#8a93a5', 0, 0.1, 0, 0.35, 0.2, 0.35), P(GE.cylLo, '#e3e7ee', 0, 1.0, 0, 0.04, 1.8, 0.04)];
  for (let i = 0; i < 7; i++) { const a = i / 7 * 6.283, rr = i ? 0.45 : 0;
    parts.push(P(GE.cylLo, '#ffffff', Math.cos(a) * rr * 0.5, 2.2, Math.sin(a) * rr * 0.5, 0.012, 0.7, 0.012), P(GE.sph, pick(BAL), Math.cos(a) * rr, 2.65 + (i ? 0 : 0.35), Math.sin(a) * rr, 0.3, 0.36, 0.3)); }
  return add(build(parts), x, z, { v: 3, cols: [cCyl(0.1, 0.35), cCyl(0.9, 0.05, 0, 1.0), cBall(0.75, 0, 2.7)] });
}
function striker(x, z) {   // Hau den Lukas
  return add(build([P(GE.rbox, '#ff5a4e', 0, 0.3, 0, 1.0, 0.6, 1.0), P(GE.rbox, '#ffffff', 0, 3.0, 0, 0.35, 5.0, 0.2), P(GE.rbox, '#ff5a4e', 0, 2.0, 0.11, 0.25, 2.0, 0.02),
    P(GE.rbox, '#ffd23f', 0, 3.8, 0.11, 0.25, 1.4, 0.02), P(GE.sph, '#ffd23f', 0, 5.7, 0, 0.35), P(GE.rbox, '#8a5634', 0.7, 0.6, 0.3, 0.12, 1.2, 0.12, 0, 0, 0.3),
    P(GE.rbox, '#3a4152', 0.86, 1.15, 0.3, 0.5, 0.3, 0.3, 0, 0, 0.3)]), x, z, { v: 4, ry: R(0, 6.28), cols: [cBox(0.5, 0.3, 0.5), cBox(0.18, 2.5, 0.1, 0, 3.0), cBall(0.35, 0, 5.7)] });
}
function cart(x, z, ry = R(0, 6.28)) {   // Popcorn-, Zuckerwatte- oder Eiswagen
  const k = rnd(), c = k < 0.33 ? '#ff5a4e' : k < 0.66 ? '#ff7ac6' : '#4f8bff';
  const parts = [P(GE.rbox, c, 0, 0.9, 0, 1.6, 0.9, 0.9), P(GE.rbox, '#ffffff', 0, 0.9, 0.46, 1.4, 0.2, 0.02)];
  if (k < 0.33) parts.push(P(GE.box, '#a8dcf5', 0, 1.7, 0, 1.2, 0.7, 0.7), P(GE.sph, '#fff6c8', 0, 1.6, 0, 0.5, 0.25, 0.3));
  else if (k < 0.66) parts.push(P(GE.cyl, '#e3e7ee', 0, 1.5, 0, 0.5, 0.3, 0.5), P(GE.sph, '#ffb3c7', 0, 1.9, 0, 0.45, 0.35, 0.45));
  else parts.push(P(GE.rbox, '#ffffff', 0, 1.45, 0, 1.4, 0.2, 0.8), P(GE.sph, '#ffd6e8', -0.35, 1.6, 0, 0.18), P(GE.sph, '#fff1b8', 0, 1.6, 0, 0.18), P(GE.sph, '#c98a52', 0.35, 1.6, 0, 0.18));
  parts.push(P(GE.cylLo, '#e3e7ee', 0.6, 2.0, 0, 0.04, 2.2, 0.04), P(GE.cone, k < 0.66 ? '#ffffff' : '#ffd23f', 0.6, 3.15, 0, 0.9, 0.45, 0.9));
  wheels(parts, [[0.5, 0.48], [-0.5, 0.48], [0.5, -0.48], [-0.5, -0.48]], 0.22, 0.12);
  return add(build(parts), x, z, { v: 6, ry, cols: [cBox(0.8, 0.7, 0.48, 0, 0.7), cBox(0.6, 0.4, 0.38, 0, 1.75)] });
}
function booth(x, z, ry = 0) {   // Bude: Imbiss, Dosenwerfen oder Losbude
  const c = pick(['#ff5a4e', '#4f8bff', '#2fd3b9', '#ff7ac6', '#9b6bff', '#ff8a3d']), w = R(3.2, 4), d = 2.6, k = rnd();
  const parts = [P(GE.rbox, '#ffffff', 0, 0.55, 0.2, w, 1.1, d - 0.4), P(GE.rbox, c, 0, 1.15, d / 2 - 0.15, w + 0.1, 0.12, 0.5), P(GE.rbox, '#ffffff', 0, 2.75, 0, w, 0.5, d),
    P(GE.rbox, shade(c, 0.8), 0, 1.75, -d / 2 + 0.1, w, 2.3, 0.2), P(GE.rbox, shade(c, 0.8), w / 2 - 0.1, 1.75, 0, 0.2, 2.3, d), P(GE.rbox, shade(c, 0.8), -w / 2 + 0.1, 1.75, 0, 0.2, 2.3, d),
    P(GE.rbox, pick(['#ffd23f', '#ffffff', '#2fd3b9']), 0, 3.4, -0.4, w * 0.6, 0.8, 0.15)];
  for (let i = 0; i < 6; i++) parts.push(P(GE.box, i % 2 ? '#ffffff' : c, -w / 2 + w / 12 + i * w / 6, 3.0, d / 2 + 0.4, w / 6, 0.08, 1.0, 0.35));
  if (k < 0.33) for (let i = 0; i < 6; i++) parts.push(P(GE.cyl, pick(['#ff4136', '#4f8bff', '#ffd23f', '#3fae4b']), -0.4 + (i < 3 ? i * 0.4 : 0.2 + (i - 3) * 0.4) - (i >= 5 ? 0.6 : 0), 1.35 + (i < 3 ? 0 : i < 5 ? 0.32 : 0.64), -0.2, 0.15, 0.3, 0.15));
  else if (k < 0.66) for (let i = 0; i < 3; i++) parts.push(P(GE.sph, pick(['#c98a52', '#ff7ac6', '#ffd23f', '#a8dcf5']), -0.9 + i * 0.9, 2.0, -0.9, 0.32));
  else parts.push(P(GE.cyl, '#ffd23f', -0.6, 1.35, 0.5, 0.3, 0.4, 0.3), P(GE.sph, '#fff6c8', -0.6, 1.6, 0.5, 0.32, 0.18, 0.32), P(GE.rbox, '#e3e7ee', 0.7, 1.4, 0, 0.8, 0.5, 0.6));
  return add(build(parts), x, z, { v: 11, ry, cols: [cBox(w / 2, 1.6, d / 2, 0, 1.6)], fade: true });
}
function bumperCar(x, z, ry = R(0, 6.28)) {
  const c = pick(BAL);
  return add(build([P(GE.cyl, '#2a2d36', 0, 0.2, 0, 0.95, 0.3, 1.2), P(GE.rbox, c, 0, 0.5, 0, 1.5, 0.45, 2.0), P(GE.rbox, '#3a4152', 0, 0.85, -0.3, 1.0, 0.5, 0.25),
    P(GE.cylLo, '#e3e7ee', 0, 1.7, -0.75, 0.04, 2.0, 0.04), P(GE.sph, '#ff4136', 0, 0.85, 0.5, 0.18)]), x, z, { v: 6, ry, cols: [cBox(0.8, 0.45, 1.05, 0, 0.45)] });
}
function caravan(x, z, ry = 0) {   // Wohnwagen der Schausteller
  const c = pick(['#ffffff', '#fff1d6', '#d4f2ff']), s = pick(['#ff5a4e', '#4f8bff', '#2fd3b9', '#ff8a3d']);
  const parts = [P(GE.rbox, c, 0, 1.45, 0, 4.4, 2.1, 2.1), P(GE.box, s, 0, 1.0, 1.06, 4.4, 0.3, 0.02), P(GE.box, s, 0, 1.0, -1.06, 4.4, 0.3, 0.02),
    P(GE.box, '#a8dcf5', 1.0, 1.8, 1.06, 1.2, 0.7, 0.04), P(GE.box, '#a8dcf5', -1.3, 1.8, 1.06, 0.8, 0.7, 0.04), P(GE.box, shade(c, 0.85), -0.1, 1.45, 1.07, 0.7, 1.6, 0.04),
    P(GE.cylLo, '#3a4152', 2.6, 0.55, 0, 0.05, 1.0, 0.05, 0, 0, Math.PI / 2)];
  wheels(parts, [[0, 1.0], [0, -1.0]], 0.42, 0.25);
  return add(build(parts), x, z, { v: 14, ry, cols: [cBox(2.2, 1.05, 1.05, 0, 1.45), cBox(0.3, 0.2, 1.0, 0, 0.2)] });
}
function foodTruck(x, z, ry = 0) {   // Imbisswagen (vorne = +x)
  const c = pick(['#ffd23f', '#ff7ac6', '#2fd3b9', '#ff8a3d']);
  const parts = [P(GE.rbox, c, -0.4, 1.4, 0, 3.0, 2.0, 1.9), P(GE.rbox, c, 1.45, 1.05, 0, 1.1, 1.3, 1.8), P(GE.box, '#a8dcf5', 1.95, 1.4, 0, 0.1, 0.6, 1.5),
    P(GE.box, '#3a4152', -0.4, 1.6, 0.96, 1.8, 0.8, 0.04), P(GE.box, '#ffffff', -0.4, 1.15, 1.05, 1.9, 0.12, 0.25), P(GE.rbox, '#ff5a4e', -0.4, 2.15, 1.25, 2.0, 0.08, 0.6, 0.3),
    P(GE.rbox, '#ffffff', -0.4, 2.65, 0, 1.6, 0.5, 0.12)];
  wheels(parts, [[1.1, 0.85], [-1.2, 0.85], [1.1, -0.85], [-1.2, -0.85]], 0.4, 0.3);
  return add(build(parts), x, z, { v: 16, ry, cols: [cBox(1.5, 1.0, 0.95, -0.4, 1.4), cBox(0.55, 0.65, 0.9, 1.45, 1.05), cBox(1.5, 0.2, 0.9, 0, 0.2)] });
}
export function train(x, z, ry, drive) {   // Bimmelbahn: Lok + offener Wagen (vorne = +x)
  const c = pick(['#ff5a4e', '#4f8bff', '#2fd3b9', '#9b6bff']);
  const parts = [P(GE.rbox, c, 0.9, 0.75, 0, 1.8, 0.6, 1.3), P(GE.cylHi, shade(c, 0.85), 1.1, 1.3, 0, 0.45, 1.2, 0.45, 0, 0, Math.PI / 2), P(GE.rbox, c, 0.3, 1.55, 0, 0.8, 1.0, 1.3),
    P(GE.rbox, '#ffd23f', 0.3, 2.1, 0, 1.0, 0.12, 1.5), P(GE.frust, '#3a4152', 1.5, 1.95, 0, 0.18, 0.5, 0.18, Math.PI), P(GE.sph, '#fff6c8', 1.72, 1.3, 0, 0.14),
    P(GE.rbox, '#ffd23f', -1.0, 0.75, 0, 1.6, 0.6, 1.3), P(GE.rbox, pick(['#ff7ac6', '#ffffff', '#2fd3b9']), -1.0, 1.65, 0, 1.75, 0.1, 1.5)];
  for (const px of [-1.7, -0.3]) parts.push(P(GE.cylLo, '#e3e7ee', px, 1.25, 0.6, 0.04, 0.8, 0.04), P(GE.cylLo, '#e3e7ee', px, 1.25, -0.6, 0.04, 0.8, 0.04));
  wheels(parts, [[1.3, 0.6], [0.4, 0.6], [1.3, -0.6], [0.4, -0.6], [-0.6, 0.6], [-1.4, 0.6], [-0.6, -0.6], [-1.4, -0.6]], 0.3, 0.2);
  return add(build(parts), x, z, { v: 14, ry, cols: [cBox(1.85, 0.55, 0.7, 0, 0.55), cBox(0.5, 0.55, 0.65, 0.3, 1.6)], ...(drive ? { drive } : {}) });
}

// ---------- Fahrgeschäfte ----------
function carousel(x, z) {   // Karussell: Plattform mit Pferden + Dach (fallen getrennt)
  const c = pick(['#ff5a4e', '#4f8bff', '#9b6bff', '#2fd3b9']), parts = [P(GE.cylHi, '#ffd23f', 0, 0.3, 0, 4.4, 0.6, 4.4), P(GE.cylHi, '#ffffff', 0, 0.62, 0, 4.2, 0.06, 4.2),
    P(GE.cylHi, c, 0, 2.65, 0, 0.9, 4.1, 0.9)];
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * 6.283, hx = Math.cos(a) * 3.2, hz = Math.sin(a) * 3.2, tx = -Math.sin(a), tz = Math.cos(a), hc = pick(['#ffffff', '#ffd23f', '#ff7ac6', '#c98a52']);
    parts.push(P(GE.cylLo, '#ffd23f', hx, 2.65, hz, 0.05, 4.1, 0.05), P(GE.rbox, hc, hx, 1.6 + (i % 2) * 0.4, hz, 0.35, 0.45, 1.0, 0, -a, 0),
      P(GE.rbox, hc, hx + tx * 0.5, 2.05 + (i % 2) * 0.4, hz + tz * 0.5, 0.25, 0.5, 0.3, 0, -a, 0), P(GE.rbox, pick(BAL), hx, 1.9 + (i % 2) * 0.4, hz, 0.38, 0.1, 0.4, 0, -a, 0));
  }
  const base = add(build(parts), x, z, { v: 30, cols: [cCyl(0.33, 4.4), cCyl(1.0, 3.6, 0, 1.6), cCyl(2.05, 0.9, 0, 2.65)] });
  const roof = [stripes(P(tube(0.2, 5.0, 2.8, 32), '#ffffff', 0, 1.4, 0), c, '#ffffff', 16), P(GE.cylHi, '#ffd23f', 0, 0.15, 0, 5.05, 0.3, 5.05)];
  for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283; roof.push(P(GE.sph, i % 2 ? '#ffffff' : '#ffd23f', Math.cos(a) * 5.0, -0.05, Math.sin(a) * 5.0, 0.32)); }
  roof.push(P(GE.sph, '#ffd23f', 0, 2.9, 0, 0.3), P(GE.cylLo, '#3a4152', 0, 3.5, 0, 0.04, 1.0, 0.04), P(GE.box, '#ff5a4e', 0.3, 3.8, 0, 0.6, 0.35, 0.02));
  const top = add(build(roof), x, z, { y: 4.7, v: 18, cols: [cCone(1.4, 5.0, 0, 1.4), cCyl(0.15, 5.0, 0, 0.15)] });
  base.link = top.link = [base, top];
}
function ferris(x, z) {   // Riesenrad: hoch und schmal, kippt um
  const parts = [P(GE.rbox, '#8a93a5', 0, 0.2, 0, 10.5, 0.4, 3.8)], R0 = 6.5, hy = 8;
  for (const sz of [-1.3, 1.3]) for (const sx of [-1, 1]) parts.push(P(GE.cylLo, '#e3e7ee', sx * 2.4, hy / 2, sz, 0.16, Math.hypot(hy, 4.8), 0.16, 0, 0, sx * Math.atan2(4.8, hy)));
  for (const sz of [-0.9, 0.9]) parts.push(P(RIM, '#ff5a4e', 0, hy, sz, R0, R0, R0));
  for (let i = 0; i < 6; i++) parts.push(P(GE.cylLo, '#ffffff', 0, hy, 0, 0.06, 2 * R0, 0.06, 0, 0, i / 6 * Math.PI));
  parts.push(P(GE.cyl, '#ffd23f', 0, hy, 0, 0.6, 2.9, 0.6, Math.PI / 2));
  for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283, gx = Math.cos(a) * R0, gy = hy + Math.sin(a) * R0;
    parts.push(P(GE.rbox, pick(BAL), gx, gy - 0.75, 0, 1.1, 0.9, 1.4), P(GE.rbox, '#ffffff', gx, gy - 0.2, 0, 1.2, 0.12, 1.5), P(GE.cylLo, '#e3e7ee', gx, gy - 0.1, 0, 0.04, 0.3, 0.04)); }
  for (let i = 0; i < 20; i++) { const a = i / 20 * 6.283; parts.push(P(GE.sph, i % 2 ? '#ffd23f' : '#ffffff', Math.cos(a) * R0, hy + Math.sin(a) * R0, 1.0, 0.14)); }
  return add(build(parts), x, z, { v: 70, fade: true, cols: [cBox(5.25, 0.2, 1.9, 0, 0.2), cBox(1.4, hy / 2, 1.5, 0, hy / 2), cCyl(1.0, R0 + 0.6, 0, hy, 0, Math.PI / 2)] });
}
function swings(x, z) {   // Kettenkarussell
  const c = pick(['#4f8bff', '#ff5a4e', '#9b6bff', '#2fd3b9']), parts = [P(GE.cylHi, '#e3e7ee', 0, 0.2, 0, 3.2, 0.4, 3.2), P(GE.cylHi, c, 0, 4.5, 0, 0.5, 8.6, 0.5),
    stripes(P(tube(0.3, 3.6, 1.4, 32), '#ffffff', 0, 9.5, 0), c, '#ffffff', 12), P(GE.cylHi, '#ffd23f', 0, 8.7, 0, 3.6, 0.2, 3.6), P(GE.sph, '#ffd23f', 0, 10.3, 0, 0.35)];
  const x0 = 3.4, y0 = 8.6, x1 = 4.6, y1 = 5.4, L = Math.hypot(x1 - x0, y0 - y1), tilt = Math.atan2(x1 - x0, y0 - y1);
  for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283, rx = Math.cos(a), rz = Math.sin(a);
    parts.push(P(GE.cylLo, '#3a4152', rx * (x0 + x1) / 2, (y0 + y1) / 2, rz * (x0 + x1) / 2, 0.03, L, 0.03, 0, -a, -tilt),
      P(GE.rbox, pick(BAL), rx * x1, y1 - 0.2, rz * x1, 0.55, 0.15, 0.55, 0, -a, 0)); }
  return add(build(parts), x, z, { v: 32, cols: [cCyl(0.2, 3.2), cCyl(4.3, 0.5, 0, 4.5), cCyl(0.9, 3.6, 0, 9.3)] });
}
function bumperHall(x, z) {   // Autoscooter: Dach auf vier Stützen, darunter die Wagen
  flat(14, 10, x, z, 0.015, PLATE, 3);
  const c = pick(['#ff5a4e', '#4f8bff', '#9b6bff']), parts = [P(GE.rbox, c, 0, 4.45, 0, 15, 0.5, 11), P(GE.rbox, '#ffd23f', 0, 4.8, 0, 15.2, 0.2, 11.2),
    P(GE.rbox, '#ffffff', 0, 5.5, 5.0, 6.5, 1.2, 0.25), P(GE.rbox, c, 0, 5.5, 5.15, 5.5, 0.6, 0.05)];
  for (const [px, pz] of [[-7, -5], [7, -5], [-7, 5], [7, 5]]) parts.push(P(GE.cyl, '#e3e7ee', px, 2.1, pz, 0.2, 4.2, 0.2));
  for (let i = 0; i < 12; i++) parts.push(P(GE.sph, pick(['#ffd23f', '#ffffff', '#ff7ac6']), -7.15 + i * 1.3, 4.15, 5.55, 0.15));
  add(build(parts), x, z, { v: 36, fade: true, cols: [cBox(7.5, 0.35, 5.5, 0, 4.5), cCyl(2.1, 0.2, -7, 2.1, -5), cCyl(2.1, 0.2, 7, 2.1, -5), cCyl(2.1, 0.2, -7, 2.1, 5), cCyl(2.1, 0.2, 7, 2.1, 5)] });
  for (const [ox, oz] of [[-4.5, -2.5], [0, -3], [4.5, -2], [-3, 2.5], [2, 2.5], [5.5, 3]]) bumperCar(x + ox, z + oz);
}
function circus(x, z) {   // Zirkuszelt: Wand und Dach fallen getrennt
  const wall = [stripes(P(tube(6.2, 6.2, 3.6, 32), '#ffffff', 0, 1.8, 0), '#ff4136', '#ffffff', 16), P(GE.rbox, '#3a2a4a', 0, 1.4, 6.15, 2.2, 2.8, 0.3),
    P(GE.rbox, '#ffd23f', 0, 3.0, 6.25, 2.8, 0.4, 0.3)];
  const w = add(build(wall), x, z, { v: 36, fade: true, cols: [cCyl(1.8, 6.2)] });
  const roof = [stripes(P(tube(0.25, 6.8, 4.4, 32), '#ffffff', 0, 2.2, 0), '#ff4136', '#ffffff', 16), P(GE.cylLo, '#3a4152', 0, 5.0, 0, 0.06, 1.6, 0.06),
    P(GE.box, '#ffd23f', 0.5, 5.5, 0, 1.0, 0.55, 0.03), P(GE.sph, '#ffd23f', 0, 4.4, 0, 0.3)];
  for (let i = 0; i < 16; i++) { const a = (i + 0.5) / 16 * 6.283; roof.push(P(GE.sph, '#ffd23f', Math.cos(a) * 6.75, 0.05, Math.sin(a) * 6.75, 0.25)); }
  const r = add(build(roof), x, z, { y: 3.6, v: 28, fade: true, cols: [cCone(2.2, 6.8, 0, 2.2)] });
  w.link = r.link = [w, r];
}
function haunted(x, z) {   // Geisterbahn
  building(x, z - 1.5, R(11, 12.5), R(8.5, 9.5), 2, { fh: 3.4, wall: '#5b4a7a', roof: 'pitched', roofCol: '#3a2a4a', band: '#2a1f3a', doorCol: '#1d2433', awning: false, rh: 0.5, chimney: false });
  for (let i = 0; i < 4; i++) { const p = freeSpot(x, z, 9, 0.5); if (p) add(build([P(GE.sph, '#ff8a3d', 0, 0.32, 0, 0.42, 0.32, 0.42), P(GE.cylLo, '#3fae4b', 0, 0.68, 0, 0.05, 0.16, 0.05),
    P(GE.cone, INK, 0.14, 0.42, 0.37, 0.07, 0.1, 0.03, Math.PI / 2), P(GE.cone, INK, -0.14, 0.42, 0.37, 0.07, 0.1, 0.03, Math.PI / 2), P(GE.box, INK, 0, 0.25, 0.39, 0.3, 0.06, 0.03)]),
    p[0], p[1], { v: 1, ry: R(-0.6, 0.6), cols: [cBall(0.34)] }); }
  for (let i = 0; i < 5; i++) ghost(x + R(-8, 8), z + R(5, 9));
}
function bandstand(x, z) {   // Musikpavillon auf dem Festplatz
  const parts = [P(tube(3.6, 3.9, 0.8, 8), '#ffffff', 0, 0.4, 0, 1, 1, 1, 0, Math.PI / 8), stripes(P(tube(0.2, 4.4, 2.0, 16), '#ffffff', 0, 4.4, 0), '#4f8bff', '#ffffff', 8),
    P(tube(4.4, 4.4, 0.3, 16), '#ffd23f', 0, 3.3, 0)];
  for (let i = 0; i < 8; i++) { const a = (i + 0.5) / 8 * 6.283; parts.push(P(GE.cylLo, '#ffffff', Math.cos(a) * 3.3, 2.1, Math.sin(a) * 3.3, 0.1, 2.6, 0.1)); }
  parts.push(P(GE.cylLo, '#3a4152', 0, 1.3, 0, 0.04, 1.0, 0.04), P(GE.rbox, '#3a4152', 0, 1.85, 0.1, 0.6, 0.4, 0.05, -0.5));
  return add(build(parts), x, z, { v: 24, cols: [cCyl(0.4, 3.9), cCone(1.2, 4.4, 0, 4.6), cCyl(0.15, 4.4, 0, 3.3), cCyl(1.25, 0.12, 3.0, 2.05, 1.2), cCyl(1.25, 0.12, -3.0, 2.05, -1.2)] });
}

function festHall(x, z) {   // Festzelt: lange Zeltwand + Dach (fallen getrennt)
  const w = 16, d = 10, h = 3.5, c = pick(['#4f8bff', '#2fd3b9', '#ff5a4e']);
  const parts = [P(GE.box, '#ffffff', 0, h / 2, 0, w, h, d), P(GE.rbox, '#3a2a4a', 0, 1.3, d / 2 + 0.05, 3, 2.6, 0.2), P(GE.rbox, '#ffd23f', 0, 3.0, d / 2 + 0.12, 4.2, 0.6, 0.15)];
  for (let i = 0; i < 10; i++) { const px = -w / 2 + 0.8 + i * 1.6; if (Math.abs(px) > 2) parts.push(P(GE.box, c, px, h / 2, d / 2 + 0.02, 0.8, h, 0.04)); parts.push(P(GE.box, c, px, h / 2, -d / 2 - 0.02, 0.8, h, 0.04)); }
  for (const sx of [-1, 1]) for (let i = 0; i < 6; i++) parts.push(P(GE.box, c, sx * (w / 2 + 0.02), h / 2, -d / 2 + 0.8 + i * 1.6, 0.04, h, 0.8));
  const body = add(build(parts), x, z, { v: Math.round(w * d * h / 10), fade: true, cols: [cBox(w / 2, h / 2, d / 2)] });
  const rh = 3.6, W2 = w / 2 + 0.3, D2 = d / 2 + 0.3;
  const roof = add(build([P(GE.prism, c, 0, 0, 0, d + 0.6, rh, w + 0.6, 0, Math.PI / 2, 0), P(GE.rbox, '#ffffff', 0, rh, 0, w + 0.8, 0.25, 0.4),
    P(GE.cylLo, '#3a4152', -w / 2 + 1, rh + 0.8, 0, 0.05, 1.6, 0.05), P(GE.box, '#ffd23f', -w / 2 + 1.45, rh + 1.3, 0, 0.9, 0.5, 0.03),
    P(GE.cylLo, '#3a4152', w / 2 - 1, rh + 0.8, 0, 0.05, 1.6, 0.05), P(GE.box, '#ff5a4e', w / 2 - 0.55, rh + 1.3, 0, 0.9, 0.5, 0.03)]),
    x, z, { y: h, v: Math.round(w * d * rh / 20), fade: true, cols: [cHull([-W2, 0, -D2, W2, 0, -D2, -W2, 0, D2, W2, 0, D2, -W2, rh, 0, W2, rh, 0])] });
  body.link = roof.link = [body, roof];
  blocked.push([x - w / 2 - 0.6, x + w / 2 + 0.6, z - d / 2 - 0.6, z + d / 2 + 1.2]);
}

// ---------- Endboss: Freifallturm ----------
function dropTower(x, z) {
  const g = new THREE.Group(), mats = [], H = 46, T = 1.7;
  const parts = [stripes(P(tube(9.2, 9.4, 1.0, 40), '#ffffff', 0, 0.5, 0), '#ff5a4e', '#ffd23f', 20), P(tube(8.4, 8.4, 0.1, 40), '#ffffff', 0, 1.02, 0)];
  for (let i = 0; i < 24; i++) { const a = i / 24 * 6.283; if (Math.abs(a - Math.PI / 2) > 0.35) parts.push(P(GE.cylLo, '#3a4152', Math.cos(a) * 8.8, 1.5, Math.sin(a) * 8.8, 0.06, 1.0, 0.06)); }
  for (const [px, pz] of [[T, T], [-T, T], [T, -T], [-T, -T]]) parts.push(P(GE.cyl, '#e3e7ee', px, 1 + H / 2, pz, 0.28, H, 0.28));
  parts.push(P(GE.box, '#4f8bff', 0, 1 + H / 2, 0, 2.6, H, 2.6));
  for (let y = 4; y < H; y += 3) parts.push(P(GE.box, '#e3e7ee', 0, y, T, 2 * T, 0.18, 0.18), P(GE.box, '#e3e7ee', 0, y, -T, 2 * T, 0.18, 0.18),
    P(GE.box, '#e3e7ee', T, y, 0, 0.18, 0.18, 2 * T), P(GE.box, '#e3e7ee', -T, y, 0, 0.18, 0.18, 2 * T));
  parts.push(P(GE.cylHi, '#ff5a4e', 0, H + 1.6, 0, 3.0, 1.2, 3.0), P(GE.coneHi, '#ffd23f', 0, H + 3.3, 0, 3.0, 2.2, 3.0), P(GE.cylLo, '#3a4152', 0, H + 5.1, 0, 0.06, 1.6, 0.06),
    P(GE.box, '#ff5a4e', 0.45, H + 5.6, 0, 0.9, 0.5, 0.03));
  for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; parts.push(P(GE.sph, i % 2 ? '#ffd23f' : '#ffffff', Math.cos(a) * 3.05, H + 1.6, Math.sin(a) * 3.05, 0.22)); }
  parts.push(P(GE.rbox, '#ff7ac6', 0, 2.2, 7.0, 2.4, 2.4, 1.6), P(GE.rbox, '#ffd23f', 0, 3.5, 7.0, 2.8, 0.25, 2.0), P(GE.box, '#a8dcf5', 0, 2.4, 7.82, 1.4, 0.8, 0.04));
  const cols = [cCyl(0.5, 9.3), cBox(T + 0.3, H / 2, T + 0.3, 0, 1 + H / 2), cCyl(1.4, 3.0, 0, H + 1.9)];
  const em = MAT.clone(); mats.push(em); g.add(build(parts, em));
  const rp = [P(tube(3.4, 3.4, 0.5, 32), '#ffd23f', 0, 0, 0)];   // Gondel-Ring mit Sitzen
  for (let i = 0; i < 12; i++) { const a = (i + 0.5) / 12 * 6.283;
    rp.push(P(GE.rbox, pick(BAL), Math.cos(a) * 3.65, -0.6, Math.sin(a) * 3.65, 0.8, 1.0, 0.7, 0, -a + Math.PI / 2, 0)); }
  const ring = build(rp, em); ring.position.y = 4; g.add(ring);
  const o = addBoss(g, x, z, cols, mats, H + 6.5, 9.3);
  const top = H - 4; let t = 0;
  o.anim = dt => {   // langsam hoch, kurz warten, dann freier Fall mit kleinem Federn
    t = (t + dt) % 9.5; let y;
    if (t < 6) { const f = t / 6; y = 4 + (top - 4) * f * f * (3 - 2 * f); }
    else if (t < 7.5) y = top;
    else if (t < 8.3) { const f = (t - 7.5) / 0.8; y = top - (top - 4) * f * f; }
    else { const f = t - 8.3; y = 4 + Math.abs(Math.sin(f * 8)) * 1.2 * Math.max(0, 1 - f / 1.2); }
    ring.position.y = y;
  };
  return o;
}

// ---------- Welt bauen ----------
export function create() {
  setSeed(44);
  flat(600, 600, 0, 0, 0, GRAVEL, 10);
  roadNet({ walk: null, road: PAVE, roadScale: 4, marks: false, curbs: true, curbColor: 0xffffff });
  edgeRing(BAL, [0.9, 1.3]);
  const PLAZAS = ['15,15', '-45,15', '45,-45', '-75,-75', '75,75'];
  const BOSS = '-15,-45';
  const KINDS = [...Array(3).fill('booths'), ...Array(4).fill('carousel'), ...Array(3).fill('ferris'), ...Array(3).fill('swings'), ...Array(3).fill('bumper'),
    ...Array(2).fill('circus'), ...Array(2).fill('haunted'), ...Array(2).fill('camp'), ...Array(2).fill('picnic'), ...Array(6).fill('hall')];   // 30 Blöcke
  for (let i = KINDS.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [KINDS[i], KINDS[j]] = [KINDS[j], KINDS[i]]; }
  let ki = 0;
  for (const bx of BLOCKS) for (const bz of BLOCKS) {
    const key = bx + ',' + bz;
    if (key === BOSS) { dropTower(bx, bz); for (const [ox, oz] of [[-11, -11], [11, -11], [-11, 11], [11, 11]]) balloons(bx + ox, bz + oz); continue; }
    const kind = PLAZAS.includes(key) ? 'plaza' : KINDS[ki++];
    if (kind === 'booths') {   // Budengasse
      for (const ox of [-6, 0, 6]) { booth(bx + ox, bz - 6.5, 0); booth(bx + ox, bz + 6.5, Math.PI); }
      cart(bx - 4, bz, R(-0.4, 0.4)); cart(bx + 4.5, bz + 0.5, R(-0.4, 0.4));
      balloons(bx, bz - 0.5); striker(bx + 8.5, bz);
      for (let i = 0; i < 2; i++) { const p = freeSpot(bx, bz, 9, 0.5); if (p) bin(...p, ['#ff5a4e', '#4f8bff']); }
      for (let i = 0; i < 3; i++) { const p = freeSpot(bx, bz, 9, 0.4); if (p) small(...p); }
    } else if (kind === 'carousel') {
      carousel(bx, bz);
      cart(bx - 7.5, bz + 7.5); cart(bx + 7.5, bz - 7.5);
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.785; bench(bx + Math.cos(a) * 8, bz + Math.sin(a) * 8, -a - Math.PI / 2, '#ff5a4e'); }
      balloons(bx + 8, bz + 2); striker(bx - 8, bz - 2);
      for (let i = 0; i < 3; i++) { const p = freeSpot(bx, bz, 9.5, 0.4); if (p) small(...p); }
      for (let i = 0; i < 2; i++) { const p = freeSpot(bx, bz, 9.5, 1.3); if (p) tree(...p); }
    } else if (kind === 'ferris') {
      ferris(bx, bz - 2);
      booth(bx - 5.5, bz + 7.2, Math.PI); booth(bx + 5.5, bz + 7.2, Math.PI);
      cart(bx, bz + 4.5, R(-0.4, 0.4));
      for (let i = 0; i < 2; i++) { const p = freeSpot(bx, bz, 9.5, 1.3); if (p) tree(...p); }
      for (let i = 0; i < 2; i++) { const p = freeSpot(bx, bz, 9, 0.5); if (p) bin(...p, ['#ff5a4e', '#4f8bff']); }
      for (let i = 0; i < 3; i++) { const p = freeSpot(bx, bz, 9.5, 0.4); if (p) small(...p); }
    } else if (kind === 'swings') {
      swings(bx, bz);
      cart(bx - 7.5, bz + 7); balloons(bx + 7.5, bz + 7); striker(bx + 7.5, bz - 7.5);
      for (let i = 0; i < 3; i++) { const a = i * 2.09 + 0.3; bench(bx + Math.cos(a) * 7.5, bz + Math.sin(a) * 7.5, -a - Math.PI / 2, '#4f8bff'); }
      for (let i = 0; i < 3; i++) { const p = freeSpot(bx, bz, 9.5, 0.4); if (p) small(...p); }
      for (let i = 0; i < 2; i++) { const p = freeSpot(bx, bz, 9.5, 1.3); if (p) tree(...p); }
    } else if (kind === 'bumper') {
      bumperHall(bx, bz - 1.5);
      cart(bx - 6, bz + 8.2, 0); booth(bx + 5, bz + 8.0, Math.PI);
      for (let i = 0; i < 2; i++) { const p = freeSpot(bx, bz, 9.5, 1.3); if (p) tree(...p); }
      for (let i = 0; i < 2; i++) { const p = freeSpot(bx, bz, 9.5, 0.5); if (p) bin(...p, ['#ff5a4e', '#4f8bff']); }
    } else if (kind === 'circus') {
      circus(bx - 1, bz - 1);
      caravan(bx + 7.5, bz - 6, Math.PI / 2); caravan(bx - 7.8, bz + 7.8, 0); caravan(bx + 6.5, bz + 8, 0);
      striker(bx - 8.5, bz - 7.5); balloons(bx + 8.5, bz + 3);
      for (let i = 0; i < 3; i++) { const p = freeSpot(bx, bz, 9.5, 0.4); if (p) small(...p); }
    } else if (kind === 'haunted') {
      haunted(bx, bz);
      for (let i = 0; i < 2; i++) { const p = freeSpot(bx, bz, 9, 0.5); if (p) bin(...p, ['#5b4a7a', '#3a4152']); }
      for (let i = 0; i < 2; i++) { const p = freeSpot(bx, bz, 9.5, 1.3); if (p) tree(...p); }
    } else if (kind === 'camp') {   // Schaustellerplatz: Wohnwagen und Imbisswagen
      caravan(bx - 5, bz - 6, 0); caravan(bx + 5, bz - 6, 0); caravan(bx - 5, bz + 1, 0);
      foodTruck(bx + 5, bz + 1, 0); foodTruck(bx, bz + 7.5, 0);
      for (let i = 0; i < 2; i++) { const p = freeSpot(bx, bz, 9.5, 0.9); if (p) bench(...p, R(0, 6.28), '#c98a52'); }
      for (let i = 0; i < 2; i++) { const p = freeSpot(bx, bz, 9.5, 1.3); if (p) tree(...p); }
      for (let i = 0; i < 3; i++) { const p = freeSpot(bx, bz, 9.5, 0.4); if (p) small(...p); }
    } else if (kind === 'hall') {   // Festzelt mit Imbisswagen davor
      festHall(bx, bz - 2.5);
      foodTruck(bx - 5.5, bz + 7.5, 0); cart(bx + 1, bz + 7.8, 0); booth(bx + 6, bz + 7.6, Math.PI);
      for (const ox of [-9, 9]) tree(bx + ox, bz - 9);
    } else if (kind === 'picnic') {   // Picknickwiese
      flat(20, 20, bx, bz, 0.012, TEX.grass, 9);
      for (let i = 0; i < 7; i++) { const p = freeSpot(bx, bz, 9.5, 1.3); if (p) tree(...p); }
      for (let i = 0; i < 5; i++) { const p = freeSpot(bx, bz, 9.5, 0.7); if (p) bush(...p); }
      for (let i = 0; i < 3; i++) { const p = freeSpot(bx, bz, 8, 1); if (p) bench(...p, R(0, 6.28)); }
      balloons(bx + R(-3, 3), bz + R(-3, 3));
    } else {   // Festplatz mit Musikpavillon
      flat(22, 22, bx, bz, 0.012, TEX.plaza, 4);
      bandstand(bx, bz);
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.4; bench(bx + Math.cos(a) * 6.5, bz + Math.sin(a) * 6.5, -a - Math.PI / 2, '#ff5a4e'); }
      for (const [lx, lz] of [[-8.5, -8.5], [8.5, -8.5], [-8.5, 8.5], [8.5, 8.5]]) lamp(bx + lx, bz + lz, pick(['#ff5a4e', '#4f8bff', '#9b6bff']), '#fff3a8');
      cart(bx + 8, bz); cart(bx - 8, bz); balloons(bx, bz + 8.5); balloons(bx, bz - 8.5);
      for (let i = 0; i < 2; i++) { const p = freeSpot(bx, bz, 9, 0.5); if (p) bin(...p, ['#ff5a4e', '#4f8bff']); }
    }
  }
  for (const rc of ROADS) {   // Wege: bunte Laternen, Mülleimer, Kleinkram, abgestellte Wagen
    let step = 0;
    for (let t = -MAP + 3; t < MAP - 2; t += 10, step++) {
      if (ROADS.some(r => Math.abs(t - r) < 7)) continue;
      const s = step % 2 ? 1 : -1, lc = pick(['#ff5a4e', '#4f8bff', '#9b6bff', '#2fd3b9']);
      lamp(t, rc + s * 4.4, lc, '#fff3a8'); lamp(rc + s * 4.4, t, lc, '#fff3a8');
      if (rnd() < 0.35) bin(t + 2, rc - s * 4.4, ['#ff5a4e', '#4f8bff', '#ffd23f']); if (rnd() < 0.35) bin(rc - s * 4.4, t + 2, ['#ff5a4e', '#4f8bff', '#ffd23f']);
      if (rnd() < 0.3) small(t + 4, rc + s * 4.2); if (rnd() < 0.3) small(rc - s * 4.2, t - 4);
      if (rnd() < 0.2) balloons(t - 3.5, rc - s * 4.4); if (rnd() < 0.2) cart(rc + s * 4.6, t - 4, 0);
      if (rnd() < 0.55) tree(t + 6.5, rc - s * 4.6); if (rnd() < 0.55) tree(rc - s * 4.6, t + 6.5);   // Bäume am Weg
    }
    for (let t = -MAP + 6; t < MAP - 4; t += R(8, 13)) {
      if (ROADS.some(r => Math.abs(t - r) < 9)) continue;
      if (rnd() < 0.65) (rnd() < 0.5 ? caravan : foodTruck)(t, rc + pick([-1, 1]) * 2.4, 0);
      if (rnd() < 0.65) (rnd() < 0.5 ? caravan : foodTruck)(rc + pick([-1, 1]) * 2.4, t, Math.PI / 2);
    }
  }
  for (let i = 0; i < 40; i++) {   // fahrende Bimmelbahnen
    const ax = rnd() < 0.5 ? 'x' : 'z', rc = pick(ROADS), dir = pick([-1, 1]), t = R(-MAP + 8, MAP - 8);
    const drive = { ax, rc, dir, sp: R(2.6, 4.2), curve: null, pending: null, decided: null };
    if (ax === 'x') train(t, laneOf('x', rc, dir), dir > 0 ? 0 : Math.PI, drive);
    else train(laneOf('z', rc, dir), t, dir > 0 ? -Math.PI / 2 : Math.PI / 2, drive);
  }
  scatter(270, visitor, { r: 0.3 });
  scatter(25, clown, { r: 0.3 });
  scatter(170, small, { r: 0.4 });
  scatter(60, balloons, { r: 0.8 });
  scatter(45, (x, z) => bench(x, z, R(0, 6.28), pick(['#ff5a4e', '#4f8bff', '#c98a52'])), { r: 0.9 });
}
