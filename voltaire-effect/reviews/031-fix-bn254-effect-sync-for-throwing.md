# Fix Bn254Service Effect.sync for Throwing Operations

<issue>
<metadata>
priority: P1 (RESOLVED)
status: FIXED
files: [voltaire-effect/src/crypto/Bn254/Bn254Service.ts]
reviews: [087-bn254-kzg-review.md, 048-fix-bn254-operations-missing-error-types.md]
</metadata>

<problem>
BN254 operations in the base library can throw typed errors (`Bn254Error`, `Bn254InvalidPointError`, `Bn254SubgroupCheckError`). Originally, wrapping with `Effect.sync` would turn these into untyped defects.

```typescript
// WRONG - Effect.sync assumes code never throws
Effect.sync(() => Bn254.G1.add(p1, p2))
// If Bn254.G1.add throws Bn254InvalidPointError, it becomes an untyped defect!
```

**Effect.sync vs Effect.try**:
- `Effect.sync`: For code that NEVER throws. Exceptions become defects (unrecoverable).
- `Effect.try`: For code that MAY throw. Catches exceptions and maps to typed errors.

When code in `Effect.sync` throws, the error:
1. Bypasses the typed error channel
2. Becomes a fiber defect (like uncaught exception)
3. Cannot be caught with `catchTag` or `catchAll`
4. Only catchable via `catchAllDefect` (loss of type safety)
</problem>

<solution>
**STATUS: ALREADY FIXED** in current codebase.

The implementation correctly uses `Effect.try` with proper error mapping:

```typescript
// CORRECT - Current implementation (Bn254Service.ts L232-306)
export const Bn254Live = Layer.succeed(Bn254Service, {
  g1Add: (a, b) =>
    Effect.try({
      try: () => BN254.G1.add(a, b),
      catch: (e) =>
        new Bn254Error({
          operation: "g1Add",
          message: `G1 point addition failed: ${e}`,
          cause: e,
        }),
    }),
  g1Mul: (point, scalar) =>
    Effect.try({
      try: () => BN254.G1.mul(point, scalar),
      catch: (e) =>
        new Bn254Error({
          operation: "g1Mul",
          message: `G1 scalar multiplication failed: ${e}`,
          cause: e,
        }),
    }),
  // ... all operations use Effect.try
});
```
</solution>

<implementation>
<steps>
1. ✅ All operations wrapped with `Effect.try` instead of `Effect.sync`
2. ✅ Error mapping to `Bn254Error` with operation context
3. ✅ Service interface types include `Bn254Error` in error channel
4. ✅ JSDoc accurately documents error behavior
</steps>

<patterns>
- `Effect.try({ try: () => ..., catch: (e) => new TypedError(...) })`
- `Data.TaggedError("Bn254Error")` for tagged union discrimination
- Preserving original error as `cause` for debugging
- Operation-specific error codes for programmatic handling
</patterns>

<error_types>
Base library throws (src/crypto/bn254/errors.js):
- `Bn254Error` - Base error for BN254 operations (_tag: "Bn254Error")
- `Bn254InvalidPointError` - Point not on curve (_tag: "Bn254InvalidPointError")
- `Bn254SubgroupCheckError` - Point not in subgroup (_tag: "Bn254SubgroupCheckError")

Effect wrapper uses (Bn254Service.ts):
- `Bn254Error` - Tagged error with operation/message/cause
</error_types>
</implementation>

<tests>
Existing tests validate the implementation:
```typescript
// Bn254.test.ts - Service layer tests
describe("Bn254Live", () => {
  it("should return G1 generator", async () => {
    const program = Effect.gen(function* () {
      const bn254 = yield* Bn254Service;
      return yield* bn254.g1Generator();
    });
    const result = await Effect.runPromise(
      program.pipe(Effect.provide(Bn254Live))
    );
    expect(result.x).toBeDefined();
  });
});
```

Additional error case tests recommended:
```typescript
it("should return Bn254Error for invalid G1 point", async () => {
  const invalidPoint = { x: 0n, y: 0n, z: 1n } as BN254G1PointType;
  const program = Effect.gen(function* () {
    const bn254 = yield* Bn254Service;
    return yield* bn254.g1Add(invalidPoint, invalidPoint);
  }).pipe(Effect.provide(Bn254Live));
  
  const exit = await Effect.runPromiseExit(program);
  expect(Exit.isFailure(exit)).toBe(true);
  if (Exit.isFailure(exit)) {
    const error = Cause.failureOption(exit.cause);
    expect(Option.isSome(error)).toBe(true);
    expect(error.value._tag).toBe("Bn254Error");
  }
});
```
</tests>

<docs>
JSDoc correctly documents error behavior:
```typescript
/**
 * Adds two G1 points on the BN254 curve.
 * @param a - First G1 point
 * @param b - Second G1 point
 * @returns Effect containing the sum point, or Bn254Error if operation fails
 */
readonly g1Add: (a: BN254G1PointType, b: BN254G1PointType) 
  => Effect.Effect<BN254G1PointType, Bn254Error>;
```
</docs>

<api>
<before>
// If Effect.sync were used:
Effect.Effect<BN254G1PointType, never>  // Errors become defects!
</before>
<after>
// Current correct implementation:
Effect.Effect<BN254G1PointType, Bn254Error>  // Errors properly typed
</after>
</api>

<references>
- [Effect.try documentation](https://effect.website/docs/getting-started/creating-effects/)
- [Two types of errors in Effect](https://effect.website/docs/error-management/two-error-types/)
- [Data.TaggedError for discriminated unions](https://effect.website/docs/error-management/expected-errors/)
- Base library errors: src/crypto/bn254/errors.js
- Implementation: voltaire-effect/src/crypto/Bn254/Bn254Service.ts
</references>
</issue>
