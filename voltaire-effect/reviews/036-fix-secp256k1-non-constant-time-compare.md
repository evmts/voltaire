# Fix Secp256k1 Non-Constant-Time Comparison

<issue>
<metadata>priority: P1 (security), files: [src/crypto/Secp256k1/verify.js, src/crypto/Secp256k1/verifyHash.js], reviews: [074-crypto-signatures-review.md, 054-fix-address-non-constant-time-equals.md]</metadata>

<problem>
Secp256k1 signature verification uses `.every()` for comparing recovered public keys, which returns early on first mismatch. This creates a timing side-channel that leaks information about how many bytes of the public key matched.

**Vulnerability**: Timing side-channel attack (CWE-208)

**Current code** (`src/crypto/Secp256k1/verify.js#L107`):
```javascript
return recoveredBytes.every((byte, i) => byte === prefixedPublicKey[i]);
```

**Attack scenario**:
1. Attacker submits signature with guessed public key
2. Measures response time
3. Longer response = more matching prefix bytes
4. Iteratively recovers public key byte-by-byte
5. With 33-byte compressed pubkey, requires ~33×256 = 8,448 guesses vs 2^256 brute force

**Security rationale**: Per Intel's guidelines on timing side-channel mitigations:
> "Ensure algorithms consistently process secret data, and only use instructions whose latency is invariant to the data values."

Even small timing differences (nanoseconds) are exploitable via statistical analysis over many samples, especially in cloud environments with low-latency connections.
</problem>

<solution>
Replace `.every()` with constant-time XOR-accumulation comparison that always processes all bytes regardless of where mismatches occur.

**Constant-time algorithm**:
1. Check lengths match (length is not secret)
2. XOR each byte pair, OR result into accumulator
3. Final result is 0 only if all bytes matched
4. No early exit on mismatch

**Why this works**: The XOR and OR operations have data-independent timing on all modern CPUs. The loop always executes for all bytes, eliminating the timing oracle.
</solution>

<implementation>
<steps>
1. Create `src/crypto/_internal/constantTimeEqual.js` utility
2. Replace `.every()` in `verify.js#L107`
3. Replace `.every()` in `verifyHash.js#L90`
4. Apply same fix to any other byte comparisons in crypto code
5. Add security documentation
</steps>

<security_patterns>
```javascript
// src/crypto/_internal/constantTimeEqual.js

/**
 * Constant-time byte array comparison.
 * Prevents timing side-channel attacks by always comparing all bytes.
 *
 * @security This function is designed to resist timing attacks.
 * Do not modify without understanding CWE-208 implications.
 *
 * @param {Uint8Array} a - First byte array
 * @param {Uint8Array} b - Second byte array
 * @returns {boolean} True if arrays are equal
 */
export function constantTimeEqual(a, b) {
  if (a.length !== b.length) {
    return false; // Length is typically not secret
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
}

// Usage in verify.js:
import { constantTimeEqual } from "./_internal/constantTimeEqual.js";

// Replace:
// return recoveredBytes.every((byte, i) => byte === prefixedPublicKey[i]);
// With:
return constantTimeEqual(recoveredBytes, prefixedPublicKey);
```

**Node.js alternative** (if crypto module available):
```javascript
import { timingSafeEqual } from "crypto";

function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
```
</security_patterns>
</implementation>

<tests>
```typescript
describe("constantTimeEqual security", () => {
  it("returns true for identical arrays", () => {
    const a = new Uint8Array([1, 2, 3, 4]);
    const b = new Uint8Array([1, 2, 3, 4]);
    expect(constantTimeEqual(a, b)).toBe(true);
  });

  it("returns false for different arrays", () => {
    const a = new Uint8Array([1, 2, 3, 4]);
    const b = new Uint8Array([1, 2, 3, 5]);
    expect(constantTimeEqual(a, b)).toBe(false);
  });

  it("returns false for different lengths", () => {
    const a = new Uint8Array([1, 2, 3]);
    const b = new Uint8Array([1, 2, 3, 4]);
    expect(constantTimeEqual(a, b)).toBe(false);
  });

  it("handles empty arrays", () => {
    expect(constantTimeEqual(new Uint8Array(0), new Uint8Array(0))).toBe(true);
  });

  // Timing test (informational, not deterministic)
  it("takes similar time regardless of mismatch position", () => {
    const reference = new Uint8Array(1000).fill(0);
    const earlyMismatch = new Uint8Array(1000).fill(0);
    earlyMismatch[0] = 1;
    const lateMismatch = new Uint8Array(1000).fill(0);
    lateMismatch[999] = 1;

    const iterations = 10000;

    const startEarly = performance.now();
    for (let i = 0; i < iterations; i++) {
      constantTimeEqual(reference, earlyMismatch);
    }
    const earlyTime = performance.now() - startEarly;

    const startLate = performance.now();
    for (let i = 0; i < iterations; i++) {
      constantTimeEqual(reference, lateMismatch);
    }
    const lateTime = performance.now() - startLate;

    // Times should be within 20% of each other
    const ratio = Math.max(earlyTime, lateTime) / Math.min(earlyTime, lateTime);
    expect(ratio).toBeLessThan(1.2);
  });
});
```
</tests>

<docs>
```javascript
/**
 * Verifies a secp256k1 signature against a message and public key.
 *
 * @security Uses constant-time comparison for public key matching
 * to prevent timing side-channel attacks (CWE-208). The comparison
 * always processes all bytes regardless of mismatch position.
 *
 * @param signature - 64-byte compact signature (r || s)
 * @param message - Message that was signed
 * @param publicKey - 33-byte compressed or 65-byte uncompressed public key
 * @returns true if signature is valid
 */
```
</docs>

<api>
<before>
```javascript
return recoveredBytes.every((byte, i) => byte === prefixedPublicKey[i]);
```
</before>
<after>
```javascript
return constantTimeEqual(recoveredBytes, prefixedPublicKey);
```
</after>
</api>

<references>
- Intel timing side-channel guidelines: https://www.intel.com/content/www/us/en/developer/articles/technical/software-security-guidance/secure-coding/mitigate-timing-side-channel-crypto-implementation.html
- CWE-208: Observable Timing Discrepancy: https://cwe.mitre.org/data/definitions/208.html
- Node.js crypto.timingSafeEqual: https://nodejs.org/api/crypto.html#cryptotimingsafeequala-b
- Soatok's Guide to Side-Channel Attacks: https://soatok.blog/2020/08/27/soatoks-guide-to-side-channel-attacks/
- Existing codebase pattern: src/crypto/Keystore/decrypt.js#L105
</references>
</issue>
