# Fix BatchScheduler Non-Idiomatic Effect Usage

**Priority**: High  
**Module**: `services/Transport/BatchScheduler.ts`  
**Category**: Effect Anti-Pattern

## Problem

BatchScheduler uses imperative async/await patterns with mutable state instead of idiomatic Effect patterns:

```typescript
// Current: Non-Effect imperative code
let pending: PendingRequest[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let nextId = 1;

const flush = async (): Promise<void> => {
  // ...
  const responses = await Effect.runPromise(send(requests));
  Effect.runSync(Deferred.succeed(req.deferred, response.result));
  // ...
};

const scheduleFlush = (): void => {
  if (!flushTimer) {
    flushTimer = setTimeout(() => flush(), wait);
  }
};
```

## Issues

1. **Mutable state** - Uses `let` bindings for `pending`, `flushTimer`, `nextId`
2. **Effect.runPromise inside async** - Breaks Effect's control flow, loses fiber semantics
3. **setTimeout instead of Effect.schedule** - Not interruptible, no fiber control
4. **Effect.runSync for Deferred** - Throws if Effect is async (race condition risk)
5. **No proper cleanup** - Timer not cleaned up in finalizer

## Solution

Use `Ref`, `Queue`, and `Schedule` for proper Effect-native batching:

```typescript
import * as Queue from "effect/Queue";
import * as Ref from "effect/Ref";
import * as Fiber from "effect/Fiber";
import * as Schedule from "effect/Schedule";

export const createBatchScheduler = (
  send: (requests: JsonRpcRequest[]) => Effect.Effect<JsonRpcBatchResponse[], Error>,
  options: BatchOptions = {},
) => {
  const batchSize = options.batchSize ?? 100;
  const wait = options.wait ?? 0;

  return Effect.gen(function* () {
    const pendingQueue = yield* Queue.unbounded<PendingRequest>();
    const nextIdRef = yield* Ref.make(1);

    const flush = Effect.gen(function* () {
      const items: PendingRequest[] = [];
      let item: PendingRequest | undefined;
      
      // Drain up to batchSize items
      while (items.length < batchSize) {
        const taken = yield* Queue.poll(pendingQueue);
        if (Option.isNone(taken)) break;
        items.push(taken.value);
      }
      
      if (items.length === 0) return;

      const requests = items.map((p) => ({
        id: p.id,
        method: p.method,
        params: p.params,
      }));

      const result = yield* send(requests).pipe(
        Effect.either,
      );

      if (Either.isLeft(result)) {
        yield* Effect.forEach(items, (p) => 
          Deferred.fail(p.deferred, result.left),
          { discard: true }
        );
        return;
      }

      const responses = result.right;
      yield* Effect.forEach(items, (req) => {
        const response = responses.find((r) => r.id === req.id);
        if (!response) {
          return Deferred.fail(req.deferred, new Error("No response for request"));
        }
        if (response.error) {
          return Deferred.fail(req.deferred, new Error(response.error.message));
        }
        return Deferred.succeed(req.deferred, response.result);
      }, { discard: true });
    });

    // Start flush worker fiber
    const flushFiber = yield* flush.pipe(
      Effect.delay(Duration.millis(wait)),
      Effect.forever,
      Effect.fork,
    );

    // Cleanup on scope close
    yield* Effect.addFinalizer(() => Fiber.interrupt(flushFiber));

    return {
      schedule: <T>(method: string, params?: unknown[]): Effect.Effect<T, Error> =>
        Effect.gen(function* () {
          const id = yield* Ref.updateAndGet(nextIdRef, (n) => n + 1);
          const deferred = yield* Deferred.make<unknown, Error>();

          yield* Queue.offer(pendingQueue, { id, method, params, deferred });

          return (yield* Deferred.await(deferred)) as T;
        }),
    };
  });
};
```

## Benefits

- **Fiber-aware**: Respects interruption, timeouts
- **No Effect.runPromise/runSync**: All operations stay in Effect
- **Proper cleanup**: Finalizer interrupts flush fiber
- **Queue instead of Array**: Thread-safe, no mutation
- **Testable**: Can provide test Clock for deterministic timing

## Alternative: Use Effect's Built-in RequestResolver

Effect has built-in request batching via `RequestResolver` and `Request`:

```typescript
import * as Request from "effect/Request";
import * as RequestResolver from "effect/RequestResolver";

interface JsonRpcRequest extends Request.Request<unknown, Error> {
  readonly _tag: "JsonRpcRequest";
  readonly method: string;
  readonly params?: unknown[];
}

const JsonRpcRequest = Request.tagged<JsonRpcRequest>("JsonRpcRequest");

const resolver = RequestResolver.makeBatched(
  (requests: ReadonlyArray<JsonRpcRequest>) =>
    Effect.gen(function* () {
      const responses = yield* send(
        requests.map((r, i) => ({ id: i, method: r.method, params: r.params }))
      );
      return requests.map((req, i) => {
        const response = responses[i];
        if (response.error) {
          return Request.fail(req, new Error(response.error.message));
        }
        return Request.succeed(req, response.result);
      });
    }),
);

// Usage
const request = <T>(method: string, params?: unknown[]) =>
  Effect.request(JsonRpcRequest({ method, params }), resolver) as Effect.Effect<T, Error>;
```

This is the most idiomatic approach as it uses Effect's first-class batching support.

## References

- [Effect Request Batching](https://effect.website/docs/guides/batching-caching)
- [RequestResolver API](https://effect-ts.github.io/effect/effect/RequestResolver.ts.html)
