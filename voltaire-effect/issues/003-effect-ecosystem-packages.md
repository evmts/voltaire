# Effect Ecosystem Packages for voltaire-effect

**Priority**: P2 (remaining)
**Status**: ✅ MOSTLY COMPLETE  
**Created**: 2026-01-25
**Updated**: 2026-01-26

## Summary

Core packages adopted. Remaining work is optimization (Effect.Cache, Effect.Request).

## Implementation Status

| Package | Status | Notes |
|---------|--------|-------|
| `@effect/platform` | ✅ Done | HttpTransport + WebSocketTransport use it |
| `@effect/platform-node` | ✅ Done | Added as optional/dev dependency |
| `@effect/platform-browser` | ✅ Done | Added as optional dependency |
| `@effect/platform-bun` | ✅ Done | Added as optional dependency |
| `@effect/vitest` | ✅ Done | Migrated 86 test files to use `it.effect` |
| `effect/Redacted` | ✅ Done | LocalAccount wraps private keys |
| Transport rewrite | ✅ Done | HttpTransport + WebSocketTransport now use @effect/platform |

## Remaining (P2 - nice to have)
| Package | Priority | Notes |
|---------|----------|-------|
| `effect/Cache` | P2 | Replace MemoryCache for auto-lookup |
| `effect/Request` | P2 | RPC batching/dedup (currently manual BatchScheduler) |
| `effect/Config` | P3 | Replace hardcoded transport config |
| `@effect/experimental` | P3 | RateLimiter, PersistedCache |

## Summary

Effect provides a rich ecosystem of packages beyond the core `effect` package. voltaire-effect currently only uses `effect` as a peer dependency. This document identifies Effect ecosystem packages that should be integrated to improve code quality, reduce boilerplate, and leverage battle-tested implementations.

## Current State

voltaire-effect currently imports from `effect/*`:
- Effect, Schema, ParseResult, Layer, Context (most used)
- Stream, Data, Duration, Schedule, Runtime
- SynchronizedRef, Ref, Deferred, Option, Exit
- Fiber, Clock, TestClock, TestContext

