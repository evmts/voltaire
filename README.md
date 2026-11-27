<div align="center">
  <h1>Voltaire</h1>
  <p><strong>Type-safe Ethereum primitives, cryptography, and EVM execution — written in Zig and TypeScript, with a C ABI for any language.</strong></p>
  <p><a href="https://voltaire.tevm.sh"><img width="240" height="240" alt="Voltaire logo" src="https://github.com/user-attachments/assets/409b49cb-113b-4b76-989d-762f6294e26a" /></a></p>
  <p><a href="https://www.npmjs.com/package/@tevm/voltaire"><img src="https://img.shields.io/npm/v/@tevm/voltaire.svg" alt="npm version" /></a> <a href="https://github.com/evmts/voltaire"><img src="https://img.shields.io/badge/zig-0.17.1-orange.svg" alt="Zig 0.17.1" /></a> <a href="https://github.com/evmts/voltaire/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/evmts/voltaire/ci.yml?label=CI" alt="CI status" /></a> <a href="https://github.com/evmts/voltaire/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" /></a></p>
  <p><a href="https://voltaire.tevm.sh"><strong>Docs</strong></a> · <a href="https://playground.tevm.sh"><strong>Live Playground</strong></a> · <a href="https://smithers.sh/evmts/voltaire"><strong>Smithers Factory</strong></a> · <a href="https://github.com/evmts/voltaire/blob/main/docs/C_FFI_RECIPES.md"><strong>C FFI Recipes</strong></a></p>
</div>

## Architecture

Voltaire implements Ethereum primitives, cryptography, and EVM execution once in **Zig 0.17**, then compiles to **WebAssembly** and exports a stable **C ABI** (`primitives.h` / `libprimitives_c`) consumed by TypeScript/Bun and any language with a C FFI.

```text
packages/voltaire-zig (Zig 0.17.1 Core + blst / c-kzg-4844 / arkworks)
  ├── WebAssembly (.wasm) ──────────► @tevm/voltaire/wasm (Browser, Node, Bun, Deno)
  └── C99 ABI (libprimitives_c) ────► @tevm/voltaire/native (Bun Native FFI)
                                 └──► C / C++ / Rust / Go / Python / Swift
```

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

Swap backends with a single import change:

```typescript
import { Keccak256, Secp256k1 } from '@tevm/voltaire/wasm';   // Browser, Node, Bun, Deno
import { Keccak256, Secp256k1 } from '@tevm/voltaire/native'; // Bun Native FFI
```

## C FFI Recipes (C, C++, Rust, Go, Python, Swift)

Build the native C ABI shared library and auto-generated header directly from Zig:

```bash
git submodule update --init --recursive packages/voltaire-zig/lib/libwally-core
zig build -Dwith-c-api=true -Doptimize=ReleaseFast
# Produces zig-out/include/primitives.h and zig-out/lib/libprimitives_c.{so,dylib,a}
```

See [**`docs/C_FFI_RECIPES.md`**](./docs/C_FFI_RECIPES.md) for copy-paste build, linking, and binding recipes in **C/C++, Rust, Go (CGO), Python (`ctypes`), and Swift (SwiftPM)**.

## AI Agent Integration

Connect the hosted MCP server or install Voltaire skills:

```bash
# Claude Code MCP
claude mcp add --transport http voltaire https://voltaire.tevm.sh/mcp

# Claude Code / Codex Skills
git clone https://github.com/evmts/skills ~/.claude/skills/voltaire-skills
```

Machine-readable indexes: [`voltaire.tevm.sh/llms.txt`](https://voltaire.tevm.sh/llms.txt) · [`voltaire.tevm.sh/llms-full.txt`](https://voltaire.tevm.sh/llms-full.txt).

## Dependencies

- **TypeScript:** `@noble/curves`, `@noble/hashes`, `@noble/ciphers`, `@scure/bip32`, `@scure/bip39`, `@adraffy/ens-normalize`, `ox`, `@tevm/chains`, `abitype` (optional peer)
- **Native / WASM:** `blst`, `c-kzg-4844`, `ark-bn254`, `ark-bls12-381`

## Links

- [Documentation](https://voltaire.tevm.sh/) · [Playground](https://playground.tevm.sh/) · [NPM (`@tevm/voltaire`)](https://www.npmjs.com/package/@tevm/voltaire) · [NPM (`@tevm/zig`)](https://www.npmjs.com/package/@tevm/zig)
- [Telegram](https://t.me/+ANThR9bHDLAwMjUx) · [Twitter](https://twitter.com/tevmtools)
- Related: [evmts/guillotine](https://github.com/evmts/guillotine) (EVM execution) · [evmts/compiler](https://github.com/evmts/compiler) (Solidity compilation)

MIT License — see [LICENSE](./LICENSE).
