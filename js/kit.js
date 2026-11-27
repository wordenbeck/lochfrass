// Lochfrass! – Baukasten: alles, was die Welten zum Bauen brauchen
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
export { THREE, mergeGeometries };

// ================= Karte =================
export const MAP = 90;                          // Karte geht von -90 bis +90
export const ROADS = [-60, -30, 0, 30, 60];     // Straßen bzw. Wege, in beide Richtungen
export const BLOCKS = [-75, -45, -15, 15, 45, 75];
export const INK = '#1d2433';                   // Konturfarbe
export const FH = 3;                            // Höhe einer Etage
export const LANE = 0.9;                        // Abstand der Fahrspur von der Straßenmitte
export const laneOf = (ax, rc, dir) => ax === 'x' ? rc + dir * LANE : rc - dir * LANE;

// ================= Zufall mit festem Startwert: jede Welt sieht immer gleich aus =================
let seed = 7, lseed = 99;
export const setSeed = s => { seed = s; lseed = s * 7919 + 13; };
export const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
export const R = (a, b) => a + rnd() * (b - a);
export const pick = a => a[Math.floor(rnd() * a.length)];
// Zweiter Zufall nur fürs Aussehen (Frisur, Fensterläden, Rucksack …). Er ändert nichts an der Anordnung der Welt:
// Häuser, Autos und Leute stehen weiter an denselben Stellen.
const lrnd = () => { lseed |= 0; lseed = lseed + 0x6D2B79F5 | 0; let t = Math.imul(lseed ^ lseed >>> 15, 1 | lseed);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
export const LR = (a, b) => a + lrnd() * (b - a);
export const lpick = a => a[Math.floor(lrnd() * a.length)];
export const chance = p => lrnd() < p;
export const rand = (a, b) => a + Math.random() * (b - a);
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ================= Szene, Materialien =================
export const scene = new THREE.Scene();
export const NO_OUTLINE = { outlineParameters: { visible: false } };
export function canvasTex(size, draw, h = size) {
  const c = document.createElement('canvas'); c.width = size; c.height = h; const x = c.getContext('2d'); draw(x, size, h);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
// Cel-Shading: Licht in 3 harten Stufen statt weichem Verlauf
export const gradMap = (() => { const t = new THREE.DataTexture(new Uint8Array([110, 190, 255]), 3, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
export const toon = (o = {}) => new THREE.MeshToonMaterial({ gradientMap: gradMap, ...o });
export const shade = (hex, f) => '#' + new THREE.Color(hex).multiplyScalar(f).getHexString();

// Ein gemeinsames Material für alle Objekte: Die Farbe steckt in den Ecken (Vertex-Farben),
// Fenster kommen aus einer weißen Textur-Kachel. Alles andere nutzt eine weiße Stelle der Kachel.
// Jede Kachel ist eine Fensterachse × eine Etage (256 px). WICHTIG: Rund um die Stelle (0.06 | 0.5),
// also links in der Mitte, bleibt jede Kachel rein weiß. Dort holen sich alle anderen Teile ihre Farbe (siehe P()).
const ink = (x, w, a = 1) => { x.strokeStyle = INK; x.lineWidth = w; x.lineJoin = 'round'; x.globalAlpha = a; };
function winBase(x, s, floor = '#e9e4da') { x.fillStyle = '#ffffff'; x.fillRect(0, 0, s, s); x.fillStyle = floor; x.fillRect(0, s - 10, s, 10); }
function glassFill(x, x0, y0, w, h, top = '#4fa6e3', bot = '#bfe9ff') {
  const g = x.createLinearGradient(0, y0, 0, y0 + h); g.addColorStop(0, top); g.addColorStop(1, bot); x.fillStyle = g; x.fillRect(x0, y0, w, h);
}
function shine(x, x0, y0, w, h) {   // zwei schräge Lichtstreifen auf dem Glas
  x.save(); x.beginPath(); x.rect(x0, y0, w, h); x.clip(); x.fillStyle = 'rgba(255,255,255,.55)';
  for (const [o, b] of [[0.28, 0.12], [0.5, 0.05]]) { const a = x0 + w * o; x.beginPath(); x.moveTo(a, y0 + h); x.lineTo(a + h * 0.45, y0); x.lineTo(a + h * 0.45 + w * b, y0); x.lineTo(a + w * b, y0 + h); x.fill(); }
  x.restore();
}
// Wohnhaus: Fenster mit Faschen, Sturz, Gardinen, Sprossen und Fensterbank
const WIN = canvasTex(256, (x, s) => {
  winBase(x, s);
  x.fillStyle = '#e9e2d5'; x.fillRect(66, 44, 124, 134); ink(x, 2.5, 0.3); x.strokeRect(66, 44, 124, 134); x.globalAlpha = 1;   // Faschen
  x.fillStyle = '#ddd3c2'; x.fillRect(60, 32, 136, 15); ink(x, 3); x.strokeRect(60, 32, 136, 15); x.globalAlpha = 1;   // Sturz
  x.fillStyle = '#ffffff'; x.fillRect(76, 52, 104, 126);                                                                // Rahmen
  glassFill(x, 84, 60, 88, 110);
  x.fillStyle = '#fff3df';                                                                                              // Gardinen
  x.beginPath(); x.moveTo(84, 60); x.lineTo(106, 60); x.quadraticCurveTo(102, 112, 93, 126); x.lineTo(100, 170); x.lineTo(84, 170); x.fill();
  x.beginPath(); x.moveTo(172, 60); x.lineTo(150, 60); x.quadraticCurveTo(154, 112, 163, 126); x.lineTo(156, 170); x.lineTo(172, 170); x.fill();
  x.fillRect(84, 60, 88, 9);
  x.strokeStyle = 'rgba(170,130,80,.35)'; x.lineWidth = 1.5;
  for (const fx of [89, 96, 160, 167]) { x.beginPath(); x.moveTo(fx, 70); x.lineTo(fx, 168); x.stroke(); }
  shine(x, 100, 69, 56, 101);
  x.fillStyle = 'rgba(20,40,70,.22)'; x.fillRect(84, 60, 88, 6); x.fillRect(84, 60, 6, 110);                         // Laibung (Schatten)
  x.fillStyle = '#ffffff'; x.fillRect(125, 60, 6, 110); x.fillRect(84, 100, 88, 6);                                   // Sprossen
  ink(x, 2); x.strokeRect(84, 60, 88, 110); ink(x, 3.5); x.strokeRect(76, 52, 104, 126);
  x.globalAlpha = 1; x.fillStyle = 'rgba(0,0,0,.13)'; x.fillRect(72, 190, 112, 7);                                   // Schatten unter der Bank
  x.fillStyle = '#ffffff'; x.fillRect(70, 178, 116, 12); ink(x, 3); x.strokeRect(70, 178, 116, 12); x.globalAlpha = 1;   // Fensterbank
});
// Wohnblock: breite Fenster mit dunklem Rahmen, Oberlicht, halb heruntergelassener Jalousie und Geschossband
const WIN_FLAT = canvasTex(256, (x, s) => {
  winBase(x, s, '#dcdfe5'); x.fillStyle = '#e8ebf0'; x.fillRect(0, s - 30, s, 20);
  x.fillStyle = '#5b6474'; x.fillRect(56, 38, 144, 164);
  glassFill(x, 63, 45, 130, 150, '#4a9fdc', '#c6ecff');
  x.fillStyle = '#f3f0e9'; x.fillRect(63, 45, 64, 58);                                                                 // Jalousie
  x.strokeStyle = 'rgba(120,110,95,.45)'; x.lineWidth = 1.5;
  for (let ly = 51; ly < 103; ly += 6) { x.beginPath(); x.moveTo(63, ly); x.lineTo(127, ly); x.stroke(); }
  x.fillStyle = '#fff3df'; x.fillRect(176, 45, 17, 150);                                                               // Vorhang
  shine(x, 131, 45, 45, 150); shine(x, 63, 103, 64, 47);
  x.fillStyle = 'rgba(20,40,70,.25)'; x.fillRect(63, 45, 130, 6);
  x.fillStyle = '#5b6474'; x.fillRect(125, 45, 6, 150); x.fillRect(63, 150, 130, 6);                                  // Pfosten + Kämpfer
  ink(x, 3.5); x.strokeRect(56, 38, 144, 164); x.globalAlpha = 1;
  x.fillStyle = '#cfd5de'; x.fillRect(50, 202, 156, 9); ink(x, 2.5); x.strokeRect(50, 202, 156, 9); x.globalAlpha = 1;   // Blech-Fensterbank
});
// Laden im Erdgeschoss: Schaufenster mit Regalen voller bunter Waren
const WIN_SHOP = canvasTex(256, (x, s) => {
  winBase(x, s); x.fillStyle = '#d6cebf'; x.fillRect(0, 212, s, 34);                                                  // Sockel
  x.fillStyle = '#3a4152'; x.fillRect(40, 58, 200, 154);
  glassFill(x, 47, 65, 186, 140, '#2f5d86', '#86c6ea');
  const GOODS = ['#ff5a4e', '#ffd23f', '#3fae6b', '#4f8bff', '#ff7ac6', '#ff8a3d', '#ffffff', '#9b6bff'];
  for (const sy of [112, 158, 200]) {
    for (let gx = 52; gx < 226;) { const gw = 9 + Math.floor(Math.random() * 3) * 4, gh = 12 + Math.random() * 14;
      x.fillStyle = GOODS[Math.floor(Math.random() * GOODS.length)]; x.fillRect(gx, sy - gh, gw, gh); gx += gw + 3; }
    x.fillStyle = '#efe4cf'; x.fillRect(47, sy, 186, 5);
  }
  shine(x, 47, 65, 186, 140);
  x.fillStyle = '#3a4152'; x.fillRect(137, 65, 6, 140);
  ink(x, 3.5); x.strokeRect(40, 58, 200, 154); x.globalAlpha = 1;
});
// Dachziegel: zwei versetzte Reihen. Oben in jeder Reihe ein heller Streifen, unten eine Schattenkante.
// Der helle Streifen der zweiten Reihe liegt genau auf v = 0.5, dort holen sich Schornstein, Giebel usw. ihre Farbe.
const ROOF = canvasTex(128, (x, s) => {
  x.fillStyle = '#ffffff'; x.fillRect(0, 0, s, s);
  const row = (y0, off) => {
    const g = x.createLinearGradient(0, y0 + 12, 0, y0 + 58); g.addColorStop(0, '#f2f2f2'); g.addColorStop(1, '#cdcdcd');
    x.fillStyle = g; x.fillRect(0, y0 + 12, s, 46);
    x.fillStyle = '#8a8a8a'; x.fillRect(0, y0 + 57, s, 7);
    for (let k = -1; k < 3; k++) { const jx = off + k * 64; x.fillStyle = '#a9a9a9'; x.fillRect(jx - 2, y0 + 12, 4, 46); x.fillStyle = 'rgba(255,255,255,.5)'; x.fillRect(jx + 2, y0 + 12, 3, 46); }
  };
  row(-6, 0); row(58, 32); row(122, 0);
});
export const MAT = toon({ map: WIN, vertexColors: true });
export const MAT_FLAT = toon({ map: WIN_FLAT, vertexColors: true });
export const MAT_SHOP = toon({ map: WIN_SHOP, vertexColors: true });
export const ROOF_MAT = toon({ map: ROOF, vertexColors: true });
// Durchsichtige Stufen für Häuser zwischen Kamera und Loch: je Material drei Kopien (werden einmal angelegt)
const FADES = new Map();
export function fadeSet(mat) {
  let f = FADES.get(mat);
  if (!f) { f = [0.72, 0.48, 0.3].map(op => { const m = mat.clone(); m.transparent = true; m.opacity = op; m.depthWrite = false; m.userData = NO_OUTLINE; return m; });
    FADES.set(mat, f); }
  return f;
}
export const FADE = fadeSet(MAT);

// ================= Grundformen =================
const NI = g => g.index ? g.toNonIndexed() : g;
function prismGeo() { const s = new THREE.Shape(); s.moveTo(-0.5, 0); s.lineTo(0.5, 0); s.lineTo(0, 1); s.closePath();
  return new THREE.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false }).translate(0, 0, -0.5); }
// Fläche aus Punkten (x | y), 1 tief in z (mittig): Autoprofile, Fensterformen …
export function extrudeXY(pts) { const s = new THREE.Shape(); pts.forEach(([a, b], i) => i ? s.lineTo(a, b) : s.moveTo(a, b)); s.closePath();
  return new THREE.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false }).translate(0, 0, -0.5); }
function finGeo() { const s = new THREE.Shape(); s.moveTo(-0.5, 0); s.lineTo(0.5, 0); s.quadraticCurveTo(0.05, 0.4, -0.25, 1); s.closePath();
  return new THREE.ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: false }).translate(0, 0, -0.06); }
