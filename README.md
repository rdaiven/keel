# keel

**A zero-dependency CSS framework that starts with your design system.**

*The first timber. Everything is built on it.*

One stylesheet, five native cascade layers, a full component library,
and zero JavaScript — interactive components ride on native `dialog`,
`popover`, and `details`. It starts with *your* design system, not ours:
every color the generator produces has already passed WCAG AA contrast,
enforced in code. And because it's just semantic HTML and one CSS file,
it's the framework a person — or an AI agent — can pick up and use with
nothing to install.

- **No build step, no config, no runtime.** One `<link>` and you're
  writing pages. No npm required to *use* it.
- **Design-system first.** Override one token and its whole family
  re-derives. Generate a full on-brand set from a single seed color.
- **Accessible by default.** Semantic HTML is styled out of the box;
  contrast is guaranteed, not hoped for.
- **No lock-in.** Plain CSS and semantic HTML. MIT. Self-hosted. Zero
  external requests at runtime.

**Status: pre-1.0.** A standalone, self-contained framework by
Daiven Reyes. Class names and tokens may still tighten before 1.0 —
changes land in [the changelog](docs/changelog.html).

---

## Quick start

Download `keel.css`, link it, write semantic HTML:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="keel.css">
  <!-- optional: the named icon set — link only if you use .k-icon--<name> -->
  <link rel="stylesheet" href="keel-icons.css">
</head>
<body>
  <section class="k-section">
    <div class="k-container--narrow k-container">
      <h1>Your page</h1>
      <p>Already designed — no classes needed on prose.</p>
      <a class="k-btn" href="#">A button</a>
    </div>
  </section>
</body>
</html>
```

That's the whole install. No bundler, no PostCSS, no framework.

---

## Architecture

keel is built on five **native CSS cascade layers**, declared in this
order:

```css
@layer tokens, base, layout, components, utilities;
```

| Layer | What it owns |
| --- | --- |
| `tokens` | Every design decision as a custom property — color, type, space, radius, shadow, motion. The *only* place raw values live. |
| `base` | Unclassed semantic HTML: headings, prose, links, lists, tables, forms, `dialog`, `details`. Write HTML, get design. |
| `layout` | Full-bleed bands (`k-section`), container widths (`k-container`), and structural arrangements (grid, cluster, sidebar, flow). |
| `components` | The `k-*` component library — buttons, cards, nav, overlays, data tables, an application/builder tier, and more. |
| `utilities` | A small, token-bound utility surface (spacing, text, display, flex). No arbitrary values — everything maps to a token. |

Because layers have a fixed precedence, **your own CSS always wins**
without specificity fights: styles you write outside these layers
override keel by default. Put your overrides in the `tokens` layer to
re-theme cleanly, or write plain unlayered CSS to override anything.
(An optional design **[path](#paths--optional-design-directions)** adds
one more layer, `path`, above these five.)

Requires a browser with `@layer` support — every major browser since
2022. The cascade-layer model is the architecture.

---

## The token system

keel derives, it doesn't hardcode. There are **~61 tokens = ~31
decisions + ~30 derivations**. Change a decision and everything
downstream follows:

```css
@layer tokens {
  :root {
    --k-accent: hsl(160 84% 32%);   /* one decision… */
    /* …and --k-accent-strong / -light / -soft / -trans all re-derive
       from it via color-mix(), so a new brand color is a one-liner. */
  }
}
```

- **Fluid type and space** via `clamp()` — scales with the viewport,
  no breakpoints to manage.
- **Color relationships** via `color-mix(in oklab, …)` — perceptually
  even shades and states.
- **Contrast guaranteed.** The design-system generator nudges lightness
  until text hits ≥7:1 and accents hit ≥4.5:1 before it emits a token.
  This is enforced in code (`keel-system.mjs`), stress-tested across
  172,800 mood × color × contrast combinations with zero failures.

Generate your own set on the **design page** (`design.html`) from a
primary color, a secondary (by color harmony or exact), a mood, and a
font pairing — then paste the exported tokens block *after* the keel
link tag.

### Paths — optional design directions

keel's defaults are quiet on purpose. A **path** is one optional
stylesheet that steers the whole framework toward a stronger look —
link it after `keel.css` if that's where your site is heading, or link
none at all:

| Path | Direction |
| --- | --- |
| `keel-path-clay.css` | claymorphism — inflated, soft-shadowed surfaces |
| `keel-path-brutal.css` | brutalism — hard edges, ink borders, block shadows |
| `keel-path-liquid.css` | glass everywhere — frosted panes with a specular edge |
| `keel-path-maximal.css` | maximalism — bigger type, gradient furniture |

Every path derives from *your* tokens, lives in `@layer path` (your own
CSS still wins — it's a sixth, optional layer above keel's five), and
keeps your text/background colors exactly as keel set them, so the AA
contrast rides right through the makeover. Minimalism is already in core:
`data-k-flat` plus your own tokens.

---

## Component grammar

Components follow a BEM-style grammar and expose **local knobs with
token defaults**, so a variant is a few lines of plain CSS — no
`@apply`, no config file, no recompiling:

```css
/* grammar: k-block__element--modifier */
.k-card { /* … */ }
.k-card__title { /* … */ }
.k-card--accent { /* … */ }

