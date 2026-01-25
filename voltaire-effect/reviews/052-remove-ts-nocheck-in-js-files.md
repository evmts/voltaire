# Remove @ts-nocheck in .js Files

<issue>
<metadata>
priority: P3
severity: low
category: code-quality
files: [
  src/crypto/Secp256k1/sign.js,
  src/crypto/Secp256k1/verify.js,
  src/crypto/Secp256k1/index.js,
  src/crypto/Ed25519/Ed25519.js,
  src/crypto/Bls12381/Bls12381.js,
  src/crypto/HDWallet/HDWallet.js
]
reviews: [074-crypto-signatures-review.md]
</metadata>

<problem>
Multiple `.js` files use `// @ts-nocheck` which completely disables TypeScript type checking.

**Found files (sample)**:
```
src/crypto/Secp256k1/sign.js:1:// @ts-nocheck
src/crypto/Secp256k1/verify.js:1:// @ts-nocheck
src/crypto/Secp256k1/index.js:1:// @ts-nocheck
src/crypto/Ed25519/Ed25519.js:1:// @ts-nocheck
src/crypto/Bls12381/Bls12381.js:1:// @ts-nocheck
src/crypto/HDWallet/HDWallet.js:1:// @ts-nocheck
...and 50+ more files
```

**Impact**:
- Wrong parameter types go unnoticed at compile time
- Return type mismatches aren't caught
- Import errors are silent
- Refactoring breaks without warning
- JSDoc types are not validated
- IDE autocompletion is degraded
</problem>

<solution>
Remove `@ts-nocheck` and add proper JSDoc type annotations:
1. Use `@param` and `@returns` for function signatures
2. Use `@typedef` for importing types from TypeScript files
3. Use `@template` for generic functions
4. Create companion `.d.ts` files for complex APIs

**Priority order**:
1. Crypto modules (security-critical)
2. Primitives modules (widely used)
3. Utility modules (lower priority)
</solution>

<implementation>
<steps>
1. Start with highest-priority files: crypto/Secp256k1/*.js
2. Remove `// @ts-nocheck` from each file
3. Run `pnpm typecheck` to identify errors
4. Add JSDoc type annotations to fix each error
5. For complex types, create/update `.d.ts` declaration files
6. Repeat for other crypto modules
7. Repeat for primitives modules
8. Verify `pnpm typecheck` passes
</steps>

<code_changes>
```javascript
// BEFORE: src/crypto/Secp256k1/sign.js
// @ts-nocheck
import { secp256k1 } from "@noble/curves/secp256k1";

const sign = (hash, privateKey) => {
  return secp256k1.sign(hash, privateKey);
}

// AFTER: src/crypto/Secp256k1/sign.js
import { secp256k1 } from "@noble/curves/secp256k1";

/**
 * @typedef {import('./types.js').PrivateKey} PrivateKey
 * @typedef {import('./types.js').Signature} Signature
 * @typedef {import('./types.js').SignOptions} SignOptions
 */

/**
 * Signs a 32-byte message hash using secp256k1 ECDSA.
 *
 * Produces a deterministic signature per RFC 6979.
 * By default, enforces low-S values per BIP-62 to prevent malleability.
 *
 * @param {Uint8Array} hash - 32-byte message hash (e.g., keccak256 output)
 * @param {Uint8Array} privateKey - 32-byte private key
 * @param {SignOptions} [options] - Optional signing parameters
 * @returns {Signature} Signature object with r, s, and recovery values
 *
 * @example
 * const sig = sign(hash, privateKey);
 * console.log(sig.r, sig.s, sig.recovery);
 */
export const sign = (hash, privateKey, options) => {
  const sig = secp256k1.sign(hash, privateKey, options);
  return {
    r: sig.r,
    s: sig.s,
    recovery: sig.recovery,
  };
};

// BEFORE: src/crypto/Secp256k1/verify.js
// @ts-nocheck
const verify = (signature, hash, publicKey) => {
  // ...
}

