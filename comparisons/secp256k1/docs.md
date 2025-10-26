# secp256k1 Elliptic Curve Operations - Detailed Comparison

This document provides a detailed comparison of secp256k1 elliptic curve operations across guil, ethers, and viem, with code examples and implementation notes.

## Overview

secp256k1 is the elliptic curve used for ECDSA signatures in Ethereum. While all three libraries use this curve internally, they differ significantly in how much of the low-level curve operations they expose to developers.

### Design Philosophy Comparison

| Library | Philosophy | Exposure Level |
|---------|-----------|----------------|
| **Guil** | Expose both high-level and low-level operations for advanced use cases | Full (planned) |
| **Ethers** | Abstract away cryptographic details, focus on usability | None |
| **Viem** | Type-safe functional API, implementation details hidden | None |

## Function-by-Function Comparison

### 1. generator(): Point

Get the secp256k1 generator point G.

#### Guil Implementation

```typescript
import { generator, SECP256K1_Gx, SECP256K1_Gy } from "@tevm/primitives";

// Get generator point
const G = generator();
console.log(G.x); // "0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798"
console.log(G.y); // "0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8"

// Constants also exported
console.log(G.x === SECP256K1_Gx); // true
console.log(G.y === SECP256K1_Gy); // true
```

**Status**: ✅ Implemented (returns constant values)

**Source**: `/src/crypto/secp256k1.ts`

#### Ethers Equivalent

```typescript
// Not exposed - ethers doesn't provide access to generator point
// Used internally by SigningKey class

// Closest alternative: use the library's internal secp256k1 instance
// (not recommended - not part of public API)
```

**Status**: ❌ Not available

#### Viem Equivalent

```typescript
// Not exposed - viem doesn't provide access to generator point
// Uses @noble/curves internally but doesn't expose it

// No direct equivalent
```

**Status**: ❌ Not available

#### Alternative: @noble/curves

```typescript
import { secp256k1 } from '@noble/curves/secp256k1';

const G = secp256k1.ProjectivePoint.BASE;
console.log(G.toHex()); // Compressed public key format
console.log(G.toRawBytes(false)); // Uncompressed format
```

**Status**: ✅ Available

---

### 2. isOnCurve(point: Point): boolean

Validate that a point lies on the secp256k1 curve.

#### Guil Implementation

```typescript
import { isOnCurve, generator } from "@tevm/primitives";

const G = generator();
console.log(isOnCurve(G)); // true (when implemented)

const invalidPoint = {
  x: "0x0000000000000000000000000000000000000000000000000000000000000001",
  y: "0x0000000000000000000000000000000000000000000000000000000000000001"
};
console.log(isOnCurve(invalidPoint)); // false (when implemented)

// Currently throws:
// Error: not implemented - requires C API binding
```

**Status**: ⏳ Stub (awaiting Zig implementation)

**Mathematical Operation**: Checks if y² ≡ x³ + 7 (mod p)

#### Ethers Equivalent

```typescript
// Not directly available
// Validation happens internally when parsing public keys

import { SigningKey } from 'ethers';

try {
  const key = new SigningKey(publicKeyBytes);
  // If this succeeds, the point is valid
  console.log("Valid point");
} catch (error) {
  console.log("Invalid point");
}
```

**Status**: ❌ Not directly available (implicit validation only)

#### Viem Equivalent

```typescript
// Not available
// Validation happens internally in signature recovery

import { publicKeyToAddress } from 'viem';

// If publicKeyToAddress succeeds, the point was valid
// But no direct validation function
```

**Status**: ❌ Not available

#### Alternative: @noble/curves

```typescript
import { secp256k1 } from '@noble/curves/secp256k1';

try {
  const point = secp256k1.ProjectivePoint.fromHex(publicKeyHex);
  point.assertValidity(); // Throws if not on curve
  console.log("Valid point");
} catch (error) {
  console.log("Invalid point");
}
```

**Status**: ✅ Available

---

### 3. negate(point: Point): Point

Compute the additive inverse of a point (flip y-coordinate).

#### Guil Implementation

```typescript
import { negate, generator } from "@tevm/primitives";

const G = generator();
const negG = negate(G); // (x, -y mod p)

// When implemented:
// console.log(negG.x === G.x); // true
// console.log(negG.y !== G.y); // true

// Currently throws:
// Error: not implemented - requires C API binding
```

**Status**: ⏳ Stub (awaiting Zig implementation)

**Mathematical Operation**: Given P = (x, y), returns -P = (x, -y mod p)

