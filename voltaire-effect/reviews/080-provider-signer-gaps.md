# Provider & Signer Gaps vs Viem

**Date**: 2026-01-25
**Priority**: High
**Category**: Missing Features / Bugs

## Provider Gaps

### Missing RPC Methods

| Method | viem | voltaire-effect | Impact |
|--------|------|-----------------|--------|
| `getBlobBaseFee` | ✅ | ❌ | EIP-4844 blob tx pricing |
| `getProof` | ✅ | ❌ | Merkle proofs for bridges |
| `getContractEvents` | ✅ | ❌ | Convenience for getLogs |
| `getEip712Domain` | ✅ | ❌ | EIP-5267 domain discovery |
| `getFilterChanges` | ✅ | ❌ | Filter-based polling |
| `getFilterLogs` | ✅ | ❌ | Filter-based logs |
| `createBlockFilter` | ✅ | ❌ | Block filter subscription |
| `createEventFilter` | ✅ | ❌ | Event filter subscription |
| `createPendingTransactionFilter` | ✅ | ❌ | Pending tx filter |
| `uninstallFilter` | ✅ | ❌ | Remove filter |
| `multicall` | ✅ | ❌ (MulticallService exists) | Batch reads |
| `simulateContract` | ✅ | ❌ | Contract call simulation |
| `readContract` | ✅ | ❌ | ABI-encoded read |
| `verifyMessage` | ✅ | ❌ | EIP-191 verify |
| `verifyTypedData` | ✅ | ❌ | EIP-712 verify |
| `verifyHash` | ✅ | ❌ | Generic signature verify |
| `watchBlocks` | ✅ | ✅ | Block streaming |
| `watchBlockNumber` | ✅ | ⚠️ Via watchBlocks | Number only |
| `watchContractEvent` | ✅ | ❌ | Event streaming |
| `watchEvent` | ✅ | ❌ | Event streaming |
| `watchPendingTransactions` | ✅ | ❌ | Mempool watching |

### Missing ENS Methods

| Method | viem | voltaire-effect |
|--------|------|-----------------|
| `getEnsAddress` | ✅ | ❌ |
| `getEnsAvatar` | ✅ | ❌ |
| `getEnsName` | ✅ | ❌ |
| `getEnsResolver` | ✅ | ❌ |
| `getEnsText` | ✅ | ❌ |

**Impact**: No ENS resolution support.

### Configuration Gaps

| Config | viem | voltaire-effect |
|--------|------|-----------------|
| `cacheTime` | Per-client | Not configurable |
| `pollingInterval` | Per-client | Hardcoded in actions |
| `experimental_blockTag` | Default block tag | Not supported |
| Default chain from URL | ✅ | ❌ |

### Type/Formatting Gaps

| Feature | viem | voltaire-effect |
|---------|------|-----------------|
| Chain-specific formatters | ✅ | ❌ |
| Typed return based on chain | ✅ | ❌ |
| `blockTag` on all read methods | ✅ | ⚠️ Some methods |
| `stateOverride` on call | ✅ | ❌ |
| `blockOverride` on call | ✅ | ❌ |

## Signer Gaps

### Missing Wallet Actions

| Action | viem | voltaire-effect | Impact |
|--------|------|-----------------|--------|
| `addChain` | ✅ | ❌ | Add custom chain to wallet |
| `deployContract` | ✅ | ❌ | Convenience for deployment |
| `fillTransaction` | ✅ | ❌ | eth_fillTransaction RPC |
| `getAddresses` | ✅ | ❌ | Get connected (no prompt) |
| `getPermissions` | ✅ | ❌ | EIP-2255 |
| `prepareAuthorization` | ✅ | ❌ | EIP-7702 prep |
| `prepareTransactionRequest` | ✅ Internal | ⚠️ Internal only |
| `requestPermissions` | ✅ | ❌ | EIP-2255 |
| `sendCallsSync` | ✅ | ❌ | Send + wait for receipt |
| `sendRawTransactionSync` | ✅ | ❌ | Send + wait for receipt |
| `sendTransactionSync` | ✅ | ❌ | Send + wait for receipt |
| `showCallsStatus` | ✅ | ❌ | EIP-5792 UI |
| `signAuthorization` | ✅ | ❌ | EIP-7702 |
| `watchAsset` | ✅ | ❌ | EIP-747 |
| `writeContract` | ✅ | ❌ | ABI-encoded write |
| `writeContractSync` | ✅ | ❌ | Write + wait |