// AFTER: src/crypto/Secp256k1/verify.js
/**
 * @typedef {import('./types.js').Signature} Signature
 */

/**
 * Verifies a secp256k1 ECDSA signature.
 *
 * @param {Signature} signature - Signature to verify (r, s components)
 * @param {Uint8Array} hash - 32-byte message hash
 * @param {Uint8Array} publicKey - 33 or 65 byte public key
 * @returns {boolean} True if signature is valid
 *
 * @example
 * const isValid = verify(signature, hash, publicKey);
 */
export const verify = (signature, hash, publicKey) => {
  // ...
};

// For complex APIs, create companion .d.ts file:
// src/crypto/Secp256k1/sign.d.ts
export interface SignOptions {
  /** Enforce low S values per BIP-62 (default: true) */
  lowS?: boolean;
  /** Additional entropy for RFC 6979 */
  extraEntropy?: Uint8Array;
}

export interface Signature {
  /** R component (32 bytes) */
  readonly r: Uint8Array;
  /** S component (32 bytes) */
  readonly s: Uint8Array;
  /** Recovery ID (0-3) */
  readonly recovery: number;
}

export function sign(
  hash: Uint8Array,
  privateKey: Uint8Array,
  options?: SignOptions
): Signature;

export function verify(
  signature: Signature,
  hash: Uint8Array,
  publicKey: Uint8Array
): boolean;

// Generic function example:
// src/utils/array.js (AFTER)
/**
 * Returns the first element of an array.
 *
 * @template T
 * @param {T[]} items - Array of items
 * @returns {T | undefined} First item or undefined if empty
 */
export const first = (items) => items[0];

// Type assertion example:
// When needed for complex expressions
/** @type {Uint8Array} */
const result = someComplexFunction();
```

**Pattern catalog for JSDoc migration**:

```javascript
// 1. Simple function with primitives
/**
 * @param {string} name
 * @param {number} age
 * @returns {boolean}
 */
export const isAdult = (name, age) => age >= 18;

// 2. Function with complex types
/**
 * @typedef {import('./types.js').User} User
 * @param {User} user
 * @returns {string}
 */
export const getUserName = (user) => user.name;

// 3. Optional parameters
/**
 * @param {string} name
 * @param {number} [age=0] - Optional with default
 * @returns {void}
 */
export const greet = (name, age = 0) => { };

// 4. Object parameter
/**
 * @param {{ x: number, y: number }} point
 * @returns {number}
 */
export const distance = (point) => Math.sqrt(point.x ** 2 + point.y ** 2);

// 5. Generic function
/**
 * @template T
 * @param {T[]} arr
 * @param {(item: T) => boolean} predicate
 * @returns {T | undefined}
 */
export const find = (arr, predicate) => arr.find(predicate);

// 6. Class method
class Example {
  /**
   * @param {string} value
   * @returns {this}
   */
  setValue(value) {
    this.value = value;
    return this;
  }
}

// 7. Async function
/**
 * @param {string} url
 * @returns {Promise<Response>}
 */
export const fetchData = async (url) => fetch(url);

// 8. Callback type
/**
 * @callback ErrorHandler
 * @param {Error} error
 * @returns {void}
 */

/**
 * @param {ErrorHandler} handler
 */
export const setErrorHandler = (handler) => { };
```
</code_changes>
</implementation>

<tests>
<test_cases>
```typescript
// Type checking IS the test - run `pnpm typecheck`
// These tests demonstrate the JSDoc types work correctly

import * as Secp256k1 from "./index.js";
import { describe, it, expect } from "vitest";

