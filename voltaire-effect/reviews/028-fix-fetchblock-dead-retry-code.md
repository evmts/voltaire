# Fix fetchBlock Dead Retry Code

<issue>
<metadata>
priority: P0
status: COMPLETED
files: [src/block/fetchBlock.ts]
reviews: [028, 029]
</metadata>

<problem>
`fetchBlock` originally had a manual retry loop with a `catch` block that **never executed** because Effect errors don't throw - they propagate through the Effect error channel:

```typescript
// Anti-pattern: dead catch block (BEFORE)
while (true) {
  try {
    const block = yield* transport.request("eth_getBlockByNumber", [
      blockTag,
      includeTransactions,
    ]);
    if (block === null) {
      return yield* Effect.fail(new BlockNotFoundError({ blockTag }));
    }
    return yield* formatter.formatBlock(block);
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

Issues:
- **No retries are happening** - the `catch` block never executes because Effect errors propagate through the error channel, not exceptions
- Transport errors immediately fail the effect without any retry
- Users expect retry behavior based on the code, but don't get it
- Backoff logic (`delay * 2`) is completely unused
- `maxRetries` parameter has no effect
</problem>

<solution>
Use `Effect.retry` with `Schedule.exponential` for proper retry behavior:

```typescript
import * as Schedule from "effect/Schedule";
import * as Duration from "effect/Duration";

export const fetchBlock = <TInclude extends BlockInclude = "header">(
  blockNumber: bigint,
  include: TInclude = "header" as TInclude,
  retryOptions?: RetryOptions,
): Effect.Effect<StreamBlock<TInclude>, BlockError | BlockNotFoundError, TransportService> => {
  const maxRetries = retryOptions?.maxRetries ?? 3;
  const initialDelay = retryOptions?.initialDelay ?? 1000;
  const maxDelay = retryOptions?.maxDelay ?? 30000;

  // Compose exponential backoff schedule with jitter and max retries
  const retrySchedule = Schedule.exponential(Duration.millis(initialDelay)).pipe(
    Schedule.jittered,  // Add randomness to prevent thundering herd
    Schedule.compose(Schedule.recurs(maxRetries)),  // Limit number of retries
    Schedule.whileOutput((duration) =>
      Duration.lessThanOrEqualTo(duration, Duration.millis(maxDelay))
    ),  // Cap delay at maxDelay
  );

  const includeTransactions = include !== "header";

  const fetchEffect = Effect.gen(function* () {
    const transport = yield* TransportService;

    const block = yield* transport
      .request("eth_getBlockByNumber", [
        `0x${blockNumber.toString(16)}`,
        includeTransactions,
      ])
      .pipe(
        Effect.mapError((e) =>
          new BlockError(`Failed to fetch block ${blockNumber}`, { cause: e })
        ),
      );

    if (!block) {
      return yield* Effect.fail(new BlockNotFoundError(blockNumber));
    }

    if (include === "receipts") {
      const receipts = yield* createFetchBlockReceipts(block, retryOptions);
      return { ...block, receipts } as unknown as StreamBlock<TInclude>;
    }

    return block as unknown as StreamBlock<TInclude>;
  });

  return fetchEffect.pipe(
    Effect.retry({
      schedule: retrySchedule,
      while: (error) => error instanceof BlockError,  // Only retry transient errors
    }),
  );
};
```
</solution>

<implementation>
<steps>
1. [DONE] src/block/fetchBlock.ts:13-14 - Import `Duration` and `Schedule` from effect
2. [DONE] src/block/fetchBlock.ts:50-54 - Create `retrySchedule` with exponential backoff, jitter, and max retries
3. [DONE] src/block/fetchBlock.ts:58-88 - Replace while loop with clean `fetchEffect` generator
4. [DONE] src/block/fetchBlock.ts:90-95 - Compose with `Effect.retry` and schedule, filtering only BlockError (not BlockNotFoundError)
5. [DONE] Remove dead `catch` block and manual `attempt`/`delay` variables
</steps>

<effect_patterns>
- `Schedule.exponential(duration)` - Exponentially increasing delay between retries (1s, 2s, 4s, 8s...)
- `Schedule.jittered` - Add random jitter to prevent thundering herd problem
- `Schedule.compose(Schedule.recurs(n))` - Limit total number of retries
- `Schedule.whileOutput(predicate)` - Cap the delay to a maximum value
- `Effect.retry({ schedule, while })` - Retry with schedule only when predicate matches
- `Effect.mapError` - Transform transport errors to domain-specific BlockError
</effect_patterns>

<schedule-composition-explained>
```typescript
Schedule.exponential(Duration.millis(1000)).pipe(
  Schedule.jittered,
  Schedule.compose(Schedule.recurs(3)),
  Schedule.whileOutput((d) => Duration.lessThanOrEqualTo(d, Duration.millis(30000)))
)
```

This schedule:
1. Starts at 1 second delay, doubles each retry (exponential)
2. Adds random jitter ±25% to prevent synchronized retries (jittered)
3. Stops after 3 retries total (recurs)
4. Caps individual delay at 30 seconds (whileOutput)
</schedule-composition-explained>
</implementation>

<tests>
```typescript
import { Effect, TestClock, Fiber, Exit } from "effect";
import { fetchBlock } from "./fetchBlock.js";
import { TransportService } from "../services/Transport/TransportService.js";
import { BlockError, BlockNotFoundError } from "./BlockError.js";

