# Fix NonceManager Mutable State

<issue>
<metadata>
<id>074</id>
<priority>P1</priority>
<category>Effect Anti-Pattern</category>
<module>services/NonceManager/DefaultNonceManager.ts</module>
<files>
  - services/NonceManager/DefaultNonceManager.ts
</files>
<related_reviews>[034]</related_reviews>
</metadata>

<problem>
DefaultNonceManager uses a mutable `Map` outside of Effect, creating race conditions:

```typescript
// ❌ Current anti-pattern
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

**Issues:**
1. **Race condition** - Two concurrent `consume` calls can get same nonce
2. **Layer.sync with mutable state** - Shared across all layer consumers
3. **No atomic read-modify-write** - Gap between read and write
4. **Non-interruptible mutations** - State corruption on interrupt
</problem>

<effect_pattern>
<name>SynchronizedRef Pattern</name>
<rationale>
`SynchronizedRef` provides atomic read-modify-write operations with Effect semantics:
- `modifyEffect` runs an Effect and atomically updates state based on result
- Guarantees only one fiber modifies at a time (serialized access)
- Integrates with fiber interruption (no corrupted state)
- Works with `HashMap` for immutable data structures
</rationale>
<before>
```typescript
// ❌ Mutable Map with race conditions
const map = new Map<string, number>();

const consume = (key: string) =>
  Effect.gen(function* () {
    const value = map.get(key) ?? 0;
    map.set(key, value + 1); // NOT ATOMIC - race condition!
    return value;
  });
```
</before>
<after>
```typescript
// ✅ SynchronizedRef with atomic operations
import * as SynchronizedRef from "effect/SynchronizedRef";
import * as HashMap from "effect/HashMap";
import * as Option from "effect/Option";

const program = Effect.gen(function* () {
  const ref = yield* SynchronizedRef.make(HashMap.empty<string, number>());

  const consume = (key: string) =>
    SynchronizedRef.modifyEffect(ref, (map) =>
      Effect.gen(function* () {
        const current = HashMap.get(map, key).pipe(Option.getOrElse(() => 0));
        // Effect operations can happen here (e.g., fetch from network)
        const newMap = HashMap.set(map, key, current + 1);
        return [current, newMap] as const; // [result, newState]
      })
    );
});
```
</after>
<effect_docs>https://effect.website/docs/concurrency/synchronizedref</effect_docs>
</effect_pattern>

<effect_pattern>
<name>HashMap for Immutable State</name>
<rationale>
Use Effect's `HashMap` instead of mutable `Map`:
- Immutable - safe for concurrent access
- Structural equality for keys
- Efficient persistent data structure
- Integrates with Ref/SynchronizedRef
</rationale>
<before>
```typescript
// ❌ Mutable Map
const map = new Map<string, number>();
map.set(key, value); // Mutation
const v = map.get(key);
```
</before>
<after>
```typescript
// ✅ Immutable HashMap
import * as HashMap from "effect/HashMap";
import * as Option from "effect/Option";

const map = HashMap.empty<string, number>();
const newMap = HashMap.set(map, key, value); // Returns new map
const v = HashMap.get(newMap, key).pipe(Option.getOrElse(() => 0));
```
</after>
<effect_docs>https://effect.website/docs/data-types/hashmap</effect_docs>
</effect_pattern>

<effect_pattern>
<name>Layer.effect for Stateful Services</name>
<rationale>
Use `Layer.effect` instead of `Layer.sync` when:
- Service needs to create Refs/SynchronizedRefs
- Service has initialization logic that returns Effect
- Service needs to access other services during construction
</rationale>
<before>
```typescript
// ❌ Layer.sync with mutable state
const MyService = Layer.sync(Tag, () => {
  const state = new Map(); // Mutable!
  return { ... };
});
```
</before>
<after>
```typescript
// ✅ Layer.effect with Ref
const MyService = Layer.effect(Tag,
  Effect.gen(function* () {
    const stateRef = yield* Ref.make(HashMap.empty());
    return { ... };
  })
);
```
</after>
<effect_docs>https://effect.website/docs/context-management/layers</effect_docs>
</effect_pattern>

<solution>
Use `SynchronizedRef` with `HashMap` for atomic, fiber-safe nonce management:

```typescript
import * as SynchronizedRef from "effect/SynchronizedRef";
import * as HashMap from "effect/HashMap";
import * as Option from "effect/Option";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Data from "effect/Data";
import * as Context from "effect/Context";

