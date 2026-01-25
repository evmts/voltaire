# Review 076: Transport Services

**Date**: 2026-01-25
**Reviewer**: AI Assistant
**Status**: Issues Found

## Summary

Transport services implement JSON-RPC communication with various backends. Overall architecture is solid, but several Effect anti-patterns and potential issues remain.

---

## Files Reviewed

1. HttpTransport.ts
2. WebSocketTransport.ts
3. FallbackTransport.ts
4. BatchScheduler.ts
5. BrowserTransport.ts
6. TransportService.ts
7. Transport.test.ts

---

## Critical Issues

### 1. BatchScheduler: Effect.runSync/runPromise in callbacks (P0)

**File**: `BatchScheduler.ts:102-119`

The flush function uses `Effect.runPromise` and `Effect.runSync` inside an async callback, breaking fiber semantics:

```typescript
const flush = async (): Promise<void> => {
  // ...
  const responses = await Effect.runPromise(send(requests));  // ❌ breaks fiber
  
  Effect.runSync(Deferred.fail(req.deferred, new Error(...)));  // ❌ in callback
  Effect.runSync(Deferred.succeed(req.deferred, response.result));  // ❌ in callback
}
```

**Problem**: 
- Loses fiber context, interruption doesn't propagate
- Errors not properly tracked in Effect runtime

**Fix**: Refactor to use Effect-native scheduling with `Effect.schedule` or `Effect.repeat`:

```typescript
export const createBatchScheduler = (
  send: (requests: JsonRpcRequest[]) => Effect.Effect<JsonRpcBatchResponse[], Error>,
  options: BatchOptions = {},
) => {
  const batchSize = options.batchSize ?? 100;
  const wait = options.wait ?? 0;

  return {
    schedule: <T>(method: string, params?: unknown[]): Effect.Effect<T, Error> =>
      Effect.gen(function* () {
        // Use Effect's request batching with DataLoader pattern
        // or Queue + Fiber for proper Effect-native batching
      }),
  };
};
```

---

### 2. WebSocketTransport: Effect.runSync in event handlers (P0)

**File**: `WebSocketTransport.ts:353-371, 377-457`

Multiple event handlers use `Effect.runSync`:

```typescript
ws.onmessage = (event) => {
  Effect.runSync(  // ❌ in callback
    Effect.gen(function* () {
      // ...
      yield* Deferred.succeed(foundDeferred, message);
    }),
  );
};

ws.onclose = () => {
  Effect.runSync(  // ❌ in callback
    Effect.gen(function* () {
      // complex reconnection logic
    }),
  );
};
```

**Problem**: 
- Synchronous execution in async callbacks
- If any yielded effect suspends, it will throw
- Loses proper fiber semantics

**Partial Mitigation**: These specific uses are safe because they only do `Ref.update` and `Deferred.succeed` which are synchronous. However, this is fragile - any future change adding an async operation will silently break.

**Better Pattern**: Use `Effect.runFork` for fire-and-forget or bridge with a Queue:

```typescript
ws.onmessage = (event) => {
  Effect.runFork(
    Effect.gen(function* () {
      // ... 
    }).pipe(Effect.catchAllCause(() => Effect.void))
  );
};
```

---

### 3. WebSocketTransport: setTimeout for reconnection (P1)

**File**: `WebSocketTransport.ts:411-417`

```typescript
setTimeout(() => {
  Effect.runPromise(
    connect.pipe(Effect.catchAll(() => Effect.void)),
  );
}, delay);
```

**Problem**: 
- Timer not tracked, won't be cleaned up on scope close
- Uses `Effect.runPromise` in callback

**Fix**: Use `Effect.schedule` with proper fiber management, or store timer ID in Ref for cleanup.

---

### 4. WebSocketTransport: setInterval for keep-alive (P1)

**File**: `WebSocketTransport.ts:264-280`

```typescript
const timer = setInterval(() => {
  Effect.runSync(
    Effect.gen(function* () {
      // ...
    }),
  );
}, config.keepAlive);
```

**Positive**: Timer IS properly tracked in `keepAliveTimerRef` and cleaned up in finalizer.

**Issue**: Still uses `Effect.runSync` in callback, but operations are synchronous so it works.

---

### 5. FallbackTransport: Mutable state outside Effect (P1)

**File**: `FallbackTransport.ts:124-128`

```typescript
const instances: TransportInstance[] = transports.map((t) => ({
  transport: t,
  failures: 0,
  latency: Number.POSITIVE_INFINITY,
}));
```

Mutations at lines 165-166, 171:
```typescript
instance.latency = Date.now() - start;
instance.failures = 0;
// ...
instance.failures++;
```

**Problem**: 
- Mutable array shared across all requests
- No synchronization - concurrent requests can race
- Not fiber-safe

**Fix**: Use `Ref` for state:

