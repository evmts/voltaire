# External Cryptographic Libraries (`lib/`)

This directory contains external C/Rust libraries required for cryptographic operations. These dependencies are essential for production-grade Ethereum cryptography.

## Overview

The `lib/` directory contains cryptographic libraries required by the primitives library:
- **BLS12-381** - Pairing-friendly elliptic curve operations (via BLST)
- **KZG Commitments** - EIP-4844 polynomial commitments
- **BN254** - Alt-BN128 curve for zkSNARK operations

## Dependencies

### 🔐 `c-kzg-4844/` - KZG Polynomial Commitments

**Purpose**: Provides KZG polynomial commitment operations required for EIP-4844 (Proto-Danksharding) blob transactions.

**Technology**: C library (Ethereum Foundation official implementation)
**License**: Apache-2.0

**Key Features**:
- Blob to KZG commitment conversion
- KZG proof computation and verification
- Batch verification for performance
- EIP-4844 compliance
- Embedded trusted setup

**Integration**:
- Used by `src/crypto/` for KZG operations
- Automatically built via `zig build`
- Depends on BLST for elliptic curve operations

**Build Requirements**:
- Git submodule (`git submodule update --init --recursive`)
- BLST library (built automatically)

**Submodule Structure**:
```
lib/c-kzg-4844/
├── blst/           # BLS12-381 implementation (submodule)
├── src/            # KZG C implementation
└── bindings/       # Language bindings
```

### 🧮 `ark/` - BN254 Elliptic Curve Operations

**Purpose**: BN254 (alt_bn128) elliptic curve implementation for zkSNARK operations.

**Technology**: Rust wrapper around arkworks ecosystem
**Dependencies**: ark-bn254, ark-ec, ark-ff
**License**: MIT

**Key Features**:
- Scalar multiplication and pairing operations
- Memory-safe FFI bindings
- Production-tested cryptographic primitives
- Used for precompile operations (ECADD, ECMUL, ECPAIRING)

**Integration**:
- Used by `src/crypto/bn254.zig`
- Built via Rust/Cargo
- Currently stubbed out (returns null) - enable when Rust target is available

### Build System Wrappers

- **`blst.zig`** - Zig bindings for BLST (BLS12-381)
- **`c-kzg.zig`** - Zig bindings for c-kzg-4844
- **`bn254.zig`** - Zig bindings for ark BN254 (currently stubbed)
- **`bls_wrapper.zig`** - High-level BLS12-381 wrapper
- **`build.zig`** - Build configuration for all libraries

## Build System Integration

### Zig Build Integration

The main `build.zig` orchestrates all dependencies:

1. **Submodule Verification**: Ensures c-kzg-4844 submodule is initialized
2. **Library Creation**: Creates static libraries for each component
3. **Linking**: Links crypto libraries to primitives and crypto modules

### Build Commands

```bash
# Standard build (includes all dependencies)
zig build

# Run tests (includes crypto tests)
zig build test
```

## Memory Management

All external libraries follow strict memory safety protocols:

- **RAII patterns** with defer/errdefer cleanup
- **Clear ownership semantics** for allocated resources
- **No memory leaks** - every allocation paired with deallocation
- **Error handling** with proper resource cleanup

## Security & Auditing

- **c-kzg-4844**: Security audited by Sigma Prime (June 2023)
- **BLST**: Production-grade BLS12-381 implementation
- **arkworks**: Production-tested cryptographic library
- **Memory safety**: All FFI boundaries carefully managed

## Version Management

| Component | Version | Update Policy |
|-----------|---------|---------------|
| c-kzg-4844 | Latest stable | Track Ethereum Foundation releases |
| BLST | Latest stable | Track official BLST releases |
| arkworks | 0.5.0 | Stable cryptographic primitives |

## Development Notes

### Adding New Dependencies

1. Evaluate necessity - prefer Zig-native solutions when possible
2. Security audit requirements for cryptographic code
3. Memory safety verification for all FFI boundaries
4. Integration with existing build system
5. Documentation and testing requirements

### Debugging External Libraries

- Enable debug symbols for C/Rust components
- Use standard Zig testing and error handling
- Follow TDD practices for any modifications
- Test against known vectors from specifications

### Future Roadmap

- **Pure Zig cryptography**: Replace external dependencies with native Zig where feasible
- **Performance benchmarking**: Continuous performance monitoring
- **Security hardening**: Regular dependency audits and updates

---

**Note**: All external dependencies are carefully vetted for security, performance, and compatibility. Changes to this directory should follow the project's security and development protocols outlined in `CLAUDE.md`.
