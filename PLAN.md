# Lochfrass! – Plan

Eigenes Loch-Schluck-Spiel für das iPad als PWA. Werbefrei, kostenlos, für Thomas und die Familie.
Die Spielmechanik kennt man aus den „Loch“-io-Spielen, Name, Welten und Comic-Look sind eigene.
Das Spielkonzept steht in `KONZEPT.md`.

Live: https://wordenbeck.github.io/lochfrass/

## Entscheidungen
- Gerät: iPad (Touch-Joystick: Finger irgendwo ablegen und ziehen), am Mac zusätzlich Maus/WASD
- Runde: 2 Minuten, drei Modi: Klassik (Punkte, Respawn nach 3 s), Solo (ohne Gegner, % der Welt), Battle (wer geschluckt wird, ist raus)
- Spielerprofile: „Wer spielt?“ beim Start, jeder hat eigene Punkte, Sterne und eigenes Loch. Alte Spielstände wurden zu „Spieler 1“
- Jede Welt hat einen Endboss, den nur der Spieler schlucken kann (+1.500 Punkte). Er versinkt senkrecht im Loch
- Echte Physik (Rapier): Dinge kippen über die Lochkante, verkanten sich und fallen hinein. Häuser haben 1–3 Etagen (Hochhäuser mehr), die einzeln abbrechen
- Schwierigkeit wählbar (Leicht / Normal / Schwer). Gegner starten langsam und werden über eine Anlaufzeit schneller und schlauer
- Look: Comic (Cel-Shading, dunkle Konturlinien, kräftige Farben, runde Formen)
- Kamera: schräg von hinten (gut 50° Neigung), zoomt mit dem Loch heraus. Das Loch nimmt etwa ein Fünftel der Bildbreite ein, am Start weniger (`CAM` in `main.js`: Höhe, Neigung, Mitwachsen, Bildwinkel)
- Kamera-Regler: Spiel mit `?kamera` hinter der Adresse öffnen (z. B. wordenbeck.github.io/lochfrass/?kamera). Dann gibt es unten links Regler, die Zeit läuft nicht ab, und „Werte kopieren" liefert die Zeile für `main.js` (`js/kamera.js`)
- Technik: `index.html` plus JS-Module, Three.js und Rapier über CDN, Sound per Web Audio (ohne Dateien), keine Build-Tools, Hosting auf GitHub Pages (0 €)

## Welten
Jede Welt ist ein eigenes Modul `js/world-<id>.js` mit `env` (Himmel, Licht, Schwerkraft, Staubfarbe, Wachstum) und `create()`.
Alle Welten sind von Anfang an spielbar. Weltwert = Summe aller Objektwerte, daran hängen die Sterne-Schwellen.

| Welt | Endboss | Besonderheit | Objekte | Weltwert | Wachstum |
|---|---|---|---|---|---|
| 🏘️ Vorstadt | Riesenturm | Häuser, Wohnblöcke, Autoverkehr | 1.415 | 8.621 | 1,0 |
| 🏖️ Sonnenbucht | Leuchtturm (Lichtkegel dreht sich) | Strand, Hafen mit Containern, Hotels, Buggys, Krabben | 1.408 | 8.885 | 1,0 |
| 🚜 Bauernhof | Windmühle (Flügel drehen sich) | Scheunen, Silos, Felder, Weiden, Traktoren, Tiere | 1.567 | 8.669 | 1,2 |
| 🎡 Rummelplatz | Freifallturm (Gondel fällt) | Karussells, Riesenrad, Autoscooter, Zirkus, Geisterbahn | 1.395 | 8.282 | 1,0 |
| 🚀 Mondbasis | Rakete | wenig Schwerkraft, Kuppeln, Module, Rover, Kristalle, Krater | 1.487 | 8.970 | 1,25 |

„Wachstum“ ist ein Faktor auf die XP pro geschlucktem Ding. Bauernhof und Mondbasis haben weitere Wege zwischen den Dingen, deshalb wächst man dort pro Ding etwas mehr. Die Punkte bleiben davon unberührt.

## Schwierigkeit
| | Gegner | Tempo Start → Ende | Anlaufzeit | jagen dich ab (Klassik / Battle) | Gegner-Wachstum | Bremse |
|---|---|---|---|---|---|---|
| Leicht | 3 | 55 % → 80 % | 90 s | nie / Sekunde 50 | 75 % | 40 % |
| Normal | 3 | 65 % → 92 % | 60 s | Sekunde 40 / 30 | 95 % | 55 % |
| Schwer | 4 | 75 % → 95 % | 40 s | Sekunde 25 / 20 | 105 % | 75 % |

