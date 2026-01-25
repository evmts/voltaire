# EIP Compliance Gaps

**Date**: 2026-01-25
**Priority**: High
**Category**: Protocol Compliance

## Overview

This document identifies EIPs that viem supports but voltaire-effect does not (or only partially supports).

## Wallet EIPs

### EIP-191: Signed Data Standard ✅

**viem**: Full support
**voltaire-effect**: ✅ Supported via `signMessage`

### EIP-712: Typed Structured Data ✅

**viem**: Full support
**voltaire-effect**: ✅ Supported via `signTypedData`

### EIP-747: wallet_watchAsset ❌

**viem**: `watchAsset({ type: 'ERC20', options: { address, decimals, symbol } })`
**voltaire-effect**: Not implemented

**Impact**: Can't prompt users to add tokens to their wallet.

### EIP-2255: wallet_requestPermissions / wallet_getPermissions ❌

**viem**: `requestPermissions()`, `getPermissions()`
**voltaire-effect**: Not implemented

**Impact**: Can't manage wallet permissions programmatically.

### EIP-3085: wallet_addEthereumChain ❌

**viem**: `addChain({ chain })`
**voltaire-effect**: Not implemented

**Impact**: Can't add custom chains to user's wallet.

### EIP-3326: wallet_switchEthereumChain ✅

**viem**: `switchChain({ id })`
**voltaire-effect**: ✅ Supported

### EIP-5267: EIP-712 Domain Retrieval ❌

**viem**: `getEip712Domain({ address })`
**voltaire-effect**: Not implemented

**Impact**: Can't discover a contract's EIP-712 domain for signing.

### EIP-5792: Wallet Call API ⚠️ Partial

| Method | viem | voltaire-effect |
|--------|------|-----------------|
| `wallet_getCapabilities` | ✅ | ✅ |
| `wallet_sendCalls` | ✅ | ✅ |
| `wallet_getCallsStatus` | ✅ | ✅ |
| `wallet_showCallsStatus` | ✅ | ❌ |

**Impact**: Can't open wallet UI for bundle status.

### EIP-6492: Signature Validation for Pre-deployed Contracts ❌

**viem**: Uses `erc6492Verifier` contract
**voltaire-effect**: Not supported

**Impact**: Can't verify signatures from counterfactual smart accounts.

## Transaction EIPs

### EIP-2718: Typed Transaction Envelope ✅

**viem**: Types 0, 1, 2, 3, 4
**voltaire-effect**: ✅ Types 0, 1, 2, 3, 4

### EIP-2930: Access List (Type 1) ✅

**viem**: Full support
**voltaire-effect**: ✅ Supported

### EIP-1559: Fee Market (Type 2) ✅

**viem**: Full support
**voltaire-effect**: ✅ Supported

### EIP-4844: Blob Transactions (Type 3) ⚠️ Partial

| Feature | viem | voltaire-effect |
|---------|------|-----------------|
| Tx type 3 | ✅ | ✅ |
| `blobVersionedHashes` | ✅ | ✅ |
| `maxFeePerBlobGas` | ✅ | ✅ |
| `getBlobBaseFee` | ✅ | ❌ |
| Blob sidecar handling | ✅ | ❌ |
| KZG commitment | Via chain config | ❌ |

**Impact**: Can send blob txs but can't estimate blob fees or handle sidecars.

### EIP-7702: Set Code (Type 4) ⚠️ Partial

| Feature | viem | voltaire-effect |
|---------|------|-----------------|
| Tx type 4 | ✅ | ✅ |
| `authorizationList` | ✅ | ✅ |
| `signAuthorization` | ✅ | ❌ |
| `prepareAuthorization` | ✅ | ❌ |
| Account `signAuthorization` | ✅ | ❌ |

**Impact**: Can include signed authorizations but can't create them.

## RPC EIPs

### EIP-1474: Standard JSON-RPC Methods ⚠️ Partial

