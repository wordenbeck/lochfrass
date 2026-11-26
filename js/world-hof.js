// Lochfrass! – Welt 3: Bauernhof (Höfe, Felder, Weiden, Dorf; Endboss Windmühle)
import { THREE, MAP, ROADS, BLOCKS, INK, R, pick, rnd, setSeed, P, GE, build, add, cBox, cCyl, cBall, cHull, flat, roadNet, edgeRing,
  person, bench, building, scatter, freeSpot, canvasTex, speckle, shade, laneOf, MAT, C, TEX, walkState, blocked, bush, lamp,
  wheels, addBoss, tube } from './kit.js';

export const env = { sky: ['#5ec2ff', '#e6f7ff'], fog: 0xe6f7ff, hemi: [0xffffff, 0xc8dd9a, 1.6], sun: [0xfff1d6, 2.2], gravity: -30, dust: 0xd9c49a, grow: 1.2 };

const DIRT = canvasTex(256, (x, s) => { x.fillStyle = '#c49a64'; x.fillRect(0, 0, s, s); speckle(x, s, '120,84,50', .45, 400, 3); speckle(x, s, '235,205,155', .4, 250, 2); });
const SOIL = canvasTex(128, (x, s) => { x.fillStyle = '#8a5a34'; x.fillRect(0, 0, s, s); x.fillStyle = '#6e4626';
  for (let i = 0; i < 4; i++) x.fillRect(0, i * 32 + 20, s, 12); speckle(x, s, '60,36,20', .4, 120, 2); });
const WHEAT = canvasTex(128, (x, s) => { x.fillStyle = '#e8c35a'; x.fillRect(0, 0, s, s); x.strokeStyle = '#c9a03c'; x.lineWidth = 3; x.lineCap = 'round';
  for (let i = 0; i < 34; i++) { const a = Math.random() * s, b = Math.random() * s; x.beginPath(); x.moveTo(a, b); x.lineTo(a + 3, b - 10); x.stroke(); }
  x.fillStyle = 'rgba(150,110,40,.22)'; for (let i = 0; i < 4; i++) x.fillRect(0, i * 32, s, 6); });
const WOOD = '#c98a52', DARK = '#8a5634';

