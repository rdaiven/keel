/* keel-system — keel's design-system derivation as a pure module.
   Zero dependencies; runs in Node ≥18 and browsers. This is the same
   math the design page runs (play.js is its browser twin — keep them
   in step; a divergence is a bug).

   import { deriveSystem } from "./keel-system.mjs";
   const sys = deriveSystem({ color: "#4a5df0", color2: "#d81b4f",
                              color3: "#15796f", mood: "calm",
                              fonts: "grotesk", harmony: "triad" });
   sys.tokens   // { "--k-bg": "hsl(…)", … }  (30 seed tokens)
   sys.css      // "@layer tokens { :root { … } }"
   sys.dtcg     // DTCG JSON string (colors as hex)
   sys.ratios   // { text, accent, accent2, accent3 } — all guardrail-passing
   sys.warn     // { accent, accent2, accent3 } — true where a picked color
                // couldn't clear AA and was left as-is rather than moved
*/

export const MOODS = {
  calm:  { dark: false, satMul: 0.72, bgTintSat: 10, warmShift: 0,  cornerBias: 0.15,  contrastBias: -4 },
  bold:  { dark: false, satMul: 1.0,  bgTintSat: 4,  warmShift: 0,  cornerBias: -0.3,  contrastBias: 10 },
  warm:  { dark: false, satMul: 0.85, bgTintSat: 18, warmShift: 34, cornerBias: 0.35,  contrastBias: -2 },
  slate: { dark: false, satMul: 0.5,  bgTintSat: 7,  warmShift: 0,  cornerBias: -0.1,  contrastBias: 3 },
  night: { dark: true,  satMul: 0.9,  bgTintSat: 12, warmShift: 0,  cornerBias: 0,     contrastBias: 4 },
  dusk:  { dark: true,  satMul: 0.8,  bgTintSat: 16, warmShift: 28, cornerBias: 0.2,   contrastBias: -2 },
  forest:  { dark: false, satMul: 0.78, bgTintSat: 14, warmShift: -10, cornerBias: 0.2,   contrastBias: -2 },
  rose:    { dark: false, satMul: 0.85, bgTintSat: 22, warmShift: 14,  cornerBias: 0.45,  contrastBias: -3 },
  mono:    { dark: false, satMul: 0.25, bgTintSat: 4,  warmShift: 0,   cornerBias: -0.2,  contrastBias: 6 },
  contrast:{ dark: false, satMul: 1.0,  bgTintSat: 2,  warmShift: 0,   cornerBias: -0.45, contrastBias: 24 },
};

export const FONTS = {
  grotesk:   { display: 'system-ui, "Segoe UI", sans-serif', body: 'system-ui, "Segoe UI", sans-serif', weight: 700, tracking: "-0.02em" },
  editorial: { display: 'Georgia, "Times New Roman", serif', body: 'system-ui, "Segoe UI", sans-serif', weight: 600, tracking: "-0.005em" },
  humanist:  { display: '"Segoe UI", Verdana, sans-serif',   body: '"Segoe UI", Verdana, sans-serif',   weight: 600, tracking: "0.005em" },
  console:   { display: 'ui-monospace, Consolas, monospace', body: 'system-ui, "Segoe UI", sans-serif', weight: 700, tracking: "-0.03em" },
  rounded:   { display: 'ui-rounded, "Segoe UI", system-ui, sans-serif', body: 'ui-rounded, "Segoe UI", system-ui, sans-serif', weight: 700, tracking: "0em" },
  print:     { display: 'system-ui, "Segoe UI", sans-serif', body: 'Georgia, "Times New Roman", serif', weight: 700, tracking: "-0.02em" },
  inter:     { display: '"Inter", system-ui, sans-serif', body: '"Inter", system-ui, sans-serif', weight: 700, tracking: "-0.02em", google: "family=Inter:wght@400;700" },
  manrope:   { display: '"Manrope", system-ui, sans-serif', body: '"Manrope", system-ui, sans-serif', weight: 700, tracking: "-0.01em", google: "family=Manrope:wght@400;700" },
  space:     { display: '"Space Grotesk", system-ui, sans-serif', body: '"Inter", system-ui, sans-serif', weight: 700, tracking: "-0.015em", google: "family=Space+Grotesk:wght@700&family=Inter:wght@400;700" },
  playfair:  { display: '"Playfair Display", Georgia, serif', body: '"Inter", system-ui, sans-serif', weight: 700, tracking: "0em", google: "family=Playfair+Display:wght@700&family=Inter:wght@400;700" },
  lora:      { display: '"Lora", Georgia, serif', body: '"Lora", Georgia, serif', weight: 700, tracking: "0em", google: "family=Lora:wght@400;700" },
  jetbrains: { display: '"JetBrains Mono", ui-monospace, monospace', body: '"Inter", system-ui, sans-serif', weight: 700, tracking: "-0.02em", google: "family=JetBrains+Mono:wght@400;700&family=Inter:wght@400;700" },
  classic:   { display: 'Georgia, "Times New Roman", serif', body: 'Georgia, "Times New Roman", serif', weight: 700, tracking: "0em" },
  terminal:  { display: 'ui-monospace, Consolas, "Cascadia Mono", monospace', body: 'ui-monospace, Consolas, "Cascadia Mono", monospace', weight: 700, tracking: "-0.02em" },
};

