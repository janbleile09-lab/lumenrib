# AUFTRAG W2 — Deutsche Landing Page + Kontaktseite

## OBJEKTIV
Zwei fertige deutsche HTML-Seiten für LITO Studio, die ausschliesslich die in
`.agent/context.md` definierten CSS-Klassen aus `assets/css/site.css` verwenden.

## ZIELDATEIEN
- **CREATE:** `index.html` ( deutsche Landing Page)
- **CREATE:** `kontakt.html` (deutsche Kontaktseite)
- **READ-ONLY:** `assets/css/site.css` und `assets/js/site.js` (werden parallel von einem anderen
  Auftrag gebaut — lies sie nur, falls schon vorhanden, ändere sie NIEMALS)
- **FORBIDDEN:** `konfigurator.html`, `en/*`, `assets/img/*`, `assets/vendor/*`, alles andere.

## PRODUKTWISSEN (verbindliche Fakten — erfinde NICHTS darüber hinaus)
LITO Studio ist ein **parametrischer Laternen-Designer im Browser**. Man stellt eine Laterne
aus einzelnen Stäben ("Rippen") zusammen, die sich nach aussen wölben, und lädt sie als
**STL-Datei** herunter, um sie auf einem **FDM-3D-Drucker** (z.B. Bambu Lab A1) zu drucken.

Echte Parameter, die das Tool hat (nur diese nennen):
- Höhe, Bauchdurchmesser, Bodenplattendurchmesser, Dicke der Bodenplatte
- Anzahl der Rippen (Stäbe), Rippenbreite, Rippentiefe, Kurvenspannung der Wölbung
- Drehung/Verwindung (Twist-Winkel) der Stäbe
- Dekor-Motive auf den Stäben: Motivanzahl, Motivgrösse, Motivhöhe, Relief-Tiefe, Motivreihen
- Kerzenfach: Kerzendurchmesser, Kerzenhöhe, Wandabstand (Clearance), Vertiefung im Boden
- Stabilisatoren: Anzahl, Breite, Dicke, Halsform
- Deckel-/Topring: Innendurchmesser, Ringhöhe
- Nachtmodus (Vorschau mit Licht und Schattenwurf), Farbauswahl der Laterne
- Fünf Presets: **Klassik, Weihnachten, Lounge, Twist, Hoch**

Was das Tool NICHT hat (nicht behaupten): kein Konto, kein Login, keine Cloud, keine Preise,
kein Bestellprozess, kein Verkauf, keine Materialempfehlungen in Gramm, keine Druckzeitangaben
in Stunden, keine Garantien. Keine Kundenbewertungen, keine Zahlen zu Nutzern oder Downloads.

## SEITENSTRUKTUR — `index.html` (genau diese Reihenfolge)
1. **`<nav class="nav">`** — `.nav-inner` mit `.nav-brand` (Marker `.nav-mark` + Text "LITO Studio"),
   `.nav-links` mit Links auf `#ablauf`, `#presets`, `#funktionen`, `#details`, `kontakt.html`;
   rechts `.lang` (DE aktiv, Link auf `en/index.html`) und `.nav-cta` "Laterne gestalten" → `konfigurator.html`.
2. **Hero** — `<section class="hero wrap">` mit `.hero__copy` (Badge ".badge": "Parametrischer
   3D-Laternen-Designer", Headline `.display-xl`: "Deine Laterne. In deinem Massstab.",
   `.lede`: ein Satz, der erklärt: im Browser gestalten, live in 3D sehen, als STL exportieren,
   selbst drucken. `.btn-row` mit `.btn--primary .btn--lg` "Laterne gestalten" → `konfigurator.html`
   und `.btn--ghost` "So funktioniert's" → `#ablauf`) und `.hero__media` mit
   `<img src="assets/img/hero-portrait.webp" alt="…" width="1200" height="1500" loading="eager">`.
3. **Einführung** — `<section class="section wrap" id="einfuehrung">`: `.eyebrow` "Was LITO ist",
   `.display-l` Headline, zwei Absätze `.body`. Darunter `.specs` mit vier `.spec`-Paaren:
   Höhe / Durchmesser (in mm, Bereich nennen: Höhe bis ca. 400 mm, Durchmesser bis ca. 220 mm —
   als "Richtwert" kennzeichnen), Rippenanzahl, Export-Format (.stl), Druck (FDM).
4. **Showcase** — `<section class="section wrap">` mit zwei `.showcase`-Blöcken
   (der zweite mit `.showcase--flip`), je `.showcase__media` + `.showcase__body`.
   Medien: `assets/img/card-xmas.webp` und `assets/img/card-twist.webp`.
   Texte: Motiv-Dekor (Weihnachten) und Twist-Verwindung — je 2 kurze Absätze.
