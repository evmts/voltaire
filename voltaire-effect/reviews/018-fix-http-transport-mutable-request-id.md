# Fix HttpTransport Mutable Request ID

<issue>
<metadata>
priority: P0-Critical
status: ✅ RESOLVED
files:
  - src/services/Transport/HttpTransport.ts
reviews:
  - EFFECT-IDIOMACY-REVIEW.md
</metadata>

<problem>
The original HttpTransport implementation used module-level mutable state `let requestId = 0` instead of Effect's `Ref` for managing request IDs.

**Original Anti-Pattern (PREVIOUSLY at HttpTransport.ts#L179):**
```typescript
// ❌ Anti-pattern: mutable module-level state
let requestId = 0;

return Layer.succeed(TransportService, {
  request: <T>(method: string, params: unknown[] = []) =>
    Effect.gen(function* () {
      const id = ++requestId;  // ❌ Mutation! Not thread-safe
      const body = JSON.stringify({ jsonrpc: "2.0", id, method, params });
      // ...
    }),
});
```

**Why This Was Problematic:**
1. **Shared State Across Layers**: Module-level state is shared across ALL Layer instances, meaning multiple HttpTransport layers would share the same counter
2. **Not Concurrency-Safe**: Increment operation is not atomic; concurrent requests could get duplicate IDs
3. **Breaks Test Isolation**: Tests using different HttpTransport instances would share request ID state
4. **Anti-Pattern in Effect**: Effect emphasizes explicit, managed state through `Ref` for safe concurrent access
5. **Memory Leak Potential**: State persists across application lifetime
</problem>

<solution>
Use `Ref` inside `Layer.effect` for per-layer, concurrency-safe state management.

**Current Idiomatic Implementation (HttpTransport.ts#L343-L368):**
```typescript
import * as Layer from "effect/Layer";
import * as Effect from "effect/Effect";
import * as Ref from "effect/Ref";

return Layer.effect(
  TransportService,
  Effect.gen(function* () {
    // ✅ Each Layer instance gets its own Ref
    const requestIdRef = yield* Ref.make(0);
    
    return TransportService.of({
      request: <T>(method: string, params: unknown[] = []) =>
        // ✅ Atomic update + get in one operation
        Ref.updateAndGet(requestIdRef, (n) => n + 1).pipe(
          Effect.map((id) =>
            JSON.stringify({ jsonrpc: "2.0", id, method, params }),
          ),
          Effect.flatMap((body) => doFetch<T>(body, headers, method)),
          Effect.retry(retrySchedule),
        ),
    });
  }),
);
```

**Effect Ref Patterns:**
- `Ref.make(initial)` - Create a new Ref with initial value
- `Ref.get(ref)` - Read current value
- `Ref.set(ref, value)` - Set new value
- `Ref.update(ref, f)` - Update value with function
- `Ref.updateAndGet(ref, f)` - Update and return new value (atomic)
- `Ref.getAndUpdate(ref, f)` - Get old value and update (atomic)
- `Ref.modify(ref, f)` - Update and return arbitrary value (most flexible)

**Layer.effect vs Layer.succeed:**
```typescript
// Layer.succeed - for static, pure values (no effects needed to construct)
Layer.succeed(MyService, { method: () => Effect.succeed(42) })

// Layer.effect - for values requiring effectful construction (like Ref.make)
Layer.effect(
  MyService,
  Effect.gen(function* () {
    const ref = yield* Ref.make(0);  // Requires effect
    return { method: () => Ref.get(ref) };
  })
)
```
</solution>

<implementation>
<status>✅ COMPLETE</status>

<current_code file="src/services/Transport/HttpTransport.ts" lines="343-368">
```typescript
return Layer.effect(
  TransportService,
  Effect.gen(function* () {
    const requestIdRef = yield* Ref.make(0);

    return TransportService.of({
      request: <T>(
        method: string,
        params: unknown[] = [],
      ): Effect.Effect<T, TransportError> =>
        Ref.updateAndGet(requestIdRef, (n) => n + 1).pipe(
          Effect.map((id) =>
            JSON.stringify({ jsonrpc: "2.0", id, method, params }),
          ),
          Effect.flatMap((body) => {
            const headers: Record<string, string> = {
              "Content-Type": "application/json",
              ...config.headers,
            };
            return doFetch<T>(body, headers, method);
          }),
          Effect.retry(retrySchedule),
        ),
    });
  }),
);
```
</current_code>

<patterns>
- `Layer.effect` - Construct Layer with effectful initialization
- `Ref.make(0)` - Create atomic reference with initial value
- `Ref.updateAndGet(ref, f)` - Atomic update-and-get operation
- `Effect.gen` - Generator-based effect composition
- `TransportService.of({...})` - Type-safe service construction
</patterns>
</implementation>

<tests>
<existing_tests file="src/services/Transport/Transport.test.ts">
```typescript
// Test verifies request ID uniqueness implicitly through successful requests
it("makes JSON-RPC requests", async () => {
  fetchMock.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ jsonrpc: "2.0", id: 1, result: "0x5678" }),
  });

  const program = Effect.gen(function* () {
    const transport = yield* TransportService;
    return yield* transport.request<string>("eth_blockNumber", []);
  }).pipe(
    Effect.provide(HttpTransport({ url: "https://eth.example.com" })),
  );

  const result = await Effect.runPromise(program);
  expect(result).toBe("0x5678");
});
```
</existing_tests>

<recommended_additional_tests>
```typescript
it("generates unique request IDs for concurrent requests", async () => {
  const receivedIds: number[] = [];
  
  fetchMock.mockImplementation(async (_url, options) => {
    const body = JSON.parse(options?.body as string);
    receivedIds.push(body.id);
    return {
      ok: true,
      json: async () => ({ jsonrpc: "2.0", id: body.id, result: "0x1" }),
    };
  });

  const program = Effect.gen(function* () {
    const transport = yield* TransportService;
    // Make 5 concurrent requests
    yield* Effect.all([
      transport.request<string>("eth_blockNumber", []),
      transport.request<string>("eth_blockNumber", []),
      transport.request<string>("eth_blockNumber", []),
      transport.request<string>("eth_blockNumber", []),
      transport.request<string>("eth_blockNumber", []),
    ], { concurrency: "unbounded" });
  }).pipe(Effect.provide(HttpTransport({ url: "https://test.com", retries: 0 })));

  await Effect.runPromise(program);
  
  // All IDs should be unique
  const uniqueIds = new Set(receivedIds);
  expect(uniqueIds.size).toBe(5);
  expect(receivedIds).toEqual([1, 2, 3, 4, 5]);
});

it("isolates request IDs between separate Layer instances", async () => {
  const idsFromTransport1: number[] = [];
  const idsFromTransport2: number[] = [];

  fetchMock.mockImplementation(async (_url, options) => {
    const body = JSON.parse(options?.body as string);
    if (_url === "https://transport1.com") {
      idsFromTransport1.push(body.id);
    } else {
      idsFromTransport2.push(body.id);
    }
    return {
      ok: true,
      json: async () => ({ jsonrpc: "2.0", id: body.id, result: "0x1" }),
    };
  });

  // Two separate transport instances
  const transport1 = HttpTransport({ url: "https://transport1.com", retries: 0 });
  const transport2 = HttpTransport({ url: "https://transport2.com", retries: 0 });

  const program1 = Effect.gen(function* () {
    const transport = yield* TransportService;
    yield* transport.request<string>("eth_blockNumber", []);
    yield* transport.request<string>("eth_blockNumber", []);
  }).pipe(Effect.provide(transport1));

  const program2 = Effect.gen(function* () {
    const transport = yield* TransportService;
    yield* transport.request<string>("eth_blockNumber", []);
  }).pipe(Effect.provide(transport2));

  await Effect.runPromise(program1);
  await Effect.runPromise(program2);

  // Each transport starts from ID 1
  expect(idsFromTransport1).toEqual([1, 2]);
  expect(idsFromTransport2).toEqual([1]);
});
```
</recommended_additional_tests>
</tests>

<docs>
Current JSDoc is comprehensive. No changes needed.
</docs>

<api>
<before>
N/A - Internal implementation detail, no API change
</before>
<after>
N/A - Internal implementation detail, no API change
</after>
<breaking>
None - behavior improved (request IDs now isolated per-layer)
</breaking>
</api>

<references>
- [Effect Ref Documentation](https://effect.website/docs/state-management/ref/)
- [Effect Patterns - Manage Shared State with Ref](https://github.com/PaulJPhilp/EffectPatterns/blob/main/content/published/patterns/concurrency/manage-shared-state-with-ref.mdx)
- [Effect Layer Documentation](https://effect.website/docs/requirements-management/layers/)
- [SynchronizedRef for Complex Updates](https://effect.website/docs/state-management/synchronizedref/)
</references>
</issue>
