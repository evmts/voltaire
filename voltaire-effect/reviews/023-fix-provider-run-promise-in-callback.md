# Fix Provider.ts Effect.runPromise in Async Callback

<issue>
<metadata>
priority: P1
status: COMPLETED
files: [src/services/Provider/Provider.ts]
reviews: [023, 024, 027]
</metadata>

<problem>
Provider's `watchBlocks` and `backfillBlocks` originally used `Effect.runPromise` inside async callbacks, which escapes the Effect runtime and loses structured concurrency:

```typescript
// Anti-pattern: escapes Effect runtime
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

Issues:
- Loses structured interruption (can't cancel in-flight requests when stream interrupted)
- Escapes Effect runtime context (no access to services or context)
- Makes testing harder (can't inject test runtime)
- Breaks fiber hierarchy (orphan fibers continue running)
- Resource scopes don't propagate (cleanup signals lost)
</problem>

<solution>
Capture the runtime first using `Effect.runtime<R>()`, then use `Runtime.runPromise(runtime)`:

```typescript
import * as Runtime from "effect/Runtime";

watchBlocks: <TInclude extends BlockInclude = "header">(
  options?: WatchOptions<TInclude>,
): Stream.Stream<BlockStreamEvent<TInclude>, ProviderError> =>
  Stream.unwrap(
    Effect.gen(function* () {
      // Capture runtime from Effect context
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

This ensures in-flight requests are cancelled when the stream scope is interrupted.
</solution>

<implementation>
<steps>
1. [DONE] src/services/Provider/Provider.ts:568 - Capture runtime with `yield* Effect.runtime<never>()`
2. [DONE] src/services/Provider/Provider.ts:577 - Use `Runtime.runPromise(runtime)` for watchBlocks
3. [DONE] src/services/Provider/Provider.ts:599 - Capture runtime in backfillBlocks
4. [DONE] src/services/Provider/Provider.ts:608 - Use `Runtime.runPromise(runtime)` for backfillBlocks
</steps>

<patterns>
- `Effect.runtime<R>()` - Capture current runtime from Effect context
- `Runtime.runPromise(runtime)(effect)` - Run effect with captured runtime
- `Stream.unwrap` - Unwrap Effect<Stream<A, E>> to Stream<A, E>
- Curried form: `Runtime.runPromise(runtime)` returns `(effect) => Promise<A>`
</patterns>

<why-this-works>
When you capture the runtime inside an Effect and use it for callbacks:
1. The runtime carries the fiber hierarchy
2. When the parent stream is interrupted, the runtime's interruption signal propagates
3. The captured runtime has access to all provided services
4. Test runtimes can be injected for testing
</why-this-works>
</implementation>

<tests>
```typescript
import { Effect, Stream, Fiber } from "effect";

describe("Provider watchBlocks structured concurrency", () => {
  it("should cancel in-flight requests when stream interrupted", async () => {
    const requestTracker = { started: 0, completed: 0, cancelled: false };
    
    const mockTransport = TransportService.of({
      request: (method, params) =>
        Effect.gen(function* () {
          requestTracker.started++;
          yield* Effect.sleep("100 millis");
          requestTracker.completed++;
          return { blockNumber: "0x1" };
        }).pipe(
          Effect.onInterrupt(() => {
            requestTracker.cancelled = true;
            return Effect.void;
          })
        ),
    });
    
    const program = Effect.gen(function* () {
      const provider = yield* ProviderService;
      const fiber = yield* Stream.runCollect(
        provider.watchBlocks().pipe(Stream.take(1))
      ).pipe(Effect.fork);
      
      // Wait for request to start
      yield* Effect.sleep("50 millis");
      
      // Interrupt the stream fiber
      yield* Fiber.interrupt(fiber);
    }).pipe(Effect.provide(Layer.succeed(TransportService, mockTransport)));
    
    await Effect.runPromise(program);
    
    expect(requestTracker.started).toBeGreaterThan(0);
    expect(requestTracker.cancelled).toBe(true);
  });
});
```
</tests>

<docs>
```typescript
/**
 * Watch for new blocks using polling.
 * 
 * @description
 * Uses captured Effect runtime to maintain structured concurrency.
 * In-flight RPC requests are cancelled when the stream is interrupted.
 * 
 * @example
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const provider = yield* ProviderService;
 *   yield* Stream.runForEach(
 *     provider.watchBlocks().pipe(Stream.take(5)),
 *     (event) => Effect.log(`Block: ${event.blockNumber}`)
 *   );
 * });
 * ```
 */
```
</docs>

<api>
<before>
```typescript
// Orphan fibers, no cancellation
Effect.runPromise(transport.request(method, params))
```
</before>
<after>
```typescript
// Structured concurrency, proper cancellation
const runtime = yield* Effect.runtime<never>();
Runtime.runPromise(runtime)(transport.request(method, params))
```
</after>
</api>

<references>
- [Effect Runtime documentation](https://effect.website/docs/runtime)
- [Runtime.runPromise API](https://effect.website/docs/runtime#running-effects)
- [Structured concurrency in Effect](https://effect.website/docs/guides/concurrency/fibers)
- [src/services/Provider/Provider.ts#L563-L623](file:///Users/williamcory/voltaire/voltaire-effect/src/services/Provider/Provider.ts#L563-L623)
</references>
</issue>
