# Fix BLS12-381 Test Signature Length Assertions

<issue>
<metadata>priority: P1 (security), files: [src/crypto/Bls12381/Bls12381.test.ts, src/crypto/Bls12381/sign.js], reviews: [087-bn254-kzg-review.md, 074-crypto-signatures-review.md]</metadata>

<problem>
BLS12-381 tests assert signatures are 48 bytes, but JSDoc documentation says 96 bytes. One of these is incorrect, creating a security-relevant documentation inconsistency.

**Discrepancy**:
```typescript
// Tests (src/crypto/Bls12381/Bls12381.test.ts#L19, L101, L124):
expect(sig.length).toBe(48);

// JSDoc:
* @returns {Uint8Array} 96-byte signature
```

**Security implication**: Incorrect length expectations can cause:
1. Buffer truncation attacks if consumers allocate wrong size
2. Signature validation failures from length mismatches
3. Interoperability issues with other BLS implementations
4. Incorrect padding/alignment in serialization

**BLS12-381 scheme background**:
- **MinPK** (Ethereum 2.0, default): Small pubkey (48 bytes, G1), large signature (96 bytes, G2)
- **MinSig**: Small signature (48 bytes, G1), large pubkey (96 bytes, G2)

The scheme choice affects which curve group contains signatures and public keys.
</problem>

<solution>
1. Verify which BLS scheme the implementation uses
2. Fix either tests or documentation to match actual behavior
3. Document the scheme explicitly in JSDoc
4. Add assertion guards in implementation to catch length issues early
</solution>

<implementation>
<steps>
1. Check underlying BLS library to determine scheme (blst, noble-bls12-381, etc.)
2. Run test to determine actual signature length
3. Fix tests if they're wrong, or fix docs if docs are wrong
4. Add explicit scheme documentation
5. Add length validation in sign/verify functions
</steps>

<security_patterns>
```javascript
// Investigation: Determine actual signature length
// Run: zig build test -Dtest-filter=bls
// Or check the underlying library's scheme

// If using MinSig (G1 signatures = 48 bytes):
/**
 * Signs a message using BLS12-381 (MinSig scheme).
 *
 * @security Uses MinSig scheme where signatures are G1 points (48 bytes)
 * and public keys are G2 points (96 bytes). This is NOT the Ethereum 2.0
 * standard which uses MinPK.
 *
 * @param message - Message to sign
 * @param privateKey - 32-byte private key
 * @returns {Uint8Array} 48-byte signature (compressed G1 point)
 */
export function sign(message, privateKey) {
  const sig = blsSign(message, privateKey);

  // Security: Validate output length
  if (sig.length !== 48) {
    throw new SignatureError({
      message: `Invalid signature length: expected 48, got ${sig.length}`,
      code: "INVALID_SIGNATURE_LENGTH",
    });
  }

  return sig;
}

// If using MinPK (G2 signatures = 96 bytes, Ethereum 2.0 standard):
/**
 * Signs a message using BLS12-381 (MinPK scheme, Ethereum 2.0 compatible).
 *
 * @security Uses MinPK scheme (EIP-2333) where signatures are G2 points
 * (96 bytes) and public keys are G1 points (48 bytes). This is the
 * Ethereum 2.0 standard.
 *
 * @param message - Message to sign
 * @param privateKey - 32-byte private key
 * @returns {Uint8Array} 96-byte signature (compressed G2 point)
 */
export function sign(message, privateKey) {
  const sig = blsSign(message, privateKey);

  // Security: Validate output length
  if (sig.length !== 96) {
    throw new SignatureError({
      message: `Invalid signature length: expected 96, got ${sig.length}`,
      code: "INVALID_SIGNATURE_LENGTH",
    });
  }

  return sig;
}
```

```typescript
// Add explicit length constants
// src/crypto/Bls12381/constants.js

/**
 * BLS12-381 scheme-specific constants.
 * This implementation uses MinSig/MinPK scheme (document which).
 */
export const BLS12381_CONSTANTS = {
  // MinSig scheme
  SIGNATURE_LENGTH: 48,    // G1 compressed
  PUBLIC_KEY_LENGTH: 96,   // G2 compressed
  PRIVATE_KEY_LENGTH: 32,

  // OR MinPK scheme (Ethereum 2.0)
  // SIGNATURE_LENGTH: 96,  // G2 compressed
  // PUBLIC_KEY_LENGTH: 48, // G1 compressed
  // PRIVATE_KEY_LENGTH: 32,
} as const;
```
</security_patterns>
</implementation>

