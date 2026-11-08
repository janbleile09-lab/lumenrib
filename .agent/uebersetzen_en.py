# -*- coding: utf-8 -*-
"""Baut en/configurator.html aus konfigurator.html: Textknoten textbasiert übersetzen."""
import re, sys

SRC = 'konfigurator.html'
DST = 'en/configurator.html'

# Reihenfolge entspricht der deduplizierten Textknotenliste (nodes.txt, 192 Einträge)
EN = [
 'Lumenrib — Parametric 3D Lantern & Tea Light Designer (STL Export)',
 'Fullscreen',
 'Lumenrib',
 'STL Ready',
 'Parametric 3D Lantern & Candle Holder Designer',
 'Presets:',
 'Tea light',
 'Classic',
 '★ Christmas',
 'Lounge',
 'Helix Twist',
 'Tall lantern',
 '3D print & candle check',
 '~75 g PLA',
 'Top opening',
 '+24 mm clearance',
 'Overhang angle',
 'Max. 38° (support-free)',
 'Tray recess inside:',
 'Outer dims:',
 'Colour:',
 'Candle',
 'Fit test',
 'Section view',
 'Shadows',
 '1. Shape',
 '2. Ribs',
 '3. Decoration',
 'BETA',
 '4. Tray',
 '5. Candle',
 'Lantern geometry & dimensions',
 'All values exact in millimetres (mm) for 3D printing',
 'Reset',
 'Total lantern height',
 '90 mm (mini)',
 '110 mm (tea light standard)',
 '280 mm (large)',
 'Max. belly diameter (outer)',
 '124 mm (tea light)',
 'Top opening (inner diameter)',
 'Must be larger than the candle diameter (',
 ') so the candle can be inserted from the top.',
 'Base diameter (bottom)',
 'Belly height centre',
 'Low centre (teardrop)',
 'Centre (sphere)',
 'High (shoulder)',
 'Curve tension (3D print optimisation)',
 'Controls how gently the ribs rise from the base plate. Values around 45–60 % guarantee support-free 3D printing!',
 'Lamellae / ribs & stability',
 'Flat, rounded struts like the original design',
 'Number of ribs',
 'ribs',
 '16 (open)',
 '48 (as in the photo)',
 '80 (very dense)',
 'Rib width (tangential)',
 'Recommended for a 0.4 mm nozzle: at least 2.0 mm (5 wall loops).',
 'Rib depth (radial wall thickness)',
 'Gives the ribs their high vertical bending stiffness and the lamella look.',
 'Spiral twist',
 '-90° left',
 '0° straight (original)',
 '+90° right',
 'Top finishing ring (support-free 42°)',
 'Includes self-supporting 30° gothic arches between the ribs and a 42° inner chamfer for 100 % support-free printing.',
 'Top-down lever-snap rings (V5 • PETG ready)',
 'One main pin with a V-peel notch per rib plus a 2nd pin every 4 ribs. Push out from top to bottom through the inner lever collar in a domino effect!',
 'Lever-snap V5',
 '(push from the top)',
 'Permanent ring',
 '(stays in)',
 'Off',
 '(no ring)',
 'Number of support rings (upper focus)',
 'rings',
 '1 ring (72 %)',
 '3 rings (45/68/87 %)',
 '5 rings (max. hold)',
 'Lever collar width inside (6.5× lever arm)',
 'Ring & lever height',
 'Pin breakaway point (V-notch on the rib)',
 '0.50 mm (PETG soft)',
 '0.65 mm (ideal)',
 '1.00 mm (strong)',
 '2nd upper support pin (spacing)',
 'Every 4th rib',
 '0 = only 1 pin (max. leverage)',
 'Every 4th rib (default)',
 'Every 8th rib',
 'Top-down leverage:',
 'Reach through the top opening and press down on the angled inner edge of the ring. Since 3 out of 4 ribs',
 'have only 1 pin with an upper V-peel notch',
 'and the ring has domino notches, the ring tilts downward and peels the pins off one by one without bending the ribs!',
 'Root reinforcement at the base (root boost)',
 'Gently reinforces the bottom fifth of the ribs at the transition to the tray, where the highest bending moment occurs.',
 'Max. free length at the top:',
 '~22 mm (64× stiffer)',
 'Beta — decoration is still in development. Motifs and reliefs may still change in shape and placement.',
 'Christmas stars & symbols',
 'Support-free ≤42°',
 'Distributes support-free printable stars or winter symbols between the ribs — casts magical shadow patterns!',
 'Select motif / symbol',
 'No decoration',
 '3D Christmas tree',
 '3D star',
 'Ice crystal',
 'Winter heart',
 'Festive mix',
 'Overall size (height & width)',
 '16 mm (subtle)',
 '30 mm (ideal visibility)',
 '54 mm (statement)',
 'Width proportion (symbol width)',
 '70 % (slim)',
 '100 % (original)',
 '145 % (wide & bold)',
 '3D relief depth (protrusion in front of the ribs)',
 'Lifts the symbol proudly in front of the ribs so the silhouette (e.g. a 3-tier Christmas tree) is not interrupted by the ribs.',
 'Symbols per row (circumference)',
 'pcs.',
 '3 (minimal)',
 '6 (harmonious)',
 '14 (dense)',
 'Vertical rows (staggered)',
 'rows',
 '1 row (centre)',
 '2 rows (staggered)',
 '3 rows (full)',
 'Height centre on the lantern',
 '★ 2-layer 3D relief technique (100 % support-free):',
 'So that the',
 'Christmas tree',
 'a real trunk and',
 '3 clearly recognisable branch tiers',
 'a support strut first grows in the rib plane between the ribs, while the',
 '42° support strut',
 'grows between the ribs, while the',
 '3D-faceted symbol (+2.4 mm)',
 'sits proudly in front of the ribs with a 45° under-chamfer!',
 'Base tray & candle recess',
 'Integrated base tray with anti-slip recess for your candle',
 'Show in section',
 'Tray total height (rim height)',
 'Candle recess depth',
 'Remaining floor thickness under the candle:',
 'Radial clearance (tolerance to the candle)',
 'mm (radius)',
 'With a Ø',
 'mm candle the recess has exactly',
 'mm inner diameter — sits securely without jamming.',
 'Lip width around the candle',
 'Raised lip around the candle recess so the candle cannot slip while the lantern is carried.',
 'Candle dimensions (reference & preview)',
 'Fits the candle tray automatically to your candle (not printed)',
 'Candle diameter',
 '38 mm (tea light)',
 '80 mm (your 8 cm candle)',
 'Candle height',
 '100 mm (your 10 cm candle)',
 'Show optional glass sleeve',
 'Also shows a thin glass sleeve around the candle (as in the photo)',
 'Warm light brightness & shadow cast',
 'Recommended 3D print settings',
 'Supports:',
 'None needed (the base sits flat on the',
 'Wall loops:',
 '3–4 wall loops for maximum rib stability',
 'Layer height:',
 '0.16 mm or 0.20 mm (matte PLA, PETG or ASA)',
 'Print analysis & download .STL',
 'Watertight binary STL (1:1 scale in mm)',
 'Exported without the candle',
 '3D print analysis & safety check',
 'Lantern Ø124 × 110 mm • 40 ribs',
 'Filament usage',
 'Estimated print time: ~2h 10m',
 'Success chance',
 'Very safe',
 'without supports',
 'Mechanical stability:',
 'Very rigid and torsion-resistant',
 'Failure & print-head risk:',
 'Harmless (no spaghetti risk)',
 'Candle fit & tray:',
 'Fits perfectly',
 'Auto-correct critical values for safe 3D printing now',
 'Back to the designer',
 'Download .STL file now',
 'STL file created!',
 'Ready for Bambu Studio, PrusaSlicer & Cura',
]

