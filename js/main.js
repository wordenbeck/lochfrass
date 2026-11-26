// Lochfrass! – Hauptprogramm: Spieler, Löcher, Gegner, Anzeige, Menüs
import { THREE, scene, objects, MAP, ROADS, INK, NO_OUTLINE, toon, canvasTex, MAT, FADE, rand, clamp, getBoss, laneOf } from './kit.js';
import { OutlineEffect } from 'three/addons/effects/OutlineEffect.js';
import * as PH from './physics.js';
import { AVATARS, makeDeco } from './avatars.js';

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = n => Math.round(n).toLocaleString('de-DE');

// ================= Welten =================
const WORLDS = [
  { id: 'vorstadt', name: 'Vorstadt', gen: 'der Vorstadt', icon: '🏘️', boss: 'Riesenturm' },
];

// ================= Einstellungen =================
const ROUND_TIME = 120;                         // 2 Minuten wie im Original
const R0 = 0.6;                                 // Startgröße des Lochs
const MODES = {
  klassik: { label: 'Klassik', desc: 'Sammle in 2 Minuten die meisten Punkte. Wer geschluckt wird, ist nach 3 Sekunden wieder dabei.' },
  solo: { label: 'Solo', desc: 'Ohne Gegner: Schluck in 2 Minuten so viel wie möglich.' },
  battle: { label: 'Battle', desc: 'Wer geschluckt wird, ist raus. Das letzte Loch gewinnt, bei Zeitablauf zählen die Punkte.' },
};
const SOLO_STARS = [0.25, 0.5, 0.8];            // Anteil der Welt für 1/2/3 Sterne im Solo-Modus
// Schwierigkeit: s0/s1 = Tempo der Gegner am Anfang/Ende der Anlaufzeit (ramp, Sekunden)
// grow = wie schnell Gegner wachsen (1 = so schnell wie du), huntDelay = ab wann sie dich im Klassik-Modus jagen, battleHunt = dasselbe im Battle-Modus
// stars = Punkte für 1/2/3 Sterne im Klassik-Modus, als Vielfaches des Weltwerts (mit Combo geht es über 1 hinaus)
const DIFFS = {
  leicht: { label: 'Leicht', bots: 3, grow: 0.75, s0: 0.55, s1: 0.8, ramp: 90, huntPlayer: false, huntDelay: 999, battleHunt: 50, smart: 0.55,
    stars: [0.45, 1.4, 2.9], desc: 'Gegner bleiben gemütlich und jagen dich nie.',
    bdesc: 'Gegner bleiben gemütlich und jagen dich erst ab Sekunde 50.' },
  normal: { label: 'Normal', bots: 3, grow: 0.95, s0: 0.65, s1: 0.92, ramp: 60, huntPlayer: true, huntDelay: 40, battleHunt: 30, smart: 0.8,
    stars: [0.4, 1.2, 2.6], desc: 'Gegner starten langsam, werden flotter und jagen dich ab Sekunde 40.',
    bdesc: 'Gegner starten langsam, werden flotter und jagen dich ab Sekunde 30.' },
  schwer: { label: 'Schwer', bots: 4, grow: 1.05, s0: 0.75, s1: 0.95, ramp: 40, huntPlayer: true, huntDelay: 25, battleHunt: 20, smart: 0.9,
    stars: [0.3, 0.9, 2.0], desc: '4 Gegner, schnell auf Tempo, jagen dich schon ab Sekunde 25.',
    bdesc: '4 Gegner, schnell auf Tempo, jagen dich ab Sekunde 20.' },
};
const SKINS = [
  { id: 'minze', name: 'Minze', stars: 0, cols: ['#2fd3b9'] },
  { id: 'koralle', name: 'Koralle', stars: 1, cols: ['#ff5a4e'] },
  { id: 'gold', name: 'Gold', stars: 3, cols: ['#ffd23f', '#ff9f1c'], spin: 0.6 },
  { id: 'bonbon', name: 'Bonbon', stars: 5, cols: ['#ff7ac6', '#9b6bff'], spin: 0.8 },
  { id: 'regenbogen', name: 'Regenbogen', stars: 8, rainbow: true, spin: 1 },
  { id: 'lava', name: 'Lava', stars: 12, cols: ['#ff3d00', '#ffb300', '#ff3d00', '#ffe066'], spin: 1.6, pulse: true },
  { id: 'galaxie', name: 'Galaxie', stars: 16, cols: ['#6a5cff', '#00e5ff', '#ff4fd8'], spin: 1.2, pulse: true },
];
const LOOKS = [...SKINS, ...AVATARS];
const BOTS = [['Mampf', '#ff8a3d'], ['Schlürf', '#ffd23f'], ['Krümel', '#9b6bff'], ['Happs', '#4f8bff']];
const TIERS = [[0.6, 'Kanaldeckel'], [1.2, 'Gully'], [2.2, 'Krater'], [4.5, 'Schlund'], [8, 'Abgrund'], [11, 'Schwarzes Loch'], [999, '']];
// Stufen der XP-Leiste: bei welchem Loch-Radius die nächste Stufe erreicht ist
const STAGES = [0.6, 0.7, 0.95, 1.5, 1.75, 2.35, 4.95, 8.5, 10.55];
const STAGE_NAMES = ['Klein', 'Laternen', 'Büsche', 'Autos', 'Bäume', 'Brunnen', 'Häuser', 'Blöcke', 'Endboss'];   // nur für Testausgaben
let GROWTH = 0.28;
let GROWTH_EXP = 0.5;
const radiusFor = m => R0 + GROWTH * Math.pow(m, GROWTH_EXP);
const massFor = r => r <= R0 ? 0 : Math.pow((r - R0) / GROWTH, 1 / GROWTH_EXP);   // Umkehrung: welche Masse für Radius r
let shownStage = -1;

