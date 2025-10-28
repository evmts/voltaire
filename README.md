<div align="center">
  <h1>
    Ethereum primitives and cryptography
    <br/>
    <br/>
    <img width="240" height="240" alt="image" src="https://github.com/user-attachments/assets/492fabbc-d8d0-4f5b-b9f5-ea05adc5f8ca" />
  </h1>
  <sup>
    <a href="https://www.npmjs.com/package/@tevm/voltaire">
       <img src="https://img.shields.io/npm/v/@tevm/voltaire.svg" alt="npm version" />
    </a>
    <a href="https://github.com/evmts/voltaire">
       <img src="https://img.shields.io/badge/zig-0.15.1+-orange.svg" alt="zig version" />
    </a>
    <a href="https://github.com/evmts/voltaire/actions/workflows/ci.yml">
      <img src="https://github.com/evmts/voltaire/actions/workflows/ci.yml/badge.svg" alt="CI status" />
    </a>
    <a href="https://github.com/evmts/voltaire/blob/main/LICENSE">
      <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" />
    </a>
  </sup>
</div>

## Features

- **Simple apis** - The minimal apis needed for Ethereum development
- **Data-first architecture** - Branded primitive types with namespaced methods for optimal tree-shaking
- **All platforms** - Works in any JavaScript environment (Node.js, Bun, Deno, browsers)
- **High-performance** - High-performance Zig and rust implementations available to TypeScript projects
- **Type-safe** - Full TypeScript support with comprehensive type definitions
- **Zig support** - All primitives offered both in TypeScript and [Zig](./ZIG_API.md)

## Installation

```bash
npm install @tevm/voltaire
```

```bash
bun add @tevm/voltaire
```

```bash
pnpm install @tevm/voltaire
```

Or use the [zig api](./ZIG_API.md)

```bash
# Install specific version (recommended)
zig fetch --save https://github.com/evmts/voltaire/archive/refs/tags/v0.1.0.tar.gz

# Install latest from main branch
zig fetch --save git+https://github.com/evmts/voltaire
```

## Quick Start

This library uses a **data-first architecture** with branded primitive types and namespaced methods:

```typescript
import { Address, Hash, Uint, Keccak256 } from '@tevm/voltaire';

// Address operations
const addr = Address.fromHex('0xa0cf798816d4b9b9866b5330eea46a18382f251e');
const checksum = Address.toChecksumHex.call(addr);
const isZero = Address.isZero.call(addr);

// Hash operations
const data = new Uint8Array([1, 2, 3]);
const hash = Keccak256.hash(data);
const hashHex = Hash.toHex.call(hash);

// Uint arithmetic
const a = Uint.fromHex('0x100');
const b = Uint.fromHex('0x200');
const sum = Uint.plus.call(a, b);
```

### Benefits

- **Tree-shaking**: Only methods you use are included in your bundle
- **Zero overhead**: No class instances, just primitives with type safety
- **Interop**: Easy to serialize, works seamlessly with other libraries
- **Performance**: Direct function calls, no prototype chain lookup

## What's Included

### TypeScript/JavaScript API

This library provides complete implementations of Ethereum primitives and cryptographic operations. All crypto implementations use audited libraries (@noble, c-kzg-4844, BLST) for production safety.

