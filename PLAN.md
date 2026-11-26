# Lochfrass! – Plan

Eigenes Loch-Schluck-Spiel für das iPad als PWA. Werbefrei, kostenlos, nur für Thomas.
Die Spielmechanik kennt man aus den „Loch“-io-Spielen, Name, Welten und Comic-Look sind eigene.

Live: https://wordenbeck.github.io/lochfrass/

## Entscheidungen
- Gerät: iPad (Touch-Joystick: Finger irgendwo ablegen und ziehen), am Mac zusätzlich Maus/WASD
- Runde: 2:30, gegen KI-Löcher; größere Löcher fressen kleinere, Respawn nach 3 s
- Schwierigkeit wählbar (Leicht / Normal / Schwer). Gegner starten immer langsam und werden über eine Anlaufzeit schneller und schlauer
- Sterne pro Level und Schwierigkeit (Level 1: max. 9), damit lassen sich Loch-Skins freischalten
- Welten: 5 verschiedene (Vorstadt, Innenstadt, Strand & Hafen, Freizeitpark, Bauernhof)
- Look: Comic (Cel-Shading mit 3 Lichtstufen, dunkle Konturlinien, kräftige Farben, runde Formen)
- Technik: eine HTML-Datei, Three.js über CDN, keine Build-Tools, Hosting auf GitHub Pages (0 €)

## Schwierigkeit
| | Gegner | Tempo Start → Ende | Anlaufzeit | jagen dich ab |
|---|---|---|---|---|
| Leicht | 3 | 35 % → 65 % | 120 s | nie |
| Normal | 3 | 45 % → 85 % | 90 s | 60 s |
| Schwer | 4 | 60 % → 100 % | 45 s | 20 s |

Sterne-Grenzen sind Anteile am Gesamtwert der Karte (Normal: 12 / 22 / 34 % ≈ 800 / 1500 / 2300 Punkte).
Kalibriert mit Autopilot: Ein perfekter Bot leert die Karte in ca. 105 s, ein Mensch schafft deutlich weniger.

## Skins
Minze (0★) · Koralle (1★) · Gold (2★) · Bonbon (3★) · Regenbogen (5★) · Lava (7★, pulsiert) · Galaxie (9★)

## Stand
| Phase | Inhalt | Status |
|---|---|---|
| 0 | Prototyp Level 1 | ✅ |
| 1a | Comic-Grafik, größere Welt (180 × 180, ~1.300 Objekte), Schwierigkeit, Skins, Sterne | ✅ |
| 1b | Spielgefühl am iPad prüfen: Tempo, Steuerung, Performance, Balancing | als Nächstes |
| 2 | Level-System: Welten als Daten, Levelauswahl, Freischaltung | 1–2 Sessions |
| 3 | Level 2–5 mit je 10–15 neuen Objekten | 3–4 Sessions |
| 4 | Feinschliff: Partikel, Wackeln, Sound (optional) | 1 Session |
| 5 | PWA: Manifest, Icon, offline spielbar | 1 Session |

Rest: ca. 6–9 Sessions.

## Die 5 Level
| # | Welt | Objekte (klein → groß) |
|---|---|---|
| 1 | Vorstadt | Menschen, Tonnen, Hydranten, Laternen, Bänke, Büsche, Bäume, Autos, Häuser, Wohnblöcke |
| 2 | Innenstadt | Tauben, Ampeln, Kioske, Busse, Hochhäuser |
| 3 | Strand & Hafen | Liegestühle, Schirme, Boote, Container, Kräne, Leuchtturm |
| 4 | Freizeitpark | Buden, Autoscooter, Karussell, Achterbahn, Riesenrad |
| 5 | Bauernhof | Hühner, Kühe, Heuballen, Traktoren, Scheune, Silo |

## Testen
Lokal: Server „lochfrass“ aus `.claude/launch.json` (Port 8060).
In der Browser-Konsole spielt `__lf.sim(150, true)` eine Runde im Schnelldurchlauf mit Autopilot.