// ================= Speicher (nur lokal auf dem Gerät) =================
const store = {
  get(k, d) { try { const v = localStorage.getItem('lochfrass-' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('lochfrass-' + k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem('lochfrass-' + k); } catch {} },
};
// Spieler-Profile: jeder hat eigene Sterne, Bestwerte, Punkte und Löcher
const newProfile = name => ({ name, points: 0, rounds: 0, look: 'minze', world: 'vorstadt', mode: 'klassik', diff: 'normal', stars: {}, best: {} });
const newId = () => 'p' + Date.now().toString(36) + Math.floor(Math.random() * 1000);
let PROF = store.get('profiles', null);
if (!PROF || !Array.isArray(PROF.list)) {   // erster Start mit Profilen: alten Spielstand übernehmen
  PROF = { list: [], cur: null };
  const p = newProfile('Spieler 1'); let any = false;
  const take = (oldKey, newKey) => { const s = store.get('stars-1-' + oldKey, 0), b = store.get('best-1-' + oldKey, 0);
    if (s) { p.stars['vorstadt|' + newKey] = s; any = true; } if (b) { p.best['vorstadt|' + newKey] = b; any = true; } };
  take('solo', 'solo');
  for (const d of Object.keys(DIFFS)) { take(d, 'klassik-' + d); take('battle-' + d, 'battle-' + d); }
  if (any) {
    p.look = store.get('skin', 'minze'); p.mode = store.get('mode', 'klassik'); p.diff = store.get('diff', 'normal');
    const id = newId(); PROF.list.push({ id, name: p.name }); PROF.cur = id; store.set('p-' + id, p);
  }
  store.set('profiles', PROF);
}
const loadProfile = id => ({ ...newProfile('?'), ...store.get('p-' + id, {}) });
let meId = PROF.cur && PROF.list.some(p => p.id === PROF.cur) ? PROF.cur : null;
let me = meId ? loadProfile(meId) : null;
const saveMe = () => { if (meId) store.set('p-' + meId, me); };
const saveProf = () => store.set('profiles', PROF);
// Wie geht es nach dem Laden weiter? auto = sofort spielen, menu = Hauptmenü, sonst „Wer spielt?“
let boot = null;
try { boot = sessionStorage.getItem('lochfrass-boot'); sessionStorage.removeItem('lochfrass-boot'); } catch {}
const reloadTo = mode => { try { sessionStorage.setItem('lochfrass-boot', mode); } catch {} location.reload(); };

// Sterne: Klassik und Battle je Schwierigkeit, Solo einmal → 21 Sterne pro Welt
let worldId = me && WORLDS.some(w => w.id === me.world) ? me.world : WORLDS[0].id;
const WORLD = WORLDS.find(w => w.id === worldId);
const sKey = (m, d, w = worldId) => w + '|' + (m === 'solo' ? 'solo' : m + '-' + d);
const starsOf = (m, d, w = worldId) => me ? (me.stars[sKey(m, d, w)] || 0) : 0;
const modeMax = m => m === 'solo' ? 3 : Object.keys(DIFFS).length * 3;
const modeStars = (m, w = worldId) => m === 'solo' ? starsOf('solo', null, w) : Object.keys(DIFFS).reduce((s, d) => s + starsOf(m, d, w), 0);
const worldStars = w => Object.keys(MODES).reduce((s, m) => s + modeStars(m, w), 0);
const totalStars = (p = me) => p ? Object.values(p.stars).reduce((s, v) => s + v, 0) : 0;
const MAX_WORLD = Object.keys(MODES).reduce((s, m) => s + modeMax(m), 0), MAX_STARS = MAX_WORLD * WORLDS.length;
let modeKey = me && MODES[me.mode] ? me.mode : 'klassik';
let diffKey = me && DIFFS[me.diff] ? me.diff : 'normal';
const lookById = id => LOOKS.find(l => l.id === id) || SKINS[0];
const lookOk = (l, p = me) => l.avatar ? (p ? p.points : 0) >= l.pts : totalStars(p) >= l.stars;
const myLook = () => { const l = me ? lookById(me.look) : SKINS[0]; return lookOk(l) ? l : SKINS[0]; };

// ================= Sound: wird im Browser erzeugt, keine Audio-Dateien =================
const SND = (() => {
  let ctx = null, out = null, noiseBuf = null, on = store.get('sound', true), lastPlop = 0;
  // iPad: Ton darf erst nach einer Berührung starten, deshalb init() bei jedem Antippen
  function init() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      ctx = new AC(); out = ctx.createGain(); out.gain.value = on ? 0.55 : 0; out.connect(ctx.destination);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state !== 'running') ctx.resume();
  }
  const ok = () => ctx && on && ctx.state === 'running';
  function tone(type, f0, f1, dur, vol, delay = 0) {
    if (!ok()) return;
    const t = ctx.currentTime + delay, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(dur, vol, freq, delay = 0) {
    if (!ok()) return;
    const t = ctx.currentTime + delay, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; s.loop = true; f.type = 'lowpass'; f.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(out); s.start(t); s.stop(t + dur + 0.05);
  }
  return {
    init,
    get on() { return on; },
    toggle() { on = !on; store.set('sound', on); if (out) out.gain.value = on ? 0.55 : 0; },
    plop(v) {   // kleine Dinge klingen hell, größere tiefer
      const now = performance.now(); if (now - lastPlop < 55) return; lastPlop = now;
      const f = 700 / Math.sqrt(v) * (0.9 + Math.random() * 0.2); tone('sine', f * 1.8, f * 0.7, 0.13, 0.22);
    },
    thud(k) { tone('sine', 150, 38, 0.5, 0.4 + k * 0.3); noise(0.4 + k * 0.4, 0.16 + k * 0.2, 380); },
    levelUp() { [523, 659, 784, 1047].forEach((f, i) => tone('triangle', f, f * 1.01, 0.2, 0.2, i * 0.085)); },
    combo(m) { const f = 520 * Math.pow(1.19, m); tone('square', f, f * 1.5, 0.12, 0.06); tone('triangle', f * 1.5, f * 2, 0.15, 0.1, 0.06); },
    gulp() { tone('sine', 420, 70, 0.45, 0.4); tone('triangle', 260, 50, 0.5, 0.2, 0.05); },
    lose() { [392, 330, 262].forEach((f, i) => tone('triangle', f, f * 0.97, 0.26, 0.2, i * 0.2)); },
    rumble() { noise(3, 0.45, 160); tone('sine', 70, 28, 3, 0.45); },
    tick(hi) { tone('square', hi ? 1320 : 880, hi ? 1320 : 880, 0.08, 0.08); },
    jingle(stars) {
      const seq = stars >= 2 ? [523, 659, 784, 1047, 1319] : stars === 1 ? [523, 659, 784] : [392, 330];
      seq.forEach((f, i) => tone('triangle', f, f, 0.24, 0.2, i * 0.11));
    },
  };
})();
for (const ev of ['pointerdown', 'touchend', 'click', 'keydown']) addEventListener(ev, () => SND.init(), { passive: true });

// ================= Welt bauen =================
$('loadTxt').textContent = 'Baue ' + WORLD.name + ' …';
const WM = await import(`./world-${worldId}.js`);
WM.create();
const ENV = WM.env;
const BOSS = getBoss();
PH.init(ENV.gravity ?? -30);
for (const o of objects) if (!o.walk && !o.drive) PH.addStatic(o);   // alles Stehende bekommt einen festen Körper
const movers = objects.filter(o => o.walk || o.drive);
const TOTAL = objects.length;
const TOTAL_VALUE = objects.reduce((s, o) => s + o.v, 0);

// ================= Renderer, Comic-Look =================
const renderer = new THREE.WebGLRenderer({ antialias: true, stencil: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
document.body.prepend(renderer.domElement);
const effect = new OutlineEffect(renderer, { defaultThickness: 0.0075, defaultColor: [0.11, 0.14, 0.2] });   // Konturlinien
scene.background = ENV.bg ? ENV.bg() : canvasTex(4, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, ENV.sky[0]); g.addColorStop(1, ENV.sky[1]); x.fillStyle = g; x.fillRect(0, 0, w, h); }, 256);
scene.fog = new THREE.Fog(ENV.fog, 100, 300);
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.5, 500);
scene.add(new THREE.HemisphereLight(ENV.hemi[0], ENV.hemi[1], ENV.hemi[2]));
const sun = new THREE.DirectionalLight(ENV.sun[0], ENV.sun[1]);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.bias = -0.0008;
sun.shadow.normalBias = 0.03;
scene.add(sun, sun.target);

// ================= Löcher (Spieler + Gegner) =================
const maskMat = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false, stencilWrite: true, stencilRef: 1,
  stencilFunc: THREE.AlwaysStencilFunc, stencilZPass: THREE.ReplaceStencilOp });
const circleGeo = new THREE.CircleGeometry(1, 64);
const wellGeo = new THREE.CylinderGeometry(1, 1, 30, 64, 1, true).translate(0, -15, 0);
{ const pos = wellGeo.attributes.position, col = [];
  for (let i = 0; i < pos.count; i++) { const k = pos.getY(i) > -1 ? 1 : 0; col.push(0.06 * k, 0.07 * k, 0.13 * k); }
  wellGeo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); }
const wellMat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false });
const blackMat = new THREE.MeshBasicMaterial({ color: 0x000000, fog: false });
for (const m of [maskMat, wellMat, blackMat]) m.userData = NO_OUTLINE;
const RING = new THREE.RingGeometry(1, 1.15, 96, 3);
const GLOW = new THREE.RingGeometry(1.15, 1.55, 96, 1);

function skinColor(s, t) {
  if (s.rainbow) return new THREE.Color().setHSL(t, 0.85, 0.55);
  const c = s.cols; if (c.length === 1) return new THREE.Color(c[0]);
  const f = t * c.length, i = Math.floor(f) % c.length;
  return new THREE.Color(c[i]).lerp(new THREE.Color(c[(i + 1) % c.length]), f - Math.floor(f));
}
function skinCss(s) {
  if (s.rainbow) return 'conic-gradient(#ff4d4d,#ffd23f,#5ccf3f,#2fd3e0,#4f8bff,#c86bff,#ff4d4d)';
  return s.cols.length === 1 ? s.cols[0] : `conic-gradient(${[...s.cols, s.cols[0]].join(',')})`;
}
const lookIcon = (l, size) => `<span class="lk" style="width:${size}px;height:${size}px;background:${skinCss(l)}">${l.avatar ? `<em style="font-size:${Math.round(size * 0.52)}px">${l.emoji}</em>` : ''}</span>`;
function paintRim(h) {
  const s = h.skin;
  const rg = RING.clone(), pos = rg.attributes.position, col = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), r = Math.hypot(x, y), t = (Math.atan2(y, x) / (Math.PI * 2) + 1) % 1;
    const c = skinColor(s, t);
    const k = r < 1.01 ? 0.12 : r < 1.06 ? 0.75 : r < 1.11 ? 1.15 : 0.12;   // dunkle Konturen innen + außen, heller Wulst
    col.set([Math.min(1, c.r * k), Math.min(1, c.g * k), Math.min(1, c.b * k)], i * 3);
  }
  rg.setAttribute('color', new THREE.BufferAttribute(col, 3));
  if (h.rim.geometry !== RING) h.rim.geometry.dispose(); h.rim.geometry = rg;
  const gg = GLOW.clone(), gp = gg.attributes.position, gc = new Float32Array(gp.count * 4);
  for (let i = 0; i < gp.count; i++) {
    const x = gp.getX(i), y = gp.getY(i), r = Math.hypot(x, y), c = skinColor(s, (Math.atan2(y, x) / (Math.PI * 2) + 1) % 1);
    gc.set([c.r, c.g, c.b, r < 1.2 ? 0.55 : 0], i * 4);
  }
  gg.setAttribute('color', new THREE.BufferAttribute(gc, 4));
  if (h.glow.geometry !== GLOW) h.glow.geometry.dispose(); h.glow.geometry = gg;
}
// Aussehen setzen: Farbe oder Avatar (mit Gesicht, Zähnen …)
function setLook(h, look) {
  h.skin = look; paintRim(h);
  if (h.deco) { h.decoGrp.remove(h.deco.g); h.deco = null; }
  if (look.avatar) { h.deco = makeDeco(look); h.decoGrp.add(h.deco.g); }
}
const holes = [];
function makeHole(name, skin, isPlayer) {
  const grp = new THREE.Group();
  const mask = new THREE.Mesh(circleGeo, maskMat); mask.rotation.x = -Math.PI / 2; mask.position.y = 0.05; mask.renderOrder = -10;
  const well = new THREE.Mesh(wellGeo, wellMat);
  const bottom = new THREE.Mesh(circleGeo, blackMat); bottom.rotation.x = -Math.PI / 2; bottom.position.y = -30;
  const rimMat = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }); rimMat.userData = NO_OUTLINE;
  const rim = new THREE.Mesh(RING, rimMat); rim.rotation.x = -Math.PI / 2; rim.position.y = 0.07;
  const glowMat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, toneMapped: false }); glowMat.userData = NO_OUTLINE;
  const glow = new THREE.Mesh(GLOW, glowMat); glow.rotation.x = -Math.PI / 2; glow.position.y = 0.06;
  grp.add(mask, well, bottom, rim, glow); scene.add(grp);
  const decoGrp = new THREE.Group(); scene.add(decoGrp);
  const h = { idx: holes.length, name, skin, isPlayer, grp, rim, glow, decoGrp, deco: null, x: 0, z: 0, mass: 0, score: 0, r: R0, rShow: R0, px: 0, pz: 0, speed: 0,
    alive: true, dead: 0, grace: 2, think: 0, tx: 0, tz: 0, kills: 0, lastKill: -99, pulse: 0, cn: 0, ct: 0, cm: 1, out: false, place: 0, by: null, rel: '', lock: 0, collar: null };
  setLook(h, skin);
  if (!isPlayer) { h.tag = document.createElement('div'); h.tag.className = 'tag'; h.tag.textContent = name; document.body.appendChild(h.tag); }
  holes.push(h); return h;
}
function spawn(h) {
  for (let tries = 0; tries < 60; tries++) {
    h.x = rand(-MAP + 15, MAP - 15); h.z = rand(-MAP + 15, MAP - 15);
    if (holes.every(o => o === h || Math.hypot(o.x - h.x, o.z - h.z) > 35)) break;
  }
  h.mass = 0; h.r = h.rShow = R0; h.alive = true; h.grace = 2.5; h.grp.visible = true; h.px = h.x; h.pz = h.z; h.lock = 0;
}
const player = makeHole('Du', myLook(), true);
player.x = 0; player.z = 4;
let bots = [];

