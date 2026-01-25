# Fix WebSocketTransport setTimeout for Reconnection

<issue>
<metadata>
priority: P1
files: [src/services/Transport/WebSocketTransport.ts]
reviews: [076-transport-services-review.md]
related: [040, 042, 043]
</metadata>

<problem>
## Anti-Pattern: setTimeout Outside Effect Runtime

WebSocketTransport uses raw `setTimeout` for reconnection delays, escaping Effect's structured concurrency and scheduling system.

**Location**: `src/services/Transport/WebSocketTransport.ts#L411-417`

```typescript
ws.onclose = () => {
  Effect.runSync(
    Effect.gen(function* () {
      // ... reconnection logic ...
      if (reconnectEnabled && attempts < reconnectOpts.maxAttempts) {
        const delay = yield* Ref.get(currentDelayRef);
        
        setTimeout(() => {  // ❌ Escapes Effect runtime
          Effect.runPromise(
            connect.pipe(
              Effect.catchAll(() => Effect.void),
            ),
          );
        }, delay);
      }
    }),
  );
};
```

### Why This Matters

1. **Timer not tracked by Effect**: Cannot be interrupted via scope close
2. **Not testable with TestClock**: Unit tests cannot control time
3. **Escapes structured concurrency**: Orphaned async operation
4. **Double escape**: `setTimeout` + `Effect.runPromise` breaks all Effect guarantees
5. **No jitter**: Fixed delays cause thundering herd on reconnection
6. **Memory leak potential**: Timer may fire after transport closed

### viem Reference

viem's `socket.ts` also uses `setTimeout` for reconnection (L136-142):
```typescript
setTimeout(async () => {
  await setup().catch(console.error);
  reconnectInProgress = false;
}, delay);
```

The Effect equivalent should use `Effect.sleep` + `Effect.forkScoped`.
</problem>

<solution>
## Effect Pattern: Effect.sleep + Schedule for Reconnection

Replace `setTimeout` with Effect's scheduling primitives that integrate with the runtime.

### Option 1: Effect.sleep with Forked Fiber

```typescript
import * as Duration from "effect/Duration";
import * as Fiber from "effect/Fiber";

// Store reconnect fiber ref for cancellation
const reconnectFiberRef = yield* Ref.make<Fiber.RuntimeFiber<void, never> | null>(null);

const scheduleReconnect = (delay: number) =>
  Effect.gen(function* () {
    yield* Effect.sleep(Duration.millis(delay));
    yield* connect.pipe(Effect.catchAll(() => Effect.void));
  });

// In handleDisconnect (called from closeQueue processor):
const handleDisconnect = Effect.gen(function* () {
  const isClosed = yield* Ref.get(isClosedRef);
  if (isClosed) return;
  
  if (reconnectEnabled) {
    const attempts = yield* Ref.get(attemptCountRef);
    if (attempts < reconnectOpts.maxAttempts) {
      yield* Ref.set(isReconnectingRef, true);
      const delay = yield* Ref.get(currentDelayRef);
      
      yield* Ref.update(attemptCountRef, (n) => n + 1);
      yield* Ref.update(currentDelayRef, (d) =>
        Math.min(d * reconnectOpts.multiplier, reconnectOpts.maxDelay)
      );
      
      // Cancel any pending reconnect fiber
      const existingFiber = yield* Ref.get(reconnectFiberRef);
      if (existingFiber) {
        yield* Fiber.interrupt(existingFiber);
      }
      
      // Fork new reconnect attempt
      const fiber = yield* Effect.fork(scheduleReconnect(delay));
      yield* Ref.set(reconnectFiberRef, fiber);
    } else {
      yield* failAllPending("Max reconnection attempts exceeded");
    }
  }
});
```

### Option 2: Effect.retry with Schedule (Preferred)

Use Effect's built-in retry mechanism with exponential backoff:

```typescript
import * as Schedule from "effect/Schedule";
import * as Duration from "effect/Duration";

// Reconnection schedule with exponential backoff + jitter
const reconnectSchedule = Schedule.exponential(
  Duration.millis(reconnectOpts.delay),
  reconnectOpts.multiplier
).pipe(
  Schedule.jittered,  // Add randomness to prevent thundering herd
  Schedule.upTo(Duration.millis(reconnectOpts.maxDelay)),  // Cap max delay
  Schedule.whileInput<TransportError>((error) => 
    error.code === -32603  // Only retry connection errors
  ),
  Schedule.recurs(reconnectOpts.maxAttempts)
);

// Connect with automatic retry
const connectWithRetry = connect.pipe(
  Effect.retry(reconnectSchedule),
  Effect.catchAll((error) =>
    failAllPending(`Reconnection failed: ${error.message}`)
  )
);

// In handleDisconnect:
const handleDisconnect = Effect.gen(function* () {
  const isClosed = yield* Ref.get(isClosedRef);
  if (isClosed) return;
  
  if (reconnectEnabled) {
    yield* Ref.set(isReconnectingRef, true);
    yield* connectWithRetry;
  }
});
```

### Option 3: Fiber + Effect.interruptible

Ensure the reconnect fiber can be interrupted:

```typescript
const reconnectFiber = yield* Effect.gen(function* () {
  yield* Effect.sleep(Duration.millis(delay));
  yield* connect;
}).pipe(
  Effect.interruptible,  // Can be interrupted by scope close
  Effect.forkScoped      // Tied to transport scope
);
```
</solution>

<implementation>
<steps>
1. **Add Duration and Schedule imports**:
   ```typescript
   import * as Duration from "effect/Duration";
   import * as Schedule from "effect/Schedule";
   import * as Fiber from "effect/Fiber";
   ```

2. **Add reconnect fiber ref**:
   ```typescript
   const reconnectFiberRef = yield* Ref.make<Fiber.RuntimeFiber<void, never> | null>(null);
   ```

3. **Create reconnect schedule**:
   ```typescript
   const reconnectSchedule = Schedule.exponential(
     Duration.millis(reconnectOpts.delay),
     reconnectOpts.multiplier
   ).pipe(
     Schedule.jittered,
     Schedule.upTo(Duration.millis(reconnectOpts.maxDelay)),
     Schedule.recurs(reconnectOpts.maxAttempts)
   );
   ```

4. **Replace setTimeout with Effect.sleep or Effect.retry**:
   ```typescript
   // Option A: Manual sleep
   yield* Effect.sleep(Duration.millis(delay));
   yield* connect;
   
   // Option B: Automatic retry (preferred)
   yield* connect.pipe(Effect.retry(reconnectSchedule));
   ```

5. **Add cleanup for reconnect fiber**:
   ```typescript
   yield* Effect.addFinalizer(() =>
     Effect.gen(function* () {
       const fiber = yield* Ref.get(reconnectFiberRef);
       if (fiber) yield* Fiber.interrupt(fiber);
     })
   );
   ```

6. **Move reconnection logic to closeQueue processor** (from 040):
   ```typescript
   const processCloseEvents = Queue.take(closeQueue).pipe(
     Effect.flatMap(() => handleDisconnect),
     Effect.forever
   );
   yield* Effect.forkScoped(processCloseEvents);
   ```
</steps>

<patterns>
### Effect.sleep Pattern
```typescript
// Replaces: setTimeout(() => { ... }, delay)
yield* Effect.sleep(Duration.millis(delay));
yield* doSomething;
```

### Schedule.exponential with Jitter
```typescript
// Exponential backoff: 1s → 2s → 4s → 8s (capped at 30s)
const schedule = Schedule.exponential("1 second", 2).pipe(
  Schedule.jittered,                    // ±20% randomness
  Schedule.upTo(Duration.seconds(30)),  // Max delay cap
  Schedule.recurs(10)                   // Max attempts
);

yield* effect.pipe(Effect.retry(schedule));
```

