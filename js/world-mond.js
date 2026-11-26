// Lochfrass! – Welt 5: Mondbasis (Kuppeln, Module, Rover, Kristalle; Endboss Rakete; wenig Schwerkraft)
import { THREE, MAP, ROADS, BLOCKS, INK, R, pick, rnd, setSeed, P, GE, build, add, cBox, cCyl, cBall, cCone, cHull, flat, disc, roadNet, edgeRing,
  lamp, building, scatter, freeSpot, canvasTex, speckle, shade, laneOf, MAT, NO_OUTLINE, walkState, blocked, wheels, addBoss, tube } from './kit.js';

export const env = {
  bg: () => canvasTex(512, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#05071a'); g.addColorStop(1, '#1d2246'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) { x.fillStyle = `rgba(255,255,255,${0.3 + Math.random() * 0.7})`; x.beginPath(); x.arc(Math.random() * w, Math.random() * h, Math.random() * 1.6 + 0.3, 0, 6.3); x.fill(); }
    x.fillStyle = '#4f8bff'; x.beginPath(); x.arc(w * 0.8, h * 0.22, 34, 0, 6.3); x.fill();
    x.fillStyle = '#3fae4b'; x.beginPath(); x.arc(w * 0.79, h * 0.2, 14, 0, 6.3); x.arc(w * 0.82, h * 0.25, 10, 0, 6.3); x.fill(); }),
  fog: 0x1d2246, hemi: [0xdfe6ff, 0x4a4560, 1.5], sun: [0xffffff, 2.5], gravity: -12, dust: 0xc9c9d6, grow: 1.25,
};

const MOON = canvasTex(256, (x, s) => { x.fillStyle = '#b9bccb'; x.fillRect(0, 0, s, s); speckle(x, s, '120,124,140', .5, 500, 3); speckle(x, s, '230,232,240', .5, 300, 2);
  for (let i = 0; i < 6; i++) { const cx = Math.random() * s, cy = Math.random() * s, r = 6 + Math.random() * 14;
    x.fillStyle = 'rgba(110,114,130,.35)'; x.beginPath(); x.arc(cx, cy, r, 0, 6.3); x.fill();
    x.strokeStyle = 'rgba(235,238,245,.6)'; x.lineWidth = 2; x.beginPath(); x.arc(cx + 1, cy + 1, r, 3.6, 5.6); x.stroke(); } });
const TRACK = canvasTex(128, (x, s) => { x.fillStyle = '#5a6078'; x.fillRect(0, 0, s, s); x.strokeStyle = '#4a5068'; x.lineWidth = 4;
  for (let i = 0; i <= 2; i++) { x.beginPath(); x.moveTo(0, i * 64); x.lineTo(s, i * 64); x.stroke(); x.beginPath(); x.moveTo(i * 64, 0); x.lineTo(i * 64, s); x.stroke(); }
  speckle(x, s, '140,148,170', .3, 80, 2); });
const PADTEX = canvasTex(128, (x, s) => { x.fillStyle = '#9aa3b5'; x.fillRect(0, 0, s, s); x.strokeStyle = '#7d8699'; x.lineWidth = 3;
  for (let i = 0; i <= 4; i++) { x.beginPath(); x.moveTo(0, i * 32); x.lineTo(s, i * 32); x.stroke(); x.beginPath(); x.moveTo(i * 32, 0); x.lineTo(i * 32, s); x.stroke(); } });
const RIB = new THREE.TorusGeometry(1, 0.03, 6, 32).toNonIndexed();
const ACC = ['#4f8bff', '#ff8a3d', '#2fd3b9', '#ff5a4e', '#ffd23f'];
const GLOW = ['#7fe3ff', '#ff7ac6', '#b48cff', '#7dffb0'];

// ---------- Bewohner ----------
function astronaut(x, z) {   // hüpft wie auf dem Mond
  const c = pick(['#ffffff', '#ffffff', '#ffd23f', '#ff8a3d']);
  const parts = [P(GE.legs, '#e3e7ee', 0, 0.3, 0, 1.15, 1, 1.15), P(GE.torso, c, 0, 0.82, 0, 1.15, 1, 1.15), P(GE.rbox, '#c8d0dc', 0, 0.85, -0.3, 0.42, 0.55, 0.22),
    P(GE.sph, '#ffffff', 0, 1.35, 0, 0.27), P(GE.sph, '#ffb000', 0, 1.36, 0.1, 0.2, 0.16, 0.2), P(GE.rbox, pick(ACC), 0.12, 0.95, 0.24, 0.1, 0.08, 0.02)];
  return add(build(parts), x, z, { v: 1, cols: [cCyl(0.72, 0.28)], walk: walkState([0.6, 1.2], 0.35, { hop: 4 }) });
}
function alien(x, z) {
  const c = pick(['#5ccf3f', '#2fd3b9', '#9b6bff']);
  const parts = [P(GE.cap, c, 0, 0.45, 0, 0.5, 0.45, 0.5), P(GE.sph, c, 0, 1.0, 0, 0.32, 0.28, 0.3), P(GE.sph, '#ffffff', 0.12, 1.05, 0.22, 0.1), P(GE.sph, '#ffffff', -0.12, 1.05, 0.22, 0.1),
    P(GE.sph, INK, 0.12, 1.05, 0.3, 0.05), P(GE.sph, INK, -0.12, 1.05, 0.3, 0.05), P(GE.cylLo, c, 0.12, 1.4, 0, 0.02, 0.35, 0.02, 0, 0, -0.3),
    P(GE.cylLo, c, -0.12, 1.4, 0, 0.02, 0.35, 0.02, 0, 0, 0.3), P(GE.sph, '#ffd23f', 0.17, 1.57, 0, 0.06), P(GE.sph, '#ffd23f', -0.17, 1.57, 0, 0.06)];
  return add(build(parts), x, z, { v: 1, cols: [cCyl(0.65, 0.3)], walk: walkState([0.8, 1.6], 0.15, { hop: 8 }) });
}
function robot(x, z) {   // rollt auf einem Rad
  const c = pick(['#e3e7ee', '#ffd23f', '#4f8bff']);
  const parts = [P(GE.rbox, c, 0, 0.6, 0, 0.6, 0.6, 0.5), P(GE.rbox, '#3a4152', 0, 0.68, 0.26, 0.4, 0.25, 0.02), P(GE.sph, '#7fe3ff', 0.1, 0.68, 0.27, 0.05),
    P(GE.sph, '#7fe3ff', -0.1, 0.68, 0.27, 0.05), P(GE.cylLo, '#3a4152', 0, 1.03, 0, 0.02, 0.3, 0.02), P(GE.sph, '#ff4136', 0, 1.2, 0, 0.06),
    P(GE.cyl, '#3a4152', 0, 0.16, 0, 0.16, 0.4, 0.16, 0, 0, Math.PI / 2)];
  return add(build(parts), x, z, { v: 1, cols: [cBox(0.3, 0.62, 0.28)], walk: walkState([1.0, 1.8], 0.02, { hop: 20 }) });
}

