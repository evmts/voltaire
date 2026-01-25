# Use Effect Request/Resolver for Provider

<issue>
<metadata>
<id>077</id>
<priority>P2</priority>
<category>Effect Idiomatic</category>
<module>services/Provider/Provider.ts</module>
<files>
  - services/Provider/Provider.ts
  - services/Provider/types.ts
</files>
<related_reviews>[072]</related_reviews>
</metadata>

<problem>
Provider manually wraps each RPC method instead of using Effect's Request/Resolver pattern:

```typescript
// ❌ Current: Manual wrapping per method
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
  // ... 20+ more methods with same pattern
};
```

**Issues:**
1. **Boilerplate** - Each method has same pattern: request → map/flatMap
2. **No automatic batching** - Each call is independent
3. **No caching** - Results not cached even for same block
4. **No deduplication** - Same request sent multiple times
</problem>

<effect_pattern>
<name>Request/Resolver for Declarative RPC</name>
<rationale>
Effect's Request/Resolver pattern provides:
- Automatic request batching
- Request deduplication (same request = same fiber)
- Composable caching
- Type-safe request → response mapping
- Centralized request handling
</rationale>
<before>
```typescript
// ❌ Manual method per RPC
getBlockNumber: () =>
  transport.request<string>("eth_blockNumber").pipe(
    Effect.map(BigInt)
  );

getBalance: (address, blockTag) =>
  transport.request<string>("eth_getBalance", [address, blockTag]).pipe(
    Effect.map(BigInt)
  );
```
</before>
<after>
```typescript
// ✅ Declarative Request types
interface GetBlockNumber extends Request.Request<bigint, ProviderError> {
  readonly _tag: "GetBlockNumber";
}

interface GetBalance extends Request.Request<bigint, ProviderError> {
  readonly _tag: "GetBalance";
  readonly address: Address;
  readonly blockTag: BlockTag;
}

// Single resolver handles all requests
const ProviderResolver = RequestResolver.makeBatched(
  (requests: ReadonlyArray<ProviderRequest>) =>
    Effect.gen(function* () {
      // Batch all requests into single RPC call
      const transport = yield* TransportService;
      const responses = yield* transport.request(
        requests.map(toRpcRequest)
      );
      return requests.map((req, i) =>
        Request.succeed(req, parseResponse(req, responses[i]))
      );
    })
);
```
</after>
<effect_docs>https://effect.website/docs/batching-caching</effect_docs>
</effect_pattern>

<effect_pattern>
<name>Request.tagged for Type-Safe Requests</name>
<rationale>
Use `Request.tagged` to create request constructors:
- Type-safe request creation
- Discriminated union for pattern matching
- Built-in equality for deduplication
</rationale>
<before>
```typescript
// ❌ Ad-hoc request objects
const req = { method: "eth_blockNumber" };
```
</before>
<after>
```typescript
// ✅ Tagged request with constructor
interface GetBlockNumber extends Request.Request<bigint, ProviderError> {
  readonly _tag: "GetBlockNumber";
}

const GetBlockNumber = Request.tagged<GetBlockNumber>("GetBlockNumber");

// Usage
const request = GetBlockNumber({});
```
</after>
<effect_docs>https://effect.website/docs/batching-caching#defining-requests</effect_docs>
</effect_pattern>

<effect_pattern>
<name>Cache for Blockchain Data</name>
<rationale>
Blockchain data has natural caching semantics:
- Blocks by hash: Immutable, cache forever
- Latest block: Cache briefly (~12 seconds)
- Historical state: Cache based on finality
</rationale>
<before>
```typescript
// ❌ No caching - repeated requests
const block1 = yield* getBlock("0x123...");
const block2 = yield* getBlock("0x123..."); // Fetches again!
```
</before>
<after>
```typescript
// ✅ Cache with appropriate TTL
import * as Cache from "effect/Cache";

const blockCache = yield* Cache.make({
  capacity: 1000,
  timeToLive: Duration.infinity, // Blocks by hash never change
  lookup: (hash: Hash) => getBlockByHash(hash),
});

const block1 = yield* blockCache.get("0x123...");
const block2 = yield* blockCache.get("0x123..."); // Cache hit!
```
</after>
<effect_docs>https://effect.website/docs/caching</effect_docs>
</effect_pattern>

