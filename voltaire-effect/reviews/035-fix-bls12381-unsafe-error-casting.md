# Fix BLS12-381 Unsafe Error Casting

## Problem

BLS12-381 service functions use unsafe error type casting that assumes all thrown errors are expected types. Unexpected errors (TypeError, RangeError, etc.) get mistyped.

**Location**: `src/crypto/Bls12381/aggregate.ts#L60-65`, `sign.ts#L62-65`, `verify.ts#L68-71`

```typescript
Effect.try({
  try: () => Bls12381.aggregate(signatures),
  catch: (e) => e as InvalidScalarError | SignatureError,  // ❌ Unsafe!
})
```

## Why This Matters

- TypeError from non-Uint8Array input gets typed as `SignatureError`
- RangeError from invalid length gets mistyped
- Error discrimination via `_tag` breaks
- Debugging becomes difficult

## Solution

Validate error type before returning:

```typescript
import { InvalidScalarError, SignatureError } from "./errors";

Effect.try({
  try: () => Bls12381.aggregate(signatures),
  catch: (e) => {
    if (e instanceof InvalidScalarError) return e;
    if (e instanceof SignatureError) return e;
    // Wrap unexpected errors
    return new SignatureError({
      message: `BLS aggregate failed: ${e instanceof Error ? e.message : String(e)}`,
      code: "AGGREGATE_UNEXPECTED_ERROR",
      cause: e,
    });
  },
})
```

Apply to all three files:

```typescript
// sign.ts
catch: (e) => {
  if (e instanceof InvalidPrivateKeyError) return e;
  if (e instanceof SignatureError) return e;
  return new SignatureError({ message: `Sign failed: ${e}`, code: "SIGN_UNEXPECTED", cause: e });
}

// verify.ts
catch: (e) => {
  if (e instanceof InvalidSignatureError) return e;
  if (e instanceof InvalidPublicKeyError) return e;
  return new SignatureError({ message: `Verify failed: ${e}`, code: "VERIFY_UNEXPECTED", cause: e });
}

// aggregate.ts
catch: (e) => {
  if (e instanceof InvalidScalarError) return e;
  if (e instanceof SignatureError) return e;
  return new SignatureError({ message: `Aggregate failed: ${e}`, code: "AGGREGATE_UNEXPECTED", cause: e });
}
```

## Acceptance Criteria

- [ ] Add instanceof checks in all catch handlers
- [ ] Wrap unexpected errors in appropriate typed error
- [ ] Preserve original error as `cause`
- [ ] All existing tests pass
- [ ] Add tests for unexpected error wrapping

## Priority

**High** - Type safety and debugging
