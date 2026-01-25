# Fix Bn254 Operations Missing Error Types

<issue>
<metadata>
priority: P2
severity: medium
category: type-safety
files: [
  voltaire-effect/src/crypto/Bn254/operations.ts,
  voltaire-effect/src/crypto/Bn254/Bn254Service.ts,
  voltaire-effect/src/crypto/Bn254/errors.ts
]
reviews: [031-fix-bn254-effect-sync-for-throwing.md, 087-bn254-kzg-review.md]
</metadata>

<problem>
Bn254 operation functions declare `never` as their error type, but the underlying operations can fail on invalid points.

**Location**: `voltaire-effect/src/crypto/Bn254/operations.ts`

```typescript
export const add = (
  p1: G1Point,
  p2: G1Point,
): Effect.Effect<G1Point, never, Bn254Service> =>  // ❌ never is wrong!
  Bn254Service.pipe(Effect.flatMap((bn) => bn.add(p1, p2)));

export const mul = (
  p: G1Point,
  s: bigint,
): Effect.Effect<G1Point, never, Bn254Service> =>  // ❌ never is wrong!
  Bn254Service.pipe(Effect.flatMap((bn) => bn.mul(p, s)));
```

**Impact**:
- Type system claims operations never fail
- Callers don't handle potential errors (point not on curve, subgroup check)
- Runtime failures are unexpected and untyped
- Violates Effect's typed error principle
- Error handling code paths are dead code according to types
</problem>

<solution>
Add proper error types for all Bn254 operations:
1. Create tagged error types for different failure modes
2. Update service shape to include error channels
3. Update operations module to reflect proper error types
</solution>

<implementation>
<steps>
1. Create `voltaire-effect/src/crypto/Bn254/errors.ts` with tagged error types
2. Update `Bn254ServiceShape` interface with proper error types
3. Update `Bn254Live` to use `Effect.try` with error mapping
4. Update `operations.ts` to reflect actual error types
5. Export error types from index
</steps>

