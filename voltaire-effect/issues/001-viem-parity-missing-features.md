# Viem Client Parity - Missing Features & Extensibility

**Priority**: High
**Status**: Open
**Created**: 2026-01-25

## Summary

Comprehensive gap analysis comparing viem's client architecture against voltaire-effect's implementation. This document identifies missing customization points, pluggability features, and proposes Effect-idiomatic solutions.

## Naming Convention

We use **ethers-style naming** rather than viem-style:

| Ours (ethers-style) | Viem equivalent | Purpose |
|---|---|---|
| `ProviderService` | `PublicClient` | Read-only chain queries |
| `SignerService` | `WalletClient` | Signs & sends transactions |
| `Provider` (layer) | `PublicClient` | Layer implementation |
| `Signer` (layer) | `WalletClient` | Layer implementation |

---

## 1. Chain Configuration Extensibility

### Missing Features

| Viem Feature | Description | Impact |
|---|---|---|
| `chain.formatters` | Pluggable block/tx/receipt/txRequest transformers | Cannot support L2-specific fields (Celo, OP Stack) |
| `chain.serializers` | Custom transaction encoding | Cannot serialize L2 tx types (CIP-42, CIP-64) |
| `chain.fees` | Custom gas estimation (baseFeeMultiplier, estimateFeesPerGas) | No per-chain gas strategies |
| `chain.prepareTransactionRequest` | Pre-signing tx modification hooks (beforeFill/afterFill) | Cannot inject chain-specific tx preprocessing |

### Effect-Idiomatic Solution

Use **service composition with Schema transformations**:

```typescript
import * as Context from "effect/Context"
import * as Schema from "effect/Schema"
import * as Effect from "effect/Effect"

// ChainFormatterService - pluggable data transformers
class ChainFormatterService extends Context.Tag("ChainFormatterService")<
  ChainFormatterService,
  {
    readonly formatBlock: <E, R>(raw: RpcBlock) => Effect.Effect<Block, E, R>
    readonly formatTransaction: <E, R>(raw: RpcTx) => Effect.Effect<Transaction, E, R>
    readonly formatTransactionReceipt: <E, R>(raw: RpcReceipt) => Effect.Effect<Receipt, E, R>
    readonly formatTransactionRequest: <E, R>(req: TxRequest) => Effect.Effect<RpcTxRequest, E, R>
  }
>() {}

// ChainSerializerService - pluggable encoding
class ChainSerializerService extends Context.Tag("ChainSerializerService")<
  ChainSerializerService,
  {
    readonly serializeTransaction: (tx: Transaction, sig?: Signature) => Effect.Effect<Hex>
  }
>() {}

// ChainFeesService - pluggable gas estimation
class ChainFeesService extends Context.Tag("ChainFeesService")<
  ChainFeesService,
  {
    readonly estimateFeesPerGas: () => Effect.Effect<{ maxFeePerGas: bigint; maxPriorityFeePerGas: bigint }>
    readonly baseFeeMultiplier: Effect.Effect<number>
  }
>() {}

// Default implementations via Layer
const DefaultChainFormatter = Layer.succeed(ChainFormatterService, {
  formatBlock: (raw) => Effect.succeed(formatBlockDefault(raw)),
  formatTransaction: (raw) => Effect.succeed(formatTxDefault(raw)),
  // ...
})

// Chain-specific overrides (e.g., Celo)
const CeloChainFormatter = Layer.succeed(ChainFormatterService, {
  formatBlock: (raw) => Effect.succeed(formatCeloBlock(raw)),
  formatTransaction: (raw) => Effect.succeed(formatCeloTx(raw)),
  // ...
})
```

**Key Pattern**: Use `Layer.provide` to swap implementations per-chain.

---

## 2. Client Extension & Composition

### Missing Features

| Viem Feature | Description | Impact |
|---|---|---|
| `client.extend()` | Decorator pattern for adding chain-specific actions | Cannot compose OP Stack, zkSync actions |
| Protected actions | Immutable core operations (call, estimateGas, etc.) | No safety for core contract ops |
| Custom RPC schema typing | Type-safe custom RPC methods via generics | No typed custom methods |

### Effect-Idiomatic Solution

Use **Layer merging and service extension**:

```typescript
import * as Layer from "effect/Layer"

// Base Provider (existing)
const Provider: Layer.Layer<ProviderService, never, TransportService> = ...

// Extension pattern - create additional action services
class OpStackActionsService extends Context.Tag("OpStackActionsService")<
  OpStackActionsService,
  {
    readonly getL2Output: (args: L2OutputArgs) => Effect.Effect<L2Output>
    readonly getWithdrawals: (args: WithdrawalArgs) => Effect.Effect<Withdrawal[]>
  }
>() {}

// OpStack layer that depends on Provider
const OpStackActions: Layer.Layer<OpStackActionsService, never, ProviderService> = 
  Layer.effect(OpStackActionsService, Effect.gen(function* () {
    const provider = yield* ProviderService
    return {
      getL2Output: (args) => /* use provider internally */,
      getWithdrawals: (args) => /* use provider internally */,
    }
  }))

// Compose layers for full OP Stack provider
const OpStackProvider = Layer.merge(Provider, OpStackActions)

// Usage
const program = Effect.gen(function* () {
  const provider = yield* ProviderService
  const opStack = yield* OpStackActionsService
  
  const block = yield* provider.getBlockNumber()
  const output = yield* opStack.getL2Output({ ... })
})
  .pipe(
    Effect.provide(OpStackProvider),
    Effect.provide(HttpTransport("..."))
  )
```

**Alternative**: Use `Effect.Service` for cleaner syntax:

```typescript
class ExtendedProvider extends Effect.Service<ExtendedProvider>()("ExtendedProvider", {
  effect: Effect.gen(function* () {
    const base = yield* ProviderService
    const opStack = yield* OpStackActionsService
    return {
      ...base,
      ...opStack,
    }
  }),
  dependencies: [Provider, OpStackActions]
}) {}
```

---

## 3. Transport Layer

### Missing Features

| Viem Feature | Description | Impact |
|---|---|---|
| `fallback()` transport | Multi-provider failover | No production resilience |
| `ipc()` transport | IPC for local nodes | Cannot connect to local geth/reth |
| `custom()` transport | EIP-1193 provider wrapper | Cannot wrap MetaMask directly |
| `onFetchRequest`/`onFetchResponse` hooks | Request/response interception | No logging/metrics hooks |
| Custom `fetchFn` | Swap fetch implementation | Cannot use custom HTTP client |
| Method include/exclude filters | RPC method allow/blocklist | No method restrictions |
| Request deduplication | Merge identical concurrent requests | Redundant network calls |
| Batch scheduling | JSON-RPC batching | No automatic batching |

### Effect-Idiomatic Solution

#### Fallback Transport

```typescript
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"

// FallbackTransport - tries multiple transports in order
const FallbackTransport = (
  transports: Layer.Layer<TransportService>[]
): Layer.Layer<TransportService> =>
  Layer.effect(TransportService, Effect.gen(function* () {
    // Build a request function that tries each transport
    return {
      request: <T>(method: string, params?: unknown[]) =>
        Effect.gen(function* () {
          for (const transportLayer of transports) {
            const result = yield* Effect.provide(
              TransportService.pipe(Effect.andThen(t => t.request<T>(method, params))),
              transportLayer
            ).pipe(Effect.either)
            
            if (Either.isRight(result)) return result.right
          }
          return yield* Effect.fail(new TransportError({ code: -32603, message: "All transports failed" }))
        })
    }
  }))
```

#### Request/Response Interceptors

Use **FiberRef** for contextual middleware:

```typescript
import * as FiberRef from "effect/FiberRef"

// Define interceptor FiberRefs
const onRequestFiberRef = FiberRef.unsafeMake<(req: RpcRequest) => Effect.Effect<void>>(
  () => Effect.void
)
const onResponseFiberRef = FiberRef.unsafeMake<(res: RpcResponse) => Effect.Effect<void>>(
  () => Effect.void
)

// Use in transport
const HttpTransportWithInterceptors = (url: string): Layer.Layer<TransportService> =>
  Layer.effect(TransportService, Effect.gen(function* () {
    return {
      request: <T>(method: string, params?: unknown[]) =>
        Effect.gen(function* () {
          const onRequest = yield* FiberRef.get(onRequestFiberRef)
          const onResponse = yield* FiberRef.get(onResponseFiberRef)
          
          yield* onRequest({ method, params })
          const result = yield* executeRequest<T>(method, params)
          yield* onResponse({ result })
          
          return result
        })
    }
  }))

// Usage - add logging interceptor
const withLogging = Effect.locally(onRequestFiberRef, (req) => 
  Effect.log(`RPC: ${req.method}`)
)

const program = withLogging(myEffect)
```

