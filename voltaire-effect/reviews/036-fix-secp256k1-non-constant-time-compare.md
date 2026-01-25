# Fix Secp256k1 Non-Constant-Time Comparison

## Problem

Secp256k1 verify uses `.every()` for comparing public keys which may return early on first mismatch, leaking timing information about key bytes.

**Location**: `src/crypto/Secp256k1/verify.js#L107`, `src/crypto/Secp256k1/verifyHash.js#L90`

```javascript
// Current (timing leak):
return recoveredBytes.every((byte, i) => byte === prefixedPublicKey[i]);
```

## Why This Matters

- Timing side-channel attack possible
- Attacker can determine how many bytes match by measuring response time
- Security-critical for signature verification
- Violates cryptographic best practices

## Solution

Use constant-time comparison:

```javascript
/**
 * Constant-time byte array comparison.
 * @param {Uint8Array} a
 * @param {Uint8Array} b
 * @returns {boolean}
 */
function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
}

// Usage:
return constantTimeEqual(recoveredBytes, prefixedPublicKey);
```

Apply to both files:
- `src/crypto/Secp256k1/verify.js#L107`
- `src/crypto/Secp256k1/verifyHash.js#L90`

## Acceptance Criteria

- [ ] Replace `.every()` with constant-time comparison
- [ ] Add `constantTimeEqual` utility function
- [ ] Apply to all signature verification paths
- [ ] All existing tests pass
- [ ] Add timing test to verify constant-time behavior (optional)

## Priority

**High** - Cryptographic security
