<div align="center">
  <h1>
    Ethereum primitives and cryptography
    <br/>
    <br/>
    <img width="512" height="512" alt="voltaire-logo" src="https://github.com/user-attachments/assets/409b49cb-113b-4b76-989d-762f6294e26a" />
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

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Complete API Reference](#complete-api-reference)
  - [Core Primitives](#core-primitives)
  - [Cryptography](#cryptography)
  - [Precompiles](#precompiles)
- [Quick Reference Tables](#quick-reference-tables)
- [Architecture](#architecture)
- [Performance](#performance)
- [Testing](#testing)
- [License](#license)
- [Links](#links)
- [Alternatives](#alternatives)

## Features

Voltaire is a modern Ethereum library for TypeScript and Zig similar to [ethers.js](https://docs.ethers.org/v5/api/other/assembly/dialect/) and [viem](https://github.com/wevm/viem).

- **Simple apis** - The minimal close-to-spec apis needed for Ethereum development
- **LLM-Optimized** - API and documentation built and tested to perform well with both LLMs
- **High-performance** - High-performance wasm implementations provided
- **Type-safe** - Branded types provided for opt-in typesafety
- **Zig support** - All functionality offered both in TypeScript and Zig. More languages will be added in future.
- **Feature rich** - Voltaire supports advanced Compilation and EVM execution to TypeScript applications.

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

Or use the Zig API:

```bash
# Install specific version (recommended)
zig fetch --save https://github.com/evmts/voltaire/archive/refs/tags/v0.1.0.tar.gz

# Install latest from main branch
zig fetch --save git+https://github.com/evmts/voltaire
```

## Quick Start

This library uses a **data-first architecture** with branded primitive types and namespaced methods:

```typescript
import { Address, Hash, Uint, Keccak256 } from "@tevm/voltaire";

// Address operations
const addr = Address("0xa0cf798816d4b9b9866b5330eea46a18382f251e");
const checksum = Address.toChecksummed(addr);
const isZero = Address.isZero.call(addr);

// Hash operations
const data = new Uint8Array([1, 2, 3]);
const hash = Keccak256.hash(data);
const hashHex = Hash.toHex.call(hash);

// Uint arithmetic
const a = Uint.from(0x100);
const b = Uint.from(0x200);
const sum = Uint.plus.call(a, b);
```

### Benefits

- **Tree-shaking**: Only methods you use are included in your bundle
- **Zero overhead**: No class instances, just primitives with type safety
- **Interop**: Easy to serialize, works seamlessly with other libraries
- **Performance**: Direct function calls, no prototype chain lookup

## Complete API Reference

### Core Primitives

**Essential Types:**

| Primitive | Description | Key Features |
|-----------|-------------|--------------|
| **[Address](./src/content/docs/primitives/address/index.mdx)** | 20-byte Ethereum address | EIP-55 checksums, CREATE/CREATE2 calculation, validation |
| **[Hash](./src/content/docs/primitives/hash/index.mdx)** | 32-byte hash type | Constant-time operations, random generation, formatting |
| **[Hex](./src/content/docs/primitives/hex/index.mdx)** | Hexadecimal encoding | Sized types, manipulation, conversion, validation |
| **[Uint](./src/content/docs/primitives/uint/index.mdx)** | 256-bit unsigned integer | Wrapping arithmetic, bitwise operations, comparisons |
| **[Transaction](./src/content/docs/primitives/transaction/index.mdx)** | All transaction types | Legacy, EIP-1559, EIP-4844, EIP-7702, serialization |
| **[RLP](./src/content/docs/primitives/rlp/index.mdx)** | Recursive Length Prefix | Encoding/decoding for Ethereum data structures |
| **[ABI](./src/content/docs/primitives/abi/index.mdx)** | Contract interface encoding | Functions, events, errors, constructors |
| **[Signature](./src/primitives/Signature/)** | ECDSA signatures | Secp256k1, P-256, Ed25519, canonical normalization |
| **[PrivateKey](./src/primitives/PrivateKey/)** | 32-byte private key | Key derivation, signing, address generation |
| **[PublicKey](./src/primitives/PublicKey/)** | 64-byte public key | Uncompressed format, verification, address derivation |
| **[Nonce](./src/primitives/Nonce/)** | Transaction nonce | Increment, conversion, transaction ordering |
| **[ChainId](./src/primitives/ChainId/)** | Network identifier | Mainnet, testnets, L2s (Optimism, Arbitrum, Base, etc.) |

**Advanced Primitives:** [AccessList](./src/content/docs/primitives/accesslist/index.mdx), [Authorization](./src/content/docs/primitives/authorization/index.mdx), [Blob](./src/content/docs/primitives/blob/index.mdx), [Bytecode](./src/content/docs/primitives/bytecode/index.mdx), [EventLog](./src/content/docs/primitives/eventlog/index.mdx), [FeeMarket](./src/content/docs/primitives/feemarket/index.mdx), [GasConstants](./src/content/docs/primitives/gasconstants/index.mdx), [Hardfork](./src/content/docs/primitives/hardfork/index.mdx), [Opcode](./src/content/docs/primitives/opcode/index.mdx), [SIWE](./src/content/docs/primitives/siwe/index.mdx), [State](./src/content/docs/primitives/state/index.mdx), [Base64](./src/content/docs/primitives/base64/index.mdx), [BinaryTree](./src/content/docs/primitives/binarytree/index.mdx), [BloomFilter](./src/content/docs/primitives/bloomfilter/index.mdx), [Chain](./src/content/docs/primitives/chain/index.mdx), [Denomination](./src/content/docs/primitives/denomination/index.mdx)

**Quick Example:**

```typescript
import { Address, Uint, Keccak256 } from "@tevm/voltaire";

// Address operations
const addr = Address("0xa0cf798816d4b9b9866b5330eea46a18382f251e");
const checksum = Address.toChecksummed(addr);

// Uint arithmetic
const a = Uint.from(0x100);
const b = Uint.from(0x200);
const sum = Uint.plus.call(a, b);

// Hashing
const hash = Keccak256.hash(new Uint8Array([1, 2, 3]));
```

---

### Cryptography

**Core Algorithms:**

| Algorithm | Purpose | Key Operations |
|-----------|---------|----------------|
| **[Keccak256](./src/content/docs/crypto/keccak256/index.mdx)** | Primary Ethereum hash function | Address derivation, function selectors, event topics |
| **[Secp256k1](./src/content/docs/crypto/secp256k1/index.mdx)** | ECDSA transaction signing | Sign, verify, recover public key, address derivation |
| **[EIP-712](./src/content/docs/crypto/eip712/index.mdx)** | Typed structured data signing | Domain separation, type hashing, signature verification |
| **[BN254](./src/content/docs/crypto/bn254/index.mdx)** | zkSNARK verification (alt_bn128) | G1/G2 point operations, pairing checks for zero-knowledge proofs |
| **[KZG](./src/content/docs/crypto/kzg/index.mdx)** | EIP-4844 blob commitments | Polynomial commitments, trusted setup, proof generation/verification |
| **[BIP-39](./src/content/docs/crypto/bip39/index.mdx)** | Mnemonic phrases | 12/24-word mnemonics, seed derivation (PBKDF2) |
| **[HDWallet](./src/content/docs/crypto/hdwallet/index.mdx)** | Hierarchical deterministic wallets | BIP-32 key derivation, BIP-44 multi-account paths |

**Additional Algorithms:** [SHA256](./src/content/docs/crypto/sha256/index.mdx), [RIPEMD160](./src/content/docs/crypto/ripemd160/index.mdx), [Blake2](./src/content/docs/crypto/blake2/index.mdx), [Ed25519](./src/content/docs/crypto/ed25519/index.mdx), [X25519](./src/content/docs/crypto/x25519/index.mdx), [P256](./src/content/docs/crypto/p256/index.mdx), [AES-GCM](./src/content/docs/crypto/aes-gcm/index.mdx)

**Quick Example:**

```typescript
import { Keccak256, Secp256k1, HDWallet, Bip39 } from "@tevm/voltaire";

// Signing
const privateKey = Secp256k1.generatePrivateKey();
const messageHash = Keccak256.hashString("Hello, Ethereum!");
const signature = Secp256k1.sign(messageHash, privateKey);

// HD Wallet
const mnemonic = Bip39.generateMnemonic(256);
const seed = await Bip39.mnemonicToSeed(mnemonic);
const root = HDWallet.fromSeed(seed);
const account = HDWallet.deriveEthereum(root, 0, 0); // m/44'/60'/0'/0/0
```

---

### Precompiles

All 19 EVM precompiled contracts (addresses 0x01-0x13): ecrecover, sha256, ripemd160, identity, modexp, BN254 add/mul/pairing, blake2f, KZG point evaluation (EIP-4844), BLS12-381 operations (EIP-2537, Prague+).

**Usage:**

```typescript
import { isPrecompile, execute } from "@tevm/voltaire/precompiles";

const isPrecompile = isPrecompile(address, "cancun");
const result = execute(address, input, gasLimit, "cancun");
```

📚 **[Full precompile documentation](./src/content/docs/precompiles/)**

---

## Quick Reference Tables

### Primitive Types

| Type        | Size     | Description              | Key Methods                                    |
| ----------- | -------- | ------------------------ | ---------------------------------------------- |
| Address     | 20 bytes | Ethereum address         | from, toChecksummed, calculateCreate2Address   |
| Hash        | 32 bytes | 32-byte hash             | from, toHex, equals                            |
| Hex         | Variable | Hex encoding             | fromBytes, toBytes, concat, slice              |
| Uint        | 32 bytes | 256-bit unsigned int     | from, plus, minus, times, dividedBy            |
| Signature   | 64 bytes | ECDSA signature          | from, toCompact, verify, normalize             |
| PrivateKey  | 32 bytes | Private key              | from, toPublicKey, toAddress, sign             |
| PublicKey   | 64 bytes | Public key               | from, fromPrivateKey, toAddress, verify        |
| Nonce       | Variable | Transaction nonce        | from, toNumber, toBigInt, increment            |
| ChainId     | 4 bytes  | Network identifier       | from, toNumber, equals, isMainnet              |
| RLP         | Variable | RLP encoding             | encode, decode                                 |
| Transaction | Variable | Ethereum transactions    | serialize, deserialize, hash, from             |
| ABI         | Variable | ABI encoding             | Function.encode, Event.decode                  |

### Crypto Functions

| Function          | Input                   | Output         | Use Case                            |
| ----------------- | ----------------------- | -------------- | ----------------------------------- |
| Keccak256.hash    | Uint8Array              | 32-byte Hash   | General hashing, contract addresses |
| Secp256k1.sign    | Hash, PrivateKey        | Signature      | Sign transactions/messages          |
| Secp256k1.recover | Signature, Hash         | PublicKey      | Recover signer address              |
| Ed25519.sign      | Message, SecretKey      | Signature      | EdDSA signatures                    |
| X25519.scalarmult | SecretKey, PublicKey    | SharedSecret   | ECDH key exchange                   |
| P256.sign         | Hash, PrivateKey        | Signature      | NIST P-256 signatures               |
| P256.ecdh         | PrivateKey, PublicKey   | SharedSecret   | P-256 ECDH                          |
| EIP712.hash       | Domain, Types, Message  | Hash           | Typed data signing                  |
| SHA256.hash       | Uint8Array              | 32-byte hash   | Bitcoin compatibility               |
| RIPEMD160.hash    | Uint8Array              | 20-byte hash   | Bitcoin addresses                   |
| Blake2.hash       | Uint8Array, size?       | 1-64 byte hash | Zcash compatibility                 |
| BN254.pairing     | Point pairs             | boolean        | zkSNARK verification                |
| KZG.verify        | Blob, Commitment, Proof | boolean        | EIP-4844 blob verification          |
| Bip39.generate    | strength                | Mnemonic       | Mnemonic phrase generation          |
| HDWallet.derive   | Key, Path               | ExtendedKey    | BIP-32/BIP-44 key derivation        |
| AesGcm.encrypt    | Data, Key, Nonce        | Ciphertext     | Authenticated encryption            |


## Architecture

### Data-First Pattern

All primitives follow a consistent data-first pattern:

```typescript
// Data types are branded primitives (Uint8Array, bigint, string)
type Address = Uint8Array & { readonly __tag: "Address" };
type Hash = Uint8Array & { readonly __brand: symbol };
type Uint = bigint & { readonly __brand: symbol };
type Hex = `0x${string}`;

// Methods are namespaced and use .call() for instance methods
const addr = Address("0x...");
const hex = Address.toHex.call(addr);
const checksum = Address.toChecksummed(addr);

// No classes, no instances, just branded primitives
// Perfect for tree-shaking and serialization
```

### Benefits

1. **Tree-shaking**: Only methods you use are bundled
2. **Zero overhead**: No class instances, just primitives
3. **Serialization**: Primitives serialize naturally to JSON
4. **Interop**: Works seamlessly with other libraries
5. **Type safety**: TypeScript brands ensure type correctness
6. **Performance**: Direct function calls, no prototype chain

---

## Performance

All implementations optimized for production use:

- **Native/WASM**: Optional native bindings via Zig for 2-10x speedup
- **Audited crypto**: @noble/curves, c-kzg-4844 for security
- **Zero dependencies**: Core TypeScript has zero runtime deps
- **Minimal bundle**: Tree-shakeable, only pay for what you use

Benchmark results available in each primitive's bench.ts file.

---

## Testing

Comprehensive test coverage:

- 300+ tests for Address
- Cross-validation against viem, ethers.js
- EIP compliance test vectors
- Fuzzing for edge cases

Run tests:

```bash
bun test                    # All tests
bun test address            # Specific primitive
zig build test             # Zig implementation
```

---

## License

MIT License - see [LICENSE](./LICENSE) for details

---

## Links

- [GitHub Issues](https://github.com/evmts/voltaire/issues)
- [Telegram](https://t.me/+ANThR9bHDLAwMjUx)
- [Twitter](https://twitter.com/tevmtools)

---

## Alternatives

- [Viem](https://viem.sh) - Popular TypeScript Ethereum library
- [Ethers.js](https://docs.ethers.org/) - Comprehensive Ethereum library
- [Alloy](https://github.com/alloy-rs/alloy) - High-performance Rust library (Zig FFI integration available)
