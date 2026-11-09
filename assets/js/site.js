/*!
 * Lumenrib — site.js
 * Scroll-Reveal, Nav-Zustand, sanftes Ankerscrollen, Footer-Jahr, Kontaktformular.
 * Reines Vanilla-JS, kein Build, keine externen Requests (ausser dem Formular-POST).
 */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var lang = (root.getAttribute('lang') || 'de').toLowerCase().slice(0, 2);

  var reduceMotion = false;
  try {
    reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  } catch (e) { /* ignore */ }

  function ready(fn) {
    if (doc.readyState === 'loading') {
      doc.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  }

  function toArray(list) {
    return Array.prototype.slice.call(list || []);
  }

  /* ------------------------------------------------------------------
     1. Scroll-Reveal
     ------------------------------------------------------------------ */
  function initReveal() {
    var items = toArray(doc.querySelectorAll('.reveal'));
    if (!items.length) return;

    function showAll() {
      items.forEach(function (el) { el.classList.add('is-in'); });
    }

    if (reduceMotion || !('IntersectionObserver' in window)) {
      showAll();
      return;
    }

    var io = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    items.forEach(function (el) { io.observe(el); });
  }

  /* ------------------------------------------------------------------
     2. Nav-Scroll-State
     ------------------------------------------------------------------ */
  function initNav() {
    var nav = doc.querySelector('.nav');
    if (!nav) return;

    var ticking = false;

    function update() {
      ticking = false;
      var y = window.scrollY || window.pageYOffset || 0;
      nav.classList.toggle('is-scrolled', y > 8);
    }

    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }, { passive: true });

    update();
  }

  /* ------------------------------------------------------------------
     3. Sanftes Scrollen für interne Anker
     ------------------------------------------------------------------ */
  function initAnchors() {
    doc.addEventListener('click', function (ev) {
      if (ev.defaultPrevented || ev.button !== 0) return;
      if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;

      var link = ev.target && ev.target.closest ? ev.target.closest('a[href^="#"]') : null;
      if (!link) return;

      var hash = link.getAttribute('href');
      if (!hash || hash === '#') return;

      var id;
      try {
        id = decodeURIComponent(hash.slice(1));
      } catch (e) {
        return;
      }
      var target = doc.getElementById(id);
      if (!target) return;

      ev.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });

      if (window.history && typeof window.history.pushState === 'function') {
        try { window.history.pushState(null, '', hash); } catch (e) { /* file:// o.ä. */ }
      }

      // Fokus für Tastatur-/Screenreader-Nutzer mitnehmen, ohne erneut zu springen
      if (!target.hasAttribute('tabindex') && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(target.tagName)) {
        target.setAttribute('tabindex', '-1');
      }
      try { target.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
    });
  }

  /* ------------------------------------------------------------------
     4. Jahr im Footer
     ------------------------------------------------------------------ */
  function initYear() {
    var year = String(new Date().getFullYear());
    toArray(doc.querySelectorAll('[data-year]')).forEach(function (el) {
      el.textContent = year;
    });
  }

  /* ------------------------------------------------------------------
     5. Kontaktformular
     ------------------------------------------------------------------ */
  var FALLBACK = {
    name: 'Bitte gib deinen Namen an (mindestens 2 Zeichen).',
    email: 'Bitte gib eine gültige E-Mail-Adresse an.',
    message: 'Bitte schreib eine Nachricht mit mindestens 10 Zeichen.',
    sending: 'Wird gesendet …',
    ok: 'Danke! Deine Nachricht ist angekommen.',
    err: 'Senden hat leider nicht geklappt.',
    rate: lang === 'en'
      ? 'That was a lot of messages in a short time. Please wait ten minutes or write me an email directly.'
      : 'Das waren viele Nachrichten in kurzer Zeit. Bitte warte zehn Minuten oder schreib mir direkt eine E-Mail.',
    mailto: lang === 'en' ? 'Send it by email instead' : 'Stattdessen per E-Mail senden'
  };

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

  // Eigener Empfang (Supabase, Schema lumen). Der Publishable Key darf im
  // Browser stehen — er erlaubt ausschliesslich das Absenden einer Nachricht.
  var ENDPOINT = 'https://eggrvcohkaizbcsxtywi.supabase.co/rest/v1/rpc/contact';
  var KEY = 'sb_publishable_3-q2CXobEwsMTTzUFk82hw_17NEfCdt';

  function msg(form, key) {
    var attr = form.getAttribute('data-msg-' + key);
    return attr && attr.trim() ? attr : FALLBACK[key];
  }

  function field(form, name) {
    return form.querySelector('[name="' + name + '"]');
  }

  function val(el) {
    return el && typeof el.value === 'string' ? el.value.trim() : '';
  }

  function setStatus(statusEl, type, text, mailtoHref, mailtoText) {
    if (!statusEl) return;
    statusEl.classList.remove('form__status--ok', 'form__status--err');
    while (statusEl.firstChild) statusEl.removeChild(statusEl.firstChild);
    if (!type) return;

    statusEl.classList.add(type === 'ok' ? 'form__status--ok' : 'form__status--err');
    statusEl.setAttribute('role', type === 'ok' ? 'status' : 'alert');
    statusEl.appendChild(doc.createTextNode(text));

    if (mailtoHref) {
      statusEl.appendChild(doc.createTextNode(' '));
      var a = doc.createElement('a');
      a.href = mailtoHref;
      a.textContent = mailtoText;
      statusEl.appendChild(a);
    }
  }

  function buildMailto(form, data) {
    var addr = (form.getAttribute('data-mailto') || '').trim().replace(/^mailto:/i, '');
    if (!addr) return '';

    var subjectEl = field(form, '_subject') || field(form, 'subject');
    var subject = val(subjectEl) || 'Lumenrib';
    var lines = [];
    if (data.message) lines.push(data.message);
    if (data.name || data.email) {
      lines.push('');
      lines.push('— ' + [data.name, data.email].filter(Boolean).join(' · '));
    }

    return 'mailto:' + addr +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(lines.join('\n'));
  }

  function initContactForms() {
    var forms = toArray(doc.querySelectorAll('form[data-contact]'));
    if (!forms.length) return;
    forms.forEach(setupForm);
  }

  function setupForm(form) {
    if (!form) return;

    var statusEl = form.querySelector('.form__status');
    var submitBtn = form.querySelector('button[type="submit"], button:not([type])');
    var busy = false;

    form.setAttribute('novalidate', '');
    if (statusEl) statusEl.setAttribute('aria-live', 'polite');

    // aria-invalid zurücksetzen, sobald korrigiert wird
    form.addEventListener('input', function (ev) {
      var t = ev.target;
      if (t && t.getAttribute && t.getAttribute('aria-invalid') === 'true') {
        t.removeAttribute('aria-invalid');
      }
    });

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (busy) return;

      var nameEl = field(form, 'name');
      var emailEl = field(form, 'email');
      var messageEl = field(form, 'message');
      var honeypot = field(form, 'website');

      var data = { name: val(nameEl), email: val(emailEl), message: val(messageEl) };

      // Honeypot: Bot erkannt → nicht senden, still Erfolg melden
      if (honeypot && val(honeypot) !== '') {
        form.reset();
        setStatus(statusEl, 'ok', msg(form, 'ok'));
        return;
      }

      // Validierung
      [nameEl, emailEl, messageEl].forEach(function (el) {
        if (el) el.removeAttribute('aria-invalid');
      });

      var errors = [];
      if (nameEl && data.name.length < 2) errors.push({ el: nameEl, key: 'name' });
      if (emailEl && !EMAIL_RE.test(data.email)) errors.push({ el: emailEl, key: 'email' });
      if (messageEl && data.message.length < 10) errors.push({ el: messageEl, key: 'message' });

      if (errors.length) {
        errors.forEach(function (e) { e.el.setAttribute('aria-invalid', 'true'); });
        setStatus(statusEl, 'err', errors.map(function (e) { return msg(form, e.key); }).join(' '));
        try { errors[0].el.focus(); } catch (e) { /* ignore */ }
        return;
      }

      // Die Nachricht geht an die eigene Datenbank (lumen.contact), nicht an
      // einen Fremdanbieter. Kein Dritter sieht Name, Adresse oder Text.
      if (typeof window.fetch !== 'function') {
        fail();
        return;
      }

      // Senden
      busy = true;
      setStatus(statusEl, null);
      var originalLabel = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = msg(form, 'sending');
      }
      form.setAttribute('aria-busy', 'true');

      window.fetch(ENDPOINT, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'apikey': KEY,
          'Authorization': 'Bearer ' + KEY,
          'Content-Type': 'application/json',
          'Content-Profile': 'lumen'
        },
        body: JSON.stringify({
          p_name: data.name,
          p_email: data.email,
          p_message: data.message,
          p_topic: val(field(form, 'topic')),
          p_project: val(field(form, 'project')),
          p_lang: document.documentElement.lang === 'en' ? 'en' : 'de',
          p_honeypot: val(honeypot)
        })
      }).then(function (res) {
        return res.json().catch(function () { return null; }).then(function (json) {
          return { res: res, json: json };
        });
      }).then(function (r) {
        if (r.res.ok && r.json && r.json.ok === true) {
          form.reset();
          setStatus(statusEl, 'ok', msg(form, 'ok'));
        } else if (r.json && r.json.reason === 'rate') {
          setStatus(statusEl, 'err', msg(form, 'rate'), buildMailto(form, data), msg(form, 'mailto'));
        } else {
          fail();
        }
      }).catch(function () {
        fail();
      }).then(function () {
        busy = false;
        form.removeAttribute('aria-busy');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalLabel;
        }
      });

      function fail() {
        setStatus(statusEl, 'err', msg(form, 'err'), buildMailto(form, data), msg(form, 'mailto'));
      }
    });
  }

  /* ------------------------------------------------------------------
     Start
     ------------------------------------------------------------------ */
  ready(function () {
    [initReveal, initNav, initAnchors, initYear, initContactForms].forEach(function (fn) {
      try { fn(); } catch (e) {
        if (window.console && console.error) console.error('[site.js]', e);
      }
    });
  });
})();
