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

- [Features](#features) - Why choose Voltaire
- [Installation](#installation) - [npm](https://www.npmjs.com/package/@tevm/voltaire) & [Zig](https://ziglang.org/) setup
- [Quick Start](#quick-start) - [Getting Started Guide](./src/content/docs/getting-started.mdx)
- [Complete API Reference](#complete-api-reference) - Full API documentation
  - [Core Primitives](#core-primitives) - Address, Hash, Uint, Transaction, etc.
  - [Cryptography](#cryptography) - Keccak256, Secp256k1, BLS12-381, etc.
  - [Precompiles](#precompiles) - [All 19 EVM precompiles](https://www.evm.codes/precompiled)
- [Quick Reference Tables](#quick-reference-tables) - At-a-glance API reference
- [Architecture](#architecture) - [Data-first pattern](./src/content/docs/primitives/branded-types.mdx) & design
- [Performance](#performance) - [Benchmarks](./BENCHMARKING.md) & optimization
- [Alternatives](#alternatives) - Viem, Ethers.js, Alloy
- [License](#license) - MIT
- [Links](#links) - Community & resources

## Features

> ⚠️ **Alpha Release** - This library is under active development. APIs may change. Not recommended for production use yet.

Voltaire is a modern [Ethereum](https://ethereum.org/) library for [TypeScript](https://www.typescriptlang.org/) and [Zig](https://ziglang.org/) similar to [ethers.js](https://docs.ethers.org/) and [viem](https://viem.sh).

- **Simple APIs** - The minimal close-to-spec APIs needed for [Ethereum development](https://ethereum.org/en/developers/)
- **LLM-Optimized** - API and documentation built and tested to perform well with LLMs
- **High-performance** - High-performance [WASM](https://webassembly.org/) implementations provided
- **Type-safe** - [Branded types](./src/content/docs/primitives/branded-types.mdx) provided for opt-in typesafety
- **Zig support** - All functionality offered both in TypeScript and [Zig](https://ziglang.org/). More languages will be added in future.
- **Feature rich** - Voltaire supports advanced Compilation and [EVM](https://ethereum.org/en/developers/docs/evm/) execution to TypeScript applications.

## Installation

```bash
npm install @tevm/voltaire
```

[![npm version](https://img.shields.io/npm/v/@tevm/voltaire.svg)](https://www.npmjs.com/package/@tevm/voltaire)

```bash
bun add @tevm/voltaire  # https://bun.sh/
```

```bash
pnpm install @tevm/voltaire  # https://pnpm.io/
```

Or use the [Zig](https://ziglang.org/) API ([Zig docs](https://ziglang.org/documentation/0.15.1/)):

```bash
# Install specific version (recommended)
zig fetch --save https://github.com/evmts/voltaire/archive/refs/tags/v0.1.0.tar.gz

# Install latest from main branch
zig fetch --save git+https://github.com/evmts/voltaire
```

See [build.zig.zon](./build.zig.zon) for dependency configuration.

## Quick Start

📚 **See [Getting Started Guide](./src/content/docs/getting-started.mdx) for detailed tutorials**

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

## Architecture

### Data-First Pattern

All primitives follow a consistent [data-first pattern](./src/content/docs/primitives/branded-types.mdx) for optimal tree-shaking and zero-overhead abstraction:

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

## Complete API Reference

### Core Primitives

**Essential Types:**

| Primitive | Description | Key Features |
|-----------|-------------|--------------|
| **[Address](./src/content/docs/primitives/address/index.mdx)** | 20-byte Ethereum address | [EIP-55](https://eips.ethereum.org/EIPS/eip-55) checksums, [CREATE/CREATE2](https://eips.ethereum.org/EIPS/eip-1014) calculation, validation |
| **[Hash](./src/content/docs/primitives/hash/index.mdx)** | 32-byte hash type | Constant-time operations, random generation, formatting |
| **[Hex](./src/content/docs/primitives/hex/index.mdx)** | Hexadecimal encoding | Sized types, manipulation, conversion, validation |
| **[Uint](./src/content/docs/primitives/uint/index.mdx)** | 256-bit unsigned integer | Wrapping arithmetic, bitwise operations, comparisons |
| **[Transaction](./src/content/docs/primitives/transaction/index.mdx)** | All transaction types | [Legacy](https://ethereum.org/en/developers/docs/transactions/), [EIP-1559](https://eips.ethereum.org/EIPS/eip-1559), [EIP-4844](https://eips.ethereum.org/EIPS/eip-4844), [EIP-7702](https://eips.ethereum.org/EIPS/eip-7702), serialization |
| **[RLP](./src/content/docs/primitives/rlp/index.mdx)** | Recursive Length Prefix | Encoding/decoding for [Ethereum data structures](https://ethereum.org/en/developers/docs/data-structures-and-encoding/rlp/) |
| **[ABI](./src/content/docs/primitives/abi/index.mdx)** | Contract interface encoding | Functions, events, errors, constructors ([ABI spec](https://docs.soliditylang.org/en/latest/abi-spec.html)) |
| **[Signature](./src/primitives/Signature/)** | ECDSA signatures | [Secp256k1](https://en.bitcoin.it/wiki/Secp256k1), [P-256](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.186-5.pdf), [Ed25519](https://ed25519.cr.yp.to/), canonical normalization |
| **[PrivateKey](./src/primitives/PrivateKey/)** | 32-byte private key | Key derivation, signing, address generation |
| **[PublicKey](./src/primitives/PublicKey/)** | 64-byte public key | Uncompressed format, verification, address derivation |
| **[Nonce](./src/primitives/Nonce/)** | Transaction nonce | Increment, conversion, transaction ordering |
| **[ChainId](./src/content/docs/primitives/chain/index.mdx)** | Network identifier | Mainnet, testnets, L2s (Optimism, Arbitrum, Base, etc.) |

**Advanced Primitives:** [AccessList](./src/primitives/AccessList/index.mdx) ([EIP-2930](https://eips.ethereum.org/EIPS/eip-2930)), [Authorization](./src/primitives/Authorization/index.mdx) ([EIP-7702](https://eips.ethereum.org/EIPS/eip-7702)), [Blob](./src/primitives/Blob/index.mdx) ([EIP-4844](https://eips.ethereum.org/EIPS/eip-4844)), [Bytecode](./src/content/docs/primitives/bytecode/index.mdx), [EventLog](./src/primitives/EventLog/index.mdx), [FeeMarket](./src/primitives/FeeMarket/index.mdx) ([EIP-1559](https://eips.ethereum.org/EIPS/eip-1559)), [GasConstants](./src/primitives/GasConstants/index.mdx) ([Yellow Paper](https://ethereum.github.io/yellowpaper/paper.pdf)), [Hardfork](./src/primitives/Hardfork/index.mdx), [Opcode](./src/primitives/Opcode/index.mdx) ([EVM Codes](https://www.evm.codes/)), [SIWE](./src/primitives/Siwe/index.mdx) ([EIP-4361](https://eips.ethereum.org/EIPS/eip-4361)), [State](./src/primitives/State/index.mdx), [Base64](./src/content/docs/primitives/base64/index.mdx) ([RFC 4648](https://datatracker.ietf.org/doc/html/rfc4648)), [BinaryTree](./src/content/docs/primitives/binarytree/index.mdx) ([Merkle Trees](https://ethereum.org/en/developers/docs/data-structures-and-encoding/patricia-merkle-trie/)), [BloomFilter](./src/content/docs/primitives/bloomfilter/index.mdx), [Chain](./src/content/docs/primitives/chain/index.mdx), [Denomination](./src/content/docs/primitives/denomination/index.mdx)

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
| **[Keccak256](./src/content/docs/crypto/keccak256/index.mdx)** | Primary Ethereum hash function ([FIPS 202](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.202.pdf)) | Address derivation, function selectors, event topics |
| **[Secp256k1](./src/content/docs/crypto/secp256k1/index.mdx)** | ECDSA transaction signing ([SEC 2](https://www.secg.org/sec2-v2.pdf)) | Sign, verify, recover public key, address derivation |
| **[EIP-712](./src/content/docs/crypto/eip712/index.mdx)** | Typed structured data signing ([EIP-712](https://eips.ethereum.org/EIPS/eip-712)) | Domain separation, type hashing, signature verification |
| **BN254** | zkSNARK verification ([alt_bn128](https://eips.ethereum.org/EIPS/eip-196)) | G1/G2 point operations, pairing checks for zero-knowledge proofs |
| **KZG** | EIP-4844 blob commitments ([EIP-4844](https://eips.ethereum.org/EIPS/eip-4844)) | Polynomial commitments, trusted setup, proof generation/verification |
| **[BIP-39](./src/content/docs/crypto/bip39/index.mdx)** | Mnemonic phrases ([BIP-39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki)) | 12/24-word mnemonics, seed derivation (PBKDF2) |
| **[HDWallet](./src/content/docs/crypto/hdwallet/index.mdx)** | Hierarchical deterministic wallets ([BIP-32](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki), [BIP-44](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki)) | Key derivation, multi-account paths |

**Additional Algorithms:** [SHA256](./src/content/docs/crypto/sha256/index.mdx) ([FIPS 180-4](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.180-4.pdf)), [RIPEMD160](./src/content/docs/crypto/ripemd160/index.mdx) ([RIPEMD-160](https://homes.esat.kuleuven.be/~bosselae/ripemd160.html)), [Blake2](./src/content/docs/crypto/blake2/index.mdx) ([RFC 7693](https://datatracker.ietf.org/doc/html/rfc7693)), [Ed25519](./src/content/docs/crypto/ed25519/index.mdx) ([RFC 8032](https://datatracker.ietf.org/doc/html/rfc8032)), [X25519](./src/content/docs/crypto/x25519/index.mdx) ([RFC 7748](https://datatracker.ietf.org/doc/html/rfc7748)), [P256](./src/content/docs/crypto/p256/index.mdx) ([FIPS 186-5](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.186-5.pdf)), [AES-GCM](./src/content/docs/crypto/aesgcm/index.mdx) ([NIST SP 800-38D](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf))

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

All 19 EVM precompiled contracts (addresses [0x01-0x13](https://www.evm.codes/precompiled)):

- **[ecrecover](https://eips.ethereum.org/EIPS/eip-196)** (0x01) - ECDSA public key recovery
- **sha256** (0x02) - SHA-256 hash function
- **ripemd160** (0x03) - RIPEMD-160 hash function
- **identity** (0x04) - Identity function (datacopy)
- **[modexp](https://eips.ethereum.org/EIPS/eip-198)** (0x05) - Modular exponentiation
- **[BN254 add/mul/pairing](https://eips.ethereum.org/EIPS/eip-196)** (0x06-0x08, [EIP-197](https://eips.ethereum.org/EIPS/eip-197)) - zkSNARK verification
- **[blake2f](https://eips.ethereum.org/EIPS/eip-152)** (0x09) - Blake2 compression function
- **[KZG point evaluation](https://eips.ethereum.org/EIPS/eip-4844)** (0x0A) - EIP-4844 blob verification
- **[BLS12-381 operations](https://eips.ethereum.org/EIPS/eip-2537)** (0x0B-0x13) - BLS signature verification (Prague+)

**Usage:**

```typescript
import { isPrecompile, execute } from "@tevm/voltaire/precompiles";

const isPrecompile = isPrecompile(address, "cancun");
const result = execute(address, input, gasLimit, "cancun");
```

📚 **[Full precompile documentation](./src/content/docs/precompiles/)** | **[EVM.codes Precompiles](https://www.evm.codes/precompiled)** | **[Ethereum Precompile Spec](https://ethereum.github.io/execution-specs/autoapi/ethereum/frontier/vm/precompiled_contracts/index.html)**

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
| KZG.verify        | Blob, Commitment, Proof | boolean        | [EIP-4844](https://eips.ethereum.org/EIPS/eip-4844) blob verification          |
| Bip39.generate    | strength                | Mnemonic       | [BIP-39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki) mnemonic generation          |
| HDWallet.derive   | Key, Path               | ExtendedKey    | [BIP-32](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki)/[BIP-44](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki) key derivation        |
| AesGcm.encrypt    | Data, Key, Nonce        | Ciphertext     | [AES-GCM](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf) authenticated encryption            |

---

## Performance

All implementations optimized for production use:

- **Native/WASM**: Optional native bindings via [Zig](https://ziglang.org/) for 2-10x speedup
- **Audited crypto**: [@noble/curves](https://github.com/paulmillr/noble-curves), [c-kzg-4844](https://github.com/ethereum/c-kzg-4844), [blst](https://github.com/supranational/blst) for security
- **Minimal bundle**: Tree-shakeable, only pay for what you use

Benchmark results available in [BENCHMARKING.md](./BENCHMARKING.md) and each primitive's bench.ts file.

---

## Alternatives

- **[Viem](https://viem.sh)** - Popular TypeScript Ethereum library with modular design ([GitHub](https://github.com/wevm/viem))
- **[Ethers.js](https://docs.ethers.org/)** - Comprehensive Ethereum library ([GitHub](https://github.com/ethers-io/ethers.js))
- **[Alloy](https://github.com/alloy-rs/alloy)** - High-performance Rust library (Zig FFI integration available)
- **[@noble/curves](https://github.com/paulmillr/noble-curves)** - Audited cryptographic library for pure JS implementations
- **[Web3.js](https://web3js.org/)** - Original Ethereum JavaScript library ([GitHub](https://github.com/web3/web3.js))
---

## License

MIT License - see [LICENSE](./LICENSE) for details

---

## Links

### Community
- [GitHub Repository](https://github.com/evmts/voltaire) - Source code and contributions
- [GitHub Issues](https://github.com/evmts/voltaire/issues) - Bug reports and feature requests
- [NPM Package](https://www.npmjs.com/package/@tevm/voltaire) - Package registry
- [Telegram](https://t.me/+ANThR9bHDLAwMjUx) - Community chat
- [Twitter](https://twitter.com/tevmtools) - Updates and announcements

### Resources
- [Ethereum Developer Documentation](https://ethereum.org/en/developers/docs/)
- [EIP Repository](https://eips.ethereum.org/) - Ethereum Improvement Proposals
- [EVM.codes](https://www.evm.codes/) - Opcode reference
- [Ethereum Yellow Paper](https://ethereum.github.io/yellowpaper/paper.pdf) - Technical specification
- [Solidity Documentation](https://docs.soliditylang.org/) - Smart contract language
- [Zig Documentation](https://ziglang.org/documentation/0.15.1/) - Zig language reference

