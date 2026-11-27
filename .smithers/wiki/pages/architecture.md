---
title: "Dual-Language Architecture"
tags: [architecture, zig, typescript, parity]
kind: current
owner: evmts
---

# Dual-Language Architecture

Voltaire maintains a strict structural mirror between Zig (`packages/voltaire-zig/src/`) and TypeScript (`packages/voltaire-ts/src/`). Every core domain in Zig maps by name to its TypeScript counterpart, verified continuously by the `zig-ts-parity` Uphill metric in [[backpressure-and-audits]].

## Domain Parity Map

| Domain | Zig Core (`packages/voltaire-zig/src/`) | TypeScript (`packages/voltaire-ts/src/`) |
| --- | --- | --- |
| Primitives | `primitives/` | `primitives/` |
| Cryptography | `crypto/` | `crypto/` |
| EVM & Precompiles | `evm/` | `evm/`, `precompiles/` |
| State Manager | `state-manager/` | `state-manager/` |
| Blockchain | `blockchain/` | `blockchain/` |
| JSON-RPC | `jsonrpc/` | `jsonrpc/`, `provider/` |
| Native & WASM Loaders | `c_api.zig`, `primitives.h` | `wasm-loader/`, `native-loader/` |

## Module Import Rules

- Zig modules always import through named roots declared in `build.zig`: `@import("primitives")`, `@import("crypto")`, `@import("precompiles")`. Cross-module relative `../` imports are flagged by Uphill `zig-module-imports`.
- TypeScript source uses data-first branded `Uint8Array` types with tree-shakeable namespace functions (see [[primitives]]).
- Library source never calls `console.*` in TypeScript or `std.debug.print` / `@panic` / `catch unreachable` in production Zig.

## Related Pages

- [[start-here]]
- [[primitives]]
- [[wasm-and-ffi]]
- [[mythical-history]]
