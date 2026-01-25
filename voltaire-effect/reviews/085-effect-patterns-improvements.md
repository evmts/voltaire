# Effect Patterns Improvements

<issue>
<metadata>
priority: P2
category: viem-parity
files: [src/services/, src/primitives/, src/jsonrpc/]
reviews: [076-use-effect-schema-for-types, 077-use-effect-request-for-provider, 078-use-effect-layer-patterns]
</metadata>

<gap_analysis>
Viem uses Promise-based patterns with manual batching, caching, and retry. Voltaire-effect should leverage Effect's powerful abstractions for superior composability.

<status_matrix>
| Pattern | Viem | Voltaire Current | Effect Idiomatic | Priority |
|---------|------|------------------|------------------|----------|
| Request batching | Manual multicall | Manual MulticallService | Effect.Request | P1 |
| Caching | LRU cache | Manual MemoryCache | Effect.Cache | P1 |
| Retry | Manual backoff | Manual retry loops | Effect.retry + Schedule | P1 |
| Type validation | Runtime checks | Plain objects | Effect.Schema | P1 |
| State management | Closures | Mutable objects | Effect.Ref | P1 |
| Configuration | Hardcoded | Hardcoded | Effect.Config | P2 |
| Timeouts | setTimeout | Manual tracking | Effect.timeout | P2 |
| Observability | None | None | Effect.withSpan | P2 |
</status_matrix>
</gap_analysis>

<viem_reference>
<feature>Manual Batching via Multicall</feature>
<location>viem/src/actions/public/multicall.ts</location>
<implementation>
```typescript
export async function multicall(client, { contracts, ... }) {
  const calls = contracts.map(encodeCall)
  const data = encodeFunctionData({ abi: multicall3Abi, args: [calls] })
  const result = await client.call({ to: multicall3Address, data })
  return decodeFunctionResult({ abi: multicall3Abi, data: result })
}
```
</implementation>
</viem_reference>

<viem_reference>
<feature>Manual Retry Pattern</feature>
<location>viem internal utilities</location>
<implementation>
```typescript
const withRetry = async (fn, { retryCount, retryDelay }) => {
  for (let i = 0; i <= retryCount; i++) {
    try {
      return await fn()
    } catch (err) {
      if (i === retryCount) throw err
      await new Promise(r => setTimeout(r, retryDelay * (i + 1)))
    }
  }
}
```
</implementation>
</viem_reference>

<effect_solution>
```typescript
// 1. Effect.Request for automatic batching and caching
import { Request, RequestResolver, Effect } from 'effect'

class GetBalance extends Request.TaggedClass('GetBalance')<
  ProviderError,
  bigint
>() {
  constructor(readonly address: Address, readonly blockTag: BlockTag = 'latest') {
    super()
  }
}

const BalanceResolver = RequestResolver.makeBatched(
  (requests: readonly GetBalance[]) =>
    Effect.gen(function* () {
      const multicall = yield* MulticallService
      const calls = requests.map(req => ({
        target: req.address,
        callData: '0x' // balanceOf signature
      }))
      const results = yield* multicall.aggregate3(calls)
      return results.map((r, i) => 
        Request.complete(requests[i], Exit.succeed(BigInt(r.returnData)))
      )
    })
)

// Usage - automatically batched when called concurrently
const [balance1, balance2, balance3] = yield* Effect.all([
  Effect.request(new GetBalance(addr1), BalanceResolver),
  Effect.request(new GetBalance(addr2), BalanceResolver),
  Effect.request(new GetBalance(addr3), BalanceResolver)
])

// 2. Effect.Cache for automatic caching with TTL
const cachedBlockNumber = Cache.make({
  capacity: 1,
  timeToLive: Duration.seconds(10),
  lookup: (_: void) => provider.getBlockNumber()
})

// 3. Effect.Schema for runtime validation
const BlockSchema = Schema.Struct({
  number: Schema.transform(
    Schema.String,
    Schema.BigInt,
    { decode: hex => BigInt(hex), encode: n => `0x${n.toString(16)}` }
  ),
  hash: HashSchema,
  parentHash: HashSchema,
  timestamp: Schema.transform(Schema.String, Schema.BigInt, ...),
  transactions: Schema.Array(Schema.Union(HashSchema, TransactionSchema))
})

// 4. Effect.Config for environment-based configuration
const TransportConfig = Config.all({
  timeout: Config.duration('TRANSPORT_TIMEOUT').pipe(
    Config.withDefault(Duration.seconds(10))
  ),
  retryCount: Config.integer('TRANSPORT_RETRY_COUNT').pipe(
    Config.withDefault(3)
  ),
  retryDelay: Config.duration('TRANSPORT_RETRY_DELAY').pipe(
    Config.withDefault(Duration.millis(100))
  )
})

// 5. Effect.Ref for safe mutable state
const makeNonceManager = Effect.gen(function* () {
  const deltas = yield* Ref.make(HashMap.empty<Address, number>())
  
  return {
    consume: (address: Address) =>
      Ref.modify(deltas, map => {
        const current = HashMap.get(map, address).pipe(Option.getOrElse(() => 0))
        return [current, HashMap.set(map, address, current + 1)]
      }),
    reset: (address: Address) =>
      Ref.update(deltas, HashMap.remove(address))
  }
})

// 6. Effect.retry with Schedule
const withStandardRetry = <A, E>(effect: Effect<A, E>) =>
  effect.pipe(
    Effect.retry({
      schedule: Schedule.exponential(Duration.millis(100)).pipe(
        Schedule.jittered,
        Schedule.upTo(Duration.seconds(10))
      ),
      while: (error) => isRetryableError(error)
    })
  )

// 7. Effect.Scope for resource management
const WebSocketTransport = (url: string) =>
  Layer.scoped(
    TransportService,
    Effect.acquireRelease(
      Effect.sync(() => new WebSocket(url)),
      (ws) => Effect.sync(() => ws.close())
    ).pipe(
      Effect.map(ws => makeTransportFromWebSocket(ws))
    )
  )
```
</effect_solution>

