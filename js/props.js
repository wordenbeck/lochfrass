// Lochfrass! – Mehr Details: Garten, Spielplatz, Café, Straßenmöbel, Fahrzeuge, Hunde und Boden-Schmuck
// Alles im eigenen Comic-Look. Kleine Dinge aus einfachen Formen (wenige Dreiecke), damit es auf dem iPad flüssig bleibt.
import { THREE, mergeGeometries, INK, R, pick, rnd, P, GE, build, add, cBox, cCyl, cBall, cCone, C, shade, toon, NO_OUTLINE, scene, walkState, wheels, lpick } from './kit.js';

const FLOWERS = ['#ff7ac6', '#ffd23f', '#ff5a4e', '#ffffff', '#9b6bff'];
const BRIGHT = ['#ff5a4e', '#4f8bff', '#ffd23f', '#2fd3b9', '#ff7ac6', '#ff8a3d'];

// ================= Boden-Schmuck =================
// Wege, Einfahrten, Gullydeckel, Pfeile, Blumenbeete: kein Futter. Alles wird am Ende zu EINEM Mesh verschmolzen
// (kostet fast nichts) und wird über dem Loch nicht gezeichnet, genau wie der Boden.
const decoParts = [];
export const decoFlat = (hex, x, z, w, d, ry = 0, y = 0.035) => decoParts.push(P(GE.box, hex, x, y, z, w, 0.03, d, 0, ry, 0));
export const decoDisc = (hex, x, z, r, y = 0.04) => decoParts.push(P(GE.cylLo, hex, x, y, z, r, 0.03, r));
export function flowerBed(x, z, w, d, ry = 0) {   // Beet: Erde mit bunten Tupfen
  decoFlat('#9a6236', x, z, w, d, ry, 0.04);
  const c = Math.cos(ry), s = Math.sin(ry), n = Math.round(w * d * 2.2);
  for (let i = 0; i < n; i++) {
    const lx = R(-w / 2 + 0.2, w / 2 - 0.2), lz = R(-d / 2 + 0.2, d / 2 - 0.2), px = x + lx * c + lz * s, pz = z - lx * s + lz * c;
    decoParts.push(P(GE.sphLo, rnd() < 0.3 ? pick(C.leaf) : pick(FLOWERS), px, 0.1, pz, 0.16, 0.12, 0.16));
  }
}
export function arrow(x, z, ry) {   // Fahrbahn-Pfeil (zeigt in lokale +x-Richtung)
  const c = Math.cos(ry), s = Math.sin(ry), at = (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c];
  decoFlat('#ffffff', ...at(-0.25, 0), 1.9, 0.22, ry);
  decoFlat('#ffffff', ...at(0.5, 0.24), 0.8, 0.22, ry + 0.6);   // Spitze: beide Striche laufen vorne zusammen
  decoFlat('#ffffff', ...at(0.5, -0.24), 0.8, 0.22, ry - 0.6);
}
export function manhole(x, z) { decoDisc('#3f4555', x, z, 0.55); decoDisc('#6b7385', x, z, 0.44, 0.045); }
export function flushDeco() {
  if (!decoParts.length) return;
  const m = toon({ vertexColors: true, stencilWrite: true, stencilRef: 1, stencilFunc: THREE.NotEqualStencilFunc,
    stencilFail: THREE.KeepStencilOp, stencilZFail: THREE.KeepStencilOp, stencilZPass: THREE.KeepStencilOp });
  m.userData = NO_OUTLINE;
  const mesh = new THREE.Mesh(mergeGeometries(decoParts), m); mesh.receiveShadow = true; scene.add(mesh);
  decoParts.length = 0;
}