5. **Presets** — `<section class="section wrap" id="presets">`: `.eyebrow` "Presets",
   `.display-l` "Fünf Ausgangspunkte", `.grid .grid--3` mit fünf `.card`-Elementen.
   Jede Karte: `.card__media` mit dem passenden Bild (`card-classic`, `card-xmas`, `card-lounge`,
   `card-twist`, `card-tall` — jeweils `.webp`), `.card__body` mit `.card__tag` (Kurzlabel),
   `.card__title` (Name) und `.card__text` (2 Sätze, was das Preset ausmacht).
   Unter dem Grid eine `.note`: dass jedes Preset nur ein Startpunkt ist und alle Parameter frei verstellbar sind.
6. **Ablauf** — `<section class="section wrap" id="ablauf">`: `.eyebrow` "Ablauf",
   `.display-l` "In vier Schritten zur gedruckten Laterne", `.steps` mit vier `.step`:
   01 Gestalten / 02 Preset wählen & anpassen / 03 STL exportieren / 04 Drucken.
   Jeder `.step` hat `.step__num`, `.step__title`, `.step__text`. Am Ende `.btn-row` mit
   `.btn--primary` "Jetzt gestalten" → `konfigurator.html`.
7. **Funktionen** — `<section class="section wrap" id="funktionen">`: `.eyebrow` "Im Konfigurator",
   `.display-l` "Alles, was du einstellen kannst", `.grid .grid--4` mit 8 `.feature`-Blöcken.
   Jedes: `.feature__icon` (ein einzelnes Unicode-Zeichen, z.B. ◐ ▤ ⌁ ✳ ⌗ △ ⬡ ◇ — KEIN Icon-Font,
   KEIN SVG), `.feature__title`, `.feature__text`. Themen: Geometrie, Rippen, Twist, Motive,
   Kerzenfach, Stabilisatoren, Nachtmodus & Farbe, STL-Export.
8. **Details / Vertrauen** — `<section class="section wrap" id="details">`: `.eyebrow` "Details",
   `.display-l`, zwei Absätze `.body`, dann `.showcase` (ohne flip) mit
   `assets/img/wide-hero.webp` und einer Liste technischer Hinweise inkl. `.kbd`-Verwendung
   (z.B. Maus zum Drehen, Scrollen zum Zoomen — als Fliesstext, nicht als Tabelle).
   Ein `.note`-Absatz: die Laterne wird um eine echte Kerze oder ein LED-Licht herum konstruiert,
   Kerzendurchmesser und -höhe sind einstellbar.
9. **Abschluss-CTA** — `<section class="section wrap">`: grosse `.display-l`-Zeile, ein `.lede`,
   `.btn-row` mit `.btn--primary .btn--lg` → `konfigurator.html` und `.btn--ghost` → `kontakt.html`.
10. **Footer** — `<footer class="footer">` mit `.wrap`, `.footer-grid` (4 `.footer-col`:
    Produkt / Ressourcen / Sprache / Rechtliches) und `.footer-note` mit
    `© <span data-year></span> LITO Studio` und dem Hinweis "Kein Shop — ein Werkzeug."

### Wichtige Regeln zur Landing Page
- Jeder Abschnitt (ausser Hero und Nav) beginnt mit `.reveal`; Kacheln/Karten/Schritte/Features
  bekommen `.reveal` plus `data-reveal-delay="1|2|3"` (zyklisch), damit sie gestaffelt einlaufen.
- Alle Bilder mit `alt`, `width`, `height`, `loading="lazy"` (ausser Hero) und `decoding="async"`.
- **Keine** erfundenen Zahlen, Kundenstimmen, Preise, Bewertungen, Presse-Logos.
- Sprachlink: `.lang` enthält `<span>DE</span>` und `<a href="en/index.html" hreflang="en">EN</a>`.
- Im `<head>`: `<html lang="de">`, `<title>LITO Studio — Parametrische 3D-Laternen selbst gestalten</title>`,
  `<meta name="description" content="…">` (max. 155 Zeichen), Open-Graph-Tags
  (og:title, og:description, og:image → `assets/img/wide-hero.webp`, og:type website),
  `<link rel="alternate" hreflang="en" href="en/index.html">`, `<link rel="alternate" hreflang="de" href="index.html">`,
  `<link rel="stylesheet" href="assets/css/site.css">`, `<script src="assets/js/site.js" defer></script>`.
  `<link rel="preload" as="image" href="assets/img/hero-portrait.webp">`.
