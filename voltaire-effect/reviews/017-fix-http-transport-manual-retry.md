# Fix HttpTransport Manual Retry Loop

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
The original HttpTransport implementation used a manual for-loop with mutable `lastError` for retry logic instead of Effect's built-in `Effect.retry` with `Schedule`.

**Original Anti-Pattern (PREVIOUSLY at HttpTransport.ts#L237-L268):**
```typescript
// ❌ Anti-pattern: manual retry loop with mutable state
let lastError: TransportError = new TransportError({...});
for (let attempt = 0; attempt <= config.retries; attempt++) {
  const result = yield* Effect.tryPromise({...}).pipe(
    Effect.catchAll((err) => {
      lastError = err;  // ❌ Mutable state
      if (attempt < config.retries) {
        return Effect.as(Effect.sleep(config.retryDelay), undefined as T | undefined);
      }
      return Effect.fail(err);
    }),
  );
  if (result !== undefined) return result;  // ❌ Sentinel value check
}
return yield* Effect.fail(lastError);
```

**Why This Was Problematic:**
- Reinvented what Effect provides natively with `Effect.retry`
- Used mutable state (`lastError`) which is anti-pattern in Effect
- Used sentinel value `undefined as T | undefined` which is error-prone
- Harder to compose, test, and extend retry behavior
- No support for exponential backoff or complex retry policies
</problem>

<solution>
Use `Effect.retry` with `Schedule` combinators for declarative retry logic.

**Current Idiomatic Implementation (HttpTransport.ts#L253-L255, L364):**
```typescript
import * as Schedule from "effect/Schedule";
import * as Duration from "effect/Duration";

// Define retry schedule once, compose with intersect for spaced delays
const retrySchedule = Schedule.recurs(config.retries).pipe(
  Schedule.intersect(Schedule.spaced(Duration.millis(config.retryDelay))),
);

// Use in request pipeline
return TransportService.of({
  request: <T>(method: string, params: unknown[] = []) =>
    Ref.updateAndGet(requestIdRef, (n) => n + 1).pipe(
      Effect.map((id) => JSON.stringify({ jsonrpc: "2.0", id, method, params })),
      Effect.flatMap((body) => doFetch<T>(body, headers, method)),
      Effect.retry(retrySchedule),  // ✅ Declarative retry
    ),
});
```

**Effect Schedule Patterns:**
- `Schedule.recurs(n)` - Retry n times then stop
- `Schedule.spaced(duration)` - Fixed delay between retries
- `Schedule.exponential(base)` - Exponential backoff: base * 2^n
- `Schedule.jittered` - Add randomness to prevent thundering herd
- `Schedule.intersect` - Combine schedules (both must continue)
- `Schedule.union` - Combine schedules (either can continue)

**Advanced Retry with Exponential Backoff:**
```typescript
const advancedRetrySchedule = Schedule.exponential(Duration.millis(100)).pipe(
  Schedule.intersect(Schedule.recurs(5)),
  Schedule.jittered,
);
```
</solution>

<implementation>
<status>✅ COMPLETE</status>

<current_code file="src/services/Transport/HttpTransport.ts" lines="253-255">
```typescript
const retrySchedule = Schedule.recurs(config.retries).pipe(
  Schedule.intersect(Schedule.spaced(Duration.millis(config.retryDelay))),
);
```
</current_code>

<current_code file="src/services/Transport/HttpTransport.ts" lines="364">
```typescript
Effect.retry(retrySchedule),
```
</current_code>

<patterns>
- `Effect.retry(schedule)` - Retry failed effects according to schedule
- `Schedule.recurs(n)` - Limit retries to n attempts
- `Schedule.spaced(Duration)` - Fixed delay between attempts
- `Schedule.intersect` - Combine schedules with AND logic
- `Duration.millis(n)` - Type-safe duration construction
</patterns>
</implementation>

<tests>
<existing_tests file="src/services/Transport/Transport.test.ts">
```typescript
// Tests retry behavior (lines 227-246)
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
it("retries failed requests up to configured limit", async () => {
  let attempts = 0;
  fetchMock.mockImplementation(() => {
    attempts++;
    if (attempts < 3) {
      return Promise.resolve({ ok: false, status: 500, statusText: "Internal Server Error" });
    }
    return Promise.resolve({
      ok: true,
      json: async () => ({ jsonrpc: "2.0", id: 1, result: "0x1" }),
    });
  });

  const program = Effect.gen(function* () {
    const transport = yield* TransportService;
    return yield* transport.request<string>("eth_blockNumber", []);
  }).pipe(Effect.provide(HttpTransport({ url: "https://test.com", retries: 3, retryDelay: 10 })));

  const result = await Effect.runPromise(program);
  expect(result).toBe("0x1");
  expect(attempts).toBe(3);
});

it("respects retry delay between attempts", async () => {
  const timestamps: number[] = [];
  fetchMock.mockImplementation(() => {
    timestamps.push(Date.now());
    if (timestamps.length < 3) {
      return Promise.resolve({ ok: false, status: 500, statusText: "Error" });
    }
    return Promise.resolve({
      ok: true,
      json: async () => ({ jsonrpc: "2.0", id: 1, result: "0x1" }),
    });
  });

  const program = Effect.gen(function* () {
    const transport = yield* TransportService;
    return yield* transport.request<string>("eth_blockNumber", []);
  }).pipe(Effect.provide(HttpTransport({ url: "https://test.com", retries: 3, retryDelay: 50 })));

  await Effect.runPromise(program);
  expect(timestamps[1] - timestamps[0]).toBeGreaterThanOrEqual(45);
  expect(timestamps[2] - timestamps[1]).toBeGreaterThanOrEqual(45);
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
None - behavior preserved, only implementation improved
</breaking>
</api>

<references>
- [Effect Retry Documentation](https://effect.website/docs/error-management/retrying/)
- [Effect Schedule Combinators](https://effect.website/docs/scheduling/schedule-combinators/)
- [Effect Built-in Schedules](https://effect.website/docs/scheduling/built-in-schedules/)
- [Effect Patterns Hub - Retry](https://github.com/PaulJPhilp/EffectPatterns)
</references>
</issue>