| Method | viem | voltaire-effect |
|--------|------|-----------------|
| `eth_accounts` | ✅ `getAddresses` | ❌ |
| `eth_blockNumber` | ✅ | ✅ |
| `eth_call` | ✅ | ✅ |
| `eth_chainId` | ✅ | ✅ |
| `eth_coinbase` | ❌ | ❌ |
| `eth_createAccessList` | ✅ | ✅ |
| `eth_estimateGas` | ✅ | ✅ |
| `eth_feeHistory` | ✅ | ✅ |
| `eth_fillTransaction` | ✅ | ❌ |
| `eth_gasPrice` | ✅ | ✅ |
| `eth_getBalance` | ✅ | ✅ |
| `eth_getBlockByHash` | ✅ | ✅ |
| `eth_getBlockByNumber` | ✅ | ✅ |
| `eth_getBlockTransactionCountByHash` | ✅ | ✅ |
| `eth_getBlockTransactionCountByNumber` | ✅ | ✅ |
| `eth_getCode` | ✅ | ✅ |
| `eth_getFilterChanges` | ✅ | ❌ |
| `eth_getFilterLogs` | ✅ | ❌ |
| `eth_getLogs` | ✅ | ✅ |
| `eth_getProof` | ✅ | ❌ |
| `eth_getStorageAt` | ✅ | ✅ |
| `eth_getTransactionByBlockHashAndIndex` | ❌ | ❌ |
| `eth_getTransactionByBlockNumberAndIndex` | ❌ | ❌ |
| `eth_getTransactionByHash` | ✅ | ✅ |
| `eth_getTransactionCount` | ✅ | ✅ |
| `eth_getTransactionReceipt` | ✅ | ✅ |
| `eth_getUncleByBlockHashAndIndex` | ❌ | ❌ |
| `eth_getUncleByBlockNumberAndIndex` | ❌ | ❌ |
| `eth_getUncleCountByBlockHash` | ❌ | ❌ |
| `eth_getUncleCountByBlockNumber` | ❌ | ❌ |
| `eth_maxPriorityFeePerGas` | ✅ | ✅ |
| `eth_newBlockFilter` | ✅ | ❌ |
| `eth_newFilter` | ✅ | ❌ |
| `eth_newPendingTransactionFilter` | ✅ | ❌ |
| `eth_sendRawTransaction` | ✅ | ✅ |
| `eth_sendTransaction` | ✅ | ✅ |
| `eth_sign` | Deprecated | Deprecated |
| `eth_signTransaction` | ✅ | ✅ |
| `eth_signTypedData_v4` | ✅ | ✅ |
| `eth_subscribe` | ✅ | ⚠️ Partial |
| `eth_syncing` | ❌ | ❌ |
| `eth_uninstallFilter` | ✅ | ❌ |
| `eth_unsubscribe` | ✅ | ⚠️ Partial |

### EIP-3668: CCIP Read (OffchainLookup) ⚠️ Partial

**viem**: Full support via `ccipRead` config
**voltaire-effect**: CcipService exists but not wired to Provider

**Impact**: CCIP-enabled calls may not resolve correctly.

## ENS EIPs

### EIP-137/181: ENS Registry and Resolver ❌

**viem**: Full ENS support
**voltaire-effect**: Not implemented

| Method | viem | voltaire-effect |
|--------|------|-----------------|
| `getEnsAddress` | ✅ | ❌ |
| `getEnsAvatar` | ✅ | ❌ |
| `getEnsName` | ✅ | ❌ |
| `getEnsResolver` | ✅ | ❌ |
| `getEnsText` | ✅ | ❌ |

## Account Abstraction EIPs

### EIP-4337: Account Abstraction ❌

**viem**: Full support via `viem/account-abstraction`
**voltaire-effect**: Not implemented

| Feature | viem | voltaire-effect |
|---------|------|-----------------|
| SmartAccount type | ✅ | ❌ |
| UserOperation | ✅ | ❌ |
| Bundler integration | ✅ | ❌ |
| Paymaster | ✅ | ❌ |
| EntryPoint support | ✅ | ❌ |
| `signUserOperation` | ✅ | ❌ |

## Recommendations

### Critical (Protocol Support)

1. **Complete EIP-7702 support**
   - `signAuthorization`
   - `prepareAuthorization`

2. **Add EIP-4844 blob fee estimation**
   - `getBlobBaseFee`

3. **Add filter methods**
   - `createBlockFilter`, `createEventFilter`
   - `getFilterChanges`, `getFilterLogs`
   - `uninstallFilter`

4. **Wire CCIP to Provider**
   - Enable EIP-3668 offchain lookups

### Important (Wallet UX)

5. **Add EIP-747 `watchAsset`**
6. **Add EIP-2255 permissions**
7. **Add EIP-3085 `addChain`**
8. **Add EIP-5792 `showCallsStatus`**

### Nice to Have

9. **Add ENS support**
10. **Add EIP-4337 account abstraction**
11. **Add EIP-6492 signature verification**
