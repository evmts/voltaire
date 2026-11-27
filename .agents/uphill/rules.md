# Rules

Uphill writes these rules from each metric's `description`. Write code that meets them. `uphill` scores each metric against its target, and `uphill --compare HEAD --compact` lists what a change made worse.

## Footprint

Keep the WASM bundle, flagship primitive surfaces, and runtime dependencies minimal.

- Keep `packages/voltaire-ts/src/wasm-loader/primitives.wasm` under 350 kB raw (200 kB gzipped) via ReleaseSmall and dead-code elimination (.size-limit.json). At most 350 kB.
- Keep each flagship primitive and crypto surface small and tree-shakeable; isolate optional helpers and avoid bloat. At most 15 kB.
- Keep direct runtime dependencies minimal across voltaire-ts and Cargo.toml. At most 3.

## Zig & Rust Safety

Eliminate panic paths, relative cross-module Zig imports, Rust unwraps, and oversized functions in crypto/EVM code.

- Never use `@panic(...)` or `catch unreachable` in production Zig code under `packages/voltaire-zig/src/`; return explicit error unions.
- Use named Zig module imports (`@import("primitives")`, `@import("crypto")`, `@import("precompiles")`) instead of relative `../` cross-module paths (CLAUDE.md).
- Keep production Zig functions at or under 70 lines (TigerStyle); decompose long crypto and EVM routines into focused helpers.
- Never call `.unwrap()` or `panic!()` in production Rust code; propagate Result/error codes cleanly across FFI boundaries.
- Keep Rust `unsafe` FFI blocks minimal, audited, and unchanged unless strictly required.

## TypeScript Quality

Enforce Voltaire's zero-console library policy, strict typing, zero suppressions, and TigerStyle function limits.

- Never call `console.log`, `console.warn`, `console.error`, or `console.debug` in library source code; throw typed errors instead (CLAUDE.md).
- Never use `: any` or `as any` in production source; use branded types, generics, or `unknown` with validation.
- Eliminate `@ts-ignore`, `@ts-expect-error`, and `@ts-nocheck` directives from production source (CLAUDE.md Type Error Policy).
- Keep TypeScript functions at or under 70 lines (TigerStyle).

## Architecture & Testing

Maintain high test depth across Zig and TypeScript packages, Zig/TS module parity, and valid docs links.

- Maintain at least a 70% test-to-source line ratio across every core Zig and TypeScript subsystem. At least 70.
- Keep core module directories in `packages/voltaire-zig/src/` mirrored by name in `packages/voltaire-ts/src/` (CLAUDE.md).
- Keep all relative Markdown links in `README.md`, `CLAUDE.md`, and `CONTRIBUTING.md` valid.
