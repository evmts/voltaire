# secp256k1 Elliptic Curve Operations

Comprehensive documentation of secp256k1 elliptic curve cryptography operations for Ethereum signature verification and public key derivation.

## Important Note

**These are advanced low-level cryptographic operations that most developers will never need directly.** The functions documented here are currently stubs in guil, awaiting implementation through C API bindings to the underlying Zig cryptographic library.

For most Ethereum development tasks, you should use the high-level signing APIs instead:
- `PrivateKeySigner.signTransaction()` - Sign transactions
- `PrivateKeySigner.signMessage()` - Sign EIP-191 messages
- `recoverMessageAddress()` - Recover signer address from signature
- `recoverTransactionAddress()` - Recover transaction signer

## What is secp256k1?

secp256k1 is the elliptic curve used for cryptographic signatures in both Bitcoin and Ethereum. It provides the mathematical foundation for:

- **ECDSA Signatures**: Proving ownership of private keys without revealing them
- **Public Key Derivation**: Generating Ethereum addresses from private keys
- **Signature Recovery**: Extracting the signer's public key from a signature
- **Key Generation**: Creating secure cryptographic key pairs

### Mathematical Background

secp256k1 is defined by the equation: **y² = x³ + 7** over a finite field.

Points on this curve form a mathematical group where:
- **Point Addition**: Combining two points produces another point on the curve
- **Point Doubling**: A special case of addition where both points are the same
- **Scalar Multiplication**: Repeatedly adding a point to itself (the basis of public key cryptography)

The security of ECDSA relies on the **Discrete Logarithm Problem**: given a point P and Q = k·P, it's computationally infeasible to find k, even though computing Q from k and P is easy.

## Curve Parameters

secp256k1 is defined by these constants (all in hexadecimal):

### SECP256K1_P - Field Prime
```
0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f
```
The prime modulus of the finite field over which the curve is defined.

### SECP256K1_N - Curve Order
```
0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141
```
The order of the generator point (number of points in the cyclic group).

### SECP256K1_Gx - Generator X Coordinate
```
0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798
```

### SECP256K1_Gy - Generator Y Coordinate
```
0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8
```

The generator point G = (Gx, Gy) is the base point used for all scalar multiplication operations.

## Functions Overview

All functions below are **currently stubs in guil** that throw errors indicating they require C API bindings to the underlying Zig implementation.

### 1. generator(): Point

Get the standard generator point G.

**Mathematical Definition**: Returns the base point of the secp256k1 curve.

**Implementation Status**:
- **Guil**: Implemented - returns the constant generator coordinates
- **Ethers**: Not exposed (uses internal secp256k1 implementation)
- **Viem**: Not exposed (uses @noble/curves internally)

**Use Cases**:
- Custom cryptographic protocols
- Key derivation schemes
- Pedersen commitments
- Zero-knowledge proofs

**Example**:
```typescript
import { generator } from "@tevm/primitives";

const G = generator();
// G = {
//   x: "0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798",
//   y: "0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8"
// }
```

### 2. isOnCurve(point: Point): boolean

Validate that a point lies on the secp256k1 curve.

**Mathematical Definition**: Checks if y² ≡ x³ + 7 (mod p)

**Implementation Status**:
- **Guil**: Stub - awaiting Zig implementation
- **Ethers**: Not exposed
- **Viem**: Not exposed (available via @noble/curves)

**Use Cases**:
- Validating public keys before use
- Verifying point operations didn't produce invalid results
- Security checks in custom protocols
- Preventing invalid curve attacks

**Security Critical**: Always validate points received from untrusted sources to prevent invalid curve attacks.

**Example**:
```typescript
import { isOnCurve, generator } from "@tevm/primitives";

const G = generator();
console.log(isOnCurve(G)); // true

const invalidPoint = {
  x: "0x0000000000000000000000000000000000000000000000000000000000000001",
  y: "0x0000000000000000000000000000000000000000000000000000000000000001"
};
console.log(isOnCurve(invalidPoint)); // false
```

### 3. negate(point: Point): Point

Compute the additive inverse of a point.

**Mathematical Definition**: Given P = (x, y), returns -P = (x, -y mod p)

**Implementation Status**:
- **Guil**: Stub - awaiting Zig implementation
- **Ethers**: Not exposed
- **Viem**: Not exposed (available via @noble/curves)

**Use Cases**:
- Signature verification algorithms
- Point subtraction (P - Q = P + (-Q))
- Custom cryptographic constructions
- Ring signatures

**Example**:
```typescript
import { negate, generator } from "@tevm/primitives";

const G = generator();
const negG = negate(G);
// negG.x === G.x
// negG.y === (-G.y) mod P
```