export const GE = {
  sph: NI(new THREE.SphereGeometry(1, 12, 9)),
  sphLo: NI(new THREE.SphereGeometry(1, 8, 6)),
  hemi: NI(new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2)),
  cyl: NI(new THREE.CylinderGeometry(1, 1, 1, 16)),
  cylLo: NI(new THREE.CylinderGeometry(1, 1, 1, 8)),
  cylHi: NI(new THREE.CylinderGeometry(1, 1, 1, 28)),
  cone: NI(new THREE.ConeGeometry(1, 1, 12)),
  coneHi: NI(new THREE.ConeGeometry(1, 1, 24)),
  frust: NI(new THREE.CylinderGeometry(0.72, 1, 1, 24)),
  frustLo: NI(new THREE.CylinderGeometry(0.65, 1, 1, 8)),
  blob: NI(new THREE.IcosahedronGeometry(1, 0)),      // kleine runde Dinge (Blüten, Hände, Früchte): nur 20 Dreiecke
  box: NI(new THREE.BoxGeometry(1, 1, 1)),
  rbox: NI(new RoundedBoxGeometry(1, 1, 1, 1, 0.16)),
  torus: NI(new THREE.TorusGeometry(1, 0.18, 8, 24)),
  dodec: NI(new THREE.DodecahedronGeometry(1)),
  oct: NI(new THREE.OctahedronGeometry(1)),
  legs: NI(new THREE.CapsuleGeometry(0.15, 0.3, 3, 8)),
  torso: NI(new THREE.CapsuleGeometry(0.23, 0.32, 3, 10)),
  torso2: NI(new THREE.CapsuleGeometry(0.2, 0.3, 2, 8)),
  cap: NI(new THREE.CapsuleGeometry(0.5, 1, 3, 10)),
  carBody: NI(new RoundedBoxGeometry(3.4, 0.8, 1.7, 2, 0.32)),
  carCab: NI(new RoundedBoxGeometry(1.9, 0.78, 1.5, 2, 0.3)),
  carTop: NI(extrudeXY([[-1.25, 0], [0.95, 0], [0.35, 0.68], [-0.95, 0.68]])),             // Fahrgastzelle (Seitenansicht), vorne = +x
  carWinF: NI(extrudeXY([[0, 0.12], [0.744, 0.12], [0.32, 0.6], [0, 0.6]])),               // Seitenfenster vorne
  carWinR: NI(extrudeXY([[-1.097, 0.12], [-0.12, 0.12], [-0.12, 0.6], [-0.885, 0.6]])),    // Seitenfenster hinten
  prism: NI(prismGeo()),
  fin: NI(finGeo()),
};
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
const _one = new THREE.Vector3(1, 1, 1);
// Ein Teil = Grundform + Farbe + Position/Größe/Drehung. Alle Teile eines Objekts werden zu EINEM Mesh verschmolzen (schneller).
export function P(geo, hex, x = 0, y = 0, z = 0, sx = 1, sy = sx, sz = sx, rx = 0, ry = 0, rz = 0) {
  const g = geo.clone();
  g.applyMatrix4(_m.compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(sx, sy, sz)));
  const c = new THREE.Color(hex), n = g.attributes.position.count, a = new Float32Array(n * 3), uv = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; uv[i * 2] = 0.06; uv[i * 2 + 1] = 0.5; }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return g;
}
// Wand mit Fenstern: eine Box, auf deren Seiten sich die Fenster-Kachel wiederholt.
// gap > 0: Auf der Vorderseite (+z) bleibt in der Mitte ein Streifen dieser Breite ohne Fenster (dort kommt die Haustür hin).
export function PWall(w, h, d, x, y, z, hex, tile = 2.7, fh = FH, gap = 0) {
  const g = new THREE.BoxGeometry(w, h, d).toNonIndexed(); g.translate(x, y, z);
  const nx = Math.max(1, Math.round(w / tile)), nz = Math.max(1, Math.round(d / tile)), ny = Math.max(1, Math.round(h / fh));
  const pos = g.attributes.position, nor = g.attributes.normal, uv = g.attributes.uv, P3 = [], N3 = [], U2 = [];
  for (let i = 0; i < pos.count; i++) {
    const f = Math.floor(i / 6);   // Reihenfolge der Seiten: +x, -x, +y, -y, +z, -z
    if (f === 4 && gap) continue;   // Vorderseite mit Tür-Lücke wird unten neu gebaut
    P3.push(pos.getX(i), pos.getY(i), pos.getZ(i)); N3.push(nor.getX(i), nor.getY(i), nor.getZ(i));
    if (f === 2 || f === 3) U2.push(0.06, 0.5); else U2.push(uv.getX(i) * (f < 2 ? nz : nx), uv.getY(i) * ny);
  }
  if (gap) {   // drei Streifen: links Fenster, in der Mitte nur Wand, rechts Fenster
    const zf = z + d / 2, y0 = y - h / 2, y1 = y + h / 2, side = Math.max(0, Math.round((w - gap) / 2 / (w / nx)));
    const quad = (x0, x1, u0, u1) => {
      P3.push(x0, y0, zf, x1, y0, zf, x1, y1, zf, x0, y0, zf, x1, y1, zf, x0, y1, zf);
      for (let k = 0; k < 6; k++) N3.push(0, 0, 1);
      U2.push(u0, 0, u1, 0, u1, ny, u0, 0, u1, ny, u0, ny);
    };
    if (side > 0) quad(x - w / 2, x - gap / 2, 0, side);
    quad(x - gap / 2, x + gap / 2, 0.02, 0.1);   // schmaler weißer Streifen der Kachel, gestreckt: glatte Wand
    if (side > 0) quad(x + gap / 2, x + w / 2, 0, side);
  }
  const n = P3.length / 3, c = new THREE.Color(hex), a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(P3, 3)); out.setAttribute('normal', new THREE.Float32BufferAttribute(N3, 3));
  out.setAttribute('uv', new THREE.Float32BufferAttribute(U2, 2)); out.setAttribute('color', new THREE.BufferAttribute(a, 3));
  return out;
}
// Platte mit gekachelter Oberseite (Dachziegel): Box len × t × dep. Die Oberseite (+y) bekommt Kachel-UVs
// (u entlang z alle uT Meter, v entlang x alle vT Meter; flip: v wächst Richtung -x). Die anderen Seiten nehmen die weiße Stelle.
export function PTiled(len, t, dep, hex, uT, vT, flip, x, y, z, rz) {
  const g = new THREE.BoxGeometry(len, t, dep).toNonIndexed(), pos = g.attributes.position, uv = g.attributes.uv, n = pos.count;
  for (let i = 0; i < n; i++) {
    if (Math.floor(i / 6) === 2) uv.setXY(i, (pos.getZ(i) + dep / 2) / uT, (flip ? len / 2 - pos.getX(i) : pos.getX(i) + len / 2) / vT);
    else uv.setXY(i, 0.06, 0.5);
  }
  g.applyMatrix4(_m.compose(_p.set(x, y, z), _q.setFromEuler(_e.set(0, 0, rz)), _one));
  const c = new THREE.Color(hex), a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3));
  return g;
}
export function build(parts, mat = MAT) { const m = new THREE.Mesh(mergeGeometries(parts), mat); m.castShadow = m.receiveShadow = true; return m; }

