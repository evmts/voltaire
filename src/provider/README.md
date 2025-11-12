# Provider

Type-safe Ethereum JSON-RPC provider implementations with branded primitive types.

## Overview

The Provider module implements the Provider interface for Ethereum JSON-RPC communication across multiple transports:

- **HttpProvider** - HTTP transport with fetch API
- **WebSocketProvider** - WebSocket transport with native pub/sub
- **InMemoryProvider** - Local EVM execution (placeholder, coming with EVM docs)

## Key Features

- **Method-based API** - Direct method calls: `provider.eth_blockNumber()`
- **Branded types** - Type-safe parameters using Address, Hash, Hex primitives
- **Never throws** - Methods return `Response<T>` with result or error
- **Async generators** - Event subscriptions via `for await` loops
- **65 methods** - Full coverage of eth, debug, and engine namespaces

## Quick Start

### HTTP Provider

```typescript
import { HttpProvider } from '@tevm/voltaire/provider';

const provider = new HttpProvider({
  url: 'https://eth.example.com',
  timeout: 30000,
  retry: 3
});

const blockNumber = await provider.eth_blockNumber();
if (!blockNumber.error) {
  console.log('Block:', blockNumber.result);
}
```

### WebSocket Provider

```typescript
import { WebSocketProvider } from '@tevm/voltaire/provider';

const provider = new WebSocketProvider({
  url: 'wss://eth.example.com',
  reconnect: true
});

await provider.connect();

// Real-time event subscriptions
for await (const block of provider.events.newHeads()) {
  console.log('New block:', block.number);
}
```

## Architecture

```
src/provider/
├── types.ts              # Core types (Response, RequestOptions, etc.)
├── Provider.ts           # Provider interface definition
├── HttpProvider.ts       # HTTP implementation
├── WebSocketProvider.ts  # WebSocket implementation
├── InMemoryProvider.ts   # EVM implementation (placeholder)
└── index.ts              # Public exports
```

## Response Handling

All methods return `Response<T>` containing either result or error:

```typescript
const result = await provider.eth_getBalance('0x...', 'latest');

if (result.error) {
  console.error('Error:', result.error.code, result.error.message);
} else {
  console.log('Balance:', result.result);
}
```

## Events

Subscribe to blockchain events using async generators:

```typescript
// New blocks
for await (const block of provider.events.newHeads()) {
  console.log('Block:', block.number);
}

// Contract logs
for await (const log of provider.events.logs({ address: '0x...' })) {
  console.log('Event:', log.topics[0]);
}

// Pending transactions
for await (const txHash of provider.events.newPendingTransactions()) {
  console.log('Pending tx:', txHash);
}
```

### Transport Differences

| Transport | Events Implementation | Real-time | Reconnect |
|-----------|----------------------|-----------|-----------|
| HTTP | Polling (filters) | No | N/A |
| WebSocket | Native pub/sub | Yes | Yes |
| InMemory | Direct | Yes | N/A |

## Methods

### eth Namespace (40 methods)

Standard Ethereum operations: blocks, transactions, state, filters, gas

```typescript
provider.eth_blockNumber()
provider.eth_getBalance(address, blockTag)
provider.eth_call(params, blockTag)
provider.eth_sendRawTransaction(signedTx)
provider.eth_getLogs(params)
// ... 35 more
```

### debug Namespace (5 methods)

Debugging and transaction tracing

```typescript
provider.debug_traceTransaction(txHash, options)
provider.debug_traceBlockByNumber(blockTag, options)
provider.debug_traceBlockByHash(blockHash, options)
provider.debug_traceCall(params, blockTag, options)
provider.debug_getRawBlock(blockTag)
```

### engine Namespace (20 methods)

Consensus layer integration (Engine API)

```typescript
provider.engine_newPayloadV3(payload, blobHashes, beaconRoot)
provider.engine_forkchoiceUpdatedV3(forkchoice, payloadAttrs)
provider.engine_getPayloadV3(payloadId)
// ... 17 more
```

## Error Handling

Errors are returned as values, not exceptions:

```typescript
const result = await provider.eth_call(params);

if (result.error) {
  switch (result.error.code) {
    case -32700: // Parse error
    case -32600: // Invalid request
    case -32601: // Method not found
    case -32602: // Invalid params
    case -32603: // Internal error
    case 3:      // Execution reverted
      console.error('Error:', result.error.message);
  }
}
```

## Request Options

Configure timeout and retry behavior per request:

```typescript
const result = await provider.eth_call(params, 'latest', {
  timeout: 60000,      // 60 second timeout
  retry: 5,            // Retry 5 times
  retryDelay: 2000     // 2 second delay between retries
});
```

## Type Safety

Provider interface uses plain strings for simplicity. For full type safety with branded primitives, use wrapper functions:

```typescript
import * as Address from '@tevm/voltaire/primitives/Address';
import * as Hash from '@tevm/voltaire/primitives/Hash';

// Convert branded types to strings for provider
const address = Address.from('0x...');
const result = await provider.eth_getBalance(Address.toHex(address), 'latest');

// Convert response back to branded types
if (!result.error) {
  const balance = Quantity.from(result.result);
}
```

## Testing

For testing, use InMemoryProvider (once implemented) or HttpProvider with a local node:

```typescript
// Local test node (Anvil, Hardhat, Ganache)
const provider = new HttpProvider('http://localhost:8545');

// Or mock responses for unit tests
class MockProvider implements Provider {
  async eth_blockNumber() {
    return { result: '0x123456' };
  }
  // ... implement other methods
}
```

## Future: InMemoryProvider

InMemoryProvider will execute transactions using Voltaire's built-in EVM:

```typescript
// Coming with EVM documentation
const provider = new InMemoryProvider({
  chainId: 1,
  forkUrl: 'https://eth.example.com',
  forkBlockNumber: 18000000
});

// Instant execution, no network
const result = await provider.eth_call(params);
```

## Documentation

- [Provider Overview](https://voltaire.tevm.sh/provider)
- [Method API](https://voltaire.tevm.sh/provider/methods)
- [Events](https://voltaire.tevm.sh/provider/events)
- [eth Methods](https://voltaire.tevm.sh/provider/eth-methods)
- [debug Methods](https://voltaire.tevm.sh/provider/debug-methods)
- [engine Methods](https://voltaire.tevm.sh/provider/engine-methods)
- [Adapters](https://voltaire.tevm.sh/provider/adapters)

## Related Modules

- [jsonrpc](../jsonrpc) - JSON-RPC type definitions
- [primitives](../primitives) - Branded primitive types
- [evm](../evm) - EVM implementation (coming soon)
