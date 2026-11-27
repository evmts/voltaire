---
title: "Backpressure and Lighthouse Audit Reports"
tags: [uphill, backpressure, lighthouse, quality, cache, security]
kind: current
owner: evmts
---

# Backpressure and Lighthouse Audit Reports

Voltaire enforces continuous quantitative backpressure through Uphill (`.agents/uphill/`) and the Voltaire Audit Report generator (`scripts/audit-report.mjs`), producing a Lighthouse-style HTML and JSON scorecard for every pull request and merge.

## Five Scored Categories

1. **Footprint (`footprint`):** `primitives.wasm` raw and gzipped size budgets, flagship primitive gzipped source sizes, and direct runtime dependency counts.
2. **Zig & Rust Safety (`zig-rust-safety`):** Zero `@panic` / `catch unreachable` in production Zig, named module imports only, TigerStyle 70-line function cap, zero Rust `.unwrap()` / `panic!()`, and `unsafe` block tripwire.
3. **TypeScript Quality (`ts-quality`):** Zero `console.*` in library source, zero explicit `any`, zero `@ts-ignore` / `@ts-expect-error` / `@ts-nocheck`, and TigerStyle function limits.
4. **Architecture & Testing (`architecture`):** Test-to-source line ratios across Zig and TypeScript subsystems, Zig/TS module directory parity, and top-level Markdown link integrity.
5. **Factory & Supply Chain (`factory-and-ci`):** Factory projection sync, shared object-store trust boundaries, Obsidian wiki link integrity, mythical history validation, Mintlify docs/llms.txt freshness, and C99 ABI header health.

## Shared Object Store & Trust Model

- **Shared Cache:** `https://build.smithers.sh` (`S.RemoteCache.make` in `.smithers/WORKSPACE.ts`) caches action results keyed on exact inputs and host tool digests.
- **Run Artifacts:** Smithers Cloud CI jobs upload `audit-report.html` and `audit-report.json` to `http://artifacts.smithers.internal/` (backed by the Smithers Cloud R2 object store).
- **Untrusted Execution Encouraged, Never Trusted to Poison:** External contributors and fork pull requests are encouraged to run CI and Uphill audits freely. They receive read-only cache access (`SMITHERS_CACHE_READ_TOKEN`), never `SMITHERS_CACHE_WRITE_TOKEN`, and can never skip gates or touch `protectedPaths`.

## Generating Locally

```sh
node scripts/audit-report.mjs
open .smithers/reports/audit-report.html
```

## Related Pages

- [[start-here]]
- [[factory-and-mcp]]
- [[cryptography]]
- [[release-and-publishing]]
