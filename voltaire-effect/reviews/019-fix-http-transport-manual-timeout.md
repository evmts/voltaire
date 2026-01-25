# Fix HttpTransport Manual Timeout Handling

## Problem

HttpTransport uses manual `setTimeout`/`clearTimeout` with `AbortController` instead of Effect's timeout utilities.

**Location**: `src/services/Transport/HttpTransport.ts#L181-L217`

```typescript
// Current: manual timeout handling
const executeRequest = async <T>(body: string, headers: Record<string, string>, timeout: number): Promise<T> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(config.url, {
      method: "POST",
      headers,
      body,
      signal: controller.signal,
    });
    // ...
  } finally {
    clearTimeout(timeoutId);
  }
};
```

## Why This Matters

- Reinvents Effect's timeout capabilities
- Resource cleanup is manual (not using Effect's scoped resources)
- Loses structured interruption semantics
- Harder to test timeout behavior

## Solution

Use `Effect.timeoutFail` with `Effect.acquireRelease` for the AbortController:

```typescript
const doFetch = <T>(body: string, headers: Record<string, string>) =>
  Effect.acquireRelease(
    Effect.sync(() => new AbortController()),
    (controller) => Effect.sync(() => controller.abort())
  ).pipe(
    Effect.flatMap((controller) =>
      Effect.tryPromise({
        try: () => fetch(config.url, { method: "POST", headers, body, signal: controller.signal }),
        catch: (e) => toTransportError(e)
      })
    ),
    Effect.flatMap((response) =>
      response.ok
        ? Effect.tryPromise({ try: () => response.json() as Promise<JsonRpcResponse<T>>, catch: toTransportError })
        : Effect.fail(new TransportError({ code: -32603, message: `HTTP ${response.status}` }))
    ),
    Effect.flatMap((json) =>
      json.error
        ? Effect.fail(new TransportError({ code: json.error.code, message: json.error.message }))
        : Effect.succeed(json.result as T)
    ),
    Effect.timeoutFail({
      duration: Duration.millis(config.timeout),
      onTimeout: () => new TransportError({ code: -32603, message: `Request timeout after ${config.timeout}ms` })
    }),
    Effect.scoped
  );
```

## Acceptance Criteria

- [ ] Remove manual `setTimeout`/`clearTimeout`
- [ ] Use `Effect.acquireRelease` for AbortController lifecycle
- [ ] Use `Effect.timeoutFail` for timeout handling
- [ ] Use `Duration.millis` for timeout duration
- [ ] AbortController is properly cleaned up on interruption
- [ ] All existing tests pass

## Priority

**Critical** - Core infrastructure with resource management implications