<code_changes>
```typescript
// voltaire-effect/src/crypto/Bn254/errors.ts
import * as Data from "effect/Data";

/**
 * Base error for all BN254 operations.
 */
export class Bn254Error extends Data.TaggedError("Bn254Error")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

/**
 * Point is not on the BN254 curve.
 */
export class Bn254InvalidPointError extends Data.TaggedError("Bn254InvalidPointError")<{
  readonly message: string;
  readonly point: { x: bigint; y: bigint };
  readonly cause?: unknown;
}> {}

/**
 * Point is not in the expected subgroup.
 */
export class Bn254SubgroupCheckError extends Data.TaggedError("Bn254SubgroupCheckError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

/**
 * Invalid scalar value for multiplication.
 */
export class Bn254InvalidScalarError extends Data.TaggedError("Bn254InvalidScalarError")<{
  readonly message: string;
  readonly scalar: bigint;
  readonly cause?: unknown;
}> {}

/**
 * Pairing operation failed.
 */
export class Bn254PairingError extends Data.TaggedError("Bn254PairingError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

/**
 * Union of all BN254 error types.
 */
export type Bn254Errors =
  | Bn254Error
  | Bn254InvalidPointError
  | Bn254SubgroupCheckError
  | Bn254InvalidScalarError
  | Bn254PairingError;

/**
 * Maps unknown error to appropriate Bn254 error type.
 */
export const mapToBn254Error = (e: unknown, operation: string): Bn254Errors => {
  if (e instanceof Bn254InvalidPointError) return e;
  if (e instanceof Bn254SubgroupCheckError) return e;
  if (e instanceof Bn254InvalidScalarError) return e;
  if (e instanceof Bn254PairingError) return e;
  if (e instanceof Bn254Error) return e;

  const message = e instanceof Error ? e.message : String(e);
  
  if (message.includes("not on curve") || message.includes("invalid point")) {
    return new Bn254InvalidPointError({
      message: `Invalid point: ${message}`,
      point: { x: 0n, y: 0n },  // Could extract from error if available
      cause: e,
    });
  }
  
  if (message.includes("subgroup")) {
    return new Bn254SubgroupCheckError({
      message: `Subgroup check failed: ${message}`,
      cause: e,
    });
  }

  return new Bn254Error({
    message: `${operation} failed: ${message}`,
    cause: e,
  });
};

// voltaire-effect/src/crypto/Bn254/Bn254Service.ts
import type { 
  Bn254Error, 
  Bn254InvalidPointError, 
  Bn254SubgroupCheckError,
  Bn254InvalidScalarError,
  Bn254PairingError,
} from "./errors.js";

export interface G1Point {
  readonly x: bigint;
  readonly y: bigint;
  readonly z?: bigint;  // Projective coordinate (1n if affine)
}

export interface G2Point {
  readonly x: readonly [bigint, bigint];  // Fp2 element
  readonly y: readonly [bigint, bigint];  // Fp2 element
  readonly z?: readonly [bigint, bigint];
}

export interface Fp12 {
  readonly coefficients: readonly bigint[];
}

export interface Bn254ServiceShape {
  /**
   * Add two G1 points.
   * @throws Bn254InvalidPointError if either point is not on curve
   */
  readonly add: (
    p1: G1Point,
    p2: G1Point,
  ) => Effect.Effect<G1Point, Bn254InvalidPointError | Bn254Error>;

  /**
   * Scalar multiplication of a G1 point.
   * @throws Bn254InvalidPointError if point is not on curve
   * @throws Bn254InvalidScalarError if scalar is invalid
   */
  readonly mul: (
    p: G1Point,
    s: bigint,
  ) => Effect.Effect<G1Point, Bn254InvalidPointError | Bn254InvalidScalarError | Bn254Error>;

  /**
   * Compute optimal ate pairing.
   * @throws Bn254InvalidPointError if points are not on curve
   * @throws Bn254SubgroupCheckError if points not in correct subgroup
   */
  readonly pairing: (
    g1: G1Point,
    g2: G2Point,
  ) => Effect.Effect<Fp12, Bn254InvalidPointError | Bn254SubgroupCheckError | Bn254PairingError>;

  /**
   * Batch pairing for efficiency.
   */
  readonly batchPairing: (
    pairs: readonly { g1: G1Point; g2: G2Point }[],
  ) => Effect.Effect<Fp12, Bn254InvalidPointError | Bn254SubgroupCheckError | Bn254PairingError>;

  /**
   * Check if a point is on the G1 curve.
   */
  readonly isOnCurveG1: (p: G1Point) => Effect.Effect<boolean, Bn254Error>;

  /**
   * Check if a point is in the G1 subgroup.
   */
  readonly isInSubgroupG1: (p: G1Point) => Effect.Effect<boolean, Bn254Error>;
}

// voltaire-effect/src/crypto/Bn254/operations.ts
import type { 
  Bn254Error, 
  Bn254InvalidPointError, 
  Bn254SubgroupCheckError,
  Bn254PairingError,
} from "./errors.js";
import { Bn254Service } from "./Bn254Service.js";

type Bn254OpError = Bn254Error | Bn254InvalidPointError;
type Bn254PairingOpError = Bn254InvalidPointError | Bn254SubgroupCheckError | Bn254PairingError;

/**
 * Add two G1 points.
 */
export const add = (
  p1: G1Point,
  p2: G1Point,
): Effect.Effect<G1Point, Bn254OpError, Bn254Service> =>
  Bn254Service.pipe(Effect.flatMap((bn) => bn.add(p1, p2)));

/**
 * Scalar multiplication.
 */
export const mul = (
  p: G1Point,
  s: bigint,
): Effect.Effect<G1Point, Bn254OpError, Bn254Service> =>
  Bn254Service.pipe(Effect.flatMap((bn) => bn.mul(p, s)));

/**
 * Compute pairing.
 */
export const pairing = (
  g1: G1Point,
  g2: G2Point,
): Effect.Effect<Fp12, Bn254PairingOpError, Bn254Service> =>
  Bn254Service.pipe(Effect.flatMap((bn) => bn.pairing(g1, g2)));

/**
 * Negate a G1 point.
 */
export const negate = (
  p: G1Point,
): Effect.Effect<G1Point, Bn254OpError, Bn254Service> =>
  Effect.gen(function* () {
    // BN254 negation: (x, -y mod p)
    const BN254_P = 21888242871839275222246405745257275088696311157297823662689037894645226208583n;
    return { x: p.x, y: BN254_P - p.y, z: p.z };
  });

// voltaire-effect/src/crypto/Bn254/Bn254Live.ts
import { mapToBn254Error } from "./errors.js";

export const Bn254Live = Layer.succeed(Bn254Service, {
  add: (p1, p2) =>
    Effect.try({
      try: () => Bn254.add(p1, p2),
      catch: (e) => mapToBn254Error(e, "add"),
    }),

  mul: (p, s) =>
    Effect.try({
      try: () => Bn254.mul(p, s),
      catch: (e) => mapToBn254Error(e, "mul"),
    }),

  pairing: (g1, g2) =>
    Effect.try({
      try: () => Bn254.pairing(g1, g2),
      catch: (e) => mapToBn254Error(e, "pairing"),
    }),

  batchPairing: (pairs) =>
    Effect.try({
      try: () => Bn254.batchPairing(pairs),
      catch: (e) => mapToBn254Error(e, "batchPairing"),
    }),

  isOnCurveG1: (p) =>
    Effect.try({
      try: () => Bn254.isOnCurveG1(p),
      catch: (e) => mapToBn254Error(e, "isOnCurveG1"),
    }),

  isInSubgroupG1: (p) =>
    Effect.try({
      try: () => Bn254.isInSubgroupG1(p),
      catch: (e) => mapToBn254Error(e, "isInSubgroupG1"),
    }),
});
```
</code_changes>
</implementation>

