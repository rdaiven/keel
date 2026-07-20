#!/usr/bin/env node
/* keel — the command-line tool. Zero dependencies (plain Node ≥18).
 *
 *   keel init [dir] [--icons] [--min]          scaffold keel into a project
 *   keel add <icon...>                         add icon rule(s) to ./keel-icons.css
 *   keel search <query>                        search icons by name/tag
 *   keel system --color <hex> --mood <m> --fonts <f>   print a tokens CSS
 *   keel list <icons|moods|fonts|sections|paths>     list what's available
 *   keel help
 *
 * Everything the site tools do, on the CLI: it reads the same keel.css,
 * icons.json and keel-system.mjs that ship in the package.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url)); // tools/ (this dir)
const ROOT = resolve(HERE, "..");                     // package / repo root
const pkg = (f) => join(ROOT, f);                     // resolve from the package root (css/, data/…)
const toolUrl = (f) => pathToFileURL(join(HERE, f)).href; // a sibling tool, for dynamic import()
const RESET = "\x1b[0m", B = "\x1b[1m", DIM = "\x1b[2m", G = "\x1b[32m", C = "\x1b[36m", Y = "\x1b[33m";
const log = (...a) => console.log(...a);
const die = (m) => { console.error(Y + "keel: " + RESET + m); process.exit(1); };

/* ---- arg parsing ---- */
const argv = process.argv.slice(2);
const cmd = argv[0];
const flags = {};
const rest = [];
for (let i = 1; i < argv.length; i++) {
  const a = argv[i];
  if (a.startsWith("--")) {
    const eq = a.indexOf("=");
    if (eq > -1) flags[a.slice(2, eq)] = a.slice(eq + 1);
    else if (argv[i + 1] && !argv[i + 1].startsWith("--")) flags[a.slice(2)] = argv[++i];
    else flags[a.slice(2)] = true;
  } else rest.push(a);
}

const loadIcons = () => JSON.parse(readFileSync(pkg("data/icons.json"), "utf8"));

function usage() {
  log(`${B}keel${RESET} — zero-dependency CSS framework, on the CLI\n`);
  log(`${B}Usage${RESET}`);
  log(`  ${C}keel init${RESET} [dir] [--icons] [--min]          scaffold keel into a project`);
  log(`  ${C}keel add${RESET} <icon...>                         add icon rule(s) to ./keel-icons.css`);
  log(`  ${C}keel search${RESET} <query>                        search icons by name or tag`);
  log(`  ${C}keel system${RESET} --color <hex> --mood <m> --fonts <f>   print a design-system tokens CSS`);
  log(`  ${C}keel list${RESET} <icons|moods|fonts|sections|paths>     list what's available`);
  log(`  ${C}keel help${RESET}\n`);
  log(`${DIM}Then: <link rel="stylesheet" href="keel.css"> and write semantic HTML.${RESET}`);
}

function init() {
  const dir = resolve(rest[0] || ".");
  const min = !!flags.min;
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const css = min ? "keel.min.css" : "keel.css";
  copyFileSync(pkg("css/" + css), join(dir, css));
  const links = [`  <link rel="stylesheet" href="${css}">`];
  if (flags.icons) {
    const ic = min ? "keel-icons.min.css" : "keel-icons.css";
    copyFileSync(pkg("css/" + ic), join(dir, ic));
    links.push(`  <link rel="stylesheet" href="${ic}">`);
  }
  const indexPath = join(dir, "index.html");
  if (!existsSync(indexPath)) {
    writeFileSync(indexPath,
`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>keel</title>
${links.join("\n")}
</head>
<body>
  <header class="k-section--alt"><div class="k-container">
    <nav class="k-nav"><a class="k-nav__brand" href="#">keel</a></nav>
  </div></header>
  <section class="k-hero"><div class="k-container">
    <p class="k-hero__eyebrow">built with keel</p>
    <h1>Semantic HTML, already designed.</h1>
    <p class="k-hero__lead">Edit this file. Seed your own design system with
      <code>keel system</code> and paste the tokens after the keel link.</p>
    <p class="k-cluster k-mt-5">
      <a class="k-btn" href="#">Get started</a>
      <a class="k-btn k-btn--ghost" href="#">Docs</a>
    </p>
  </div></section>
</body>
</html>
`);
  }
  log(`${G}✓${RESET} keel scaffolded in ${B}${dir}${RESET}`);
  log(`  ${css}${flags.icons ? " + icons" : ""}, index.html`);
  log(`  next: open index.html — or run ${C}keel system --color "#2b6cd7"${RESET} for a theme`);
}