// ================= Garten =================
export function pool(x, z) {   // Planschbecken
  const r = R(1.15, 1.5), c = pick(['#4f8bff', '#ff7ac6', '#2fd3b9', '#ffd23f']);
  return add(build([P(GE.cyl, c, 0, 0.25, 0, r, 0.5, r), P(GE.cyl, '#ffffff', 0, 0.3, 0, r * 1.02, 0.1, r * 1.02),
    P(GE.cyl, '#5cc8f5', 0, 0.44, 0, r * 0.84, 0.08, r * 0.84), P(GE.box, '#ffffff', r * 0.2, 0.5, -r * 0.25, 0.5, 0.04, 0.08, 0, 0.7, 0)]),
    x, z, { v: 5, cols: [cCyl(0.25, r)] });
}
export function trampoline(x, z) {
  const r = R(1.0, 1.2), parts = [P(GE.cyl, pick(['#4f8bff', '#2fd3b9', '#ff8a3d']), 0, 0.64, 0, r, 0.12, r), P(GE.cyl, '#2a2d36', 0, 0.68, 0, r * 0.8, 0.1, r * 0.8)];
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.7; parts.push(P(GE.cylLo, '#3a4152', Math.cos(a) * r * 0.85, 0.32, Math.sin(a) * r * 0.85, 0.05, 0.64, 0.05)); }
  return add(build(parts), x, z, { v: 4, cols: [cCyl(0.36, r, 0, 0.36)] });
}
export function parasol(x, z, col = pick(BRIGHT)) {   // Tisch, zwei Stühle, Sonnenschirm
  const parts = [P(GE.cylLo, '#ffffff', 0, 0.72, 0, 0.5, 0.06, 0.5), P(GE.cylLo, '#3a4152', 0, 0.36, 0, 0.05, 0.72, 0.05),
    P(GE.cylLo, '#e9eef5', 0, 1.35, 0, 0.04, 1.8, 0.04), P(GE.cone, col, 0, 2.2, 0, 1.05, 0.42, 1.05), P(GE.sphLo, col, 0, 2.45, 0, 0.07)];
  for (const s of [-1, 1]) parts.push(P(GE.box, '#ffffff', s * 0.85, 0.45, 0, 0.42, 0.06, 0.42), P(GE.box, '#ffffff', s * 1.04, 0.72, 0, 0.06, 0.5, 0.42),
    P(GE.box, '#9aa3b5', s * 0.85, 0.22, 0, 0.05, 0.44, 0.05));
  return add(build(parts), x, z, { v: 4, ry: R(0, 6.28), cols: [cBox(1.08, 0.38, 0.25, 0, 0.38), cCyl(0.6, 0.05, 0, 1.35), cCone(0.21, 1.05, 0, 2.2)] });
}
export function swing(x, z, ry = R(0, 6.28)) {   // Schaukelgestell
  const c = pick(['#ff8a3d', '#4f8bff', '#3fae6b']), parts = [P(GE.box, c, 0, 2.05, 0, 2.7, 0.12, 0.12)];
  for (const sx of [-1.25, 1.25]) for (const sz of [-1, 1]) parts.push(P(GE.box, c, sx, 1.02, sz * 0.42, 0.11, 2.2, 0.11, -sz * 0.39, 0, 0));
  for (const sx of [-0.55, 0.55]) {
    parts.push(P(GE.box, '#3a4152', sx - 0.18, 1.35, 0, 0.03, 1.35, 0.03), P(GE.box, '#3a4152', sx + 0.18, 1.35, 0, 0.03, 1.35, 0.03),
      P(GE.box, pick(BRIGHT), sx, 0.66, 0, 0.48, 0.07, 0.24));
  }
  return add(build(parts), x, z, { v: 4, ry, cols: [cBox(1.35, 1.05, 0.55, 0, 1.05)] });
}
export function sandbox(x, z) {
  const s = R(1.2, 1.5), parts = [P(GE.box, '#f2d48a', 0, 0.12, 0, s * 2 - 0.3, 0.22, s * 2 - 0.3)];
  for (const [bx, bz, w, d] of [[0, s - 0.1, 2 * s, 0.2], [0, -s + 0.1, 2 * s, 0.2], [s - 0.1, 0, 0.2, 2 * s], [-s + 0.1, 0, 0.2, 2 * s]])
    parts.push(P(GE.box, '#d98c45', bx, 0.18, bz, w, 0.36, d));
  parts.push(P(GE.cylLo, pick(BRIGHT), s * 0.35, 0.36, -s * 0.25, 0.16, 0.26, 0.16), P(GE.cone, pick(BRIGHT), -s * 0.3, 0.34, s * 0.3, 0.2, 0.26, 0.2));
  return add(build(parts), x, z, { v: 3, ry: R(0, 1.5), cols: [cBox(s, 0.18, s, 0, 0.18)] });
}
export function grill(x, z) {
  return add(build([P(GE.sphLo, '#2a2d36', 0, 0.82, 0, 0.36, 0.3, 0.36), P(GE.cylLo, '#9aa3b5', 0, 0.42, 0, 0.04, 0.8, 0.04),
    P(GE.cylLo, '#9aa3b5', 0, 0.06, 0, 0.3, 0.04, 0.3), P(GE.sphLo, '#ff8a3d', 0, 1.14, 0, 0.07)]), x, z, { v: 1, cols: [cCyl(0.56, 0.36, 0, 0.56)] });
}
export function gnome(x, z) {   // Gartenzwerg
  return add(build([P(GE.cylLo, pick(['#4f8bff', '#3fae6b']), 0, 0.18, 0, 0.15, 0.36, 0.15), P(GE.sphLo, '#ffd7b0', 0, 0.46, 0, 0.12),
    P(GE.sphLo, '#ffffff', 0, 0.38, 0.07, 0.1, 0.09, 0.06), P(GE.cone, '#ff4136', 0, 0.68, 0, 0.13, 0.32, 0.13)]),
    x, z, { v: 1, ry: R(0, 6.28), cols: [cCyl(0.42, 0.15, 0, 0.42)] });
}
export function doghouse(x, z, ry = R(0, 6.28)) {
  const c = pick(['#d98c45', '#ff5a4e', '#4f8bff', '#3fae6b']);
  return add(build([P(GE.box, c, 0, 0.45, 0, 1.0, 0.9, 1.2), P(GE.prism, '#8a5634', 0, 0.88, 0, 1.25, 0.55, 1.4),
    P(GE.box, INK, 0, 0.34, 0.61, 0.42, 0.52, 0.02), P(GE.box, '#ffffff', 0, 0.75, 0.62, 0.5, 0.12, 0.02)]),
    x, z, { v: 3, ry, cols: [cBox(0.5, 0.45, 0.6, 0, 0.45), cBox(0.62, 0.27, 0.7, 0, 1.15)] });
}
export function bike(x, z, ry = R(0, 6.28)) {
  const c = pick(BRIGHT), parts = [];
  for (const wx of [-0.55, 0.55]) parts.push(P(GE.cylLo, '#2a2d36', wx, 0.34, 0, 0.34, 0.06, 0.34, Math.PI / 2), P(GE.cylLo, '#d9dde5', wx, 0.34, 0, 0.12, 0.08, 0.12, Math.PI / 2));
  parts.push(P(GE.box, c, 0, 0.58, 0, 0.95, 0.07, 0.07), P(GE.box, c, -0.1, 0.45, 0, 0.07, 0.42, 0.07, 0, 0, 0.35),
    P(GE.box, '#2a2d36', -0.2, 0.78, 0, 0.28, 0.07, 0.14), P(GE.box, '#3a4152', 0.5, 0.82, 0, 0.06, 0.06, 0.5), P(GE.box, c, 0.45, 0.6, 0, 0.06, 0.5, 0.06, 0, 0, 0.3));
  return add(build(parts), x, z, { v: 2, ry, cols: [cBox(0.9, 0.42, 0.14, 0, 0.42)] });
}
// Garten-Ausstattung für ein Haus: 1 bis 2 Dinge in freie Ecken des Grundstücks (fs = freier Platz)
export function garden(fs) {
  const n = rnd() < 0.55 ? 2 : 1;
  for (let i = 0; i < n; i++) {
    const k = rnd();
    const [fn, r] = k < 0.16 ? [pool, 1.6] : k < 0.3 ? [trampoline, 1.3] : k < 0.46 ? [parasol, 1.2] : k < 0.56 ? [swing, 1.5]
      : k < 0.64 ? [sandbox, 1.6] : k < 0.74 ? [grill, 0.45] : k < 0.84 ? [doghouse, 0.8] : k < 0.92 ? [bike, 0.6] : [gnome, 0.3];
    const p = fs(r); if (p) fn(...p);
    if (fn === gnome || fn === grill) { const q = fs(0.3); if (q) gnome(...q); }   // Gartenzwerge kommen zu zweit
  }
}

