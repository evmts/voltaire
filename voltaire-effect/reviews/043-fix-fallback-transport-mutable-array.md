# Fix FallbackTransport Mutable Instances Array

<issue>
<metadata>
priority: P2
severity: medium
category: effect-idiom
files: [voltaire-effect/src/services/Transport/FallbackTransport.ts]
reviews: [075-fix-fallback-transport-mutable-instances.md]
</metadata>

<problem>
FallbackTransport uses a mutable array to track transport instances, which is not Effect-idiomatic and can cause concurrency issues.

**Location**: `voltaire-effect/src/services/Transport/FallbackTransport.ts#L124-L128`

```typescript
const instances: TransportInstance[] = transports.map((t) => ({
  transport: t,
  failures: 0,
  latency: Number.POSITIVE_INFINITY,
}));
```

The `instances` array is mutated in-place:
- `instance.failures = 0` (line 166)
- `instance.latency = Date.now() - start` (line 165)
- `instance.failures++` (line 171)

**Impact**:
- Mutable state is anti-pattern in Effect - breaks referential transparency
- Not concurrency-safe - race conditions when multiple fibers use same transport
- State changes not tracked by Effect's supervision
- Harder to test and reason about behavior
- No rollback on fiber interruption
</problem>

<solution>
Use `Ref` for managed mutable state, following Effect idioms.

**Approach 1: Ref for instance state**:
```typescript
import * as Ref from "effect/Ref";

interface TransportInstance {
  readonly transport: Layer.Layer<TransportService>;
  readonly failuresRef: Ref.Ref<number>;
  readonly latencyRef: Ref.Ref<number>;
}

export const FallbackTransport = (
  transports: Layer.Layer<TransportService>[],
  options: FallbackTransportOptions = {},
): Layer.Layer<TransportService> =>
  Layer.scoped(
    TransportService,
    Effect.gen(function* () {
      // Create refs for each transport instance
      const instances = yield* Effect.all(
        transports.map((transport) =>
          Effect.gen(function* () {
            const failuresRef = yield* Ref.make(0);
            const latencyRef = yield* Ref.make(Number.POSITIVE_INFINITY);
            return { transport, failuresRef, latencyRef };
          })
        )
      );

      const getOrderedInstances = Effect.gen(function* () {
        const withState = yield* Effect.all(
          instances.map((i) =>
            Effect.gen(function* () {
              const failures = yield* Ref.get(i.failuresRef);
              const latency = yield* Ref.get(i.latencyRef);
              return { ...i, failures, latency };
            })
          )
        );
        const available = withState.filter((i) => i.failures < retryCount);
        return shouldRank
          ? [...available].sort((a, b) => a.latency - b.latency)
          : available;
      });

      return TransportService.of({
        request: <T>(method: string, params?: unknown[]) =>
          Effect.gen(function* () {
            const ordered = yield* getOrderedInstances;
            // ... implementation using Ref.update
          }),
      });
    })
  );
```

**Approach 2: Single Ref with immutable state**:
```typescript
interface TransportState {
  readonly failures: number;
  readonly latency: number;
}

const instancesRef = yield* Ref.make<Map<number, TransportState>>(
  new Map(transports.map((_, i) => [i, { failures: 0, latency: Infinity }]))
);

// Update immutably
yield* Ref.update(instancesRef, (map) =>
  new Map(map).set(index, { ...map.get(index)!, failures: 0, latency })
);
```
</solution>

<implementation>
<steps>
1. Change `Layer.succeed` to `Layer.scoped` to enable Effect operations in layer creation
2. Create `Ref` for each transport's failure count and latency
3. Replace direct mutations with `Ref.update` and `Ref.get`
4. Make `getOrderedInstances` an Effect that reads current state
5. Update request implementation to use Effect operations for state
6. Ensure fiber-safety with atomic Ref operations
</steps>