// ---------- Tiere und Leute ----------
function farmer(x, z) {   // Bäuerin/Bauer mit Strohhut
  return person(x, z, { shirt: pick(['#ff5a4e', '#4f8bff', '#3fae4b', '#ffd23f', '#ffffff']), pants: pick(['#3c5a9b', '#4f6bb0', '#6b5a48']),
    extra: () => [P(GE.cyl, '#e8c35a', 0, 1.5, 0, 0.38, 0.04, 0.38), P(GE.cyl, '#e8c35a', 0, 1.6, 0, 0.2, 0.18, 0.2), P(GE.cyl, '#ff5a4e', 0, 1.54, 0, 0.205, 0.05, 0.205)] });
}
function chicken(x, z) {
  const c = pick(['#ffffff', '#ffffff', '#c98a52', '#8a5634']);
  const parts = [P(GE.sph, c, 0, 0.32, 0, 0.22, 0.2, 0.28), P(GE.sph, c, 0, 0.52, 0.18, 0.13), P(GE.sph, '#ff4136', 0, 0.66, 0.18, 0.04, 0.07, 0.08),
    P(GE.cone, '#ffb000', 0, 0.5, 0.33, 0.04, 0.1, 0.04, Math.PI / 2), P(GE.sph, '#ff4136', 0, 0.44, 0.27, 0.03, 0.05, 0.03),
    P(GE.sph, INK, 0.09, 0.56, 0.25, 0.025), P(GE.sph, INK, -0.09, 0.56, 0.25, 0.025), P(GE.sph, shade(c, 0.85), 0, 0.42, -0.25, 0.08, 0.14, 0.06),
    P(GE.cylLo, '#ffb000', 0.07, 0.07, 0, 0.02, 0.14, 0.02), P(GE.cylLo, '#ffb000', -0.07, 0.07, 0, 0.02, 0.14, 0.02)];
  return add(build(parts), x, z, { v: 1, cols: [cBox(0.2, 0.3, 0.28)], walk: walkState([0.7, 1.5], 0.08, { hop: 16 }) });
}
function pig(x, z) {
  const c = '#ffb3c7', parts = [P(GE.sph, c, 0, 0.42, 0, 0.3, 0.27, 0.42), P(GE.sph, c, 0, 0.5, 0.42, 0.22), P(GE.cyl, '#ff8fb0', 0, 0.46, 0.63, 0.1, 0.08, 0.08, Math.PI / 2),
    P(GE.sph, INK, 0.09, 0.58, 0.58, 0.03), P(GE.sph, INK, -0.09, 0.58, 0.58, 0.03), P(GE.cone, c, 0.13, 0.72, 0.4, 0.07, 0.12, 0.05), P(GE.cone, c, -0.13, 0.72, 0.4, 0.07, 0.12, 0.05),
    P(GE.torus, c, 0, 0.5, -0.44, 0.07, 0.07, 0.07, 0, Math.PI / 2, 0)];
  for (const [lx, lz] of [[0.15, 0.22], [-0.15, 0.22], [0.15, -0.22], [-0.15, -0.22]]) parts.push(P(GE.cyl, c, lx, 0.1, lz, 0.07, 0.2, 0.07));
  return add(build(parts), x, z, { v: 1, cols: [cBox(0.3, 0.38, 0.5)], walk: walkState([0.5, 1.1], 0.05, { hop: 12 }) });
}
function sheep(x, z) {
  const parts = [P(GE.sph, '#ffffff', 0, 0.75, 0, 0.45, 0.4, 0.6)];
  for (let i = 0; i < 6; i++) parts.push(P(GE.sph, '#f4f4f4', R(-0.3, 0.3), 0.95 + R(0, 0.12), R(-0.4, 0.4), 0.25));
  parts.push(P(GE.sph, '#3a3a44', 0, 0.85, 0.62, 0.2, 0.24, 0.24), P(GE.sph, '#ffffff', 0, 1.05, 0.55, 0.18),
    P(GE.sph, '#3a3a44', 0.22, 0.9, 0.55, 0.1, 0.05, 0.06), P(GE.sph, '#3a3a44', -0.22, 0.9, 0.55, 0.1, 0.05, 0.06),
    P(GE.sph, '#ffffff', 0.08, 0.9, 0.82, 0.035), P(GE.sph, '#ffffff', -0.08, 0.9, 0.82, 0.035));
  for (const [lx, lz] of [[0.2, 0.3], [-0.2, 0.3], [0.2, -0.3], [-0.2, -0.3]]) parts.push(P(GE.cylLo, '#3a3a44', lx, 0.2, lz, 0.06, 0.4, 0.06));
  return add(build(parts), x, z, { v: 2, cols: [cBox(0.42, 0.6, 0.65)], walk: walkState([0.3, 0.8], 0.04, { hop: 8 }) });
}
function cow(x, z) {
  const parts = [P(GE.rbox, '#ffffff', 0, 1.15, 0, 0.85, 0.8, 1.7), P(GE.sph, INK, 0.3, 1.3, 0.2, 0.25, 0.3, 0.35), P(GE.sph, INK, -0.25, 1.1, -0.45, 0.3, 0.32, 0.3),
    P(GE.sph, INK, 0.1, 1.5, -0.1, 0.25, 0.1, 0.3), P(GE.rbox, '#ffffff', 0, 1.45, 1.0, 0.5, 0.5, 0.5), P(GE.rbox, '#ffb3c7', 0, 1.3, 1.28, 0.42, 0.28, 0.15),
    P(GE.cone, '#f2ecd9', 0.25, 1.75, 0.95, 0.05, 0.2, 0.05, 0, 0, -0.6), P(GE.cone, '#f2ecd9', -0.25, 1.75, 0.95, 0.05, 0.2, 0.05, 0, 0, 0.6),
    P(GE.sph, INK, 0.14, 1.55, 1.25, 0.05), P(GE.sph, INK, -0.14, 1.55, 1.25, 0.05), P(GE.sph, '#ffb3c7', 0, 0.72, -0.35, 0.16, 0.1, 0.16),
    P(GE.cylLo, '#ffffff', 0, 1.25, -0.92, 0.03, 0.6, 0.03, 0.4)];
  for (const [lx, lz] of [[0.28, 0.6], [-0.28, 0.6], [0.28, -0.6], [-0.28, -0.6]]) parts.push(P(GE.cyl, '#ffffff', lx, 0.4, lz, 0.1, 0.8, 0.1), P(GE.cyl, INK, lx, 0.06, lz, 0.11, 0.12, 0.11));
  return add(build(parts), x, z, { v: 5, cols: [cBox(0.45, 0.85, 0.95, 0, 0.85, 0.15)], walk: walkState([0.25, 0.6], 0.03, { hop: 6 }) });
}
function dog(x, z) {
  const c = pick(['#a0703f', '#3a3a44', '#e8c77d']), parts = [P(GE.sph, c, 0, 0.4, 0, 0.18, 0.18, 0.36), P(GE.sph, c, 0, 0.6, 0.36, 0.17),
    P(GE.sph, shade(c, 0.7), 0, 0.55, 0.52, 0.08, 0.07, 0.1), P(GE.sph, shade(c, 0.7), 0.15, 0.6, 0.33, 0.05, 0.14, 0.08), P(GE.sph, shade(c, 0.7), -0.15, 0.6, 0.33, 0.05, 0.14, 0.08),
    P(GE.cylLo, c, 0, 0.55, -0.4, 0.03, 0.3, 0.03, -0.7)];
  for (const [lx, lz] of [[0.1, 0.2], [-0.1, 0.2], [0.1, -0.2], [-0.1, -0.2]]) parts.push(P(GE.cylLo, c, lx, 0.13, lz, 0.05, 0.26, 0.05));
  return add(build(parts), x, z, { v: 1, cols: [cBox(0.2, 0.38, 0.45)], walk: walkState([1.2, 2.2], 0.07, { hop: 14 }) });
}
function duck(x, z) {
  const c = pick(['#ffffff', '#ffd23f']), parts = [P(GE.sph, c, 0, 0.25, 0, 0.2, 0.17, 0.28), P(GE.sph, c, 0, 0.45, 0.17, 0.12),
    P(GE.sph, '#ff8a3d', 0, 0.43, 0.3, 0.07, 0.03, 0.08), P(GE.sph, INK, 0.07, 0.49, 0.25, 0.02), P(GE.sph, INK, -0.07, 0.49, 0.25, 0.02)];
  return add(build(parts), x, z, { v: 1, cols: [cBox(0.2, 0.28, 0.3)], walk: walkState([0.4, 0.9], 0.04, { hop: 9 }) });
}

