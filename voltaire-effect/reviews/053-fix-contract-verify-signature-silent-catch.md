# Fix Contract verifySignature Silent Error Catch

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

- [ ] Remove silent catch-all
- [ ] Distinguish between "invalid" and "error"
- [ ] Network errors should propagate
- [ ] Add error type for verification failures
- [ ] Update Effect wrapper if applicable

## Priority

**Medium** - Error handling correctness
