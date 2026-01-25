# Review 078: Streaming Services Review

**Date**: 2025-01-25
**Reviewer**: Amp
**Scope**: BlockStream, EventStream services and block/ utilities
**Status**: 🔴 Critical issues found

## Executive Summary

The streaming services have several architectural issues that need addressing:
1. **P0**: `runPromise` in callbacks breaks Effect's fiber model
2. **P0**: No stream cleanup/cancellation support
3. **P1**: Dead retry code in fetchBlock/fetchBlockByHash
4. **P2**: Missing backpressure handling

---

## Files Reviewed

| File | Status | Issues |
|------|--------|--------|
| `services/BlockStream/BlockStream.ts` | 🔴 | runPromise in callback, no cleanup |
| `services/BlockStream/BlockStreamService.ts` | ✅ | Clean interface |
| `services/BlockStream/BlockStreamError.ts` | ✅ | Good |
| `services/BlockStream/BlockStream.test.ts` | 🟡 | Missing stream behavior tests |
| `contract/EventStream.ts` | 🔴 | runPromise in callback, no cleanup |
| `contract/EventStreamService.ts` | ✅ | Clean interface |
| `contract/EventStream.test.ts` | ✅ | Good coverage |
| `block/fetchBlock.ts` | 🔴 | Dead retry code |
| `block/fetchBlockByHash.ts` | 🔴 | Dead retry code |
| `block/fetchBlockReceipts.ts` | ✅ | Good implementation |
| `block/toLightBlock.ts` | ✅ | Pure function, good |
| `block/BlockError.ts` | ✅ | Good |

---

## Critical Issues

### Issue 1: `runPromise` in Callbacks (P0)

