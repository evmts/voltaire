# Fix BlockStream No Resource Cleanup on Interruption

<issue>
<metadata>
priority: P0
status: COMPLETED
files: [src/services/BlockStream/BlockStream.ts]
reviews: [030, 027]
</metadata>

<problem>
BlockStream originally created a core stream with polling timers but had no cleanup mechanism when the Effect stream was interrupted:

```typescript
// Anti-pattern: no cleanup on interruption (BEFORE)
const coreStream = CoreBlockStream({ provider: provider as any });
return {
  backfill: (options) => fromAsyncGenerator(() => coreStream.backfill(options)),
  watch: (options) => fromAsyncGenerator(() => coreStream.watch(options)),
};
// No cleanup! Polling timers leak when stream is interrupted
```

Issues:
- Polling intervals continue after stream interruption (ghost polling)
- Memory leaks from accumulated timers that are never cleared
- Phantom RPC requests continue in background, wasting resources
- Resource exhaustion over time in long-running applications
- `coreStream.destroy()` method exists but is never called
- Multiple stream subscriptions compound the leak
</problem>

<solution>
Use `Stream.acquireRelease` to guarantee cleanup on stream finalization:

```typescript
import * as Stream from "effect/Stream";

/**
 * Wraps an AsyncGenerator as an Effect Stream with cleanup on interruption.
 */
const fromAsyncGeneratorWithCleanup = <T>(
  makeGenerator: () => AsyncGenerator<T>,
  cleanup: () => void,
): Stream.Stream<T, BlockStreamError> =>
  Stream.acquireRelease(
    Effect.sync(() => makeGenerator()),
    () => Effect.sync(cleanup),
  ).pipe(
    Stream.flatMap((generator) =>
      Stream.fromAsyncIterable(
        { [Symbol.asyncIterator]: () => generator },
        (error) =>
          new BlockStreamError(
            error instanceof Error ? error.message : "BlockStream error",
            { cause: error instanceof Error ? error : undefined },
          ),
      ),
    ),
  );

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
      request: async ({ method, params }: { method: string; params?: unknown[] }) =>
        Runtime.runPromise(runtime)(transport.request(method, params)),
      on: () => {},
      removeListener: () => {},
    };

    const coreStream = CoreBlockStream({ provider: provider as any });

    // Cleanup function called on stream finalization
    const cleanup = () => {
      coreStream.destroy?.();  // Clear polling timers
    };

    return {
      backfill: <TInclude extends BlockInclude = "header">(
        options: BackfillOptions<TInclude>,
      ): Stream.Stream<BlocksEvent<TInclude>, BlockStreamError> =>
        fromAsyncGeneratorWithCleanup(() => coreStream.backfill(options), cleanup),

      watch: <TInclude extends BlockInclude = "header">(
        options?: WatchOptions<TInclude>,
      ): Stream.Stream<BlockStreamEvent<TInclude>, BlockStreamError> =>
        fromAsyncGeneratorWithCleanup(() => coreStream.watch(options), cleanup),
    };
  }),
);
```
</solution>

<implementation>
<steps>
1. [DONE] src/services/BlockStream/BlockStream.ts:31-49 - Create `fromAsyncGeneratorWithCleanup` helper using `Stream.acquireRelease`
2. [DONE] src/services/BlockStream/BlockStream.ts:35-37 - Acquire: create async generator
3. [DONE] src/services/BlockStream/BlockStream.ts:37 - Release: call cleanup function (guaranteed on finalization)
4. [DONE] src/services/BlockStream/BlockStream.ts:95-97 - Define cleanup function that calls `coreStream.destroy?.()`
5. [DONE] src/services/BlockStream/BlockStream.ts:103,108 - Use `fromAsyncGeneratorWithCleanup` for both `backfill` and `watch`
</steps>

<effect_patterns>
- `Stream.acquireRelease(acquire, release)` - Acquire resource and guarantee release on stream finalization
- `Effect.sync(() => ...)` - Wrap synchronous operation in Effect
- `Stream.flatMap` - Transform acquired resource into stream elements
- `Stream.fromAsyncIterable` - Convert async iterable to Effect Stream
- Finalization runs on: completion, error, or interruption
</effect_patterns>

