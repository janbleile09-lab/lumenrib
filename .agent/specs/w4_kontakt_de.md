# AUFTRAG W4 — Deutsche Kontaktseite `kontakt.html`

## OBJEKTIV
Eine Seite `kontakt.html` im Wurzelverzeichnis, die exakt zur bereits gebauten `index.html` passt.
Optik, Navigation und Footer MÜSSEN identisch zur `index.html` sein — kopiere Nav und Footer
wörtlich aus `index.html` und ändere nur, was unten steht.

## ZIELDATEIEN
- **CREATE:** `kontakt.html`
- **READ-ONLY (Vorbild, nicht ändern!):** `index.html`, `en/contact.html`, `assets/css/site.css`,
  `assets/js/site.js`
- **FORBIDDEN:** alles andere. Kein CSS, kein JS, keine Bilder anfassen.

## VORGEHEN
1. Lies `index.html` komplett. Übernimm `<head>` (Titel/Description anpassen), die komplette
   `<nav class="nav">` und den kompletten `<footer class="footer">` **wörtlich**.
2. Baue den `<main>`-Inhalt wie unten.
3. Lies `en/contact.html` als inhaltliche Vorlage und übersetze die dortige Kontaktseite ins
   Deutsche — mit denselben Klassen.

## INHALT DES `<main>`
**Abschnitt 1 — Kopf**
`<section class="section wrap">` mit
- `.eyebrow` "Kontakt"
- `h1.display-l` "Schreib mir"
- `.lede` — zwei Sätze: Fragen zum Designer, ein Fehler, eine Idee für ein Motiv oder ein Foto
  des Druckergebnisses sind alle willkommen.

**Abschnitt 2 — Formular + Hinweise**
Ein `.grid .grid--2` mit zwei Spalten:
- **Links:** das Formular, siehe unten.
- **Rechts:** drei `.feature`-Blöcke, jeweils `.feature__icon` (Unicode-Zeichen, z.B. ✉ ⌁ ✳),
  `.feature__title`, `.feature__text`:
  1. "Antwort" — "Ich antworte in der Regel innerhalb weniger Tage. LITO Studio ist ein
     Ein-Personen-Projekt, keine Firma mit Support-Team."
  2. "Was hilft" — "Bei einem Fehler hilft: welcher Browser, welches Preset, welche Parameter
     verstellt wurden. Ein Screenshot ist Gold wert."
  3. "Ideen" — "Ein Motiv, das fehlt? Eine Form, die nicht funktioniert? Schreib es auf —
     gute Vorschläge landen in den Presets."
  Darunter ein `.note` mit dem Satz, dass die Nachricht über einen Formulardienst an eine
  E-Mail-Adresse zugestellt wird und keine Daten auf dem Webserver gespeichert werden.

**Abschnitt 3 — Direktkontakt**
`<section class="section--tight wrap">` mit `.eyebrow` "Direkt" und einem `.display-m`
"Lieber klassisch per E-Mail" plus einem `.body`-Absatz mit einem `mailto:`-Link auf
`jan.bleile09@gmail.com` (Adresse im Text sichtbar). Dazu `.btn-row` mit `.btn--ghost`
→ `mailto:jan.bleile09@gmail.com` und `.btn--primary` → `konfigurator.html` ("Zum Konfigurator").

## DAS FORMULAR — genau so einfügen
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

## REGELN
- Keine neuen CSS-Klassen. Nur die aus dem gemeinsamen Kontext.
- Abschnitte bekommen `.reveal`, die Feature-Blöcke `.reveal` + `data-reveal-delay="1|2|3"`.
- `<head>`: `<html lang="de">`, `<title>Kontakt — LITO Studio</title>`,
  `<meta name="description">` (max. 155 Zeichen), `<link rel="alternate" hreflang="de" href="kontakt.html">`,
  `<link rel="alternate" hreflang="en" href="en/contact.html">`, gleiches Favicon,
  `assets/css/site.css`, `assets/js/site.js` defer.
- In der Nav: "Kontakt" ist die aktuelle Seite — Link `href="kontakt.html"` beibehalten.
- Keine erfundenen Fakten, keine Telefonnummer, keine Adresse, keine Öffnungszeiten.

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
h=open('kontakt.html').read()
print('kontakt.html',len(h),'bytes')
used=set()
for m in re.finditer(r'class="([^"]+)"',h): used.update(m.group(1).split())
bad=sorted(c for c in used if c not in allowed)
print('  fremde Klassen:', bad if bad else 'keine'); ok = ok and not bad
for m in re.finditer(r'(?:href|src)="([^"#:]+)"',h):
    if not os.path.exists(m.group(1)): print('  TOT:',m.group(1)); ok=False
for need in ['data-contact','form__status','assets/css/site.css','assets/js/site.js','nav ','footer']:
    if need not in h: print('  FEHLT:',need); ok=False
print('ERGEBNIS:','OK' if ok else 'FEHLER')
PY
```
Erwartet: `ERGEBNIS: OK`, keine fremden Klassen, keine toten Pfade.