function add() {
  if (!rest.length) die("add: name at least one icon, e.g. keel add shield github");
  const db = loadIcons();
  const byName = new Map(db.icons.map((i) => [i.name, i]));
  const rules = [], missing = [];
  for (const n of rest) {
    const i = byName.get(n);
    if (i) rules.push("  " + i.css); else missing.push(n);
  }
  if (missing.length) die(`unknown icon(s): ${missing.join(", ")} — try ${C}keel search ${missing[0]}${RESET}`);
  const target = resolve("keel-icons.css");
  const has = (n) => existsSync(target) && readFileSync(target, "utf8").includes(".k-icon--" + n + " {");
  const toAdd = rest.filter((n) => !has(n));
  const skipped = rest.filter((n) => has(n));
  if (!toAdd.length) return log(`${DIM}already present: ${skipped.join(", ")} — nothing to add.${RESET}`);
  const newRules = toAdd.map((n) => "  " + byName.get(n).css);
  let out;
  if (existsSync(target)) {
    const css = readFileSync(target, "utf8");
    const idx = css.lastIndexOf("}");
    out = idx > -1 ? css.slice(0, idx) + newRules.join("\n") + "\n" + css.slice(idx)
                   : css + "\n@layer components {\n" + newRules.join("\n") + "\n}\n";
  } else {
    out = "/* keel icons — add via `keel add <name>`. Pairs with keel.css. */\n@layer components {\n" + newRules.join("\n") + "\n}\n";
  }
  writeFileSync(target, out);
  log(`${G}✓${RESET} added ${toAdd.length} icon(s) to ${B}keel-icons.css${RESET}: ${toAdd.join(", ")}` +
    (skipped.length ? ` ${DIM}(skipped ${skipped.length} already present)${RESET}` : ""));
  log(`  use: ${DIM}<span class="k-icon k-icon--${toAdd[0]}"></span>${RESET}`);
}

function search() {
  const q = (rest.join(" ") || "").toLowerCase();
  if (!q) die("search: give a query, e.g. keel search payment");
  const db = loadIcons();
  const hits = db.icons.filter((i) => i.name.includes(q) || (i.tags || []).some((t) => t.includes(q)));
  if (!hits.length) return log(`no icons match "${q}".`);
  log(`${hits.length} match "${q}":`);
  for (const i of hits.slice(0, 40)) log(`  ${B}${i.name}${RESET} ${DIM}${i.category} · ${i.tags.join(", ")}${RESET}`);
  if (hits.length > 40) log(`  ${DIM}… and ${hits.length - 40} more${RESET}`);
}

async function system() {
  const { deriveSystem, MOODS, FONTS } = await import(toolUrl("keel-system.mjs"));
  const s = deriveSystem({ color: flags.color, color2: flags.color2, color3: flags.color3, harmony: flags.harmony,
    mood: flags.mood, fonts: flags.fonts,
    contrast: flags.contrast, corners: flags.corners, density: flags.density });
  const pass = s.ratios.text >= 7 && s.ratios.accent >= 4.5 && s.ratios.accent2 >= 4.5 && s.ratios.accent3 >= 4.5;
  const out = flags.out;
  if (out) { writeFileSync(resolve(out), s.css); log(`${G}✓${RESET} wrote ${out} ${DIM}(${flags.mood || "calm"} · contrast ${pass ? "AA ✓" : "⚠"})${RESET}`); }
  else { process.stdout.write(s.css); console.error(`${DIM}// contrast — text ${s.ratios.text.toFixed(1)}:1 · primary ${s.ratios.accent.toFixed(1)}:1 — ${pass ? G + "AA ✓" : Y + "⚠ below target"}${RESET}`); }
}

function list() {
  const what = rest[0];
  if (what === "icons") { const db = loadIcons(); log(db.icons.map((i) => i.name).join(" ")); }
  else if (what === "sections") { const p = JSON.parse(readFileSync(pkg("data/patterns.json"), "utf8")); p.forEach((x) => log(`${B}${x.name}${RESET} ${DIM}${x.category}${RESET}`)); }
  else if (what === "paths") { const d = JSON.parse(readFileSync(pkg("data/paths.json"), "utf8")); d.paths.forEach((p) => log(`${B}${p.id}${RESET} ${DIM}${p.morphism} — ${p.whenToUse}${RESET}`)); }
  else if (what === "moods" || what === "fonts") {
    import(toolUrl("keel-system.mjs")).then((m) => log(Object.keys(what === "moods" ? m.MOODS : m.FONTS).join(" ")));
  } else die("list: one of icons | moods | fonts | sections | paths");
}

switch (cmd) {
  case "init": init(); break;
  case "add": add(); break;
  case "search": search(); break;
  case "system": await system(); break;
  case "list": list(); break;
  case undefined: case "help": case "--help": case "-h": usage(); break;
  default: die(`unknown command "${cmd}" — run ${C}keel help${RESET}`);
}