// ================= Spielplatz, Café, Markt =================
export function slide(x, z, ry = R(0, 6.28)) {   // Rutsche
  const c = pick(['#ff5a4e', '#4f8bff', '#ffd23f', '#2fd3b9']);
  const parts = [P(GE.box, '#d98c45', -0.9, 1.5, 0, 0.9, 0.12, 0.9), P(GE.box, c, 0.55, 0.85, 0, 2.4, 0.08, 0.7, 0, 0, -0.6),
    P(GE.box, shade(c, 0.8), 0.55, 0.98, 0.36, 2.4, 0.22, 0.05, 0, 0, -0.6), P(GE.box, shade(c, 0.8), 0.55, 0.98, -0.36, 2.4, 0.22, 0.05, 0, 0, -0.6)];
  for (const sx of [-1.3, -0.5]) for (const sz of [-0.4, 0.4]) parts.push(P(GE.box, '#3a4152', sx, 0.75, sz, 0.08, 1.5, 0.08));
  for (let i = 0; i < 4; i++) parts.push(P(GE.box, '#3a4152', -1.42, 0.3 + i * 0.36, 0, 0.06, 0.05, 0.75));   // Leitersprossen
  parts.push(P(GE.cone, c, -0.9, 2.05, 0, 0.75, 0.55, 0.75));   // Dach
  return add(build(parts), x, z, { v: 5, ry, cols: [cBox(1.4, 0.75, 0.45, 0.05, 0.75), cCone(0.3, 0.7, -0.9, 2.05)] });
}
export function seesaw(x, z, ry = R(0, 6.28)) {   // Wippe
  const c = pick(BRIGHT);
  return add(build([P(GE.box, '#3a4152', 0, 0.25, 0, 0.3, 0.5, 0.3), P(GE.box, c, 0, 0.5, 0, 3.0, 0.1, 0.32, 0, 0, 0.18),
    P(GE.box, '#3a4152', -1.2, 0.36, 0, 0.06, 0.3, 0.4, 0, 0, 0.18), P(GE.box, '#3a4152', 1.2, 0.8, 0, 0.06, 0.3, 0.4, 0, 0, 0.18)]),
    x, z, { v: 3, ry, cols: [cBox(1.5, 0.45, 0.2, 0, 0.45)] });
}
export function stall(x, z, ry = 0) {   // Marktstand mit gestreiftem Dach
  const c = pick(['#ff5a4e', '#4f8bff', '#2fd3b9', '#ff8a3d']), parts = [P(GE.box, '#d98c45', 0, 0.5, 0, 2.4, 1.0, 1.0)];
  for (let i = 0; i < 6; i++) parts.push(P(GE.sphLo, pick(['#ff4136', '#ffd23f', '#3fae6b', '#ff8a3d', '#9b6bff']), -0.95 + i * 0.38, 1.1, R(-0.2, 0.2), 0.17));
  for (const sx of [-1.15, 1.15]) for (const sz of [-0.45, 0.45]) parts.push(P(GE.box, '#e9eef5', sx, 1.2, sz, 0.08, 2.4, 0.08));
  for (let i = 0; i < 6; i++) parts.push(P(GE.box, i % 2 ? '#ffffff' : c, -1.25 + 0.25 + i * 0.5, 2.45, 0, 0.5, 0.1, 1.5, 0.22, 0, 0));
  return add(build(parts), x, z, { v: 8, ry, cols: [cBox(1.25, 1.25, 0.7, 0, 1.25)] });
}
export function duck(x, z) {   // Ente auf dem Teich
  const c = rnd() < 0.7 ? '#ffffff' : '#ffd23f';
  return add(build([P(GE.sphLo, c, 0, 0.18, 0, 0.3, 0.2, 0.2), P(GE.sphLo, c, 0.22, 0.38, 0, 0.13), P(GE.cone, '#ff8a3d', 0.37, 0.37, 0, 0.06, 0.14, 0.06, 0, 0, -Math.PI / 2),
    P(GE.cone, c, -0.32, 0.27, 0, 0.08, 0.2, 0.08, 0, 0, 1.0)]), x, z, { v: 1, ry: R(0, 6.28), cols: [cBall(0.22, 0, 0.2)] });
}

