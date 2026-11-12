/*!
 * Lumenrib — carousel.js
 * Progressive Enhancement für das horizontale Foto-Karussell.
 * Ohne JS bleibt der Track per CSS overflow-x + scroll-snap voll bedienbar.
 */
(function () {
  'use strict';

  var doc = document;

  function isReducedMotion() {
    try {
      return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    } catch (e) {
      return false;
    }
  }

  function toArray(list) {
    return Array.prototype.slice.call(list || []);
  }

  function initCarousel(root) {
    var track = root.querySelector('[data-carousel-track]');
    var slides = toArray(root.querySelectorAll('[data-carousel-slide]'));
    if (!track || !slides.length) return;

    var controls = root.querySelector('[data-carousel-controls]');
    var prevBtn = root.querySelector('[data-carousel-prev]');
    var nextBtn = root.querySelector('[data-carousel-next]');
    var dotsWrap = root.querySelector('[data-carousel-dots]');
    var dots = dotsWrap ? toArray(dotsWrap.querySelectorAll('[data-carousel-dot]')) : [];

    if (controls) controls.removeAttribute('hidden');
    if (dotsWrap) dotsWrap.removeAttribute('hidden');

    var activeIndex = 0;
    var rafId = 0;

    function getTrackPadLeft() {
      try {
        var cs = window.getComputedStyle(track);
        return parseFloat(cs.paddingLeft) || 0;
      } catch (e) {
        return 0;
      }
    }

    function computeActiveIndex() {
      var scrollLeft = track.scrollLeft;
      var maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
      if (maxScroll > 0 && scrollLeft >= maxScroll - 4) {
        return slides.length - 1;
      }
      var padLeft = getTrackPadLeft();
      var bestIdx = 0;
      var bestDist = Infinity;
      for (var i = 0; i < slides.length; i++) {
        var targetLeft = Math.max(0, slides[i].offsetLeft - padLeft);
        var dist = Math.abs(targetLeft - scrollLeft);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = i;
        }
      }
      return bestIdx;
    }

    function updateUI(idx) {
      activeIndex = Math.max(0, Math.min(slides.length - 1, idx));
      if (prevBtn) prevBtn.disabled = activeIndex <= 0;
      if (nextBtn) nextBtn.disabled = activeIndex >= slides.length - 1;
      for (var i = 0; i < dots.length; i++) {
        if (i === activeIndex) {
          dots[i].setAttribute('aria-current', 'true');
        } else {
          dots[i].removeAttribute('aria-current');
        }
      }
    }

    function scrollToSlide(idx) {
      var clamped = Math.max(0, Math.min(slides.length - 1, idx));
      var padLeft = getTrackPadLeft();
      var targetLeft = Math.max(0, slides[clamped].offsetLeft - padLeft);
      var maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
      if (targetLeft > maxScroll) targetLeft = maxScroll;

      track.scrollTo({
        left: targetLeft,
        behavior: isReducedMotion() ? 'auto' : 'smooth'
      });
      updateUI(clamped);
    }

    function onScroll() {
      if (rafId) return;
      rafId = window.requestAnimationFrame(function () {
        rafId = 0;
        updateUI(computeActiveIndex());
      });
    }

    track.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () {
      updateUI(computeActiveIndex());
    }, { passive: true });

    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        scrollToSlide(activeIndex - 1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        scrollToSlide(activeIndex + 1);
      });
    }

    dots.forEach(function (dot, idx) {
      dot.addEventListener('click', function () {
        scrollToSlide(idx);
      });
    });

    track.addEventListener('keydown', function (ev) {
      if (ev.key === 'ArrowRight') {
        ev.preventDefault();
        scrollToSlide(activeIndex + 1);
      } else if (ev.key === 'ArrowLeft') {
        ev.preventDefault();
        scrollToSlide(activeIndex - 1);
      } else if (ev.key === 'Home') {
        ev.preventDefault();
        scrollToSlide(0);
      } else if (ev.key === 'End') {
        ev.preventDefault();
        scrollToSlide(slides.length - 1);
      }
    });

    updateUI(0);
  }

  function start() {
    toArray(doc.querySelectorAll('[data-carousel]')).forEach(function (el) {
      try { initCarousel(el); } catch (e) {
        if (window.console && console.error) console.error('[carousel.js]', e);
      }
    });
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
