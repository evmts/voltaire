# Fix WebSocketTransport Effect.runSync in Event Callbacks

<issue>
<metadata>
<id>073</id>
<priority>P1</priority>
<category>Effect Anti-Pattern</category>
<module>services/Transport/WebSocketTransport.ts</module>
<files>
  - services/Transport/WebSocketTransport.ts
</files>
<related_reviews>[040, 041, 042]</related_reviews>
</metadata>

<problem>
WebSocketTransport uses `Effect.runSync` inside WebSocket event callbacks, breaking Effect's fiber semantics:

```typescript
// ❌ Current anti-pattern
ws.onmessage = (event) => {
  try {
    const message = JSON.parse(event.data) as JsonRpcResponse<unknown>;
    if (message.id === "keepalive") return;

    Effect.runSync(  // ❌ Breaks fiber semantics
      Effect.gen(function* () {
        yield* Ref.update(pendingRef, (pending) => { ... });
        if (foundDeferred) {
          yield* Deferred.succeed(foundDeferred, message);
        }
      }),
    );
  } catch { }
};

ws.onclose = () => {
  Effect.runSync(  // ❌ Breaks fiber semantics
    Effect.gen(function* () {
      yield* stopKeepAlive;
      setTimeout(() => {  // ❌ Non-Effect timer
        Effect.runPromise(connect.pipe(...));  // ❌ Nested runPromise
      }, delay);
    }),
  );
};
```

**Issues:**
1. **Effect.runSync can throw** - If any operation is async, it throws
2. **Loses fiber context** - No access to parent fiber, no interruption
3. **setTimeout for reconnection** - Not Effect-controlled, not testable
4. **Nested Effect.runPromise** - Double-escape from Effect runtime
5. **No structured concurrency** - Reconnection logic orphaned from main fiber
</problem>

<effect_pattern>
<name>Runtime.runFork Pattern</name>
<rationale>
When bridging from callback-based APIs to Effect, use `Runtime.runFork` instead of `runSync`:
- Doesn't throw on async operations
- Returns a Fiber that can be tracked/interrupted
- Preserves runtime context (services, config)
- Enables proper cleanup via finalizers
</rationale>
<before>
```typescript
// ❌ Effect.runSync in callbacks (throws on async)
someApi.onEvent = (data) => {
  Effect.runSync(handleEvent(data)); // THROWS if handleEvent is async!
};

// ❌ setTimeout for reconnection
setTimeout(() => {
  Effect.runPromise(reconnect());
}, 1000);
```
</before>
<after>
```typescript
// ✅ Runtime.runFork for callbacks (fiber-safe)
const program = Effect.gen(function* () {
  const runtime = yield* Effect.runtime<MyServices>();
  const runFork = Runtime.runFork(runtime);

  someApi.onEvent = (data) => {
    runFork(handleEvent(data)); // Returns Fiber, never throws
  };

  yield* Effect.addFinalizer(() => /* cleanup */);
});
```
</after>
<effect_docs>https://effect.website/docs/runtime</effect_docs>
</effect_pattern>

<effect_pattern>
<name>Effect.sleep for Delays</name>
<rationale>
Replace `setTimeout` with `Effect.sleep` for:
- Testability with TestClock
- Proper fiber interruption
- No orphaned timers
- Composable with Schedule
</rationale>
<before>
```typescript
// ❌ setTimeout (not testable, not interruptible)
setTimeout(() => reconnect(), 1000);
```
</before>
<after>
```typescript
// ✅ Effect.sleep (testable with TestClock)
yield* Effect.sleep(Duration.seconds(1));
yield* reconnect;

// In tests:
yield* TestClock.adjust(Duration.seconds(1));
```
</after>
<effect_docs>https://effect.website/docs/scheduling/duration</effect_docs>
</effect_pattern>

<effect_pattern>
<name>Fiber Tracking for Cleanup</name>
<rationale>
Store spawned fibers in Refs to track and interrupt on cleanup:
- All background fibers are accounted for
- Cleanup interrupts all fibers
- No orphaned operations
</rationale>
<before>
```typescript
// ❌ Orphaned background work
setInterval(() => ping(), 30000);
// How do we stop this?
```
</before>
<after>
```typescript
// ✅ Tracked fiber with cleanup
const keepAliveFiberRef = yield* Ref.make<Fiber.Fiber<void> | null>(null);

const fiber = yield* Effect.forever(
  Effect.gen(function* () {
    yield* Effect.sleep(Duration.seconds(30));
    yield* ping;
  })
).pipe(Effect.fork);

yield* Ref.set(keepAliveFiberRef, fiber);

yield* Effect.addFinalizer(() =>
  Effect.gen(function* () {
    const fiber = yield* Ref.get(keepAliveFiberRef);
    if (fiber) yield* Fiber.interrupt(fiber);
  })
);
```
</after>
<effect_docs>https://effect.website/docs/concurrency/fibers</effect_docs>
</effect_pattern>

