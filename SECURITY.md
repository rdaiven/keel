# Security Policy

## Scope

keel is a client-side CSS framework with a small amount of website
JavaScript (site chrome only) and two zero-dependency Node tools (the
CLI and the MCP servers). It has **no backend, no database, no runtime
dependencies, and makes no external network requests**, so the attack
surface is small by design.

Things worth reporting:

- A component pattern or generated snippet that enables XSS or unsafe
  markup when used as documented.
- An issue in the CLI or MCP server (`tools/cli.mjs`, `tools/keel-mcp.mjs`,
  `tools/keel-icons-mcp.mjs`) — e.g. path handling or untrusted input.
- Anything in the published npm package (`keelcss`) that behaves unsafely.

## Reporting a vulnerability

Please **do not** open a public issue for a security problem.

Use GitHub's private vulnerability reporting:
**Security → Report a vulnerability** on the repository. That keeps the
report private until a fix is available.

You'll get an acknowledgement as soon as it's seen. keel is maintained by
one person, so please allow reasonable time for a response and fix before
any public disclosure.

## Supported versions

keel is pre-1.0; fixes land on the latest release. There is no
back-porting to older pre-release versions.