**Use Case**: Point subtraction (P - Q = P + (-Q))

#### Ethers Equivalent

```typescript
// Not available
// No point arithmetic exposed
```

**Status**: ❌ Not available

#### Viem Equivalent

```typescript
// Not available
// No point arithmetic exposed
```

**Status**: ❌ Not available

#### Alternative: @noble/curves

```typescript
import { secp256k1 } from '@noble/curves/secp256k1';

const G = secp256k1.ProjectivePoint.BASE;
const negG = G.negate();

console.log(G.x === negG.x); // Same x-coordinate
console.log(G.y !== negG.y); // Different y-coordinate
```

**Status**: ✅ Available

---

### 4. double(point: Point): Point

Compute 2P (point doubling).

#### Guil Implementation

```typescript
import { double, generator } from "@tevm/primitives";

const G = generator();
const twoG = double(G); // Efficiently compute G + G

// When implemented:
// More efficient than: add(G, G)

// Currently throws:
// Error: not implemented - requires C API binding
```

**Status**: ⏳ Stub (awaiting Zig implementation)

**Mathematical Operation**: Efficiently compute P + P using tangent line method

**Performance**: More efficient than general point addition

#### Ethers Equivalent

```typescript
// Not available
// Point arithmetic not exposed
```

**Status**: ❌ Not available

#### Viem Equivalent

```typescript
// Not available
// Point arithmetic not exposed
```

**Status**: ❌ Not available

#### Alternative: @noble/curves

```typescript
import { secp256k1 } from '@noble/curves/secp256k1';

const G = secp256k1.ProjectivePoint.BASE;
const twoG = G.double();

// Equivalent to but more efficient than:
// const twoG = G.add(G);
```

**Status**: ✅ Available

---

### 5. add(p1: Point, p2: Point): Point

Add two points on the curve.

#### Guil Implementation

```typescript
import { add, generator, double } from "@tevm/primitives";

const G = generator();
const G2 = double(G);
const G3 = add(G, G2); // G + 2G = 3G

// When implemented:
// Result is another point on the curve

// Currently throws:
// Error: not implemented - requires C API binding
```

**Status**: ⏳ Stub (awaiting Zig implementation)

**Mathematical Operation**: Given P and Q, compute R = P + Q using chord-and-tangent method

**Special Cases**:
- If P = Q: becomes point doubling
- If P = -Q: result is point at infinity
- If P is infinity: result is Q

#### Ethers Equivalent

```typescript
// Not available
// Point arithmetic not exposed
```

**Status**: ❌ Not available

#### Viem Equivalent

```typescript
// Not available
// Point arithmetic not exposed
```

**Status**: ❌ Not available

#### Alternative: @noble/curves

```typescript
import { secp256k1 } from '@noble/curves/secp256k1';

const G = secp256k1.ProjectivePoint.BASE;
const G2 = G.double();
const G3 = G.add(G2);

console.log(G3.equals(G.multiply(3n))); // true
```

**Status**: ✅ Available

---

### 6. multiply(point: Point, scalar: string): Point

Scalar multiplication: compute k·P.

#### Guil Implementation

```typescript
import { multiply, generator } from "@tevm/primitives";

const G = generator();
const privateKey = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

// Compute public key point: privateKey * G
const publicKeyPoint = multiply(G, privateKey);

// When implemented:
// This is the core operation for:
// - Public key derivation
// - ECDH key exchange
// - Signature generation

// Currently throws:
// Error: not implemented - requires C API binding
```

**Status**: ⏳ Stub (awaiting Zig implementation)

**Mathematical Operation**: Given point P and scalar k, compute P + P + ... + P (k times) using efficient algorithms

**Critical Use Cases**:
- Public key derivation: `PublicKey = PrivateKey · G`
- ECDH: `SharedSecret = myPrivateKey · theirPublicKey`
- Signature generation: Computing R point

**Security**: MUST be constant-time to prevent timing attacks

#### Ethers Equivalent

```typescript
// Not directly available
// Used internally by SigningKey

import { SigningKey } from 'ethers';

const privateKey = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
const signingKey = new SigningKey(privateKey);

// Public key is derived internally using scalar multiplication
console.log(signingKey.publicKey); // Compressed: 0x02... or 0x03...
console.log(signingKey.compressedPublicKey); // Compressed format
console.log(signingKey.uncompressedPublicKey); // Uncompressed: 0x04...
```

**Status**: ❌ Not directly available (happens internally)

#### Viem Equivalent

