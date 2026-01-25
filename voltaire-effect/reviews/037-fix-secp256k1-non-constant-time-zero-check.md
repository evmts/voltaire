# Fix Secp256k1 Non-Constant-Time Zero Check

## Problem

Private key zero check uses `.every()` which may return early, leaking timing information about key bytes.

**Location**: `src/crypto/Secp256k1/sign.js#L52`

```javascript
// Current (timing leak):
if (privateKey.every((b) => b === 0)) {
  throw new InvalidPrivateKeyError("Private key cannot be zero", {...});
}
```

## Why This Matters

- Timing oracle for private key bytes
- Attacker can learn if initial bytes are zero by measuring rejection time
- Lower severity than public key comparison but still a concern
- Defense in depth principle

## Solution

Use constant-time zero check:

```javascript
/**
 * Constant-time check if all bytes are zero.
 * @param {Uint8Array} bytes
 * @returns {boolean}
 */
function constantTimeIsZero(bytes) {
  let result = 0;
  for (let i = 0; i < bytes.length; i++) {
    result |= bytes[i];
  }
  return result === 0;
}

// Usage:
if (constantTimeIsZero(privateKey)) {
  throw new InvalidPrivateKeyError("Private key cannot be zero", {...});
}
```

## Acceptance Criteria

- [ ] Replace `.every()` with constant-time zero check
- [ ] Add `constantTimeIsZero` utility function
- [ ] Apply to all private key validation paths
- [ ] All existing tests pass

## Priority

**High** - Cryptographic security (defense in depth)
