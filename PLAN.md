# Lochfrass! – Plan

Eigenes Loch-Schluck-Spiel für das iPad als PWA. Werbefrei, kostenlos, nur für Thomas.
Die Spielmechanik kennt man aus den „Loch“-io-Spielen, Name, Welten und Comic-Look sind eigene.

Live: https://wordenbeck.github.io/lochfrass/

## Entscheidungen
- Gerät: iPad (Touch-Joystick: Finger irgendwo ablegen und ziehen), am Mac zusätzlich Maus/WASD
- Runde: 10 Minuten, gegen KI-Löcher; größere Löcher fressen kleinere, Respawn nach 3 s
- Langsamer Aufbau: Start mit winzigem Loch (Radius 0,6), erst Kleinkram, Autos nach Minuten, Häuser später, Endboss gegen Ende
- Jedes Level hat einen Endboss: ein riesiges Hochhaus, das nur der Spieler schlucken kann (+1.500 Punkte)
- Physik light: Objekte kippen über die Lochkante, lange Dinge verkanten sich (Hin-und-her-Wackeln löst sie), zu große verhaken sich am Rand
- Schwierigkeit wählbar (Leicht / Normal / Schwer). Gegner starten immer langsam und werden über eine Anlaufzeit schneller und schlauer
- Sterne pro Level und Schwierigkeit (Level 1: max. 9), damit lassen sich Loch-Skins freischalten
- Welten: 5 verschiedene (Vorstadt, Innenstadt, Strand & Hafen, Freizeitpark, Bauernhof)
- Look: Comic (Cel-Shading mit 3 Lichtstufen, dunkle Konturlinien, kräftige Farben, runde Formen)
- Technik: eine HTML-Datei, Three.js über CDN, keine Build-Tools, Hosting auf GitHub Pages (0 €)

## Schwierigkeit
| | Gegner | Tempo Start → Ende | Anlaufzeit | jagen dich ab |
|---|---|---|---|---|
| Leicht | 3 | 35 % → 65 % | 7 min | nie |
| Normal | 3 | 45 % → 85 % | 5 min | Minute 3 |
| Schwer | 4 | 60 % → 100 % | 2,5 min | Minute 1 |

Sterne-Grenzen sind Anteile am Gesamtwert der Karte (Leicht 10/20/35 %, Normal 15/30/50 %, Schwer 20/40/60 %; Normal ≈ 2.050 / 4.100 / 6.800 Punkte).

Wachstum: Radius = 0,6 + 0,031 · Punkte^0,625. Zeitplan mit perfektem Autopilot: Autos 1:30, Häuser 3:45, Wohnblöcke 5:45, Endboss 7:00. Ein Mensch braucht etwa das 1,3- bis 1,5-Fache.

## Skins
Minze (0★) · Koralle (1★) · Gold (2★) · Bonbon (3★) · Regenbogen (5★) · Lava (7★, pulsiert) · Galaxie (9★)

## Stand
| Phase | Inhalt | Status |
|---|---|---|
| 0 | Prototyp Level 1 | ✅ |
| 1a | Comic-Grafik, Schwierigkeit, Skins, Sterne | ✅ |
| 1b | 10-Minuten-Runde, Welt 240 × 240 (~2.100 Objekte), Kleinkram, langsames Wachstum, Endboss, Kipp-/Verkant-Physik | ✅ |
| 1c | Spielgefühl am iPad prüfen: Tempo, Steuerung, Performance, Balancing | als Nächstes |
| 2 | Level-System: Welten als Daten, Levelauswahl, Freischaltung | 1–2 Sessions |
| 3 | Level 2–5 mit je 10–15 neuen Objekten | 3–4 Sessions |
| 4 | Feinschliff: Partikel, Wackeln, Sound (optional) | 1 Session |
| 5 | PWA: Manifest, Icon, offline spielbar | 1 Session |

Rest: ca. 6–9 Sessions.

## Die 5 Level
| # | Welt | Objekte (klein → groß) |
|---|---|---|
| 1 | Vorstadt | Hütchen, Briefkästen, Blumenkübel, Schilder, Menschen, Tonnen, Laternen, Bänke, Büsche, Bäume, Autos, Häuser, Wohnblöcke · Endboss: Riesenturm |
| 2 | Innenstadt | Tauben, Ampeln, Kioske, Busse, Hochhäuser |
| 3 | Strand & Hafen | Liegestühle, Schirme, Boote, Container, Kräne, Leuchtturm |
| 4 | Freizeitpark | Buden, Autoscooter, Karussell, Achterbahn, Riesenrad |
| 5 | Bauernhof | Hühner, Kühe, Heuballen, Traktoren, Scheune, Silo |

## Testen
Lokal: Server „lochfrass“ aus `.claude/launch.json` (Port 8060).
In der Browser-Konsole spielt `__lf.sim(600, true)` eine Runde im Schnelldurchlauf mit Autopilot.
