# Use Effect Stream Properly

<issue>
<metadata>
<id>079</id>
<priority>P2</priority>
<category>Effect Idiomatic</category>
<module>services/BlockStream, services/Provider (watchBlocks)</module>
<files>
  - services/BlockStream/BlockStream.ts
  - services/Provider/Provider.ts
</files>
</metadata>

<problem>
BlockStream wraps AsyncGenerator with `Stream.fromAsyncIterable` instead of building native Effect streams:

```typescript
// ❌ Current: Wrap core AsyncGenerator
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

**Issues:**
1. **Escape from Effect** - Creates promise-based provider from Effect transport
2. **AsyncGenerator wrapper** - Loses Effect's stream semantics
3. **No backpressure** - AsyncIterable doesn't propagate backpressure
4. **Poor interruption** - Generator cleanup is tricky
5. **Double runtime** - Creates runtime, then runPromise inside
</problem>

<effect_pattern>
<name>Native Effect Stream Construction</name>
<rationale>
Build streams directly with Effect primitives:
- Full fiber semantics (interruption, supervision)
- Proper backpressure handling
- Testable with TestClock
- Composable with Stream operators
</rationale>
<before>
```typescript
// ❌ Wrapping AsyncGenerator
const stream = Stream.fromAsyncIterable(
  { [Symbol.asyncIterator]: () => pollBlocks() },
  (e) => new Error(e)
);
```
</before>
<after>
```typescript
// ✅ Native Effect Stream
const stream = Stream.repeatEffectChunk(
  Effect.gen(function* () {
    const blocks = yield* fetchNewBlocks;
    return Chunk.fromIterable(blocks);
  }).pipe(
    Effect.schedule(Schedule.spaced(Duration.seconds(12)))
  )
);
```
</after>
<effect_docs>https://effect.website/docs/stream/introduction</effect_docs>
</effect_pattern>

<effect_pattern>
<name>Stream.repeatEffectChunk for Polling</name>
<rationale>
`Stream.repeatEffectChunk` is ideal for polling patterns:
- Runs effect repeatedly
- Each invocation can return multiple items (Chunk)
- Integrates with Schedule for timing
- Proper interruption
</rationale>
<before>
```typescript
// ❌ Manual polling loop
async function* pollBlocks() {
  while (true) {
    const blocks = await fetchNewBlocks();
    for (const block of blocks) {
      yield block;
    }
    await sleep(12000);
  }
}
```
</before>
<after>
```typescript
// ✅ Stream.repeatEffectChunk
const blockStream = Stream.repeatEffectChunk(
  fetchNewBlocks.pipe(
    Effect.map(Chunk.fromIterable),
    Effect.schedule(Schedule.spaced(Duration.seconds(12)))
  )
);
```
</after>
<effect_docs>https://effect.website/docs/stream/creating#repeateffectchunk</effect_docs>
</effect_pattern>

<effect_pattern>
<name>Stream.unfoldChunkEffect for Ranges</name>
<rationale>
`Stream.unfoldChunkEffect` is perfect for range iteration:
- Takes initial state
- Returns next chunk + new state (or None to end)
- Batching built-in
</rationale>
<before>
```typescript
// ❌ Manual range iteration
async function* backfill(start: bigint, end: bigint) {
  for (let n = start; n <= end; n++) {
    yield await fetchBlock(n);
  }
}
```
</before>
<after>
```typescript
// ✅ Stream.unfoldChunkEffect
const backfill = (start: bigint, end: bigint, batchSize = 10) =>
  Stream.unfoldChunkEffect(start, (current) =>
    Effect.gen(function* () {
      if (current > end) return Option.none();
      
      const batchEnd = current + BigInt(batchSize - 1);
      const actualEnd = batchEnd > end ? end : batchEnd;
      
      const blocks = yield* Effect.all(
        Array.from({ length: Number(actualEnd - current + 1n) }, (_, i) =>
          fetchBlock(current + BigInt(i))
        )
      );
      
      return Option.some([
        Chunk.fromIterable(blocks),
        actualEnd + 1n
      ]);
    })
  );
```
</after>
<effect_docs>https://effect.website/docs/stream/creating#unfoldchunkeffect</effect_docs>
</effect_pattern>

<effect_pattern>
<name>Stream.mapAccum for Stateful Transformations</name>
<rationale>
Use `Stream.mapAccum` for transformations that need state:
- Track previous block hash for reorg detection
- Accumulate statistics
- Window operations
</rationale>
<before>
```typescript
// ❌ External mutable state
let lastHash: string | null = null;