### 4. double(point: Point): Point

Compute 2P (point doubling).

**Mathematical Definition**: Efficiently compute P + P using the tangent line method.

**Implementation Status**:
- **Guil**: Stub - awaiting Zig implementation
- **Ethers**: Not exposed
- **Viem**: Not exposed (available via @noble/curves)

**Use Cases**:
- Building blocks for scalar multiplication
- Optimized cryptographic protocols
- Custom key derivation
- Performance-critical point operations

**Note**: Point doubling is more efficient than general point addition due to simplified formulas.

**Example**:
```typescript
import { double, generator } from "@tevm/primitives";

const G = generator();
const twoG = double(G);
// Equivalent to: G + G
// But computed more efficiently
```

### 5. add(p1: Point, p2: Point): Point

Add two points on the curve.

**Mathematical Definition**: Given P and Q, compute R = P + Q using the chord-and-tangent method.

**Implementation Status**:
- **Guil**: Stub - awaiting Zig implementation
- **Ethers**: Not exposed
- **Viem**: Not exposed (available via @noble/curves)

**Use Cases**:
- Building blocks for signature schemes
- Multi-signature protocols
- Threshold cryptography
- Homomorphic encryption schemes

**Special Cases**:
- If P = Q, this becomes point doubling
- If P = -Q, result is point at infinity
- If P is point at infinity, result is Q

**Example**:
```typescript
import { add, generator, double } from "@tevm/primitives";

const G = generator();
const G2 = double(G);
const G3 = add(G, G2);
// G3 = 3G
```

### 6. multiply(point: Point, scalar: string): Point

Scalar multiplication: compute k·P.

**Mathematical Definition**: Given point P and scalar k, compute P + P + ... + P (k times) using efficient algorithms.

**Implementation Status**:
- **Guil**: Stub - awaiting Zig implementation
- **Ethers**: Not exposed
- **Viem**: Not exposed (available via @noble/curves)

**Use Cases**:
- **Public key derivation**: PublicKey = PrivateKey · G
- **Signature generation**: Computing R = k · G
- **Diffie-Hellman key exchange**: SharedSecret = privateKey · OtherPublicKey
- **Zero-knowledge proofs**: Various commitment schemes

**Implementation Notes**:
- Uses optimized algorithms (windowed multiplication, NAF representation)
- Constant-time implementation prevents timing attacks
- Most performance-critical operation in ECDSA

**Security Critical**: Must use constant-time implementation to prevent side-channel attacks that could leak the scalar (private key).

**Example**:
```typescript
import { multiply, generator } from "@tevm/primitives";

const G = generator();
const privateKey = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
const publicKey = multiply(G, privateKey);
// This is how Ethereum public keys are derived from private keys
```

### 7. extractRecoveryId(signature: Uint8Array): number

Extract the recovery ID from a 65-byte signature.

**Definition**: Ethereum signatures include a recovery ID (v) that allows recovering the public key from just the signature and message hash.

**Implementation Status**:
- **Guil**: Stub - awaiting Zig implementation
- **Ethers**: Not exposed (internal to signature parsing)
- **Viem**: Not exposed (internal to signature parsing)

**Use Cases**:
- Parsing raw signature bytes
- Signature verification
- Public key recovery
- Transaction validation

**Format**: Ethereum signatures are 65 bytes: [r (32 bytes), s (32 bytes), v (1 byte)]
- v is typically 27 or 28 (pre-EIP-155)
- v is chainId * 2 + 35 + {0,1} (EIP-155)

**Example**:
```typescript
import { extractRecoveryId } from "@tevm/primitives";

const signature = new Uint8Array(65);
// ... fill with signature data ...
const recoveryId = extractRecoveryId(signature);
// recoveryId is 0 or 1
```

## Library Comparison

### Guil (@tevm/primitives)

**Status**: Stubs awaiting C API bindings to Zig implementation

**Location**: `/src/crypto/secp256k1.ts`

**Philosophy**: Expose low-level curve operations for advanced users while providing high-level APIs for common tasks.

**Current State**: Only `generator()` is implemented. All other functions throw:
```typescript
throw new Error("not implemented - requires C API binding");
```

**Future Implementation**: Will bind to Zig crypto library via FFI for:
- High performance (native code)
- Constant-time operations (security)
- Memory safety (Zig guarantees)
- Cross-platform support

### Ethers.js

**Approach**: Abstracts away low-level curve operations entirely.

**Philosophy**: Developers shouldn't need to think about elliptic curve math. Ethers handles all cryptographic operations internally through its `SigningKey` class.