// ---------- Kleinkram ----------
function small(x, z) {   // Mondstein, Kristall, Sauerstoffflasche, Probenkoffer, Leuchtkegel
  const k = rnd();
  if (k < 0.3) { const r = R(0.22, 0.4); return add(build([P(GE.dodec, pick(['#9a9eb0', '#b9bccb', '#80859a']), 0, r * 0.8, 0, r)]), x, z, { v: 1, ry: R(0, 6.28), cols: [cBall(r * 0.9, 0, r * 0.85)] }); }
  if (k < 0.55) { const c = pick(GLOW); return add(build([P(GE.oct, c, 0, 0.45, 0, 0.18, 0.45, 0.18), P(GE.oct, shade(c, 0.85), 0.16, 0.25, 0.05, 0.1, 0.25, 0.1, 0, 0, -0.4)]),
    x, z, { v: 1, ry: R(0, 6.28), cols: [cCyl(0.45, 0.18)] }); }
  if (k < 0.72) return add(build([P(GE.cyl, '#ffffff', 0, 0.4, 0, 0.18, 0.8, 0.18), P(GE.sph, '#ffffff', 0, 0.8, 0, 0.18), P(GE.cyl, '#3a4152', 0, 1.0, 0, 0.06, 0.12, 0.06),
    P(GE.cyl, pick(ACC), 0, 0.45, 0, 0.19, 0.12, 0.19)]), x, z, { v: 1, cols: [cCyl(0.5, 0.18)] });
  if (k < 0.88) return add(build([P(GE.rbox, pick(['#ff8a3d', '#e3e7ee', '#ffd23f']), 0, 0.22, 0, 0.8, 0.44, 0.5), P(GE.rbox, '#3a4152', 0, 0.46, 0, 0.3, 0.05, 0.08)]),
    x, z, { v: 1, ry: R(0, 6.28), cols: [cBox(0.4, 0.24, 0.25)] });
  return add(build([P(GE.rbox, '#3a4152', 0, 0.04, 0, 0.5, 0.08, 0.5), P(GE.cone, '#ff8a3d', 0, 0.35, 0, 0.2, 0.6, 0.2), P(GE.cyl, '#7fe3ff', 0, 0.4, 0, 0.13, 0.1, 0.13)]),
    x, z, { v: 1, cols: [cBox(0.25, 0.04, 0.25), cCone(0.3, 0.2, 0, 0.35)] });
}
function rock(x, z) {   // größerer Felsbrocken
  const r = R(0.6, 0.95), c = pick(['#9a9eb0', '#b9bccb', '#80859a']);
  return add(build([P(GE.dodec, c, 0, r * 0.75, 0, r, r * 0.85, r), P(GE.dodec, shade(c, 0.9), r * 0.7, r * 0.4, r * 0.3, r * 0.5)]), x, z,
    { v: 3, ry: R(0, 6.28), cols: [cBall(r * 0.85, 0, r * 0.75)] });
}
function crystals(x, z) {   // Kristallgruppe
  const c = pick(GLOW), parts = [P(GE.dodec, '#80859a', 0, 0.2, 0, 0.5, 0.3, 0.5)];
  for (let i = 0; i < 5; i++) { const a = i / 5 * 6.283, h = R(0.6, 1.2); parts.push(P(GE.oct, i % 2 ? c : shade(c, 0.85), Math.cos(a) * 0.3, 0.2 + h * 0.6, Math.sin(a) * 0.3, 0.2, h, 0.2, Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3)); }
  parts.push(P(GE.oct, c, 0, 1.1, 0, 0.28, 1.1, 0.28));
  return add(build(parts), x, z, { v: 3, ry: R(0, 6.28), cols: [cCyl(0.4, 0.6), cCyl(0.6, 0.25, 0, 1.2)] });
}
function solar(x, z, ry = 0) {   // Solarpanel auf einem Mast
  const parts = [P(GE.cyl, '#9aa3b5', 0, 0.1, 0, 0.35, 0.2, 0.35), P(GE.cylLo, '#9aa3b5', 0, 0.8, 0, 0.07, 1.4, 0.07), P(GE.rbox, '#e3e7ee', 0, 1.6, 0, 2.6, 0.1, 1.6, 0.5),
    P(GE.box, '#2a3a7a', 0, 1.66, 0.03, 2.4, 0.04, 1.4, 0.5)];
  for (let i = -1; i <= 1; i++) parts.push(P(GE.box, '#7d9ae0', i * 0.6, 1.69, 0.05, 0.03, 0.02, 1.4, 0.5));
  return add(build(parts), x, z, { v: 4, ry, cols: [cCyl(0.1, 0.35), cCyl(0.7, 0.08, 0, 0.8), cBox(1.3, 0.3, 0.75, 0, 1.6)] });
}
function smallDish(x, z, ry = R(0, 6.28)) {
  return add(build([P(GE.cyl, '#9aa3b5', 0, 0.5, 0, 0.18, 1.0, 0.18), P(GE.frust, '#e8ecf5', 0, 1.35, 0.15, 0.9, 0.25, 0.9, Math.PI + 0.6),
    P(GE.cylLo, '#3a4152', 0, 1.7, 0.4, 0.03, 0.8, 0.03, 0.6), P(GE.sph, '#ff4136', 0, 2.0, 0.6, 0.07)]), x, z,
    { v: 3, ry, cols: [cCyl(0.5, 0.2), cCyl(0.15, 0.9, 0, 1.35, 0.15, 0.6)] });
}
function crate(x, z, ry = R(0, 6.28)) {
  const c = pick(['#e3e7ee', '#ff8a3d', '#4f8bff']);
  return add(build([P(GE.rbox, c, 0, 0.5, 0, 1.0, 1.0, 1.0), P(GE.box, '#3a4152', 0, 0.5, 0.51, 0.7, 0.12, 0.02), P(GE.box, '#ffd23f', 0, 0.75, 0.51, 0.3, 0.12, 0.02)]),
    x, z, { v: 2, ry, cols: [cBox(0.5, 0.5, 0.5)] });
}
function fuelTank(x, z, ry = R(0, 6.28)) {   // liegender Tank: rollt
  const c = pick(['#ffffff', '#ff8a3d', '#e3e7ee']);
  return add(build([P(GE.cylHi, c, 0, 0.75, 0, 0.7, 2.6, 0.7, 0, 0, Math.PI / 2), P(GE.sph, c, 1.3, 0.75, 0, 0.35, 0.7, 0.7), P(GE.sph, c, -1.3, 0.75, 0, 0.35, 0.7, 0.7),
    P(GE.cyl, pick(ACC), 0, 0.75, 0, 0.72, 0.3, 0.72, 0, 0, Math.PI / 2)]), x, z, { v: 5, ry, cols: [cCyl(1.6, 0.7, 0, 0.7, 0, 0, Math.PI / 2)] });
}
function mast(x, z) {   // Antennenmast: lang und dünn
  return add(build([P(GE.cyl, '#9aa3b5', 0, 0.15, 0, 0.4, 0.3, 0.4), P(tube(0.08, 0.22, 6, 8), '#e3e7ee', 0, 3.3, 0), P(GE.rbox, '#e3e7ee', 0, 5.2, 0, 1.4, 0.08, 0.08),
    P(GE.rbox, '#e3e7ee', 0, 4.4, 0, 1.0, 0.08, 0.08), P(GE.sph, '#ff4136', 0, 6.4, 0, 0.14)]), x, z, { v: 3, ry: R(0, 6.28), cols: [cCyl(0.15, 0.4), cCyl(3.0, 0.2, 0, 3.3)] });
}
function flag(x, z) {   // Fahne der Basis (Loch-Wappen)
  return add(build([P(GE.cylLo, '#e3e7ee', 0, 1.2, 0, 0.04, 2.4, 0.04), P(GE.box, '#ffffff', 0.55, 2.05, 0, 1.1, 0.7, 0.03), P(GE.cyl, INK, 0.55, 2.05, 0.02, 0.22, 0.03, 0.22, Math.PI / 2),
    P(GE.torus, '#2fd3b9', 0.55, 2.05, 0.03, 0.24, 0.24, 0.24), P(GE.cylLo, '#e3e7ee', 0.55, 2.4, 0, 0.025, 1.1, 0.025, 0, 0, Math.PI / 2)]),
    x, z, { v: 2, ry: R(-0.8, 0.8), cols: [cCyl(1.2, 0.06), cBox(0.55, 0.35, 0.05, 0.55, 2.05)] });
}
function charger(x, z, ry = 0) {   // Ladesäule
  return add(build([P(GE.rbox, '#e3e7ee', 0, 0.7, 0, 0.5, 1.4, 0.35), P(GE.box, '#7fe3ff', 0, 1.0, 0.18, 0.3, 0.3, 0.02), P(GE.cylLo, '#3a4152', 0.3, 0.7, 0.1, 0.03, 0.8, 0.03, 0, 0, 0.6)]),
    x, z, { v: 2, ry, cols: [cBox(0.25, 0.7, 0.18)] });
}
function bigCrystal(x, z) {   // große Kristallformation (wie ein Baum: hoch, wackelt und kippt)
  const c = pick(GLOW), h = R(2.4, 3.4), parts = [P(GE.dodec, '#80859a', 0, 0.35, 0, 0.9, 0.5, 0.9), P(GE.oct, c, 0, 0.3 + h / 2, 0, 0.45, h / 2, 0.45)];
  for (let i = 0; i < 4; i++) { const a = i / 4 * 6.283 + 0.4, k = R(0.45, 0.7); parts.push(P(GE.oct, i % 2 ? shade(c, 0.85) : c, Math.cos(a) * 0.55, 0.3 + h * k * 0.45, Math.sin(a) * 0.55,
    0.3, h * k * 0.45, 0.3, Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35)); }
  return add(build(parts), x, z, { v: 9, ry: R(0, 6.28), cols: [cCyl(0.35, 0.9), cCyl(h * 0.45, 0.45, 0, 0.3 + h / 2)] });
}
function cargoPod(x, z) {   // Frachtbehälter
  const c = pick(['#e3e7ee', '#ffffff', '#ffd23f']), a = pick(ACC);
  return add(build([P(GE.cylHi, c, 0, 1.1, 0, 0.9, 2.2, 0.9), P(GE.cyl, a, 0, 1.6, 0, 0.92, 0.3, 0.92), P(GE.hemi, shade(c, 0.9), 0, 2.2, 0, 0.9, 0.4, 0.9),
    P(GE.rbox, '#3a4152', 0, 0.9, 0.88, 0.5, 0.6, 0.06), P(GE.cyl, '#9aa3b5', 0, 0.06, 0, 1.0, 0.12, 1.0)]), x, z, { v: 8, cols: [cCyl(1.3, 0.9)] });
}
function moonLamp(x, z) { return lamp(x, z, '#e3e7ee', pick(['#7fe3ff', '#fff3a8'])); }