// ================= Effekte: Staubwolken + Welle beim Stufenaufstieg =================
const PUFFS = [], puffMat = toon({ color: ENV.dust ?? 0xf6f1e7 }), puffGeo = new THREE.SphereGeometry(1, 12, 9);
for (let i = 0; i < 70; i++) { const m = new THREE.Mesh(puffGeo, puffMat); m.visible = false; scene.add(m); PUFFS.push({ m, t: 0, life: 1, s: 1, vx: 0, vy: 0, vz: 0 }); }
let puffI = 0;
function puff(x, z, n, size, spread = 0, ang = null) {
  for (let i = 0; i < n; i++) {
    const p = PUFFS[puffI = (puffI + 1) % PUFFS.length];
    const a = ang === null ? Math.random() * 6.283 : ang, r = Math.random() * spread, sp = size * rand(1.2, 2.2);
    p.m.position.set(x + Math.cos(a) * r, size * 0.4, z + Math.sin(a) * r);
    p.vx = Math.cos(a) * sp; p.vz = Math.sin(a) * sp; p.vy = size * rand(1.2, 2.4);
    p.life = p.t = rand(0.55, 0.85); p.s = size * rand(0.55, 0.9); p.m.scale.setScalar(0.01); p.m.visible = true;
  }
}
function puffRing(h, n) {   // Wolkenkranz rund um ein Loch
  const size = Math.min(2.4, 0.35 + h.rShow * 0.18);
  for (let i = 0; i < n; i++) { const a = i / n * 6.283; puff(h.x + Math.cos(a) * h.rShow * 1.1, h.z + Math.sin(a) * h.rShow * 1.1, 1, size, 0, a); }
}
function updatePuffs(dt) {
  const damp = Math.pow(0.04, dt);
  for (const p of PUFFS) {
    if (p.t <= 0) continue;
    p.t -= dt; if (p.t <= 0) { p.m.visible = false; continue; }
    const k = 1 - p.t / p.life, m = p.m;
    m.position.x += p.vx * dt; m.position.y += p.vy * dt; m.position.z += p.vz * dt;
    p.vx *= damp; p.vy *= damp; p.vz *= damp;
    m.scale.setScalar(Math.max(0.01, p.s * Math.sin(Math.PI * Math.pow(k, 0.6))));   // schnell aufblähen, langsam verpuffen
  }
}
const waveMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
waveMat.userData = NO_OUTLINE;
const wave = new THREE.Mesh(new THREE.RingGeometry(1, 1.14, 72), waveMat);
wave.rotation.x = -Math.PI / 2; wave.visible = false; scene.add(wave);
let waveT = 0;

// ================= Steuerung =================
const keys = {};
addEventListener('keydown', e => { if (e.target.tagName !== 'INPUT') keys[e.key.toLowerCase()] = true; });
addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
const drag = { on: false, sx: 0, sy: 0, cx: 0, cy: 0, id: null };
const joy = $('joy'), knob = $('knob');
renderer.domElement.addEventListener('pointerdown', e => {
  Object.assign(drag, { on: true, sx: e.clientX, sy: e.clientY, cx: e.clientX, cy: e.clientY, id: e.pointerId });
  joy.style.left = e.clientX + 'px'; joy.style.top = e.clientY + 'px'; joy.style.display = 'block'; knob.style.transform = '';
});
addEventListener('pointermove', e => {
  if (!drag.on || e.pointerId !== drag.id) return;
  drag.cx = e.clientX; drag.cy = e.clientY;
  let dx = drag.cx - drag.sx, dy = drag.cy - drag.sy; const l = Math.hypot(dx, dy);
  if (l > 52) { dx *= 52 / l; dy *= 52 / l; }
  knob.style.transform = `translate(${dx}px,${dy}px)`;
});
const endDrag = e => { if (e.pointerId === drag.id) { drag.on = false; joy.style.display = 'none'; } };
addEventListener('pointerup', endDrag); addEventListener('pointercancel', endDrag);

function moveHole(h, ix, iz, dt, f = 1) {
  const l = Math.hypot(ix, iz); if (l > 1) { ix /= l; iz /= l; }
  const sp = (5 + h.rShow * 0.75) * f;   // klein ≈ 5,5, groß ≈ 13 Einheiten pro Sekunde
  h.x = clamp(h.x + ix * sp * dt, -MAP + h.rShow, MAP - h.rShow);
  h.z = clamp(h.z + iz * sp * dt, -MAP + h.rShow, MAP - h.rShow);
}

// ================= Gegner-KI =================
let D = DIFFS[diffKey], elapsed = 0;
const ramp = () => clamp(elapsed / D.ramp, 0, 1);
function think(b, smart, mayHuntPlayer) {
  let fx = 0, fz = 0, threat = false;
  for (const o of holes) {   // vor Größeren fliehen
    if (o === b || !o.alive || o.r < b.r * 1.25) continue;
    const d = Math.hypot(o.x - b.x, o.z - b.z);
    if (d < o.r + 7) { fx += (b.x - o.x) / (d || 1); fz += (b.z - o.z) / (d || 1); threat = true; }
  }
  if (threat) {
    let tx = clamp(b.x + fx * 12, -MAP + 8, MAP - 8), tz = clamp(b.z + fz * 12, -MAP + 8, MAP - 8);
    if (Math.hypot(tx - b.x, tz - b.z) < 4) { tx = clamp(b.x - fz * 12, -MAP + 8, MAP - 8); tz = clamp(b.z + fx * 12, -MAP + 8, MAP - 8); }   // in der Ecke: seitlich weg
    b.tx = tx; b.tz = tz; return;
  }
  for (const o of holes) {   // Kleinere jagen
    if (o === b || !o.alive || o.grace > 0 || o.r * 1.3 > b.r) continue;
    if (o.isPlayer && !mayHuntPlayer) continue;
    if (Math.hypot(o.x - b.x, o.z - b.z) < (modeKey === 'battle' ? 24 : 16)) { b.tx = o.x; b.tz = o.z; return; }
  }
  if (b.isPlayer && !BOSS.gone && !BOSS.sinking && b.rShow >= BOSS.need && Math.random() < smart) {   // Autopilot folgt dem Pfeil zum Endboss
    b.tx = BOSS.g.position.x; b.tz = BOSS.g.position.z; return;
  }
  if (Math.random() > smart) { b.tx = clamp(b.x + rand(-20, 20), -MAP, MAP); b.tz = clamp(b.z + rand(-20, 20), -MAP, MAP); return; }
  const R = b.rShow, skip = b.skip || (b.skip = new Map());
  if (skip.size > 300) skip.clear();
  let best = null, bestVal = 0, curVal = 0;
  for (const o of objects) {   // sonst: lohnendstes Objekt in der Nähe, das ins Loch passt
    if (o.gone || o.boss || o.s > R * 0.9) continue;
    const p = o.g.position; if (p.y < -0.3) continue;
    if (skip.get(o) > elapsed) continue;
    if (o.size * 0.5 > R * 0.9) { const q = o.g.quaternion; if (1 - 2 * (q.x * q.x + q.z * q.z) < 0.5) continue; }   // liegt quer: passt erst später
    const val = o.v / (Math.hypot(p.x - b.x, p.z - b.z) + 4);
    if (o === b.tgt) curVal = val;
    if (val > bestVal) { bestVal = val; best = o; }
  }
  if (curVal > bestVal * 0.7) best = b.tgt;   // beim alten Ziel bleiben, wenn es fast genauso gut ist
  if (best) {
    const c = best.ph === 1 && best.body ? best.body.worldCom() : best.g.position;
    let tx = c.x, tz = c.z;
    // dasselbe Ding (oder dasselbe Haus) schon eine Weile direkt dran?
    const same = b.tgt && (best === b.tgt || (best.link && best.link === b.tgt.link));
    if (same && Math.hypot(c.x - b.x, c.z - b.z) < R + best.rad + 0.5) {
      if (!b.closeSince) b.closeSince = elapsed || 0.001;
      else if (elapsed - b.closeSince > 4) { for (const o of best.link || [best]) skip.set(o, elapsed + 8); b.closeSince = 0; }   // klappt nicht: erst mal etwas anderes
    } else b.closeSince = 0;
    if (best.s > R * 0.45) {   // Großes leicht versetzt anfahren: dann kippt es über die Kante ins Loch
      let ax = b.x - c.x, az = b.z - c.z; const l = Math.hypot(ax, az) || 1, off = Math.min(best.rad * 0.3, R * 0.4);
      ax /= l; az /= l;
      if (b.closeSince && elapsed - b.closeSince > 0.8) { b.wig = (b.wig || 0) + 1.3; ax = Math.cos(b.wig) * 1.3; az = Math.sin(b.wig) * 1.3; }   // hängt fest: rundherum wackeln
      tx += ax * off; tz += az * off;
    }
    b.tgt = best; b.tx = tx; b.tz = tz;
  } else { b.tx = rand(-MAP + 10, MAP - 10); b.tz = rand(-MAP + 10, MAP - 10); }
}

