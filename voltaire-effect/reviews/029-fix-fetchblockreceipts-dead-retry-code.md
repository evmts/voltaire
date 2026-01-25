# Fix fetchBlockReceipts Dead Retry Code

## Problem

`fetchSingleReceipt` in `fetchBlockReceipts.ts` has the same dead retry code pattern as `fetchBlock` - the `catch` block never executes.

**Location**: `src/block/fetchBlockReceipts.ts#L106-L130`

```typescript
while (true) {
  try {
    const receipt = yield* transport.request(...);
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

- Receipt fetching has no retry logic despite code suggesting it does
- Individual receipt failures immediately fail the entire batch
- Transient network errors cause unnecessary failures

## Solution

Use `Effect.retry` with schedule:

```typescript
const fetchSingleReceipt = (txHash: string) =>
  transport.request<RpcReceipt>("eth_getTransactionReceipt", [txHash]).pipe(
    Effect.flatMap((receipt) =>
      receipt === null
        ? Effect.fail(new ReceiptNotFoundError({ txHash }))
        : Effect.succeed(receipt)
    ),
    Effect.retry(
      Schedule.exponential(Duration.millis(1000)).pipe(
        Schedule.jittered,
        Schedule.upTo(Duration.millis(30000)),
        Schedule.compose(Schedule.recurs(3))
      )
    )
  );
```

## Acceptance Criteria

- [ ] Remove manual `while(true)` loop
- [ ] Remove dead `catch` block
- [ ] Use `Effect.retry` with exponential backoff
- [ ] All existing tests pass

## Priority

**Critical** - Same issue as 028, retry logic non-functional
