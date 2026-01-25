# Review 080: Cache and NonceManager Service Implementations

**Files reviewed:**
- `src/services/Cache/CacheService.ts`
- `src/services/Cache/MemoryCache.ts`
- `src/services/Cache/NoopCache.ts`
- `src/services/Cache/MemoryCache.test.ts`
- `src/services/NonceManager/NonceManagerService.ts`
- `src/services/NonceManager/DefaultNonceManager.ts`

## Summary

| Category | Status | Notes |
|----------|--------|-------|
| State Management | ✅ MemoryCache / ❌ NonceManager | MemoryCache uses SynchronizedRef properly; NonceManager uses plain Map |
| Clock Usage | ✅ | MemoryCache correctly uses Effect Clock for testable time |
| Race Conditions | ❌ | NonceManager has critical race condition in `consume()` |
| Memory Management | ✅ | LRU eviction implemented correctly |
| Effect Patterns | ✅ MemoryCache / ⚠️ NonceManager | Layer composition correct but NonceManager lacks proper Ref |

---

## ✅ What's Working Well

### MemoryCache

1. **Proper SynchronizedRef usage** (lines 109-111, 115-132): State is managed atomically via `SynchronizedRef.modifyEffect` and `SynchronizedRef.updateEffect`. This prevents race conditions when multiple fibers access the cache concurrently.

2. **Testable time via Clock** (lines 120, 138): Uses `Clock.currentTimeMillis` instead of `Date.now()`, making TTL behavior fully testable with `TestClock`. The test file demonstrates this correctly (lines 66-84).

3. **Layer isolation** (test lines 124-142): Each `MemoryCache()` call creates an independent layer with its own state. The test correctly verifies that two layers don't share state.

4. **LRU eviction** (lines 127-129, 140-144): Correctly moves accessed entries to end of Map (exploiting Map insertion order) and evicts oldest when full.

### NoopCache

Clean, simple implementation. No issues.

### CacheService

Well-designed interface with proper Effect types.

---

## ❌ Critical Issues

### Issue 034 (CONFIRMED): NonceManager Race Condition

**File:** `DefaultNonceManager.ts` lines 104-127

```typescript
consume: (address: string) =>
  Effect.gen(function* () {
    // ...
    const delta = deltaMap.get(key) ?? 0;  // READ
    const nonce = Number(baseNonce) + delta;
    deltaMap.set(key, delta + 1);          // WRITE
    return nonce;
  }),
```

**Problem:** The read-modify-write of `deltaMap` is NOT atomic. If two fibers call `consume()` for the same address concurrently:

1. Fiber A reads delta = 0
2. Fiber B reads delta = 0 (before A writes)
3. Fiber A writes delta = 1, returns nonce 5
4. Fiber B writes delta = 1, returns nonce 5 ← **DUPLICATE NONCE**

This will cause transaction failures on-chain.

**Fix:** Use `SynchronizedRef` for the delta map:

```typescript
export const DefaultNonceManager: Layer.Layer<NonceManagerService, never, ProviderService> = 
  Layer.effect(
    NonceManagerService,
    Effect.gen(function* () {
      const deltaRef = yield* SynchronizedRef.make(new Map<string, number>());
      
      return {
        consume: (address: string) =>
          SynchronizedRef.modifyEffect(deltaRef, (deltaMap) =>
            Effect.gen(function* () {
              const provider = yield* ProviderService;
              const key = address.toLowerCase();
              
              const baseNonce = yield* provider
                .getTransactionCount(address as `0x${string}`, "pending")
                .pipe(Effect.mapError(/* ... */));
              
              const delta = deltaMap.get(key) ?? 0;
              const nonce = Number(baseNonce) + delta;
              
              const newMap = new Map(deltaMap);
              newMap.set(key, delta + 1);
              
              return [nonce, newMap];
            }),
          ),
        // ... other methods similarly wrapped
      };
    }),
  );
```

**Priority:** P0 - This will cause production bugs.

---

### Issue 020 (RESOLVED): MemoryCache Global State

**Status:** ✅ Fixed

The implementation correctly uses `Layer.effect` with `SynchronizedRef.make` inside the effect, meaning each layer instantiation creates fresh state. The test at lines 124-142 confirms isolation works.

---

### Issue 021 (RESOLVED): MemoryCache Clock Usage

**Status:** ✅ Fixed

Uses `Clock.currentTimeMillis` from Effect, not `Date.now()`. TTL tests with `TestClock` pass.

---

## ⚠️ Minor Issues

### 1. Layer Dependency Missing in Type

**File:** `DefaultNonceManager.ts` line 76

```typescript
export const DefaultNonceManager: Layer.Layer<NonceManagerService> = Layer.sync(
```

The layer requires `ProviderService` at runtime (used in `get` and `consume`), but this isn't reflected in the Layer type. The runtime dependency is hidden because the Provider is accessed inside the returned effects, not during layer construction.

**Current behavior works** but could be clearer. Consider documenting that the returned effects require ProviderService.

### 2. LRU Eviction Creates New Map on Every Get

**File:** `MemoryCache.ts` lines 127-130

```typescript
const newCache = new Map(cache);
newCache.delete(key);
newCache.set(key, entry);
return [Option.some(entry.value), newCache];
```

Every successful `get()` creates a new Map to update LRU order. For high-frequency access, this adds GC pressure.

**Potential optimization:** Only update LRU order on set, not on get. True LRU tracks access order, but "entry age" eviction (oldest-inserted-first) is simpler and often sufficient for caches.

### 3. Missing Test: Concurrent Access

No tests verify that concurrent `set`/`get` operations are atomic. While `SynchronizedRef` should handle this, a test would provide confidence:

```typescript
it("handles concurrent access atomically", async () => {
  const program = Effect.gen(function* () {
    const cache = yield* CacheService;
    // Run 100 concurrent increments
    yield* Effect.all(
      Array.from({ length: 100 }, (_, i) =>
        cache.set("counter", i)
      ),
      { concurrency: "unbounded" }
    );
    return yield* cache.get("counter");
  }).pipe(Effect.provide(MemoryCache()));
  
  const result = await Effect.runPromise(program);
  expect(Option.isSome(result)).toBe(true);
});
```

---

## Recommendations

| Priority | Action | Issue |
|----------|--------|-------|
| P0 | Fix NonceManager race condition with SynchronizedRef | #034 |
| P2 | Add concurrent access tests for MemoryCache | Minor |
| P3 | Consider simpler eviction strategy (insertion-order vs access-order) | Performance |

---

## Appendix: Test Coverage

| Component | Coverage | Notes |
|-----------|----------|-------|
| MemoryCache get/set/delete/clear | ✅ | |
| MemoryCache TTL | ✅ | Uses TestClock correctly |
| MemoryCache LRU | ✅ | Tests eviction and order update |
| MemoryCache layer isolation | ✅ | |
| MemoryCache concurrent access | ❌ | Missing |
| NonceManager | ❌ | No tests found |