<solution>
Use `Runtime.runFork` with acquired runtime and proper fiber coordination:

```typescript
import * as Runtime from "effect/Runtime";
import * as Effect from "effect/Effect";
import * as Fiber from "effect/Fiber";
import * as Ref from "effect/Ref";
import * as Deferred from "effect/Deferred";
import * as Duration from "effect/Duration";
import * as Layer from "effect/Layer";

export interface WebSocketTransportConfig {
  readonly url: string;
  readonly protocols?: string[];
  readonly reconnect?: {
    readonly enabled?: boolean;
    readonly maxAttempts?: number;
    readonly delay?: Duration.DurationInput;
    readonly maxDelay?: Duration.DurationInput;
    readonly multiplier?: number;
  };
  readonly keepAlive?: {
    readonly enabled?: boolean;
    readonly interval?: Duration.DurationInput;
  };
}

export const WebSocketTransport = (
  options: WebSocketTransportConfig | string,
): Layer.Layer<TransportService, TransportError> => {
  const config = typeof options === "string" 
    ? { url: options } 
    : options;

  const reconnectOpts = {
    enabled: config.reconnect?.enabled ?? true,
    maxAttempts: config.reconnect?.maxAttempts ?? 5,
    delay: Duration.decode(config.reconnect?.delay ?? Duration.seconds(1)),
    maxDelay: Duration.decode(config.reconnect?.maxDelay ?? Duration.seconds(30)),
    multiplier: config.reconnect?.multiplier ?? 2,
  };

  return Layer.scoped(
    TransportService,
    Effect.gen(function* () {
      // Acquire runtime for callback bridging
      const runtime = yield* Effect.runtime<never>();
      const runFork = Runtime.runFork(runtime);

      // Refs for state management
      const wsRef = yield* Ref.make<WebSocket | null>(null);
      const pendingRef = yield* Ref.make<Map<number, Deferred.Deferred<JsonRpcResponse, TransportError>>>(new Map());
      const nextIdRef = yield* Ref.make(1);
      const isClosedRef = yield* Ref.make(false);
      const reconnectFiberRef = yield* Ref.make<Fiber.Fiber<void, never> | null>(null);
      const keepAliveFiberRef = yield* Ref.make<Fiber.Fiber<void, never> | null>(null);
      const attemptCountRef = yield* Ref.make(0);
      const currentDelayRef = yield* Ref.make(reconnectOpts.delay);

      // Handle incoming messages - pure Effect
      const handleMessage = (data: string) =>
        Effect.gen(function* () {
          const message = JSON.parse(data) as JsonRpcResponse<unknown>;
          if (message.id === "keepalive") return;

          const pending = yield* Ref.get(pendingRef);
          const deferred = pending.get(message.id as number);

          if (deferred) {
            yield* Ref.update(pendingRef, (p) => {
              const next = new Map(p);
              next.delete(message.id as number);
              return next;
            });

            if (message.error) {
              yield* Deferred.fail(deferred, new TransportError({
                code: message.error.code,
                message: message.error.message,
                data: message.error.data,
              }));
            } else {
              yield* Deferred.succeed(deferred, message);
            }
          }
        }).pipe(Effect.catchAll(() => Effect.void));

      // Fail all pending requests
      const failAllPending = (error: TransportError) =>
        Effect.gen(function* () {
          const pending = yield* Ref.getAndSet(pendingRef, new Map());
          yield* Effect.forEach(
            pending.values(),
            (deferred) => Deferred.fail(deferred, error),
            { discard: true }
          );
        });

      // Stop keep-alive fiber
      const stopKeepAlive = Effect.gen(function* () {
        const fiber = yield* Ref.get(keepAliveFiberRef);
        if (fiber) {
          yield* Fiber.interrupt(fiber);
          yield* Ref.set(keepAliveFiberRef, null);
        }
      });

      // Schedule reconnection using Effect.sleep
      const scheduleReconnect = Effect.gen(function* () {
        const attempts = yield* Ref.get(attemptCountRef);
        if (attempts >= reconnectOpts.maxAttempts) {
          yield* failAllPending(new TransportError({
            code: -32603,
            message: `Reconnection failed after ${reconnectOpts.maxAttempts} attempts`,
          }));
          return;
        }

        const delay = yield* Ref.get(currentDelayRef);
        yield* Ref.update(attemptCountRef, (n) => n + 1);
        yield* Ref.update(currentDelayRef, (d) =>
          Duration.min(
            Duration.times(d, reconnectOpts.multiplier),
            reconnectOpts.maxDelay
          )
        );

        yield* Effect.sleep(delay);
        yield* connect;
      }).pipe(Effect.catchAll(() => Effect.void));

      // Handle close event
      const handleClose = Effect.gen(function* () {
        const isClosed = yield* Ref.get(isClosedRef);
        yield* stopKeepAlive;
        yield* Ref.set(wsRef, null);

        if (isClosed) {
          yield* failAllPending(new TransportError({
            code: -32603,
            message: "WebSocket closed",
          }));
          return;
        }

        if (reconnectOpts.enabled) {
          // Fork reconnection as tracked fiber
          const fiber = runFork(scheduleReconnect);
          yield* Ref.set(reconnectFiberRef, fiber);
        }
      });

      // Start keep-alive ping
      const startKeepAlive = (ws: WebSocket) =>
        Effect.gen(function* () {
          if (!config.keepAlive?.enabled) return;
          
          const interval = Duration.decode(
            config.keepAlive?.interval ?? Duration.seconds(30)
          );

          const fiber = yield* Effect.forever(
            Effect.gen(function* () {
              yield* Effect.sleep(interval);
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ jsonrpc: "2.0", method: "ping", id: "keepalive" }));
              }
            })
          ).pipe(Effect.fork);

          yield* Ref.set(keepAliveFiberRef, fiber);
        });

      // Connection logic
      const connect: Effect.Effect<void, TransportError> = Effect.gen(function* () {
        const connectDeferred = yield* Deferred.make<void, TransportError>();
        const ws = new WebSocket(config.url, config.protocols);

        // ✅ Use runFork for callbacks
        ws.onopen = () => {
          runFork(
            Effect.gen(function* () {
              yield* Ref.set(attemptCountRef, 0);
              yield* Ref.set(currentDelayRef, reconnectOpts.delay);
              yield* startKeepAlive(ws);
              yield* Deferred.succeed(connectDeferred, undefined);
            })
          );
        };

        ws.onmessage = (event) => {
          runFork(handleMessage(event.data));
        };

        ws.onclose = () => {
          runFork(handleClose);
        };

        ws.onerror = () => {
          runFork(
            Deferred.fail(connectDeferred, new TransportError({
              code: -32603,
              message: "WebSocket connection failed",
            }))
          );
        };

        yield* Ref.set(wsRef, ws);
        yield* Deferred.await(connectDeferred);
      });

      // Initial connection
      yield* connect;

      // Cleanup finalizer
      yield* Effect.addFinalizer(() =>
        Effect.gen(function* () {
          yield* Ref.set(isClosedRef, true);

          // Interrupt reconnect fiber
          const reconnectFiber = yield* Ref.get(reconnectFiberRef);
          if (reconnectFiber) {
            yield* Fiber.interrupt(reconnectFiber);
          }

          // Stop keep-alive
          yield* stopKeepAlive;

          // Fail pending requests
          yield* failAllPending(new TransportError({
            code: -32603,
            message: "Transport closed",
          }));

          // Close WebSocket
          const ws = yield* Ref.get(wsRef);
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.close();
          }
        })
      );

      // Return transport service
      return {
        request: <T>(method: string, params: unknown[] = []) =>
          Effect.gen(function* () {
            const ws = yield* Ref.get(wsRef);
            if (!ws || ws.readyState !== WebSocket.OPEN) {
              return yield* Effect.fail(new TransportError({
                code: -32603,
                message: "WebSocket not connected",
              }));
            }

            const id = yield* Ref.updateAndGet(nextIdRef, (n) => n + 1);
            const deferred = yield* Deferred.make<JsonRpcResponse, TransportError>();

            yield* Ref.update(pendingRef, (p) => new Map(p).set(id, deferred));

            ws.send(JSON.stringify({
              jsonrpc: "2.0",
              id,
              method,
              params,
            }));

            const response = yield* Deferred.await(deferred);
            return response.result as T;
          }),
      };
    }),
  );
};
```
</solution>

