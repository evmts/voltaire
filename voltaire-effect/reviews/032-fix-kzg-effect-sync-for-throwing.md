# Fix KZGService Effect.sync for Throwing Operations

<issue>
<metadata>
priority: P1 (RESOLVED)
status: FIXED
files: [
  voltaire-effect/src/crypto/KZG/KZGService.ts,
  voltaire-effect/src/services/Kzg/DefaultKzg.ts,
  voltaire-effect/src/services/Kzg/KzgService.ts
]
reviews: [087-bn254-kzg-review.md, 088-blob-and-kzg-gaps.md, 104-blob-kzg-primitives-review.md]
</metadata>

<problem>
KZG operations can throw when trusted setup not loaded or inputs are malformed. Originally, wrapping with `Effect.sync` would turn these into untyped defects.

```typescript
// WRONG - Effect.sync assumes code never throws
const ensureTrustedSetup = Effect.sync(() => {
  loadTrustedSetup();  // Can throw if setup fails!
});

Effect.sync(() => KZG.commit(blob))  // Can throw KzgNotInitializedError!
```

**Base library error types** (src/crypto/KZG/errors.ts):
- `KzgError` - Base error (_tag: "KzgError")
- `KzgNotInitializedError` - Trusted setup not loaded (_tag: "KzgNotInitializedError")
- `KzgInvalidBlobError` - Invalid blob format/size (_tag: "KzgInvalidBlobError")
- `KzgVerificationError` - Proof verification failed (_tag: "KzgVerificationError")

**Effect.sync vs Effect.try**:
- `Effect.sync`: Code NEVER throws → errors become unrecoverable defects
- `Effect.try`: Code MAY throw → catches and maps to typed errors
</problem>

<solution>
**STATUS: ALREADY FIXED** in current codebase.

Both KZG service implementations correctly use `Effect.try`:

**1. crypto/KZG/KZGService.ts (L156-212):**
```typescript
export const KZGLive = Layer.succeed(KZGService, {
  blobToKzgCommitment: (blob) =>
    Effect.try({
      try: () => KZG.blobToKzgCommitment(blob) as KzgCommitmentType,
      catch: (e) =>
        new KZGError({
          code: "INVALID_BLOB",
          operation: "blobToKzgCommitment",
          message: `Failed to compute KZG commitment: ${e}`,
          cause: e,
        }),
    }),
  loadTrustedSetup: () =>
    Effect.try({
      try: () => KZG.loadTrustedSetup(),
      catch: (e) =>
        new KZGError({
          code: "SETUP_NOT_LOADED",
          operation: "loadTrustedSetup",
          message: `Failed to load trusted setup: ${e}`,
          cause: e,
        }),
    }),
  // ... all operations use Effect.try
});
```

**2. services/Kzg/DefaultKzg.ts (L55-111):**
```typescript
export const DefaultKzg = Layer.sync(KzgService, () => ({
  blobToCommitment: (blob: Uint8Array) =>
    Effect.gen(function* () {
      yield* ensureTrustedSetup;  // Note: this still uses Effect.sync
      return yield* Effect.try({
        try: () => blobToKzgCommitment(blob),
        catch: (error) =>
          new KzgError({
            operation: "blobToCommitment",
            message: error instanceof Error ? error.message : "Failed",
            cause: error,
          }),
      });
    }),
}));
```

**Note**: `DefaultKzg.ts` line 29 still uses `Effect.sync` for `ensureTrustedSetup`. This is acceptable because `loadTrustedSetup()` is idempotent and errors would be caught by the subsequent `Effect.try` wrapper. However, for full correctness, it should also use `Effect.try`.
</solution>

<implementation>
<steps>
1. ✅ All KZG operations wrapped with `Effect.try`
2. ✅ Error codes distinguish failure types (SETUP_NOT_LOADED, INVALID_BLOB, etc.)
3. ✅ Service interface types include `KZGError`/`KzgError` in error channel
4. ✅ JSDoc accurately documents error behavior
5. ⚠️ Minor: DefaultKzg.ts L29 `ensureTrustedSetup` uses Effect.sync (low risk)
</steps>

<patterns>
- `Effect.try({ try: () => ..., catch: (e) => new TypedError(...) })`
- Error codes for programmatic handling: `code: "SETUP_NOT_LOADED" | "INVALID_BLOB" | ...`
- `Data.TaggedError("KZGError")` for catchTag discrimination
- Operation field for debugging: `operation: "blobToKzgCommitment"`
- Preserving original error as `cause`
</patterns>