// ================= Straße =================
export function trafficLight(x, z, ry) {   // Ampel (Lichter zeigen in lokale +z-Richtung)
  return add(build([P(GE.cylLo, '#3a4152', 0, 0.07, 0, 0.18, 0.14, 0.18), P(GE.cylLo, '#3a4152', 0, 1.5, 0, 0.07, 3.0, 0.07),
    P(GE.box, '#2a2d36', 0, 3.05, 0.12, 0.38, 1.0, 0.3), P(GE.box, '#ffd23f', 0, 3.05, -0.04, 0.44, 1.06, 0.04),
    P(GE.sphLo, '#ff4136', 0, 3.36, 0.27, 0.1), P(GE.sphLo, '#ffb02e', 0, 3.05, 0.27, 0.1), P(GE.sphLo, '#3fd16b', 0, 2.74, 0.27, 0.1)]),
    x, z, { v: 3, ry, cols: [cCyl(1.5, 0.08, 0, 1.5), cBox(0.2, 0.5, 0.16, 0, 3.05, 0.1)] });
}
export function busStop(x, z, ry) {   // Wartehäuschen (offen zur lokalen +z-Seite)
  const parts = [P(GE.box, '#3a4152', 0, 2.35, 0, 3.3, 0.14, 1.4), P(GE.box, '#bfe6ff', 0, 1.25, -0.6, 3.1, 2.1, 0.06),
    P(GE.box, '#d98c45', 0, 0.52, -0.35, 2.4, 0.1, 0.45), P(GE.box, '#ffd23f', 0, 2.48, 0.62, 3.3, 0.16, 0.08)];
  for (const sx of [-1.55, 1.55]) parts.push(P(GE.box, '#3a4152', sx, 1.17, -0.6, 0.1, 2.34, 0.1), P(GE.box, '#bfe6ff', sx, 1.25, -0.1, 0.06, 2.1, 0.9));
  parts.push(P(GE.cylLo, '#9aa3b5', 2.1, 1.35, 0.4, 0.05, 2.7, 0.05), P(GE.cylLo, '#ffd23f', 2.1, 2.6, 0.4, 0.32, 0.06, 0.32, Math.PI / 2),
    P(GE.cylLo, '#3fae6b', 2.1, 2.6, 0.4, 0.22, 0.07, 0.22, Math.PI / 2));
  return add(build(parts), x, z, { v: 8, ry, cols: [cBox(1.65, 1.21, 0.72, 0, 1.21), cCyl(1.35, 0.06, 2.1, 1.35, 0.4)] });
}

