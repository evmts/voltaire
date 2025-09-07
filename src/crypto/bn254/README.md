# BN254 - BN254 Elliptic Curve Operations

## Overview

This directory contains a complete implementation of the BN254 (also known as alt_bn128) elliptic curve and its associated cryptographic operations. BN254 is a pairing-friendly curve widely used in zero-knowledge proof systems and Ethereum precompiles. This implementation provides high-performance, constant-time operations for all curve arithmetic.

## Components

### Field Arithmetic
- **`FpMont.zig`** - Montgomery form arithmetic over the base field Fp
- **`Fp2Mont.zig`** - Quadratic extension field Fp2 operations
- **`Fp4Mont.zig`** - Quartic extension field Fp4 operations
- **`Fp6Mont.zig`** - Sextic extension field Fp6 operations
- **`Fp12Mont.zig`** - Twelfth degree extension field Fp12 operations
- **`Fr.zig`** - Scalar field operations

### Curve Groups
- **`G1.zig`** - Group G1 point operations (curve over Fp)
- **`G2.zig`** - Group G2 point operations (curve over Fp2)

### Advanced Operations
- **`pairing.zig`** - Pairing computation (Tate pairing variant)
- **`curve_parameters.zig`** - Curve constants and parameters

### Testing and Benchmarking
- **`benchmarks.zig`** - Performance benchmarks for all operations
- **`zbench_benchmarks.zig`** - Extended benchmarking suite
- **`fuzz.zig`** - Fuzzing tests for robustness validation

## Key Features

### Pairing-Friendly Curve
BN254 is specifically designed for efficient pairing computation:
- **Embedding degree 12** - Enables efficient pairing operations
- **256-bit prime order** - Provides approximately 128-bit security level
- **Twisted Edwards form** - Optimized for fast group operations

### High-Performance Implementation
- **Montgomery arithmetic** - Efficient modular arithmetic using Montgomery reduction
- **Projective coordinates** - Avoids expensive field inversions during curve operations
- **Constant-time operations** - Protects against timing side-channel attacks
- **Assembly optimizations** - Hand-tuned assembly for critical operations

### Complete Field Tower
The implementation includes the complete tower of extension fields:
```
Fp ⊂ Fp2 ⊂ Fp4 ⊂ Fp6 ⊂ Fp12
```

Each field level provides:
- Basic arithmetic (addition, subtraction, multiplication, division)
- Conjugation and norm operations
- Efficient squaring algorithms
- Frobenius endomorphism operations

## Architecture

### Field Operations
```zig
// Base field operations
const a = FpMont.fromInt(123);
const b = FpMont.fromInt(456);
const c = a.mul(b);

// Extension field operations
const x = Fp2Mont.init(a, b);
const y = x.square();
```

### Group Operations
```zig
// G1 operations (curve over Fp)
const P = G1.generator();
const Q = P.scalarMul(scalar);
const R = P.add(Q);

// G2 operations (curve over Fp2)
const P2 = G2.generator();
const Q2 = P2.scalarMul(scalar);
```

### Pairing Computation
```zig
// Compute pairing e(P, Q)
const P = G1.generator();
const Q = G2.generator();
const result = pairing.compute(P, Q);
```

## Cryptographic Operations

### Ethereum Precompiles
This implementation directly supports Ethereum precompiles:

#### Precompile 0x06 - BN256Add (alt_bn128_add)
- Point addition in G1
- Validates input points are on the curve
- Handles point at infinity correctly

#### Precompile 0x07 - BN256ScalarMul (alt_bn128_mul)
- Scalar multiplication in G1
- Uses windowed NAF for efficiency
- Constant-time implementation

#### Precompile 0x08 - BN256Pairing (alt_bn128_pairing)
- Pairing computation for multiple pairs
- Batch verification optimization
- Final exponentiation in Fp12

### Zero-Knowledge Proof Support
The BN254 curve is widely used in zkSNARK systems:
- **Groth16** - Popular zero-knowledge proof system
- **PLONK** - Universal zero-knowledge proof system
- **Bulletproofs** - Range proofs and other specialized proofs

## Performance Characteristics

### Benchmarking Results
The implementation includes comprehensive benchmarks:
- **G1 operations** - Addition, doubling, scalar multiplication
- **G2 operations** - Addition, doubling, scalar multiplication
- **Field operations** - Arithmetic in all extension fields
- **Pairing computation** - Single and batch pairing operations

### Optimization Strategies
1. **Montgomery Reduction** - Efficient modular arithmetic
2. **Projective Coordinates** - Avoid expensive inversions
3. **Windowed NAF** - Optimize scalar multiplication
4. **Batch Processing** - Amortize setup costs for multiple operations

## Security Considerations

### Constant-Time Implementation
All cryptographic operations are implemented to run in constant time:
- Secret-dependent branches are eliminated
- Memory access patterns are data-independent
- Arithmetic operations use consistent timing

### Side-Channel Protection
- **Power analysis resistance** - Operations use consistent power consumption
- **Timing attack resistance** - No secret-dependent conditional branches
- **Cache attack resistance** - Memory access patterns are predictable

### Curve Security
- **Rho method security** - 128-bit security against discrete log attacks
- **Invalid curve attacks** - All input points are validated
- **Small subgroup attacks** - Cofactor handling prevents attacks

## Testing and Validation

### Test Coverage
- **Unit tests** - Individual operation correctness
- **Cross-verification** - Comparison with reference implementations
- **Edge cases** - Point at infinity, curve order, field boundaries
- **Compliance tests** - Ethereum test suite compatibility

### Fuzzing
Extensive fuzzing validates robustness:
- **Random input testing** - Handles arbitrary inputs gracefully
- **Boundary condition testing** - Edge cases and overflow conditions
- **Property-based testing** - Algebraic properties are maintained

## Usage Examples

### Basic Operations
```zig
// Initialize curve points
const P = try G1.fromBytes(point_bytes);
const Q = G1.generator();

// Perform group operations
const sum = P.add(Q);
const doubled = P.double();
const scaled = P.scalarMul(scalar_value);

// Verify point is on curve
if (!P.isOnCurve()) {
    return error.InvalidPoint;
}
```

### Pairing Operations
```zig
// Prepare inputs for pairing
const g1_points = [_]G1{ P1, P2, P3 };
const g2_points = [_]G2{ Q1, Q2, Q3 };

// Compute multi-pairing
const result = try pairing.multiPairing(g1_points, g2_points);

// Check if result equals identity in Fp12
if (result.isOne()) {
    // Verification succeeded
}
```

## Integration with Guillotine

The BN254 implementation integrates seamlessly with:
- **Precompiled contracts** - Direct support for Ethereum precompiles
- **Transaction processing** - Signature verification and validation
- **State management** - Cryptographic commitments and proofs
- **Network protocols** - Secure communication and verification