// ================= Anzeige =================
const card = $('card'), board = $('board');
const CROWN = '<svg viewBox="0 0 44 34"><path d="M5 30 L3 9 L14 17 L22 4 L30 17 L41 9 L39 30 Z" fill="#ffd23f" stroke="#1d2433" stroke-width="3.5" stroke-linejoin="round"/>' +
  '<path d="M6 25 H38" stroke="#1d2433" stroke-width="3"/><circle cx="22" cy="19" r="3.2" fill="#ff5a4e" stroke="#1d2433" stroke-width="2"/></svg>';
$('crown').innerHTML = CROWN;
let pops = 0;
function popup(text, h, color = '#fff') {
  if (pops > 7) return;   // nicht zu viele Zahlen gleichzeitig
  const p = new THREE.Vector3(h.x, 1, h.z).project(camera);
  const el = document.createElement('div'); el.className = 'pop'; el.textContent = text; el.style.color = color;
  el.style.left = (p.x + 1) / 2 * innerWidth + 'px'; el.style.top = (1 - p.y) / 2 * innerHeight + 'px';
  document.body.appendChild(el); pops++; setTimeout(() => { el.remove(); pops--; }, 800);
}
function flash(text) {
  const m = $('msg'); m.textContent = text; m.style.opacity = 1; m.classList.remove('pop2'); void m.offsetWidth; m.classList.add('pop2');
  clearTimeout(flash.t); flash.t = setTimeout(() => m.style.opacity = 0, 1500);
}
const dot = h => `<span class="dot" style="background:${skinCss(h.skin)}"></span>`;
function feed(a, b, dbl) {   // Kill-Meldung oben in der Mitte, höchstens 3 gleichzeitig
  const txt = a.isPlayer ? `${dot(a)}Du hast ${dot(b)}${b.name} geschluckt` : b.isPlayer ? `${dot(a)}${a.name} hat ${dot(b)}dich geschluckt`
    : `${dot(a)}${a.name} hat ${dot(b)}${b.name} geschluckt`;
  const el = document.createElement('div'); el.className = 'kf' + (a.isPlayer ? ' me' : b.isPlayer ? ' bad' : '');
  el.innerHTML = txt + (dbl ? ' · <b>Doppel-Kill!</b>' : '');
  const f = $('feed'); f.prepend(el); while (f.children.length > 3) f.lastChild.remove();
  setTimeout(() => el.classList.add('out'), 2800); setTimeout(() => el.remove(), 3300);
}
function showCombo(m) { const c = $('combo'); c.textContent = 'COMBO x' + m; c.classList.add('on'); c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); }
const hideCombo = () => $('combo').classList.remove('on');
const sndBtn = $('snd'), paintSnd = () => sndBtn.classList.toggle('off', !SND.on);
sndBtn.onclick = () => { SND.init(); SND.toggle(); paintSnd(); };
paintSnd();
const starStr = n => '★'.repeat(n) + '<span style="color:#e3e6ee">★</span>'.repeat(3 - n);
const starScores = () => D.stars.map(f => Math.round(TOTAL_VALUE * f / 50) * 50);
function findLeader() {   // wer die Krone trägt: meiste Punkte (im Solo niemand)
  if (modeKey === 'solo') return null;
  let best = null;
  for (const h of holes) if (!h.out && h.score > 0 && (!best || h.score > best.score)) best = h;
  return best;
}
function levelUp(st) {
  flash(`Stufe ${st + 1}!`);
  const sb = $('sizeBox'); sb.classList.remove('up'); void sb.offsetWidth; sb.classList.add('up');
  SND.levelUp(); waveT = 0.7; waveMat.color.copy(skinColor(player.skin, 0)); puffRing(player, 12);
}
function updateHud() {
  const s = Math.max(0, Math.ceil(timeLeft));
  $('time').textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  $('time').classList.toggle('warn', running && s <= 10);
  $('score').textContent = player.score;
  $('pct').textContent = Math.floor(eatenValue / TOTAL_VALUE * 100) + '%';
  $('alive').textContent = holes.filter(h => !h.out).length + ' übrig';
  let i = 0; while (player.rShow >= TIERS[i + 1][0]) i++;
  $('holeName').textContent = TIERS[i][1];
  // XP = gefressene Masse; jede Stufe braucht die Masse, bei der das Loch einen bestimmten Radius erreicht
  let st = 0; while (st + 1 < STAGES.length && player.mass >= massFor(STAGES[st + 1])) st++;
  if (st > shownStage && running && shownStage >= 0) levelUp(st);
  shownStage = st;
  $('stage').textContent = 'Stufe ' + (st + 1);
  if (st + 1 < STAGES.length) {
    const a = massFor(STAGES[st]), b = massFor(STAGES[st + 1]);
    $('bar').style.width = clamp((player.mass - a) / (b - a), 0, 1) * 100 + '%';
    $('xpTxt').textContent = `${Math.floor(player.mass - a)} / ${Math.ceil(b - a)} XP`;
  } else { $('bar').style.width = '100%'; $('xpTxt').textContent = 'MAX'; }
  $('bar').style.background = skinCss(player.skin);
  const need = BOSS.need, ready = player.rShow >= need;
  if (ready && running && !bossEaten && !bossReadyShown) { bossReadyShown = true; flash('Bereit für den Endboss!'); }
  $('bossBox').classList.toggle('ready', ready);
  $('bossTxt').textContent = bossEaten ? 'Endboss geschluckt!' : BOSS.sinking ? 'Endboss fällt!' : ready ? 'Endboss: jetzt schlucken!' : 'Endboss: ' + WORLD.boss;
  $('bossBar').style.width = (bossEaten ? 100 : clamp(player.rShow / need, 0, 1) * 100) + '%';
  leader = findLeader();
  const list = modeKey === 'battle' ? [...holes].sort((a, b) => (a.out - b.out) || (a.out ? a.place - b.place : b.score - a.score))
    : [...holes].sort((a, b) => b.score - a.score);
  board.innerHTML = list.map(h => `<div class="${h.isPlayer ? 'me' : ''}${h.out ? ' out' : ''}"><span>${h === leader ? `<span class="crown">${CROWN}</span>` : dot(h)}${h.isPlayer && me ? esc(me.name) : h.name}</span><span>${h.score}</span></div>`).join('');
}

