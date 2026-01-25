# Fix HttpTransport Mutable Request ID

## Problem

HttpTransport uses module-level mutable state `let requestId = 0` instead of Effect's `Ref`.

**Location**: `src/services/Transport/HttpTransport.ts#L179`

```typescript
// Current: mutable module-level state
let requestId = 0;

return Layer.succeed(TransportService, {
  request: <T>(method: string, params: unknown[] = []) =>
    Effect.gen(function* () {
      const id = ++requestId;  // mutation!
      // ...
    }),
});
```

## Why This Matters

- Mutable state at module level is shared across all Layer instances
- Not concurrency-safe
- Breaks test isolation
- Anti-pattern in Effect-based code

## Solution

Use `Ref` inside `Layer.effect`:

```typescript
export const HttpTransport = (options: HttpTransportConfig | string) =>
  Layer.effect(
    TransportService,
    Effect.gen(function* () {
      const requestIdRef = yield* Ref.make(0);
      
      return TransportService.of({
        request: <T>(method: string, params: unknown[] = []) =>
          Ref.updateAndGet(requestIdRef, (n) => n + 1).pipe(
            Effect.flatMap((id) => {
              const body = JSON.stringify({ jsonrpc: "2.0", id, method, params });
              // ...
            })
          )
      });
    })
  );
```

## Acceptance Criteria

- [ ] Replace `let requestId = 0` with `Ref.make(0)` inside Layer.effect
- [ ] Use `Ref.updateAndGet` to get next ID
- [ ] Each Layer instance has its own counter
- [ ] All existing tests pass

## Priority

**Critical** - Affects correctness and test isolation