### Transaction Handling Gaps

| Feature | viem | voltaire-effect |
|---------|------|-----------------|
| Custom serializer | ✅ | ❌ |
| Chain override per tx | ✅ | ❌ |
| Account override per tx | ✅ | ❌ |
| Fee multiplier | Via chain config | ❌ Not per-tx |
| Access list auto-creation | Via prepareTransactionRequest | ❌ |
| State diff in call | ✅ | ❌ |

### Sync Operations (Wait for Receipt)

viem offers `*Sync` variants that return receipt instead of hash:

```typescript
// viem
const receipt = await client.sendTransactionSync({ to, value })
// voltaire-effect equivalent would be
const hash = await signer.sendTransaction({ to, value })
const receipt = await provider.waitForTransactionReceipt(hash)
```

**Recommendation**: Add convenience methods or options:
```typescript
sendTransaction(tx, { waitForReceipt: true })
```

## Specific Bugs / Issues Found

### 1. No `stateOverride` in `call`

viem supports:
```typescript
await client.call({
  to: '0x...',
  data: '0x...',
  stateOverride: [
    {
      address: '0x...',
      balance: 1000n,
      code: '0x...',
      stateDiff: { '0x...': '0x...' }
    }
  ]
})
```

voltaire-effect `call` doesn't support this. Critical for simulations.

### 2. No Chain Override

viem allows per-action chain override:
```typescript
await client.sendTransaction({
  chain: optimism,  // Override client's chain
  to: '0x...',
  value: 1n
})
```

voltaire-effect is locked to the configured chain.

### 3. No Account Override

viem allows per-action account override:
```typescript
await client.sendTransaction({
  account: differentAccount,  // Override client's account
  to: '0x...',
  value: 1n
})
```

voltaire-effect requires different layer composition.

### 4. Hardcoded Polling Intervals

`waitForTransactionReceipt` has `pollingInterval` parameter, but other polling operations (like watchBlocks) have hardcoded intervals derived from internal logic.

### 5. No Access List Auto-Creation

viem's `prepareTransactionRequest` can auto-create access lists:
```typescript
const request = await client.prepareTransactionRequest({
  to: '0x...',
  data: '0x...',
  // accessList auto-created if beneficial
})
```

### 6. Missing Gas Estimation Options

viem's `estimateGas` supports:
- `stateOverride`
- `blockOverride`
- `account` override
- `blockTag`

voltaire-effect only supports the basic call request.

## Recommendations

### Critical (Blocks Use Cases)

1. **Add `stateOverride` to `call` and `estimateGas`**
   - Required for accurate simulations

2. **Add `addChain` to SignerService**
   - Essential for multi-chain dApps

3. **Add `getAddresses` (non-prompting)**
   - Different from `requestAddresses`

4. **Add EIP-7702 authorization support**
   - `signAuthorization`, `prepareAuthorization`

### Important (DX / Performance)

5. **Add Sync variants or `waitForReceipt` option**
   - Common pattern: send + wait

6. **Add chain/account override per action**
   - More flexible than layer recomposition

7. **Add filter-based subscriptions**
   - Alternative to polling for events

8. **Add ENS resolution methods**
   - Common requirement

### Nice to Have

9. **Add contract convenience methods**
   - `readContract`, `writeContract`, `simulateContract`

10. **Add signature verification**
    - `verifyMessage`, `verifyTypedData`, `verifyHash`