<solution>
Use Effect's `Request` and `RequestResolver` for automatic batching and caching:

```typescript
import * as Request from "effect/Request";
import * as RequestResolver from "effect/RequestResolver";
import * as Cache from "effect/Cache";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Duration from "effect/Duration";

// ============================================
// Request Type Definitions
// ============================================

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

interface GetTransactionCount extends Request.Request<bigint, ProviderError> {
  readonly _tag: "GetTransactionCount";
  readonly address: AddressInput;
  readonly blockTag: BlockTag;
}

interface GetCode extends Request.Request<HexType, ProviderError> {
  readonly _tag: "GetCode";
  readonly address: AddressInput;
  readonly blockTag: BlockTag;
}

interface Call extends Request.Request<HexType, ProviderError> {
  readonly _tag: "Call";
  readonly transaction: TransactionRequest;
  readonly blockTag: BlockTag;
}

interface EstimateGas extends Request.Request<bigint, ProviderError> {
  readonly _tag: "EstimateGas";
  readonly transaction: TransactionRequest;
}

interface GetGasPrice extends Request.Request<bigint, ProviderError> {
  readonly _tag: "GetGasPrice";
}

// Union of all provider requests
type ProviderRequest =
  | GetBlockNumber
  | GetBlock
  | GetBalance
  | GetTransactionCount
  | GetCode
  | Call
  | EstimateGas
  | GetGasPrice;

// ============================================
// Request Constructors
// ============================================

const GetBlockNumber = Request.tagged<GetBlockNumber>("GetBlockNumber");
const GetBlock = Request.tagged<GetBlock>("GetBlock");
const GetBalance = Request.tagged<GetBalance>("GetBalance");
const GetTransactionCount = Request.tagged<GetTransactionCount>("GetTransactionCount");
const GetCode = Request.tagged<GetCode>("GetCode");
const Call = Request.tagged<Call>("Call");
const EstimateGas = Request.tagged<EstimateGas>("EstimateGas");
const GetGasPrice = Request.tagged<GetGasPrice>("GetGasPrice");

// ============================================
// Request to RPC Conversion
// ============================================

const toRpcRequest = (req: ProviderRequest): { method: string; params: unknown[] } => {
  switch (req._tag) {
    case "GetBlockNumber":
      return { method: "eth_blockNumber", params: [] };
    case "GetBlock":
      return req.blockHash
        ? { 
            method: "eth_getBlockByHash", 
            params: [toHashHex(req.blockHash), req.includeTransactions ?? false] 
          }
        : { 
            method: "eth_getBlockByNumber", 
            params: [req.blockTag ?? "latest", req.includeTransactions ?? false] 
          };
    case "GetBalance":
      return { method: "eth_getBalance", params: [toAddressHex(req.address), req.blockTag] };
    case "GetTransactionCount":
      return { method: "eth_getTransactionCount", params: [toAddressHex(req.address), req.blockTag] };
    case "GetCode":
      return { method: "eth_getCode", params: [toAddressHex(req.address), req.blockTag] };
    case "Call":
      return { method: "eth_call", params: [req.transaction, req.blockTag] };
    case "EstimateGas":
      return { method: "eth_estimateGas", params: [req.transaction] };
    case "GetGasPrice":
      return { method: "eth_gasPrice", params: [] };
  }
};

const parseResponse = (req: ProviderRequest, result: unknown): unknown => {
  switch (req._tag) {
    case "GetBlockNumber":
    case "GetBalance":
    case "GetTransactionCount":
    case "EstimateGas":
    case "GetGasPrice":
      return BigInt(result as string);
    case "GetBlock":
    case "GetCode":
    case "Call":
      return result;
  }
};

// ============================================
// Batched Resolver
// ============================================

const makeProviderResolver = Effect.gen(function* () {
  const transport = yield* TransportService;

  return RequestResolver.makeBatched(
    (requests: ReadonlyArray<ProviderRequest>) =>
      Effect.gen(function* () {
        const rpcRequests = requests.map((req, id) => ({
          jsonrpc: "2.0" as const,
          id,
          ...toRpcRequest(req),
        }));

        const responses = yield* transport.request<JsonRpcBatchResponse[]>(
          rpcRequests.length === 1 ? rpcRequests[0] : rpcRequests
        );

        const responseArray = Array.isArray(responses) ? responses : [responses];
        const responseMap = new Map(responseArray.map(r => [r.id, r]));

        return requests.map((req, i) => {
          const response = responseMap.get(i);
          if (!response) {
            return Request.fail(req, new ProviderError({
              method: toRpcRequest(req).method,
              message: `No response for request ${i}`,
            }));
          }
          if (response.error) {
            return Request.fail(req, new ProviderError({
              method: toRpcRequest(req).method,
              message: response.error.message,
              code: response.error.code,
              data: response.error.data,
            }));
          }
          return Request.succeed(req, parseResponse(req, response.result));
        });
      })
  );
});

// ============================================
// Provider Layer with Caching
// ============================================

export const Provider: Layer.Layer<ProviderService, never, TransportService> =
  Layer.effect(
    ProviderService,
    Effect.gen(function* () {
      const resolver = yield* makeProviderResolver;

      // Cache for immutable block data (by hash)
      const blockByHashCache = yield* Cache.make({
        capacity: 1000,
        timeToLive: Duration.infinity,
        lookup: (req: GetBlock) =>
          Effect.request(req, resolver) as Effect.Effect<BlockType, ProviderError>,
      });

      // Cache for latest block (short TTL)
      const latestBlockCache = yield* Cache.make({
        capacity: 1,
        timeToLive: Duration.seconds(12),
        lookup: (_: "latest") =>
          Effect.request(GetBlock({ blockTag: "latest" }), resolver) as Effect.Effect<BlockType, ProviderError>,
      });

      return {
        getBlockNumber: () =>
          Effect.request(GetBlockNumber({}), resolver),

        getBlock: (args?: GetBlockArgs) => {
          const req = GetBlock({
            blockTag: args?.blockTag,
            blockHash: args?.blockHash,
            includeTransactions: args?.includeTransactions,
          });
          
          // Use appropriate cache
          if (args?.blockHash) {
            return blockByHashCache.get(req);
          }
          if (!args?.blockTag || args.blockTag === "latest") {
            return latestBlockCache.get("latest");
          }
          return Effect.request(req, resolver);
        },

        getBalance: (address: AddressInput, blockTag: BlockTag = "latest") =>
          Effect.request(GetBalance({ address, blockTag }), resolver),

        getTransactionCount: (address: AddressInput, blockTag: BlockTag = "latest") =>
          Effect.request(GetTransactionCount({ address, blockTag }), resolver),

        getCode: (address: AddressInput, blockTag: BlockTag = "latest") =>
          Effect.request(GetCode({ address, blockTag }), resolver),

        call: (transaction: TransactionRequest, blockTag: BlockTag = "latest") =>
          Effect.request(Call({ transaction, blockTag }), resolver),

        estimateGas: (transaction: TransactionRequest) =>
          Effect.request(EstimateGas({ transaction }), resolver),

        getGasPrice: () =>
          Effect.request(GetGasPrice({}), resolver),
      };
    }),
  );
```
</solution>