// ---------- Kleinkram ----------
function pumpkin(x, z) {
  const k = R(0.8, 1.2), parts = [P(GE.sph, '#ff8a3d', 0, 0.3 * k, 0, 0.42 * k, 0.3 * k, 0.42 * k), P(GE.sph, '#f07a2d', 0, 0.3 * k, 0, 0.3 * k, 0.31 * k, 0.44 * k),
    P(GE.sph, '#f07a2d', 0, 0.3 * k, 0, 0.44 * k, 0.31 * k, 0.3 * k), P(GE.cylLo, '#3fae4b', 0, 0.62 * k, 0, 0.05, 0.16, 0.05)];
  return add(build(parts), x, z, { v: 1, cols: [cBall(0.33 * k)] });
}
function cabbage(x, z) {
  return add(build([P(GE.sph, '#8ee05a', 0, 0.28, 0, 0.3), P(GE.sph, '#5ccf3f', 0.12, 0.22, 0.05, 0.22, 0.18, 0.26), P(GE.sph, '#5ccf3f', -0.12, 0.22, -0.05, 0.22, 0.18, 0.26)]),
    x, z, { v: 1, cols: [cBall(0.3)] });
}
function milkCan(x, z) {
  return add(build([P(GE.cyl, '#d9dde5', 0, 0.35, 0, 0.22, 0.7, 0.22), P(GE.frust, '#d9dde5', 0, 0.8, 0, 0.15, 0.2, 0.15), P(GE.cyl, '#9aa3b5', 0, 0.94, 0, 0.13, 0.08, 0.13),
    P(GE.torus, '#9aa3b5', 0, 0.55, 0, 0.23, 0.23, 0.23, Math.PI / 2)]), x, z, { v: 1, cols: [cCyl(0.49, 0.22)] });
}
function crate(x, z) {
  const parts = [P(GE.rbox, WOOD, 0, 0.3, 0, 0.8, 0.6, 0.6)], c = pick(['#ff4136', '#3fae4b', '#ffd23f']);
  for (let i = 0; i < 4; i++) parts.push(P(GE.sph, c, -0.2 + (i % 2) * 0.4, 0.62, -0.12 + Math.floor(i / 2) * 0.24, 0.13));
  return add(build(parts), x, z, { v: 1, ry: R(0, 6.28), cols: [cBox(0.4, 0.33, 0.3)] });
}
function sunflower(x, z) {
  return add(build([P(GE.cylLo, '#3fae4b', 0, 0.9, 0, 0.05, 1.8, 0.05), P(GE.sph, '#3fae4b', 0.18, 0.9, 0, 0.22, 0.04, 0.1, 0, 0, 0.4),
    P(GE.cyl, '#ffd23f', 0, 1.9, 0.06, 0.42, 0.06, 0.42, Math.PI / 2 - 0.35), P(GE.cyl, '#7a4a2a', 0, 1.91, 0.1, 0.2, 0.05, 0.2, Math.PI / 2 - 0.35)]),
    x, z, { v: 1, ry: R(-0.6, 0.6), cols: [cCyl(0.85, 0.06), cBox(0.42, 0.42, 0.08, 0, 1.9, 0.06)] });
}
function bale(x, z, ry = R(0, 6.28)) {   // eckiger Heuballen
  return add(build([P(GE.rbox, '#e8c35a', 0, 0.35, 0, 1.3, 0.7, 0.8), P(GE.box, '#b5874a', 0.3, 0.35, 0, 0.05, 0.72, 0.82), P(GE.box, '#b5874a', -0.3, 0.35, 0, 0.05, 0.72, 0.82)]),
    x, z, { v: 2, ry, cols: [cBox(0.65, 0.35, 0.4)] });
}
function roundBale(x, z, ry = R(0, 6.28)) {   // Rundballen: liegt auf der Seite und rollt
  return add(build([P(GE.cyl, '#e8c35a', 0, 0.8, 0, 0.8, 1.2, 0.8, Math.PI / 2), P(GE.cyl, '#d4a942', 0, 0.8, 0.61, 0.62, 0.02, 0.62, Math.PI / 2),
    P(GE.cyl, '#d4a942', 0, 0.8, -0.61, 0.62, 0.02, 0.62, Math.PI / 2)]), x, z, { v: 4, ry, cols: [cCyl(0.6, 0.8, 0, 0.8, 0, Math.PI / 2)] });
}
function barrow(x, z, ry = R(0, 6.28)) {   // Schubkarre
  const c = pick(['#3fae4b', '#ff4136', '#4f8bff']);
  return add(build([P(GE.frust, c, 0, 0.6, 0, 0.6, 0.35, 0.42, Math.PI), P(GE.cyl, '#2a2d36', 0.72, 0.22, 0, 0.22, 0.1, 0.22, Math.PI / 2),
    P(GE.cylLo, DARK, -0.45, 0.55, 0.25, 0.04, 1.3, 0.04, 0, 0, Math.PI / 2 - 0.25), P(GE.cylLo, DARK, -0.45, 0.55, -0.25, 0.04, 1.3, 0.04, 0, 0, Math.PI / 2 - 0.25),
    P(GE.cylLo, DARK, -0.2, 0.2, 0.25, 0.04, 0.4, 0.04), P(GE.cylLo, DARK, -0.2, 0.2, -0.25, 0.04, 0.4, 0.04)]),
    x, z, { v: 3, ry, cols: [cBox(0.7, 0.38, 0.4, -0.1, 0.38)] });
}
function trough(x, z, ry = R(0, 6.28)) {
  return add(build([P(GE.rbox, '#8a93a5', 0, 0.35, 0, 2.0, 0.7, 0.8), P(GE.box, '#5cc8f5', 0, 0.68, 0, 1.75, 0.04, 0.55)]), x, z, { v: 3, ry, cols: [cBox(1.0, 0.35, 0.4)] });
}
function beehive(x, z) {
  return add(build([P(GE.rbox, '#ffffff', 0, 0.3, 0, 0.7, 0.6, 0.6), P(GE.rbox, '#ffd23f', 0, 0.75, 0, 0.7, 0.3, 0.6), P(GE.rbox, '#ffffff', 0, 1.05, 0, 0.7, 0.3, 0.6),
    P(GE.rbox, '#8a93a5', 0, 1.25, 0, 0.85, 0.1, 0.75), P(GE.box, INK, 0, 0.12, 0.31, 0.3, 0.06, 0.02)]), x, z, { v: 2, ry: R(0, 6.28), cols: [cBox(0.36, 0.65, 0.31)] });
}
function reed(x, z) {
  const parts = [];
  for (let i = 0; i < 3; i++) { const ox = R(-0.15, 0.15), oz = R(-0.15, 0.15), h = R(1.2, 1.7);
    parts.push(P(GE.cylLo, '#5ccf3f', ox, h / 2, oz, 0.03, h, 0.03), P(GE.cyl, '#7a4a2a', ox, h, oz, 0.07, 0.3, 0.07)); }
  return add(build(parts), x, z, { v: 1, cols: [cCyl(0.75, 0.15)] });
}
function small(x, z) {   // verstreuter Kleinkram
  const k = rnd();
  return (k < 0.3 ? pumpkin : k < 0.5 ? milkCan : k < 0.7 ? crate : k < 0.85 ? sunflower : bale)(x, z);
}
function fence(x, z, ry = 0, len = 3) {   // Zaunstück: steht auf dünnen Pfosten und kippt leicht um
  const parts = [];
  for (const px of [-len / 2 + 0.1, 0, len / 2 - 0.1]) parts.push(P(GE.rbox, shade(WOOD, 0.85), px, 0.55, 0, 0.16, 1.1, 0.16));
  parts.push(P(GE.rbox, WOOD, 0, 0.78, 0.07, len, 0.14, 0.06), P(GE.rbox, WOOD, 0, 0.42, 0.07, len, 0.14, 0.06));
  return add(build(parts), x, z, { v: 2, ry, cols: [cBox(len / 2, 0.55, 0.1)] });
}
function scarecrow(x, z) {
  const c = pick(['#ff5a4e', '#4f8bff', '#9b6bff', '#3fae4b']);
  return add(build([P(GE.cylLo, DARK, 0, 1.1, 0, 0.06, 2.2, 0.06), P(GE.cylLo, DARK, 0, 1.6, 0, 0.05, 1.8, 0.05, 0, 0, Math.PI / 2),
    P(GE.rbox, c, 0, 1.4, 0, 0.62, 0.75, 0.3), P(GE.rbox, c, 0.55, 1.6, 0, 0.5, 0.22, 0.24), P(GE.rbox, c, -0.55, 1.6, 0, 0.5, 0.22, 0.24),
    P(GE.cone, '#e8c35a', 0.95, 1.6, 0, 0.1, 0.22, 0.1, 0, 0, -Math.PI / 2), P(GE.cone, '#e8c35a', -0.95, 1.6, 0, 0.1, 0.22, 0.1, 0, 0, Math.PI / 2),
    P(GE.sph, '#e8c77d', 0, 2.08, 0, 0.26), P(GE.sph, INK, 0.09, 2.12, 0.23, 0.035), P(GE.sph, INK, -0.09, 2.12, 0.23, 0.035),
    P(GE.cyl, DARK, 0, 2.3, 0, 0.44, 0.05, 0.44), P(GE.cone, DARK, 0, 2.52, 0, 0.22, 0.42, 0.22)]),
    x, z, { v: 3, ry: R(-0.5, 0.5), cols: [cCyl(1.1, 0.08), cBox(0.95, 0.35, 0.15, 0, 1.5), cBall(0.3, 0, 2.15)] });
}
function appleTree(x, z) {
  const s = R(1.2, 1.5), g = pick(['#4fb83a', '#5ccf3f']), parts = [P(GE.cyl, DARK, 0, 0.9, 0, 0.2, 1.8, 0.2), P(GE.sph, g, 0, 1.8 + s, 0, s * 1.1, s * 0.95, s * 1.1)];
  for (let i = 0; i < 7; i++) { const a = R(0, 6.28), b = R(-0.5, 0.9);
    parts.push(P(GE.sph, '#ff4136', Math.cos(a) * Math.cos(b) * s * 1.08, 1.8 + s + Math.sin(b) * s * 0.93, Math.sin(a) * Math.cos(b) * s * 1.08, 0.14)); }
  return add(build(parts), x, z, { v: 9, ry: R(0, 6.28), cols: [cCyl(0.9, 0.22), cBall(s * 1.05, 0, 1.8 + s)] });
}
function boat(x, z, ry) {
  return add(build([P(GE.sph, WOOD, 0, 0.35, 0, 1.6, 0.42, 0.7), P(GE.sph, DARK, 0, 0.5, 0, 1.4, 0.2, 0.55), P(GE.rbox, '#e0b07a', 0, 0.55, 0, 0.3, 0.08, 1.2)]),
    x, z, { v: 6, ry, cols: [cBox(1.5, 0.35, 0.65, 0, 0.35)] });
}
function coop(x, z, ry = 0) {   // Hühnerstall auf Stelzen
  const parts = [P(GE.rbox, WOOD, 0, 1.15, 0, 2.2, 1.3, 1.6), P(GE.prism, '#c8553d', 0, 1.8, 0, 2.6, 0.8, 2.0), P(GE.box, '#3a2a20', 0, 1.0, 0.81, 0.5, 0.6, 0.04),
    P(GE.rbox, WOOD, 0, 0.35, 1.3, 0.4, 0.06, 1.2, 0.5)];
  for (const [lx, lz] of [[0.9, 0.6], [-0.9, 0.6], [0.9, -0.6], [-0.9, -0.6]]) parts.push(P(GE.cylLo, DARK, lx, 0.25, lz, 0.08, 0.5, 0.08));
  return add(build(parts), x, z, { v: 6, ry, cols: [cBox(0.95, 0.25, 0.7), cBox(1.1, 0.65, 0.8, 0, 1.15), cBox(1.2, 0.4, 0.95, 0, 2.2)] });
}
function silo(x, z) {   // hoch und rund: kippt gern um
  const c = pick(['#d9dde5', '#c8d0dc', '#4f8bff']), parts = [P(GE.cylHi, c, 0, 4.5, 0, 1.6, 9, 1.6), P(GE.hemi, shade(c, 0.85), 0, 9, 0, 1.65, 1.2, 1.65)];
  for (const y of [2.5, 5, 7.5]) parts.push(P(GE.torus, shade(c, 0.8), 0, y, 0, 1.62, 1.62, 1.62, Math.PI / 2));
  parts.push(P(GE.box, '#3a4152', 0, 5, 1.62, 0.4, 8.5, 0.06));
  return add(build(parts), x, z, { v: 18, cols: [cCyl(4.5, 1.6), cBall(1.55, 0, 9.0)] });
}
function well(x, z) {   // Dorfbrunnen
  return add(build([P(GE.cyl, '#a7afbf', 0, 0.5, 0, 1.8, 1.0, 1.8), P(GE.cyl, '#1d2433', 0, 1.0, 0, 1.5, 0.02, 1.5), P(GE.rbox, DARK, 1.6, 1.8, 0, 0.2, 2.6, 0.2),
    P(GE.rbox, DARK, -1.6, 1.8, 0, 0.2, 2.6, 0.2), P(GE.prism, '#c8553d', 0, 3.05, 0, 4.0, 1.2, 2.4), P(GE.cylLo, '#5b4a3a', 0, 2.5, 0, 0.07, 3.2, 0.07, 0, 0, Math.PI / 2),
    P(GE.cyl, WOOD, 0, 1.8, 0, 0.25, 0.35, 0.25)]), x, z,
    { v: 18, cols: [cCyl(0.5, 1.8), cBox(0.1, 1.3, 0.1, 1.6, 1.8), cBox(0.1, 1.3, 0.1, -1.6, 1.8), cBox(2.0, 0.6, 1.2, 0, 3.65)] });
}
function maypole(x, z) {   // Maibaum: lang und dünn
  const parts = [P(GE.cyl, '#8a93a5', 0, 0.15, 0, 0.5, 0.3, 0.5), P(GE.cylLo, '#ffffff', 0, 5, 0, 0.13, 10, 0.13), P(GE.torus, '#3fae4b', 0, 8.6, 0, 1.2, 1.2, 1.2, Math.PI / 2),
    P(GE.cone, '#2f9e5b', 0, 10.7, 0, 0.6, 1.4, 0.6)];
  for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283; parts.push(P(GE.box, pick(['#ff5a4e', '#4f8bff', '#ffd23f', '#ffffff']), Math.cos(a) * 1.22, 7.6, Math.sin(a) * 1.22, 0.1, 1.8, 0.03, 0, -a, 0)); }
  return add(build(parts), x, z, { v: 10, cols: [cCyl(0.15, 0.5), cCyl(5, 0.14, 0, 5), cCyl(0.3, 1.3, 0, 8.4)] });
}
function stall(x, z, ry = 0) {   // Marktstand
  const c = pick(['#ff5a4e', '#4f8bff', '#3fae4b', '#ff8a3d']), parts = [P(GE.rbox, WOOD, 0, 0.85, 0, 2.6, 0.15, 1.2)];
  for (const [lx, lz] of [[1.15, 0.5], [-1.15, 0.5], [1.15, -0.5], [-1.15, -0.5]]) parts.push(P(GE.cylLo, DARK, lx, 0.42, lz, 0.06, 0.85, 0.06));
  for (const lx of [-1.2, 1.2]) parts.push(P(GE.cylLo, DARK, lx, 1.6, -0.55, 0.05, 1.5, 0.05));
  for (let i = 0; i < 5; i++) parts.push(P(GE.box, i % 2 ? '#ffffff' : c, -1.12 + i * 0.56, 2.35, -0.05, 0.56, 0.08, 1.4, -0.25));
  for (let i = 0; i < 3; i++) { const vc = pick(['#ff4136', '#3fae4b', '#ffd23f', '#ff8a3d']); parts.push(P(GE.rbox, '#a0703f', -0.8 + i * 0.8, 1.05, 0.1, 0.6, 0.25, 0.5),
    P(GE.sph, vc, -0.9 + i * 0.8, 1.22, 0.05, 0.12), P(GE.sph, vc, -0.7 + i * 0.8, 1.22, 0.18, 0.12)); }
  return add(build(parts), x, z, { v: 6, ry, cols: [cBox(1.3, 0.5, 0.6, 0, 0.5), cBox(1.3, 0.15, 0.7, 0, 2.35)] });
}
function barn(x, z) {   // rote Scheune: Wände und Dach fallen getrennt
  const w = R(8.5, 9.5), d = R(11, 12.5), fh = 5.2, wall = pick(['#c8423a', '#b8392f', '#d24b3e']), fz = d / 2;
  const a = Math.atan2(4, 3.6), L = Math.hypot(4, 3.6);
  const parts = [P(GE.box, wall, 0, fh / 2, 0, w, fh, d), P(GE.rbox, '#ffffff', 0, fh - 0.1, 0, w + 0.2, 0.2, d + 0.2), P(GE.rbox, '#8a93a5', 0, 0.15, 0, w + 0.2, 0.3, d + 0.2),
    P(GE.box, shade(wall, 0.7), 0, 2.0, fz + 0.03, 3.6, 4.0, 0.08), P(GE.box, '#ffffff', 0, 2.0, fz + 0.09, L, 0.18, 0.04, 0, 0, a), P(GE.box, '#ffffff', 0, 2.0, fz + 0.09, L, 0.18, 0.04, 0, 0, -a),
    P(GE.box, '#ffffff', -1.85, 2.0, fz + 0.08, 0.18, 4.0, 0.05), P(GE.box, '#ffffff', 1.85, 2.0, fz + 0.08, 0.18, 4.0, 0.05), P(GE.box, '#ffffff', 0, 4.05, fz + 0.08, 3.9, 0.18, 0.05),
    P(GE.box, '#ffffff', 0, fh - 1.1, fz + 0.04, 1.6, 1.4, 0.04), P(GE.box, '#3a2a20', 0, fh - 1.1, fz + 0.07, 1.25, 1.05, 0.04)];
  for (const sx of [-1, 1]) parts.push(P(GE.box, '#ffffff', sx * (w / 2 + 0.02), 2.6, 0, 0.04, 1.2, 1.6), P(GE.box, '#3a2a20', sx * (w / 2 + 0.05), 2.6, 0, 0.04, 0.9, 1.3));
  const body = add(build(parts), x, z, { v: Math.round(w * d * fh / 10), cols: [cBox(w / 2, fh / 2, d / 2)], fade: true });
  const rh = w * 0.45, W2 = (w + 0.6) / 2, D2 = (d + 0.6) / 2;
  const roof = add(build([P(GE.prism, pick(['#5b4a3a', '#6d7686', '#3a4152']), 0, -0.05, 0, w + 0.6, rh, d + 0.6), P(GE.prism, wall, 0, 0, 0, w - 0.2, rh - 0.3, d + 0.7)]),
    x, z, { y: fh, v: Math.round(w * d * rh / 20), fade: true, cols: [cHull([-W2, 0, -D2, W2, 0, -D2, -W2, 0, D2, W2, 0, D2, 0, rh, -D2, 0, rh, D2])] });
  body.link = roof.link = [body, roof];
  blocked.push([x - w / 2 - 0.6, x + w / 2 + 0.6, z - d / 2 - 0.6, z + d / 2 + 1.2]);
}
export function tractor(x, z, ry, drive) {   // Traktor (vorne = +x), etwa so groß wie ein Auto
  const c = pick(['#3fae4b', '#ff4136', '#4f8bff', '#ff8a3d']);
  const parts = [P(GE.rbox, c, 0.55, 0.85, 0, 2.0, 0.62, 0.95), P(GE.rbox, c, -0.6, 0.85, 0, 1.3, 0.6, 1.25), P(GE.rbox, '#a8dcf5', -0.7, 1.45, 0, 1.1, 0.8, 1.1),
    P(GE.rbox, c, -0.7, 1.9, 0, 1.3, 0.12, 1.3), P(GE.cylLo, '#3a4152', 1.1, 1.45, 0.28, 0.06, 0.8, 0.06), P(GE.rbox, '#3a4152', 1.56, 0.82, 0, 0.1, 0.42, 0.75),
    P(GE.sph, '#fff6c8', 1.56, 1.08, 0.28, 0.09), P(GE.sph, '#fff6c8', 1.56, 1.08, -0.28, 0.09)];
  wheels(parts, [[-0.8, 0.72], [-0.8, -0.72]], 0.62, 0.36, '#2a2d36', '#ffd23f');
  wheels(parts, [[1.05, 0.6], [1.05, -0.6]], 0.38, 0.28, '#2a2d36', '#ffd23f');
  return add(build(parts), x, z, { v: 14, ry, cols: [cBox(1.45, 0.55, 0.82, 0.05, 0.55), cBox(0.6, 0.38, 0.6, -0.7, 1.45)], ...(drive ? { drive } : {}) });   // Formen etwas knapper: rutscht so leicht hinein wie ein Auto
}
function trailer(x, z, ry) {   // Anhänger, oft mit Heu
  const parts = [P(GE.rbox, WOOD, 0, 1.0, 0, 3.4, 0.2, 1.8), P(GE.rbox, '#a0703f', 0, 1.35, 0.85, 3.4, 0.5, 0.1), P(GE.rbox, '#a0703f', 0, 1.35, -0.85, 3.4, 0.5, 0.1),
    P(GE.rbox, '#a0703f', 1.65, 1.35, 0, 0.1, 0.5, 1.7), P(GE.rbox, '#a0703f', -1.65, 1.35, 0, 0.1, 0.5, 1.7), P(GE.cylLo, '#3a4152', 2.2, 0.8, 0, 0.05, 1.0, 0.05, 0, 0, Math.PI / 2)];
  if (rnd() < 0.6) for (let i = 0; i < 3; i++) parts.push(P(GE.rbox, '#e8c35a', -1.1 + i * 1.1, 1.6, 0, 1.0, 0.6, 1.5));
  wheels(parts, [[0.9, 0.82], [-0.9, 0.82], [0.9, -0.82], [-0.9, -0.82]], 0.45, 0.25);
  return add(build(parts), x, z, { v: 10, ry, cols: [cBox(1.75, 0.55, 0.85, 0, 0.55), cBox(1.7, 0.35, 0.82, 0, 1.4)] });
}