**@effect/* packages now used**:
- `@effect/platform` (HttpTransport/WebSocketTransport)
- `@effect/vitest` (test helpers)

---

## Recommended Packages

### 1. @effect/platform (P0 - Critical)

**Purpose**: Platform-agnostic HTTP, WebSocket, FileSystem, Workers

**Why needed**: Transport migration is now complete for HTTP and WebSocket; remaining gaps are IPC/custom transports and optional request/response hooks.

**Install**:
```bash
pnpm add @effect/platform
pnpm add @effect/platform-node  # for Node.js
pnpm add @effect/platform-browser  # for browser
pnpm add @effect/platform-bun  # for Bun
```

**Use cases**:

| Component | Current | With @effect/platform |
|-----------|---------|----------------------|
| HttpTransport | ✅ Uses `@effect/platform/HttpClient` | `HttpClient` with retry/timeout |
| WebSocketTransport | ✅ Uses `Socket.makeWebSocket` | Effect-native socket |
| IPC Transport | Not implemented | `FileSystem` for Unix sockets |
| Request batching | ✅ Fixed: Uses Effect Queue/Ref (review 084) | `HttpClient.batched` |

**Key modules**:
- `@effect/platform/HttpClient` - HTTP client with retry, timeout, middleware
- `@effect/platform/HttpClientRequest` - Request building
- `@effect/platform/HttpClientResponse` - Response handling
- `@effect/platform/Socket` - WebSocket with reconnection
- `@effect/platform/FileSystem` - File operations
- `@effect/platform/KeyValueStore` - Persistent key-value storage
- `@effect/platform/Terminal` - Terminal I/O

**Example**:
```typescript
import * as HttpClient from "@effect/platform/HttpClient"
import { NodeHttpClient } from "@effect/platform-node"

const HttpTransport = (url: string) =>
  Layer.scoped(TransportService, Effect.gen(function* () {
    const client = (yield* HttpClient.HttpClient).pipe(
      HttpClient.retryTransient({ times: 3 }),
      HttpClient.timeout(Duration.seconds(30))
    )
    // ...
  })).pipe(Layer.provide(NodeHttpClient.layer))
```

---

### 2. @effect/vitest (P1 - High)

**Purpose**: Vitest integration with Effect-native test helpers

**Why needed**: Tests currently use raw `Effect.runPromise` and manual TestClock setup. @effect/vitest provides `it.effect`, `it.scoped`, automatic TestContext injection.

**Install**:
```bash
pnpm add -D @effect/vitest
```

**Benefits**:
- `it.effect` - Auto-injects TestContext (TestClock, etc.)
- `it.scoped` - Manages Scope for tests with resources
- `it.flakyTest` - Retry flaky tests
- `it.live` - Run with real-time clock when needed
- Built-in Effect assertions

**Current pattern**:
```typescript
import { describe, it, expect } from "vitest"
import { Effect, TestClock, TestContext } from "effect"

it("test", async () => {
  await Effect.runPromise(
    Effect.gen(function* () {
      yield* TestClock.adjust("1 second")
      // ...
    }).pipe(Effect.provide(TestContext.TestContext))
  )
})
```

**With @effect/vitest**:
```typescript
import { it, expect } from "@effect/vitest"
import { Effect, TestClock } from "effect"

it.effect("test", () =>
  Effect.gen(function* () {
    yield* TestClock.adjust("1 second")  // TestContext auto-provided
    // ...
  })
)
```

---

### 3. @effect/rpc (P2 - Medium)

**Purpose**: Type-safe RPC with batching, streaming, middleware

**Why needed**: voltaire-effect implements JSON-RPC manually. @effect/rpc provides type-safe request/response handling with automatic batching.

**Install**:
```bash
pnpm add @effect/rpc
```

**Benefits**:
- Schema-based request/response definitions
- Automatic request batching
- Streaming RPC support
- Middleware for auth, logging
- Client/server implementations

**Use case**: JSON-RPC provider could use RpcClient pattern:
```typescript
import { Rpc, RpcGroup, RpcClient } from "@effect/rpc"

class EthRpcs extends RpcGroup.make(
  Rpc.make("eth_blockNumber", {
    success: Schema.BigInt,
    error: RpcError
  }),
  Rpc.make("eth_getBalance", {
    success: Schema.BigInt,
    error: RpcError,
    payload: {
      address: AddressSchema,
      block: BlockTagSchema
    }
  })
) {}

const client = yield* RpcClient.make(EthRpcs)
const blockNumber = yield* client.eth_blockNumber({})
```

---

### 4. @effect/experimental (P2 - Medium)

**Purpose**: Experimental features - RateLimiter, PersistedCache, Machine

**Why needed**: voltaire-effect could use RateLimiter for RPC rate limiting, PersistedCache for persistent caching.

**Install**:
```bash
pnpm add @effect/experimental
```

**Useful modules**:

| Module | Use Case |
|--------|----------|
| `RateLimiter` | RPC rate limiting (token bucket, fixed window) |
| `PersistedCache` | Disk-backed cache with TTL (vs current MemoryCache) |
| `Machine` | State machines for connection state |
| `DevTools` | Effect DevTools integration |

**Example - RateLimiter for RPC**:
```typescript
import * as RateLimiter from "@effect/experimental/RateLimiter"

const rateLimitedRequest = Effect.gen(function* () {
  const limiter = yield* RateLimiter.RateLimiter
  yield* limiter.consume({
    key: "eth_call",
    window: Duration.seconds(1),
    limit: 100,
    onExceeded: "delay"  // or "fail"
  })
  return yield* transport.request("eth_call", params)
})
```

**Example - PersistedCache**:
```typescript
import * as PersistedCache from "@effect/experimental/PersistedCache"
import * as Persistence from "@effect/experimental/Persistence"

const cache = yield* PersistedCache.make({
  storeId: "eth-cache",
  lookup: (key) => provider.getBalance(key.address),
  timeToLive: (key) => Duration.minutes(5),
  inMemoryCapacity: 1000
})
```

---

### 5. @effect/opentelemetry (P3 - Low)

**Purpose**: OpenTelemetry integration for tracing/metrics

**Why needed**: voltaire-effect uses `Effect.withSpan` but doesn't export traces. @effect/opentelemetry enables exporting to Jaeger, Zipkin, etc.

**Install**:
```bash
pnpm add @effect/opentelemetry
pnpm add @opentelemetry/sdk-node @opentelemetry/exporter-trace-otlp-http
```

**Use case**: Production observability for Ethereum RPC calls:
```typescript
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http"
import { NodeSdk } from "@effect/opentelemetry"

const TracingLive = NodeSdk.layer(() => ({
  resource: { serviceName: "voltaire-effect" },
  spanProcessor: new BatchSpanProcessor(new OTLPTraceExporter())
}))

// All Effect.withSpan calls now export to OTLP
```

---

### 6. Core Effect Modules Not Being Used (P1-P2)

voltaire-effect only uses ~20 of 150+ Effect core modules. Key missing ones:

| Module | Priority | Use Case |
|--------|----------|----------|
| `effect/Cache` | P1 | Auto-lookup cache (replace MemoryCache) |
| `effect/ScopedCache` | P1 | Cache with scoped values |
| `effect/Request` + `effect/RequestResolver` | P1 | Request batching/deduplication |
| `effect/RateLimiter` | P1 | Built-in rate limiting |
| `effect/Pool` | P2 | Connection pooling for transports |
| `effect/KeyedPool` | P2 | Keyed connection pools |
| `effect/Queue` | P1 | Effect-native queues (for WebSocket messages) |
| `effect/PubSub` | P2 | Pub/sub for event streaming |
| `effect/Mailbox` | P2 | Actor-like mailboxes |
| `effect/Config` | P2 | Type-safe configuration |
| `effect/ConfigProvider` | P2 | Config from env/files |
| `effect/Metric` | P3 | Built-in metrics |
| `effect/Tracer` | P2 | Tracing (already using withSpan) |
| `effect/Logger` | P2 | Structured logging |
| `effect/Match` | P2 | Pattern matching |
| `effect/DateTime` | P2 | Date/time handling |
| `effect/Encoding` | P2 | Base64, hex encoding |
| `effect/HashMap` | P2 | Immutable hash maps |
| `effect/HashSet` | P2 | Immutable hash sets |
| `effect/Chunk` | P2 | Efficient immutable arrays |
| `effect/BigDecimal` | P2 | Arbitrary precision decimals |
| `effect/Brand` | P1 | Branded types (like AddressType) |
| `effect/Redacted` | P1 | Redact sensitive data (private keys) |
| `effect/ManagedRuntime` | P2 | Runtime with resource management |
| `effect/Reloadable` | P2 | Hot-reloadable services |
| `effect/STM` | P2 | Software transactional memory |
| `effect/Channel` | P2 | Bidirectional streams |
| `effect/Sink` | P2 | Stream consumers |

**High-value quick wins:**
1. `effect/Cache` - Replace MemoryCache
2. `effect/Request` + `RequestResolver` - RPC batching
3. `effect/Queue` - WebSocket message handling
4. `effect/Redacted` - Private key protection
5. `effect/Brand` - Already using branded types, could use Effect's

---

### 7. effect/Cache (P1 - High)

**Purpose**: Built-in Effect caching with automatic lookup

**Why needed**: voltaire-effect implements custom MemoryCache with SynchronizedRef. Effect has built-in `Cache` with better semantics.

**Benefits**:
- Automatic lookup on cache miss
- Request deduplication (same key = single lookup)
- Built-in TTL via `timeToLive`
- Size-based eviction
- Metrics built-in

**Current pattern**:
```typescript
const cache = yield* CacheService
const cached = yield* cache.get("key")
if (Option.isNone(cached)) {
  const value = yield* fetchValue()
  yield* cache.set("key", value)
  return value
}
return cached.value
```

**With effect/Cache**:
```typescript
import * as Cache from "effect/Cache"

const cache = yield* Cache.make({
  lookup: (key: string) => fetchValue(key),
  capacity: 1000,
  timeToLive: Duration.minutes(5)
})

const value = yield* cache.get("key")  // auto-fetches on miss
```

---

## Implementation Roadmap

### Phase 1: @effect/platform (Week 1-2)
1. Add `@effect/platform`, `@effect/platform-node`, `@effect/platform-browser` as dependencies
2. Rewrite `HttpTransport` using `HttpClient`
3. Rewrite `WebSocketTransport` using `Socket`
4. Update tests to use platform mocks

### Phase 2: @effect/vitest (Week 2)
1. Add `@effect/vitest` as dev dependency
2. Migrate all tests to use `it.effect`, `it.scoped`
3. Remove manual `TestContext.TestContext` provides

### Phase 3: effect/Cache (Week 2-3)
1. Evaluate replacing `MemoryCache` with `effect/Cache`
2. Keep `CacheService` as abstraction but use `Cache` internally
3. Add lookup-based caching for common RPC calls

### Phase 4: @effect/experimental (Week 3-4)
1. Add `@effect/experimental` as optional dependency
2. Implement `RateLimiter` for RPC rate limiting
3. Consider `PersistedCache` for disk-backed caching

### Phase 5: @effect/opentelemetry (Week 4+)
1. Add as optional dependency
2. Document tracing configuration
3. Add span attributes for RPC method, chain ID

---

## Package Comparison

| Package | Priority | Effort | Impact |
|---------|----------|--------|--------|
| @effect/platform | P0 | High | Critical - fixes transport anti-patterns |
| @effect/vitest | P1 | Low | Medium - cleaner tests |
| effect/Cache | P1 | Medium | Medium - better caching semantics |
| @effect/rpc | P2 | High | Medium - type-safe RPC |
| @effect/experimental | P2 | Medium | Medium - rate limiting, persistence |
| @effect/opentelemetry | P3 | Low | Low - optional observability |

---

## Complete Effect Package List

All packages in the Effect ecosystem (as of 2026-01):

| Package | Relevance | Notes |
|---------|-----------|-------|
| **effect** | ✅ Required | Core - already using |
| **@effect/platform** | ✅ P0 | HTTP, WebSocket, FileSystem |
| **@effect/platform-node** | ✅ P0 | Node.js platform impl |
| **@effect/platform-browser** | ✅ P0 | Browser platform impl |
| **@effect/platform-bun** | ⚪ Optional | Bun platform impl |
| **@effect/vitest** | ✅ P1 | Test helpers |
| **@effect/rpc** | ❌ Not compatible | Uses custom protocol, not JSON-RPC compatible |
| **@effect/experimental** | ⚪ P2 | RateLimiter, PersistedCache |
| **@effect/opentelemetry** | ⚪ P3 | Tracing/observability |
| **@effect/typeclass** | ❌ Not needed | FP typeclasses (Monoid, etc.) |
| **@effect/workflow** | ❌ Not needed | Durable workflows (needs cluster) |
| **@effect/cluster** | ❌ Not needed | Distributed coordination |
| **@effect/cli** | ❌ Not needed | CLI apps (voltaire is a lib) |
| **@effect/printer** | ❌ Not needed | Terminal formatting |
| **@effect/printer-ansi** | ❌ Not needed | ANSI terminal output |
| **@effect/sql** | ❌ Not needed | No SQL in voltaire |
| **@effect/sql-**** | ❌ Not needed | DB-specific SQL adapters |
| **@effect/ai** | ❌ Not needed | AI/LLM integrations |
| **@effect/ai-openai** | ❌ Not needed | OpenAI adapter |
| **@effect/ai-anthropic** | ❌ Not needed | Anthropic adapter |
| **@effect/ai-google** | ❌ Not needed | Google AI adapter |

---

## References

- [Effect Platform Documentation](https://effect.website/docs/platform/introduction)
- [Effect RPC Documentation](https://effect.website/docs/rpc)
- [Effect Vitest](https://effect.website/docs/testing/vitest)
- [Effect Experimental](https://github.com/Effect-TS/effect/tree/main/packages/experimental)
- [Effect OpenTelemetry](https://github.com/Effect-TS/effect/tree/main/packages/opentelemetry)
