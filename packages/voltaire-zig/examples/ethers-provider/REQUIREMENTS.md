# Ethers v6 JsonRpcProvider Requirements

This document extracts the API surface and behavior requirements from ethers v6 for implementing an ethers-compatible provider using Voltaire primitives.

## Core Architecture

### Class Hierarchy

```
AbstractProvider
  └── JsonRpcApiProvider
        └── JsonRpcApiPollingProvider
              └── JsonRpcProvider
```

### Configuration Options

```typescript
interface ProviderOptions {
  // Request caching duration (ms). Set to -1 to disable.
  cacheTimeout: number; // default: 250

  // Block polling interval (ms)
  pollingInterval: number; // default: 4000

  // Use polling for event subscriptions
  polling: boolean; // default: false

  // Static network (skip network detection)
  staticNetwork: Network | boolean | null; // default: null

  // Batch request configuration
  batchStallTime: number; // default: 10
  batchMaxSize: number; // default: 1 << 20 (1MB)
  batchMaxCount: number; // default: 100
}
```

## Provider API Surface

### Network Methods

| Method | Return Type | RPC Method |
|--------|-------------|------------|
| `getNetwork()` | `Promise<Network>` | `eth_chainId` |
| `getBlockNumber()` | `Promise<number>` | `eth_blockNumber` |
| `getFeeData()` | `Promise<FeeData>` | `eth_gasPrice`, `eth_maxPriorityFeePerGas` |

### Account Methods

| Method | Return Type | RPC Method |
|--------|-------------|------------|
| `getBalance(address, blockTag?)` | `Promise<bigint>` | `eth_getBalance` |
| `getTransactionCount(address, blockTag?)` | `Promise<number>` | `eth_getTransactionCount` |
| `getCode(address, blockTag?)` | `Promise<string>` | `eth_getCode` |
| `getStorage(address, position, blockTag?)` | `Promise<string>` | `eth_getStorageAt` |

### Transaction Methods

| Method | Return Type | RPC Method |
|--------|-------------|------------|
| `call(tx, blockTag?)` | `Promise<string>` | `eth_call` |
| `estimateGas(tx)` | `Promise<bigint>` | `eth_estimateGas` |
| `broadcastTransaction(signedTx)` | `Promise<TransactionResponse>` | `eth_sendRawTransaction` |
| `getTransaction(hash)` | `Promise<TransactionResponse \| null>` | `eth_getTransactionByHash` |
| `getTransactionReceipt(hash)` | `Promise<TransactionReceipt \| null>` | `eth_getTransactionReceipt` |

### Block Methods

| Method | Return Type | RPC Method |
|--------|-------------|------------|
| `getBlock(blockHashOrTag, prefetchTxs?)` | `Promise<Block \| null>` | `eth_getBlockByHash`, `eth_getBlockByNumber` |

### Log Methods

| Method | Return Type | RPC Method |
|--------|-------------|------------|
| `getLogs(filter)` | `Promise<Log[]>` | `eth_getLogs` |

### ENS Methods

| Method | Return Type | Description |
|--------|-------------|-------------|
| `resolveName(name)` | `Promise<string \| null>` | Resolve ENS name to address |
| `lookupAddress(address)` | `Promise<string \| null>` | Reverse resolve address to ENS name |
| `getResolver(name)` | `Promise<EnsResolver \| null>` | Get ENS resolver |
| `getAvatar(name)` | `Promise<string \| null>` | Get ENS avatar |

### Raw RPC

| Method | Return Type | Description |
|--------|-------------|-------------|
| `send(method, params)` | `Promise<any>` | Send raw JSON-RPC request |

## Event System

### Event Types

| Event | Arguments | Description |
|-------|-----------|-------------|
| `"block"` | `blockNumber: number` | New block mined |
| `"pending"` | `tx: TransactionResponse` | Pending transaction |
| `"error"` | `error: Error` | Provider error |
| `"network"` | `network: Network, oldNetwork: Network \| null` | Network change |
| `"debug"` | `info: object` | Debug information |
| `{ address?, topics? }` | `log: Log` | Log filter match |
| `txHash` | `receipt: TransactionReceipt` | Transaction mined |

### Subscriber Interface

```typescript
interface Subscriber {
  start(): void;
  stop(): void;
  pause(dropWhilePaused?: boolean): void;
  resume(): void;
}
```

### Event Methods

| Method | Return Type |
|--------|-------------|
| `on(event, listener)` | `Promise<Provider>` |
| `once(event, listener)` | `Promise<Provider>` |
| `off(event, listener?)` | `Promise<Provider>` |
| `removeAllListeners(event?)` | `Promise<Provider>` |
| `listenerCount(event?)` | `Promise<number>` |
| `listeners(event?)` | `Promise<Listener[]>` |
| `emit(event, ...args)` | `Promise<boolean>` |

## Request/Response Flow

### Request Batching

1. Requests queued in `#payloads` array
2. `#scheduleDrain()` sets timer for `batchStallTime` ms
3. On drain, requests batched up to `batchMaxCount` or `batchMaxSize`
4. Single batch sent via `_send()`
5. Responses matched by `id` and resolved

### Request Caching

- Cache key: `method:${JSON.stringify(params)}`
- Cache entries expire after `cacheTimeout` ms
- Identical concurrent requests share same promise

### Retry Logic (FetchRequest)

- Max attempts: 12
- Exponential backoff with jitter
- Slot interval: 250ms
- Respects `Retry-After` header on 429 responses
- Total timeout: 5 minutes default

## Error Handling

### Error Codes