**Available APIs**:
- `new SigningKey(privateKey)` - Create signer from private key
- `SigningKey.publicKey` - Get compressed public key
- `SigningKey.signDigest()` - Sign a hash
- `SigningKey.recoverPublicKey()` - Recover public key from signature

**Not Available**: Direct curve operations (add, double, multiply, etc.)

**Why**: The vast majority of Ethereum developers never need low-level curve operations. Ethers focuses on the 99% use case.

### Viem

**Approach**: Similar to ethers - no direct curve operation exposure.

**Philosophy**: Type-safe, functional API for Ethereum operations. Cryptographic details are implementation concerns, not API surface.

**Available APIs**:
- `privateKeyToAccount()` - Derive account from private key
- `signMessage()` - Sign EIP-191 messages
- `signTransaction()` - Sign transactions
- `recoverAddress()` - Recover signer address

**Internal Implementation**: Uses `@noble/curves/secp256k1` under the hood but doesn't expose it.

**Not Available**: Direct curve operations.

**Why**: Keeping the API surface small and focused on practical Ethereum development tasks.

### @noble/curves (Alternative)

If you need low-level secp256k1 operations today, use `@noble/curves/secp256k1` directly:

```typescript
import { secp256k1 } from '@noble/curves/secp256k1';

// Generator point
const G = secp256k1.ProjectivePoint.BASE;

// Point operations
const P = secp256k1.ProjectivePoint.fromHex(publicKeyHex);
const doubled = P.double();
const sum = P.add(G);
const product = P.multiply(BigInt('0x123...'));

// Curve validation
const isValid = secp256k1.ProjectivePoint.fromHex(pubkey).assertValidity();

// This is what viem and modern libraries use internally
```

**Advantages**:
- Battle-tested, widely audited
- Pure TypeScript (works everywhere)
- Excellent performance
- Comprehensive test coverage
- Active maintenance

## When Do You Need Low-Level Curve Operations?

Most Ethereum developers never need direct curve operations. Use the high-level APIs instead:

### Use High-Level APIs For:
- Signing transactions → `signer.signTransaction()`
- Signing messages → `signer.signMessage()`
- Verifying signatures → `verifyMessage()`, `recoverMessageAddress()`
- Deriving addresses → `privateKeyToAddress()`
- Key generation → `PrivateKeySignerImpl.random()`

### Only Use Low-Level Operations For:
- **Custom signature schemes**: Ring signatures, threshold signatures, blind signatures
- **Zero-knowledge proofs**: Commitments, range proofs, bulletproofs
- **Advanced cryptography**: Adaptor signatures, scriptless scripts, discrete log contracts
- **Research**: Implementing new cryptographic protocols
- **Exotic constructions**: Stealth addresses, linkable ring signatures
- **Cross-chain protocols**: Custom multi-signature schemes

## Security Considerations

### Critical Security Requirements

1. **Point Validation**: Always validate points before operations
   - Check point is on curve
   - Check point is not identity (point at infinity)
   - Check point has correct order

2. **Constant-Time Operations**: Prevent timing attacks
   - Scalar multiplication must be constant-time
   - Point addition should not leak information
   - Critical for any operation involving secret keys

3. **Side-Channel Resistance**:
   - CPU cache timing attacks
   - Power analysis
   - Electromagnetic emanation

4. **Input Validation**:
   - Scalars must be in range [1, n-1]
   - Points must be validated
   - Signatures must be canonical (low-s form)

5. **Memory Safety**:
   - Clear sensitive data after use
   - Avoid memory leaks with secrets
   - Prevent buffer overflows

### Common Vulnerabilities

1. **Invalid Curve Attacks**: Using points not on secp256k1
2. **Small Subgroup Attacks**: Points with small order
3. **Timing Attacks**: Non-constant-time scalar multiplication
4. **Signature Malleability**: Non-canonical signatures (high-s)
5. **Nonce Reuse**: Using same k for multiple signatures

## Use Cases in Detail

### 1. Public Key Recovery (Common)

Ethereum signatures allow recovering the signer's public key and address without storing the public key on-chain, saving gas.

```typescript
// High-level API (use this)
import { recoverMessageAddress } from "@tevm/primitives";
const address = recoverMessageAddress(message, signature);

// Low-level (only if you need the actual public key point)
// Would involve: multiply, add operations on the curve
```

### 2. Multi-Signature Protocols (Advanced)

Threshold signatures where k-of-n parties must sign.

```typescript
// Requires: add, multiply operations
// Example: MuSig2, FROST protocols
```

### 3. Stealth Addresses (Advanced)

