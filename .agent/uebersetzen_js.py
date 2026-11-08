# -*- coding: utf-8 -*-
"""Übersetzt die JS-generierten UI-Strings in en/configurator.html."""
DST = 'en/configurator.html'
s = open(DST, encoding='utf-8').read()

M = [
 # Tooltips / Buttons
 ('Menü einblenden', 'Show menu'),
 ('Testet visuell, ob die Kerze durch die obere Öffnung passt',
  'Visually checks whether the candle fits through the top opening'),
 ('Halbiert das Modell, um den Kerzenteller und die Vertiefung im Inneren zu sehen',
  'Cuts the model in half so you can see the tray and the recess inside'),
 ('Schaltet das Umgebungslicht dunkel, um den dramatischen Schattenwurf der Stäbe zu zeigen',
  'Darkens the ambient light to show the dramatic shadow cast of the ribs'),
 # Farbnamen
 ('Nordic Sage / Salbeigrün', 'Nordic Sage'),
 ('Seidenmatt Weiß', 'Silk Matte White'),
 # Tray-Info
 ('Ring-Höhe (Fester Vasen-Innenring)', 'Ring height (permanent inner ring)'),
 ('Ring- & Hebel-Höhe', 'Ring & lever height'),
 # Kennzahlen
 ("'} Dreiecke • Maßstab 1:1 (mm)'", "'} triangles • scale 1:1 (mm)'"),
 ("toLocaleString('de-DE')", "toLocaleString('en-GB')"),
 ('Geschätzte Druckzeit: ~${hours}h ${mins}m', 'Estimated print time: ~${hours}h ${mins}m'),
 ('Laterne Ø${state.bellyDia} × ${state.height} mm • ${state.ribCount} Stäbe',
  'Lantern Ø${state.bellyDia} × ${state.height} mm • ${state.ribCount} ribs'),
 ('Max. ${roundedOverhang}° (Stützfrei)', 'Max. ${roundedOverhang}° (support-free)'),
 # Stabilität / Druck
 ('Fragil (Stäbe zu dünn)', 'Fragile (ribs too thin)'),
 ('Anspruchsvoller Druck (Kühlung beachten)', 'Demanding print (watch your cooling)'),
 ('Erhöhtes Fehlschlag- & Kollisions-Risiko!', 'Increased failure & collision risk!'),
 ('Ungefährlich (Kein Fehlschlag-Risiko)', 'Harmless (no failure risk)'),
 ('Leichtes Schwingen möglich (${freeSpanMm} mm frei)',
  'Slight vibration possible (${freeSpanMm} mm free)'),
 ('Vibrations-Gefahr! (Freie Länge ${freeSpanMm} mm)',
  'Vibration risk! (free length ${freeSpanMm} mm)'),
 ('${freeSpanMm} mm (Ungestützt!)', '${freeSpanMm} mm (unsupported!)'),
 ('ohne Zwischenringe', 'without intermediate rings'),
 # Kerzen-Check
 ('Kerze passt oben nicht durch!', 'Candle does not fit through the top!'),
 ('Die obere Öffnung (Ø${state.topInnerDia} mm) ist kleiner als deine Kerze (Ø${state.candleDia} mm). Du kannst die Kerze später nicht von oben einsetzen!',
  'The top opening (Ø${state.topInnerDia} mm) is smaller than your candle (Ø${state.candleDia} mm). You will not be able to insert the candle from the top!'),
 ('Deine Ø${state.candleDia} mm Kerze passt bequem durch die Ø${state.topInnerDia} mm Öffnung (+${openingDiff.toFixed(0)} mm Spiel) und steht sicher in d',
  'Your Ø${state.candleDia} mm candle fits comfortably through the Ø${state.topInnerDia} mm opening (+${openingDiff.toFixed(0)} mm clearance) and sits securely in the'),
 ('Öffnungs-Spiel beträgt nur +${openingDiff.toFixed(0)} mm (oder Bodenstärke ${floorThickness.toFixed(1)} mm ist knapp). Etwas mehr Spiel erleichtert das Einsetzen.',
  'the opening clearance is only +${openingDiff.toFixed(0)} mm (or the floor thickness ${floorThickness.toFixed(1)} mm is tight). A little more clearance makes insertion easier.'),
 # Überhang
 ('Max. Überhangwinkel von ${overhang}° liegt im sicheren Bereich. Kein Curling (Hochbiegen) und keine Kollisionsgefahr für die Druckerdüse.',
  'A maximum overhang of ${overhang}° is in the safe range. No curling and no collision risk for the nozzle.'),
 ('Der Überhang von ${overhang}° ist sehr flach. Die freien Stab-Kanten können sich beim Abkühlen nach oben wölben (Curling), sodass die Düse dagegen stößt und den Druck abreißt (',
  'The ${overhang}° overhang is very shallow. The free rib edges can curl upwards while cooling, so the nozzle hits them and the print fails ('),
 ('Überhang von ${overhang}° erfordert gute Bauteilkühlung (100% Lüfter) und reduzierte Überhang-Geschwindigkeit, damit die Lamellen sauber schichten.',
  'A ${overhang}° overhang needs good part cooling (100 % fan) and reduced overhang speed so the lamellae layer cleanly.'),
 # Ringe / Stäbe
 ('Ohne ausreichende Ringe schwingen die ${state.height} mm langen Stäbe durch die Düsenbewegung auf. Aktiviere 2 durchgehende Ausbrech-Ringe!',
  'Without enough rings the ${state.height} mm long ribs vibrate with the nozzle movement. Activate 2 continuous breakaway rings!'),
 ('Bei ${state.ribWidth.toFixed(1)} × ${state.ribDepth.toFixed(1)} mm schwingen die Stäbe stark. Empfehlung: mind. 2.4 × 4.0 mm plus durchgehenden Ausbrech-Ring.',
  'At ${state.ribWidth.toFixed(1)} × ${state.ribDepth.toFixed(1)} mm the ribs vibrate strongly. Recommendation: at least 2.4 × 4.0 mm plus a continuous breakaway ring.'),
 ('Ein zusätzlicher durchgehender Stützring würde die freie Stablänge weiter verkürzen und alle Stäbe noch gleichmäßiger stabilisieren.',
  'An additional continuous support ring would shorten the free rib length further and stabilise all ribs more evenly.'),
 ('Dank ${stabModeText} lassen sich die Ringe von oben durch Nach-unten-Drücken auf den inneren Hebelkragen (6.5× Hebelarm) im Domino-Effekt abschälen, ohne dass ein Stab bricht.',
  'Thanks to ${stabModeText} the rings can be peeled off from the top by pressing down on the inner lever collar (6.5× lever arm) in a domino effect, without breaking a rib.'),
 ('Fester, von unten im 42°-Winkel selbsttragender Stabilisierungsring in Laternenfarbe. Braucht keinen Slicer-Support und verbindet alle Stäbe dauerhaft.',
  'Fixed, self-supporting stabiliser ring in the lantern colour, printed at a 42° angle from below. Needs no slicer support and permanently connects all ribs.'),
 ('pro Stab hält <strong>nur 1 unterer Pin</strong> (kein oberer Pin)',
  'holds <strong>only 1 lower pin</strong> per rib (no upper pin)'),
 ('4 von ${s} Stäben haben <strong>nur 1 Pin</strong> (2. Micro-Pin nur an jedem ${s}. Stab)',
  '4 of ${s} ribs have <strong>only 1 pin</strong> (2nd micro pin on every ${s}th rib only)'),
 ('1 Pin + jeder 5. Stab 2. Pin mit 0.65 mm V-Schälkerbe für leichtes Aushebeln.',
  '1 pin + 2nd pin on every 5th rib with a 0.65 mm V-peel notch for easy removal.'),
]

missing = []
for a, b in M:
    if a in s:
        s = s.replace(a, b)
    else:
        missing.append(a[:80])

open(DST, 'w', encoding='utf-8').write(s)
print('ersetzt:', len(M) - len(missing), 'von', len(M))
for m in missing:
    print('  FEHLT:', m)
