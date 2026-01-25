# Fix KZGService Effect.sync for Throwing Operations

## Problem

KZGService wraps operations with `Effect.sync` but KZG operations throw when trusted setup not loaded or inputs are malformed.

**Location**: `src/crypto/KZG/KZGService.ts#L119-L130`

```typescript
// JSDoc says "Never fails" but these can throw!
commit: (blob) => Effect.sync(() => KZG.commit(blob)),
verify: (commitment, proof, point, value) => 
  Effect.sync(() => KZG.verify(commitment, proof, point, value)),
```

## Why This Matters

- `KZG.commit()` throws if trusted setup not loaded
- `KZG.verify()` throws on malformed proofs/commitments
- Errors become untyped defects
- No way to handle "setup not initialized" gracefully

## Solution

Use `Effect.try` with `KZGError` type:

```typescript
class KZGError extends Data.TaggedError("KZGError")<{
  readonly message: string;
  readonly code: "SETUP_NOT_LOADED" | "INVALID_BLOB" | "INVALID_PROOF" | "VERIFICATION_FAILED";
  readonly cause?: unknown;
}> {}

const KZGLive: Layer.Layer<KZGService> = Layer.succeed(
  KZGService,
  KZGService.of({
    commit: (blob) =>
      Effect.try({
        try: () => KZG.commit(blob),
        catch: (e) => new KZGError({
          message: `KZG commit failed: ${e}`,
          code: e.message?.includes("setup") ? "SETUP_NOT_LOADED" : "INVALID_BLOB",
          cause: e,
        }),
      }),
    verify: (commitment, proof, point, value) =>
      Effect.try({
        try: () => KZG.verify(commitment, proof, point, value),
        catch: (e) => new KZGError({
          message: `KZG verify failed: ${e}`,
          code: "INVALID_PROOF",
          cause: e,
        }),
      }),
  })
);
```

Update service interface:

```typescript
interface KZGServiceShape {
  readonly commit: (blob: Blob) => Effect.Effect<Commitment, KZGError>;
  readonly verify: (...) => Effect.Effect<boolean, KZGError>;
}
```

## Acceptance Criteria

- [ ] Replace `Effect.sync` with `Effect.try`
- [ ] Add `KZGError` with error codes
- [ ] Update return types to include error channel
- [ ] Fix JSDoc documentation
- [ ] Add test for uninitialized trusted setup error

## Priority

**Critical** - Errors become untyped defects