// ================= Menüs =================
function hideLoading() { const l = $('loading'); if (l) l.remove(); }
// 1. Wer spielt?
function renderWho(edit = false) {
  hideLoading(); $('overlay').style.display = 'flex';
  card.innerHTML = `
    <h1 class="h1s">Lochfrass!</h1>
    <p class="lvl">Wer spielt?</p>
    <div class="who">${PROF.list.map(p => { const d = loadProfile(p.id), lk = lookById(d.look);
      return `<button class="ptile" data-p="${p.id}">${lookIcon(lookOk(lk, d) ? lk : SKINS[0], 66)}<b>${esc(d.name)}</b><small>🏆 ${fmt(d.points)}</small>${edit ? '<span class="del">✕</span>' : ''}</button>`; }).join('')}
      ${edit ? '' : '<button class="ptile add" id="addP"><span class="plus">+</span><b>Neu</b><small>Spieler anlegen</small></button>'}</div>
    ${PROF.list.length ? `<button class="link" id="editP">${edit ? 'Fertig' : 'Spieler löschen'}</button>` : ''}`;
  card.querySelectorAll('[data-p]').forEach(b => b.onclick = () => {
    const id = b.dataset.p, d = loadProfile(id);
    if (edit) {
      if (!confirm(`${d.name} wirklich löschen? Alle Sterne und Punkte von ${d.name} sind dann weg.`)) return;
      PROF.list = PROF.list.filter(p => p.id !== id); store.del('p-' + id);
      if (PROF.cur === id) { PROF.cur = null; meId = null; me = null; }
      saveProf(); return renderWho(PROF.list.length > 0);
    }
    choosePlayer(id);
  });
  const add = $('addP'); if (add) add.onclick = () => renderNew();
  const ed = $('editP'); if (ed) ed.onclick = () => renderWho(!edit);
}
function choosePlayer(id) {
  PROF.cur = id; saveProf();
  const d = loadProfile(id);
  if (d.world !== worldId && WORLDS.some(w => w.id === d.world)) return reloadTo('menu');   // andere Welt: neu laden
  meId = id; me = d; modeKey = MODES[me.mode] ? me.mode : 'klassik'; diffKey = DIFFS[me.diff] ? me.diff : 'normal'; D = DIFFS[diffKey];
  setLook(player, myLook()); renderStart();
}
// 2. Neuen Spieler anlegen
function renderNew() {
  card.innerHTML = `
    <h1 class="h1s">Neuer Spieler</h1>
    <p>Wie heißt du?</p>
    <input id="nm" class="name-in" maxlength="12" autocomplete="off" autocapitalize="words" spellcheck="false" placeholder="Name">
    <p class="small" id="nmErr">&nbsp;</p>
    <div class="btns"><button class="go" id="okN">Weiter</button>${PROF.list.length ? '<button class="go alt" id="backN">Zurück</button>' : ''}</div>`;
  const inp = $('nm'); setTimeout(() => inp.focus(), 50);
  const ok = () => {
    const name = inp.value.trim().slice(0, 12);
    if (!name) { $('nmErr').textContent = 'Bitte einen Namen eingeben.'; return; }
    if (PROF.list.some(p => p.name.toLowerCase() === name.toLowerCase())) { $('nmErr').textContent = 'Den Namen gibt es schon.'; return; }
    const id = newId(), p = newProfile(name); p.world = worldId;
    PROF.list.push({ id, name }); store.set('p-' + id, p); saveProf(); inp.blur(); choosePlayer(id);
  };
  $('okN').onclick = ok; inp.onkeydown = e => { if (e.key === 'Enter') ok(); };
  const back = $('backN'); if (back) back.onclick = () => renderWho();
}
// 3. Hauptmenü: Welt, Modus, Schwierigkeit, Loch
function renderStart() {
  if (!me) return renderWho();
  hideLoading(); $('overlay').style.display = 'flex';
  const solo = modeKey === 'solo', lk = myLook();
  document.body.dataset.mode = modeKey;
  card.innerHTML = `
    <h1 class="h1s">Lochfrass!</h1>
    <div class="mebar">${lookIcon(lk, 52)}<span><b>${esc(me.name)}</b><small>🏆 ${fmt(me.points)} Punkte · ★ ${totalStars()} / ${MAX_STARS}</small></span>
      <button class="segb mini" id="who">Wechseln</button></div>
    <div class="sec">Welt</div>
    <div class="worlds">${WORLDS.map(w => `<button class="wcard ${w.id === worldId ? 'on' : ''}" data-w="${w.id}"><span class="wi">${w.icon}</span><b>${w.name}</b><small>★ ${worldStars(w.id)}/${MAX_WORLD}</small></button>`).join('')}</div>
    <div class="sec">Modus</div>
    <div class="seg">${Object.entries(MODES).map(([k, m]) =>
      `<button class="segb ${k === modeKey ? 'on' : ''}" data-mode="${k}">${m.label}<small>★ ${modeStars(k)}/${modeMax(k)}</small></button>`).join('')}</div>
    <p class="small">${MODES[modeKey].desc}</p>
    ${solo ? '' : `<div class="sec">Schwierigkeit</div>
    <div class="seg">${Object.entries(DIFFS).map(([k, d]) =>
      `<button class="segb ${k === diffKey ? 'on' : ''}" data-diff="${k}">${d.label}<small>${starStr(starsOf(modeKey, k))}</small></button>`).join('')}</div>
    <p class="small">${modeKey === 'battle' ? DIFFS[diffKey].bdesc : DIFFS[diffKey].desc}</p>`}
    <div class="btns"><button class="go alt" id="looks">${lookIcon(lk, 30)}&nbsp;Mein Loch</button><button class="go" id="start">Los geht's</button></div>
    <p class="small">Finger auflegen und ziehen · am Mac: Maus ziehen oder WASD${solo ? '' : '<br>Grüner Name = kannst du schlucken · Roter Name = Vorsicht!'}</p>`;
  $('who').onclick = () => renderWho();
  card.querySelectorAll('[data-w]').forEach(b => b.onclick = () => { if (b.dataset.w === worldId) return; me.world = b.dataset.w; saveMe(); reloadTo('menu'); });
  card.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => { modeKey = b.dataset.mode; me.mode = modeKey; saveMe(); renderStart(); });
  card.querySelectorAll('[data-diff]').forEach(b => b.onclick = () => { diffKey = b.dataset.diff; D = DIFFS[diffKey]; me.diff = diffKey; saveMe(); renderStart(); });
  $('looks').onclick = renderLooks;
  $('start').onclick = startGame;
}
// 4. Mein Loch: Farben (mit Sternen) und Avatare (mit Punkten)
function renderLooks() {
  const ts = totalStars(), pts = me.points, nextAv = AVATARS.find(a => a.pts > pts);
  const prevPts = nextAv ? (AVATARS[AVATARS.indexOf(nextAv) - 1]?.pts || 0) : 0;
  const btn = (l, ok, lockTxt) => `<button class="sk ${l.id === myLook().id ? 'on' : ''} ${ok ? '' : 'lock'}" data-look="${l.id}" ${ok ? '' : 'disabled'}>
    <i style="background:${skinCss(l)}">${l.avatar ? `<em>${l.emoji}</em>` : ''}</i><small>${ok ? l.name : lockTxt}</small></button>`;
  card.innerHTML = `
    <h1 class="h1s">Mein Loch</h1>
    <div class="sec"><span>Farben · mit Sternen</span><span class="tot">★ ${ts} / ${MAX_STARS}</span></div>
    <div class="skins">${SKINS.map(s => btn(s, ts >= s.stars, 'ab ' + s.stars + '★')).join('')}</div>
    <div class="sec"><span>Avatare · mit Punkten</span><span class="tot">🏆 ${fmt(pts)}</span></div>
    <div class="avs">${AVATARS.map(a => btn(a, pts >= a.pts, 'ab ' + fmt(a.pts))).join('')}</div>
    ${nextAv ? `<p class="small">Noch ${fmt(nextAv.pts - pts)} Punkte bis ${nextAv.emoji} ${nextAv.name}. Jede Runde bringt deine Punkte aufs Konto.</p>
      <div class="prog"><i style="width:${clamp((pts - prevPts) / (nextAv.pts - prevPts), 0, 1) * 100}%"></i></div>` : '<p class="small">Alle Avatare freigespielt!</p>'}
    <button class="go" id="done">Fertig</button>`;
  card.querySelectorAll('[data-look]').forEach(b => b.onclick = () => { me.look = b.dataset.look; saveMe(); setLook(player, myLook()); renderLooks(); });
  $('done').onclick = renderStart;
}

// ================= Spielablauf =================
let running = false, timeLeft = ROUND_TIME, eaten = 0, eatenValue = 0, hudT = 0, autopilot = false, lastSec = 99;
const AP = { speed: 1, smart: 1 };   // Autopilot zum Testen; mit weniger Tempo/Klugheit spielt er wie ein Mensch
let shakeT = 0, shakeA = 0, bossEaten = false, bossReadyShown = false, endT = 0, leader = null, jamHintShown = false;
const T = { car: 0, house: 0, boss: 0 };   // wann zum ersten Mal ein Auto, ein Haus, der Endboss (für Tests)
const camLook = new THREE.Vector3(player.x, 0, player.z);
camera.position.set(player.x, 14, player.z + 8);

function startGame() {
  D = DIFFS[diffKey];
  const n = modeKey === 'solo' ? 0 : D.bots;
  bots = BOTS.slice(0, n).map(([name, c]) => { const b = makeHole(name, { cols: [c] }, false); spawn(b); return b; });
  document.body.dataset.mode = modeKey;
  hideLoading(); $('overlay').style.display = 'none'; running = true; elapsed = 0;
}
const shake = (t, a) => { shakeT = Math.max(shakeT, t); shakeA = Math.max(shakeA, a); };
// Combo: schnell hintereinander fressen gibt mehr Punkte (die XP bleiben gleich, damit das Wachstum fair bleibt)
const COMBO_TIME = 1.4, comboMult = n => n >= 30 ? 5 : n >= 20 ? 4 : n >= 12 ? 3 : n >= 5 ? 2 : 1;
function eat(h, o) {
  h.mass += h.isPlayer ? o.v : o.v * D.grow;
  h.cn++; h.ct = COMBO_TIME;
  const m = comboMult(h.cn), pts = o.v * m;
  h.score += pts; h.pulse = Math.min(1, h.pulse + (o.v >= 10 ? 0.7 : 0.3));
  if (!h.isPlayer) { h.cm = m; return; }
  eaten++; eatenValue += o.v;
  if (o.v === 14 && !T.car) T.car = elapsed;
  if (o.fade && !T.house) T.house = elapsed;
  if (m > h.cm) { showCombo(m); SND.combo(m); }
  h.cm = m;
  popup('+' + pts, h, o.boss || m > 1 ? '#ffd23f' : '#fff');
  if (o.v < 25) SND.plop(o.v);
}
function swallowHole(a, b) {   // großes Loch schluckt kleines Loch
  const dbl = elapsed - a.lastKill < 4, pts = 20 + Math.round(b.mass * 0.5) + (dbl ? 50 : 0);
  a.mass += b.mass * 0.5 + 20; a.score += pts; a.kills++; a.lastKill = elapsed; a.pulse = 1;
  b.alive = false; b.grp.visible = false; b.by = a; b.cn = 0; b.cm = 1; b.ct = 0;
  if (modeKey === 'battle') { b.out = true; b.place = holes.filter(h => !h.out).length + 1; } else b.dead = 3;
  feed(a, b, dbl);
  if (a.isPlayer) { popup('+' + pts, a, '#ffd23f'); flash(dbl ? 'DOPPEL-KILL!' : b.name + ' geschluckt!'); SND.gulp(); shake(0.45, 0.18); }
  if (b.isPlayer) { b.deaths = (b.deaths || 0) + 1; flash(a.name + ' hat dich geschluckt!'); SND.lose(); hideCombo(); if (modeKey === 'battle') endT = 1.8; }
  else if (modeKey === 'battle' && holes.every(h => h === player || h.out)) endT = 1.2;   // nur noch du übrig: gewonnen
}

