# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.1] - 2025-01-25

### Added

#### Ethereum Primitives
- Address type with EIP-55 checksumming
  - CREATE and CREATE2 address calculation
  - Public key to address derivation
  - Checksum validation
- Hexadecimal encoding/decoding utilities
- RLP (Recursive Length Prefix) encoding and decoding
- ABI encoding/decoding (partial TypeScript implementation)
- Transaction types and encoding
  - Legacy transactions (EIP-155)
  - EIP-1559 transactions
  - EIP-7702 transactions with authorization lists
  - Transaction validation and type detection
- Access lists (EIP-2930)
- Blob transactions support (EIP-4844)
- Event logs parsing and filtering
- EIP-1559 fee market calculations
- Numeric utilities (parseEther, formatGwei, etc.)
- Gas constants and cost calculations
- Bytecode analysis with jump destination validation
- EVM opcode enumeration and utilities
- Hardfork version comparisons
- Sign-In with Ethereum (EIP-4361 / SIWE) message handling
- Merkle Patricia Trie implementation

#### Cryptography
- Keccak-256 hashing
  - Pure TypeScript implementation via @noble/hashes
  - Zig standard library implementation
  - Optional assembly-optimized implementation (native only)
- secp256k1 ECDSA signatures
  - Address recovery
  - Transaction signing
  - Signature validation
- EIP-191 personal message signing
- EIP-712 typed data hashing and signing
- BLS12-381 curve operations (via BLST)
  - G1 and G2 point operations
  - Pairing checks
  - Multi-scalar multiplication
- BN254 (alt_bn128) curve operations (via Arkworks)
  - Elliptic curve addition and multiplication
  - Pairing checks
  - Pure Zig implementation available
- KZG commitments (via c-kzg-4844)
  - Blob to commitment conversion
  - Proof generation and verification
  - EIP-4844 blob transaction support
- Hash algorithms
  - SHA-256 (Zig stdlib)
  - RIPEMD-160
  - Blake2

#### EVM Precompiles (TypeScript stubs)
- 0x01: ECRECOVER - Signature recovery
- 0x02: SHA256 - SHA-256 hash
- 0x03: RIPEMD160 - RIPEMD-160 hash
- 0x04: IDENTITY - Identity function
- 0x05: MODEXP - Modular exponentiation
- 0x06: BN254_ADD - BN254 elliptic curve addition
- 0x07: BN254_MUL - BN254 elliptic curve multiplication
- 0x08: BN254_PAIRING - BN254 pairing check
- 0x09: BLAKE2F - Blake2 compression
- 0x0A: POINT_EVALUATION - KZG point evaluation (EIP-4844)
- 0x0B-0x13: BLS12-381 operations (Prague hardfork)

#### Build System
- Zig build system with module support
- WASM support with full feature parity
  - Conditional compilation for WASM targets
  - Portable C implementations for BLST
  - Pure Rust Keccak for WASM builds
- Cross-compilation support
- Static library compilation
- TypeScript/JavaScript bindings via Bun FFI (planned)

#### Documentation
- Comprehensive README with API reference
- WASM support documentation
- WASM implementation changes documentation
- Contributing guidelines
- Code organization documentation
- Example code for all major features
- AI assistant integration (CLAUDE.md)

### Features

#### Platform Support
- Native builds (x86_64, ARM64, Windows, Linux, macOS)
- WebAssembly (WASM32-WASI) with all features enabled
- TypeScript/JavaScript via @noble/hashes

#### Dependencies
- Zig 0.15.1+
- Rust/Cargo for crypto wrappers
- BLST (Supranational) for BLS12-381
- c-kzg-4844 (Ethereum Foundation) for KZG commitments
- Arkworks for BN254 operations
- @noble/hashes for TypeScript Keccak-256

#### Testing
- Comprehensive unit tests for all modules
- Integration tests for cryptographic operations
- Cross-validation against reference implementations
- Test vectors from Ethereum specifications

### Security Notes

This is an initial release. While the library uses audited dependencies (BLST, c-kzg-4844, Arkworks), the Zig wrapper code and pure Zig implementations are **unaudited**. Use with caution in production environments.

Audited components:
- BLST (Supranational) - audited BLS12-381 implementation
- c-kzg-4844 (Ethereum Foundation) - audited KZG implementation
- Arkworks (arkworks-rs) - audited elliptic curve libraries
- @noble/hashes - widely used cryptographic library

Unaudited components:
- All Zig wrapper code
- Pure Zig secp256k1 implementation
- Pure Zig RIPEMD-160 implementation
- Pure Zig Blake2 implementation
- Pure Zig BN254 implementation
- Pure Zig EIP-712 implementation
- TypeScript implementations (RLP, transactions, ABI, etc.)

[0.0.1]: https://github.com/evmts/primitives/releases/tag/v0.0.1
