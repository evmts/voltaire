# Voltaire

**Type-safe Ethereum primitives, cryptography, and EVM execution — written in Zig and TypeScript, with a C ABI for any language.**

[![npm version](https://img.shields.io/npm/v/@tevm/voltaire.svg)](https://www.npmjs.com/package/@tevm/voltaire) [![Zig 0.17.1](https://img.shields.io/badge/zig-0.17.1-orange.svg)](https://github.com/evmts/voltaire) [![CI status](https://img.shields.io/github/actions/workflow/status/evmts/voltaire/ci.yml?label=CI)](https://github.com/evmts/voltaire/actions/workflows/ci.yml) [![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/evmts/voltaire/blob/main/LICENSE)

[**Docs**](https://voltaire.tevm.sh) · [**Live Playground**](https://playground.tevm.sh) · [**Benchmarks**](https://voltaire.tevm.sh/benchmarks) · [**Spec Compliance**](https://voltaire.tevm.sh/spec-compliance) · [**Smithers Factory**](https://smithers.sh/evmts/voltaire) · [**Engineering Wiki**](https://smithers.sh/evmts/voltaire/-/wiki) · [**C FFI Recipes**](https://github.com/evmts/voltaire/blob/main/docs/C_FFI_RECIPES.md)

## Architecture

Voltaire implements Ethereum primitives, cryptography, and EVM execution once in **Zig 0.17.1** (with `blst`, `c-kzg-4844`, and `arkworks`), then compiles to **WebAssembly** and exports a stable **C99 ABI** (`primitives.h` / `libprimitives_c`) consumed by TypeScript, Bun Native FFI, and any language with a C FFI.

| Layer | Source / Output | Consumers |
| --- | --- | --- |
| **Core** | `packages/voltaire-zig` (Zig 0.17.1 + `blst` / `c-kzg-4844` / `arkworks`) | Native Zig packages (`@tevm/zig`), ZEVM |
| **WebAssembly** | `primitives.wasm` + per-module `crypto/*.wasm` | `@tevm/voltaire/wasm` (Browser, Node, Bun, Deno) |
| **C99 ABI** | `zig-out/include/primitives.h` + `libprimitives_c.{so,dylib,a}` | `@tevm/voltaire/native` (Bun FFI) and C / C++ / Rust / Go / Python / Swift |

## Published Packages

| Package | Directory | Description |
| --- | --- | --- |
| `@tevm/voltaire` | [`packages/voltaire-ts`](./packages/voltaire-ts) | Branded TypeScript primitives, cryptography, and EVM; Pure TS, WASM, and Bun Native FFI entrypoints |
| `@tevm/zig` | [`packages/voltaire-zig`](./packages/voltaire-zig) | Core Zig 0.17 primitives, cryptography, precompiles, WASM reactor binaries, and C ABI |

## Quick Start (TypeScript)

```bash
pnpm add @tevm/voltaire
```

```typescript
import { Address, Wei } from '@tevm/voltaire';
import { Abi } from '@tevm/voltaire/Abi';
import { Keccak256 } from '@tevm/voltaire/Keccak256';

// Branded 20-byte Uint8Array — validated once at construction
const to = Address('0xd8da6bf26964af9d7eed9e03e53415d37aa96045');
Address.toChecksummed(to); // "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"

// Compile-time denomination safety (Wei ≠ Gwei ≠ Ether)
const amount = Wei(1_000_000_000_000_000_000n);
Wei.toEther(amount); // "1"

// Selectors and ABI encoding
const selector = Keccak256.selector('transfer(address,uint256)');
const erc20 = Abi([
  {
    type: 'function',
    name: 'transfer',
    stateMutability: 'nonpayable',
    inputs: [
      { type: 'address', name: 'to' },
      { type: 'uint256', name: 'amount' },
    ],
    outputs: [{ type: 'bool' }],
  },
] as const);

const calldata = erc20.encode('transfer', [to.toHex(), amount]);
```

Swap backends with a single synchronous import change (no `await` boilerplate in Node/Bun; call `await initWasm()` once in browsers):

```typescript
import { Keccak256, Secp256k1 } from '@tevm/voltaire/wasm';   // Zig WASM (337 kB raw / 117 kB gz; 3.1 kB keccak256.wasm)
import { Keccak256, Secp256k1 } from '@tevm/voltaire/native'; // Sync Zig Native FFI (13 crypto modules)
```

## Quick Start (Zig 0.17.1 — Zero Rust Required)

```bash
zig fetch --save git+https://github.com/evmts/voltaire
```

The Zig core compiles out of the box with **only Zig 0.17.1** (pure-Zig BN254 + `blst` + `c-kzg-4844` + ARMv8.2/portable Keccak). Optional Rust `arkworks` / `keccak-asm` wrappers remain available via `-Dwith-rust=true`.

## C FFI Recipes (C, C++, Rust, Go, Python, Swift)

Download a prebuilt release tarball (`libprimitives_c`, `primitives.h`, `voltaire.pc`) from GitHub Releases or build from source:

```bash
git submodule update --init --recursive packages/voltaire-zig/lib/libwally-core
zig build -Dwith-c-api=true -Doptimize=ReleaseFast
# Produces zig-out/include/primitives.h and zig-out/lib/libprimitives_c.{so,dylib,a}
```

See [**`docs/C_FFI_RECIPES.md`**](./docs/C_FFI_RECIPES.md) for copy-paste build, linking, `pkg-config`, and binding recipes in **C/C++, Rust, Go (CGO), Python (`ctypes`), and Swift (SwiftPM)**.

## AI Agent Integration

Connect the hosted MCP server, Context7 docs index (`context7.json`), or Voltaire skills:

```bash
# Claude Code MCP
claude mcp add --transport http voltaire https://voltaire.tevm.sh/mcp

# Claude Code / Codex Skills
git clone https://github.com/evmts/skills ~/.claude/skills/voltaire-skills
```

Machine-readable indexes: [`voltaire.tevm.sh/llms.txt`](https://voltaire.tevm.sh/llms.txt) · [`voltaire.tevm.sh/llms-full.txt`](https://voltaire.tevm.sh/llms-full.txt).

## Dependencies

- **TypeScript:** `@noble/curves`, `@noble/hashes`, `@noble/ciphers`, `@scure/bip32`, `@scure/bip39`, `@adraffy/ens-normalize`, `abitype` (optional peer) — zero `ox`, zero `@tevm/chains`, zero UI deps
- **Native / WASM (default, zero Rust):** `blst`, `c-kzg-4844` (plus optional `-Dwith-rust=true` for `ark-bn254` / `ark-bls12-381` / `keccak-asm`)

## Links

- [Documentation](https://voltaire.tevm.sh/) · [Playground](https://playground.tevm.sh/) · [NPM (`@tevm/voltaire`)](https://www.npmjs.com/package/@tevm/voltaire) · [NPM (`@tevm/zig`)](https://www.npmjs.com/package/@tevm/zig)
- [Telegram](https://t.me/+ANThR9bHDLAwMjUx) · [Twitter](https://twitter.com/tevmtools)
- Related: [evmts/guillotine](https://github.com/evmts/guillotine) (EVM execution) · [evmts/compiler](https://github.com/evmts/compiler) (Solidity compilation)

MIT License — see [LICENSE](./LICENSE).
