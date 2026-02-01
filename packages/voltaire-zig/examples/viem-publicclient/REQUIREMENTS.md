# Viem PublicClient - Requirements Specification

## Overview

This document captures requirements extracted from viem's PublicClient implementation for building a Voltaire-native equivalent.

## Source Analysis

### Architecture

**viem's PublicClient Structure:**

1. **createClient** (`clients/createClient.js`) - Base client factory
   - Creates client with: account, batch, cacheTime, chain, pollingInterval, request, transport, uid
   - Implements `extend()` pattern for composable functionality
   - Transport returns `{ config, request, value }`

2. **createPublicClient** (`clients/createPublicClient.js`) - Public client factory
   - Extends base client with `publicActions`
   - Sets type: 'publicClient'

3. **Transport** (`clients/transports/http.js`, `createTransport.js`)
   - Transport is a factory function receiving `{ chain, pollingInterval }`
   - Returns `{ config, request, value }`
   - HTTP transport handles batching, retries, timeouts

4. **Public Actions** (`clients/decorators/public.js`)
   - ~50 action methods bound to client
   - Pattern: `actionName: (args) => actionFn(client, args)`

### API Surface

**Client Properties:**
- `account?: Account` - Optional account for signing
- `batch?: { multicall?: object }` - Batching config
- `cacheTime: number` - Cache duration (default: pollingInterval)
- `chain?: Chain` - Chain configuration
- `key: string` - Client identifier
- `name: string` - Human-readable name
- `pollingInterval: number` - Polling interval derived from block time
- `request: RequestFn` - JSON-RPC request function
- `transport: Transport` - Transport config + value
- `type: string` - Client type identifier
- `uid: string` - Unique client ID

**Extend Pattern:**
```typescript
client.extend((base) => ({
  customMethod: () => doSomething(base)
}))
```

### Public Actions (Core Subset)

| Action | JSON-RPC Method | Parameters |
|--------|-----------------|------------|
| `getBlockNumber` | `eth_blockNumber` | `{ cacheTime? }` |
| `getBalance` | `eth_getBalance` | `{ address, blockNumber?, blockTag? }` |
| `getBlock` | `eth_getBlockByNumber/Hash` | `{ blockNumber?, blockHash?, includeTransactions? }` |
| `call` | `eth_call` | `{ to, data, account?, blockNumber?, blockTag?, ... }` |
| `estimateGas` | `eth_estimateGas` | `{ to, data, account?, value?, ... }` |
| `getTransaction` | `eth_getTransactionByHash` | `{ hash }` |
| `getTransactionReceipt` | `eth_getTransactionReceipt` | `{ hash }` |
| `getTransactionCount` | `eth_getTransactionCount` | `{ address, blockNumber?, blockTag? }` |
| `getLogs` | `eth_getLogs` | `{ address?, fromBlock?, toBlock?, topics?, ... }` |
| `getCode` | `eth_getCode` | `{ address, blockNumber?, blockTag? }` |
| `getStorageAt` | `eth_getStorageAt` | `{ address, slot, blockNumber?, blockTag? }` |
| `getChainId` | `eth_chainId` | none |
| `getGasPrice` | `eth_gasPrice` | none |
| `getFeeHistory` | `eth_feeHistory` | `{ blockCount, newestBlock, rewardPercentiles? }` |
| `readContract` | `eth_call` (encoded) | `{ address, abi, functionName, args? }` |
| `multicall` | `eth_call` (multicall3) | `{ contracts, allowFailure?, ... }` |

### Key Patterns

1. **Block Tag Handling:**
   - Support both `blockNumber: bigint` and `blockTag: 'latest' | 'pending' | 'safe' | 'finalized'`
   - Convert bigint to hex for RPC

2. **Caching:**
   - `getBlockNumber` uses `withCache` with `cacheKey` and `cacheTime`
   - Client `uid` used in cache keys

3. **Error Handling:**
   - Wrap RPC errors in domain-specific errors (TransactionNotFoundError, etc.)
   - CCIP-Read support for offchain lookups

4. **Return Type Formatting:**
   - Convert hex strings to bigint where appropriate
   - Format transactions/blocks according to chain formatters

## Voltaire Implementation Requirements

### Must Have

1. **Transport Interface**
   - Compatible with Voltaire's `HttpProvider`, `WebSocketProvider`
   - Factory pattern: `http(url, config?) => Transport`
   - Must return `{ config, request, value }`

2. **Client Factory**
   - `createPublicClient({ chain, transport, ... })`
   - Composable via `extend()` pattern
   - Unique client ID for caching

3. **Core Actions** (Phase 1)
   - `getBlockNumber`
   - `getBalance`
   - `getChainId`
   - `call`
   - `getBlock`
   - `getTransaction`
   - `getTransactionReceipt`
   - `estimateGas`
   - `getLogs`

4. **Type Safety**
   - Full TypeScript types for all actions
   - Branded types integration (Address, Hex, etc.)
   - RpcSchema compatibility

### Should Have

5. **Extended Actions** (Phase 2)
   - `getCode`
   - `getStorageAt`
   - `getTransactionCount`
   - `getGasPrice`
   - `getFeeHistory`
   - `readContract`
   - `simulateContract`

6. **Caching**
   - Block number caching
   - Configurable cache time

7. **Batching**
   - Multicall support
   - Request batching via scheduler

### Nice to Have

8. **Watch Functions**
   - `watchBlockNumber`
   - `watchBlocks`
   - `watchEvent`

9. **ENS Support**
   - `getEnsAddress`
   - `getEnsName`

10. **Verification**
    - `verifyMessage`
    - `verifyTypedData`

## File Structure

```
examples/viem-publicclient/
├── REQUIREMENTS.md          # This file
├── index.ts                 # Main exports
├── PublicClientType.ts      # Type definitions
├── createPublicClient.js    # Client factory
├── createTransport.js       # Transport factory
├── http.js                  # HTTP transport
├── actions/                 # Action implementations
│   ├── index.ts
│   ├── getBlockNumber.js
│   ├── getBalance.js
│   ├── getChainId.js
│   ├── call.js
│   ├── getBlock.js
│   ├── getTransaction.js
│   ├── getTransactionReceipt.js
│   ├── estimateGas.js
│   └── getLogs.js
├── publicActions.js         # Actions decorator
├── errors.ts                # Error types
├── PublicClient.test.ts     # Tests
└── utils/
    ├── uid.js               # Unique ID generator
    └── cache.js             # Caching utilities
```

## Integration Points

- **Voltaire Primitives:** Address, Hex, U256
- **Voltaire Provider:** TypedProvider, RpcSchema, VoltaireRpcSchema
- **Voltaire JSON-RPC:** JsonRpcRequest, JsonRpcResponse

## Test Cases

1. Create client with HTTP transport
2. Get block number
3. Get balance of address
4. Make eth_call to contract
5. Get transaction by hash
6. Get logs with filter
7. Extend client with custom action
8. Handle RPC errors gracefully
