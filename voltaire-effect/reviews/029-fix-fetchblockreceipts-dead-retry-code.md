# Fix fetchBlockReceipts Dead Retry Code

<issue>
<metadata>
priority: P0
status: COMPLETED
files: [src/block/fetchBlockReceipts.ts]
reviews: [029, 028]
</metadata>

<problem>
`fetchSingleReceipt` in `fetchBlockReceipts.ts` had the same dead retry code pattern as `fetchBlock` - the `catch` block never executed because Effect errors propagate through the error channel, not exceptions:

```typescript
// Anti-pattern: dead catch block (BEFORE)
const fetchSingleReceipt = (txHash: string) =>
  Effect.gen(function* () {
    while (true) {
      try {
        const receipt = yield* transport.request("eth_getTransactionReceipt", [txHash]);
        if (receipt === null) {
          return yield* Effect.fail(new ReceiptNotFoundError({ txHash }));
        }
        return receipt;
      } catch (error) {  // ❌ DEAD CODE - Effect errors don't throw!
        attempt++;
        if (attempt >= maxRetries) {
          throw error;
        }
        yield* Effect.sleep(`${delay} millis`);
        delay = Math.min(delay * 2, 30000);
      }
    }
  });
```

Issues:
- **Receipt fetching has no retry logic** despite code suggesting it does
- Individual receipt failures immediately fail the entire batch
- Transient network errors cause unnecessary failures
- Same bug pattern as fetchBlock (issue 028)
- `Effect.all({ concurrency: 10 })` amplifies the problem - 10 parallel requests, all without retries
</problem>

<solution>
Use `Effect.retry` with exponential backoff schedule for individual receipt fetches:

```typescript
import * as Schedule from "effect/Schedule";
import * as Duration from "effect/Duration";

const fetchSingleReceipt = (
  txHash: string,
  maxRetries: number,
  initialDelay: number,
  maxDelay: number,
): Effect.Effect<unknown, BlockError, TransportService> => {
  // Compose exponential backoff schedule with jitter
  const retrySchedule = Schedule.exponential(Duration.millis(initialDelay)).pipe(
    Schedule.jittered,
    Schedule.compose(Schedule.recurs(maxRetries)),
    Schedule.whileOutput((duration) =>
      Duration.lessThanOrEqualTo(duration, Duration.millis(maxDelay))
    ),
  );

  const fetchEffect = Effect.gen(function* () {
    const transport = yield* TransportService;
    return yield* transport
      .request("eth_getTransactionReceipt", [txHash])
      .pipe(
        Effect.mapError((error) =>
          new BlockError(`Failed to fetch receipt ${txHash}`, {
            cause: error instanceof Error ? error : undefined,
          })
        ),
      );
  });

  return fetchEffect.pipe(Effect.retry(retrySchedule));
};

// Main function uses Effect.all with concurrency for batch fetching
export const createFetchBlockReceipts = (
  block: Record<string, unknown>,
  retryOptions?: RetryOptions,
): Effect.Effect<unknown[], BlockError, TransportService> =>
  Effect.gen(function* () {
    const transport = yield* TransportService;
    const { maxRetries = 3, initialDelay = 1000, maxDelay = 30000 } = retryOptions ?? {};

    // Try eth_getBlockReceipts first (more efficient if supported)
    const tryBlockReceipts = yield* transport
      .request("eth_getBlockReceipts", [block.hash])
      .pipe(
        Effect.map((result) => ({ success: true as const, receipts: result })),
        Effect.catchAll((error) => {
          const errorMsg = ((error as { message?: string }).message ?? String(error)).toLowerCase();
          if (
            errorMsg.includes("method not found") ||
            errorMsg.includes("not supported") ||
            errorMsg.includes("unknown method")
          ) {
            return Effect.succeed({ success: false as const, receipts: null });
          }
          return Effect.fail(new BlockError("Failed to fetch block receipts", { cause: error }));
        }),
      );

    if (tryBlockReceipts.success && tryBlockReceipts.receipts) {
      return tryBlockReceipts.receipts as unknown[];
    }

    // Fall back to individual receipt fetches with concurrency
    const transactions = (block.body as { transactions?: unknown[] })?.transactions
      ?? (block.transactions as unknown[])
      ?? [];

    const receipts = yield* Effect.all(
      transactions.map((tx) => {
        const txHash = typeof tx === "string" ? tx : (tx as { hash: string }).hash;
        return fetchSingleReceipt(txHash, maxRetries, initialDelay, maxDelay);
      }),
      { concurrency: 10 },
    );

    return receipts.filter(Boolean);
  });
```
</solution>

