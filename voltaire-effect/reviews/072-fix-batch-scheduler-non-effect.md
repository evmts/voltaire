# Fix BatchScheduler Non-Idiomatic Effect Usage

<issue>
<metadata>
<id>072</id>
<priority>P1</priority>
<category>Effect Anti-Pattern</category>
<module>services/Transport/BatchScheduler.ts</module>
<files>
  - services/Transport/BatchScheduler.ts
</files>
<related_reviews>[077]</related_reviews>
</metadata>

<problem>
BatchScheduler uses imperative async/await patterns with mutable state instead of idiomatic Effect patterns:

```typescript
// ❌ Current: Non-Effect imperative code
let pending: PendingRequest[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let nextId = 1;

const flush = async (): Promise<void> => {
  // ...
  const responses = await Effect.runPromise(send(requests));
  Effect.runSync(Deferred.succeed(req.deferred, response.result));
  // ...
};

const scheduleFlush = (): void => {
  if (!flushTimer) {
    flushTimer = setTimeout(() => flush(), wait);
  }
};
```

**Issues:**
1. **Mutable state** - Uses `let` bindings for `pending`, `flushTimer`, `nextId`
2. **Effect.runPromise inside async** - Breaks Effect's control flow, loses fiber semantics
3. **setTimeout instead of Effect.schedule** - Not interruptible, no fiber control
4. **Effect.runSync for Deferred** - Throws if Effect is async (race condition risk)
5. **No proper cleanup** - Timer not cleaned up in finalizer
</problem>

<effect_pattern>
<name>Request/RequestResolver Pattern</name>
<rationale>
Effect provides first-class support for request batching via `Request` and `RequestResolver`. This pattern:
- Automatically batches concurrent requests in the same tick
- Handles request deduplication
- Provides proper fiber semantics and interruption
- Integrates with Effect's caching system
- Eliminates manual timer and state management
</rationale>
<before>
```typescript
// ❌ Manual batching with mutable state
let pending: Request[] = [];
let timer: Timer | null = null;

const schedule = (req) => {
  pending.push(req);
  if (!timer) {
    timer = setTimeout(flush, wait);
  }
};

const flush = async () => {
  const batch = pending;
  pending = [];
  timer = null;
  await sendBatch(batch);
};
```
</before>
<after>
```typescript
// ✅ Effect RequestResolver pattern
import * as Request from "effect/Request";
import * as RequestResolver from "effect/RequestResolver";

interface GetUser extends Request.Request<User, UserError> {
  readonly _tag: "GetUser";
  readonly id: number;
}

const GetUser = Request.tagged<GetUser>("GetUser");

const UserResolver = RequestResolver.makeBatched(
  (requests: ReadonlyArray<GetUser>) =>
    Effect.gen(function* () {
      const users = yield* fetchUsersBatch(requests.map(r => r.id));
      return requests.map((req, i) => 
        Request.succeed(req, users[i])
      );
    })
);

// Usage - automatically batched
const getUser = (id: number) =>
  Effect.request(GetUser({ id }), UserResolver);

// Concurrent calls are batched
const users = yield* Effect.all([
  getUser(1),
  getUser(2),
  getUser(3),
]); // Single batch call
```
</after>
<effect_docs>https://effect.website/docs/batching-caching</effect_docs>
</effect_pattern>

<effect_pattern>
<name>RequestResolver.batchN for Size Limits</name>
<rationale>
Use `RequestResolver.batchN` to limit batch sizes while still benefiting from automatic batching.
</rationale>
<before>
```typescript
// ❌ Manual batch size limiting
const maxBatchSize = 100;
while (pending.length > 0) {
  const batch = pending.splice(0, maxBatchSize);
  await sendBatch(batch);
}
```
</before>
<after>
```typescript
// ✅ Declarative batch size limit
const resolver = RequestResolver.makeBatched(handleBatch).pipe(
  RequestResolver.batchN(100) // Max 100 per batch
);
```
</after>
<effect_docs>https://effect.website/docs/batching-caching#limiting-batch-size</effect_docs>
</effect_pattern>

<solution>
Replace manual batching with Effect's `RequestResolver.makeBatched`:

```typescript
import * as Request from "effect/Request";
import * as RequestResolver from "effect/RequestResolver";
import * as Effect from "effect/Effect";
import * as Duration from "effect/Duration";
import type { TransportService, TransportError } from "./Transport.js";

// Define JSON-RPC request type
interface JsonRpcBatchRequest extends Request.Request<unknown, TransportError> {
  readonly _tag: "JsonRpcBatchRequest";
  readonly method: string;
  readonly params?: unknown[];
}

const JsonRpcBatchRequest = Request.tagged<JsonRpcBatchRequest>("JsonRpcBatchRequest");

// Options for batching behavior
export interface BatchOptions {
  readonly maxBatchSize?: number;
  readonly maxBatchWait?: Duration.DurationInput;
}

// Create a batched resolver for JSON-RPC
export const createJsonRpcResolver = (
  transport: TransportService,
  options: BatchOptions = {},
) => {
  const maxBatchSize = options.maxBatchSize ?? 100;
  const maxBatchWait = Duration.decode(options.maxBatchWait ?? Duration.millis(0));

  return RequestResolver.makeBatched(
    (requests: ReadonlyArray<JsonRpcBatchRequest>) =>
      Effect.gen(function* () {
        // Build batch request
        const rpcRequests = requests.map((req, id) => ({
          jsonrpc: "2.0" as const,
          id,
          method: req.method,
          params: req.params ?? [],
        }));

        // Send batch to transport
        const responses = yield* transport.request<JsonRpcBatchResponse[]>(
          rpcRequests.length === 1 ? rpcRequests[0] : rpcRequests
        );

        // Match responses to requests
        const responseMap = new Map(
          (Array.isArray(responses) ? responses : [responses])
            .map(r => [r.id, r])
        );

        // Complete each request
        return requests.map((req, i) => {
          const response = responseMap.get(i);
          if (!response) {
            return Request.fail(req, new TransportError({
              code: -32603,
              message: `No response for request ${i}`,
            }));
          }
          if (response.error) {
            return Request.fail(req, new TransportError({
              code: response.error.code,
              message: response.error.message,
              data: response.error.data,
            }));
          }
          return Request.succeed(req, response.result);
        });
      }).pipe(
        // Add batch wait time if configured
        maxBatchWait.millis > 0
          ? Effect.delay(maxBatchWait)
          : (x) => x,
      ),
  ).pipe(
    // Limit batch size
    RequestResolver.batchN(maxBatchSize),
  );
};

// Public API for making batched requests
export const batchedRequest = <T>(
  method: string,
  params?: unknown[],
  resolver: RequestResolver.RequestResolver<JsonRpcBatchRequest>,
) =>
  Effect.request(
    JsonRpcBatchRequest({ method, params }),
    resolver,
  ) as Effect.Effect<T, TransportError>;
```
</solution>

