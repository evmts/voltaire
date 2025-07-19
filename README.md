# Guillotine

A high-performance Ethereum Virtual Machine (EVM) implementation written in Zig.

## Precompiled Contracts

Guillotine implements Ethereum precompiled contracts with different backends optimized for various deployment targets.

### Precompile Status

| Address | Name | Native (x86/ARM) | WASM | Implementation |
|---------|------|------------------|------|----------------|
| `0x01` | ECRECOVER | ✅ | ✅ | Pure Zig |
| `0x02` | SHA256 | ✅ | ✅ | Pure Zig |
| `0x03` | RIPEMD160 | ✅ | ✅ | Pure Zig |
| `0x04` | IDENTITY | ✅ | ✅ | Pure Zig |
| `0x05` | MODEXP | ✅ | ✅ | Pure Zig |
| `0x06` | ECADD | ✅ | ✅ | Pure Zig (BN254) |
| `0x07` | ECMUL | ✅ | ⚠️ | Rust (arkworks) / Placeholder |
| `0x08` | ECPAIRING | ✅ | ⚠️ | Rust (arkworks) / Limited |
| `0x09` | BLAKE2F | ✅ | ✅ | Pure Zig |
| `0x0a` | KZG_POINT_EVALUATION | ✅ | ✅ | Pure Zig |

### Implementation Details

#### BN254 Elliptic Curve Precompiles (0x06-0x08)

**Native Targets (x86, ARM)**:
- **ECADD**: Pure Zig implementation for optimal performance
- **ECMUL**: Rust backend using [arkworks](https://arkworks.rs/) for production-grade scalar multiplication
- **ECPAIRING**: Rust backend using arkworks for bilinear pairing operations

**WASM Target**:
- **ECADD**: ✅ Fully functional pure Zig implementation
- **ECMUL**: ⚠️ Placeholder implementation (returns point at infinity, logs warning)
- **ECPAIRING**: ⚠️ Limited implementation (handles empty input correctly, non-empty returns false)

#### Gas Costs

All precompiles implement correct gas costs for different Ethereum hardforks:
- **Byzantium**: Original gas costs
- **Istanbul**: Reduced gas costs for BN254 operations (EIP-1108)

### WASM Compatibility

The WASM build (3.1M) is production-ready for most use cases:
- ✅ Complete EVM execution engine
- ✅ All standard precompiles
- ✅ Basic cryptographic operations
- ⚠️ Limited zkSNARK support (ECMUL/ECPAIRING)

For applications requiring full BN254 support in WASM, consider:
- Offloading zkSNARK verification to host environment
- Using WASM-compatible cryptographic libraries
- Implementing pure Zig scalar multiplication and pairing

## Prerequisites

- **Zig 0.14.1 or later** (required for fuzzing support on macOS)

## Build Targets

```bash
# Native build (full precompile support)
zig build

# WASM build (limited BN254 precompiles)
zig build wasm

# Run tests
zig build test

# Run fuzzing tests (requires Zig 0.14.1+)
zig build test --fuzz
```

## Architecture

- **Pure Zig**: Core EVM implementation optimized for safety and performance
- **Conditional Compilation**: Different backends based on target architecture
- **Rust Integration**: Production-grade cryptography via arkworks ecosystem
- **Modular Design**: Easy to extend with additional precompiles

---

*Guillotine prioritizes correctness, performance, and safety in Ethereum execution.*