// Lochfrass! – echte Physik mit der Rapier-Engine
// Idee: Jedes Loch hat einen unsichtbaren „Kragen“: einen Ring aus Boden um das Loch mit einer Wand nach unten.
// Dinge in Lochnähe werden echte Körper und liegen auf diesem Kragen. So kippen sie über die Kante,
// verkanten sich, rollen und fallen hinein. Alles weiter weg bleibt fest stehen (spart Rechenzeit).
import RAPIER from 'rapier';
import { MAP } from './kit.js';

await RAPIER.init();

const OBJ = 1 << 15, GROUND = 1 << 14;
const G = (mem, fil) => (((mem & 0xffff) << 16) | (fil & 0xffff)) >>> 0;
const FIXED = G(OBJ, OBJ);              // stehende Dinge
const FAR = G(OBJ, OBJ | GROUND);       // bewegliche Dinge weit weg vom Loch: liegen auf dem normalen Boden
const FREE = G(OBJ, 0);                 // fällt frei durch (z. B. im Schacht steckengeblieben)
const nearG = i => G(OBJ, OBJ | (1 << i));   // bewegliche Dinge am Loch i: liegen auf dessen Kragen
const N = 24, DEPTH = 30, WIDTH = 18;   // Kragen: 24 Stücke, 30 tief, 18 breit

// Sog wie bei hole.io: was durchs Loch passt, wird an der Kante zur Mitte gezogen und über dem Loch nach unten
const SUCK = 12, DOWN_G = 1.2;
let DOWN = 36;

export let world = null;
const active = [];
export function init(gravity = -30) {
  world = new RAPIER.World({ x: 0, y: gravity, z: 0 });
  DOWN = DOWN_G * Math.max(30, Math.abs(gravity));   // der Sog nach unten ist überall gleich stark, auch auf dem Mond
  const gb = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
  world.createCollider(RAPIER.ColliderDesc.cuboid(MAP + 60, 5, MAP + 60).setTranslation(0, -5, 0)
    .setCollisionGroups(G(GROUND, OBJ)).setFriction(0.7), gb);
}

const _e = { x: 0, y: 0, z: 0 }, _q = { x: 0, y: 0, z: 0, w: 1 };
function quatFromEuler(rx, ry, rz) {   // Reihenfolge XYZ wie bei three.js
  const c1 = Math.cos(rx / 2), c2 = Math.cos(ry / 2), c3 = Math.cos(rz / 2), s1 = Math.sin(rx / 2), s2 = Math.sin(ry / 2), s3 = Math.sin(rz / 2);
  return { x: s1 * c2 * c3 + c1 * s2 * s3, y: c1 * s2 * c3 - s1 * c2 * s3, z: c1 * c2 * s3 + s1 * s2 * c3, w: c1 * c2 * c3 - s1 * s2 * s3 };
}
function colDesc(c) {
  const [a0, a1, a2] = c.a;
  let d = null;
  if (c.t === 'box') d = RAPIER.ColliderDesc.cuboid(a0, a1, a2);
  else if (c.t === 'cyl') d = RAPIER.ColliderDesc.cylinder(a0, a1);
  else if (c.t === 'cone') d = RAPIER.ColliderDesc.cone(a0, a1);
  else if (c.t === 'ball') d = RAPIER.ColliderDesc.ball(a0);
  else if (c.t === 'hull') d = RAPIER.ColliderDesc.convexHull(c.a instanceof Float32Array ? c.a : new Float32Array(c.a));
  if (!d) return null;
  d.setTranslation(c.p[0], c.p[1], c.p[2]);
  if (c.r) d.setRotation(quatFromEuler(c.r[0], c.r[1], c.r[2]));
  return d.setFriction(c.f ?? 0.6).setRestitution(c.e ?? 0.12);
}
function makeBody(o, dynamic) {
  const p = o.g.position, q = o.g.quaternion;
  const desc = (dynamic ? RAPIER.RigidBodyDesc.dynamic() : RAPIER.RigidBodyDesc.fixed())
    .setTranslation(p.x, p.y, p.z).setRotation({ x: q.x, y: q.y, z: q.z, w: q.w })
    .setCanSleep(false).setLinearDamping(0.05).setAngularDamping(0.2);
  const b = world.createRigidBody(desc);
  for (const c of o.cols) { const d = colDesc(c); if (d) world.createCollider(d.setCollisionGroups(FIXED).setDensity(o.dens || 1), b); }
  o.body = b; o.grp = FIXED; return b;
}
// stehendes Objekt bekommt einen festen Körper (andere Dinge prallen daran ab)
export function addStatic(o) { makeBody(o, false); }
export function removeBody(o) {
  if (o.body) { world.removeRigidBody(o.body); o.body = null; }
  const i = active.indexOf(o); if (i >= 0) active.splice(i, 1);
  o.ph = 0;
}
function setGroups(o, g) {
  if (o.grp === g) return; o.grp = g;
  const b = o.body; for (let i = 0, n = b.numColliders(); i < n; i++) b.collider(i).setCollisionGroups(g);
}
function activate(o, hi) {
  if (o.ph === 1 || o.gone) return;
  if (o.body) o.body.setBodyType(RAPIER.RigidBodyType.Dynamic, true); else makeBody(o, true);
  o.ph = 1; o.home = hi; o.near = true; o.sinkT = 0; o.sunk = false; o.jamT = 0; o.grp = -1; setGroups(o, nearG(hi));
  const b = o.body;
  if (o.walk) { const w = o.walk; b.setLinvel({ x: w.dx * w.sp, y: 0, z: w.dz * w.sp }, true); }
  else if (o.drive) { const a = o.g.rotation.y; b.setLinvel({ x: Math.cos(a) * o.drive.sp, y: 0, z: -Math.sin(a) * o.drive.sp }, true); }
  active.push(o);
  if (o.link) for (const s of o.link) activate(s, hi);   // ein Haus wird als Ganzes beweglich
}
const upY = q => 1 - 2 * (q.x * q.x + q.z * q.z);   // wie aufrecht steht etwas (1 = senkrecht)
function deactivate(o, cb) {
  const b = o.body, q = b.rotation();
  if (o.walk || (o.drive && cb.resume(o))) {   // Leute laufen weiter, Autos fahren weiter
    const yaw = Math.atan2(2 * (q.w * q.y + q.x * q.z), 1 - 2 * (q.y * q.y + q.z * q.z));
    world.removeRigidBody(b); o.body = null; o.ph = 0;
    o.g.position.y = 0; o.g.rotation.set(0, yaw, 0);
  } else {
    if (o.drive) o.drive = null;   // aus der Spur geschubst: bleibt stehen
    b.setBodyType(RAPIER.RigidBodyType.Fixed, true); b.setLinvel({ x: 0, y: 0, z: 0 }, false); b.setAngvel({ x: 0, y: 0, z: 0 }, false);
    o.ph = 0; setGroups(o, FIXED);
  }
  active.splice(active.indexOf(o), 1);
}