// ================= Fahrzeuge =================
export function van(x, z, ry, drive) {   // Lieferwagen (vorne = +x): Fahrerkabine mit Fenstern, Aufkleber mit Logo, Hecktüren
  const c = pick(['#ffffff', '#ffd23f', '#4f8bff', '#ff8a3d', '#2fd3b9']), glass = '#9fd6f2', dark = '#2f3542', seam = shade(c, 0.8);
  const dc = c === '#ffffff' ? lpick(['#4f8bff', '#ff5a4e', '#2fd3b9', '#ff8a3d']) : '#ffffff', ic = c === '#ffffff' ? '#ffffff' : c;
  const parts = [P(GE.rbox, c, -0.55, 1.42, 0, 3.4, 1.9, 1.85), P(GE.rbox, c, 1.6, 1.0, 0, 1.3, 1.1, 1.8), P(GE.box, shade(c, 0.75), -0.55, 0.6, 0, 3.42, 0.2, 1.87),
    P(GE.box, glass, 1.165, 1.95, 0, 0.03, 0.62, 1.5), P(GE.box, '#ffffff', 1.18, 2.0, 0.4, 0.02, 0.5, 0.07, 0.5, 0, 0),
    P(GE.box, dark, 2.3, 0.55, 0, 0.16, 0.24, 1.8), P(GE.box, dark, -2.3, 0.55, 0, 0.16, 0.24, 1.86), P(GE.box, dark, 2.26, 0.98, 0, 0.04, 0.26, 0.8),
    P(GE.box, '#fff6c8', 2.25, 1.15, 0.62, 0.06, 0.16, 0.34), P(GE.box, '#fff6c8', 2.25, 1.15, -0.62, 0.06, 0.16, 0.34),
    P(GE.box, '#ff4136', -2.26, 1.0, 0.8, 0.05, 0.4, 0.14), P(GE.box, '#ff4136', -2.26, 1.0, -0.8, 0.05, 0.4, 0.14),
    P(GE.box, '#ffffff', 2.39, 0.55, 0, 0.02, 0.11, 0.4), P(GE.box, '#ffffff', -2.39, 0.6, 0, 0.02, 0.11, 0.4),
    P(GE.box, seam, -2.26, 1.45, 0, 0.02, 1.6, 0.03), P(GE.box, glass, -2.26, 1.95, 0.42, 0.02, 0.4, 0.6), P(GE.box, glass, -2.26, 1.95, -0.42, 0.02, 0.4, 0.6)];
  for (const s of [-1, 1]) parts.push(P(GE.box, glass, 0.72, 1.86, s * 0.93, 0.74, 0.56, 0.02), P(GE.box, seam, 0.3, 1.35, s * 0.93, 0.02, 1.25, 0.02),
    P(GE.box, dc, -1.0, 1.55, s * 0.93, 1.9, 0.8, 0.02), P(GE.cylLo, ic, -1.6, 1.55, s * 0.942, 0.26, 0.02, 0.26, Math.PI / 2, 0, 0),
    P(GE.box, ic, -0.75, 1.68, s * 0.942, 0.95, 0.08, 0.02), P(GE.box, ic, -0.9, 1.45, s * 0.942, 0.65, 0.08, 0.02),
    P(GE.box, dark, 1.15, 1.72, s * 1.02, 0.08, 0.26, 0.14), P(GE.box, dark, 1.15, 1.85, s * 0.97, 0.04, 0.04, 0.12));
  wheels(parts, [[1.45, 0.85], [-1.45, 0.85], [1.45, -0.85], [-1.45, -0.85]], 0.42);
  return add(build(parts), x, z, { v: 18, ry, cols: [cBox(2.27, 1.17, 0.93, 0, 1.17)], ...(drive ? { drive } : {}) });
}
export function bus(x, z, ry, drive) {   // Stadtbus (vorne = +x): einzelne Fenster, zwei Türen rechts, Zielanzeige, Klimaanlage, Spiegel
  const c = pick(['#ffd23f', '#ff5a4e', '#2fd3b9', '#4f8bff']), glass = '#9fd6f2', door = '#7fb8d8', dark = '#2f3542';
  const parts = [P(GE.rbox, c, 0, 1.5, 0, 6.6, 2.2, 1.9), P(GE.rbox, '#ffffff', 0, 2.68, 0, 6.2, 0.2, 1.7), P(GE.box, shade(c, 0.75), 0, 0.75, 0, 6.62, 0.18, 1.94),
    P(GE.box, '#e3e7ee', -0.8, 2.9, 0, 1.7, 0.3, 1.2), P(GE.box, '#9aa3b5', -0.8, 3.06, 0, 1.2, 0.02, 0.8),
    P(GE.box, glass, 3.31, 1.72, 0, 0.04, 1.05, 1.66), P(GE.box, '#ffffff', 3.33, 1.8, 0.45, 0.02, 0.7, 0.08, 0.5, 0, 0),
    P(GE.box, dark, 3.31, 2.42, 0, 0.04, 0.26, 1.4), P(GE.box, '#ffb02e', 3.335, 2.42, 0, 0.02, 0.09, 0.95),
    P(GE.box, glass, -3.31, 1.95, 0, 0.04, 0.62, 1.5), P(GE.box, '#ff4136', -3.31, 0.95, 0.78, 0.04, 0.36, 0.14), P(GE.box, '#ff4136', -3.31, 0.95, -0.78, 0.04, 0.36, 0.14),
    P(GE.box, dark, 3.36, 0.6, 0, 0.14, 0.3, 1.9), P(GE.box, dark, -3.36, 0.6, 0, 0.14, 0.3, 1.9),
    P(GE.box, '#fff6c8', 3.32, 0.98, 0.62, 0.05, 0.16, 0.3), P(GE.box, '#fff6c8', 3.32, 0.98, -0.62, 0.05, 0.16, 0.3)];
  for (const [wx, ww] of [[2.85, 0.75], [1.95, 0.82], [1.0, 0.82], [0.05, 0.82], [-0.9, 0.82], [-1.85, 0.82], [-2.8, 0.7]]) parts.push(P(GE.box, glass, wx, 1.97, -0.96, ww, 0.72, 0.02));
  for (const [wx, ww] of [[1.95, 0.82], [1.0, 0.82], [-1.05, 0.82], [-2.0, 0.82], [-2.8, 0.7]]) parts.push(P(GE.box, glass, wx, 1.97, 0.96, ww, 0.72, 0.02));
  for (const dx of [2.85, -0.1]) parts.push(P(GE.box, door, dx, 1.5, 0.96, 0.84, 1.6, 0.02), P(GE.box, dark, dx, 1.5, 0.975, 0.03, 1.6, 0.02));
  for (const s of [-1, 1]) parts.push(P(GE.box, dark, 3.42, 2.15, s * 0.9, 0.3, 0.05, 0.05), P(GE.box, dark, 3.56, 1.98, s * 1.04, 0.06, 0.32, 0.14));
  wheels(parts, [[2.25, 0.88], [-2.2, 0.88], [2.25, -0.88], [-2.2, -0.88]], 0.45);
  return add(build(parts), x, z, { v: 40, ry, cols: [cBox(3.3, 1.39, 0.97, 0, 1.39)], ...(drive ? { drive } : {}) });
}

