# BN254 Examples

Comprehensive examples demonstrating BN254 (alt_bn128) elliptic curve operations for zkSNARK verification on Ethereum.

## Overview

BN254 is the pairing-friendly curve used for zkSNARK verification on Ethereum via precompiled contracts (EIP-196/197). These examples cover everything from basic point operations to complete Groth16 verification workflows.

## Examples

### 1. G1/G2 Basic Operations (`g1-g2-basics`)

**Topics covered:**
- Generator points
- Point addition and scalar multiplication
- Point equality checks
- Infinity point handling
- Linearity verification
- Point serialization/deserialization
- G2 subgroup membership

**Key insights:**
- G1 operates in base field Fp (64-byte points)
- G2 operates in extension field Fp2 (128-byte points)
- Both groups have additive and multiplicative structure
- Infinity point is group identity

**Run:**
```bash
# TypeScript
bun run examples/crypto/bn254/g1-g2-basics.ts

# Zig
zig run examples/crypto/bn254/g1-g2-basics.zig
```

### 2. Pairing Check (`pairing-check`)

**Topics covered:**
- Single pairing computation e(P, Q)
- Bilinearity property: e(a·P, b·Q) = e(P, Q)^(ab)
- Multi-pairing product checks
- Pairing equation verification
- zkSNARK verification patterns

**Key insights:**
- Pairing maps G1 × G2 → GT (Fp12 target group)
- Bilinearity is fundamental to zkSNARKs
- Product of pairings = 1 verifies relationships
- Enables checking algebraic equations cryptographically

**Run:**
```bash
# TypeScript
bun run examples/crypto/bn254/pairing-check.ts

# Zig
zig run examples/crypto/bn254/pairing-check.zig
```

### 3. Groth16 Verification (`groth16-verification`)

**Topics covered:**
- Groth16 proof structure (A, B, C)
- Verification key components (α, β, γ, δ, IC)
- Public input encoding
- Verification equation: e(A, B) = e(α, β) × e(L, γ) × e(C, δ)
- Trusted setup role
- Gas cost analysis

**Key insights:**
- Groth16 has constant 256-byte proof size
- Verification uses 4 pairing checks (~182k gas)
- Most widely deployed zkSNARK (Tornado Cash, zkSync, Aztec)
- Requires trusted setup per circuit

**Run:**
```bash
# TypeScript
bun run examples/crypto/bn254/groth16-verification.ts

# Zig
zig run examples/crypto/bn254/groth16-verification.zig
```

### 4. Precompile Usage (`precompile-usage`)

**Topics covered:**
- ECADD (0x06): G1 point addition - 150 gas
- ECMUL (0x07): G1 scalar multiplication - 6,000 gas
- ECPAIRING (0x08): Pairing check - 45k + 34k per pair
- Input/output formats
- Edge cases (infinity, zero scalar)
- EIP-1108 gas optimizations

**Key insights:**
- Precompiles make zkSNARKs affordable on Ethereum
- EIP-1108 reduced costs by 80-97% (Istanbul fork)
- Format matches EIP-196/197 specifications
- Critical for privacy and scaling protocols

**Run:**
```bash
# TypeScript
bun run examples/crypto/bn254/precompile-usage.ts

# Zig
zig run examples/crypto/bn254/precompile-usage.zig
```

### 5. Point Serialization (`serialization`)

**Topics covered:**
- G1 point format (64 bytes: x || y)
- G2 point format (128 bytes: x.c0 || x.c1 || y.c0 || y.c1)
- Big-endian byte order
- Infinity point encoding (all zeros)
- Round-trip verification
- Precompile input concatenation

**Key insights:**
- Coordinates are 32-byte big-endian field elements
- G2 uses Fp2 elements (2 Fp values per coordinate)
- Format is EVM-compatible
- Deserialization validates curve membership

**Run:**
```bash
# TypeScript
bun run examples/crypto/bn254/serialization.ts

# Zig
zig run examples/crypto/bn254/serialization.zig
```

