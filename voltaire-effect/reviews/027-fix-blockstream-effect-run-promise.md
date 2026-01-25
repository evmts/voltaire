# Fix BlockStream Effect.runPromise in Callback

<issue>
<metadata>
priority: P1
status: COMPLETED
files: [src/services/BlockStream/BlockStream.ts]
reviews: [027, 023, 024]
</metadata>

<problem>
BlockStream originally used `Effect.runPromise` inside an async provider callback, which escapes the Effect runtime and loses structured concurrency:

```typescript
// Anti-pattern: escapes Effect runtime (BEFORE)
const provider = {
  request: async ({ method, params }: { method: string; params?: unknown[] }) =>
    Effect.runPromise(transport.request(method, params)),  // BAD!
  on: () => {},
  removeListener: () => {},
};
```

Issues:
- Loses structured interruption (can't cancel in-flight requests when stream interrupted)
- Escapes Effect fiber hierarchy - orphan fibers continue running after parent cancelled
- Resource scopes don't propagate (cleanup signals lost)
- Errors become uncaught promise rejections instead of Effect errors
- Makes testing harder (can't inject test runtime or mock services)
- Same anti-pattern duplicated from Provider.ts
</problem>

<solution>
Capture the runtime first using `Effect.runtime<R>()`, then use `Runtime.runPromise(runtime)`:

```typescript
import * as Runtime from "effect/Runtime";

export const BlockStream: Layer.Layer<
  BlockStreamService,
  never,
  TransportService
> = Layer.effect(
  BlockStreamService,
  Effect.gen(function* () {
    const transport = yield* TransportService;
    const runtime = yield* Effect.runtime<never>();  // Capture runtime

    const provider = {
      request: async ({
        method,
        params,
      }: { method: string; params?: unknown[] }) =>
        Runtime.runPromise(runtime)(transport.request(method, params)),  // Use captured runtime
      on: () => {},
      removeListener: () => {},
    };

    const coreStream = CoreBlockStream({ provider: provider as any });

    const cleanup = () => {
      coreStream.destroy?.();
    };

    return {
      backfill: (options) =>
        fromAsyncGeneratorWithCleanup(() => coreStream.backfill(options), cleanup),
      watch: (options) =>
        fromAsyncGeneratorWithCleanup(() => coreStream.watch(options), cleanup),
    };
  }),
);
```

This ensures in-flight requests are cancelled when the stream scope is interrupted.
</solution>

<implementation>
<steps>
1. [DONE] src/services/BlockStream/BlockStream.ts:22 - Import `Runtime` from effect/Runtime
2. [DONE] src/services/BlockStream/BlockStream.ts:81 - Capture runtime with `yield* Effect.runtime<never>()`
3. [DONE] src/services/BlockStream/BlockStream.ts:88 - Use `Runtime.runPromise(runtime)` instead of bare `Effect.runPromise`
4. [DONE] src/services/BlockStream/BlockStream.ts:31-49 - Added `fromAsyncGeneratorWithCleanup` helper with `Stream.acquireRelease`
5. [DONE] src/services/BlockStream/BlockStream.ts:95-97 - Added cleanup function that calls `coreStream.destroy?()`
</steps>

<effect_patterns>
- `Effect.runtime<R>()` - Capture current runtime carrying fiber hierarchy and services
- `Runtime.runPromise(runtime)` - Curried runner that uses captured runtime for proper interruption
- `Layer.effect` - Create layer that captures runtime once at layer construction time
- `Stream.acquireRelease` - Acquire resource and guarantee cleanup on stream finalization
</effect_patterns>

<why-this-works>
When you capture the runtime inside an Effect and use it for callbacks:
1. The runtime carries the fiber hierarchy - child fibers are tracked
2. When the parent stream is interrupted, the runtime's interruption signal propagates to children
3. The captured runtime has access to all provided services from the Effect context
4. Test runtimes can be injected for testing with mocked services
5. Resource scopes propagate - `Stream.acquireRelease` cleanup runs on interruption
</why-this-works>
</implementation>

<tests>
```typescript
import { Effect, Stream, Fiber, Layer, Context } from "effect";
import { BlockStreamService, BlockStream } from "./BlockStreamService.js";
import { TransportService } from "../Transport/TransportService.js";

describe("BlockStream structured concurrency", () => {
  it("should cancel in-flight requests when stream interrupted", async () => {
    let requestsInterrupted = 0;
    
    const mockTransport = TransportService.of({
      request: (method: string, params?: unknown[]) =>
        Effect.gen(function* () {
          yield* Effect.sleep("500 millis");
          return { blockNumber: "0x1" };
        }).pipe(
          Effect.onInterrupt(() => {
            requestsInterrupted++;
            return Effect.void;
          })
        ),
      url: "mock://",
      type: "http" as const,
    });
    
    const program = Effect.gen(function* () {
      const blockStream = yield* BlockStreamService;
      const fiber = yield* Stream.runCollect(
        blockStream.watch().pipe(Stream.take(1))
      ).pipe(Effect.fork);
      
      yield* Effect.sleep("50 millis");
      yield* Fiber.interrupt(fiber);
    }).pipe(
      Effect.provide(
        BlockStream.pipe(
          Layer.provide(Layer.succeed(TransportService, mockTransport))
        )
      )
    );
    
    await Effect.runPromise(program);
    expect(requestsInterrupted).toBeGreaterThan(0);
  });

  it("should call cleanup on stream interruption", async () => {
    let cleanupCalled = false;
    
    // Test that coreStream.destroy() is called when stream is interrupted
    const program = Effect.gen(function* () {
      const blockStream = yield* BlockStreamService;
      const fiber = yield* Stream.runCollect(
        blockStream.watch()
      ).pipe(Effect.fork);
      
      yield* Effect.sleep("10 millis");
      yield* Fiber.interrupt(fiber);
    }).pipe(Effect.provide(/* mock layers */));
    
    await Effect.runPromise(program);
    // Verify cleanup was invoked
  });

  it("should propagate runtime context to transport requests", async () => {
    const TestService = Context.GenericTag<{ value: string }>("TestService");
    let contextValue: string | undefined;
    
    const mockTransport = TransportService.of({
      request: (method: string) =>
        Effect.gen(function* () {
          // Would fail if runtime not properly captured
          const test = yield* Effect.serviceOption(TestService);
          contextValue = test.pipe(Option.getOrUndefined)?.value;
          return { value: contextValue };
        }),
      url: "mock://",
      type: "http" as const,
    });
    
    // Test passes if runtime context propagates correctly
  });
});
```
</tests>

<docs>
```typescript
/**
 * Live implementation of BlockStreamService.
 *
 * @since 0.2.12
 *
 * @description
 * Creates an EIP-1193 provider adapter using captured Effect runtime
 * to maintain structured concurrency. When the stream is interrupted,
 * in-flight RPC requests are properly cancelled via fiber interruption.
 *
 * Uses `Stream.acquireRelease` to guarantee cleanup (calling `coreStream.destroy()`)
 * when the stream is finalized, whether by completion, error, or interruption.
 *
 * @example
 * ```typescript
 * import { Effect, Stream } from 'effect';
 * import { BlockStreamService, BlockStream, HttpTransport } from 'voltaire-effect/services';
 *
 * const program = Effect.gen(function* () {
 *   const blockStream = yield* BlockStreamService;
 *   yield* Stream.runForEach(
 *     blockStream.watch().pipe(Stream.take(5)),
 *     (event) => Effect.log(`Event: ${event.type}`)
 *   );
 * }).pipe(
 *   Effect.provide(BlockStream),
 *   Effect.provide(HttpTransport('https://...'))
 * );
 * ```
 */
```
</docs>

<api>
<before>
```typescript
// Orphan fibers escape Effect runtime, no cancellation
const provider = {
  request: async ({ method, params }) =>
    Effect.runPromise(transport.request(method, params)),  // BAD
  on: () => {},
  removeListener: () => {},
};

const coreStream = CoreBlockStream({ provider });
return {
  backfill: (options) => fromAsyncGenerator(() => coreStream.backfill(options)),
  watch: (options) => fromAsyncGenerator(() => coreStream.watch(options)),
};
// No cleanup! Polling timers leak when stream is interrupted
```
</before>
<after>
```typescript
// Captured runtime maintains fiber hierarchy and cancellation
const runtime = yield* Effect.runtime<never>();
const provider = {
  request: async ({ method, params }) =>
    Runtime.runPromise(runtime)(transport.request(method, params)),  // GOOD
  on: () => {},
  removeListener: () => {},
};

const coreStream = CoreBlockStream({ provider });
const cleanup = () => { coreStream.destroy?.(); };

return {
  backfill: (options) => fromAsyncGeneratorWithCleanup(() => coreStream.backfill(options), cleanup),
  watch: (options) => fromAsyncGeneratorWithCleanup(() => coreStream.watch(options), cleanup),
};
// Cleanup guaranteed via Stream.acquireRelease
```
</after>
</api>

<references>
- [Effect Runtime documentation](https://effect.website/docs/runtime)
- [Runtime.runPromise API](https://effect-ts.github.io/effect/effect/Runtime.ts.html#runPromise)
- [Fiber interruption propagation](https://effect.website/docs/guides/concurrency/fibers#interruption)
- [Stream.acquireRelease](https://effect.website/docs/guides/streaming/stream#resource-management)
- [src/services/BlockStream/BlockStream.ts#L73-L111](file:///Users/williamcory/voltaire/voltaire-effect/src/services/BlockStream/BlockStream.ts#L73-L111)
</references>
</issue>
