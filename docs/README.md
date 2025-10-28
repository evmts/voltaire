**@tevm/primitives**

***

<div align="center">
  <h1>
    Ethereum primitives and cryptography
    <br/>
    <br/>
    <img width="240" height="240" alt="image" src="https://github.com/user-attachments/assets/492fabbc-d8d0-4f5b-b9f5-ea05adc5f8ca" />
  </h1>
  <sup>
    <a href="https://www.npmjs.com/package/@tevm/primitives">
       <img src="https://img.shields.io/npm/v/@tevm/primitives.svg" alt="npm version" />
    </a>
    <a href="https://github.com/evmts/primitives">
       <img src="https://img.shields.io/badge/zig-0.15.1+-orange.svg" alt="zig version" />
    </a>
    <a href="https://github.com/evmts/primitives/actions/workflows/ci.yml">
      <img src="https://github.com/evmts/primitives/actions/workflows/ci.yml/badge.svg" alt="CI status" />
    </a>
    <a href="https://github.com/evmts/primitives/blob/main/LICENSE">
      <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" />
    </a>
  </sup>
</div>

## Features

- **Simple apis** - The minimal apis needed for Ethereum development
- **All platforms** - Works in any JavaScript environment (Node.js, Bun, Deno, browsers)
- **High-performance** - High-performance Zig and rust implementations available to TypeScript projects
- **Type-safe** - Full TypeScript support with comprehensive type definitions
- **Zig support** - All primitives offered both in TypeScript and [Zig](./ZIG_API.md)

## Installation

```bash
npm install @tevm/primitives
```

```bash
bun add @tevm/primitives
```

```bash
pnpm install @tevm/primitives
```

Or use the [zig api](./ZIG_API.md)

```bash
# Install specific version (recommended)
zig fetch --save https://github.com/evmts/primitives/archive/refs/tags/v0.1.0.tar.gz

# Install latest from main branch
zig fetch --save git+https://github.com/evmts/primitives
```

## What's Included

### TypeScript/JavaScript API

This library provides both WASM and native FFI implementations for browser and Node.js/Bun environments. The API is split across multiple modules for different use cases.

**Legend**: 🚧 Partial implementation (stubs for signing/verification, requires C API completion)