**Location**: 
- [`BlockStream.ts:80`](file:///Users/williamcory/voltaire/voltaire-effect/src/services/BlockStream/BlockStream.ts#L80)
- [`EventStream.ts:88`](file:///Users/williamcory/voltaire/voltaire-effect/src/contract/EventStream.ts#L88)

**Problem**: Both services use `runPromise` inside provider callbacks:

```typescript
// BlockStream.ts:76-81
const provider = {
  request: async ({ method, params }) =>
    Runtime.runPromise(runtime)(transport.request(method, params)),
  on: () => {},
  removeListener: () => {},
};
```

```typescript
// EventStream.ts:83-91
const provider = {
  request: async ({ method, params }) =>
    Effect.runPromise(transport.request(method, params)),  // Even worse - no runtime!
  on: () => {},
  removeListener: () => {},
};
```

**Why this is bad**:
1. `Effect.runPromise` (EventStream) doesn't have access to the scoped runtime context
2. Creates orphan fibers that can't be tracked/cancelled
3. Errors thrown inside callbacks won't propagate to the Effect error channel
4. Interruption signals won't reach the inner effects

**Fix**: Create an adapter that uses `Effect.promise` with proper fiber handling:

```typescript
export const BlockStream: Layer.Layer<BlockStreamService, never, TransportService> = 
  Layer.scoped(
    BlockStreamService,
    Effect.gen(function* () {
      const transport = yield* TransportService;
      const scope = yield* Effect.scope;
      
      // Use a Queue to bridge async callbacks to Effect
      const requestQueue = yield* Queue.unbounded<{
        method: string;
        params?: unknown[];
        deferred: Deferred.Deferred<unknown, Error>;
      }>();
      
      // Background fiber processes requests
      yield* Effect.forkScoped(
        Effect.forever(
          Effect.gen(function* () {
            const { method, params, deferred } = yield* Queue.take(requestQueue);
            yield* transport.request(method, params).pipe(
              Effect.flatMap((result) => Deferred.succeed(deferred, result)),
              Effect.catchAll((error) => Deferred.fail(deferred, error as Error)),
            );
          })
        )
      );
      
      const provider = {
        request: async ({ method, params }: { method: string; params?: unknown[] }) => {
          const deferred = Deferred.unsafeMake<unknown, Error>();
          await Queue.unsafeOffer(requestQueue, { method, params, deferred });
          return Deferred.await(deferred).pipe(Effect.runPromise);
        },
        on: () => {},
        removeListener: () => {},
      };
      
      // ...rest
    })
  );
```

Or simpler: refactor to not need async provider at all.

---

### Issue 2: No Stream Cleanup (P0)

**Location**: 
- [`BlockStream.ts:86-97`](file:///Users/williamcory/voltaire/voltaire-effect/src/services/BlockStream/BlockStream.ts#L86-L97)
- [`EventStream.ts:93-123`](file:///Users/williamcory/voltaire/voltaire-effect/src/contract/EventStream.ts#L93-L123)

**Problem**: The core streams are created but never cleaned up:

```typescript
const coreStream = CoreBlockStream({ provider: provider as any });

return {
  backfill: (options) => fromAsyncGenerator(() => coreStream.backfill(options)),
  watch: (options) => fromAsyncGenerator(() => coreStream.watch(options)),
};
```

**Why this is bad**:
1. `coreStream` may hold WebSocket connections, polling intervals, etc.
2. No `Scope` management - resources leak when layer is released
3. AsyncGenerators may not be properly cancelled

**Fix**: Use `Layer.scoped` and add cleanup:

```typescript
export const BlockStream: Layer.Layer<BlockStreamService, never, TransportService> = 
  Layer.scoped(
    BlockStreamService,
    Effect.gen(function* () {
      const transport = yield* TransportService;
      
      // Track active streams for cleanup
      const activeStreams = yield* Ref.make<Set<AsyncGenerator<unknown>>>(new Set());
      
      // Register finalizer
      yield* Effect.addFinalizer(() =>
        Effect.gen(function* () {
          const streams = yield* Ref.get(activeStreams);
          yield* Effect.all(
            Array.from(streams).map((gen) => 
              Effect.promise(() => gen.return(undefined))
            ),
            { concurrency: "unbounded" }
          );
        })
      );
      
      const fromTrackedAsyncGenerator = <T>(
        makeGenerator: () => AsyncGenerator<T>
      ): Stream.Stream<T, BlockStreamError> =>
        Stream.acquireRelease(
          Effect.sync(() => makeGenerator()).pipe(
            Effect.tap((gen) => Ref.update(activeStreams, (s) => s.add(gen)))
          ),
          (gen) => Ref.update(activeStreams, (s) => { s.delete(gen); return s; })
        ).pipe(
          Stream.flatMap((gen) => Stream.fromAsyncIterable(
            { [Symbol.asyncIterator]: () => gen },
            (e) => new BlockStreamError(e instanceof Error ? e.message : "error", { cause: e instanceof Error ? e : undefined })
          ))
        );
      
      // ...use fromTrackedAsyncGenerator instead
    })
  );
```

---

### Issue 3: Dead Retry Code (P1)

**Location**:
- [`fetchBlock.ts:52-96`](file:///Users/williamcory/voltaire/voltaire-effect/src/block/fetchBlock.ts#L52-L96)
- [`fetchBlockByHash.ts:52-94`](file:///Users/williamcory/voltaire/voltaire-effect/src/block/fetchBlockByHash.ts#L52-L94)

**Problem**: The retry logic uses `try/catch` but Effects don't throw - they fail:

```typescript
let attempt = 0;
let delay = initialDelay;

while (true) {
  try {
    const block = yield* transport.request(...)  // This yields, doesn't throw!
    // ...
  } catch (error) {  // DEAD CODE - yield* never throws
    attempt++;
    if (attempt >= maxRetries) {
      return yield* Effect.fail(...);
    }
    yield* Effect.sleep(`${delay} millis`);
    delay = Math.min(delay * 2, maxDelay);
  }
}
```

**Why this is bad**:
1. Retry logic never executes
2. `maxRetries`, `initialDelay`, `maxDelay` are unused
3. Users think they have retry protection but they don't

**Fix**: Use Effect's retry combinators:

```typescript
export const fetchBlock = <TInclude extends BlockInclude = "header">(
  blockNumber: bigint,
  include: TInclude = "header" as TInclude,
  retryOptions?: RetryOptions,
): Effect.Effect<StreamBlock<TInclude>, BlockError | BlockNotFoundError, TransportService> =>
  Effect.gen(function* () {
    const transport = yield* TransportService;
    const includeTransactions = include !== "header";

    const fetchWithRetry = transport
      .request("eth_getBlockByNumber", [
        `0x${blockNumber.toString(16)}`,
        includeTransactions,
      ])
      .pipe(
        Effect.mapError((e) => 
          new BlockError(`Failed to fetch block ${blockNumber}`, { cause: e })
        ),
        Effect.retry(
          Schedule.exponential(retryOptions?.initialDelay ?? 1000).pipe(
            Schedule.upTo(retryOptions?.maxDelay ?? 30000),
            Schedule.compose(Schedule.recurs(retryOptions?.maxRetries ?? 3))
          )
        )
      );

    const block = yield* fetchWithRetry;

    if (!block) {
      return yield* Effect.fail(new BlockNotFoundError(blockNumber));
    }

    if (include === "receipts") {
      const receipts = yield* createFetchBlockReceipts(
        block as Record<string, unknown>,
        retryOptions,
      );
      return { ...block, receipts } as unknown as StreamBlock<TInclude>;
    }

    return block as unknown as StreamBlock<TInclude>;
  });
```

---

## Medium Issues

### Issue 4: Missing Backpressure Handling (P2)

**Location**: Both BlockStream and EventStream

**Problem**: `Stream.fromAsyncIterable` doesn't handle backpressure - if consumer is slow, the async generator keeps producing.

**Current behavior**:
```typescript
const fromAsyncGenerator = <T>(
  makeGenerator: () => AsyncGenerator<T>,
): Stream.Stream<T, BlockStreamError> =>
  Stream.fromAsyncIterable(
    { [Symbol.asyncIterator]: makeGenerator },
    (error) => new BlockStreamError(...)
  );
```

**Fix**: Use `Stream.fromPull` for proper backpressure:

```typescript
const fromAsyncGeneratorWithBackpressure = <T>(
  makeGenerator: () => AsyncGenerator<T>,
): Stream.Stream<T, BlockStreamError> =>
  Stream.unfoldChunkEffect(
    makeGenerator(),
    (gen) =>
      Effect.tryPromise({
        try: () => gen.next(),
        catch: (e) => new BlockStreamError(e instanceof Error ? e.message : "error", { cause: e instanceof Error ? e : undefined }),
      }).pipe(
        Effect.map((result) =>
          result.done ? Option.none() : Option.some([Chunk.of(result.value), gen])
        )
      )
  );
```

---

### Issue 5: EventStream Creates New CoreEventStream Per Call (P2)

**Location**: [`EventStream.ts:97-121`](file:///Users/williamcory/voltaire/voltaire-effect/src/contract/EventStream.ts#L97-L121)

**Problem**: Each call to `backfill` or `watch` creates a new `CoreEventStream`:

```typescript
backfill: <TEvent extends EventType>(options: BackfillStreamOptions<TEvent>) => {
  const { address, event, filter, ...backfillOptions } = options;
  const coreStream = CoreEventStream({  // NEW instance every time!
    provider: provider as any,
    address,
    event,
    filter,
  });
  return fromAsyncGenerator(() => coreStream.backfill(backfillOptions));
},
```

**Why this might be bad**: Depends on CoreEventStream internals, but likely:
1. May duplicate state tracking
2. Can't share connection/polling between streams

---

## Test Coverage Gaps

### BlockStream.test.ts

Missing tests:
- Stream cancellation/cleanup
- Error propagation during streaming
- Reorg event handling
- Multiple concurrent streams
- Stream interruption

### Recommended additions:

```typescript
it("cleans up on stream interruption", async () => {
  // Test that interrupting the stream properly cleans up resources
});

it("propagates errors from core stream", async () => {
  // Test that errors in the async generator reach the Effect error channel
});

it("handles concurrent backfill and watch", async () => {
  // Test running both streams simultaneously
});
```

---

## Summary of Required Changes

### P0 (Must fix before use)
1. [ ] Replace `runPromise` in callbacks with proper fiber handling
2. [ ] Add `Layer.scoped` with cleanup for stream resources

### P1 (Fix soon)
3. [ ] Replace dead try/catch retry code with `Effect.retry` + `Schedule`

### P2 (Nice to have)
4. [ ] Add backpressure handling with `Stream.unfoldChunkEffect`
5. [ ] Review CoreEventStream instantiation pattern
6. [ ] Add comprehensive stream behavior tests

---

## Related Reviews
- Review 024: BlockStream runPromise concern
- Review 027: BlockStream callback issues
- Review 028: fetchBlock dead code
- Review 029: fetchBlockReceipts dead code
- Review 030: BlockStream cleanup missing
