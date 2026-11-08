# AUFTRAG W1 — Design-System CSS + Interaktions-JS

## OBJEKTIV
Baue zwei Dateien, die das komplette visuelle und interaktive Fundament der LITO-Website sind:
- `/Users/janbleile/lito-site/assets/css/site.css`
- `/Users/janbleile/lito-site/assets/js/site.js`

## ZIELDATEIEN
- **MODIFY/CREATE:** `assets/css/site.css`, `assets/js/site.js` (beide neu)
- **READ-ONLY:** `konfigurator.html` — nur zum Ablesen der Farb-/Typo-Sprache, NICHT ändern
- **FORBIDDEN:** alle anderen Dateien im Repo. Kein `index.html`, kein `package.json`, kein Build-Step.

## ARCHITEKTUR-ZWÄNGE
Die CSS-Datei ist reines, handgeschriebenes CSS. **Kein Tailwind, kein PostCSS, kein `@import` von
CDNs, keine Präprozessoren.** Sie muss als `<link rel="stylesheet" href="assets/css/site.css">`
direkt funktionieren.

Alle in `.agent/context.md` unter "VERBINDLICHER CSS-KLASSEN-VERTRAG" genannten Klassen MÜSSEN
existieren und so aussehen wie unten beschrieben. Andere Seiten werden genau diese Klassen nutzen —
fehlende Klassen = kaputtes Layout. Erfinde KEINE zusätzlichen Klassen, die nicht im Vertrag stehen,
ausser `.sr-only` (Screenreader-Hilfsklasse) und `.no-scroll` (am `<body>` bei offenem Mobilmenü).

### requirements — CSS
```
:root {
  --bg:#08090d; --surface:rgba(255,255,255,.03); --surface-2:rgba(255,255,255,.055);
  --line:rgba(255,255,255,.075); --line-strong:rgba(255,255,255,.14);
  --fg:#f5f5f7; --fg-2:rgba(245,245,247,.62); --fg-3:rgba(245,245,247,.40);
  --accent:#e2be96; --accent-soft:rgba(226,190,150,.14);
  --radius:16px; --radius-lg:28px; --maxw:1180px;
  --ease:cubic-bezier(.16,1,.3,1);
  color-scheme: dark;
}
```
- Reset: `box-sizing:border-box`, margin 0, `-webkit-font-smoothing:antialiased`.
- Font-Stack: `-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI", Roboto, sans-serif`.
  `body` Grundgrösse 17px, `line-height:1.55`, `letter-spacing:-.011em`, Farbe `--fg`, BG `--bg`.
- `.display-xl` — `clamp(2.6rem, 7vw, 5.2rem)`, `line-height:1.03`, `letter-spacing:-.035em`,
  `font-weight:600`, `text-wrap:balance`.
- `.display-l` — `clamp(2rem, 4.6vw, 3.4rem)`, `line-height:1.08`, `letter-spacing:-.03em`, 600.
- `.display-m` — `clamp(1.4rem, 2.6vw, 2rem)`, `line-height:1.15`, `letter-spacing:-.02em`, 600.
- `.lede` — `clamp(1.05rem, 1.9vw, 1.3rem)`, Farbe `--fg-2`, `line-height:1.5`, `max-width:62ch`.
- `.body` — 1rem, `--fg-2`, `max-width:62ch`.
- `.caption` — .8125rem, `--fg-3`, `letter-spacing:.01em`.
- `.mono` — `ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace`, `font-size:.9em`,
  `letter-spacing:0`.
- `.eyebrow` — .78rem, `text-transform:uppercase`, `letter-spacing:.16em`, Farbe `--accent`,
  `font-weight:600`, `font-feature-settings:"ss01"`.
