# Fix FallbackTransport Mutable Instances Array

## Problem

FallbackTransport uses a mutable array to track transport instances, which is not Effect-idiomatic and can cause concurrency issues.

**Location**: `src/services/Transport/FallbackTransport.ts#L124`

```typescript
const instances: TransportInstance[] = [];  // Mutable!

// Later mutated:
instances.push(instance);
instances.splice(index, 1);
```

## Why This Matters

- Mutable state is anti-pattern in Effect
- Not concurrency-safe
- State changes not tracked by Effect
- Harder to test and reason about

## Solution

Use `Ref` for managed mutable state:

```typescript
import * as Ref from "effect/Ref";

const FallbackTransport = (
  transports: Layer.Layer<TransportService>[]
): Layer.Layer<TransportService> =>
  Layer.effect(
    TransportService,
    Effect.gen(function* () {
      const instancesRef = yield* Ref.make<TransportInstance[]>([]);

      const addInstance = (instance: TransportInstance) =>
        Ref.update(instancesRef, (arr) => [...arr, instance]);

      const removeInstance = (id: string) =>
        Ref.update(instancesRef, (arr) => arr.filter((i) => i.id !== id));

      const getHealthyInstance = Ref.get(instancesRef).pipe(
        Effect.map((instances) => instances.find((i) => i.healthy))
      );

      return TransportService.of({
        request: <T>(method: string, params?: unknown[]) =>
          Effect.gen(function* () {
            const instance = yield* getHealthyInstance;
            if (!instance) {
              return yield* Effect.fail(new TransportError({ code: -32603, message: "No healthy transports" }));
            }
            return yield* instance.transport.request<T>(method, params);
          }),
      });
    })
  );
```

## Acceptance Criteria

- [ ] Replace mutable array with `Ref<TransportInstance[]>`
- [ ] Use `Ref.update` for modifications
- [ ] Ensure thread-safety for concurrent access
- [ ] All existing tests pass

## Priority

**Medium** - Effect idiom and concurrency safety