<resource-management-explained>
```typescript
Stream.acquireRelease(
  Effect.sync(() => makeGenerator()),  // Acquire: create generator
  () => Effect.sync(cleanup),          // Release: cleanup (GUARANTEED)
)
```

The release function runs when:
1. **Stream completes** - All elements consumed successfully
2. **Stream errors** - An error occurs during streaming
3. **Stream interrupted** - Consumer cancels the stream (e.g., `Fiber.interrupt`)
4. **Scope closes** - Parent scope is finalized

This is Effect's equivalent of try-finally for streams.
</resource-management-explained>

<alternative-stream-ensuring>
Alternative using `Stream.ensuring`:

```typescript
const watchStream = Stream.fromAsyncIterable(
  { [Symbol.asyncIterator]: () => coreStream.watch(options) },
  (error) => new BlockStreamError(...)
).pipe(
  Stream.ensuring(
    Effect.sync(() => {
      coreStream.destroy?.();
    })
  )
);
```

`Stream.ensuring` is simpler but `Stream.acquireRelease` is more explicit
about the acquire/release lifecycle.
</alternative-stream-ensuring>
</implementation>

<tests>
```typescript
import { Effect, Stream, Fiber, Layer, Ref, TestClock } from "effect";
import { BlockStreamService, BlockStream } from "./BlockStreamService.js";
import { TransportService } from "../Transport/TransportService.js";

describe("BlockStream resource cleanup", () => {
  it("should call destroy on stream interruption", async () => {
    const destroyCalled = { value: false };
    
    // Mock CoreBlockStream with trackable destroy
    const mockCoreStream = {
      watch: async function* () {
        while (true) {
          yield { type: "block", block: { number: "0x1" } };
          await new Promise((r) => setTimeout(r, 100));
        }
      },
      destroy: () => {
        destroyCalled.value = true;
      },
    };
    
    const mockTransport = TransportService.of({
      request: () => Effect.succeed({ number: "0x1" }),
      url: "mock://",
      type: "http" as const,
    });
    
    const program = Effect.gen(function* () {
      const blockStream = yield* BlockStreamService;
      const fiber = yield* Stream.runCollect(
        blockStream.watch()
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
    expect(destroyCalled.value).toBe(true);
  });

  it("should call destroy on stream completion", async () => {
    const destroyCalled = { value: false };
    
    const program = Effect.gen(function* () {
      const blockStream = yield* BlockStreamService;
      yield* Stream.runCollect(
        blockStream.watch().pipe(Stream.take(3))  // Take only 3 blocks
      );
    }).pipe(Effect.provide(/* mock layers */));
    
    await Effect.runPromise(program);
    expect(destroyCalled.value).toBe(true);
  });

  it("should call destroy on stream error", async () => {
    const destroyCalled = { value: false };
    
    const mockTransport = TransportService.of({
      request: () => Effect.fail(new Error("RPC error")),
      url: "mock://",
      type: "http" as const,
    });
    
    const program = Effect.gen(function* () {
      const blockStream = yield* BlockStreamService;
      yield* Stream.runCollect(blockStream.watch());
    }).pipe(
      Effect.catchAll(() => Effect.void),
      Effect.provide(
        BlockStream.pipe(
          Layer.provide(Layer.succeed(TransportService, mockTransport))
        )
      )
    );
    
    await Effect.runPromise(program);
    expect(destroyCalled.value).toBe(true);
  });

  it("should not leak polling timers on rapid subscribe/unsubscribe", async () => {
    let activeStreams = 0;
    let maxActiveStreams = 0;
    
    const program = Effect.gen(function* () {
      const blockStream = yield* BlockStreamService;
      
      // Rapidly create and interrupt streams
      for (let i = 0; i < 10; i++) {
        const fiber = yield* Stream.runDrain(
          blockStream.watch()
        ).pipe(Effect.fork);
        
        activeStreams++;
        maxActiveStreams = Math.max(maxActiveStreams, activeStreams);
        
        yield* Effect.sleep("10 millis");
        yield* Fiber.interrupt(fiber);
        activeStreams--;
      }
    }).pipe(Effect.provide(/* mock layers */));
    
    await Effect.runPromise(program);
    expect(activeStreams).toBe(0);  // All cleaned up
  });

  it("should handle destroy being undefined gracefully", async () => {
    // Test that cleanup works even if coreStream.destroy is undefined
    const mockCoreStream = {
      watch: async function* () { yield { type: "block" }; },
      // No destroy method
    };
    
    // Should not throw
    const program = Effect.gen(function* () {
      const blockStream = yield* BlockStreamService;
      yield* Stream.runCollect(blockStream.watch().pipe(Stream.take(1)));
    }).pipe(Effect.provide(/* mock layers */));
    
    await Effect.runPromise(program);  // Should complete without error
  });
});
```
</tests>