- `.wrap` — `width:100%; max-width:var(--maxw); margin-inline:auto; padding-inline:clamp(20px,5vw,40px)`.
- `.section` — `padding-block:clamp(72px,10vw,140px)`. `.section--tight` — halb so viel.
- `.divider` — `height:1px; background:var(--line); border:0`.
- `.nav` — `position:sticky; top:0; z-index:100; background:rgba(8,9,13,.72);
  backdrop-filter:blur(24px) saturate(180%); -webkit-backdrop-filter:…; border-bottom:1px solid var(--line)`.
  `.nav-inner` — flex, space-between, align-center, `height:60px`, im `.wrap`.
  `.nav-brand` — flex, gap .6rem, `font-weight:600`, `letter-spacing:-.02em`, `text-decoration:none`,
  `color:var(--fg)`, font-size 1rem. `.nav-mark` — 26px Quadrat, `border-radius:9px`,
  HINTERGRUND: konischer Verlauf `conic-gradient(from 210deg, #e2be96, #cfa16e, #8d6f4e, #e2be96)`,
  `box-shadow:0 0 0 1px rgba(255,255,255,.12) inset`.
  `.nav-links` — flex, gap 1.6rem, `@media(max-width:899px){display:none}`.
  `.nav-link` — .875rem, `--fg-2`, `text-decoration:none`, `transition:color .25s var(--ease)`, hover `--fg`.
  `.nav-cta` — kompakter Primary-Button (siehe `.btn--primary`, aber `padding:.5rem 1rem`, `font-size:.85rem`).
  `.lang` — flex, gap .35rem, `font-size:.8rem`, `--fg-3`; `a` in `.lang` ohne Dekoration, aktive
  Sprache `--fg` + `font-weight:600`.
- `.btn` — inline-flex, center, gap .5rem, `padding:.78rem 1.4rem`, `border-radius:999px`,
  `font-size:.94rem`, `font-weight:550`, `text-decoration:none`, `border:1px solid transparent`,
  `cursor:pointer`, `transition:transform .1s ease-out, background .3s var(--ease), border-color .3s var(--ease), box-shadow .3s var(--ease)`.
  `:active{transform:scale(.97)}`. `.btn--lg` — `padding:.95rem 1.8rem`, `font-size:1rem`.
  `.btn--primary` — BG `linear-gradient(180deg,#f0d3ae,#e2be96)`, Farbe `#1a1207`, `font-weight:600`,
  `box-shadow:0 8px 26px -10px rgba(226,190,150,.55)`. Hover: `transform:translateY(-1px)`,
  hellerer Verlauf, `box-shadow:0 14px 34px -12px rgba(226,190,150,.7)`.
  `.btn--ghost` — transparent, `border:1px solid var(--line-strong)`, `color:var(--fg)`.
  Hover: `background:var(--surface-2)`, `border-color:rgba(255,255,255,.24)`.
  `.btn-row` — flex, gap .8rem, `flex-wrap:wrap`.
- `.grid` — `display:grid; gap:clamp(16px,2.2vw,26px)`. `.grid--2` `repeat(auto-fit,minmax(280px,1fr))`,
  `.grid--3` `repeat(auto-fit,minmax(260px,1fr))`, `.grid--4` `repeat(auto-fit,minmax(210px,1fr))`.
- `.card` — `background:var(--surface)`, `border:1px solid var(--line)`, `border-radius:var(--radius-lg)`,
  `overflow:hidden`, `transition:transform .45s var(--ease), border-color .45s var(--ease), background .45s var(--ease)`.
  Hover: `transform:translateY(-5px)`, `border-color:var(--line-strong)`, `background:var(--surface-2)`.
  `.card__media` — `aspect-ratio:1/1`, `overflow:hidden`, `background:#0d0e13`;
  darin `img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .7s var(--ease)}`,
  und `.card:hover .card__media img{transform:scale(1.045)}`.
  `.card__body` — `padding:22px 22px 26px`. `.card__title` — 1.06rem, 600, `letter-spacing:-.015em`,
  `margin-bottom:.35rem`. `.card__text` — .9rem, `--fg-2`, `line-height:1.5`.
  `.card__tag` — inline-block, `.7rem`, uppercase, `letter-spacing:.13em`, Farbe `--accent`,
  `background:var(--accent-soft)`, `padding:.3rem .6rem`, `border-radius:999px`, `margin-bottom:.9rem`.