- Favicon: als Inline-Data-URI im `<link rel="icon">` — ein simples SVG mit dunklem Quadrat und
  warmem Kreis (#e2be96). Kein externes File.

## SEITENSTRUKTUR — `kontakt.html` (genau so)
1. Gleiche `.nav` wie index.html, aber `.nav-cta` → `konfigurator.html`.
2. `<section class="section wrap">` mit `.eyebrow` "Kontakt", `.display-l` "Schreib mir",
   `.lede` "Fragen zum Designer, ein Fehler, eine Idee für ein neues Motiv? …"
3. Zweispaltig: links das Formular, rechts `.grid` mit 3 `.feature`-Blöcken
   (Antwortzeit, Was hilft, Presets/Feedback) — **ohne** Versprechen wie "innerhalb von 24 h",
   formuliere es als Absicht ("Ich antworte in der Regel innerhalb weniger Tage.").
4. Das Formular — exakt diese Struktur und Attribute:
```html
<form class="form" data-contact
      action="https://formsubmit.co/ajax/jan.bleile09@gmail.com"
      method="POST"
      data-mailto="jan.bleile09@gmail.com"
      data-msg-sending="Wird gesendet …"
      data-msg-ok="Danke! Deine Nachricht ist angekommen."
      data-msg-err="Das hat leider nicht geklappt. Schreib mir direkt per E-Mail."
      data-msg-name="Bitte gib deinen Namen ein (mindestens 2 Zeichen)."
      data-msg-mail="Bitte gib eine gültige E-Mail-Adresse ein."
      data-msg-text="Bitte schreib mir mindestens 10 Zeichen.">
  <input type="text" name="_honey" style="display:none">
  <input type="text" name="website" class="sr-only" tabindex="-1" autocomplete="off" aria-hidden="true">
  <div class="field">
    <label class="field__label" for="name">Name</label>
    <input class="input" id="name" name="name" type="text" required autocomplete="name" placeholder="Wie heisst du?">
  </div>
  <div class="field">
    <label class="field__label" for="email">E-Mail</label>
    <input class="input" id="email" name="email" type="email" required autocomplete="email" placeholder="name@beispiel.de">
    <span class="field__hint">Nur damit ich antworten kann.</span>
  </div>
  <div class="field">
    <label class="field__label" for="topic">Thema</label>
    <select class="select" id="topic" name="topic">
      <option>Frage zum Designer</option>
      <option>Fehler melden</option>
      <option>Idee für ein Motiv oder Preset</option>
      <option>Druckergebnis / Foto</option>
      <option>Sonstiges</option>
    </select>
  </div>
  <div class="field">
    <label class="field__label" for="message">Nachricht</label>
    <textarea class="textarea" id="message" name="message" required placeholder="Was möchtest du loswerden?"></textarea>
  </div>
  <label class="checkbox">
    <input type="checkbox" name="consent" required>
    <span>Ich bin damit einverstanden, dass meine Angaben zur Beantwortung meiner Nachricht verwendet werden.</span>
  </label>
  <input type="hidden" name="_subject" value="LITO Studio — neue Kontaktanfrage">
  <input type="hidden" name="_template" value="table">
  <input type="hidden" name="_captcha" value="false">
  <p class="form__status" role="status" aria-live="polite"></p>
  <div class="btn-row">
    <button class="btn btn--primary" type="submit">Nachricht senden</button>
    <a class="btn btn--ghost" href="mailto:jan.bleile09@gmail.com">Direkt per E-Mail</a>
  </div>
</form>
```
   Zusätzlich darunter ein `.note` mit der Klartext-E-Mail-Adresse `jan.bleile09@gmail.com` als
   `mailto:`-Link. **Wichtig:** das Formular postet an FormSubmit; das ist ein echter Dienst,
   der die Mail an diese Adresse zustellt.
5. Footer wie index.html.

## DEFINITION OF DONE
```zsh
cd /Users/janbleile/lito-site
python3 - <<'PY'
import re,sys,os
ok=True
for f in ['index.html','kontakt.html']:
    if not os.path.exists(f): print('FEHLT',f); ok=False; continue
    h=open(f).read()
    print(f, len(h), 'bytes')
    # nur erlaubte CSS-Klassen aus dem Vertrag
    allowed=set("""wrap section section--tight eyebrow divider display-xl display-l display-m lede body caption mono
    nav nav-inner nav-brand nav-mark nav-links nav-link nav-cta lang
    btn btn--primary btn--ghost btn--lg btn-row
    grid grid--2 grid--3 grid--4 card card__media card__body card__title card__text card__tag
    feature feature__icon feature__title feature__text
    showcase showcase__media showcase__body showcase--flip
    steps step step__num step__title step__text
    specs spec spec__k spec__v
    footer footer-grid footer-col footer-title footer-note
    form field field__label field__hint input textarea select checkbox
    form__status form__status--ok form__status--err
    reveal is-in hero hero__copy hero__media badge kbd note sr-only no-scroll""".split())
    used=set()
    for m in re.finditer(r'class="([^"]+)"',h):
        used.update(m.group(1).split())
    bad=sorted(c for c in used if c not in allowed)
    print('  fremde Klassen:', bad if bad else 'keine')
    if bad: ok=False
    # tote Links / fehlende Assets
    for m in re.finditer(r'(?:href|src)="([^"#:]+)"',h):
        p=m.group(1)
        if p.startswith('mailto:') or p.startswith('data:'): continue
        if not os.path.exists(p): print('  TOTER PFAD:',p); ok=False
    for need in ['assets/css/site.css','assets/js/site.js','data-contact' if f=='kontakt.html' else 'conftmp']:
        if need=='conftmp': continue
        if need not in h: print('  FEHLT:',need); ok=False
print('ERGEBNIS:', 'OK' if ok else 'FEHLER')
sys.exit(0 if ok else 1)
PY
```
Erwartet: `ERGEBNIS: OK`, Exit 0, keine fremden Klassen, keine toten Pfade.
