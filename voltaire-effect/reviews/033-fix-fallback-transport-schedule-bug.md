# Fix FallbackTransport Schedule Pattern

<issue>
<metadata>priority: P1, status: mostly-fixed, updated: 2026-01-26, files: [src/services/Transport/FallbackTransport.ts], reviews: [017-fix-http-transport-manual-retry.md, 043-fix-fallback-transport-mutable-array.md]</metadata>

<problem>
FallbackTransport uses manual retry loop with `Effect.sleep(retryDelay)` instead of Effect's declarative Schedule patterns.

**Location**: `src/services/Transport/FallbackTransport.ts#L154-L183`

```typescript
// Current implementation (works but not idiomatic):
while (attemptsLeft > 0) {
  // ... attempt logic
  if (attemptsLeft > 0) {
    yield* Effect.sleep(retryDelay);  // Manual delay
  }
}
```

**Issues**:
1. Manual retry loop instead of `Effect.retry` with `Schedule`
2. No exponential backoff or jitter for production resilience
3. Mutable `attemptsLeft` counter instead of declarative schedule
4. Manual timing tracking (`Date.now()`) instead of Effect's clock
</problem>

<status_update>
**Current status (2026-01-26)**:
- ✅ Manual retry loop replaced with `Effect.retry` + `Schedule.spaced` in `voltaire-effect/src/services/Transport/FallbackTransport.ts`.
- ✅ Mutable instance state replaced with `Ref` per transport (see review 043 resolution).
- ⚠️ Latency tracking still uses `Date.now()`; consider `Effect.timed` or `Clock` for deterministic testing.
- ⚠️ Retry strategy is fixed-spacing only; no jitter/backoff option exposed yet.

**Follow-up suggestions**:
1. Add optional exponential backoff + jitter configuration (align with viem/production resilience).
2. Add tests that assert retry spacing using `TestClock`, so timing is deterministic.
</status_update>

<solution>
Use `Effect.retry` with `Schedule.spaced` or `Schedule.exponential`:

```typescript
import * as Schedule from "effect/Schedule";
import * as Duration from "effect/Duration";

// Option 1: Fixed delay with retry limit
const retrySchedule = Schedule.spaced(Duration.millis(retryDelay)).pipe(
  Schedule.intersect(Schedule.recurs(retryCount - 1))
);

// Option 2: Exponential backoff with jitter (recommended for production)
const retrySchedule = Schedule.exponential(Duration.millis(retryDelay)).pipe(
  Schedule.jittered,
  Schedule.intersect(Schedule.recurs(retryCount - 1)),
  Schedule.upTo(Duration.seconds(30))  // Cap max delay
);

// Usage
const result = yield* transport.request<T>(method, params).pipe(
  Effect.retry(retrySchedule),
  Effect.catchAll(() => tryNextTransport())
);
```

**Schedule Combinators**:
- `Schedule.spaced(duration)` - Fixed delay between retries
- `Schedule.exponential(base, factor?)` - Exponential backoff (default factor=2)
- `Schedule.recurs(n)` - Limit to n retries
- `Schedule.jittered` - Add random jitter (80%-120% of interval)
- `Schedule.intersect(a, b)` - Continue only if both schedules allow
- `Schedule.upTo(duration)` - Cap maximum delay
</solution>

<implementation>
<steps>
1. Add imports for Schedule and Duration
2. Create composable retry schedule from options
3. Replace manual while loop with Effect.retry
4. Use Effect.timed or Schedule output for latency tracking
5. Update mutable state atomically with SynchronizedRef
6. Add comprehensive retry timing tests
</steps>

<patterns>
```typescript
// Pattern: Declarative retry with Schedule
import * as Schedule from "effect/Schedule";
import * as Duration from "effect/Duration";

// Create schedule from config
const makeRetrySchedule = (retryCount: number, retryDelay: number) =>
  Schedule.exponential(Duration.millis(retryDelay), 1.5).pipe(
    Schedule.jittered,
    Schedule.intersect(Schedule.recurs(retryCount - 1)),
    Schedule.upTo(Duration.seconds(30))
  );

// Apply to transport request
const attemptWithRetry = <T>(
  transport: Layer.Layer<TransportService>,
  method: string,
  params: unknown[],
  schedule: Schedule.Schedule<unknown>
) =>
  Effect.gen(function* () {
    const svc = yield* TransportService;
    return yield* svc.request<T>(method, params);
  }).pipe(
    Effect.provide(transport),
    Effect.retry(schedule)
  );

// Pattern: Latency tracking with Effect.timed
const [duration, result] = yield* transport.request<T>(method, params).pipe(
  Effect.timed
);
instance.latency = Duration.toMillis(duration);

// Pattern: Schedule.recurs vs Schedule.upTo
// recurs(3) = exactly 3 retry attempts (4 total tries)
// upTo("30 seconds") = cap total elapsed time
```
</patterns>
</implementation>

