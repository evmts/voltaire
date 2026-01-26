# Effect-Idiomatic Patterns for Client Extensibility

**Priority**: Reference Doc
**Status**: ✅ MOSTLY ADOPTED  
**Created**: 2026-01-25
**Updated**: 2026-01-26

## Adoption Summary

| Pattern | Status |
|---------|--------|
| Service Composition (Layer) | ✅ Adopted |
| @effect/platform transports | ✅ Adopted |
| Ref/SynchronizedRef state | ✅ Adopted |
| Effect.Request batching | ⚠️ Not yet (using manual BatchScheduler) |
| FiberRef configuration | ⚠️ Not yet |
| Effect.Config | ⚠️ Not yet |

## Naming Convention

We use **ethers-style naming**:
- `ProviderService` / `Provider` - Read-only chain queries (viem's `PublicClient`)
- `SignerService` / `Signer` - Signs & sends transactions (viem's `WalletClient`)

## Overview

This document provides Effect-idiomatic patterns for implementing the extensibility features identified in the viem parity analysis. Each pattern includes rationale, code examples, and references to Effect documentation.

## Adoption Update (2026-01-26)

- **Transport layer** now uses `@effect/platform` (`HttpTransport`, `WebSocketTransport`) with `Effect.timeout` + `Schedule` retry.
- **Batching** exists via `BatchScheduler` + `HttpTransport` `batch` option (manual batching, not yet `Effect.Request`).
- **State management**: Several services now use `Ref`/`SynchronizedRef` (NonceManager, FallbackTransport).
- **Caching**: `MemoryCache` and `LookupCacheService` exist, but are not yet integrated into Provider/Signer by default.

These are good steps, but Patterns 2 (Effect.Request) and 3 (FiberRef configuration) remain largely unadopted.

---

## Pattern 1: Service Composition via Layer

**Use Case**: Chain-specific formatters, serializers, and fee estimators

**Effect Concept**: Services are defined as `Context.Tag`, implementations provided via `Layer`, composed with `Layer.merge` and `Layer.provide`.

### Implementation

```typescript
import * as Context from "effect/Context"
import * as Layer from "effect/Layer"
import * as Effect from "effect/Effect"

// 1. Define service interface with Context.Tag
class ChainFormatterService extends Context.Tag("ChainFormatterService")<
  ChainFormatterService,
  {
    readonly formatBlock: (raw: RpcBlock) => Effect.Effect<Block, FormatError>
    readonly formatTransaction: (raw: RpcTx) => Effect.Effect<Transaction, FormatError>
  }
>() {}

// 2. Create default implementation layer
const DefaultChainFormatter: Layer.Layer<ChainFormatterService> = Layer.succeed(
  ChainFormatterService,
  {
    formatBlock: (raw) => Effect.try(() => parseBlock(raw)),
    formatTransaction: (raw) => Effect.try(() => parseTx(raw)),
  }
)

// 3. Create chain-specific override layer
const CeloChainFormatter: Layer.Layer<ChainFormatterService> = Layer.succeed(
  ChainFormatterService,
  {
    formatBlock: (raw) => Effect.try(() => parseCeloBlock(raw)),
    formatTransaction: (raw) => Effect.try(() => parseCeloTx(raw)),
  }
)

// 4. Consume in Provider
const Provider: Layer.Layer<ProviderService, never, TransportService | ChainFormatterService> =
  Layer.effect(ProviderService, Effect.gen(function* () {
    const transport = yield* TransportService
    const formatter = yield* ChainFormatterService
    
    return {
      getBlock: (args) => Effect.gen(function* () {
        const raw = yield* transport.request<RpcBlock>("eth_getBlockByNumber", [...])
        return yield* formatter.formatBlock(raw)
      }),
      // ...
    }
  }))

// 5. Compose layers for different chains
const MainnetProvider = Provider.pipe(
  Layer.provide(DefaultChainFormatter)
)

const CeloProvider = Provider.pipe(
  Layer.provide(CeloChainFormatter)
)
```

### Why This Pattern

- **Separation of concerns**: Formatting logic is isolated from transport/client logic
- **Testability**: Easy to mock formatters in tests
- **Type safety**: TypeScript ensures all required services are provided
- **Composability**: Layers can be merged, provided, and swapped freely

**Reference**: [Effect Layers Documentation](https://effect.website/docs/requirements-management/layers)

---

## Pattern 2: Request Batching with Effect.request

**Use Case**: Automatic JSON-RPC batching, multicall aggregation

**Effect Concept**: Define requests as data with `Request.tagged`, create resolvers with `RequestResolver.makeBatched`, use `Effect.request` to execute.

### Implementation

```typescript
import * as Request from "effect/Request"
import * as RequestResolver from "effect/RequestResolver"
import * as Effect from "effect/Effect"
import * as Data from "effect/Data"

// 1. Define request types using Data.TaggedClass
class GetBalance extends Data.TaggedClass("GetBalance")<{
  readonly address: Address
  readonly blockTag: BlockTag
}> {}

interface GetBalance extends Request.Request<bigint, TransportError> {}

class GetTransactionCount extends Data.TaggedClass("GetTransactionCount")<{
  readonly address: Address
  readonly blockTag: BlockTag
}> {}

interface GetTransactionCount extends Request.Request<bigint, TransportError> {}

// 2. Union type for all requests
type RpcRequest = GetBalance | GetTransactionCount

// 3. Create batched resolver
const makeRpcResolver = (transport: TransportShape) =>
  RequestResolver.makeBatched((requests: readonly RpcRequest[]) =>
    Effect.gen(function* () {
      // Build JSON-RPC batch
      const batch = requests.map((req, id) => {
        switch (req._tag) {
          case "GetBalance":
            return { jsonrpc: "2.0", id, method: "eth_getBalance", params: [req.address, req.blockTag] }
          case "GetTransactionCount":
            return { jsonrpc: "2.0", id, method: "eth_getTransactionCount", params: [req.address, req.blockTag] }
        }
      })
      
      // Execute batch request
      const responses = yield* transport.request<JsonRpcResponse[]>("batch", batch)
      
      // Complete each request with its response
      yield* Effect.forEach(requests, (request, i) => {
        const result = responses[i].result
        switch (request._tag) {
          case "GetBalance":
            return Request.completeEffect(request, Effect.succeed(BigInt(result)))
          case "GetTransactionCount":
            return Request.completeEffect(request, Effect.succeed(BigInt(result)))
        }
      }, { discard: true })
    })
  )

// 4. Use in service
const ProviderWithBatching: Layer.Layer<ProviderService, never, TransportService> =
  Layer.effect(ProviderService, Effect.gen(function* () {
    const transport = yield* TransportService
    const resolver = makeRpcResolver(transport)
    
    return {
      getBalance: (address, blockTag = "latest") =>
        Effect.request(new GetBalance({ address, blockTag }), resolver),
      getTransactionCount: (address, blockTag = "latest") =>
        Effect.request(new GetTransactionCount({ address, blockTag }), resolver),
      // ...
    }
  }))

// 5. Usage - requests are automatically batched
const program = Effect.gen(function* () {
  const provider = yield* ProviderService
  
  // These run concurrently and are batched into a single RPC call
  const [balance1, balance2, nonce] = yield* Effect.all([
    provider.getBalance(addr1),
    provider.getBalance(addr2),
    provider.getTransactionCount(addr1),
  ], { concurrency: "unbounded" })
})
```

### Why This Pattern

- **Automatic batching**: Effect handles batching transparently
- **Request deduplication**: Identical requests are automatically merged
- **Caching**: Add `Effect.cached` for response caching
- **Type safety**: Request/response types are fully typed

**Reference**: [Effect Batching Documentation](https://effect.website/docs/batching)

---

## Pattern 3: FiberRef for Contextual Configuration

**Use Case**: Per-request overrides (interceptors, timeout, retry config)

**Effect Concept**: `FiberRef` provides fiber-local state that can be scoped and overridden for specific effect regions.

### Implementation

```typescript
import * as FiberRef from "effect/FiberRef"
import * as Effect from "effect/Effect"

// 1. Define FiberRefs for contextual config
const timeoutRef = FiberRef.unsafeMake<number>(30000) // 30s default
const retryCountRef = FiberRef.unsafeMake<number>(3)
const onRequestRef = FiberRef.unsafeMake<(req: RpcRequest) => Effect.Effect<void>>(
  () => Effect.void
)
const onResponseRef = FiberRef.unsafeMake<(res: RpcResponse) => Effect.Effect<void>>(
  () => Effect.void
)

// 2. Use in transport
const HttpTransport = (url: string): Layer.Layer<TransportService> =>
  Layer.effect(TransportService, Effect.gen(function* () {
    return {
      request: <T>(method: string, params?: unknown[]) =>
        Effect.gen(function* () {
          const timeout = yield* FiberRef.get(timeoutRef)
          const retries = yield* FiberRef.get(retryCountRef)
          const onRequest = yield* FiberRef.get(onRequestRef)
          const onResponse = yield* FiberRef.get(onResponseRef)
          
          // Call interceptor
          yield* onRequest({ method, params })
          
          // Execute with timeout and retry
          const result = yield* executeRpc<T>(url, method, params).pipe(
            Effect.timeout(timeout),
            Effect.retry(Schedule.recurs(retries))
          )
          
          // Call response interceptor
          yield* onResponse({ result })
          
          return result
        })
    }
  }))

// 3. Create helper functions for scoped overrides
const withTimeout = (ms: number) => <A, E, R>(effect: Effect.Effect<A, E, R>) =>
  Effect.locally(timeoutRef, ms)(effect)

const withRetries = (count: number) => <A, E, R>(effect: Effect.Effect<A, E, R>) =>
  Effect.locally(retryCountRef, count)(effect)

const withRequestInterceptor = (fn: (req: RpcRequest) => Effect.Effect<void>) =>
  <A, E, R>(effect: Effect.Effect<A, E, R>) =>
    Effect.locally(onRequestRef, fn)(effect)

// 4. Usage
const program = Effect.gen(function* () {
  const provider = yield* ProviderService
  
  // This call has custom timeout and logging
  const balance = yield* provider.getBalance(address).pipe(
    withTimeout(5000),
    withRequestInterceptor((req) => Effect.log(`Calling ${req.method}`))
  )
  
  // This call uses defaults
  const block = yield* provider.getBlockNumber()
})
```

### Why This Pattern

- **Scoped configuration**: Overrides apply only to the wrapped effect
- **Composable**: Multiple `locally` calls can be chained
- **No service changes**: Original service implementation unchanged
- **Fiber inheritance**: Child fibers inherit parent's FiberRef values

**Reference**: [Effect FiberRef API](https://effect-ts.github.io/effect/effect/Effect.ts.html#fiber-refs)

---

## Pattern 4: Schema Transformations for Formatters

**Use Case**: RPC response parsing, chain-specific field mapping

**Effect Concept**: `Schema.transform` and `Schema.transformOrFail` for bidirectional, type-safe data transformation.

### Implementation

```typescript
import * as Schema from "effect/Schema"

// 1. Define RPC schema (wire format)
const RpcBlockSchema = Schema.Struct({
  number: Schema.String,
  hash: Schema.String,
  parentHash: Schema.String,
  timestamp: Schema.String,
  gasUsed: Schema.String,
  gasLimit: Schema.String,
  transactions: Schema.Array(Schema.String),
})

// 2. Define domain schema (application format)
const BlockSchema = Schema.Struct({
  number: Schema.BigIntFromSelf,
  hash: HashSchema,
  parentHash: HashSchema,
  timestamp: Schema.BigIntFromSelf,
  gasUsed: Schema.BigIntFromSelf,
  gasLimit: Schema.BigIntFromSelf,
  transactions: Schema.Array(HashSchema),
})

// 3. Create formatter as Schema transformation
const BlockFormatter = Schema.transform(
  RpcBlockSchema,
  BlockSchema,
  {
    strict: true,
    decode: (rpc) => ({
      number: BigInt(rpc.number),
      hash: Hash.fromHex(rpc.hash),
      parentHash: Hash.fromHex(rpc.parentHash),
      timestamp: BigInt(rpc.timestamp),
      gasUsed: BigInt(rpc.gasUsed),
      gasLimit: BigInt(rpc.gasLimit),
      transactions: rpc.transactions.map(Hash.fromHex),
    }),
    encode: (block) => ({
      number: `0x${block.number.toString(16)}`,
      hash: Hash.toHex(block.hash),
      parentHash: Hash.toHex(block.parentHash),
      timestamp: `0x${block.timestamp.toString(16)}`,
      gasUsed: `0x${block.gasUsed.toString(16)}`,
      gasLimit: `0x${block.gasLimit.toString(16)}`,
      transactions: block.transactions.map(Hash.toHex),
    }),
  }
)

// 4. Extend for chain-specific fields (Celo example)
const CeloRpcBlockSchema = Schema.extend(RpcBlockSchema, Schema.Struct({
  randomness: Schema.optional(Schema.Struct({
    committed: Schema.String,
    revealed: Schema.String,
  })),
}))

const CeloBlockSchema = Schema.extend(BlockSchema, Schema.Struct({
  randomness: Schema.optional(Schema.Struct({
    committed: HashSchema,
    revealed: HashSchema,
  })),
}))

const CeloBlockFormatter = Schema.transform(
  CeloRpcBlockSchema,
  CeloBlockSchema,
  {
    strict: true,
    decode: (rpc) => {
      const base = Schema.decodeSync(BlockFormatter)(rpc)
      return {
        ...base,
        randomness: rpc.randomness ? {
          committed: Hash.fromHex(rpc.randomness.committed),
          revealed: Hash.fromHex(rpc.randomness.revealed),
        } : undefined,
      }
    },
    encode: (block) => {
      const base = Schema.encodeSync(BlockFormatter)(block)
      return {
        ...base,
        randomness: block.randomness ? {
          committed: Hash.toHex(block.randomness.committed),
          revealed: Hash.toHex(block.randomness.revealed),
        } : undefined,
      }
    },
  }
)

// 5. Use in service
const parseBlock = (raw: unknown) =>
  Schema.decodeUnknown(BlockFormatter)(raw)

const parseCeloBlock = (raw: unknown) =>
  Schema.decodeUnknown(CeloBlockFormatter)(raw)
```

### Why This Pattern

- **Bidirectional**: Same schema handles parsing and serialization
- **Composable**: Use `Schema.extend` to add fields
- **Validated**: Schema validates structure automatically
- **Type inference**: TypeScript types derived from schema

**Reference**: [Effect Schema Transformations](https://effect.website/docs/schema/transformations)

---

## Pattern 5: Config for Client Settings

**Use Case**: Environment-based configuration with defaults

**Effect Concept**: `Config` primitives for declarative configuration with validation and defaults.

### Implementation

```typescript
import * as Config from "effect/Config"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"

// 1. Define configuration schema
const TransportConfig = Config.all({
  url: Config.string("RPC_URL"),
  timeout: Config.integer("RPC_TIMEOUT").pipe(Config.withDefault(30000)),
  retries: Config.integer("RPC_RETRIES").pipe(Config.withDefault(3)),
  retryDelay: Config.integer("RPC_RETRY_DELAY").pipe(Config.withDefault(1000)),
  batchEnabled: Config.boolean("RPC_BATCH_ENABLED").pipe(Config.withDefault(true)),
  batchWait: Config.integer("RPC_BATCH_WAIT_MS").pipe(Config.withDefault(0)),
})

const ClientConfig = Config.all({
  cacheTime: Config.integer("CLIENT_CACHE_TIME").pipe(Config.withDefault(0)),
  pollingInterval: Config.integer("CLIENT_POLLING_INTERVAL").pipe(Config.withDefault(4000)),
  multicallAddress: Config.string("MULTICALL_ADDRESS").pipe(Config.option),
})

// 2. Create configurable layer
const ConfigurableHttpTransport: Layer.Layer<TransportService, ConfigError> =
  Layer.effect(TransportService, Effect.gen(function* () {
    const config = yield* TransportConfig
    
    return {
      request: <T>(method: string, params?: unknown[]) =>
        executeRpc<T>(config.url, method, params).pipe(
          Effect.timeout(config.timeout),
          Effect.retry(Schedule.exponential(config.retryDelay).pipe(
            Schedule.recurs(config.retries)
          ))
        )
    }
  }))

// 3. Nest configuration for organization
const NestedConfig = Config.nested(TransportConfig, "RPC")
// Reads: RPC_URL, RPC_TIMEOUT, etc.

// 4. Use Schema.Config for complex types
import * as Schema from "effect/Schema"

const ChainIdConfig = Schema.Config(
  "CHAIN_ID",
  Schema.NumberFromString.pipe(Schema.int(), Schema.positive())
)

// 5. Mock in tests
const testConfig = ConfigProvider.fromMap(new Map([
  ["RPC_URL", "http://localhost:8545"],
  ["RPC_TIMEOUT", "5000"],
]))

const testProgram = program.pipe(
  Effect.withConfigProvider(testConfig)
)
```

### Why This Pattern

- **Declarative**: Configuration schema is self-documenting
- **Validated**: Types and constraints are checked at startup
- **Testable**: Easy to mock with `ConfigProvider.fromMap`
- **Composable**: Nest and combine configurations

**Reference**: [Effect Configuration Documentation](https://effect.website/docs/configuration)

---

## Pattern 6: Layer Extension for Chain Actions

**Use Case**: Adding chain-specific actions (OP Stack, zkSync) without modifying base client

**Effect Concept**: Create extension layers that depend on base services and merge them.

### Implementation

```typescript
import * as Context from "effect/Context"
import * as Layer from "effect/Layer"
import * as Effect from "effect/Effect"

// 1. Base services (existing)
class ProviderService extends Context.Tag("ProviderService")<...>() {}
class TransportService extends Context.Tag("TransportService")<...>() {}

// 2. Define extension service
class OpStackActionsService extends Context.Tag("OpStackActionsService")<
  OpStackActionsService,
  {
    readonly getL2Output: (args: L2OutputArgs) => Effect.Effect<L2Output, OpStackError>
    readonly getWithdrawals: (args: WithdrawalArgs) => Effect.Effect<Withdrawal[], OpStackError>
    readonly getL1BaseFee: () => Effect.Effect<bigint, OpStackError>
  }
>() {}

// 3. Implement extension layer with dependencies
const OpStackActions: Layer.Layer<OpStackActionsService, never, ProviderService> =
  Layer.effect(OpStackActionsService, Effect.gen(function* () {
    const provider = yield* ProviderService
    
    return {
      getL2Output: (args) => Effect.gen(function* () {
        const result = yield* provider.call({
          to: L2_OUTPUT_ORACLE,
          data: encodeGetL2Output(args),
        })
        return decodeL2Output(result)
      }),
      
      getWithdrawals: (args) => Effect.gen(function* () {
        const logs = yield* provider.getLogs({
          address: WITHDRAWAL_CONTRACT,
          topics: [WITHDRAWAL_EVENT_TOPIC],
          ...args,
        })
        return logs.map(decodeWithdrawal)
      }),
      
      getL1BaseFee: () => Effect.gen(function* () {
        const result = yield* provider.call({
          to: GAS_PRICE_ORACLE,
          data: encodeL1BaseFee(),
        })
        return BigInt(result)
      }),
    }
  }))

// 4. Compose into full OP Stack provider
const OpStackProvider = Layer.merge(
  Provider,      // Base provider layer
  OpStackActions // Extension layer
)

// 5. Usage
const program = Effect.gen(function* () {
  const provider = yield* ProviderService
  const opStack = yield* OpStackActionsService
  
  const blockNumber = yield* provider.getBlockNumber()
  const l1BaseFee = yield* opStack.getL1BaseFee()
  
  return { blockNumber, l1BaseFee }
}).pipe(
  Effect.provide(OpStackProvider),
  Effect.provide(HttpTransport("https://mainnet.optimism.io"))
)

// 6. Alternative: Combined service with Effect.Service
class OpStackProviderService extends Effect.Service<OpStackProviderService>()("OpStackProviderService", {
  effect: Effect.gen(function* () {
    const provider = yield* ProviderService
    const opStack = yield* OpStackActionsService
    return { ...provider, ...opStack }
  }),
  dependencies: [Provider, OpStackActions]
}) {}
```

### Why This Pattern

- **Additive**: Extensions don't modify base services
- **Type-safe**: TypeScript tracks all required dependencies
- **Testable**: Can provide mock extensions independently
- **Reusable**: Same extension works with any Provider implementation

**Reference**: [Effect Service Pattern](https://effect.website/docs/requirements-management/services)

---

## Pattern 7: Signer.fromProvider Constructor

**Use Case**: Create a Signer from an existing Provider + Account (like ethers `wallet.connect(provider)`)

**Effect Concept**: Layer composition with partial application.

### Implementation

```typescript
import * as Layer from "effect/Layer"
import * as Effect from "effect/Effect"

// SignerService definition
class SignerService extends Context.Tag("SignerService")<
  SignerService,
  {
    readonly signMessage: (message: Hex) => Effect.Effect<Signature, SignerError>
    readonly signTransaction: (tx: TransactionRequest) => Effect.Effect<Hex, SignerError>
    readonly sendTransaction: (tx: TransactionRequest) => Effect.Effect<Hash, SignerError>
    // ...
  }
>() {}

// Signer namespace with multiple constructors
const Signer = {
  // Base layer - requires Provider + Account + Transport
  Live: Layer.effect(SignerService, Effect.gen(function* () {
    const provider = yield* ProviderService
    const account = yield* AccountService
    const transport = yield* TransportService
    
    return {
      signMessage: (message) => account.signMessage(message),
      signTransaction: (tx) => Effect.gen(function* () {
        // Fill in missing fields from provider
        const nonce = tx.nonce ?? (yield* provider.getTransactionCount(account.address))
        const chainId = tx.chainId ?? BigInt(yield* provider.getChainId())
        const gasLimit = tx.gasLimit ?? (yield* provider.estimateGas(tx))
        // ... sign with account
      }),
      sendTransaction: (tx) => Effect.gen(function* () {
        const signed = yield* this.signTransaction(tx)
        return yield* transport.request("eth_sendRawTransaction", [signed])
      }),
    }
  })) as Layer.Layer<SignerService, never, ProviderService | AccountService | TransportService>,

  // fromProvider - compose Provider + Account into ready-to-use Signer
  fromProvider: (
    providerLayer: Layer.Layer<ProviderService, any, TransportService>,
    accountLayer: Layer.Layer<AccountService>
  ): Layer.Layer<SignerService, any, TransportService> =>
    Signer.Live.pipe(
      Layer.provide(providerLayer),
      Layer.provide(accountLayer)
    ),

  // fromAccount - requires Provider in context, just adds Account
  fromAccount: (
    accountLayer: Layer.Layer<AccountService>
  ): Layer.Layer<SignerService, never, ProviderService | TransportService> =>
    Signer.Live.pipe(Layer.provide(accountLayer)),

  // Convenience: local private key signer
  fromPrivateKey: (
    privateKey: Hex,
    providerLayer: Layer.Layer<ProviderService, any, TransportService>
  ): Layer.Layer<SignerService, any, TransportService> =>
    Signer.fromProvider(providerLayer, LocalAccount(privateKey)),
}

// Usage patterns
const transport = HttpTransport("https://eth.llamarpc.com")
const provider = Provider.pipe(Layer.provide(transport))

// Pattern 1: fromProvider (most common)
const signer1 = Signer.fromProvider(provider, LocalAccount(pk))

// Pattern 2: fromPrivateKey (convenience)
const signer2 = Signer.fromPrivateKey(pk, provider)

// Pattern 3: Compose manually
const signer3 = Signer.Live.pipe(
  Layer.provide(provider),
  Layer.provide(LocalAccount(pk))
)

// All equivalent usage:
const program = Effect.gen(function* () {
  const signer = yield* SignerService
  return yield* signer.sendTransaction({ to: recipient, value: parseEther("1") })
}).pipe(
  Effect.provide(signer1),
  Effect.provide(transport)
)
```

### Why This Pattern

- **Familiar API**: Mirrors ethers `new Wallet(pk, provider)` or `wallet.connect(provider)`
- **Flexible**: Multiple ways to construct based on what you have
- **Composable**: Layers can be reused and combined
- **Type-safe**: All dependencies tracked at compile time

---

## Pattern 8: Middleware via HttpMiddleware (for HTTP scenarios)

**Use Case**: Request logging, CORS, authentication headers

**Effect Concept**: Middleware as functions that wrap `App.Default`, FiberRef for scoped config.

### Implementation

```typescript
// Note: This pattern is from @effect/platform for HTTP servers
// Adapted here for RPC client middleware concept

import * as FiberRef from "effect/FiberRef"

// 1. Define middleware interface
interface TransportMiddleware {
  <E, R>(transport: TransportShape): TransportShape
}

// 2. Logging middleware
const loggingMiddleware: TransportMiddleware = (transport) => ({
  request: <T>(method: string, params?: unknown[]) =>
    Effect.gen(function* () {
      const start = Date.now()
      yield* Effect.log(`RPC Request: ${method}`)
      
      const result = yield* transport.request<T>(method, params)
      
      const duration = Date.now() - start
      yield* Effect.log(`RPC Response: ${method} (${duration}ms)`)
      
      return result
    })
})

// 3. Auth header middleware
const authMiddleware = (getToken: () => Effect.Effect<string>): TransportMiddleware =>
  (transport) => ({
    request: <T>(method: string, params?: unknown[]) =>
      Effect.gen(function* () {
        const token = yield* getToken()
        // Token is used in the underlying transport's fetch headers
        return yield* Effect.locally(
          authTokenRef,
          token
        )(transport.request<T>(method, params))
      })
  })

// 4. Compose middleware
const composeMiddleware = (...middlewares: TransportMiddleware[]): TransportMiddleware =>
  (transport) => middlewares.reduceRight(
    (acc, middleware) => middleware(acc),
    transport
  )

// 5. Apply to transport layer
const EnhancedTransport = (url: string): Layer.Layer<TransportService> =>
  Layer.effect(TransportService, Effect.gen(function* () {
    const baseTransport = createBaseTransport(url)
    
    const enhanced = composeMiddleware(
      loggingMiddleware,
      authMiddleware(() => Effect.succeed("my-token"))
    )(baseTransport)
    
    return enhanced
  }))
```

### Why This Pattern

- **Composable**: Chain multiple middleware
- **Reusable**: Same middleware works across transports
- **Scoped**: Use FiberRef for request-scoped state

**Reference**: [Effect Platform HttpMiddleware](https://effect-ts.github.io/effect/platform/HttpMiddleware.ts.html)

---

## Summary

| Pattern | Use Case | Key Effect Primitives |
|---|---|---|
| Service Composition | Chain formatters, serializers | `Context.Tag`, `Layer`, `Layer.provide` |
| Request Batching | JSON-RPC batching | `Request`, `RequestResolver.makeBatched`, `Effect.request` |
| FiberRef Config | Per-request overrides | `FiberRef`, `Effect.locally` |
| Schema Transformations | RPC parsing | `Schema.transform`, `Schema.extend` |
| Config | Environment settings | `Config`, `Config.withDefault`, `ConfigProvider` |
| Layer Extension | Chain-specific actions | `Layer.merge`, `Layer.effect` |
| Middleware | Request interceptors | Function composition, `FiberRef` |

All patterns leverage Effect's core principles:
- **Composition over inheritance**
- **Explicit dependencies via Layer**
- **Type-safe error handling**
- **Scoped resource management**

---

## Pattern 9: Use @effect/platform for Platform Abstractions

**Use Case**: HTTP transport, WebSocket transport, file system access, worker threads

**Effect Concept**: Effect provides platform-specific libraries that abstract away environment differences and provide Effect-native APIs.

### @effect/platform Libraries

| Package | Use Case |
|---------|----------|
| `@effect/platform` | Core platform abstractions (HttpClient, Socket, FileSystem, Worker) |
| `@effect/platform-node` | Node.js implementations |
| `@effect/platform-bun` | Bun implementations |
| `@effect/platform-browser` | Browser implementations |

### HTTP Transport with @effect/platform

```typescript
import * as HttpClient from "@effect/platform/HttpClient"
import * as HttpClientRequest from "@effect/platform/HttpClientRequest"
import * as HttpClientResponse from "@effect/platform/HttpClientResponse"
import { NodeHttpClient } from "@effect/platform-node"

const HttpTransport = (url: string) =>
  Layer.scoped(
    TransportService,
    Effect.gen(function* () {
      const client = (yield* HttpClient.HttpClient).pipe(
        HttpClient.retryTransient({ times: 3 }),
        HttpClient.timeout(Duration.seconds(30))
      )
      
      return {
        request: <T>(method: string, params?: unknown[]) =>
          HttpClientRequest.post(url).pipe(
            HttpClientRequest.jsonBody({ jsonrpc: "2.0", id: 1, method, params }),
            client.execute,
            Effect.flatMap(HttpClientResponse.json),
            Effect.map(res => res.result as T)
          )
      }
    })
  ).pipe(Layer.provide(NodeHttpClient.layer))
```

### WebSocket Transport with @effect/platform

```typescript
import * as Socket from "@effect/platform/Socket"
import { NodeSocket } from "@effect/platform-node"

const WebSocketTransport = (url: string) =>
  Layer.scoped(
    TransportService,
    Effect.gen(function* () {
      const socket = yield* Socket.makeWebSocket(url, {
        reconnect: Schedule.exponential("1 second").pipe(
          Schedule.jittered,
          Schedule.recurs(10)
        )
      })
      
      return {
        request: <T>(method: string, params?: unknown[]) =>
          Effect.gen(function* () {
            const id = yield* Ref.getAndUpdate(idRef, n => n + 1)
            yield* socket.send(JSON.stringify({ jsonrpc: "2.0", id, method, params }))
            
            return yield* socket.messages.pipe(
              Stream.filter(msg => JSON.parse(msg).id === id),
              Stream.take(1),
              Stream.runHead,
              Effect.map(msg => JSON.parse(msg!).result as T)
            )
          })
      }
    })
  ).pipe(Layer.provide(NodeSocket.layer))
```

### Why @effect/platform

| Feature | Manual Implementation | @effect/platform |
|---------|----------------------|------------------|
| Callback bridging | `Runtime.runFork` in callbacks | Not needed - Effect-native |
| Timers | `setTimeout`/`setInterval` | Effect.schedule |
| Retry | Manual loop or Effect.retry | Built-in `retryTransient` |
| Timeout | AbortController | Built-in `timeout` |
| Lifecycle | Manual finalizers | Scoped resources |
| Testing | Mock WebSocket/fetch | TestClock compatible |
| Cross-platform | Conditional imports | Layer-based injection |

**Installation**:
```bash
# Node.js
pnpm add @effect/platform @effect/platform-node

# Browser
pnpm add @effect/platform @effect/platform-browser

# Bun
pnpm add @effect/platform @effect/platform-bun
```

**References**:
- [Effect Platform Documentation](https://effect.website/docs/platform/introduction)
- [HttpClient](https://effect.website/docs/platform/http-client)
- [Socket](https://effect.website/docs/platform/socket)
- [FileSystem](https://effect.website/docs/platform/file-system)