### Interruptible Fiber Pattern
```typescript
const fiber = yield* Effect.gen(function* () {
  yield* Effect.sleep("5 seconds");
  yield* reconnect;
}).pipe(
  Effect.interruptible,
  Effect.fork
);

// Later: can be interrupted
yield* Fiber.interrupt(fiber);
```

### Duration Best Practices
```typescript
// Use Duration constructors, not raw numbers
Duration.millis(1000)    // ✅
Duration.seconds(1)      // ✅ 
Duration.minutes(5)      // ✅
1000                     // ❌ Raw number
"1 second"               // ✅ String literal (convenience)
```
</patterns>

<cleanup>
### Reconnect Fiber Cleanup

```typescript
yield* Effect.addFinalizer(() =>
  Effect.gen(function* () {
    // 1. Mark transport as closed
    yield* Ref.set(isClosedRef, true);
    
    // 2. Cancel any pending reconnection
    const reconnectFiber = yield* Ref.get(reconnectFiberRef);
    if (reconnectFiber) {
      yield* Fiber.interrupt(reconnectFiber);
    }
    
    // 3. Close WebSocket
    const ws = yield* Ref.get(wsRef);
    if (ws) ws.close();
    
    // 4. Fail all pending requests
    yield* failAllPending("Transport closed");
  })
);
```

### TestClock Integration

With `Effect.sleep`, tests can control time:

```typescript
it("should reconnect after delay", async () => {
  await Effect.gen(function* () {
    // Trigger disconnect
    mockWs.close();
    
    // Advance time by reconnect delay
    yield* TestClock.adjust("1 second");
    
    // Verify reconnection attempted
    expect(mockWs.connectCalls).toBe(2);
  }).pipe(
    Effect.provide(TestContext.TestContext),
    Effect.runPromise
  );
});
```
</cleanup>
</implementation>

<tests>
```typescript
import { TestClock, TestContext } from "effect";

describe("WebSocketTransport Reconnection", () => {
  it("should delay reconnection using Effect.sleep", async () => {
    const delays: number[] = [];
    
    await Effect.gen(function* () {
      const startTime = yield* Clock.currentTimeMillis;
      
      // Simulate disconnect
      mockWs.triggerClose();
      
      // Advance clock by reconnect delay
      yield* TestClock.adjust("1 second");
      
      const afterTime = yield* Clock.currentTimeMillis;
      delays.push(afterTime - startTime);
    }).pipe(
      Effect.provide(WebSocketTransport({
        url: "ws://localhost:8545",
        reconnect: { delay: 1000 }
      })),
      Effect.provide(TestContext.TestContext),
      Effect.scoped,
      Effect.runPromise
    );
    
    expect(delays[0]).toBeGreaterThanOrEqual(1000);
  });

  it("should cancel reconnect fiber on scope close", async () => {
    let reconnectStarted = false;
    let reconnectCompleted = false;
    
    const fiber = await Effect.gen(function* () {
      mockWs.triggerClose();
      reconnectStarted = true;
      // Reconnect delay is 1 second
    }).pipe(
      Effect.provide(WebSocketTransport({
        url: "ws://localhost:8545",
        reconnect: { delay: 1000 }
      })),
      Effect.scoped,
      Effect.fork,
      Effect.runPromise
    );
    
    // Interrupt before reconnect completes
    await Effect.runPromise(
      Fiber.interrupt(fiber).pipe(Effect.delay("500 millis"))
    );
    
    expect(reconnectStarted).toBe(true);
    expect(reconnectCompleted).toBe(false);
  });

  it("should use exponential backoff with jitter", async () => {
    const delays: number[] = [];
    
    await Effect.gen(function* () {
      for (let i = 0; i < 3; i++) {
        const startTime = yield* Clock.currentTimeMillis;
        mockWs.triggerClose();
        yield* TestClock.adjust(Duration.seconds(60)); // Allow reconnect
        const endTime = yield* Clock.currentTimeMillis;
        delays.push(endTime - startTime);
      }
    }).pipe(
      Effect.provide(WebSocketTransport({
        url: "ws://localhost:8545",
        reconnect: { delay: 1000, multiplier: 2 }
      })),
      Effect.provide(TestContext.TestContext),
      Effect.scoped,
      Effect.runPromise
    );
    
    // Delays should increase: ~1000, ~2000, ~4000 (with jitter)
    expect(delays[1]).toBeGreaterThan(delays[0]);
    expect(delays[2]).toBeGreaterThan(delays[1]);
  });

  it("should stop after max attempts", async () => {
    let failedWithMaxAttempts = false;
    
    await Effect.gen(function* () {
      // Force all reconnects to fail
      mockWs.failAllConnections = true;
      
      mockWs.triggerClose();
      
      // Advance through all attempts
      for (let i = 0; i < 10; i++) {
        yield* TestClock.adjust("30 seconds");
      }
    }).pipe(
      Effect.provide(WebSocketTransport({
        url: "ws://localhost:8545",
        reconnect: { maxAttempts: 5 }
      })),
      Effect.catchAll((e) => {
        if (e.message.includes("Max reconnection")) {
          failedWithMaxAttempts = true;
        }
        return Effect.void;
      }),
      Effect.provide(TestContext.TestContext),
      Effect.scoped,
      Effect.runPromise
    );
    
    expect(failedWithMaxAttempts).toBe(true);
  });
});
```
</tests>