<implementation>
<steps>
1. [DONE] src/block/fetchBlockReceipts.ts:9-11 - Import `Duration` and `Schedule` from effect
2. [DONE] src/block/fetchBlockReceipts.ts:97-124 - Rewrite `fetchSingleReceipt` with proper retry schedule
3. [DONE] src/block/fetchBlockReceipts.ts:103-107 - Create `retrySchedule` with exponential, jitter, and max retries
4. [DONE] src/block/fetchBlockReceipts.ts:123 - Compose fetch with `Effect.retry(retrySchedule)`
5. [DONE] Remove dead `catch` block and manual `attempt`/`delay` tracking
6. [DONE] src/block/fetchBlockReceipts.ts:86-92 - Batch fetches with `Effect.all({ concurrency: 10 })`
</steps>

<effect_patterns>
- `Schedule.exponential(duration)` - Exponentially increasing delay (1s, 2s, 4s, 8s...)
- `Schedule.jittered` - Add random jitter ±25% to prevent synchronized retries
- `Schedule.compose(Schedule.recurs(n))` - Limit total retry count
- `Schedule.whileOutput(predicate)` - Cap delay at maximum value
- `Effect.retry(schedule)` - Retry failed effect according to schedule
- `Effect.all(effects, { concurrency })` - Run effects in parallel with bounded concurrency
- `Effect.catchAll` - Catch and handle specific errors (method not supported fallback)
</effect_patterns>

<fallback-strategy>
The implementation uses a two-tier strategy:
1. **Try `eth_getBlockReceipts` first** - Single RPC call for all receipts (efficient)
2. **Fall back to individual fetches** - If method not supported, fetch each receipt individually

This matches what most RPC providers support:
- Alchemy, Quicknode: Support `eth_getBlockReceipts`
- Public RPCs: Often don't support it, need individual fetches
</fallback-strategy>
</implementation>

<tests>
```typescript
import { Effect, Exit, Layer } from "effect";
import { fetchBlockReceipts, createFetchBlockReceipts } from "./fetchBlockReceipts.js";
import { TransportService } from "../services/Transport/TransportService.js";
import { BlockError } from "./BlockError.js";

describe("fetchBlockReceipts retry behavior", () => {
  it("should retry individual receipt fetches on transient errors", async () => {
    const attemptsByTx: Record<string, number> = {};
    
    const mockTransport = TransportService.of({
      request: (method: string, params?: unknown[]) => {
        if (method === "eth_getBlockReceipts") {
          return Effect.fail(new Error("method not found"));
        }
        if (method === "eth_getTransactionReceipt") {
          const txHash = (params as string[])[0];
          attemptsByTx[txHash] = (attemptsByTx[txHash] ?? 0) + 1;
          if (attemptsByTx[txHash] < 2) {
            return Effect.fail(new Error("Network error"));
          }
          return Effect.succeed({ transactionHash: txHash, status: "0x1" });
        }
        return Effect.succeed(null);
      },
      url: "mock://",
      type: "http" as const,
    });
    
    const block = {
      hash: "0xblock",
      transactions: ["0xtx1", "0xtx2", "0xtx3"],
    };
    
    const program = createFetchBlockReceipts(block, { maxRetries: 3 }).pipe(
      Effect.provide(Layer.succeed(TransportService, mockTransport))
    );
    
    const result = await Effect.runPromise(program);
    expect(result).toHaveLength(3);
    expect(attemptsByTx["0xtx1"]).toBe(2);  // Retried once
  });

  it("should use eth_getBlockReceipts when available", async () => {
    let methodCalled: string | undefined;
    
    const mockTransport = TransportService.of({
      request: (method: string) => {
        methodCalled = method;
        if (method === "eth_getBlockReceipts") {
          return Effect.succeed([
            { transactionHash: "0xtx1", status: "0x1" },
            { transactionHash: "0xtx2", status: "0x1" },
          ]);
        }
        return Effect.succeed(null);
      },
      url: "mock://",
      type: "http" as const,
    });
    
    const block = { hash: "0xblock", transactions: ["0xtx1", "0xtx2"] };
    
    const program = createFetchBlockReceipts(block).pipe(
      Effect.provide(Layer.succeed(TransportService, mockTransport))
    );
    
    const result = await Effect.runPromise(program);
    expect(methodCalled).toBe("eth_getBlockReceipts");
    expect(result).toHaveLength(2);
  });

  it("should fail after maxRetries exceeded for individual receipt", async () => {
    const mockTransport = TransportService.of({
      request: (method: string) => {
        if (method === "eth_getBlockReceipts") {
          return Effect.fail(new Error("method not found"));
        }
        return Effect.fail(new Error("Always fails"));
      },
      url: "mock://",
      type: "http" as const,
    });
    
    const block = { hash: "0xblock", transactions: ["0xtx1"] };
    
    const program = createFetchBlockReceipts(block, { maxRetries: 2 }).pipe(
      Effect.provide(Layer.succeed(TransportService, mockTransport))
    );
    
    const exit = await Effect.runPromiseExit(program);
    expect(Exit.isFailure(exit)).toBe(true);
  });

  it("should handle concurrent receipt fetches with bounded parallelism", async () => {
    let maxConcurrent = 0;
    let currentConcurrent = 0;
    
    const mockTransport = TransportService.of({
      request: (method: string) =>
        Effect.gen(function* () {
          if (method === "eth_getBlockReceipts") {
            return yield* Effect.fail(new Error("method not found"));
          }
          currentConcurrent++;
          maxConcurrent = Math.max(maxConcurrent, currentConcurrent);
          yield* Effect.sleep("10 millis");
          currentConcurrent--;
          return { status: "0x1" };
        }),
      url: "mock://",
      type: "http" as const,
    });
    
    const block = {
      hash: "0xblock",
      transactions: Array.from({ length: 20 }, (_, i) => `0xtx${i}`),
    };
    
    const program = createFetchBlockReceipts(block).pipe(
      Effect.provide(Layer.succeed(TransportService, mockTransport))
    );
    
    await Effect.runPromise(program);
    expect(maxConcurrent).toBeLessThanOrEqual(10);  // Bounded by concurrency: 10
  });
});
```
</tests>

