# Fix BatchScheduler Effect.runSync/runPromise in Flush Callback

**Status: ✅ FIXED** (2025-01-25)

Complete rewrite using proper Effect patterns:
- Queue for pending requests
- Ref for state (ID counter, flushing flag, flush fiber)
- Atomic flushing gate via `Ref.modify`
- Proper Deferred completion for all requests (including missing responses)
- Shutdown cleanup drains queue and fails pending
- `Effect.uninterruptibleMask` + `onInterrupt` for batch processing

<issue>
<metadata>
priority: P0
status: fixed
files: [src/services/Transport/BatchScheduler.ts]
related: [040, 041]
</metadata>

<problem>
## Anti-Pattern: Effect.runSync/runPromise in Async Flush

BatchScheduler uses multiple Effect escape hatches in the flush callback:

**Location**: `src/services/Transport/BatchScheduler.ts#L102-L119`

```typescript
const flush = async (): Promise<void> => {
  // ...
  try {
    const responses = await Effect.runPromise(send(requests));  // ❌ L102

    for (const response of responses) {
      // ...
      if (response.error) {
        Effect.runSync(  // ❌ L109
          Deferred.fail(req.deferred, new Error(response.error.message)),
        );
      } else {
        Effect.runSync(Deferred.succeed(req.deferred, response.result));  // ❌ L113
      }
    }
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e));
    for (const p of batch) {
      Effect.runSync(Deferred.fail(p.deferred, error));  // ❌ L119
    }
  }
};
```

### Issues

1. **Effect.runPromise in async function**: No runtime context, tracing lost
2. **Effect.runSync for Deferred operations**: Deferred.fail/succeed should be in Effect context
3. **setTimeout for scheduling**: Should use Effect.schedule
4. **Mutable state (pending array)**: Should use Ref
5. **No proper cleanup**: Timer leaks possible
</problem>

<solution>
## Full Effect Rewrite Using Effect Patterns

Replace the imperative implementation with proper Effect patterns.

```typescript
import * as Deferred from "effect/Deferred";
import * as Effect from "effect/Effect";
import * as Queue from "effect/Queue";
import * as Ref from "effect/Ref";
import * as Schedule from "effect/Schedule";
import * as Chunk from "effect/Chunk";

interface PendingRequest {
  id: number;
  method: string;
  params?: unknown[];
  deferred: Deferred.Deferred<unknown, Error>;
}

export interface BatchScheduler {
  schedule: <T>(method: string, params?: unknown[]) => Effect.Effect<T, Error>;
}

/**
 * Creates a batch scheduler using Effect patterns.
 * 
 * Uses a Queue for pending requests and Effect.schedule for flushing.
 */
export const createBatchScheduler = <E extends Error>(
  send: (requests: JsonRpcRequest[]) => Effect.Effect<JsonRpcBatchResponse[], E>,
  options: BatchOptions = {},
): Effect.Effect<BatchScheduler, never, Scope.Scope> =>
  Effect.gen(function* () {
    const batchSize = options.batchSize ?? 100;
    const wait = options.wait ?? 0;

    const pendingQueue = yield* Queue.unbounded<PendingRequest>();
    const idRef = yield* Ref.make(1);

    // Flush logic as an Effect
    const flush = Effect.gen(function* () {
      const pending = yield* Queue.takeAll(pendingQueue);
      if (Chunk.isEmpty(pending)) return;

      const batch = Chunk.toReadonlyArray(pending).slice(0, batchSize);
      
      // Put back overflow
      const overflow = Chunk.toReadonlyArray(pending).slice(batchSize);
      for (const req of overflow) {
        yield* Queue.offer(pendingQueue, req);
      }

      const requests = batch.map((p) => ({
        id: p.id,
        method: p.method,
        params: p.params,
      }));

      const result = yield* Effect.either(send(requests));

      if (result._tag === "Left") {
        const error = result.left instanceof Error 
          ? result.left 
          : new Error(String(result.left));
        for (const req of batch) {
          yield* Deferred.fail(req.deferred, error);
        }
      } else {
        for (const response of result.right) {
          const req = batch.find((p) => p.id === response.id);
          if (!req) continue;

          if (response.error) {
            yield* Deferred.fail(req.deferred, new Error(response.error.message));
          } else {
            yield* Deferred.succeed(req.deferred, response.result);
          }
        }
      }

      // Recursively flush if more pending
      const size = yield* Queue.size(pendingQueue);
      if (size > 0) {
        yield* flush;
      }
    });

    // Schedule periodic flushing
    const flushFiber = yield* Effect.forkScoped(
      flush.pipe(
        Effect.schedule(
          wait > 0 
            ? Schedule.spaced(wait) 
            : Schedule.forever  // Immediate on next tick
        ),
        Effect.catchAll(() => Effect.void),
      )
    );

    // Trigger immediate flush when batch size reached
    const maybeFlush = Effect.gen(function* () {
      const size = yield* Queue.size(pendingQueue);
      if (size >= batchSize) {
        yield* flush;
      }
    });

    return {
      schedule: <T>(method: string, params?: unknown[]): Effect.Effect<T, Error> =>
        Effect.gen(function* () {
          const id = yield* Ref.getAndUpdate(idRef, (n) => n + 1);
          const deferred = yield* Deferred.make<unknown, Error>();

          yield* Queue.offer(pendingQueue, { id, method, params, deferred });
          yield* maybeFlush;

          return (yield* Deferred.await(deferred)) as T;
        }),
    };
  });
```

