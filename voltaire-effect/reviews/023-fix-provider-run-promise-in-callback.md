# Fix Provider.ts Effect.runPromise in Async Callback

## Problem

Provider's `watchBlocks` and `backfillBlocks` use `Effect.runPromise` inside an async callback, which escapes the Effect runtime and loses structured concurrency.

**Location**: `src/services/Provider/Provider.ts#L549-L559`

```typescript
// Current: escapes Effect runtime
const provider = {
  request: async ({
    method,
    params,
  }: {
    method: string;
    params?: unknown[];
  }) => Effect.runPromise(transport.request(method, params)),  // BAD!
  on: () => {},
  removeListener: () => {},
};
```

## Why This Matters

- Loses structured interruption (can't cancel in-flight requests)
- Escapes the Effect runtime context
- Makes testing harder (can't mock runtime)
- Breaks fiber hierarchy

## Solution

Capture the runtime first, then use `runtime.runPromise`:

```typescript
watchBlocks: <TInclude extends BlockInclude = "header">(
  options?: WatchOptions<TInclude>,
): Stream.Stream<BlockStreamEvent<TInclude>, ProviderError> =>
  Stream.unwrap(
    Effect.gen(function* () {
      const runtime = yield* Effect.runtime<never>();
      
      const provider = {
        request: async ({
          method,
          params,
        }: {
          method: string;
          params?: unknown[];
        }) => Runtime.runPromise(runtime)(transport.request(method, params)),
        on: () => {},
        removeListener: () => {},
      };
      
      const coreStream = CoreBlockStream({ provider: provider as any });
      
      return Stream.fromAsyncIterable(
        { [Symbol.asyncIterator]: () => coreStream.watch(options) },
        (error) =>
          new ProviderError(
            { method: "watchBlocks", options },
            error instanceof Error ? error.message : "BlockStream error",
            { cause: error instanceof Error ? error : undefined },
          ),
      );
    })
  ),
```

Or extract to a shared helper:

```typescript
const makeEip1193Provider = (transport: TransportService["Type"]) =>
  Effect.gen(function* () {
    const runtime = yield* Effect.runtime<never>();
    return {
      request: async ({ method, params }: { method: string; params?: unknown[] }) =>
        Runtime.runPromise(runtime)(transport.request(method, params)),
      on: () => {},
      removeListener: () => {},
    };
  });
```

## Acceptance Criteria

- [ ] Capture runtime via `Effect.runtime<never>()`
- [ ] Use `Runtime.runPromise(runtime)` instead of bare `Effect.runPromise`
- [ ] Apply fix to both `watchBlocks` and `backfillBlocks`
- [ ] All existing tests pass

## Priority

**Medium** - Affects structured concurrency and cancellation
