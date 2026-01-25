# Fix fetchBlock Dead Retry Code

## Problem

`fetchBlock` has a manual retry loop with a `catch` block that **never executes** because Effect errors don't throw - they propagate through the Effect error channel.

**Location**: `src/block/fetchBlock.ts#L55-L97`

```typescript
while (true) {
  try {
    const block = yield* transport.request(...);
    // ...
  } catch (error) {  // ❌ DEAD CODE - Effect errors don't throw!
    attempt++;
    if (attempt >= maxRetries) {
      throw error;
    }
    yield* Effect.sleep(`${delay} millis`);
    delay = Math.min(delay * 2, 30000);
  }
}
```

## Why This Matters

- **No retries are happening** - retry logic never executes
- Transport errors immediately fail the effect
- Users expect retry behavior but don't get it

## Solution

Use `Effect.retry` with exponential backoff schedule:

```typescript
import * as Schedule from "effect/Schedule";
import * as Duration from "effect/Duration";

const fetchAttempt = Effect.gen(function* () {
  const block = yield* transport.request<RpcBlock>("eth_getBlockByNumber", [
    blockTag,
    includeTransactions,
  ]);
  if (block === null) {
    return yield* Effect.fail(new BlockNotFoundError({ blockTag }));
  }
  return yield* formatter.formatBlock(block);
});

return fetchAttempt.pipe(
  Effect.retry(
    Schedule.exponential(Duration.millis(1000)).pipe(
      Schedule.jittered,
      Schedule.upTo(Duration.millis(30000)),
      Schedule.compose(Schedule.recurs(maxRetries))
    )
  )
);
```

## Acceptance Criteria

- [ ] Remove manual `while(true)` loop
- [ ] Remove dead `catch` block
- [ ] Use `Effect.retry` with `Schedule.exponential`
- [ ] Add jitter to prevent thundering herd
- [ ] Cap max delay at 30 seconds
- [ ] All existing tests pass
- [ ] Add test verifying retry behavior

## Priority

**Critical** - Retry logic is completely non-functional