#### Request Batching

Use **Effect's built-in batching system** with `Effect.request`:

```typescript
import * as Request from "effect/Request"
import * as RequestResolver from "effect/RequestResolver"

// Define request types
interface RpcCall extends Request.Request<unknown, TransportError> {
  readonly _tag: "RpcCall"
  readonly method: string
  readonly params: unknown[]
}

const RpcCall = Request.tagged<RpcCall>("RpcCall")

// Batched resolver
const BatchedRpcResolver = (url: string) => 
  RequestResolver.makeBatched((requests: readonly RpcCall[]) =>
    Effect.gen(function* () {
      // Batch all requests into single JSON-RPC call
      const batch = requests.map((req, id) => ({
        jsonrpc: "2.0",
        id,
        method: req.method,
        params: req.params
      }))
      
      const responses = yield* fetchBatch(url, batch)
      
      // Complete each request with its response
      yield* Effect.forEach(requests, (request, i) =>
        Request.completeEffect(request, Effect.succeed(responses[i].result))
      )
    })
  )

// Usage - automatic batching
const getTodos = Effect.request(RpcCall({ method: "eth_call", params: [...] }), resolver)
```

---

## 4. Account Abstraction

### Missing Features

| Viem Feature | Description | Impact |
|---|---|---|
| `SmartAccount` | ERC-4337 account abstraction | No bundler/paymaster support |
| `NonceManager` | Pluggable nonce tracking | Cannot override nonce behavior |
| `signAuthorization` (EIP-3074) | Auth delegation signing | No EIP-3074 support |

### Effect-Idiomatic Solution

```typescript
// NonceManagerService - pluggable nonce tracking
class NonceManagerService extends Context.Tag("NonceManagerService")<
  NonceManagerService,
  {
    readonly get: (address: Address) => Effect.Effect<bigint>
    readonly consume: (address: Address) => Effect.Effect<bigint>
  }
>() {}

// Default implementation - fetches from network
const DefaultNonceManager: Layer.Layer<NonceManagerService, never, ProviderService> = 
  Layer.effect(NonceManagerService, Effect.gen(function* () {
    const provider = yield* ProviderService
    return {
      get: (address) => provider.getTransactionCount(address),
      consume: (address) => provider.getTransactionCount(address),
    }
  }))

// Optimistic nonce manager - tracks locally
const OptimisticNonceManager: Layer.Layer<NonceManagerService, never, ProviderService> = 
  Layer.effect(NonceManagerService, Effect.gen(function* () {
    const provider = yield* ProviderService
    const nonceRef = yield* Ref.make(new Map<string, bigint>())
    
    return {
      get: (address) => Effect.gen(function* () {
        const cache = yield* Ref.get(nonceRef)
        return cache.get(address) ?? (yield* client.getTransactionCount(address))
      }),
      consume: (address) => Effect.gen(function* () {
        // ... increment and return
      }),
    }
  }))
```

---

## 5. Client Configuration

### Missing Features

| Viem Feature | Description | Impact |
|---|---|---|
| `batch.multicall` | Automatic multicall aggregation | No call batching |
| `cacheTime` | Response caching | Redundant calls |
| `pollingInterval` | Per-client polling config | Fixed polling |

### Effect-Idiomatic Solution

Use **Config** for client configuration:

```typescript
import * as Config from "effect/Config"

const ClientConfig = Config.all({
  batchMulticall: Config.boolean("BATCH_MULTICALL").pipe(Config.withDefault(false)),
  cacheTime: Config.integer("CACHE_TIME_MS").pipe(Config.withDefault(0)),
  pollingInterval: Config.integer("POLLING_INTERVAL_MS").pipe(Config.withDefault(4000)),
})

// Use in client layer
const ConfigurableProvider = Layer.effect(
  ProviderService,
  Effect.gen(function* () {
    const config = yield* ClientConfig
    const transport = yield* TransportService
    
    // Apply caching if enabled
    const cachedRequest = config.cacheTime > 0
      ? withCache(transport.request, config.cacheTime)
      : transport.request
    
    // ... build client with config
  })
)
```

