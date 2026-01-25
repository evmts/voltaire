# Fix Secp256k1 Error Type Assertion

## Problem

Secp256k1 sign operation casts errors without validation, potentially mistyping unexpected errors.

**Location**: `src/crypto/Secp256k1/sign.ts#L92-L95`

```typescript
Effect.try({
  try: () => Secp256k1.sign(messageHash, privateKey, options),
  catch: (e) => e as InvalidPrivateKeyError | CryptoError,  // ❌ Unsafe
})
```

## Why This Matters

- TypeError from wrong input type gets mistyped
- Error discrimination with `_tag` fails
- Debugging becomes difficult
- Type system lies about error type

## Solution

Validate error type:

```typescript
import { InvalidPrivateKeyError, CryptoError } from "./errors";

Effect.try({
  try: () => Secp256k1.sign(messageHash, privateKey, options),
  catch: (e) => {
    if (e instanceof InvalidPrivateKeyError) return e;
    if (e instanceof CryptoError) return e;
    return new CryptoError({
      message: `Signing failed: ${e instanceof Error ? e.message : String(e)}`,
      code: "SECP256K1_SIGN_UNEXPECTED",
      cause: e,
    });
  },
})
```

## Acceptance Criteria

- [ ] Add instanceof checks for expected error types
- [ ] Wrap unexpected errors in CryptoError
- [ ] Preserve original error as cause
- [ ] All existing tests pass

## Priority

**Medium** - Type safety