```typescript
// Not directly available
// Used internally by privateKeyToAccount

import { privateKeyToAccount } from 'viem/accounts';

const privateKey = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
const account = privateKeyToAccount(privateKey);

// Address is derived from public key (which comes from scalar multiplication)
console.log(account.address);
```

**Status**: ❌ Not directly available (happens internally)

#### Alternative: @noble/curves

```typescript
import { secp256k1 } from '@noble/curves/secp256k1';

const G = secp256k1.ProjectivePoint.BASE;
const privateKey = BigInt('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');

const publicKeyPoint = G.multiply(privateKey);

console.log(publicKeyPoint.toHex()); // Compressed public key
console.log(publicKeyPoint.toRawBytes(false)); // Uncompressed (65 bytes with 0x04 prefix)
```

**Status**: ✅ Available

---

### 7. extractRecoveryId(signature: Uint8Array): number

Extract the recovery ID (v) from a 65-byte signature.

#### Guil Implementation

```typescript
import { extractRecoveryId } from "@tevm/primitives";

const signature = new Uint8Array(65);
// signature[0..31] = r
// signature[32..63] = s
// signature[64] = v (recovery id)

const recoveryId = extractRecoveryId(signature);
// recoveryId is 0 or 1 (or 27/28 in some formats)

// Currently throws:
// Error: not implemented - requires C API binding
```

**Status**: ⏳ Stub (awaiting Zig implementation)

**Format**: Ethereum signatures are 65 bytes: `[r (32), s (32), v (1)]`

**Recovery ID Values**:
- Pre-EIP-155: v = 27 or 28
- EIP-155: v = chainId * 2 + 35 + {0, 1}

#### Ethers Equivalent

```typescript
// Available through Signature class
import { Signature } from 'ethers';

const signatureHex = "0x..."; // 65-byte signature as hex
const sig = Signature.from(signatureHex);

console.log(sig.r); // r component
console.log(sig.s); // s component
console.log(sig.v); // v (recovery id), already normalized
console.log(sig.yParity); // 0 or 1
console.log(sig.networkV); // Chain-specific v (EIP-155)
```

**Status**: ✅ Available (through Signature parsing)

#### Viem Equivalent

```typescript
// Available through signature utilities
import { hexToSignature, signatureToHex } from 'viem';

const signatureHex = "0x..."; // 65-byte signature as hex
const { r, s, v, yParity } = hexToSignature(signatureHex);

console.log(r); // r component
console.log(s); // s component
console.log(v); // v value (27/28 or chain-specific)
console.log(yParity); // 0 or 1
```

**Status**: ✅ Available (through signature parsing)

#### Alternative: @noble/curves

```typescript
import { secp256k1 } from '@noble/curves/secp256k1';

const signatureBytes = new Uint8Array(65);
// Parse manually
const r = signatureBytes.slice(0, 32);
const s = signatureBytes.slice(32, 64);
const recovery = signatureBytes[64];

// Or use Signature class
const sig = new secp256k1.Signature(
  BigInt('0x' + Buffer.from(r).toString('hex')),
  BigInt('0x' + Buffer.from(s).toString('hex')),
  recovery
);
```

**Status**: ✅ Available

---

## Curve Constants Comparison

### Guil

```typescript
import {
  SECP256K1_P,
  SECP256K1_N,
  SECP256K1_Gx,
  SECP256K1_Gy
} from "@tevm/primitives";

console.log(SECP256K1_P);  // Field prime
console.log(SECP256K1_N);  // Curve order
console.log(SECP256K1_Gx); // Generator x
console.log(SECP256K1_Gy); // Generator y
```

**Status**: ✅ Exported as constants

### Ethers

```typescript
// Not exported
// Constants used internally but not part of public API
```

**Status**: ❌ Not available

### Viem

```typescript
// Not exported
// Constants used by @noble/curves internally
```

**Status**: ❌ Not available

### @noble/curves

```typescript
import { secp256k1 } from '@noble/curves/secp256k1';

console.log(secp256k1.CURVE.p);  // Field prime
console.log(secp256k1.CURVE.n);  // Curve order
console.log(secp256k1.CURVE.Gx); // Generator x (bigint)
console.log(secp256k1.CURVE.Gy); // Generator y (bigint)
```

**Status**: ✅ Available

---

## Practical Use Case Examples

### Use Case 1: Derive Ethereum Address from Private Key

#### High-Level Approach (Recommended)

