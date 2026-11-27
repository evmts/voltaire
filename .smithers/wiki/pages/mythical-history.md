---
title: "Mythical History"
tags: [mythical-history, epics, roadmap, architecture]
kind: current
owner: evmts
---

# Voltaire Mythical History

The Mythical History is the clean, from-scratch architectural story of `evmts/voltaire`: the ordered sequence of atomic epics you would author if rebuilding today's tree cleanly from genesis, tree-equal to `main` at every landing. The machine-readable epic graph lives in `.smithers/mythical/epics.json` and is verified by `scripts/smthrs ci //.smithers:mythical-check`.

## Architectural Epic Chain

1. **`epic-01-primitives-foundation`** — Zero-overhead branded `Uint8Array` primitives (`Address`, `Hex`, `Hash`, `Uint`, `Int256`, `Rlp`, `Abi`, `Transaction`) mirrored across Zig and TypeScript.
2. **`epic-02-audited-cryptography`** — Constant-time native crypto stack (`Keccak256`, `secp256k1` SafeGCD/4-limb, `P256`, `Ed25519`, `BLS12-381` via `blst`, `BN254` via Arkworks, `KZG-4844`, `EIP-712`).
3. **`epic-03-evm-state-and-trie`** — EVM precompiles, Osaka hardfork (`EIP-7951`, blob schedules), O(1) `StateCache` / `BlockStore`, atomic snapshots, `ForkBackend`, and canonical EIP-1186 Merkle Patricia Trie proofs.
4. **`epic-04-multi-target-abi`** — ReleaseSmall & ReleaseFast WASM, tree-shakeable crypto WASM, Bun Native FFI, Node-API, and C99 ABI (`primitives.h` + `libprimitives_c`) with C/Rust/Go/Python/Swift FFI recipes.
5. **`epic-05-zig-017-and-perf`** — Toolchain modernization (Zig 0.17.1, Node 22, Rust/Go/Python updates), 2-way ARMv8.2 Keccak, single-pass `BlockHeader` RLP, and incremental benchmark harness (`scripts/smthrs-bench.mjs`).
6. **`epic-06-docs-and-playground`** — Mintlify documentation (`voltaire.tevm.sh`), `llms.txt` index parity tests, and live browser playground (`playground.tevm.sh`).
7. **`epic-07-smithers-cloud-factory`** — Public coding factory at `smithers.sh/evmts/voltaire`, shared `build.smithers.sh` & R2 object store with strict untrusted read-only isolation, Lighthouse-grade Uphill backpressure reports, Obsidian wiki, Cloud MCP with one-time sandbox auth, and GitHub mirror post-merge publishing.

## Working with the Mythical Stack

- Every Change belongs to one epic in `.smithers/mythical/epics.json` and lands as small, atomic, tested commits.
- Disposable PoCs (`.smithers/flows/issue/poc/flow.mdx`) retain evidence without polluting the clean epic history.
- Updating an architectural subsystem requires updating its corresponding wiki page and mythical epic manifest so the knowledge graph never drifts from `main`.

## Related Pages

- [[start-here]]
- [[architecture]]
- [[factory-and-mcp]]
- [[backpressure-and-audits]]