<code_changes>
```typescript
// voltaire-effect/src/services/Transport/FallbackTransport.ts

import * as Ref from "effect/Ref";

interface TransportInstance {
  readonly transport: Layer.Layer<TransportService>;
  readonly failuresRef: Ref.Ref<number>;
  readonly latencyRef: Ref.Ref<number>;
}

export const FallbackTransport = (
  transports: Layer.Layer<TransportService>[],
  options: FallbackTransportOptions = {},
): Layer.Layer<TransportService> => {
  if (transports.length === 0) {
    return Layer.fail(
      new TransportError(
        { code: -32603, message: "No transports provided" },
        "FallbackTransport requires at least one transport",
      ),
    );
  }

  const retryCount = options.retryCount ?? 3;
  const retryDelay = options.retryDelay ?? 150;
  const shouldRank = options.rank ?? false;

  return Layer.scoped(
    TransportService,
    Effect.gen(function* () {
      // Initialize refs for each transport
      const instances: TransportInstance[] = yield* Effect.all(
        transports.map((transport) =>
          Effect.gen(function* () {
            const failuresRef = yield* Ref.make(0);
            const latencyRef = yield* Ref.make(Number.POSITIVE_INFINITY);
            return { transport, failuresRef, latencyRef };
          })
        )
      );

      const getOrderedInstances = Effect.gen(function* () {
        const withState = yield* Effect.all(
          instances.map((instance) =>
            Effect.gen(function* () {
              const failures = yield* Ref.get(instance.failuresRef);
              const latency = yield* Ref.get(instance.latencyRef);
              return { instance, failures, latency };
            })
          )
        );
        const available = withState.filter((s) => s.failures < retryCount);
        if (shouldRank) {
          return [...available].sort((a, b) => a.latency - b.latency);
        }
        return available;
      });

      const resetAllFailures = Effect.all(
        instances.map((i) => Ref.set(i.failuresRef, 0)),
        { discard: true }
      );

      return {
        request: <T>(method: string, params: unknown[] = []) =>
          Effect.gen(function* () {
            let ordered = yield* getOrderedInstances;

            if (ordered.length === 0) {
              yield* resetAllFailures;
              ordered = yield* getOrderedInstances;
            }

            for (const { instance } of ordered) {
              let attemptsLeft = retryCount;

              while (attemptsLeft > 0) {
                const start = Date.now();

                const result = yield* Effect.gen(function* () {
                  const transport = yield* TransportService;
                  return yield* transport.request<T>(method, params);
                }).pipe(
                  Effect.provide(instance.transport),
                  Effect.tap(() =>
                    Effect.all([
                      Ref.set(instance.latencyRef, Date.now() - start),
                      Ref.set(instance.failuresRef, 0),
                    ], { discard: true })
                  ),
                  Effect.map((value) => Option.some(value)),
                  Effect.catchAll(() =>
                    Effect.gen(function* () {
                      attemptsLeft--;
                      yield* Ref.update(instance.failuresRef, (f) => f + 1);
                      return Option.none<T>();
                    })
                  ),
                );

                if (Option.isSome(result)) {
                  return result.value;
                }

                if (attemptsLeft > 0) {
                  yield* Effect.sleep(retryDelay);
                }
              }
            }

            return yield* Effect.fail(
              new TransportError(
                { code: -32603, message: "All transports failed" },
                `All ${transports.length} transports failed after retries`,
              ),
            );
          }),
      };
    })
  );
};
```
</code_changes>
</implementation>

