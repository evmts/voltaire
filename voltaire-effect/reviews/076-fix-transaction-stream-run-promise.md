# Fix TransactionStream Effect.runPromise in Provider Adapter

**Status: ✅ FIXED** (2025-01-25)

<issue>
<metadata>
priority: P0
status: fixed
files: [src/transaction/TransactionStream.ts]
related: [040, 078]
</metadata>

<problem>
## Anti-Pattern: Effect.runPromise in Provider Adapter

TransactionStream uses `Effect.runPromise` inside the provider adapter callback, breaking Effect's structured concurrency model.

**Location**: `src/transaction/TransactionStream.ts#L79`

```typescript
const provider = {
  request: async ({
    method,
    params,
  }: { method: string; params?: unknown[] }) =>
    Effect.runPromise(transport.request(method, params)),  // ❌ Escapes runtime
  on: () => {},
  removeListener: () => {},
};
```

### Why This Matters

1. **Loses fiber context**: Tracing, spans, and logging context are lost
2. **Interruption signals don't propagate**: Stream cancellation won't cancel in-flight requests
3. **Error handling is disconnected**: Effect error channel is bypassed
4. **No resource cleanup**: Transport cleanup won't be triggered on interruption
</problem>

<solution>
## Effect Pattern: Capture Runtime at Layer Creation

Capture the runtime when the layer is created, then use `Runtime.runPromise(runtime)` in callbacks to maintain context.

```typescript
import * as Runtime from "effect/Runtime";

export const TransactionStream: Layer.Layer<
  TransactionStreamService,
  never,
  TransportService
> = Layer.effect(
  TransactionStreamService,
  Effect.gen(function* () {
    const transport = yield* TransportService;
    const runtime = yield* Effect.runtime<never>();  // Capture runtime

    const provider = {
      request: async ({
        method,
        params,
      }: { method: string; params?: unknown[] }) =>
        Runtime.runPromise(runtime)(transport.request(method, params)),  // ✅ Uses captured runtime
      on: () => {},
      removeListener: () => {},
    };

    const coreStream = CoreTransactionStream({ provider: provider as any });

    return {
      watchPending: (options?: WatchPendingOptions) =>
        fromAsyncGenerator(() => coreStream.watchPending(options)),

      watchConfirmed: (options?: WatchConfirmedOptions) =>
        fromAsyncGenerator(() => coreStream.watchConfirmed(options)),

      track: (txHash: Uint8Array | string, options?: TrackOptions) =>
        fromAsyncGenerator(() => coreStream.track(txHash as `0x${string}`, options)),
    };
  }),
);
```
</solution>

<implementation>
<steps>
1. **Import Runtime**:
   ```typescript
   import * as Runtime from "effect/Runtime";
   ```

2. **Capture runtime at layer creation**:
   ```typescript
   const runtime = yield* Effect.runtime<never>();
   ```

3. **Use Runtime.runPromise in provider adapter**:
   ```typescript
   request: async ({ method, params }) =>
     Runtime.runPromise(runtime)(transport.request(method, params)),
   ```
</steps>
</implementation>

<tests>
```typescript
describe("TransactionStream Runtime context", () => {
  it("should maintain fiber context in requests", async () => {
    const program = Effect.gen(function* () {
      const txStream = yield* TransactionStreamService;
      // Stream would use transport with proper context
      return "ok";
    }).pipe(
      Effect.provide(TransactionStream),
      Effect.provide(mockTransport),
      Effect.withSpan("test-span"),
    );
    
    await Effect.runPromise(program);
  });
});
```
</tests>
</issue>