<tests>
```typescript
import { BLS12381_CONSTANTS } from "./constants.js";

describe("BLS12-381 signature lengths", () => {
  const privateKey = Bls12381.generatePrivateKey();
  const publicKey = Bls12381.getPublicKey(privateKey);
  const message = new Uint8Array([1, 2, 3, 4]);

  it("signature has correct length per scheme", () => {
    const sig = Bls12381.sign(message, privateKey);
    expect(sig.length).toBe(BLS12381_CONSTANTS.SIGNATURE_LENGTH);
  });

  it("public key has correct length per scheme", () => {
    expect(publicKey.length).toBe(BLS12381_CONSTANTS.PUBLIC_KEY_LENGTH);
  });

  it("private key is 32 bytes", () => {
    expect(privateKey.length).toBe(BLS12381_CONSTANTS.PRIVATE_KEY_LENGTH);
  });

  it("aggregated signature has same length as single signature", () => {
    const sig1 = Bls12381.sign(message, privateKey);
    const sig2 = Bls12381.sign(message, Bls12381.generatePrivateKey());
    const aggregated = Bls12381.aggregate([sig1, sig2]);
    expect(aggregated.length).toBe(BLS12381_CONSTANTS.SIGNATURE_LENGTH);
  });

  it("rejects signature with wrong length", () => {
    const wrongLength = new Uint8Array(BLS12381_CONSTANTS.SIGNATURE_LENGTH - 1);
    expect(() => Bls12381.verify(wrongLength, message, publicKey)).toThrow();
  });

  describe("scheme documentation consistency", () => {
    it("matches Ethereum 2.0 if using MinPK", () => {
      // If we claim Ethereum 2.0 compatibility, verify:
      if (BLS12381_CONSTANTS.SIGNATURE_LENGTH === 96) {
        expect(BLS12381_CONSTANTS.PUBLIC_KEY_LENGTH).toBe(48);
      }
    });

    it("matches MinSig if using 48-byte signatures", () => {
      if (BLS12381_CONSTANTS.SIGNATURE_LENGTH === 48) {
        expect(BLS12381_CONSTANTS.PUBLIC_KEY_LENGTH).toBe(96);
      }
    });
  });
});
```
</tests>

<docs>
```javascript
/**
 * BLS12-381 Signature Scheme
 *
 * This implementation uses the [MinSig/MinPK] scheme:
 *
 * | Element     | Curve | Size (compressed) |
 * |-------------|-------|-------------------|
 * | Signature   | G1/G2 | 48/96 bytes       |
 * | Public Key  | G2/G1 | 96/48 bytes       |
 * | Private Key | Zp    | 32 bytes          |
 *
 * @security Different BLS schemes are NOT interoperable. Signatures
 * from MinSig cannot be verified with MinPK public keys. Ensure
 * consistent scheme usage across your application.
 *
 * @see EIP-2333 for Ethereum 2.0 key derivation
 * @see https://datatracker.ietf.org/doc/html/draft-irtf-cfrg-bls-signature
 */
```
</docs>

<api>
<before>
```typescript
// Inconsistent documentation
expect(sig.length).toBe(48);  // Test
* @returns {Uint8Array} 96-byte signature  // JSDoc
```
</before>
<after>
```typescript
// Consistent with scheme constants
expect(sig.length).toBe(BLS12381_CONSTANTS.SIGNATURE_LENGTH);

/**
 * @returns {Uint8Array} Signature (48 bytes for MinSig, 96 bytes for MinPK)
 * @see BLS12381_CONSTANTS for scheme-specific sizes
 */
```
</after>
</api>

<references>
- BLS Signature Spec: https://datatracker.ietf.org/doc/html/draft-irtf-cfrg-bls-signature
- EIP-2333 (Ethereum 2.0 key derivation): https://eips.ethereum.org/EIPS/eip-2333
- EIP-2335 (Keystore format): https://eips.ethereum.org/EIPS/eip-2335
- blst library: https://github.com/supranational/blst
- noble-bls12-381: https://github.com/paulmillr/noble-bls12-381
- BLS12-381 curve: https://hackmd.io/@benjaminion/bls12-381
</references>
</issue>