// ================= Physik-Formen (Collider), in Objekt-Koordinaten (Ursprung = Mitte der Grundfläche) =================
export const cBox = (hx, hy, hz, x = 0, y = hy, z = 0, ry = 0) => ({ t: 'box', a: [hx, hy, hz], p: [x, y, z], r: ry ? [0, ry, 0] : null });
export const cCyl = (hh, r, x = 0, y = hh, z = 0, rx = 0, rz = 0) => ({ t: 'cyl', a: [hh, r], p: [x, y, z], r: rx || rz ? [rx, 0, rz] : null });
export const cBall = (r, x = 0, y = r, z = 0) => ({ t: 'ball', a: [r], p: [x, y, z], r: null });
export const cCone = (hh, r, x = 0, y = hh, z = 0) => ({ t: 'cone', a: [hh, r], p: [x, y, z], r: null });
export const cHull = pts => ({ t: 'hull', a: pts, p: [0, 0, 0], r: null });
const _b = new THREE.Box3(), _b2 = new THREE.Box3();
function colBox(c, out) {   // umgebende Box eines Colliders
  if (c.t === 'hull') return out.setFromArray(c.a);
  const [a0, a1, a2] = c.a;
  const [hx, hy, hz] = c.t === 'box' ? [a0, a1, a2] : c.t === 'ball' ? [a0, a0, a0] : [a1, a0, a1];
  out.min.set(-hx, -hy, -hz); out.max.set(hx, hy, hz);
  return out.applyMatrix4(_m.compose(_p.set(c.p[0], c.p[1], c.p[2]), c.r ? _q.setFromEuler(_e.set(c.r[0], c.r[1], c.r[2])) : _q.identity(), _one));
}

// ================= Objekte =================
export const objects = [];
export const blocked = [];          // Rechtecke [x0, x1, z0, z1], in denen nichts verstreut wird (Häuser …)
let BOSS = null;
export const setBoss = o => { BOSS = o; };
export const getBoss = () => BOSS;
const GRID = new Map(), CELL = 4;   // Raster, um beim Verteilen nichts übereinander zu stellen
const gk = (i, j) => i * 1000 + j;
function gridAdd(o) {
  const { x, z } = o.g.position, r = o.rad;
  for (let i = Math.floor((x - r) / CELL); i <= Math.floor((x + r) / CELL); i++)
    for (let j = Math.floor((z - r) / CELL); j <= Math.floor((z + r) / CELL); j++) { let a = GRID.get(gk(i, j)); if (!a) GRID.set(gk(i, j), a = []); a.push(o); }
}
export function isFree(x, z, r) {
  for (let i = Math.floor((x - r) / CELL); i <= Math.floor((x + r) / CELL); i++)
    for (let j = Math.floor((z - r) / CELL); j <= Math.floor((z + r) / CELL); j++) {
      const a = GRID.get(gk(i, j)); if (!a) continue;
      for (const o of a) { const p = o.g.position; if (Math.hypot(p.x - x, p.z - z) < r + o.rad * 0.7) return false; }
    }
  return true;
}
export const inBlocked = (x, z) => blocked.some(([a, b, c, d]) => x > a && x < b && z > c && z < d);
export const onRoad = (x, z, pad = 5.2) => ROADS.some(r => Math.abs(x - r) < pad || Math.abs(z - r) < pad);

// Objekt anmelden. o: v (Punkte/XP), y, ry (Drehung), cols (Physik-Formen), walk/drive (bewegt sich), fade (darf durchsichtig werden)
export function add(mesh, x, z, o = {}) {
  mesh.position.set(x, o.y || 0, z); if (o.ry) mesh.rotation.y = o.ry;
  scene.add(mesh);
  let cols = o.cols;
  if (!cols) {   // keine Formen angegeben: eine Box um das ganze Objekt
    mesh.geometry.computeBoundingBox(); const bb = mesh.geometry.boundingBox, c = bb.getCenter(new THREE.Vector3()), s = bb.getSize(new THREE.Vector3());
    cols = [cBox(s.x / 2, s.y / 2, s.z / 2, c.x, c.y, c.z)];
  }
  _b.makeEmpty(); for (const c of cols) _b.union(colBox(c, _b2));
  const ex = _b.max.x - _b.min.x, ey = _b.max.y - _b.min.y, ez = _b.max.z - _b.min.z, dims = [ex, ey, ez].sort((a, b) => a - b);
  const ob = { v: 1, ...o, g: mesh, cols, ph: 0, body: null, gone: false,
    rad: Math.hypot(Math.max(-_b.min.x, _b.max.x), Math.max(-_b.min.z, _b.max.z)),   // Radius der Grundfläche
    h: (o.y || 0) + _b.max.y,                                                       // Oberkante
    size: dims[2],
    s: o.s ?? 0.5 * Math.hypot(dims[0], dims[1]) * 1.05 };                           // „Schluckgröße“ für die KI
  ob.fk = 1;   // Deckkraft beim Durchsichtig-Werden
  objects.push(ob); gridAdd(ob); return ob;
}
// n Dinge zufällig verteilen (nicht auf Straßen, nicht in Häusern, nicht aufeinander)
export function scatter(n, fn, { pad = 3.6, r = 0.45, x0 = -MAP + 2, x1 = MAP - 2, z0 = -MAP + 2, z1 = MAP - 2, ok = null } = {}) {
  let k = 0;
  for (let tries = 0; k < n && tries < n * 40; tries++) {
    const x = R(x0, x1), z = R(z0, z1);
    if ((pad && onRoad(x, z, pad)) || inBlocked(x, z) || !isFree(x, z, r) || (ok && !ok(x, z))) continue;
    fn(x, z); k++;
  }
  return k;
}
// freier Platz in einem Block
export function freeSpot(bx, bz, spread = 9.5, r = 0.8) {
  for (let i = 0; i < 16; i++) { const x = bx + R(-spread, spread), z = bz + R(-spread, spread); if (!inBlocked(x, z) && isFree(x, z, r)) return [x, z]; }
  return null;
}

