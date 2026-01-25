# Review 101: Chain Configuration and Network Primitives

**Date**: 2026-01-25  
**Reviewer**: Claude AI  
**Status**: ⚠️ Issues Found

## Overview

Review of chain/network primitives and the ChainService Layer pattern.

## Files Reviewed

### Primitives
- `src/primitives/Chain/ChainSchema.ts`, `index.ts`
- `src/primitives/ChainId/Number.ts`, `BigInt.ts`, `Hex.ts`, `index.ts`
- `src/primitives/NetworkId/Number.ts`, `BigInt.ts`, `Hex.ts`, `index.ts`

### Services
- `src/services/Chain/ChainService.ts`, `index.ts`
- `src/services/Chain/chains/mainnet.ts`, `sepolia.ts`, `optimism.ts`, `arbitrum.ts`, `base.ts`, `polygon.ts`, `index.ts`

---

## Checklist Results

### 1. Chain Definitions ✅

| Chain | ID | Native Currency | RPC | Explorer | Contracts |
|-------|-----|-----------------|-----|----------|-----------|
| Ethereum Mainnet | 1 | ETH | ✅ | ✅ | multicall3, ensUniversalResolver |
| Sepolia | 11155111 | ETH | ✅ | ✅ | multicall3, ensUniversalResolver |
| Optimism | 10 | ETH | ✅ | ✅ | multicall3 |
| Arbitrum | 42161 | ETH | ✅ | ✅ | multicall3 |
| Base | 8453 | ETH | ✅ | ✅ | multicall3 |
| Polygon | 137 | POL | ✅ | ✅ | multicall3 |

**Good**: Covers major chains with correct IDs and metadata.

**Missing chains to consider**:
- Holesky testnet (17000) - mentioned in NetworkId but no ChainService Layer
- Avalanche (43114)
- BSC (56)
- zkSync Era (324)
- Polygon zkEVM (1101)

### 2. Chain ID Consistency ✅

- ChainId primitive: Positive integer validation ✅
- ChainSchema: Validates `id > 0` ✅
- All chain configs use correct IDs ✅

**Note**: ChainId allows `> 0`, NetworkId allows `>= 0` - intentional difference documented.

### 3. RPC URL Handling ⚠️

**Current RPC providers**:
| Chain | Provider |
|-------|----------|
| Mainnet | eth.merkle.io |
| Sepolia | 11155111.rpc.thirdweb.com |
| Optimism | mainnet.optimism.io |
| Arbitrum | arb1.arbitrum.io/rpc |
| Base | mainnet.base.org |
| Polygon | polygon-rpc.com |

**Issues**:
1. Only single RPC per chain - no fallbacks
2. No rate limiting handling
3. No WebSocket URLs (ChainMetadata has `websocketUrls` field but unused)
4. Free public RPCs may be unreliable for production

**Recommendations**:
- Add fallback URLs: `http: ['primary', 'fallback1', 'fallback2']`
- Consider adding websocket support for subscriptions
- Document that users should provide their own RPC for production

### 4. Block Explorer URLs ✅

All chains have correct explorer configuration:
- Base URL ✅
- API URL ✅ (for programmatic access)

**Minor**: Polygon's apiUrl points to `etherscan.io/v2/api` - may need verification.

### 5. Native Currency Configuration ✅

All currencies correctly configured with 18 decimals.

**Good**: Polygon updated to POL (not MATIC).

### 6. Chain Service Layer Pattern ✅

**Design**:
```typescript
class ChainService extends Context.Tag("ChainService")<ChainService, ChainConfig>() {}
const mainnet = Layer.succeed(ChainService, mainnetConfig)
```

**Pros**:
- Clean Effect pattern
- Type-safe configuration
- Easy to create custom chains
- Configs exported separately from Layers

**Cons**:
- No factory function for custom chains (must use `Layer.succeed` directly)

### 7. Test Coverage ❌ CRITICAL

**NO TESTS EXIST** for any of these modules:
- `primitives/Chain/*.test.ts` - missing
- `primitives/ChainId/*.test.ts` - missing
- `primitives/NetworkId/*.test.ts` - missing
- `services/Chain/*.test.ts` - missing

---

## Issues Summary

### Critical ❌

| ID | Issue | Location | Fix |
|----|-------|----------|-----|
| C1 | No test coverage | All modules | Write comprehensive tests |

