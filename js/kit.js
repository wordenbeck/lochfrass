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
let seed = 7;
export const setSeed = s => { seed = s; };
export const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
export const R = (a, b) => a + rnd() * (b - a);
export const pick = a => a[Math.floor(rnd() * a.length)];
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
const WIN = canvasTex(128, (x, s) => {
  x.fillStyle = '#ffffff'; x.fillRect(0, 0, s, s);
  x.fillStyle = '#e4e4e4'; x.fillRect(0, 121, s, 7);
  const g = x.createLinearGradient(0, 28, 0, 90); g.addColorStop(0, '#6fc3f0'); g.addColorStop(1, '#c9ecff'); x.fillStyle = g; x.fillRect(37, 29, 54, 60);
  x.fillStyle = 'rgba(255,255,255,.75)'; x.beginPath(); x.moveTo(42, 82); x.lineTo(60, 32); x.lineTo(70, 32); x.lineTo(52, 82); x.fill();
  x.fillStyle = '#ffffff'; x.fillRect(62, 29, 4, 60); x.fillRect(37, 57, 54, 4);
  x.strokeStyle = INK; x.lineWidth = 4; x.strokeRect(30, 22, 68, 74); x.lineWidth = 2.5; x.strokeRect(37, 29, 54, 60);
  x.fillStyle = '#fff'; x.fillRect(24, 96, 80, 8); x.lineWidth = 4; x.strokeRect(24, 96, 80, 8);
});
export const MAT = toon({ map: WIN, vertexColors: true });
// Durchsichtige Stufen für Häuser zwischen Kamera und Loch
export const FADE = [0.72, 0.48, 0.3].map(op => { const m = toon({ map: WIN, vertexColors: true, transparent: true, opacity: op, depthWrite: false });
  m.userData = NO_OUTLINE; return m; });

