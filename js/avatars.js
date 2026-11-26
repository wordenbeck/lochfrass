// Lochfrass! – Avatare: Löcher mit Gesicht, freigespielt mit Punkten
// Alles ist für ein Loch mit Radius 1 gebaut und wird mit dem Loch mitskaliert. Norden (−z) = oben im Bild.
import { THREE, P, GE, build, INK, canvasTex, NO_OUTLINE } from './kit.js';

export const AVATARS = [
  { id: 'dino', name: 'Dino', emoji: '🦖', pts: 5000, cols: ['#4cc552', '#3aa346', '#4cc552', '#2f8f3a'] },
  { id: 'hai', name: 'Hai', emoji: '🦈', pts: 20000, cols: ['#6f92ad', '#9bbcd3'] },
  { id: 'frosch', name: 'Frosch', emoji: '🐸', pts: 40000, cols: ['#7ed957', '#5cb83f'] },
  { id: 'krake', name: 'Krake', emoji: '🐙', pts: 70000, cols: ['#b05cff', '#d391ff'] },
  { id: 'drache', name: 'Drache', emoji: '🐉', pts: 110000, cols: ['#e63946', '#9d1b28', '#e63946', '#ff8a3d'] },
  { id: 'monster', name: 'Monster', emoji: '👾', pts: 160000, cols: ['#7b5cff', '#a58bff'] },
  { id: 'robo', name: 'Roboter', emoji: '🤖', pts: 220000, cols: ['#b8c0cf', '#7d8799'], spin: 0.4 },
  { id: 'ufo', name: 'UFO', emoji: '🛸', pts: 300000, cols: ['#c9d1e0', '#39e58c', '#c9d1e0', '#9b6bff'], spin: 1.2 },
  { id: 'vulkan', name: 'Vulkan', emoji: '🌋', pts: 400000, cols: ['#ff5a1f', '#ffb000'], spin: 0.5, pulse: true },
  { id: 'schwarz', name: 'Schwarzes Loch', emoji: '🌀', pts: 500000, cols: ['#ffb347', '#fff1c1', '#ff7b00'], spin: 2, pulse: true },
];
for (const a of AVATARS) a.avatar = true;

const TAU = Math.PI * 2, NORTH = -Math.PI / 2;
const at = (a, r) => [Math.cos(a) * r, Math.sin(a) * r];
const basic = (color, o = {}) => { const m = new THREE.MeshBasicMaterial({ color, toneMapped: false, ...o }); m.userData = NO_OUTLINE; return m; };
// Zahn: Kegel, der zur Lochmitte zeigt
const tooth = (a, r, y, w, l, col = '#ffffff') => { const [x, z] = at(a, r); return P(GE.cone, col, x, y, z, w, l, w, 0, -a, Math.PI / 2); };
const teethRing = (parts, n, r, y, w, l, skip = null, off = 0, col) => {
  for (let i = 0; i < n; i++) { const a = off + i / n * TAU; if (skip && skip(a)) continue; parts.push(tooth(a, r, y, w, l, col)); }
};
const isNorth = (a, w = 0.7) => Math.abs(Math.atan2(Math.sin(a - NORTH), Math.cos(a - NORTH))) < w;
// Augen: Weiß + Pupillen als eigenes Mesh (zum Blinzeln und Schauen)
function eyePair(g, { dx = 0.34, z = -1.2, y = 0.24, r = 0.2, white = '#ffffff', pupil = INK, pr = 0.5, slit = false, n = 2 } = {}) {
  const w = [], p = [];
  const xs = n === 3 ? [-dx, 0, dx] : [-dx, dx];
  xs.forEach((x, i) => {
    const rr = n === 3 && i === 1 ? r * 1.25 : r, zz = n === 3 && i === 1 ? z - 0.08 : z;
    w.push(P(GE.sph, white, x, y, zz, rr));
    p.push(slit ? P(GE.box, pupil, x, y + rr * 0.35, zz + rr * 0.72, rr * 0.22, rr * 1.2, rr * 0.3) : P(GE.sph, pupil, x, y + rr * 0.3, zz + rr * 0.68, rr * pr));
  });
  const eyes = new THREE.Group(), wm = build(w), pm = build(p);
  wm.castShadow = pm.castShadow = false; eyes.add(wm, pm); g.add(eyes);
  return { eyes, pm, blinkT: 2 + Math.random() * 3 };
}
function blink(e, t, dt) {
  e.blinkT -= dt;
  const k = e.blinkT < 0 ? Math.max(0.1, Math.abs(e.blinkT + 0.09) / 0.09) : 1;
  e.eyes.scale.y = k; if (e.blinkT < -0.18) e.blinkT = 2.5 + Math.random() * 3;
}
const add = (g, parts) => { const m = build(parts); m.castShadow = false; g.add(m); return m; };

