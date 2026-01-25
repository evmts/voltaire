# Use Effect Duration Consistently

**Priority**: Low  
**Module**: All services  
**Category**: Effect Idiomatic

## Problem

Timeouts and delays use raw milliseconds instead of Effect's `Duration`:

```typescript
// Current: Raw milliseconds
interface HttpTransportConfig {
  timeout?: number;        // ❌ What unit? ms? seconds?
  retries?: number;
  retryDelay?: number;     // ❌ Unclear unit
}

const config = {
  timeout: 30000,          // Magic number
  retryDelay: 1000,        // Magic number
};

Effect.timeoutFail({
  duration: Duration.millis(config.timeout),  // Must convert
  onTimeout: () => new Error("timeout"),
});
```

## Issues

1. **Unclear units** - Is `1000` milliseconds or seconds?
2. **Magic numbers** - Hard to understand at a glance
3. **Conversion required** - Must wrap in Duration.millis
4. **Inconsistent** - Some places use Duration, others don't

## Solution

Use `Duration` throughout the API:

```typescript
import * as Duration from "effect/Duration";

// Config with Duration
interface HttpTransportConfig {
  url: string;
  timeout?: Duration.DurationInput;    // ✅ Clear type
  retries?: number;
  retryDelay?: Duration.DurationInput; // ✅ Clear type
}

// DurationInput accepts many formats:
// - Duration.seconds(30)
// - Duration.millis(30000)
// - "30 seconds"
// - 30000 (milliseconds)

export const HttpTransport = (
  options: HttpTransportConfig | string,
): Layer.Layer<TransportService> => {
  const config =
    typeof options === "string"
      ? {
          url: options,
          timeout: Duration.seconds(30),    // ✅ Self-documenting
          retries: 3,
          retryDelay: Duration.seconds(1),  // ✅ Self-documenting
        }
      : {
          url: options.url,
          timeout: Duration.decode(options.timeout ?? Duration.seconds(30)),
          retries: options.retries ?? 3,
          retryDelay: Duration.decode(options.retryDelay ?? Duration.seconds(1)),
        };

  // Use directly - no conversion needed
  Effect.timeoutFail({
    duration: config.timeout,  // ✅ Already Duration
    onTimeout: () => new TransportError({ code: -32603, message: "timeout" }),
  });
};
```

## Usage Examples

```typescript
// All these are equivalent:
HttpTransport({ url: "https://...", timeout: Duration.seconds(30) });
HttpTransport({ url: "https://...", timeout: Duration.millis(30000) });
HttpTransport({ url: "https://...", timeout: "30 seconds" });
HttpTransport({ url: "https://...", timeout: 30000 }); // milliseconds

// Readable timeouts
HttpTransport({
  url: "https://...",
  timeout: Duration.minutes(2),      // ✅ Clear: 2 minutes
  retryDelay: Duration.seconds(5),   // ✅ Clear: 5 seconds
});
```

## Duration Arithmetic

```typescript
// Combine durations
const baseDelay = Duration.seconds(1);
const maxDelay = Duration.seconds(30);
const exponentialDelay = (attempt: number) =>
  Duration.min(
    Duration.times(baseDelay, Math.pow(2, attempt)),
    maxDelay,
  );

// Compare durations
if (Duration.greaterThan(elapsed, timeout)) {
  // ...
}

// Convert when needed (for external APIs)
const timeoutMs = Duration.toMillis(config.timeout);
```

## Schedule with Duration

```typescript
// Retry schedule with Duration
const retrySchedule = Schedule.exponential(Duration.seconds(1)).pipe(
  Schedule.intersect(
    Schedule.recurs(config.retries),
  ),
  Schedule.upTo(Duration.minutes(5)),  // Max total time
);

// Polling with Duration
const pollSchedule = Schedule.spaced(Duration.seconds(12));

// Jitter
const jitteredSchedule = Schedule.exponential(Duration.seconds(1)).pipe(
  Schedule.jittered,  // Adds random jitter
);
```

## Config with Duration

```typescript
import * as Config from "effect/Config";

const HttpTransportConfig = Config.all({
  url: Config.string("url"),
  timeout: Config.duration("timeout").pipe(
    Config.withDefault(Duration.seconds(30)),
  ),
  retryDelay: Config.duration("retryDelay").pipe(
    Config.withDefault(Duration.seconds(1)),
  ),
});

// Environment: HTTP_TIMEOUT=30s, HTTP_RETRY_DELAY=1s
```

## Benefits

1. **Self-documenting** - `Duration.seconds(30)` vs `30000`
2. **Type-safe** - Can't pass string where Duration expected
3. **Arithmetic** - Add, multiply, compare durations
4. **Flexible input** - Accept strings like "30 seconds"
5. **No conversion** - Use directly with Effect APIs

## Migration

1. Change config types: `timeout?: number` → `timeout?: Duration.DurationInput`
2. Update defaults: `30000` → `Duration.seconds(30)`
3. Remove conversions: `Duration.millis(config.timeout)` → `config.timeout`
4. Use `Duration.decode()` for input normalization

## References

- [Effect Duration](https://effect.website/docs/guides/scheduling/duration)
- [Duration API](https://effect-ts.github.io/effect/effect/Duration.ts.html)