- `.feature` — `padding:26px 24px`, `border-radius:var(--radius)`, `background:var(--surface)`,
  `border:1px solid var(--line)`. `.feature__icon` — 36px, `border-radius:11px`, `background:var(--accent-soft)`,
  Farbe `--accent`, flex center, `margin-bottom:1rem`, `font-size:1.05rem`.
  `.feature__title` — .98rem, 600, `margin-bottom:.3rem`. `.feature__text` — .875rem, `--fg-2`.
- `.showcase` — grid, `grid-template-columns:1fr 1fr`, `gap:clamp(24px,5vw,72px)`, `align-items:center`;
  `@media(max-width:899px){grid-template-columns:1fr}`.
  `.showcase--flip .showcase__media{order:2}` (nur wenn ≥900px; auf Mobile order zurück auf 0).
  `.showcase__media` — `border-radius:var(--radius-lg)`, `overflow:hidden`, `border:1px solid var(--line)`,
  `background:#0b0c10`. `.showcase__media img{width:100%;display:block;object-fit:cover}`.
  `.showcase__body` — Fliesstext-Abstand `.lede` + `.body`.
- `.steps` — grid `repeat(auto-fit,minmax(240px,1fr))`, gap 20px, `counter-reset` nicht nötig.
  `.step` — wie `.feature`, aber `position:relative`. `.step__num` — `.72rem`, `mono`, `--accent`,
  `letter-spacing:.1em`, `margin-bottom:.9rem`, `display:block`.
  `.step__title` — 1rem, 600. `.step__text` — .875rem, `--fg-2`.
- `.specs` — `display:grid`, `grid-template-columns:repeat(auto-fit,minmax(200px,1fr))`, gap 1px,
  `background:var(--line)`, `border:1px solid var(--line)`, `border-radius:var(--radius)`, `overflow:hidden`.
  `.spec` — `background:var(--bg)`, `padding:22px`. `.spec__k` — `.72rem`, uppercase, `letter-spacing:.14em`,
  `--fg-3`, `margin-bottom:.4rem`, `display:block`. `.spec__v` — `1.05rem`, 600, `--fg`.
- `.footer` — `border-top:1px solid var(--line)`, `padding-block:56px 40px`, `background:#06070a`.
  `.footer-grid` — grid `repeat(auto-fit,minmax(180px,1fr))`, gap 32px, `margin-bottom:44px`.
  `.footer-title` — `.75rem`, uppercase, `letter-spacing:.14em`, `--fg-3`, `margin-bottom:.9rem`.
  `.footer-col` — flex column, gap .55rem; `a{color:var(--fg-2);text-decoration:none;font-size:.9rem}`
  hover `--fg`. `.footer-note` — `.8rem`, `--fg-3`, `border-top:1px solid var(--line)`, `padding-top:24px`,
  flex, `justify-content:space-between`, `flex-wrap:wrap`, gap 12px.
- `.hero` — `display:grid; grid-template-columns:1.05fr .95fr; gap:clamp(28px,5vw,64px)`,
  `align-items:center`, `padding-block:clamp(48px,7vw,96px)`; `@media(max-width:899px){grid-template-columns:1fr}`.
  `.hero__copy` — flex column, gap 1.4rem. `.hero__media` — `border-radius:var(--radius-lg)`,
  `overflow:hidden`, `border:1px solid var(--line)`, `background:#0a0b0f`, `position:relative`.
  `.hero__media img{width:100%;display:block}`.
  Zusätzlich: ein weicher radialer Glow hinter dem Hero — über `.hero__media::after` mit
  `radial-gradient(circle at 50% 40%, rgba(226,190,150,.16), transparent 62%)`, `pointer-events:none`.