<docs>
```typescript
/**
 * Fetch receipts for a block with fallback to individual receipt fetching.
 *
 * @since 0.3.0
 *
 * @description
 * Tries `eth_getBlockReceipts` first for efficiency, falls back to individual
 * `eth_getTransactionReceipt` calls with bounded concurrency (10) if not supported.
 *
 * Each individual receipt fetch uses exponential backoff with jitter for retry.
 * The batch operation uses `Effect.all` with `concurrency: 10` to limit parallel requests.
 *
 * @param block - Block object containing hash and transaction list
 * @param retryOptions - Optional retry configuration for individual fetches
 * @param retryOptions.maxRetries - Maximum retry attempts per receipt (default: 3)
 * @param retryOptions.initialDelay - Initial delay in ms (default: 1000)
 * @param retryOptions.maxDelay - Maximum delay cap in ms (default: 30000)
 *
 * @returns Effect resolving to array of receipts
 * @throws BlockError - On fetch failures after retries exhausted
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import * as Block from 'voltaire-effect/block'
 * import { HttpTransport } from 'voltaire-effect/services'
 *
 * const program = Effect.gen(function* () {
 *   const block = { hash: '0x...', transactions: ['0x...'] }
 *   const receipts = yield* Block.fetchBlockReceipts(block)
 * }).pipe(Effect.provide(HttpTransport('https://eth.llamarpc.com')))
 * ```
 */
```
</docs>

<api>
<before>
```typescript
// Dead code - catch block never executes
const fetchSingleReceipt = (txHash: string) =>
  Effect.gen(function* () {
    while (true) {
      try {
        const receipt = yield* transport.request(...);
        return receipt;
      } catch (error) {  // ❌ DEAD CODE
        attempt++;
        if (attempt >= maxRetries) throw error;
        yield* Effect.sleep(`${delay} millis`);
        delay = Math.min(delay * 2, 30000);
      }
    }
  });
```
</before>
<after>
```typescript
// Declarative retry with Effect schedule
const fetchSingleReceipt = (
  txHash: string,
  maxRetries: number,
  initialDelay: number,
  maxDelay: number,
): Effect.Effect<unknown, BlockError, TransportService> => {
  const retrySchedule = Schedule.exponential(Duration.millis(initialDelay)).pipe(
    Schedule.jittered,
    Schedule.compose(Schedule.recurs(maxRetries)),
    Schedule.whileOutput((d) => Duration.lessThanOrEqualTo(d, Duration.millis(maxDelay))),
  );

  return Effect.gen(function* () {
    const transport = yield* TransportService;
    return yield* transport.request("eth_getTransactionReceipt", [txHash])
      .pipe(Effect.mapError((e) => new BlockError(`Failed to fetch receipt ${txHash}`, { cause: e })));
  }).pipe(Effect.retry(retrySchedule));
};
```
</after>
</api>

<references>
- [Effect Schedule documentation](https://effect.website/docs/guides/scheduling)
- [Schedule.exponential](https://effect.website/docs/guides/scheduling#exponential)
- [Effect.all with concurrency](https://effect.website/docs/guides/concurrency/parallel#effect-all)
- [Effect.retry](https://effect.website/docs/guides/error-management/retrying)
- [src/block/fetchBlockReceipts.ts#L45-L124](file:///Users/williamcory/voltaire/voltaire-effect/src/block/fetchBlockReceipts.ts#L45-L124)
</references>
</issue>
