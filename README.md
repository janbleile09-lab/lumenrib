# Lumenrib

Parametrischer 3D-Laternen-Designer im Browser — Landing Page, Konfigurator, Kontakt.

## Seiten

| Seite | Datei | Sprache |
|---|---|---|
| Startseite | `index.html` | DE |
| Konfigurator | `konfigurator.html` | DE |
| Kontakt | `kontakt.html` | DE |
| Datenschutz | `datenschutz.html` | DE |
| Startseite | `en/index.html` | EN |
| Konfigurator | `en/configurator.html` | EN |
| Kontakt | `en/contact.html` | EN |
| Privacy | `en/privacy.html` | EN |

Statische Seite, kein Build-Schritt. Lokal starten mit `python3 -m http.server`.
Alle Bibliotheken und Schriften liegen lokal (`assets/`), es gibt keinen CDN-Aufruf.

## Live

**https://lumenrib.me** — eigene Domain (Namecheap), ausgeliefert von GitHub Pages.
DNS: vier A-Records auf 185.199.108.153 / .109 / .110 / .111, `www` als CNAME auf `lumenrib.me`.
HTTPS aktiv, Zertifikat von Let's Encrypt (GitHub Pages), gültig bis 06.02.2027.

Deployen = committen und pushen. GitHub Pages baut automatisch.

    git add -A && git commit -m "..." && git push

## Aufbau der Skripte

Der Konfigurator ist bewusst **ohne Inline-JavaScript** gebaut, damit die
Content-Security-Policy `script-src 'self'` lauten kann (kein `unsafe-inline`,
also kein Weg für eingeschleustes JavaScript).

| Datei | Inhalt |
|---|---|
| `assets/js/config-tailwind.js` | `tailwind.config` (Farben, Schriften) |
| `assets/js/configurator.de.js` | gesamte Logik des Konfigurators (DE-Fassung) |
| `assets/js/configurator.en.js` | dieselbe Logik mit englischen Texten |
| `assets/js/site.js` | Landing Pages: Reveal-Animation, Formular, Jahr im Footer |
| `assets/js/track.js` | anonyme Reichweitenmessung (siehe unten) |

Interaktion läuft über Event-Delegation: die HTML-Elemente tragen
`data-act="funktion"` (mit `data-args='["…"]'`) bzw. `data-on="updateParam"
data-arg="height"`. Ein Zuhörer am Dokument ruft die Funktion auf. Neue Buttons
brauchen deshalb kein `onclick`, nur das passende `data-act`.

## Schriften

Inter und JetBrains Mono liegen als woff2 in `assets/fonts/` und werden über
`assets/css/fonts.css` eingebunden — nicht mehr über Google Fonts. Das spart
einen Drittanbieter-Request und die Übertragung der Besucher-IP an Google.
Lizenz: SIL Open Font License 1.1. Nur `latin` und `latin-ext` (deckt Deutsch
mit Umlauten und Englisch ab). Inter ist ein Variable Font — ein File pro
Subset genügt für alle Schnitte.

## Reichweitenmessung (anonym)

`assets/js/track.js` schickt bei Seitenaufruf, Konfigurator-Start, Preset-Klick
und STL-Download ein Ereignis an Supabase (`lumen.track`).

- **Kein Cookie, kein localStorage, kein sessionStorage.** Deshalb kein
  Cookie-Banner: es wird nichts auf dem Gerät gespeichert oder gelesen.
- Der Besucher wird serverseitig aus IP + User-Agent + Kalendertag gehasht.
  Roh-IP wird nie gespeichert. Ereignisse werden nach 400 Tagen gelöscht.
- Übertragen werden nur: Ereignisart, Pfad, Sprache, Geräteklasse und bei
  Downloads die Modellmaße. `lumen.clean_meta` filtert serverseitig gegen eine
  Whitelist (`dia`, `height`, `candle`, `ribs`, `motif`, `kb`, `preset`).
- Bei Downloads wird zusätzlich das Modell vermessen (Bauch-Ø, Höhe, Kerzen-Ø,
  Rippen, Motiv, Dateigröße) — das landet in der Tabelle `last_downloads`.

Die Zahlen stehen im JARVIS-Staff-Board unter dem Reiter **Website**
(`~/.hermes/skills/.../jarvis-os-staffboard`). Zugriff nur für Besitzerrolle
plus freigeschaltetes Gerät (`staff.is_owner() and staff.device_ok()`).
Schema-Quelle: `jarvis-os/supabase/migrations/006_lumen.sql`.

## Kontaktformular

Geht direkt an die eigene Datenbank (`lumen.contact`), nicht an einen
Formulardienst. Felder: Name, E-Mail, Thema, Projekt, Nachricht. Serverseitig:
E-Mail- und Längenprüfung, Honeypot-Feld, maximal drei Nachrichten pro
10 Minuten und IP-Hash.

## Sicherheit

- CSP-Meta auf allen Seiten: `script-src 'self'`, `object-src 'none'`,
  `frame-ancestors 'none'`, `upgrade-insecure-requests`.
- `referrer` auf `strict-origin-when-cross-origin`.
- Keine Inline-Handler, kein `eval`, kein `innerHTML` mit Fremddaten.
- `anon` darf in Supabase nur `lumen.track` und `lumen.contact` aufrufen;
  Tabellen sind per RLS ohne Policies gesperrt.
- Hinweis: GitHub Pages kann keine echten HTTP-Header setzen. Die CSP steht
  deshalb als `<meta>` im `<head>`; `_headers` wirkt nur bei Netlify.

## Bekannte Lücke

`https://www.lumenrib.me` hat ein Zertifikatsproblem: der `www`-CNAME zeigt auf
`lumenrib.me`, das GitHub-Zertifikat deckt aber nur den Apex ab. Fix beim
Registrar: `www` CNAME auf `janbleile09-lab.github.io` umstellen, dann nimmt
GitHub `www` in die SAN-Liste auf.

## Netlify

`lumenrib.netlify.app` ist Altlast: das Kontingent blockiert jeden Deploy
(HTTP 403). Live-Quelle ist ausschliesslich GitHub Pages.