**Guil:**
```typescript
import { PrivateKeySignerImpl } from "@tevm/primitives";

const signer = PrivateKeySignerImpl.fromPrivateKey({
  privateKey: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
});

console.log(signer.address); // Ethereum address
```

**Ethers:**
```typescript
import { Wallet } from 'ethers';

const wallet = new Wallet("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef");
console.log(wallet.address);
```

**Viem:**
```typescript
import { privateKeyToAccount } from 'viem/accounts';

const account = privateKeyToAccount("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef");
console.log(account.address);
```

#### Low-Level Approach (Advanced)

**Guil (when implemented):**
```typescript
import { multiply, generator } from "@tevm/primitives";
import { keccak_256 } from "@noble/hashes/sha3";

const G = generator();
const privateKey = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

// Step 1: Scalar multiplication (privateKey * G)
const publicKeyPoint = multiply(G, privateKey);

// Step 2: Convert to uncompressed format (64 bytes: x || y)
const publicKeyBytes = new Uint8Array(64);
// ... serialize x and y ...

// Step 3: Keccak-256 hash
const hash = keccak_256(publicKeyBytes);

// Step 4: Take last 20 bytes
const address = '0x' + Buffer.from(hash.slice(-20)).toString('hex');
```

**@noble/curves:**
```typescript
import { secp256k1 } from '@noble/curves/secp256k1';
import { keccak_256 } from '@noble/hashes/sha3';

const privateKey = BigInt('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
const publicKey = secp256k1.getPublicKey(privateKey, false); // Uncompressed

// Remove 0x04 prefix and hash
const hash = keccak_256(publicKey.slice(1));
const address = '0x' + Buffer.from(hash.slice(-20)).toString('hex');
```

---

### Use Case 2: Recover Signer Address from Signature

#### High-Level Approach (Recommended)

**Guil:**
```typescript
import { recoverMessageAddress } from "@tevm/primitives";

const message = "Hello, Ethereum!";
const signature = "0x..."; // 65-byte signature

const address = recoverMessageAddress(message, signature);
console.log(address);
```

**Ethers:**
```typescript
import { verifyMessage } from 'ethers';

const message = "Hello, Ethereum!";
const signature = "0x...";

const address = verifyMessage(message, signature);
console.log(address);
```

**Viem:**
```typescript
import { recoverMessageAddress } from 'viem';

const message = "Hello, Ethereum!";
const signature = "0x...";

const address = await recoverMessageAddress({
  message,
  signature
});
console.log(address);
```

#### Low-Level Approach (Advanced)

This would involve:
1. Parse signature → extract r, s, v
2. Hash message with EIP-191 prefix
3. Recover public key from signature
4. Derive address from public key

All libraries handle this internally. Exposing the low-level operations allows advanced use cases like:
- Custom signature schemes
- Batch verification
- Hardware optimization

---

### Use Case 3: Diffie-Hellman Key Exchange (Advanced)

This requires low-level multiply operation.

**@noble/curves (only practical option today):**
```typescript
import { secp256k1 } from '@noble/curves/secp256k1';

// Alice's keys
const alicePrivate = secp256k1.utils.randomPrivateKey();
const alicePublic = secp256k1.getPublicKey(alicePrivate);

// Bob's keys
const bobPrivate = secp256k1.utils.randomPrivateKey();
const bobPublic = secp256k1.getPublicKey(bobPrivate);

// Both parties can compute the same shared secret
const aliceShared = secp256k1.getSharedSecret(alicePrivate, bobPublic);
const bobShared = secp256k1.getSharedSecret(bobPrivate, alicePublic);

console.log(Buffer.from(aliceShared).equals(Buffer.from(bobShared))); // true
```

**Guil (when implemented):**
```typescript
import { multiply } from "@tevm/primitives";

// Alice computes: alicePrivate * bobPublicPoint
const sharedSecret1 = multiply(bobPublicPoint, alicePrivate);

// Bob computes: bobPrivate * alicePublicPoint
const sharedSecret2 = multiply(alicePublicPoint, bobPrivate);

// Both compute the same point
```

**Ethers/Viem**: Not possible without external library

---

## Performance Considerations

### Scalar Multiplication Performance

Scalar multiplication (k·G) is the most performance-critical operation in ECDSA. Implementation strategies:

1. **Double-and-Add**: Basic algorithm, O(256) operations
2. **Windowed Method**: Precompute multiples, faster
3. **NAF Representation**: Non-Adjacent Form, fewer operations
4. **Fixed-Base Optimization**: G is known, precompute table

All modern libraries use optimized implementations.

### Point Addition vs Point Doubling

