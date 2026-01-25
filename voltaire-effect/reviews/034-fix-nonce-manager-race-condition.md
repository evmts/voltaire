# Fix NonceManager Race Condition

<issue>
<metadata>priority: P0 (RESOLVED), files: [src/services/NonceManager/DefaultNonceManager.ts], reviews: [074-fix-nonce-manager-mutable-state.md, 083-nonce-manager-gaps.md]</metadata>

<problem>
**ORIGINAL BUG (FIXED)**: NonceManager used a plain Map for tracking nonce deltas, causing race conditions with concurrent fibers.

```typescript
// Original buggy code:
const deltaMap = new Map<string, number>();

const consume = (address: string) =>
  Effect.gen(function* () {
    const delta = deltaMap.get(key) ?? 0;        // Fiber A reads 0
    const nonce = Number(baseNonce) + delta;     // Fiber A: nonce = 5
    deltaMap.set(key, delta + 1);                // Fiber A writes 1
    // Meanwhile Fiber B also reads 0, gets duplicate nonce = 5!
  });
```

**Race Condition Scenario**:
1. Fiber A: reads delta = 0
2. Fiber B: reads delta = 0 (before A writes)
3. Fiber A: returns nonce 5, writes delta = 1
4. Fiber B: returns nonce 5, writes delta = 1 (DUPLICATE!)

**Impact**:
- Two transactions get the same nonce
- Transaction replacement instead of sequential sends
- One transaction fails or replaces the other
- Critical for high-throughput applications
</problem>

<solution>
**IMPLEMENTED FIX**: Use `SynchronizedRef.modifyEffect` for atomic read-modify-write operations.

```typescript
import * as SynchronizedRef from "effect/SynchronizedRef";

export const DefaultNonceManager = Layer.effect(
  NonceManagerService,
  Effect.gen(function* () {
    // Atomic reference to immutable Map
    const deltaRef = yield* SynchronizedRef.make(new Map<string, number>());

    return {
      consume: (address: string) =>
        // modifyEffect provides atomic read-modify-write
        SynchronizedRef.modifyEffect(deltaRef, (deltaMap) =>
          Effect.gen(function* () {
            const provider = yield* ProviderService;
            const key = address.toLowerCase();
            
            const baseNonce = yield* provider.getTransactionCount(
              address as `0x${string}`,
              "pending"
            );
            
            const delta = deltaMap.get(key) ?? 0;
            const nonce = Number(baseNonce) + delta;
            
            // Return tuple: [result, newState]
            const newMap = new Map(deltaMap);
            newMap.set(key, delta + 1);
            
            return [nonce, newMap] as const;
          })
        ),
    };
  })
);
```

**Why SynchronizedRef.modifyEffect**:
- Atomic: reads and writes happen together
- Effectful: can perform async operations (fetch base nonce)
- Sequential: concurrent calls are serialized automatically
- Immutable: state is always consistent
</solution>

<implementation>
<steps>
1. ✅ Replace mutable Map with SynchronizedRef.make(new Map())
2. ✅ Use SynchronizedRef.modifyEffect for consume operation
3. ✅ Use SynchronizedRef.update for increment/reset operations
4. ✅ Return immutable new Map instances
5. ⚠️ Add concurrency tests to verify no duplicate nonces
6. ⚠️ Consider HashMap from effect/HashMap for better performance
</steps>

<patterns>
```typescript
// Pattern 1: SynchronizedRef.modifyEffect (effectful read-modify-write)
// Use when: modification requires async operations
SynchronizedRef.modifyEffect(ref, (currentState) =>
  Effect.gen(function* () {
    const asyncResult = yield* fetchSomething();
    const newState = computeNewState(currentState, asyncResult);
    const returnValue = computeResult(currentState, asyncResult);
    return [returnValue, newState] as const;
  })
);

// Pattern 2: SynchronizedRef.update (pure modification)
// Use when: modification is synchronous
SynchronizedRef.update(ref, (currentState) => {
  return computeNewState(currentState);
});

// Pattern 3: SynchronizedRef.get (read-only)
const currentValue = yield* SynchronizedRef.get(ref);

// Pattern 4: Effect HashMap for better performance
import * as HashMap from "effect/HashMap";

const deltaRef = yield* SynchronizedRef.make(HashMap.empty<string, number>());

SynchronizedRef.modifyEffect(deltaRef, (map) =>
  Effect.gen(function* () {
    const delta = HashMap.get(map, key).pipe(Option.getOrElse(() => 0));
    const newMap = HashMap.set(map, key, delta + 1);
    return [delta, newMap] as const;
  })
);

// Pattern 5: Per-address locking with nested Refs (advanced)
// For even finer-grained concurrency
const addressRefs = yield* SynchronizedRef.make(
  new Map<string, SynchronizedRef.SynchronizedRef<number>>()
);
```
</patterns>
</implementation>

