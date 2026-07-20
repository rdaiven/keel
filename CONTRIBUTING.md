# Contributing to keel

Thanks for looking. keel is a small, opinionated project maintained by
one person, so a little context up front saves everyone time.

## Before you open a PR

The fastest path is an **issue first**. A clear description of a real use
case — what you were building, what keel made hard — is worth more than a
speculative feature. Because keel holds firm lines (below), a change that
crosses one won't land no matter how clean the code is; talking first
avoids wasted work.

## The lines keel holds

These aren't up for debate — they're what keel *is*:

- **The framework ships zero JavaScript.** Interactivity rides on native
  `dialog`, `popover`, and `details`. `play.js` / `docs.js` are website
  chrome only, never part of the framework.
- **Every value is a token or derives from one.** No hex in components.
  If you need a color, it comes from `--k-*` or a `color-mix()` of them.
- **The contrast guarantee is inviolable.** The design-system generator
  enforces WCAG AA in code; nothing may weaken that.
- **Zero external requests at runtime**, zero dependencies, no build step
  required to *use* keel.
- **Modern-native, no legacy fallback.** keel targets evergreen browsers
  with `@layer` support (2022+). New platform features are used as
  progressive enhancement.
- **Honest voice.** Docs state trade-offs plainly, in a quiet factual voice. No
  marketing tone.

## Working on it

```bash
git clone https://github.com/rdaiven/keel
cd keel
node tools/build.mjs        # zero dependencies; regenerates min css + all artifacts
```

- Edit `keel.css` (the framework) or `keel-icons.css` (the icon set),
  then run `node tools/build.mjs` — it regenerates the minified files,
  `search-index.json`, `icons.json`, `patterns.json`, `llms.txt`,
  `sitemap.xml`, `robots.txt`, and `docs/changelog.html`.
- **Docs content** lives in `docs/*.html`. The changelog page is
  generated — edit `CHANGELOG.md`, not `docs/changelog.html`.
- **Extension grammar:** `k-block__element--modifier`. Components expose
  local knobs with token defaults (e.g. `--k-btn-bg`), so a variant is a
  few lines of plain CSS.

## Style

- Match the surrounding code: readable CSS, logical properties
  (`margin-inline`, not `margin-left`), comments that explain *why*.
- Keep the core lean. New components must earn their bytes.
- Update `CHANGELOG.md` under the current unreleased heading.

## License

By contributing, you agree your contributions are licensed under the
project's [MIT license](LICENSE).
