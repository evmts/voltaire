# Viem WalletClient Analysis

**Date**: 2026-01-25
**Priority**: Reference
**Category**: Architecture Analysis

## Overview

This document analyzes viem's WalletClient abstraction to identify configurable features, patterns, and gaps in voltaire-effect's Signer abstraction.

## WalletClient Configuration Options

### 1. Core Client Configuration (from `createClient`)

| Option | viem | voltaire-effect | Gap |
|--------|------|-----------------|-----|
| `account` | Optional Account | Via AccountService layer | ✅ Equivalent |
| `chain` | Chain config | ChainService | ✅ Equivalent |
| `transport` | Transport | TransportService | ✅ Equivalent |
| `batch.multicall` | `boolean \| MulticallBatchOptions` | Missing | ❌ **Missing** |
| `cacheTime` | Auto from blockTime/2 | No caching config | ❌ **Missing** |
| `ccipRead` | `{ request } \| false` | Ccip service exists but not wired | ⚠️ Partial |
| `key` | String identifier | Not exposed | ⚠️ Minor |
| `name` | String name | Not exposed | ⚠️ Minor |
| `pollingInterval` | Auto from blockTime | Hardcoded in some places | ⚠️ Partial |
| `rpcSchema` | Typed JSON-RPC schema | Not supported | ❌ **Missing** |
| `experimental_blockTag` | Default block tag | Not supported | ❌ **Missing** |

### 2. MulticallBatchOptions (missing entirely)

```typescript
// viem config
{
  batch: {
    multicall: {
      batchSize?: number      // @default 1_024
      deployless?: boolean    // Enable deployless multicall
      wait?: number          // @default 0 (ms before sending batch)
    }
  }
}
```

**Impact**: Users can't batch `eth_call` requests automatically via multicall3.

### 3. Chain Configuration (mostly covered)

| Feature | viem | voltaire-effect ChainConfig |
|---------|------|---------------------------|
| `id` | ✅ | ✅ |
| `name` | ✅ | ✅ |
| `nativeCurrency` | ✅ | ✅ |
| `blockTime` | ✅ | ✅ |
| `rpcUrls` | Multiple named URLs | Only `default` | ⚠️ |
| `blockExplorers` | ✅ | ✅ |
| `contracts.multicall3` | ✅ | ✅ |
| `contracts.ensRegistry` | ✅ | ✅ |
| `contracts.ensUniversalResolver` | ✅ | ✅ |
| `contracts.erc6492Verifier` | ✅ | ❌ Missing |
| `fees.baseFeeMultiplier` | Function/number | Only number via FeeEstimator | ⚠️ |
| `fees.maxPriorityFeePerGas` | Function/bigint | Only via provider | ⚠️ |
| `fees.estimateFeesPerGas` | Custom function | Fixed implementation | ❌ |
| `formatters.block` | Custom formatter | Not supported | ❌ |
| `formatters.transaction` | Custom formatter | Not supported | ❌ |
| `formatters.transactionReceipt` | Custom formatter | Not supported | ❌ |
| `formatters.transactionRequest` | Custom formatter | Not supported | ❌ |
| `serializers.transaction` | Custom serializer | Not supported | ❌ |
| `prepareTransactionRequest` | Hook function | Not supported | ❌ |
| `verifyHash` | Custom verification | Not supported | ❌ |
| `sourceId` | L1 chain ID | Not supported | ❌ |
| `testnet` | Flag | ✅ | ✅ |
| `ensTlds` | ENS TLDs | Not supported | ❌ |
| `experimental_preconfirmationTime` | Preconf time | Not supported | ❌ |

## WalletActions (viem capabilities)

### Currently Implemented in SignerService

- ✅ `signMessage` - EIP-191 personal_sign
- ✅ `signTransaction` - Transaction signing
- ✅ `signTypedData` - EIP-712
- ✅ `sendTransaction` - Send and broadcast
- ✅ `sendRawTransaction` - Broadcast pre-signed
- ✅ `requestAddresses` - eth_requestAccounts
- ✅ `switchChain` - wallet_switchEthereumChain
- ✅ `getCapabilities` - EIP-5792 wallet_getCapabilities
- ✅ `sendCalls` - EIP-5792 wallet_sendCalls
- ✅ `getCallsStatus` - EIP-5792 wallet_getCallsStatus
- ✅ `waitForCallsStatus` - Poll for bundle completion

### Missing from SignerService

