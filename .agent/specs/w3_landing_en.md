# AUFTRAG W3 — Englische Fassung + Konfigurator-Einstieg EN

## OBJEKTIV
Die englische Schwester der Website: `en/index.html` und `en/contact.html`. Inhalt 1:1 die
Übersetzung der deutschen Seiten (die parallel entstehen), gleiche Klassen, gleiche Struktur,
gleiche Bilddateien — nur Sprachdatei und Textsprache anders.

## ZIELDATEIEN
- **CREATE:** `en/index.html`, `en/contact.html`
- **READ-ONLY:** `index.html`, `kontakt.html` (deutsche Fassung — lies sie, wenn sie existiert,
  und übersetze 1:1), `assets/css/site.css`, `assets/js/site.js`, `assets/img/*`
- **FORBIDDEN:** `konfigurator.html`, `assets/*` (nichts ändern), alles ausserhalb von `en/`

## WICHTIG — relative Pfade
Alle Seiten liegen in `en/`, also gehen Assets und Links **eine Ebene hoch**:
- CSS: `../assets/css/site.css`
- JS: `../assets/js/site.js`
- Bilder: `../assets/img/card-classic.webp` usw.
- Deutsche Sprachversion: `../index.html` bzw. `../kontakt.html`
- Konfigurator (EN-Einstieg): `configurator.html` (liegt im selben Ordner)
- Konfigurator (DE, für den Umschalter falls nötig): `../konfigurator.html`

## INHALT
Übersetze die deutsche Seite vollständig und **sinngemäss, nicht wörtlich** — natürliches,
zurückhaltendes Englisch (British spelling: "colour", "personalise", "centre", "metre").
Die Produktfakten aus dem gemeinsamen Kontext gelten unverändert. Erfinde weiterhin nichts:
keine Preise, keine Reviews, keine Nutzerzahlen, keine Druckzeiten.

Abschnitts-IDs bleiben `#process`, `#presets`, `#features`, `#details` (englisch benannt) und
die Nav-Links zeigen konsistent darauf.

## FORMULAR — `en/contact.html`
Identische Struktur und Attribute wie im deutschen Formular, nur englische Labels und
`data-msg-*`-Texte. `action` bleibt `https://formsubmit.co/ajax/jan.bleile09@gmail.com`.
Zusätzlich: `<input type="hidden" name="_subject" value="LITO Studio — new contact request">`.

## DEFINITION OF DONE
```zsh
cd /Users/janbleile/lito-site
python3 - <<'PY'
import re,sys,os
ok=True
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
for f in ['en/index.html','en/contact.html']:
    if not os.path.exists(f): print('FEHLT',f); ok=False; continue
    h=open(f).read(); print(f,len(h),'bytes')
    used=set()
    for m in re.finditer(r'class="([^"]+)"',h): used.update(m.group(1).split())
    bad=sorted(c for c in used if c not in allowed)
    print('  fremde Klassen:', bad if bad else 'keine')
    if bad: ok=False
    for m in re.finditer(r'(?:href|src)="([^"#:]+)"',h):
        p=os.path.normpath(os.path.join('en',m.group(1)))
        if not os.path.exists(p): print('  TOTER PFAD:',m.group(1),'->',p); ok=False
    if 'lang="en"' not in h: print('  FEHLT: lang="en"'); ok=False
print('ERGEBNIS:','OK' if ok else 'FEHLER')
sys.exit(0 if ok else 1)
PY
```
Erwartet: `ERGEBNIS: OK`, Exit 0. **`en/configurator.html` fasst du NICHT an** — die Datei legt
der Elternprozess an.

## HINWEIS
`assets/css/site.css` kann noch nicht existieren, während du arbeitest — das ist in Ordnung.
Prüfe die Existenz der Datei nicht als Bedingung für den Abschluss, halte dich an den Klassenvertrag
im gemeinsamen Kontext.
