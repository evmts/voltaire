# AGENTS.md — Voltaire (`evmts/voltaire`)

Follow the [Uphill rules](.agents/uphill/rules.md), which `uphill rules --write` rewrites from each metric's description: @.agents/uphill/rules.md

All engineering standards in [`CLAUDE.md`](CLAUDE.md) and Uphill rules in [`.agents/uphill/rules.md`](.agents/uphill/rules.md) apply to every agent working on Voltaire.

## Interact Through Smithers Cloud MCP

Every agent (Claude Code, Codex, Antigravity, Cursor) should connect to Voltaire's live Smithers Cloud MCP server declared in [`.mcp.json`](.mcp.json):

- **Endpoint:** `https://smithers.sh/evmts/voltaire/mcp`
- **Web Factory UI:** `https://smithers.sh/evmts/voltaire`
- **Engineering Wiki:** `https://smithers.sh/evmts/voltaire/-/wiki` (`.smithers/wiki/pages/`)
- **Mythical History:** `.smithers/mythical/epics.json` and `.smithers/wiki/pages/mythical-history.md`

Use the Smithers MCP server to inspect files/refs/docs, read and file issues, draft TODOs, inspect pull requests and stacked changesets, discover and run flows, and inspect artifacts. Every write is attributed as `<login> (agent)`. Person-only operations (merging, final triage, committing TODOs, writing secrets) remain human maintainer actions.

## One-Time Sandbox & Agent Authentication

```sh
# Check live MCP reachability and trusted vs untrusted execution posture
node scripts/smthrs-auth.mjs status

# Print one-time BYOA pairing / OAuth 2.1 PKCE attach commands
node scripts/smthrs-auth.mjs attach-instructions

# Mint a short-lived scoped sandbox token into a mode-0600 file (requires SMITHERS_TOKEN)
node scripts/smthrs-auth.mjs mint --scope read:runs --ttl 15m --out /tmp/voltaire-sandbox.token
```

## Shared Object Store & Execution Trust

- Shared build cache: `https://build.smithers.sh` (configured in `.smithers/WORKSPACE.ts`).
- Shared run artifact store: `http://artifacts.smithers.internal/<name>` inside Smithers Cloud sandboxes (Cloudflare R2).
- **Trusted runs** (controlled Smithers Cloud sandboxes on `main` and maintainer sessions) may populate the shared cache via `SMITHERS_CACHE_WRITE_TOKEN`.
- **Untrusted / external contributor runs** are welcomed and encouraged, execute with read-only cache access (`SMITHERS_CACHE_READ_TOKEN`), and can never write to the shared cache, skip gates, or modify `protectedPaths` without maintainer approval.

## Required Verification Before Landing

```sh
scripts/smthrs ci //.smithers:factory-check //.smithers:home-check //.smithers:wiki-check //.smithers:mythical-check //.smithers:factory-test
node scripts/audit-report.mjs --strict
zig build && zig build test
pnpm --filter @tevm/voltaire run typecheck
pnpm --filter @tevm/voltaire run test:run
```