| Action | viem | Status |
|--------|------|--------|
| `addChain` | eth_addEthereumChain | ❌ **Missing** |
| `deployContract` | Convenience wrapper | ❌ **Missing** |
| `fillTransaction` | eth_fillTransaction | ❌ **Missing** |
| `getAddresses` | eth_accounts | ❌ **Missing** (have requestAddresses) |
| `getChainId` | eth_chainId | ⚠️ Via ProviderService |
| `getPermissions` | wallet_getPermissions | ❌ **Missing** |
| `prepareAuthorization` | EIP-7702 auth prep | ❌ **Missing** |
| `prepareTransactionRequest` | Fill missing fields | ⚠️ Internal only |
| `requestPermissions` | wallet_requestPermissions | ❌ **Missing** |
| `sendCallsSync` | Sync send + receipt | ❌ **Missing** |
| `sendRawTransactionSync` | Sync send + receipt | ❌ **Missing** |
| `sendTransactionSync` | Sync send + receipt | ❌ **Missing** |
| `showCallsStatus` | wallet_showCallsStatus | ❌ **Missing** |
| `signAuthorization` | EIP-7702 | ❌ **Missing** |
| `watchAsset` | wallet_watchAsset | ❌ **Missing** |
| `writeContract` | Contract call helper | ❌ **Missing** |
| `writeContractSync` | Contract + receipt | ❌ **Missing** |

## Transport Configuration

### HTTP Transport

| Option | viem | voltaire-effect |
|--------|------|-----------------|
| `batch` | JSON-RPC batching | Via BatchScheduler | ✅ |
| `batch.batchSize` | @default 1_000 | @default 100 | ⚠️ Different default |
| `batch.wait` | @default 0 | @default 10 | ⚠️ Different default |
| `fetchFn` | Custom fetch | Not exposed | ❌ |
| `fetchOptions` | Request options | Not exposed | ❌ |
| `onFetchRequest` | Request callback | Not exposed | ❌ |
| `onFetchResponse` | Response callback | Not exposed | ❌ |
| `methods.include/exclude` | Filter methods | Not exposed | ❌ |
| `raw` | Return JSON-RPC errors | Not exposed | ❌ |
| `retryCount` | @default 3 | @default 3 | ✅ |
| `retryDelay` | @default 150 | @default 150 | ✅ |
| `timeout` | @default 10_000 | @default 10_000 | ✅ |

### Fallback Transport

| Option | viem | voltaire-effect |
|--------|------|-----------------|
| `rank` | Auto-rank by latency/stability | Not supported | ❌ |
| `rank.interval` | Ranking interval | N/A | ❌ |
| `rank.ping` | Custom ping method | N/A | ❌ |
| `rank.sampleCount` | @default 10 | N/A | ❌ |
| `rank.timeout` | @default 1_000 | N/A | ❌ |
| `rank.weights.latency` | @default 0.3 | N/A | ❌ |
| `rank.weights.stability` | @default 0.7 | N/A | ❌ |
| `shouldThrow` | Error callback | Not exposed | ❌ |
| `onResponse` | Response callback | Not exposed | ❌ |

### Custom Transport

| Option | viem | voltaire-effect |
|--------|------|-----------------|
| EIP-1193 provider | ✅ Via `custom()` | ✅ Via BrowserTransport | ✅ |

### WebSocket Transport

| Option | viem | voltaire-effect |
|--------|------|-----------------|
| Auto-reconnect | Not built-in | Not built-in | ⚠️ |
| Subscription support | Via EIP-1193 | Partial | ⚠️ |
| Keep-alive | Not exposed | Not exposed | ⚠️ |

## Recommendations

### High Priority (API Completeness)

1. **Add `addChain`** - Essential for dApp UX
2. **Add `getAddresses`** - Different from `requestAddresses` (no popup)
3. **Add `getPermissions` / `requestPermissions`** - EIP-2255 compliance
4. **Add `signAuthorization`** - EIP-7702 is live
5. **Add `watchAsset`** - EIP-747 token display
6. **Add `deployContract`** - Common convenience pattern

### Medium Priority (Configuration)

7. **Add `cacheTime` config** - Users need cache control
8. **Add `pollingInterval` config** - Currently hardcoded
9. **Add multicall batching** - Performance critical
10. **Add `fetchOptions` to HttpTransport** - Headers, credentials
11. **Add fallback transport ranking** - Better reliability

### Lower Priority (Advanced)

12. **Add chain formatters** - L2 compatibility
13. **Add chain serializers** - Custom tx types
14. **Add `prepareTransactionRequest` hook** - Chain-specific logic
15. **Add `experimental_blockTag`** - Preconfirmation support
16. **Add `rpcSchema` typing** - Better type inference
