# Fix Provider.ts Manual Remaining Time Bookkeeping

<issue>
<metadata>
priority: P1
status: COMPLETED
files: [src/services/Provider/Provider.ts]
reviews: [025]
</metadata>

<problem>
`waitForTransactionReceipt` originally used manual "remainingTime" calculations instead of composing Effect schedules properly:

```typescript
// Anti-pattern: manual time tracking
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

Issues:
- Reinvents Effect schedule composition
- Manual bookkeeping is error-prone (off-by-one, race conditions)
- Harder to test (must mock Clock)
- Effect provides `Schedule.recurUpTo` and `Effect.timeoutFail` for this
- Multiple redundant timeout checks throughout the code
</problem>

<solution>
Use schedule intersection with time limit and `Effect.timeoutFail`:

```typescript
import * as Schedule from "effect/Schedule";
import * as Duration from "effect/Duration";

waitForTransactionReceipt: (hash, options) =>
  Effect.gen(function* () {
    const confirmations = options?.confirmations ?? 1;
    const pollingInterval = options?.pollingInterval ?? 1000;
    const timeout = options?.timeout ?? 60000;

    const pollReceipt = request<ReceiptType | null>(
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

    // Compose schedules: poll every interval, up to timeout duration
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

    // Wait for confirmations with same pattern
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
</solution>

<implementation>
<steps>
1. [DONE] Remove manual `remainingTime` Effect generator
2. [DONE] src/services/Provider/Provider.ts:368-377 - Use `Schedule.spaced` + `Schedule.intersect` + `Schedule.recurUpTo`
3. [DONE] src/services/Provider/Provider.ts:378-385 - Use `Effect.timeoutFail` for receipt polling
4. [DONE] src/services/Provider/Provider.ts:410-429 - Same pattern for confirmation polling
5. [DONE] Use `Schedule.whileInput` to filter retryable errors by code
</steps>

<patterns>
- `Schedule.spaced(duration)` - Fixed interval between retries
- `Schedule.intersect(schedule1, schedule2)` - Both conditions must be met
- `Schedule.recurUpTo(duration)` - Stop after total duration elapsed
- `Schedule.whileInput(predicate)` - Only retry if error matches predicate
- `Effect.timeoutFail({ duration, onTimeout })` - Fail with specific error on timeout
</patterns>

<schedule-composition-explained>
```typescript
Schedule.spaced(Duration.millis(1000)).pipe(
  Schedule.intersect(Schedule.recurUpTo(Duration.millis(60000))),
  Schedule.whileInput((e: ProviderError) => e.code === INTERNAL_CODE_PENDING)
)
```

This schedule:
1. Waits 1 second between each retry (spaced)
2. Stops retrying after 60 seconds total (recurUpTo)
3. Only retries if error code matches INTERNAL_CODE_PENDING (whileInput)
</schedule-composition-explained>
</implementation>

<tests>
```typescript
import { Effect, TestClock, Fiber } from "effect";

describe("waitForTransactionReceipt timeout handling", () => {
  it("should timeout after specified duration", async () => {
    const program = Effect.gen(function* () {
      const provider = yield* ProviderService;
      return yield* provider.waitForTransactionReceipt("0x123", {
        timeout: 5000,
        pollingInterval: 1000,
      });
    }).pipe(
      Effect.provide(mockTransportNeverReturnsReceipt)
    );
    
    const fiber = await Effect.runFork(program);
    await TestClock.adjust("6 seconds");
    
    const exit = await Effect.runPromise(Fiber.await(fiber));
    expect(Exit.isFailure(exit)).toBe(true);
    expect(Exit.causeOption(exit).pipe(
      Option.flatMap(Cause.failureOption)
    )).toMatchObject({
      message: expect.stringContaining("Timeout"),
    });
  });

  it("should stop polling when receipt found", async () => {
    let pollCount = 0;
    const mockTransport = {
      request: (method: string) => {
        if (method === "eth_getTransactionReceipt") {
          pollCount++;
          if (pollCount >= 3) {
            return Effect.succeed({ blockNumber: "0x1", status: "0x1" });
          }
          return Effect.succeed(null);
        }
        return Effect.succeed("0x10");
      },
    };
    
    const program = Effect.gen(function* () {
      const provider = yield* ProviderService;
      return yield* provider.waitForTransactionReceipt("0x123");
    }).pipe(Effect.provide(mockTransport));
    
    const result = await Effect.runPromise(program);
    expect(pollCount).toBe(3);
    expect(result.blockNumber).toBe("0x1");
  });

  it("should respect pollingInterval", async () => {
    const timestamps: number[] = [];
    const mockTransport = {
      request: (method: string) =>
        Effect.gen(function* () {
          timestamps.push(Date.now());
          return null; // Keep returning null
        }),
    };
    
    // Test that polls are ~2000ms apart with pollingInterval: 2000
  });
});
```
</tests>

<docs>
```typescript
/**
 * Wait for a transaction receipt with configurable timeout and polling.
 * 
 * @description
 * Uses Effect schedule composition for timeout and retry logic.
 * No manual time bookkeeping - delegates entirely to Effect's
 * Schedule.recurUpTo and Effect.timeoutFail.
 * 
 * @param hash - Transaction hash
 * @param options.confirmations - Number of block confirmations (default: 1)
 * @param options.timeout - Maximum wait time in ms (default: 60000)
 * @param options.pollingInterval - Time between polls in ms (default: 1000)
 * 
 * @returns Effect that resolves to transaction receipt
 * @throws ProviderError on timeout or RPC failure
 */
```
</docs>

<api>
<before>
```typescript
// Manual time tracking
const remainingTime = Effect.gen(function* () {
  const now = yield* Clock.currentTimeMillis;
  return timeout - (now - startTime);
});
if ((yield* remainingTime) <= 0) { /* fail */ }
```
</before>
<after>
```typescript
// Declarative schedule composition
Effect.retry(
  Schedule.spaced(Duration.millis(pollingInterval)).pipe(
    Schedule.intersect(Schedule.recurUpTo(Duration.millis(timeout))),
    Schedule.whileInput((e) => e.code === INTERNAL_CODE_PENDING)
  )
).pipe(
  Effect.timeoutFail({
    duration: Duration.millis(timeout),
    onTimeout: () => new ProviderError(...)
  })
)
```
</after>
</api>

<references>
- [Effect Schedule documentation](https://effect.website/docs/guides/scheduling)
- [Schedule.intersect](https://effect.website/docs/guides/scheduling#intersect)
- [Schedule.recurUpTo](https://effect.website/docs/guides/scheduling#recurupto)
- [Effect.timeoutFail](https://effect.website/docs/guides/error-management/timing-out)
- [src/services/Provider/Provider.ts#L330-L431](file:///Users/williamcory/voltaire/voltaire-effect/src/services/Provider/Provider.ts#L330-L431)
</references>
</issue>