---

## 6. Formatter/Serializer System

### Missing Features

| Viem Feature | Description | Impact |
|---|---|---|
| `defineFormatter()` utility | Composable formatter pattern | Hard-coded transformations |
| `defineSerializer()` pattern | Composable serializer pattern | No tx encoding flexibility |

### Effect-Idiomatic Solution

Use **Schema composition** for formatters:

```typescript
import * as Schema from "effect/Schema"

// Base block schema
const RpcBlockSchema = Schema.Struct({
  number: Schema.String,
  hash: Schema.String,
  // ... base fields
})

// Formatter as Schema transformation
const BlockFormatter = Schema.transform(
  RpcBlockSchema,
  BlockSchema,
  {
    decode: (rpc) => ({
      number: BigInt(rpc.number),
      hash: Hash.fromHex(rpc.hash),
      // ...
    }),
    encode: (block) => ({
      number: `0x${block.number.toString(16)}`,
      hash: Hash.toHex(block.hash),
      // ...
    })
  }
)

// Extend for Celo
const CeloRpcBlockSchema = Schema.extend(RpcBlockSchema, Schema.Struct({
  randomness: Schema.optional(Schema.Struct({
    committed: Schema.String,
    revealed: Schema.String,
  }))
}))

const CeloBlockFormatter = Schema.transform(
  CeloRpcBlockSchema,
  CeloBlockSchema,
  {
    decode: (rpc) => ({
      ...BlockFormatter.decode(rpc),
      randomness: rpc.randomness ? { ... } : undefined,
    }),
    // ...
  }
)
```

---

## 7. Missing RPC Methods

### Current Coverage

ProviderService covers:
- ✅ Block queries (getBlock, getBlockNumber, getBlockTransactionCount)
- ✅ Account queries (getBalance, getTransactionCount, getCode, getStorageAt)
- ✅ Transaction queries (getTransaction, getTransactionReceipt, waitForTransactionReceipt)
- ✅ Call simulation (call, estimateGas, createAccessList)
- ✅ Event queries (getLogs)
- ✅ Network info (getChainId, getGasPrice, getMaxPriorityFeePerGas, getFeeHistory)

### Missing Methods

| Method | Priority | Notes |
|---|---|---|
| `simulateContract` | High | Uses `call` + ABI decoding |
| `multicall` | High | Batch contract calls via Multicall3 |
| `getEnsAddress` / `getEnsName` / `getEnsResolver` | Medium | ENS resolution |
| `getProof` | Medium | eth_getProof for Merkle proofs |
| `watchBlocks` / `watchPendingTransactions` / `watchContractEvent` | Medium | WebSocket subscriptions |
| `verifyMessage` / `verifyTypedData` | Low | Signature verification |
| `getContractEvents` | Low | Convenience wrapper |

---

## 8. Additional Missing Features (ethers + viem parity)

### Contract Abstraction

| Feature | Priority | Notes |
|---|---|---|
| `Contract.read()` | High | Call view functions with typed returns |
| `Contract.write()` | High | Send transactions to contract |
| `Contract.deploy()` | Medium | Deploy contracts with constructor args |
| `Contract.events` | Medium | Event filtering and watching |
| `Contract.multicall()` | High | Batch multiple calls via Multicall3 |

### ENS Support

| Feature | Priority | Notes |
|---|---|---|
| `resolveName` (ENS → Address) | Medium | Forward resolution |
| `lookupAddress` (Address → ENS) | Medium | Reverse resolution |
| `getResolver` | Low | Get ENS resolver contract |
| `getAvatar` | Low | Get ENS avatar |

### Subscriptions (WebSocket)

| Feature | Priority | Notes |
|---|---|---|
| `watchBlocks` | High | Subscribe to new blocks |
| `watchPendingTransactions` | Medium | Subscribe to mempool |
| `watchContractEvent` | High | Subscribe to contract events |
| `watchBlockNumber` | Medium | Lightweight block polling |

### Transaction Utilities

