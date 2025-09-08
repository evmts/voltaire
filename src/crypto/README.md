# Crypto - Cryptographic Utilities and Implementations

## Overview

This directory provides comprehensive cryptographic implementations used throughout Guillotine, including hash functions, digital signatures, elliptic curve operations, and specialized cryptographic constructs required for Ethereum Virtual Machine (EVM) execution. The implementation prioritizes performance, security, and EVM compatibility.

## Components

### Core Cryptographic Files
- **`crypto.zig`** - Central cryptographic utilities and high-level operations interface
- **`root.zig`** - Main module exports and public API
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
- **`secp256k1.zig`** - secp256k1 curve operations for ECDSA signatures
- **`bn254/`** - Complete BN254 curve implementation for zkSNARKs and precompiles
- **`bn254.zig`** - BN254 curve module exports

### Advanced Cryptographic Operations
- **`modexp.zig`** - Modular exponentiation implementation
- **`eip712.zig`** - EIP-712 structured data signing
- **`c_kzg.zig`** - KZG commitment scheme bindings

### Performance and Testing
- **`cpu_features.zig`** - CPU feature detection for acceleration
- **`hardware_accel_benchmarks.zig`** - Performance benchmarks for accelerated functions

## Key Features

### Hash Functions
- **Keccak-256**: Primary Ethereum hash function with optimized implementations
- **SHA-256**: Standard cryptographic hash with hardware acceleration
- **BLAKE2**: High-performance hash function for specific use cases
- **RIPEMD-160**: Legacy hash function for Bitcoin compatibility

### Digital Signatures
- **ECDSA**: Elliptic Curve Digital Signature Algorithm
- **secp256k1**: Bitcoin/Ethereum curve for transaction signatures
- **Public key recovery**: Recover public keys from signatures
- **EIP-712**: Structured data signing for typed messages

### Performance Optimizations
- **Hardware acceleration**: Utilize CPU-specific instructions (AES-NI, AVX2)
- **Assembly implementations**: Hand-optimized critical paths
- **Constant-time operations**: Side-channel attack resistance
- **Memory-efficient algorithms**: Minimize allocations

## Architecture

### Cryptographic Interface
```zig
const crypto = @import("crypto");

// Hash functions
const Hash = crypto.Hash;
const h = Hash.keccak256(data);

// ECDSA (secp256k1) — developer utilities (unaudited)
const C = crypto.Crypto;
const priv = try C.unaudited_randomPrivateKey();
const pub = try C.unaudited_getPublicKey(priv);
const addr = C.public_key_to_address(pub);
const sig = try C.unaudited_signMessage("hello", priv);
const ok = try C.unaudited_verifyMessage("hello", sig, addr);
```

### Hardware Acceleration
Accelerated variants live under `Keccak256_Accel` and `SHA256_Accel`.

## Security Considerations

### Constant-Time Implementation
All cryptographic operations are designed to be constant-time:
- **No secret-dependent branches**: Eliminate timing variations
- **Consistent memory access patterns**: Prevent cache-based attacks
- **Uniform arithmetic operations**: Consistent execution time

### Side-Channel Protection
- **Power analysis resistance**: Consistent power consumption patterns
- **Timing attack mitigation**: Data-independent execution paths
- **Cache attack prevention**: Predictable memory access patterns

### Input Validation
- **Range checks**: All inputs validated within expected bounds
- **Curve point validation**: Elliptic curve points verified on-curve
- **Hash length verification**: Output buffers sized correctly

## Usage Examples

### Basic Hash Operations
```zig
const crypto = @import("crypto");
const Hash = crypto.Hash;

const data = "Hello, Ethereum!";
const keccak = Hash.keccak256(data);
```

### Digital Signatures (developer helpers)
```zig
const C = (@import("crypto")).Crypto;

const priv = try C.unaudited_randomPrivateKey();
const pub = try C.unaudited_getPublicKey(priv);
const sig = try C.unaudited_signHash((@import("crypto")).Hash.keccak256("msg"), priv);
const addr = pub.to_address();
const ok = try C.unaudited_verifyMessage("msg", sig, addr);
```

### EIP-712 Structured Data
```zig
const Eip712 = (@import("crypto")).Eip712;
const domain = Eip712.Domain{
    .name = "MyDApp",
    .version = "1",
    .chainId = 1,
    .verifyingContract = contract_address,
};

const message = MyMessage{
    .from = sender_address,
    .to = recipient_address,
    .amount = 1000,
};

// Build digest with EIP-712 helpers then sign via Crypto.unaudited_signHash
```

### Address Derivation
```zig
// Derive Ethereum address from public key
const address = crypto.publicKeyToAddress(public_key);

// Create contract address
const contract_addr = crypto.createContractAddress(sender_address, nonce);

// Create CREATE2 address
const create2_addr = crypto.create2Address(
    deployer_address,
    salt,
    bytecode_hash
);
```

## Integration with Guillotine

The crypto module integrates with:

### EVM Core
- **Transaction signing**: ECDSA signature verification
- **Address derivation**: Account and contract address generation
- **Hash operations**: State root calculation, transaction hashing

### Precompiled Contracts
- **ecRecover (0x01)**: ECDSA signature recovery
- **sha256 (0x02)**: SHA-256 hash computation
- **ripemd160 (0x03)**: RIPEMD-160 hash computation
- **modexp (0x05)**: Modular exponentiation
- **BN254 operations (0x06-0x08)**: Elliptic curve operations

### State Management
- **Merkle trees**: Keccak-256 for tree node hashing
- **Storage keys**: Hash-based storage addressing
- **Bloom filters**: Efficient event filtering

## Testing and Validation

### Test Coverage
- **Unit tests**: Individual function correctness
- **Cross-validation**: Comparison with reference implementations
- **Edge cases**: Boundary conditions and error handling
- **Performance tests**: Benchmark critical operations

### Compliance Testing
- **Ethereum test suite**: Official test vector validation
- **EIP compliance**: Implementation matches specifications
- **Interoperability**: Compatible with other EVM implementations

### Fuzzing and Robustness
- **Random input testing**: Handle arbitrary inputs gracefully
- **Boundary condition testing**: Edge cases and overflow conditions
- **Property-based testing**: Cryptographic properties maintained