// ================= Boden =================
function speckle(x, w, col, alpha, n, size = 3) {
  for (let i = 0; i < n; i++) { x.fillStyle = `rgba(${col},${Math.random() * alpha})`; const r = Math.random() * size + 1; x.fillRect(Math.random() * w, Math.random() * w, r, r); }
}
export { speckle };
// nahtlose Kacheln: was über den Rand ragt, wird auf der gegenüberliegenden Seite noch einmal gezeichnet
function wrap(s, px, py, r, fn) {
  for (const dx of [-s, 0, s]) for (const dy of [-s, 0, s]) { const qx = px + dx, qy = py + dy; if (qx > -r && qx < s + r && qy > -r && qy < s + r) fn(qx, qy); }
}
function rrect(x, x0, y0, w, h, r) { x.beginPath(); x.moveTo(x0 + r, y0); x.arcTo(x0 + w, y0, x0 + w, y0 + h, r); x.arcTo(x0 + w, y0 + h, x0, y0 + h, r);
  x.arcTo(x0, y0 + h, x0, y0, r); x.arcTo(x0, y0, x0 + w, y0, r); x.closePath(); }
const rgb = (r, g, b) => `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
export const TEX = {
  // Rasen: weiche hellere/dunklere Flecken, Grasbüschel in vier Tönen, ganz selten ein Gänseblümchen
  grass: canvasTex(512, (x, s) => { x.fillStyle = '#7ed957'; x.fillRect(0, 0, s, s);
    for (let i = 0; i < 22; i++) { const px = Math.random() * s, py = Math.random() * s, r = 40 + Math.random() * 70, light = i % 2;
      wrap(s, px, py, r, (qx, qy) => { const g = x.createRadialGradient(qx, qy, 0, qx, qy, r);
        g.addColorStop(0, light ? 'rgba(170,240,120,.2)' : 'rgba(70,160,45,.14)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(qx - r, qy - r, 2 * r, 2 * r); }); }
    x.lineCap = 'round'; x.lineWidth = 2.6;
    for (let i = 0; i < 520; i++) { const px = Math.random() * s, py = Math.random() * s, h = 7 + Math.random() * 6;
      x.strokeStyle = ['#62c444', '#56b53b', '#93e56a', '#6dcc4a'][i % 4];
      wrap(s, px, py, 14, (qx, qy) => { x.beginPath(); x.moveTo(qx - 4, qy - h * 0.9); x.lineTo(qx, qy); x.lineTo(qx + 4, qy - h * 0.9); x.moveTo(qx, qy); x.lineTo(qx + 0.6, qy - h); x.stroke(); }); }
    for (let i = 0; i < 9; i++) { const px = Math.random() * s, py = Math.random() * s, col = ['#ffffff', '#fff6b0', '#ffe0f0'][i % 3];
      wrap(s, px, py, 8, (qx, qy) => { x.fillStyle = col; for (let k = 0; k < 5; k++) { x.beginPath(); x.arc(qx + Math.cos(k * 1.26) * 3, qy + Math.sin(k * 1.26) * 3, 2.2, 0, 6.3); x.fill(); }
        x.fillStyle = '#ffc93c'; x.beginPath(); x.arc(qx, qy, 1.8, 0, 6.3); x.fill(); }); } }),
  // Asphalt: feine Körnung, ausgebesserte Flicken, ein paar Haarrisse
  asphalt: canvasTex(512, (x, s) => { x.fillStyle = '#4e5566'; x.fillRect(0, 0, s, s);
    speckle(x, s, '30,34,44', .45, 1600, 2.5); speckle(x, s, '128,136,152', .35, 1100, 2.5);
    for (let i = 0; i < 3; i++) { const w = 50 + Math.random() * 90, h = 36 + Math.random() * 60, px = Math.random() * s, py = Math.random() * s;
      wrap(s, px, py, Math.max(w, h) + 4, (qx, qy) => { x.fillStyle = 'rgba(28,32,42,.08)'; x.fillRect(qx, qy, w, h); x.strokeStyle = 'rgba(22,25,33,.14)'; x.lineWidth = 1.5; x.strokeRect(qx, qy, w, h); }); }
    x.strokeStyle = 'rgba(24,27,35,.42)'; x.lineWidth = 1.6; x.lineJoin = 'round';
    for (let i = 0; i < 6; i++) { let px = Math.random() * s, py = Math.random() * s, a = Math.random() * 6.3; const pts = [[px, py]];
      for (let k = 0; k < 7; k++) { a += (Math.random() - 0.5) * 1.3; px += Math.cos(a) * 11; py += Math.sin(a) * 11; pts.push([px, py]); }
      wrap(s, pts[0][0], pts[0][1], 90, (qx, qy) => { const dx = qx - pts[0][0], dy = qy - pts[0][1]; x.beginPath();
        pts.forEach(([a1, b1], k) => k ? x.lineTo(a1 + dx, b1 + dy) : x.moveTo(a1 + dx, b1 + dy)); x.stroke(); }); } }),
  // Gehweg: 4×4 Platten, jede etwas anders getönt, mit heller Ober- und dunkler Unterkante
  walk: canvasTex(256, (x, s) => { x.fillStyle = '#d3c5a8'; x.fillRect(0, 0, s, s);
    const ts = s / 4;
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
      const v = Math.random() * 14 - 7, x0 = c * ts + 2, y0 = r * ts + 2, w = ts - 4;
      x.fillStyle = rgb(242 + v, 233 + v, 214 + v); x.fillRect(x0, y0, w, w);
      x.fillStyle = 'rgba(255,255,255,.6)'; x.fillRect(x0, y0, w, 3); x.fillRect(x0, y0, 3, w);
      x.fillStyle = 'rgba(150,125,90,.28)'; x.fillRect(x0, y0 + w - 3, w, 3); x.fillRect(x0 + w - 3, y0, 3, w);
    }
    speckle(x, s, '150,128,96', .28, 300, 2); }),
  // Platz: Pflastersteine in versetzten Reihen, warme Sandtöne, jeder Stein mit Licht und Schatten
  plaza: canvasTex(256, (x, s) => { x.fillStyle = '#d4b47c'; x.fillRect(0, 0, s, s);
    const rh = 32, n = 7, COLS = [[246, 223, 180], [241, 214, 164], [249, 231, 198], [236, 208, 156], [244, 220, 174]];
    for (let r = 0; r < s / rh; r++) {
      const ws = Array.from({ length: n }, () => 0.75 + Math.random() * 0.5), sum = ws.reduce((a, b) => a + b, 0);
      let cx = Math.random() * s;
      for (const wf of ws) { const cw = wf / sum * s, c = COLS[Math.floor(Math.random() * COLS.length)];
        for (const off of [-s, 0]) { const x0 = cx + off + 2, y0 = r * rh + 2, w = cw - 4, h = rh - 4;
          rrect(x, x0, y0, w, h, 6); x.fillStyle = rgb(...c); x.fill();
          x.save(); x.clip(); x.fillStyle = 'rgba(255,255,255,.45)'; x.fillRect(x0, y0, w, 4); x.fillStyle = 'rgba(140,100,50,.22)'; x.fillRect(x0, y0 + h - 4, w, 4); x.restore(); }
        cx += cw; }
    } }),
  water: canvasTex(128, (x, s) => { x.fillStyle = '#5cc8f5'; x.fillRect(0, 0, s, s); x.strokeStyle = '#a9e6ff'; x.lineWidth = 4; x.lineCap = 'round';
    for (let i = 0; i < 6; i++) { const a = Math.random() * s, b = Math.random() * s; x.beginPath(); x.arc(a, b, 10, Math.PI * 1.1, Math.PI * 1.9); x.stroke(); } }),
};
// Boden-Material: wird dort NICHT gezeichnet, wo ein Loch ist (Stencil-Trick)
export function groundMat(tex, rx = 1, rz = 1, color = 0xffffff) {
  let map = null; if (tex) { map = tex.clone(); map.needsUpdate = true; map.repeat.set(rx, rz); }
  const m = toon({ map, color, stencilWrite: true, stencilRef: 1, stencilFunc: THREE.NotEqualStencilFunc,
    stencilFail: THREE.KeepStencilOp, stencilZFail: THREE.KeepStencilOp, stencilZPass: THREE.KeepStencilOp });
  m.userData = NO_OUTLINE; return m;
}
export function flat(w, d, x, z, y, tex, scale, color = 0xffffff) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), groundMat(tex, w / scale, d / scale, color));
  m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.receiveShadow = true; scene.add(m); return m;
}
export function disc(r, x, z, y, tex, scale, color = 0xffffff) {
  const m = new THREE.Mesh(new THREE.CircleGeometry(r, 40), groundMat(tex, 2 * r / scale, 2 * r / scale, color));
  m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.receiveShadow = true; scene.add(m); return m;
}
// Straßennetz: Gehweg + Fahrbahn, optional mit Markierungen, Zebrastreifen und Bordsteinen
export function roadNet({ walk = TEX.walk, road = TEX.asphalt, walkScale = 2.5, roadScale = 8, marks = true, curbs = true,
  curbColor = 0xd8cdb6, markColor = 0xffffff, walkW = 10, roadW = 7 } = {}) {
  const W = 2 * MAP + 10;
  for (const rc of ROADS) { if (walk) { flat(W, walkW, 0, rc, 0.01, walk, walkScale); flat(walkW, W, rc, 0, 0.011, walk, walkScale); }
    flat(W, roadW, 0, rc, 0.02, road, roadScale); flat(roadW, W, rc, 0, 0.021, road, roadScale); }
  const mark = [], curb = [];
  const pg = (w, d, x, z) => new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2).translate(x, 0.03, z);
  for (const rc of ROADS) {
    if (marks) {
      for (let t = -MAP; t < MAP; t += 4) {
        if (ROADS.some(r => Math.abs(t - r) < 9)) continue;
        mark.push(pg(1.8, 0.22, t, rc), pg(0.22, 1.8, rc, t));
      }
      for (const r of ROADS) for (const s of [-1, 1]) for (let i = 0; i < 6; i++) {
        const off = -2.75 + i * 1.1;
        mark.push(pg(2.0, 0.55, r + s * 6.3, rc + off), pg(0.55, 2.0, rc + off, r + s * 6.3));
      }
    }
    if (curbs) {
      let prev = -MAP - 5;
      for (const r of [...ROADS, MAP + 5 + 4.6]) {
        const a = prev, b = r - 4.6, len = b - a, mid = (a + b) / 2;
        if (len > 0) for (const s of [-1, 1]) {
          curb.push(new THREE.BoxGeometry(len, 0.16, 0.35).translate(mid, 0.08, rc + s * 3.6));
          curb.push(new THREE.BoxGeometry(0.35, 0.16, len).translate(rc + s * 3.6, 0.08, mid));
        }
        prev = r + 4.6;
      }
    }
  }
  if (mark.length) { const mm = new THREE.Mesh(mergeGeometries(mark), groundMat(null, 1, 1, markColor)); mm.receiveShadow = true; scene.add(mm); }
  if (curb.length) { const cm = new THREE.Mesh(mergeGeometries(curb), groundMat(null, 1, 1, curbColor)); cm.receiveShadow = true; scene.add(cm); }
}
// Deko-Rand aus Kugeln (Hecke, Felsen …), gehört nicht zum Futter
export function edgeRing(cols, size = [1.3, 1.7], geo = GE.sph, step = 2.6, off = 3.5) {
  const parts = [];
  for (let t = -MAP - 4; t <= MAP + 4; t += step) for (const s of [-1, 1]) {
    const g = pick(cols), k = R(size[0], size[1]);
    parts.push(P(geo, g, t, k * 0.8, s * (MAP + off), k), P(geo, g, s * (MAP + off), k * 0.8, t, k));
  }
  const hm = build(parts); hm.castShadow = false; scene.add(hm); return hm;
}

// ================= Farben =================
export const C = {
  skin: ['#ffd7b0', '#e8a878', '#a86f48', '#ffe6cc'], hair: ['#3b2a20', '#7a4a2a', '#f2c94c', '#1d1d24', '#c0553a'],
  shirt: ['#ff5a4e', '#4f8bff', '#ffd23f', '#9b6bff', '#2fd3b9', '#ff7ac6', '#ff8a3d'], pants: ['#3c4a6b', '#2d3240', '#6b5a48'],
  leaf: ['#5ccf3f', '#45b83a', '#8ee05a'], car: ['#ff5a4e', '#4f8bff', '#ffd23f', '#ffffff', '#2fd3b9', '#9b6bff', '#ff8a3d'],
  roof: ['#ff6b4a', '#c8553d', '#5b6fd8', '#ff9f1c', '#3fae6b'], bin: ['#3fae6b', '#6d7686', '#4f8bff'],
  wall: ['#fff1d6', '#ffd6c9', '#d4ecff', '#fff09a', '#e6dcff', '#ffffff', '#d2f5dd', '#ffc9a3'],
};

// ================= Allgemeine Objekte (mehrere Welten nutzen sie) =================
// Wer läuft: walk = Richtung, Tempo, Zeit bis zum Richtungswechsel, Wackel-Phase
export const walkState = (sp = [0.8, 1.6], bob = 0.08, extra = {}) => { const a = R(0, 6.28);
  return { dx: Math.cos(a), dz: Math.sin(a), sp: R(sp[0], sp[1]), t: R(1, 4), ph: R(0, 6), bob, ...extra }; };
// Mensch (vorne = +z): zwei Beine mit Schuhen, Arme mit Händen, Augen, verschiedene Frisuren, manchmal Kappe oder Rucksack.
// Die Welt-Zufallszahlen (Hose, Shirt, Haut, Haare) werden in derselben Reihenfolge gezogen wie früher.
const SHOES = ['#2a2d36', '#ffffff', '#8a5634', '#ff5a4e', '#3a4152', '#4f8bff'];
const BAGS = ['#ff5a4e', '#4f8bff', '#ffd23f', '#2fd3b9', '#9b6bff', '#3a4152', '#ff8a3d'];
export function person(x, z, o = {}) {
  const pants = o.pants || pick(C.pants), shirt = o.shirt || pick(C.shirt), skin = pick(C.skin), hair = o.hair || pick(C.hair);
  const shoe = lpick(SHOES), sleeve = chance(0.5) ? skin : shirt, style = LR(0, 1), parts = [];
  for (const s of [-1, 1]) parts.push(P(GE.box, shoe, s * 0.09, 0.045, 0.035, 0.12, 0.09, 0.23),      // Schuh
    P(GE.cylLo, pants, s * 0.09, 0.34, 0, 0.075, 0.52, 0.075),                                          // Bein
    P(GE.cylLo, shirt, s * 0.27, 0.97, 0, 0.068, 0.27, 0.068, 0, 0, s * 0.12),                         // Oberarm (Ärmel)
    P(GE.cylLo, sleeve, s * 0.3, 0.73, 0, 0.058, 0.26, 0.058, 0, 0, s * 0.12),                         // Unterarm
    P(GE.blob, skin, s * 0.32, 0.57, 0, 0.066));                                                        // Hand
  parts.push(P(GE.cylLo, pants, 0, 0.62, 0, 0.17, 0.14, 0.13), P(GE.torso2, shirt, 0, 0.86, 0, 1.08, 1, 0.82),
    P(GE.sph, skin, 0, 1.3, 0, 0.21), P(GE.box, INK, -0.075, 1.33, 0.2, 0.045, 0.07, 0.03), P(GE.box, INK, 0.075, 1.33, 0.2, 0.045, 0.07, 0.03));
  if (style < 0.12) { const cc = lpick(BAGS); parts.push(P(GE.sphLo, cc, 0, 1.4, -0.01, 0.228, 0.15, 0.228), P(GE.box, cc, 0, 1.4, 0.2, 0.28, 0.035, 0.2)); }   // Kappe
  else {
    parts.push(P(GE.sphLo, hair, 0, 1.37, -0.03, 0.226, 0.16, 0.226));
    if (style < 0.42) parts.push(P(GE.sphLo, hair, 0, 1.2, -0.12, 0.2, 0.26, 0.12));      // lange Haare
    else if (style < 0.55) parts.push(P(GE.sphLo, hair, 0, 1.48, -0.15, 0.09));           // Dutt
  }
  if (chance(0.22)) { const bc = lpick(BAGS); parts.push(P(GE.box, bc, 0, 0.92, -0.21, 0.3, 0.34, 0.14), P(GE.box, shade(bc, 0.78), 0, 0.82, -0.285, 0.24, 0.12, 0.03)); }   // Rucksack
  if (o.extra) parts.push(...o.extra());
  return add(build(parts), x, z, { v: 1, cols: [cCyl(0.72, 0.24)], walk: walkState(o.sp, 0.08) });
}
// Mülleimer: rund (mit Deckelrand, Ringen, Aufkleber) oder eckig (mit Einwurf-Schlitz und Rillen)
export function bin(x, z, cols = C.bin) {
  const c = pick(cols), round = rnd() < 0.5, dk = shade(c, 0.6), mid = shade(c, 0.8);
  const parts = round
    ? [P(GE.cyl, c, 0, 0.42, 0, 0.3, 0.84, 0.3), P(GE.cylLo, dk, 0, 0.87, 0, 0.35, 0.08, 0.35), P(GE.cylLo, '#2a2d36', 0, 0.915, 0, 0.25, 0.02, 0.25),
      P(GE.cylLo, mid, 0, 0.6, 0, 0.312, 0.05, 0.312), P(GE.cylLo, mid, 0, 0.2, 0, 0.312, 0.05, 0.312), P(GE.box, '#ffffff', 0, 0.4, 0.3, 0.18, 0.14, 0.02)]
    : [P(GE.box, c, 0, 0.45, 0, 0.6, 0.86, 0.6), P(GE.box, dk, 0, 0.93, 0, 0.68, 0.12, 0.68), P(GE.box, '#2a2d36', 0, 0.78, 0.305, 0.34, 0.07, 0.02),
      P(GE.box, mid, -0.15, 0.38, 0.305, 0.04, 0.56, 0.02), P(GE.box, mid, 0.15, 0.38, 0.305, 0.04, 0.56, 0.02), P(GE.box, dk, 0, 0.03, 0, 0.64, 0.06, 0.64)];
  return add(build(parts), x, z, { v: 1, ry: LR(0, 6.28), cols: [round ? cCyl(0.46, 0.34) : cBox(0.33, 0.49, 0.33)] });
}
// Laterne: Sockel mit Ring, Mast, Arm mit Strebe, Leuchte mit Schirm und Glas (lang und dünn: kippt gern über die Kante)
export function lamp(x, z, col = '#3a4152', light = '#fff3a8') {
  const hi = shade(col, 1.45);
  const m = build([P(GE.cylLo, col, 0, 0.16, 0, 0.2, 0.32, 0.2), P(GE.cylLo, hi, 0, 0.35, 0, 0.13, 0.08, 0.13),
    P(GE.cylLo, col, 0, 1.85, 0, 0.065, 3.0, 0.065), P(GE.cylLo, hi, 0, 2.7, 0, 0.09, 0.06, 0.09), P(GE.blob, col, 0, 3.38, 0, 0.09),
    P(GE.box, col, 0.3, 3.38, 0, 0.62, 0.08, 0.08), P(GE.box, col, 0.13, 3.21, 0, 0.36, 0.06, 0.06, 0, 0, 0.75),
    P(GE.cone, col, 0.58, 3.42, 0, 0.31, 0.2, 0.31), P(GE.cylLo, light, 0.58, 3.25, 0, 0.19, 0.16, 0.19), P(GE.cylLo, col, 0.58, 3.15, 0, 0.1, 0.05, 0.1)]);
  return add(m, x, z, { v: 3, ry: R(0, 6.28), cols: [cCyl(0.18, 0.17), cCyl(1.75, 0.08, 0, 1.75), cBox(0.38, 0.15, 0.16, 0.36, 3.35, 0)] });
}
// Parkbank: Sitz- und Lehnenlatten aus Holz, Gestell mit Armlehnen aus Gusseisen
export function bench(x, z, ry = 0, wood = '#d98c45') {
  const iron = '#3a4152', w2 = shade(wood, 0.88), parts = [];
  for (const [i, sz] of [[0, -0.17], [1, 0], [2, 0.17]]) parts.push(P(GE.box, i % 2 ? w2 : wood, 0, 0.45, sz, 1.6, 0.06, 0.15));
  parts.push(P(GE.box, wood, 0, 0.66, -0.27, 1.6, 0.13, 0.05, -0.18, 0, 0), P(GE.box, w2, 0, 0.85, -0.305, 1.6, 0.13, 0.05, -0.18, 0, 0));
  for (const sx of [-0.66, 0.66]) parts.push(P(GE.box, iron, sx, 0.32, 0.2, 0.07, 0.64, 0.07), P(GE.box, iron, sx, 0.47, -0.25, 0.07, 0.94, 0.07, -0.18, 0, 0),
    P(GE.box, iron, sx, 0.41, -0.02, 0.07, 0.05, 0.46), P(GE.box, iron, sx, 0.64, 0.0, 0.08, 0.05, 0.5));
  return add(build(parts), x, z, { v: 3, ry, cols: [cBox(0.8, 0.26, 0.26, 0, 0.26), cBox(0.8, 0.22, 0.06, 0, 0.75, -0.22)] });
}
// Laubbaum: schlanker Stamm mit zwei Ästen, Krone aus sechs Ballen in drei Grüntönen (oben heller), manchmal mit Früchten oder Blüten
export function tree(x, z, leaf = C.leaf, trunk = '#9a6236') {
  const s = R(1, 1.5), g = pick(leaf), g2 = shade(g, 0.84), g3 = shade(g, 1.13), g4 = shade(g, 0.93), cy = 1.6 + s;
  const parts = [P(GE.frustLo, trunk, 0, 0.85, 0, 0.21, 1.7, 0.21),
    P(GE.cylLo, trunk, 0.3, cy - s * 0.55, 0.08, 0.055, 0.75, 0.055, 0.2, 0, -0.8), P(GE.cylLo, trunk, -0.27, cy - s * 0.6, -0.1, 0.05, 0.65, 0.05, -0.25, 0, 0.85),
    P(GE.sph, g, 0, cy, 0, s), P(GE.sphLo, g2, s * 0.62, cy - s * 0.3, s * 0.2, s * 0.66), P(GE.sphLo, g2, -s * 0.58, cy - s * 0.27, -s * 0.25, s * 0.6),
    P(GE.sphLo, g4, s * 0.1, cy - s * 0.12, -s * 0.64, s * 0.56), P(GE.sphLo, g4, -s * 0.16, cy - s * 0.34, s * 0.6, s * 0.52),
    P(GE.sphLo, g3, -s * 0.12, cy + s * 0.62, s * 0.08, s * 0.58)];
  if (chance(0.2)) { const fc = lpick(['#ff4136', '#ff7ac6', '#ffffff', '#ffb02e']);
    for (let i = 0; i < 7; i++) { const a = LR(0, 6.28), e = LR(-0.2, 0.9); parts.push(P(GE.blob, fc, Math.cos(a) * Math.cos(e) * s * 1.01, cy + Math.sin(e) * s, Math.sin(a) * Math.cos(e) * s * 1.01, 0.1)); } }
  return add(build(parts), x, z, { v: 9, ry: R(0, 6.28), cols: [cCyl(0.8, 0.2), cBall(s * 1.05, 0, 1.6 + s)] });
}
// Tanne: vier Etagen Zweige im Wechsel heller und dunkler
export function pine(x, z, g = '#2f9e5b') {
  const s = R(0.9, 1.3), parts = [P(GE.frustLo, '#9a6236', 0, 0.55, 0, 0.18, 1.1, 0.18)];
  for (const [r, h, y, f] of [[1.38, 1.3, 1.25, 0.92], [1.12, 1.2, 2.05, 1.08], [0.86, 1.1, 2.8, 0.97], [0.58, 1.05, 3.5, 1.2]])
    parts.push(P(GE.cone, shade(g, f), 0, y * s, 0, r * s, h * s, r * s));
  return add(build(parts), x, z, { v: 9, cols: [cCyl(0.5, 0.18), cCone(1.55 * s, 1.25 * s, 0, 2.35 * s)] });
}
// Busch: vier Ballen in verschiedenen Grüntönen, manchmal mit Blüten
export function bush(x, z, leaf = C.leaf, flowers = ['#ff7ac6', '#fff', '#ffd23f']) {
  const s = R(0.5, 0.8), g = pick(leaf);
  const parts = [P(GE.sph, g, 0, s * 0.7, 0, s, s * 0.85, s), P(GE.sphLo, shade(g, 0.85), s * 0.72, s * 0.48, 0.1, s * 0.68, s * 0.58, s * 0.68),
    P(GE.sphLo, shade(g, 0.92), -s * 0.66, s * 0.45, -s * 0.18, s * 0.6, s * 0.52, s * 0.6), P(GE.sphLo, shade(g, 1.12), -s * 0.2, s * 1.05, -s * 0.3, s * 0.5, s * 0.4, s * 0.5)];
  if (flowers && rnd() < 0.4) for (let i = 0; i < 3; i++) {
    const fc = pick(flowers), fx = R(-s, s) * 0.7, fz = R(-s, s) * 0.6, top = s * 0.7 + s * 0.85 * Math.sqrt(Math.max(0, 1 - (fx * fx + fz * fz) / (s * s)));
    parts.push(P(GE.blob, fc, fx, top, fz, 0.12), P(GE.blob, fc, -fx * 0.7, top - s * 0.25, fz * 0.4 + s * 0.65, 0.1));
  }
  return add(build(parts), x, z, { v: 3, ry: R(0, 6.28), cols: [cBall(s * 0.9, 0, s * 0.75)] });
}

// Gebäude aus Etagen: Jede Etage und das Dach sind eigene Objekte. Beim Fressen fällt das Haus Stück für Stück auseinander.
// st: wall (Farbe), roof ('pitched' | 'flat' | 'none'), roofCol, fh (Etagenhöhe), door, awning, balcony, band, base, ry, vk (Wert-Faktor), tile,
//     flowers (Blumenkästen vorne), solar (Anteil 0–1: Solarzellen auf dem Satteldach), shops (Farbe: gestreifte Markise über dem Erdgeschoss),
//     shutters (Farbe der Fensterläden), win ('house' | 'flat': Fensterart, ab 5 Etagen 'flat'), trim (Farbe der Eckkanten)
const BOX_FLOWERS = ['#ff7ac6', '#ffd23f', '#ff5a4e', '#ffffff', '#9b6bff'];
const lum = hex => { const c = new THREE.Color(hex); return 0.3 * c.r + 0.59 * c.g + 0.11 * c.b; };
// Haustür: Rahmen, Türblatt mit Glaseinsatz und Füllungen, Klinke, Stufe und Wandlampe. Steht ein Stück vor der Wand (vor dem Sockel).
function doorParts(fz, fh, col, trim) {
  const dh = Math.min(2.05, fh - 0.55), dk = shade(col, 0.75);
  return [P(GE.box, trim, 0, (dh + 0.16) / 2, fz + 0.08, 1.34, dh + 0.16, 0.2), P(GE.box, col, 0, dh / 2, fz + 0.19, 1.06, dh, 0.04),
    P(GE.box, '#a8dcf5', 0, dh * 0.76, fz + 0.215, 0.6, dh * 0.24, 0.02), P(GE.box, dk, -0.23, dh * 0.3, fz + 0.215, 0.34, dh * 0.36, 0.02),
    P(GE.box, dk, 0.23, dh * 0.3, fz + 0.215, 0.34, dh * 0.36, 0.02), P(GE.blob, '#ffd23f', 0.38, dh * 0.48, fz + 0.23, 0.05),
    P(GE.box, '#cfc8bc', 0, 0.07, fz + 0.42, 1.7, 0.14, 0.56),
    P(GE.box, '#3a4152', 0.86, dh - 0.05, fz + 0.06, 0.14, 0.24, 0.12), P(GE.box, '#fff3a8', 0.86, dh - 0.07, fz + 0.125, 0.1, 0.15, 0.02)];
}
export function building(x, z, w, d, floors, st = {}) {
  const wall = st.wall || pick(C.wall), fh = st.fh || FH, ry = st.ry || 0, rc = st.roofCol || pick(C.roof), vk = st.vk || 1, tile = st.tile || 2.7;
  const win = st.win || (floors >= 5 ? 'flat' : 'house'), trim = st.trim || (lum(wall) > 0.93 ? '#dde2ea' : '#fdfaf3');
  const nx = Math.max(1, Math.round(w / tile)), tw = w / nx, nz = Math.max(1, Math.round(d / tile)), tz = d / nz, fz = d / 2, door = st.door !== false;
  const gap = door && nx % 2 ? tw : 0;   // ungerade Fensterzahl: An der mittleren Fensterachse sitzt unten die Haustür statt eines Fensters
  const pieces = [];
  for (let k = 0; k < floors; k++) {
    const shop = k === 0 && st.shops, mat = shop ? MAT_SHOP : win === 'flat' ? MAT_FLAT : MAT;
    const parts = [PWall(w, fh, d, 0, fh / 2, 0, wall, tile, fh, k === 0 ? gap : 0)];
    parts.push(P(GE.rbox, st.band || '#ece6da', 0, fh - 0.1, 0, w + 0.25, 0.22, d + 0.25));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) parts.push(P(GE.box, trim, sx * w / 2, fh / 2 - 0.05, sz * d / 2, 0.26, fh - 0.1, 0.26));   // Eckkanten
    if (k === 0) {
      if (st.base !== false) parts.push(P(GE.rbox, '#a39a8c', 0, 0.18, 0, w + 0.2, 0.36, d + 0.2));
      if (door) parts.push(...doorParts(fz, fh, st.doorCol || '#8a5634', trim));
      if (st.awning !== false && fh >= 2.8) { const ac = st.awnCol || rc, ay = Math.min(fh - 0.4, 2.42);   // Vordach über der Tür
        parts.push(P(GE.box, ac, 0, ay, fz + 0.48, 1.8, 0.1, 0.84, 0.12, 0, 0), P(GE.box, shade(ac, 0.8), 0, ay - 0.1, fz + 0.89, 1.8, 0.16, 0.05)); }
      if (st.shops) {   // Läden im Erdgeschoss: gestreifte Markise über die ganze Breite, vorne mit Volant
        const n = Math.max(4, Math.round(w / 0.6)), sw = (w - 0.4) / n;
        for (let i = 0; i < n; i++) { const c = i % 2 ? '#ffffff' : st.shops, cx = -w / 2 + 0.2 + (i + 0.5) * sw;
          parts.push(P(GE.box, c, cx, 2.35, fz + 0.45, sw, 0.1, 0.95, 0.35, 0, 0), P(GE.box, c, cx, 2.08, fz + 0.92, sw, 0.18, 0.04)); }
      }
    } else if (st.balcony) {   // Balkon: Platte, Brüstung mit Handlauf, Seitenteile, manchmal eine Pflanze
      const bw = w * 0.7, bc = st.balcony;
      parts.push(P(GE.box, '#ffffff', 0, 0.1, fz + 0.5, bw, 0.18, 1.0), P(GE.box, bc, 0, 0.5, fz + 0.965, bw, 0.62, 0.07),
        P(GE.box, bc, -bw / 2 + 0.035, 0.5, fz + 0.5, 0.07, 0.62, 0.93), P(GE.box, bc, bw / 2 - 0.035, 0.5, fz + 0.5, 0.07, 0.62, 0.93),
        P(GE.box, '#ffffff', 0, 0.84, fz + 0.965, bw + 0.08, 0.07, 0.14));
      if (chance(0.55)) { const px = LR(-bw * 0.38, bw * 0.38); parts.push(P(GE.box, '#d9774a', px, 0.33, fz + 0.62, 0.32, 0.28, 0.32), P(GE.blob, lpick(C.leaf), px, 0.62, fz + 0.62, 0.26)); }
    }
    if (st.shutters && win === 'house' && !shop) {   // Fensterläden links und rechts jedes Fensters, auf allen vier Seiten
      const sh = fh * 0.47, sy = fh * 0.545, sd = shade(st.shutters, 0.78);
      for (const [len, n, t, alongX] of [[w, nx, tw, true], [d, nz, tz, false]]) {
        const sw = t * 0.18, off = t * 0.25 + sw / 2 + 0.03;
        for (const side of [-1, 1]) for (let i = 0; i < n; i++) for (const s of [-1, 1]) {
          const c = -len / 2 + (i + 0.5) * t + s * off;
          if (alongX && k === 0 && side === 1 && door && Math.abs(c) - sw / 2 < 0.8) continue;   // nicht an der Haustür
          if (alongX) parts.push(P(GE.box, st.shutters, c, sy, side * (fz + 0.04), sw, sh, 0.07), P(GE.box, sd, c, sy, side * (fz + 0.08), sw * 0.55, sh * 0.8, 0.02));
          else parts.push(P(GE.box, st.shutters, side * (w / 2 + 0.04), sy, c, 0.07, sh, sw), P(GE.box, sd, side * (w / 2 + 0.08), sy, c, 0.02, sh * 0.8, sw * 0.55));
        }
      }
    }
    if (st.flowers && fh >= 2.4) {   // Blumenkästen unter den Fenstern der Vorderseite (Zufallszahlen wie bisher, damit die Welt gleich bleibt)
      const fy = fh * 0.29 + 0.02;
      for (let i = 0; i < nx; i++) {
        const cx = -w / 2 + (i + 0.5) * tw, bw = tw * 0.44;
        if ((k === 0 && Math.abs(cx) < 0.9) || rnd() < 0.3) continue;   // nicht vor der Tür, nicht überall
        const fl = [pick(BOX_FLOWERS), pick(BOX_FLOWERS), pick(BOX_FLOWERS)];
        if (shop || win !== 'house') continue;
        parts.push(P(GE.box, '#9a6236', cx, fy, fz + 0.17, bw, 0.2, 0.26), P(GE.box, '#5a3a22', cx, fy + 0.1, fz + 0.17, bw * 0.9, 0.02, 0.2));
        for (let j = 0; j < 5; j++) parts.push(P(GE.blob, j % 2 ? lpick(C.leaf) : fl[j >> 1], cx + (j - 2) * bw / 5.2, fy + 0.17 + LR(0, 0.05), fz + 0.19 + LR(-0.04, 0.04), LR(0.085, 0.115)));
      }
    }
    const cols = [cBox(w / 2, fh / 2, d / 2)];
    pieces.push(add(build(parts, mat), x, z, { y: k * fh, ry, v: Math.max(3, Math.round(w * d * fh / 10 * vk)), cols, fade: true }));
  }
  const top = floors * fh, roof = st.roof || 'flat';
  if (roof === 'pitched') {   // Satteldach: Ziegelflächen mit Überstand, Giebel in Wandfarbe, First, Ortgang, Regenrinnen
    const rh = Math.min(w, d) * (st.rh || R(0.35, 0.5)), W2 = (w + 0.6) / 2, D2 = (d + 0.6) / 2;
    const Wr = w / 2 + 0.05, a = Math.atan2(rh, Wr), ca = Math.cos(a), sa = Math.sin(a), L = Math.hypot(Wr, rh), t = 0.14, len = L + 0.42, D = d + 0.6;
    const on = (s, m, o) => [s * (m * ca + o * sa), rh - m * sa + o * ca];   // Punkt auf der Dachseite s: m Meter vom First abwärts, o Meter über der Fläche
    const wood = '#fbf8f2', parts = [P(GE.prism, wall, 0, 0, 0, 2 * Wr, rh, d)];
    for (const s of [-1, 1]) {
      parts.push(PTiled(len, t, D, rc, 1, 0.9, s > 0, ...on(s, len / 2 - 0.05, t / 2), 0, -s * a));
      for (const e of [-1, 1]) parts.push(P(GE.box, wood, ...on(s, len / 2 - 0.05, t / 2 + 0.03), e * (D / 2 + 0.035), len + 0.04, t + 0.12, 0.07, 0, 0, -s * a));
      parts.push(P(GE.cylLo, '#c9ced8', ...on(s, len - 0.1, -0.05), 0, 0.075, D, 0.075, Math.PI / 2, 0, 0));
    }
    parts.push(P(GE.cylLo, shade(rc, 0.72), 0, rh + t / ca, 0, 0.15, D + 0.08, 0.15, Math.PI / 2, 0, 0));
    if (rh > 1.5) for (const e of [-1, 1]) { const gy = rh * 0.36, gz = e * (d / 2 + 0.03);   // rundes Giebelfenster
      parts.push(P(GE.cyl, wood, 0, gy, gz, 0.34, 0.06, 0.34, Math.PI / 2, 0, 0), P(GE.cyl, '#7fc4ee', 0, gy, gz + e * 0.025, 0.25, 0.04, 0.25, Math.PI / 2, 0, 0),
        P(GE.box, wood, 0, gy, gz + e * 0.05, 0.5, 0.05, 0.02), P(GE.box, wood, 0, gy, gz + e * 0.05, 0.05, 0.5, 0.02)); }
    if (st.chimney !== false && rnd() < 0.6) {   // Schornstein mit Abdeckplatte
      const cx = w * 0.25, cz = d * 0.12, sy = rh * (1 - cx / Wr) + t / ca, ct = Math.max(sy + 0.7, rh + 0.25);
      parts.push(P(GE.box, '#b5674d', cx, (sy - 0.3 + ct) / 2, cz, 0.55, ct - sy + 0.3, 0.55), P(GE.box, '#a2593f', cx, ct - 0.3, cz, 0.57, 0.06, 0.57),
        P(GE.box, '#8e4f3b', cx, ct + 0.06, cz, 0.72, 0.12, 0.72), P(GE.box, '#2a2d36', cx, ct + 0.125, cz, 0.36, 0.01, 0.36));
    }
    if (st.solar && rnd() < st.solar) {   // Solarzellen auf der linken Dachseite (rechts steht der Schornstein), mit Raster
      const m = len * 0.48, pw = L * 0.62, pd = D * 0.6;
      parts.push(P(GE.box, '#26355e', ...on(-1, m, t + 0.04), 0, pw, 0.07, pd, 0, 0, a), P(GE.box, '#6f8fd8', ...on(-1, m, t + 0.08), 0, pw, 0.02, 0.035, 0, 0, a));
      for (const q of [-1, 1]) parts.push(P(GE.box, '#6f8fd8', ...on(-1, m + q * pw / 6, t + 0.08), 0, 0.035, 0.02, pd, 0, 0, a));
    }
    pieces.push(add(build(parts, ROOF_MAT), x, z, { y: top, ry, v: Math.max(2, Math.round(w * d * rh / 20 * vk)), fade: true,
      cols: [cHull([-W2, 0, -D2, W2, 0, -D2, -W2, 0, D2, W2, 0, D2, 0, rh, -D2, 0, rh, D2])] }));
  } else if (roof === 'flat') {   // Flachdach: Attika, Kiesfläche, Klimagerät mit Lüfter, Lüftungsrohre, große Häuser mit Wassertank und Treppenhaus
    const sl = st.slab || '#b9c0cc', W = w + 0.15, Dd = d + 0.15, pc = shade(sl, 1.12), ax = w * 0.2, az = -d * 0.15;
    const parts = [P(GE.rbox, sl, 0, 0.17, 0, W, 0.35, Dd), P(GE.box, shade(sl, 0.88), 0, 0.355, 0, W - 0.5, 0.02, Dd - 0.5),
      P(GE.box, pc, 0, 0.5, Dd / 2 - 0.1, W, 0.32, 0.2), P(GE.box, pc, 0, 0.5, -Dd / 2 + 0.1, W, 0.32, 0.2),
      P(GE.box, pc, W / 2 - 0.1, 0.5, 0, 0.2, 0.32, Dd - 0.4), P(GE.box, pc, -W / 2 + 0.1, 0.5, 0, 0.2, 0.32, Dd - 0.4),
      P(GE.rbox, '#e3e7ee', ax, 0.7, az, 1.3, 0.8, 1.0), P(GE.cylLo, '#3a4152', ax + 0.22, 1.105, az, 0.33, 0.02, 0.33),
      P(GE.box, '#b9c0cc', ax + 0.22, 1.12, az, 0.62, 0.02, 0.07), P(GE.box, '#b9c0cc', ax + 0.22, 1.12, az, 0.07, 0.02, 0.62),
      P(GE.box, '#aab2c0', ax - 0.38, 0.72, az + 0.505, 0.38, 0.5, 0.02)];
    for (const [vx, vz] of [[-w * 0.3, -d * 0.28], [w * 0.05, d * 0.3]]) parts.push(P(GE.cylLo, '#9aa3b5', vx, 0.62, vz, 0.08, 0.55, 0.08), P(GE.cylLo, '#6d7686', vx, 0.91, vz, 0.13, 0.06, 0.13));
    const cols = [cBox(w / 2 + 0.07, 0.17, d / 2 + 0.07, 0, 0.17), cBox(0.65, 0.4, 0.5, w * 0.2, 0.7, -d * 0.15)];
    if (floors >= 4 && rnd() < 0.6) { const tx = -w * 0.22, tq = d * 0.15;   // Wassertank mit Ringen
      parts.push(P(GE.cyl, '#c98a52', tx, 1.55, tq, 0.8, 1.6, 0.8), P(GE.cone, '#8a5634', tx, 2.75, tq, 0.95, 0.8, 0.95),
        P(GE.cylLo, '#8a5634', tx, 1.15, tq, 0.83, 0.07, 0.83), P(GE.cylLo, '#8a5634', tx, 1.95, tq, 0.83, 0.07, 0.83));
      cols.push(cCyl(0.8, 0.8, tx, 1.55, tq)); }
    if (floors >= 5) { const hx = w * 0.26, hz = d * 0.22;   // Treppenhaus-Aufbau mit Tür
      parts.push(P(GE.box, wall, hx, 1.45, hz, 2.4, 2.2, 2.2), P(GE.box, sl, hx, 2.62, hz, 2.6, 0.14, 2.4), P(GE.box, '#3a4152', hx, 1.2, hz + 1.11, 0.9, 1.7, 0.03)); }
    pieces.push(add(build(parts), x, z, { y: top, ry, v: Math.max(2, Math.round(w * d / 12 * vk)), fade: true, cols }));
  }
  for (const p of pieces) p.link = pieces;
  const rw = Math.abs(Math.sin(ry)) > 0.7 ? d : w, rd = Math.abs(Math.sin(ry)) > 0.7 ? w : d;
  const vx = Math.round(Math.sin(ry)), vz = Math.round(Math.cos(ry));   // Vorderseite (dort ist die Tür): etwas mehr Platz lassen
  blocked.push([x - rw / 2 - 0.6 - (vx < 0 ? 0.6 : 0), x + rw / 2 + 0.6 + (vx > 0 ? 0.6 : 0), z - rd / 2 - 0.6 - (vz < 0 ? 0.6 : 0), z + rd / 2 + 0.6 + (vz > 0 ? 0.6 : 0)]);
  return pieces;
}

// ================= Fahrzeuge und Endboss =================
// Räder an die Teile-Liste hängen: list = [[x, z], …] (vorne = +x)
export function wheels(parts, list, r = 0.4, w = 0.3, tire = '#2a2d36', rim = '#d9dde5') {
  for (const [x, z] of list) parts.push(P(GE.cyl, tire, x, r, z, r, w, r, Math.PI / 2), P(GE.cyl, rim, x, r, z * 1.07, r * 0.45, w, r * 0.45, Math.PI / 2),
    P(GE.cylLo, '#8e97a8', x, r, z * 1.07 + Math.sign(z) * (w / 2 + 0.01), r * 0.17, 0.02, r * 0.17, Math.PI / 2));   // Radnabe
}
// Endboss anmelden: passt erst ins Loch, wenn das Loch die ganze Grundfläche (Radius footR) umschließt
export function addBoss(g, x, z, cols, mats, h, footR = 9.5) {
  const o = add(g, x, z, { v: 1500, boss: true, cols, s: 10, mats });
  o.h = h; o.footR = footR; o.need = footR + 1; o.fk = 1;
  setBoss(o); return o;
}
// Kegelstumpf mit beliebigen Radien (für Türme, Silos, Raketen …)
export const tube = (rTop, rBot, h, seg = 28) => new THREE.CylinderGeometry(rTop, rBot, h, seg).toNonIndexed();
