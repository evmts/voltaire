# Fix BlockStream.ts Effect.runPromise in Async Callback

## Problem

BlockStream uses `Effect.runPromise` inside an async callback, same issue as Provider.ts.

**Location**: `src/services/BlockStream/BlockStream.ts#L73-L79`

```typescript
// Current: escapes Effect runtime
const provider = {
  request: async ({
    method,
    params,
  }: { method: string; params?: unknown[] }) =>
    Effect.runPromise(transport.request(method, params)),  // BAD!
  on: () => {},
  removeListener: () => {},
};
```

## Why This Matters

- Loses structured interruption
- Escapes Effect runtime context
- Makes testing harder
- Duplicates same anti-pattern from Provider.ts

## Solution

Capture runtime and use `Runtime.runPromise`:

```typescript
export const BlockStream: Layer.Layer<
  BlockStreamService,
  never,
  TransportService
> = Layer.effect(
  BlockStreamService,
  Effect.gen(function* () {
    const transport = yield* TransportService;
    const runtime = yield* Effect.runtime<never>();

    const provider = {
      request: async ({
        method,
        params,
      }: { method: string; params?: unknown[] }) =>
        Runtime.runPromise(runtime)(transport.request(method, params)),
      on: () => {},
      removeListener: () => {},
    };

    const coreStream = CoreBlockStream({ provider: provider as any });

    return {
      backfill: <TInclude extends BlockInclude = "header">(
        options: BackfillOptions<TInclude>,
      ): Stream.Stream<BlocksEvent<TInclude>, BlockStreamError> =>
        fromAsyncGenerator(() => coreStream.backfill(options)),

      watch: <TInclude extends BlockInclude = "header">(
        options?: WatchOptions<TInclude>,
      ): Stream.Stream<BlockStreamEvent<TInclude>, BlockStreamError> =>
        fromAsyncGenerator(() => coreStream.watch(options)),
    };
  }),
);
```

## Note

Consider extracting a shared `makeEip1193Provider` helper used by both Provider.ts and BlockStream.ts to avoid duplication:

```typescript
// In a shared module like src/services/shared/eip1193.ts
export const makeEip1193Provider = <R>(
  transport: { request: <T>(method: string, params?: unknown[]) => Effect.Effect<T, any, R> }
) =>
  Effect.gen(function* () {
    const runtime = yield* Effect.runtime<R>();
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
- [ ] Consider extracting shared helper
- [ ] All existing tests pass

## Priority

**Medium** - Same issue as Provider.ts, affects structured concurrency