```typescript
return Layer.effect(TransportService, Effect.gen(function* () {
  const instancesRef = yield* Ref.make(transports.map(t => ({
    transport: t,
    failures: 0,
    latency: Number.POSITIVE_INFINITY,
  })));
  
  return {
    request: <T>(...) => Effect.gen(function* () {
      // Use Ref.updateAndGet for atomic updates
    }),
  };
}));
```

---

## Moderate Issues

### 6. HttpTransport: AbortController cleanup timing (P2)

**File**: `HttpTransport.ts:198-247`

```typescript
Effect.acquireRelease(
  Effect.sync(() => new AbortController()),
  (controller) => Effect.sync(() => controller.abort()),
).pipe(
  // ... fetch with controller.signal
  Effect.scoped,
)
```

**Concern**: The abort is called on scope exit, but `Effect.scoped` closes the scope immediately after the flatMap chain completes. If the response is still being read when scope closes, abort may interrupt it.

**Assessment**: Actually works correctly because `response.json()` is awaited before scope closes.

---

### 7. HttpTransport batching: fire-and-forget flush (P2)

**File**: `BatchScheduler.ts:131-132, 136`

```typescript
if (pending.length >= batchSize) {
  flush();  // ❌ no await, errors lost
  return;
}

flushTimer = setTimeout(() => flush(), wait);  // ❌ flush errors not handled
```

**Problem**: Errors from flush are not propagated anywhere.

---

### 8. BrowserTransport: window.ethereum access (P2)

**File**: `BrowserTransport.ts:166, 177`

```typescript
if (typeof window === "undefined" || !window.ethereum) {
  // ...
}
// ...
window.ethereum!.request({ method, params })
```

**Issue**: Race condition possible if wallet is disconnected between check and use.

**Fix**: Re-check in tryPromise:
```typescript
try: () => {
  if (!window.ethereum) throw new Error("Wallet disconnected");
  return window.ethereum.request({ method, params });
}
```

---

## Minor Issues / Style

### 9. Inconsistent error types in BatchScheduler

**File**: `BatchScheduler.ts:78, 144`

Returns `Effect.Effect<T, Error>` (generic Error) while other transports return `Effect.Effect<T, TransportError>`.

---

### 10. Type assertion in JSON parsing

**File**: `HttpTransport.ts:217, 294`

```typescript
response.json() as Promise<JsonRpcResponse<T>>
response.json() as Promise<JsonRpcBatchResponse[]>
```

Safe but could use runtime validation with Effect Schema.

---

## Verified Fixed Issues

From previous reviews (040-043, 072):

| Issue | Status |
|-------|--------|
| WebSocket setTimeout usage | ⚠️ Still present (line 411) but tracked |
| WebSocket setInterval usage | ✅ Timer tracked in Ref, cleaned in finalizer |
| Batch scheduler callbacks | ❌ Still uses Effect.runSync/runPromise |
| Fallback mutable array | ❌ Still mutable, not using Ref |

---

## Test Coverage Assessment

**Transport.test.ts** has good coverage:
- ✅ TestTransport mock responses
- ✅ HttpTransport basic requests, headers, errors
- ✅ HttpTransport batching
- ✅ FallbackTransport failover
- ✅ WebSocketTransport lifecycle
- ✅ WebSocketTransport reconnection
- ✅ WebSocketTransport keep-alive

**Missing tests**:
- Concurrent request race conditions in FallbackTransport
- BatchScheduler flush error handling
- Transport interruption/cancellation

---

## Recommendations

### Immediate (P0)

1. **BatchScheduler**: Rewrite using Effect-native patterns (Queue + Fiber or DataLoader pattern)
2. **WebSocketTransport**: Use `Effect.runFork` instead of `Effect.runSync` in callbacks

### Short-term (P1)

3. **FallbackTransport**: Convert mutable array to `Ref<TransportInstance[]>`
4. **WebSocketTransport**: Convert reconnection setTimeout to Effect-native scheduling

### Long-term (P2)

5. Add Effect Schema validation for JSON-RPC responses
6. Add interruption tests for all transports
7. Consider using `@effect/platform` HttpClient for HttpTransport

---

## Code Quality

| Aspect | Rating |
|--------|--------|
| Documentation | ⭐⭐⭐⭐⭐ Excellent JSDoc |
| Type Safety | ⭐⭐⭐⭐ Good, minor assertions |
| Effect Patterns | ⭐⭐⭐ Some anti-patterns |
| Error Handling | ⭐⭐⭐⭐ Consistent TransportError |
| Test Coverage | ⭐⭐⭐⭐ Good functional coverage |
| Resource Cleanup | ⭐⭐⭐⭐ Mostly proper |

---

## Action Items

- [ ] P0: Fix BatchScheduler Effect.runSync/runPromise usage
- [ ] P0: Fix WebSocketTransport Effect.runSync in handlers
- [ ] P1: Convert FallbackTransport instances to Ref
- [ ] P1: Fix WebSocketTransport reconnection setTimeout
- [ ] P2: Add interruption/cancellation tests
- [ ] P2: Add race condition tests for FallbackTransport