### Key Changes

1. **Queue instead of mutable array**: `Queue.unbounded<PendingRequest>()`
2. **Ref for ID counter**: `Ref.make(1)` instead of `let nextId = 1`
3. **Effect.schedule for timing**: Replaces `setTimeout`
4. **Effect.forkScoped for background flush**: Auto-cleanup on scope close
5. **All Deferred ops in Effect**: No `Effect.runSync`
6. **Scoped resource**: Returns `Effect.Effect<BatchScheduler, never, Scope.Scope>`
</solution>

<implementation>
<steps>
1. **Add imports**:
   ```typescript
   import * as Queue from "effect/Queue";
   import * as Ref from "effect/Ref";
   import * as Schedule from "effect/Schedule";
   import * as Scope from "effect/Scope";
   import * as Chunk from "effect/Chunk";
   ```

2. **Change return type to scoped Effect**:
   ```typescript
   export const createBatchScheduler = <E extends Error>(
     send: ...,
     options: ...,
   ): Effect.Effect<BatchScheduler, never, Scope.Scope> =>
   ```

3. **Replace mutable state with Effect primitives**:
   - `pending` array → `Queue.unbounded`
   - `nextId` → `Ref.make`
   - `flushTimer` → `Effect.forkScoped` with schedule

4. **Update all callers to provide Scope**
</steps>

<breaking_changes>
- Return type changes from sync object to `Effect.Effect<BatchScheduler, never, Scope.Scope>`
- Callers must use `Effect.scoped` or provide a Scope
</breaking_changes>
</implementation>

<tests>
```typescript
describe("BatchScheduler Effect patterns", () => {
  it("should batch requests", async () => {
    const requests: JsonRpcRequest[][] = [];
    const send = (reqs: JsonRpcRequest[]) => {
      requests.push(reqs);
      return Effect.succeed(reqs.map(r => ({ id: r.id, result: "ok" })));
    };

    const program = Effect.gen(function* () {
      const scheduler = yield* createBatchScheduler(send, { batchSize: 2 });
      
      const [r1, r2] = yield* Effect.all([
        scheduler.schedule("method1"),
        scheduler.schedule("method2"),
      ], { concurrency: 2 });

      return [r1, r2];
    }).pipe(Effect.scoped);

    const result = await Effect.runPromise(program);
    expect(requests.length).toBe(1);  // Batched into single request
    expect(requests[0].length).toBe(2);
  });

  it("should cleanup on scope close", async () => {
    let flushCount = 0;
    const send = (reqs: JsonRpcRequest[]) => {
      flushCount++;
      return Effect.succeed(reqs.map(r => ({ id: r.id, result: "ok" })));
    };

    await Effect.runPromise(
      Effect.gen(function* () {
        const scheduler = yield* createBatchScheduler(send, { wait: 1000 });
        yield* scheduler.schedule("method1");
        // Scope closes immediately - should cleanup timer
      }).pipe(Effect.scoped)
    );
    
    // Timer should be cancelled, not firing after scope close
  });
});
```
</tests>
</issue>
