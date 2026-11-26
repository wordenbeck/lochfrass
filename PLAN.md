# Lochfrass! – Plan

Eigenes Loch-Schluck-Spiel für das iPad als PWA. Werbefrei, kostenlos, nur für Thomas.
Die Spielmechanik kennt man aus den „Loch“-io-Spielen, Name, Welten und Comic-Look sind eigene.
Das Spielkonzept steht in `KONZEPT.md`.

Live: https://wordenbeck.github.io/lochfrass/

## Entscheidungen
- Gerät: iPad (Touch-Joystick: Finger irgendwo ablegen und ziehen), am Mac zusätzlich Maus/WASD
- Runde: 2 Minuten wie im Original, drei Modi: Klassik (Punkte, Respawn nach 3 s), Solo (ohne Gegner, % der Stadt), Battle (wer geschluckt wird, ist raus)
- Schnelles Wachstum: Autos nach rund 20 s, Häuser nach rund 1 Minute, Endboss gegen Ende der Runde
- Jedes Level hat einen Endboss: ein riesiges Hochhaus, das nur der Spieler schlucken kann (+1.500 Punkte)
- Physik light: Objekte kippen über die Lochkante, lange Dinge verkanten sich (Hin-und-her-Wackeln löst sie), zu große verhaken sich am Rand
- Schwierigkeit wählbar (Leicht / Normal / Schwer). Gegner starten immer langsam und werden über eine Anlaufzeit schneller und schlauer
- Sterne: 21 pro Welt (Klassik 3 × 3, Battle 3 × 3, Solo 3), damit lassen sich Loch-Skins freischalten
- Welten: 5 verschiedene (Vorstadt, Innenstadt, Strand & Hafen, Freizeitpark, Bauernhof)
- Look: Comic (Cel-Shading mit 3 Lichtstufen, dunkle Konturlinien, kräftige Farben, runde Formen)
- Technik: eine HTML-Datei, Three.js über CDN, Sound per Web Audio (ohne Dateien), keine Build-Tools, Hosting auf GitHub Pages (0 €)

## Schwierigkeit
| | Gegner | Tempo Start → Ende | Anlaufzeit | jagen dich ab (Klassik / Battle) |
|---|---|---|---|---|
| Leicht | 3 | 55 % → 80 % | 90 s | nie / Sekunde 50 |
| Normal | 3 | 65 % → 92 % | 60 s | Sekunde 40 / 30 |
| Schwer | 4 | 75 % → 95 % | 40 s | Sekunde 25 / 20 |

## Sterne
- Klassik: Punkte als Vielfaches des Stadtwerts (Vorstadt 9.481), die Punkte enthalten den Combo-Faktor.
  Leicht ≈ 3.050 / 9.000 / 19.900 · Normal ≈ 2.450 / 7.000 / 14.050 · Schwer ≈ 2.000 / 5.000 / 9.950
- Solo: 20 / 35 / 55 % der Stadt (nach Wert)
- Battle: ★ unter den Top 2 · ★★ Sieg · ★★★ Sieg mit mindestens 2 eigenen Kills

## Wachstum
Radius = 0,6 + 0,165 · XP^0,55 (XP = gefressene Masse). Lochtempo = 5 + 0,75 · Radius.
Gemessen mit dem Autopilot (Solo):

| Spielertyp | Autos | Häuser | Endboss | Stadt geschluckt |
|---|---|---|---|---|
| perfekt | 0:13 | 0:39–0:44 | 0:59–1:09 | 94–98 % |
| stark (90 %) | 0:17–0:19 | 0:53–0:57 | 1:20 | 56–92 % |
| durchschnittlich (80 %) | 0:20–0:22 | 1:07 | 1:41 | 24–47 % |

## XP & Stufen
1 Kleinkram & Menschen · 2 Laternen & Bänke · 3 Büsche · 4 Autos · 5 Bäume · 6 Brunnen & Gartenhäuser · 7 Häuser · 8 Wohnblöcke · 9 Endboss.
Die Anzeige oben links zeigt Stufe, XP bis zur nächsten Stufe und was dann dazukommt. Beim Aufstieg: Einblendung, Fanfare, Welle und Wolkenkranz.

## Icon
`icon.svg` (Quelle) → `icon-180/192/512.png` per Headless-Chrome + sips. `manifest.json` für den Homescreen (Vollbild).

## Skins
Minze (0★) · Koralle (1★) · Gold (3★) · Bonbon (5★) · Regenbogen (8★) · Lava (12★, pulsiert) · Galaxie (16★)

## Stand
| Phase | Inhalt | Status |
|---|---|---|
| 0 | Prototyp Level 1 | ✅ |
| 1a | Comic-Grafik, Schwierigkeit, Skins, Sterne | ✅ |
| 1b | Endboss, Kipp-/Verkant-Physik, XP-Anzeige, Icon | ✅ |
| 1c | Neues Konzept: 2-Minuten-Runde, Karte 180 × 180 (~1.240 Objekte), schnelles Wachstum, Modi Klassik/Solo/Battle, Beute-/Gefahr-Farben, Krone, Kill-Meldungen, Doppel-Kill, Combo, Schluck-Effekte, Sound, Autoverkehr mit Abbiegen, Siegerpodest | ✅ |
| 1d | Spielgefühl am iPad prüfen: Tempo, Steuerung, Performance, Ton | als Nächstes |
| 2 | Level-System: Welten als Daten, Levelauswahl, Freischaltung | 1–2 Sessions |
| 3 | Level 2–5 mit je 10–15 neuen Objekten und eigenem Endboss | 3–4 Sessions |
| 4 | Feinschliff nach dem iPad-Test | 0,5–1 Session |
| 5 | PWA: offline spielbar (Manifest + Icon ✅) | 0,5 Session |

Rest: ca. 5–8 Sessions.

## Die 5 Level
| # | Welt | Objekte (klein → groß) |
|---|---|---|
| 1 | Vorstadt | Hütchen, Briefkästen, Blumenkübel, Schilder, Menschen, Tonnen, Laternen, Bänke, Büsche, Bäume, Autos, Häuser, Wohnblöcke · Endboss: Riesenturm |
| 2 | Innenstadt | Tauben, Ampeln, Kioske, Busse, Hochhäuser |
| 3 | Strand & Hafen | Liegestühle, Schirme, Boote, Container, Kräne, Leuchtturm |
| 4 | Freizeitpark | Buden, Autoscooter, Karussell, Achterbahn, Riesenrad |
| 5 | Bauernhof | Hühner, Kühe, Heuballen, Traktoren, Scheune, Silo |

## Testen
Lokal: Server „lochfrass“ aus `.claude/launch.json` (Port 8060). In der Browser-Konsole:
- `__lf.mode('solo')` oder `__lf.mode('battle', 'schwer')` wählt Modus und Schwierigkeit
- `__lf.ap(0.8, 0.8)` lässt den Autopilot wie einen durchschnittlichen Menschen spielen (Tempo, Klugheit)
- `__lf.sim(120, true)` spielt eine Runde im Schnelldurchlauf und meldet, wann welche Stufe erreicht wurde

Achtung: Testrunden speichern Sterne im Browser. Danach die `lochfrass-`-Einträge im localStorage löschen.
