# Fix BLS12-381 Test Signature Length Assertions

## Problem

BLS12-381 tests assert signatures are 48 bytes, but JSDoc documentation says 96 bytes. One of these is wrong.

**Location**: `src/crypto/Bls12381/Bls12381.test.ts#L19, L101, L124`

```typescript
expect(sig.length).toBe(48);  // Tests say 48
```

But JSDoc says:
```typescript
* @returns {Uint8Array} 96-byte signature
```

## Why This Matters

- Documentation or tests are incorrect
- Users relying on docs will expect wrong size
- BLS G1 points are 48 bytes compressed, G2 are 96 bytes
- Signature type depends on scheme (G1 or G2)

## Investigation

BLS12-381 has two signature schemes:
- **MinPK** (small pubkey, big signature): pubkey=48 bytes (G1), signature=96 bytes (G2)
- **MinSig** (small signature, big pubkey): pubkey=96 bytes (G2), signature=48 bytes (G1)

Check which scheme is used and fix accordingly.

## Solution

If using MinSig (G1 signatures = 48 bytes):
```typescript
// Fix documentation
* @returns {Uint8Array} 48-byte signature (G1 point, MinSig scheme)
```

If using MinPK (G2 signatures = 96 bytes):
```typescript
// Fix tests
expect(sig.length).toBe(96);
```

## Acceptance Criteria

- [ ] Verify which BLS scheme is used (MinSig or MinPK)
- [ ] Fix either documentation or tests to match
- [ ] Document the scheme in JSDoc
- [ ] All tests pass with correct assertions

## Priority

**High** - Incorrect assertions or documentation
