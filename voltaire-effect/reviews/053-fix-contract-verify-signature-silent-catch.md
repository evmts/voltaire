# Fix Contract verifySignature Silent Error Catch

**Status**: ✅ MOSTLY COMPLETE  
**Updated**: 2026-01-26  
**Priority**: P3 (low - remaining work is polish)

## Summary

Effect wrapper is complete with typed errors. Upstream returns `false` on some unexpected errors - acceptable tradeoff for now.

## Completed ✅
- Effect wrapper uses `Runtime.runPromise(runtime)` with fiber context
- Typed errors: `SignatureVerificationError`, `InvalidSignatureFormatError`
- `InvalidSignatureFormatError` and network/provider failures are rethrown

## Remaining (P3)
- Consider optional "strict" mode in upstream that throws on all unexpected errors
- Add edge case tests for error mapping

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