Point doubling has simpler formulas than general addition, making it more efficient:

```
Addition (P + Q):   ~12 multiplications + 2 squarings
Doubling (P + P):   ~4 multiplications + 4 squarings
```

Good libraries automatically use doubling when detecting P = Q.

### Projective vs Affine Coordinates

- **Affine**: (x, y) coordinates, requires expensive division
- **Projective**: (X, Y, Z) where x=X/Z, y=Y/Z, avoids division
- **Jacobian**: (X, Y, Z) where x=X/Z², y=Y/Z³, most efficient

@noble/curves uses Jacobian coordinates internally for optimal performance.

---

## Security Deep Dive

### Timing Attack Prevention

**Vulnerable code (DO NOT USE):**
```typescript
function multiply(point: Point, scalar: bigint): Point {
  let result = ZERO;
  let temp = point;

  // Timing leak: loop iterations depend on scalar bits
  while (scalar > 0n) {
    if (scalar & 1n) {
      result = add(result, temp); // Conditional operation leaks bit
    }
    temp = double(temp);
    scalar >>= 1n;
  }
  return result;
}
```

**Problem**: Attacker can measure execution time to determine scalar bits.

**Secure approach (constant-time):**
```typescript
function multiply(point: Point, scalar: bigint): Point {
  let result = ZERO;
  let temp = point;

  // Process all bits regardless of value
  for (let i = 0; i < 256; i++) {
    const bit = (scalar >> BigInt(i)) & 1n;
    result = constantTimeSelect(bit, add(result, temp), result);
    temp = double(temp);
  }
  return result;
}
```

