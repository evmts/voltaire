# Fix BlockStream Effect.runPromise in Callback

## Problem

BlockStream uses `Effect.runPromise` inside an async provider callback, which escapes the Effect runtime.

**Location**: `src/services/BlockStream/BlockStream.ts#L74-L81`

```typescript
const provider = {
  request: async ({ method, params }) =>
    Effect.runPromise(transport.request(method, params)),  // BAD!
  on: () => {},
  removeListener: () => {},
};
```

## Why This Matters

- Loses structured interruption (can't cancel in-flight requests)
- Escapes Effect fiber hierarchy
- Resource scopes don't propagate (cleanup signals lost)
- Errors become uncaught promise rejections instead of Effect errors

## Solution

Capture the runtime first, then use `Runtime.runPromise`:

```typescript
import * as Runtime from "effect/Runtime";

const makeBlockStream = Effect.gen(function* () {
  const transport = yield* TransportService;
  const runtime = yield* Effect.runtime<never>();

  const provider = {
    request: async ({ method, params }: { method: string; params?: unknown[] }) =>
      Runtime.runPromise(runtime)(transport.request(method, params)),
    on: () => {},
    removeListener: () => {},
  };

  const coreStream = CoreBlockStream({ provider: provider as any });
  
  return {
    backfill: (options) => fromAsyncGenerator(() => coreStream.backfill(options)),
    watch: (options) => fromAsyncGenerator(() => coreStream.watch(options)),
  };
});
```

## Acceptance Criteria

- [ ] Capture runtime via `Effect.runtime<never>()`
- [ ] Use `Runtime.runPromise(runtime)` instead of bare `Effect.runPromise`
- [ ] All existing tests pass
- [ ] Verify interruption propagates to in-flight requests

## Priority

**Critical** - Core infrastructure pattern affecting cancellation and resource cleanup
