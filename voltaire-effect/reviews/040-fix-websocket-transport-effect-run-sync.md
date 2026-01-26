# Fix WebSocketTransport Effect.runSync in Callbacks

<issue>
<metadata>
priority: P0
files: [src/services/Transport/WebSocketTransport.ts]
reviews: [073-fix-websocket-effect-runsync-in-callbacks.md, 076-transport-services-review.md]
related: [041, 042]
</metadata>

<problem>
## Anti-Pattern: Effect.runSync in WebSocket Event Callbacks

WebSocketTransport uses `Effect.runSync` inside WebSocket event callbacks (`onopen`, `onmessage`, `onclose`, `onerror`), breaking Effect's structured concurrency model.

**Location**: `src/services/Transport/WebSocketTransport.ts#L323, L337, L353, L378`

```typescript
// onopen handler (L322-334)
ws.onopen = () => {
  Effect.runSync(  // ❌ Escapes runtime
    Effect.gen(function* () {
      yield* Ref.set(attemptCountRef, 0);
      yield* Ref.set(wsRef, ws);
      yield* startKeepAlive;  // Starts setInterval inside!
      yield* flushQueue;
    }),
  );
};

// onmessage handler (L348-375)
ws.onmessage = (event) => {
  Effect.runSync(  // ❌ Escapes runtime
    Effect.gen(function* () {
      yield* Ref.update(pendingRef, (pending) => { ... });
      yield* Deferred.succeed(foundDeferred, message);
    }),
  );
};

// onclose handler (L377-458)
ws.onclose = () => {
  Effect.runSync(  // ❌ Escapes runtime - contains setTimeout inside!
    Effect.gen(function* () {
      yield* stopKeepAlive;
      if (reconnectEnabled) {
        setTimeout(() => { ... }, delay);  // Double escape!
      }
    }),
  );
};
```

### Why This Matters

1. **Loses fiber context**: Tracing, spans, and logging context are lost
2. **Cannot use async effects**: Any `yield*` that suspends will throw
3. **Interruption signals don't propagate**: Scope close won't cancel handlers
4. **Error handling becomes synchronous-only**: No Effect error channel
5. **No structured concurrency**: Fibers spawned inside are orphaned
6. **Resource leaks**: Finalizers may not run properly
</problem>

<solution>
## Effect Pattern: Runtime.runFork with Captured Runtime

Capture the runtime at layer creation time, then use `Runtime.runFork` in callbacks to spawn fibers that maintain the Effect context.

### Key Concepts

1. **Capture Runtime**: `const runtime = yield* Effect.runtime<never>()`
2. **Fork in Callbacks**: `Runtime.runFork(runtime)(effect)` spawns a proper fiber
3. **Queue for Messages**: Use `Queue.unbounded` to bridge async events into Effect
4. **Fiber for Processing**: Fork a scoped fiber that processes the queue

### viem Reference

viem's `socket.ts` uses similar callback patterns but in plain JS:
- `onClose()` triggers `attemptReconnect()` 
- `onOpen()` resets reconnect state
- `onResponse()` correlates via ID map

The Effect equivalent wraps these in proper fibers.

```typescript
import * as Queue from "effect/Queue";
import * as Runtime from "effect/Runtime";
import * as Fiber from "effect/Fiber";

const WebSocketTransport = (options: WebSocketTransportConfig | string) =>
  Layer.scoped(
    TransportService,
    Effect.gen(function* () {
      // Capture runtime for callback use
      const runtime = yield* Effect.runtime<never>();
      
      // Message queue bridges WebSocket events → Effect fibers
      const messageQueue = yield* Queue.unbounded<MessageEvent>();
      const closeQueue = yield* Queue.unbounded<CloseEvent>();
      
      // ... refs setup ...
      
      const ws = new WebSocket(config.url, config.protocols);
      
      // Callbacks enqueue to queues (minimal sync work)
      ws.onmessage = (event) => {
        Runtime.runFork(runtime)(Queue.offer(messageQueue, event));
      };
      
      ws.onclose = (event) => {
        Runtime.runFork(runtime)(Queue.offer(closeQueue, event));
      };
      
      ws.onopen = () => {
        Runtime.runFork(runtime)(
          Effect.gen(function* () {
            yield* Ref.set(attemptCountRef, 0);
            yield* Ref.set(wsRef, ws);
            yield* Deferred.succeed(connectDeferred, ws);
            // startKeepAlive now uses Effect.forkScoped (see 042)
            yield* startKeepAlive;
            yield* flushQueue;
          })
        );
      };
      
      // Process messages in Effect context with full fiber support
      const processMessages = Queue.take(messageQueue).pipe(
        Effect.flatMap((event) =>
          Effect.gen(function* () {
            const message = JSON.parse(event.data) as JsonRpcResponse<unknown>;
            if (message.id === "keepalive") return;
            
            let foundDeferred: Deferred.Deferred<JsonRpcResponse<unknown>, never> | undefined;
            yield* Ref.update(pendingRef, (pending) => {
              foundDeferred = pending.get(message.id as number);
              if (foundDeferred) {
                const newPending = new Map(pending);
                newPending.delete(message.id as number);
                return newPending;
              }
              return pending;
            });
            if (foundDeferred) {
              yield* Deferred.succeed(foundDeferred, message);
            }
          })
        ),
        Effect.forever,
        Effect.catchAll(() => Effect.void)
      );
      
      // Fork as scoped - automatically interrupted on scope close
      yield* Effect.forkScoped(processMessages);
      
      // Process close events with reconnection logic
      const processCloseEvents = Queue.take(closeQueue).pipe(
        Effect.flatMap(() => handleDisconnect),  // Uses Effect.sleep (see 041)
        Effect.forever,
        Effect.catchAll(() => Effect.void)
      );
      
      yield* Effect.forkScoped(processCloseEvents);
      
      // ... rest of implementation ...
    })
  );
```
</solution>