stream.map((block) => {
  const isReorg = lastHash && block.parentHash !== lastHash;
  lastHash = block.hash;
  return isReorg ? { ...block, reorg: true } : block;
});
```
</before>
<after>
```typescript
// ✅ Stream.mapAccum with immutable state
const withReorgDetection = stream.pipe(
  Stream.mapAccum(null as string | null, (lastHash, block) => {
    const isReorg = lastHash !== null && block.parentHash !== lastHash;
    return [
      block.hash,
      isReorg ? { type: "reorg", block } : { type: "block", block }
    ];
  })
);
```
</after>
<effect_docs>https://effect.website/docs/stream/transforming#mapaccum</effect_docs>
</effect_pattern>

<solution>
Build native Effect Stream from RPC calls:

```typescript
import * as Stream from "effect/Stream";
import * as Schedule from "effect/Schedule";
import * as Ref from "effect/Ref";
import * as Chunk from "effect/Chunk";
import * as Option from "effect/Option";
import * as Duration from "effect/Duration";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

export interface BlockStreamEvent<TInclude extends BlockInclude = "header"> {
  readonly type: "block";
  readonly block: TInclude extends "transactions" ? BlockWithTransactions : BlockHeader;
}

export interface ReorgEvent {
  readonly type: "reorg";
  readonly expectedParent: string;
  readonly actualParent: string;
  readonly depth: number;
}

export interface BlocksEvent<TInclude extends BlockInclude = "header"> {
  readonly type: "blocks";
  readonly blocks: ReadonlyArray<TInclude extends "transactions" ? BlockWithTransactions : BlockHeader>;
  readonly fromBlock: bigint;
  readonly toBlock: bigint;
}

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
      // ✅ Native Effect Stream for watching
      watch: <TInclude extends BlockInclude = "header">(
        options?: WatchOptions<TInclude>,
      ): Stream.Stream<BlockStreamEvent<TInclude> | ReorgEvent, BlockStreamError> => {
        const pollingInterval = Duration.decode(
          options?.pollingInterval ?? Duration.seconds(12)
        );
        const includeTransactions = options?.include === "transactions";
        const detectReorgs = options?.detectReorgs ?? true;

        return Stream.unwrap(
          Effect.gen(function* () {
            const lastBlockRef = yield* Ref.make<{
              number: bigint;
              hash: string;
            } | null>(null);

            const pollBlock = Effect.gen(function* () {
              const currentBlockNumber = yield* getBlockNumber.pipe(
                Effect.mapError((e) => new BlockStreamError({ message: e.message })),
              );

              const lastBlock = yield* Ref.get(lastBlockRef);

              if (lastBlock === null) {
                // First poll - get current block
                const block = yield* getBlock(currentBlockNumber, includeTransactions).pipe(
                  Effect.mapError((e) => new BlockStreamError({ message: e.message })),
                );
                yield* Ref.set(lastBlockRef, { 
                  number: currentBlockNumber, 
                  hash: block.hash 
                });
                return Chunk.of<BlockStreamEvent<TInclude> | ReorgEvent>({ 
                  type: "block", 
                  block: block as any 
                });
              }

              if (currentBlockNumber <= lastBlock.number) {
                return Chunk.empty<BlockStreamEvent<TInclude> | ReorgEvent>();
              }

              // Fetch new blocks
              const events: Array<BlockStreamEvent<TInclude> | ReorgEvent> = [];
              let expectedParentHash = lastBlock.hash;

              for (let n = lastBlock.number + 1n; n <= currentBlockNumber; n++) {
                const block = yield* getBlock(n, includeTransactions).pipe(
                  Effect.mapError((e) => new BlockStreamError({ message: e.message })),
                );

                // Detect reorg
                if (detectReorgs && block.parentHash !== expectedParentHash) {
                  events.push({
                    type: "reorg",
                    expectedParent: expectedParentHash,
                    actualParent: block.parentHash,
                    depth: Number(n - lastBlock.number),
                  });
                }

                events.push({ type: "block", block: block as any });
                expectedParentHash = block.hash;
              }

              yield* Ref.set(lastBlockRef, { 
                number: currentBlockNumber, 
                hash: expectedParentHash 
              });
              return Chunk.fromIterable(events);
            });

            // ✅ Use Stream.repeatEffectChunk with Schedule
            return Stream.repeatEffectChunk(
              pollBlock.pipe(
                Effect.delay(pollingInterval),
              ),
            );
          }),
        );
      },

      // ✅ Native Effect Stream for backfilling
      backfill: <TInclude extends BlockInclude = "header">(
        options: BackfillOptions<TInclude>,
      ): Stream.Stream<BlocksEvent<TInclude>, BlockStreamError> => {
        const { startBlock, endBlock } = options;
        const batchSize = options.batchSize ?? 10;
        const includeTransactions = options.include === "transactions";
        const concurrency = options.concurrency ?? 3;

        // ✅ Use Stream.unfoldChunkEffect for range iteration
        return Stream.unfoldChunkEffect(startBlock, (current) =>
          Effect.gen(function* () {
            if (current > endBlock) {
              return Option.none();
            }

            const batchEnd = current + BigInt(batchSize) - 1n;
            const actualEnd = batchEnd > endBlock ? endBlock : batchEnd;

            // Fetch batch in parallel
            const blockNumbers = Array.from(
              { length: Number(actualEnd - current + 1n) },
              (_, i) => current + BigInt(i)
            );

            const blocks = yield* Effect.all(
              blockNumbers.map((n) => getBlock(n, includeTransactions)),
              { concurrency }
            ).pipe(
              Effect.mapError((e) => new BlockStreamError({ message: e.message })),
            );

            const event: BlocksEvent<TInclude> = {
              type: "blocks",
              blocks: blocks as any,
              fromBlock: current,
              toBlock: actualEnd,
            };

            return Option.some([
              Chunk.of(event),
              actualEnd + 1n,
            ] as const);
          }),
        );
      },

      // ✅ Utility: Add reorg detection to any block stream
      withReorgDetection: <E>(
        stream: Stream.Stream<BlockType, E>,
      ): Stream.Stream<BlockType | ReorgEvent, E> =>
        stream.pipe(
          Stream.mapAccum(null as string | null, (lastHash, block) => {
            if (lastHash !== null && block.parentHash !== lastHash) {
              return [
                block.hash,
                [
                  { 
                    type: "reorg" as const, 
                    expectedParent: lastHash, 
                    actualParent: block.parentHash,
                    depth: 1,
                  },
                  block,
                ],
              ];
            }
            return [block.hash, [block]];
          }),
          Stream.flattenIterables,
        ),
    };
  }),
);
```
</solution>

<implementation>
<steps>
1. Remove AsyncGenerator/AsyncIterable wrappers
2. Replace with `Stream.repeatEffectChunk` for polling
3. Replace with `Stream.unfoldChunkEffect` for range iteration
4. Use `Ref` for stream state (last block number/hash)
5. Use `Stream.mapAccum` for stateful transformations
6. Add proper Schedule for polling intervals
7. Use Effect.all with concurrency for batch fetching
</steps>
<imports>
```typescript
import * as Stream from "effect/Stream";
import * as Schedule from "effect/Schedule";
import * as Ref from "effect/Ref";
import * as Chunk from "effect/Chunk";
import * as Option from "effect/Option";
import * as Duration from "effect/Duration";
import * as Effect from "effect/Effect";
```
</imports>
</implementation>

<tests>
```typescript
import { Effect, Stream, Chunk, TestClock, TestContext, Duration } from "effect";
import { describe, it, expect } from "vitest";

