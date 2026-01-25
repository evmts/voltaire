# Fix MemoryCache Use of Date.now()

## Problem

MemoryCache uses `Date.now()` directly instead of Effect's `Clock` service.

**Location**: `src/services/Cache/MemoryCache.ts#L116, L131`

```typescript
// Current: direct Date.now() usage
if (entry.expiresAt !== undefined && Date.now() > entry.expiresAt) {
  // ...
}

const now = Date.now();
```

## Why This Matters

- Not testable (can't control time in tests)
- Inconsistent with Effect's approach to side effects
- Hard to test TTL expiration behavior
- Breaks deterministic testing

## Solution

Use `Clock.currentTimeMillis` from Effect:

```typescript
import * as Clock from "effect/Clock";

// In get:
get: <T>(key: string) =>
  Effect.gen(function* () {
    const cache = getCache();
    const entry = cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) return Option.none<T>();

    const now = yield* Clock.currentTimeMillis;
    if (entry.expiresAt !== undefined && now > entry.expiresAt) {
      cache.delete(key);
      return Option.none<T>();
    }
    // ...
  }),

// In set:
set: <T>(key: string, value: T, ttlMs?: number) =>
  Effect.gen(function* () {
    const cache = getCache();
    const ttl = ttlMs ?? defaultTtl;
    const now = yield* Clock.currentTimeMillis;
    // ...
  }),
```

## Testing Benefits

With Clock, tests can control time:

```typescript
import * as TestClock from "effect/TestClock";

const program = Effect.gen(function* () {
  const cache = yield* CacheService;
  yield* cache.set("key", "value", 1000); // 1 second TTL
  
  // Advance time by 2 seconds
  yield* TestClock.adjust(Duration.seconds(2));
  
  const result = yield* cache.get("key");
  expect(Option.isNone(result)).toBe(true); // Expired!
});
```

## Acceptance Criteria

- [ ] Replace all `Date.now()` with `Clock.currentTimeMillis`
- [ ] Update method signatures to return `Effect` instead of `Effect.sync`
- [ ] Add test using `TestClock` to verify TTL behavior
- [ ] All existing tests pass

## Priority

**Critical** - Testability issue
