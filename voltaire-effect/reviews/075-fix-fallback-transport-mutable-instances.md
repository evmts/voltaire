# Fix FallbackTransport Mutable Instances Array

<issue>
<metadata>
<id>075</id>
<priority>P1</priority>
<category>Effect Anti-Pattern</category>
<module>services/Transport/FallbackTransport.ts</module>
<files>
  - services/Transport/FallbackTransport.ts
</files>
</metadata>

<problem>
FallbackTransport uses mutable array and objects outside of Effect, creating race conditions:

```typescript
// ❌ Current anti-pattern
export const FallbackTransport = (
  transports: Layer.Layer<TransportService>[],
  options: FallbackTransportOptions = {},
): Layer.Layer<TransportService> => {
  // ❌ Mutable array created at layer construction time
  const instances: TransportInstance[] = transports.map((t) => ({
    transport: t,
    failures: 0,       // ❌ Mutable
    latency: Number.POSITIVE_INFINITY,  // ❌ Mutable
  }));

  const getOrderedInstances = (): TransportInstance[] => {
    const available = instances.filter((i) => i.failures < retryCount);
    if (shouldRank) {
      return [...available].sort((a, b) => a.latency - b.latency);
    }
    return available;
  };

  return Layer.succeed(TransportService, {
    request: <T>(method: string, params: unknown[] = []): Effect.Effect<T, TransportError> =>
      Effect.gen(function* () {
        const ordered = getOrderedInstances();
        
        for (const instance of ordered) {
          // ...
          Effect.tap(() => {
            instance.latency = Date.now() - start;  // ❌ Mutation in Effect
            instance.failures = 0;                   // ❌ Mutation in Effect
          }),
          Effect.catchAll(() => {
            instance.failures++;  // ❌ Mutation in Effect
          }),
        }
      }),
  });
};
```

**Issues:**
1. **Shared mutable state** - `instances` array shared across all requests
2. **Race condition** - Concurrent requests mutate same objects
3. **Layer.succeed with state** - State persists incorrectly across contexts
4. **Non-atomic updates** - `failures++` is not atomic
</problem>

<effect_pattern>
<name>Ref for Mutable State in Effects</name>
<rationale>
Use `Ref` for state that needs to be updated within Effect:
- Thread-safe updates via atomic operations
- Immutable state transformations
- Proper scoping with Layer.effect
- No race conditions
</rationale>
<before>
```typescript
// ❌ Mutable object mutation
instance.failures++;
instance.latency = newLatency;
```
</before>
<after>
```typescript
// ✅ Ref with atomic updates
yield* Ref.update(statesRef, (states) =>
  states.map((s, i) => 
    i === index 
      ? { failures: s.failures + 1, latency: s.latency }
      : s
  )
);
```
</after>
<effect_docs>https://effect.website/docs/concurrency/ref</effect_docs>
</effect_pattern>

<effect_pattern>
<name>Effect.firstSuccessOf for Fallback</name>
<rationale>
Use `Effect.firstSuccessOf` for trying multiple operations until one succeeds:
- Declarative fallback logic
- Proper error aggregation
- Short-circuits on first success
</rationale>
<before>
```typescript
// ❌ Manual fallback loop
for (const transport of transports) {
  try {
    return await transport.request(method);
  } catch {
    continue;
  }
}
throw new Error("All failed");
```
</before>
<after>
```typescript
// ✅ Effect.firstSuccessOf
yield* Effect.firstSuccessOf(
  orderedIndices.map((index) => tryTransport(index))
);
```
</after>
<effect_docs>https://effect.website/docs/error-management/fallback#firstsuccessof</effect_docs>
</effect_pattern>

<effect_pattern>
<name>Effect.retry with Schedule</name>
<rationale>
Use Effect's built-in retry with Schedule for retries:
- Declarative retry policies
- Exponential backoff, jitter
- Composable with other schedules
</rationale>
<before>
```typescript
// ❌ Manual retry loop
let attempts = 3;
while (attempts > 0) {
  try {
    return await request();
  } catch {
    attempts--;
    await sleep(1000);
  }
}
```
</before>
<after>
```typescript
// ✅ Effect.retry with Schedule
yield* request.pipe(
  Effect.retry(
    Schedule.recurs(3).pipe(
      Schedule.addDelay(() => Duration.seconds(1))
    )
  )
);
```
</after>
<effect_docs>https://effect.website/docs/scheduling/schedule</effect_docs>
</effect_pattern>

<solution>
Use `Ref` for proper state management with atomic updates:

```typescript
import * as Ref from "effect/Ref";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Duration from "effect/Duration";
import * as Option from "effect/Option";
import * as Schedule from "effect/Schedule";

interface TransportState {
  readonly failures: number;
  readonly latency: number;
}

export interface FallbackTransportOptions {
  readonly retryCount?: number;
  readonly retryDelay?: Duration.DurationInput;
  readonly rank?: boolean;
}

export const FallbackTransport = (
  transports: Layer.Layer<TransportService>[],
  options: FallbackTransportOptions = {},
): Layer.Layer<TransportService, TransportError> => {
  if (transports.length === 0) {
    return Layer.fail(new TransportError({ 
      code: -32603, 
      message: "No transports provided" 
    }));
  }

  const retryCount = options.retryCount ?? 3;
  const retryDelay = Duration.decode(options.retryDelay ?? Duration.millis(150));
  const shouldRank = options.rank ?? false;

  return Layer.effect(
    TransportService,
    Effect.gen(function* () {
      // ✅ Initialize state per transport as Ref
      const statesRef = yield* Ref.make<readonly TransportState[]>(
        transports.map((): TransportState => ({
          failures: 0,
          latency: Number.POSITIVE_INFINITY,
        }))
      );

      const getOrderedIndices = Effect.gen(function* () {
        const states = yield* Ref.get(statesRef);
        const available = states
          .map((state, index) => ({ state, index }))
          .filter(({ state }) => state.failures < retryCount);

        if (shouldRank) {
          return available
            .sort((a, b) => a.state.latency - b.state.latency)
            .map(({ index }) => index);
        }
        return available.map(({ index }) => index);
      });

      const resetAllFailures = Ref.update(statesRef, (states) =>
        states.map((s) => ({ ...s, failures: 0 }))
      );

      const updateState = (
        index: number,
        update: (state: TransportState) => TransportState
      ) =>
        Ref.update(statesRef, (states) =>
          states.map((s, i) => (i === index ? update(s) : s))
        );

      const recordSuccess = (index: number, latency: number) =>
        updateState(index, () => ({ latency, failures: 0 }));

      const recordFailure = (index: number) =>
        updateState(index, (s) => ({ ...s, failures: s.failures + 1 }));

      // Try a single transport with retries
      const tryTransport = <T>(index: number, method: string, params: unknown[]) =>
        Effect.gen(function* () {
          const start = Date.now();
          const transport = yield* TransportService;
          const result = yield* transport.request<T>(method, params);
          yield* recordSuccess(index, Date.now() - start);
          return result;
        }).pipe(
          Effect.provide(transports[index]),
          Effect.retry(
            Schedule.recurs(retryCount - 1).pipe(
              Schedule.addDelay(() => retryDelay)
            )
          ),
          Effect.tapError(() => recordFailure(index)),
        );

      return {
        request: <T>(method: string, params: unknown[] = []): Effect.Effect<T, TransportError> =>
          Effect.gen(function* () {
            let orderedIndices = yield* getOrderedIndices;

            // Reset if all transports exhausted
            if (orderedIndices.length === 0) {
              yield* resetAllFailures;
              orderedIndices = yield* getOrderedIndices;
            }

            // ✅ Try transports in order until one succeeds
            return yield* Effect.firstSuccessOf(
              orderedIndices.map((index) => 
                tryTransport<T>(index, method, params)
              )
            ).pipe(
              Effect.mapError(() =>
                new TransportError({
                  code: -32603,
                  message: `All ${transports.length} transports failed after retries`,
                })
              )
            );
          }),
      };
    }),
  );
};
```
</solution>

<implementation>
<steps>
1. Replace `Layer.succeed` with `Layer.effect`
2. Create `Ref` for transport states instead of mutable array
3. Use `Ref.update` for atomic state changes
4. Use `Effect.retry` with `Schedule` instead of manual loop
5. Use `Effect.firstSuccessOf` for fallback logic
6. Use `Duration` for delay instead of raw milliseconds
</steps>
<imports>
```typescript
import * as Ref from "effect/Ref";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Duration from "effect/Duration";
import * as Option from "effect/Option";
import * as Schedule from "effect/Schedule";
```
</imports>
</implementation>