src = open(SRC, encoding='utf-8').read()
cut = src.find('const defaultParams')
head, rest = src[:cut], src[cut:]

# 1) deduplizierte Textknotenliste exakt wie in nodes.txt erzeugen
def is_ui_text(t):
    return (re.search(r'[A-Za-zÄÖÜäöüß]{3}', t) and 'box-sizing' not in t
            and 'tailwind' not in t and 'font-family' not in t and 'http' not in t)

uniq = []
for m in re.finditer(r'>([^<>]+)<', head):
    t = ' '.join(m.group(1).split())
    if is_ui_text(t) and t not in uniq:
        uniq.append(t)

print('unique Textknoten:', len(uniq), '| Übersetzungen:', len(EN))
if len(uniq) != len(EN):
    print('WARNUNG: Anzahl weicht ab')

MAP = dict(zip(uniq, EN))

def repl(m):
    inner = m.group(1)
    norm = ' '.join(inner.split())
    if norm in MAP:
        lead = inner[:len(inner) - len(inner.lstrip())]
        trail = inner[len(inner.rstrip()):]
        return '>' + lead + MAP[norm] + trail + '<'
    return m.group(0)

out = re.sub(r'>([^<>]+)<', repl, head) + rest

# 2) Attribute
ATTR = {
 'placeholder="Wie heisst du?"': 'placeholder="What is your name?"',
 'title="Menü einblenden"': 'title="Show menu"',
 'title="Vollbild"': 'title="Fullscreen"',
 'title="Zurück zur Startseite"': 'title="Back to the home page"',
 'aria-label="Zurück zur Startseite"': 'aria-label="Back to the home page"',
 'title="Farbe wählen"': 'title="Choose colour"',
}
for a, b in ATTR.items():
    out = out.replace(a, b)

# 3) Kopf
out = out.replace('<html lang="de" class="dark">', '<html lang="en" class="dark">', 1)
out = out.replace(
  '<meta name="description" content="Parametrischer 3D-Laternen-Designer im Browser: Rippen, Motive, Kerzenfach einstellen, live in 3D sehen und als STL exportieren." />',
  '<meta name="description" content="Parametric 3D lantern designer in your browser: adjust ribs, motifs and candle chamber, see it live in 3D and export it as an STL file." />', 1)
out = out.replace('href="assets/vendor/', 'href="../assets/vendor/')
out = out.replace('src="assets/vendor/', 'src="../assets/vendor/')
out = out.replace('href="index.html"', 'href="../index.html"', 1)

open(DST, 'w', encoding='utf-8').write(out)
print('geschrieben:', DST, len(out), 'Bytes')
