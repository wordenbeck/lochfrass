# Lochfrass! – High-Level-Konzept

## Die Idee in einem Satz
Ein Loch im Boden frisst sich in zwei Minuten vom Kanaldeckel zum Riesenschlund durch eine Comic-Stadt. Am Ende fällt der Endboss-Turm.

## Leitlinien
1. **Kurz und knackig wie das Original:** Runden von 2 Minuten, ständiges Wachsen, alle paar Sekunden etwas Neues.
2. **Sofort lesbar:** Du siehst jederzeit, wer Beute ist, wer gefährlich ist und was du als Nächstes fressen kannst.
3. **Jedes Schlucken fühlt sich gut an:** Plopp, Pulsen, Staubwolke, Wackeln.
4. **Für Thomas gebaut:** werbefrei, kostenlos, iPad, offline-tauglich.

## Spielmodi
| Modus | Ziel | Gegner | Wer gefressen wird … | Sterne (je 3) |
|---|---|---|---|---|
| **Klassik** | die meisten Punkte nach 2:00 | 3–4 KI-Löcher | ist nach 3 s wieder dabei (klein) | Punkte-Schwellen, je Schwierigkeit |
| **Solo** | möglichst viel % der Stadt in 2:00 | keine | – | %-Schwellen |
| **Battle** | als letztes Loch übrig bleiben (bei Zeitablauf gewinnen die meisten Punkte) | 3–4 KI-Löcher, jagen früh | ist raus | Top 2 / Sieg / Sieg mit 2 eigenen Kills |

Die Schwierigkeit (Leicht / Normal / Schwer) gilt für Klassik und Battle. Die Gegner starten immer langsam und werden über die Runde schneller und schlauer.

## Ablauf einer Runde (Zielzeiten für einen Menschen)
| Zeit | Stufe | Du frisst jetzt auch … |
|---|---|---|
| 0:00 | 1 | Kleinkram, Menschen |
| ~0:05 | 2 | Laternen, Bänke |
| ~0:10 | 3 | Büsche |
| ~0:25 | 4 | Autos |
| ~0:30 | 5 | Bäume |
| ~0:40 | 6 | Brunnen, Gartenhäuser |
| ~1:05 | 7 | Häuser |
| ~1:25 | 8 | Wohnblöcke |
| ~1:40 | 9 | Endboss |

Als Messlatte dient der Autopilot. Er spielt perfekt und ist etwa 30–40 % schneller als ein Mensch. Wachstum, Lochtempo und Kartengröße (180 × 180) sind auf diese Zeiten abgestimmt. Gemessen mit dem Autopilot im Tempo eines Durchschnittsspielers: Autos 0:20, Häuser 1:07, Endboss 1:41. Die genauen Werte stehen in `PLAN.md`.

## Bewegung und Physik
- **Lochtempo:** ruhiger als bisher. Ein kleines Loch fährt etwa 5,5 Einheiten pro Sekunde, ein großes etwa 11. Die Kamera zoomt mit der Größe heraus.
- **Kippen, Verkanten, Verhaken:** Lange Dinge bleiben schräg hängen, Hin-und-her-Wackeln löst sie.
- **Autostrom:** Autos fahren auf ihrer Spur, biegen an Kreuzungen ab und wenden am Kartenrand. So rollt ständig Futter durch die Straßen.

## Feedback
- **XP-Leiste:** Stufe, XP bis zur nächsten Stufe, „Als Nächstes: …“.
- **Beute oder Gefahr:** Gegnernamen grün = kannst du fressen, rot = kann dich fressen.
- **Krone:** schwebt über dem führenden Loch und steht in der Rangliste.
- **Kill-Meldungen:** oben in der Mitte, zum Beispiel „Mampf hat Krümel geschluckt“. Zwei Kills in 4 Sekunden gelten als Doppel-Kill und bringen +50.
- **Combo:** Wer schnell hintereinander frisst, bekommt x2 bis x5 auf die Punkte. Die XP bleiben davon unberührt, damit das Wachstum fair bleibt.
- **Schluck-Effekte:** Das Loch pulst, große Objekte hinterlassen Staubwolken, bei Häusern, Kills und dem Endboss wackelt die Kamera.
- **Sound:** wird im Browser erzeugt, es gibt keine Audio-Dateien. Plopp je nach Größe, Rums bei Großem, Fanfare beim Stufenaufstieg, Combo-Töne, Countdown in den letzten 10 Sekunden, Schluss-Jingle. Mit Ton-Knopf zum Ausschalten.
- **Rundenende:** Podest mit Platz 1–3 und Krone, Sterne, neu freigeschaltete Skins, Knöpfe „Nochmal“ und „Menü“.

## Fortschritt
- **Sterne pro Welt:** Klassik 3 × 3, Battle 3 × 3, Solo 3. Das sind 21 pro Welt.
- **Skins:** ab 0 / 1 / 3 / 5 / 8 / 12 / 16 Sternen.
- **5 Welten** mit je eigenem Endboss: Vorstadt (Riesenturm), danach Innenstadt, Strand & Hafen, Freizeitpark, Bauernhof.

## Bildschirm (iPad)
- **oben links:** Zeit, Punkte (im Solo zusätzlich % der Stadt), Ton-Knopf, XP-Leiste, Endboss-Leiste
- **oben Mitte:** Kill-Meldungen, darunter die Combo
- **oben rechts:** Rangliste mit Krone
- **überall:** Daumen-Joystick (Finger auflegen und ziehen)

## Technik
Eine HTML-Datei, Three.js über CDN, Web Audio, localStorage, Hosting auf GitHub Pages. Laufende Kosten: 0 €.

## Bewusst weggelassen
- **Echter Mehrspieler:** bräuchte einen Server, und der kostet. Das Original setzt ebenfalls auf Bots.
- **Vibration:** Safari auf dem iPad unterstützt sie nicht.
