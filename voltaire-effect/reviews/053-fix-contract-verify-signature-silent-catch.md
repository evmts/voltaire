# Fix Contract verifySignature Silent Error Catch

**Status: ✅ PARTIALLY FIXED** (2025-01-25)

The Effect wrapper now properly captures runtime context using `Runtime.runPromise(runtime)` 
instead of `Effect.runPromise`. This fixes the fiber context issue. The error handling was 
already implemented with proper `SignatureVerificationError` and `InvalidSignatureFormatError` types.

**Remaining**: The upstream voltaire (non-Effect) implementation still has the silent catch issue.

## Problem

`verifySignature.js` catches all errors and returns `false`, making it impossible to distinguish between "invalid signature" and "verification failed due to error".

**Location**: `src/primitives/ContractSignature/verifySignature.js#L89-92`

```javascript
} catch (_error) {
    // Verification failed
    return false;
}
```

## Why This Matters

- Network errors silently return `false` (wrong!)
- Encoding errors return `false` (misleading)
- ABI errors return `false` (debugging nightmare)
- Cannot distinguish "invalid" from "error"

## Solution

Option 1: Throw typed errors

```javascript
import { SignatureVerificationError } from "./errors";

try {
  // verification logic
} catch (error) {
  if (error instanceof InvalidSignatureError) {
    return false;  // Signature is actually invalid
  }
  // Re-throw unexpected errors
  throw new SignatureVerificationError(
    `Verification failed: ${error.message}`,
    { cause: error }
  );
}
```

Option 2: Return Result type

```javascript
/**
 * @returns {{ success: true, valid: boolean } | { success: false, error: Error }}
 */
function verifySignature(signature, message, address, provider) {
  try {
    const valid = /* verification */;
    return { success: true, valid };
  } catch (error) {
    return { success: false, error };
  }
}
```

Option 3: Effect wrapper (preferred for voltaire-effect)

```typescript
// In voltaire-effect
export const verifySignature = (
  signature: Signature,
  message: Uint8Array,
  address: Address,
): Effect.Effect<boolean, SignatureVerificationError, ProviderService> =>
  Effect.gen(function* () {
    const provider = yield* ProviderService;
    return yield* Effect.tryPromise({
      try: () => _verifySignature(signature, message, address, provider),
      catch: (e) => new SignatureVerificationError({
        message: `Verification failed: ${e}`,
        cause: e,
      }),
    });
  });
```

## Acceptance Criteria

- [ ] Remove silent catch-all (upstream voltaire)
- [x] Distinguish between "invalid" and "error" (done in Effect wrapper)
- [x] Network errors should propagate (done in Effect wrapper)
- [x] Add error type for verification failures (SignatureVerificationError, InvalidSignatureFormatError)
- [x] Update Effect wrapper if applicable (fixed Runtime.runPromise pattern)

## Priority

**Medium** - Error handling correctness
