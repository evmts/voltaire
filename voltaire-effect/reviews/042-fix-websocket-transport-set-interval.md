# Fix WebSocketTransport setInterval for Keepalive

<issue>
<metadata>
priority: P1
files: [src/services/Transport/WebSocketTransport.ts]
reviews: [076-transport-services-review.md, 073-fix-websocket-effect-runsync-in-callbacks.md]
related: [040, 041]
</metadata>

<problem>
## Anti-Pattern: setInterval Outside Effect Runtime

WebSocketTransport uses raw `setInterval` for keepalive pings, escaping Effect's structured concurrency and scheduling system.

**Location**: `src/services/Transport/WebSocketTransport.ts#L264-270`

```typescript
// startKeepAlive (L264-270)
const keepaliveInterval = setInterval(() => {  // ❌ Escapes Effect runtime
  if (ws.readyState === WebSocket.OPEN) {
    ws.ping?.();
  }
}, keepaliveMs);

// stopKeepAlive requires manual clearInterval
const stopKeepAlive = Effect.sync(() => {
  clearInterval(keepaliveInterval);
});
```

### Why This Matters

1. **Interval not tracked by Effect**: Cannot query or inspect timer state
2. **Cannot be interrupted via scope close**: Timer continues after transport closed
3. **Manual cleanup required**: `clearInterval` must be called explicitly
4. **Not testable with TestClock**: Unit tests cannot control keepalive timing
5. **No structured concurrency**: Orphaned async operation outside fiber tree
6. **Memory/resource leak potential**: Interval may fire after WebSocket closed

### viem Reference

viem's `socket.ts` doesn't use keepalive pings by default but relies on WebSocket protocol's native ping/pong when available. For custom keepalive implementations, Effect's scheduling primitives should be used.

</problem>

<solution>
## Effect Pattern: Effect.repeat with Schedule.spaced

Replace `setInterval` with Effect's scheduling primitives that integrate with the runtime and support automatic cleanup.

### Key Concepts

1. **Effect.repeat**: Executes an effect repeatedly according to a schedule
2. **Schedule.spaced**: Creates a schedule with fixed intervals between executions
3. **Effect.forkScoped**: Forks a fiber tied to the current scope's lifetime
4. **Automatic cleanup**: Scoped fibers are interrupted when scope closes

### Pattern: Scoped Keepalive Fiber

```typescript
import * as Effect from "effect/Effect";
import * as Duration from "effect/Duration";
import * as Schedule from "effect/Schedule";
import * as Ref from "effect/Ref";

const WebSocketTransport = (options: WebSocketTransportConfig | string) =>
  Layer.scoped(
    TransportService,
    Effect.gen(function* () {
      const wsRef = yield* Ref.make<WebSocket | null>(null);
      const keepaliveMs = config.keepalive ?? 30000;
      
      // Define the keepalive ping effect
      const sendPing = Effect.gen(function* () {
        const ws = yield* Ref.get(wsRef);
        if (ws && ws.readyState === WebSocket.OPEN) {
          // Send ping or a custom keepalive message
          if (typeof ws.ping === "function") {
            ws.ping();
          } else {
            // Fallback: send a JSON-RPC style keepalive
            ws.send(JSON.stringify({ jsonrpc: "2.0", method: "keepalive" }));
          }
        }
      });
      
      // Keepalive runs on a fixed schedule, interruptible
      const keepalive = sendPing.pipe(
        Effect.repeat(Schedule.spaced(Duration.millis(keepaliveMs))),
        Effect.interruptible,
        Effect.catchAll(() => Effect.void)  // Ignore errors, just stop
      );
      
      // startKeepAlive forks the fiber, stopKeepAlive interrupts it
      const keepaliveFiberRef = yield* Ref.make<Fiber.RuntimeFiber<void, never> | null>(null);
      
      const startKeepAlive = Effect.gen(function* () {
        // Cancel any existing keepalive
        const existing = yield* Ref.get(keepaliveFiberRef);
        if (existing) {
          yield* Fiber.interrupt(existing);
        }
        // Fork new keepalive fiber
        const fiber = yield* Effect.fork(keepalive);
        yield* Ref.set(keepaliveFiberRef, fiber);
      });
      
      const stopKeepAlive = Effect.gen(function* () {
        const fiber = yield* Ref.get(keepaliveFiberRef);
        if (fiber) {
          yield* Fiber.interrupt(fiber);
          yield* Ref.set(keepaliveFiberRef, null);
        }
      });
      
      // Cleanup on scope close
      yield* Effect.addFinalizer(() => stopKeepAlive);
      
      // ... rest of transport implementation
    })
  );
```

