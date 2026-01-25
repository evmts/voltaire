# Fix Bn254 Operations Missing Error Types

## Problem

Bn254 operation functions declare `never` as their error type, but the underlying operations can fail on invalid points.

**Location**: `src/crypto/Bn254/operations.ts`

```typescript
export const add = (
  p1: G1Point,
  p2: G1Point,
): Effect.Effect<G1Point, never, Bn254Service> =>  // ❌ never is wrong!
  Bn254Service.pipe(Effect.flatMap((bn) => bn.add(p1, p2)));
```

## Why This Matters

- Type system claims operations never fail
- Callers don't handle potential errors
- Runtime failures are unexpected
- Violates Effect's typed error principle

## Solution

Add proper error types:

```typescript
import { Bn254Error, Bn254InvalidPointError, Bn254SubgroupCheckError } from "./errors";

type Bn254OpError = Bn254Error | Bn254InvalidPointError | Bn254SubgroupCheckError;

export const add = (
  p1: G1Point,
  p2: G1Point,
): Effect.Effect<G1Point, Bn254OpError, Bn254Service> =>
  Bn254Service.pipe(Effect.flatMap((bn) => bn.add(p1, p2)));

export const mul = (
  p: G1Point,
  s: bigint,
): Effect.Effect<G1Point, Bn254OpError, Bn254Service> =>
  Bn254Service.pipe(Effect.flatMap((bn) => bn.mul(p, s)));

export const pairing = (
  g1: G1Point,
  g2: G2Point,
): Effect.Effect<Fp12, Bn254OpError, Bn254Service> =>
  Bn254Service.pipe(Effect.flatMap((bn) => bn.pairing(g1, g2)));
```

## Acceptance Criteria

- [ ] Add error types to all operation return types
- [ ] Update Bn254ServiceShape to include error types
- [ ] Ensure Bn254Live uses Effect.try (see review 031)
- [ ] All existing tests pass
- [ ] Add tests for invalid point handling

## Priority

**Medium** - Type safety