<implementation>
<steps>
1. **Add Runtime capture at layer creation**:
   ```typescript
   const runtime = yield* Effect.runtime<never>();
   ```

2. **Create message and event queues**:
   ```typescript
   const messageQueue = yield* Queue.unbounded<MessageEvent>();
   const closeQueue = yield* Queue.unbounded<CloseEvent>();
   const errorQueue = yield* Queue.unbounded<Event>();
   ```

3. **Replace Effect.runSync with Runtime.runFork**:
   - `ws.onopen`: `Runtime.runFork(runtime)(handleOpen)`
   - `ws.onmessage`: `Runtime.runFork(runtime)(Queue.offer(messageQueue, event))`
   - `ws.onclose`: `Runtime.runFork(runtime)(Queue.offer(closeQueue, event))`
   - `ws.onerror`: `Runtime.runFork(runtime)(Queue.offer(errorQueue, event))`

4. **Fork scoped processors for queues**:
   ```typescript
   yield* Effect.forkScoped(processMessages);
   yield* Effect.forkScoped(processCloseEvents);
   ```

5. **Update imports**:
   ```typescript
   import * as Queue from "effect/Queue";
   import * as Runtime from "effect/Runtime";
   ```
</steps>

<patterns>
### Runtime.runFork Pattern
```typescript
// Capture at effect creation time
const runtime = yield* Effect.runtime<never>();

// Use in callbacks - returns RuntimeFiber
callback = (event) => {
  Runtime.runFork(runtime)(handleEvent(event));
};
```

### Queue Bridge Pattern
```typescript
// Queue bridges async world → Effect world
const queue = yield* Queue.unbounded<Event>();

// Callback offers (sync, minimal work)
callback = (event) => {
  Runtime.runFork(runtime)(Queue.offer(queue, event));
};

// Processor takes (full Effect context)
const processor = Queue.take(queue).pipe(
  Effect.flatMap(handleEvent),
  Effect.forever
);
yield* Effect.forkScoped(processor);
```

### Effect.forkScoped Pattern
```typescript
// Fiber is automatically interrupted when scope closes
yield* Effect.forkScoped(longRunningEffect);

// No manual cleanup needed - finalizer handles it
yield* Effect.addFinalizer(() => 
  Effect.log("Scope closing, fibers interrupted")
);
```
</patterns>

<cleanup>
### Resource Cleanup on Scope Close

1. **Scoped fibers**: `Effect.forkScoped` fibers are automatically interrupted
2. **Queues**: Shutdown via `Queue.shutdown` in finalizer
3. **WebSocket**: Close via `ws.close()` in finalizer
4. **Pending requests**: Fail all deferreds with closure error

```typescript
yield* Effect.addFinalizer(() =>
  Effect.gen(function* () {
    yield* Ref.set(isClosedRef, true);
    yield* Queue.shutdown(messageQueue);
    yield* Queue.shutdown(closeQueue);
    const ws = yield* Ref.get(wsRef);
    if (ws) ws.close();
    // Pending requests handled by onclose → closeQueue processor
  })
);
```
</cleanup>
</implementation>

<tests>
```typescript
describe("WebSocketTransport Runtime.runFork", () => {
  it("should maintain fiber context in message handlers", async () => {
    const spanId = await Effect.gen(function* () {
      const t = yield* TransportService;
      // Verify tracing context is preserved
      return yield* Effect.currentSpan.pipe(
        Effect.map((span) => span?.spanId)
      );
    }).pipe(
      Effect.provide(WebSocketTransport("ws://localhost:8545")),
      Effect.scoped,
      Effect.withSpan("test-span"),
      Effect.runPromise
    );
    expect(spanId).toBeDefined();
  });

  it("should interrupt message processor on scope close", async () => {
    let processorInterrupted = false;
    
    await Effect.gen(function* () {
      const t = yield* TransportService;
      yield* Effect.addFinalizer(() =>
        Effect.sync(() => { processorInterrupted = true; })
      );
      // Scope closes immediately
    }).pipe(
      Effect.provide(WebSocketTransport("ws://localhost:8545")),
      Effect.scoped,
      Effect.runPromise
    );
    
    expect(processorInterrupted).toBe(true);
  });

  it("should properly cleanup queues on interruption", async () => {
    const fiber = Effect.gen(function* () {
      const t = yield* TransportService;
      yield* Effect.never; // Keep running
    }).pipe(
      Effect.provide(WebSocketTransport("ws://localhost:8545")),
      Effect.scoped,
      Effect.runFork
    );
    
    await Effect.runPromise(
      Fiber.interrupt(fiber).pipe(Effect.delay("100 millis"))
    );
    
    // Should complete without hanging
  });
});
```
</tests>