### Alternative: Effect.forkScoped for Simpler Lifecycle

For keepalive that should run for the entire transport lifetime:

```typescript
// Keepalive runs until scope closes - no manual stop needed
yield* sendPing.pipe(
  Effect.repeat(Schedule.spaced(Duration.millis(keepaliveMs))),
  Effect.interruptible,
  Effect.catchAll(() => Effect.void),
  Effect.forkScoped  // Automatically interrupted when scope closes
);

// No startKeepAlive/stopKeepAlive needed - fiber lifetime tied to scope
```

</solution>

<implementation>
<steps>
1. **Add Schedule and Fiber imports**:
   ```typescript
   import * as Schedule from "effect/Schedule";
   import * as Duration from "effect/Duration";
   import * as Fiber from "effect/Fiber";
   ```

2. **Define sendPing effect**:
   ```typescript
   const sendPing = Effect.gen(function* () {
     const ws = yield* Ref.get(wsRef);
     if (ws && ws.readyState === WebSocket.OPEN) {
       ws.ping?.() ?? ws.send('{"jsonrpc":"2.0","method":"keepalive"}');
     }
   });
   ```

3. **Create keepalive schedule**:
   ```typescript
   const keepaliveSchedule = Schedule.spaced(Duration.millis(keepaliveMs));
   ```

4. **Replace setInterval with Effect.repeat**:
   ```typescript
   const keepalive = sendPing.pipe(
     Effect.repeat(keepaliveSchedule),
     Effect.interruptible,
     Effect.catchAll(() => Effect.void)
   );
   ```

5. **Use forkScoped for automatic cleanup**:
   ```typescript
   yield* Effect.forkScoped(keepalive);
   ```

6. **Remove manual clearInterval calls**:
   - Delete `clearInterval(keepaliveInterval)` references
   - Simplify `stopKeepAlive` or remove if using `forkScoped`
</steps>

<patterns>
### Effect.repeat + Schedule.spaced Pattern
```typescript
// Replaces: setInterval(() => fn(), ms)
yield* myEffect.pipe(
  Effect.repeat(Schedule.spaced(Duration.millis(ms))),
  Effect.forkScoped
);
```

### Controllable Interval with Fiber Ref
```typescript
const intervalFiberRef = yield* Ref.make<Fiber.RuntimeFiber<void, never> | null>(null);

const startInterval = Effect.gen(function* () {
  const existing = yield* Ref.get(intervalFiberRef);
  if (existing) yield* Fiber.interrupt(existing);
  
  const fiber = yield* myEffect.pipe(
    Effect.repeat(Schedule.spaced(Duration.millis(ms))),
    Effect.fork
  );
  yield* Ref.set(intervalFiberRef, fiber);
});

const stopInterval = Effect.gen(function* () {
  const fiber = yield* Ref.get(intervalFiberRef);
  if (fiber) {
    yield* Fiber.interrupt(fiber);
    yield* Ref.set(intervalFiberRef, null);
  }
});
```

### Schedule Combinators for Advanced Patterns
```typescript
// Fixed interval
Schedule.spaced(Duration.seconds(30))

// With initial delay
Schedule.spaced(Duration.seconds(30)).pipe(
  Schedule.delayed(() => Duration.seconds(5))
)

// Jittered to prevent thundering herd
Schedule.spaced(Duration.seconds(30)).pipe(Schedule.jittered)

// Limited repetitions
Schedule.spaced(Duration.seconds(30)).pipe(Schedule.recurs(100))

// With condition
Schedule.spaced(Duration.seconds(30)).pipe(
  Schedule.whileOutput(() => isConnectionAlive)
)
```
</patterns>

<cleanup>
### Resource Cleanup

