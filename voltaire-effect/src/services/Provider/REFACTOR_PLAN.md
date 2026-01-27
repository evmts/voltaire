# ProviderService Refactor Plan

## Goal
Split monolithic ProviderService into focused, composable services with comprehensive JSON-RPC coverage.

## New Service Architecture

### Core Services (split from ProviderService)

#### 1. BlocksService
- `getBlock(args)` - eth_getBlockByNumber, eth_getBlockByHash
- `getBlockNumber()` - eth_blockNumber
- `getBlockTransactionCount(args)` - eth_getBlockTransactionCountByNumber, eth_getBlockTransactionCountByHash
- `getUncle(args, uncleIndex)` - eth_getUncleByBlockNumberAndIndex, eth_getUncleByBlockHashAndIndex
- `getBlockReceipts(blockTag)` - eth_getBlockReceipts

#### 2. AccountService
- `getBalance(address, blockTag?)` - eth_getBalance
- `getTransactionCount(address, blockTag?)` - eth_getTransactionCount
- `getCode(address, blockTag?)` - eth_getCode
- `getStorageAt(address, slot, blockTag?)` - eth_getStorageAt
- `getProof(address, storageKeys, blockTag?)` - eth_getProof

#### 3. TransactionService
- `getTransaction(hash)` - eth_getTransactionByHash
- `getTransactionByBlockHashAndIndex(blockHash, index)` - eth_getTransactionByBlockHashAndIndex
- `getTransactionByBlockNumberAndIndex(blockNumber, index)` - eth_getTransactionByBlockNumberAndIndex
- `getTransactionReceipt(hash)` - eth_getTransactionReceipt
- `waitForTransactionReceipt(hash, opts?)` - polling wrapper
- `sendRawTransaction(signedTx)` - eth_sendRawTransaction
- `getTransactionConfirmations(hash)` - computed from block difference

#### 4. SimulationService
- `call(tx, blockTag?, stateOverride?, blockOverrides?)` - eth_call
- `estimateGas(tx, blockTag?, stateOverride?)` - eth_estimateGas
- `createAccessList(tx)` - eth_createAccessList
- `simulateV1(payload, blockTag?)` - eth_simulateV1 (multi-block simulation with state/block overrides)

#### 5. EventsService
- `getLogs(filter)` - eth_getLogs
- `createEventFilter(filter?)` - eth_newFilter
- `createBlockFilter()` - eth_newBlockFilter
- `createPendingTransactionFilter()` - eth_newPendingTransactionFilter
- `getFilterChanges(filterId)` - eth_getFilterChanges
- `getFilterLogs(filterId)` - eth_getFilterLogs
- `uninstallFilter(filterId)` - eth_uninstallFilter

#### 6. NetworkService
- `getChainId()` - eth_chainId
- `getGasPrice()` - eth_gasPrice
- `getMaxPriorityFeePerGas()` - eth_maxPriorityFeePerGas
- `getFeeHistory(blockCount, newestBlock, rewardPercentiles)` - eth_feeHistory
- `getBlobBaseFee()` - eth_blobBaseFee
- `getSyncing()` - eth_syncing
- `getAccounts()` - eth_accounts
- `getCoinbase()` - eth_coinbase
- `netVersion()` - net_version

#### 7. StreamingService
- `watchBlocks(options?)` - Stream of new blocks with reorg detection
- `backfillBlocks(options)` - Stream of historical blocks

### New Services

#### 8. DebugService
- `traceTransaction(hash, config?)` - debug_traceTransaction
- `traceCall(tx, blockRef?, config?)` - debug_traceCall
- `traceBlockByNumber(blockNumber, config?)` - debug_traceBlockByNumber
- `traceBlockByHash(blockHash, config?)` - debug_traceBlockByHash
- `getBadBlocks()` - debug_getBadBlocks
- `getRawBlock(blockTag)` - debug_getRawBlock
- `getRawHeader(blockTag)` - debug_getRawHeader
- `getRawReceipts(blockTag)` - debug_getRawReceipts
- `getRawTransaction(hash)` - debug_getRawTransaction
- `storageRangeAt(blockHash, txIndex, address, startKey, maxResults)` - debug_storageRangeAt