| Feature | Priority | Notes |
|---|---|---|
| `prepareTransaction` | High | Fill gas, nonce, chainId automatically |
| `simulateContract` | High | Simulate before sending |
| `speedUpTransaction` | Low | Replace with higher gas |
| `cancelTransaction` | Low | Replace with 0-value self-send |
| `getTransactionConfirmations` | Medium | Count confirmations |

### Unit Utilities

| Feature | Priority | Notes |
|---|---|---|
| `parseEther` / `formatEther` | High | "1.5" ↔ 1500000000000000000n |
| `parseUnits` / `formatUnits` | High | Arbitrary decimals |
| `parseGwei` / `formatGwei` | Medium | Gwei convenience |

### Signature Utilities

| Feature | Priority | Notes |
|---|---|---|
| `verifyMessage` | Medium | Recover signer from message signature |
| `verifyTypedData` | Medium | Recover signer from EIP-712 signature |
| `recoverAddress` | Medium | Low-level recovery |
| `hashMessage` | Low | EIP-191 message hash |

### Advanced Features

| Feature | Priority | Notes |
|---|---|---|
| State overrides in `call` | Medium | Override balances/code for simulation |
| `getProof` (eth_getProof) | Medium | Merkle proofs for state |
| Blob transactions (EIP-4844) | Low | Data blobs for L2s |
| EIP-7702 authorization | Low | Code delegation |

### L2 Chain Extensions

| Chain | Features Needed |
|---|---|
| **OP Stack** | getL2Output, getWithdrawals, getL1BaseFee, depositTransaction |
| **Arbitrum** | getL1BaseFee, sendL2Message, outboxExecute |
| **zkSync** | estimateFee, getBlockDetails, getAllBalances |
| **Base/Celo/etc** | Custom formatters, fee currencies |

---

## Implementation Roadmap

### Phase 1: Core Extensibility (Week 1-2)
1. [ ] Implement `ChainFormatterService` with default layer
2. [ ] Implement `ChainSerializerService` with default layer
3. [ ] Implement `ChainFeesService` with default layer
4. [ ] Update `Provider` to use formatter service
5. [ ] Rename PublicClient → Provider, WalletClient → Signer
6. [ ] Add `Signer.fromProvider()` / `Signer.fromPrivateKey()` constructors

### Phase 2: Transport Enhancements (Week 2-3)
1. [ ] Implement `FallbackTransport`
2. [ ] Add request/response interceptor FiberRefs
3. [ ] Implement request batching with `Effect.request`
4. [ ] Add request deduplication
5. [ ] WebSocket transport with subscription support

### Phase 3: Account & Nonce (Week 3-4)
1. [ ] Implement `NonceManagerService`
2. [ ] Add `SmartAccountService` interface
3. [ ] Implement `signAuthorization` for EIP-3074/7702

### Phase 4: Contract Abstraction (Week 4-5)
1. [ ] `Contract.read()` - typed view calls
2. [ ] `Contract.write()` - typed transactions
3. [ ] `Contract.multicall()` - batched calls via Multicall3
4. [ ] `Contract.deploy()` - deployment with constructor args
5. [ ] `Contract.events` - event filtering

### Phase 5: Additional Provider Methods (Week 5-6)
1. [ ] `simulateContract` / `prepareTransaction`
2. [ ] ENS methods (resolveName, lookupAddress)
3. [ ] `getProof` (eth_getProof)
4. [ ] Subscription methods (watchBlocks, watchContractEvent)
5. [ ] Unit utilities (parseEther, formatEther, etc.)

### Phase 6: Chain-Specific Extensions (Week 6-7)
1. [ ] Create OP Stack extension layer
2. [ ] Create Arbitrum extension layer
3. [ ] Create zkSync extension layer
4. [ ] Create Celo extension layer (custom formatters)
5. [ ] Document extension pattern

---

## References

- [Viem Client Architecture](https://github.com/wevm/viem/blob/main/src/clients/createClient.ts)
- [Effect Batching Docs](https://effect.website/docs/batching)
- [Effect Layers Docs](https://effect.website/docs/requirements-management/layers)
- [Effect Configuration Docs](https://effect.website/docs/configuration)
- [Effect Schema Transformations](https://effect.website/docs/schema/transformations)
