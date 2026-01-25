# Fix WebSocketTransport Effect.runSync in Event Callbacks

**Priority**: High  
**Module**: `services/Transport/WebSocketTransport.ts`  
**Category**: Effect Anti-Pattern

## Problem

WebSocketTransport uses `Effect.runSync` inside WebSocket event callbacks (onopen, onmessage, onclose):

```typescript
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
      // ...
      setTimeout(() => {  // ❌ Non-Effect timer
        Effect.runPromise(connect.pipe(...));  // ❌ Nested runPromise
      }, delay);
    }),
  );
};
```

## Issues

1. **Effect.runSync can throw** - If any operation is async, it throws
2. **Loses fiber context** - No access to parent fiber, no interruption
3. **setTimeout for reconnection** - Not Effect-controlled
4. **Nested Effect.runPromise** - Double-escape from Effect runtime
5. **No structured concurrency** - Reconnection logic orphaned from main fiber

## Solution

Use `Runtime.runFork` with acquired runtime and proper fiber coordination:

```typescript
import * as Runtime from "effect/Runtime";
import * as Fiber from "effect/Fiber";
import * as FiberRef from "effect/FiberRef";

export const WebSocketTransport = (
  options: WebSocketTransportConfig | string,
): Layer.Layer<TransportService, TransportError> => {
  // ...config setup...

  return Layer.scoped(
    TransportService,
    Effect.gen(function* () {
      const runtime = yield* Effect.runtime<never>();
      const runFork = Runtime.runFork(runtime);

      const pendingRef = yield* Ref.make<Map<number, Deferred.Deferred<...>>>(new Map());
      const wsRef = yield* Ref.make<WebSocket | null>(null);
      const reconnectFiberRef = yield* Ref.make<Fiber.Fiber<void, never> | null>(null);

      const handleMessage = (message: JsonRpcResponse<unknown>) =>
        Effect.gen(function* () {
          if (message.id === "keepalive") return;
          
          const pending = yield* Ref.get(pendingRef);
          const foundDeferred = pending.get(message.id as number);
          
          if (foundDeferred) {
            yield* Ref.update(pendingRef, (p) => {
              const newPending = new Map(p);
              newPending.delete(message.id as number);
              return newPending;
            });
            yield* Deferred.succeed(foundDeferred, message);
          }
        });

      const scheduleReconnect = (delay: number) =>
        Effect.gen(function* () {
          yield* Effect.sleep(Duration.millis(delay));
          yield* connect;
        }).pipe(
          Effect.catchAll(() => Effect.void),
        );

      const handleClose = (isClosed: boolean) =>
        Effect.gen(function* () {
          yield* stopKeepAlive;
          yield* Ref.set(wsRef, null);

          if (isClosed) {
            yield* failAllPending(new TransportError({ code: -32603, message: "WebSocket closed" }));
            return;
          }

          if (reconnectEnabled) {
            const attempts = yield* Ref.get(attemptCountRef);
            if (attempts < reconnectOpts.maxAttempts) {
              yield* Ref.set(isReconnectingRef, true);
              const delay = yield* Ref.get(currentDelayRef);
              yield* Ref.update(attemptCountRef, (n) => n + 1);
              yield* Ref.update(currentDelayRef, (d) =>
                Math.min(d * reconnectOpts.multiplier, reconnectOpts.maxDelay),
              );

              // Fork reconnection as tracked fiber
              const fiber = runFork(scheduleReconnect(delay));
              yield* Ref.set(reconnectFiberRef, fiber);
            } else {
              yield* failAllPendingAndQueue(
                new TransportError({
                  code: -32603,
                  message: `WebSocket reconnection failed after ${reconnectOpts.maxAttempts} attempts`,
                })
              );
            }
          }
        });

      const connect = Effect.gen(function* () {
        const ws = new WebSocket(config.url, config.protocols);
        const connectDeferred = yield* Deferred.make<void, TransportError>();

        ws.onopen = () => {
          runFork(
            Effect.gen(function* () {
              yield* Deferred.succeed(connectDeferred, undefined);
              yield* Ref.set(attemptCountRef, 0);
              yield* Ref.set(currentDelayRef, reconnectOpts.delay);
              yield* Ref.set(isReconnectingRef, false);
              yield* flushQueue(ws);
              yield* startKeepAlive(ws);
            })
          );
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            runFork(handleMessage(message));
          } catch { }
        };

        ws.onclose = () => {
          const isClosed = Effect.runSync(Ref.get(isClosedRef)); // OK: Ref.get is sync
          runFork(handleClose(isClosed));
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
        return yield* Deferred.await(connectDeferred);
      });

      yield* connect;

      // Cleanup: interrupt reconnect fiber, close websocket
      yield* Effect.addFinalizer(() =>
        Effect.gen(function* () {
          yield* Ref.set(isClosedRef, true);
          const reconnectFiber = yield* Ref.get(reconnectFiberRef);
          if (reconnectFiber) {
            yield* Fiber.interrupt(reconnectFiber);
          }
          yield* stopKeepAlive;
          const ws = yield* Ref.get(wsRef);
          if (ws) ws.close();
        })
      );

      return { request: ... };
    }),
  );
};
```

## Benefits

- **No Effect.runSync** - All async operations use runFork
- **Fiber tracking** - Reconnect fiber can be interrupted
- **Proper cleanup** - Finalizer interrupts all spawned fibers
- **Structured concurrency** - All fibers tied to layer scope
- **Interruptible** - Parent scope interruption propagates

## Alternative: Use Effect's WebSocket Abstraction

Consider using `@effect/platform` WebSocket client when available, which provides idiomatic Effect bindings.

## References

- [Effect Runtime](https://effect.website/docs/guides/runtime)
- [Structured Concurrency](https://effect.website/docs/guides/concurrency/fibers)
