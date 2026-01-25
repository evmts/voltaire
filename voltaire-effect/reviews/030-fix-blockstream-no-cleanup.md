# Fix BlockStream No Resource Cleanup on Interruption

## Problem

BlockStream creates a core stream with polling timers but has no cleanup mechanism when the Effect stream is interrupted.

**Location**: `src/services/BlockStream/BlockStream.ts#L83-L95`

```typescript
const coreStream = CoreBlockStream({ provider: provider as any });
return {
  backfill: (options) => fromAsyncGenerator(() => coreStream.backfill(options)),
  watch: (options) => fromAsyncGenerator(() => coreStream.watch(options)),
};
// No cleanup! Polling timers leak when stream is interrupted
```

## Why This Matters

- Polling intervals continue after stream interruption
- Memory leaks from accumulated timers
- Phantom RPC requests continue in background
- Resource exhaustion over time

## Solution

Use `Stream.acquireRelease` or `Stream.ensuring` for cleanup:

```typescript
import * as Stream from "effect/Stream";

const makeBlockStream = Effect.gen(function* () {
  const transport = yield* TransportService;
  const runtime = yield* Effect.runtime<never>();

  return {
    watch: <TInclude extends BlockInclude = "header">(
      options?: WatchOptions<TInclude>,
    ): Stream.Stream<BlockStreamEvent<TInclude>, BlockStreamError> =>
      Stream.acquireRelease(
        Effect.sync(() => CoreBlockStream({ provider: makeProvider(runtime, transport) })),
        (coreStream) => Effect.sync(() => {
          coreStream.destroy?.();
          // Clear any pending timers
        })
      ).pipe(
        Stream.flatMap((coreStream) =>
          fromAsyncGenerator(() => coreStream.watch(options))
        )
      ),
  };
});
```

Or using `Stream.ensuring`:

```typescript
const watchStream = fromAsyncGenerator(() => coreStream.watch(options)).pipe(
  Stream.ensuring(
    Effect.sync(() => {
      coreStream.destroy?.();
    })
  )
);
```

## Acceptance Criteria

- [ ] Add cleanup logic using `Stream.acquireRelease` or `Stream.ensuring`
- [ ] Call `coreStream.destroy()` if available
- [ ] Clear any pending polling timers
- [ ] Verify no leaked timers after stream interruption
- [ ] Add test for cleanup on interruption

## Priority

**Critical** - Resource leak in production