<docs>
```typescript
/**
 * Reconnection configuration for WebSocket transport.
 * 
 * Uses Effect's scheduling primitives for proper lifecycle management:
 * - `Effect.sleep` for delays (testable with TestClock)
 * - `Schedule.exponential` with jitter for backoff
 * - `Effect.forkScoped` for cancellable reconnect fibers
 * 
 * ## Backoff Strategy
 * 
 * ```
 * Attempt 1: 1000ms (±20% jitter)
 * Attempt 2: 2000ms (±20% jitter)
 * Attempt 3: 4000ms (±20% jitter)
 * ...
 * Capped at: maxDelay (default 30000ms)
 * ```
 * 
 * ## Interruption
 * 
 * Reconnection fibers are automatically interrupted when:
 * - Transport scope closes
 * - `Fiber.interrupt` is called
 * - A new reconnection supersedes the pending one
 * 
 * @example
 * ```typescript
 * const transport = WebSocketTransport({
 *   url: 'wss://eth.example.com',
 *   reconnect: {
 *     maxAttempts: 10,
 *     delay: 1000,      // Initial delay in ms
 *     maxDelay: 30000,  // Maximum delay cap
 *     multiplier: 2     // Exponential factor
 *   }
 * });
 * ```
 */
```
</docs>

<api>
<before>
```typescript
// setTimeout escapes Effect runtime
setTimeout(() => {
  Effect.runPromise(connect);
}, delay);
```
</before>

<after>
```typescript
// Effect.sleep integrates with runtime
yield* Effect.sleep(Duration.millis(delay));
yield* connect;

// Or with Schedule for full retry logic
yield* connect.pipe(
  Effect.retry(
    Schedule.exponential("1 second").pipe(
      Schedule.jittered,
      Schedule.recurs(10)
    )
  )
);
```
</after>
</api>

<references>
- [Effect Schedule Documentation](https://effect.website/docs/scheduling/schedule-combinators)
- [Effect Duration Documentation](https://effect.website/docs/data-types/duration)
- [Effect TestClock](https://effect.website/docs/testing/test-clock)
- [viem socket.ts reconnection](https://github.com/wevm/viem/blob/main/src/utils/rpc/socket.ts#L130-145)
- Review 076: Transport services comprehensive review
</references>
</issue>
