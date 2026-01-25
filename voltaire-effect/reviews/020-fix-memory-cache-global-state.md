# Fix MemoryCache Global Mutable State

<issue>
<metadata>
priority: P0
status: COMPLETED
files:
  - voltaire-effect/src/services/Cache/MemoryCache.ts
  - voltaire-effect/src/services/Cache/MemoryCache.test.ts
</metadata>

<problem>
MemoryCache originally used a module-level global `Map` shared across all Layer instances.

**Anti-pattern (BEFORE)**:
```typescript
// src/services/Cache/MemoryCache.ts - ORIGINAL
// Module-level global state - BAD
const cacheStorage = new Map<string, CacheEntry<unknown>>();

function getCache(): Map<string, CacheEntry<unknown>> {
  return cacheStorage;
}

export const MemoryCache = (options?: MemoryCacheOptions): Layer.Layer<CacheService> => {
  return Layer.succeed(CacheService, {
    get: <T>(key: string) => Effect.sync(() => {
      const cache = getCache(); // Uses shared global!
      const entry = cache.get(key);
      // ...
    }),
    set: <T>(key: string, value: T) => Effect.sync(() => {
      const cache = getCache(); // Same shared global!
      cache.set(key, { value, ... });
    }),
  });
};
```

**Issues**:
1. **Test isolation broken**: Cache leaks between tests
2. **Shared state across application instances**: Multiple `MemoryCache()` layers share data
3. **Not concurrency-safe**: Concurrent reads/writes can race
4. **Violates Effect principles**: State should be managed, not global
</problem>

<solution>
Use `SynchronizedRef` inside `Layer.effect` to create isolated, concurrency-safe state per Layer instance.

**Effect-idiomatic pattern**:
- `SynchronizedRef.make()` - Creates mutable reference inside Layer construction
- `SynchronizedRef.modifyEffect()` - Atomic read-modify-write with effectful updates
- `SynchronizedRef.updateEffect()` - Atomic updates with effects
- `Layer.effect` - Construct service with effects (not `Layer.succeed`)

**Implementation (AFTER)**:
```typescript
// src/services/Cache/MemoryCache.ts:100-167
export const MemoryCache = (
  options?: MemoryCacheOptions,
): Layer.Layer<CacheService> => {
  const maxSize = options?.maxSize ?? 1000;
  const defaultTtl = options?.defaultTtl;

  return Layer.effect(
    CacheService,
    Effect.gen(function* () {
      // State created INSIDE Layer.effect - isolated per instance
      const cacheRef = yield* SynchronizedRef.make(
        new Map<string, CacheEntry<unknown>>(),
      );

      return CacheService.of({
        get: <T>(key: string) =>
          SynchronizedRef.modifyEffect(cacheRef, (cache) =>
            Effect.gen(function* () {
              const entry = cache.get(key) as CacheEntry<T> | undefined;
              if (!entry) return [Option.none<T>(), cache];
              // ... TTL check with Clock ...
              return [Option.some(entry.value), newCache];
            }),
          ),

        set: <T>(key: string, value: T, ttlMs?: number) =>
          SynchronizedRef.updateEffect(cacheRef, (cache) =>
            Effect.gen(function* () {
              // ... create new Map, evict if needed ...
              return newCache;
            }),
          ),

        delete: (key: string) =>
          SynchronizedRef.modify(cacheRef, (cache) => {
            const existed = cache.has(key);
            const newCache = new Map(cache);
            newCache.delete(key);
            return [existed, newCache];
          }),

        clear: () => SynchronizedRef.set(cacheRef, new Map()),
      });
    }),
  );
};
```

**Key differences**:
| Aspect | Before | After |
|--------|--------|-------|
| State scope | Global module | Per-Layer instance |
| State type | `Map` (mutable) | `SynchronizedRef<Map>` (managed) |
| Layer construction | `Layer.succeed` | `Layer.effect` |
| Concurrency | Unsafe | Atomic via SynchronizedRef |
</solution>

<implementation>
<steps>
1. Remove global `cacheStorage` Map (MemoryCache.ts:L165-168 in original)
2. Change `Layer.succeed` → `Layer.effect` (MemoryCache.ts:L106)
3. Create `SynchronizedRef` inside `Effect.gen` (MemoryCache.ts:L109-111)
4. Replace direct Map access with `SynchronizedRef.modifyEffect` for get (MemoryCache.ts:L115-132)
5. Replace direct Map mutation with `SynchronizedRef.updateEffect` for set (MemoryCache.ts:L135-154)
6. Use `SynchronizedRef.modify` for delete (MemoryCache.ts:L157-162)
7. Use `SynchronizedRef.set` for clear (MemoryCache.ts:L164)
</steps>

