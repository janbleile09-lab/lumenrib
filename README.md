# Lumenrib

Parametrischer 3D-Laternen-Designer im Browser — Landing Page, Konfigurator, Kontakt.

- `index.html` — Deutsche Landing Page
- `konfigurator.html` — Der Designer (DE), exportiert `.stl`
- `kontakt.html` — Kontakt (DE)
- `en/` — englische Fassung

Statische Seite, kein Build-Schritt. Lokal starten mit `python3 -m http.server`.
Die 3D-Bibliotheken liegen in `assets/vendor/`, damit die Seite ohne CDN läuft.

## Live-Adressen

| Zweck | URL |
|---|---|
| Primär (Netlify) | https://lumenrib.netlify.app |
| Backup (GitHub Pages) | https://janbleile09-lab.github.io/lumenrib/ |
| Repository | https://github.com/janbleile09-lab/lumenrib |

Beide sind kostenlos und werden bei jedem Push bzw. Deploy aktualisiert.

Deploy auf Netlify (Site-ID `7d0ae2fd-8051-4c1e-9dee-cb91fc6f27b4`):

    npx netlify-cli deploy --prod --dir=. --site=7d0ae2fd-8051-4c1e-9dee-cb91fc6f27b4

## Wunschdomain `lumenrib.me`

Bei Namecheap frei und im GitHub-Student-Pack ein Jahr kostenlos
(Namecheap → "GitHub Student Developer Pack" → kostenlose `.me`-Domain).
Einlösen muss das der Kontoinhaber selbst, danach verbinden:

1. In Netlify unter Domain management → Add custom domain → `lumenrib.me`.
2. Beim Registrar: `A`-Record der Apex auf `75.2.60.5` (Netlify Load Balancer),
   `CNAME` für `www` auf `lumenrib.netlify.app`.
3. Netlify stellt das TLS-Zertifikat automatisch aus (Let's Encrypt).

## Kostenlose Alternative: `lumenrib.is-a.dev`

Die Datei `lumenrib.json` liegt im Ordner `domain/` (nicht im Web-Root).
Registrierung läuft über einen Pull Request an `is-a-dev/register`:

1. Datei nach `domains/lumenrib.json` im geforkten Repo kopieren.
2. PR gegen `is-a-dev/register` öffnen.

**Wichtig:** Dieses Repo akzeptiert laut eigener `AGENTS.md` *keine* KI-generierten
Pull Requests. Der PR muss von Hand eingereicht werden. Inhalt der Datei:

```json
{
  "description": "Lumenrib — parametric 3D lantern designer",
  "owner": { "username": "janbleile09-lab" },
  "records": { "CNAME": "janbleile09-lab.github.io" }
}
```

Die JSON-Struktur wurde gegen die Tests des Repos geprüft (json, domains, records, proxy:
alle grün), der Subdomain-Name `lumenrib` ist frei.

## Netlify-Deploys blockiert (Stand 08.11.2026)

Seit dem 08.11.2026 lehnt das Netlify-Konto **jeden** Deploy ab:

    {"error":"Account credit usage exceeded - new deploys are blocked until credits are added"}

Antwort ist HTTP 403 bei `POST /api/v1/sites/<id>/deploys`, per CLI („JSONHTTPError: Forbidden")
und über den MCP-Connector gleichermaßen. Der Build selbst ist nicht das Problem — Netlify
blockiert das *Anlegen* des Deploys.

**Konsequenz:** `lumenrib.netlify.app` läuft auf dem Stand vom Vormittag des 08.11.
**Maßgebliche Live-Quelle ist deshalb GitHub Pages:** https://janbleile09-lab.github.io/lumenrib/
Dort ist jeder Push sofort live.

Lokal deployen, sobald das Kontingent wieder da ist:

    npx netlify-cli deploy --prod --dir=.

Die Alternative ohne Netlify ist Cloudflare Pages oder Vercel — beide kostenlos, beide können
das Repo direkt aus GitHub bauen (dann ist kein manueller Deploy mehr nötig).
