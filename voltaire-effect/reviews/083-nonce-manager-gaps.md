# NonceManager Gaps

**Date**: 2026-01-25
**Priority**: High
**Category**: Missing Features / Architecture

## Overview

viem's NonceManager is more flexible and better integrated with accounts. voltaire-effect's NonceManagerService is functional but has gaps.

## API Comparison

### viem NonceManager

```typescript
interface NonceManager {
  consume(params: { address, chainId, client }): Promise<number>
  increment(params: { address, chainId }): void
  get(params: { address, chainId, client }): Promise<number>
  reset(params: { address, chainId }): void
}

interface NonceManagerSource {
  get(params: { address, chainId, client }): Promise<number> | number
  set(params: { address, chainId }, nonce: number): void | Promise<void>
}

// Built-in source
function jsonRpc(): NonceManagerSource
```

### voltaire-effect NonceManagerService

```typescript
interface NonceManagerShape {
  get(address: string): Effect<number, NonceError, ProviderService>
  consume(address: string): Effect<number, NonceError, ProviderService>
  increment(address: string): Effect<void>
  reset(address: string): Effect<void>
}
```

## Key Gaps

### 1. No `chainId` in Key

**viem**: Keys by `${address}.${chainId}`
**voltaire-effect**: Keys by `address` only

**Impact**: Multi-chain apps will have nonce collisions if same address is used on multiple chains.

**Fix**:
```typescript
// Change API to include chainId
get(address: string, chainId: number): Effect<number, ...>
consume(address: string, chainId: number): Effect<number, ...>
```

### 2. No Custom Sources

**viem**: Pluggable sources via `createNonceManager({ source })`
**voltaire-effect**: Fixed implementation

Use cases for custom sources:
- External nonce tracking service
- Database-backed nonces for distributed systems
- Custom block tag (not 'pending')

**Fix**: Add NonceManagerSourceService:
```typescript
interface NonceManagerSourceShape {
  get(params: { address, chainId, client }): Effect<number>
  set(params: { address, chainId }, nonce: number): Effect<void>
}
```

### 3. No Account Integration

**viem**: Account can have built-in nonce manager:
```typescript
const account = privateKeyToAccount('0x...', {
  nonceManager: createNonceManager({ source: jsonRpc() })
})
```

**voltaire-effect**: NonceManager is separate service, not account-aware.

**Impact**: Users must manually manage nonce service alongside account.

**Fix**: Add optional NonceManager to LocalAccount:
```typescript
LocalAccount(privateKey, { nonceManager: customManager })
```

### 4. Returns `number` Not `bigint`

**viem**: Returns `number` (nonces are small)
**voltaire-effect**: Returns `number` (good)

This is actually correct - nonces don't need bigint.

### 5. No LRU Cache

**viem**: Uses `LruMap<number>(8192)` for previous nonces
**voltaire-effect**: Simple Map (potential memory leak)

**Fix**: Use Effect's `Cache` or implement LRU.

### 6. Missing `set` on Source

**viem**: Source has `set(params, nonce)` for persistence
**voltaire-effect**: No persistence hook

**Fix**: Add to NonceManagerSourceShape.

## Thread Safety / Concurrency

### viem

Uses promise caching to prevent concurrent fetches:
```typescript
let promise = promiseMap.get(key)
if (!promise) {
  promise = fetchNonce()
  promiseMap.set(key, promise)
}
return delta + await promise
```

### voltaire-effect

Current implementation (from earlier reviews) has race conditions. Review `034-fix-nonce-manager-race-condition.md` addresses this.

## API Design Suggestions

### Current (voltaire-effect)

```typescript
const program = Effect.gen(function* () {
  const nonceManager = yield* NonceManagerService
  const nonce = yield* nonceManager.consume('0x...')
})
```

### Improved (with chainId)

```typescript
const program = Effect.gen(function* () {
  const nonceManager = yield* NonceManagerService
  const chainId = yield* provider.getChainId()
  const nonce = yield* nonceManager.consume('0x...', chainId)
})
```

### Or Effect-idiomatic (derive chainId from context)

```typescript
// NonceManager gets chainId from ChainService in context
const program = Effect.gen(function* () {
  const nonceManager = yield* NonceManagerService
  const nonce = yield* nonceManager.consume('0x...')
}).pipe(
  Effect.provide(mainnet)  // ChainService provides chainId
)
```

## Recommendations

### High Priority

1. **Add `chainId` to all operations**
   - Key by `${address}.${chainId}`
   - Prevents cross-chain nonce confusion

2. **Add LRU cache for previous nonces**
   - Prevent memory leaks
   - Match viem's 8192 limit

3. **Integrate with AccountService**
   - Optional `nonceManager` on LocalAccount
   - Auto-consume nonces in Signer

### Medium Priority

4. **Add custom sources**
   - `NonceManagerSourceService` abstraction
   - Allow external nonce storage

5. **Add persistence callback**
   - `set(address, chainId, nonce)` for custom storage

### Lower Priority

6. **Consider ChainService integration**
   - Auto-derive chainId from context
   - More Effect-idiomatic
