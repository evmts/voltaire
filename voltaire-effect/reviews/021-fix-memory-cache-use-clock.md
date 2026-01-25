# Fix MemoryCache Use of Date.now()

<issue>
<metadata>
priority: P0
status: COMPLETED
files:
  - voltaire-effect/src/services/Cache/MemoryCache.ts
  - voltaire-effect/src/services/Cache/MemoryCache.test.ts
</metadata>

<problem>
MemoryCache originally used `Date.now()` directly instead of Effect's `Clock` service.

**Anti-pattern (BEFORE)**:
```typescript
// src/services/Cache/MemoryCache.ts - ORIGINAL
get: <T>(key: string) =>
  Effect.sync(() => {
    const cache = getCache();
    const entry = cache.get(key);
    if (!entry) return Option.none<T>();
    
    // Direct Date.now() - UNTESTABLE
    if (entry.expiresAt !== undefined && Date.now() > entry.expiresAt) {
      cache.delete(key);
      return Option.none<T>();
    }
    return Option.some(entry.value);
  }),

set: <T>(key: string, value: T, ttlMs?: number) =>
  Effect.sync(() => {
    const cache = getCache();
    const now = Date.now();  // Direct Date.now() - UNTESTABLE
    cache.set(key, {
      value,
      expiresAt: ttlMs !== undefined ? now + ttlMs : undefined,
      createdAt: now,
    });
  }),
```

**Issues**:
1. **Untestable TTL behavior**: Can't control time in tests
2. **Non-deterministic tests**: TTL tests would require real-time waits
3. **Violates Effect principles**: Side effects (time) should be managed services
4. **Breaks TestClock integration**: Effect's TestClock has no control
</problem>

<solution>
Use `Clock.currentTimeMillis` from Effect's Clock service.

**Effect-idiomatic pattern**:
- `Clock.currentTimeMillis` - Returns `Effect<number>` with current time
- `TestClock` - Allows deterministic time control in tests
- `TestContext.TestContext` - Provides TestClock layer for tests

**Implementation (AFTER)**:
```typescript
// src/services/Cache/MemoryCache.ts:L20, L120, L138
import * as Clock from "effect/Clock";

get: <T>(key: string) =>
  SynchronizedRef.modifyEffect(cacheRef, (cache) =>
    Effect.gen(function* () {
      const entry = cache.get(key) as CacheEntry<T> | undefined;
      if (!entry) return [Option.none<T>(), cache];

      // Use Clock service - TESTABLE with TestClock
      const now = yield* Clock.currentTimeMillis;
      if (entry.expiresAt !== undefined && now > entry.expiresAt) {
        const newCache = new Map(cache);
        newCache.delete(key);
        return [Option.none<T>(), newCache];
      }
      // ... LRU logic ...
      return [Option.some(entry.value), newCache];
    }),
  ),

set: <T>(key: string, value: T, ttlMs?: number) =>
  SynchronizedRef.updateEffect(cacheRef, (cache) =>
    Effect.gen(function* () {
      const ttl = ttlMs ?? defaultTtl;
      // Use Clock service - TESTABLE with TestClock
      const now = yield* Clock.currentTimeMillis;
      // ... create entry with now ...
      newCache.set(key, {
        value,
        expiresAt: ttl !== undefined ? now + ttl : undefined,
        createdAt: now,
      });
      return newCache;
    }),
  ),
```

**Key differences**:
| Aspect | Before | After |
|--------|--------|-------|
| Time source | `Date.now()` (global) | `Clock.currentTimeMillis` (service) |
| Effect type | `Effect.sync` | `Effect.gen` with yield |
| Testability | Real-time waits | TestClock control |
| Determinism | Non-deterministic | Fully deterministic |
</solution>

<implementation>
<steps>
1. Add Clock import (MemoryCache.ts:L20)
   ```typescript
   import * as Clock from "effect/Clock";
   ```

2. Replace `Date.now()` with `yield* Clock.currentTimeMillis` in get (MemoryCache.ts:L120)
   ```typescript
   const now = yield* Clock.currentTimeMillis;
   ```

3. Replace `Date.now()` with `yield* Clock.currentTimeMillis` in set (MemoryCache.ts:L138)
   ```typescript
   const now = yield* Clock.currentTimeMillis;
   ```

4. Change method implementations from `Effect.sync` to `Effect.gen` with yields
</steps>

<patterns>
**Clock service** - Effect's time abstraction:
```typescript
import * as Clock from "effect/Clock";

// Get current time as milliseconds since epoch
const now = yield* Clock.currentTimeMillis;  // Effect<number>

// Also available:
const time = yield* Clock.currentTimeNanos;  // Nanoseconds
```

**TestClock for deterministic tests**:
```typescript
import * as TestClock from "effect/TestClock";
import * as TestContext from "effect/TestContext";
import * as Duration from "effect/Duration";

const test = Effect.gen(function* () {
  // Time starts at 0
  yield* cache.set("key", "value", 1000);  // 1s TTL
  
  // Fast-forward time by 1001ms
  yield* TestClock.adjust(Duration.millis(1001));
  
  // Entry is now expired
  const result = yield* cache.get("key");
  expect(Option.isNone(result)).toBe(true);
}).pipe(
  Effect.provide(MemoryCache()),
  Effect.provide(TestContext.TestContext)  // Provides TestClock
);
```

