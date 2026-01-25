# Fix Address Non-Constant-Time Equals

## Problem

Address equals function uses early-return comparison which may leak timing information.

**Location**: `src/primitives/Address/equals.js` (or similar)

```javascript
// Potentially non-constant-time:
function equals(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;  // Early return!
  }
  return true;
}
```

## Why This Matters

- Timing attack possible when comparing addresses in sensitive contexts
- Attacker can learn prefix bytes by measuring comparison time
- Lower severity than private key comparison, but still a concern
- Defense in depth principle

## Solution

Use constant-time comparison:

```javascript
/**
 * Constant-time address comparison.
 * @param {Uint8Array} a
 * @param {Uint8Array} b
 * @returns {boolean}
 */
export function equals(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
}
```

Note: Length check can remain early-return since address length (20 bytes) is public knowledge.

## Acceptance Criteria

- [ ] Replace early-return comparison with XOR-accumulate
- [ ] Apply to all byte array comparison functions
- [ ] All existing tests pass
- [ ] Consider extracting to shared utility

## Priority

**Low** - Defense in depth (address is public, but good practice)
