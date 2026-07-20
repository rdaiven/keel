/* keel site — design system engine.
   Runs on every page: applies the visitor's saved design system
   (localStorage) to :root so the whole site renders in their brand.
   On design.html it also wires the tool: three seeds (color, mood,
   fonts) + three sliders (contrast, corners, density) → full token
   system derived by math. Guardrail: text/bg and on-accent/accent
   are nudged until they pass WCAG AA — play can't ship unreadable
   text. */
(function () {
  "use strict";

  var STORE = "keel-ds";

  var MOODS = {
    calm:  { dark: false, satMul: 0.72, bgTintSat: 10, warmShift: 0,  cornerBias: 0.15,  contrastBias: -4 },
    bold:  { dark: false, satMul: 1.0,  bgTintSat: 4,  warmShift: 0,  cornerBias: -0.3,  contrastBias: 10 },
    warm:  { dark: false, satMul: 0.85, bgTintSat: 18, warmShift: 34, cornerBias: 0.35,  contrastBias: -2 },
    slate: { dark: false, satMul: 0.5,  bgTintSat: 7,  warmShift: 0,  cornerBias: -0.1,  contrastBias: 3 },
    night: { dark: true,  satMul: 0.9,  bgTintSat: 12, warmShift: 0,  cornerBias: 0,     contrastBias: 4 },
    dusk:  { dark: true,  satMul: 0.8,  bgTintSat: 16, warmShift: 28, cornerBias: 0.2,   contrastBias: -2 },
    forest:  { dark: false, satMul: 0.78, bgTintSat: 14, warmShift: -10, cornerBias: 0.2,   contrastBias: -2 },
    rose:    { dark: false, satMul: 0.85, bgTintSat: 22, warmShift: 14,  cornerBias: 0.45,  contrastBias: -3 },
    mono:    { dark: false, satMul: 0.25, bgTintSat: 4,  warmShift: 0,   cornerBias: -0.2,  contrastBias: 6 },
    contrast:{ dark: false, satMul: 1.0,  bgTintSat: 2,  warmShift: 0,   cornerBias: -0.45, contrastBias: 24 }
  };

  var FONTS = {
    grotesk:   { display: 'system-ui, "Segoe UI", sans-serif', body: 'system-ui, "Segoe UI", sans-serif', weight: 700, tracking: "-0.02em" },
    editorial: { display: 'Georgia, "Times New Roman", serif', body: 'system-ui, "Segoe UI", sans-serif', weight: 600, tracking: "-0.005em" },
    humanist:  { display: '"Segoe UI", Verdana, sans-serif',   body: '"Segoe UI", Verdana, sans-serif',   weight: 600, tracking: "0.005em" },
    console:   { display: 'ui-monospace, Consolas, monospace', body: 'system-ui, "Segoe UI", sans-serif', weight: 700, tracking: "-0.03em" },
    rounded:   { display: 'ui-rounded, "Segoe UI", system-ui, sans-serif', body: 'ui-rounded, "Segoe UI", system-ui, sans-serif', weight: 700, tracking: "0em" },
    print:     { display: 'system-ui, "Segoe UI", sans-serif', body: 'Georgia, "Times New Roman", serif', weight: 700, tracking: "-0.02em" },
    /* self-hosted webfonts (fonts.css) — identical on every OS.
       `google` powers the optional <link> line in the export. */
    inter:     { display: '"Inter", system-ui, sans-serif', body: '"Inter", system-ui, sans-serif', weight: 700, tracking: "-0.02em", google: "family=Inter:wght@400;700" },
    manrope:   { display: '"Manrope", system-ui, sans-serif', body: '"Manrope", system-ui, sans-serif', weight: 700, tracking: "-0.01em", google: "family=Manrope:wght@400;700" },
    space:     { display: '"Space Grotesk", system-ui, sans-serif', body: '"Inter", system-ui, sans-serif', weight: 700, tracking: "-0.015em", google: "family=Space+Grotesk:wght@700&family=Inter:wght@400;700" },
    playfair:  { display: '"Playfair Display", Georgia, serif', body: '"Inter", system-ui, sans-serif', weight: 700, tracking: "0em", google: "family=Playfair+Display:wght@700&family=Inter:wght@400;700" },
    lora:      { display: '"Lora", Georgia, serif', body: '"Lora", Georgia, serif', weight: 700, tracking: "0em", google: "family=Lora:wght@400;700" },
    jetbrains: { display: '"JetBrains Mono", ui-monospace, monospace', body: '"Inter", system-ui, sans-serif', weight: 700, tracking: "-0.02em", google: "family=JetBrains+Mono:wght@400;700&family=Inter:wght@400;700" },
    classic:   { display: 'Georgia, "Times New Roman", serif', body: 'Georgia, "Times New Roman", serif', weight: 700, tracking: "0em" },
    terminal:  { display: 'ui-monospace, Consolas, "Cascadia Mono", monospace', body: 'ui-monospace, Consolas, "Cascadia Mono", monospace', weight: 700, tracking: "-0.02em" }
  };

  var HARMONIES = { complement: 180, analog: 40, triad: 120, custom: null };

  /* type scale — named modular ratios (the standard musical set) */
  var RATIOS = {
    "minor-third": 1.2, "major-third": 1.25, "fourth": 1.333,
    "aug-fourth": 1.414, "golden": 1.618
  };
  /* Build keel's 7-step fluid type scale from one base size + one ratio.
     Headings use the chosen ratio; sub-body sizes (xs, s) use a gentle
     fixed step so small text never collapses. Each step fluidly grows
     from a 320px viewport to 1240px — the recommended range — as a
     clamp(min, preferred, max). No manual clamp math for the user. */
  function typeScale(basePx, ratio) {
    var MINVW = 320, MAXVW = 1240, DOWN = 1.125, maxBase = basePx * 1.06;
    var minR = 1 + (ratio - 1) * 0.82;  /* gentler scale on small screens */
    var steps = [["--k-text-xs", -2], ["--k-text-s", -1], ["--k-text-m", 0],
                 ["--k-text-l", 1], ["--k-text-xl", 2], ["--k-text-2xl", 3], ["--k-text-3xl", 4]];
    function r3(x) { return Math.round(x * 1000) / 1000; }
    var out = {};
    steps.forEach(function (pair) {
      var n = pair[1];
      var minPx = basePx  * Math.pow(n < 0 ? DOWN : minR,  n);
      var maxPx = maxBase * Math.pow(n < 0 ? DOWN : ratio, n);
      if (maxPx < minPx) maxPx = minPx;
      var slope = (maxPx - minPx) / (MAXVW - MINVW);
      var interceptRem = (minPx - slope * MINVW) / 16;
      var minRem = minPx / 16, maxRem = maxPx / 16, slopeVw = slope * 100;
      out[pair[0]] = slopeVw < 0.001
        ? r3(minRem) + "rem"
        : "clamp(" + r3(minRem) + "rem, " + r3(interceptRem) + "rem + " +
          r3(slopeVw) + "vw, " + r3(maxRem) + "rem)";
    });
    return out;
  }

  var DEFAULTS = { color: "#4a5df0", harmony: "triad", color2: "#d81b4f",
                   color3: "#15796f",   /* accent (tertiary) — a picked hex */
                   text: null, bg: null,  /* optional foundation — null = derive from the mood */
                   mood: "calm", fonts: "grotesk", contrast: 50, corners: 40, density: 50,
                   baseSize: 17, scale: "fourth",   /* type: base px + modular ratio */
                   prefix: "k",   /* class prefix for the downloaded build (.k-btn) */
                   dark: null };  /* null = follow the mood; true/false = force light/dark */
  var state = load();

  function load() {
    try {
      var raw = localStorage.getItem(STORE);
      if (raw) {
        var s = JSON.parse(raw);
        if (s && MOODS[s.mood] && FONTS[s.fonts] && /^#[0-9a-f]{6}$/i.test(s.color)) {
          var hex6 = /^#[0-9a-f]{6}$/i;
          return { color: s.color, mood: s.mood, fonts: s.fonts,
                   harmony: HARMONIES.hasOwnProperty(s.harmony) ? s.harmony : DEFAULTS.harmony,
                   color2: hex6.test(s.color2) ? s.color2 : DEFAULTS.color2,
                   color3: hex6.test(s.color3) ? s.color3 : DEFAULTS.color3,
                   text: hex6.test(s.text) ? s.text : null,
                   bg: hex6.test(s.bg) ? s.bg : null,
                   contrast: clampN(s.contrast), corners: clampN(s.corners), density: clampN(s.density),
                   baseSize: (Number(s.baseSize) >= 14 && Number(s.baseSize) <= 22) ? Number(s.baseSize) : DEFAULTS.baseSize,
                   scale: RATIOS.hasOwnProperty(s.scale) ? s.scale : DEFAULTS.scale,
                   prefix: cleanPrefix(s.prefix),
                   dark: (s.dark === true || s.dark === false) ? s.dark : null };
        }
      }
    } catch (e) { /* private mode etc. — defaults are fine */ }
    return JSON.parse(JSON.stringify(DEFAULTS));
  }
  function clampN(v) { v = Number(v); return isFinite(v) ? Math.max(0, Math.min(100, v)) : 50; }
  /* a safe CSS class prefix: lowercase, [a-z0-9-], no leading/trailing dash */
  function cleanPrefix(p) {
    p = String(p == null ? "k" : p).toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/^-+|-+$/g, "");
    return p || "k";
  }
  function save() {
    try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) {}
  }
  function clearSaved() {
    try { localStorage.removeItem(STORE); } catch (e) {}
  }

  /* ---- color math ---- */
  function hexToHsl(hex) {
    var r = parseInt(hex.slice(1, 3), 16) / 255,
        g = parseInt(hex.slice(3, 5), 16) / 255,
        b = parseInt(hex.slice(5, 7), 16) / 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    var h = 0, s = 0, l = (max + min) / 2;
    if (d) {
      s = d / (1 - Math.abs(2 * l - 1));
      if (max === r) h = 60 * (((g - b) / d) % 6);
      else if (max === g) h = 60 * ((b - r) / d + 2);
      else h = 60 * ((r - g) / d + 4);
    }
    return { h: (h + 360) % 360, s: s * 100, l: l * 100 };
  }
  function hslToRgb(h, s, l) {
    s /= 100; l /= 100;
    var c = (1 - Math.abs(2 * l - 1)) * s,
        x = c * (1 - Math.abs(((h / 60) % 2) - 1)),
        m = l - c / 2, r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; }
    else if (h < 180) { g = c; b = x; } else if (h < 240) { g = x; b = c; }
    else if (h < 300) { r = x; b = c; } else { r = c; b = x; }
    return [r + m, g + m, b + m];
  }
  function luminance(rgb) {
    var a = rgb.map(function (v) {
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
  }
  function ratio(hslA, hslB) {
    var la = luminance(hslToRgb(hslA.h, hslA.s, hslA.l)),
        lb = luminance(hslToRgb(hslB.h, hslB.s, hslB.l));
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  }
  /* push `fg.l` away from bg until the pair clears `target` */
  function enforce(fg, bg, target) {
    var darken = bg.l > 50, guard = 0;
    while (ratio(fg, bg) < target && guard++ < 120) {
      fg.l += darken ? -1 : 1;
      if (fg.l <= 0 || fg.l >= 100) break;
    }
    return fg;
  }
  function css(c) { return "hsl(" + Math.round(c.h) + " " + Math.round(c.s) + "% " + (Math.round(c.l * 10) / 10) + "%)"; }
  function hslToHex(h, s, l) {
    return "#" + hslToRgb(h, s, l)
      .map(function (v) { return ("0" + Math.round(v * 255).toString(16)).slice(-2); })
      .join("");
  }
  /* the 2D shade area works in HSV (white→hue across, →black down) */
  function hslToHsv(h, s, l) {
    s /= 100; l /= 100;
    var v = l + s * Math.min(l, 1 - l);
    var sv = v === 0 ? 0 : 2 * (1 - l / v);
    return { h: h, s: sv * 100, v: v * 100 };
  }
  function hsvToHsl(h, sv, v) {
    sv /= 100; v /= 100;
    var l = v * (1 - sv / 2);
    var s = (l === 0 || l === 1) ? 0 : (v - l) / Math.min(l, 1 - l);
    return { h: h, s: s * 100, l: l * 100 };
  }
  /* linear blend of two HSL colors (used to derive soft text from a
     custom text+background pair) */
  function mixHsl(a, b, t) {
    return { h: a.h + (b.h - a.h) * t, s: a.s + (b.s - a.s) * t, l: a.l + (b.l - a.l) * t };
  }

  /* ---- derivation ---- */
  function derive() {
    var m = MOODS[state.mood], f = FONTS[state.fonts];
    /* light/dark preview override: null = follow the mood's own default */
    var isDark = (state.dark == null) ? m.dark : !!state.dark;
    var brand = hexToHsl(state.color);
    var h = brand.h, sat = Math.min(96, brand.s * m.satMul);
    var con = (state.contrast + m.contrastBias) / 100;
    con = Math.max(0, Math.min(1, con));
    var bgH = (h + m.warmShift) % 360;
    var tintS = Math.min(m.bgTintSat, sat * 0.4 + 3);

    var t = {};
    if (isDark) {
      /* surfaces step up in lightness AND drift slightly in hue —
         flat one-hue darks read cheap; this reads built */
      t.bg           = { h: bgH, s: tintS + 5, l: 9 + (1 - con) * 4 };
      t.surface      = { h: (bgH + 3) % 360, s: tintS + 5, l: t.bg.l + 4.5 };
      t.surface2     = { h: (bgH + 6) % 360, s: tintS + 5, l: t.bg.l + 9.5 };
      t.border       = { h: bgH, s: tintS + 3, l: t.bg.l + 15 };
      t.borderStrong = { h: bgH, s: tintS + 3, l: t.bg.l + 26 };
      t.text         = { h: bgH, s: 10, l: 89 + con * 8 };
      t.textSoft     = { h: bgH, s: 9,  l: 70 };
      t.textFaint    = { h: bgH, s: 8,  l: 56 };
      t.accent       = { h: h, s: sat, l: 62 + (1 - con) * 6 };
      t.accentSoft   = { h: h, s: Math.min(50, sat * 0.6), l: 20 };
      t.ok           = { h: 152, s: 45, l: 58 };
      t.warn         = { h: 40,  s: 80, l: 60 };
      t.danger       = { h: 4,   s: 70, l: 62 };
    } else {
      t.bg           = { h: bgH, s: tintS, l: 97.5 + (1 - con) * 1.5 };
      t.surface      = { h: bgH, s: Math.max(0, tintS - 6), l: 100 };
      t.surface2     = { h: bgH, s: tintS, l: 94 - con * 2 };
      t.border       = { h: bgH, s: tintS + 2, l: 88 - con * 5 };
      t.borderStrong = { h: bgH, s: tintS + 2, l: 76 - con * 6 };
      t.text         = { h: bgH, s: 20, l: 16 - con * 8 };
      t.textSoft     = { h: bgH, s: 11, l: 38 - con * 5 };
      t.textFaint    = { h: bgH, s: 9,  l: 52 };
      t.accent       = { h: h, s: sat, l: 52 - con * 8 };
      t.accentSoft   = { h: h, s: Math.min(75, sat * 0.8), l: 94 };
      t.ok           = { h: 152, s: 60, l: 30 };
      t.warn         = { h: 38,  s: 92, l: 34 };
      t.danger       = { h: 4,   s: 74, l: 42 };
    }

    /* ---- brand seeds — used as picked. The tool respects your colors
       and derives only their variants + a legible on-color; the neutrals
       above still tint from the primary hue + mood. ---- */
    t.accent = hexToHsl(state.color);
    t.accentSoft = { h: t.accent.h,
                     s: isDark ? Math.min(50, t.accent.s * 0.6) : Math.min(75, t.accent.s * 0.8),
                     l: isDark ? 20 : 94 };

    /* secondary — a custom hex (used as picked) or derived from the
       primary hue by harmony (a suggestion that can't clash) */
    if (state.harmony === "custom") {
      t.accent2 = hexToHsl(state.color2);
    } else {
      var h2 = (h + HARMONIES[state.harmony]) % 360;
      t.accent2 = { h: h2, s: sat, l: t.accent.l };
    }
    t.accent2Soft = { h: t.accent2.h,
                      s: isDark ? Math.min(50, t.accent2.s * 0.6) : Math.min(75, t.accent2.s * 0.8),
                      l: isDark ? 20 : 94 };

    /* accent (tertiary) — always a picked hex, used as-is */
    t.accent3 = hexToHsl(state.color3);
    t.accent3Soft = { h: t.accent3.h,
                      s: isDark ? Math.min(50, t.accent3.s * 0.6) : Math.min(75, t.accent3.s * 0.8),
                      l: isDark ? 20 : 94 };

    /* optional foundation — text & background, respected exactly when
       set; otherwise they stay mood-derived */
    var bgCustom = /^#[0-9a-f]{6}$/i.test(state.bg || "");
    var textCustom = /^#[0-9a-f]{6}$/i.test(state.text || "");
    if (bgCustom) {
      var ubg = hexToHsl(state.bg), dk = ubg.l < 50, us = Math.min(ubg.s, 22);
      t.bg           = ubg;
      t.surface      = { h: ubg.h, s: Math.min(us, 16), l: dk ? ubg.l + 4.5 : Math.min(100, ubg.l + 2) };
      t.surface2     = { h: ubg.h, s: us, l: dk ? ubg.l + 9.5 : Math.max(0, ubg.l - 3.5) };
      t.border       = { h: ubg.h, s: us, l: dk ? ubg.l + 15 : Math.max(0, ubg.l - 9) };
      t.borderStrong = { h: ubg.h, s: us, l: dk ? ubg.l + 26 : Math.max(0, ubg.l - 18) };
      if (!textCustom) t.text = { h: ubg.h, s: 12, l: dk ? 92 : 15 };
    }
    if (textCustom) t.text = hexToHsl(state.text);
    if (bgCustom || textCustom) {
      t.textSoft  = mixHsl(t.text, t.bg, 0.34);
      t.textFaint = mixHsl(t.text, t.bg, 0.55);
    }

    /* guardrail — derived neutrals are nudged to stay legible; the colors
       you picked are respected, and we warn instead of moving them
       (WCAG AA: text 7:1 target, on-accent 4.5:1). */
    var warn = { text: false, accent: false, accent2: false, accent3: false };
    if (textCustom || bgCustom) { warn.text = ratio(t.text, t.bg) < 4.5; }
    else { enforce(t.text, t.bg, 7); }
    enforce(t.textSoft, t.bg, 4.5);
    enforce(t.textFaint, t.bg, 3);

    /* pick a legible on-color WITHOUT moving the brand color: prefer
       white (keel's convention); if it can't clear AA, darken a tinted
       black until it does. Warn (not move the accent) if neither works. */
    function onColorFor(acc) {
      var w = { h: 0, s: 0, l: 100 };
      if (ratio(w, acc) >= 4.5) return w;
      var bl = { h: acc.h, s: 30, l: 10 }, guard = 0;
      while (ratio(bl, acc) < 4.5 && bl.l > 0 && guard++ < 60) bl.l -= 1;
      return ratio(w, acc) >= ratio(bl, acc) ? w : bl;
    }
    function strongOf(a) {
      return { h: a.h, s: a.s, l: isDark ? Math.min(90, a.l + 8) : Math.max(8, a.l - 9) };
    }
    t.onAccent  = onColorFor(t.accent);  t.accentStrong  = strongOf(t.accent);
    t.onAccent2 = onColorFor(t.accent2); t.accent2Strong = strongOf(t.accent2);
    t.onAccent3 = onColorFor(t.accent3); t.accent3Strong = strongOf(t.accent3);
    warn.accent  = ratio(t.onAccent,  t.accent)  < 4.5;
    warn.accent2 = ratio(t.onAccent2, t.accent2) < 4.5;
    warn.accent3 = ratio(t.onAccent3, t.accent3) < 4.5;
    [t.ok, t.warn, t.danger].forEach(function (c) { enforce(c, t.bg, 3); });

    var cornerN = Math.max(0, Math.min(1, state.corners / 100 + m.cornerBias));
    var radius = Math.round(cornerN * 18);
    var density = (0.82 + (state.density / 100) * 0.42).toFixed(3);

    return {
      colors: t, radius: radius, density: density, fonts: f, dark: isDark, warn: warn,
      type: typeScale(state.baseSize, RATIOS[state.scale]),
      ratios: { text: ratio(t.text, t.bg), accent: ratio(t.onAccent, t.accent),
                accent2: ratio(t.onAccent2, t.accent2), accent3: ratio(t.onAccent3, t.accent3) }
    };
  }

  function tokenMap(d) {
    var t = d.colors;
    return Object.assign({}, d.type, {
      "--k-bg": css(t.bg), "--k-surface": css(t.surface), "--k-surface-2": css(t.surface2),
      "--k-border": css(t.border), "--k-border-strong": css(t.borderStrong),
      "--k-text": css(t.text), "--k-text-soft": css(t.textSoft), "--k-text-faint": css(t.textFaint),
      "--k-accent": css(t.accent), "--k-accent-strong": css(t.accentStrong),
      "--k-on-accent": css(t.onAccent), "--k-accent-soft": css(t.accentSoft),
      "--k-accent-2": css(t.accent2), "--k-accent-2-strong": css(t.accent2Strong),
      "--k-on-accent-2": css(t.onAccent2), "--k-accent-2-soft": css(t.accent2Soft),
      "--k-accent-3": css(t.accent3), "--k-accent-3-strong": css(t.accent3Strong),
      "--k-on-accent-3": css(t.onAccent3), "--k-accent-3-soft": css(t.accent3Soft),
      "--k-ok": css(t.ok), "--k-warn": css(t.warn), "--k-danger": css(t.danger),
      "--k-font-display": d.fonts.display, "--k-font-body": d.fonts.body,
      "--k-font-mono": 'ui-monospace, Consolas, "Cascadia Mono", monospace',
      "--k-display-weight": String(d.fonts.weight), "--k-tracking": d.fonts.tracking,
      "--k-radius": d.radius + "px", "--k-density": d.density
    });
  }

  function exportDtcg(d, map) {
    /* colors as hex — hsl() strings are not a valid DTCG color $value */
    var t = d.colors;
    function c(col) { return { "$type": "color", "$value": hslToHex(col.h, col.s, col.l) }; }
    return JSON.stringify({
      "$description": "keel design system — DTCG tokens, generated at keel's design page",
      "color": {
        "bg": c(t.bg), "surface": c(t.surface), "surface-2": c(t.surface2),
        "border": c(t.border), "border-strong": c(t.borderStrong),
        "text": c(t.text), "text-soft": c(t.textSoft), "text-faint": c(t.textFaint),
        "primary": c(t.accent), "primary-strong": c(t.accentStrong),
        "on-primary": c(t.onAccent), "primary-soft": c(t.accentSoft),
        "secondary": c(t.accent2), "secondary-strong": c(t.accent2Strong),
        "on-secondary": c(t.onAccent2), "secondary-soft": c(t.accent2Soft),
        "accent": c(t.accent3), "accent-strong": c(t.accent3Strong),
        "on-accent": c(t.onAccent3), "accent-soft": c(t.accent3Soft),
        "ok": c(t.ok), "warn": c(t.warn), "danger": c(t.danger)
      },
      "dimension": { "radius": { "$type": "dimension", "$value": { "value": d.radius, "unit": "px" } } },
      "number": { "density": { "$type": "number", "$value": Number(d.density) } },
      "fontFamily": {
        "display": { "$type": "fontFamily", "$value": map["--k-font-display"] },
        "body": { "$type": "fontFamily", "$value": map["--k-font-body"] },
        "mono": { "$type": "fontFamily", "$value": map["--k-font-mono"] }
      }
    }, null, 2);
  }

  function exportCss(map) {
    var lines = Object.keys(map).map(function (k) { return "    " + k + ": " + map[k] + ";"; });
    var out = "/* your design system — generated at keel's design page */\n" +
              "@layer tokens {\n  :root {\n" + lines.join("\n") + "\n  }\n}\n";
    var f = FONTS[state.fonts];
    if (f && f.google) {
      out += "\n/* this pairing uses webfonts — either self-host the woff2\n" +
             "   files (copy them from keel's fonts/ folder + fonts.css), or\n" +
             "   link Google Fonts:\n" +
             '   <link rel="stylesheet" href="https://fonts.googleapis.com/css2?' +
             f.google + '&display=swap"> */\n';
    }
    return out;
  }

  /* full export: the framework's entire tokens layer, with this design
     system's seed values inlined and the derived tokens kept as live
     color-mix/calc expressions */
  function exportFullCss(map) {
    var root = location.pathname.replace(/\\/g, "/").includes("/docs/") ? "../" : "";
    return fetch(root + "css/keel.css").then(function (r) { return r.text(); }).then(function (css) {
      var i = css.indexOf("@layer tokens {");
      var d = 0, j = i;
      for (; j < css.length; j++) {
        if (css[j] === "{") d++;
        else if (css[j] === "}") { d--; if (!d) break; }
      }
      var block = css.slice(i, j + 1);
      Object.keys(map).forEach(function (k) {
        block = block.replace(new RegExp("(" + k + ":)[^;]+;"), function () {
          return k + ": " + map[k] + ";";
        });
      });
      return "/* your design system — the FULL keel token set.\n" +
             "   Seeds carry your values; derived tokens stay as live\n" +
             "   color-mix()/calc() expressions, so they keep following\n" +
             "   any token you retune later. */\n" + block + "\n";
    });
  }

  /* more formats — Tailwind, SCSS, flat JSON. Colors resolved to hex
     (like DTCG), so they drop into tools that don't grok color-mix(). */
  function hx(c) { return hslToHex(c.h, c.s, c.l); }
  function exportTailwind(d) {
    var c = d.colors;
    return "// keel design system → Tailwind. Merge into tailwind.config.js\n" +
      "module.exports = {\n  theme: {\n    extend: {\n      colors: {\n" +
      "        bg: '" + hx(c.bg) + "', surface: '" + hx(c.surface) + "', 'surface-2': '" + hx(c.surface2) + "',\n" +
      "        border: '" + hx(c.border) + "', 'border-strong': '" + hx(c.borderStrong) + "',\n" +
      "        text: { DEFAULT: '" + hx(c.text) + "', soft: '" + hx(c.textSoft) + "', faint: '" + hx(c.textFaint) + "' },\n" +
      "        primary: { DEFAULT: '" + hx(c.accent) + "', strong: '" + hx(c.accentStrong) + "', soft: '" + hx(c.accentSoft) + "', on: '" + hx(c.onAccent) + "' },\n" +
      "        secondary: { DEFAULT: '" + hx(c.accent2) + "', strong: '" + hx(c.accent2Strong) + "', soft: '" + hx(c.accent2Soft) + "', on: '" + hx(c.onAccent2) + "' },\n" +
      "        accent: { DEFAULT: '" + hx(c.accent3) + "', strong: '" + hx(c.accent3Strong) + "', soft: '" + hx(c.accent3Soft) + "', on: '" + hx(c.onAccent3) + "' },\n" +
      "        ok: '" + hx(c.ok) + "', warn: '" + hx(c.warn) + "', danger: '" + hx(c.danger) + "',\n" +
      "      },\n      borderRadius: { DEFAULT: '" + d.radius + "px' },\n" +
      "      fontSize: {\n" +
      "        xs: '" + d.type["--k-text-xs"] + "', sm: '" + d.type["--k-text-s"] + "', base: '" + d.type["--k-text-m"] + "',\n" +
      "        lg: '" + d.type["--k-text-l"] + "', xl: '" + d.type["--k-text-xl"] + "', '2xl': '" + d.type["--k-text-2xl"] + "', '3xl': '" + d.type["--k-text-3xl"] + "',\n" +
      "      },\n    },\n  },\n};\n";
  }
  function exportScss(d) {
    var c = d.colors;
    return "// keel design system → SCSS variables\n" +
      "$k-bg: " + hx(c.bg) + ";\n$k-surface: " + hx(c.surface) + ";\n$k-surface-2: " + hx(c.surface2) + ";\n" +
      "$k-border: " + hx(c.border) + ";\n$k-border-strong: " + hx(c.borderStrong) + ";\n" +
      "$k-text: " + hx(c.text) + ";\n$k-text-soft: " + hx(c.textSoft) + ";\n$k-text-faint: " + hx(c.textFaint) + ";\n" +
      "$k-accent: " + hx(c.accent) + ";\n$k-accent-strong: " + hx(c.accentStrong) + ";\n$k-accent-soft: " + hx(c.accentSoft) + ";\n$k-on-accent: " + hx(c.onAccent) + ";\n" +
      "$k-accent-2: " + hx(c.accent2) + ";\n$k-accent-2-strong: " + hx(c.accent2Strong) + ";\n$k-on-accent-2: " + hx(c.onAccent2) + ";\n" +
      "$k-accent-3: " + hx(c.accent3) + ";\n$k-accent-3-strong: " + hx(c.accent3Strong) + ";\n$k-on-accent-3: " + hx(c.onAccent3) + ";\n" +
      "$k-ok: " + hx(c.ok) + ";\n$k-warn: " + hx(c.warn) + ";\n$k-danger: " + hx(c.danger) + ";\n$k-radius: " + d.radius + "px;\n" +
      "$k-text-xs: " + d.type["--k-text-xs"] + ";\n$k-text-s: " + d.type["--k-text-s"] + ";\n$k-text-m: " + d.type["--k-text-m"] + ";\n" +
      "$k-text-l: " + d.type["--k-text-l"] + ";\n$k-text-xl: " + d.type["--k-text-xl"] + ";\n$k-text-2xl: " + d.type["--k-text-2xl"] + ";\n$k-text-3xl: " + d.type["--k-text-3xl"] + ";\n";
  }
  function exportJson(d, map) {
    var c = d.colors;
    return JSON.stringify({
      color: {
        bg: hx(c.bg), surface: hx(c.surface), "surface-2": hx(c.surface2),
        border: hx(c.border), "border-strong": hx(c.borderStrong),
        text: hx(c.text), "text-soft": hx(c.textSoft), "text-faint": hx(c.textFaint),
        primary: hx(c.accent), "primary-strong": hx(c.accentStrong), "primary-soft": hx(c.accentSoft), "on-primary": hx(c.onAccent),
        secondary: hx(c.accent2), "secondary-strong": hx(c.accent2Strong), "secondary-soft": hx(c.accent2Soft), "on-secondary": hx(c.onAccent2),
        accent: hx(c.accent3), "accent-strong": hx(c.accent3Strong), "accent-soft": hx(c.accent3Soft), "on-accent": hx(c.onAccent3),
        ok: hx(c.ok), warn: hx(c.warn), danger: hx(c.danger)
      },
      radius: d.radius + "px", density: Number(d.density),
      text: { xs: d.type["--k-text-xs"], s: d.type["--k-text-s"], m: d.type["--k-text-m"],
              l: d.type["--k-text-l"], xl: d.type["--k-text-xl"], "2xl": d.type["--k-text-2xl"], "3xl": d.type["--k-text-3xl"] },
      font: { display: map["--k-font-display"], body: map["--k-font-body"], mono: map["--k-font-mono"] }
    }, null, 2);
  }

  /* download keel.css with every class renamed to the chosen prefix
     (.k-btn -> .yours-btn). Tokens (--k-*), keyframes (k-spin) and
     data-* attributes are left alone — only class selectors change, so
     the renamed components still read the same tokens. Prefix "k" is the
     stock file. */
  function downloadPrefixedCss() {
    var p = cleanPrefix(state.prefix);
    var base = location.pathname.replace(/\\/g, "/").includes("/docs/") ? "../" : "";
    return fetch(base + "css/keel.css").then(function (r) { return r.text(); }).then(function (css) {
      var out = (p === "k") ? css
        : "/* keel — classes prefixed \"" + p + "-\" (tokens remain --k-*) */\n" +
          css.replace(/\.k-/g, "." + p + "-");
      var url = URL.createObjectURL(new Blob([out], { type: "text/css" }));
      var a = document.createElement("a");
      a.href = url; a.download = "keel.css";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
    });
  }

  var root = document.documentElement;
  function apply() {
    var d = derive(), map = tokenMap(d);
    Object.keys(map).forEach(function (k) { root.style.setProperty(k, map[k]); });
    root.style.setProperty("color-scheme", d.dark ? "dark" : "light");

    /* tool-page readouts (absent on other pages) */
    var sw = document.getElementById("swatches");
    if (sw) {
      sw.innerHTML = "";
      [["--k-accent", "Primary"], ["--k-accent-2", "Secondary"],
       ["--k-accent-3", "Accent"], ["--k-bg", "Bg"],
       ["--k-surface-2", "Surface"], ["--k-text", "Text"],
       ["--k-ok", "Ok"], ["--k-warn", "Warn"], ["--k-danger", "Danger"]]
        .forEach(function (pair) {
          var d = document.createElement("span");
          d.className = "sw";
          var i = document.createElement("i");
          i.style.background = map[pair[0]];
          i.title = pair[0] + ": " + map[pair[0]];
          var lbl = document.createElement("small");
          lbl.textContent = pair[1];
          d.appendChild(i); d.appendChild(lbl);
          sw.appendChild(d);
        });
    }
    var ro = document.getElementById("ratio-readout");
    if (ro) {
      var w = d.warn || {}, below = [];
      if (w.text) below.push("text/bg");
      if (w.accent) below.push("primary");
      if (w.accent2) below.push("secondary");
      if (w.accent3) below.push("accent");
      ro.textContent =
        "contrast — text " + d.ratios.text.toFixed(1) + ":1 · primary " +
        d.ratios.accent.toFixed(1) + ":1 · secondary " +
        d.ratios.accent2.toFixed(1) + ":1 · accent " +
        d.ratios.accent3.toFixed(1) + ":1 — " +
        (below.length ? "⚠ below AA: " + below.join(", ") + " — kept as you picked them"
                      : "all ✓ AA");
    }
    var out = document.getElementById("css-out");
    if (out) out.textContent = exportCss(map);
    var cv = document.getElementById("seed-color-value");
    if (cv) cv.textContent = state.color;
  }

  // coalesce high-frequency slider drags into one apply() per animation
  // frame, so the expensive recompute+restyle above doesn't run per tick
  function rafThrottle(fn) {
    var ticking = false;
    return function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        fn();
      });
    };
  }
  var scheduleApply = rafThrottle(apply);

  /* ---- custom color picker (design.html only) ----
     The native color input's popup is the OS widget and can't be
     styled; this replaces it: presets + H/S/L sliders with live
     gradient tracks + hex field + EyeDropper where supported. */
  var PRESETS = ["#4a5df0", "#2b6cd7", "#0e7490", "#159f8c", "#2e8a5c",
                 "#65772a", "#d99a06", "#e0763a", "#d64229", "#d81b4f",
                 "#b03cb4", "#7a4fbf", "#55606e", "#23366e"];

  /* ---- color format read/write (hex, rgb, hsl, hsv, cmyk) ---- */
  function hexToRgbInts(hex) {
    return [1, 3, 5].map(function (i) { return parseInt(hex.slice(i, i + 2), 16); });
  }
  function formatColor(hex, fmt) {
    var rgb = hexToRgbInts(hex);
    if (fmt === "rgb") return rgb.join(", ");
    var c = hexToHsl(hex);
    if (fmt === "hsl") return Math.round(c.h) + ", " + Math.round(c.s) + "%, " + Math.round(c.l) + "%";
    if (fmt === "hsv") {
      var v = hslToHsv(c.h, c.s, c.l);
      return Math.round(v.h) + ", " + Math.round(v.s) + "%, " + Math.round(v.v) + "%";
    }
    if (fmt === "cmyk") {
      var r = rgb[0] / 255, g = rgb[1] / 255, b = rgb[2] / 255;
      var k = 1 - Math.max(r, g, b);
      var d = 1 - k;
      var cy = d ? (1 - r - k) / d : 0, m = d ? (1 - g - k) / d : 0, y = d ? (1 - b - k) / d : 0;
      return [cy, m, y, k].map(function (n) { return Math.round(n * 100) + "%"; }).join(", ");
    }
    return hex;
  }
  function parseColor(str, fmt) {
    str = String(str).trim();
    if (fmt === "hex") {
      if (/^[0-9a-f]{6}$/i.test(str)) str = "#" + str;
      if (/^#[0-9a-f]{3}$/i.test(str)) {
        str = "#" + str.slice(1).split("").map(function (ch) { return ch + ch; }).join("");
      }
      return /^#[0-9a-f]{6}$/i.test(str) ? str.toLowerCase() : null;
    }
    var n = (str.match(/-?[\d.]+/g) || []).map(Number);
    function inRange(arr, maxes) {
      return arr.every(function (v, i) { return isFinite(v) && v >= 0 && v <= maxes[i]; });
    }
    if (fmt === "rgb" && n.length >= 3 && inRange(n.slice(0, 3), [255, 255, 255])) {
      return "#" + n.slice(0, 3).map(function (v) {
        return ("0" + Math.round(v).toString(16)).slice(-2);
      }).join("");
    }
    if (fmt === "hsl" && n.length >= 3 && inRange(n.slice(1, 3), [100, 100])) {
      return hslToHex(((n[0] % 360) + 360) % 360, n[1], n[2]);
    }
    if (fmt === "hsv" && n.length >= 3 && inRange(n.slice(1, 3), [100, 100])) {
      var c = hsvToHsl(((n[0] % 360) + 360) % 360, n[1], n[2]);
      return hslToHex(c.h, c.s, c.l);
    }
    if (fmt === "cmyk" && n.length >= 4 && inRange(n.slice(0, 4), [100, 100, 100, 100])) {
      var k = n[3] / 100;
      var rgb2 = [n[0], n[1], n[2]].map(function (v) {
        return Math.round(255 * (1 - v / 100) * (1 - k));
      });
      return "#" + rgb2.map(function (v) {
        return ("0" + v.toString(16)).slice(-2);
      }).join("");
    }
    return null;
  }

  function shuffleState() {
    var hue = Math.floor(Math.random() * 360);
    var sat = 45 + Math.floor(Math.random() * 50);
    var lig = 42 + Math.floor(Math.random() * 18);
    state.color = hslToHex(hue, sat, lig);
    var harmonies = ["complement", "analog", "triad"];
    state.harmony = harmonies[Math.floor(Math.random() * harmonies.length)];
    /* accent (tertiary) — a third hue away from the primary, so it reads
       as its own color; foundation returns to mood-derived */
    state.color3 = hslToHex((hue + 150 + Math.floor(Math.random() * 90)) % 360, sat, lig + 2);
    state.text = null; state.bg = null;
    var moods = Object.keys(MOODS), fonts = Object.keys(FONTS);
    state.mood = moods[Math.floor(Math.random() * moods.length)];
    state.fonts = fonts[Math.floor(Math.random() * fonts.length)];
    state.contrast = 25 + Math.floor(Math.random() * 55);
    state.corners = Math.floor(Math.random() * 100);
    state.density = 30 + Math.floor(Math.random() * 45);
    var ratios = Object.keys(RATIOS);
    state.scale = ratios[Math.floor(Math.random() * ratios.length)];
    state.baseSize = [16, 17, 18][Math.floor(Math.random() * 3)];
  }

  /* shared saved/recent color lists (localStorage) */
  function readList(k) { try { return JSON.parse(localStorage.getItem(k)) || []; } catch (e) { return []; } }
  function writeList(k, arr) { try { localStorage.setItem(k, JSON.stringify(arr)); } catch (e) {} }
  var recentTimer = null, swatchRenderers = [];
  function recordRecent(hex) {
    clearTimeout(recentTimer);
    recentTimer = setTimeout(function () {
      var list = readList("keel-recent-colors").filter(function (c) { return c !== hex; });
      list.unshift(hex);
      writeList("keel-recent-colors", list.slice(0, 8));
      swatchRenderers.forEach(function (fn) { fn(); });
    }, 900);
  }

  function wirePicker(pre, getHex, setHex) {
    var h = document.getElementById(pre + "-h");
    if (!h) return null;
    var s = document.getElementById(pre + "-s"),
        l = document.getElementById(pre + "-l"),
        hex = document.getElementById(pre + "-hex"),
        fmt = document.getElementById(pre + "-fmt"),
        chip = document.getElementById(pre + "-chip"),
        eye = document.getElementById(pre + "-eye"),
        sw = document.getElementById(pre + "-swatches"),
        area = document.getElementById(pre + "-area"),
        cursor = document.getElementById(pre + "-cursor"),
        recentHost = document.getElementById(pre + "-recent"),
        savedHost = document.getElementById(pre + "-saved"),
        saveBtn = document.getElementById(pre + "-save");

    function swatchButton(hexVal, removable, storeKey) {
      var b = document.createElement("button");
      b.type = "button"; b.style.background = hexVal;
      b.title = hexVal + (removable ? " — right-click to remove" : "");
      b.setAttribute("aria-label", "Use " + hexVal);
      b.addEventListener("click", function () { setHex(hexVal); sync(); });
      if (removable) b.addEventListener("contextmenu", function (e) {
        e.preventDefault();
        writeList(storeKey, readList(storeKey).filter(function (c) { return c !== hexVal; }));
        swatchRenderers.forEach(function (fn) { fn(); });
      });
      return b;
    }
    function renderStored() {
      if (recentHost) {
        recentHost.innerHTML = "";
        var rec = readList("keel-recent-colors");
        if (!rec.length) recentHost.innerHTML = '<small class="k-text-faint">Colors you use appear here.</small>';
        rec.forEach(function (c) { recentHost.appendChild(swatchButton(c, false)); });
      }
      if (savedHost) {
        savedHost.innerHTML = "";
        var sav = readList("keel-saved-colors");
        if (!sav.length) savedHost.innerHTML = '<small class="k-text-faint">Nothing saved yet.</small>';
        sav.forEach(function (c) { savedHost.appendChild(swatchButton(c, true, "keel-saved-colors")); });
      }
    }
    if (recentHost || savedHost) { swatchRenderers.push(renderStored); renderStored(); }
    if (saveBtn) saveBtn.addEventListener("click", function () {
      var list = readList("keel-saved-colors").filter(function (c) { return c !== getHex(); });
      list.unshift(getHex());
      writeList("keel-saved-colors", list.slice(0, 16));
      swatchRenderers.forEach(function (fn) { fn(); });
    });

    if (sw) PRESETS.forEach(function (p) {
      sw.appendChild(swatchButton(p, false));
    });

    /* the picker popover anchors under its swatch */
    var pop = document.getElementById(pre + "-pop");
    if (pop && chip) {
      pop.addEventListener("toggle", function (e) {
        if (e.newState !== "open") return;
        var r = chip.getBoundingClientRect();
        var left = Math.max(12, Math.min(r.left, innerWidth - pop.offsetWidth - 12));
        var top = r.bottom + 8;
        if (top + pop.offsetHeight > innerHeight - 12) {
          top = Math.max(12, innerHeight - pop.offsetHeight - 12);
        }
        pop.style.left = left + "px";
        pop.style.top = top + "px";
      });
    }

    /* the 2D shade area */
    if (area) {
      function areaPick(e) {
        var r = area.getBoundingClientRect();
        var x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
        var y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
        var c = hsvToHsl(+h.value, x * 100, (1 - y) * 100);
        setHex(hslToHex(c.h, Math.min(100, c.s), Math.max(3, Math.min(97, c.l))));
        sync();
      }
      area.addEventListener("pointerdown", function (e) {
        area.setPointerCapture(e.pointerId); areaPick(e);
      });
      area.addEventListener("pointermove", function (e) { if (e.buttons) areaPick(e); });
      area.addEventListener("keydown", function (e) {
        var c = hexToHsl(getHex()), hv = hslToHsv(c.h, c.s, c.l), step = 3;
        if (e.key === "ArrowLeft") hv.s -= step;
        else if (e.key === "ArrowRight") hv.s += step;
        else if (e.key === "ArrowUp") hv.v += step;
        else if (e.key === "ArrowDown") hv.v -= step;
        else return;
        e.preventDefault();
        var n = hsvToHsl(hv.h, Math.min(100, Math.max(0, hv.s)), Math.min(100, Math.max(0, hv.v)));
        setHex(hslToHex(n.h, n.s, Math.max(3, Math.min(97, n.l))));
        sync();
      });
    }

    function fromSliders() { setHex(hslToHex(+h.value, +s.value, +l.value)); sync(); }
    [h, s, l].forEach(function (el) { el.addEventListener("input", fromSliders); });

    function curFmt() { return fmt ? fmt.value : "hex"; }
    hex.addEventListener("change", function () {
      var parsed = parseColor(hex.value, curFmt());
      if (parsed) setHex(parsed);
      sync();
    });
    if (fmt) fmt.addEventListener("change", function () {
      hex.value = formatColor(getHex(), curFmt());
    });

    if (window.EyeDropper && eye) {
      eye.hidden = false;
      eye.addEventListener("click", function () {
        new window.EyeDropper().open().then(function (res) {
          setHex(res.sRGBHex.toLowerCase()); sync();
        }, function () { /* user cancelled */ });
      });
    }

    function sync() {
      var v = getHex(), c = hexToHsl(v);
      var hh = Math.round(c.h), ss = Math.round(c.s), ll = Math.round(c.l);
      h.value = hh; s.value = ss; l.value = ll;
      chip.style.background = v;
      if (document.activeElement !== hex) hex.value = formatColor(v, curFmt());
      if (area && cursor) {
        var hv = hslToHsv(c.h, c.s, c.l);
        area.style.setProperty("--k-picker-hue", "hsl(" + hh + " 100% 50%)");
        cursor.style.left = hv.s + "%";
        cursor.style.top = (100 - hv.v) + "%";
        cursor.style.background = v;
      }
      h.style.setProperty("--k-range-track", "linear-gradient(90deg, hsl(0 85% 55%), hsl(60 85% 50%), hsl(120 70% 45%), hsl(180 80% 45%), hsl(240 85% 60%), hsl(300 80% 55%), hsl(360 85% 55%))");
      s.style.setProperty("--k-range-track", "linear-gradient(90deg, hsl(" + hh + " 0% " + ll + "%), hsl(" + hh + " 100% " + ll + "%))");
      l.style.setProperty("--k-range-track", "linear-gradient(90deg, hsl(" + hh + " " + ss + "% 5%), hsl(" + hh + " " + ss + "% 50%), hsl(" + hh + " " + ss + "% 95%))");
    }
    sync();
    return { sync: sync };
  }

  /* ---- tool wiring (design.html only) ---- */
  function wireTool() {
    function pressGroup(groupId, attr, onPick) {
      var group = document.getElementById(groupId);
      group.addEventListener("click", function (e) {
        var btn = e.target.closest("button[data-" + attr + "]");
        if (!btn) return;
        group.querySelectorAll("button").forEach(function (b) {
          b.setAttribute("aria-pressed", b === btn ? "true" : "false");
        });
        onPick(btn.getAttribute("data-" + attr));
        save(); apply();
      });
    }
    function syncGroup(groupId, attr, value) {
      document.getElementById(groupId).querySelectorAll("button").forEach(function (b) {
        b.setAttribute("aria-pressed", b.getAttribute("data-" + attr) === value ? "true" : "false");
      });
    }
    function syncControls() {
      if (pick1) pick1.sync();
      if (pick2) pick2.sync();
      if (pick3) pick3.sync();
      if (pickText) pickText.sync();
      if (pickBg) pickBg.sync();
      document.getElementById("s-contrast").value = state.contrast;
      document.getElementById("s-corners").value = state.corners;
      document.getElementById("s-density").value = state.density;
      syncGroup("mood-group", "mood", state.mood);
      syncGroup("font-group", "fonts", state.fonts);
      syncGroup("harmony-group", "harmony", state.harmony);
      var sBaseEl = document.getElementById("s-base");
      if (sBaseEl) sBaseEl.value = state.baseSize;
      var baseVal = document.getElementById("base-val");
      if (baseVal) baseVal.textContent = state.baseSize + "px";
      var pfx = document.getElementById("prefix-input");
      if (pfx && document.activeElement !== pfx) pfx.value = state.prefix;
      var pfxPrev = document.getElementById("prefix-preview");
      if (pfxPrev) pfxPrev.textContent = "." + cleanPrefix(state.prefix) + "-btn";
      syncGroup("scale-group", "scale", state.scale);
      var effD = (state.dark == null) ? MOODS[state.mood].dark : !!state.dark;
      document.querySelectorAll("#theme-group [data-dark]").forEach(function (b) {
        b.setAttribute("aria-pressed", String((b.dataset.dark === "dark") === effD));
      });
      syncColor2Row();
      syncFoundationRow();
    }

    function syncColor2Row() {
      var row = document.getElementById("color2-row");
      if (row) row.hidden = state.harmony !== "custom";
    }

    /* text & background are optional: "auto" leaves them mood-derived,
       "custom" reveals two pickers seeded from the current values */
    function foundationIsCustom() { return state.bg !== null || state.text !== null; }
    function syncFoundationRow() {
      var row = document.getElementById("foundation-row");
      if (row) row.hidden = !foundationIsCustom();
      syncGroup("foundation-group", "found", foundationIsCustom() ? "custom" : "auto");
    }

    pressGroup("mood-group", "mood", function (v) { state.mood = v; state.dark = null; });
    pressGroup("font-group", "fonts", function (v) { state.fonts = v; });
    var sBase = document.getElementById("s-base");
    if (sBase) sBase.addEventListener("input", function (e) {
      state.baseSize = Number(e.target.value);
      var bv = document.getElementById("base-val");
      if (bv) bv.textContent = state.baseSize + "px";
      save(); scheduleApply();
    });
    pressGroup("scale-group", "scale", function (v) { state.scale = v; });

    var pfxInput = document.getElementById("prefix-input");
    if (pfxInput) {
      pfxInput.addEventListener("input", function (e) {
        state.prefix = cleanPrefix(e.target.value);
        var pv = document.getElementById("prefix-preview");
        if (pv) pv.textContent = "." + state.prefix + "-btn";
        save();
      });
      pfxInput.addEventListener("change", function (e) { e.target.value = state.prefix; });
    }
    var dlPrefixed = document.getElementById("download-prefixed");
    if (dlPrefixed) dlPrefixed.addEventListener("click", function () {
      var lbl = dlPrefixed.textContent;
      Promise.resolve(downloadPrefixedCss()).then(function () {
        dlPrefixed.textContent = "Downloaded ✓";
        setTimeout(function () { dlPrefixed.textContent = lbl; }, 1800);
      });
    });
    pressGroup("harmony-group", "harmony", function (v) { state.harmony = v; syncColor2Row(); });
    pressGroup("foundation-group", "found", function (v) {
      if (v === "custom") {
        var col = derive().colors;
        if (state.text == null) state.text = hx(col.text);
        if (state.bg == null) state.bg = hx(col.bg);
      } else { state.text = null; state.bg = null; }
      syncFoundationRow();
      if (pickText) pickText.sync();
      if (pickBg) pickBg.sync();
    });

    document.querySelectorAll("#theme-group [data-dark]").forEach(function (b) {
      b.addEventListener("click", function () {
        state.dark = (b.dataset.dark === "dark"); save(); apply(); syncControls();
      });
    });

    var pick1 = wirePicker("p1",
      function () { return state.color; },
      function (v) { state.color = v; save(); scheduleApply(); recordRecent(v); });
    var pick2 = wirePicker("p2",
      function () { return state.color2; },
      function (v) { state.color2 = v; save(); scheduleApply(); recordRecent(v); });
    var pick3 = wirePicker("p3",
      function () { return state.color3; },
      function (v) { state.color3 = v; save(); scheduleApply(); recordRecent(v); });
    /* optional foundation — text & background. getHex falls back to the
       current derived value so the picker opens on a sensible color. */
    var pickText = wirePicker("pt",
      function () { return state.text || hx(derive().colors.text); },
      function (v) { state.text = v; save(); scheduleApply(); recordRecent(v); });
    var pickBg = wirePicker("pb",
      function () { return state.bg || hx(derive().colors.bg); },
      function (v) { state.bg = v; save(); scheduleApply(); recordRecent(v); });
    [["s-contrast", "contrast"], ["s-corners", "corners"], ["s-density", "density"]]
      .forEach(function (pair) {
        document.getElementById(pair[0]).addEventListener("input", function (e) {
          state[pair[1]] = Number(e.target.value); save(); scheduleApply();
        });
      });

    document.getElementById("shuffle").addEventListener("click", function () {
      shuffleState();
      save(); syncControls(); apply();
    });

    document.getElementById("reset").addEventListener("click", function () {
      state = JSON.parse(JSON.stringify(DEFAULTS));
      clearSaved(); syncControls(); apply();
    });

    function wireCopy(id, getText, idleLabel) {
      var btn = document.getElementById(id);
      if (!btn) return;
      btn.addEventListener("click", function () {
        Promise.resolve(getText()).then(function (text) {
        function done(ok) {
          btn.textContent = ok ? "Copied ✓" : "Copy failed";
          setTimeout(function () { btn.textContent = idleLabel; }, 1800);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
        } else {
          var ta = document.createElement("textarea");
          ta.value = text; document.body.appendChild(ta); ta.select();
          try { done(document.execCommand("copy")); } catch (e) { done(false); }
          document.body.removeChild(ta);
        }
        });
      });
    }
    wireCopy("copy-tokens", function () {
      return document.getElementById("css-out").textContent;
    }, "Copy tokens CSS");
    wireCopy("copy-full", function () {
      var d = derive();
      return exportFullCss(tokenMap(d));
    }, "Copy full set");
    wireCopy("copy-dtcg", function () {
      var d = derive();
      return exportDtcg(d, tokenMap(d));
    }, "Copy JSON (DTCG)");
    wireCopy("copy-tw", function () { return exportTailwind(derive()); }, "Tailwind config");
    wireCopy("copy-scss", function () { return exportScss(derive()); }, "SCSS variables");
    wireCopy("copy-json", function () { var d = derive(); return exportJson(d, tokenMap(d)); }, "Flat JSON");

    syncControls();
  }

  /* ---- floating design-system settings (every page but the tool's) ---- */
  function buildFloatingTool() {
    var fab = document.createElement("button");
    fab.type = "button"; fab.className = "k-fab";
    fab.setAttribute("popovertarget", "kf-panel");
    fab.setAttribute("aria-label", "Design system settings");
    fab.innerHTML = '<span class="k-icon k-icon--palette" aria-hidden="true" style="font-size:1.5rem;color:var(--k-on-accent)"></span>';
    var panel = document.createElement("div");
    panel.className = "k-picker kf-panel"; panel.id = "kf-panel";
    panel.setAttribute("popover", "");
    var SITEROOT = location.pathname.replace(/\\/g, "/").includes("/docs/") ? "../" : "";
    function colorPop(pre, label) {
      return '<div class="k-picker" id="' + pre + '-pop" popover>' +
        '<div class="k-picker__area" id="' + pre + '-area" tabindex="0" role="application" ' +
        'aria-label="' + label + ' — drag to pick; arrow keys adjust">' +
        '<span class="k-picker__cursor" id="' + pre + '-cursor"></span></div>' +
        '<input type="range" id="' + pre + '-h" min="0" max="360" step="1" hidden>' +
        '<input type="range" id="' + pre + '-s" min="0" max="100" step="1" hidden>' +
        '<input type="range" id="' + pre + '-l" min="5" max="95" step="1" hidden>' +
        '<div class="k-picker__field">' +
        '<input id="' + pre + '-hex" type="text" spellcheck="false" aria-label="' + label + ' value"></div>' +
        '<div class="k-picker__swatches" id="' + pre + '-swatches" role="group" aria-label="Preset colors"></div>' +
        '</div>';
    }
    function colorRow(pre, label, expander) {
      return '<div class="kf-color-row">' +
        '<button type="button" class="k-swatch" id="' + pre + '-chip" popovertarget="' + pre + '-pop" aria-label="' + label + ' — open the color picker"></button>' +
        '<span class="k-picker__label" style="flex:1">' + label + '</span>' +
        (expander ? '<button type="button" class="kf-more-toggle" id="kf-more-toggle" ' +
          'aria-expanded="false" aria-controls="kf-more" aria-label="Show other colors">' +
          '<span class="k-icon k-icon--chevron-right" aria-hidden="true"></span></button>' : '') +
        '</div>' + colorPop(pre, label);
    }
    panel.innerHTML =
      '<div class="k-picker__row">' +
      '<strong>Design system</strong>' +
      '<a class="k-btn k-btn--ghost k-btn--icon k-btn--small" href="' + SITEROOT + 'design.html" title="Open the full tool" aria-label="Open the full design tool"><span class="k-icon k-icon--external" aria-hidden="true"></span></a>' +
      '</div>' +
      '<div class="k-cluster" style="gap:var(--k-space-1)">' +
      '<button class="k-btn k-btn--ghost k-btn--small" type="button" id="kf-shuffle">Shuffle</button>' +
      '<button class="k-btn k-btn--ghost k-btn--icon k-btn--small" type="button" id="kf-reset" title="Reset" aria-label="Reset to defaults"><span class="k-icon k-icon--rotate-ccw" aria-hidden="true"></span></button>' +
      '</div>' +
      colorRow("kf", "Primary", true) +
      '<div class="kf-more" id="kf-more" hidden>' +
      '<div class="kf-more-grid">' +
      colorRow("kf2", "Secondary") + colorRow("kf3", "Accent") +
      colorRow("kft", "Text") + colorRow("kfb", "Background") +
      '</div></div>' +
      '<div class="k-picker__label">Mood</div><div class="kf-grid" id="kf-mood"></div>' +
      '<div class="k-picker__label">Preview</div>' +
      '<div class="k-segmented" id="kf-theme" role="group" aria-label="Preview in light or dark">' +
      '<button type="button" data-dark="light" aria-pressed="false"><span class="k-icon k-icon--light" aria-hidden="true"></span> Light</button>' +
      '<button type="button" data-dark="dark" aria-pressed="false"><span class="k-icon k-icon--dark" aria-hidden="true"></span> Dark</button></div>' +
      '<div class="k-picker__label">Fonts</div><div class="kf-grid" id="kf-fonts"></div>' +
      '<div class="kf-slider"><label for="kf-contrast" style="margin:0">Contrast</label><input type="range" id="kf-contrast" min="0" max="100"></div>' +
      '<div class="kf-slider"><label for="kf-corners" style="margin:0">Corners</label><input type="range" id="kf-corners" min="0" max="100"></div>' +
      '<div class="kf-slider"><label for="kf-density" style="margin:0">Density</label><input type="range" id="kf-density" min="0" max="100"></div>' +
      '<div class="k-picker__label">Copy your system</div>' +
      '<div class="k-cluster">' +
      '<button class="k-btn k-btn--ghost k-btn--small" type="button" id="kf-copy-tokens">Tokens CSS</button>' +
      '<button class="k-btn k-btn--ghost k-btn--small" type="button" id="kf-copy-full">Full set</button>' +
      '<button class="k-btn k-btn--ghost k-btn--small" type="button" id="kf-copy-dtcg">JSON</button></div>';
    document.body.appendChild(fab);
    document.body.appendChild(panel);

    /* copy exports — same generators the full tool uses */
    (function () {
      function kfCopy(id, getText, label) {
        var b = document.getElementById(id); if (!b) return;
        b.addEventListener("click", function () {
          Promise.resolve(getText()).then(function (text) {
            function done(ok) { b.textContent = ok ? "Copied ✓" : "Failed"; setTimeout(function () { b.textContent = label; }, 1600); }
            if (navigator.clipboard && navigator.clipboard.writeText)
              navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
            else {
              var ta = document.createElement("textarea");
              ta.value = text; document.body.appendChild(ta); ta.select();
              try { done(document.execCommand("copy")); } catch (e) { done(false); }
              document.body.removeChild(ta);
            }
          });
        });
      }
      kfCopy("kf-copy-tokens", function () { return exportCss(tokenMap(derive())); }, "Tokens CSS");
      kfCopy("kf-copy-full", function () { return exportFullCss(tokenMap(derive())); }, "Full set");
      kfCopy("kf-copy-dtcg", function () { var d = derive(); return exportDtcg(d, tokenMap(d)); }, "JSON");
    })();

    var pick = wirePicker("kf",
      function () { return state.color; },
      function (v) { state.color = v; save(); scheduleApply(); recordRecent(v); });
    /* optional overrides — picking any of these takes it out of
       mood/harmony derivation and uses the exact color chosen */
    var pick2 = wirePicker("kf2",
      function () { return state.harmony === "custom" ? state.color2 : hx(derive().colors.accent2); },
      function (v) { state.color2 = v; state.harmony = "custom"; save(); scheduleApply(); recordRecent(v); });
    var pick3 = wirePicker("kf3",
      function () { return state.color3; },
      function (v) { state.color3 = v; save(); scheduleApply(); recordRecent(v); });
    var pickText = wirePicker("kft",
      function () { return state.text || hx(derive().colors.text); },
      function (v) { state.text = v; save(); scheduleApply(); recordRecent(v); });
    var pickBg = wirePicker("kfb",
      function () { return state.bg || hx(derive().colors.bg); },
      function (v) { state.bg = v; save(); scheduleApply(); recordRecent(v); });

    function grid(hostId, obj, key) {
      var host = document.getElementById(hostId);
      Object.keys(obj).forEach(function (k) {
        var b = document.createElement("button");
        b.type = "button"; b.dataset.value = k;
        b.textContent = k.charAt(0).toUpperCase() + k.slice(1);
        b.addEventListener("click", function () {
          state[key] = k; if (key === "mood") state.dark = null; save(); apply(); syncAll();
        });
        host.appendChild(b);
      });
    }
    grid("kf-mood", MOODS, "mood");
    grid("kf-fonts", FONTS, "fonts");

    document.getElementById("kf-theme").querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () {
        state.dark = (b.dataset.dark === "dark"); save(); apply(); syncAll();
      });
    });

    [["kf-contrast", "contrast"], ["kf-corners", "corners"], ["kf-density", "density"]]
      .forEach(function (p) {
        document.getElementById(p[0]).addEventListener("input", function (e) {
          state[p[1]] = Number(e.target.value); save(); scheduleApply();
        });
      });

    document.getElementById("kf-shuffle").addEventListener("click", function () {
      shuffleState(); save(); apply(); syncAll();
    });
    document.getElementById("kf-reset").addEventListener("click", function () {
      state = JSON.parse(JSON.stringify(DEFAULTS));
      clearSaved(); apply(); syncAll();
    });

    var moreToggle = document.getElementById("kf-more-toggle"), more = document.getElementById("kf-more");
    moreToggle.addEventListener("click", function () {
      var open = moreToggle.getAttribute("aria-expanded") === "true";
      moreToggle.setAttribute("aria-expanded", String(!open));
      more.hidden = open;
    });

    function syncAll() {
      if (pick) pick.sync();
      if (pick2) pick2.sync();
      if (pick3) pick3.sync();
      if (pickText) pickText.sync();
      if (pickBg) pickBg.sync();
      [["kf-mood", "mood"], ["kf-fonts", "fonts"]].forEach(function (p) {
        document.getElementById(p[0]).querySelectorAll("button").forEach(function (b) {
          b.setAttribute("aria-pressed", String(b.dataset.value === state[p[1]]));
        });
      });
      document.getElementById("kf-contrast").value = state.contrast;
      document.getElementById("kf-corners").value = state.corners;
      document.getElementById("kf-density").value = state.density;
      var eff = (state.dark == null) ? MOODS[state.mood].dark : !!state.dark;
      document.getElementById("kf-theme").querySelectorAll("button").forEach(function (b) {
        b.setAttribute("aria-pressed", String((b.dataset.dark === "dark") === eff));
      });
    }
    syncAll();
    panel.addEventListener("toggle", function (e) {
      if (e.newState === "open") syncAll();
    });
  }

  apply();
  if (document.getElementById("mood-group")) wireTool();
  else buildFloatingTool();

  /* expose the current design system to any page (the Icons page's kit
     download reads it; useful for AI tools too) */
  window.keelDesign = {
    tokensCss: function () { return exportCss(tokenMap(derive())); },
    fullCss: function () { return exportFullCss(tokenMap(derive())); },
    dtcg: function () { var d = derive(); return exportDtcg(d, tokenMap(d)); },
    tailwind: function () { return exportTailwind(derive()); },
    scss: function () { return exportScss(derive()); },
    json: function () { var d = derive(); return exportJson(d, tokenMap(d)); },
    state: function () { return JSON.parse(JSON.stringify(state)); }
  };

  /* live counts — fill [data-keel-count="icons|sections"] from the real
     data so copy never goes stale as the set grows. A fallback number in
     the element shows if the fetch fails (e.g. file://). */
  (function () {
    var els = document.querySelectorAll("[data-keel-count]");
    if (!els.length) return;
    var root = location.pathname.replace(/\\/g, "/").includes("/docs/") ? "../" : "";
    var kinds = {};
    els.forEach(function (e) { kinds[e.dataset.keelCount] = true; });
    var set = function (kind, n) {
      document.querySelectorAll('[data-keel-count="' + kind + '"]').forEach(function (e) { e.textContent = n; });
    };
    if (kinds.icons) fetch(root + "data/icons.json").then(function (r) { return r.json(); }).then(function (d) { set("icons", d.count); }).catch(function () {});
    if (kinds.sections) fetch(root + "data/patterns.json").then(function (r) { return r.json(); }).then(function (d) { set("sections", d.length); }).catch(function () {});
  })();

  /* copy button on every code block, site-wide. Skips blocks that
     already carry their own copy (.k-code, .k-editor, the sections
     lightbox). No per-block markup needed. */
  (function () {
    function legacyCopy(text) {
      var ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      return ok;
    }
    function copy(text, cb) {
      if (navigator.clipboard && navigator.clipboard.writeText)
        navigator.clipboard.writeText(text).then(
          function () { cb(true); },
          function () { cb(legacyCopy(text)); }
        );
      else cb(legacyCopy(text));
    }
    document.querySelectorAll("pre").forEach(function (pre) {
      var code = pre.querySelector("code");
      if (!code) return;
      if (pre.closest(".k-code, .k-editor, #sx-modal")) return;
      if (pre.classList.contains("play-css")) return; // design page has its own export buttons
      if (pre.querySelector(".code-copy")) return;
      pre.classList.add("has-copy");
      var btn = document.createElement("button");
      btn.type = "button"; btn.className = "code-copy"; btn.textContent = "Copy";
      btn.setAttribute("aria-label", "Copy code to clipboard");
      btn.addEventListener("click", function () {
        copy(code.textContent, function (ok) {
          btn.textContent = ok ? "Copied ✓" : "Failed";
          btn.classList.toggle("is-done", ok);
          setTimeout(function () { btn.textContent = "Copy"; btn.classList.remove("is-done"); }, 1400);
        });
      });
      pre.appendChild(btn);
    });
  })();
})();