<implementation>
<steps>
1. Define Request interfaces extending `Request.Request<Result, Error>`
2. Create request constructors with `Request.tagged`
3. Implement `toRpcRequest` for request → RPC conversion
4. Implement `parseResponse` for response parsing
5. Create `RequestResolver.makeBatched` for batching
6. Add `Cache` for immutable data (blocks by hash)
7. Update Provider methods to use `Effect.request`
</steps>
<imports>
```typescript
import * as Request from "effect/Request";
import * as RequestResolver from "effect/RequestResolver";
import * as Cache from "effect/Cache";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Duration from "effect/Duration";
```
</imports>
</implementation>

<tests>
```typescript
import { Effect, Layer } from "effect";
import { describe, it, expect } from "vitest";

describe("Provider with Request/Resolver", () => {
  it("batches concurrent requests", async () => {
    const rpcCalls: unknown[][] = [];
    const mockTransport = Layer.succeed(TransportService, {
      request: <T>(req: unknown) => {
        rpcCalls.push(Array.isArray(req) ? req : [req]);
        return Effect.succeed(
          Array.isArray(req)
            ? req.map((r: any) => ({ 
                id: r.id, 
                result: r.method === "eth_blockNumber" ? "0x100" : "0x0" 
              }))
            : { id: (req as any).id, result: "0x100" }
        ) as Effect.Effect<T>;
      },
    });

    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const provider = yield* ProviderService;
        
        // Concurrent requests should be batched
        return yield* Effect.all([
          provider.getBlockNumber(),
          provider.getBalance("0x1234567890123456789012345678901234567890"),
          provider.getGasPrice(),
        ]);
      }).pipe(
        Effect.provide(Provider),
        Effect.provide(mockTransport)
      )
    );

    expect(rpcCalls.length).toBe(1); // Single batched call
    expect(rpcCalls[0].length).toBe(3);
    expect(result[0]).toBe(256n);
  });

  it("caches blocks by hash", async () => {
    let fetchCount = 0;
    const mockTransport = Layer.succeed(TransportService, {
      request: <T>() => {
        fetchCount++;
        return Effect.succeed({
          id: 0,
          result: { number: "0x100", hash: "0xabc" },
        }) as Effect.Effect<T>;
      },
    });

    await Effect.runPromise(
      Effect.gen(function* () {
        const provider = yield* ProviderService;
        
        // Same hash should hit cache
        yield* provider.getBlock({ blockHash: "0xabc123" });
        yield* provider.getBlock({ blockHash: "0xabc123" });
        yield* provider.getBlock({ blockHash: "0xabc123" });
      }).pipe(
        Effect.provide(Provider),
        Effect.provide(mockTransport)
      )
    );

    expect(fetchCount).toBe(1); // Only one fetch
  });

  it("deduplicates identical concurrent requests", async () => {
    let fetchCount = 0;
    const mockTransport = Layer.succeed(TransportService, {
      request: <T>() => {
        fetchCount++;
        return Effect.succeed({ id: 0, result: "0x100" }) as Effect.Effect<T>;
      },
    });

    await Effect.runPromise(
      Effect.gen(function* () {
        const provider = yield* ProviderService;
        
        // 10 identical requests
        yield* Effect.all(
          Array.from({ length: 10 }, () => provider.getBlockNumber()),
          { concurrency: "unbounded" }
        );
      }).pipe(
        Effect.provide(Provider),
        Effect.provide(mockTransport)
      )
    );

    // All deduplicated to single request
    expect(fetchCount).toBeLessThanOrEqual(1);
  });
});
```
</tests>