/* extend by setting a knob — every component reads --k-<block>-* first */
.btn-sale {
  --k-btn-bg: var(--k-warn);
  --k-btn-bg-hover: color-mix(in oklab, var(--k-warn), black 15%);
}
```

Interactive components use **native platform features** rather than
JavaScript: `<dialog>` for modals, the Popover API for popovers and
rich menus, `<details>` for accordions and disclosure. keel styles
them; your own JS (if any) drives the logic. The framework ships **zero
JavaScript**.

---

## CLI

Zero-dependency (`cli.mjs`, exposed as the `keel` bin). Publishing to
npm is pending — until then, run it from a clone with `node tools/cli.mjs …`,
or `npm link` it to get the `keel` command on your PATH:

```bash
keel init [dir] [--icons] [--min]          # scaffold keel + a starter page
keel add shield github rocket              # build a minimal keel-icons.css (idempotent)
keel search payment                        # find icons by name or tag
keel system --color "#2b6cd7" --mood forest  # print an AA-verified tokens CSS
keel list icons|moods|fonts|sections|paths       # enumerate what's available
```

---

## MCP server (AI tools)

`keel-mcp.mjs` is a zero-dependency stdio MCP server. Point any MCP
client at it and an agent can theme, icon, and assemble a keel site on
its own — no manual configuration by the user:

```json
{ "keel": { "command": "node", "args": ["/abs/path/to/tools/keel-mcp.mjs"] } }
```

Exposed tools:

| Tool | Does |
| --- | --- |
| `generate_system` | color / mood / fonts → the `@layer tokens` CSS + DTCG JSON + AA-verified contrast ratios |
| `list_moods`, `list_fonts` | enumerate the built-in moods and font pairings |
| `search_icons`, `get_icon` | find an icon by name/tag; return its one-line CSS rule to paste |
| `search_sections`, `get_section` | find and return ready-to-insert page-section markup |
| `list_paths`, `get_path` | list the design directions, or return one path's `<link>` tags + what it changes |
| `list_icon_categories` | list the icon categories with counts |

---

## Programmatic API

The same engine the design page and CLI use is importable:

```js
import { deriveSystem } from "./tools/keel-system.mjs";

