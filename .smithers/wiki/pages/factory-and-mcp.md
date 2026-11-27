---
title: "Smithers Cloud Factory and MCP Server"
tags: [smithers, mcp, auth, sandboxes, factory]
kind: current
owner: evmts
---

# Smithers Cloud Factory and MCP Server

Voltaire develops in the open on Smithers Cloud at `https://smithers.sh/evmts/voltaire` with GitHub mirroring (`mirror: "push"`, `issues: "two-way"`, `changes: "land"`).

## Public Cloud MCP Server

Every coding agent (Claude Code, Codex, Antigravity, Cursor) connects to Voltaire's live Streamable HTTP MCP server declared in `.mcp.json`:

- **Endpoint:** `https://smithers.sh/evmts/voltaire/mcp`
- **OAuth 2.1 Discovery:** `https://smithers.sh/.well-known/oauth-protected-resource` (PKCE S256, scopes `mcp:read`, `mcp:write`)
- **Attribution & Guardrails:** Every agent write is attributed as `<login> (agent)` under the caller's live repository role. Person-only actions (merging, final triage, committing TODOs, secrets) are enforced server-side and never granted to agents.

## One-Time-Use Sandbox & Agent Auth

Use `scripts/smthrs-auth.mjs` to mint short-lived, scope-attenuated credentials for sandboxes and agent lanes without ever placing long-lived secrets in repository files or shell logs:

```sh
# Inspect live MCP & trust posture
node scripts/smthrs-auth.mjs status

# Mint a short-lived scoped token to a mode-0600 file
node scripts/smthrs-auth.mjs mint --scope read:runs --ttl 15m --out /tmp/voltaire-sandbox.token

# Print a one-time BYOA attach pairing command for an agent session
node scripts/smthrs-auth.mjs attach-instructions
```

## Personalized Factory UI

Voltaire's home (`.smithers/HOME.ts` → `.smithers/home.json`) tailors `https://smithers.sh/evmts/voltaire` for three audiences:

- **Maintainers (`maintainer`):** Command Center with New Branch (`B`), live Issues & Triage, live TODO Stack, Runs, Flows, and View-As switcher.
- **Contributors (`contributor`):** Dedicated Contributor Workbench for people who have contributed to Voltaire (local setup, how a change lands, public MCP & Lighthouse audit links, interactive prompt).
- **Viewers (`everyone`):** Instant pre-clone Product Showcase with install command, TypeScript example, stats, packages, public coding factory showcase, ecosystem links, and release feed.

## Related Pages

- [[start-here]]
- [[backpressure-and-audits]]
- [[release-and-publishing]]
- [[mythical-history]]