// ---------- Fahrzeuge und Gebäude ----------
export function rover(x, z, ry, drive) {   // Mond-Rover mit 6 Rädern (vorne = +x)
  const c = pick(['#ffffff', '#ffd23f', '#e3e7ee']), a = pick(ACC);
  const parts = [P(GE.rbox, c, 0, 0.95, 0, 3.2, 0.5, 1.6), P(GE.rbox, a, 0.6, 1.45, 0, 1.4, 0.6, 1.4), P(GE.box, '#7fe3ff', 1.31, 1.5, 0, 0.04, 0.4, 1.1),
    P(GE.rbox, a, -0.9, 1.35, 0, 1.2, 0.3, 1.4), P(GE.cylLo, '#3a4152', -1.2, 2.0, 0.5, 0.03, 1.4, 0.03), P(GE.cyl, '#e3e7ee', -1.2, 2.72, 0.5, 0.32, 0.06, 0.32, 0.5),
    P(GE.sph, '#ff4136', 1.55, 1.0, 0.6, 0.1), P(GE.sph, '#ff4136', 1.55, 1.0, -0.6, 0.1)];
  wheels(parts, [[1.1, 0.9], [0, 0.9], [-1.1, 0.9], [1.1, -0.9], [0, -0.9], [-1.1, -0.9]], 0.42, 0.35, '#3a4152', '#9aa3b5');
  return add(build(parts), x, z, { v: 14, ry, cols: [cBox(1.65, 0.62, 1.08, 0, 0.62), cBox(0.7, 0.35, 0.7, 0.6, 1.45)], ...(drive ? { drive } : {}) });
}
function lander(x, z) {   // Landefähre auf vier Beinen
  const parts = [P(tube(1.6, 1.6, 1.6, 8), '#e0b040', 0, 2.2, 0, 1, 1, 1, 0, Math.PI / 8), P(GE.rbox, '#e3e7ee', 0, 3.6, 0, 2.2, 1.3, 2.0), P(GE.box, '#3a4152', 0, 3.7, 1.01, 0.8, 0.5, 0.04),
    P(GE.cone, '#3a4152', 0, 1.1, 0, 0.7, 0.7, 0.7, Math.PI), P(GE.cyl, '#e3e7ee', 0.6, 4.5, 0, 0.35, 0.06, 0.35, 0.5), P(GE.cylLo, '#9aa3b5', 0.6, 4.3, 0, 0.03, 0.4, 0.03)];
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4, ox = Math.cos(a), oz = Math.sin(a);
    parts.push(P(GE.cylLo, '#9aa3b5', ox * 1.9, 1.05, oz * 1.9, 0.07, 2.2, 0.07, -oz * 0.65, 0, ox * 0.65), P(GE.cyl, '#9aa3b5', ox * 2.4, 0.05, oz * 2.4, 0.35, 0.1, 0.35)); }
  const cols = [cCyl(0.8, 1.6, 0, 2.2), cBox(1.1, 0.65, 1.0, 0, 3.6)];
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; cols.push(cBox(0.3, 0.1, 0.3, Math.cos(a) * 2.4, 0.1, Math.sin(a) * 2.4)); }
  return add(build(parts), x, z, { v: 18, ry: R(0, 6.28), cols });
}
function dome(x, z, r = R(3, 4.2)) {   // Wohnkuppel mit Schleuse
  const parts = [P(tube(r + 0.15, r + 0.25, 0.5, 32), '#9aa3b5', 0, 0.25, 0), P(GE.hemi, pick(['#e8ecf5', '#f4f6fa', '#dde3ee']), 0, 0.5, 0, r, r * 0.9, r),
    P(GE.cylHi, '#c8d0dc', 0, 0.9, r + 0.4, 0.8, 1.6, 0.8, Math.PI / 2), P(GE.rbox, '#3a4152', 0, 0.9, r + 1.2, 0.9, 1.1, 0.06),
    P(GE.cylLo, '#3a4152', 0, 0.5 + r * 0.9 + 0.4, 0, 0.04, 0.8, 0.04), P(GE.sph, '#ff4136', 0, 0.5 + r * 0.9 + 0.85, 0, 0.1)];
  for (let i = 0; i < 6; i++) { const a = (i + 0.5) / 6 * 6.283; parts.push(P(GE.rbox, '#7fe3ff', Math.cos(a) * r * 0.86, 0.5 + r * 0.47, Math.sin(a) * r * 0.86, 0.6, 0.45, 0.1, 0, Math.PI / 2 - a, 0)); }
  parts.push(P(GE.cyl, pick(ACC), 0, 0.5 + r * 0.25, 0, r * 0.97, 0.2, r * 0.97));
  const pts = [];
  for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283; pts.push(Math.cos(a) * (r + 0.25), 0, Math.sin(a) * (r + 0.25), Math.cos(a) * r * 0.707, 0.5 + r * 0.9 * 0.707, Math.sin(a) * r * 0.707); }
  pts.push(0, 0.5 + r * 0.9, 0);
  return add(build(parts), x, z, { v: Math.round(r * r * 2), fade: true, cols: [cHull(pts), cCyl(0.8, 0.8, 0, 0.9, r + 0.4, Math.PI / 2)] });
}
function bigDish(x, z) {   // große Parabolantenne
  const n = [0, Math.cos(0.6), Math.sin(0.6)], c = [0, 6.2, 0];
  return add(build([P(GE.cylHi, '#9aa3b5', 0, 0.3, 0, 2.2, 0.6, 2.2), P(GE.cyl, '#e3e7ee', 0, 2.6, 0, 1.0, 4.2, 1.0), P(GE.rbox, '#c8d0dc', 0, 5.0, 0, 2.6, 1.2, 1.6),
    P(GE.frust, '#e8ecf5', c[0], c[1], c[2], 4.2, 0.9, 4.2, Math.PI + 0.6), P(GE.cylLo, '#9aa3b5', 0, c[1] + n[1] * 1.6, c[2] + n[2] * 1.6, 0.08, 3.0, 0.08, 0.6),
    P(GE.sph, '#ff4136', 0, c[1] + n[1] * 3.2, c[2] + n[2] * 3.2, 0.3)]), x, z,
    { v: 25, ry: R(-0.8, 0.8), cols: [cCyl(0.3, 2.2), cCyl(2.1, 1.0, 0, 2.6), cCyl(0.5, 4.2, 0, 6.2, 0, 0.6)] });
}
function commTower(x, z) {   // Funkturm: hoch, kippt spektakulär
  const parts = [P(GE.rbox, '#9aa3b5', 0, 0.3, 0, 2.2, 0.6, 2.2), P(tube(0.25, 0.8, 13, 8), '#e3e7ee', 0, 7.1, 0)];
  for (const y of [5, 8, 11]) parts.push(P(GE.cyl, '#ff5a4e', 0, y, 0, 0.62 - y * 0.03, 0.4, 0.62 - y * 0.03));
  for (const [y, a] of [[9, 0], [10.5, 2.1], [12, 4.2]]) parts.push(P(GE.cyl, '#e8ecf5', Math.cos(a) * 0.75, y, Math.sin(a) * 0.75, 0.6, 0.15, 0.6, 0, -a, -Math.PI / 2));
  parts.push(P(GE.cylLo, '#3a4152', 0, 14.4, 0, 0.04, 1.6, 0.04), P(GE.sph, '#ff4136', 0, 15.2, 0, 0.16));
  return add(build(parts), x, z, { v: 15, cols: [cBox(1.1, 0.3, 1.1, 0, 0.3), cCyl(6.5, 0.6, 0, 7.1)] });
}
function greenhouse(x, z, ry = 0) {   // Gewächshaus-Tunnel
  const parts = [P(GE.cylHi, '#bff0e0', 0, 0, 0, 2.4, 8, 2.4, 0, 0, Math.PI / 2), P(GE.box, '#3fae4b', 0, 0.02, 0, 7.6, 0.1, 4.4)];
  for (let i = -3; i <= 3; i++) parts.push(P(RIB, '#e3e7ee', i * 1.3, 0, 0, 2.42, 2.42, 2.42, 0, Math.PI / 2, 0));
  for (const sx of [-1, 1]) parts.push(P(GE.cyl, '#e3e7ee', sx * 4.0, 0, 0, 2.42, 0.1, 2.42, 0, 0, Math.PI / 2), P(GE.rbox, '#3a4152', sx * 4.03, 0.8, 0, 0.06, 1.4, 1.0));
  return add(build(parts), x, z, { v: 16, ry, fade: true, cols: [cBox(4.0, 1.1, 2.0, 0, 1.1)] });
}
function statue(x, z) {   // Denkmal: großer Astronaut auf Sockel
  const k = 3, parts = [P(GE.rbox, '#9aa3b5', 0, 0.6, 0, 2.6, 1.2, 2.6), P(GE.rbox, '#ffd23f', 0, 1.25, 1.31, 1.6, 0.3, 0.04)];
  const t = (geo, c, px, py, pz, sx, sy, sz) => P(geo, c, px * k, 1.2 + py * k, pz * k, sx * k, sy * k, sz * k);
  parts.push(t(GE.legs, '#e3e7ee', 0, 0.3, 0, 1.15, 1, 1.15), t(GE.torso, '#ffffff', 0, 0.82, 0, 1.15, 1, 1.15), t(GE.rbox, '#c8d0dc', 0, 0.85, -0.3, 0.42, 0.55, 0.22),
    t(GE.sph, '#ffffff', 0, 1.35, 0, 0.27, 0.27, 0.27), t(GE.sph, '#ffb000', 0, 1.36, 0.1, 0.2, 0.16, 0.2), P(GE.cylLo, '#e3e7ee', 0.75, 4.2, 0.2, 0.06, 5.6, 0.06),
    P(GE.box, '#ffffff', 1.5, 6.6, 0.2, 1.5, 0.95, 0.04), P(GE.cyl, INK, 1.5, 6.6, 0.23, 0.3, 0.04, 0.3, Math.PI / 2));
  return add(build(parts), x, z, { v: 22, cols: [cBox(1.3, 0.6, 1.3, 0, 0.6), cCyl(2.1, 0.85, 0, 3.3)] });
}
function module(x, z, w, d, floors, extra = {}) {   // Wohnmodul aus Etagen
  return building(x, z, w, d, floors, { roof: 'flat', wall: pick(['#e8ecf5', '#f4f6fa', '#dde3ee']), slab: '#9aa3b5', band: pick(ACC), doorCol: '#3a4152', awning: false, ...extra });
}

