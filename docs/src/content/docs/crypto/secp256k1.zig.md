---
title: secp256k1.zig - Elliptic Curve Operations
description: Low-level secp256k1 elliptic curve operations for Ethereum including affine point arithmetic, signature validation, and address recovery from ECDSA signatures.
---

**WARNING: This documentation was AI-generated and may contain inaccuracies. Always verify against the source code and official specifications.**

## Overview

The `secp256k1.zig` module provides low-level elliptic curve operations for the secp256k1 curve used in Ethereum and Bitcoin. This module implements affine point arithmetic, signature validation, and address recovery from ECDSA signatures.

## Module Location

`/Users/williamcory/primitives/src/crypto/secp256k1.zig`

## Security Status

**UNAUDITED**: This module contains custom cryptographic implementations that have NOT been security audited.

### Known Security Risks

- **Potential timing attacks** in modular arithmetic operations
- **Not constant-time** - may leak information through timing channels
- **Unvalidated against known ECC vulnerabilities**
- **Custom point arithmetic** may have edge case bugs
- **Memory safety** not guaranteed under all conditions

**DO NOT USE IN PRODUCTION** without proper security audit and testing.

## secp256k1 Curve Parameters

```zig
pub const SECP256K1_P: u256 = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F;
pub const SECP256K1_N: u256 = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141;
pub const SECP256K1_B: u256 = 7;
pub const SECP256K1_GX: u256 = 0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798;
pub const SECP256K1_GY: u256 = 0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8;
```

**Constants:**
- `SECP256K1_P` - Field modulus for the curve
- `SECP256K1_N` - Curve order (number of points on the curve)
- `SECP256K1_B` - Curve parameter b in the equation y² = x³ + 7
- `SECP256K1_GX`, `SECP256K1_GY` - Generator point coordinates

## Core Type: AffinePoint

```zig
pub const AffinePoint = struct {
    x: u256,
    y: u256,
    infinity: bool,

    pub fn zero() AffinePoint
    pub fn generator() AffinePoint
    pub fn isOnCurve(self: AffinePoint) bool
    pub fn negate(self: AffinePoint) AffinePoint
    pub fn double(self: AffinePoint) AffinePoint
    pub fn add(self: AffinePoint, other: AffinePoint) AffinePoint
    pub fn scalarMul(self: AffinePoint, scalar: u256) AffinePoint
};
```

Represents a point on the secp256k1 elliptic curve in affine coordinates.

**Fields:**
- `x` - X-coordinate of the point
- `y` - Y-coordinate of the point
- `infinity` - Flag indicating if this is the point at infinity (identity element)

### Methods

#### zero()

```zig
pub fn zero() AffinePoint
```

Returns the point at infinity (identity element for elliptic curve addition).

**Example:**
```zig
const O = AffinePoint.zero();
assert(O.infinity == true);
```

#### generator()

```zig
pub fn generator() AffinePoint
```

Returns the generator point G for secp256k1.

**Example:**
```zig
const G = AffinePoint.generator();
assert(G.x == SECP256K1_GX);
assert(G.y == SECP256K1_GY);
assert(!G.infinity);
```

#### isOnCurve()

```zig
pub fn isOnCurve(self: AffinePoint) bool
```

Verifies that a point satisfies the curve equation y² = x³ + 7 (mod p).

**Returns:** `true` if the point is on the curve or is the point at infinity

**Example:**
```zig
const G = AffinePoint.generator();
assert(G.isOnCurve());
```

#### negate()

```zig
pub fn negate(self: AffinePoint) AffinePoint
```

Returns the additive inverse of the point: (x, y) → (x, -y mod p).

**Returns:** Negated point with same x-coordinate but opposite y-coordinate

**Example:**
```zig
const P = AffinePoint.generator();
const neg_P = P.negate();
const sum = P.add(neg_P);
assert(sum.infinity); // P + (-P) = O
```

#### double()

```zig
pub fn double(self: AffinePoint) AffinePoint
```

Computes point doubling: 2P using the formula for tangent line intersection.

**Algorithm:**
- λ = (3x² + a) / (2y) mod p, where a = 0 for secp256k1
- x₃ = λ² - 2x mod p
- y₃ = λ(x - x₃) - y mod p

**Returns:** The doubled point

**Example:**
```zig
const G = AffinePoint.generator();
const twoG = G.double();
assert(twoG.isOnCurve());
```

#### add()