describe("BlockStream", () => {
  it("emits blocks on polling interval", async () => {
    let blockNumber = 100n;
    const mockTransport = {
      request: <T>(method: string) => {
        if (method === "eth_blockNumber") {
          return Effect.succeed(`0x${blockNumber.toString(16)}` as T);
        }
        return Effect.succeed({ 
          number: `0x${blockNumber.toString(16)}`,
          hash: `0x${blockNumber.toString(16)}`,
          parentHash: `0x${(blockNumber - 1n).toString(16)}`,
        } as T);
      },
    };

    const blocks = await Effect.runPromise(
      Effect.gen(function* () {
        const service = yield* BlockStreamService;
        const stream = service.watch({ pollingInterval: Duration.seconds(12) });

        // Collect first 3 blocks
        blockNumber = 100n;
        const result: unknown[] = [];

        yield* stream.pipe(
          Stream.take(3),
          Stream.runForEach((event) => {
            result.push(event);
            blockNumber++; // Simulate new block
            return Effect.void;
          })
        );

        return result;
      }).pipe(
        Effect.provide(BlockStreamLive),
        Effect.provide(Layer.succeed(TransportService, mockTransport)),
        Effect.provide(TestContext.TestContext)
      )
    );

    expect(blocks).toHaveLength(3);
    expect(blocks.every((b: any) => b.type === "block")).toBe(true);
  });

  it("detects reorgs", async () => {
    const blocks = [
      { number: "0x64", hash: "0xaaa", parentHash: "0x000" },
      { number: "0x65", hash: "0xbbb", parentHash: "0xaaa" },
      { number: "0x66", hash: "0xccc", parentHash: "0xXXX" }, // Reorg!
    ];
    let idx = 0;

    const mockTransport = {
      request: <T>(method: string) => {
        if (method === "eth_blockNumber") {
          return Effect.succeed(`0x${(100 + idx).toString(16)}` as T);
        }
        return Effect.succeed(blocks[idx++] as T);
      },
    };

    const events = await Effect.runPromise(
      Effect.gen(function* () {
        const service = yield* BlockStreamService;
        return yield* service.watch({ detectReorgs: true }).pipe(
          Stream.take(4),
          Stream.runCollect
        );
      }).pipe(
        Effect.provide(BlockStreamLive),
        Effect.provide(Layer.succeed(TransportService, mockTransport))
      )
    );

    const reorgEvents = Chunk.toReadonlyArray(events).filter(
      (e): e is ReorgEvent => e.type === "reorg"
    );
    expect(reorgEvents).toHaveLength(1);
    expect(reorgEvents[0].expectedParent).toBe("0xbbb");
    expect(reorgEvents[0].actualParent).toBe("0xXXX");
  });

  it("backfills block range in batches", async () => {
    const fetchedBlocks: bigint[] = [];
    const mockTransport = {
      request: <T>(_: string, params: unknown[]) => {
        const blockNum = BigInt(params[0] as string);
        fetchedBlocks.push(blockNum);
        return Effect.succeed({ 
          number: params[0],
          hash: `0x${blockNum.toString(16)}`,
        } as T);
      },
    };

    const events = await Effect.runPromise(
      Effect.gen(function* () {
        const service = yield* BlockStreamService;
        return yield* service.backfill({
          startBlock: 100n,
          endBlock: 115n,
          batchSize: 5,
        }).pipe(Stream.runCollect);
      }).pipe(
        Effect.provide(BlockStreamLive),
        Effect.provide(Layer.succeed(TransportService, mockTransport))
      )
    );

    expect(Chunk.size(events)).toBe(4); // 4 batches of 5,5,5,1
    expect(fetchedBlocks).toHaveLength(16); // 100-115
  });

  it("is testable with TestClock", async () => {
    const mockTransport = {
      request: <T>(method: string) => {
        if (method === "eth_blockNumber") {
          return Effect.succeed("0x64" as T);
        }
        return Effect.succeed({ number: "0x64", hash: "0xabc" } as T);
      },
    };

    await Effect.runPromise(
      Effect.gen(function* () {
        const service = yield* BlockStreamService;
        const fiber = yield* service.watch({
          pollingInterval: Duration.seconds(12),
        }).pipe(
          Stream.take(3),
          Stream.runCollect,
          Effect.fork
        );

        // Advance clock to trigger polls
        yield* TestClock.adjust(Duration.seconds(36));

        yield* fiber.await;
      }).pipe(
        Effect.provide(BlockStreamLive),
        Effect.provide(Layer.succeed(TransportService, mockTransport)),
        Effect.provide(TestContext.TestContext)
      )
    );
  });
});
```
</tests>

<api>
<before>
```typescript
// ❌ AsyncGenerator wrapper
const stream = Stream.fromAsyncIterable(
  { [Symbol.asyncIterator]: () => coreStream.watch() },
  (e) => new BlockStreamError(e)
);
```
</before>
<after>
```typescript
// ✅ Native Effect Stream
const stream = Stream.repeatEffectChunk(
  pollBlocks.pipe(
    Effect.map(Chunk.fromIterable),
    Effect.delay(Duration.seconds(12))
  )
);
```
</after>
</api>

<acceptance_criteria>
- [ ] Remove AsyncGenerator/AsyncIterable wrappers
- [ ] Use Stream.repeatEffectChunk for polling
- [ ] Use Stream.unfoldChunkEffect for backfill
- [ ] Use Ref for stream state
- [ ] Reorg detection with Stream.mapAccum
- [ ] Testable with TestClock
- [ ] Proper interruption on scope close
- [ ] All tests pass
</acceptance_criteria>

<references>
- [Effect Stream Introduction](https://effect.website/docs/stream/introduction)
- [Stream.repeatEffectChunk](https://effect.website/docs/stream/creating#repeateffectchunk)
- [Stream.unfoldChunkEffect](https://effect.website/docs/stream/creating#unfoldchunkeffect)
- [Stream.mapAccum](https://effect.website/docs/stream/transforming#mapaccum)
- [Testing with TestClock](https://effect.website/docs/testing#testclock)
</references>
</issue>