// Physik meldet: etwas rutscht ins Loch, ist verschluckt, hängt schief fest, darf weiterfahren
const eatenNow = [];
function canResume(o) {   // Auto nach dem Schubsen noch auf seiner Spur? Dann fährt es weiter
  const c = o.drive, p = o.g.position, q = o.body.rotation();
  c.curve = null; c.pending = null; c.decided = null;
  const yaw = Math.atan2(2 * (q.w * q.y + q.x * q.z), 1 - 2 * (q.y * q.y + q.z * q.z));
  const want = c.ax === 'x' ? (c.dir > 0 ? 0 : Math.PI) : (c.dir > 0 ? -Math.PI / 2 : Math.PI / 2);
  const lat = c.ax === 'x' ? Math.abs(p.z - laneOf('x', c.rc, c.dir)) : Math.abs(p.x - laneOf('z', c.rc, c.dir));
  return Math.abs(Math.atan2(Math.sin(yaw - want), Math.cos(yaw - want))) < 0.35 && lat < 1.6;
}
const PCB = {
  sink(o, h) {
    const p = o.g.position;
    if (o.v >= 10) puff(p.x, p.z, o.v >= 40 ? 8 : 5, Math.min(2.6, 0.45 + o.rad * 0.22), o.rad * 0.5);   // Staubwolke
    if (h.isPlayer && o.v >= 25) { shake(0.35, 0.1 + Math.min(0.1, o.v / 2000)); SND.thud(Math.min(1, o.v / 300)); }
  },
  eat(o, h) { scene.remove(o.g); eatenNow.push([o, h]); },
  jam() { if (!jamHintShown && running) { jamHintShown = true; flash('Verkantet! Hin und her wackeln'); } },
  resume: canResume,
};

function update(dt) {
  timeLeft -= dt; elapsed += dt;
  if (timeLeft <= 0 || (endT > 0 && (endT -= dt) <= 0)) return endRound();
  const sec = Math.ceil(timeLeft);
  if (sec !== lastSec) { lastSec = sec; if (sec <= 10) SND.tick(sec <= 3); }   // Countdown in den letzten 10 Sekunden
  if (player.alive && player.lock <= 0) {
    if (autopilot) {
      player.think -= dt; if (player.think <= 0) { think(player, AP.smart, false); player.think = 0.4; }
      const dx = player.tx - player.x, dz = player.tz - player.z, l = Math.hypot(dx, dz); if (l > 0.12) moveHole(player, dx / l, dz / l, dt, AP.speed);
    } else {
      let ix = (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0);
      let iz = (keys.s || keys.arrowdown ? 1 : 0) - (keys.w || keys.arrowup ? 1 : 0);
      if (drag.on) { const dx = drag.cx - drag.sx, dy = drag.cy - drag.sy, l = Math.hypot(dx, dy);
        if (l > 6) { const m = Math.min(l, 52) / 52; ix += dx / l * m; iz += dy / l * m; } }
      moveHole(player, ix, iz, dt);
    }
  }
  const k = ramp(), botSpeed = D.s0 + (D.s1 - D.s0) * k, smart = D.smart * (0.6 + 0.4 * k);
  const hunt = modeKey === 'battle' ? elapsed > D.battleHunt : D.huntPlayer && elapsed > D.huntDelay;
  for (const b of bots) {
    if (!b.alive) continue;
    b.think -= dt; if (b.think <= 0) { think(b, smart, hunt); b.think = rand(0.4, 0.7); }
    const dx = b.tx - b.x, dz = b.tz - b.z, l = Math.hypot(dx, dz);
    if (l > 0.12) moveHole(b, dx / l, dz / l, dt, botSpeed);
  }
  for (const h of holes) {
    if (!h.alive) { if (!h.out && (h.dead -= dt) <= 0) { spawn(h); if (h.isPlayer) flash('Weiter geht\'s!'); } continue; }
    h.speed = dt > 0 ? Math.min(30, Math.hypot(h.x - h.px, h.z - h.pz) / dt) : 0; h.px = h.x; h.pz = h.z;
    h.grace -= dt; h.r = radiusFor(h.mass);
    h.rShow += (h.r - h.rShow) * Math.min(1, dt * 4);
    if (h.ct > 0 && (h.ct -= dt) <= 0) { h.cn = 0; h.cm = 1; if (h.isPlayer) hideCombo(); }   // Combo abgerissen
  }
  for (const a of holes) for (const b of holes) {   // großes Loch frisst kleines Loch
    if (a === b || !a.alive || !b.alive || b.grace > 0 || a.rShow < b.rShow * 1.25) continue;
    if (Math.hypot(a.x - b.x, a.z - b.z) < a.rShow - b.rShow * 0.3) swallowHole(a, b);
  }
  for (const o of movers) { if (o.ph !== 0 || o.gone) continue; if (o.walk) walkStep(o, dt); else if (o.drive) driveCar(o, o.g.position, dt); }
  bossUpdate(dt);
  PH.step(dt, holes, objects, PCB);
  if (eatenNow.length) {
    for (const [o, h] of eatenNow) if (h) eat(h, o);
    eatenNow.length = 0;
    for (let i = objects.length - 1; i >= 0; i--) if (objects[i].gone) objects.splice(i, 1);
  }
}
function walkStep(o, dt) {   // Leute (und Tiere) laufen kreuz und quer
  const w = o.walk, p = o.g.position; w.t -= dt; w.ph += dt * (w.hop || 10);
  if (w.t < 0 || Math.abs(p.x) > MAP - 2 || Math.abs(p.z) > MAP - 2) {
    const a = rand(0, 6.28); w.dx = Math.cos(a); w.dz = Math.sin(a); w.t = rand(1, 4);
    if (Math.abs(p.x) > MAP - 2) w.dx = -Math.sign(p.x); if (Math.abs(p.z) > MAP - 2) w.dz = -Math.sign(p.z);
  }
  p.x += w.dx * w.sp * dt; p.z += w.dz * w.sp * dt; p.y = Math.abs(Math.sin(w.ph)) * w.bob;
  o.g.rotation.set(0, Math.atan2(w.dx, w.dz) + (w.side ? Math.PI / 2 : 0), 0);
}