```zig
pub fn add(self: AffinePoint, other: AffinePoint) AffinePoint
```

Computes point addition using the chord-tangent method.

**Parameters:**
- `other` - The point to add to this point

**Returns:** The sum of the two points

**Special Cases:**
- P + O = P (identity)
- O + P = P (identity)
- P + P = 2P (doubling)
- P + (-P) = O (inverse)

**Example:**
```zig
const G = AffinePoint.generator();
const P = G.scalarMul(5);
const Q = G.scalarMul(7);
const sum = P.add(Q);
const expected = G.scalarMul(12);
assert(sum.x == expected.x);
assert(sum.y == expected.y);
```

#### scalarMul()

```zig
pub fn scalarMul(self: AffinePoint, scalar: u256) AffinePoint
```

Computes scalar multiplication: k·P using double-and-add algorithm.

**Parameters:**
- `scalar` - The scalar value to multiply by

**Returns:** The point multiplied by the scalar

**Algorithm:** Binary double-and-add method (NOT constant-time)

**Example:**
```zig
const G = AffinePoint.generator();
const pubkey = G.scalarMul(private_key);
```

## Signature Functions

### unauditedValidateSignature()

```zig
pub fn unauditedValidateSignature(r: u256, s: u256) bool
```

**WARNING: UNAUDITED** - Validates ECDSA signature parameters according to secp256k1 and EIP-2 requirements.

**Parameters:**
- `r` - First signature component
- `s` - Second signature component

**Returns:** `true` if signature is valid

**Validation Rules:**
- r must be in range [1, n-1]
- s must be in range [1, n-1]
- s must be ≤ n/2 (EIP-2 malleability protection)

**Example:**
```zig
if (!unauditedValidateSignature(r, s)) {
    return error.InvalidSignature;
}
```

### unauditedRecoverAddress()

```zig
pub fn unauditedRecoverAddress(
    hash: []const u8,
    recoveryId: u8,
    r: u256,
    s: u256,
) !Address
```

**WARNING: UNAUDITED** - Recovers Ethereum address from ECDSA signature and message hash.

**Parameters:**
- `hash` - The 32-byte message hash
- `recoveryId` - Recovery ID (0 or 1)
- `r` - First signature component
- `s` - Second signature component

**Returns:** The Ethereum address of the signer

**Errors:**
- `InvalidHashLength` - Hash is not 32 bytes
- `InvalidRecoveryId` - Recovery ID not 0 or 1
- `InvalidSignature` - Signature parameters invalid or recovery failed

**Algorithm:**
1. Validate signature parameters (r, s, recoveryId)
2. Reconstruct R point from r and recoveryId
3. Calculate e from message hash
4. Calculate public key Q = r⁻¹(sR - eG)
5. Verify signature with recovered key
6. Derive Ethereum address from Q

**Example:**
```zig
const hash: [32]u8 = keccak256(message);
const address = try unauditedRecoverAddress(&hash, recoveryId, r, s);
```

## Modular Arithmetic Functions

### unauditedMulmod()

```zig
pub fn unauditedMulmod(a: u256, b: u256, m: u256) u256
```

**WARNING: UNAUDITED** - Modular multiplication: (a × b) mod m.

**Security Warning:** NOT constant-time, may leak information through timing.

**Example:**
```zig
const result = unauditedMulmod(a, b, SECP256K1_P);
```

### unauditedAddmod()

```zig
pub fn unauditedAddmod(a: u256, b: u256, m: u256) u256
```

**WARNING: UNAUDITED** - Modular addition: (a + b) mod m.

**Example:**
```zig
const sum = unauditedAddmod(a, b, SECP256K1_P);
```

### unauditedSubmod()

```zig
pub fn unauditedSubmod(a: u256, b: u256, m: u256) u256
```

**WARNING: UNAUDITED** - Modular subtraction: (a - b) mod m.

**Example:**
```zig
const diff = unauditedSubmod(a, b, SECP256K1_P);
```

### unauditedPowmod()

```zig
pub fn unauditedPowmod(base: u256, exp: u256, modulus: u256) u256
```

**WARNING: UNAUDITED** - Modular exponentiation: base^exp mod modulus.

**Example:**
```zig
// Calculate y = y²^((p+1)/4) for square root
const y = unauditedPowmod(y2, (SECP256K1_P + 1) >> 2, SECP256K1_P);
```

### unauditedInvmod()

```zig
pub fn unauditedInvmod(a: u256, m: u256) ?u256
```

