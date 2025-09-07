# Crypto - Cryptographic Utilities

## Overview

This directory contains comprehensive cryptographic implementations used throughout Guillotine. It provides high-performance, EVM-compatible cryptographic functions including hashing algorithms, elliptic curve operations, digital signatures, and specialized cryptographic constructs required for Ethereum execution.

## Components

### Core Cryptographic Files
- **`root.zig`** - Main module exports and public API
- **`crypto.zig`** - Central cryptographic utilities and high-level operations
- **`hash.zig`** - Hash function interface and common utilities
- **`hash_utils.zig`** - Advanced hashing utilities and helper functions
- **`hash_algorithms.zig`** - Collection of hash algorithm implementations

### Hash Function Implementations
- **`keccak_asm.zig`** - Optimized assembly implementation of Keccak-256
- **`keccak256_accel.zig`** - Hardware-accelerated Keccak-256 implementation
- **`sha256_accel.zig`** - Hardware-accelerated SHA-256 implementation
- **`blake2.zig`** - BLAKE2 hash function (used in precompiles)
- **`ripemd160.zig`** - RIPEMD-160 hash function implementation

### Elliptic Curve Cryptography
- **`secp256k1.zig`** - secp256k1 elliptic curve operations
- **`bn254.zig`** - BN254 curve utilities and interface
- **`bn254/`** - Dedicated BN254 implementation directory

### Advanced Cryptographic Constructs
- **`modexp.zig`** - Modular exponentiation (EIP-198 precompile)
- **`eip712.zig`** - EIP-712 typed structured data hashing
- **`c_kzg.zig`** - KZG commitment scheme integration

### Hardware Acceleration and Optimization
- **`cpu_features.zig`** - CPU feature detection for optimization
- **`hardware_accel_benchmarks.zig`** - Performance benchmarks for accelerated implementations

## Key Features

### High-Performance Hashing
- **Keccak-256** - Primary hash function used by Ethereum
  - Assembly-optimized implementation for maximum performance
  - Hardware acceleration support (AVX2, SHA extensions)
  - Streaming interface for large data processing
  - Constant-time implementation for security-critical operations

- **SHA-256** - Used in various precompiles and cryptographic operations
  - Hardware-accelerated implementation using CPU instructions
  - Optimized for both single-shot and streaming operations

- **BLAKE2** - High-speed cryptographic hash function
  - Used in specific precompiles (e.g., BLAKE2f)
  - Parameterizable output length and personalization

### Elliptic Curve Operations
- **secp256k1** - Bitcoin/Ethereum signature curve
  - Digital signature generation and verification (ECDSA)
  - Public key recovery from signatures
  - Point operations and scalar multiplication
  - Batch verification for improved performance

- **BN254 (alt_bn128)** - Pairing-friendly curve for zkSNARKs
  - Group operations in G1 and G2
  - Pairing computations for cryptographic protocols
  - Used in precompiles 0x06, 0x07, and 0x08

### EVM-Specific Cryptographic Functions
- **Address Derivation** - Contract and account address calculation
- **Signature Recovery** - ecrecover precompile implementation
- **Structured Data Hashing** - EIP-712 message formatting and hashing
- **Merkle Tree Operations** - Efficient proof generation and verification

## Architecture

### Modular Design
```zig
// High-level crypto operations
pub const Crypto = @import("crypto.zig");

// Specific algorithms
pub const Keccak256 = @import("keccak_asm.zig");
pub const Secp256k1 = @import("secp256k1.zig");
pub const BN254 = @import("bn254.zig");
```

### Hardware Acceleration Framework
The crypto module includes a comprehensive hardware acceleration framework:

1. **CPU Feature Detection** - Runtime detection of available CPU extensions
2. **Algorithm Selection** - Automatic selection of optimal implementation
3. **Fallback Support** - Pure software fallbacks for compatibility
4. **Performance Monitoring** - Built-in benchmarking and profiling

### Memory Safety
All cryptographic implementations prioritize memory safety:
- Secure memory clearing for sensitive data
- Bounds checking for all array operations
- Protection against side-channel attacks
- Proper error handling and resource cleanup

## Usage Patterns

### Basic Hashing
```zig
const hash = try Keccak256.hash(data);
const sha_hash = try SHA256.hash(data);
```

### Digital Signatures
```zig
// Sign message
const signature = try Secp256k1.sign(private_key, message_hash);

// Verify signature
const valid = try Secp256k1.verify(public_key, message_hash, signature);

// Recover public key
const recovered_pubkey = try Secp256k1.recover(message_hash, signature);
```

### Advanced Cryptographic Operations
```zig
// EIP-712 structured data hashing
const typed_hash = try EIP712.hashTypedData(domain, message);

// Modular exponentiation
const result = try ModExp.compute(base, exponent, modulus);
```

## Performance Considerations

### Optimization Strategies
- **Assembly Implementations** - Hand-optimized assembly for critical paths
- **SIMD Instructions** - Vectorized operations using AVX/AVX2
- **Hardware Instructions** - Utilize SHA/AES CPU extensions when available
- **Batch Processing** - Optimize for multiple operations in sequence

### Benchmarking
The module includes comprehensive benchmarks for:
- Individual cryptographic operations
- Hardware vs. software implementations
- Batch vs. single operation performance
- Memory usage and allocation patterns

## Security Considerations

### Constant-Time Operations
Critical operations are implemented to resist timing attacks:
- Signature verification
- Hash comparisons
- Private key operations

### Side-Channel Protection
- Memory access patterns are designed to be data-independent
- Intermediate values are properly cleared
- Error conditions don't leak information about private data

### Cryptographic Standards Compliance
All implementations follow established cryptographic standards:
- FIPS 180-4 (SHA-256)
- FIPS 202 (Keccak)
- RFC 6979 (Deterministic ECDSA)
- EIP specifications for Ethereum-specific functions

## Testing and Validation

### Test Vectors
Comprehensive test suites include:
- Known answer tests from official test vectors
- Cross-verification with reference implementations
- Edge case and boundary condition testing
- Fuzzing for robustness validation

### Compliance Testing
- EVM test suite compatibility
- Ethereum consensus test compliance
- Cross-client verification of results

## Integration Points

The crypto module integrates with:
- **EVM Precompiles** - Cryptographic precompiled contracts
- **Transaction Processing** - Signature verification and address derivation
- **State Management** - Hash computations for state trees
- **Network Layer** - Node identity and secure communication