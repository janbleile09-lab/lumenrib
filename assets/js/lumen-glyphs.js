/********************************************************************
 * LUMENRIB 3D VECTOR GLYPHS (Support-Free <= 45° Relief Font)
 * Pure offline stroke/bar vector definitions for FDM 3D printing.
 * Coverage: A-Z, 0-9, Space, Ä Ö Ü ß, ! ? , . - & '
 * Lowercase letters a-z, ä, ö, ü are mapped to uppercase capitals;
 * ß and ẞ map to the dedicated ß glyph.
 ********************************************************************/
(function (root) {
  'use strict';

  const GLYPHS = {
    ' ': { w: 0.38, bars: [], stems: [] },
    'A': { w: 0.64, bars: [[0.15, 0.85, 0.38], [0.35, 0.65, 0.96]], stems: [[0, 0, 0.42, 1], [1, 0, 0.58, 1]] },
    'B': { w: 0.62, bars: [[0, 0.88, 0], [0, 0.85, 0.50], [0, 0.85, 1]], stems: [[0, 0, 0, 1], [1, 0.04, 1, 0.46], [0.95, 0.54, 0.95, 0.96]] },
    'C': { w: 0.60, bars: [[0.12, 1, 0], [0.12, 1, 1]], stems: [[0, 0.06, 0, 0.94]] },
    'D': { w: 0.62, bars: [[0, 0.82, 0], [0, 0.82, 1]], stems: [[0, 0, 0, 1], [1, 0.08, 1, 0.92]] },
    'E': { w: 0.58, bars: [[0, 1, 0], [0, 0.78, 0.50], [0, 1, 1]], stems: [[0, 0, 0, 1]] },
    'F': { w: 0.56, bars: [[0, 0.78, 0.48], [0, 1, 1]], stems: [[0, 0, 0, 1]] },
    'G': { w: 0.62, bars: [[0.10, 1, 0], [0.48, 1, 0.48], [0.10, 1, 1]], stems: [[0, 0.06, 0, 0.94], [1, 0, 1, 0.48]] },
    'H': { w: 0.62, bars: [[0, 1, 0.50]], stems: [[0, 0, 0, 1], [1, 0, 1, 1]] },
    'I': { w: 0.18, bars: [], stems: [[0.5, 0, 0.5, 1]] },
    'J': { w: 0.54, bars: [[0, 0.88, 0]], stems: [[1, 0.06, 1, 1], [0, 0.06, 0, 0.36]] },
    'K': { w: 0.62, bars: [[0, 0.35, 0.50]], stems: [[0, 0, 0, 1], [1, 0, 0.32, 0.50], [0.32, 0.50, 1, 1]] },
    'L': { w: 0.56, bars: [[0, 1, 0]], stems: [[0, 0, 0, 1]] },
    'M': { w: 0.76, bars: [], stems: [[0, 0, 0, 1], [0.5, 0.18, 0, 1], [0.5, 0.18, 1, 1], [1, 0, 1, 1]] },
    'N': { w: 0.64, bars: [], stems: [[0, 0, 0, 1], [0.85, 0, 0.15, 1], [1, 0, 1, 1]] },
    'O': { w: 0.64, bars: [[0.10, 0.90, 0], [0.10, 0.90, 1]], stems: [[0, 0.06, 0, 0.94], [1, 0.06, 1, 0.94]] },
    'P': { w: 0.60, bars: [[0, 0.88, 0.48], [0, 0.88, 1]], stems: [[0, 0, 0, 1], [1, 0.52, 1, 0.96]] },
    'Q': { w: 0.64, bars: [[0.10, 0.90, 0.08], [0.10, 0.90, 1]], stems: [[0, 0.12, 0, 0.94], [1, 0.12, 1, 0.94], [0.95, 0, 0.60, 0.32]] },
    'R': { w: 0.62, bars: [[0, 0.88, 0.48], [0, 0.88, 1]], stems: [[0, 0, 0, 1], [1, 0.52, 1, 0.96], [1, 0, 0.42, 0.48]] },
    'S': { w: 0.60, bars: [[0, 0.92, 0], [0.08, 0.92, 0.50], [0.08, 1, 1]], stems: [[0, 0.52, 0, 0.96], [1, 0.04, 1, 0.48]] },
    'T': { w: 0.60, bars: [[0, 1, 1]], stems: [[0.5, 0, 0.5, 1]] },
    'U': { w: 0.62, bars: [[0.10, 0.90, 0]], stems: [[0, 0.06, 0, 1], [1, 0.06, 1, 1]] },
    'V': { w: 0.62, bars: [[0.38, 0.62, 0]], stems: [[0.42, 0, 0, 1], [0.58, 0, 1, 1]] },
    'W': { w: 0.78, bars: [], stems: [[0, 0, 0, 1], [0.15, 0, 0.5, 0.72], [0.85, 0, 0.5, 0.72], [1, 0, 1, 1]] },
    'X': { w: 0.62, bars: [], stems: [[0, 0, 1, 1], [1, 0, 0, 1]] },
    'Y': { w: 0.62, bars: [], stems: [[0.5, 0, 0.5, 0.48], [0.5, 0.46, 0, 1], [0.5, 0.46, 1, 1]] },
    'Z': { w: 0.60, bars: [[0, 1, 0], [0, 1, 1]], stems: [[0.10, 0.06, 0.90, 0.94]] },
    'Ä': { w: 0.64, bars: [[0.15, 0.85, 0.30], [0.35, 0.65, 0.78]], stems: [[0, 0, 0.42, 0.82], [1, 0, 0.58, 0.82], [0.15, 0.92, 0.15, 1.04], [0.85, 0.92, 0.85, 1.04]] },
    'Ö': { w: 0.64, bars: [[0.10, 0.90, 0], [0.10, 0.90, 0.78]], stems: [[0, 0.05, 0, 0.76], [1, 0.05, 1, 0.76], [0.18, 0.92, 0.18, 1.04], [0.82, 0.92, 0.82, 1.04]] },
    'Ü': { w: 0.64, bars: [[0.10, 0.90, 0]], stems: [[0, 0.05, 0, 0.80], [1, 0.05, 1, 0.80], [0.18, 0.92, 0.18, 1.04], [0.82, 0.92, 0.82, 1.04]] },
    'ß': { w: 0.62, bars: [[0.32, 0.92, 0], [0.32, 0.88, 0.50], [0, 0.88, 1]], stems: [[0, 0, 0, 1], [0.92, 0.52, 0.92, 0.96], [1, 0.04, 1, 0.48]] },
    '0': { w: 0.60, bars: [[0.10, 0.90, 0], [0.10, 0.90, 1]], stems: [[0, 0.06, 0, 0.94], [1, 0.06, 1, 0.94], [0.20, 0.18, 0.80, 0.82]] },
    '1': { w: 0.44, bars: [[0, 1, 0], [0.10, 0.65, 0.82]], stems: [[0.65, 0, 0.65, 1]] },
    '2': { w: 0.60, bars: [[0, 1, 0], [0.08, 0.92, 0.48], [0, 0.92, 1]], stems: [[0, 0, 0, 0.48], [1, 0.50, 1, 0.96]] },
    '3': { w: 0.60, bars: [[0, 0.92, 0], [0.18, 0.92, 0.50], [0, 0.92, 1]], stems: [[1, 0.04, 1, 0.96]] },
    '4': { w: 0.62, bars: [[0, 1, 0.36]], stems: [[0, 0.36, 0.55, 1], [0.78, 0, 0.78, 1]] },
    '5': { w: 0.60, bars: [[0, 0.92, 0], [0, 0.92, 0.52], [0, 1, 1]], stems: [[0, 0.52, 0, 1], [1, 0.04, 1, 0.50]] },
    '6': { w: 0.60, bars: [[0.08, 0.92, 0], [0.08, 0.92, 0.50], [0.08, 0.92, 1]], stems: [[0, 0.04, 0, 0.96], [1, 0.04, 1, 0.48]] },
    '7': { w: 0.60, bars: [[0, 1, 1]], stems: [[0.25, 0, 0.95, 0.96]] },
    '8': { w: 0.62, bars: [[0.08, 0.92, 0], [0.08, 0.92, 0.50], [0.08, 0.92, 1]], stems: [[0, 0.04, 0, 0.96], [1, 0.04, 1, 0.96]] },
    '9': { w: 0.60, bars: [[0.08, 0.92, 0], [0.08, 0.92, 0.50], [0.08, 0.92, 1]], stems: [[0, 0.52, 0, 0.96], [1, 0.04, 1, 0.96]] },
    '!': { w: 0.18, bars: [], stems: [[0.5, 0, 0.5, 0.16], [0.5, 0.36, 0.5, 1]] },
    '?': { w: 0.56, bars: [[0, 0.92, 1], [0.42, 0.92, 0.48]], stems: [[0.42, 0, 0.42, 0.16], [0.42, 0.32, 0.42, 0.52], [1, 0.50, 1, 0.96]] },
    ',': { w: 0.20, bars: [], stems: [[0.3, 0, 0.6, 0.28]] },
    '.': { w: 0.18, bars: [], stems: [[0.5, 0, 0.5, 0.18]] },
    '-': { w: 0.44, bars: [[0, 1, 0.48]], stems: [] },
    '&': { w: 0.68, bars: [[0.08, 0.78, 0], [0.12, 0.72, 0.52], [0.12, 0.72, 1]], stems: [[0, 0.06, 0, 0.50], [0.12, 0.52, 0.12, 0.96], [0.76, 0.52, 0.76, 0.96], [1, 0, 0.48, 0.62]] },
    '\'': { w: 0.18, bars: [], stems: [[0.5, 0.68, 0.5, 1]] }
  };

  function normalizeChar(ch) {
    if (!ch) return '';
    if (ch === 'ß' || ch === 'ẞ') return 'ß';
    if (ch === '’' || ch === '‘' || ch === '`') return '\'';
    if (ch === '–' || ch === '—') return '-';
    const up = ch.toUpperCase();
    return Object.prototype.hasOwnProperty.call(GLYPHS, up) ? up : '';
  }

  function sanitizeGreetingText(raw, maxLen) {
    const limit = typeof maxLen === 'number' && maxLen > 0 ? maxLen : 24;
    const str = String(raw == null ? '' : raw);
    let out = '';
    let prevSpace = false;
    for (let i = 0; i < str.length; i++) {
      const norm = normalizeChar(str[i]);
      if (!norm) continue;
      if (norm === ' ') {
        if (prevSpace || out.length === 0) continue;
        prevSpace = true;
      } else {
        prevSpace = false;
      }
      out += norm;
      if (out.length >= limit) break;
    }
    return out.trim();
  }

  function computeStrokeMetrics(sizeMm) {
    const s = Math.max(6, Number(sizeMm) || 12);
    const strokeW = Math.max(1.6, s * 0.15);
    const gapMm = Math.max(0.85, s * 0.12);
    return { sizeMm: s, strokeW, gapMm };
  }

  function glyphBoxWidthMm(glyphDef, sizeMm, strokeW) {
    if (!glyphDef) return 0;
    if (glyphDef.bars.length === 0 && glyphDef.stems.length === 0) {
      return Math.max(strokeW * 1.15, sizeMm * glyphDef.w);
    }
    if (glyphDef.w <= 0.22) {
      return Math.max(strokeW, sizeMm * glyphDef.w);
    }
    return Math.max(strokeW * 2.2, sizeMm * glyphDef.w);
  }

  function layoutGreetingString(rawText, sizeMm) {
    const text = sanitizeGreetingText(rawText, 24);
    const { sizeMm: s, strokeW, gapMm } = computeStrokeMetrics(sizeMm);
    const items = [];
    let cursorX = 0;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const def = GLYPHS[ch];
      if (!def) continue;
      const boxW = glyphBoxWidthMm(def, s, strokeW);
      items.push({
        ch,
        def,
        xStart: cursorX,
        boxW,
        innerW: Math.max(0, boxW - strokeW)
      });
      cursorX += boxW + (i < text.length - 1 ? gapMm : 0);
    }
    const totalW = cursorX;
    for (let i = 0; i < items.length; i++) {
      items[i].xStart -= totalW * 0.5;
    }
    return {
      text,
      sizeMm: s,
      strokeW,
      gapMm,
      totalWidthMm: totalW,
      items
    };
  }

  const api = {
    GLYPHS,
    normalizeChar,
    sanitizeGreetingText,
    computeStrokeMetrics,
    glyphBoxWidthMm,
    layoutGreetingString
  };

  root.LumenGlyphs = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
