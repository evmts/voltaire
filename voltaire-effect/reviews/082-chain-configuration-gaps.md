# Chain Configuration Gaps

**Date**: 2026-01-25
**Priority**: Medium
**Category**: Configuration / L2 Compatibility

## Overview

viem's chain configuration is highly extensible to support L2-specific behaviors. voltaire-effect's ChainConfig is minimal.

## Feature Comparison

### Basic Properties

| Property | viem | voltaire-effect |
|----------|------|-----------------|
| `id` | ✅ | ✅ |
| `name` | ✅ | ✅ |
| `nativeCurrency` | ✅ | ✅ |
| `blockTime` | ✅ | ✅ |
| `testnet` | ✅ | ✅ |
| `rpcUrls.default` | ✅ | ✅ |
| `rpcUrls.{named}` | ✅ Multiple | ❌ Only default |
| `blockExplorers` | ✅ | ✅ |

### Contract Addresses

| Contract | viem | voltaire-effect |
|----------|------|-----------------|
| `multicall3` | ✅ | ✅ |
| `ensRegistry` | ✅ | ✅ |
| `ensUniversalResolver` | ✅ | ✅ |
| `erc6492Verifier` | ✅ | ❌ |
| Custom contracts | ✅ Extensible | ❌ Fixed set |

### Fee Configuration

| Feature | viem | voltaire-effect |
|---------|------|-----------------|
| `fees.baseFeeMultiplier` | number or `(params) => number` | Only via FeeEstimator |
| `fees.maxPriorityFeePerGas` | bigint or `(params) => bigint` | Only via provider |
| `fees.estimateFeesPerGas` | Custom function | ❌ Not per-chain |

viem example:
```typescript
const optimism = {
  fees: {
    baseFeeMultiplier: 1.05,  // Lower for L2s
    maxPriorityFeePerGas: async ({ block }) => {
      // Custom priority fee logic
      return 1_000_000n
    },
    estimateFeesPerGas: async ({ block, client, multiply }) => {
      // Custom fee estimation for L2
      return { maxFeePerGas, maxPriorityFeePerGas }
    }
  }
}
```

**Impact**: Can't customize fee estimation per chain.

### Formatters (L2 Compatibility)

| Formatter | Purpose | viem | voltaire-effect |
|-----------|---------|------|-----------------|
| `formatters.block` | Custom block fields | ✅ | ❌ |
| `formatters.transaction` | Custom tx fields | ✅ | ❌ |
| `formatters.transactionReceipt` | Custom receipt fields | ✅ | ❌ |
| `formatters.transactionRequest` | Custom request fields | ✅ | ❌ |

viem example for Optimism:
```typescript
const optimism = {
  formatters: {
    block: {
      format: (block) => ({
        ...block,
        stateRoot: block.stateRoot  // Optimism-specific
      })
    },
    transaction: {
      format: (tx) => ({
        ...tx,
        l1Fee: tx.l1Fee,           // L1 data fee
        l1GasPrice: tx.l1GasPrice,
        l1GasUsed: tx.l1GasUsed
      })
    }
  }
}
```

**Impact**: L2 transactions don't expose L2-specific fields.

### Serializers

| Serializer | Purpose | viem | voltaire-effect |
|------------|---------|------|-----------------|
| `serializers.transaction` | Custom tx encoding | ✅ | ❌ |

viem example for Celo:
```typescript
const celo = {
  serializers: {
    transaction: (tx) => {
      // Celo uses different RLP structure
      return customSerialize(tx)
    }
  }
}
```

**Impact**: Can't support chains with non-standard tx encoding.

### Transaction Preparation Hooks

| Hook | Purpose | viem | voltaire-effect |
|------|---------|------|-----------------|
| `prepareTransactionRequest` | Pre-fill hook | ✅ | ❌ |

viem supports running hooks at different phases:
- `beforeFillTransaction` - Before eth_fillTransaction
- `beforeFillParameters` - Before filling gas/nonce
- `afterFillParameters` - After filling, before signing

**Impact**: Can't inject chain-specific logic during tx preparation.

### Signature Verification

| Feature | viem | voltaire-effect |
|---------|------|-----------------|
| `verifyHash` | Custom chain verification | ✅ | ❌ |

For chains with custom signature schemes.

### L2 Source Chain

| Property | Purpose | viem | voltaire-effect |
|----------|---------|------|-----------------|
| `sourceId` | L1 chain ID | ✅ | ❌ |

For L2 chains, identifies the parent L1 chain.

### ENS

| Property | viem | voltaire-effect |
|----------|------|-----------------|
| `ensTlds` | Supported TLDs | ✅ | ❌ |

Example: Optimism supports `.op` names.

### Experimental Features

| Property | Purpose | viem | voltaire-effect |
|----------|---------|------|-----------------|
| `experimental_preconfirmationTime` | Preconf timing | ✅ | ❌ |

Affects default block tag selection.

## Predefined Chains Comparison

### viem

Hundreds of chains in `viem/chains`:
- All major L1s
- All major L2s (Optimism, Arbitrum, Base, zkSync, etc.)
- Testnets
- App-specific chains

### voltaire-effect

Only in `/services/Chain/chains/`:
- Limited set (need to check actual files)

## Recommendations

### High Priority (L2 Compatibility)

1. **Add formatters support**
   ```typescript
   interface ChainConfig {
     formatters?: {
       block?: ChainFormatter<'block'>
       transaction?: ChainFormatter<'transaction'>
       transactionReceipt?: ChainFormatter<'transactionReceipt'>
       transactionRequest?: ChainFormatter<'transactionRequest'>
     }
   }
   ```

2. **Add per-chain fee configuration**
   ```typescript
   interface ChainConfig {
     fees?: {
       baseFeeMultiplier?: number | ((params) => number)
       maxPriorityFeePerGas?: bigint | ((params) => bigint)
       estimateFeesPerGas?: (params) => Promise<FeeValues>
     }
   }
   ```

3. **Add transaction serializers**
   ```typescript
   interface ChainConfig {
     serializers?: {
       transaction?: (tx) => Uint8Array
     }
   }
   ```

### Medium Priority

4. **Add `prepareTransactionRequest` hook**
   - Allow chain-specific tx preparation logic

5. **Add multiple RPC URLs**
   ```typescript
   rpcUrls: {
     default: { http: [...] },
     alchemy: { http: [...] },
     infura: { http: [...] }
   }
   ```

6. **Add `sourceId` for L2s**
   - Links L2 to its L1

7. **Add extensible contracts**
   - Allow any contract address, not just hardcoded set

### Lower Priority

8. **Add more predefined chains**
   - Copy from viem/chains

9. **Add `ensTlds`**
   - Support chain-specific ENS TLDs

10. **Add `verifyHash`**
    - Custom signature verification

11. **Add `experimental_preconfirmationTime`**
    - Better default block tags for preconf chains