<implementation>
<steps>
1. Add `Effect.runtime()` call at layer construction
2. Replace all `Effect.runSync` with `runFork` from acquired runtime
3. Replace `setTimeout/setInterval` with `Effect.sleep` and `Effect.fork`
4. Store spawned fibers in Refs for cleanup
5. Add `Effect.addFinalizer` to interrupt all fibers on scope close
6. Replace nested `Effect.runPromise` with forked effects
</steps>
<imports>
```typescript
import * as Runtime from "effect/Runtime";
import * as Effect from "effect/Effect";
import * as Fiber from "effect/Fiber";
import * as Ref from "effect/Ref";
import * as Deferred from "effect/Deferred";
import * as Duration from "effect/Duration";
import * as Layer from "effect/Layer";
```
</imports>
</implementation>

<tests>
```typescript
import { Effect, Fiber, TestClock, TestContext, Duration } from "effect";
import { describe, it, expect, vi } from "vitest";

describe("WebSocketTransport", () => {
  it("handles messages via runFork", async () => {
    const mockWs = createMockWebSocket();

    const result = await Effect.runPromise(
      Effect.scoped(
        Effect.gen(function* () {
          const transport = yield* TransportService;
          
          mockWs.triggerMessage(JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            result: "test-result",
          }));

          return yield* transport.request("test");
        }).pipe(
          Effect.provide(WebSocketTransport({ url: "ws://test" }))
        )
      )
    );

    expect(result).toBe("test-result");
  });

  it("cleans up fibers on scope close", async () => {
    const mockWs = createMockWebSocket();
    let keepAliveStopped = false;

    await Effect.runPromise(
      Effect.scoped(
        Effect.gen(function* () {
          yield* TransportService;
        }).pipe(
          Effect.provide(WebSocketTransport({ 
            url: "ws://test",
            keepAlive: { enabled: true },
          }))
        )
      )
    );

    expect(mockWs.closed).toBe(true);
  });

  it("reconnects using Effect.sleep (testable)", async () => {
    await Effect.runPromise(
      Effect.gen(function* () {
        const mockWs = createMockWebSocket();
        
        yield* Effect.scoped(
          Effect.gen(function* () {
            yield* TransportService;
            mockWs.triggerClose();
            
            // Advance test clock to trigger reconnect
            yield* TestClock.adjust(Duration.seconds(1));
            
            expect(mockWs.connectCalls).toBe(2);
          }).pipe(
            Effect.provide(WebSocketTransport({
              url: "ws://test",
              reconnect: { delay: Duration.seconds(1) },
            }))
          )
        );
      }).pipe(
        Effect.provide(TestContext.TestContext)
      )
    );
  });

  it("respects maxAttempts for reconnection", async () => {
    const mockWs = createMockWebSocket({ alwaysFail: true });

    await Effect.runPromise(
      Effect.gen(function* () {
        yield* Effect.scoped(
          Effect.gen(function* () {
            yield* TransportService;
            
            // Trigger multiple reconnects
            for (let i = 0; i < 6; i++) {
              mockWs.triggerClose();
              yield* TestClock.adjust(Duration.seconds(1));
            }
            
            expect(mockWs.connectCalls).toBe(6); // Initial + 5 retries
          }).pipe(
            Effect.provide(WebSocketTransport({
              url: "ws://test",
              reconnect: { maxAttempts: 5, delay: Duration.seconds(1) },
            }))
          )
        );
      }).pipe(
        Effect.provide(TestContext.TestContext)
      )
    );
  });
});
```
</tests>

