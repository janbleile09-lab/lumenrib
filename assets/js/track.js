/* Lumenrib — anonyme Reichweitenmessung
   ------------------------------------------------------------------
   Kein Cookie, kein localStorage, kein sessionStorage, kein Fingerprint
   im Browser. Der Besucher wird serverseitig aus IP + User-Agent + Tag
   gehasht und nach 24 h nicht mehr zuordenbar. Deshalb ist dafür kein
   Cookie-Banner nötig (§25 TDDDG greift nicht, weil nichts auf dem Gerät
   gespeichert oder ausgelesen wird).

   Übertragen werden nur: Ereignisart, Pfad, Sprache, Geräteklasse und —
   bei Downloads — die Modellmaße, die du selbst im Konfigurator eingestellt
   hast. Keine IDs, keine Texteingaben, keine E-Mail-Adressen.
*/
(function () {
  'use strict';

  var ENDPOINT = 'https://eggrvcohkaizbcsxtywi.supabase.co/rest/v1/rpc/track';
  var KEY = 'sb_publishable_3-q2CXobEwsMTTzUFk82hw_17NEfCdt';
  // Pfad normalisieren, damit "/", "/index.html" und "/en/" sauber gruppieren.
  function pagePath() {
    var p = location.pathname.replace(/\/index\.html$/, '/');
    if (p === '' ) p = '/';
    return p.slice(0, 160);
  }
  var PAGE = pagePath();
  var LANG = /^\/en\//.test(location.pathname) ? 'en' : 'de';

  function device() {
    var w = window.innerWidth || 0;
    if (w < 640) return 'mobile';
    if (w < 1024) return 'tablet';
    return 'desktop';
  }

  function clean(value, max) {
    return typeof value === 'string' ? value.slice(0, max || 120) : null;
  }

  function send(payload) {
    try {
      var body = {
        p_kind: payload.kind,
        p_path: clean(payload.path || PAGE, 160),
        p_lang: LANG,
        p_device: device(),
        p_ref: clean(document.referrer, 120),
        p_meta: payload.meta || {}
      };
      fetch(ENDPOINT, {
        method: 'POST',
        mode: 'cors',
        keepalive: true,
        headers: {
          'apikey': KEY,
          'Authorization': 'Bearer ' + KEY,
          'Content-Type': 'application/json',
          'Content-Profile': 'lumen'
        },
        body: JSON.stringify(body)
      }).catch(function () { /* Messung darf die Seite nie stören */ });
    } catch (e) { /* still */ }
  }

  /* Öffentlich für die Seiten und den Konfigurator */
  window.lumenTrack = function (kind, meta, path) {
    send({ kind: kind, meta: meta || {}, path: path });
  };

  /* Seitenaufruf — erst nach dem ersten Bild, damit niemand auf die Messung wartet */
  function pageview() {
    send({ kind: 'pageview' });
    // DE heisst konfigurator.html, EN configurator.html — beide zaehlen.
    if (/(?:kon|con)figurator\.html$/.test(PAGE)) {
      send({ kind: 'configurator_open' });
    }
  }

  if (document.readyState === 'complete') {
    setTimeout(pageview, 0);
  } else {
    window.addEventListener('load', function () { setTimeout(pageview, 0); }, { once: true });
  }
})();