// Error type using Data.TaggedError
export class NonceError extends Data.TaggedError("NonceError")<{
  readonly address: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export interface NonceManagerService {
  readonly get: (address: string) => Effect.Effect<number, NonceError>;
  readonly consume: (address: string) => Effect.Effect<number, NonceError>;
  readonly increment: (address: string) => Effect.Effect<void>;
  readonly reset: (address: string) => Effect.Effect<void>;
  readonly resetAll: Effect.Effect<void>;
}

export const NonceManagerService = Context.GenericTag<NonceManagerService>(
  "voltaire/NonceManagerService"
);

export const DefaultNonceManager: Layer.Layer<
  NonceManagerService,
  never,
  ProviderService
> = Layer.effect(
  NonceManagerService,
  Effect.gen(function* () {
    const provider = yield* ProviderService;

    // Use SynchronizedRef with immutable HashMap
    const deltaMapRef = yield* SynchronizedRef.make(
      HashMap.empty<string, number>()
    );

    const normalizeAddress = (address: string) => address.toLowerCase();

    const getBaseNonce = (address: string) =>
      provider
        .getTransactionCount(address as `0x${string}`, "pending")
        .pipe(
          Effect.mapError((e) =>
            new NonceError({
              address,
              message: `Failed to get transaction count: ${e.message}`,
              cause: e,
            })
          )
        );

    return {
      get: (address: string) =>
        Effect.gen(function* () {
          const key = normalizeAddress(address);
          const baseNonce = yield* getBaseNonce(address);
          const deltaMap = yield* SynchronizedRef.get(deltaMapRef);
          const delta = HashMap.get(deltaMap, key).pipe(
            Option.getOrElse(() => 0)
          );
          return Number(baseNonce) + delta;
        }),

      // ✅ Atomic read-modify-write using modifyEffect
      consume: (address: string) =>
        SynchronizedRef.modifyEffect(deltaMapRef, (deltaMap) =>
          Effect.gen(function* () {
            const key = normalizeAddress(address);
            const baseNonce = yield* getBaseNonce(address);

            const delta = HashMap.get(deltaMap, key).pipe(
              Option.getOrElse(() => 0)
            );
            const nonce = Number(baseNonce) + delta;

            // Return [result, newState]
            const newDeltaMap = HashMap.set(deltaMap, key, delta + 1);
            return [nonce, newDeltaMap] as const;
          })
        ),

      increment: (address: string) =>
        SynchronizedRef.update(deltaMapRef, (deltaMap) => {
          const key = normalizeAddress(address);
          const delta = HashMap.get(deltaMap, key).pipe(
            Option.getOrElse(() => 0)
          );
          return HashMap.set(deltaMap, key, delta + 1);
        }),

      reset: (address: string) =>
        SynchronizedRef.update(deltaMapRef, (deltaMap) => {
          const key = normalizeAddress(address);
          return HashMap.remove(deltaMap, key);
        }),

      resetAll: SynchronizedRef.set(deltaMapRef, HashMap.empty()),
    };
  })
);
```
</solution>

<implementation>
<steps>
1. Replace `Layer.sync` with `Layer.effect` (allows Effect operations)
2. Replace `new Map()` with `SynchronizedRef.make(HashMap.empty())`
3. Replace `map.get()/set()` with `HashMap.get()/set()`
4. Wrap `consume` logic in `SynchronizedRef.modifyEffect` for atomicity
5. Add proper error types with `Data.TaggedError`
6. Add `resetAll` method for testing
</steps>
<imports>
```typescript
import * as SynchronizedRef from "effect/SynchronizedRef";
import * as HashMap from "effect/HashMap";
import * as Option from "effect/Option";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Data from "effect/Data";
import * as Context from "effect/Context";
```
</imports>
</implementation>

<tests>
```typescript
import { Effect, Fiber } from "effect";
import { describe, it, expect } from "vitest";

describe("DefaultNonceManager", () => {
  const mockProvider = {
    getTransactionCount: (_address: string, _block: string) =>
      Effect.succeed(5n),
  };

  const TestLayer = DefaultNonceManager.pipe(
    Layer.provide(Layer.succeed(ProviderService, mockProvider))
  );

  it("returns unique nonces for concurrent consume calls", async () => {
    const nonces = await Effect.runPromise(
      Effect.gen(function* () {
        const manager = yield* NonceManagerService;
        const address = "0x1234567890123456789012345678901234567890";

        // ✅ Concurrent consume calls should get unique nonces
        const results = yield* Effect.all(
          Array.from({ length: 10 }, () => manager.consume(address)),
          { concurrency: "unbounded" }
        );

        return results;
      }).pipe(
        Effect.provide(TestLayer),
        Effect.scoped
      )
    );

    // All nonces should be unique
    const uniqueNonces = new Set(nonces);
    expect(uniqueNonces.size).toBe(10);
    
    // Should be sequential: 5, 6, 7, 8, 9, 10, 11, 12, 13, 14
    expect(nonces.sort((a, b) => a - b)).toEqual([5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
  });

  it("resets nonce delta", async () => {
    await Effect.runPromise(
      Effect.gen(function* () {
        const manager = yield* NonceManagerService;
        const address = "0x1234567890123456789012345678901234567890";

        yield* manager.consume(address); // 5
        yield* manager.consume(address); // 6
        yield* manager.reset(address);
        const nonce = yield* manager.consume(address); // Should be 5 again

        expect(nonce).toBe(5);
      }).pipe(
        Effect.provide(TestLayer),
        Effect.scoped
      )
    );
  });

  it("handles multiple addresses independently", async () => {
    await Effect.runPromise(
      Effect.gen(function* () {
        const manager = yield* NonceManagerService;
        const addr1 = "0x1111111111111111111111111111111111111111";
        const addr2 = "0x2222222222222222222222222222222222222222";

        const nonce1 = yield* manager.consume(addr1);
        const nonce2 = yield* manager.consume(addr2);
        const nonce1b = yield* manager.consume(addr1);

        expect(nonce1).toBe(5);
        expect(nonce2).toBe(5);
        expect(nonce1b).toBe(6);
      }).pipe(
        Effect.provide(TestLayer),
        Effect.scoped
      )
    );
  });

  it("normalizes addresses to lowercase", async () => {
    await Effect.runPromise(
      Effect.gen(function* () {
        const manager = yield* NonceManagerService;
        
        const nonce1 = yield* manager.consume("0xABCDEF1234567890ABCDEF1234567890ABCDEF12");
        const nonce2 = yield* manager.consume("0xabcdef1234567890abcdef1234567890abcdef12");

        expect(nonce1).toBe(5);
        expect(nonce2).toBe(6); // Same address, incremented
      }).pipe(
        Effect.provide(TestLayer),
        Effect.scoped
      )
    );
  });

  it("resets all nonces", async () => {
    await Effect.runPromise(
      Effect.gen(function* () {
        const manager = yield* NonceManagerService;
        const addr1 = "0x1111111111111111111111111111111111111111";
        const addr2 = "0x2222222222222222222222222222222222222222";

        yield* manager.consume(addr1);
        yield* manager.consume(addr2);
        yield* manager.resetAll;
        
        const nonce1 = yield* manager.consume(addr1);
        const nonce2 = yield* manager.consume(addr2);

        expect(nonce1).toBe(5);
        expect(nonce2).toBe(5);
      }).pipe(
        Effect.provide(TestLayer),
        Effect.scoped
      )
    );
  });
});
```
</tests>

<api>
<before>
```typescript
// ❌ Mutable Map with race conditions
const deltaMap = new Map<string, number>();
const delta = deltaMap.get(key) ?? 0;
deltaMap.set(key, delta + 1); // NOT ATOMIC!
```
</before>
<after>
```typescript
// ✅ SynchronizedRef with atomic operations
const deltaMapRef = yield* SynchronizedRef.make(HashMap.empty());
const nonce = yield* SynchronizedRef.modifyEffect(deltaMapRef, (map) =>
  Effect.gen(function* () {
    const delta = HashMap.get(map, key).pipe(Option.getOrElse(() => 0));
    return [delta, HashMap.set(map, key, delta + 1)] as const;
  })
);
```
</after>
</api>

<acceptance_criteria>
- [ ] Replace mutable Map with SynchronizedRef + HashMap
- [ ] Concurrent consume calls return unique nonces
- [ ] No race conditions under high concurrency
- [ ] Address normalization (lowercase)
- [ ] Reset functionality works
- [ ] Layer.effect instead of Layer.sync
- [ ] Proper error types with Data.TaggedError
- [ ] All tests pass
</acceptance_criteria>

<references>
- [Effect SynchronizedRef](https://effect.website/docs/concurrency/synchronizedref)
- [Effect HashMap](https://effect.website/docs/data-types/hashmap)
- [Atomic State Updates](https://effect.website/docs/concurrency/ref)
- [Data.TaggedError](https://effect.website/docs/error-management/expected-errors#taggederror)
</references>
</issue>