### High ⚠️

| ID | Issue | Location | Fix |
|----|-------|----------|-----|
| H1 | Single RPC per chain | chains/*.ts | Add fallback RPCs |
| H2 | Missing Holesky chain | services/Chain/chains/ | Add holesky.ts |
| H3 | ChainMetadata type unused | ChainSchema.ts | Either use or remove |

### Medium 📋

| ID | Issue | Location | Fix |
|----|-------|----------|-----|
| M1 | No WebSocket URLs | Chain configs | Add for subscription support |
| M2 | Polygon API URL suspect | polygon.ts | Verify etherscan v2 API |
| M3 | Duplicate ChainIdTypeSchema | BigInt.ts, Hex.ts, Number.ts | Extract to shared module |

### Low 💡

| ID | Issue | Location | Fix |
|----|-------|----------|-----|
| L1 | Missing chains | chains/ | Add BSC, Avalanche, zkSync |
| L2 | No `from` helper in Chain | Chain/index.ts | Add Effect-wrapped constructor |
| L3 | Goerli constant deprecated | NetworkId/Number.ts | Remove in next major |

---

## Code Quality

### Positives
- Excellent JSDoc documentation
- Clean module structure
- Effect Schema usage is idiomatic
- Branded types properly implemented
- viem/wagmi compatible format

### Areas for Improvement
- ChainIdTypeSchema duplicated in 3 files
- Could add helper functions like `Chain.fromId(1)`, `ChainId.isMainnet(id)`
- ChainMetadata interface defined but never used in ChainService

---

## Test Coverage Needed

```typescript
// Chain/Chain.test.ts
describe('ChainSchema', () => {
  it('validates positive chain ID')
  it('rejects zero chain ID')
  it('rejects negative chain ID')
  it('requires nativeCurrency')
  it('optional rpcUrls and blockExplorers')
})

// ChainId/ChainId.test.ts
describe('ChainId.Number', () => {
  it('decodes positive integers')
  it('rejects zero')
  it('rejects negative')
  it('rejects non-integers')
})

describe('ChainId.BigInt', () => {
  it('decodes positive bigints')
  it('rejects exceeding MAX_SAFE_INTEGER')
})

describe('ChainId.Hex', () => {
  it('decodes 0x1 to 1')
  it('decodes 0xaa36a7 to 11155111')
  it('rejects invalid hex')
})

// services/Chain/Chain.test.ts
describe('ChainService', () => {
  it('mainnet Layer provides correct config')
  it('sepolia is marked as testnet')
  it('L2 chains have correct block times')
})
```

---

## Recommendations

### Priority 1 (This Sprint)
1. Write tests for ChainId and NetworkId schemas
2. Write tests for ChainService Layers
3. Add Holesky testnet

### Priority 2 (Next Sprint)
1. Add fallback RPC URLs
2. Extract shared ChainIdTypeSchema
3. Add WebSocket URL support

### Priority 3 (Backlog)
1. Add more L2 chains
2. Consider chain registry integration
3. Add chain switching helpers

---

## Appendix: Type Structure

```
primitives/
├── Chain/
│   ├── ChainSchema.ts    # ChainType, ChainSchema, ChainMetadata
│   └── index.ts          # Re-exports
├── ChainId/
│   ├── Number.ts         # ChainIdType, Number schema
│   ├── BigInt.ts         # BigInt schema
│   ├── Hex.ts            # Hex schema
│   └── index.ts          # Re-exports
└── NetworkId/
    ├── Number.ts         # NetworkIdType, constants
    ├── BigInt.ts         # BigInt schema
    ├── Hex.ts            # Hex schema
    └── index.ts          # Re-exports

services/
└── Chain/
    ├── ChainService.ts   # ChainConfig, ChainService Tag
    ├── chains/
    │   ├── mainnet.ts    # mainnetConfig, mainnet Layer
    │   ├── sepolia.ts    # sepoliaConfig, sepolia Layer
    │   ├── optimism.ts   # optimismConfig, optimism Layer
    │   ├── arbitrum.ts   # arbitrumConfig, arbitrum Layer
    │   ├── base.ts       # baseConfig, base Layer
    │   ├── polygon.ts    # polygonConfig, polygon Layer
    │   └── index.ts      # Re-exports
    └── index.ts          # Main exports
```