Privacy-preserving payment addresses where sender generates one-time addresses.

```typescript
// Requires: multiply, add operations
// Sender: computes R = r·G, P = H(r·A)·G + B
// Receiver: scans blockchain for payments
```

### 4. Adaptor Signatures (Advanced)

Signatures that can be atomically revealed when another signature is revealed.

```typescript
// Requires: multiply, add operations
// Used in atomic swaps, payment channels
```

### 5. Zero-Knowledge Proofs (Advanced)

Proving statements about secret values without revealing them.

```typescript
// Requires: multiply operations for commitments
// Example: Pedersen commitments, bulletproofs
```

## Current Implementation Status

### Working Today
- High-level signing APIs (use these!)
- Signature verification and recovery
- Address derivation
- Transaction signing (all types)
- Message signing (EIP-191, EIP-712)

### Awaiting Implementation
- Low-level curve operations (add, double, multiply, etc.)
- Direct point validation
- Point negation
- Custom cryptographic constructions

### Implementation Timeline

The guil team plans to implement low-level curve operations through:

1. **Zig Implementation**: Cryptographic operations in Zig for safety and performance
2. **C API Bindings**: FFI interface from TypeScript to Zig
3. **Constant-Time Guarantees**: Security-audited implementations
4. **Comprehensive Tests**: Test vectors from specifications

Until then, use `@noble/curves/secp256k1` if you need these operations.

## Examples

### Example 1: Verify Generator Point (Works Today)

```typescript
import { generator, SECP256K1_Gx, SECP256K1_Gy } from "@tevm/primitives";

const G = generator();
console.log(G.x === SECP256K1_Gx); // true
console.log(G.y === SECP256K1_Gy); // true
```

### Example 2: Public Key Derivation (High-Level API)

```typescript
import { PrivateKeySignerImpl } from "@tevm/primitives";

const signer = PrivateKeySignerImpl.fromPrivateKey({
  privateKey: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
});

// Address derived internally using: keccak256(multiply(G, privateKey))
console.log(signer.address);
```

### Example 3: Using @noble/curves (Works Today)

```typescript
import { secp256k1 } from '@noble/curves/secp256k1';
import { hexToBytes } from '@noble/hashes/utils';

const G = secp256k1.ProjectivePoint.BASE;
const privateKey = BigInt('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');

// Scalar multiplication
const publicKey = G.multiply(privateKey);

// Point operations
const doubled = G.double();
const sum = G.add(publicKey);

// Validation
publicKey.assertValidity();
console.log('Point is on curve:', true);
```

## References

### Specifications
- [SEC 2: Recommended Elliptic Curve Domain Parameters](https://www.secg.org/sec2-v2.pdf)
- [ECDSA: The Digital Signature Algorithm](https://en.wikipedia.org/wiki/Elliptic_Curve_Digital_Signature_Algorithm)
- [secp256k1 Curve Details](https://en.bitcoin.it/wiki/Secp256k1)

### Ethereum Standards
- [EIP-155: Simple replay attack protection](https://eips.ethereum.org/EIPS/eip-155)
- [EIP-191: Signed Data Standard](https://eips.ethereum.org/EIPS/eip-191)
- [EIP-712: Typed structured data hashing](https://eips.ethereum.org/EIPS/eip-712)

### Cryptography Resources
- [Understanding ECDSA](https://www.imperialviolet.org/2011/05/04/ecdsa.html)
- [SafeCurves: choosing safe curves for elliptic-curve cryptography](https://safecurves.cr.yp.to/)
- [Constant-Time Cryptography](https://www.bearssl.org/ctmul.html)

### Implementation Libraries
- [@noble/curves](https://github.com/paulmillr/noble-curves) - Audited, production-ready
- [@noble/hashes](https://github.com/paulmillr/noble-hashes) - Cryptographic hashing
- [Guil Source](https://github.com/tevm/primitives) - This implementation

## Conclusion

Low-level elliptic curve operations are powerful tools for advanced cryptography, but most Ethereum developers should use the high-level signing APIs instead. These operations are:

- **Mission-critical**: Bugs can compromise security
- **Complex**: Require deep cryptographic knowledge
- **Sensitive**: Must be constant-time to prevent attacks
- **Specialized**: Only needed for exotic constructions

When you need them, guil will provide safe, audited implementations through its Zig backend. Until then, `@noble/curves` is the recommended alternative for production use.

For 99% of Ethereum development tasks, stick with:
- `PrivateKeySignerImpl` for signing
- `recoverMessageAddress()` for verification
- `verifyMessage()` for validation

These high-level APIs handle all the curve operations correctly and securely under the hood.