// ================= Grundformen =================
const NI = g => g.index ? g.toNonIndexed() : g;
function prismGeo() { const s = new THREE.Shape(); s.moveTo(-0.5, 0); s.lineTo(0.5, 0); s.lineTo(0, 1); s.closePath();
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
  box: NI(new THREE.BoxGeometry(1, 1, 1)),
  rbox: NI(new RoundedBoxGeometry(1, 1, 1, 2, 0.16)),
  torus: NI(new THREE.TorusGeometry(1, 0.18, 8, 24)),
  dodec: NI(new THREE.DodecahedronGeometry(1)),
  oct: NI(new THREE.OctahedronGeometry(1)),
  legs: NI(new THREE.CapsuleGeometry(0.15, 0.3, 3, 8)),
  torso: NI(new THREE.CapsuleGeometry(0.23, 0.32, 3, 10)),
  cap: NI(new THREE.CapsuleGeometry(0.5, 1, 3, 10)),
  carBody: NI(new RoundedBoxGeometry(3.4, 0.8, 1.7, 3, 0.32)),
  carCab: NI(new RoundedBoxGeometry(1.9, 0.78, 1.5, 3, 0.3)),
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
// Wand mit Fenstern: eine Box, auf deren Seiten sich die Fenster-Kachel wiederholt
export function PWall(w, h, d, x, y, z, hex, tile = 2.7, fh = FH) {
  const g = new THREE.BoxGeometry(w, h, d).toNonIndexed(); g.translate(x, y, z);
  const n = g.attributes.position.count, uv = g.attributes.uv, c = new THREE.Color(hex), a = new Float32Array(n * 3);
  const nx = Math.max(1, Math.round(w / tile)), nz = Math.max(1, Math.round(d / tile)), ny = Math.max(1, Math.round(h / fh));
  for (let i = 0; i < n; i++) {
    const f = Math.floor(i / 6);   // Reihenfolge der Seiten: +x, -x, +y, -y, +z, -z
    if (f === 2 || f === 3) uv.setXY(i, 0.06, 0.5);
    else uv.setXY(i, uv.getX(i) * (f < 2 ? nz : nx), uv.getY(i) * ny);
    a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b;
  }
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
export const TEX = {
  grass: canvasTex(256, (x, s) => { x.fillStyle = '#7ed957'; x.fillRect(0, 0, s, s);
    x.strokeStyle = '#5fb83f'; x.lineWidth = 3; x.lineCap = 'round';
    for (let i = 0; i < 40; i++) { const a = Math.random() * s, b = Math.random() * s; x.beginPath(); x.moveTo(a - 4, b - 6); x.lineTo(a, b); x.lineTo(a + 4, b - 6); x.stroke(); } }),
  asphalt: canvasTex(256, (x, s) => { x.fillStyle = '#4e5566'; x.fillRect(0, 0, s, s); speckle(x, s, '30,34,44', .4, 300); speckle(x, s, '120,128,145', .3, 200); }),
  walk: canvasTex(128, (x, s) => { x.fillStyle = '#f2e9d6'; x.fillRect(0, 0, s, s); x.strokeStyle = '#d6c9ae'; x.lineWidth = 4;
    x.strokeRect(0, 0, 64, 64); x.strokeRect(64, 0, 64, 64); x.strokeRect(0, 64, 64, 64); x.strokeRect(64, 64, 64, 64); }),
  plaza: canvasTex(128, (x, s) => { x.fillStyle = '#f6dfb4'; x.fillRect(0, 0, s, s); x.strokeStyle = '#ddbf8a'; x.lineWidth = 3;
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) x.strokeRect(c * 32 + (r % 2) * 16, r * 32, 32, 32); }),
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
export function person(x, z, o = {}) {
  const parts = [P(GE.legs, o.pants || pick(C.pants), 0, 0.3, 0), P(GE.torso, o.shirt || pick(C.shirt), 0, 0.8, 0),
    P(GE.sph, pick(C.skin), 0, 1.3, 0, 0.21), P(GE.sph, o.hair || pick(C.hair), 0, 1.37, -0.03, 0.22, 0.15, 0.22)];
  if (o.extra) parts.push(...o.extra());
  return add(build(parts), x, z, { v: 1, cols: [cCyl(0.72, 0.24)], walk: walkState(o.sp, 0.08) });
}
export function bin(x, z, cols = C.bin) {
  const c = pick(cols), round = rnd() < 0.5;
  const parts = round
    ? [P(GE.cyl, c, 0, 0.42, 0, 0.32, 0.84, 0.32), P(GE.cyl, shade(c, 0.6), 0, 0.88, 0, 0.36, 0.09, 0.36)]
    : [P(GE.rbox, c, 0, 0.45, 0, 0.62, 0.9, 0.62), P(GE.rbox, shade(c, 0.6), 0, 0.93, 0, 0.68, 0.12, 0.68)];
  return add(build(parts), x, z, { v: 1, cols: [round ? cCyl(0.46, 0.34) : cBox(0.33, 0.49, 0.33)] });
}
// Laterne: Mast + Arm + Leuchte (lang und dünn: kippt gern über die Kante)
export function lamp(x, z, col = '#3a4152', light = '#fff3a8') {
  const m = build([P(GE.cyl, col, 0, 0.18, 0, 0.17, 0.36, 0.17), P(GE.cylLo, col, 0, 1.75, 0, 0.07, 3.4, 0.07),
    P(GE.rbox, col, 0.28, 3.4, 0, 0.65, 0.09, 0.09), P(GE.sph, light, 0.55, 3.25, 0, 0.27, 0.2, 0.27),
    P(GE.cone, col, 0.55, 3.42, 0, 0.32, 0.18, 0.32)]);
  return add(m, x, z, { v: 3, ry: R(0, 6.28), cols: [cCyl(0.18, 0.17), cCyl(1.75, 0.08, 0, 1.75), cBox(0.38, 0.15, 0.16, 0.36, 3.35, 0)] });
}
export function bench(x, z, ry = 0, wood = '#d98c45') {
  const m = build([P(GE.rbox, wood, 0, 0.45, 0, 1.6, 0.12, 0.52), P(GE.rbox, wood, 0, 0.75, -0.22, 1.6, 0.42, 0.1),
    P(GE.rbox, '#3a4152', -0.65, 0.22, 0, 0.1, 0.45, 0.46), P(GE.rbox, '#3a4152', 0.65, 0.22, 0, 0.1, 0.45, 0.46)]);
  return add(m, x, z, { v: 3, ry, cols: [cBox(0.8, 0.26, 0.26, 0, 0.26), cBox(0.8, 0.22, 0.06, 0, 0.75, -0.22)] });
}
export function tree(x, z, leaf = C.leaf, trunk = '#9a6236') {
  const s = R(1, 1.5), g = pick(leaf), g2 = shade(g, 0.85);
  const m = build([P(GE.cyl, trunk, 0, 0.8, 0, 0.18, 1.6, 0.18), P(GE.sph, g, 0, 1.6 + s, 0, s),
    P(GE.sph, g2, s * 0.6, 1.3 + s * 0.8, s * 0.2, s * 0.68), P(GE.sph, g2, -s * 0.55, 1.35 + s * 0.75, -s * 0.25, s * 0.62)]);
  return add(m, x, z, { v: 9, ry: R(0, 6.28), cols: [cCyl(0.8, 0.2), cBall(s * 1.05, 0, 1.6 + s)] });
}
export function pine(x, z, g = '#2f9e5b') {
  const s = R(0.9, 1.3);
  const m = build([P(GE.cyl, '#9a6236', 0, 0.5, 0, 0.16, 1, 0.16), P(GE.cone, g, 0, 1.6 * s, 0, 1.3 * s, 1.6 * s),
    P(GE.cone, shade(g, 1.1), 0, 2.5 * s, 0, 1.0 * s, 1.4 * s), P(GE.cone, shade(g, 1.2), 0, 3.3 * s, 0, 0.7 * s, 1.2 * s)]);
  return add(m, x, z, { v: 9, cols: [cCyl(0.5, 0.18), cCone(1.55 * s, 1.25 * s, 0, 2.35 * s)] });
}
export function bush(x, z, leaf = C.leaf, flowers = ['#ff7ac6', '#fff', '#ffd23f']) {
  const s = R(0.5, 0.8), g = pick(leaf);
  const parts = [P(GE.sph, g, 0, s * 0.7, 0, s, s * 0.85, s), P(GE.sph, shade(g, 0.88), s * 0.7, s * 0.5, 0.1, s * 0.7, s * 0.6, s * 0.7)];
  if (flowers && rnd() < 0.4) for (let i = 0; i < 3; i++) parts.push(P(GE.sph, pick(flowers), R(-s, s) * 0.7, s * 1.35, R(-s, s) * 0.6, 0.12));
  return add(build(parts), x, z, { v: 3, ry: R(0, 6.28), cols: [cBall(s * 0.9, 0, s * 0.75)] });
}

// Gebäude aus Etagen: Jede Etage und das Dach sind eigene Objekte. Beim Fressen fällt das Haus Stück für Stück auseinander.
// st: wall (Farbe), roof ('pitched' | 'flat' | 'none'), roofCol, fh (Etagenhöhe), door, awning, balcony, band, base, ry, vk (Wert-Faktor), tile
export function building(x, z, w, d, floors, st = {}) {
  const wall = st.wall || pick(C.wall), fh = st.fh || FH, ry = st.ry || 0, rc = st.roofCol || pick(C.roof), vk = st.vk || 1;
  const pieces = [];
  for (let k = 0; k < floors; k++) {
    const parts = [PWall(w, fh, d, 0, fh / 2, 0, wall, st.tile || 2.7, fh)];
    parts.push(P(GE.rbox, st.band || '#ece6da', 0, fh - 0.1, 0, w + 0.25, 0.22, d + 0.25));
    if (k === 0) {
      if (st.base !== false) parts.push(P(GE.rbox, '#a39a8c', 0, 0.18, 0, w + 0.2, 0.36, d + 0.2));
      if (st.door !== false) parts.push(P(GE.rbox, st.doorCol || '#8a5634', 0, 1.0, d / 2 + 0.04, 1.1, Math.min(2, fh - 0.6), 0.14),
        P(GE.sph, '#ffd23f', 0.35, 1.0, d / 2 + 0.13, 0.07));
      if (st.awning !== false && fh >= 2.8) parts.push(P(GE.rbox, st.awnCol || rc, 0, 2.2, d / 2 + 0.35, 1.7, 0.12, 0.75));
    } else if (st.balcony) {
      parts.push(P(GE.rbox, '#ffffff', 0, 0.12, d / 2 + 0.5, w * 0.7, 0.18, 1.0), P(GE.rbox, st.balcony, 0, 0.55, d / 2 + 0.95, w * 0.7, 0.7, 0.1));
    }
    const cols = [cBox(w / 2, fh / 2, d / 2)];
    pieces.push(add(build(parts), x, z, { y: k * fh, ry, v: Math.max(3, Math.round(w * d * fh / 10 * vk)), cols, fade: true }));
  }
  const top = floors * fh, roof = st.roof || 'flat';
  if (roof === 'pitched') {
    const rh = Math.min(w, d) * (st.rh || R(0.35, 0.5)), W2 = (w + 0.6) / 2, D2 = (d + 0.6) / 2;
    const parts = [P(GE.prism, rc, 0, -0.05, 0, w + 0.6, rh, d + 0.6)];
    if (st.chimney !== false && rnd() < 0.6) parts.push(P(GE.rbox, '#b5674d', w * 0.25, rh * 0.5, d * 0.12, 0.55, rh * 0.95, 0.55));
    pieces.push(add(build(parts), x, z, { y: top, ry, v: Math.max(2, Math.round(w * d * rh / 20 * vk)), fade: true,
      cols: [cHull([-W2, 0, -D2, W2, 0, -D2, -W2, 0, D2, W2, 0, D2, 0, rh, -D2, 0, rh, D2])] }));
  } else if (roof === 'flat') {
    const parts = [P(GE.rbox, st.slab || '#b9c0cc', 0, 0.17, 0, w + 0.15, 0.35, d + 0.15), P(GE.rbox, '#e3e7ee', w * 0.2, 0.7, -d * 0.15, 1.3, 0.8, 1.0)];
    const cols = [cBox(w / 2 + 0.07, 0.17, d / 2 + 0.07, 0, 0.17), cBox(0.65, 0.4, 0.5, w * 0.2, 0.7, -d * 0.15)];
    if (floors >= 4 && rnd() < 0.6) { parts.push(P(GE.cyl, '#c98a52', -w * 0.22, 1.55, d * 0.15, 0.8, 1.6, 0.8), P(GE.cone, '#8a5634', -w * 0.22, 2.75, d * 0.15, 0.95, 0.8, 0.95));
      cols.push(cCyl(0.8, 0.8, -w * 0.22, 1.55, d * 0.15)); }
    pieces.push(add(build(parts), x, z, { y: top, ry, v: Math.max(2, Math.round(w * d / 12 * vk)), fade: true, cols }));
  }
  for (const p of pieces) p.link = pieces;
  const rw = Math.abs(Math.sin(ry)) > 0.7 ? d : w, rd = Math.abs(Math.sin(ry)) > 0.7 ? w : d;
  blocked.push([x - rw / 2 - 0.6, x + rw / 2 + 0.6, z - rd / 2 - 0.6, z + rd / 2 + 1.2]);
  return pieces;
}