// ---------- Autos: Spur halten, an Kreuzungen abbiegen, am Kartenrand wenden ----------
const TURN_R = 2.6;
const bez = (t, a, b, c, d) => { const u = 1 - t; return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d; };
const bezD = (t, a, b, c, d) => { const u = 1 - t; return 3 * u * u * (b - a) + 6 * u * t * (c - b) + 3 * t * t * (d - c); };
function curve(sx, sz, dx, dz, ex, ez, nx, nz, k, end) {   // Kurve von S (Fahrtrichtung d) nach E (Fahrtrichtung n)
  const c = { x: [sx, sx + dx * k, ex - nx * k, ex], z: [sz, sz + dz * k, ez - nz * k, ez], t: 0, end };
  c.len = (Math.hypot(c.x[1] - c.x[0], c.z[1] - c.z[0]) + Math.hypot(c.x[2] - c.x[1], c.z[2] - c.z[1])
    + Math.hypot(c.x[3] - c.x[2], c.z[3] - c.z[2]) + Math.hypot(ex - sx, ez - sz)) / 2;
  return c;
}
function driveCar(o, p, dt) {
  const c = o.drive;
  if (c.curve) {   // gerade in einer Kurve oder beim Wenden
    const cv = c.curve, k = Math.min(1, dt * 10); cv.t = Math.min(1, cv.t + c.sp * dt / cv.len);
    p.x += (bez(cv.t, ...cv.x) - p.x) * k; p.z += (bez(cv.t, ...cv.z) - p.z) * k;
    o.g.rotation.set(0, Math.atan2(-bezD(cv.t, ...cv.z), bezD(cv.t, ...cv.x)), 0);
    if (cv.t >= 1) { Object.assign(c, cv.end); c.curve = null; c.decided = null; }
    return;
  }
  const X = c.ax === 'x', dx = X ? c.dir : 0, dz = X ? 0 : c.dir;
  const along = (X ? p.x : p.z) + c.dir * c.sp * dt, lane = laneOf(c.ax, c.rc, c.dir), kk = Math.min(1, dt * 3);
  if (X) { p.x = along; p.z += (lane - p.z) * kk; } else { p.z = along; p.x += (lane - p.x) * kk; }   // sanft zurück in die Spur
  o.g.rotation.set(0, Math.atan2(-dz, dx), 0);
  if (along * c.dir > MAP - 6) {   // Straße endet: wenden
    const ol = laneOf(c.ax, c.rc, -c.dir);
    c.curve = curve(p.x, p.z, dx, dz, X ? along : ol, X ? ol : along, -dx, -dz, 2.2, { dir: -c.dir }); c.pending = null; return;
  }
  if (c.pending) { if ((along - c.pending.at) * c.dir >= 0) { c.curve = c.pending.cv; c.pending = null; } return; }
  for (const r of ROADS) {   // Kreuzung voraus: geradeaus oder abbiegen?
    const ahead = (r - along) * c.dir;
    if (ahead <= 0 || ahead > 8 || r === c.decided) continue;
    c.decided = r;
    if (Math.random() < 0.35) {
      const nd = Math.random() < 0.5 ? 1 : -1, nAx = X ? 'z' : 'x', nl = laneOf(nAx, r, nd), ol = laneOf(c.ax, c.rc, c.dir);
      const kx = X ? nl : ol, kz = X ? ol : nl, nx = X ? 0 : nd, nz = X ? nd : 0;   // k = Schnittpunkt der beiden Spuren
      const sx = kx - dx * TURN_R, sz = kz - dz * TURN_R, at = X ? sx : sz;
      if ((at - along) * c.dir > 0.2)
        c.pending = { at, cv: curve(sx, sz, dx, dz, kx + nx * TURN_R, kz + nz * TURN_R, nx, nz, TURN_R * 0.55, { ax: nAx, rc: r, dir: nd }) };
    }
    break;
  }
}

// ---------- Endboss: fällt senkrecht ins Loch wie eine Stange ----------
function bossUpdate(dt) {
  const B = BOSS; if (!B || B.gone) return;
  const p = B.g.position;
  if (!B.sinking) {
    if (!player.alive) return;
    const d = Math.hypot(p.x - player.x, p.z - player.z);
    if (d + B.footR < player.rShow) {   // das Loch umschließt den ganzen Turm
      B.sinking = true; B.vy = 0; B.t = 0; PH.removeBody(B); player.lock = 99; B.g.rotation.set(0, 0, 0);
      shake(3, 0.22); SND.rumble(); flash('ENDBOSS!'); puffRing(player, 16);
    } else if (d < player.rShow + B.footR * 0.6 && player.rShow > B.footR * 0.5) B.wob = Math.min(1, (B.wob || 0) + dt * 3);   // noch zu klein: der Turm wackelt nur
    if (B.wob > 0) { B.wob = Math.max(0, B.wob - dt * 1.5); const t = performance.now() / 1000;
      B.g.rotation.set(Math.sin(t * 13) * 0.008 * B.wob, 0, Math.cos(t * 11) * 0.008 * B.wob); }
    return;
  }
  B.t += dt; B.vy -= 22 * dt; p.y += B.vy * dt;
  B.g.rotation.set(Math.sin(B.t * 11) * 0.006, 0, Math.cos(B.t * 9) * 0.006);
  if ((B.dustT = (B.dustT || 0) - dt) <= 0) { B.dustT = 0.08; const a = Math.random() * 6.283;
    puff(p.x + Math.cos(a) * (B.footR + 0.6), p.z + Math.sin(a) * (B.footR + 0.6), 1, 1.3 + Math.random() * 1.2, 0.4, a); }
  if (p.y < -(B.h + 2)) {
    B.gone = true; scene.remove(B.g); bossEaten = true; player.lock = 0; T.boss = elapsed;
    const i = objects.indexOf(B); if (i >= 0) objects.splice(i, 1);
    eat(player, B); flash('ENDBOSS GESCHLUCKT!'); puffRing(player, 18); shake(0.7, 0.3); SND.thud(1);
  }
}

function updateVisuals(dt, now) {
  for (const h of holes) {
    h.grp.position.set(h.x, 0, h.z); h.grp.scale.set(h.rShow, 1, h.rShow);
    if (h.skin.spin) { h.rim.rotation.z += dt * h.skin.spin; h.glow.rotation.z = h.rim.rotation.z; }
    h.pulse = Math.max(0, h.pulse - dt * 3);   // Rand pulst kurz beim Schlucken
    const ps = 1 + 0.12 * h.pulse, gs = ps * (1 + 0.12 * h.pulse);
    h.rim.scale.set(ps, ps, 1); h.glow.scale.set(gs, gs, 1);
    h.glow.material.opacity = h.skin.pulse ? 0.55 + 0.45 * Math.sin(now / 180) : 1;
    if (h.deco) { h.decoGrp.visible = h.alive; h.decoGrp.position.set(h.x, 0, h.z); h.decoGrp.scale.setScalar(h.rShow * ps); h.deco.anim(now / 1000, dt, h); }
  }
  const zoom = 0.85 + player.rShow * 0.3;
  scene.fog.near = 60 + zoom * 16; scene.fog.far = scene.fog.near + 220;
  camera.position.lerp(new THREE.Vector3(player.x, 14 * zoom, player.z + 7 * zoom), Math.min(1, dt * 3));
  camLook.lerp(new THREE.Vector3(player.x, 0, player.z - 0.5), Math.min(1, dt * 5));
  camera.lookAt(camLook);
  if (shakeT > 0) { shakeT -= dt; const a = shakeA * Math.min(1, shakeT / 0.25) * zoom;
    camera.position.x += (Math.random() - 0.5) * a; camera.position.y += (Math.random() - 0.5) * a; if (shakeT <= 0) shakeA = 0; }
  updatePuffs(dt);
  if (waveT > 0) {   // Welle beim Stufenaufstieg
    waveT -= dt; const kw = 1 - Math.max(0, waveT) / 0.7, s = player.rShow * (1.15 + kw * 1.8);
    wave.visible = waveT > 0; wave.position.set(player.x, 0.1, player.z); wave.scale.set(s, s, 1); waveMat.opacity = 0.9 * (1 - kw);
  }
  // Krone über dem Loch mit den meisten Punkten
  const cr = $('crown');
  if (running && leader && leader.alive) {
    const p = new THREE.Vector3(leader.x, 0.5, leader.z - leader.rShow).project(camera);
    const vis = p.z < 1 && Math.abs(p.x) < 1.1 && Math.abs(p.y) < 1.1;
    cr.style.display = vis ? 'block' : 'none';
    cr.style.left = (p.x + 1) / 2 * innerWidth + 'px'; cr.style.top = (1 - p.y) / 2 * innerHeight - (leader.isPlayer ? 2 : 22) + 'px';
  } else cr.style.display = 'none';
  // Pfeil zum Endboss, sobald du groß genug bist und er nicht im Bild ist
  const arrow = $('arrow');
  if (running && !bossEaten && !BOSS.sinking && player.rShow >= BOSS.need) {
    const bp = new THREE.Vector3(BOSS.g.position.x, 0, BOSS.g.position.z).project(camera);
    const cx = innerWidth / 2, cy = innerHeight / 2;
    let vx = (bp.x + 1) / 2 * innerWidth - cx, vy = (1 - bp.y) / 2 * innerHeight - cy;
    if (bp.z > 1) { vx = -vx; vy = -vy; }
    const onScreen = bp.z < 1 && Math.abs(vx) < cx - 60 && Math.abs(vy) < cy - 60;
    if (onScreen) arrow.style.display = 'none';
    else { const k = Math.min((cx - 60) / Math.abs(vx || 1), (cy - 70) / Math.abs(vy || 1));
      arrow.style.display = 'block'; arrow.style.left = cx + vx * k + 'px'; arrow.style.top = cy + vy * k + 'px';
      arrow.firstElementChild.style.transform = `rotate(${Math.atan2(vy, vx)}rad)`; }
  } else arrow.style.display = 'none';
  // Schatten-Bereich folgt dem Spieler (schärfere Schatten als über die ganze Karte)
  const ext = Math.round(28 + player.rShow * 4);
  const sc = sun.shadow.camera;
  if (sc.right !== ext) { sc.left = sc.bottom = -ext; sc.right = sc.top = ext; sc.updateProjectionMatrix(); }
  sun.position.set(player.x + 35, 70, player.z + 25); sun.target.position.set(player.x, 0, player.z);
  // Häuser zwischen Kamera und Loch durchsichtig machen (stufenweise, mit gemeinsamen Materialien)
  const H = camera.position.y, Dz = Math.max(1, camera.position.z - player.z);
  for (const o of objects) {
    if (!o.fade) continue;
    const p = o.g.position, dz = p.z - player.z;
    const block = o.ph === 0 && dz > -o.rad && dz < Dz + o.rad && o.h > H * Math.max(0, dz - o.rad) / Dz && Math.abs(p.x - player.x) < o.rad + player.rShow + 1.5;
    const target = block ? 0.3 : 1;
    if (o.fk === target) continue;
    o.fk += (target - o.fk) * Math.min(1, dt * 8); if (Math.abs(o.fk - target) < 0.02) o.fk = target;
    const m = o.fk > 0.86 ? MAT : o.fk > 0.6 ? FADE[0] : o.fk > 0.39 ? FADE[1] : FADE[2];
    if (o.g.material !== m) o.g.material = m;
  }
  if (!BOSS.gone) {   // der Endboss hat eigene Materialien
    const o = BOSS, p = o.g.position, dz = p.z - player.z;
    const block = !o.sinking && dz > -o.rad && dz < Dz + o.rad && o.h > H * Math.max(0, dz - o.rad) / Dz && Math.abs(p.x - player.x) < o.rad + player.rShow + 10;
    const target = block ? 0.3 : 1;
    if (Math.abs(o.fk - target) >= 0.01) {
      o.fk += (target - o.fk) * Math.min(1, dt * 8); if (Math.abs(o.fk - target) < 0.01) o.fk = target;
      for (const m of o.mats) { m.transparent = o.fk < 1; m.opacity = o.fk; m.depthWrite = o.fk >= 1; m.userData = o.fk < 1 ? NO_OUTLINE : {}; }
    }
  }
  for (const b of bots) {
    if (!b.alive) { b.tag.style.display = 'none'; continue; }
    const p = new THREE.Vector3(b.x, 0.5, b.z - b.rShow).project(camera);
    const vis = p.z < 1 && Math.abs(p.x) < 1.1 && Math.abs(p.y) < 1.1;
    b.tag.style.display = vis ? 'block' : 'none';
    b.tag.style.left = (p.x + 1) / 2 * innerWidth + 'px'; b.tag.style.top = (1 - p.y) / 2 * innerHeight + 'px';
    // grün = Beute (du kannst es schlucken), rot = Gefahr (es kann dich schlucken)
    const rel = !player.alive ? '' : player.rShow >= b.rShow * 1.25 ? 'prey' : b.rShow >= player.rShow * 1.25 ? 'danger' : '';
    if (rel !== b.rel) { b.rel = rel; b.tag.className = 'tag ' + rel; }
  }
}