- [**WASM Primitives**](#wasm-primitives) — High-performance WebAssembly bindings
  - [`Address`](./src/typescript/wasm/primitives/address.wasm.ts) — Ethereum address type with EIP-55 checksumming
    - [`Address.fromHex(hex)`](./src/typescript/wasm/primitives/address.wasm.ts#L27) — create address from hex string
    - [`Address.fromBytes(bytes)`](./src/typescript/wasm/primitives/address.wasm.ts#L37) — create from 20-byte buffer
    - [`toHex()`](./src/typescript/wasm/primitives/address.wasm.ts#L45) — convert to lowercase hex string
    - [`toChecksumHex()`](./src/typescript/wasm/primitives/address.wasm.ts#L53) — convert to EIP-55 checksummed hex
    - [`isZero()`](./src/typescript/wasm/primitives/address.wasm.ts#L61) — check if zero address (0x0000...0000)
    - [`equals(other)`](./src/typescript/wasm/primitives/address.wasm.ts#L70) — compare addresses for equality
    - [`Address.validateChecksum(hex)`](./src/typescript/wasm/primitives/address.wasm.ts#L79) — validate EIP-55 checksum
    - [`Address.calculateCreateAddress(sender, nonce)`](./src/typescript/wasm/primitives/address.wasm.ts#L89) — compute CREATE contract address
    - [`Address.calculateCreate2Address(sender, salt, initCode)`](./src/typescript/wasm/primitives/address.wasm.ts#L101) — compute CREATE2 contract address
  - [`Hash`](./src/typescript/wasm/primitives/keccak.wasm.ts) — Keccak-256 hash type with constant-time comparison
    - [`Hash.keccak256(data)`](./src/typescript/wasm/primitives/keccak.wasm.ts#L26) — compute Keccak-256 hash
    - [`Hash.fromHex(hex)`](./src/typescript/wasm/primitives/keccak.wasm.ts#L39) — create from 32-byte hex string
    - [`Hash.fromBytes(bytes)`](./src/typescript/wasm/primitives/keccak.wasm.ts#L49) — create from 32-byte buffer
    - [`toHex()`](./src/typescript/wasm/primitives/keccak.wasm.ts#L57) — convert to hex string (66 chars: "0x" + 64 hex)
    - [`equals(other)`](./src/typescript/wasm/primitives/keccak.wasm.ts#L66) — constant-time hash comparison
    - [`keccak256(data)`](./src/typescript/wasm/primitives/keccak.wasm.ts#L92) — compute hash and return hex string
    - [`eip191HashMessage(message)`](./src/typescript/wasm/primitives/keccak.wasm.ts#L102) — EIP-191 personal message hash
  - [Hash Algorithms](./src/typescript/wasm/primitives/hash.wasm.ts) — Additional cryptographic hash functions
    - [`sha256(data)`](./src/typescript/wasm/primitives/hash.wasm.ts#L13) — SHA-256 hash (32 bytes)
    - [`ripemd160(data)`](./src/typescript/wasm/primitives/hash.wasm.ts#L30) — RIPEMD-160 hash (20 bytes)
    - [`blake2b(data)`](./src/typescript/wasm/primitives/hash.wasm.ts#L47) — BLAKE2b hash (64 bytes)
    - [`solidityKeccak256(packedData)`](./src/typescript/wasm/primitives/hash.wasm.ts#L64) — Solidity-style Keccak-256
    - [`soliditySha256(packedData)`](./src/typescript/wasm/primitives/hash.wasm.ts#L79) — Solidity-style SHA-256
  - [Hex Utilities](./src/typescript/wasm/primitives/hex.wasm.ts) — Hexadecimal encoding/decoding
    - `hexToBytes(hex)` — convert hex string to Uint8Array
    - `bytesToHex(bytes)` — convert bytes to hex string with 0x prefix
  - [RLP Encoding](./src/typescript/wasm/primitives/rlp.wasm.ts) — Recursive Length Prefix serialization
    - `rlpEncodeBytes(bytes)` — encode byte array to RLP format
    - `rlpEncodeUint(value)` — encode unsigned integer to RLP
    - `rlpEncodeUintFromBigInt(value)` — encode BigInt to RLP
    - `rlpToHex(data)` — encode data to hex string
    - `rlpFromHex(hex)` — decode RLP from hex string
  - [Bytecode Analysis](./src/typescript/wasm/primitives/bytecode.wasm.ts) — EVM bytecode utilities with jump destination analysis
    - `analyzeJumpDestinations(bytecode)` — find all valid JUMPDEST positions
    - `isValidJumpDest(bytecode, position)` — check if position is valid JUMPDEST
    - `validateBytecode(bytecode)` — validate bytecode structure
    - `isBytecodeBoundary(bytecode, position)` — check if at opcode boundary
  - [Signatures (secp256k1)](./src/typescript/wasm/primitives/signature.wasm.ts) — ECDSA signature operations
    - `secp256k1RecoverPubkey(hash, signature)` — recover 64-byte public key from signature
    - `secp256k1RecoverAddress(hash, signature)` — recover address from signature and hash
    - `secp256k1PubkeyFromPrivate(privateKey)` — derive public key from private key
    - `secp256k1ValidateSignature(signature)` — validate signature format and components
    - `signatureNormalize(signature)` — normalize signature to canonical form (low-s)
    - `signatureIsCanonical(signature)` — check if signature is canonical
    - `signatureParse(signature)` — parse signature into r, s, v components
    - `signatureSerialize(r, s, v)` — serialize components into 65-byte signature
  - [Transactions](./src/typescript/wasm/primitives/transaction.wasm.ts) — Transaction type detection
    - `detectTransactionType(data)` — detect type from raw transaction data
    - `TransactionType` — enum (Legacy, EIP1559, EIP2930, EIP4844, EIP7702)
  - [U256 Operations](./src/typescript/wasm/primitives/uint256.wasm.ts) — 256-bit unsigned integer utilities
    - `u256FromHex(hex)` — parse hex string to u256 bytes
    - `u256ToHex(bytes)` — convert u256 bytes to hex string
    - `u256FromBigInt(value)` — convert BigInt to u256 bytes
    - `u256ToBigInt(bytes)` — convert u256 bytes to BigInt
  - [Wallet](./src/typescript/wasm/primitives/wallet.wasm.ts) — Key generation utilities
    - `generatePrivateKey()` — generate cryptographically secure random private key
    - `compressPublicKey(publicKey)` — compress 64-byte public key to 33-byte format
      <br/>
      <br/>
- [**Cryptography (Native FFI)**](#cryptography) — Native Zig implementations via FFI
  - 🚧 [Keccak-256](_media/keccak.ts) — Primary Ethereum hash function
    - [`keccak256(data)`](_media/keccak.ts#L53) — compute Keccak-256 hash via native FFI
    - [`keccak256Empty()`](_media/keccak.ts#L95) — pre-computed empty hash constant
  - 🚧 [EIP-191](_media/eip191.ts) — Personal message signing (EIP-191: Signed Data Standard)
    - [`hashMessage(message)`](_media/eip191.ts#L42) — hash with "\x19Ethereum Signed Message:\n{length}" prefix
    - [`signMessage(message, privateKey)`](_media/eip191.ts#L87) — sign message (stub, requires C API)
    - [`verifyMessage(message, signature, address)`](_media/eip191.ts#L105) — verify signature (stub, requires C API)
    - [`recoverMessageAddress(message, signature)`](_media/eip191.ts#L123) — recover signer (stub, requires C API)
  - 🚧 [EIP-712](_media/eip712.ts) — Typed structured data signing (⚠️ UNAUDITED in Zig)
    - [`hashTypedData(typedData)`](_media/eip712.ts#L223) — hash typed data (keccak256("\x19\x01" ‖ domainSeparator ‖ hashStruct))
    - [`hashDomain(domain)`](_media/eip712.ts#L186) — compute EIP-712 domain separator hash
    - [`signTypedData(typedData, privateKey)`](_media/eip712.ts#L246) — sign typed data (stub, requires C API)
    - [`verifyTypedData(typedData, signature, address)`](_media/eip712.ts#L264) — verify signature (stub, requires C API)
    - [`recoverTypedDataAddress(typedData, signature)`](_media/eip712.ts#L282) — recover signer (stub, requires C API)
  - 🚧 [Hash Algorithms](_media/hash-algorithms.ts) — Additional hash functions (stubs, require C API)
    - `sha256(data)` — SHA-256 hash
    - `ripemd160(data)` — RIPEMD-160 hash
    - `blake2b(data)` — BLAKE2b hash
  - 🚧 [secp256k1](_media/secp256k1.ts) — Elliptic curve operations (stubs, require C API)
    - Constants: `SECP256K1_P`, `SECP256K1_N`, `SECP256K1_Gx`, `SECP256K1_Gy`
    - Point operations: `isOnCurve`, `add`, `double`, `multiply`, `negate`
    - `extractRecoveryId(signature)` — extract v from signature
      <br/>
      <br/>
- [**Ethereum Types**](#ethereum-types) — Standard TypeScript interfaces
  - [Base Types](_media/base-types.ts) — Common type aliases
    - `Address` — 20-byte Ethereum address (`0x${string}`)
    - `Bytes`, `Bytes32`, `Bytes256` — Variable and fixed-length byte arrays
    - `Hash32` — 32-byte hash (transaction/block hash)
    - `Uint`, `Uint64`, `Uint256` — Unsigned integers as hex strings
    - `BlockTag`, `BlockNumber`, `BlockIdentifier` — Block reference types
  - [TransactionInfo](_media/transaction-info.ts) — All transaction types (Legacy, EIP-1559, EIP-2930, EIP-4844, EIP-7702)
  - [ReceiptInfo](_media/receipt-info.ts) — Transaction receipt with logs and status
  - [Log](_media/log.ts) — Event log with topics and data
  - [Block](_media/block.ts) — Block header and body structures
  - [Filter](_media/filter.ts) — Event filter criteria for eth_getLogs
  - [Withdrawal](_media/withdrawal.ts) — EIP-4895 beacon chain withdrawal data
    <br/>
    <br/>
- [**Precompiles**](#precompiles) — All 19 EVM precompiled contracts
  - [Precompile Execution](@tevm/namespaces/precompiles/README.md) — Gas cost calculations and dispatch
    - [`isPrecompile(address, hardfork)`](@tevm/namespaces/precompiles/README.md) — check if address is precompile for hardfork
    - [`execute(address, input, gasLimit, hardfork)`](@tevm/namespaces/precompiles/README.md) — execute precompile and return result
    - Individual precompile functions (gas calculations only, crypto requires native bindings):
      - [`ecrecover(input, gasLimit)`](@tevm/namespaces/precompiles/README.md) — 0x01: Recover signer from ECDSA signature (3000 gas)
      - [`sha256(input, gasLimit)`](@tevm/namespaces/precompiles/README.md) — 0x02: SHA-256 hash (60 + 12/word gas)
      - [`ripemd160(input, gasLimit)`](@tevm/namespaces/precompiles/README.md) — 0x03: RIPEMD-160 hash (600 + 120/word gas)
      - [`identity(input, gasLimit)`](@tevm/namespaces/precompiles/README.md) — 0x04: Identity/copy (15 + 3/word gas)
      - [`modexp(input, gasLimit)`](@tevm/namespaces/precompiles/README.md) — 0x05: Modular exponentiation (200 gas base)
      - [`bn254Add(input, gasLimit)`](@tevm/namespaces/precompiles/README.md) — 0x06: BN254 elliptic curve addition (150 gas)
      - [`bn254Mul(input, gasLimit)`](@tevm/namespaces/precompiles/README.md) — 0x07: BN254 scalar multiplication (6000 gas)
      - [`bn254Pairing(input, gasLimit)`](@tevm/namespaces/precompiles/README.md) — 0x08: BN254 pairing check (45000 + 34000k gas)
      - [`blake2f(input, gasLimit)`](@tevm/namespaces/precompiles/README.md) — 0x09: Blake2b compression (rounds gas)
      - [`pointEvaluation(input, gasLimit)`](@tevm/namespaces/precompiles/README.md) — 0x0a: KZG point evaluation for EIP-4844 (50000 gas)
      - BLS12-381 precompiles (EIP-2537, active from Prague hardfork):
        - [`bls12G1Add(input, gasLimit)`](@tevm/namespaces/precompiles/README.md) — 0x0b: G1 addition (500 gas)
        - [`bls12G1Mul(input, gasLimit)`](@tevm/namespaces/precompiles/README.md) — 0x0c: G1 multiplication (12000 gas)
        - [`bls12G1Msm(input, gasLimit)`](@tevm/namespaces/precompiles/README.md) — 0x0d: G1 multi-scalar multiplication (12000k gas)
        - [`bls12G2Add(input, gasLimit)`](@tevm/namespaces/precompiles/README.md) — 0x0e: G2 addition (800 gas)
        - [`bls12G2Mul(input, gasLimit)`](@tevm/namespaces/precompiles/README.md) — 0x0f: G2 multiplication (45000 gas)
        - [`bls12G2Msm(input, gasLimit)`](@tevm/namespaces/precompiles/README.md) — 0x10: G2 multi-scalar multiplication (45000k gas)
        - [`bls12Pairing(input, gasLimit)`](@tevm/namespaces/precompiles/README.md) — 0x11: Pairing check (115000 + 23000k gas)
        - [`bls12MapFpToG1(input, gasLimit)`](@tevm/namespaces/precompiles/README.md) — 0x12: Map field element to G1 (5500 gas)
        - [`bls12MapFp2ToG2(input, gasLimit)`](@tevm/namespaces/precompiles/README.md) — 0x13: Map field element to G2 (75000 gas)

For the complete Zig API with low-level implementations, see [ZIG_API.md](./ZIG_API.md).

## License

MIT License - see [LICENSE](_media/LICENSE) for details

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

- [GitHub Issues](https://github.com/evmts/primitives/issues)
- [Telegram](https://t.me/+ANThR9bHDLAwMjUx)
- [Twitter](https://twitter.com/tevmtools)
