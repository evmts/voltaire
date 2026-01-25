# Transport Services Review

**Files Reviewed:**
- [HttpTransport.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/services/Transport/HttpTransport.ts)
- [WebSocketTransport.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/services/Transport/WebSocketTransport.ts)
- [FallbackTransport.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/services/Transport/FallbackTransport.ts)
- [TransportError.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/services/Transport/TransportError.ts)
- [TransportService.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/services/Transport/TransportService.ts)

---

## Critical Issues

### 1. HttpTransport: Manual Retry Loop (Lines 237-271)

**Current:**
```typescript
for (let attempt = 0; attempt <= config.retries; attempt++) {
  // manual retry logic with Effect.sleep
}
```

**Effect-idiomatic:**
```typescript
import * as Schedule from "effect/Schedule";

const schedule = Schedule.recurs(config.retries).pipe(
  Schedule.intersect(Schedule.spaced(config.retryDelay))
);

return Effect.retry(makeRequest, { schedule });
```

**Why:** Effect's `retry` + `Schedule` handles all retry logic declaratively, supports exponential backoff, jitter, and composable schedules.

---

### 2. HttpTransport: Mutable Request ID (Line 179)

**Current:**
```typescript
let requestId = 0;
// ...
const id = ++requestId;
```

**Effect-idiomatic:**
```typescript
const requestIdRef = yield* Ref.make(0);
// ...
const id = yield* Ref.updateAndGet(requestIdRef, n => n + 1);
```

**Why:** Mutable state outside Effect breaks referential transparency. Using `Ref` ensures thread-safe atomic updates and proper Effect semantics.

---

### 3. HttpTransport: Manual Timeout (Lines 186-216)

**Current:**
```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), timeout);
try { ... } finally { clearTimeout(timeoutId); }
```

**Effect-idiomatic:**
```typescript
Effect.tryPromise(() => fetch(url, { method: "POST", ... })).pipe(
  Effect.timeout(config.timeout),
  Effect.catchTag("TimeoutException", () =>
    Effect.fail(new TransportError({ code: -32603, message: `Request timeout` }))
  )
);
```

**Why:** Effect's `timeout` is cancellation-aware, integrates with fibers, and is declarative.

---

### 4. WebSocketTransport: Effect.runSync Inside Callbacks (Lines 353-371, 378-457)

**Current:**
```typescript
ws.onmessage = (event) => {
  Effect.runSync(Effect.gen(function* () { ... }));
};
ws.onclose = () => {
  Effect.runSync(Effect.gen(function* () { ... }));
};
```

**Issue:** Using `Effect.runSync` inside callbacks:
- Blocks the event loop
- Breaks Effect's fiber model
- Cannot use async effects inside

**Effect-idiomatic:** Use `Effect.runFork` for fire-and-forget, or better, use Effect's `Queue` or `PubSub` to bridge callback-based APIs:

```typescript
const messageQueue = yield* Queue.unbounded<JsonRpcResponse<unknown>>();

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  Effect.runFork(Queue.offer(messageQueue, msg));
};

// Process messages in Effect world
yield* Effect.fork(
  Effect.forever(
    Effect.gen(function* () {
      const msg = yield* Queue.take(messageQueue);
      // handle message
    })
  )
);
```

---

### 5. WebSocketTransport: setTimeout for Reconnection (Lines 411-417)

**Current:**
```typescript
setTimeout(() => {
  Effect.runPromise(connect.pipe(Effect.catchAll(() => Effect.void)));
}, delay);
```

**Effect-idiomatic:**
```typescript
yield* Effect.fork(
  Effect.sleep(delay).pipe(
    Effect.flatMap(() => connect),
    Effect.catchAll(() => Effect.void)
  )
);
```

**Why:** Effect's `sleep` is fiber-aware and cancellable. setTimeout leaks if the transport is closed during reconnection.

---

### 6. WebSocketTransport: setInterval for Keep-Alive (Lines 264-280)

**Current:**
```typescript
const timer = setInterval(() => {
  Effect.runSync(/* ping logic */);
}, config.keepAlive);
```

**Effect-idiomatic:**
```typescript
yield* Effect.fork(
  Effect.forever(
    Effect.gen(function* () {
      yield* Effect.sleep(config.keepAlive);
      const socket = yield* Ref.get(wsRef);
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(/* ping */);
      }
    })
  )
);
```

**Why:** Forked fibers are automatically cleaned up when scope closes. No manual timer cleanup needed.

---

### 7. FallbackTransport: Mutable Instances Array (Lines 124-128)

**Current:**
```typescript
const instances: TransportInstance[] = transports.map((t) => ({
  transport: t,
  failures: 0,
  latency: Number.POSITIVE_INFINITY,
}));
```

State is mutated in place:
```typescript
instance.failures++;
instance.latency = Date.now() - start;
```

**Effect-idiomatic:**
```typescript
const instancesRef = yield* Ref.make(transports.map(...));

yield* Ref.update(instancesRef, instances => 
  instances.map(i => i === instance ? { ...i, failures: i.failures + 1 } : i)
);
```

---

### 8. FallbackTransport: Incorrect Retry Schedule (Lines 168-171)

**Current:**
```typescript
Effect.retry({
  times: retryCount - 1,
  schedule: Effect.succeed(retryDelay),  // ❌ Wrong type
}),
```

**Issue:** `schedule` expects a `Schedule`, not an `Effect`. This is a type error.

**Effect-idiomatic:**
```typescript
import * as Schedule from "effect/Schedule";

Effect.retry({
  times: retryCount - 1,
  schedule: Schedule.spaced(retryDelay),
});
```

---

## Medium Issues

### 9. No Scope Usage in HttpTransport

HttpTransport returns `Layer.Layer<TransportService>` without scope, which is fine since HTTP is stateless. However, if connection pooling is added later, it should use `Layer.scoped`.

### 10. WebSocketTransport: Request ID Uses Ref (Correct)

WebSocketTransport correctly uses `Ref` for request ID (line 236):
```typescript
const requestIdRef = yield* Ref.make(0);
```

HttpTransport should follow this pattern.

---

## Good Patterns

1. **TransportError** - Properly extends AbstractError with `_tag` for Effect error handling
2. **WebSocketTransport uses Layer.scoped** - Correct for resource lifecycle management
3. **WebSocketTransport finalizer** - Properly cleans up WebSocket on scope close (lines 465-473)
4. **Deferred for request correlation** - Good pattern for async request/response matching
5. **FallbackTransport latency ranking** - Nice feature for adaptive transport selection

---

## Summary

| File | Issue | Severity |
|------|-------|----------|
| HttpTransport | Manual retry loop | High |
| HttpTransport | Mutable requestId | High |
| HttpTransport | Manual timeout | Medium |
| WebSocketTransport | Effect.runSync in callbacks | High |
| WebSocketTransport | setTimeout for reconnect | Medium |
| WebSocketTransport | setInterval for keepalive | Medium |
| FallbackTransport | Mutable instances array | Medium |
| FallbackTransport | Wrong schedule type | High (likely runtime bug) |

---

## Recommended Refactoring Priority

1. **Fix FallbackTransport schedule type error** - Likely causing runtime issues
2. **HttpTransport: Use Effect.retry + Schedule** - Simplest win
3. **HttpTransport: Use Ref for requestId** - Easy fix
4. **WebSocketTransport: Replace Effect.runSync with Queue/Fork** - Larger refactor but critical for correctness
5. **Replace setTimeout/setInterval with Effect.sleep/forever** - Medium effort, improves cleanup
