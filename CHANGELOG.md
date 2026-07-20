# Changelog

keel is pre-1.0 — class names and tokens may still tighten before a
stable 1.0. Each version below records what changed. Format follows
Keep a Changelog. Dates are 2026.

## [0.8.0] — 07-13

The design-system release — a wider, guided generator that seeds five
colors and a fluid type scale, plus a third brand color, an unlayered
build, and downloads with your own class names.

### Design tool — download with your own class prefix
- A **class prefix** field on the design page: set it (e.g. `yours`) and
  **Download keel.css** renames every class on the way out — `.k-btn`
  becomes `.yours-btn` throughout. Only class selectors change; tokens
  (`--k-*`), keyframes and `data-*` attributes are left alone, so the
  renamed components still read the same tokens — and your own custom
  tokens (`--black`, …) never get a forced prefix. Default is `k`.

### Design tool — wider layout, base size as a range
- The tool is wider, its controls flow into two balanced columns, and
  the export panel sticks in view while you work. Base text size is now
  a range slider (14–21px).

### Framework — a few more token-bound utilities
- Filled genuine gaps in the utility set, each one spending a token (or
  a plain layout keyword) — never an arbitrary value: brand-color text
  (`.k-text-accent-2`, `.k-text-accent-3`), soft brand-color backgrounds
  (`.k-bg-accent-2-soft`, `.k-bg-accent-3-soft`), a small corner radius
  (`.k-rounded-s`), and more flex helpers (`.k-items-end`,
  `.k-items-baseline`, `.k-justify-start`, `.k-justify-end`,
  `.k-flex-col`, `.k-flex-wrap`). No heading-size utilities: headings are
  still headings.

