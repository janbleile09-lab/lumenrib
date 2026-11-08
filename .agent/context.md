# GEMEINSAMER KONTEXT — LITO Studio Website (8.11.2026)

## Projekt
Statische Website für **LITO Studio** — ein parametrischer 3D-Laternen-Konfigurator.
Besucher landen auf einer Landing Page, klicken "Laterne gestalten" und landen im
Konfigurator, wo sie eine Laterne parametrisch aufbauen und als STL herunterladen.
Danach drucken sie sie auf einem 3D-Drucker (Bambu Lab A1).

## Arbeitsverzeichnis
`/Users/janbleile/lito-site`  (git-Repo, wird auf GitHub Pages veröffentlicht)

## BESTEHENDE DATEIEN — READ-ONLY, NICHT ÄNDERN
- `konfigurator.html` — das fertige Tool (1:1 die Vorlage des Nutzers, 3186 Zeilen).
  Funktionen darin: `applyPreset(name)`, `setLanternColor(hex, el)`, `exportToSTL()`,
  `toggleNightMode()`, `showToast(t,d)`, `state`-Objekt, `rebuildAll()`.
  Presets: `classic`, `xmas`, `lounge`, `twist`, `tall`.
- `assets/img/*.webp`, `assets/vendor/*.js` — fertige Renderings und lokale Libs.
  **Diese Bilder sind ECHTE Renderings aus dem Konfigurator. Verwende ausschliesslich sie,
  erfinde keine Bildpfade.**
  Verfügbar:
  - `assets/img/hero-portrait.webp` (1200x1500, Hochformat, Laterne leuchtet)
  - `assets/img/wide-hero.webp` (1200x733, Querformat)
  - `assets/img/card-classic.webp`, `card-xmas.webp`, `card-lounge.webp`,
    `card-twist.webp`, `card-tall.webp` (je 1200x1200, quadratisch, Preset-Übersicht)
  - `assets/img/hero-day.webp` (hell/daylight-Variante)

## Zielstruktur (die du baust)
```
index.html                  DE Landing Page
en/index.html               EN Landing Page
konfigurator.html           DE Tool (NICHT anfassen)
en/configurator.html        EN Tool-Einstieg (= Kopie der Vorlage, siehe Task)
kontakt.html                DE Kontaktseite
en/contact.html             EN Kontaktseite
assets/css/site.css         das Design-System (du baust es)
assets/js/site.js           Scroll-Reveal, Nav, Formular-Logik (du baust es)
```

## Design-Sprache — verbindlich
Der Look ist **Apple-nahes Dark Premium**, passend zum Konfigurator selbst
(`studio-950 #08090d`, Akzent `#e2be96` warmes Champagne, Schrift Inter).

Regeln, die du einhalten MUSST:
1. **Typografie:** Grosse, enge Display-Headlines. `font-feature-settings: "ss01"`, optisches
   Tracking: Headlines `letter-spacing:-0.03em`, Body `-0.011em`. Zeilenhöhe Headline 1.05.
   Fliesstext max. 62 Zeichen pro Zeile.
2. **Farbe:** Hintergrund `#08090d`. Karten `rgba(255,255,255,0.03)` mit
   `1px solid rgba(255,255,255,0.07)`. Akzent `#e2be96` sparsam (Links, Eyebrows, Icons).
   Text primär `#f5f5f7`, sekundär `rgba(245,245,247,0.62)`.
3. **Materialien:** `backdrop-filter: blur(24px) saturate(180%)` für Nav und Overlays.
4. **Bewegung (Apple Design):** Alles federt, nichts ruckelt.
   - Reveal on scroll: `translateY(28px)` + `opacity 0` → `0`/`1` mit
     `cubic-bezier(0.16, 1, 0.3, 1)` 900ms. Gestaffelt (`--i`-Variable für Delay).
   - Hover auf Karten: `transform: translateY(-4px) scale(1.008)`, 400ms, gleiche Kurve.
   - Button-Press: `transform: scale(0.97)` sofort (100ms ease-out) — Feedback auf Press.
   - `@media (prefers-reduced-motion: reduce)`: alle Transforms/Transitions aus.
5. **Kein** Bootstrap, **kein** Tailwind auf den Landing Pages — reines CSS in `assets/css/site.css`.
   Der Konfigurator selbst nutzt Tailwind, das bleibt so.
6. Mobile-first, Breakpoints 640 / 900 / 1200px. Auf Mobile: grosse Touch-Ziele (min 44px).

## Regeln für die Umsetzung
- **Keine erfundenen Fakten.** Keine Kundenstimmen, keine Preise, keine Statistiken,
  keine "5000 zufriedene Kunden". Nur was in der Spec steht.
- **Relative Pfade** (`assets/css/site.css`), damit es auf GitHub Pages unter
  `/lito-studio/` funktioniert. In `en/` also `../assets/...`.
- Sprachlinks müssen auf jeder Seite funktionieren (DE ↔ EN), inkl. `hreflang`-Tags.
- Semantisches HTML, `<a>` für Navigation, `<button>` für Aktionen.
- Alle Links müssen auf existierende Dateien zeigen. Kein toter Link.
- Schreibe Dateien direkt in `/Users/janbleile/lito-site`.

## VERBINDLICHER CSS-KLASSEN-VERTRAG
`assets/css/site.css` ist die einzige Design-Quelle. Alle Seiten benutzen AUSSCHLIESSLICH
diese Klassen (keine neuen erfinden, keine Framework-Klassen):

**Tokens (CSS-Variablen auf `:root`):** `--bg`, `--surface`, `--line`, `--fg`, `--fg-2`,
`--accent`, `--accent-soft`, `--radius`, `--radius-lg`, `--ease`, `--maxw`

**Layout:** `.wrap` (Inhaltsbreite), `.section`, `.section--tight`, `.eyebrow`, `.divider`
**Typo:** `.display-xl`, `.display-l`, `.display-m`, `.lede`, `.body`, `.caption`, `.mono`
**Navigation:** `.nav`, `.nav-inner`, `.nav-brand`, `.nav-mark`, `.nav-links`, `.nav-link`,
`.nav-cta`, `.lang`
**Buttons:** `.btn`, `.btn--primary`, `.btn--ghost`, `.btn--lg`, `.btn-row`
**Karten/Grids:** `.grid`, `.grid--2`, `.grid--3`, `.grid--4`, `.card`, `.card__media`,
`.card__body`, `.card__title`, `.card__text`, `.card__tag`
**Features:** `.feature`, `.feature__icon`, `.feature__title`, `.feature__text`
**Showcase:** `.showcase`, `.showcase__media`, `.showcase__body`, `.showcase--flip`
**Schritte:** `.steps`, `.step`, `.step__num`, `.step__title`, `.step__text`
**Fakten:** `.specs`, `.spec`, `.spec__k`, `.spec__v`
**Footer:** `.footer`, `.footer-grid`, `.footer-col`, `.footer-title`, `.footer-note`
**Formular:** `.form`, `.field`, `.field__label`, `.field__hint`, `.input`, `.textarea`,
`.select`, `.checkbox`, `.form__status`, `.form__status--ok`, `.form__status--err`
**Motion:** `.reveal` (+ `data-reveal-delay="0|1|2|3"`), `.reveal.is-in`
**Sonstiges:** `.hero`, `.hero__copy`, `.hero__media`, `.badge`, `.kbd`, `.note`