export const HARMONIES = { complement: 180, analog: 40, triad: 120, custom: null };

/* ---- color math ---- */
export function hexToHsl(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255,
        g = parseInt(hex.slice(3, 5), 16) / 255,
        b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0, s = 0; const l = (max + min) / 2;
  if (d) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === r) h = 60 * (((g - b) / d) % 6);
    else if (max === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
  }
  return { h: (h + 360) % 360, s: s * 100, l: l * 100 };
}
export function hslToRgb(h, s, l) {
  s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s,
        x = c * (1 - Math.abs(((h / 60) % 2) - 1)),
        m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; } else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; } else { r = c; b = x; }
  return [r + m, g + m, b + m];
}
export function hslToHex(h, s, l) {
  return "#" + hslToRgb(h, s, l)
    .map((v) => ("0" + Math.round(v * 255).toString(16)).slice(-2)).join("");
}
function luminance(rgb) {
  const a = rgb.map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}
export function ratio(a, b) {
  const la = luminance(hslToRgb(a.h, a.s, a.l)), lb = luminance(hslToRgb(b.h, b.s, b.l));
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
function enforce(fg, bg, target) {
  const darken = bg.l > 50; let guard = 0;
  while (ratio(fg, bg) < target && guard++ < 120) {
    fg.l += darken ? -1 : 1;
    if (fg.l <= 0 || fg.l >= 100) break;
  }
  return fg;
}
const css = (c) => `hsl(${Math.round(c.h)} ${Math.round(c.s)}% ${Math.round(c.l * 10) / 10}%)`;

/* ---- derivation (identical math to the design page) ---- */
export function deriveSystem(seeds = {}) {
  const state = {
    color: seeds.color ?? "#4a5df0",
    harmony: HARMONIES[seeds.harmony] !== undefined || seeds.harmony === "custom" ? seeds.harmony ?? "triad" : "triad",
    color2: seeds.color2 ?? "#d81b4f",
    color3: seeds.color3 ?? "#15796f",
    mood: MOODS[seeds.mood] ? seeds.mood : "calm",
    fonts: FONTS[seeds.fonts] ? seeds.fonts : "grotesk",
    contrast: clamp01(seeds.contrast ?? 50),
    corners: clamp01(seeds.corners ?? 40),
    density: clamp01(seeds.density ?? 50),
  };
  function clamp01(v) { v = Number(v); return isFinite(v) ? Math.max(0, Math.min(100, v)) : 50; }

  const m = MOODS[state.mood], f = FONTS[state.fonts];
  const brand = hexToHsl(state.color);
  const h = brand.h, sat = Math.min(96, brand.s * m.satMul);
  let con = (state.contrast + m.contrastBias) / 100;
  con = Math.max(0, Math.min(1, con));
  const bgH = (h + m.warmShift) % 360;
  const tintS = Math.min(m.bgTintSat, sat * 0.4 + 3);

  const t = {};
  if (m.dark) {
    t.bg = { h: bgH, s: tintS + 5, l: 9 + (1 - con) * 4 };
    t.surface = { h: (bgH + 3) % 360, s: tintS + 5, l: t.bg.l + 4.5 };
    t.surface2 = { h: (bgH + 6) % 360, s: tintS + 5, l: t.bg.l + 9.5 };
    t.border = { h: bgH, s: tintS + 3, l: t.bg.l + 15 };
    t.borderStrong = { h: bgH, s: tintS + 3, l: t.bg.l + 26 };
    t.text = { h: bgH, s: 10, l: 89 + con * 8 };
    t.textSoft = { h: bgH, s: 9, l: 70 };
    t.textFaint = { h: bgH, s: 8, l: 56 };
    t.accent = { h, s: sat, l: 62 + (1 - con) * 6 };
    t.accentSoft = { h, s: Math.min(50, sat * 0.6), l: 20 };
    t.ok = { h: 152, s: 45, l: 58 }; t.warn = { h: 40, s: 80, l: 60 }; t.danger = { h: 4, s: 70, l: 62 };
  } else {
    t.bg = { h: bgH, s: tintS, l: 97.5 + (1 - con) * 1.5 };
    t.surface = { h: bgH, s: Math.max(0, tintS - 6), l: 100 };
    t.surface2 = { h: bgH, s: tintS, l: 94 - con * 2 };
    t.border = { h: bgH, s: tintS + 2, l: 88 - con * 5 };
    t.borderStrong = { h: bgH, s: tintS + 2, l: 76 - con * 6 };
    t.text = { h: bgH, s: 20, l: 16 - con * 8 };
    t.textSoft = { h: bgH, s: 11, l: 38 - con * 5 };
    t.textFaint = { h: bgH, s: 9, l: 52 };
    t.accent = { h, s: sat, l: 52 - con * 8 };
    t.accentSoft = { h, s: Math.min(75, sat * 0.8), l: 94 };
    t.ok = { h: 152, s: 60, l: 30 }; t.warn = { h: 38, s: 92, l: 34 }; t.danger = { h: 4, s: 74, l: 42 };
  }

  let h2, sat2;
  if (state.harmony === "custom") {
    const b2 = hexToHsl(state.color2);
    h2 = b2.h; sat2 = Math.min(96, b2.s * m.satMul);
  } else {
    h2 = (h + HARMONIES[state.harmony]) % 360; sat2 = sat;
  }
  t.accent2 = { h: h2, s: sat2, l: t.accent.l };
  t.accent2Soft = { h: h2, s: m.dark ? Math.min(50, sat2 * 0.6) : Math.min(75, sat2 * 0.8), l: m.dark ? 20 : 94 };

  // accent (tertiary) — always a picked hex, used as-is
  t.accent3 = hexToHsl(state.color3);
  t.accent3Soft = { h: t.accent3.h, s: m.dark ? Math.min(50, t.accent3.s * 0.6) : Math.min(75, t.accent3.s * 0.8), l: m.dark ? 20 : 94 };

  enforce(t.text, t.bg, 7);
  enforce(t.textSoft, t.bg, 4.5);
  enforce(t.textFaint, t.bg, 3);

  // pick a legible on-color WITHOUT moving the brand color: prefer white; if
  // it can't clear AA, darken a tinted black until it does. Warn (don't move
  // the accent) if neither works — matches play.js's guardrail behavior.
  function onColorFor(acc) {
    const w = { h: 0, s: 0, l: 100 };
    if (ratio(w, acc) >= 4.5) return w;
    const bl = { h: acc.h, s: 30, l: 10 }; let guard = 0;
    while (ratio(bl, acc) < 4.5 && bl.l > 0 && guard++ < 60) bl.l -= 1;
    return ratio(w, acc) >= ratio(bl, acc) ? w : bl;
  }
  function strongOf(a) {
    return { h: a.h, s: a.s, l: m.dark ? Math.min(90, a.l + 8) : Math.max(8, a.l - 9) };
  }
  t.onAccent = onColorFor(t.accent);   t.accentStrong = strongOf(t.accent);
  t.onAccent2 = onColorFor(t.accent2); t.accent2Strong = strongOf(t.accent2);
  t.onAccent3 = onColorFor(t.accent3); t.accent3Strong = strongOf(t.accent3);
  const warn = {
    accent: ratio(t.onAccent, t.accent) < 4.5,
    accent2: ratio(t.onAccent2, t.accent2) < 4.5,
    accent3: ratio(t.onAccent3, t.accent3) < 4.5,
  };
  [t.ok, t.warn, t.danger].forEach((c) => enforce(c, t.bg, 3));

  const cornerN = Math.max(0, Math.min(1, state.corners / 100 + m.cornerBias));
  const radius = Math.round(cornerN * 18);
  const density = (0.82 + (state.density / 100) * 0.42).toFixed(3);

  const tokens = {
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
    "--k-font-display": f.display, "--k-font-body": f.body,
    "--k-font-mono": 'ui-monospace, Consolas, "Cascadia Mono", monospace',
    "--k-display-weight": String(f.weight), "--k-tracking": f.tracking,
    "--k-radius": radius + "px", "--k-density": density,
  };

  const cssOut =
    "/* your design system — generated by keel-system */\n@layer tokens {\n  :root {\n" +
    Object.entries(tokens).map(([k, v]) => `    ${k}: ${v};`).join("\n") +
    "\n  }\n}\n" +
    (f.google
      ? `\n/* webfonts: self-host the woff2 files, or link Google Fonts:\n   <link rel="stylesheet" href="https://fonts.googleapis.com/css2?${f.google}&display=swap"> */\n`
      : "");

  const hx = (c) => ({ "$type": "color", "$value": hslToHex(c.h, c.s, c.l) });
  const dtcg = JSON.stringify({
    "$description": "keel design system — DTCG tokens, generated by keel-system",
    color: {
      bg: hx(t.bg), surface: hx(t.surface), "surface-2": hx(t.surface2),
      border: hx(t.border), "border-strong": hx(t.borderStrong),
      text: hx(t.text), "text-soft": hx(t.textSoft), "text-faint": hx(t.textFaint),
      primary: hx(t.accent), "primary-strong": hx(t.accentStrong),
      "on-primary": hx(t.onAccent), "primary-soft": hx(t.accentSoft),
      secondary: hx(t.accent2), "secondary-strong": hx(t.accent2Strong),
      "on-secondary": hx(t.onAccent2), "secondary-soft": hx(t.accent2Soft),
      accent: hx(t.accent3), "accent-strong": hx(t.accent3Strong),
      "on-accent": hx(t.onAccent3), "accent-soft": hx(t.accent3Soft),
      ok: hx(t.ok), warn: hx(t.warn), danger: hx(t.danger),
    },
    dimension: { radius: { "$type": "dimension", "$value": { value: radius, unit: "px" } } },
    number: { density: { "$type": "number", "$value": Number(density) } },
    fontFamily: {
      display: { "$type": "fontFamily", "$value": f.display },
      body: { "$type": "fontFamily", "$value": f.body },
      mono: { "$type": "fontFamily", "$value": 'ui-monospace, Consolas, "Cascadia Mono", monospace' },
    },
  }, null, 2);

  return {
    tokens, css: cssOut, dtcg, warn,
    ratios: {
      text: ratio(t.text, t.bg),
      accent: ratio(t.onAccent, t.accent),
      accent2: ratio(t.onAccent2, t.accent2),
      accent3: ratio(t.onAccent3, t.accent3),
    },
    seeds: state,
  };
}