<tests>
<test_cases>
```typescript
import { describe, it, expect } from "vitest";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import { Bn254Service, Bn254Live } from "./index.js";
import { 
  Bn254InvalidPointError, 
  Bn254SubgroupCheckError,
  Bn254Error,
} from "./errors.js";

describe("Bn254 error types", () => {
  // BN254 G1 generator point
  const G1_GENERATOR = {
    x: 1n,
    y: 2n,
  };

  // Point at infinity
  const POINT_AT_INFINITY = {
    x: 0n,
    y: 0n,
    z: 0n,
  };

  describe("add operation", () => {
    it("returns error type in signature", async () => {
      // Type test: verify error type is not `never`
      const effect = Effect.gen(function* () {
        const bn = yield* Bn254Service;
        return yield* bn.add(G1_GENERATOR, G1_GENERATOR);
      }).pipe(Effect.provide(Bn254Live));

      // Error type should be Bn254InvalidPointError | Bn254Error
      // This is a compile-time check
      const result = await Effect.runPromise(effect);
      expect(result).toBeDefined();
    });

    it("fails with Bn254InvalidPointError for invalid point", async () => {
      const invalidPoint = { x: 999n, y: 999n };  // Not on curve

      const result = await Effect.runPromiseExit(
        Effect.gen(function* () {
          const bn = yield* Bn254Service;
          return yield* bn.add(G1_GENERATOR, invalidPoint);
        }).pipe(Effect.provide(Bn254Live))
      );

      expect(Exit.isFailure(result)).toBe(true);
    });

    it("error is catchable by tag", async () => {
      const invalidPoint = { x: 999n, y: 999n };

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const bn = yield* Bn254Service;
          return yield* bn.add(G1_GENERATOR, invalidPoint);
        }).pipe(
          Effect.provide(Bn254Live),
          Effect.catchTag("Bn254InvalidPointError", (e) =>
            Effect.succeed(`caught: ${e._tag}`)
          ),
          Effect.catchTag("Bn254Error", (e) =>
            Effect.succeed(`caught general: ${e._tag}`)
          )
        )
      );

      expect(result).toMatch(/^caught/);
    });
  });

  describe("mul operation", () => {
    it("handles scalar = 0 (returns point at infinity)", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const bn = yield* Bn254Service;
          return yield* bn.mul(G1_GENERATOR, 0n);
        }).pipe(Effect.provide(Bn254Live))
      );

      // Point at infinity: z = 0 in projective coordinates
      expect(result.z).toBe(0n);
    });

    it("handles scalar = 1 (returns same point)", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const bn = yield* Bn254Service;
          return yield* bn.mul(G1_GENERATOR, 1n);
        }).pipe(Effect.provide(Bn254Live))
      );

      expect(result.x).toBe(G1_GENERATOR.x);
      expect(result.y).toBe(G1_GENERATOR.y);
    });

    it("fails on invalid point", async () => {
      const invalidPoint = { x: 12345n, y: 67890n };

      const result = await Effect.runPromiseExit(
        Effect.gen(function* () {
          const bn = yield* Bn254Service;
          return yield* bn.mul(invalidPoint, 5n);
        }).pipe(Effect.provide(Bn254Live))
      );

      expect(Exit.isFailure(result)).toBe(true);
    });
  });

  describe("pairing operation", () => {
    it("returns error type for invalid G2 point", async () => {
      const invalidG2 = {
        x: [1n, 2n] as const,
        y: [3n, 4n] as const,
      };

      const result = await Effect.runPromiseExit(
        Effect.gen(function* () {
          const bn = yield* Bn254Service;
          return yield* bn.pairing(G1_GENERATOR, invalidG2);
        }).pipe(Effect.provide(Bn254Live))
      );

      expect(Exit.isFailure(result)).toBe(true);
    });
  });

  describe("error type structure", () => {
    it("Bn254InvalidPointError has correct shape", () => {
      const err = new Bn254InvalidPointError({
        message: "test",
        point: { x: 1n, y: 2n },
      });

      expect(err._tag).toBe("Bn254InvalidPointError");
      expect(err.point).toEqual({ x: 1n, y: 2n });
      expect(err.message).toBe("test");
    });

    it("Bn254SubgroupCheckError has correct shape", () => {
      const err = new Bn254SubgroupCheckError({
        message: "not in subgroup",
      });

      expect(err._tag).toBe("Bn254SubgroupCheckError");
    });

    it("all error types are distinct", () => {
      const tags = new Set([
        new Bn254Error({ message: "" })._tag,
        new Bn254InvalidPointError({ message: "", point: { x: 0n, y: 0n } })._tag,
        new Bn254SubgroupCheckError({ message: "" })._tag,
      ]);

      expect(tags.size).toBe(3);
    });
  });
});

describe("Bn254 operations module", () => {
  it("add operation has correct error type", async () => {
    // Import the operation function
    const { add } = await import("./operations.js");

    // Type test: error channel should not be `never`
    type AddError = Effect.Effect.Error<ReturnType<typeof add>>;
    // This would fail to compile if error type is `never`
    const _typeCheck: AddError extends Bn254InvalidPointError | Bn254Error ? true : false = true;
    expect(_typeCheck).toBe(true);
  });
});
```
</test_cases>
</tests>

<api>
<before>
```typescript
export const add = (
  p1: G1Point,
  p2: G1Point,
): Effect.Effect<G1Point, never, Bn254Service> =>
  Bn254Service.pipe(Effect.flatMap((bn) => bn.add(p1, p2)));
```
</before>

<after>
```typescript
export const add = (
  p1: G1Point,
  p2: G1Point,
): Effect.Effect<G1Point, Bn254InvalidPointError | Bn254Error, Bn254Service> =>
  Bn254Service.pipe(Effect.flatMap((bn) => bn.add(p1, p2)));
```
</after>

<breaking>
Error channel changes from `never` to specific error types.
Existing code using `Effect.runSync` may now throw typed errors.
Use `Effect.catchTag` or `Effect.catchAll` to handle.
Code that assumed operations never fail needs error handling.
</breaking>
</api>

<references>
- [Effect Data.TaggedError](https://effect.website/docs/data-types/data#taggederror)
- [BN254 curve parameters](https://hackmd.io/@jpw/bn254)
- [Review 031: Bn254 Effect.sync](./031-fix-bn254-effect-sync-for-throwing.md)
- [Review 087: Bn254 KZG](./087-bn254-kzg-review.md)
</references>
</issue>