// ================= Leben =================
export function dog(x, z) {   // Hund (vorne = +z, läuft wie die Leute herum)
  const c = pick(['#d98c45', '#f2e9d6', '#3b2a20', '#ffffff', '#c0553a']), d = shade(c, 0.75);
  const parts = [P(GE.sphLo, c, 0, 0.36, 0, 0.17, 0.17, 0.32), P(GE.sphLo, c, 0, 0.56, 0.3, 0.14), P(GE.sphLo, d, 0, 0.52, 0.43, 0.07),
    P(GE.sphLo, INK, 0, 0.55, 0.49, 0.03), P(GE.sphLo, d, 0.1, 0.65, 0.28, 0.05, 0.09, 0.04), P(GE.sphLo, d, -0.1, 0.65, 0.28, 0.05, 0.09, 0.04),
    P(GE.cylLo, c, 0, 0.5, -0.33, 0.03, 0.24, 0.03, -0.7, 0, 0)];
  for (const lx of [-0.09, 0.09]) for (const lz of [-0.18, 0.18]) parts.push(P(GE.cylLo, c, lx, 0.13, lz, 0.04, 0.26, 0.04));
  return add(build(parts), x, z, { v: 1, cols: [cBox(0.17, 0.33, 0.4, 0, 0.33)], walk: walkState([1.2, 2.2], 0.06) });
}
