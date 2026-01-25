# Fix Provider.ts Manual Remaining Time Bookkeeping

## Problem

`waitForTransactionReceipt` uses manual "remainingTime" calculations instead of composing schedules properly.

**Location**: `src/services/Provider/Provider.ts#L340-L444`

```typescript
// Current: manual time tracking
const remainingTime = Effect.gen(function* () {
  const now = yield* Clock.currentTimeMillis;
  return timeout - (now - startTime);
});

// ... later ...
const remaining1 = yield* remainingTime;
if (remaining1 <= 0) {
  return yield* Effect.fail(...);
}

// ... and again ...
const remaining2 = yield* remainingTime;
if (remaining2 <= 0) {
  return yield* Effect.fail(...);
}
```

## Why This Matters

- Reinvents schedule composition
- Manual bookkeeping is error-prone
- Harder to test and reason about
- Effect provides `Schedule.recurUpTo` for this

## Solution

Use schedule intersection with time limit:

```typescript
waitForTransactionReceipt: (hash, options) =>
  Effect.gen(function* () {
    const hashHex = toHashHex(hash);
    const confirmations = options?.confirmations ?? 1;
    const pollingInterval = options?.pollingInterval ?? 4000;
    const timeout = options?.timeout ?? 120000;

    const pollReceipt = transport.request<ReceiptType | null>(
      "eth_getTransactionReceipt",
      [hashHex],
    ).pipe(
      Effect.flatMap((receipt) =>
        receipt
          ? Effect.succeed(receipt)
          : Effect.fail(new ProviderError({ hash }, "Transaction pending", {
              code: INTERNAL_CODE_PENDING,
            }))
      ),
    );

    // Get receipt with retry
    const receipt = yield* pollReceipt.pipe(
      Effect.retry(
        Schedule.spaced(Duration.millis(pollingInterval)).pipe(
          Schedule.intersect(Schedule.recurUpTo(Duration.millis(timeout))),
          Schedule.whileInput((e: ProviderError) => e.code === INTERNAL_CODE_PENDING)
        )
      ),
      Effect.timeoutFail({
        duration: Duration.millis(timeout),
        onTimeout: () => new ProviderError(
          { hash, timeout },
          "Timeout waiting for transaction receipt",
        ),
      })
    );

    if (confirmations <= 1) return receipt;

    // Wait for confirmations
    const receiptBlockNumber = BigInt(receipt.blockNumber);
    const targetBlock = receiptBlockNumber + BigInt(confirmations - 1);

    const pollConfirmations = Effect.gen(function* () {
      const currentBlockHex = yield* request<string>("eth_blockNumber");
      const currentBlock = BigInt(currentBlockHex);
      if (currentBlock >= targetBlock) return receipt;
      return yield* Effect.fail(new ProviderError(
        { hash, currentBlock, targetBlock },
        "Waiting for confirmations",
        { code: INTERNAL_CODE_WAITING_CONFIRMATIONS },
      ));
    });

    return yield* pollConfirmations.pipe(
      Effect.retry(
        Schedule.spaced(Duration.millis(pollingInterval)).pipe(
          Schedule.intersect(Schedule.recurUpTo(Duration.millis(timeout))),
          Schedule.whileInput((e: ProviderError) => e.code === INTERNAL_CODE_WAITING_CONFIRMATIONS)
        )
      ),
      Effect.timeoutFail({
        duration: Duration.millis(timeout),
        onTimeout: () => new ProviderError(
          { hash, timeout },
          "Timeout waiting for confirmations",
        ),
      })
    );
  }),
```

## Acceptance Criteria

- [ ] Remove manual `remainingTime` calculations
- [ ] Use `Schedule.recurUpTo(Duration.millis(timeout))` 
- [ ] Use `Effect.timeoutFail` instead of manual timeout checks
- [ ] Use `Schedule.whileInput` for retry conditions
- [ ] All existing tests pass

## Priority

**Medium** - Code cleanliness and maintainability