// ---------- Endboss: Windmühle ----------
function windmill(x, z) {
  const g = new THREE.Group(), mats = [], parts = [];
  parts.push(P(tube(7.6, 8.4, 6, 32), '#c8553d', 0, 3, 0), P(GE.rbox, DARK, 0, 1.6, 8.05, 2.2, 3.2, 0.6), P(GE.rbox, '#ffffff', 0, 4.5, 7.9, 1.0, 1.0, 0.4));
  parts.push(P(tube(9.4, 9.4, 0.45, 40), '#a0703f', 0, 6.2, 0));   // Galerie
  for (let i = 0; i < 20; i++) { const a = i / 20 * 6.283; parts.push(P(GE.cylLo, '#7a5230', Math.cos(a) * 9.1, 6.95, Math.sin(a) * 9.1, 0.07, 1.1, 0.07)); }
  parts.push(P(new THREE.TorusGeometry(9.1, 0.08, 6, 48).toNonIndexed(), '#7a5230', 0, 7.5, 0, 1, 1, 1, Math.PI / 2));
  parts.push(P(tube(3.8, 6.6, 14, 8), '#f2ecd9', 0, 13.4, 0, 1, 1, 1, 0, Math.PI / 8));   // achteckiger Turm
  for (const [y, z0] of [[9.5, 5.5], [13.5, 4.85], [17.5, 4.1]]) parts.push(P(GE.rbox, '#3a4152', 0, y, z0, 0.9, 1.3, 0.4), P(GE.rbox, '#ffffff', 0, y - 0.75, z0 + 0.1, 1.2, 0.15, 0.35));
  parts.push(P(GE.hemi, '#6b4a2e', 0, 20.3, 0, 4.3, 3.8, 4.3), P(GE.cyl, '#3a4152', 0, 22, 4.2, 0.45, 1.6, 0.45, Math.PI / 2));
  const cols = [cCyl(3, 8.4), cCyl(0.25, 9.4, 0, 6.2), cCyl(7, 5.6, 0, 13.4), cBall(4.0, 0, 21.5)];
  const em = MAT.clone(); mats.push(em); g.add(build(parts, em));
  const sp = [P(GE.cyl, '#3a4152', 0, 0, 0, 0.75, 0.5, 0.75, Math.PI / 2)];   // Flügel (drehen sich um die Nabe)
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2, dx = -Math.sin(a), dy = Math.cos(a), nx = Math.cos(a), ny = Math.sin(a);
    sp.push(P(GE.box, '#6b4a2e', dx * 3.95, dy * 3.95, 0.05, 0.32, 6.9, 0.25, 0, 0, a));
    sp.push(P(GE.box, '#f6f1e7', dx * 4.4 + nx * 1.15, dy * 4.4 + ny * 1.15, 0.08, 1.9, 5.6, 0.08, 0, 0, a));
    for (const r of [2.0, 3.7, 5.4, 7.1]) sp.push(P(GE.box, '#8a5634', dx * r + nx * 1.15, dy * r + ny * 1.15, 0.14, 2.0, 0.12, 0.05, 0, 0, a));
  }
  const sails = build(sp, em); sails.position.set(0, 22, 5.0); g.add(sails);
  const o = addBoss(g, x, z, cols, mats, 30, 9.4);
  o.anim = dt => { sails.rotation.z -= dt * 0.9; };
  return o;
}