```typescript
yield* Effect.addFinalizer(() =>
  Effect.gen(function* () {
    // Keepalive fiber automatically interrupted via forkScoped
    
    // Or if using manual fiber ref:
    const fiber = yield* Ref.get(keepaliveFiberRef);
    if (fiber) {
      yield* Fiber.interrupt(fiber);
    }
    
    // Close WebSocket
    const ws = yield* Ref.get(wsRef);
    if (ws) ws.close();
  })
);
```

### No Manual Timer Tracking

With `Effect.forkScoped`, there's no need to:
- Store interval IDs
- Call `clearInterval`
- Track whether interval is active
- Handle edge cases of interval firing after close

The Effect runtime handles all cleanup automatically.
</cleanup>
</implementation>

<tests>
```typescript
import { TestClock, TestContext, Effect, Duration, Fiber } from "effect";

describe("WebSocketTransport Keepalive", () => {
  it("should send keepalive pings at configured interval", async () => {
    const pings: number[] = [];
    const mockWs = createMockWebSocket({
      onPing: () => pings.push(Date.now())
    });
    
    await Effect.gen(function* () {
      // Wait for initial connection
      yield* TestClock.adjust("100 millis");
      
      // Advance time by 3 keepalive intervals (30s each)
      yield* TestClock.adjust("30 seconds");
      expect(pings.length).toBeGreaterThanOrEqual(1);
      
      yield* TestClock.adjust("30 seconds");
      expect(pings.length).toBeGreaterThanOrEqual(2);
      
      yield* TestClock.adjust("30 seconds");
      expect(pings.length).toBeGreaterThanOrEqual(3);
    }).pipe(
      Effect.provide(WebSocketTransport({
        url: "ws://localhost:8545",
        keepalive: 30000
      })),
      Effect.provide(TestContext.TestContext),
      Effect.scoped,
      Effect.runPromise
    );
  });

  it("should stop keepalive on scope close", async () => {
    let pingsAfterClose = 0;
    const mockWs = createMockWebSocket();
    
    const fiber = await Effect.gen(function* () {
      yield* TestClock.adjust("35 seconds"); // One keepalive
    }).pipe(
      Effect.provide(WebSocketTransport({
        url: "ws://localhost:8545",
        keepalive: 30000
      })),
      Effect.provide(TestContext.TestContext),
      Effect.scoped,
      Effect.fork,
      Effect.flatMap((f) => Effect.sleep("50 millis").pipe(Effect.as(f))),
      Effect.runPromise
    );
    
    // Interrupt the fiber
    await Effect.runPromise(Fiber.interrupt(fiber));
    
    // Advance time more - no pings should happen
    const pingCountBefore = mockWs.pingCount;
    await Effect.runPromise(
      TestClock.adjust("60 seconds").pipe(
        Effect.provide(TestContext.TestContext)
      )
    );
    
    expect(mockWs.pingCount).toBe(pingCountBefore);
  });

  it("should respect custom keepalive interval", async () => {
    const pings: number[] = [];
    let lastPingTime = 0;
    
    await Effect.gen(function* () {
      const startTime = yield* Clock.currentTimeMillis;
      
      // Use 10 second keepalive
      yield* TestClock.adjust("10 seconds");
      const firstPing = yield* Clock.currentTimeMillis;
      
      yield* TestClock.adjust("10 seconds");
      const secondPing = yield* Clock.currentTimeMillis;
      
      // Interval should be ~10 seconds
      expect(secondPing - firstPing).toBeCloseTo(10000, -2);
    }).pipe(
      Effect.provide(WebSocketTransport({
        url: "ws://localhost:8545",
        keepalive: 10000  // 10 seconds
      })),
      Effect.provide(TestContext.TestContext),
      Effect.scoped,
      Effect.runPromise
    );
  });

  it("should not send keepalive when WebSocket is not open", async () => {
    let pingsSent = 0;
    const mockWs = createMockWebSocket({
      onPing: () => { pingsSent++; },
      readyState: WebSocket.CONNECTING  // Not open
    });
    
    await Effect.gen(function* () {
      yield* TestClock.adjust("60 seconds"); // Two intervals
    }).pipe(
      Effect.provide(WebSocketTransport({
        url: "ws://localhost:8545",
        keepalive: 30000
      })),
      Effect.provide(TestContext.TestContext),
      Effect.scoped,
      Effect.runPromise
    );
    
    expect(pingsSent).toBe(0);
  });

  it("should restart keepalive on reconnection", async () => {
    const pings: Array<{ time: number; connection: number }> = [];
    let connectionCount = 0;
    
    await Effect.gen(function* () {
      connectionCount = 1;
      yield* TestClock.adjust("30 seconds"); // Ping on first connection
      
      // Simulate disconnect and reconnect
      mockWs.triggerClose();
      yield* TestClock.adjust("1 second"); // Reconnect delay
      connectionCount = 2;
      
      yield* TestClock.adjust("30 seconds"); // Ping on second connection
    }).pipe(
      Effect.provide(WebSocketTransport({
        url: "ws://localhost:8545",
        keepalive: 30000,
        reconnect: { delay: 1000 }
      })),
      Effect.provide(TestContext.TestContext),
      Effect.scoped,
      Effect.runPromise
    );
    
    expect(pings.filter((p) => p.connection === 1).length).toBeGreaterThan(0);
    expect(pings.filter((p) => p.connection === 2).length).toBeGreaterThan(0);
  });
});
```
</tests>

