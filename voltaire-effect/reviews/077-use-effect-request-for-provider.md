# Use Effect Request/Resolver for Provider

**Priority**: Medium  
**Module**: `services/Provider/Provider.ts`  
**Category**: Effect Idiomatic

## Problem

Provider manually wraps each RPC method instead of using Effect's Request/Resolver pattern:

```typescript
// Current: Manual wrapping per method
return {
  getBlockNumber: () =>
    request<string>("eth_blockNumber").pipe(
      Effect.map((hex) => BigInt(hex)),
    ),

  getBlock: (args?: GetBlockArgs) => {
    const method = args?.blockHash ? "eth_getBlockByHash" : "eth_getBlockByNumber";
    const params = ...;
    return request<BlockType | null>(method, params).pipe(
      Effect.flatMap((block) => block ? Effect.succeed(block) : Effect.fail(...)),
    );
  },
  // ... 20+ more methods
};
```

## Issues

1. **Boilerplate** - Each method has same pattern: request → map/flatMap
2. **No automatic batching** - Each call is independent
3. **No caching** - Results not cached even for same block
4. **No deduplication** - Same request sent multiple times

## Solution

Use Effect's `Request` and `RequestResolver` for automatic batching and caching:

```typescript
import * as Request from "effect/Request";
import * as RequestResolver from "effect/RequestResolver";
import * as Cache from "effect/Cache";

// Define request types
interface GetBlockNumber extends Request.Request<bigint, ProviderError> {
  readonly _tag: "GetBlockNumber";
}

interface GetBlock extends Request.Request<BlockType, ProviderError> {
  readonly _tag: "GetBlock";
  readonly blockTag?: BlockTag;
  readonly blockHash?: HashInput;
  readonly includeTransactions?: boolean;
}

interface GetBalance extends Request.Request<bigint, ProviderError> {
  readonly _tag: "GetBalance";
  readonly address: AddressInput;
  readonly blockTag: BlockTag;
}

// Union of all requests
type ProviderRequest = GetBlockNumber | GetBlock | GetBalance | /* ... */;

// Request constructors
const GetBlockNumber = Request.tagged<GetBlockNumber>("GetBlockNumber");
const GetBlock = Request.tagged<GetBlock>("GetBlock");
const GetBalance = Request.tagged<GetBalance>("GetBalance");

// Batched resolver
const ProviderResolver = RequestResolver.makeBatched(
  (requests: ReadonlyArray<ProviderRequest>) =>
    Effect.gen(function* () {
      const transport = yield* TransportService;
      
      // Group requests by method for efficient batching
      const rpcRequests = requests.map((req, id) => ({
        id,
        ...toRpcRequest(req),
      }));

      const responses = yield* transport.request<JsonRpcBatchResponse[]>(
        rpcRequests,
      );

      return requests.map((req, i) => {
        const response = responses[i];
        if (response.error) {
          return Request.fail(req, new ProviderError(...));
        }
        return Request.succeed(req, parseResponse(req, response.result));
      });
    }),
);

// Convert request to RPC format
const toRpcRequest = (req: ProviderRequest): { method: string; params: unknown[] } => {
  switch (req._tag) {
    case "GetBlockNumber":
      return { method: "eth_blockNumber", params: [] };
    case "GetBlock":
      return req.blockHash
        ? { method: "eth_getBlockByHash", params: [toHashHex(req.blockHash), req.includeTransactions ?? false] }
        : { method: "eth_getBlockByNumber", params: [req.blockTag ?? "latest", req.includeTransactions ?? false] };
    case "GetBalance":
      return { method: "eth_getBalance", params: [toAddressHex(req.address), req.blockTag] };
    // ...
  }
};

// Provider layer using requests
export const Provider: Layer.Layer<ProviderService, never, TransportService> =
  Layer.effect(
    ProviderService,
    Effect.gen(function* () {
      // Optional: Add caching for immutable data
      const blockCache = yield* Cache.make({
        capacity: 100,
        timeToLive: Duration.minutes(5),
        lookup: (req: GetBlock) => Effect.request(req, ProviderResolver),
      });

      return {
        getBlockNumber: () =>
          Effect.request(GetBlockNumber({}), ProviderResolver),

        getBlock: (args?: GetBlockArgs) =>
          Effect.request(
            GetBlock({
              blockTag: args?.blockTag,
              blockHash: args?.blockHash,
              includeTransactions: args?.includeTransactions,
            }),
            ProviderResolver,
          ).pipe(
            Effect.flatMap((block) =>
              block ? Effect.succeed(block) : Effect.fail(new ProviderError(...)),
            ),
          ),

        getBalance: (address, blockTag = "latest") =>
          Effect.request(
            GetBalance({ address, blockTag }),
            ProviderResolver,
          ),

        // ...
      };
    }),
  );
```

## With Caching

Add intelligent caching for blockchain data:

```typescript
// Immutable data (blocks by hash) can be cached forever
const immutableBlockResolver = ProviderResolver.pipe(
  RequestResolver.contextFromEffect(
    Effect.gen(function* () {
      const cache = yield* Cache.make({
        capacity: 1000,
        timeToLive: Duration.infinity,
        lookup: (req: GetBlock) => 
          req.blockHash 
            ? Effect.request(req, ProviderResolver)
            : Effect.die("Only hash lookups are cached"),
      });
      return cache;
    }),
  ),
);

// Latest block cached briefly
const latestBlockResolver = ProviderResolver.pipe(
  RequestResolver.contextFromEffect(
    Effect.gen(function* () {
      const cache = yield* Cache.make({
        capacity: 1,
        timeToLive: Duration.seconds(12), // ~1 block
        lookup: (req: GetBlock) => Effect.request(req, ProviderResolver),
      });
      return cache;
    }),
  ),
);
```

## Benefits

1. **Automatic batching** - Multiple requests in same tick batched
2. **Request deduplication** - Same request returns same fiber
3. **Composable caching** - Cache by block hash, TTL for latest
4. **Type-safe** - Each request type has typed response
5. **Reduced boilerplate** - Single resolver handles all methods

## References

- [Effect Batching & Caching](https://effect.website/docs/guides/batching-caching)
- [RequestResolver API](https://effect-ts.github.io/effect/effect/RequestResolver.ts.html)
- [Effect Cache](https://effect-ts.github.io/effect/effect/Cache.ts.html)
