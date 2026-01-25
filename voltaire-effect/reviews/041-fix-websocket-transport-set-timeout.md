# Fix WebSocketTransport setTimeout for Reconnection

## Problem

WebSocketTransport uses raw `setTimeout` for reconnection delays instead of Effect's scheduling primitives.

**Location**: `src/services/Transport/WebSocketTransport.ts#L411`

```typescript
setTimeout(() => {
  reconnect();
}, reconnectDelay);
```

## Why This Matters

- Timer not tracked by Effect runtime
- Cannot be interrupted/cancelled properly
- Escapes structured concurrency
- Not testable with `TestClock`

## Solution

Use `Effect.sleep` with proper scheduling:

```typescript
import * as Effect from "effect/Effect";
import * as Duration from "effect/Duration";
import * as Fiber from "effect/Fiber";

// Store reconnect fiber for cancellation
let reconnectFiber: Fiber.RuntimeFiber<void, never> | null = null;

const scheduleReconnect = Effect.gen(function* () {
  yield* Effect.sleep(Duration.millis(reconnectDelay));
  yield* reconnect;
});

// In disconnect handler:
if (shouldReconnect) {
  reconnectFiber = yield* Effect.fork(scheduleReconnect);
}

// In cleanup:
if (reconnectFiber) {
  yield* Fiber.interrupt(reconnectFiber);
}
```

Or use Effect's retry with schedule:

```typescript
const connectWithRetry = connect.pipe(
  Effect.retry(
    Schedule.exponential(Duration.seconds(1)).pipe(
      Schedule.jittered,
      Schedule.upTo(Duration.minutes(5))
    )
  )
);
```

## Acceptance Criteria

- [ ] Replace `setTimeout` with `Effect.sleep`
- [ ] Use `Duration.millis()` for time values
- [ ] Ensure reconnect can be cancelled
- [ ] All existing tests pass
- [ ] Verify cleanup on transport close

## Priority

**Medium** - Structured concurrency
