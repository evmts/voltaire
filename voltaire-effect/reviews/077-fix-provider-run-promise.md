# Fix Provider watchBlocks/backfillBlocks Runtime.runPromise

**Status: ✅ ALREADY CORRECT** (2025-01-25)

Provider.ts was already using the correct pattern (`Runtime.runPromise(runtime)` with captured runtime).
Review kept for documentation of the pattern.

<issue>
<metadata>
priority: P1
status: not-an-issue
files: [src/services/Provider/Provider.ts]
related: [040, 076, 078]
</metadata>

<problem>
## Pattern Analysis: Runtime.runPromise in Provider Stream Methods

Provider.ts uses `Runtime.runPromise(runtime)` in `watchBlocks` and `backfillBlocks` methods at lines 577 and 608.

```typescript
watchBlocks: <TInclude extends BlockInclude = "header">(
  options?: WatchOptions<TInclude>,
): Stream.Stream<BlockStreamEvent<TInclude>, ProviderError> =>
  Stream.unwrap(
    Effect.gen(function* () {
      const runtime = yield* Effect.runtime<never>();  // ✅ Captures runtime
      const provider = {
        request: async ({ method, params }) =>
          Runtime.runPromise(runtime)(transport.request(method, params)),  // Uses captured runtime
        on: () => {},
        removeListener: () => {},
      };
      // ...
    }),
  ),
```

### Assessment

This is actually **correctly implemented**:
1. Runtime is captured via `yield* Effect.runtime<never>()`
2. `Runtime.runPromise(runtime)` is used (not `Effect.runPromise`)
3. Context is preserved through the captured runtime

However, there's code duplication - both `watchBlocks` and `backfillBlocks` duplicate the provider creation logic. This should be refactored to share the provider.
</problem>

<solution>
## Refactor: Share Provider Between Stream Methods

Instead of creating the provider inside each stream method, create it once at the service level.

```typescript
export const Provider: Layer.Layer<
  ProviderService,
  never,
  TransportService
> = Layer.effect(
  ProviderService,
  Effect.gen(function* () {
    const transport = yield* TransportService;
    const runtime = yield* Effect.runtime<never>();

    // Shared provider adapter for all stream methods
    const streamProvider = {
      request: async ({ method, params }: { method: string; params?: unknown[] }) =>
        Runtime.runPromise(runtime)(transport.request(method, params)),
      on: () => {},
      removeListener: () => {},
    };

    const coreBlockStream = CoreBlockStream({ provider: streamProvider as any });

    return {
      // ... other methods ...

      watchBlocks: <TInclude extends BlockInclude = "header">(
        options?: WatchOptions<TInclude>,
      ): Stream.Stream<BlockStreamEvent<TInclude>, ProviderError> =>
        Stream.fromAsyncIterable(
          { [Symbol.asyncIterator]: () => coreBlockStream.watch(options) },
          (error) =>
            new ProviderError(
              { method: "watchBlocks", options },
              error instanceof Error ? error.message : "BlockStream error",
              { cause: error instanceof Error ? error : undefined },
            ),
        ),

      backfillBlocks: <TInclude extends BlockInclude = "header">(
        options: BackfillOptions<TInclude>,
      ): Stream.Stream<BlocksEvent<TInclude>, ProviderError> =>
        Stream.fromAsyncIterable(
          { [Symbol.asyncIterator]: () => coreBlockStream.backfill(options) },
          (error) =>
            new ProviderError(
              { method: "backfillBlocks", options },
              error instanceof Error ? error.message : "BlockStream error",
              { cause: error instanceof Error ? error : undefined },
            ),
        ),
    };
  }),
);
```

### Benefits
1. Single runtime capture point
2. Shared provider adapter
3. Less code duplication
4. Single CoreBlockStream instance
</solution>

<implementation>
<steps>
1. **Move runtime capture to top of Effect.gen**
2. **Create shared streamProvider once**
3. **Create coreBlockStream once** 
4. **Simplify watchBlocks and backfillBlocks to just return streams**
5. **Remove Stream.unwrap and inner Effect.gen**
</steps>
</implementation>
</issue>