<patterns>
**SynchronizedRef** - Effect's concurrency-safe mutable reference:
```typescript
import * as SynchronizedRef from "effect/SynchronizedRef";

// Create inside Effect.gen
const ref = yield* SynchronizedRef.make(initialValue);

// Atomic modify returning [result, newState]
SynchronizedRef.modify(ref, (state) => [result, newState]);

// Atomic modify with effects (for Clock access)
SynchronizedRef.modifyEffect(ref, (state) => 
  Effect.gen(function* () {
    const now = yield* Clock.currentTimeMillis;
    return [result, newState];
  })
);

// Update without returning result
SynchronizedRef.updateEffect(ref, (state) => Effect.succeed(newState));
```

**Layer.effect** - When service construction requires effects:
```typescript
Layer.effect(
  ServiceTag,
  Effect.gen(function* () {
    const state = yield* SynchronizedRef.make(initial);
    return ServiceTag.of({ ... });
  })
);
```
</patterns>
</implementation>

<tests>
<existing_tests>
All existing tests continue to pass - the fix is transparent to consumers.
</existing_tests>

<new_tests>
**Layer isolation test** (MemoryCache.test.ts:L123-142):
```typescript
describe("Layer isolation", () => {
  it("separate Layer instances have separate caches", async () => {
    const layer1 = MemoryCache();
    const layer2 = MemoryCache();

    const setInLayer1 = Effect.gen(function* () {
      const cache = yield* CacheService;
      yield* cache.set("key", "value-from-layer1");
    }).pipe(Effect.provide(layer1));

    const getFromLayer2 = Effect.gen(function* () {
      const cache = yield* CacheService;
      return yield* cache.get("key");
    }).pipe(Effect.provide(layer2));

    await Effect.runPromise(setInLayer1);
    const result = await Effect.runPromise(getFromLayer2);

    expect(Option.isNone(result)).toBe(true); // Isolated!
  });
});
```

**Concurrency test** (to add):
```typescript
it("handles concurrent writes safely", async () => {
  const program = Effect.gen(function* () {
    const cache = yield* CacheService;
    // Concurrent writes should not race
    yield* Effect.all(
      Array.from({ length: 100 }, (_, i) =>
        cache.set(`key-${i}`, `value-${i}`)
      ),
      { concurrency: "unbounded" }
    );
    // All writes should succeed
    const results = yield* Effect.all(
      Array.from({ length: 100 }, (_, i) => cache.get(`key-${i}`))
    );
    return results.filter(Option.isSome).length;
  }).pipe(Effect.provide(MemoryCache({ maxSize: 200 })));

  const count = await Effect.runPromise(program);
  expect(count).toBe(100);
});
```
</new_tests>
</tests>

<docs>
JSDoc already updated in MemoryCache.ts:L57-98:
```typescript
/**
 * Creates an in-memory LRU cache layer.
 *
 * @description
 * Returns a Layer that provides CacheService with an in-memory implementation.
 * The cache uses LRU eviction when the max size is reached and supports
 * per-entry TTL with optional default TTL.
 *
 * Each Layer instance has its own isolated cache - creating multiple
 * MemoryCache() layers will result in separate cache instances.
 */
```
</docs>

<api>
<before>
```typescript
// Module-level shared state
const cacheStorage = new Map<string, CacheEntry<unknown>>();
export const MemoryCache = (options?: MemoryCacheOptions): Layer.Layer<CacheService>
```
</before>

<after>
```typescript
// No module-level state - all state inside Layer
export const MemoryCache = (options?: MemoryCacheOptions): Layer.Layer<CacheService>
```

**API surface unchanged** - only internal implementation differs.
</after>
</api>

<references>
- [Effect SynchronizedRef docs](https://effect.website/docs/state-management/synchronizedref/)
- [Effect Patterns - Manage Shared State with Ref](https://effect-patterns.vercel.app)
- [Effect Layer.effect](https://effect.website/docs/requirements-management/layers/)
</references>
</issue>
