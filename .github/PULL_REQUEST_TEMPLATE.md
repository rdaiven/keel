## What this changes

A short description of the change and why.

## Related issue

Closes #

## Checklist

- [ ] I read `CONTRIBUTING.md` and this stays within the lines keel holds
      (zero framework JavaScript, values derive from tokens, the contrast
      guarantee is intact).
- [ ] No hardcoded colors or sizes in components — everything is a token
      or a `color-mix()`/`calc()` of one.
- [ ] I ran `node tools/build.mjs` and committed the regenerated files.
- [ ] I updated `CHANGELOG.md` under the current unreleased heading.
- [ ] Docs updated if this changes public classes or tokens.