- `.badge` — inline-flex, gap .4rem, `.74rem`, `padding:.3rem .7rem`, `border-radius:999px`,
  `background:var(--surface-2)`, `border:1px solid var(--line)`, Farbe `--fg-2`.
- `.kbd` — `mono`, `.78rem`, `padding:.15rem .4rem`, `border-radius:6px`, `background:var(--surface-2)`,
  `border:1px solid var(--line-strong)`.
- `.note` — `.85rem`, `--fg-3`, `border-left:2px solid var(--accent-soft)`, `padding-left:14px`.
- Formular:
  `.form` — `display:grid; gap:18px; max-width:560px`.
  `.field` — `display:grid; gap:.45rem`. `.field__label` — `.85rem`, 550, `--fg`.
  `.field__hint` — `.78rem`, `--fg-3`.
  `.input`, `.textarea`, `.select` — `width:100%`, `padding:.8rem .95rem`, `border-radius:12px`,
  `background:rgba(255,255,255,.04)`, `border:1px solid var(--line-strong)`, `color:var(--fg)`,
  `font:inherit`, `font-size:.94rem`, `transition:border-color .25s var(--ease), background .25s var(--ease), box-shadow .25s var(--ease)`.
  `:focus` — `outline:none`, `border-color:rgba(226,190,150,.55)`, `box-shadow:0 0 0 4px rgba(226,190,150,.12)`,
  `background:rgba(255,255,255,.06)`. `::placeholder{color:var(--fg-3)}`.
  `.textarea{min-height:150px;resize:vertical}`.
  `.select` — zusätzlich `appearance:none` + eigener Chevron als `background-image` (SVG data-URI, `--fg-3`).
  `.checkbox` — flex, gap .6rem, align-items flex-start, `.85rem`, `--fg-2`;
  `input{appearance:none;width:18px;height:18px;border-radius:5px;border:1px solid var(--line-strong);background:rgba(255,255,255,.04);margin-top:2px;flex:none;transition:…}`,
  `input:checked{background:var(--accent);border-color:var(--accent)}` plus Häkchen via `::after`.
  `.form__status` — `.875rem`, `padding:.75rem 1rem`, `border-radius:12px`, `display:none`;
  `.form__status--ok{display:block;background:rgba(120,220,150,.1);border:1px solid rgba(120,220,150,.3);color:#a8e8bc}`
  `.form__status--err{display:block;background:rgba(255,120,120,.1);border:1px solid rgba(255,120,120,.3);color:#ffb3b3}`.
- Motion:
  `.reveal{opacity:0;transform:translateY(28px);transition:opacity .9s var(--ease), transform .9s var(--ease);will-change:opacity,transform}`
  `.reveal.is-in{opacity:1;transform:none}`
  `[data-reveal-delay="1"]{transition-delay:90ms}` `[data-reveal-delay="2"]{transition-delay:180ms}`
  `[data-reveal-delay="3"]{transition-delay:270ms}`
  `@media (prefers-reduced-motion: reduce){ .reveal{opacity:1 !important;transform:none !important;transition:none !important}
  .card,.card__media img,.btn{transition:none !important} html{scroll-behavior:auto !important} }`
- `html{scroll-behavior:smooth}` — aber im reduced-motion-Block auf `auto`.
- `.sr-only` — Standard-Screenreader-Ausblendung.
- `.no-scroll{overflow:hidden}`.
- Fokus-Sichtbarkeit: `:focus-visible{outline:2px solid var(--accent);outline-offset:3px}`.
- Mobile-Nav: unter 900px sind `.nav-links` versteckt; ergänze `.nav-toggle` NICHT —
  stattdessen bleibt nur der `.nav-cta` + `.lang` sichtbar. Halte die Nav auf Mobile einzeilig.

### requirements — site.js
Reines Vanilla-JS, kein Import, kein Build. Ein IIFE, `'use strict'`. Muss defensiv sein:
läuft auf jeder Seite ohne Fehler, auch wenn Elemente fehlen (`if (!el) return`).

