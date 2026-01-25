# Fix FallbackTransport Schedule Type Bug

## Problem

FallbackTransport uses `Effect.succeed(retryDelay)` where it should use `Schedule.spaced(retryDelay)`, causing retry scheduling to not work.

**Location**: `src/services/Transport/FallbackTransport.ts#L170`

```typescript
// Current (WRONG):
Effect.retry(
  request,
  Effect.succeed(retryDelay)  // ❌ Not a Schedule!
)

// This is equivalent to:
Effect.retry(request, /* not a valid schedule */)
```

## Why This Matters

- Retry scheduling is broken - retries happen immediately or not at all
- `Effect.succeed(number)` is not a valid `Schedule`
- This is likely a runtime type error that TypeScript didn't catch

## Solution

Use `Schedule.spaced`:

```typescript
import * as Schedule from "effect/Schedule";
import * as Duration from "effect/Duration";

Effect.retry(
  request,
  Schedule.spaced(Duration.millis(retryDelay)).pipe(
    Schedule.compose(Schedule.recurs(maxRetries))
  )
)
```

Or for exponential backoff:

```typescript
Effect.retry(
  request,
  Schedule.exponential(Duration.millis(retryDelay)).pipe(
    Schedule.jittered,
    Schedule.compose(Schedule.recurs(maxRetries))
  )
)
```

## Acceptance Criteria

- [ ] Replace `Effect.succeed(retryDelay)` with `Schedule.spaced(...)`
- [ ] Use `Duration.millis()` for time values
- [ ] Add `Schedule.recurs()` to limit retry count
- [ ] Consider adding jitter for production resilience
- [ ] All existing tests pass
- [ ] Add test verifying retry timing

## Priority

**Critical** - Retry mechanism is broken
