# Fix Secp256k1 Non-Constant-Time Zero Check

<issue>
<metadata>priority: P1 (security), files: [src/crypto/Secp256k1/sign.js], reviews: [074-crypto-signatures-review.md, 036-fix-secp256k1-non-constant-time-compare.md]</metadata>

<problem>
Private key zero-check uses `.every()` which returns early on first non-zero byte, creating a timing oracle that leaks information about which bytes of the private key are zero.

**Vulnerability**: Timing side-channel attack on private key (CWE-208)

**Current code** (`src/crypto/Secp256k1/sign.js#L52`):
```javascript
if (privateKey.every((b) => b === 0)) {
  throw new InvalidPrivateKeyError("Private key cannot be zero", {...});
}
```

**Attack scenario**:
1. Attacker triggers signing operations with controlled private key input
2. Measures rejection time
3. Faster rejection = fewer leading zero bytes
4. Learns partial information about private key structure
5. Combined with other attacks, reduces keyspace

**Security rationale**: While this attack has lower severity than public key comparison (attacker needs partial control of private key), defense-in-depth requires eliminating all timing oracles in cryptographic code paths.

Per cryptographic best practices: "Sensitive data must never influence branch timing, even in validation code."
</problem>

<solution>
Replace `.every()` with constant-time zero-check that OR-accumulates all bytes, ensuring the check always processes the entire key regardless of byte values.

**Constant-time algorithm**:
1. Initialize accumulator to 0
2. OR each byte into accumulator
3. Result is 0 only if all bytes were 0
4. No early exit on non-zero byte
</solution>

<implementation>
<steps>
1. Create `src/crypto/_internal/constantTimeIsZero.js` utility
2. Replace `.every()` in `sign.js#L52`
3. Apply to any other zero-checks in crypto code
4. Add security documentation
</steps>

<security_patterns>
```javascript
// src/crypto/_internal/constantTimeIsZero.js

/**
 * Constant-time check if all bytes are zero.
 * Prevents timing side-channel attacks by always checking all bytes.
 *
 * @security This function is designed to resist timing attacks.
 * Do not modify without understanding CWE-208 implications.
 *
 * @param {Uint8Array} bytes - Byte array to check
 * @returns {boolean} True if all bytes are zero
 */
export function constantTimeIsZero(bytes) {
  let result = 0;
  for (let i = 0; i < bytes.length; i++) {
    result |= bytes[i];
  }
  return result === 0;
}

// Usage in sign.js:
import { constantTimeIsZero } from "./_internal/constantTimeIsZero.js";

// Replace:
// if (privateKey.every((b) => b === 0)) {
// With:
if (constantTimeIsZero(privateKey)) {
  throw new InvalidPrivateKeyError("Private key cannot be zero", {...});
}
```

**Combined utility file** (`src/crypto/_internal/constantTime.js`):
```javascript
/**
 * Constant-time cryptographic utilities.
 * @security All functions in this module are designed to resist timing attacks.
 */

export function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
}

export function constantTimeIsZero(bytes) {
  let result = 0;
  for (let i = 0; i < bytes.length; i++) {
    result |= bytes[i];
  }
  return result === 0;
}

export function constantTimeSelect(condition, a, b) {
  // Returns a if condition is true (1), b if false (0)
  // condition must be 0 or 1
  const mask = -condition; // 0 or 0xFFFFFFFF
  return (a & mask) | (b & ~mask);
}
```
</security_patterns>
</implementation>

<tests>
```typescript
describe("constantTimeIsZero security", () => {
  it("returns true for all-zero array", () => {
    expect(constantTimeIsZero(new Uint8Array(32))).toBe(true);
  });

  it("returns false if any byte is non-zero", () => {
    const bytes = new Uint8Array(32);
    bytes[31] = 1;
    expect(constantTimeIsZero(bytes)).toBe(false);
  });

  it("returns false if first byte is non-zero", () => {
    const bytes = new Uint8Array(32);
    bytes[0] = 1;
    expect(constantTimeIsZero(bytes)).toBe(false);
  });

  it("handles empty array", () => {
    expect(constantTimeIsZero(new Uint8Array(0))).toBe(true);
  });

  // Timing test (informational)
  it("takes similar time regardless of non-zero position", () => {
    const allZero = new Uint8Array(1000);
    const earlyNonZero = new Uint8Array(1000);
    earlyNonZero[0] = 1;
    const lateNonZero = new Uint8Array(1000);
    lateNonZero[999] = 1;

    const iterations = 10000;

    const startZero = performance.now();
    for (let i = 0; i < iterations; i++) {
      constantTimeIsZero(allZero);
    }
    const zeroTime = performance.now() - startZero;

    const startEarly = performance.now();
    for (let i = 0; i < iterations; i++) {
      constantTimeIsZero(earlyNonZero);
    }
    const earlyTime = performance.now() - startEarly;

    const startLate = performance.now();
    for (let i = 0; i < iterations; i++) {
      constantTimeIsZero(lateNonZero);
    }
    const lateTime = performance.now() - startLate;

    // All times should be within 20% of each other
    const times = [zeroTime, earlyTime, lateTime];
    const ratio = Math.max(...times) / Math.min(...times);
    expect(ratio).toBeLessThan(1.2);
  });
});

describe("secp256k1 sign zero-check", () => {
  it("rejects zero private key", () => {
    const zeroKey = new Uint8Array(32);
    expect(() => sign(message, zeroKey)).toThrow(InvalidPrivateKeyError);
  });

  it("accepts non-zero private key", () => {
    const validKey = new Uint8Array(32);
    validKey[31] = 1;
    // Should not throw
    expect(() => sign(message, validKey)).not.toThrow(InvalidPrivateKeyError);
  });
});
```
</tests>

<docs>
```javascript
/**
 * Signs a message using secp256k1 ECDSA.
 *
 * @security Private key validation uses constant-time zero-check
 * to prevent timing side-channel attacks. The check always processes
 * all 32 bytes regardless of where non-zero bytes appear.
 *
 * @param message - Message to sign
 * @param privateKey - 32-byte private key (must not be zero)
 * @returns 64-byte compact signature (r || s)
 * @throws {InvalidPrivateKeyError} If private key is zero or invalid
 */
```
</docs>

<api>
<before>
```javascript
if (privateKey.every((b) => b === 0)) {
  throw new InvalidPrivateKeyError("Private key cannot be zero", {...});
}
```
</before>
<after>
```javascript
if (constantTimeIsZero(privateKey)) {
  throw new InvalidPrivateKeyError("Private key cannot be zero", {...});
}
```
</after>
</api>

<references>
- Intel timing side-channel guidelines: https://www.intel.com/content/www/us/en/developer/articles/technical/software-security-guidance/secure-coding/mitigate-timing-side-channel-crypto-implementation.html
- CWE-208: Observable Timing Discrepancy: https://cwe.mitre.org/data/definitions/208.html
- Cryptocoding best practices: https://github.com/veorq/cryptocoding
- Related fix: 036-fix-secp256k1-non-constant-time-compare.md
</references>
</issue>