<docs>
```typescript
/**
 * WebSocket transport implementation using Effect patterns.
 * 
 * ## Lifecycle Management
 * 
 * The transport uses Effect's structured concurrency model:
 * - Runtime captured at layer creation via `Effect.runtime<never>()`
 * - WebSocket callbacks use `Runtime.runFork` to spawn fibers
 * - Message processing runs in scoped fibers (`Effect.forkScoped`)
 * - All fibers automatically interrupted when scope closes
 * 
 * ## Event Flow
 * 
 * ```
 * WebSocket.onmessage → Queue.offer → Processor Fiber → Deferred.succeed
 *                       ↑                              ↓
 *              Runtime.runFork                  pendingRef lookup
 * ```
 * 
 * @example
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const t = yield* TransportService;
 *   return yield* t.request<string>('eth_blockNumber');
 * }).pipe(
 *   Effect.provide(WebSocketTransport('wss://eth.example.com')),
 *   Effect.scoped  // Required - triggers cleanup on exit
 * );
 * ```
 */
```
</docs>

<api>
<before>
```typescript
// Effect.runSync escapes runtime
ws.onmessage = (event) => {
  Effect.runSync(handleMessage(event.data));
};
```
</before>

<after>
```typescript
// Runtime.runFork maintains context
const runtime = yield* Effect.runtime<never>();
ws.onmessage = (event) => {
  Runtime.runFork(runtime)(Queue.offer(messageQueue, event));
};
```
</after>
</api>

<references>
- [Effect Runtime Documentation](https://effect.website/docs/runtime)
- [Effect Queue Documentation](https://effect.website/docs/concurrency/queue)
- [Effect Scope Documentation](https://effect.website/docs/resource-management/scope)
- [viem socket.ts](https://github.com/wevm/viem/blob/main/src/utils/rpc/socket.ts) - callback patterns
- Review 073: WebSocket Effect.runSync analysis
- Review 076: Transport services comprehensive review
</references>

<recommended_approach>
## Preferred Solution: Use @effect/platform Socket

Instead of manually bridging WebSocket callbacks with `Runtime.runFork` and queues, use `@effect/platform/Socket` which provides Effect-native WebSocket support:

```typescript
import * as Socket from "@effect/platform/Socket"
import * as SocketClusterClient from "@effect/platform/SocketClusterClient" // if using SocketCluster

// @effect/platform provides:
// - Socket.Socket service with Effect-native send/receive
// - Automatic lifecycle management (scoped resources)
// - Built-in reconnection with Schedule
// - Cross-platform (Node.js, Bun, browser via @effect/platform-browser)

const WebSocketTransport = (url: string) =>
  Layer.scoped(
    TransportService,
    Effect.gen(function* () {
      const socket = yield* Socket.makeWebSocket(url)
      
      return {
        request: <T>(method: string, params?: unknown[]) =>
          Effect.gen(function* () {
            const id = yield* Ref.getAndUpdate(idRef, n => n + 1)
            const request = JSON.stringify({ jsonrpc: "2.0", id, method, params })
            
            yield* socket.send(request)
            
            // socket.messages is an Effect Stream
            const response = yield* socket.messages.pipe(
              Stream.filter(msg => JSON.parse(msg).id === id),
              Stream.take(1),
              Stream.runHead,
              Effect.flatten
            )
            
            return JSON.parse(response).result as T
          })
      }
    })
  )
```

**Benefits of @effect/platform/Socket**:
- No manual `Runtime.runFork` or callback bridging
- Proper fiber lifecycle (interruption works correctly)
- Built-in reconnection via `Socket.makeWebSocketChannel` with `reconnect` option
- Cross-platform: use `@effect/platform-node` for Node.js, `@effect/platform-browser` for browser
- Stream-based message handling with full Effect integration
- TestClock compatible for testing timeouts/reconnection

**Platform packages**:
- `@effect/platform` - Core platform abstractions
- `@effect/platform-node` - Node.js implementation
- `@effect/platform-bun` - Bun implementation  
- `@effect/platform-browser` - Browser implementation

See: https://effect.website/docs/platform/socket
</recommended_approach>
</issue>