All production libraries (including guil's planned implementation) use constant-time algorithms.

### Invalid Curve Attacks

Attacker provides point not on secp256k1, hoping the implementation uses it anyway on a weaker curve.

**Protection:**
```typescript
function secureMultiply(point: Point, scalar: string): Point {
  // ALWAYS validate point is on curve first
  if (!isOnCurve(point)) {
    throw new Error("Point not on secp256k1 curve");
  }

  // Also check point has correct order
  if (!hasCorrectOrder(point)) {
    throw new Error("Point has invalid order");
  }

  return multiply(point, scalar);
}
```

### Small Subgroup Attacks

Attacker provides point with small order, leaking information about scalar mod small number.

**Protection**: Verify point order divides the curve order (n).

### Signature Malleability

For signature (r, s), (r, -s mod n) is also valid. This allows tampering with transaction hashes.

**Solution (EIP-2)**: Require s ≤ n/2 (canonical signatures).

```typescript
function isCanonicalSignature(s: bigint): boolean {
  const n = BigInt('0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141');
  return s <= n / 2n;
}
```

All three libraries enforce canonical signatures.

---

## When to Use Each Library

### Use Guil When:
- Building EVM execution engines
- Need low-level curve operations (future)
- Want TypeScript/Zig hybrid performance
- Require detailed control over crypto operations

### Use Ethers When:
- Building dApps or wallets
- Want comprehensive ecosystem
- Need excellent documentation
- Don't need low-level operations

### Use Viem When:
- Want type-safe functional API
- Need modern TypeScript support
- Building performance-critical apps
- Prefer lightweight bundle size

### Use @noble/curves When:
- Need low-level curve operations TODAY
- Want battle-tested, audited code
- Need to work in any JavaScript environment
- Implementing custom cryptographic protocols

---

## Migration Guide

### From @noble/curves to Guil (Future)

When guil's curve operations are implemented:

**Before (@noble/curves):**
```typescript
import { secp256k1 } from '@noble/curves/secp256k1';

const G = secp256k1.ProjectivePoint.BASE;
const pub = G.multiply(privateKey);
const doubled = pub.double();
const sum = pub.add(G);
```

**After (guil):**
```typescript
import { generator, multiply, double, add } from "@tevm/primitives";

const G = generator();
const pub = multiply(G, privateKey);
const doubled = double(pub);
const sum = add(pub, G);
```

Benefits:
- Consistent API with rest of @tevm/primitives
- Zig backend for better performance
- TypeScript types maintained
- Memory safety guarantees

---

## Testing and Validation

### Known Test Vectors

All implementations should be validated against standard test vectors:

1. **Generator Point**: Verify G coordinates match specification
2. **Point Operations**: Test with known intermediate results
3. **Edge Cases**: Point at infinity, negation, etc.
4. **Cross-Library**: Same inputs produce same outputs

Example test:
```typescript
import { generator, multiply, add } from "@tevm/primitives";

// Test: 2G should equal G + G
const G = generator();
const G2_doubled = double(G);
const G2_added = add(G, G);

assert(G2_doubled.x === G2_added.x);
assert(G2_doubled.y === G2_added.y);
```

### Security Audits

Before using any cryptographic library in production:

1. **Check audit reports**: Has the code been professionally audited?
2. **Review bug history**: How are vulnerabilities handled?
3. **Test coverage**: Are there comprehensive tests?
4. **Constant-time**: Are timing attacks prevented?

Current status:
- **@noble/curves**: ✅ Audited by Cure53
- **Guil**: ⏳ Audit planned after implementation
- **Ethers**: ✅ Long production history
- **Viem**: ✅ Uses audited @noble libraries

---

## Roadmap

### Guil Implementation Plan

**Phase 1** (Current): High-level signing APIs using @noble/curves
- ✅ Transaction signing
- ✅ Message signing (EIP-191)
- ✅ Typed data signing (EIP-712)
- ✅ Signature recovery

**Phase 2** (Planned): Zig crypto backend
- ⏳ Implement curve operations in Zig
- ⏳ FFI bindings from TypeScript
- ⏳ Constant-time guarantees
- ⏳ Comprehensive test suite

**Phase 3** (Future): Advanced features
- ⏳ Batch verification
- ⏳ Multi-signature protocols
- ⏳ Hardware wallet integration
- ⏳ Zero-knowledge proof primitives

---

## Conclusion

### Quick Decision Matrix

| Your Need | Recommended Solution |
|-----------|---------------------|
| Sign transactions/messages | Use high-level APIs (any library) |
| Verify signatures | Use high-level APIs (any library) |
| Derive addresses | Use high-level APIs (any library) |
| Custom signature schemes | Use @noble/curves (today) or wait for guil |
| Zero-knowledge proofs | Use @noble/curves |
| Multi-signature protocols | Use @noble/curves |
| Research/education | Use @noble/curves |
| Production dApp | Use ethers or viem |
| EVM execution engine | Use guil (current + future features) |

### Key Takeaways

1. **99% of developers don't need low-level curve operations** - Use high-level signing APIs
2. **All three libraries are secure** - They all use well-audited crypto under the hood
3. **For advanced crypto, use @noble/curves today** - Battle-tested and widely deployed
4. **Guil will offer low-level operations in the future** - When you need TypeScript/Zig hybrid performance
5. **Security is paramount** - Never implement your own curve operations without expertise

### Further Reading

- [SEC 2: Recommended Elliptic Curve Domain Parameters](https://www.secg.org/sec2-v2.pdf)
- [Safe Curves: choosing safe curves](https://safecurves.cr.yp.to/)
- [@noble/curves Documentation](https://github.com/paulmillr/noble-curves)
- [Understanding ECDSA](https://www.imperialviolet.org/2011/05/04/ecdsa.html)
- [Constant-Time Cryptography](https://www.bearssl.org/ctmul.html)

---

## Appendix: Complete API Reference

### Guil API (Planned)

```typescript
// Constants
export const SECP256K1_P: string;
export const SECP256K1_N: string;
export const SECP256K1_Gx: string;
export const SECP256K1_Gy: string;

// Types
export interface Point {
  x: string; // hex string with 0x prefix
  y: string; // hex string with 0x prefix
}

// Functions
export function zero(): Point;
export function generator(): Point;
export function isOnCurve(point: Point): boolean;
export function negate(point: Point): Point;
export function double(point: Point): Point;
export function add(p1: Point, p2: Point): Point;
export function multiply(point: Point, scalar: string): Point;
export function extractRecoveryId(signature: Uint8Array): number;
```

### @noble/curves API (Reference)

```typescript
import { secp256k1 } from '@noble/curves/secp256k1';

// Point operations
secp256k1.ProjectivePoint.BASE; // Generator
secp256k1.ProjectivePoint.fromHex(hex);
point.add(other);
point.double();
point.negate();
point.multiply(scalar);
point.assertValidity();

// Signature operations
secp256k1.sign(msgHash, privateKey);
secp256k1.verify(signature, msgHash, publicKey);
new secp256k1.Signature(r, s, recovery);
signature.recoverPublicKey(msgHash);

// Utilities
secp256k1.getPublicKey(privateKey, isCompressed);
secp256k1.getSharedSecret(privateKey, publicKey);
secp256k1.utils.randomPrivateKey();
```

This comprehensive comparison should help developers understand when and how to use secp256k1 operations across different libraries.
