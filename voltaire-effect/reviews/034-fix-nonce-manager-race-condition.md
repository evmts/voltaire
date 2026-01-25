# Fix NonceManager Race Condition

## Problem

DefaultNonceManager uses a plain Map for tracking nonce deltas, which is not atomic. Concurrent fibers can read the same delta before either writes, causing duplicate nonces.

**Location**: `src/services/NonceManager/DefaultNonceManager.ts#L122-L125`

```typescript
const delta = deltaMap.get(key) ?? 0;        // Fiber A reads 0
const nonce = Number(baseNonce) + delta;     // Fiber A: nonce = 5
deltaMap.set(key, delta + 1);                // Fiber A writes 1
// Meanwhile Fiber B also reads 0, gets nonce = 5!
```

## Why This Matters

- Two transactions can get the same nonce
- Transaction replacement instead of sequential sends
- One transaction will fail or replace the other
- Critical for high-throughput applications

## Solution

Use `Effect.Ref` or `SynchronizedRef` for atomic read-modify-write:

```typescript
import * as Ref from "effect/Ref";
import * as Effect from "effect/Effect";

export const DefaultNonceManager = Layer.effect(
  NonceManagerService,
  Effect.gen(function* () {
    const deltaRefs = yield* Ref.make(new Map<string, Ref.Ref<number>>());

    const getDeltaRef = (key: string) =>
      Ref.modify(deltaRefs, (map) => {
        const existing = map.get(key);
        if (existing) return [existing, map];
        const newRef = Ref.unsafeMake(0);
        const newMap = new Map(map);
        newMap.set(key, newRef);
        return [newRef, newMap];
      });

    return NonceManagerService.of({
      consume: (address, chainId) =>
        Effect.gen(function* () {
          const key = `${chainId}:${address}`;
          const provider = yield* ProviderService;
          const baseNonce = yield* provider.getTransactionCount(address, "pending");
          
          const deltaRef = yield* getDeltaRef(key);
          const delta = yield* Ref.getAndUpdate(deltaRef, (d) => d + 1);
          
          return Number(baseNonce) + delta;
        }),
    });
  })
);
```

Or use `SynchronizedRef` for simpler atomic updates:

```typescript
const deltaRef = yield* SynchronizedRef.make(new Map<string, number>());

const consume = (address: string, chainId: number) =>
  SynchronizedRef.modifyEffect(deltaRef, (map) =>
    Effect.gen(function* () {
      const key = `${chainId}:${address}`;
      const baseNonce = yield* provider.getTransactionCount(address, "pending");
      const delta = map.get(key) ?? 0;
      const newMap = new Map(map);
      newMap.set(key, delta + 1);
      return [Number(baseNonce) + delta, newMap];
    })
  );
```

## Acceptance Criteria

- [ ] Replace plain Map with `Ref` or `SynchronizedRef`
- [ ] Use atomic read-modify-write operation
- [ ] Add test for concurrent nonce requests
- [ ] Verify no duplicate nonces under concurrency

## Priority

**Critical** - Causes transaction failures in production