1. **Scroll-Reveal:** Alle `.reveal` per `IntersectionObserver` (`threshold:0.12`,
   `rootMargin:'0px 0px -8% 0px'`). Beim Sichtbarwerden `is-in` setzen und unobserve.
   **Fallback:** wenn `IntersectionObserver` fehlt oder `prefers-reduced-motion` gesetzt ist,
   sofort alle `.reveal` auf `is-in`.
2. **Nav-Scroll-State:** ab `scrollY > 8` dem `.nav` die Klasse `is-scrolled` geben
   (CSS: `background:rgba(8,9,13,.9)`, `box-shadow:0 1px 0 rgba(255,255,255,.06)` — diese Regel
   in site.css ergänzen). `passive` Scroll-Listener, mit `requestAnimationFrame` gedrosselt.
3. **Sanftes Scrollen für `a[href^="#"]`:** nur wenn Ziel existiert; `scrollIntoView({behavior:'smooth',block:'start'})`,
   `preventDefault`. Sticky-Nav-Höhe (60px) als `scroll-margin-top` auf `[id]` in CSS setzen.
4. **Jahr im Footer:** jedes Element mit `[data-year]` bekommt das aktuelle Jahr.
5. **Kontaktformular** — genau dieses Verhalten für `form[data-contact]`:
   - Client-Validierung: Name (≥2 Zeichen), E-Mail (Regex `/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i`),
     Nachricht (≥10 Zeichen). Bei Fehler: Feld bekommt `aria-invalid="true"`, die zugehörige
     `.form__status` bekommt `form__status--err` und eine deutsche bzw. englische Fehlermeldung
     (Texte aus `data-msg-*`-Attributen am `<form>` lesen, Fallback deutsch).
   - Kein `alert()`. Statusmeldung immer in `.form__status` im Formular.
   - Absenden per `fetch(form.action, {method:'POST', body:new FormData(form), headers:{'Accept':'application/json'}})`
     mit `mode:'cors'`. Button während des Sendens `disabled` + Text aus `data-msg-sending`.
   - Erfolg (`res.ok`, oder JSON `success` truthy): Formular mit `form.reset()` leeren, Erfolgsmeldung
     (`form__status--ok`), `data-msg-ok`.
   - Fehler (Netzwerk oder `!res.ok`): `form__status--err` mit `data-msg-err` **plus** einen
     `mailto:`-Fallback-Link anzeigen. Der Link wird aus `data-mailto` am Formular gebaut.
   - Honeypot: Feld `name="website"` (visuell versteckt) — ist es gefüllt, gar nicht senden, still
     "Erfolg" melden.
6. Nichts weiter. Kein Analytics, keine Cookies, keine externen Requests.

## LIVE-GEGENPROBE (Pflicht)
Das Formular postet an **FormSubmit** (`https://formsubmit.co/ajax/<adresse>`). Die Adresse steht
im `action`-Attribut der HTML-Datei — du baust nur die Logik, nicht die Adresse.

## DEFINITION OF DONE
Führe diese Befehle aus und klebe die Ausgabe in deine Antwort:
```zsh
cd /Users/janbleile/lito-site
node --check assets/js/site.js && echo "JS-SYNTAX-OK"
python3 - <<'PY'
import re,sys
css=open('assets/css/site.css').read()
need="""wrap section eyebrow divider display-xl display-l display-m lede body caption mono
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
reveal is-in hero hero__copy hero__media badge kbd note sr-only no-scroll""".split()
missing=[c for c in need if '.'+c not in css]
print('FEHLENDE KLASSEN:', missing if missing else 'keine')
print('CSS-BYTES:', len(css))
sys.exit(1 if missing else 0)
PY
```
Erwartet: `JS-SYNTAX-OK`, `FEHLENDE KLASSEN: keine`, Exit 0.