#### 9. EngineApiService (for consensus layer integration)
- `newPayloadV3(executionPayload, expectedBlobVersionedHashes, parentBeaconBlockRoot)` - engine_newPayloadV3
- `newPayloadV4(...)` - engine_newPayloadV4
- `newPayloadV5(...)` - engine_newPayloadV5
- `forkchoiceUpdatedV3(forkchoiceState, payloadAttributes?)` - engine_forkchoiceUpdatedV3
- `getPayloadV3(payloadId)` - engine_getPayloadV3
- `getPayloadV4(payloadId)` - engine_getPayloadV4
- `getPayloadV5(payloadId)` - engine_getPayloadV5
- `getPayloadV6(payloadId)` - engine_getPayloadV6
- `getPayloadBodiesByHashV1(blockHashes)` - engine_getPayloadBodiesByHashV1
- `getPayloadBodiesByRangeV1(start, count)` - engine_getPayloadBodiesByRangeV1
- `getBlobsV1(versionedHashes)` - engine_getBlobsV1
- `getBlobsV2(...)` - engine_getBlobsV2
- `getBlobsV3(...)` - engine_getBlobsV3
- `exchangeCapabilities(capabilities)` - engine_exchangeCapabilities

### ProviderService (Composition)
ProviderService becomes a convenience type that combines all core services:
```typescript
export type ProviderShape = 
  BlocksShape & 
  AccountShape & 
  TransactionShape & 
  SimulationShape & 
  EventsShape & 
  NetworkShape & 
  StreamingShape;
```

## File Structure
```
services/
├── Blocks/
│   ├── BlocksService.ts      # Service definition
│   ├── Blocks.ts             # Live implementation
│   ├── index.ts
│   └── Blocks.test.ts
├── Account/
│   ├── AccountService.ts
│   ├── Account.ts
│   ├── index.ts
│   └── Account.test.ts
├── Transaction/
│   ├── TransactionService.ts
│   ├── Transaction.ts
│   ├── index.ts
│   └── Transaction.test.ts
├── Simulation/
│   ├── SimulationService.ts
│   ├── Simulation.ts
│   ├── simulateV1.ts         # eth_simulateV1 implementation
│   ├── index.ts
│   └── Simulation.test.ts
├── Events/
│   ├── EventsService.ts
│   ├── Events.ts
│   ├── index.ts
│   └── Events.test.ts
├── Network/
│   ├── NetworkService.ts
│   ├── Network.ts
│   ├── index.ts
│   └── Network.test.ts
├── Streaming/
│   ├── StreamingService.ts
│   ├── Streaming.ts
│   ├── index.ts
│   └── Streaming.test.ts
├── Debug/
│   ├── DebugService.ts
│   ├── Debug.ts
│   ├── index.ts
│   └── Debug.test.ts
├── Engine/
│   ├── EngineApiService.ts
│   ├── EngineApi.ts
│   ├── index.ts
│   └── EngineApi.test.ts
├── Provider/
│   ├── ProviderService.ts    # Composition of all services
│   ├── Provider.ts           # Convenience layer combining all
│   └── index.ts
```

## eth_simulateV1 Specification
Multi-block transaction simulation with state/block overrides:

```typescript
interface SimulatePayload {
  blockStateCalls: SimBlock[];
  traceTransfers?: boolean;
  validation?: boolean;
  returnFullTransactions?: boolean;
}

interface SimBlock {
  blockOverrides?: BlockOverrides;
  stateOverrides?: StateOverride;
  calls: CallRequest[];
}

interface SimulatedBlock {
  baseFeePerGas: bigint;
  blobGasUsed: bigint;
  calls: SimCallResult[];
  gasLimit: bigint;
  gasUsed: bigint;
  hash: `0x${string}`;
  number: bigint;
  timestamp: bigint;
}

interface SimCallResult {
  returnData: `0x${string}`;
  logs: Log[];
  gasUsed: bigint;
  status: `0x${string}`;  // 0x1 success, 0x0 revert
  error?: SimulateError;
}
```

## Implementation Notes
1. Each service is a separate Effect Context.Tag
2. Services depend on TransportService for RPC calls
3. Provider layer composes all service layers
4. Backward compatibility: ProviderService interface unchanged
5. All services follow branded types + namespace pattern