| Code | Name | Description |
|------|------|-------------|
| `CALL_EXCEPTION` | Call Exception | Contract call reverted |
| `INSUFFICIENT_FUNDS` | Insufficient Funds | Not enough ETH |
| `NONCE_EXPIRED` | Nonce Expired | Nonce already used |
| `REPLACEMENT_UNDERPRICED` | Replacement Underpriced | Gas too low for replacement |
| `NETWORK_ERROR` | Network Error | Network changed/disconnected |
| `TIMEOUT` | Timeout | Request timeout |
| `UNSUPPORTED_OPERATION` | Unsupported Operation | Method not supported |
| `ACTION_REJECTED` | Action Rejected | User rejected |
| `TRANSACTION_REPLACED` | Transaction Replaced | Tx replaced by another |

### Error Mapping

The `getRpcError()` method maps JSON-RPC errors to ethers error types:
- `eth_estimateGas` + "insufficient funds" -> `INSUFFICIENT_FUNDS`
- `eth_estimateGas` + "nonce too low" -> `NONCE_EXPIRED`
- `eth_call`/`eth_estimateGas` + revert -> `CALL_EXCEPTION`
- "user denied" -> `ACTION_REJECTED`
- "method does not exist" -> `UNSUPPORTED_OPERATION`

## Data Types

### Block

```typescript
interface Block {
  hash: string | null;
  parentHash: string;
  number: number;
  timestamp: number;
  nonce: string;
  difficulty: bigint;
  gasLimit: bigint;
  gasUsed: bigint;
  miner: string;
  extraData: string;
  baseFeePerGas: bigint | null;
  transactions: string[] | TransactionResponse[];
  // EIP-4844
  blobGasUsed: bigint | null;
  excessBlobGas: bigint | null;
  parentBeaconBlockRoot: string | null;
}
```

### TransactionResponse

```typescript
interface TransactionResponse {
  hash: string;
  blockHash: string | null;
  blockNumber: number | null;
  index: number | null;
  type: number;
  from: string;
  to: string | null;
  nonce: number;
  gasLimit: bigint;
  gasPrice: bigint;
  maxPriorityFeePerGas: bigint | null;
  maxFeePerGas: bigint | null;
  maxFeePerBlobGas: bigint | null;
  data: string;
  value: bigint;
  chainId: bigint;
  signature: Signature;
  accessList: AccessList | null;
  blobVersionedHashes: string[] | null;
}
```

### TransactionReceipt

```typescript
interface TransactionReceipt {
  to: string | null;
  from: string;
  contractAddress: string | null;
  hash: string;
  index: number;
  blockHash: string;
  blockNumber: number;
  logsBloom: string;
  gasUsed: bigint;
  cumulativeGasUsed: bigint;
  gasPrice: bigint;
  type: number;
  status: number | null;
  root: string | null;
  logs: Log[];
  // EIP-4844
  blobGasUsed: bigint | null;
  blobGasPrice: bigint | null;
}
```

### Log

```typescript
interface Log {
  transactionHash: string;
  blockHash: string;
  blockNumber: number;
  removed: boolean;
  address: string;
  data: string;
  topics: string[];
  index: number;
  transactionIndex: number;
}
```

### FeeData

```typescript
interface FeeData {
  gasPrice: bigint | null;
  maxFeePerGas: bigint | null;
  maxPriorityFeePerGas: bigint | null;
}
```

### Network

```typescript
interface Network {
  name: string;
  chainId: bigint;
  plugins: NetworkPlugin[];

  attachPlugin(plugin: NetworkPlugin): this;
  getPlugin<T>(name: string): T | null;
  clone(): Network;
  matches(other: Networkish): boolean;
  computeIntrinsicGas(tx: TransactionLike): bigint;

  static from(network: Networkish): Network;
  static register(nameOrChainId: string | number | bigint, networkFunc: () => Network): void;
}
```

## BlockTag Handling

| Input | Output |
|-------|--------|
| `null` | `"latest"` |
| `"earliest"` | `"0x0"` |
| `"latest"`, `"pending"`, `"safe"`, `"finalized"` | pass through |
| number >= 0 | `toQuantity(number)` |
| negative number | resolved relative to current block |
| 32-byte hex | treated as block hash |

## CCIP Read (EIP-3668)

- Max redirects: 10
- Triggered on call exception with selector `0x556f1830`
- Fetches offchain data and retries call with result
- Can be disabled via `disableCcipRead` property

## Lifecycle

### Initialization

1. Constructor stores options and network
2. `_start()` called to begin operation
3. Network detected via `_detectNetwork()`
4. Drain timer started for batched requests

### Pause/Resume

- `pause(dropWhilePaused)` - Stop event emission
- `resume()` - Resume event emission
- Timers paused and resumed accordingly

### Destruction

- `destroy()` - Clean up all resources
- Cancels pending requests
- Removes all listeners
- Clears all timers

## Implementation Notes

### Thread Safety

- Use private fields (`#field`) for internal state
- Queue mutations through scheduled callbacks
- Share promises for concurrent identical requests

### Memory Management

- WeakMap for cancel signals
- Clear caches on network change
- Remove completed subscriptions

### Performance

- Batch requests when possible
- Cache short-lived responses
- Use polling intervals appropriate to network

## Voltaire Integration Points

### Primitives to Use

- `Address` - Address validation/formatting
- `Hex` - Hex string handling
- `Uint256` - BigInt conversions
- `Hash` - Transaction/block hashes
- `Keccak256` - For ENS name hashing

### Provider Utilities

- `src/provider/` - Existing provider infrastructure
- `src/jsonrpc/` - JSON-RPC types and errors
- `src/utils/retry.ts` - Retry logic
- `src/utils/polling.ts` - Polling utilities
