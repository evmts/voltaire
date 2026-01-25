# Fix FallbackTransport Mutable Instances Array

**Priority**: High  
**Module**: `services/Transport/FallbackTransport.ts`  
**Category**: Effect Anti-Pattern

## Problem

FallbackTransport uses mutable array and objects outside of Effect, creating race conditions:

```typescript
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
      return [...available].sort((a, b) => a.latency - b.latency);  // Mutates order
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
            // ...
          }),
        }
      }),
  });
};
```

## Issues

1. **Shared mutable state** - `instances` array shared across all requests
2. **Race condition** - Concurrent requests mutate same objects
3. **Layer.succeed with state** - State persists incorrectly across contexts
4. **Non-atomic updates** - failures++ is not atomic

## Solution

Use `Ref` for proper state management:

```typescript
import * as Ref from "effect/Ref";
import * as Array from "effect/Array";

interface TransportState {
  readonly failures: number;
  readonly latency: number;
}

export const FallbackTransport = (
  transports: Layer.Layer<TransportService>[],
  options: FallbackTransportOptions = {},
): Layer.Layer<TransportService> => {
  if (transports.length === 0) {
    return Layer.fail(new TransportError({ code: -32603, message: "No transports provided" }));
  }

  const retryCount = options.retryCount ?? 3;
  const retryDelay = options.retryDelay ?? 150;
  const shouldRank = options.rank ?? false;

  return Layer.effect(
    TransportService,
    Effect.gen(function* () {
      // Initialize state per transport as Ref
      const statesRef = yield* Ref.make(
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

      return {
        request: <T>(method: string, params: unknown[] = []): Effect.Effect<T, TransportError> =>
          Effect.gen(function* () {
            let orderedIndices = yield* getOrderedIndices;

            if (orderedIndices.length === 0) {
              yield* resetAllFailures;
              orderedIndices = yield* getOrderedIndices;
            }

            for (const index of orderedIndices) {
              let attemptsLeft = retryCount;

              while (attemptsLeft > 0) {
                const start = Date.now();

                const result = yield* Effect.gen(function* () {
                  const transport = yield* TransportService;
                  return yield* transport.request<T>(method, params);
                }).pipe(
                  Effect.provide(transports[index]),
                  Effect.tap(() =>
                    updateState(index, () => ({
                      latency: Date.now() - start,
                      failures: 0,
                    }))
                  ),
                  Effect.map((value) => Option.some(value)),
                  Effect.catchAll(() =>
                    Effect.gen(function* () {
                      attemptsLeft--;
                      yield* updateState(index, (s) => ({
                        ...s,
                        failures: s.failures + 1,
                      }));
                      return Option.none<T>();
                    })
                  ),
                );

                if (Option.isSome(result)) {
                  return result.value;
                }

                if (attemptsLeft > 0) {
                  yield* Effect.sleep(Duration.millis(retryDelay));
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
    }),
  );
};
```

## Benefits

- **Fiber-safe** - Ref handles concurrent access
- **Atomic updates** - No race conditions
- **Immutable state transformations** - Pure functions
- **Layer.effect** - Proper layer construction
- **Effect.sleep instead of delay constant** - Uses Duration

## Alternative: Use Effect.retry with Schedule

For even more idiomatic approach, use Effect's built-in retry with fallback:

```typescript
const tryTransport = (index: number) =>
  Effect.gen(function* () {
    const transport = yield* TransportService;
    return yield* transport.request<T>(method, params);
  }).pipe(
    Effect.provide(transports[index]),
    Effect.retry(
      Schedule.recurs(retryCount).pipe(
        Schedule.addDelay(() => Duration.millis(retryDelay)),
      ),
    ),
  );

// Try each transport in sequence
return yield* Effect.firstSuccessOf(
  orderedIndices.map(tryTransport),
);
```

## References

- [Effect Ref](https://effect.website/docs/reference/concurrency/ref)
- [Effect.firstSuccessOf](https://effect-ts.github.io/effect/effect/Effect.ts.html#firstsuccessof)