<implementation>
<steps>
1. Remove `BatchScheduler.ts` file with mutable state
2. Create `JsonRpcResolver.ts` with `RequestResolver.makeBatched`
3. Update `TransportService` to use the resolver
4. Remove all setTimeout/setInterval usage
5. Update all callers to use `Effect.request`
6. Add tests for batching behavior
</steps>
<imports>
```typescript
import * as Request from "effect/Request";
import * as RequestResolver from "effect/RequestResolver";
import * as Effect from "effect/Effect";
import * as Duration from "effect/Duration";
```
</imports>
</implementation>

<tests>
```typescript
import { Effect, TestContext } from "effect";
import { describe, it, expect } from "vitest";

describe("JsonRpcResolver", () => {
  it("batches concurrent requests", async () => {
    const calls: unknown[][] = [];
    const mockTransport = {
      request: <T>(req: unknown) => {
        calls.push(Array.isArray(req) ? req : [req]);
        return Effect.succeed(
          Array.isArray(req)
            ? req.map((r: any) => ({ id: r.id, result: `result-${r.id}` }))
            : { id: (req as any).id, result: "result" }
        ) as Effect.Effect<T>;
      },
    };

    const resolver = createJsonRpcResolver(mockTransport);

    const results = await Effect.runPromise(
      Effect.all([
        batchedRequest("method1", [], resolver),
        batchedRequest("method2", [], resolver),
        batchedRequest("method3", [], resolver),
      ])
    );

    expect(calls.length).toBe(1); // Single batched call
    expect(calls[0].length).toBe(3);
    expect(results).toEqual(["result-0", "result-1", "result-2"]);
  });

  it("respects maxBatchSize", async () => {
    const calls: unknown[][] = [];
    const mockTransport = {
      request: <T>(req: unknown) => {
        calls.push(Array.isArray(req) ? req : [req]);
        return Effect.succeed(
          Array.isArray(req)
            ? req.map((r: any) => ({ id: r.id, result: "ok" }))
            : { id: (req as any).id, result: "ok" }
        ) as Effect.Effect<T>;
      },
    };

    const resolver = createJsonRpcResolver(mockTransport, { maxBatchSize: 2 });

    await Effect.runPromise(
      Effect.all([
        batchedRequest("m1", [], resolver),
        batchedRequest("m2", [], resolver),
        batchedRequest("m3", [], resolver),
      ])
    );

    expect(calls.length).toBe(2); // Split into 2 batches
  });

  it("handles errors per request", async () => {
    const mockTransport = {
      request: <T>() =>
        Effect.succeed([
          { id: 0, result: "ok" },
          { id: 1, error: { code: -32600, message: "Invalid" } },
        ]) as Effect.Effect<T>,
    };

    const resolver = createJsonRpcResolver(mockTransport);

    const results = await Effect.runPromise(
      Effect.all([
        batchedRequest("m1", [], resolver).pipe(Effect.either),
        batchedRequest("m2", [], resolver).pipe(Effect.either),
      ])
    );

    expect(results[0]._tag).toBe("Right");
    expect(results[1]._tag).toBe("Left");
  });
});
```
</tests>

<api>
<before>
```typescript
// Imperative API with callbacks
const scheduler = createBatchScheduler(send, { batchSize: 100, wait: 10 });
scheduler.schedule<string>("eth_blockNumber");
```
</before>
<after>
```typescript
// Effect-native API with RequestResolver
const resolver = createJsonRpcResolver(transport, { 
  maxBatchSize: 100,
  maxBatchWait: Duration.millis(10),
});
Effect.request(JsonRpcBatchRequest({ method: "eth_blockNumber" }), resolver);
```
</after>
</api>

<acceptance_criteria>
- [ ] Remove BatchScheduler.ts with mutable state
- [ ] Create JsonRpcResolver with RequestResolver.makeBatched
- [ ] Concurrent requests in same tick are batched
- [ ] maxBatchSize limits batch sizes
- [ ] maxBatchWait adds delay before flush
- [ ] Errors are returned per-request
- [ ] No setTimeout/setInterval usage
- [ ] All tests pass
</acceptance_criteria>

<references>
- [Effect Batching & Caching](https://effect.website/docs/batching-caching)
- [RequestResolver API](https://effect-ts.github.io/effect/effect/RequestResolver.ts.html)
- [Request API](https://effect-ts.github.io/effect/effect/Request.ts.html)
- [RequestResolver.batchN](https://effect.website/docs/batching-caching#limiting-batch-size)
</references>
</issue>
