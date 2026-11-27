# Lochfrass! – High-Level-Konzept

## Die Idee in einem Satz
Ein Loch im Boden frisst sich in zwei Minuten vom Kanaldeckel zum Riesenschlund durch eine Comic-Welt. Am Ende versinkt der Endboss.

## Leitlinien
1. **Kurz und knackig wie das Original:** Runden von 2 Minuten, ständiges Wachsen, alle paar Sekunden etwas Neues.
2. **Sofort lesbar:** Du siehst jederzeit, wer Beute ist und wer gefährlich ist. Was schon ins Loch passt, findest du selbst heraus.
3. **Jedes Schlucken fühlt sich gut an:** Plopp, Pulsen, Staubwolke, Wackeln, Dinge kippen und purzeln hinein.
4. **Für die Familie gebaut:** werbefrei, kostenlos, iPad, eigene Profile für jeden Spieler.

## Spielmodi
| Modus | Ziel | Gegner | Wer gefressen wird … | Sterne (je 3) |
|---|---|---|---|---|
| **Klassik** | die meisten Punkte nach 2:00 | 3–4 KI-Löcher | ist nach 3 s wieder dabei (klein) | Punkte-Schwellen, je Schwierigkeit |
| **Solo** | möglichst viel % der Welt in 2:00 | keine | – | %-Schwellen |
| **Battle** | als letztes Loch übrig bleiben (bei Zeitablauf gewinnen die meisten Punkte) | 3–4 KI-Löcher, jagen früh | ist raus | Top 2 / Sieg / Sieg mit 2 eigenen Kills |

Die Schwierigkeit (Leicht / Normal / Schwer) gilt für Klassik und Battle. Die Gegner starten langsam und werden über die Runde schneller und schlauer.
Ein Gegner, der schon größer ist als du, wächst langsamer weiter. So bleibt die Runde bis zum Schluss offen.

## Ablauf einer Runde (Vorstadt, Durchschnittsspieler)
| Zeit | Stufe | Du frisst jetzt auch … |
|---|---|---|
| 0:00 | 1 | Kleinkram, Menschen |
| ~0:05 | 2 | Laternen, Bänke |
| ~0:05 | 3 | Büsche |
| ~0:10 | 4 | Autos |
| ~0:12 | 5 | Bäume |
| ~0:15 | 6 | Brunnen, Gartenhäuser |
| ~0:35 | 7 | Häuser |
| ~1:05 | 8 | Wohnblöcke |
| ~1:20 | 9 | Endboss |

Als Messlatte dient der Autopilot im Tempo eines Durchschnittsspielers. Die anderen Welten sind auf dasselbe Tempo abgestimmt (Endboss nach etwa 1:20–1:35). Die genauen Werte stehen in `PLAN.md`.

## Bewegung und Physik
- **Lochtempo:** Ein kleines Loch fährt etwa 5,5 Einheiten pro Sekunde, ein großes etwa 13. Die Kamera zoomt mit der Größe heraus.
- **Echte Physik:** Dinge in Lochnähe werden bewegliche Körper. Sie kippen über die Kante, rollen, verkanten sich und fallen hinein. Hin-und-her-Wackeln löst Verkantetes.
- **Etagen-Häuser:** Häuser haben 1–3 Etagen, Hotels und Wohnblöcke mehr. Jede Etage bricht einzeln ab und fällt ins Loch.
- **Endboss:** wackelt, solange das Loch zu klein ist. Passt er hinein, versinkt er senkrecht wie ein Pfahl.
- **Verkehr:** Autos, Traktoren, Buggys, Rover und Bimmelbahnen fahren auf ihrer Spur, biegen an Kreuzungen ab und wenden am Kartenrand. So rollt ständig Futter durch die Straßen.

## Feedback
- **XP-Leiste:** Stufe und XP bis zur nächsten Stufe. Beim Aufstieg erscheint „Stufe N!“.
- **Beute oder Gefahr:** Gegnernamen grün = kannst du fressen, rot = kann dich fressen.
- **Krone:** schwebt über dem führenden Loch und steht in der Rangliste.
- **Kill-Meldungen:** oben in der Mitte, zum Beispiel „Mampf hat Krümel geschluckt“. Zwei Kills in 4 Sekunden gelten als Doppel-Kill und bringen +50.
- **Combo:** Wer schnell hintereinander frisst, bekommt x2 bis x5 auf die Punkte. Die XP bleiben davon unberührt, damit das Wachstum fair bleibt.
- **Schluck-Effekte:** Das Loch pulst, große Objekte hinterlassen Staubwolken, bei Häusern, Kills und dem Endboss wackelt die Kamera.
- **Sound:** wird im Browser erzeugt, es gibt keine Audio-Dateien. Plopp je nach Größe, Rums bei Großem, Fanfare beim Stufenaufstieg, Combo-Töne, Countdown in den letzten 10 Sekunden, Schluss-Jingle. Mit Ton-Knopf zum Ausschalten.
- **Rundenende:** Podest mit Platz 1–3 und Krone, Sterne, gesammelte Punkte, neu freigeschaltete Skins und Avatare, Knöpfe „Nochmal“ und „Menü“.

## Fortschritt
- **Profile:** Beim Start fragt das Spiel „Wer spielt?“. Jeder Spieler hat eigene Punkte, Sterne und sein eigenes Loch.
- **Punkte:** Jede Runde zählt auf das Punktekonto des Spielers.
- **Sterne pro Welt:** Klassik 3 × 3, Battle 3 × 3, Solo 3. Das sind 21 pro Welt.
- **Skins:** ab 0 / 1 / 3 / 5 / 8 / 12 / 16 Sternen.
- **Avatare:** 10 Loch-Avatare mit eigener Deko am Rand, freigespielt über Punkte: Dino, Hai, Frosch, Krake, Drache, Monster, Roboter, UFO, Vulkan, Schwarzes Loch.
- **5 Welten** mit je eigenem Endboss: Vorstadt (Riesenturm), Sonnenbucht (Leuchtturm), Bauernhof (Windmühle), Rummelplatz (Freifallturm), Mondbasis (Rakete). Alle sind von Anfang an spielbar.

## Bildschirm (iPad)
- **oben links:** Zeit, Punkte (im Solo zusätzlich % der Welt), Ton-Knopf, XP-Leiste, Endboss-Leiste
- **oben Mitte:** Kill-Meldungen, darunter die Combo
- **oben rechts:** Rangliste mit Krone
- **überall:** Daumen-Joystick (Finger auflegen und ziehen)

## Technik
`index.html` plus JS-Module, Three.js und die Physik-Engine Rapier über CDN, Web Audio, localStorage, Hosting auf GitHub Pages. Laufende Kosten: 0 €.

Module: `main.js` (Spielablauf, Kamera, Menüs), `physics.js`, `kit.js` (Baukasten: Häuser, Bäume, Leute …), `props.js` (Details: Garten, Spielplatz, Café, Ampel, Bushaltestelle, Lieferwagen, Bus, Hund, Boden-Schmuck), `avatars.js`, `kamera.js` (Kamera-Regler, nur mit `?kamera`), `world-<id>.js` (je eine Welt).

## Bewusst weggelassen
- **Echter Mehrspieler:** bräuchte einen Server, und der kostet. Das Original setzt ebenfalls auf Bots.
- **Vibration:** Safari auf dem iPad unterstützt sie nicht.
