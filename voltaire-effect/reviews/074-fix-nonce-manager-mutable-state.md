# Fix NonceManager Mutable State

**Priority**: High  
**Module**: `services/NonceManager/DefaultNonceManager.ts`  
**Category**: Effect Anti-Pattern

## Problem

DefaultNonceManager uses a mutable `Map` outside of Effect, creating race conditions:

```typescript
export const DefaultNonceManager: Layer.Layer<NonceManagerService> = Layer.sync(
  NonceManagerService,
  () => {
    const deltaMap = new Map<string, number>();  // ❌ Mutable shared state

    return {
      consume: (address: string) =>
        Effect.gen(function* () {
          const key = address.toLowerCase();
          const baseNonce = yield* provider.getTransactionCount(...);
          
          const delta = deltaMap.get(key) ?? 0;  // ❌ Read
          const nonce = Number(baseNonce) + delta;
          deltaMap.set(key, delta + 1);  // ❌ Write - RACE CONDITION!
          
          return nonce;
        }),
      // ...
    };
  },
);
```

## Issues

1. **Race condition** - Two concurrent `consume` calls can get same nonce
2. **Layer.sync with mutable state** - Shared across all layer consumers
3. **No atomic read-modify-write** - Gap between read and write
4. **Non-interruptible mutations** - State corruption on interrupt

## Solution

Use `SynchronizedRef` or `Semaphore` for thread-safe operations:

```typescript
import * as SynchronizedRef from "effect/SynchronizedRef";
import * as HashMap from "effect/HashMap";

export const DefaultNonceManager: Layer.Layer<
  NonceManagerService,
  never,
  ProviderService
> = Layer.effect(
  NonceManagerService,
  Effect.gen(function* () {
    const provider = yield* ProviderService;
    
    // Use SynchronizedRef for atomic updates
    const deltaMapRef = yield* SynchronizedRef.make(
      HashMap.empty<string, number>()
    );

    return {
      get: (address: string) =>
        Effect.gen(function* () {
          const key = address.toLowerCase();
          const baseNonce = yield* provider
            .getTransactionCount(address as `0x${string}`, "pending")
            .pipe(Effect.mapError((e) => new NonceError({ ... })));
          
          const deltaMap = yield* SynchronizedRef.get(deltaMapRef);
          const delta = HashMap.get(deltaMap, key).pipe(
            Option.getOrElse(() => 0)
          );
          return Number(baseNonce) + delta;
        }),

      consume: (address: string) =>
        SynchronizedRef.modifyEffect(deltaMapRef, (deltaMap) =>
          Effect.gen(function* () {
            const key = address.toLowerCase();
            
            const baseNonce = yield* provider
              .getTransactionCount(address as `0x${string}`, "pending")
              .pipe(Effect.mapError((e) => new NonceError({ ... })));
            
            const delta = HashMap.get(deltaMap, key).pipe(
              Option.getOrElse(() => 0)
            );
            const nonce = Number(baseNonce) + delta;
            
            const newDeltaMap = HashMap.set(deltaMap, key, delta + 1);
            return [nonce, newDeltaMap] as const;
          }),
        ),

      increment: (address: string) =>
        SynchronizedRef.update(deltaMapRef, (deltaMap) => {
          const key = address.toLowerCase();
          const delta = HashMap.get(deltaMap, key).pipe(
            Option.getOrElse(() => 0)
          );
          return HashMap.set(deltaMap, key, delta + 1);
        }),

      reset: (address: string) =>
        SynchronizedRef.update(deltaMapRef, (deltaMap) => {
          const key = address.toLowerCase();
          return HashMap.remove(deltaMap, key);
        }),
    };
  }),
);
```

## Alternative: Per-Address Semaphore

For maximum throughput with per-address serialization:

```typescript
import * as Semaphore from "effect/Semaphore";

const perAddressSemaphore = (address: string) =>
  Effect.gen(function* () {
    const semaphores = yield* semaphoreMapRef;
    const key = address.toLowerCase();
    
    return yield* SynchronizedRef.modifyEffect(semaphoreMapRef, (map) =>
      HashMap.get(map, key).pipe(
        Option.match({
          onNone: () =>
            Effect.gen(function* () {
              const sem = yield* Semaphore.make(1);
              return [sem, HashMap.set(map, key, sem)] as const;
            }),
          onSome: (sem) => Effect.succeed([sem, map] as const),
        }),
      ),
    );
  });

consume: (address: string) =>
  Effect.gen(function* () {
    const sem = yield* perAddressSemaphore(address);
    return yield* Semaphore.withPermit(sem)(
      Effect.gen(function* () {
        // Safe: serialized per-address
        const baseNonce = yield* provider.getTransactionCount(...);
        const delta = yield* Ref.getAndUpdate(deltaRef(address), (n) => n + 1);
        return Number(baseNonce) + delta;
      }),
    );
  }),
```

## Benefits

- **Atomic operations** - No race conditions
- **Fiber-safe** - Works with concurrent fibers
- **Interruptible** - SynchronizedRef handles interruption
- **Immutable data** - HashMap instead of mutable Map
- **Proper Effect semantics** - Uses Layer.effect, not Layer.sync

## References

- [SynchronizedRef](https://effect.website/docs/reference/concurrency/synchronized-ref)
- [Effect HashMap](https://effect-ts.github.io/effect/effect/HashMap.ts.html)