### Design tool — a fluid type scale generator
- The generator now builds the whole **fluid type scale** from two
  choices: a **base text size** (16 / 17 / 18px) and a **modular ratio**
  (minor third → golden). It outputs all seven `--k-text-*` sizes as
  `clamp()` — bodies at your base, headings stepping up by the ratio and
  growing fluidly from a 320px to a 1240px viewport. No hand-written
  `clamp()` math. The sizes flow through the CSS/full/Tailwind/SCSS/JSON
  exports and the live preview (keel's headings read `--k-text-*`).

### Framework — a portable (unlayered) build
- **`keel-portable.css`** (and `.min`) — the same framework with the
  `@layer` wrappers stripped, generated from `keel.css`. The default
  layered build always yields to unlayered CSS (safe, but its classes
  can't win inside a visual page builder or a theme that ships its own
  CSS). The portable build lets keel's classes compete on normal
  specificity + source order — link it, then write keel markup in a raw
  HTML / code block. It adds **no `!important`**, so it still yields to
  inline styles and the builder's own live edits keep working. Use the
  layered `keel.css` everywhere you control the whole page.

### Framework — a third brand color
- **`--k-accent-3`** joins `--k-accent` and `--k-accent-2`: a full
  tertiary brand color with `-strong`, `-light`, `-soft`, and
  transparency variants, plus a light/dark seed. New component
  modifiers `.k-btn--tertiary`, `.k-badge--tertiary`,
  `.k-icon-box--tertiary`, and the `.k-section--tint-3` band.

### Design tool — up to five colors, colors respected
- The generator now seeds from **five colors**: primary, secondary,
  **accent**, and optional **text** and **background** (leave the last
  two on Auto to keep deriving them from the mood).
- **Colors you pick are used exactly as picked.** The tool no longer
  reshapes your brand colors to force contrast — instead it derives a
  legible on-color and **warns in the readout** when a pairing falls
  below WCAG AA, keeping your choice. Derived neutrals are still nudged
  to stay readable.
- Accent flows through every export (CSS tokens, full set, DTCG,
  Tailwind, SCSS, flat JSON) and the live preview.

### Framework — paths pushed harder
- **Liquid** reworked for a convincing frost: translucent surfaces
  (were near-opaque, so nothing showed through), a diagonal specular
  sheen, a brighter top edge, and a token-derived backdrop so the glass
  always has something to see through.
- **Clay** puffs more: bigger, softer colored drop shadow, brighter
  inner top highlight, rounder corners, and the puff now reaches menus,
  popovers and dialogs.
- **Brutal** gains the interactive move — cards shift and their block
  shadow grows on hover.
- **Maximal** turns up: richer mesh on alt bands and a gradient rule.

### Site
- New docs page: **Framework guides** — copy-paste setup for Astro,
  Vite/React/Vue/Svelte, Next/Nuxt, 11ty/Hugo/Jekyll, WordPress, and
  server frameworks. keel is one stylesheet, so each guide is just the
  one-line way to link it in that stack.
- All four **path templates redesigned** so each direction shows off its
  look up front: Glasswater floats a glass player over a vivid mesh,
  Sundough puffs a clay order box, Blunt Type Co. sets a giant specimen
  block, and Neon Harvest fronts gradient stat cards.

## [0.7.0] — 07-13

The directions release — paths, and the layouts to match.

### Framework
- **Paths** — optional one-file design directions, linked after
  `keel.css` only if your site is heading that way: **clay**
  (claymorphism), **brutal** (brutalism), **liquid** (glass everywhere),
  **maximal** (maximalism). Each derives from your tokens, lives in
  `@layer path` (your CSS still wins), and preserves the contrast
  guardrail.
- **Bento grid** in core: `.k-bento` with `__wide` / `__tall` /
  `__hero` spans, dense backfill, single column on phones.
- Skip link (`.k-skip-link`) added to the framework; the site now ships
  one on every page, with a `<main id="main">` landmark.
- Icon set grown to **326** — a new **keel signature** category of marks
  for keel's own concepts (`keel`, `contrast`, `path`, `token`, `derive`, `light`, `dark`),
  plus `emdash`, `bullet`, and `asterisk` for lists and eyebrow text.

### Site
- New docs page: **Paths** — what a path is, the four directions, and a
  live switcher: same markup, pick a direction, watch it change. The
  same switcher now teases paths on the homepage.
- Seventh template: **Ridgeline Supply** — an image-rich one-page
  product landing: layered SVG hero art, product cards, a bento
  field-notes gallery, a story band, and a reserve CTA. Every image is
  inline SVG, each one swappable for a real photo inside the same
  `.k-frame`.
- Four **path templates**, one per direction — **Sundough** (a bakery on
  clay), **Blunt Type Co.** (a foundry on brutal), **Glasswater** (a
  music app on liquid), **Neon Harvest** (a festival on maximal). Each
  is one tokens block plus one path link.
- Paths docs: a step-by-step **"Add a path to your site"** tutorial —
  get the file, link it after keel, tune it with plain CSS, change
  direction with a one-line diff. The four directions are now
  **per-path accordions** (native `details`), each with what it changes,
  the exact link, and its template. Homepage templates trimmed to four.
- Getting started: a **"Compose your setup"** picker — tick the icon set,
  a design path, minified or not, and the exact `<link>` tags build live
  in the right order (keel → icons → path), ready to copy.
- Bento documented on Layout.
- Launch pass: repo public, clean history, canonical/OG/JSON-LD
  metadata, sitemap + robots, og share card.

## [0.6.0] — 07-12

The depth release — proving the framework with real breadth of work.

### Framework
- Application tier (a 10th component category): app shell, toolbar,
  tree, inspector rows, canvas/artboard, status bar — the pieces a
  builder UI needs.
- Data tables: sticky headers, dense mode, numeric columns, sortable
  affordance, selected rows, and responsive card stacking.
- Modern motion, all reduced-motion safe and zero-JS: animation knobs,
  slide/stagger/lift, scroll-driven progress, animated `details`,
  auto-growing textareas, view-transitions opt-in.
- Icon set grown to **316** (mask-based, `currentColor`, zero requests)
  and split into an optional `keel-icons.css` so the core stays lean.
- Flat skin (`data-k-flat`): a borders-only look that composes with any
  mood, dark mode, corners, and density.
- Flexibility pass: pills, sizes, accents, and status variants added
  across buttons, cards, badges, alerts, tabs, switches, nav, stats,
  steps, and dividers.
- Richer selection: section headers, shortcut hints, and checkable
  states in menus; a removable-chip token field; a value+unit control.
- Seven more components: rating, searchable combobox, key caps, code
  block, popover, segmented control, and stepper.
- Icon framing (`.k-icon-box`) and a themed code editor (`.k-editor`)
  with title bar, gutter, and a dark variant.

### Site
- Changelog now lives on the site — generated from this file at build
  time, no client JS.
- keel now stands entirely on its own: every reference to any other
  project removed from the site, README, docs, and code.
- Copy button on every code block, site-wide.
- Components split into an overview plus 10 category pages; Forms
  rebuilt as a full reference.
- Sections rebuilt as a gallery with a live lightbox (47 patterns,
  preview in your palette, copy markup or view code).
- A searchable Icons page with a package builder — pick only the icons
  you need and download a custom file (~1 KB for a few).
- Two new templates: **Helm** (a page-builder UI) and **Beacon** (an
  analytics dashboard, mobile-audited).
- Tooling: the `keel` CLI, an `icons.json` manifest, and MCP servers so
  an AI agent can generate a system, add icons, and drop in sections.

## [0.5.0] — 07-12

The completeness release — and the website becoming a real product site.

### Framework
- Roughly 50 components across 9 categories: accordion, tabs, drawer,
  scroll-snap gallery, banner, empty state, timeline, panel, calendar,
  steps, and more.
- Surface effects (glass, glow, mesh) that derive from the seeds.
- Fuller forms: styled range, color and date inputs, file button,
  disabled/readonly states, `meter`, control sizes, row layouts.
- Fluid type and space via `clamp()`; color relationships via
  `color-mix()` (61 tokens = 31 decisions + 30 derivations).

### Site
- Two zones, one repo: marketing at root, docs under `docs/` — with
  zone-aware search, pager, and the floating design panel.
- Docs shell: grouped sidebar, right-rail "On this page", prev/next
  pager, Ctrl+K search over a build-generated index.
- Design tool: a real color picker (shade area, rails, EyeDropper),
  five color formats, six moods, twelve font pairings, and CSS / DTCG
  exports.

### Fixed
- Adversarial review (409k-combo color-math check): btn-group focus
  ring, `revert-layer` in visibility utilities, invalid DTCG color
  export, honest contrast readout, bare-icon rendering, accent-band
  visibility, and a nav alignment leak.

## [0.2.0–0.4.0] — 07-11 → 07-12

- 0.4: sections library, four themed templates, categorized components.
- 0.3: fluid scales, color relationships, knobs, smart spacing.
- 0.2: utilities layer, ~40 components, secondary color + harmony tool,
  modern forms/overlays/motion, DTCG export, minified build.

## [0.1.0] — 07-11

First draft: five-layer architecture, a component preview page built
with keel itself, and the design-system generator with its WCAG
guardrail.
