# Effect Patterns Improvements

**Date**: 2026-01-25
**Priority**: Medium
**Category**: Architecture / Best Practices

## Overview

This document suggests improvements to make voltaire-effect more idiomatic Effect code and leverage Effect's features better.

## Current Patterns vs Recommended

### 1. Use Effect.Request for RPC Calls

**Current**: Raw RPC calls via TransportService
```typescript
transport.request<string>('eth_blockNumber').pipe(
  Effect.map(hex => BigInt(hex))
)
```

**Recommended**: Use Effect.Request for automatic batching and caching
```typescript
// Define request
class GetBlockNumber extends Request.TaggedClass('GetBlockNumber')<
  ProviderError,
  bigint
>() {}

// Resolver with batching
const BlockNumberResolver = RequestResolver.makeBatched(
  (requests: GetBlockNumber[]) => 
    transport.request('eth_blockNumber').pipe(...)
)

// Usage - automatically batched
Effect.request(new GetBlockNumber(), BlockNumberResolver)
```

**Benefits**:
- Automatic request deduplication
- Built-in caching
- Batching support
- Request-level tracing

### 2. Use Effect.Cache Instead of Manual Caching

**Current**: Manual caching in MemoryCache
**Recommended**: Use Effect.cachedWithTTL or Cache service

```typescript
const cachedGetBlockNumber = pipe(
  provider.getBlockNumber(),
  Effect.cachedWithTTL(Duration.seconds(10))
)
```

### 3. Use Effect.Schema for RPC Types

**Current**: Manual type definitions
```typescript
interface BlockType {
  number: string
  hash: string
  // ...
}
```

**Recommended**: Effect.Schema with encoding/decoding
```typescript
const BlockSchema = Schema.Struct({
  number: Schema.transform(
    Schema.String,
    Schema.BigInt,
    { decode: hex => BigInt(hex), encode: n => `0x${n.toString(16)}` }
  ),
  hash: HashSchema,
  // ...
})

type Block = Schema.Schema.Type<typeof BlockSchema>
```

**Benefits**:
- Automatic validation
- Bidirectional encoding
- Better error messages
- Runtime type checking

### 4. Use Effect.Config for Transport Configuration

**Current**: Hardcoded defaults
```typescript
HttpTransport(url, {
  timeout: 10000,
  retryCount: 3
})
```

**Recommended**: Effect.Config for environment-based configuration
```typescript
const TransportConfig = Config.all({
  timeout: Config.integer('TRANSPORT_TIMEOUT').pipe(
    Config.withDefault(10000)
  ),
  retryCount: Config.integer('TRANSPORT_RETRY_COUNT').pipe(
    Config.withDefault(3)
  )
})

const HttpTransportLive = Layer.effect(
  TransportService,
  Effect.gen(function* () {
    const config = yield* TransportConfig
    // ...
  })
)
```

### 5. Use Ref for Mutable State

**Current**: Some places use plain objects for state
**Recommended**: Effect.Ref for safe mutable state

```typescript
// NonceManager with Ref
const DefaultNonceManager = Layer.effect(
  NonceManagerService,
  Effect.gen(function* () {
    const deltas = yield* Ref.make(new Map<string, number>())
    
    return {
      increment: (address) => 
        Ref.update(deltas, map => {
          const newMap = new Map(map)
          newMap.set(address, (map.get(address) ?? 0) + 1)
          return newMap
        }),
      // ...
    }
  })
)
```

### 6. Use Stream for Block Watching

**Current**: ✅ Already using Stream for watchBlocks/backfillBlocks
**Recommendation**: Extend to event watching

```typescript
interface ProviderShape {
  watchEvents: (filter: LogFilter) => Stream<LogType, ProviderError>
  watchPendingTransactions: () => Stream<Hash, ProviderError>
}
```

### 7. Use Scope for Resource Management

**Current**: WebSocket cleanup is manual
**Recommended**: Use Effect.acquireRelease

```typescript
const WebSocketTransport = (url: string) =>
  Layer.scoped(
    TransportService,
    Effect.acquireRelease(
      // Acquire: create connection
      Effect.sync(() => new WebSocket(url)),
      // Release: close connection
      (ws) => Effect.sync(() => ws.close())
    ).pipe(
      Effect.map(ws => ({
        request: (method, params) => /* ... */
      }))
    )
  )
```

### 8. Use Effect.retry with Schedule

**Current**: ✅ Already using Schedule in some places
**Recommendation**: Standardize retry patterns

```typescript
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
```

### 9. Use Layer.mergeAll for Service Composition

**Current**: Manual layer piping
```typescript
Signer.Live.pipe(
  Layer.provide(Provider),
  Layer.provide(LocalAccount(key))
)
```

**Recommendation**: Create preset layers
```typescript
const FullSigner = Layer.mergeAll(
  Signer.Live,
  Provider,
  LocalAccount(key),
  HttpTransport(url)
)
```

### 10. Use Effect.Tag for Branded Types

**Current**: Branded types via type intersection
```typescript
type AddressType = Uint8Array & { readonly __tag: 'Address' }
```

**Already covered in voltaire primitives - this is fine.**

### 11. Use PrimaryKey for Request Deduplication

When using Effect.Request:
```typescript
class GetBalance extends Request.TaggedClass('GetBalance')<
  ProviderError,
  bigint
>() {
  static [Request.PrimaryKey] = (req: GetBalance) => 
    `${req.address}-${req.blockTag}`
}
```

### 12. Use Fiber for Background Operations

**Current**: BlockStream uses async iterators
**Alternative**: Could use Effect.Fiber

```typescript
const startBlockWatcher = Effect.gen(function* () {
  const fiber = yield* pipe(
    provider.watchBlocks(),
    Stream.runForEach(block => handleBlock(block)),
    Effect.fork
  )
  
  return fiber
})
```

## Specific Recommendations by Service

### TransportService

- Use Effect.Request for automatic batching
- Add Effect.Config for configuration
- Use Scope for connection lifecycle

### ProviderService

- Use Effect.Schema for response types
- Consider Effect.Cache for block/tx caching
- Add Request-based API alongside direct methods

### SignerService

- Use Ref for nonce tracking
- Add transaction middleware via pipe

### AccountService

- Use Effect.Secret for private keys (if available)
- Consider resource management for hardware wallet connections

### ChainService

- Use Effect.Config for chain overrides
- Consider Config.Provider for per-environment chains

## Migration Path

1. **Phase 1**: Add Effect.Schema for types (non-breaking)
2. **Phase 2**: Add Effect.Request as alternative API (non-breaking)
3. **Phase 3**: Use Effect.Config (minor breaking)
4. **Phase 4**: Scope-based resources (minor breaking)