Bremse: Ein Gegner, der schon größer ist als du, wächst nur noch mit diesem Anteil weiter. So wird kein Bot zum Riesen, der dich am Ende der Runde frisst.

## Sterne
- Klassik: Punkte als Vielfaches des Weltwerts, die Punkte enthalten den Combo-Faktor. Leicht 0,45 / 1,4 / 2,9 · Normal 0,4 / 1,2 / 2,6 · Schwer 0,3 / 0,9 / 2,0
- Solo: 25 / 50 / 80 % der Welt (nach Wert)
- Battle: ★ unter den Top 2 · ★★ Sieg · ★★★ Sieg mit mindestens 2 eigenen Kills

## Wachstum
Radius = 0,6 + 0,28 · XP^0,5 (XP = gefressene Masse). Lochtempo = 5 + 0,75 · Radius.
Gemessen mit dem Autopilot im Tempo eines Durchschnittsspielers (`__lf.ap(0.8, 0.8)`, Klassik, Normal), Endboss geschluckt nach:

| Welt | Mittel | Spanne | Läufe |
|---|---|---|---|
| Vorstadt | 1:27 | 1:19–1:41 | 5 |
| Sonnenbucht | 1:29 | 1:24–1:29 | 3 |
| Bauernhof | 1:20 | 1:06–1:45 | 4 |
| Rummelplatz | 1:33 | 1:22–1:40 | 4 |
| Mondbasis | 1:26 | 1:05–1:56 | 5 |

Erste Autos nach etwa 10–15 s, erste Häuser nach etwa 30–45 s. Seit der Gegner-Bremse wurde der Autopilot in keinem dieser Läufe gefressen.

## XP & Stufen
1 Kleinkram & Menschen · 2 Laternen & Bänke · 3 Büsche · 4 Autos · 5 Bäume · 6 Brunnen & Gartenhäuser · 7 Häuser · 8 Wohnblöcke · 9 Endboss.
Die Anzeige oben links zeigt Stufe und XP bis zur nächsten Stufe. Beim Aufstieg: „Stufe N!“, Fanfare, Welle und Wolkenkranz.

## Loch-Looks
- Skins (nach Sternen): Minze (0★) · Koralle (1★) · Gold (3★) · Bonbon (5★) · Regenbogen (8★) · Lava (12★) · Galaxie (16★)
- Avatare (nach Punkten, gesammelt über alle Runden): Dino 5.000 · Hai 20.000 · Frosch 40.000 · Krake 70.000 · Drache 110.000 · Monster 160.000 · Roboter 220.000 · UFO 300.000 · Vulkan 400.000 · Schwarzes Loch 500.000

## Icon
`icon.svg` (Quelle) → `icon-180/192/512.png` per Headless-Chrome + sips. `manifest.json` für den Homescreen (Vollbild).

## Stand
| Phase | Inhalt | Status |
|---|---|---|
| 0–1c | Prototyp, Comic-Grafik, Modi, Combo, Sound, Autoverkehr, Siegerpodest | ✅ |
| 2 | Echte Physik, Etagen-Häuser, Spielerprofile, Avatare, schnelleres Wachstum | ✅ |
| 3 | Welten 2–5 mit eigenem Endboss, Gegner-Bremse, Wachstum je Welt abgestimmt | ✅ |
| 4 | Spielgefühl am iPad prüfen: Tempo, Steuerung, Performance der neuen Welten | als Nächstes |
| 5 | PWA: offline spielbar (Manifest + Icon ✅, Service Worker fehlt) | offen |

## Testen
Lokal: Server „lochfrass“ aus `.claude/launch.json` (Port 8060). In der Browser-Konsole:
- `__lf.mode('solo')` oder `__lf.mode('battle', 'schwer')` wählt Modus und Schwierigkeit
- `__lf.ap(0.8, 0.8)` lässt den Autopilot wie einen durchschnittlichen Menschen spielen (Tempo, Klugheit)
- `__lf.sim(120, true)` spielt eine Runde im Schnelldurchlauf und meldet, wann welche Stufe erreicht wurde
- Welt wechseln: im Profil (`lochfrass-p-<id>`) das Feld `world` setzen und neu laden

Achtung: Testrunden speichern Punkte und Sterne im Browser. Danach die `lochfrass-`-Einträge im localStorage löschen.
