# Use Effect Stream Properly

**Priority**: Medium  
**Module**: `services/BlockStream`, `services/Provider` (watchBlocks)  
**Category**: Effect Idiomatic

## Problem

BlockStream wraps AsyncGenerator with `Stream.fromAsyncIterable` instead of building native Effect streams:

```typescript
// Current: Wrap core AsyncGenerator
const fromAsyncGenerator = <T>(
  makeGenerator: () => AsyncGenerator<T>,
): Stream.Stream<T, BlockStreamError> =>
  Stream.fromAsyncIterable(
    { [Symbol.asyncIterator]: makeGenerator },
    (error) => new BlockStreamError(...),
  );

export const BlockStream = Layer.effect(
  BlockStreamService,
  Effect.gen(function* () {
    const transport = yield* TransportService;
    const runtime = yield* Effect.runtime<never>();

    // ❌ Create promise-based provider for core library
    const provider = {
      request: async ({ method, params }) =>
        Runtime.runPromise(runtime)(transport.request(method, params)),
      on: () => {},
      removeListener: () => {},
    };

    const coreStream = CoreBlockStream({ provider: provider as any });

    return {
      watch: (options) => fromAsyncGenerator(() => coreStream.watch(options)),
    };
  }),
);
```

## Issues

1. **Escape from Effect** - Creates promise-based provider from Effect transport
2. **AsyncGenerator wrapper** - Loses Effect's stream semantics
3. **No backpressure** - AsyncIterable doesn't propagate backpressure
4. **Poor interruption** - Generator cleanup is tricky
5. **Double runtime** - Creates runtime, then runPromise inside

## Solution

Build native Effect Stream from RPC calls:

```typescript
import * as Stream from "effect/Stream";
import * as Schedule from "effect/Schedule";
import * as Ref from "effect/Ref";

export const BlockStream = Layer.effect(
  BlockStreamService,
  Effect.gen(function* () {
    const transport = yield* TransportService;

    const getBlockNumber = transport.request<string>("eth_blockNumber").pipe(
      Effect.map((hex) => BigInt(hex)),
    );

    const getBlock = (blockNumber: bigint, includeTransactions: boolean) =>
      transport.request<BlockType>("eth_getBlockByNumber", [
        `0x${blockNumber.toString(16)}`,
        includeTransactions,
      ]);

    return {
      watch: <TInclude extends BlockInclude = "header">(
        options?: WatchOptions<TInclude>,
      ): Stream.Stream<BlockStreamEvent<TInclude>, BlockStreamError> => {
        const pollingInterval = options?.pollingInterval ?? 1000;
        const includeTransactions = options?.include === "transactions";

        return Stream.unwrap(
          Effect.gen(function* () {
            const lastBlockRef = yield* Ref.make<bigint | null>(null);

            const pollBlock = Effect.gen(function* () {
              const currentBlockNumber = yield* getBlockNumber.pipe(
                Effect.mapError((e) => new BlockStreamError(e.message)),
              );

              const lastBlock = yield* Ref.get(lastBlockRef);

              if (lastBlock === null) {
                // First poll - get current block
                const block = yield* getBlock(currentBlockNumber, includeTransactions).pipe(
                  Effect.mapError((e) => new BlockStreamError(e.message)),
                );
                yield* Ref.set(lastBlockRef, currentBlockNumber);
                return [{ type: "block" as const, block }];
              }

              if (currentBlockNumber <= lastBlock) {
                return []; // No new blocks
              }

              // Fetch new blocks
              const events: BlockStreamEvent<TInclude>[] = [];
              for (let n = lastBlock + 1n; n <= currentBlockNumber; n++) {
                const block = yield* getBlock(n, includeTransactions).pipe(
                  Effect.mapError((e) => new BlockStreamError(e.message)),
                );
                events.push({ type: "block", block } as BlockStreamEvent<TInclude>);
              }

              yield* Ref.set(lastBlockRef, currentBlockNumber);
              return events;
            });

            return Stream.repeatEffectChunk(
              pollBlock.pipe(
                Effect.map((events) => Chunk.fromIterable(events)),
                Effect.schedule(Schedule.spaced(Duration.millis(pollingInterval))),
              ),
            );
          }),
        );
      },

      backfill: <TInclude extends BlockInclude = "header">(
        options: BackfillOptions<TInclude>,
      ): Stream.Stream<BlocksEvent<TInclude>, BlockStreamError> => {
        const { startBlock, endBlock } = options;
        const batchSize = options.batchSize ?? 10;
        const includeTransactions = options.include === "transactions";

        return Stream.unfoldChunkEffect(startBlock, (current) =>
          Effect.gen(function* () {
            if (current > endBlock) {
              return Option.none();
            }

            const batchEnd = current + BigInt(batchSize) - 1n > endBlock
              ? endBlock
              : current + BigInt(batchSize) - 1n;

            const blocks: BlockType[] = [];
            for (let n = current; n <= batchEnd; n++) {
              const block = yield* getBlock(n, includeTransactions).pipe(
                Effect.mapError((e) => new BlockStreamError(e.message)),
              );
              blocks.push(block);
            }

            const event: BlocksEvent<TInclude> = {
              type: "blocks",
              blocks: blocks as any,
              fromBlock: current,
              toBlock: batchEnd,
            };

            return Option.some([
              Chunk.of(event),
              batchEnd + 1n,
            ] as const);
          }),
        );
      },
    };
  }),
);
```

## Stream Operators for Reorg Detection

```typescript
const withReorgDetection = <A>(
  stream: Stream.Stream<A, BlockStreamError>,
  getBlockHash: (block: A) => string,
  getParentHash: (block: A) => string,
): Stream.Stream<A | ReorgEvent, BlockStreamError> =>
  Stream.mapAccum(stream, null as string | null, (lastHash, block) => {
    const parentHash = getParentHash(block);
    const currentHash = getBlockHash(block);

    if (lastHash !== null && parentHash !== lastHash) {
      return [currentHash, [
        { type: "reorg" as const, expectedParent: lastHash, actualParent: parentHash },
        block,
      ]];
    }

    return [currentHash, [block]];
  }).pipe(
    Stream.flattenIterables,
  );
```

## Benefits

1. **Native Effect** - No promise escape, full fiber semantics
2. **Proper interruption** - Stream interruption works correctly
3. **Backpressure** - Effect streams support backpressure
4. **Composable** - Use Stream operators (map, filter, merge)
5. **Testable** - Provide TestClock for deterministic tests

## References

- [Effect Stream](https://effect.website/docs/guides/streaming/stream/introduction)
- [Stream.repeatEffectChunk](https://effect-ts.github.io/effect/effect/Stream.ts.html#repeateffectchunk)
- [Stream.unfoldChunkEffect](https://effect-ts.github.io/effect/effect/Stream.ts.html#unfoldchunkeffect)