**TestClock methods**:
```typescript
// Advance time (triggers scheduled effects)
yield* TestClock.adjust(Duration.seconds(10));

// Set absolute time
yield* TestClock.setTime(1000);

// Get current test time
const now = yield* TestClock.currentTimeMillis;
```
</patterns>
</implementation>

<tests>
<existing_tests>
Basic operations still work without TestClock - they use live Clock.
</existing_tests>

<new_tests>
**TTL expiration test with TestClock** (MemoryCache.test.ts:L65-84):
```typescript
describe("TTL with TestClock", () => {
  it("expires entries after TTL", async () => {
    const program = Effect.gen(function* () {
      const cache = yield* CacheService;
      yield* cache.set("key", "value", 1000);

      const before = yield* cache.get("key");
      yield* TestClock.adjust(Duration.millis(1001));
      const after = yield* cache.get("key");

      return { before, after };
    }).pipe(
      Effect.provide(MemoryCache()),
      Effect.provide(TestContext.TestContext),
    );

    const { before, after } = await Effect.runPromise(program);
    expect(Option.isSome(before)).toBe(true);   // Not expired yet
    expect(Option.isNone(after)).toBe(true);    // Expired!
  });
});
```

**TTL boundary test** (MemoryCache.test.ts:L86-100):
```typescript
it("does not expire entries before TTL", async () => {
  const program = Effect.gen(function* () {
    const cache = yield* CacheService;
    yield* cache.set("key", "value", 1000);

    yield* TestClock.adjust(Duration.millis(999));  // Just before expiry
    return yield* cache.get("key");
  }).pipe(
    Effect.provide(MemoryCache()),
    Effect.provide(TestContext.TestContext),
  );

  const result = await Effect.runPromise(program);
  expect(Option.isSome(result)).toBe(true);  // Still valid!
});
```

**Default TTL test** (MemoryCache.test.ts:L102-120):
```typescript
it("uses default TTL when not specified", async () => {
  const program = Effect.gen(function* () {
    const cache = yield* CacheService;
    yield* cache.set("key", "value");  // Uses defaultTtl

    const before = yield* cache.get("key");
    yield* TestClock.adjust(Duration.millis(501));
    const after = yield* cache.get("key");

    return { before, after };
  }).pipe(
    Effect.provide(MemoryCache({ defaultTtl: 500 })),
    Effect.provide(TestContext.TestContext),
  );

  const { before, after } = await Effect.runPromise(program);
  expect(Option.isSome(before)).toBe(true);
  expect(Option.isNone(after)).toBe(true);
});
```

**Additional test patterns to consider**:
```typescript
// Multiple entries with different TTLs
it("handles entries with different TTLs correctly", async () => {
  const program = Effect.gen(function* () {
    const cache = yield* CacheService;
    yield* cache.set("short", "value", 500);
    yield* cache.set("long", "value", 2000);
    
    yield* TestClock.adjust(Duration.millis(600));
    
    const short = yield* cache.get("short");  // Expired
    const long = yield* cache.get("long");    // Still valid
    
    return { short, long };
  }).pipe(
    Effect.provide(MemoryCache()),
    Effect.provide(TestContext.TestContext),
  );

  const { short, long } = await Effect.runPromise(program);
  expect(Option.isNone(short)).toBe(true);
  expect(Option.isSome(long)).toBe(true);
});

// Entry without TTL never expires
it("entries without TTL never expire", async () => {
  const program = Effect.gen(function* () {
    const cache = yield* CacheService;
    yield* cache.set("key", "value");  // No TTL, no defaultTtl
    
    yield* TestClock.adjust(Duration.days(365));  // 1 year later
    
    return yield* cache.get("key");
  }).pipe(
    Effect.provide(MemoryCache()),  // No defaultTtl
    Effect.provide(TestContext.TestContext),
  );

  const result = await Effect.runPromise(program);
  expect(Option.isSome(result)).toBe(true);
});
```
</new_tests>
</tests>

<docs>
Imports documented at file header (MemoryCache.ts:L1-18):
```typescript
/**
 * @fileoverview In-memory LRU cache implementation for CacheService.
 *
 * @module MemoryCache
 * @since 0.0.1
 *
 * @description
 * Provides an in-memory cache with LRU eviction and optional TTL support.
 * Uses Effect's Clock service for time, enabling deterministic testing
 * with TestClock.
 *
 * Features:
 * - LRU eviction when max size is reached
 * - Per-entry TTL support (or default TTL)
 * - O(1) get/set operations
 * - TestClock compatible for deterministic TTL testing
 */
```
</docs>

<api>
<before>
```typescript
// Methods return Effect.sync - no Clock dependency visible
get: <T>(key: string) => Effect.Effect<Option<T>>
set: <T>(key: string, value: T, ttlMs?: number) => Effect.Effect<void>
```
</before>

<after>
```typescript
// Same API surface - Clock is internal dependency
get: <T>(key: string) => Effect.Effect<Option<T>>
set: <T>(key: string, value: T, ttlMs?: number) => Effect.Effect<void>
```

**API surface unchanged** - Clock is an internal implementation detail.
The Layer does NOT require Clock as an explicit R dependency because
Effect's default runtime provides a live Clock automatically.
</after>
</api>

<references>
- [Effect TestClock documentation](https://effect.website/docs/testing/testclock/)
- [Effect Clock API](https://effect-ts.github.io/effect/effect/Clock.ts.html)
- [TestContext.TestContext](https://effect.website/docs/testing/testclock/#testing-clock)
</references>
</issue>
