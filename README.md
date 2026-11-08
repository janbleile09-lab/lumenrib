# Lumenrib

Parametrischer 3D-Laternen-Designer im Browser — Landing Page, Konfigurator, Kontakt.

- `index.html` — Deutsche Landing Page
- `konfigurator.html` — Der Designer (DE), exportiert `.stl`
- `kontakt.html` — Kontakt (DE)
- `en/` — englische Fassung

Statische Seite, kein Build-Schritt. Lokal starten mit `python3 -m http.server`.
Die 3D-Bibliotheken liegen in `assets/vendor/`, damit die Seite ohne CDN läuft.

## Eigene Domain (GitHub Pages)

Die Seite läuft aktuell unter https://janbleile09-lab.github.io/lumenrib/

**Empfehlung:** `lumenrib.me` (Namecheap Student Pack, .me ein Jahr kostenlos) als
Hauptdomain, `lumenrib.de` als deutsche Variante mit Weiterleitung.

Einrichten:
1. Bei der Domain-Verwaltung einen `CNAME`-Record für `www` auf
   `janbleile09-lab.github.io.` setzen und vier `A`-Records für die Apex-Domain auf
   `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`.
2. Im Repo eine Datei `CNAME` mit genau einer Zeile anlegen: `lumenrib.me`
3. In den Repo-Einstellungen unter Pages die Custom Domain eintragen und
   "Enforce HTTPS" aktivieren (Zertifikat wird automatisch ausgestellt).