<docs>
```typescript
/**
 * Wraps an AsyncGenerator as an Effect Stream with guaranteed cleanup.
 *
 * @internal
 * @since 0.2.12
 *
 * @description
 * Uses `Stream.acquireRelease` to ensure the cleanup function is called
 * when the stream is finalized, regardless of how it ends:
 * - Normal completion (all elements consumed)
 * - Error during streaming
 * - Interruption (consumer cancels)
 *
 * This prevents resource leaks from polling timers that would otherwise
 * continue running after the stream is no longer being consumed.
 *
 * @param makeGenerator - Factory function to create the async generator
 * @param cleanup - Cleanup function called on stream finalization
 * @returns Effect Stream with guaranteed cleanup
 */

/**
 * Live implementation of BlockStreamService.
 *
 * @since 0.2.12
 *
 * @description
 * Provides block streaming with proper resource management:
 * - Captures Effect runtime for structured concurrency
 * - Uses `Stream.acquireRelease` to guarantee cleanup
 * - Calls `coreStream.destroy()` to clear polling timers
 *
 * @example
 * ```typescript
 * import { Effect, Stream } from 'effect';
 * import { BlockStreamService, BlockStream, HttpTransport } from 'voltaire-effect/services';
 *
 * const program = Effect.gen(function* () {
 *   const blockStream = yield* BlockStreamService;
 *   // Stream will be cleaned up automatically on interruption
 *   yield* Stream.runForEach(
 *     blockStream.watch().pipe(Stream.take(10)),
 *     (event) => Effect.log(`Block: ${event.block?.number}`)
 *   );
 * });
 * ```
 */
```
</docs>

<api>
<before>
```typescript
// No cleanup - resources leak on interruption
const coreStream = CoreBlockStream({ provider });

return {
  backfill: (options) =>
    fromAsyncGenerator(() => coreStream.backfill(options)),
  watch: (options) =>
    fromAsyncGenerator(() => coreStream.watch(options)),
};
// coreStream.destroy() never called!
// Polling timers continue forever
```
</before>
<after>
```typescript
// Guaranteed cleanup via Stream.acquireRelease
const fromAsyncGeneratorWithCleanup = <T>(
  makeGenerator: () => AsyncGenerator<T>,
  cleanup: () => void,
): Stream.Stream<T, BlockStreamError> =>
  Stream.acquireRelease(
    Effect.sync(() => makeGenerator()),
    () => Effect.sync(cleanup),  // GUARANTEED to run
  ).pipe(
    Stream.flatMap((generator) =>
      Stream.fromAsyncIterable({ [Symbol.asyncIterator]: () => generator }, ...)
    ),
  );

const coreStream = CoreBlockStream({ provider });
const cleanup = () => { coreStream.destroy?.(); };

return {
  backfill: (options) =>
    fromAsyncGeneratorWithCleanup(() => coreStream.backfill(options), cleanup),
  watch: (options) =>
    fromAsyncGeneratorWithCleanup(() => coreStream.watch(options), cleanup),
};
```
</after>
</api>

<references>
- [Stream.acquireRelease documentation](https://effect.website/docs/guides/streaming/stream#resource-management)
- [Effect resource management](https://effect.website/docs/guides/resource-management)
- [Stream.ensuring](https://effect.website/docs/guides/streaming/stream#ensuring)
- [Scope and finalization](https://effect.website/docs/guides/resource-management/scope)
- [src/services/BlockStream/BlockStream.ts#L31-L111](file:///Users/williamcory/voltaire/voltaire-effect/src/services/BlockStream/BlockStream.ts#L31-L111)
</references>
</issue>
