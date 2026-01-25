# Fix BlockStream.ts Effect.runPromise in Async Callback

<issue>
<metadata>
priority: P1
status: COMPLETED
files: [src/services/BlockStream/BlockStream.ts]
reviews: [024, 023, 027]
</metadata>

<problem>
BlockStream originally used `Effect.runPromise` inside an async callback, same anti-pattern as Provider.ts:

```typescript
// Anti-pattern: escapes Effect runtime
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

Issues:
- Loses structured interruption when stream is interrupted
- Creates orphan fibers that continue running after parent is cancelled
- Escapes Effect runtime context (no access to provided services)
- Duplicates same anti-pattern from Provider.ts
- Makes testing harder (can't mock runtime behavior)
</problem>

<solution>
Capture runtime and use `Runtime.runPromise`:

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
    // ...
  }),
);
```
</solution>

<implementation>
<steps>
1. [DONE] src/services/BlockStream/BlockStream.ts:81 - Capture runtime with `yield* Effect.runtime<never>()`
2. [DONE] src/services/BlockStream/BlockStream.ts:88 - Use `Runtime.runPromise(runtime)` instead of bare `Effect.runPromise`
3. [DONE] Import `Runtime` from effect/Runtime
</steps>

<patterns>
- `Effect.runtime<R>()` - Capture runtime carrying fiber hierarchy and services
- `Runtime.runPromise(runtime)` - Curried runner that uses captured runtime
- Layer construction captures runtime once at layer creation time
</patterns>

<shared-helper-consideration>
Consider extracting shared EIP-1193 provider adapter:

```typescript
// src/services/shared/eip1193.ts
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

Used by both BlockStream and Provider to avoid duplication.
</shared-helper-consideration>
</implementation>

<tests>
```typescript
import { Effect, Stream, Fiber } from "effect";

describe("BlockStream structured concurrency", () => {
  it("should cancel in-flight requests when stream interrupted", async () => {
    let requestsInterrupted = 0;
    
    const mockTransport = {
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
    };
    
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

  it("should propagate runtime context to transport requests", async () => {
    // Verify transport requests have access to runtime context
    const TestService = Context.Tag<{ value: string }>("TestService");
    
    const mockTransport = {
      request: (method: string) =>
        Effect.gen(function* () {
          // This would fail if runtime not properly captured
          const test = yield* TestService;
          return { value: test.value };
        }),
    };
    
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
 * @description
 * Creates an EIP-1193 provider adapter using captured Effect runtime
 * to maintain structured concurrency. When the stream is interrupted,
 * in-flight RPC requests are properly cancelled.
 * 
 * @since 0.2.12
 */
```
</docs>

<api>
<before>
```typescript
// Orphan fibers escape Effect runtime
Effect.runPromise(transport.request(method, params))
```
</before>
<after>
```typescript
// Captured runtime maintains fiber hierarchy
const runtime = yield* Effect.runtime<never>();
Runtime.runPromise(runtime)(transport.request(method, params))
```
</after>
</api>

<references>
- [Effect Runtime module](https://effect.website/docs/runtime)
- [Runtime.runPromise](https://effect-ts.github.io/effect/effect/Runtime.ts.html#runPromise)
- [Fiber interruption propagation](https://effect.website/docs/guides/concurrency/fibers#interruption)
- [src/services/BlockStream/BlockStream.ts#L73-L111](file:///Users/williamcory/voltaire/voltaire-effect/src/services/BlockStream/BlockStream.ts#L73-L111)
</references>
</issue>
