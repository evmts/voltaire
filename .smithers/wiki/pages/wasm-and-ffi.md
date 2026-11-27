---
title: "WASM, Native FFI, and C ABI"
tags: [wasm, ffi, c-abi, zig, bun, rust]
kind: current
owner: evmts
---

# WASM, Native FFI, and C ABI

Voltaire compiles one zero-Rust-by-default Zig 0.17.1 cryptographic core (with optional `-Dwith-rust=true` Rust arkworks/keccak-asm wrappers) into four runtime targets so developers can choose pure TypeScript, sub-350 kB browser/edge WebAssembly (plus 1.2–3.1 kB standalone micro-WASMs), synchronous Bun/Node native FFI across 13 crypto modules, or prebuilt C99 ABI release tarballs (`libprimitives_c`, `primitives.h`, `voltaire.pc`) for C, Rust, Go, Python, and Swift.

## Build Targets

| Target | Build Command | Output |
| --- | --- | --- |
| ReleaseSmall WASM | `zig build build-ts-wasm` | `wasm/primitives.wasm` (size-optimized) |
| ReleaseFast WASM | `zig build build-ts-wasm-fast` | `wasm/primitives-fast.wasm` (throughput-optimized) |
| Tree-shakeable Crypto WASM | `zig build crypto-wasm` | `wasm/crypto/*.wasm` |
| Native FFI | `zig build build-ts-native -Dwith-c-api=true` | `zig-out/lib/libprimitives_ts_native.*` |
| C99 ABI Library & Header | `zig build -Dwith-c-api=true -Doptimize=ReleaseFast` | `zig-out/lib/libprimitives_c.*`, `zig-out/include/primitives.h` |

## C ABI Contract

- `packages/voltaire-zig/src/c_api.zig` defines the stable C ABI symbols.
- `packages/voltaire-zig/src/primitives.h` is the generated C99 header (`zig build generate-header`).
- CI and Smithers (`//.smithers:c-api-smoke`) compile and execute `packages/voltaire-zig/examples/c/basic_usage.c` against `libprimitives_c` to prove ABI linkability and runtime correctness.
- Cross-language recipes for C, Rust, Go, Python, and Swift live in `docs/C_FFI_RECIPES.md`.

## Related Pages

- [[architecture]]
- [[cryptography]]
- [[backpressure-and-audits]]
- [[release-and-publishing]]
