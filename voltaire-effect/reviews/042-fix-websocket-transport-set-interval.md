# Fix WebSocketTransport setInterval for Keepalive

## Problem

WebSocketTransport uses raw `setInterval` for keepalive pings instead of Effect's scheduling.

**Location**: `src/services/Transport/WebSocketTransport.ts#L264`

```typescript
const keepaliveInterval = setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.ping?.();
  }
}, keepaliveMs);
```

## Why This Matters

- Interval not tracked by Effect runtime
- Cannot be cancelled via Effect interruption
- Timer leaks if not manually cleared
- Not testable with `TestClock`

## Solution

Use Effect's `Schedule.spaced` with `Effect.repeat`:

```typescript
import * as Effect from "effect/Effect";
import * as Duration from "effect/Duration";
import * as Schedule from "effect/Schedule";
import * as Fiber from "effect/Fiber";

const keepalive = Effect.gen(function* () {
  if (ws.readyState === WebSocket.OPEN) {
    ws.ping?.();
  }
}).pipe(
  Effect.repeat(Schedule.spaced(Duration.millis(keepaliveMs)))
);

// Fork as scoped fiber - automatically cancelled on scope close
yield* Effect.forkScoped(keepalive);
```

Or use `Effect.schedule`:

```typescript
const keepaliveFiber = yield* pipe(
  sendPing,
  Effect.schedule(Schedule.spaced(Duration.millis(keepaliveMs))),
  Effect.forkScoped
);
// Fiber is automatically interrupted when scope closes
```

## Acceptance Criteria

- [ ] Replace `setInterval` with `Effect.repeat` + `Schedule.spaced`
- [ ] Use `Effect.forkScoped` for automatic cleanup
- [ ] Remove manual `clearInterval` calls
- [ ] All existing tests pass
- [ ] Verify no timer leaks

## Priority

**Medium** - Structured concurrency and resource cleanup