// ---------- Kragen um jedes Loch ----------
function buildCollar(h, c, R) {
  for (const col of c.cols) world.removeCollider(col, false);
  c.cols.length = 0; c.R = R;
  const Ri = R / Math.cos(Math.PI / N), Ro = Ri + WIDTH;
  for (let i = 0; i < N; i++) {
    const a0 = i / N * Math.PI * 2, a1 = (i + 1) / N * Math.PI * 2, pts = [];
    for (const r of [Ri, Ro]) for (const a of [a0, a1]) for (const y of [0, -DEPTH]) pts.push(Math.cos(a) * r, y, Math.sin(a) * r);
    const d = RAPIER.ColliderDesc.convexHull(new Float32Array(pts));
    c.cols.push(world.createCollider(d.setCollisionGroups(G(1 << h.idx, OBJ)).setFriction(0.6).setRestitution(0.05), c.body));
  }
}
function syncCollar(h) {
  let c = h.collar;
  if (!c) c = h.collar = { body: world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0, -500, 0)), cols: [], R: 0, on: false };
  if (!h.alive) { if (c.on) { c.body.setTranslation({ x: 0, y: -500, z: 0 }, true); c.on = false; } return; }
  if (!c.cols.length || Math.abs(h.rShow - c.R) > c.R * 0.02) buildCollar(h, c, h.rShow);
  // Teleport statt Schieben: so zieht der Kragen nichts mit, was nur auf ihm liegt
  c.body.setTranslation({ x: h.x, y: 0, z: h.z }, true); c.on = true;
}

