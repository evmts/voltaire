# Add Missing Bn254 and KZG Tests

## Problem

Bn254 and KZG test suites lack tests for error conditions and edge cases.

**Locations**:
- `src/crypto/Bn254/Bn254.test.ts` - no invalid point tests
- `src/crypto/KZG/KZG.test.ts` - only tests mock layer, no live tests

## Why This Matters

- Error handling paths untested
- Invalid input behavior unknown
- Mock layer tests don't verify real implementation

## Solution

### Bn254 Tests

```typescript
describe("Bn254 error handling", () => {
  it("rejects point not on curve", async () => {
    const invalidPoint = { x: 1n, y: 2n, z: 1n };  // Not on BN254 curve
    await expect(
      Effect.runPromise(
        Bn254.mul(invalidPoint, 5n).pipe(Effect.provide(Bn254Live))
      )
    ).rejects.toThrow(Bn254InvalidPointError);
  });

  it("rejects point not in subgroup", async () => {
    // Point on curve but not in correct subgroup
    const wrongSubgroup = /* ... */;
    await expect(
      Effect.runPromise(
        Bn254.pairing(wrongSubgroup, G2Generator).pipe(Effect.provide(Bn254Live))
      )
    ).rejects.toThrow(Bn254SubgroupCheckError);
  });

  it("handles scalar = 0", async () => {
    const result = await Effect.runPromise(
      Bn254.mul(G1Generator, 0n).pipe(Effect.provide(Bn254Live))
    );
    // Should return point at infinity
    expect(result.z).toBe(0n);
  });
});
```

### KZG Tests

```typescript
describe("KZG with live layer", () => {
  // Skip if trusted setup not available
  const itLive = process.env.KZG_TRUSTED_SETUP ? it : it.skip;

  itLive("commits to valid blob", async () => {
    const blob = new Uint8Array(131072).fill(0);  // 128KB blob
    const commitment = await Effect.runPromise(
      KZG.commit(blob).pipe(Effect.provide(KZGLive))
    );
    expect(commitment.length).toBe(48);
  });

  itLive("rejects wrong size blob", async () => {
    const wrongSize = new Uint8Array(1000);  // Not 128KB
    await expect(
      Effect.runPromise(KZG.commit(wrongSize).pipe(Effect.provide(KZGLive)))
    ).rejects.toThrow();
  });
});

describe("KZG without trusted setup", () => {
  it("fails gracefully when setup not loaded", async () => {
    // Test with fresh layer that hasn't loaded setup
    await expect(
      Effect.runPromise(
        KZG.commit(new Uint8Array(131072)).pipe(Effect.provide(KZGUninitialized))
      )
    ).rejects.toThrow(/setup/i);
  });
});
```

## Acceptance Criteria

- [ ] Add invalid point test for Bn254
- [ ] Add subgroup check test for Bn254
- [ ] Add scalar = 0 edge case for Bn254
- [ ] Add conditional live tests for KZG
- [ ] Add uninitialized setup error test
- [ ] Add wrong blob size test

## Priority

**Medium** - Test coverage