<api>
<before>
```typescript
// ❌ Manual methods, no batching/caching
const provider = {
  getBlockNumber: () =>
    transport.request("eth_blockNumber").pipe(Effect.map(BigInt)),
  getBalance: (addr, block) =>
    transport.request("eth_getBalance", [addr, block]).pipe(Effect.map(BigInt)),
};
```
</before>
<after>
```typescript
// ✅ Request/Resolver with batching/caching
const provider = {
  getBlockNumber: () =>
    Effect.request(GetBlockNumber({}), resolver),
  getBalance: (addr, block) =>
    Effect.request(GetBalance({ address: addr, blockTag: block }), resolver),
};

// Concurrent calls automatically batched
const [block, balance] = yield* Effect.all([
  provider.getBlockNumber(),
  provider.getBalance(addr),
]); // Single RPC batch!
```
</after>
</api>

<acceptance_criteria>
- [ ] Define Request types for all provider methods
- [ ] Create RequestResolver.makeBatched
- [ ] Concurrent requests are batched
- [ ] Identical requests are deduplicated
- [ ] Blocks by hash are cached indefinitely
- [ ] Latest block cached briefly
- [ ] All provider methods work correctly
- [ ] All tests pass
</acceptance_criteria>

<references>
- [Effect Batching & Caching](https://effect.website/docs/batching-caching)
- [RequestResolver API](https://effect-ts.github.io/effect/effect/RequestResolver.ts.html)
- [Request API](https://effect-ts.github.io/effect/effect/Request.ts.html)
- [Effect Cache](https://effect.website/docs/caching)
</references>
</issue>