// ---------- Endboss: Rakete auf der Startrampe ----------
function rocket(x, z) {
  const g = new THREE.Group(), mats = [], parts = [];
  const pad = P(tube(9.2, 9.3, 1.2, 40), '#9aa3b5', 0, 0.6, 0);
  { const pos = pad.attributes.position, col = pad.attributes.color, Y = new THREE.Color('#ffd23f'), K = new THREE.Color('#3a4152');   // Warnstreifen am Rand
    for (let i = 0; i < pos.count; i += 3) { const cx = pos.getX(i) + pos.getX(i + 1) + pos.getX(i + 2), cz = pos.getZ(i) + pos.getZ(i + 1) + pos.getZ(i + 2), cy = pos.getY(i) + pos.getY(i + 1) + pos.getY(i + 2);
      if (cy > 3.5) continue; const k = Math.floor(((Math.atan2(cz, cx) / 6.2832 + 1) % 1) * 40) % 2 ? Y : K; for (let j = 0; j < 3; j++) col.setXYZ(i + j, k.r, k.g, k.b); } }
  parts.push(pad, P(GE.cyl, '#3a4152', 0, 1.22, 0, 3.4, 0.05, 3.4));
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; parts.push(P(GE.rbox, '#ff5a4e', Math.cos(a) * 3.2, 2.2, Math.sin(a) * 3.2, 0.8, 2.0, 0.8)); }   // Halteklammern
  parts.push(P(GE.cone, '#3a4152', 0, 2.6, 0, 1.3, 1.6, 1.3), P(GE.cone, '#3a4152', 1.1, 2.6, 0, 0.8, 1.2, 0.8), P(GE.cone, '#3a4152', -1.1, 2.6, 0, 0.8, 1.2, 0.8));   // Triebwerke
  parts.push(P(tube(2.6, 2.8, 2.4, 32), '#6d7686', 0, 4.4, 0), P(tube(2.6, 2.6, 15, 32), '#ffffff', 0, 13.1, 0), P(tube(2.62, 2.62, 1.2, 32), INK, 0, 9.0, 0),
    P(tube(2.62, 2.62, 0.8, 32), '#ff5a4e', 0, 17.5, 0), P(tube(2.2, 2.6, 1.6, 32), '#e3e7ee', 0, 21.4, 0), P(tube(2.2, 2.2, 7, 32), '#ffffff', 0, 25.7, 0),
    P(GE.coneHi, '#ff5a4e', 0, 31.7, 0, 2.2, 5.0, 2.2), P(GE.cylLo, '#e3e7ee', 0, 35.2, 0, 0.12, 2.0, 0.12), P(GE.cone, '#ff5a4e', 0, 36.6, 0, 0.35, 0.8, 0.35));
  for (const y of [24, 27]) parts.push(P(GE.cyl, '#3a4152', 0, y, 2.18, 0.45, 0.06, 0.45, Math.PI / 2), P(GE.cyl, '#7fe3ff', 0, y, 2.21, 0.32, 0.04, 0.32, Math.PI / 2));   // Bullaugen
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; parts.push(P(GE.fin, '#ff5a4e', Math.cos(a) * 3.3, 3.6, Math.sin(a) * 3.3, 2.6, 5.0, 1.6, 0, -a, 0)); }   // Flossen
  const T = 6.4;   // Startturm daneben
  for (const [px, pz] of [[T - 1, -1], [T + 1, -1], [T - 1, 1], [T + 1, 1]]) parts.push(P(GE.cyl, '#ff8a3d', px, 1.2 + 15.5, pz, 0.14, 31, 0.14));
  for (let y = 3; y < 32; y += 2.5) parts.push(P(GE.box, '#ff8a3d', T, 1.2 + y, -1, 2, 0.12, 0.12), P(GE.box, '#ff8a3d', T, 1.2 + y, 1, 2, 0.12, 0.12),
    P(GE.box, '#ff8a3d', T - 1, 1.2 + y, 0, 0.12, 0.12, 2), P(GE.box, '#ff8a3d', T + 1, 1.2 + y, 0, 0.12, 0.12, 2));
  parts.push(P(GE.rbox, '#e3e7ee', (T + 2.4) / 2 - 0.4, 28, 0, T - 2.4, 0.5, 0.9), P(GE.rbox, '#e3e7ee', T, 32.4, 0, 2.6, 0.3, 2.6));
  const cols = [cCyl(0.6, 9.3), cCyl(13, 2.7, 0, 3.2 + 13), cCone(2.5, 2.2, 0, 31.7), cBox(1.2, 15.6, 1.2, T, 16.8)];
  const em = MAT.clone(); mats.push(em); g.add(build(parts, em));
  const dish = build([P(GE.frust, '#e8ecf5', 0, 0.4, 0.3, 0.9, 0.2, 0.9, Math.PI + 0.6), P(GE.cylLo, '#9aa3b5', 0, 0.15, 0, 0.06, 0.4, 0.06)], em);   // dreht sich
  dish.position.set(T, 32.6, 0); g.add(dish);
  const lm = new THREE.MeshBasicMaterial({ color: 0xff3b30, toneMapped: false }); lm.userData = NO_OUTLINE;
  const light = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 8), lm); light.position.set(0, 37.2, 0); g.add(light);
  const o = addBoss(g, x, z, cols, mats, 38, 9.3);
  let t = 0;
  o.anim = dt => { t += dt; dish.rotation.y += dt * 1.2; light.visible = (t % 1.2) < 0.6; };
  return o;
}