// ---------- ein Zeitschritt ----------
// cb.sink(o, h): etwas rutscht gerade ins Loch · cb.eat(o, h): ganz verschluckt · cb.jam(o): verkantet am Spielerloch · cb.resume(o): darf ein Auto weiterfahren?
export function step(dt, holes, objects, cb) {
  for (const h of holes) syncCollar(h);
  // Dinge in Lochnähe werden beweglich
  for (const o of objects) {
    if (o.ph !== 0 || o.boss || o.gone) continue;
    const p = o.g.position;
    for (const h of holes) {
      if (!h.alive || o.s > h.rShow * 2.4) continue;   // viel zu groß: bewegt sich ohnehin nicht
      if (Math.hypot(p.x - h.x, p.z - h.z) - h.rShow < o.rad + 0.5) { activate(o, h.idx); break; }
    }
  }
  // bewegliche Dinge: welchem Loch gehören sie, laufen sie weiter, stecken sie fest?
  for (let i = active.length - 1; i >= 0; i--) {
    const o = active[i], b = o.body, p = b.translation();
    let bh = null, bd = 1e9;
    for (const h of holes) { if (!h.alive) continue; const d = Math.hypot(p.x - h.x, p.z - h.z) - h.rShow; if (d < bd) { bd = d; bh = h; } }
    const home = holes[o.home];
    if (home.alive && o.grp !== FREE && o.s < home.rShow && p.y > -6) {   // Sog
      const R = home.rShow, dx = home.x - p.x, dz = home.z - p.z, d = Math.hypot(dx, dz);
      if (d < R + 0.4) {
        const m = b.mass(), l = d || 1, k = SUCK * m * dt / l;
        b.applyImpulseAtPoint({ x: dx * k, y: 0, z: dz * k }, p, true);   // waagerecht am Fuß: Hohes kippt so nicht um
        if (d < R * 0.95) {   // über dem Loch nach unten; Großes auf der Lochseite, damit es hineinkippt statt quer liegen zu bleiben
          const lev = o.s > R * 0.5 ? Math.min(d, o.rad * 0.5) : 0;
          b.applyImpulseAtPoint({ x: 0, y: -DOWN * m * dt, z: 0 }, { x: p.x + dx / l * lev, y: p.y, z: p.z + dz / l * lev }, true);
        }
      }
    }
    if (p.y < -0.05) {   // hängt schon teilweise im Loch
      if (!home.alive) setGroups(o, FREE);
      else {
        if (!o.sunk && p.y < -0.3) { o.sunk = true; cb.sink(o, home); }
        if (o.sunk && (o.sinkT += dt) > 2.2) setGroups(o, FREE);   // im Schacht verklemmt: rutscht durch
      }
      continue;
    }
    if (bh && bd < o.rad + (o.near ? 1.6 : 1.0)) { o.near = true; o.home = bh.idx; if (o.grp !== FREE) setGroups(o, nearG(bh.idx)); }
    else { o.near = false; setGroups(o, FAR); }
    const q = b.rotation(), up = upY(q);
    if (o.walk && up > 0.93) { const w = o.walk, v = b.linvel(); b.setLinvel({ x: w.dx * w.sp, y: v.y, z: w.dz * w.sp }, true); }   // läuft weiter
    else if (o.drive && up > 0.96) {   // fährt geradeaus weiter (vorne = lokale x-Achse)
      const v = b.linvel(), fx = 1 - 2 * (q.y * q.y + q.z * q.z), fz = 2 * (q.x * q.z - q.w * q.y), l = Math.hypot(fx, fz) || 1;
      b.setLinvel({ x: fx / l * o.drive.sp, y: v.y, z: fz / l * o.drive.sp }, true); }
    // schräg am Rand des Spielerlochs hängengeblieben?
    if (home.isPlayer && o.near && up < 0.9 && !o.jamDone) {
      const v = b.linvel(); if (v.x * v.x + v.y * v.y + v.z * v.z < 0.3) { if ((o.jamT += dt) > 1.2) { o.jamDone = true; cb.jam(o); } } else o.jamT = 0;
    }
    if (!o.near && bd > o.rad + 2) {   // weit weg vom Loch und zur Ruhe gekommen: wieder fest
      const v = b.linvel(), w = b.angvel();
      const slow = v.x * v.x + v.y * v.y + v.z * v.z < 0.15 && w.x * w.x + w.y * w.y + w.z * w.z < 0.3;
      if (slow || (o.walk && up > 0.93) || (o.drive && up > 0.96)) deactivate(o, cb);
    }
  }
  // rechnen: bei 60 oder 120 Bildern pro Sekunde ein Schritt, bei weniger mehrere
  const n = Math.max(1, Math.ceil(dt / (1 / 60) - 0.01)); world.timestep = dt / n;
  for (let k = 0; k < n; k++) world.step();
  // Bild an die Physik anpassen, Verschlucktes melden
  for (let i = active.length - 1; i >= 0; i--) {
    const o = active[i], b = o.body, p = b.translation(), q = b.rotation();
    o.g.position.set(p.x, p.y, p.z); o.g.quaternion.set(q.x, q.y, q.z, q.w);
    if (p.y < -Math.min(14, Math.max(1.6, o.size + 0.6)) || p.y < -40) {
      world.removeRigidBody(b); o.body = null; o.gone = true; active.splice(i, 1);
      const home = holes[o.home]; cb.eat(o, home && home.alive ? home : null);
    }
  }
}
export const activeCount = () => active.length;
