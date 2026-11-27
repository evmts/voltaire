---
title: "Start Here"
tags: [voltaire, overview, onboarding, smithers]
kind: current
owner: evmts
---

# Start Here

Voltaire (`evmts/voltaire`) is the high-performance Ethereum primitives and cryptography foundation of the Tevm ecosystem. Core primitives and cryptographic routines are authored in Zig (`@tevm/zig`) and mirrored into tree-shakeable TypeScript (`@tevm/voltaire`) with Pure TS, WebAssembly, Bun Native FFI, and a C99 ABI (`primitives.h` / `libprimitives_c`).

## Repository Map

```text
evmts/voltaire
├── packages/voltaire-zig/   Zig 0.17.1 core, crypto, EVM, C ABI, Rust wrappers
├── packages/voltaire-ts/    @tevm/voltaire TS/WASM/Native SDK + Mintlify docs
├── apps/playground/         Interactive browser playground (playground.tevm.sh)
├── .agents/uphill/          Lighthouse-style continuous quality & footprint metrics
└── .smithers/               Smithers Cloud factory, flows, wiki, mythical history
```

## Reading Order

- Architecture and Zig/TS mirror layout: [[architecture]]
- Branded Uint8Array primitives, ABI, RLP, transactions: [[primitives]]
- Audited native cryptography and constant-time guarantees: [[cryptography]]
- EVM precompiles, state manager, fork backend, trie: [[evm-and-state]]
- WebAssembly, Bun FFI, Node-API, and C99 ABI bindings: [[wasm-and-ffi]]
- Backpressure Lighthouse audit report and Uphill rules: [[backpressure-and-audits]]
- Smithers Cloud factory, MCP server, and sandbox auth: [[factory-and-mcp]]
- Automated releases, changesets, docs, and playground deploys: [[release-and-publishing]]
- Clean architectural narrative and epic ledger: [[mythical-history]]

## Fast Local Commands

```sh
scripts/smthrs ci //.smithers:factory-check //.smithers:wiki-check //.smithers:factory-test
zig build && zig build test
pnpm --filter @tevm/voltaire run typecheck
pnpm --filter @tevm/voltaire run test:run
node scripts/audit-report.mjs
```