<tests>
```typescript
import { describe, it, expect } from "vitest";
import * as Effect from "effect/Effect";
import * as Array from "effect/Array";

describe("NonceManager Concurrency", () => {
  it("should never return duplicate nonces under concurrent load", async () => {
    const address = "0x1234567890123456789012345678901234567890";
    const concurrentCalls = 100;

    const program = Effect.gen(function* () {
      const nonceManager = yield* NonceManagerService;
      
      // Fire 100 concurrent consume calls
      const nonces = yield* Effect.all(
        Array.replicate(
          nonceManager.consume(address),
          concurrentCalls
        ),
        { concurrency: "unbounded" }
      );

      return nonces;
    }).pipe(
      Effect.provide(DefaultNonceManager),
      Effect.provide(MockProviderLayer)
    );

    const nonces = await Effect.runPromise(program);

    // All nonces must be unique
    const uniqueNonces = new Set(nonces);
    expect(uniqueNonces.size).toBe(concurrentCalls);

    // Nonces should be sequential
    const sorted = [...nonces].sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i]).toBe(sorted[i - 1] + 1);
    }
  });

  it("should handle multiple addresses concurrently", async () => {
    const addresses = [
      "0x1111111111111111111111111111111111111111",
      "0x2222222222222222222222222222222222222222",
      "0x3333333333333333333333333333333333333333",
    ];

    const program = Effect.gen(function* () {
      const nonceManager = yield* NonceManagerService;
      
      // 10 calls per address, all concurrent
      const allNonces = yield* Effect.all(
        addresses.flatMap((addr) =>
          Array.replicate(nonceManager.consume(addr), 10)
        ),
        { concurrency: "unbounded" }
      );

      return allNonces;
    }).pipe(
      Effect.provide(DefaultNonceManager),
      Effect.provide(MockProviderLayer)
    );

    const nonces = await Effect.runPromise(program);

    // Group by address (each address has 10 nonces)
    const byAddress = new Map<string, number[]>();
    // ... verification logic
  });

  it("should reset properly clear delta for address", async () => {
    const program = Effect.gen(function* () {
      const nonceManager = yield* NonceManagerService;
      const addr = "0xABCD1234567890123456789012345678901234AB";

      // Consume a few
      yield* nonceManager.consume(addr);
      yield* nonceManager.consume(addr);
      
      // Reset
      yield* nonceManager.reset(addr);
      
      // Should start from base again
      const afterReset = yield* nonceManager.get(addr);
      return afterReset;
    }).pipe(
      Effect.provide(DefaultNonceManager),
      Effect.provide(MockProviderLayerWithBaseNonce(5))
    );

    const result = await Effect.runPromise(program);
    expect(result).toBe(5); // Back to base nonce
  });
});
```
</tests>

<api>
<before>
```typescript
// BUGGY: Plain mutable Map
const deltaMap = new Map<string, number>();

const consume = (address: string) =>
  Effect.gen(function* () {
    const delta = deltaMap.get(key) ?? 0;  // Not atomic!
    deltaMap.set(key, delta + 1);          // Race condition!
    return baseNonce + delta;
  });
```
</before>
<after>
```typescript
// FIXED: SynchronizedRef with atomic modifyEffect
const deltaRef = yield* SynchronizedRef.make(new Map<string, number>());

const consume = (address: string) =>
  SynchronizedRef.modifyEffect(deltaRef, (deltaMap) =>
    Effect.gen(function* () {
      const baseNonce = yield* provider.getTransactionCount(address, "pending");
      const delta = deltaMap.get(key) ?? 0;
      const nonce = Number(baseNonce) + delta;
      
      const newMap = new Map(deltaMap);
      newMap.set(key, delta + 1);
      
      return [nonce, newMap] as const;  // Atomic return
    })
  );
```
</after>
</api>

<references>
- [Effect SynchronizedRef](https://effect.website/docs/state-management/synchronizedref/)
- [Effect Ref](https://effect.website/docs/state-management/ref/)
- [viem NonceManager](https://viem.sh/docs/accounts/local/createNonceManager) - Similar concept, uses jsonRpc source
- [viem Discussion #1338](https://github.com/wevm/viem/discussions/1338) - Nonce handling with parallel transactions
- [MUD NonceManager](https://github.com/latticexyz/mud/blob/main/packages/common/src/createNonceManager.ts) - Alternative implementation
</references>
</issue>