// ---------- Welt bauen ----------
export function create() {
  setSeed(55);
  flat(600, 600, 0, 0, 0, MOON, 12);
  roadNet({ walk: null, road: TRACK, roadScale: 3, marks: true, markColor: 0x7fe3ff, curbs: true, curbColor: 0x9aa3b5 });
  edgeRing(['#8a8fa3', '#a3a8bb', '#73788c'], [1.4, 2.0], GE.dodec);
  for (let i = 0; i < 40; i++) {   // flache Krater auf dem Boden (nur Deko)
    const x = R(-MAP + 5, MAP - 5), z = R(-MAP + 5, MAP - 5), r = R(1.5, 4);
    if (ROADS.some(rc => Math.abs(x - rc) < 3.5 + r || Math.abs(z - rc) < 3.5 + r)) continue;
    disc(r, x, z, 0.006 + i * 0.0001, null, 1, 0x9a9db0); disc(r * 0.8, x, z, 0.008 + i * 0.0001, null, 1, 0x8a8da0);
  }
  const PLAZAS = ['15,-15', '-45,45', '75,-45', '-75,-75', '45,75'];
  const BOSS = '45,15';
  const KINDS = [...Array(6).fill('habitat'), ...Array(4).fill('tower'), ...Array(4).fill('domes'), ...Array(3).fill('solar'), ...Array(3).fill('crater'),
    ...Array(3).fill('landing'), ...Array(2).fill('comm'), ...Array(3).fill('garage'), ...Array(2).fill('green')];   // 30 Blöcke
  for (let i = KINDS.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [KINDS[i], KINDS[j]] = [KINDS[j], KINDS[i]]; }
  let ki = 0;
  for (const bx of BLOCKS) for (const bz of BLOCKS) {
    const cd = Math.max(Math.abs(bx), Math.abs(bz)), key = bx + ',' + bz;
    if (key === BOSS) { rocket(bx, bz); for (const [ox, oz] of [[-11, -11], [11, -11], [-11, 11], [11, 11]]) moonLamp(bx + ox, bz + oz); continue; }
    const kind = PLAZAS.includes(key) ? 'plaza' : KINDS[ki++];
    if (kind === 'habitat') {   // Wohnmodule mit 1 bis 3 Etagen
      for (const ox of [-5, 5]) for (const oz of [-5, 5]) {
        if (rnd() < 0.15) { dome(bx + ox, bz + oz - 1, R(2.6, 3.2)); continue; }
        const k = rnd() + (cd < 50 ? 0.2 : 0), fl = k < 0.38 ? 1 : k < 0.82 ? 2 : 3, sz = fl === 1 ? [4.5, 5.5] : fl === 2 ? [5.5, 7] : [6.5, 8];
        module(bx + ox, bz + oz, R(sz[0], sz[1]), R(sz[0], sz[1] - 0.3), fl);
      }
      for (let i = 0; i < 4; i++) { const p = freeSpot(bx, bz, 9.5, 0.6); if (p) (rnd() < 0.5 ? crate : rock)(...p); }
      for (let i = 0; i < 2; i++) { const p = freeSpot(bx, bz, 9.5, 0.6); if (p) (rnd() < 0.5 ? solar : smallDish)(...p); }
      for (let i = 0; i < 2; i++) { const p = freeSpot(bx, bz, 9.5, 1.0); if (p) (rnd() < 0.5 ? cargoPod : bigCrystal)(...p); }
    } else if (kind === 'tower') {   // Wohnturm mit 5 bis 9 Etagen
      module(bx, bz - 1, R(12, 14), R(10.5, 12.5), Math.round(R(5, 7)) + (cd <= 15 ? 2 : 0), { balcony: pick(['#4f8bff', '#ff8a3d', null]) });
      solar(bx - 8, bz + 9, 0); solar(bx + 8, bz + 9, 0); charger(bx - 3.5, bz + 9.2); charger(bx + 3.5, bz + 9.2);
    } else if (kind === 'domes') {   // Kuppelsiedlung
      dome(bx - 4.5, bz - 4.5, R(3.4, 4.2)); dome(bx + 4.8, bz - 3.5, R(3, 3.8)); dome(bx - 1, bz + 5, R(3, 3.8));
      for (let i = 0; i < 3; i++) { const p = freeSpot(bx, bz, 9.5, 0.6); if (p) (rnd() < 0.5 ? crate : fuelTank)(...p); }
      for (let i = 0; i < 2; i++) { const p = freeSpot(bx, bz, 9.5, 0.4); if (p) flag(...p); }
      { const p = freeSpot(bx, bz, 9, 0.6); if (p) smallDish(...p); }
    } else if (kind === 'solar') {   // Solarfeld
      for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) solar(bx - 7.5 + i * 5, bz - 6 + j * 6, 0);
      for (let i = 0; i < 3; i++) { const p = freeSpot(bx, bz, 9.5, 0.6); if (p) (rnd() < 0.5 ? crate : charger)(...p); }
    } else if (kind === 'crater') {   // großer Krater mit Kristallen
      disc(9, bx, bz, 0.012, null, 1, 0x8a8da0); disc(7, bx, bz, 0.014, null, 1, 0x767a8e);
      for (let i = 0; i < 8; i++) { const p = freeSpot(bx, bz, 7, 0.7); if (p) crystals(...p); }
      for (let i = 0; i < 4; i++) { const p = freeSpot(bx, bz, 7, 1.0); if (p) bigCrystal(...p); }
      for (let i = 0; i < 8; i++) { const p = freeSpot(bx, bz, 9.5, 0.9); if (p) rock(...p); }
      { const p = freeSpot(bx, bz, 9, 1.8); if (p) rover(...p, R(0, 6.28)); }
    } else if (kind === 'landing') {   // Landeplatz mit Landefähre
      disc(7.5, bx, bz, 0.012, PADTEX, 4); disc(2.5, bx, bz, 0.014, null, 1, 0xffd23f); disc(1.8, bx, bz, 0.016, null, 1, 0x9aa3b5);
      lander(bx, bz);
      for (const [ox, oz] of [[-8.5, -8.5], [8.5, -8.5], [-8.5, 8.5], [8.5, 8.5]]) moonLamp(bx + ox, bz + oz);
      fuelTank(bx - 8, bz, Math.PI / 2); fuelTank(bx + 8, bz, Math.PI / 2); cargoPod(bx - 5, bz + 8.5); cargoPod(bx + 5, bz + 8.5);
      for (let i = 0; i < 3; i++) { const p = freeSpot(bx, bz, 9.5, 0.6); if (p) crate(...p); }
    } else if (kind === 'comm') {   // Funkstation
      bigDish(bx - 3.5, bz - 3); commTower(bx + 6, bz + 5);
      for (let i = 0; i < 3; i++) { const p = freeSpot(bx, bz, 9.5, 0.7); if (p) smallDish(...p); }
      for (let i = 0; i < 2; i++) { const p = freeSpot(bx, bz, 9.5, 0.4); if (p) mast(...p); }
      module(bx - 5, bz + 6.5, 5, 4.5, 1);
    } else if (kind === 'garage') {   // Rover-Depot
      flat(22, 22, bx, bz, 0.012, PADTEX, 4);
      for (const oz of [-5, 5]) for (let i = 0; i < 4; i++) if (rnd() < 0.85) rover(bx - 6 + i * 4, bz + oz, Math.PI / 2 * (oz > 0 ? 1 : -1));
      for (const ox of [-8, 0, 8]) charger(bx + ox, bz, Math.PI / 2);
      moonLamp(bx - 10, bz - 10); moonLamp(bx + 10, bz + 10);
    } else if (kind === 'green') {   // Gewächshäuser
      greenhouse(bx, bz - 5); greenhouse(bx, bz + 4);
      for (let i = 0; i < 3; i++) { const p = freeSpot(bx, bz, 9.5, 0.6); if (p) crate(...p); }
      for (let i = 0; i < 2; i++) { const p = freeSpot(bx, bz, 9.5, 0.6); if (p) solar(...p, R(0, 6.28)); }
    } else {   // Basis-Zentrum mit Denkmal
      flat(22, 22, bx, bz, 0.012, PADTEX, 4);
      statue(bx, bz);
      for (const [lx, lz] of [[-8, -8], [8, -8], [-8, 8], [8, 8]]) moonLamp(bx + lx, bz + lz);
      for (const [fx, fz] of [[-4.5, 4.5], [4.5, 4.5], [-4.5, -4.5], [4.5, -4.5]]) flag(bx + fx, bz + fz);
      module(bx + 7, bz - 7.5, 4, 3.2, 1);
      for (let i = 0; i < 3; i++) { const p = freeSpot(bx, bz, 9, 0.5); if (p) small(...p); }
    }
  }
  for (const rc of ROADS) {   // Fahrspuren: Leuchten, Kisten, Felsen, abgestellte Rover
    let step = 0;
    for (let t = -MAP + 3; t < MAP - 2; t += 10, step++) {
      if (ROADS.some(r => Math.abs(t - r) < 7)) continue;
      const s = step % 2 ? 1 : -1;
      moonLamp(t, rc + s * 4.4); moonLamp(rc + s * 4.4, t);
      if (rnd() < 0.35) crate(t + 2, rc - s * 4.4); if (rnd() < 0.35) crate(rc - s * 4.4, t + 2);
      if (rnd() < 0.3) small(t + 4, rc + s * 4.2); if (rnd() < 0.3) small(rc - s * 4.2, t - 4);
      if (rnd() < 0.55) bigCrystal(t + 6.5, rc - s * 4.8); else if (rnd() < 0.4) rock(t + 6.5, rc - s * 4.8);
      if (rnd() < 0.45) bigCrystal(rc + s * 4.8, t - 6.5); if (rnd() < 0.4) (rnd() < 0.5 ? solar : smallDish)(rc - s * 4.8, t + 6.5);
    }
    for (let t = -MAP + 6; t < MAP - 4; t += R(8, 13)) {
      if (ROADS.some(r => Math.abs(t - r) < 9)) continue;
      if (rnd() < 0.55) rover(t, rc + pick([-1, 1]) * 2.4, 0);
      if (rnd() < 0.55) rover(rc + pick([-1, 1]) * 2.4, t, Math.PI / 2);
    }
  }
  for (let i = 0; i < 34; i++) {   // fahrende Rover
    const ax = rnd() < 0.5 ? 'x' : 'z', rc = pick(ROADS), dir = pick([-1, 1]), t = R(-MAP + 8, MAP - 8);
    const drive = { ax, rc, dir, sp: R(3, 5), curve: null, pending: null, decided: null };
    if (ax === 'x') rover(t, laneOf('x', rc, dir), dir > 0 ? 0 : Math.PI, drive);
    else rover(laneOf('z', rc, dir), t, dir > 0 ? -Math.PI / 2 : Math.PI / 2, drive);
  }
  scatter(260, astronaut, { r: 0.3 });
  scatter(50, alien, { r: 0.3 });
  scatter(30, robot, { r: 0.3 });
  scatter(170, small, { r: 0.4 });
  scatter(40, rock, { r: 0.9 });
  scatter(30, bigCrystal, { r: 1.0 });
  scatter(15, cargoPod, { r: 1.0 });
}