<api>
<before>
```typescript
// ❌ Callbacks with Effect.runSync (throws on async)
ws.onmessage = (event) => {
  Effect.runSync(handleMessage(event));
};

// ❌ setTimeout for reconnection (not testable)
setTimeout(() => reconnect(), 1000);
```
</before>
<after>
```typescript
// ✅ Callbacks with runFork (fiber-safe)
ws.onmessage = (event) => {
  runFork(handleMessage(event.data));
};

// ✅ Effect.sleep for reconnection (testable with TestClock)
yield* Effect.sleep(Duration.seconds(1));
yield* connect;
```
</after>
</api>

<acceptance_criteria>
- [ ] Replace Effect.runSync with Runtime.runFork
- [ ] Replace setTimeout/setInterval with Effect.sleep/Effect.forever
- [ ] Store all spawned fibers in Refs
- [ ] Add finalizer to interrupt all fibers
- [ ] Reconnection testable with TestClock
- [ ] Keep-alive interruptible on close
- [ ] All pending requests failed on close
- [ ] All tests pass
</acceptance_criteria>

<references>
- [Effect Runtime](https://effect.website/docs/runtime)
- [Structured Concurrency](https://effect.website/docs/concurrency/fibers)
- [Effect.addFinalizer](https://effect.website/docs/resource-management/scope#addfinalizer)
- [TestClock](https://effect.website/docs/testing#testclock)
</references>
</issue>
