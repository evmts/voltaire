# Fix MemoryCache Global Mutable State

## Problem

MemoryCache uses a module-level global `Map` that is shared across all Layer instances.

**Location**: `src/services/Cache/MemoryCache.ts#L165-L168`

```typescript
// Current: global mutable state
const cacheStorage = new Map<string, CacheEntry<unknown>>();

function getCache(): Map<string, CacheEntry<unknown>> {
  return cacheStorage;
}
```

## Why This Matters

- Shared state across all tests and application instances
- Test isolation is broken (cache leaks between tests)
- Not concurrency-safe
- Counter to Effect's principles of managed state

## Solution

Create the Map inside `Layer.effect` and store in `SynchronizedRef`:

```typescript
export const MemoryCache = (options?: MemoryCacheOptions): Layer.Layer<CacheService> => {
  const maxSize = options?.maxSize ?? 1000;
  const defaultTtl = options?.defaultTtl;

  return Layer.effect(
    CacheService,
    Effect.gen(function* () {
      const cacheRef = yield* SynchronizedRef.make(new Map<string, CacheEntry<unknown>>());

      return CacheService.of({
        get: <T>(key: string) =>
          SynchronizedRef.modifyEffect(cacheRef, (cache) =>
            Effect.gen(function* () {
              const entry = cache.get(key) as CacheEntry<T> | undefined;
              if (!entry) return [Option.none<T>(), cache];
              
              const now = yield* Clock.currentTimeMillis;
              if (entry.expiresAt !== undefined && now > entry.expiresAt) {
                const newCache = new Map(cache);
                newCache.delete(key);
                return [Option.none<T>(), newCache];
              }
              
              // LRU: move to end
              const newCache = new Map(cache);
              newCache.delete(key);
              newCache.set(key, entry);
              return [Option.some(entry.value), newCache];
            })
          ),

        set: <T>(key: string, value: T, ttlMs?: number) =>
          SynchronizedRef.updateEffect(cacheRef, (cache) =>
            Effect.gen(function* () {
              const ttl = ttlMs ?? defaultTtl;
              const now = yield* Clock.currentTimeMillis;
              const newCache = new Map(cache);
              
              if (newCache.size >= maxSize && !newCache.has(key)) {
                const oldestKey = newCache.keys().next().value;
                if (oldestKey !== undefined) newCache.delete(oldestKey);
              }
              
              newCache.delete(key);
              newCache.set(key, {
                value,
                expiresAt: ttl !== undefined ? now + ttl : undefined,
                createdAt: now,
              });
              return newCache;
            })
          ),

        delete: (key: string) =>
          SynchronizedRef.modify(cacheRef, (cache) => {
            const existed = cache.has(key);
            const newCache = new Map(cache);
            newCache.delete(key);
            return [existed, newCache];
          }),

        clear: () =>
          SynchronizedRef.set(cacheRef, new Map()),
      });
    })
  );
};
```

## Acceptance Criteria

- [ ] Remove module-level `cacheStorage` Map
- [ ] Create Map inside Layer.effect
- [ ] Store in `SynchronizedRef` for concurrency safety
- [ ] Each Layer instance has isolated cache
- [ ] All existing tests pass
- [ ] Add test verifying Layer isolation

## Priority

**Critical** - Correctness and test isolation issue