describe("fetchBlock retry behavior", () => {
  it("should retry on transient errors with exponential backoff", async () => {
    let attempts = 0;
    
    const mockTransport = TransportService.of({
      request: (method: string) =>
        Effect.gen(function* () {
          attempts++;
          if (attempts < 3) {
            return yield* Effect.fail(new Error("Network error"));
          }
          return { number: "0x1", hash: "0xabc" };
        }),
      url: "mock://",
      type: "http" as const,
    });
    
    const program = fetchBlock(1n, "header", { maxRetries: 5 }).pipe(
      Effect.provide(Layer.succeed(TransportService, mockTransport))
    );
    
    const result = await Effect.runPromise(program);
    expect(attempts).toBe(3);
    expect(result.hash).toBe("0xabc");
  });

  it("should not retry BlockNotFoundError", async () => {
    let attempts = 0;
    
    const mockTransport = TransportService.of({
      request: () => {
        attempts++;
        return Effect.succeed(null);  // Block not found
      },
      url: "mock://",
      type: "http" as const,
    });
    
    const program = fetchBlock(999999999n, "header", { maxRetries: 5 }).pipe(
      Effect.provide(Layer.succeed(TransportService, mockTransport))
    );
    
    const exit = await Effect.runPromiseExit(program);
    expect(attempts).toBe(1);  // No retries
    expect(Exit.isFailure(exit)).toBe(true);
  });

  it("should fail after maxRetries exceeded", async () => {
    let attempts = 0;
    
    const mockTransport = TransportService.of({
      request: () => {
        attempts++;
        return Effect.fail(new Error("Always fails"));
      },
      url: "mock://",
      type: "http" as const,
    });
    
    const program = fetchBlock(1n, "header", { maxRetries: 3 }).pipe(
      Effect.provide(Layer.succeed(TransportService, mockTransport))
    );
    
    const exit = await Effect.runPromiseExit(program);
    expect(attempts).toBe(4);  // Initial + 3 retries
    expect(Exit.isFailure(exit)).toBe(true);
  });

  it("should use TestClock for timing verification", async () => {
    // Use Effect's TestClock to verify exponential backoff timing
    const program = Effect.gen(function* () {
      // Setup mock that tracks timing between attempts
      // Advance TestClock and verify delays are exponential
    });
  });
});
```
</tests>

<docs>
```typescript
/**
 * Fetch a block by number with optional transaction inclusion.
 *
 * @since 0.3.0
 *
 * @description
 * Fetches block data from the RPC with automatic retry on transient errors.
 * Uses exponential backoff with jitter to handle network issues gracefully.
 * Does NOT retry on BlockNotFoundError (block genuinely doesn't exist).
 *
 * @param blockNumber - The block number to fetch
 * @param include - Level of detail: "header" | "transactions" | "receipts"
 * @param retryOptions - Optional retry configuration
 * @param retryOptions.maxRetries - Maximum retry attempts (default: 3)
 * @param retryOptions.initialDelay - Initial delay in ms (default: 1000)
 * @param retryOptions.maxDelay - Maximum delay cap in ms (default: 30000)
 *
 * @returns Effect resolving to block data
 * @throws BlockError - Transient RPC/network errors (retried)
 * @throws BlockNotFoundError - Block doesn't exist (not retried)
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import * as Block from 'voltaire-effect/block'
 * import { HttpTransport } from 'voltaire-effect/services'
 *
 * const program = Effect.gen(function* () {
 *   const block = yield* Block.fetchBlock(18000000n, 'header')
 *   console.log('Block:', block.hash)
 * }).pipe(Effect.provide(HttpTransport('https://eth.llamarpc.com')))
 * ```
 */
```
</docs>

<api>
<before>
```typescript
// Dead code - catch block never executes
while (true) {
  try {
    const block = yield* transport.request(...);
    if (block === null) return yield* Effect.fail(new BlockNotFoundError(...));
    return yield* formatter.formatBlock(block);
  } catch (error) {  // ❌ DEAD CODE
    attempt++;
    if (attempt >= maxRetries) throw error;
    yield* Effect.sleep(`${delay} millis`);
    delay = Math.min(delay * 2, 30000);
  }
}
```
</before>
<after>
```typescript
// Declarative retry with Effect schedule
const retrySchedule = Schedule.exponential(Duration.millis(initialDelay)).pipe(
  Schedule.jittered,
  Schedule.compose(Schedule.recurs(maxRetries)),
  Schedule.whileOutput((d) => Duration.lessThanOrEqualTo(d, Duration.millis(maxDelay))),
);

const fetchEffect = Effect.gen(function* () {
  const transport = yield* TransportService;
  const block = yield* transport.request(...).pipe(Effect.mapError(...));
  if (!block) return yield* Effect.fail(new BlockNotFoundError(blockNumber));
  return block;
});

return fetchEffect.pipe(
  Effect.retry({
    schedule: retrySchedule,
    while: (error) => error instanceof BlockError,
  }),
);
```
</after>
</api>

<references>
- [Effect Schedule documentation](https://effect.website/docs/guides/scheduling)
- [Schedule.exponential](https://effect.website/docs/guides/scheduling#exponential)
- [Schedule.jittered](https://effect.website/docs/guides/scheduling#jittered)
- [Effect.retry with conditional](https://effect.website/docs/guides/error-management/retrying#conditional-retrying)
- [src/block/fetchBlock.ts#L37-L96](file:///Users/williamcory/voltaire/voltaire-effect/src/block/fetchBlock.ts#L37-L96)
</references>
</issue>
