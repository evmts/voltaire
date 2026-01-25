# Transport Configuration Gaps

**Date**: 2026-01-25
**Priority**: Medium
**Category**: Configuration / Features

## HTTP Transport Comparison

### viem `http()`

```typescript
http(url?, {
  // Batching
  batch?: boolean | {
    batchSize?: number,    // @default 1_000
    wait?: number          // @default 0
  },
  
  // Fetch customization
  fetchFn?: typeof fetch,
  fetchOptions?: RequestInit,
  onFetchRequest?: (request) => void,
  onFetchResponse?: (response) => void,
  
  // Identity
  key?: string,
  name?: string,
  
  // RPC filtering
  methods?: { include?: string[] } | { exclude?: string[] },
  
  // Error handling
  raw?: boolean,  // Return JSON-RPC errors instead of throwing
  
  // Retry
  retryCount?: number,     // @default 3
  retryDelay?: number,     // @default 150
  
  // Typing
  rpcSchema?: RpcSchema,
  
  // Timing
  timeout?: number         // @default 10_000
})
```

### voltaire-effect `HttpTransport`

```typescript
HttpTransport(url, {
  timeout?: number,        // @default 10_000
  retryCount?: number,     // @default 3
  retryDelay?: number,     // @default 150
  // Batching via separate BatchScheduler
})
```

### Gaps

| Feature | viem | voltaire-effect | Priority |
|---------|------|-----------------|----------|
| `fetchFn` | ✅ | ❌ | Medium - testing/custom runtimes |
| `fetchOptions` | ✅ | ❌ | **High** - headers, credentials |
| `onFetchRequest` | ✅ | ❌ | Low - debugging |
| `onFetchResponse` | ✅ | ❌ | Low - debugging |
| `methods.include/exclude` | ✅ | ❌ | Medium - fallback routing |
| `raw` mode | ✅ | ❌ | Low - advanced error handling |
| `rpcSchema` typing | ✅ | ❌ | Low - type inference |
| `batchSize` configurable | ✅ | ❌ (hardcoded 100) | Medium |
| `batch.wait` configurable | ✅ | ❌ (hardcoded 10) | Medium |

### Critical Missing: `fetchOptions`

Users can't set:
- Custom headers (API keys, auth tokens)
- `credentials` for cookies
- `mode` for CORS
- `signal` for cancellation

**Workaround**: None. Users must fork the transport.

## Fallback Transport Comparison

### viem `fallback()`

```typescript
fallback([transport1, transport2, ...], {
  // Identity
  key?: string,
  name?: string,
  
  // Retry
  retryCount?: number,
  retryDelay?: number,
  
  // Smart ranking
  rank?: boolean | {
    interval?: number,       // @default pollingInterval
    ping?: (transport) => Promise<unknown>,
    sampleCount?: number,    // @default 10
    timeout?: number,        // @default 1_000
    weights?: {
      latency?: number,      // @default 0.3
      stability?: number     // @default 0.7
    }
  },
  
  // Error handling
  shouldThrow?: (error) => boolean,
  
  // Callbacks
  onResponse?: (response) => void
})
```

### voltaire-effect `FallbackTransport`

```typescript
FallbackTransport([transport1, transport2, ...], {
  // Basic fallback only
})
```

### Gaps

| Feature | viem | voltaire-effect | Priority |
|---------|------|-----------------|----------|
| Auto-ranking | ✅ | ❌ | **High** - reliability |
| `rank.interval` | ✅ | ❌ | High |
| `rank.ping` | ✅ | ❌ | Medium |
| `rank.weights` | ✅ | ❌ | Medium |
| `shouldThrow` | ✅ | ❌ | Medium - non-retryable errors |
| `onResponse` callback | ✅ | ❌ | Low - telemetry |
| Method filtering | ✅ (via underlying) | ❌ | Medium |

### Why Ranking Matters

Without ranking, fallback order is static. If the first transport is slow but working, all requests go through it. With ranking:

1. Sample all transports periodically
2. Score by latency (30%) and success rate (70%)
3. Reorder dynamically

**Result**: Faster, more reliable requests.

## WebSocket Transport

### viem

```typescript
webSocket(url?, {
  key?: string,
  name?: string,
  retryCount?: number,
  retryDelay?: number,
  timeout?: number,
  // Note: No auto-reconnect in viem either
})
```

### voltaire-effect

Similar basic implementation. Both lack:
- Auto-reconnect
- Subscription management
- Keep-alive pings
- Connection state callbacks

## Custom Transport

### viem

```typescript
custom(provider, {
  key?: string,
  methods?: { include/exclude },
  name?: string,
  retryCount?: number,
  retryDelay?: number
})
```

### voltaire-effect

`BrowserTransport` is conceptually similar but less configurable.

## Recommendations

### High Priority

1. **Add `fetchOptions` to HttpTransport**
   ```typescript
   HttpTransport(url, {
     fetchOptions: {
       headers: { 'X-API-Key': 'xxx' },
       credentials: 'include'
     }
   })
   ```

2. **Add fallback transport ranking**
   ```typescript
   FallbackTransport([...transports], {
     rank: true,
     rankOptions: {
       interval: 10_000,
       sampleCount: 10,
       weights: { latency: 0.3, stability: 0.7 }
     }
   })
   ```

3. **Expose batch configuration**
   ```typescript
   HttpTransport(url, {
     batch: {
       enabled: true,
       batchSize: 1000,
       wait: 0
     }
   })
   ```

### Medium Priority

4. **Add method filtering**
   - `include`: Only allow these methods
   - `exclude`: Block these methods
   - Useful for read-only fallbacks

5. **Add `shouldThrow` callback**
   - Skip to next transport only for retryable errors
   - Immediately throw for user rejection, execution reverts

6. **Add request/response callbacks**
   - `onRequest` for logging/telemetry
   - `onResponse` for debugging

### Lower Priority

7. **Add `fetchFn` for custom fetch implementations**
   - Testing with mocks
   - Different runtime (Bun, Deno)

8. **Add WebSocket reconnect logic**
   - Auto-reconnect with exponential backoff
   - Subscription resubscription

9. **Add connection state events**
   - `onConnect`, `onDisconnect`, `onError`
   - Stream-based connection status
