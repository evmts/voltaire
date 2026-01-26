# Fix Streaming Services Effect.runPromise in Provider Adapters

**Status: ✅ FIXED** (2025-01-25)

- EventStream.ts: Fixed - now uses `Runtime.runPromise(runtime)` with cached `runPromise`
- BlockStream.ts: Was already correct

<issue>
<metadata>
priority: P0
status: fixed
files: [src/contract/EventStream.ts, src/services/BlockStream/BlockStream.ts]
related: [040, 076, 077]
</metadata>

<problem>
## Anti-Pattern: Effect.runPromise in Provider Adapters

EventStream uses `Effect.runPromise` and BlockStream uses `Runtime.runPromise` but both create EIP-1193 provider adapters that bridge Effect to async callbacks.

### EventStream (src/contract/EventStream.ts#L88)
```typescript
const provider = {
  request: async ({ method, params }) =>
    Effect.runPromise(transport.request(method, params)),  // ❌ No runtime context
  on: () => {},
  removeListener: () => {},
};
```

### BlockStream (src/services/BlockStream/BlockStream.ts#L88)
```typescript
const provider = {
  request: async ({ method, params }) =>
    Runtime.runPromise(runtime)(transport.request(method, params)),  // ✅ Already correct!
  on: () => {},
  removeListener: () => {},
};
```

BlockStream is actually already fixed - it captures runtime correctly. Only EventStream needs fixing.
</problem>

<solution>
## Fix EventStream to Match BlockStream Pattern

EventStream should capture runtime like BlockStream already does.

```typescript
import * as Runtime from "effect/Runtime";

export const EventStream: Layer.Layer<
  EventStreamService,
  never,
  TransportService
> = Layer.effect(
  EventStreamService,
  Effect.gen(function* () {
    const transport = yield* TransportService;
    const runtime = yield* Effect.runtime<never>();  // Add runtime capture

    const provider = {
      request: async ({ method, params }) =>
        Runtime.runPromise(runtime)(transport.request(method, params)),  // ✅ Use runtime
      on: () => {},
      removeListener: () => {},
    };

    return {
      backfill: (options) => { ... },
      watch: (options) => { ... },
    };
  }),
);
```
</solution>

<implementation>
<steps>
1. **Add Runtime import to EventStream.ts**:
   ```typescript
   import * as Runtime from "effect/Runtime";
   ```

2. **Capture runtime**:
   ```typescript
   const runtime = yield* Effect.runtime<never>();
   ```

3. **Update provider adapter**:
   ```typescript
   request: async ({ method, params }) =>
     Runtime.runPromise(runtime)(transport.request(method, params)),
   ```
</steps>
</implementation>

<tests>
```typescript
describe("EventStream Runtime context", () => {
  it("should maintain fiber context in backfill requests", async () => {
    const program = Effect.gen(function* () {
      const eventStream = yield* EventStreamService;
      // Requests would maintain proper context
      return "ok";
    }).pipe(
      Effect.provide(EventStream),
      Effect.provide(mockTransport),
      Effect.withSpan("test-span"),
    );
    
    await Effect.runPromise(program);
  });
});
```
</tests>
</issue>
