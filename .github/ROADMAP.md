# Roadmap

keel is pre-1.0. This is the direction of travel, not a schedule — a
solo project ships when it's ready, not on a date. It's here so you can
see where keel is going before you build on it, and so you know what's
stable enough to depend on today.

## Where keel is now — 0.9.x

The framework is public and on npm (`npm i keelcss`): five cascade
layers, a full component library across ten categories, the token
system, the icon set, the design-system generator (WCAG AA enforced
in code), a CLI, and MCP servers. The website, docs, changelog, and
machine-readable surfaces (`llms.txt`, `icons.json`, `patterns.json`)
ship with it, along with a portable (unlayered) build for page-builder
environments.

The near-term work is stabilization, not new surface area:

- Lock class names and token names (see **Stability** below).
- Publish the CLI so `npx keelcss init` works out of the box.
- Tighten docs and gather real-world feedback from first users.

## Toward 1.0

1.0 is a promise, not a feature count. keel reaches 1.0 when:

- The public token and class API has been stable across a few releases
  with no breaking churn.
- Real projects have exercised it enough to trust the surface.
- The accessibility guarantees and browser-support floor are documented
  and holding.

No new component is required for 1.0. Stability is the feature.

## Exploring (post-1.0, not committed)

Ideas under consideration — listed so the direction is legible, not as
promises:

- Themes and starter kits derived from the design-system generator.
- Deeper AI-tooling integration (richer MCP capabilities, agent recipes).
- More templates and page-section patterns.
- Optional print and email-safe token sets.

Anything that would add a JavaScript runtime to the *framework*, a build
step to *use* it, or a hard dependency is out of scope by design — those
are the lines keel holds.

## Stability

- keel follows [semantic versioning](https://semver.org). While pre-1.0,
  the minor version may carry breaking changes; they are always listed
  in the [changelog](../CHANGELOG.md).
- **Stable surface** (changes are breaking, versioned, and announced):
  public token names (`--k-*`), component class names (`k-*`), and the
  cascade-layer order.
- **Internal** (may change any time): the build scripts, the minified
  output's exact bytes, and undocumented selectors.
- Deprecations get a note in the changelog and, where practical, a
  release of overlap before removal.

## Shaping the roadmap

keel is maintained by one person. The best way to influence direction is
a clear, specific issue — a real use case beats a feature request. keel's
scope is as intentional as its features — the lines above are part of
the design, and the docs explain the reasoning behind them.