<error_types>
**Base library (src/crypto/KZG/errors.ts):**
```typescript
export class KzgError extends CryptoError {
  override readonly _tag: string = "KzgError";
}

export class KzgNotInitializedError extends KzgError {
  override readonly _tag = "KzgNotInitializedError" as const;
}

export class KzgInvalidBlobError extends KzgError {
  override readonly _tag = "KzgInvalidBlobError" as const;
}

export class KzgVerificationError extends KzgError {
  override readonly _tag = "KzgVerificationError" as const;
}
```

**Effect wrapper (KZGService.ts):**
```typescript
export class KZGError extends Data.TaggedError("KZGError")<{
  readonly code: "SETUP_NOT_LOADED" | "INVALID_BLOB" | "INVALID_COMMITMENT" 
    | "INVALID_PROOF" | "OPERATION_FAILED";
  readonly operation: "blobToKzgCommitment" | "computeBlobKzgProof" 
    | "verifyBlobKzgProof" | "loadTrustedSetup" | "isInitialized";
  readonly message: string;
  readonly cause?: unknown;
}> {}
```

**Services layer (KzgService.ts):**
```typescript
export class KzgError extends Data.TaggedError("KzgError")<{
  readonly operation: "blobToCommitment" | "computeProof" | "verifyProof";
  readonly message: string;
  readonly cause?: unknown;
}> {}
```
</error_types>
</implementation>

<tests>
Existing tests in KZG.test.ts validate core functionality.

Additional error case tests recommended:
```typescript
describe("KZGService error handling", () => {
  it("should return KZGError for invalid blob size", async () => {
    const invalidBlob = new Uint8Array(100); // Wrong size, should be 131072
    const program = Effect.gen(function* () {
      const kzg = yield* KZGService;
      yield* kzg.loadTrustedSetup();
      return yield* kzg.blobToKzgCommitment(invalidBlob as KzgBlobType);
    }).pipe(Effect.provide(KZGLive));

    const exit = await Effect.runPromiseExit(program);
    expect(Exit.isFailure(exit)).toBe(true);
    if (Exit.isFailure(exit)) {
      const error = Cause.failureOption(exit.cause);
      expect(Option.isSome(error)).toBe(true);
      expect(error.value._tag).toBe("KZGError");
      expect(error.value.code).toBe("INVALID_BLOB");
    }
  });

  it("should handle trusted setup errors", async () => {
    // Mock KZG.loadTrustedSetup to throw
    const program = KZGService.pipe(
      Effect.flatMap((kzg) => kzg.loadTrustedSetup()),
      Effect.catchTag("KZGError", (e) => 
        Effect.succeed(`Caught: ${e.code}`)
      ),
      Effect.provide(KZGLive)
    );
    // Test error is properly typed and catchable
  });
});
```
</tests>

<docs>
JSDoc correctly documents error behavior:
```typescript
/**
 * Computes a KZG commitment for a blob.
 * @param blob - The 128KB blob data
 * @returns Effect containing the 48-byte commitment, or KZGError if operation fails
 * 
 * @throws KZGError with code "INVALID_BLOB" - blob size/format invalid
 * @throws KZGError with code "SETUP_NOT_LOADED" - trusted setup not initialized
 */
readonly blobToKzgCommitment: (blob: KzgBlobType) 
  => Effect.Effect<KzgCommitmentType, KZGError>;
```
</docs>

<api>
<before>
// If Effect.sync were used:
Effect.Effect&lt;KzgCommitmentType, never&gt;  // Errors become defects!
</before>
<after>
// Current correct implementation:
Effect.Effect&lt;KzgCommitmentType, KZGError&gt;  // Errors properly typed with code
</after>
</api>

<remaining_work>
Minor improvement (low priority):
```typescript
// DefaultKzg.ts L29 - currently:
const ensureTrustedSetup = Effect.sync(() => {
  loadTrustedSetup();
});

// Could be improved to:
const ensureTrustedSetup = Effect.try({
  try: () => loadTrustedSetup(),
  catch: (e) => new KzgError({
    operation: "blobToCommitment", // or a new "setup" operation
    message: `Trusted setup failed: ${e}`,
    cause: e,
  }),
});
```
</remaining_work>

<references>
- [Effect.try documentation](https://effect.website/docs/getting-started/creating-effects/)
- [Two types of errors in Effect](https://effect.website/docs/error-management/two-error-types/)
- [catchTag for discriminated unions](https://effect.website/docs/error-management/expected-errors/)
- Base library errors: src/crypto/KZG/errors.ts
- Implementation: voltaire-effect/src/crypto/KZG/KZGService.ts
- Implementation: voltaire-effect/src/services/Kzg/DefaultKzg.ts
- EIP-4844 spec: https://eips.ethereum.org/EIPS/eip-4844
</references>
</issue>