function podium(ranked, sub) {   // Siegerpodest: Platz 2 links, 1 in der Mitte, 3 rechts
  return `<div class="podium">${[1, 0, 2].filter(i => ranked[i]).map(i => { const h = ranked[i];
    return `<div class="pod p${i + 1} ${h.isPlayer ? 'me' : ''}">${i === 0 ? `<div class="pcrown">${CROWN}</div>` : ''}
      <i style="background:${skinCss(h.skin)}">${h.skin.avatar ? `<em>${h.skin.emoji}</em>` : ''}</i><b>${h.isPlayer && me ? esc(me.name) : h.name}</b><small>${sub(h)}</small><div class="step">${i + 1}</div></div>`; }).join('')}</div>`;
}
function endRound() {
  if (!running) return;
  running = false; drag.on = false; joy.style.display = 'none'; hideCombo(); $('crown').style.display = 'none';
  const solo = modeKey === 'solo', battle = modeKey === 'battle';
  const ranked = battle ? [...holes.filter(h => !h.out).sort((a, b) => b.score - a.score), ...holes.filter(h => h.out).sort((a, b) => a.place - b.place)]
    : [...holes].sort((a, b) => b.score - a.score);
  const place = ranked.indexOf(player) + 1, pct = eatenValue / TOTAL_VALUE;
  let stars, rule;
  if (solo) { stars = SOLO_STARS.filter(f => pct >= f).length; rule = 'Sterne ab ' + SOLO_STARS.map(f => Math.round(f * 100) + '%').join(' / '); }
  else if (battle) { stars = place === 1 ? (player.kills >= 2 ? 3 : 2) : place === 2 ? 1 : 0; rule = '★ Top 2 · ★★ Sieg · ★★★ Sieg mit 2 Kills'; }
  else { const thr = starScores(); stars = thr.filter(s => player.score >= s).length; rule = 'Sterne ab ' + thr.map(fmt).join(' / ') + ' Punkten'; }
  // Ergebnis im Profil speichern: Sterne, Bestwert, Punkte aufs Konto, neu Freigeschaltetes
  let best = 0, unlocked = [];
  if (me) {
    const before = totalStars(), ptsBefore = me.points, key = sKey(modeKey, diffKey);
    if (stars > (me.stars[key] || 0)) me.stars[key] = stars;
    best = Math.max(solo ? Math.floor(pct * 100) : player.score, me.best[key] || 0); me.best[key] = best;
    me.points += player.score; me.rounds++;
    const after = totalStars();
    unlocked = [...SKINS.filter(s => s.stars > before && s.stars <= after), ...AVATARS.filter(a => a.pts > ptsBefore && a.pts <= me.points)];
    saveMe();
  }
  const title = battle ? (place === 1 ? 'Gewonnen!' : player.out ? 'Ausgeschieden!' : 'Zeit um!') : 'Zeit um!';
  const kills = h => h.kills + (h.kills === 1 ? ' Kill' : ' Kills');
  const sub = battle ? h => h.out ? 'raus' : kills(h) : h => fmt(h.score) + ' Punkte';
  card.innerHTML = `
    <h1>${title}</h1>
    ${solo ? `<div class="big">${Math.floor(pct * 100)}%</div><p>${WORLD.gen} geschluckt</p>` : podium(ranked, sub)}
    <div class="stars">${[0, 1, 2].map(i => `<span class="${i < stars ? '' : 'off'}">★</span>`).join('')}</div>
    <p><b>${fmt(player.score)} Punkte</b>${solo ? '' : ` · Platz ${place} von ${holes.length} · ${D.label}`}
      ${solo ? '' : `<br>${Math.floor(pct * 100)}% ${WORLD.gen} geschluckt`}${bossEaten ? ' · Endboss besiegt!' : ''}
      ${battle && player.out ? `<br>${player.by.name} hat dich geschluckt` : ''}</p>
    ${me ? `<p class="konto">+${fmt(player.score)} aufs Konto von ${esc(me.name)} · jetzt 🏆 ${fmt(me.points)}</p>` : ''}
    ${unlocked.length ? `<div class="unlock">Neu freigeschaltet: ${unlocked.map(l => (l.emoji ? l.emoji + ' ' : '') + l.name).join(', ')}!<br><small>Aussuchen unter „Mein Loch“</small></div>` : ''}
    ${battle ? `<div id="ranks">${ranked.map((h, i) => `<div><span>${i + 1}. ${h.isPlayer && me ? esc(me.name) : h.name}</span><span>${h.out ? (h.by.isPlayer ? 'von dir' : 'von ' + h.by.name) + ' geschluckt' : kills(h)}</span></div>`).join('')}</div>` : ''}
    <p class="small">Bestwert ${solo ? best + '%' : fmt(best)} · ${rule}</p>
    <div class="btns"><button class="go" id="again">Nochmal</button><button class="go alt" id="menu">Menü</button></div>`;
  // Neustart = Seite neu laden (frische Welt); „Nochmal“ startet danach sofort wieder
  $('again').onclick = () => reloadTo('auto');
  $('menu').onclick = () => reloadTo('menu');
  $('overlay').style.display = 'flex';
  SND.jingle(stars);
}

if (boot === 'auto' && me) startGame();
else if (boot === 'menu' && me) renderStart();
else renderWho();
let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (running) update(dt);
  updateVisuals(dt, now);
  if ((hudT -= dt) <= 0) { updateHud(); hudT = 0.1; }
  effect.render(scene, camera);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });

// Test-Helfer: __lf.mode('solo') wählt den Modus, __lf.sim(120, true) spielt eine Runde im Schnelldurchlauf mit Autopilot
window.__lf = { player, holes, objects, TOTAL, TOTAL_VALUE, starScores, PH, BOSS,
  setGrowth: (g, e = GROWTH_EXP) => { GROWTH = g; GROWTH_EXP = e; },
  mode(m, d = diffKey) { modeKey = m; diffKey = d; D = DIFFS[d]; },
  ap(speed = 1, smart = 1) { AP.speed = speed; AP.smart = smart; },
  auto(on = true) { autopilot = on; if (!running) startGame(); },   // Autopilot in Echtzeit (zum Zuschauen)
  look(id) { setLook(player, lookById(id)); },
  sim(sec, auto = false) {
    autopilot = auto; if (!running) startGame();
    const reach = {}, t0 = performance.now();   // wann welche Stufe erreicht wurde (Sekunden)
    for (let t = 0; t < sec && running; t += 1 / 30) {
      update(1 / 30);
      for (let s = 1; s < STAGES.length; s++) if (!reach[s] && player.mass >= massFor(STAGES[s])) reach[s] = Math.round(elapsed);
    }
    autopilot = false;
    return { t: Math.round(elapsed), ms: Math.round(performance.now() - t0), score: player.score, pct: Math.round(eatenValue / TOTAL_VALUE * 100), r: player.r.toFixed(2),
      kills: player.kills, deaths: player.deaths || 0, firstCar: Math.round(T.car), firstHouse: Math.round(T.house), boss: Math.round(T.boss),
      stages: Object.entries(reach).map(([s, t]) => STAGE_NAMES[s] + ' ' + t).join(', '),
      bots: bots.map(b => b.name + ':' + b.score + (b.out ? ' raus' : '')), active: PH.activeCount(), stars: starScores(), total: TOTAL_VALUE };
  } };
