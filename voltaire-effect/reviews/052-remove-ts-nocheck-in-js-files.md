# Remove @ts-nocheck in .js Files

## Problem

Multiple `.js` files use `// @ts-nocheck` which disables TypeScript type checking entirely, potentially hiding type errors.

**Locations**:
- `src/crypto/Secp256k1/index.js`
- `src/crypto/Secp256k1/sign.js`
- `src/crypto/Secp256k1/verify.js`
- And potentially others

```javascript
// @ts-nocheck
/**
 * Secp256k1 operations
 * ...
 */
```

## Why This Matters

- Type errors are hidden
- JSDoc types not validated
- Refactoring can introduce undetected bugs
- Inconsistent with typed codebase

## Solution

Remove `@ts-nocheck` and fix any type errors using JSDoc:

```javascript
// Before:
// @ts-nocheck
const sign = (hash, privateKey) => { ... }

// After:
/**
 * @param {Uint8Array} hash - 32-byte message hash
 * @param {import('./types').PrivateKey} privateKey - 32-byte private key
 * @returns {import('./types').Signature}
 */
const sign = (hash, privateKey) => { ... }
```

For complex types, use `.d.ts` files:

```typescript
// secp256k1.d.ts
export interface SignOptions {
  lowS?: boolean;
  extraEntropy?: Uint8Array;
}

export function sign(
  hash: Uint8Array,
  privateKey: Uint8Array,
  options?: SignOptions
): Signature;
```

## Acceptance Criteria

- [ ] Remove all `@ts-nocheck` directives
- [ ] Add proper JSDoc types or `.d.ts` files
- [ ] Fix any revealed type errors
- [ ] TypeScript check passes
- [ ] All existing tests pass

## Priority

**Low** - Code quality