<tests>
```typescript
import { Effect, Layer, Duration } from "effect";
import { describe, it, expect } from "vitest";

describe("FallbackTransport", () => {
  const createMockTransport = (responses: Record<string, unknown>, delay = 0) =>
    Layer.succeed(TransportService, {
      request: <T>(method: string) =>
        Effect.gen(function* () {
          if (delay > 0) yield* Effect.sleep(Duration.millis(delay));
          const response = responses[method];
          if (response === "FAIL") {
            return yield* Effect.fail(new TransportError({ 
              code: -32603, 
              message: "Mock failure" 
            }));
          }
          return response as T;
        }),
    });

  it("falls back to second transport on first failure", async () => {
    const transport1 = createMockTransport({ test: "FAIL" });
    const transport2 = createMockTransport({ test: "success" });

    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const transport = yield* TransportService;
        return yield* transport.request("test");
      }).pipe(
        Effect.provide(FallbackTransport([transport1, transport2]))
      )
    );

    expect(result).toBe("success");
  });

  it("ranks transports by latency when rank=true", async () => {
    const slowTransport = createMockTransport({ test: "slow" }, 100);
    const fastTransport = createMockTransport({ test: "fast" }, 10);

    const fallback = FallbackTransport(
      [slowTransport, fastTransport],
      { rank: true }
    );

    // First request - both have Infinity latency
    await Effect.runPromise(
      Effect.gen(function* () {
        const transport = yield* TransportService;
        yield* transport.request("test");
      }).pipe(Effect.provide(fallback))
    );

    // Second request - should prefer faster transport
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const transport = yield* TransportService;
        return yield* transport.request("test");
      }).pipe(Effect.provide(fallback))
    );

    // Fast transport should be preferred now
    expect(result).toBe("fast");
  });

  it("retries within transport before fallback", async () => {
    let attempts = 0;
    const flakyTransport = Layer.succeed(TransportService, {
      request: <T>() => {
        attempts++;
        if (attempts < 3) {
          return Effect.fail(new TransportError({ code: -1, message: "flaky" }));
        }
        return Effect.succeed("success" as T);
      },
    });

    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const transport = yield* TransportService;
        return yield* transport.request("test");
      }).pipe(
        Effect.provide(FallbackTransport([flakyTransport], { retryCount: 5 }))
      )
    );

    expect(result).toBe("success");
    expect(attempts).toBe(3);
  });

  it("fails with aggregated error when all fail", async () => {
    const failingTransport = createMockTransport({ test: "FAIL" });

    const exit = await Effect.runPromiseExit(
      Effect.gen(function* () {
        const transport = yield* TransportService;
        return yield* transport.request("test");
      }).pipe(
        Effect.provide(FallbackTransport([failingTransport], { retryCount: 2 }))
      )
    );

    expect(exit._tag).toBe("Failure");
  });

  it("handles concurrent requests without race conditions", async () => {
    let callCount = 0;
    const countingTransport = Layer.succeed(TransportService, {
      request: <T>() => {
        callCount++;
        return Effect.succeed("ok" as T);
      },
    });

    await Effect.runPromise(
      Effect.all(
        Array.from({ length: 100 }, () =>
          Effect.gen(function* () {
            const transport = yield* TransportService;
            return yield* transport.request("test");
          })
        ),
        { concurrency: "unbounded" }
      ).pipe(
        Effect.provide(FallbackTransport([countingTransport]))
      )
    );

    expect(callCount).toBe(100);
  });
});
```
</tests>

<api>
<before>
```typescript
// ❌ Mutable state outside Effect
const instances = transports.map((t) => ({
  transport: t,
  failures: 0,
  latency: Infinity,
}));

// Mutation in Effect
instance.failures++;
instance.latency = Date.now() - start;
```
</before>
<after>
```typescript
// ✅ Ref with atomic updates
const statesRef = yield* Ref.make(
  transports.map(() => ({ failures: 0, latency: Infinity }))
);

// Atomic update
yield* Ref.update(statesRef, (states) =>
  states.map((s, i) => i === index ? update(s) : s)
);
```
</after>
</api>

<acceptance_criteria>
- [ ] Replace mutable array with Ref
- [ ] Use Ref.update for atomic state changes
- [ ] Use Effect.retry with Schedule for retries
- [ ] Use Effect.firstSuccessOf for fallback
- [ ] Use Duration for delays
- [ ] No race conditions under concurrent load
- [ ] Layer.effect instead of Layer.succeed
- [ ] All tests pass
</acceptance_criteria>

<references>
- [Effect Ref](https://effect.website/docs/concurrency/ref)
- [Effect.firstSuccessOf](https://effect.website/docs/error-management/fallback#firstsuccessof)
- [Effect.retry with Schedule](https://effect.website/docs/scheduling/schedule)
- [Duration](https://effect.website/docs/scheduling/duration)
</references>
</issue>
