# Fix HttpTransport Manual Retry Loop

## Problem

HttpTransport uses a manual for-loop with mutable `lastError` for retry logic instead of Effect's built-in `Effect.retry` with `Schedule`.

**Location**: `src/services/Transport/HttpTransport.ts#L237-L268`

```typescript
// Current: manual retry loop
let lastError: TransportError = new TransportError({...});
for (let attempt = 0; attempt <= config.retries; attempt++) {
  const result = yield* Effect.tryPromise({...}).pipe(
    Effect.catchAll((err) => {
      lastError = err;
      if (attempt < config.retries) {
        return Effect.as(Effect.sleep(config.retryDelay), undefined as T | undefined);
      }
      return Effect.fail(err);
    }),
  );
  if (result !== undefined) return result;
}
return yield* Effect.fail(lastError);
```

## Why This Matters

- Reinvents what Effect provides natively
- Uses mutable state (`lastError`) which is anti-pattern in Effect
- Uses sentinel value `undefined as T | undefined` which is error-prone
- Harder to compose, test, and extend retry behavior

## Solution

Use `Effect.retry` with `Schedule`:

```typescript
const doRequest = <T>(body: string, headers: Record<string, string>) =>
  Effect.tryPromise({
    try: () => executeRequest<T>(body, headers, config.timeout),
    catch: (e): TransportError => {
      if (e instanceof TransportError) return e;
      if (e instanceof Error && e.name === "AbortError") {
        return new TransportError({
          code: -32603,
          message: `Request timeout after ${config.timeout}ms`,
        });
      }
      return new TransportError({
        code: -32603,
        message: e instanceof Error ? e.message : "Network error",
      });
    },
  });

return TransportService.of({
  request: <T>(method: string, params: unknown[] = []) =>
    Ref.updateAndGet(requestIdRef, (n) => n + 1).pipe(
      Effect.map((id) => JSON.stringify({ jsonrpc: "2.0", id, method, params })),
      Effect.flatMap((body) => doRequest<T>(body, headers)),
      Effect.retry(
        Schedule.recurs(config.retries).pipe(
          Schedule.intersect(Schedule.spaced(Duration.millis(config.retryDelay)))
        )
      )
    )
});
```

## Acceptance Criteria

- [ ] Remove manual for-loop retry
- [ ] Use `Effect.retry` with `Schedule.recurs` + `Schedule.spaced`
- [ ] Remove mutable `lastError` variable
- [ ] Remove sentinel `undefined as T | undefined` pattern
- [ ] All existing tests pass

## Priority

**Critical** - Core infrastructure pattern used throughout library