const sys = deriveSystem({ color: "#2b6cd7", mood: "forest", fonts: "inter-jetbrains" });
sys.tokens   // { "--k-accent": "hsl(...)", … }  the resolved token map
sys.css      // the @layer tokens { … } block, ready to paste
sys.dtcg     // Design Tokens Community Group JSON
sys.ratios   // { text, accent, accent2 } contrast ratios — all ≥ AA
```

The CLI, MCP server, and website tools all read the same `icons.json` +
`keel-system.mjs` — **one source of truth**, no drift.

---

## Build

```bash
node tools/build.mjs      # zero dependencies
```

Regenerates, from source:

- `keel.min.css`, `keel-icons.min.css` — minified stylesheets
- `search-index.json` — the site's Ctrl+K search index
- `patterns.json` — the sections library as `{category, name, html}`
- `icons.json` — the icon manifest `{name, category, tags, css, svg}`
- `llms.txt` — an AI-readable map of keel (what it is, when to use it)
- `sitemap.xml`, `robots.txt` — crawler discovery
- `docs/changelog.html` — generated from `CHANGELOG.md` (edit the
  changelog, not the page)

---

## This repo is also keel's website

- **Marketing zone** (root): `index.html`, `templates.html` (+ ten
  themed templates — six flagship pages and four path templates, each
  themed by a single tokens block), `design.html` (the live design
  tool).
- **First-class pages**: **Templates**, **Sections** (a grid → full-
  width lightbox you arrow through), and **Icons** (searchable,
  categorized, with a package builder that downloads a custom subset).
- **Docs zone** (`docs/`): getting started, concepts, and full
  reference — tokens, base, typography, layout, components (in 10
  categories), utilities.
- Ctrl+K search, per-page anchors, prev/next pagination.

Everything is static — open `index.html` or serve the folder. The
design tool and site chrome (`play.js` / `docs.js`) are **site chrome,
not the framework**; keel itself ships no JavaScript.

---

## Repository layout

```
css/      the framework — keel.css, keel.min.css, keel-icons.css,
          and the four keel-path-*.css directions (+ their .min)
data/     machine-readable data — icons.json, patterns.json,
          paths.json, and the Ctrl+K search-index.json
tools/    zero-dependency Node — cli.mjs (the `keel` command),
          keel-mcp.mjs + keel-icons-mcp.mjs (MCP servers),
          keel-system.mjs (the design engine), build.mjs, icon-categories.mjs
docs/     the documentation site
assets/   the Open Graph share image · fonts/  self-hosted woff2 (SIL OFL)

index.html · design.html · templates.html · template-*.html
          the marketing site + 10 themed templates (must sit at the
          repo root — GitHub Pages serves it from there)
fonts.css · docs.css · play.js · docs.js   website chrome (NOT the framework)
llms.txt · sitemap.xml · robots.txt        discovery surfaces (served at the root)
```

The website (the HTML, plus `llms.txt` / `sitemap.xml` / `robots.txt`)
lives at the repo root because GitHub Pages serves the repo directly, no
build. Everything else groups into `css/`, `data/`, and `tools/`. Run
`node tools/build.mjs` after editing a stylesheet — it regenerates the
minified files, the `data/` JSON, `llms.txt`, the sitemap, and the
changelog page.

`keel.css` is hand-authored — it's both the source and the shipped file,
so there's no `src`/`dist` split to make. The flat root is the honest
shape of a framework you use by linking one file.

---

## Fonts

`fonts/` self-hosts six typefaces (Inter, Manrope, Space Grotesk,
Playfair Display, Lora, JetBrains Mono) as latin-subset woff2 — all SIL
OFL licensed, lazy-loaded per face. The framework itself ships no fonts;
you bring type via tokens.

---

## Stability & versioning

keel follows [semantic versioning](https://semver.org). It is **pre-1.0**
— while stabilizing, minor releases may carry breaking changes, always
recorded in the [changelog](CHANGELOG.md).

- **Stable surface** (breaking changes are versioned and announced):
  public token names (`--k-*`), component class names (`k-*`), and the
  cascade-layer order.
- **Internal** (may change any time): build scripts and the exact bytes
  of the minified output.

The [roadmap](.github/ROADMAP.md) explains what "toward 1.0" means and where
keel is headed.

## Contributing

Issues and PRs welcome — please read [CONTRIBUTING.md](.github/CONTRIBUTING.md)
first. keel holds firm lines (zero framework JavaScript, token-derived
values, an inviolable contrast guarantee); an issue before a PR saves
everyone time.

## License

MIT © 2026 Daiven Reyes. The self-hosted fonts are SIL OFL by their
respective authors (see `LICENSE`).
