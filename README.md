<div align="center">
  <h1>
    Ethereum primitives and cryptography
    <br/>
    <br/>
    <a href="https://voltaire.tevm.sh">
      <img width="512" height="512" alt="voltaire-logo" src="https://github.com/user-attachments/assets/409b49cb-113b-4b76-989d-762f6294e26a" />
    </a>
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

> ⚠️ **Alpha Release** - This library is under active development. APIs may change. Not recommended for production use yet.

Voltaire is a modern [Ethereum](https://ethereum.org/) library with [Zig](https://ziglang.org/), [TypeScript](https://www.typescriptlang.org/), and C-FFI support.

- **Simple APIs** - The minimal close-to-spec APIs needed for [Ethereum development](https://ethereum.org/en/developers/)
- **LLM-Optimized** - API and documentation built and tested to perform well with LLMs
- **High-performance** - Opt-in [WASM](https://webassembly.org/) implementations for performance-critical operations
- **Type-safe** - [Branded types](https://voltaire.tevm.sh/primitives/branded-types/) provided for opt-in typesafety
- **Multi-language** - Currently supports TypeScript and [Zig](https://ziglang.org/). Additional languages planned (see Language Support Wishlist below).

## Get Started

📚 **[Installation Guide](https://voltaire.tevm.sh/getting-started/)** | **[Quick Start Tutorial](https://voltaire.tevm.sh/quick-start/)** | **[API Documentation](https://voltaire.tevm.sh/)**

## Complete API Reference

> **Note:** Voltaire focuses on Ethereum primitives and cryptography. For additional functionality:
>
> - **JSON-RPC/Provider**: [evmts/chappe](https://github.com/evmts/chappe) - Provider and JSON-RPC client library
> - **EVM Execution**: [evmts/guillotine](https://github.com/evmts/guillotine) - EVM-related functionality
> - **Solidity Compilation**: [evmts/compiler](https://github.com/evmts/compiler) - Solidity compilation support
> - **Unified Library**: [evmts/tevm-monorepo](https://github.com/evmts/tevm-monorepo) - Complete Tevm ecosystem

### Core Primitives

| Primitive                                                                      | Description                    | Key Features                                                                                                                                                                                                                                  |
| ------------------------------------------------------------------------------ | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **[ABI](https://voltaire.tevm.sh/primitives/abi/)**                           | Contract interface encoding    | Functions, events, errors, constructors ([ABI spec](https://docs.soliditylang.org/en/latest/abi-spec.html))                                                                                                                                   |
| **[AccessList](https://voltaire.tevm.sh/primitives/accesslist/)**             | EIP-2930 access list           | [EIP-2930](https://eips.ethereum.org/EIPS/eip-2930) transaction access lists                                                                                                                                                                  |
| **[Address](https://voltaire.tevm.sh/primitives/address/)**                   | 20-byte Ethereum address       | [EIP-55](https://eips.ethereum.org/EIPS/eip-55) checksums, [CREATE/CREATE2](https://eips.ethereum.org/EIPS/eip-1014) calculation, validation                                                                                                  |
| **[Authorization](https://voltaire.tevm.sh/primitives/authorization/)**       | EIP-7702 authorization         | [EIP-7702](https://eips.ethereum.org/EIPS/eip-7702) account abstraction authorizations                                                                                                                                                        |
| **[Base64](https://voltaire.tevm.sh/primitives/base64/)**                     | Base64 encoding                | [RFC 4648](https://datatracker.ietf.org/doc/html/rfc4648) encoding/decoding                                                                                                                                                                   |
| **[BinaryTree](https://voltaire.tevm.sh/primitives/binarytree/)**             | Binary tree structures         | [Merkle trees](https://ethereum.org/en/developers/docs/data-structures-and-encoding/patricia-merkle-trie/)                                                                                                                                    |
| **[Blob](https://voltaire.tevm.sh/primitives/blob/)**                         | EIP-4844 blob                  | [EIP-4844](https://eips.ethereum.org/EIPS/eip-4844) blob transactions                                                                                                                                                                         |
| **[BloomFilter](https://voltaire.tevm.sh/primitives/bloomfilter/)**           | Bloom filter                   | Log bloom filters                                                                                                                                                                                                                             |
| **[Bytecode](https://voltaire.tevm.sh/primitives/bytecode/)**                 | Contract bytecode              | EVM bytecode manipulation, deployment                                                                                                                                                                                                         |
| **[Bytes](https://voltaire.tevm.sh/primitives/bytes/)**                       | Fixed-size byte arrays         | Typed byte sequences, conversion utilities                                                                                                                                                                                                    |
| **[Chain](https://voltaire.tevm.sh/primitives/chain/)**                       | Chain configuration            | Network configuration, chain parameters                                                                                                                                                                                                       |
| **[ChainId](https://voltaire.tevm.sh/primitives/chain/)**                     | Network identifier             | Mainnet, testnets, L2s (Optimism, Arbitrum, Base, etc.)                                                                                                                                                                                       |
| **[Denomination](https://voltaire.tevm.sh/primitives/denomination/)**         | Ether denominations            | Wei, gwei, ether conversions                                                                                                                                                                                                                  |
| **[Ens](https://voltaire.tevm.sh/primitives/ens/)**                           | ENS name normalization         | [ENSIP-15](https://docs.ens.domains/ensip/15) normalization, beautification, validation                                                                                                                                                       |
| **[EventLog](https://voltaire.tevm.sh/primitives/eventlog/)**                 | Transaction event log          | Event parsing, filtering, decoding                                                                                                                                                                                                            |
| **[FeeMarket](https://voltaire.tevm.sh/primitives/feemarket/)**               | Fee market calculations        | [EIP-1559](https://eips.ethereum.org/EIPS/eip-1559) base fee, priority fee                                                                                                                                                                    |
| **[GasConstants](https://voltaire.tevm.sh/primitives/gasconstants/)**         | EVM gas costs                  | [Yellow Paper](https://ethereum.github.io/yellowpaper/paper.pdf) gas constants                                                                                                                                                                |
| **[Hardfork](https://voltaire.tevm.sh/primitives/hardfork/)**                 | Network hardfork               | Hardfork detection, feature flags                                                                                                                                                                                                             |
| **[Hash](https://voltaire.tevm.sh/primitives/hash/)**                         | 32-byte hash type              | Constant-time operations, random generation, formatting                                                                                                                                                                                       |
| **[Hex](https://voltaire.tevm.sh/primitives/hex/)**                           | Hexadecimal encoding           | Sized types, manipulation, conversion, validation                                                                                                                                                                                             |
| **[Nonce](https://voltaire.tevm.sh/primitives/nonce/)**                       | Transaction nonce              | Increment, conversion, transaction ordering                                                                                                                                                                                                   |
| **[Opcode](https://voltaire.tevm.sh/primitives/opcode/)**                     | EVM opcodes                    | [EVM.codes](https://www.evm.codes/) opcode reference                                                                                                                                                                                          |
| **[PrivateKey](https://voltaire.tevm.sh/primitives/privatekey/)**             | 32-byte private key            | Key derivation, signing, address generation                                                                                                                                                                                                   |
| **[PublicKey](https://voltaire.tevm.sh/primitives/publickey/)**               | 64-byte public key             | Uncompressed format, verification, address derivation                                                                                                                                                                                         |
| **[RLP](https://voltaire.tevm.sh/primitives/rlp/)**                           | Recursive Length Prefix        | Encoding/decoding for [Ethereum data structures](https://ethereum.org/en/developers/docs/data-structures-and-encoding/rlp/)                                                                                                                   |
| **[Signature](https://voltaire.tevm.sh/primitives/signature/)**               | ECDSA signatures               | [Secp256k1](https://en.bitcoin.it/wiki/Secp256k1), [P-256](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.186-5.pdf), [Ed25519](https://ed25519.cr.yp.to/), canonical normalization, recovery                                              |
| **[SIWE](https://voltaire.tevm.sh/primitives/siwe/)**                         | Sign-In with Ethereum          | [EIP-4361](https://eips.ethereum.org/EIPS/eip-4361) authentication                                                                                                                                                                            |
| **[State](https://voltaire.tevm.sh/primitives/state/)**                       | State management               | Account state, storage slots                                                                                                                                                                                                                  |
| **[StorageKey](https://voltaire.tevm.sh/primitives/storagekey/)**             | Storage slot identifier        | Account storage addressing                                                                                                                                                                                                                    |
| **[Transaction](https://voltaire.tevm.sh/primitives/transaction/)**           | All transaction types          | [Legacy](https://ethereum.org/en/developers/docs/transactions/), [EIP-1559](https://eips.ethereum.org/EIPS/eip-1559), [EIP-4844](https://eips.ethereum.org/EIPS/eip-4844), [EIP-7702](https://eips.ethereum.org/EIPS/eip-7702), serialization |
| **[Trie](https://voltaire.tevm.sh/primitives/trie/)**                         | Merkle Patricia Trie           | State trie, storage trie implementations                                                                                                                                                                                                      |
| **[TypedData](https://voltaire.tevm.sh/primitives/typeddata/)**               | EIP-712 typed data             | Domain separation, type hashing, structured data signing                                                                                                                                                                                      |
| **[Uint](https://voltaire.tevm.sh/primitives/uint/)**                         | 256-bit unsigned integer       | Wrapping arithmetic, bitwise operations, comparisons                                                                                                                                                                                          |

---

### Cryptography

**Core Algorithms:**

| Algorithm                                                | Purpose                                                                                                                                                                                 | Key Operations                                                       |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| **[Keccak256](https://voltaire.tevm.sh/crypto/keccak256/)** | Primary Ethereum hash function ([FIPS 202](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.202.pdf))                                                                                   | Address derivation, function selectors, event topics                 |
| **[Secp256k1](https://voltaire.tevm.sh/crypto/secp256k1/)** | ECDSA transaction signing ([SEC 2](https://www.secg.org/sec2-v2.pdf))                                                                                                                   | Sign, verify, recover public key, address derivation                 |
| **[EIP-712](https://voltaire.tevm.sh/crypto/eip712/)**      | Typed structured data signing ([EIP-712](https://eips.ethereum.org/EIPS/eip-712))                                                                                                       | Domain separation, type hashing, signature verification              |
| **[BN254](https://voltaire.tevm.sh/crypto/bn254/)**         | zkSNARK verification ([alt_bn128](https://eips.ethereum.org/EIPS/eip-196))                                                                                                              | G1/G2 point operations, pairing checks for zero-knowledge proofs     |
| **[KZG](https://voltaire.tevm.sh/crypto/kzg/)**             | EIP-4844 blob commitments ([EIP-4844](https://eips.ethereum.org/EIPS/eip-4844))                                                                                                         | Polynomial commitments, trusted setup, proof generation/verification |
| **[BIP-39](https://voltaire.tevm.sh/crypto/bip39/)**        | Mnemonic phrases ([BIP-39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki))                                                                                             | 12/24-word mnemonics, seed derivation (PBKDF2)                       |
| **[HDWallet](https://voltaire.tevm.sh/crypto/hdwallet/)**   | Hierarchical deterministic wallets ([BIP-32](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki), [BIP-44](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki)) | Key derivation, multi-account paths                                  |

**Hash Functions:** [SHA256](https://voltaire.tevm.sh/crypto/sha256/) ([FIPS 180-4](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.180-4.pdf)), [RIPEMD160](https://voltaire.tevm.sh/crypto/ripemd160/) ([RIPEMD-160](https://homes.esat.kuleuven.be/~bosselae/ripemd160.html)), [Blake2](https://voltaire.tevm.sh/crypto/blake2/) ([RFC 7693](https://datatracker.ietf.org/doc/html/rfc7693))

**Elliptic Curves:** [Ed25519](https://voltaire.tevm.sh/crypto/ed25519/) ([RFC 8032](https://datatracker.ietf.org/doc/html/rfc8032)), [X25519](https://voltaire.tevm.sh/crypto/x25519/) ([RFC 7748](https://datatracker.ietf.org/doc/html/rfc7748)), [P256](https://voltaire.tevm.sh/crypto/p256/) ([FIPS 186-5](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.186-5.pdf)), [BLS12-381](https://voltaire.tevm.sh/crypto/bls12-381/)

**Encryption:** [AES-GCM](https://voltaire.tevm.sh/crypto/aesgcm/) ([NIST SP 800-38D](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf)), [ChaCha20-Poly1305](https://voltaire.tevm.sh/crypto/chacha20poly1305/) ([RFC 8439](https://datatracker.ietf.org/doc/html/rfc8439))

**Signers:** [PrivateKeySigner](https://voltaire.tevm.sh/crypto/privatekeysigner/) - Key-based transaction signing with HD wallet support

**Security Notice:**

> ⚠️ **Cryptography Implementation Status**
>
> Voltaire provides multiple implementation options for cryptographic operations:
>
> - **Audited (Recommended)**: [@noble/curves](https://github.com/paulmillr/noble-curves), [@noble/hashes](https://github.com/paulmillr/noble-hashes), [arkworks](https://github.com/arkworks-rs), [blst](https://github.com/supranational/blst), [c-kzg](https://github.com/ethereum/c-kzg-4844), [libwally-core](https://github.com/ElementsProject/libwally-core) - Security-audited implementations used by default
> - **Unaudited (Use at own risk)**: Zig-native implementations - Experimental, performance-optimized versions available for testing. **Not recommended for production use with real funds.**
>
> The library defaults to audited implementations. Zig implementations can be enabled via build flags for development/testing purposes.

---

### EVM & Precompiles

Voltaire includes a complete EVM implementation with all 19 precompiled contracts (addresses [0x01-0x13](https://www.evm.codes/precompiled)):

**Precompiles:**
- **[ecrecover](https://voltaire.tevm.sh/precompiles/ecrecover/)** (0x01) - ECDSA public key recovery
- **[sha256](https://voltaire.tevm.sh/precompiles/sha256/)** (0x02) - SHA-256 hash function
- **[ripemd160](https://voltaire.tevm.sh/precompiles/ripemd160/)** (0x03) - RIPEMD-160 hash function
- **[identity](https://voltaire.tevm.sh/precompiles/identity/)** (0x04) - Identity function (datacopy)
- **[modexp](https://voltaire.tevm.sh/precompiles/modexp/)** (0x05) - Modular exponentiation ([EIP-198](https://eips.ethereum.org/EIPS/eip-198))
- **[BN254 add/mul/pairing](https://voltaire.tevm.sh/precompiles/bn254/)** (0x06-0x08) - zkSNARK verification ([EIP-196](https://eips.ethereum.org/EIPS/eip-196), [EIP-197](https://eips.ethereum.org/EIPS/eip-197))
- **[blake2f](https://voltaire.tevm.sh/precompiles/blake2f/)** (0x09) - Blake2 compression function ([EIP-152](https://eips.ethereum.org/EIPS/eip-152))
- **[KZG point evaluation](https://voltaire.tevm.sh/precompiles/point-evaluation/)** (0x0A) - EIP-4844 blob verification ([EIP-4844](https://eips.ethereum.org/EIPS/eip-4844))
- **[BLS12-381 operations](https://voltaire.tevm.sh/precompiles/bls12-381/)** (0x0B-0x13) - BLS signature verification (Prague+, [EIP-2537](https://eips.ethereum.org/EIPS/eip-2537))

**EVM Components:**
- **[Frame](https://voltaire.tevm.sh/evm/frame/)** - Call stack and execution context
- **[Host](https://voltaire.tevm.sh/evm/host/)** - State access interface
- **[Memory](https://voltaire.tevm.sh/evm/memory/)** - EVM memory management
- **[Stack](https://voltaire.tevm.sh/evm/stack/)** - Value stack operations
- **[Storage](https://voltaire.tevm.sh/evm/storage/)** - Contract storage management

📚 **[EVM Documentation](https://voltaire.tevm.sh/evm/)** | **[Precompiles Guide](https://voltaire.tevm.sh/precompiles/)** | **[EVM.codes](https://www.evm.codes/)**

---

## Quick Reference Tables

### Primitive Types

| Type        | Size         | Description           | Key Methods                                  | Subtypes                                   |
| ----------- | ------------ | --------------------- | -------------------------------------------- | ------------------------------------------ |
| Address     | 20 bytes     | Ethereum address      | from, toChecksummed, calculateCreate2Address | Checksummed, Uppercase, Lowercase          |
| Hash        | 32 bytes     | 32-byte hash          | from, toHex, equals                          | -                                          |
| Hex         | Variable     | Hex encoding          | fromBytes, toBytes, concat, slice            | Sized\<N\>, Bytes\<N\>                     |
| Uint        | 32 bytes     | 256-bit unsigned int  | from, plus, minus, times, dividedBy          | Ether, Wei, Gwei                           |
| Signature   | 64 bytes     | ECDSA signature       | from, toCompact, verify, normalize           | -                                          |
| PrivateKey  | 32 bytes     | Private key           | from, toPublicKey, toAddress, sign           | -                                          |
| PublicKey   | 64 bytes     | Public key            | from, fromPrivateKey, toAddress, verify      | -                                          |
| Nonce       | Variable     | Transaction nonce     | from, toNumber, toBigInt, increment          | -                                          |
| ChainId     | 4 bytes      | Network identifier    | from, toNumber, equals, isMainnet            | -                                          |
| RLP         | Variable     | RLP encoding          | encode, decode                               | -                                          |
| Transaction | Variable     | Ethereum transactions | serialize, deserialize, hash, from           | Legacy, EIP2930, EIP1559, EIP4844, EIP7702 |
| ABI         | Variable     | ABI encoding          | Function.encode, Event.decode                | Function, Event, Error, Constructor        |
| Blob        | 131072 bytes | EIP-4844 blob data    | from, toHex, toVersionedHash                 | Commitment, Proof, VersionedHash           |
| Bytecode    | Variable     | Contract bytecode     | from, toHex, getDeployedBytecode             | -                                          |
| BloomFilter | 256 bytes    | Log bloom filter      | from, add, contains                          | -                                          |

### Address Subtypes

| Subtype     | Description                             | Constructor Method      |
| ----------- | --------------------------------------- | ----------------------- |
| Checksummed | EIP-55 checksummed hex address          | Address.toChecksummed() |
| Uppercase   | Uppercase hex address (non-checksummed) | Address.toUppercase()   |
| Lowercase   | Lowercase hex address                   | Address.toLowercase()   |

### Hex Subtypes (Sized Types)

| Subtype         | Size     | Common Use Case          |
| --------------- | -------- | ------------------------ |
| Hex.Bytes\<4\>  | 4 bytes  | Function selectors       |
| Hex.Bytes\<8\>  | 8 bytes  | Uint64 values            |
| Hex.Bytes\<20\> | 20 bytes | Addresses                |
| Hex.Bytes\<32\> | 32 bytes | Hashes, Uint256 values   |
| Hex.Bytes\<N\>  | N bytes  | Custom sized hex strings |

### Denomination Types (Uint Subtypes)

| Type  | Unit | Wei Equivalent      |
| ----- | ---- | ------------------- |
| Ether | ETH  | 1 ether = 10^18 wei |
| Gwei  | gwei | 1 gwei = 10^9 wei   |
| Wei   | wei  | Base unit (1 wei)   |

### Gas Types (Uint Subtypes)

| Type     | Description                         | Common Range        |
| -------- | ----------------------------------- | ------------------- |
| GasPrice | Gas price in wei per gas unit       | 1-1000 gwei typical |
| GasLimit | Maximum gas allowed for transaction | 21000-30M gas       |
| Nonce    | Transaction sequence number         | 0-2^64              |

### Transaction Types

| Type               | EIP                                                 | Description                                   |
| ------------------ | --------------------------------------------------- | --------------------------------------------- |
| TransactionLegacy  | -                                                   | Legacy transaction (pre-EIP-2718)             |
| TransactionEIP2930 | [EIP-2930](https://eips.ethereum.org/EIPS/eip-2930) | Access list transaction                       |
| TransactionEIP1559 | [EIP-1559](https://eips.ethereum.org/EIPS/eip-1559) | Fee market transaction with base/priority fee |
| TransactionEIP4844 | [EIP-4844](https://eips.ethereum.org/EIPS/eip-4844) | Blob transaction (shard blob transactions)    |
| TransactionEIP7702 | [EIP-7702](https://eips.ethereum.org/EIPS/eip-7702) | Set code transaction (account abstraction)    |

### ABI Types

| Type        | Description                        | Key Methods              |
| ----------- | ---------------------------------- | ------------------------ |
| Function    | Function signature and encoding    | encode, decode, selector |
| Event       | Event signature and log parsing    | decode, getTopic         |
| Error       | Custom error encoding              | encode, decode, selector |
| Constructor | Constructor signature and encoding | encode                   |

### Blob Types (EIP-4844)

| Type          | Size         | Description                       |
| ------------- | ------------ | --------------------------------- |
| Blob          | 131072 bytes | Raw blob data                     |
| Commitment    | 48 bytes     | KZG commitment to blob            |
| Proof         | 48 bytes     | KZG proof for blob                |
| VersionedHash | 32 bytes     | Versioned hash of blob commitment |

### State Types

| Type          | Description                                      | Key Methods         |
| ------------- | ------------------------------------------------ | ------------------- |
| State         | Account state with balance, nonce, code, storage | get, set, commit    |
| StorageKey    | Storage slot identifier (address + slot)         | from, toHex         |
| EventLog      | Transaction event log entry                      | decode, matches     |
| AccessList    | EIP-2930 access list for state access            | from, add, contains |
| Authorization | EIP-7702 code delegation authorization           | from, sign, verify  |

### Other Primitive Types

| Type       | Description                            | Key Methods               |
| ---------- | -------------------------------------- | ------------------------- |
| Hardfork   | Network upgrade identifier             | from, isEnabled           |
| ChainId    | Network chain identifier               | from, toNumber, equals    |
| Opcode     | EVM opcode byte                        | from, getName, getGasCost |
| Base64     | Base64 encoded data                    | encode, decode            |
| BinaryTree | Binary tree structure for Merkle trees | from, getRoot, getProof   |

### Cryptographic Types

| Type           | Size      | Description                           | Algorithm   |
| -------------- | --------- | ------------------------------------- | ----------- |
| PrivateKey     | 32 bytes  | Secp256k1 private key                 | Secp256k1   |
| PublicKey      | 64 bytes  | Secp256k1 public key (uncompressed)   | Secp256k1   |
| Signature      | 64 bytes  | ECDSA signature (r, s, v)             | Secp256k1   |
| ExtendedKey    | Variable  | BIP-32 hierarchical deterministic key | BIP-32/44   |
| Mnemonic       | Variable  | BIP-39 mnemonic phrase                | BIP-39      |
| Seed           | 64 bytes  | BIP-39 seed derived from mnemonic     | BIP-39      |
| P256PrivateKey | 32 bytes  | NIST P-256 private key                | P-256       |
| P256PublicKey  | 64 bytes  | NIST P-256 public key                 | P-256       |
| P256Signature  | Variable  | NIST P-256 ECDSA signature            | P-256       |
| G1Point        | 96 bytes  | BN254/BLS12-381 G1 point              | zkSNARK/BLS |
| G2Point        | 192 bytes | BN254/BLS12-381 G2 point              | zkSNARK/BLS |

### Crypto Functions

| Function                     | Input                       | Output         | Use Case                                                                                                                                                         |
| ---------------------------- | --------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Keccak256.hash               | Uint8Array                  | 32-byte Hash   | General hashing, contract addresses                                                                                                                              |
| Secp256k1.sign               | Hash, PrivateKey            | Signature      | Sign transactions/messages                                                                                                                                       |
| Secp256k1.recover            | Signature, Hash             | PublicKey      | Recover signer address                                                                                                                                           |
| Secp256k1.generatePrivateKey | -                           | PrivateKey     | Generate new private key                                                                                                                                         |
| Ed25519.sign                 | Message, SecretKey          | Signature      | EdDSA signatures                                                                                                                                                 |
| Ed25519.verify               | Signature, Message, PubKey  | boolean        | Verify EdDSA signatures                                                                                                                                          |
| X25519.scalarmult            | SecretKey, PublicKey        | SharedSecret   | ECDH key exchange                                                                                                                                                |
| P256.sign                    | Hash, PrivateKey            | Signature      | NIST P-256 signatures                                                                                                                                            |
| P256.verify                  | Signature, Hash, PubKey     | boolean        | Verify P-256 signatures                                                                                                                                          |
| P256.ecdh                    | PrivateKey, PublicKey       | SharedSecret   | P-256 ECDH                                                                                                                                                       |
| EIP712.hash                  | Domain, Types, Message      | Hash           | Typed data signing                                                                                                                                               |
| SHA256.hash                  | Uint8Array                  | 32-byte hash   | Bitcoin compatibility                                                                                                                                            |
| RIPEMD160.hash               | Uint8Array                  | 20-byte hash   | Bitcoin addresses                                                                                                                                                |
| Blake2.hash                  | Uint8Array, size?           | 1-64 byte hash | Zcash compatibility                                                                                                                                              |
| BN254.add                    | G1Point, G1Point            | G1Point        | BN254 elliptic curve addition                                                                                                                                    |
| BN254.mul                    | G1Point, scalar             | G1Point        | BN254 scalar multiplication                                                                                                                                      |
| BN254.pairing                | Point pairs                 | boolean        | zkSNARK verification                                                                                                                                             |
| KZG.blobToCommitment         | Blob                        | Commitment     | Create KZG commitment                                                                                                                                            |
| KZG.computeProof             | Blob, Commitment            | Proof          | Generate KZG proof                                                                                                                                               |
| KZG.verify                   | Blob, Commitment, Proof     | boolean        | [EIP-4844](https://eips.ethereum.org/EIPS/eip-4844) blob verification                                                                                            |
| Bip39.generateMnemonic       | strength (128-256)          | Mnemonic       | [BIP-39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki) mnemonic generation                                                                     |
| Bip39.mnemonicToSeed         | Mnemonic, password?         | Seed           | Derive seed from mnemonic                                                                                                                                        |
| HDWallet.fromSeed            | Seed                        | ExtendedKey    | Create master key from seed                                                                                                                                      |
| HDWallet.derive              | ExtendedKey, Path           | ExtendedKey    | [BIP-32](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki)/[BIP-44](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki) key derivation |
| HDWallet.deriveEthereum      | ExtendedKey, account, index | ExtendedKey    | Derive Ethereum account (m/44'/60'/0'/0/n)                                                                                                                       |
| AesGcm.encrypt               | Data, Key, Nonce            | Ciphertext     | [AES-GCM](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf) authenticated encryption                                                |
| AesGcm.decrypt               | Ciphertext, Key, Nonce      | Data           | AES-GCM authenticated decryption                                                                                                                                 |

---

## Performance & WASM

All implementations optimized for production use:

- **Native/WASM**: Optional native bindings via [Zig](https://ziglang.org/) for 2-10x speedup on performance-critical operations
- **Audited crypto**: [@noble/curves](https://github.com/paulmillr/noble-curves), [c-kzg-4844](https://github.com/ethereum/c-kzg-4844), [blst](https://github.com/supranational/blst) for security
- **Minimal bundle**: Tree-shakeable, only pay for what you use
- **WASM modes**: ReleaseSmall (size-optimized) and ReleaseFast (performance-optimized) builds available

📚 **[WASM Guide](https://voltaire.tevm.sh/wasm/)** | **[Benchmarks](./BENCHMARKING.md)**

---

## Alternatives

- **[Alloy](https://github.com/alloy-rs/alloy)** - High-performance Rust library (Zig FFI integration available)
- **[@noble/curves](https://github.com/paulmillr/noble-curves)** - Audited cryptographic library for pure JS implementations

---

## Language Support Wishlist

Voltaire currently supports TypeScript/JavaScript and Zig. We plan to add idiomatic, type-safe wrappers for additional languages:

- **[Go](https://go.dev/)** - Native Go bindings via cgo
- **[Python](https://www.python.org/)** - Python bindings via ctypes/cffi
- **[Rust](https://www.rust-lang.org/)** - Rust bindings via FFI
- **[Swift](https://swift.org/)** - Swift bindings for iOS/macOS development
- **[Kotlin](https://kotlinlang.org/)** - Kotlin bindings for Android/JVM development

**Note:** These languages can already use Voltaire today via the C-FFI interface (see `src/c_api.zig` and generated `src/primitives.h` header), but we aim to provide ergonomic, type-safe, idiomatic wrappers for each language.

Contributions welcome!

---

## Runtime Dependencies

Voltaire has minimal runtime dependencies:

### TypeScript/JavaScript Dependencies

- **[@scure/bip32](https://github.com/paulmillr/scure-bip32)** - BIP-32 hierarchical deterministic wallet key derivation
- **[@scure/bip39](https://github.com/paulmillr/scure-bip39)** - BIP-39 mnemonic phrase generation and validation
- **[@tevm/chains](https://github.com/evmts/tevm-monorepo/tree/main/packages/chains)** - Generated Ethereum chain configurations (mainnet, L2s, testnets)
- **[abitype](https://github.com/wevm/abitype)** - ABI type system utilities and type guards
- **[@adraffy/ens-normalize](https://github.com/adraffy/ens-normalize.js)** - ENSIP-15 compliant ENS name normalization and beautification
- **[@noble/curves](https://github.com/paulmillr/noble-curves)** - Audited elliptic curve cryptography (secp256k1, ed25519, p256)
- **[@noble/hashes](https://github.com/paulmillr/noble-hashes)** - Audited cryptographic hash functions (keccak256, sha256, blake3, ripemd160)
- **[whatsabi](https://github.com/shazow/whatsabi)** - ABI detection and contract analysis
- **[ox](https://github.com/wevm/ox)** - Ethereum utilities

### Zig Dependencies

- **[z-ens-normalize](https://github.com/evmts/z-ens-normalize)** - Zig port of ENSIP-15 ENS name normalization
- **[Zig std.crypto](https://ziglang.org/documentation/0.15.1/std/#std.crypto)** - Zig standard library cryptography (native/WASM builds only)

### Native/C Dependencies

- **[c-kzg](https://github.com/ethereum/c-kzg-4844)** - KZG polynomial commitments for EIP-4844 blob verification
- **[libwally-core](https://github.com/ElementsProject/libwally-core)** - Wallet utilities including BIP-32/39/44 implementations
- **[blst](https://github.com/supranational/blst)** - BLS12-381 signature library for Ethereum consensus layer

### Rust Dependencies

- **[arkworks](https://github.com/arkworks-rs)** - Rust zkSNARK libraries (ark-bn254, ark-bls12-381, ark-ec, ark-ff) for BN254 operations
- **[keccak-asm](https://github.com/RustCrypto/hashes)** - Assembly-optimized Keccak implementation (native builds)
- **[tiny-keccak](https://github.com/debris/tiny-keccak)** - Pure Rust Keccak implementation (WASM builds)

All dependencies are actively maintained and security-audited where applicable. See [External Dependencies](https://voltaire.tevm.sh/external-dependencies/) for detailed information.

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

- [Voltaire Documentation](https://voltaire.tevm.sh/) - Complete API reference and guides
- [Ethereum Developer Documentation](https://ethereum.org/en/developers/docs/)
- [EIP Repository](https://eips.ethereum.org/) - Ethereum Improvement Proposals
- [EVM.codes](https://www.evm.codes/) - Opcode reference
- [Ethereum Yellow Paper](https://ethereum.github.io/yellowpaper/paper.pdf) - Technical specification
- [Solidity Documentation](https://docs.soliditylang.org/) - Smart contract language
- [Zig Documentation](https://ziglang.org/documentation/0.15.1/) - Zig language reference