describe("Secp256k1 JSDoc types", () => {
  const hash = new Uint8Array(32).fill(0xab);
  const privateKey = new Uint8Array(32).fill(0x42);

  it("sign has correct parameter types", () => {
    // This compiles - types are correct
    const sig = Secp256k1.sign(hash, privateKey);
    
    expect(sig.r).toBeInstanceOf(Uint8Array);
    expect(sig.s).toBeInstanceOf(Uint8Array);
    expect(typeof sig.recovery).toBe("number");
  });

  it("sign accepts options parameter", () => {
    // Optional parameter should work
    const sig = Secp256k1.sign(hash, privateKey, { lowS: true });
    expect(sig).toBeDefined();
  });

  it("verify returns boolean", () => {
    const sig = Secp256k1.sign(hash, privateKey);
    const publicKey = Secp256k1.getPublicKey(privateKey);
    
    // Type should be boolean
    const valid: boolean = Secp256k1.verify(sig, hash, publicKey);
    expect(typeof valid).toBe("boolean");
  });

  // TypeScript will catch these at compile time:
  // @ts-expect-error - wrong type should fail
  // Secp256k1.sign("not bytes", privateKey);
  
  // @ts-expect-error - missing required parameter
  // Secp256k1.sign(hash);
});

describe("Type error detection", () => {
  it("catches wrong parameter types at compile time", () => {
    // If @ts-nocheck were still present, these errors would be silent
    // After removal, TypeScript catches them
    
    // These are compile-time checks, verified by running `pnpm typecheck`
    expect(true).toBe(true);
  });
});
```
</test_cases>
</tests>

<api>
<before>
```javascript
// @ts-nocheck - No type checking
const sign = (hash, privateKey) => { ... }
const verify = (signature, hash, publicKey) => { ... }
```
</before>

<after>
```javascript
// Full JSDoc type annotations
/**
 * @param {Uint8Array} hash - 32-byte message hash
 * @param {Uint8Array} privateKey - 32-byte private key
 * @param {SignOptions} [options] - Optional signing parameters
 * @returns {Signature} Signature object
 */
export const sign = (hash, privateKey, options) => { ... }

/**
 * @param {Signature} signature - Signature to verify
 * @param {Uint8Array} hash - 32-byte message hash
 * @param {Uint8Array} publicKey - Public key (compressed or uncompressed)
 * @returns {boolean} True if valid
 */
export const verify = (signature, hash, publicKey) => { ... }
```
</after>

<breaking>
None - internal type annotations don't affect runtime behavior.
May reveal previously hidden type errors in consuming code.
</breaking>
</api>

<docs>
```javascript
// JSDoc documentation patterns for .js files

/**
 * Signs a 32-byte message hash using secp256k1 ECDSA.
 * 
 * Produces a deterministic signature per RFC 6979.
 * By default, enforces low-S values per BIP-62 to prevent malleability.
 * 
 * @param {Uint8Array} hash - 32-byte message hash (e.g., keccak256 output)
 * @param {Uint8Array} privateKey - 32-byte private key (must be valid scalar)
 * @param {object} [options] - Optional signing parameters
 * @param {boolean} [options.lowS=true] - Enforce low S values
 * @param {Uint8Array} [options.extraEntropy] - Additional entropy source
 * @returns {{ r: Uint8Array, s: Uint8Array, recovery: number }} Signature
 * @throws {Error} If hash is not 32 bytes
 * @throws {Error} If private key is invalid
 * 
 * @example
 * ```javascript
 * import * as Secp256k1 from "./Secp256k1";
 * import * as Keccak from "./Keccak";
 * 
 * const message = new TextEncoder().encode("Hello");
 * const hash = Keccak.keccak256(message);
 * const privateKey = generatePrivateKey();
 * 
 * const signature = Secp256k1.sign(hash, privateKey);
 * console.log(signature.r, signature.s, signature.recovery);
 * ```
 */
export const sign = (hash, privateKey, options) => { ... };
```
</docs>

<references>
- [TypeScript JSDoc Reference](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html)
- [JSDoc @typedef](https://jsdoc.app/tags-typedef.html)
- [JSDoc @template](https://jsdoc.app/tags-template.html)
- [TypeScript Declaration Files](https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html)
- [Review 074: Crypto Signatures](./074-crypto-signatures-review.md)
</references>
</issue>