// ---------- Welt bauen ----------
export function create() {
  setSeed(33);
  flat(600, 600, 0, 0, 0, TEX.grass, 9);
  roadNet({ walk: null, road: DIRT, roadScale: 9, marks: false, curbs: false });
  edgeRing(['#4fb83a', '#5ccf3f', '#3e9e35']);
  const PLAZAS = ['-15,15', '45,-15', '-75,45', '75,75', '15,-75'];
  const BOSS = '-45,-45';
  const KINDS = [...Array(10).fill('farm'), ...Array(4).fill('manor'), ...Array(6).fill('village'), ...Array(3).fill('field'), ...Array(3).fill('pasture'),
    'orchard', 'orchard', 'orchard', 'pond'];   // 30 Blöcke, fest gemischt
  for (let i = KINDS.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [KINDS[i], KINDS[j]] = [KINDS[j], KINDS[i]]; }
  let ki = 0;
  for (const bx of BLOCKS) for (const bz of BLOCKS) {
    const cd = Math.max(Math.abs(bx), Math.abs(bz)), key = bx + ',' + bz;
    if (key === BOSS) { windmill(bx, bz); for (const [ox, oz] of [[-11, -11], [11, -11], [-11, 11], [11, 11]]) appleTree(bx + ox, bz + oz); continue; }
    const kind = PLAZAS.includes(key) ? 'plaza' : KINDS[ki++];
    if (kind === 'farm') {   // Hof: Wohnhaus, Scheune, Silo, Stall, Traktor
      building(bx - 5, bz - 4, R(6.5, 7.5), R(6, 7), 2, { roof: 'pitched', wall: pick(['#fff6e6', '#f2e0c8', '#ffe8d6']), roofCol: pick(['#c8553d', '#b5674d', '#8a5634']),
        band: '#8a5634', awning: false });
      barn(bx + 5, bz - 2);
      silo(bx + 8, bz + 7.5);
      coop(bx - 6, bz + 6, R(-0.3, 0.3));
      tractor(bx + 1, bz + 7.5, 0);
      for (let i = 0; i < 3; i++) { const p = freeSpot(bx, bz, 9.5, 0.9); if (p) (rnd() < 0.5 ? bale : roundBale)(...p); }
      for (let i = 0; i < 3; i++) { const p = freeSpot(bx, bz, 9.5, 0.5); if (p) (rnd() < 0.5 ? milkCan : crate)(...p); }
      { const p = freeSpot(bx, bz, 9, 0.8); if (p) (rnd() < 0.5 ? barrow : trough)(...p); }
    } else if (kind === 'manor') {   // Gutshaus mit 3 bis 4 Etagen
      building(bx, bz - 1.5, R(11, 13), R(9.5, 11), Math.round(R(3, 4)), { roof: 'pitched', wall: pick(['#fff6e6', '#ffe8d6', '#f2e0c8']), roofCol: pick(['#8a5634', '#c8553d', '#6d7686']),
        band: '#8a5634', awning: false, chimney: true });
      for (const [ox, oz] of [[-8.5, 8.5], [8.5, 8.5]]) appleTree(bx + ox, bz + oz);
      bench(bx - 3.5, bz + 8.8, 0, WOOD); trough(bx + 3.5, bz + 8.8, 0);
      for (let i = 0; i < 2; i++) { const p = freeSpot(bx, bz, 9.5, 0.5); if (p) (rnd() < 0.5 ? milkCan : sunflower)(...p); }
    } else if (kind === 'field') {   // Acker: Gemüse in Reihen oder Weizen mit Rundballen
      scarecrow(bx + R(-2, 2), bz + 2.6);
      if (rnd() < 0.5) {
        flat(20, 20, bx, bz, 0.012, SOIL, 5);
        const veg = rnd() < 0.5 ? pumpkin : cabbage;
        for (let r = 0; r < 5; r++) for (let i = 0; i < 7; i++) veg(bx - 8.4 + i * 2.8 + R(-0.3, 0.3), bz - 8 + r * 4 + 0.6);
      } else {
        flat(20, 20, bx, bz, 0.012, WHEAT, 5);
        for (let i = 0; i < 6; i++) { const p = freeSpot(bx, bz, 9, 1.0); if (p) roundBale(...p); }
        for (let i = 0; i < 4; i++) { const p = freeSpot(bx, bz, 9, 0.8); if (p) bale(...p); }
        { const p = freeSpot(bx, bz, 7, 1.8); if (p) tractor(...p, R(0, 6.28)); }
      }
      { const p = freeSpot(bx, bz, 9, 0.8); if (p) barrow(...p); }
    } else if (kind === 'pasture') {   // Weide mit Zaun, Kühen und Schafen
      for (let i = 0; i < 6; i++) { const t = -7.5 + i * 3; fence(bx + t, bz - 9.3); fence(bx + t, bz + 9.3); fence(bx - 9.3, bz + t, Math.PI / 2); fence(bx + 9.3, bz + t, Math.PI / 2); }
      for (let i = 0; i < 4; i++) { const p = freeSpot(bx, bz, 7, 1.2); if (p) cow(...p); }
      for (let i = 0; i < 4; i++) { const p = freeSpot(bx, bz, 7, 0.8); if (p) sheep(...p); }
      for (let i = 0; i < 2; i++) { const p = freeSpot(bx, bz, 7, 1.0); if (p) roundBale(...p); }
      { const p = freeSpot(bx, bz, 6, 1.2); if (p) trough(...p); }
      { const p = freeSpot(bx, bz, 7, 1.5); if (p) appleTree(...p); }
    } else if (kind === 'orchard') {   // Obstwiese mit Bienenstöcken
      for (const ox of [-6.5, 0, 6.5]) for (const oz of [-6.5, 0, 6.5]) appleTree(bx + ox + R(-0.6, 0.6), bz + oz + R(-0.6, 0.6));
      for (let i = 0; i < 3; i++) { const p = freeSpot(bx, bz, 9, 0.5); if (p) beehive(...p); }
      for (let i = 0; i < 4; i++) { const p = freeSpot(bx, bz, 9, 0.5); if (p) crate(...p); }
      { const p = freeSpot(bx, bz, 9, 0.8); if (p) barrow(...p); }
    } else if (kind === 'pond') {   // Teich mit Enten und Schilf
      flat(15, 11, bx, bz, 0.012, TEX.water, 6);
      for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; reed(bx + Math.cos(a) * 7.8, bz + Math.sin(a) * 5.8); }
      for (let i = 0; i < 6; i++) duck(bx + R(-5, 5), bz + R(-3.5, 3.5));
      boat(bx + 2, bz + 1, 0.4);
      bench(bx - 6, bz + 8.5, 0, WOOD); bench(bx + 5, bz + 8.5, 0, WOOD);
      for (const [ox, oz] of [[-8.5, -8], [8.5, -8]]) appleTree(bx + ox, bz + oz);
    } else if (kind === 'village') {   // Dorfhäuser mit Gärten
      for (const ox of [-5, 5]) for (const oz of [-5, 5]) {
        if (rnd() < 0.15) { coop(bx + ox, bz + oz, R(-0.3, 0.3)); continue; }
        const k = rnd() + (cd < 50 ? 0.2 : 0), fl = k < 0.4 ? 1 : k < 0.85 ? 2 : 3, sz = fl === 1 ? [4.5, 5.5] : fl === 2 ? [5.5, 7] : [6.5, 8];
        building(bx + ox, bz + oz, R(sz[0], sz[1]), R(sz[0], sz[1] - 0.3), fl, { roof: rnd() < 0.85 ? 'pitched' : 'flat',
          wall: pick(['#fff6e6', '#f2e0c8', '#ffe8d6', '#e8f0e0', '#fff09a']), roofCol: pick(['#c8553d', '#8a5634', '#b5674d', '#6d7686']), band: pick(['#8a5634', '#ece6da']) });
      }
      for (let i = 0; i < 5; i++) { const p = freeSpot(bx, bz); if (p) bush(...p); }
      for (let i = 0; i < 3; i++) { const p = freeSpot(bx, bz, 9.5, 1.4); if (p) appleTree(...p); }
      for (let i = 0; i < 2; i++) { const p = freeSpot(bx, bz, 9.5, 0.5); if (p) sunflower(...p); }
    } else {   // Dorfplatz: Brunnen, Maibaum, Marktstände
      flat(22, 22, bx, bz, 0.012, TEX.plaza, 4);
      well(bx, bz);
      maypole(bx - 6.5, bz - 6.5);
      stall(bx + 5, bz + 6.5, 0); stall(bx - 5, bz + 6.5, 0); stall(bx + 7, bz - 2, -Math.PI / 2);
      for (let i = 0; i < 3; i++) { const a = i * Math.PI / 2 + 0.4; bench(bx + Math.cos(a) * 5.0, bz + Math.sin(a) * 5.0, -a - Math.PI / 2, WOOD); }
      for (const [lx, lz] of [[-9, 1], [9, 8.5], [0, -9]]) lamp(bx + lx, bz + lz, '#5b4a3a');
      building(bx + 6.5, bz - 7.5, 4, 3.2, 1, { fh: 2.8, roof: 'pitched', base: false, rh: 0.45, wall: '#fff6e6', roofCol: '#c8553d', awnCol: '#3fae4b' });   // Hofladen
      for (let i = 0; i < 3; i++) { const p = freeSpot(bx, bz, 9, 0.5); if (p) (rnd() < 0.5 ? crate : pumpkin)(...p); }
    }
  }
  for (const rc of ROADS) {   // Feldwege: Zäune am Rand, Kleinkram, abgestellte Traktoren und Anhänger
    let step = 0;
    for (let t = -MAP + 3; t < MAP - 2; t += 10, step++) {
      if (ROADS.some(r => Math.abs(t - r) < 7)) continue;
      const s = step % 2 ? 1 : -1;
      fence(t, rc + s * 4.6); fence(rc + s * 4.6, t, Math.PI / 2);
      if (rnd() < 0.4) fence(t + 3.1, rc + s * 4.6); if (rnd() < 0.4) fence(rc + s * 4.6, t + 3.1, Math.PI / 2);
      if (rnd() < 0.35) small(t + 2, rc - s * 4.4); if (rnd() < 0.35) small(rc - s * 4.4, t + 2);
      if (rnd() < 0.25) (rnd() < 0.5 ? bale : roundBale)(t - 3, rc - s * 4.3); if (rnd() < 0.25) (rnd() < 0.5 ? bale : roundBale)(rc - s * 4.3, t - 3);
      if (rnd() < 0.45) appleTree(t - 5.5, rc + s * 4.4); if (rnd() < 0.45) appleTree(rc + s * 4.4, t - 5.5);   // Obstbäume am Weg
    }
    for (let t = -MAP + 6; t < MAP - 4; t += R(8, 13)) {
      if (ROADS.some(r => Math.abs(t - r) < 9)) continue;
      if (rnd() < 0.5) (rnd() < 0.6 ? tractor : trailer)(t, rc + pick([-1, 1]) * 2.4, 0);
      if (rnd() < 0.5) (rnd() < 0.6 ? tractor : trailer)(rc + pick([-1, 1]) * 2.4, t, Math.PI / 2);
    }
  }
  for (let i = 0; i < 40; i++) {   // fahrende Traktoren
    const ax = rnd() < 0.5 ? 'x' : 'z', rc = pick(ROADS), dir = pick([-1, 1]), t = R(-MAP + 8, MAP - 8);
    const drive = { ax, rc, dir, sp: R(2.6, 4.2), curve: null, pending: null, decided: null };
    if (ax === 'x') tractor(t, laneOf('x', rc, dir), dir > 0 ? 0 : Math.PI, drive);
    else tractor(laneOf('z', rc, dir), t, dir > 0 ? -Math.PI / 2 : Math.PI / 2, drive);
  }
  scatter(150, chicken, { r: 0.3 });
  scatter(85, farmer, { r: 0.3 });
  scatter(40, pig, { r: 0.35 });
  scatter(35, sheep, { r: 0.45 });
  scatter(15, dog, { r: 0.3 });
  scatter(170, small, { r: 0.4 });
}