// Baut die Deko für einen Avatar. Rückgabe: Gruppe + Animation (t = Zeit, dt, h = Loch)
export function makeDeco(av) {
  const g = new THREE.Group(), parts = [];
  let anim = () => {};
  if (av.id === 'dino') {
    teethRing(parts, 16, 0.99, 0.09, 0.06, 0.22, a => isNorth(a, 0.5));
    for (const a of [-2.45, -2.0, NORTH, -1.15, -0.7]) { const [x, z] = at(a, 1.33), hh = a === NORTH ? 0.5 : 0.38;
      parts.push(P(GE.cone, '#ffb000', x, hh / 2, z, 0.13, hh, 0.13)); }
    for (const s of [-1, 1]) parts.push(P(GE.sph, '#3aa346', s * 0.34, 0.16, -1.24, 0.27, 0.22, 0.27));
    add(g, parts);
    const e = eyePair(g, { dx: 0.34, z: -1.22, y: 0.27, r: 0.17 });
    anim = (t, dt) => blink(e, t, dt);
  } else if (av.id === 'hai') {
    teethRing(parts, 22, 0.99, 0.09, 0.055, 0.2);
    teethRing(parts, 22, 0.9, 0.06, 0.045, 0.15, null, Math.PI / 22);
    add(g, parts);
    const fin = new THREE.Group(), fm = add(fin, [P(GE.fin, '#6f92ad', 1.42, 0, 0, 0.7, 0.75, 1, 0, Math.PI / 2, 0), P(GE.fin, '#ffffff', 1.42, 0, 0, 0.42, 0.22, 1.25, 0, Math.PI / 2, 0)]);
    void fm; g.add(fin);
    anim = (t, dt) => { fin.rotation.y += dt * 1.1; fin.position.y = Math.sin(t * 3) * 0.03; };
  } else if (av.id === 'frosch') {
    for (const s of [-1, 1]) { parts.push(P(GE.sph, '#6cc84a', s * 0.44, 0.18, -1.12, 0.36, 0.32, 0.36), P(GE.sph, '#ff9fb7', s * 1.12, 0.05, 0.35, 0.22, 0.08, 0.16)); }
    add(g, parts);
    const e = eyePair(g, { dx: 0.44, z: -1.14, y: 0.36, r: 0.24, pr: 0.55 });
    const tongue = new THREE.Group(), tm = add(tongue, [P(GE.box, '#ff6f91', 0, 0, 0.5, 0.16, 0.05, 1), P(GE.sph, '#ff6f91', 0, 0, 1, 0.16, 0.07, 0.16)]);
    void tm; tongue.position.y = 0.12; tongue.scale.z = 0.001; g.add(tongue);
    let tt = 2;
    anim = (t, dt) => { blink(e, t, dt); tt -= dt; const k = tt < 0 ? Math.sin(Math.min(1, -tt / 0.35) * Math.PI) : 0;
      tongue.scale.z = Math.max(0.001, k * 1.9); tongue.visible = k > 0.01; if (tt < -0.35) tt = 2.5 + Math.random() * 2.5; };
  } else if (av.id === 'krake') {
    parts.push(P(GE.sph, '#b05cff', 0, 0.12, -1.38, 0.62, 0.32, 0.42));
    add(g, parts);
    const e = eyePair(g, { dx: 0.26, z: -1.28, y: 0.36, r: 0.15 });
    const arms = [];
    for (let i = 0; i < 7; i++) {
      const a = NORTH + 0.95 + i / 6 * (TAU - 1.9), arm = new THREE.Group(), tp = [];
      [[1.12, 0.17], [1.36, 0.145], [1.58, 0.115], [1.76, 0.085]].forEach(([r, s], k) => tp.push(P(GE.sph, k % 2 ? '#c27aff' : '#b05cff', r, 0.08, 0, s, s * 0.7, s)));
      add(arm, tp); arm.rotation.y = -a; g.add(arm); arms.push({ arm, a, ph: i * 0.9 });
    }
    anim = (t, dt) => { blink(e, t, dt); for (const k of arms) { k.arm.rotation.y = -k.a + Math.sin(t * 2.2 + k.ph) * 0.18; k.arm.rotation.x = Math.sin(t * 3 + k.ph) * 0.12; } };
  } else if (av.id === 'drache') {
    teethRing(parts, 14, 0.99, 0.09, 0.06, 0.2, a => isNorth(a, 0.55), 0, '#fff6d6');
    for (let i = 0; i < 12; i++) { const a = NORTH + 0.75 + i / 11 * (TAU - 1.5), [x, z] = at(a, 1.22);
      parts.push(P(GE.cone, '#7a1420', x, 0.16, z, 0.1, 0.34, 0.1, 0, -a, -0.6)); }
    for (const s of [-1, 1]) { parts.push(P(GE.cone, '#fff1c9', s * 0.38, 0.42, -1.42, 0.1, 0.55, 0.1, -0.6, 0, s * -0.25),
      P(GE.sph, '#c62a37', s * 0.34, 0.16, -1.24, 0.27, 0.2, 0.27)); }
    add(g, parts);
    const e = eyePair(g, { dx: 0.34, z: -1.22, y: 0.27, r: 0.16, white: '#ffd23f', slit: true });
    const smoke = [];
    const sm = new THREE.MeshToonMaterial({ color: 0x9aa0aa, transparent: true, opacity: 0.85 }); sm.userData = NO_OUTLINE;
    for (let i = 0; i < 4; i++) { const m = new THREE.Mesh(GE.sph, sm); m.scale.setScalar(0.001); g.add(m); smoke.push({ m, t: i * 0.35 }); }
    anim = (t, dt) => { blink(e, t, dt); for (const s of smoke) { s.t += dt; const k = (s.t % 1.4) / 1.4;
      s.m.position.set((k < 0.5 ? -0.12 : 0.12) + Math.sin(s.t * 3) * 0.05, 0.25 + k * 1.1, -1.05 - k * 0.3); s.m.scale.setScalar(0.05 + Math.sin(k * Math.PI) * 0.16); } };
  } else if (av.id === 'monster') {
    for (let i = 0; i < 44; i++) { const a = i / 44 * TAU + Math.random() * 0.05, r = 1.1 + Math.random() * 0.12, [x, z] = at(a, r), s = 0.1 + Math.random() * 0.08;
      parts.push(P(GE.sphLo, i % 3 ? '#7b5cff' : '#9e85ff', x, s * 0.6, z, s)); }
    for (const a of [1.25, 1.9]) parts.push(tooth(a, 0.97, 0.1, 0.1, 0.36));
    add(g, parts);
    const e = eyePair(g, { dx: 0.42, z: -1.2, y: 0.3, r: 0.17, n: 3 });
    anim = (t, dt) => { blink(e, t, dt); e.pm.position.set(Math.sin(t * 2.3) * 0.03, 0, Math.cos(t * 1.7) * 0.03); };
  } else if (av.id === 'robo') {
    for (let i = 0; i < 8; i++) { const [x, z] = at(i / 8 * TAU + 0.2, 1.075); parts.push(P(GE.sphLo, '#4b5262', x, 0.1, z, 0.045)); }
    parts.push(P(GE.cylLo, '#4b5262', 0, 0.45, -1.32, 0.03, 0.9, 0.03), P(GE.rbox, '#7d8799', 0, 0.12, -1.25, 0.9, 0.22, 0.3));
    add(g, parts);
    const saw = new THREE.Group(), sp = [];
    teethRing(sp, 24, 0.96, 0.08, 0.06, 0.18, null, 0, '#e3e7ee');
    add(saw, sp); g.add(saw);
    const screen = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.12, 0.05), basic(0x39e5ff)); screen.position.set(0, 0.2, -1.09); g.add(screen);
    const led = new THREE.Mesh(GE.sph, basic(0xff4136)); led.scale.setScalar(0.09); led.position.set(0, 0.95, -1.32); g.add(led);
    anim = (t, dt) => { saw.rotation.y -= dt * 2.4; led.visible = Math.floor(t * 2.5) % 2 === 0;
      screen.material.color.setHSL(0.52 + Math.sin(t * 3) * 0.04, 1, 0.6); };
  } else if (av.id === 'ufo') {
    const lights = [];
    for (let i = 0; i < 12; i++) { const [x, z] = at(i / 12 * TAU, 1.1), m = new THREE.Mesh(GE.sph, basic(0xffffff)); m.scale.setScalar(0.065); m.position.set(x, 0.11, z); g.add(m); lights.push(m); }
    const bm = basic(0x5dff9a, { transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.98, 0.7, 1.9, 40, 1, true).translate(0, 0.95, 0), bm); g.add(beam);
    anim = (t) => { lights.forEach((m, i) => m.material.color.setHSL(((i / 12) + t * 0.6) % 1, 0.9, 0.62)); bm.opacity = 0.14 + Math.sin(t * 4) * 0.07; };
  } else if (av.id === 'vulkan') {
    for (let i = 0; i < 18; i++) { const a = i / 18 * TAU + Math.random() * 0.1, [x, z] = at(a, 1.16 + Math.random() * 0.12), s = 0.13 + Math.random() * 0.12;
      parts.push(P(GE.dodec, i % 2 ? '#5a4636' : '#74604c', x, s * 0.55, z, s, s * 0.8, s, Math.random() * 3, Math.random() * 3, 0)); }
    add(g, parts);
    const lm = basic(0xff7a1a); const lava = new THREE.Mesh(new THREE.RingGeometry(0.84, 1.0, 48).rotateX(-Math.PI / 2), lm); lava.position.y = 0.075; g.add(lava);
    const sparks = [];
    for (let i = 0; i < 8; i++) { const m = new THREE.Mesh(GE.sphLo, basic(0xffb000)); m.scale.setScalar(0.05); g.add(m); sparks.push({ m, t: Math.random(), vx: 0, vz: 0, vy: 0 }); }
    anim = (t, dt) => { lm.color.setHSL(0.06 + Math.sin(t * 5) * 0.03, 1, 0.55);
      for (const s of sparks) { s.t -= dt; if (s.t <= 0) { const a = Math.random() * TAU, r = Math.random() * 0.7; s.m.position.set(Math.cos(a) * r, 0.1, Math.sin(a) * r);
          s.vx = Math.cos(a) * 0.6; s.vz = Math.sin(a) * 0.6; s.vy = 2.2 + Math.random(); s.t = 0.9; }
        s.vy -= 5 * dt; s.m.position.x += s.vx * dt; s.m.position.y += s.vy * dt; s.m.position.z += s.vz * dt; s.m.visible = s.m.position.y > 0; } };
  } else if (av.id === 'schwarz') {
    const tex = canvasTex(256, (x, s) => {
      const c = s / 2; x.clearRect(0, 0, s, s);
      for (let k = 0; k < 5; k++) { x.strokeStyle = ['#fff1c1', '#ffb347', '#ff7b00', '#ffd27a', '#ff9a3d'][k]; x.lineWidth = 7 - k; x.globalAlpha = 0.75;
        x.beginPath(); for (let i = 0; i <= 80; i++) { const a = i / 80 * TAU * 1.6 + k * 1.26, r = c * (0.52 + i / 80 * 0.46); i ? x.lineTo(c + Math.cos(a) * r, c + Math.sin(a) * r) : x.moveTo(c + Math.cos(a) * r, c + Math.sin(a) * r); } x.stroke(); }
    });
    const dm = basic(0xffffff, { map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    const disk = new THREE.Mesh(new THREE.PlaneGeometry(4.3, 4.3).rotateX(-Math.PI / 2), dm); disk.position.y = 0.09; g.add(disk);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.99, 1.06, 64).rotateX(-Math.PI / 2), basic(0xfff6e0)); ring.position.y = 0.1; g.add(ring);
    const halo = new THREE.Mesh(new THREE.TorusGeometry(1.32, 0.035, 8, 64), basic(0xffb347)); halo.rotation.x = Math.PI / 2 - 0.42; halo.position.y = 0.35; g.add(halo);
    anim = (t, dt) => { disk.rotation.y -= dt * 1.8; halo.rotation.z += dt * 0.5; };
  }
  return { g, anim };
}