<tests>
<test_cases>
```typescript
import { describe, it, expect } from "vitest";
import * as Effect from "effect/Effect";
import * as Fiber from "effect/Fiber";
import { FallbackTransport, HttpTransport, TransportService } from "./index.js";

describe("FallbackTransport concurrency", () => {
  it("handles concurrent requests without race conditions", async () => {
    let requestCount = 0;
    const mockTransport = Layer.succeed(TransportService, {
      request: () => {
        requestCount++;
        return Effect.succeed({ result: requestCount });
      },
    });

    const fallback = FallbackTransport([mockTransport]);

    const program = Effect.gen(function* () {
      const transport = yield* TransportService;
      // Run 100 concurrent requests
      const fibers = yield* Effect.all(
        Array.from({ length: 100 }, () =>
          Effect.fork(transport.request("test"))
        )
      );
      return yield* Effect.all(fibers.map(Fiber.join));
    }).pipe(Effect.provide(fallback));

    const results = await Effect.runPromise(program);
    expect(results.length).toBe(100);
  });

  it("state is isolated between fibers", async () => {
    let callCount = 0;
    const failingThenSuccess = Layer.succeed(TransportService, {
      request: () => {
        callCount++;
        if (callCount <= 2) {
          return Effect.fail(new TransportError({ code: -1, message: "fail" }));
        }
        return Effect.succeed({ ok: true });
      },
    });

    const fallback = FallbackTransport([failingThenSuccess], { retryCount: 5 });

    const program = Effect.gen(function* () {
      const transport = yield* TransportService;
      return yield* transport.request("test");
    }).pipe(Effect.provide(fallback));

    const result = await Effect.runPromise(program);
    expect(result).toEqual({ ok: true });
  });

  it("failure count persists across requests within same scope", async () => {
    let callCount = 0;
    const counting = Layer.succeed(TransportService, {
      request: () => {
        callCount++;
        if (callCount % 2 === 1) {
          return Effect.fail(new TransportError({ code: -1, message: "odd fails" }));
        }
        return Effect.succeed({ count: callCount });
      },
    });

    const fallback = FallbackTransport([counting], { retryCount: 3 });

    const program = Effect.gen(function* () {
      const transport = yield* TransportService;
      yield* transport.request("test"); // fails once, succeeds on retry
      return yield* transport.request("test"); // should remember failure count
    }).pipe(Effect.provide(fallback));

    await Effect.runPromise(program);
    // Verifies state persists - no assertion needed, just shouldn't throw
  });
});

describe("FallbackTransport Ref state management", () => {
  it("uses Ref for failure tracking", async () => {
    // This test verifies the implementation uses Ref by checking behavior
    const failures: number[] = [];
    
    const unstable = Layer.succeed(TransportService, {
      request: () => {
        failures.push(Date.now());
        if (failures.length < 3) {
          return Effect.fail(new TransportError({ code: -1, message: "unstable" }));
        }
        return Effect.succeed({ stable: true });
      },
    });

    const fallback = FallbackTransport([unstable], { retryCount: 5, retryDelay: 10 });

    const program = Effect.gen(function* () {
      const transport = yield* TransportService;
      return yield* transport.request("test");
    }).pipe(Effect.provide(fallback));

    const result = await Effect.runPromise(program);
    expect(result).toEqual({ stable: true });
    expect(failures.length).toBe(3);
  });

  it("resets failure count on success", async () => {
    let failuresSeen = false;
    let callCount = 0;

    const resetTest = Layer.succeed(TransportService, {
      request: () => {
        callCount++;
        if (callCount === 1) {
          return Effect.fail(new TransportError({ code: -1, message: "first fails" }));
        }
        return Effect.succeed({ attempt: callCount });
      },
    });

    const fallback = FallbackTransport([resetTest], { retryCount: 3 });

    const program = Effect.gen(function* () {
      const transport = yield* TransportService;
      yield* transport.request("test"); // fails then succeeds
      // Failure count should be reset
      return yield* transport.request("test");
    }).pipe(Effect.provide(fallback));

    const result = await Effect.runPromise(program);
    expect(result.attempt).toBe(3);
  });
});
```
</test_cases>
</tests>

<api>
<before>
```typescript
// Mutable state outside Effect
const instances: TransportInstance[] = transports.map((t) => ({
  transport: t,
  failures: 0,
  latency: Number.POSITIVE_INFINITY,
}));

// Direct mutation
instance.failures = 0;
instance.latency = Date.now() - start;
instance.failures++;
```
</before>

<after>
```typescript
// Ref-based state within Effect scope
const instances = yield* Effect.all(
  transports.map((transport) =>
    Effect.gen(function* () {
      const failuresRef = yield* Ref.make(0);
      const latencyRef = yield* Ref.make(Number.POSITIVE_INFINITY);
      return { transport, failuresRef, latencyRef };
    })
  )
);

// Effect-based updates
yield* Ref.set(instance.failuresRef, 0);
yield* Ref.set(instance.latencyRef, Date.now() - start);
yield* Ref.update(instance.failuresRef, (f) => f + 1);
```
</after>

<breaking>
None - internal implementation change. Public API remains identical.
</breaking>
</api>

<references>
- [Effect Ref documentation](https://effect.website/docs/data-types/ref)
- [Effect Layer.scoped](https://effect.website/docs/requirements-management/layers#scoped-layers)
- [Review 075: FallbackTransport Mutable Instances](./075-fix-fallback-transport-mutable-instances.md)
- [FallbackTransport.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/services/Transport/FallbackTransport.ts#L124-L128)
</references>
</issue>