<tests>
```typescript
import { describe, it, expect } from "vitest";
import * as Effect from "effect/Effect";
import * as Duration from "effect/Duration";
import * as TestClock from "effect/TestClock";
import * as Fiber from "effect/Fiber";

describe("FallbackTransport Schedule", () => {
  it("should retry with correct timing", async () => {
    const attempts: number[] = [];
    let attemptCount = 0;
    
    const failingTransport = Layer.succeed(TransportService, {
      request: () => {
        attemptCount++;
        attempts.push(Date.now());
        return Effect.fail(new TransportError({ code: -1 }, "fail"));
      }
    });

    const program = Effect.gen(function* () {
      yield* TransportService.request("eth_blockNumber");
    }).pipe(
      Effect.provide(FallbackTransport([failingTransport], {
        retryCount: 3,
        retryDelay: 100
      })),
      Effect.either
    );

    await Effect.runPromise(program);
    expect(attemptCount).toBe(3);
  });

  it("should use exponential backoff when configured", async () => {
    const delays: number[] = [];
    let lastTime = 0;

    const failingTransport = makeFailingTransport(() => {
      const now = Date.now();
      if (lastTime > 0) delays.push(now - lastTime);
      lastTime = now;
    });

    await Effect.runPromise(
      FallbackTransport([failingTransport], {
        retryCount: 4,
        retryDelay: 100,
        backoff: "exponential"  // Future option
      })
    );

    // Exponential: ~100, ~200, ~400 (with jitter variance)
    expect(delays[1]).toBeGreaterThan(delays[0]);
    expect(delays[2]).toBeGreaterThan(delays[1]);
  });

  it("should respect TestClock for deterministic timing", () =>
    Effect.gen(function* () {
      const fiber = yield* Effect.fork(
        FallbackTransport([failingTransport], { retryDelay: 1000 }).pipe(
          Effect.provide(program)
        )
      );

      // Advance clock to trigger retries
      yield* TestClock.adjust(Duration.seconds(1));
      yield* TestClock.adjust(Duration.seconds(1));

      const result = yield* Fiber.join(fiber);
      expect(result).toBeDefined();
    }).pipe(Effect.runPromise));
});
```
</tests>

<api>
<before>
```typescript
interface FallbackTransportOptions {
  rank?: boolean;
  retryCount?: number;   // Number of retries
  retryDelay?: number;   // Fixed delay in ms
}

// Manual retry loop with Effect.sleep
while (attemptsLeft > 0) {
  yield* Effect.sleep(retryDelay);
}
```
</before>
<after>
```typescript
interface FallbackTransportOptions {
  rank?: boolean;
  retryCount?: number;        // Number of retries
  retryDelay?: number;        // Base delay in ms
  backoff?: "fixed" | "exponential";  // Backoff strategy
  jitter?: boolean;           // Add random jitter
  maxDelay?: number;          // Max delay cap in ms
}

// Declarative retry with Schedule
const schedule = Schedule.exponential(Duration.millis(retryDelay)).pipe(
  Schedule.jittered,
  Schedule.intersect(Schedule.recurs(retryCount - 1))
);

yield* transport.request<T>(method, params).pipe(
  Effect.retry(schedule)
);
```
</after>
</api>

<references>
- [Effect Schedule Built-in](https://effect.website/docs/scheduling/built-in-schedules/)
- [Effect Schedule Combinators](https://effect.website/docs/scheduling/schedule-combinators/)
- [Effect Retrying](https://effect.website/docs/error-management/retrying/)
- [EffectPatterns - Retry Failed Operations](https://github.com/PaulJPhilp/EffectPatterns/blob/main/content/published/patterns/scheduling/scheduling-retry-basics.mdx)
</references>
</issue>
