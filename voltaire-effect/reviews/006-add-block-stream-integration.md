# Review: Integrate BlockStream from Voltaire Core

## Priority: 🟠 IMPORTANT

## Summary

Wrap voltaire core's `BlockStream` to provide Effect-native block watching with reorg support.

## Context

Voltaire core has a production-ready `BlockStream` with:
- Backfill historical blocks with chunking
- Watch new blocks with polling
- Reorg detection and handling
- Configurable include levels (header, transactions, receipts)
- Retry with exponential backoff
- AbortSignal support

**File**: [src/block/BlockStreamType.ts](../../src/block/BlockStreamType.ts)

## Implementation Plan

### 1. Create Effect wrapper for BlockStream

```typescript
// src/services/BlockStream/BlockStreamService.ts
import { BlockStream as CoreBlockStream } from '@tevm/voltaire/block';
import * as Effect from 'effect/Effect';
import * as Stream from 'effect/Stream';
import * as Context from 'effect/Context';

export interface BlockStreamShape {
  backfill: <T extends BlockInclude>(
    options: BackfillOptions<T>
  ) => Stream.Stream<BlocksEvent<T>, BlockStreamError>;
  
  watch: <T extends BlockInclude>(
    options?: WatchOptions<T>
  ) => Stream.Stream<BlockStreamEvent<T>, BlockStreamError>;
}

export class BlockStreamService extends Context.Tag("BlockStreamService")<
  BlockStreamService,
  BlockStreamShape
>() {}
```

### 2. Implement Layer using TransportService

```typescript
export const BlockStreamLive: Layer.Layer<
  BlockStreamService,
  never,
  TransportService
> = Layer.effect(
  BlockStreamService,
  Effect.gen(function* () {
    const transport = yield* TransportService;
    
    // Create EIP-1193 compatible provider from transport
    const provider = {
      request: async ({ method, params }) => 
        Effect.runPromise(transport.request(method, params))
    };
    
    const coreStream = CoreBlockStream({ provider });
    
    return {
      backfill: (options) => Stream.fromAsyncIterable(
        coreStream.backfill(options),
        (e) => new BlockStreamError(e)
      ),
      
      watch: (options) => Stream.fromAsyncIterable(
        coreStream.watch(options),
        (e) => new BlockStreamError(e)
      )
    };
  })
);
```

### 3. Add to ProviderService as convenience methods

```typescript
// In ProviderShape
readonly watchBlocks: <T extends BlockInclude>(
  options?: WatchOptions<T>
) => Stream.Stream<BlockStreamEvent<T>, ProviderError>;

readonly backfillBlocks: <T extends BlockInclude>(
  options: BackfillOptions<T>  
) => Stream.Stream<BlocksEvent<T>, ProviderError>;
```

## Benefits

- Reuse battle-tested reorg detection
- Effect Stream integration for composability
- Fiber-safe cancellation via Scope
- No re-implementation of complex logic

## Additional Streams to Consider

Also wrap from voltaire core:
- `EventStream` - for log watching
- `TransactionStream` - for tx pool monitoring