<implementation>
<new_files>
- src/requests/GetBlockNumber.ts
- src/requests/GetBalance.ts
- src/requests/GetBlock.ts
- src/requests/resolvers/BalanceResolver.ts
- src/schemas/RpcBlockSchema.ts
- src/schemas/RpcTransactionSchema.ts
- src/config/TransportConfig.ts
</new_files>

<phases>
1. **Phase 1 - Effect.Schema for RPC Types** (non-breaking)
   - Define schemas for Block, Transaction, Receipt, Log
   - Validate responses at transport level

2. **Phase 2 - Effect.Request Alternative API** (non-breaking)
   - Add request types alongside existing methods
   - Create batched resolvers for multicall
   - Enable automatic deduplication

3. **Phase 3 - Effect.Config Integration** (minor breaking)
   - Replace hardcoded defaults with Config
   - Support environment-based configuration

4. **Phase 4 - Ref for State Management** (minor breaking)
   - Replace mutable objects with Ref
   - Ensure atomic state updates

5. **Phase 5 - Scope-based Resources** (minor breaking)
   - Use Effect.acquireRelease for connections
   - Better WebSocket lifecycle

6. **Phase 6 - Observability** (non-breaking)
   - Add Effect.withSpan for tracing
   - Integrate with OpenTelemetry
</phases>
</implementation>

<tests>
```typescript
describe('Effect.Request batching', () => {
  it('batches concurrent balance requests', () =>
    Effect.gen(function* () {
      const requests = [addr1, addr2, addr3].map(a => new GetBalance(a))
      const resolver = yield* BalanceResolver
      
      const results = yield* Effect.all(
        requests.map(r => Effect.request(r, resolver))
      )
      
      expect(results).toHaveLength(3)
      results.forEach(b => expect(b).toBeTypeOf('bigint'))
    }))
})

describe('Effect.Schema validation', () => {
  it('validates RPC block response', () =>
    Effect.gen(function* () {
      const rawBlock = { number: '0x1', hash: '0x...', ... }
      const block = yield* Schema.decodeUnknown(RpcBlockSchema)(rawBlock)
      expect(block.number).toBe(1n)
    }))
})

describe('Effect.Ref state management', () => {
  it('NonceManager handles concurrent increments atomically', () =>
    Effect.gen(function* () {
      const manager = yield* makeNonceManager
      const results = yield* Effect.all(
        Array.from({ length: 10 }, () => manager.consume(addr))
      )
      expect(new Set(results).size).toBe(10)
    }))
})
```
</tests>

<references>
- https://effect.website/docs/guides/batching-caching
- https://effect.website/docs/guides/schema/introduction
- https://effect.website/docs/guides/configuration
- https://effect.website/docs/guides/resource-management
- https://effect.website/docs/guides/observability
</references>
</issue>