- [**TypeScript/JavaScript API**](#typescript-javascript-api) — Complete primitives and crypto implementations

  **Core Primitives:**
  - [Address](./src/primitives/address.ts) — 20-byte Ethereum address with EIP-55 checksumming (`fromHex`, `toChecksumHex`, `calculateCreateAddress`, `calculateCreate2Address`)
  - [Hash](./src/primitives/hash.ts) — 32-byte Keccak-256 hash type (`keccak256`, `keccak256String`, constant-time comparison)
  - [Hex](./src/primitives/hex.ts) — Hexadecimal encoding/decoding (`fromBytes`, `toBytes`, `concat`, `slice`, `pad`, `trim`)
  - [Uint](./src/primitives/uint.ts) — 256-bit unsigned integer (`from`, `plus`, `minus`, `times`, `dividedBy`, full arithmetic)
  - [RLP](./src/primitives/rlp.ts) — Recursive Length Prefix encoding (`encode`, `decode`, nested lists, depth protection)
  - [ABI](./src/primitives/abi.ts) — ABI encoding/decoding with full abitype integration (`encodeParameters`, `decodeParameters`, `Function`, `Event`, `Error` namespaces)
  - [Transaction](./src/primitives/transaction.ts) — All transaction types (Legacy, EIP-1559, EIP-2930, EIP-4844, EIP-7702) with serialization
  - [AccessList](./src/primitives/access-list.ts) — EIP-2930 access lists with gas calculations
  - [Authorization](./src/primitives/authorization.ts) — EIP-7702 set code authorization
  - [Blob](./src/primitives/blob.ts) — EIP-4844 blob transaction utilities with gas calculations
  - [Bytecode](./src/primitives/bytecode.ts) — EVM bytecode analysis with JUMPDEST detection
  - [EventLog](./src/primitives/event-log.ts) — Event log parsing and filtering
  - [FeeMarket](./src/primitives/fee-market.ts) — EIP-1559 & EIP-4844 fee calculations
  - [GasConstants](./src/primitives/gas-constants.ts) — EVM gas cost constants
  - [Hardfork](./src/primitives/hardfork.ts) — Network upgrade tracking
  - [Opcode](./src/primitives/opcode.ts) — EVM opcode definitions with gas costs and metadata
  - [SIWE](./src/primitives/siwe.ts) — EIP-4361 Sign-In with Ethereum message parsing
  - [State](./src/primitives/state.ts) — State constants (`EMPTY_CODE_HASH`, `EMPTY_TRIE_ROOT`, storage keys)

  **Cryptography** (using audited @noble libraries):
  - [Keccak256](./src/crypto/keccak256.ts) — Primary Ethereum hash function
  - [Secp256k1](./src/crypto/secp256k1.ts) — ECDSA signatures (sign, verify, recover, derive public key)
  - [EIP-712](./src/crypto/eip712.ts) — Typed structured data signing (hash, sign, verify, recover)
  - [SHA256](./src/crypto/sha256.ts) — SHA-256 hash with incremental hashing
  - [RIPEMD160](./src/crypto/ripemd160.ts) — RIPEMD-160 hash
  - [Blake2](./src/crypto/blake2.ts) — BLAKE2b hash with variable output lengths
  - [BN254](./src/crypto/bn254.ts) — BN254/alt_bn128 elliptic curve (G1, G2, pairing operations)
  - [KZG](./src/crypto/kzg.ts) — KZG commitments for EIP-4844 (via c-kzg-4844 library)
      <br/>
      <br/>
- [**Precompiles**](#precompiles) — All 19 EVM precompiled contracts
  - [Precompile Execution](./src/precompiles/precompiles.ts) — Gas cost calculations and dispatch
    - [`isPrecompile(address, hardfork)`](./src/precompiles/precompiles.ts#L42) — check if address is precompile for hardfork
    - [`execute(address, input, gasLimit, hardfork)`](./src/precompiles/precompiles.ts#L116) — execute precompile and return result
    - Individual precompile functions (gas calculations only, crypto requires native bindings):
      - [`ecrecover(input, gasLimit)`](./src/precompiles/precompiles.ts#L196) — 0x01: Recover signer from ECDSA signature (3000 gas)
      - [`sha256(input, gasLimit)`](./src/precompiles/precompiles.ts#L216) — 0x02: SHA-256 hash (60 + 12/word gas)
      - [`ripemd160(input, gasLimit)`](./src/precompiles/precompiles.ts#L233) — 0x03: RIPEMD-160 hash (600 + 120/word gas)
      - [`identity(input, gasLimit)`](./src/precompiles/precompiles.ts#L254) — 0x04: Identity/copy (15 + 3/word gas)
      - [`modexp(input, gasLimit)`](./src/precompiles/precompiles.ts#L274) — 0x05: Modular exponentiation (200 gas base)
      - [`bn254Add(input, gasLimit)`](./src/precompiles/precompiles.ts#L293) — 0x06: BN254 elliptic curve addition (150 gas)
      - [`bn254Mul(input, gasLimit)`](./src/precompiles/precompiles.ts#L313) — 0x07: BN254 scalar multiplication (6000 gas)
      - [`bn254Pairing(input, gasLimit)`](./src/precompiles/precompiles.ts#L333) — 0x08: BN254 pairing check (45000 + 34000k gas)
      - [`blake2f(input, gasLimit)`](./src/precompiles/precompiles.ts#L354) — 0x09: Blake2b compression (rounds gas)
      - [`pointEvaluation(input, gasLimit)`](./src/precompiles/precompiles.ts#L380) — 0x0a: KZG point evaluation for EIP-4844 (50000 gas)
      - BLS12-381 precompiles (EIP-2537, active from Prague hardfork):
        - [`bls12G1Add(input, gasLimit)`](./src/precompiles/precompiles.ts#L399) — 0x0b: G1 addition (500 gas)
        - [`bls12G1Mul(input, gasLimit)`](./src/precompiles/precompiles.ts#L418) — 0x0c: G1 multiplication (12000 gas)
        - [`bls12G1Msm(input, gasLimit)`](./src/precompiles/precompiles.ts#L438) — 0x0d: G1 multi-scalar multiplication (12000k gas)
        - [`bls12G2Add(input, gasLimit)`](./src/precompiles/precompiles.ts#L457) — 0x0e: G2 addition (800 gas)
        - [`bls12G2Mul(input, gasLimit)`](./src/precompiles/precompiles.ts#L476) — 0x0f: G2 multiplication (45000 gas)
        - [`bls12G2Msm(input, gasLimit)`](./src/precompiles/precompiles.ts#L495) — 0x10: G2 multi-scalar multiplication (45000k gas)
        - [`bls12Pairing(input, gasLimit)`](./src/precompiles/precompiles.ts#L515) — 0x11: Pairing check (115000 + 23000k gas)
        - [`bls12MapFpToG1(input, gasLimit)`](./src/precompiles/precompiles.ts#L535) — 0x12: Map field element to G1 (5500 gas)
        - [`bls12MapFp2ToG2(input, gasLimit)`](./src/precompiles/precompiles.ts#L554) — 0x13: Map field element to G2 (75000 gas)

For the complete Zig API with low-level implementations, see [ZIG_API.md](./ZIG_API.md).

## License

MIT License - see [LICENSE](./LICENSE) for details

## Alternatives

- [Viem](https://viem.sh) - A highly popular JavaScript ethereum library
- [Ethers]()

## Dependencies

This library has **zero runtime dependencies** for the TypeScript/JavaScript API. All functionality is provided through:

- **WASM bindings** — Self-contained WebAssembly module compiled from Zig (82KB)
- **Native FFI** — Optional native bindings via Bun FFI or Node.js `ffi-napi` for better performance

### Optional Dependencies

- `ffi-napi` ^4.0.3 — Node.js FFI bindings (optional, for native performance in Node.js)
- `ref-napi` ^3.0.3 — Node.js FFI type helpers (optional, for native bindings)

These are marked as `optionalDependencies` and are only needed if using native FFI mode in Node.js. Bun provides built-in FFI support.

## Dev Dependencies

### Build Tools

- **Zig 0.15.1+** — Systems programming language for native implementations ([download](https://ziglang.org/download/))
- **Cargo (Rust)** — Required for building Rust crypto dependencies ([install](https://www.rust-lang.org/tools/install))
- **TypeScript 5.7.2** — Type checking and compilation
- **Bun** — Fast JavaScript runtime with built-in FFI support

### Testing & Benchmarking

- **Vitest 2.1.8** — Fast unit test framework
- **Mitata 1.0.34** — High-precision benchmarking

### Code Quality

- **Biome 1.9.4** — Fast linter and formatter for TypeScript/JavaScript
- **TypeScript** — Static type checking

### Comparison Libraries (for testing/benchmarks)

- **Viem 2.21.54** — Reference Ethereum library
- **Ethers 6.13.4** — Reference Ethereum library
- **@noble/curves 2.0.1** — Reference elliptic curve implementations
- **@noble/hashes 2.0.1** — Reference hash implementations

### Additional Tools

- **glob 11.0.0** — File pattern matching
- **bindings 1.5.0** — Helper for loading native modules

## Links

- [GitHub Issues](https://github.com/evmts/voltaire/issues)
- [Telegram](https://t.me/+ANThR9bHDLAwMjUx)
- [Twitter](https://twitter.com/tevmtools)