### 6. zkSNARK Proof Structure (`proof-structure`)

**Topics covered:**
- Groth16 proof anatomy
- Verification key structure
- Public input encoding (L = Σ x[i] × IC[i])
- Tornado Cash privacy pattern
- zkSync L2 rollup pattern
- Security considerations
- Alternative proof systems (PLONK, STARKs)

**Key insights:**
- Constant-size proofs enable efficient verification
- Public inputs encoded as single G1 point
- Trusted setup ceremony generates proving/verification keys
- Powers real-world privacy and scaling solutions

**Run:**
```bash
# TypeScript
bun run examples/crypto/bn254/proof-structure.ts

# Zig
zig run examples/crypto/bn254/proof-structure.zig
```

## Learning Path

**Beginner:**
1. Start with `g1-g2-basics` to understand elliptic curve operations
2. Move to `serialization` to learn encoding formats
3. Try `precompile-usage` to see Ethereum integration

**Intermediate:**
4. Study `pairing-check` for bilinear pairing fundamentals
5. Understand verification with `groth16-verification`

**Advanced:**
6. Explore `proof-structure` for real-world zkSNARK patterns

## Architecture

### Curve Parameters

**G1 (base field Fp):**
- Equation: y² = x³ + 3
- Point size: 64 bytes (uncompressed)
- Field modulus (p): 254 bits

**G2 (extension field Fp2):**
- Equation: y² = x³ + 3/(9 + i)
- Point size: 128 bytes (uncompressed)
- Elements: a + b·i where a, b ∈ Fp

**Scalar field Fr:**
- Curve order (r): 254 bits
- Used for private keys and exponents

### Security

**Current:** ~100-bit security level
**Concerns:** Weaker than BLS12-381 (128-bit)
**Timeline:** Sufficient for current use, monitor for 2030+

## Gas Costs (EIP-1108)

| Operation | Gas Cost | Notes |
|-----------|----------|-------|
| ECADD (0x06) | 150 | G1 point addition |
| ECMUL (0x07) | 6,000 | G1 scalar multiplication |
| ECPAIRING (0x08) | 45,000 + 34,000n | Base + per pair |
| Groth16 verify | ~182,000 | 4 pairings typical |

## Real-World Usage

**Privacy Protocols:**
- Tornado Cash: Private ETH transfers
- Aztec: Private DeFi
- zkBob: Private stablecoin transfers

**L2 Scaling:**
- zkSync: zkRollup with BN254 proofs
- Polygon zkEVM: EVM-compatible zkRollup
- Scroll: zkEVM Layer 2

**Identity & Auth:**
- Semaphore: Anonymous signaling
- zkLogin: Private authentication
- Proof of Humanity

## Implementation Notes

**TypeScript:**
- Uses namespace pattern from `src/crypto/bn254/BN254.js`
- Points are branded Uint8Array types
- Tree-shakable imports

**Zig:**
- Uses `@import("crypto")` module system
- Projective coordinates for efficiency
- Montgomery form for field arithmetic

## Further Reading

- [EIP-196: ECADD and ECMUL](https://eips.ethereum.org/EIPS/eip-196)
- [EIP-197: ECPAIRING](https://eips.ethereum.org/EIPS/eip-197)
- [EIP-1108: Reduced Gas Costs](https://eips.ethereum.org/EIPS/eip-1108)
- [BN254 For The Rest Of Us](https://hackmd.io/@jpw/bn254)
- [Groth16 Paper](https://eprint.iacr.org/2016/260.pdf)

## Related Documentation

- [BN254 Overview](/src/content/docs/crypto/bn254/)
- [Pairing Operations](/src/content/docs/crypto/bn254/pairing.mdx)
- [Precompiles](/src/content/docs/crypto/bn254/precompiles.mdx)
- [zkSNARK Usage](/src/content/docs/crypto/bn254/zk-usage.mdx)
