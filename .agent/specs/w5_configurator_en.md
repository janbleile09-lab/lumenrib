# AUFTRAG W5 — Konfigurator auf Englisch

## OBJEKTIV
`en/configurator.html` ist aktuell eine Kopie der deutschen Fassung: Titel und Description sind
englisch, die komplette Bedienoberfläche ist aber noch deutsch. Übersetze die **gesamte sichtbare
Oberfläche** ins Englische, ohne eine einzige Funktion zu verändern.

## ZIELDATEI
- **MODIFY:** `en/configurator.html` (einzige Datei!)
- **READ-ONLY als Referenz:** `konfigurator.html` (deutsche Fassung, NICHT ändern)
- **FORBIDDEN:** alle anderen Dateien.

## HARTE REGELN — jeder Verstoss macht die Datei kaputt
1. **Nicht anfassen:** alle `id="..."`, alle `onclick="..."`, alle Funktionsnamen, alle CSS-Klassen
   (Tailwind-Klassen wie `text-xs`, `bg-amber-400/15`), alle `value="..."`-Zahlen, alle `min`/`max`/`step`,
   alle Template-Variablen (`${...}`), alle `getElementById`-Aufrufe, alle mathematischen Ausdrücke.
2. **Nur Text übersetzen:** Textknoten zwischen Tags, `placeholder`/`title`/`aria-label`-Attribute,
   String-Literale, die per `textContent`/`innerHTML` in die Oberfläche geschrieben werden, und
   `alert`/`confirm`-Texte.
3. **Deutsche Zahlenformate:** `toLocaleString('de-DE')` und `toFixed(...)` bleiben unverändert —
   `de-DE` wird zu `en-GB`, sonst nichts.
4. **Umlaute in Einheiten:** `°`, `Ø`, `mm`, `g`, `PLA`, `PETG`, `ASA`, `STL`, `Beta`, `BETA` bleiben.
5. **Fachbegriffe, die englisch bleiben:** STL, PLA, PETG, ASA, LED, Brim, Perimeter (als "wall loops"),
   Slicer, mm, g.
6. **Der STL-Header-String** `Lumenrib Parametric Lantern - D...` bleibt exakt so, nur der
   Dateiname-Teil darf englisch werden.
7. Konsistenz: "lantern" (nicht "lamp"), "tea light" (Substantiv) / "tealight" nur im Dateinamen,
   "ribs" für Stäbe, "tray" für Teller, "top ring" für oberen Ring, "overhang" für Überhang,
   "support-free" für stützfrei, "section view" für Schnitt, "night mode" für Schatten/Nachtmodus.

## ÜBERSETZUNGS-GLOSSAR (verbindlich)
| Deutsch | Englisch |
|---|---|
| Laterne | lantern |
| Stäbe | ribs |
| Teller | tray |
| Kerze / Teelicht | candle / tea light |
| Deko / Motiv | decoration / motif |
| Form | shape |
| Gesamthöhe | total height |
| Max. Bauch-Durchmesser (Außen) | max. belly diameter (outer) |
| Obere Öffnung (Innendurchmesser) | top opening (inner diameter) |
| Basis-Durchmesser (unten) | base diameter (bottom) |
| Bauch-Höhenschwerpunkt | belly height centre |
| Kurven-Wölbung | curve tension |
| Verwindung / Twist | twist |
| Oberer Ring | top ring |
| Stabilisator / Zwischenring | stabilizer ring |
| Stützfrei | support-free |
| Überhangwinkel | overhang angle |
| Rand | rim |
| Vertiefung | recess |
| Wandlinien / Perimeter | wall loops |
| Schichthöhe | layer height |
| Vorlagen | presets |
| Teelicht | tea light |
| Klassik | Classic |
| Weihnachten | Christmas |
| Bauchig Groß | Lounge |
| Helix Twist | Helix Twist |
| Hohe Laterne | Tall lantern |
| Zurücksetzen | reset |
| Herunterladen | download |
| Vollbild | fullscreen |
| Einsetz-Test | fit test |
| Schnitt | section view |
| Schatten | shadows |
| Nachtmodus | night mode |
| Ungefährlich | safe |
| Fragil | fragile |
| Vorschau | preview |
| Druckzeit | print time |
| Dreiecke | triangles |
| Maßstab | scale |
| Ohne Kerze exportiert | exported without candle |

## VORGEHEN
Arbeite mit gezielten `patch`-Operationen (die Datei hat ~3200 Zeilen). Übersetze abschnittsweise:
Kopfbereich/Header, Preset-Leiste, jeder Tab (Form / Stäbe / Deko / Teller / Kerze), Check-Panel,
Werkzeugleiste unten, Export-Modal, Toast-Meldungen, alle JS-generierten Texte.

## DEFINITION OF DONE
```zsh
cd /Users/janbleile/lito-site
python3 - <<'PY'
import re, sys
de = open('konfigurator.html', encoding='utf-8').read()
en = open('en/configurator.html', encoding='utf-8').read()
ok = True

# 1) Struktur muss identisch bleiben: alle ids, onclick, value-Kombis
ids_de = re.findall(r'id="([^"]+)"', de)
ids_en = re.findall(r'id="([^"]+)"', en)
print('IDs DE/EN:', len(ids_de), len(ids_en), 'gleich:', ids_de == ids_en)
ok &= ids_de == ids_en

# 2) deutsche Wörter dürfen im sichtbaren Text nicht mehr vorkommen
german = ['Laterne','Stäbe','Teller','Kerze','Gesamthöhe','Durchmesser','Öffnung','Wölbung',
          'Verwindung','Überhang','Vertiefung','Vorlagen','Zurücksetzen','Herunterladen',
          'Vollbild','Schnitt','Schatten','Druckzeit','Dreiecke','Maßstab','Klassik',
          'Weihnachten','Bauchig','Hohe','Stützfrei','Nachtmodus','Vorschau','Ungefährlich',
          'Fragil','Wandlinien','Schichthöhe','Bauch-','Basis-']
hits = [w for w in german if w in en]
print('deutsche Reste:', hits if hits else 'keine')
ok &= not hits

# 3) Umlaute im sichtbaren Text
uml = re.findall(r'[äöüÄÖÜß]', en)
print('Umlaute übrig:', len(uml))
ok &= len(uml) == 0

# 4) JS-Syntax
import subprocess, tempfile, os
js = re.findall(r'<script>(.*?)</script>', en, re.S)[-1]
p = tempfile.mktemp(suffix='.js'); open(p,'w').write(js)
r = subprocess.run(['node','--check',p], capture_output=True, text=True)
print('JS-Syntax:', 'OK' if r.returncode==0 else r.stderr[:300])
ok &= r.returncode == 0
os.unlink(p)
print('ERGEBNIS:', 'OK' if ok else 'FEHLER')
sys.exit(0 if ok else 1)
PY
```
Erwartet: `ERGEBNIS: OK`, `IDs DE/EN: N N gleich: True`, `Umlaute übrig: 0`, `JS-Syntax: OK`.
Falls Umlaute in Kommentaren oder in erlaubten Wörtern stecken: Kommentare darfst du ebenfalls
übersetzen, das ist der einfachste Weg auf null zu kommen.
