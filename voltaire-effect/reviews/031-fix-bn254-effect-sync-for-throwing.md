# Fix Bn254Service Effect.sync for Throwing Operations

## Problem

Bn254Service wraps operations with `Effect.sync` but the underlying BN254 operations can throw errors (`Bn254Error`, `Bn254InvalidPointError`, `Bn254SubgroupCheckError`).

**Location**: `src/crypto/Bn254/Bn254Service.ts#L209-L222`

```typescript
// JSDoc says "@throws Never" but underlying lib throws!
add: (p1, p2) => Effect.sync(() => Bn254.G1.add(p1, p2)),
mul: (p, s) => Effect.sync(() => Bn254.G1.mul(p, s)),
pairing: (g1, g2) => Effect.sync(() => Bn254.pairing(g1, g2)),
```

## Why This Matters

- Thrown errors become defects (untyped fiber failures)
- Cannot catch/handle invalid point errors gracefully
- Breaks Effect's typed error model
- Documentation is misleading

## Solution

Use `Effect.try` with proper error types:

```typescript
import { Bn254Error, Bn254InvalidPointError, Bn254SubgroupCheckError } from "@tevm/voltaire/Bn254";

const Bn254Live: Layer.Layer<Bn254Service> = Layer.succeed(
  Bn254Service,
  Bn254Service.of({
    add: (p1, p2) =>
      Effect.try({
        try: () => Bn254.G1.add(p1, p2),
        catch: (e) => {
          if (e instanceof Bn254InvalidPointError) return e;
          if (e instanceof Bn254SubgroupCheckError) return e;
          return new Bn254Error(`G1 add failed: ${e}`, { cause: e });
        },
      }),
    mul: (p, s) =>
      Effect.try({
        try: () => Bn254.G1.mul(p, s),
        catch: (e) => {
          if (e instanceof Bn254InvalidPointError) return e;
          return new Bn254Error(`G1 mul failed: ${e}`, { cause: e });
        },
      }),
    pairing: (g1, g2) =>
      Effect.try({
        try: () => Bn254.pairing(g1, g2),
        catch: (e) => new Bn254Error(`Pairing failed: ${e}`, { cause: e }),
      }),
  })
);
```

Also update return types:

```typescript
interface Bn254ServiceShape {
  readonly add: (p1: G1Point, p2: G1Point) => Effect.Effect<G1Point, Bn254Error | Bn254InvalidPointError>;
  readonly mul: (p: G1Point, s: bigint) => Effect.Effect<G1Point, Bn254Error | Bn254InvalidPointError>;
  readonly pairing: (g1: G1Point, g2: G2Point) => Effect.Effect<Fp12, Bn254Error>;
}
```

## Acceptance Criteria

- [ ] Replace `Effect.sync` with `Effect.try` for all operations that can throw
- [ ] Add proper error types to return signatures
- [ ] Fix JSDoc to accurately document error behavior
- [ ] All existing tests pass
- [ ] Add tests for invalid point handling

## Priority

**Critical** - Errors become untyped defects
