# Fix BLS12-381 Unsafe Error Casting

<issue>
<metadata>priority: P1 (security), files: [src/crypto/Bls12381/aggregate.ts, sign.ts, verify.ts], reviews: [074-crypto-signatures-review.md]</metadata>

<problem>
BLS12-381 service functions use unsafe error type casting via `as` operator that assumes all thrown errors are expected types.

**Vulnerability**: Type confusion attack surface
- TypeError from non-Uint8Array input gets mistyped as `SignatureError`
- RangeError from invalid length gets mistyped
- Error discrimination via `_tag` breaks silently
- Attackers can trigger unexpected code paths by providing malformed inputs that throw unexpected error types, potentially bypassing error handling logic

**Current code** (`src/crypto/Bls12381/aggregate.ts#L60-65`):
```typescript
Effect.try({
  try: () => Bls12381.aggregate(signatures),
  catch: (e) => e as InvalidScalarError | SignatureError,  // ❌ Unsafe!
})
```

**Security rationale**: In cryptographic code, error type confusion can:
1. Leak implementation details through error messages
2. Bypass validation logic that depends on `_tag` discrimination
3. Create inconsistent error handling that aids exploitation
</problem>

<solution>
Validate error types using `instanceof` checks before returning. Wrap unexpected errors in typed wrappers that preserve the original error as `cause`.

**Security pattern**: Defensive error validation
- Never trust that thrown errors match expected types
- Always validate with `instanceof` before returning
- Preserve original error for debugging via `cause`
- Use explicit error codes for unexpected error paths
</solution>

<implementation>
<steps>
1. Import all expected error types at top of each file
2. Replace unsafe `as` casts with `instanceof` validation
3. Add fallback wrapper for unexpected errors
4. Preserve original error as `cause` for debugging
5. Add unique error codes for unexpected error paths
</steps>

<security_patterns>
```typescript
// Pattern: Defensive error validation in crypto code
import { InvalidScalarError, SignatureError, InvalidPrivateKeyError, InvalidPublicKeyError, InvalidSignatureError } from "./errors";

// aggregate.ts
Effect.try({
  try: () => Bls12381.aggregate(signatures),
  catch: (e) => {
    if (e instanceof InvalidScalarError) return e;
    if (e instanceof SignatureError) return e;
    return new SignatureError({
      message: `BLS aggregate failed: ${e instanceof Error ? e.message : String(e)}`,
      code: "AGGREGATE_UNEXPECTED_ERROR",
      cause: e,
    });
  },
})

// sign.ts
Effect.try({
  try: () => Bls12381.sign(message, privateKey),
  catch: (e) => {
    if (e instanceof InvalidPrivateKeyError) return e;
    if (e instanceof SignatureError) return e;
    return new SignatureError({
      message: `BLS sign failed: ${e instanceof Error ? e.message : String(e)}`,
      code: "SIGN_UNEXPECTED_ERROR",
      cause: e,
    });
  },
})

// verify.ts
Effect.try({
  try: () => Bls12381.verify(signature, message, publicKey),
  catch: (e) => {
    if (e instanceof InvalidSignatureError) return e;
    if (e instanceof InvalidPublicKeyError) return e;
    return new SignatureError({
      message: `BLS verify failed: ${e instanceof Error ? e.message : String(e)}`,
      code: "VERIFY_UNEXPECTED_ERROR",
      cause: e,
    });
  },
})
```
</security_patterns>
</implementation>

<tests>
```typescript
describe("BLS12-381 error handling security", () => {
  it("wraps TypeError from invalid input type", async () => {
    const result = await Effect.runPromiseExit(
      Bls12381Effect.aggregate(["not-a-uint8array" as any])
    );
    expect(Exit.isFailure(result)).toBe(true);
    if (Exit.isFailure(result)) {
      const error = Cause.failureOption(result.cause);
      expect(Option.isSome(error)).toBe(true);
      expect(error.value._tag).toBe("SignatureError");
      expect(error.value.code).toBe("AGGREGATE_UNEXPECTED_ERROR");
      expect(error.value.cause).toBeInstanceOf(TypeError);
    }
  });

  it("preserves known error types", async () => {
    const invalidSig = new Uint8Array(47); // Wrong length
    const result = await Effect.runPromiseExit(
      Bls12381Effect.aggregate([invalidSig])
    );
    expect(Exit.isFailure(result)).toBe(true);
    if (Exit.isFailure(result)) {
      const error = Cause.failureOption(result.cause);
      expect(["InvalidScalarError", "SignatureError"]).toContain(error.value._tag);
    }
  });

  it("error discrimination works correctly after fix", async () => {
    const result = await Effect.runPromiseExit(
      Bls12381Effect.sign(new Uint8Array(32), new Uint8Array(0))
    );
    expect(Exit.isFailure(result)).toBe(true);
    // _tag-based matching should work reliably
    if (Exit.isFailure(result)) {
      const error = Cause.failureOption(result.cause);
      expect(typeof error.value._tag).toBe("string");
    }
  });
});
```
</tests>

<docs>
```typescript
/**
 * Aggregates multiple BLS12-381 signatures into a single signature.
 *
 * @security Error handling validates all thrown errors via instanceof
 * checks. Unexpected errors are wrapped in SignatureError with code
 * "AGGREGATE_UNEXPECTED_ERROR" and original error preserved as `cause`.
 *
 * @param signatures - Array of 48-byte G1 signatures to aggregate
 * @returns Effect that succeeds with aggregated signature or fails with typed error
 */
```
</docs>

<api>
<before>
```typescript
catch: (e) => e as InvalidScalarError | SignatureError
```
</before>
<after>
```typescript
catch: (e) => {
  if (e instanceof InvalidScalarError) return e;
  if (e instanceof SignatureError) return e;
  return new SignatureError({ message: `...`, code: "...", cause: e });
}
```
</after>
</api>

<references>
- OWASP Error Handling: https://cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet.html
- TypeScript instanceof narrowing: https://www.typescriptlang.org/docs/handbook/2/narrowing.html#instanceof-narrowing
- Effect error handling: https://effect.website/docs/error-management/expected-errors
</references>
</issue>