**WARNING: UNAUDITED** - Modular multiplicative inverse using Extended Euclidean Algorithm.

**Parameters:**
- `a` - Value to invert
- `m` - Modulus

**Returns:** `a⁻¹ mod m` or `null` if inverse doesn't exist

**Example:**
```zig
const r_inv = unauditedInvmod(r, SECP256K1_N) orelse return error.InvalidSignature;
```

## Testing

The module includes comprehensive test coverage:

- **Affine point operations** - zero, generator, curve membership, negation
- **Point arithmetic** - addition, doubling, scalar multiplication
- **Signature validation** - EIP-2 malleability checks, parameter bounds
- **Address recovery** - test vectors from Bitcoin Core and go-ethereum
- **Edge cases** - point at infinity, invalid signatures, boundary values
- **Field arithmetic** - modular operations with edge cases
- **Curve properties** - commutativity, associativity, distributivity

### Test Vectors

The module uses test vectors from:
- Bitcoin Core's key_tests.cpp
- Ethereum go-ethereum crypto tests
- Custom edge case scenarios

## Implementation Notes

### Non-Constant-Time Operations

**CRITICAL SECURITY ISSUE:** All operations are implemented using variable-time algorithms that may leak information through timing side-channels. This includes:

- Scalar multiplication (double-and-add)
- Modular arithmetic operations
- Inverse calculations

For production use, these should be replaced with constant-time implementations.

### EIP-2 Malleability Protection

All signature validation enforces EIP-2 requirements:
- s must be ≤ n/2
- Signatures with high s values are rejected
- Prevents signature malleability attacks

### Point at Infinity Handling

The point at infinity (identity element) is represented with the `infinity` flag set to `true`. All arithmetic operations correctly handle this special case.

### Recovery ID

The recovery_id parameter determines which of the two possible public keys is recovered:
- recovery_id = 0: choose y with even parity
- recovery_id = 1: choose y with odd parity

In Ethereum transaction signatures, v = recovery_id + 27 (or + 35/36 for EIP-155).

## Usage Example

Complete example of signature recovery:

```zig
const std = @import("std");
const secp256k1 = @import("secp256k1");

// Message hash (32 bytes)
const hash = [_]u8{
    0x8f, 0x43, 0x43, 0x46, 0x64, 0x8f, 0x6b, 0x96,
    0xdf, 0x89, 0xdd, 0xa9, 0x1c, 0x51, 0x76, 0xb1,
    0x0a, 0x6d, 0x83, 0x96, 0x1a, 0x2f, 0x7a, 0xee,
    0xcc, 0x93, 0x5c, 0x42, 0xc7, 0x9e, 0xf8, 0x85,
};

// Signature components
const r: u256 = 0x4e45e16932b8af514961a1d3a1a25fdf3f4f7732e9d624c6c61548ab5fb8cd41;
const s: u256 = 0x181522ec8eca07de4860a4acdd12909d831cc56cbbac4622082221a8768d1d09;
const recovery_id: u8 = 0;

// Validate signature
if (!secp256k1.unauditedValidateSignature(r, s)) {
    return error.InvalidSignature;
}

// Recover address
const address = try secp256k1.unauditedRecoverAddress(&hash, recoveryId, r, s);
```

## Security Best Practices

1. **Never use in production** without security audit
2. **Validate all inputs** before processing
3. **Check signature malleability** with EIP-2 rules
4. **Use constant-time implementations** for production
5. **Verify recovered keys** before trusting them
6. **Clear sensitive data** from memory after use
7. **Test extensively** with known test vectors

## Related Modules

- `crypto.zig` - Higher-level ECDSA operations
- `hash.zig` - Keccak256 and other hash functions
- `primitives.Address` - Ethereum address type

## References

- [SEC 2: Recommended Elliptic Curve Domain Parameters](http://www.secg.org/sec2-v2.pdf)
- [secp256k1 Curve Parameters](https://en.bitcoin.it/wiki/Secp256k1)
- [EIP-2: Signature Validation](https://eips.ethereum.org/EIPS/eip-2)
- [Guide to Elliptic Curve Cryptography](https://www.springer.com/gp/book/9780387952734)

## Known Issues

- TODO: Implement constant-time scalar multiplication
- TODO: Implement constant-time modular arithmetic
- TODO: Add side-channel resistance
- TODO: Complete security audit
- TODO: Add batch verification support
- TODO: Optimize with assembly for performance-critical paths
