# Lumenrib

Parametrischer 3D-Laternen-Designer im Browser — Landing Page, Konfigurator, Kontakt.

- `index.html` — Deutsche Landing Page
- `konfigurator.html` — Der Designer (DE), exportiert `.stl`
- `kontakt.html` — Kontakt (DE)
- `en/` — englische Fassung

Statische Seite, kein Build-Schritt. Lokal starten mit `python3 -m http.server`.
Die 3D-Bibliotheken liegen in `assets/vendor/`, damit die Seite ohne CDN läuft.

## Live

**https://lumenrib.me** — eigene Domain (Namecheap), ausgeliefert von GitHub Pages.
DNS: vier A-Records auf 185.199.108.153 / .109 / .110 / .111, `www` als CNAME auf `lumenrib.me`.
HTTPS aktiv, Zertifikat von Let's Encrypt (GitHub Pages), gültig bis 06.02.2027.
`www` und `http` leiten per 301 auf `https://lumenrib.me/` um.

| Seite | URL |
|---|---|
| Startseite DE | https://lumenrib.me/ |
| Startseite EN | https://lumenrib.me/en/ |
| Konfigurator DE | https://lumenrib.me/konfigurator.html |
| Konfigurator EN | https://lumenrib.me/en/configurator.html |
| Kontakt DE | https://lumenrib.me/kontakt.html |
| Kontakt EN | https://lumenrib.me/en/contact.html |

Deployen = committen und pushen. GitHub Pages baut automatisch.

    git add -A && git commit -m "..." && git push

Netlify (`lumenrib.netlify.app`) ist nur noch Altlast: dort blockiert das Kontingent jeden
Deploy (HTTP 403, "Account credit usage exceeded"), die Seite läuft auf einem alten Stand.

## Domain einrichten (falls mal neu)

1. Im Repo liegt eine Datei `CNAME` mit dem Inhalt `lumenrib.me` — die muss bleiben.
2. Beim Registrar: A-Records der Apex auf 185.199.108–111.153, `CNAME` für `www` auf `lumenrib.me`.
3. GitHub → Settings → Pages → Custom domain eintragen, "Enforce HTTPS" aktivieren.
4. Wichtig: Eine Domain kann nur **einem** Repo im Konto zugeordnet sein. War vorher am
   Repo `janbleile09-lab.github.io` (dort ebenfalls eine `CNAME`-Datei) — die muss dort weg.

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
