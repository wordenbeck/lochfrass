// Kamera-Regler zum Ausprobieren. Erscheint nur, wenn das Spiel mit ?kamera hinter der Adresse geöffnet wird.
// Die Regler ändern die Kamera sofort. Die Einstellung bleibt auf dem Gerät gespeichert, bis du „Zurück" drückst.
// Wenn es passt: „Werte kopieren" und die Zeile in main.js bei const CAM = { ... } eintragen.
const KEY = 'lochfrass-kamera2';   // neuer Name: alte Einstellungen (nur eine Neigung) nicht mehr laden
localStorage.removeItem('lochfrass-kamera');
const REGLER = [   // [Wert in CAM, Name, von, bis, Schrittweite, Anzeige (bekommt den Stufen-Namen als 2. Wert)]
  ['h', 'Höhe', 6, 60, 0.5, v => v.toFixed(1)],
  ['tilt', 'Neigung am Start', 25, 85, 1, v => v + '°'],
  ['tiltBig', 'Neigung später', 25, 85, 1, v => v + '°'],
  ['tiltR', 'Wechsel bis Größe', 0.7, 10, 0.1, (v, stage) => v.toFixed(1) + ' · ' + stage(v)],
  ['grow', 'Mitwachsen', 0, 0.8, 0.01, v => v.toFixed(2)],
  ['fov', 'Bildwinkel', 20, 80, 1, v => v + '°'],
];

const CSS = `
#camPanel { position: fixed; left: 18px; bottom: max(18px, env(safe-area-inset-bottom)); z-index: 3; width: 260px; box-sizing: border-box;
  background: rgba(255,255,255,.95); border: 3px solid #1d2433; border-radius: 16px; box-shadow: 0 4px 0 #1d2433;
  padding: 8px 12px 10px; font-weight: 800; font-size: 14px; color: #1d2433; user-select: none; -webkit-user-select: none; }
#camPanel .cpHead { display: flex; justify-content: space-between; align-items: center; }
#camPanel .cpMin { width: 32px; height: 28px; font: inherit; font-size: 18px; line-height: 1; border: 3px solid #1d2433; border-radius: 10px; background: #fff; cursor: pointer; }
#camPanel label { display: grid; grid-template-columns: 1fr auto; gap: 0 8px; margin-top: 8px; }
#camPanel output { color: #0f9c86; font-variant-numeric: tabular-nums; }
#camPanel input[type=range] { grid-column: 1 / -1; width: 100%; margin: 4px 0 0; accent-color: #2fd3b9; }
#camPanel hr { border: 0; border-top: 2px dashed #c8cdd8; margin: 10px 0 0; }
#camPanel .cpBtns { display: flex; gap: 8px; margin-top: 10px; }
#camPanel .cpBtns button { flex: 1; font: inherit; font-size: 13px; padding: 7px 4px; border: 3px solid #1d2433; border-radius: 12px; background: #fff; color: #1d2433; cursor: pointer; }
#camPanel .cpBtns [data-a=reset] { flex: 0 0 auto; padding: 7px 12px; }
#camPanel .cpBtns [data-a=copy] { background: #ffd23f; }
#camPanel code { display: block; margin-top: 8px; font: 700 12px ui-monospace, Menlo, monospace; color: #6b7385; user-select: text; -webkit-user-select: text; }
#camPanel .cpHint { margin: 4px 0 0; font-size: 12px; font-weight: 700; color: #6b7385; }
#camPanel.min .cpBody { display: none; }
`;

export function regler({ CAM, stages, size, setSize }) {
  const START = { ...CAM };   // die Werte aus main.js, für „Zurück"
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved) for (const [k] of REGLER) if (typeof saved[k] === 'number') CAM[k] = saved[k];
  } catch { /* kaputter Speicher: Startwerte nehmen */ }

  const style = document.createElement('style'); style.textContent = CSS; document.head.append(style);
  const box = document.createElement('div'); box.id = 'camPanel';
  box.innerHTML = `
    <div class="cpHead"><span>📷&nbsp;Kamera</span><button class="cpMin" aria-label="Einklappen">–</button></div>
    <div class="cpBody">
      ${REGLER.map(([k, name, min, max, step]) => `
        <label><span>${name}</span><output data-k="${k}"></output>
          <input type="range" data-k="${k}" min="${min}" max="${max}" step="${step}"></label>`).join('')}
      <hr>
      <label><span>Lochgröße</span><output data-k="size"></output>
        <input type="range" data-k="size" min="0.6" max="14" step="0.1"></label>
      <div class="cpBtns"><button data-a="reset">Zurück</button><button data-a="copy">Werte kopieren</button></div>
      <code></code>
      <p class="cpHint">Neigung 90° = genau von oben. Die Zeit läuft hier nicht ab.</p>
    </div>`;
  document.body.append(box);

  const q = s => box.querySelector(s);
  const line = () => `const CAM = { ${REGLER.map(([k]) => `${k}: ${CAM[k]}`).join(', ')} };`;
  const stageName = r => (stages.filter(([s]) => r >= s - 0.001).pop() || stages[0])[1];
  function show() {   // Regler und Zahlen auf den aktuellen Stand bringen
    for (const [k, , , , , fmt] of REGLER) { q(`input[data-k=${k}]`).value = CAM[k]; q(`output[data-k=${k}]`).textContent = fmt(CAM[k], stageName); }
    q('code').textContent = line();
  }
  const save = () => localStorage.setItem(KEY, JSON.stringify(Object.fromEntries(REGLER.map(([k]) => [k, CAM[k]]))));

  for (const [k] of REGLER) q(`input[data-k=${k}]`).addEventListener('input', e => { CAM[k] = +e.target.value; save(); show(); });

  // Lochgröße: macht dein Loch sofort so groß, damit du die Kamera bei jeder Größe ansehen kannst
  const sizeIn = q('input[data-k=size]'), sizeOut = q('output[data-k=size]');
  let sizeT = 0;
  sizeIn.addEventListener('input', () => { sizeT = performance.now(); setSize(+sizeIn.value); sizeOut.textContent = (+sizeIn.value).toFixed(1) + ' · ' + stageName(+sizeIn.value); });
  setInterval(() => {   // während du spielst, zeigt der Regler, wie groß dein Loch gerade ist
    if (performance.now() - sizeT < 1500) return;
    const r = size(); sizeIn.value = r; sizeOut.textContent = r.toFixed(1) + ' · ' + stageName(r);
  }, 250);

  q('[data-a=reset]').onclick = () => { Object.assign(CAM, START); localStorage.removeItem(KEY); show(); };
  q('[data-a=copy]').onclick = e => {
    const b = e.currentTarget, done = t => { b.textContent = t; setTimeout(() => b.textContent = 'Werte kopieren', 1500); };
    const oldWay = () => {   // Ersatzweg für Browser, die die Zwischenablage sperren
      const ta = document.createElement('textarea'); ta.value = line(); ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;font-size:16px';
      document.body.append(ta); ta.select(); let ok = false;
      try { ok = document.execCommand('copy'); } catch { /* geht nicht: dann abschreiben */ }
      ta.remove(); done(ok ? 'Kopiert!' : 'Bitte abschreiben');
    };
    if (navigator.clipboard) navigator.clipboard.writeText(line()).then(() => done('Kopiert!'), oldWay); else oldWay();
  };
  q('.cpMin').onclick = e => { const min = box.classList.toggle('min'); e.currentTarget.textContent = min ? '+' : '–'; };
  show();
}
