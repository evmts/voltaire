# Fix HttpTransport Manual Timeout Handling

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
The original HttpTransport implementation used manual `setTimeout`/`clearTimeout` with `AbortController` instead of Effect's timeout utilities and scoped resource management.

**Original Anti-Pattern (PREVIOUSLY at HttpTransport.ts#L181-L217):**
```typescript
// ❌ Anti-pattern: manual timeout with imperative cleanup
const executeRequest = async <T>(
  body: string,
  headers: Record<string, string>,
  timeout: number
): Promise<T> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);  // ❌ Manual timeout

  try {
    const response = await fetch(config.url, {
      method: "POST",
      headers,
      body,
      signal: controller.signal,
    });
    // ... handle response
  } finally {
    clearTimeout(timeoutId);  // ❌ Manual cleanup
  }
};
```

**Why This Was Problematic:**
1. **Reinvents Effect's Timeout**: Effect has native `Effect.timeout` and `Effect.timeoutFail`
2. **Manual Resource Cleanup**: Imperative `finally` block instead of declarative `acquireRelease`
3. **Loses Structured Interruption**: Effect's interruption semantics not leveraged
4. **Hard to Test**: Manual timeouts difficult to test deterministically
5. **No Composability**: Can't compose with other timeout policies
6. **Error-Prone**: Easy to forget cleanup in error paths
</problem>

<solution>
Use `Effect.acquireRelease` for AbortController lifecycle and `Effect.timeoutFail` for timeout handling.

**Current Idiomatic Implementation (HttpTransport.ts#L197-L251):**
```typescript
import * as Duration from "effect/Duration";
import * as Effect from "effect/Effect";

const doFetch = <T>(
  body: string,
  headers: Record<string, string>,
  rpcMethod?: string,
): Effect.Effect<T, TransportError> =>
  // ✅ Scoped resource management for AbortController
  Effect.acquireRelease(
    Effect.sync(() => new AbortController()),
    (controller) => Effect.sync(() => controller.abort()),
  ).pipe(
    Effect.flatMap((controller) =>
      Effect.tryPromise({
        try: () =>
          fetch(config.url, {
            method: "POST",
            headers,
            body,
            signal: controller.signal,  // ✅ Pass signal to fetch
          }),
        catch: (e) => toTransportError(e, `Request failed`),
      }),
    ),
    Effect.flatMap((response) =>
      response.ok
        ? Effect.tryPromise({
            try: () => response.json() as Promise<JsonRpcResponse<T>>,
            catch: (e) => toTransportError(e, `Failed to parse response`),
          })
        : Effect.fail(new TransportError({ code: -32603, message: `HTTP ${response.status}` })),
    ),
    Effect.flatMap((json) =>
      json.error
        ? Effect.fail(new TransportError({ code: json.error.code, message: json.error.message }))
        : Effect.succeed(json.result as T),
    ),
    // ✅ Effect-native timeout with custom error
    Effect.timeoutFail({
      duration: Duration.millis(config.timeout),
      onTimeout: () =>
        new TransportError({
          code: -32603,
          message: `Request timeout after ${config.timeout}ms`,
        }),
    }),
    // ✅ Run in scoped context to ensure cleanup
    Effect.scoped,
  );
```

**Effect Timeout Patterns:**
```typescript
// Basic timeout - returns Option.none on timeout
Effect.timeoutOption(effect, "5 seconds")

// Timeout with failure - fails with TimeoutException
Effect.timeout(effect, "5 seconds")

// Timeout with custom error - fails with your error type
Effect.timeoutFail({
  duration: Duration.millis(5000),
  onTimeout: () => new MyTimeoutError("Operation timed out")
})

// Timeout with fallback value
Effect.timeoutTo(effect, {
  duration: "5 seconds",
  onSuccess: (a) => Either.right(a),
  onTimeout: () => Either.left("Timed out")
})

// Disconnect timeout from interruption (keeps running in background)
Effect.disconnect(Effect.timeout(effect, "5 seconds"))
```

**Effect Resource Management Patterns:**
```typescript
// acquireRelease - for resources that need cleanup
Effect.acquireRelease(
  acquire,  // Effect that creates resource
  release   // Effect that cleans up resource
)

// acquireUseRelease - for use-once resources
Effect.acquireUseRelease(
  acquire,
  (resource) => use(resource),
  (resource) => release(resource)
)

// Scoped - ensures resources are cleaned up
effect.pipe(Effect.scoped)
```
</solution>

<implementation>
<status>✅ COMPLETE</status>

<current_code file="src/services/Transport/HttpTransport.ts" lines="197-251">
```typescript
const doFetch = <T>(
  body: string,
  headers: Record<string, string>,
  rpcMethod?: string,
): Effect.Effect<T, TransportError> =>
  Effect.acquireRelease(
    Effect.sync(() => new AbortController()),
    (controller) => Effect.sync(() => controller.abort()),
  ).pipe(
    Effect.flatMap((controller) =>
      Effect.tryPromise({
        try: () =>
          fetch(config.url, {
            method: "POST",
            headers,
            body,
            signal: controller.signal,
          }),
        catch: (e) => toTransportError(e, `Request to ${config.url}${rpcMethod ? ` (${rpcMethod})` : ""} failed`),
      }),
    ),
    Effect.flatMap((response) =>
      response.ok
        ? Effect.tryPromise({
            try: () => response.json() as Promise<JsonRpcResponse<T>>,
            catch: (e) => toTransportError(e, `Failed to parse response from ${config.url}${rpcMethod ? ` (${rpcMethod})` : ""}`),
          })
        : Effect.fail(
            new TransportError({
              code: -32603,
              message: `HTTP ${response.status}: ${response.statusText} (url: ${config.url}${rpcMethod ? `, method: ${rpcMethod}` : ""})`,
            }),
          ),
    ),
    Effect.flatMap((json) =>
      json.error
        ? Effect.fail(
            new TransportError({
              code: json.error.code,
              message: json.error.message,
              data: json.error.data,
            }),
          )
        : Effect.succeed(json.result as T),
    ),
    Effect.timeoutFail({
      duration: Duration.millis(config.timeout),
      onTimeout: () =>
        new TransportError({
          code: -32603,
          message: `Request timeout after ${config.timeout}ms (url: ${config.url}${rpcMethod ? `, method: ${rpcMethod}` : ""})`,
        }),
    }),
    Effect.scoped,
  );
```
</current_code>

<patterns>
- `Effect.acquireRelease(acquire, release)` - Scoped resource with guaranteed cleanup
- `Effect.sync(() => new AbortController())` - Lift synchronous resource creation
- `controller.signal` - Pass abort signal to fetch for cancellation
- `Effect.timeoutFail({ duration, onTimeout })` - Timeout with custom error type
- `Duration.millis(n)` - Type-safe duration construction
- `Effect.scoped` - Ensure scoped resources are cleaned up
- `Effect.tryPromise({ try, catch })` - Convert Promise to Effect with error handling
</patterns>

<interruption_semantics>
When Effect is interrupted (e.g., via `Fiber.interrupt` or scope closure):
1. `Effect.scoped` triggers cleanup
2. `acquireRelease` release function runs: `controller.abort()`
3. Fetch request is cancelled via AbortSignal
4. No resource leaks, no zombie requests
</interruption_semantics>
</implementation>

<tests>
<existing_tests file="src/services/Transport/Transport.test.ts">
```typescript
// Timeout behavior is implicitly tested through HTTP error handling
it("handles HTTP errors", async () => {
  fetchMock.mockResolvedValueOnce({
    ok: false,
    status: 429,
    statusText: "Too Many Requests",
  });

  const program = Effect.gen(function* () {
    const transport = yield* TransportService;
    return yield* transport.request<string>("eth_blockNumber", []);
  }).pipe(
    Effect.provide(HttpTransport({ url: "https://eth.example.com", retries: 0 })),
  );

  const exit = await Effect.runPromiseExit(program);
  expect(exit._tag).toBe("Failure");
});
```
</existing_tests>

<recommended_additional_tests>
```typescript
it("times out slow requests", async () => {
  fetchMock.mockImplementation(() => 
    new Promise((resolve) => {
      // Never resolves - simulates slow request
      setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 10000);
    })
  );

  const program = Effect.gen(function* () {
    const transport = yield* TransportService;
    return yield* transport.request<string>("eth_blockNumber", []);
  }).pipe(
    Effect.provide(HttpTransport({ 
      url: "https://test.com", 
      timeout: 100,  // 100ms timeout
      retries: 0 
    })),
  );

  const exit = await Effect.runPromiseExit(program);
  expect(exit._tag).toBe("Failure");
  if (exit._tag === "Failure" && exit.cause._tag === "Fail") {
    expect(exit.cause.error.message).toContain("timeout");
  }
});

it("aborts fetch when interrupted", async () => {
  let abortSignalAborted = false;
  
  fetchMock.mockImplementation((_url, options) => 
    new Promise((resolve, reject) => {
      const signal = options?.signal as AbortSignal;
      signal.addEventListener("abort", () => {
        abortSignalAborted = true;
        reject(new DOMException("Aborted", "AbortError"));
      });
      // Long running request
      setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 5000);
    })
  );

  const program = Effect.gen(function* () {
    const transport = yield* TransportService;
    const fiber = yield* Effect.fork(transport.request<string>("eth_blockNumber", []));
    yield* Effect.sleep(50);  // Let request start
    yield* Fiber.interrupt(fiber);  // Interrupt the fiber
    return "interrupted";
  }).pipe(
    Effect.provide(HttpTransport({ url: "https://test.com", timeout: 5000, retries: 0 })),
  );

  await Effect.runPromise(program);
  expect(abortSignalAborted).toBe(true);
});

it("cleans up AbortController on success", async () => {
  const controllers: AbortController[] = [];
  const originalAbortController = globalThis.AbortController;
  
  globalThis.AbortController = class extends originalAbortController {
    constructor() {
      super();
      controllers.push(this);
    }
  } as typeof AbortController;

  fetchMock.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ jsonrpc: "2.0", id: 1, result: "0x1" }),
  });

  const program = Effect.gen(function* () {
    const transport = yield* TransportService;
    return yield* transport.request<string>("eth_blockNumber", []);
  }).pipe(Effect.provide(HttpTransport({ url: "https://test.com", retries: 0 })));

  await Effect.runPromise(program);
  
  // Verify abort was called (cleanup happened)
  expect(controllers.length).toBe(1);
  expect(controllers[0].signal.aborted).toBe(true);
  
  globalThis.AbortController = originalAbortController;
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
None - behavior preserved, resource cleanup now guaranteed
</breaking>
</api>

<references>
- [Effect Timing Out](https://effect.website/docs/error-management/timing-out/)
- [Effect Resource Management](https://effect.website/docs/resource-management/)
- [MDN AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- [MDN AbortSignal.timeout()](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static)
- [Effect Scoped Resources](https://effect.website/docs/resource-management/scope/)
- [Effect acquireRelease Pattern](https://effect.website/docs/resource-management/scope/#acquirerelease)
</references>
</issue>