<docs>
```typescript
/**
 * WebSocket keepalive configuration.
 * 
 * Uses Effect's scheduling primitives for proper lifecycle management:
 * - `Effect.repeat` with `Schedule.spaced` for regular pings
 * - `Effect.forkScoped` ties keepalive fiber to transport scope
 * - Automatic interruption on scope close
 * 
 * ## Keepalive Flow
 * 
 * ```
 * onopen → startKeepAlive → Effect.forkScoped(
 *   sendPing.pipe(
 *     Effect.repeat(Schedule.spaced(keepaliveMs))
 *   )
 * )
 * 
 * onclose/scope close → fiber automatically interrupted
 * ```
 * 
 * ## Benefits over setInterval
 * 
 * | Feature           | setInterval | Effect.repeat |
 * |-------------------|-------------|---------------|
 * | Automatic cleanup | ❌ Manual   | ✅ Auto       |
 * | Testable timing   | ❌ Real     | ✅ TestClock  |
 * | Fiber context     | ❌ Lost     | ✅ Preserved  |
 * | Interruptible     | ❌ Manual   | ✅ Auto       |
 * | Error handling    | ❌ Throws   | ✅ Effect     |
 * 
 * @example
 * ```typescript
 * const transport = WebSocketTransport({
 *   url: 'wss://eth.example.com',
 *   keepalive: 30000  // 30 seconds between pings
 * });
 * 
 * // Keepalive starts on connection, stops on scope close
 * const program = Effect.scoped(
 *   Effect.gen(function* () {
 *     const t = yield* TransportService;
 *     // ... use transport ...
 *   }).pipe(Effect.provide(transport))
 * );
 * ```
 */
```
</docs>

<api>
<before>
```typescript
// setInterval escapes Effect runtime
const keepaliveInterval = setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.ping?.();
  }
}, keepaliveMs);

const stopKeepAlive = Effect.sync(() => {
  clearInterval(keepaliveInterval);
});
```
</before>

<after>
```typescript
// Effect.repeat integrates with runtime
const keepalive = Effect.gen(function* () {
  const ws = yield* Ref.get(wsRef);
  if (ws?.readyState === WebSocket.OPEN) {
    ws.ping?.();
  }
}).pipe(
  Effect.repeat(Schedule.spaced(Duration.millis(keepaliveMs))),
  Effect.interruptible,
  Effect.catchAll(() => Effect.void)
);

// Fork scoped - automatically interrupted on scope close
yield* Effect.forkScoped(keepalive);

// No manual stopKeepAlive needed - fiber lifetime tied to scope
```
</after>
</api>

<references>
- [Effect Schedule Documentation](https://effect.website/docs/scheduling/schedule-combinators)
- [Effect Repeat](https://effect.website/docs/scheduling/repetition)
- [Effect ForkScoped](https://effect.website/docs/concurrency/basic-concurrency#forkscoped)
- [Effect TestClock](https://effect.website/docs/testing/test-clock)
- [MDN setInterval](https://developer.mozilla.org/en-US/docs/Web/API/setInterval) - what we're replacing
- Review 040: WebSocket Effect.runSync fix
- Review 041: WebSocket setTimeout fix
- Review 076: Transport services comprehensive review
</references>
</issue>
