# EIP-1193 Strongly-Typed Provider Interface

Voltaire implements a strongly-typed EIP-1193 Ethereum Provider interface with full compile-time type safety for JSON-RPC methods, parameters, and return values.

## Features

- **Type-safe RPC calls**: Method parameters and return types are validated at compile time
- **Standard EIP-1193 compliance**: Full support for the five standard events (connect, disconnect, chainChanged, accountsChanged, message)
- **Extensible schema system**: Define custom RPC methods and events with full type safety
- **Error handling**: Standardized error codes (EIP-1193 + JSON-RPC 2.0)
- **Tree-shakable**: Import only what you use

## Architecture

### Core Components

1. **RpcSchema** - Type system for defining RPC methods
2. **TypedProvider** - Generic provider interface with schema support
3. **VoltaireRpcSchema** - Default schema with all Voltaire JSON-RPC methods
4. **Event System** - Typed event emitters and error classes

## Basic Usage

### Using VoltaireProvider

```typescript
import type { TypedProvider, VoltaireRpcSchema, EIP1193EventMap } from '@tevm/voltaire/provider';

// Create a typed provider instance
const provider: TypedProvider<VoltaireRpcSchema, EIP1193EventMap> = /* ... */;

// Type-safe request: return type is inferred as string
const blockNumber = await provider.request({
  method: 'eth_blockNumber'
});

// Type-safe with parameters: params are validated
const balance = await provider.request({
  method: 'eth_getBalance',
  params: ['0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0', 'latest']
});

// Complex return types work too
const accounts = await provider.request({
  method: 'eth_accounts'
});
// accounts is typed as string[]
```

### Event Handling

```typescript
// Type-safe event listeners
provider.on('chainChanged', (chainId: string) => {
  console.log('Chain changed to:', parseInt(chainId, 16));
});

provider.on('accountsChanged', (accounts: string[]) => {
  if (accounts.length === 0) {
    console.log('Disconnected');
  } else {
    console.log('Active account:', accounts[0]);
  }
});

provider.on('connect', ({ chainId }) => {
  console.log('Connected to chain:', chainId);
});

// Chaining support
provider
  .on('chainChanged', handleChainChange)
  .on('accountsChanged', handleAccountsChange);
```

### Error Handling

```typescript
import { ProviderRpcError, EIP1193ErrorCode } from '@tevm/voltaire/provider';

try {
  const result = await provider.request({
    method: 'eth_sendTransaction',
    params: [{ /* ... */ }]
  });
} catch (error) {
  if (error instanceof ProviderRpcError) {
    switch (error.code) {
      case EIP1193ErrorCode.UserRejectedRequest:
        console.log('User rejected the transaction');
        break;
      case EIP1193ErrorCode.Unauthorized:
        console.log('Not authorized');
        break;
      default:
        console.error('RPC error:', error.message);
    }
  }
}
```

## Advanced Usage

### Custom RPC Schema

Define your own RPC schema for custom methods:

```typescript
import type { RpcSchema, TypedProvider } from '@tevm/voltaire/provider';

// Define custom schema
type CustomSchema = readonly [
  {
    Method: 'custom_method';
    Parameters: [string, number];
    ReturnType: { result: boolean };
  },
  {
    Method: 'custom_query';
    Parameters: [];
    ReturnType: string[];
  }
];

// Create provider with custom schema
const customProvider: TypedProvider<CustomSchema> = {
  request: async ({ method, params }) => {
    // Implementation
  },
  on: () => customProvider,
  removeListener: () => customProvider,
};

// Type-safe custom method calls
const result = await customProvider.request({
  method: 'custom_method',
  params: ['hello', 42]
});
// result is typed as { result: boolean }
```

### Extending Voltaire Schema

Combine VoltaireRpcSchema with custom methods:

```typescript
import type { VoltaireRpcSchema, DerivedRpcSchema } from '@tevm/voltaire/provider';

type CustomMethods = readonly [
  {
    Method: 'myapp_customMethod';
    Parameters: [string];
    ReturnType: number;
  }
];

// Merge schemas (simplified example - use proper merging in production)
type ExtendedSchema = [...VoltaireRpcSchema, ...CustomMethods];

const provider: TypedProvider<ExtendedSchema> = /* ... */;

// Can use both standard and custom methods
await provider.request({ method: 'eth_blockNumber' });
await provider.request({ method: 'myapp_customMethod', params: ['test'] });
```

### Custom Events

Extend the event map with custom events:

```typescript
import type { EIP1193EventMap } from '@tevm/voltaire/provider';

interface CustomEventMap extends EIP1193EventMap {
  newBlock(block: { number: string; hash: string }): void;
  newTransaction(txHash: string): void;
}

const provider: TypedProvider<VoltaireRpcSchema, CustomEventMap> = /* ... */;

// Standard events work
provider.on('chainChanged', (chainId) => { /* ... */ });

// Custom events work too
provider.on('newBlock', (block) => {
  console.log('New block:', block.number);
});
```

## Type Utilities

### Extract Method Names

```typescript
import type { RpcMethodNames, VoltaireRpcSchema } from '@tevm/voltaire/provider';

type Methods = RpcMethodNames<VoltaireRpcSchema>;
// 'eth_blockNumber' | 'eth_call' | 'eth_getBalance' | ...
```

### Extract Parameters

```typescript
import type { RpcMethodParameters, VoltaireRpcSchema } from '@tevm/voltaire/provider';

type CallParams = RpcMethodParameters<VoltaireRpcSchema, 'eth_call'>;
// [{ to: string, data?: string, ... }, string]
```

### Extract Return Type

```typescript
import type { RpcMethodReturnType, VoltaireRpcSchema } from '@tevm/voltaire/provider';

type BlockNumber = RpcMethodReturnType<VoltaireRpcSchema, 'eth_blockNumber'>;
// string
```

## Error Codes

### EIP-1193 Error Codes

```typescript
import { EIP1193ErrorCode } from '@tevm/voltaire/provider';

EIP1193ErrorCode.UserRejectedRequest  // 4001
EIP1193ErrorCode.Unauthorized         // 4100
EIP1193ErrorCode.UnsupportedMethod    // 4200
EIP1193ErrorCode.Disconnected         // 4900
EIP1193ErrorCode.ChainDisconnected    // 4901
```

### JSON-RPC 2.0 Error Codes

```typescript
import { JsonRpcErrorCode } from '@tevm/voltaire/provider';

JsonRpcErrorCode.ParseError       // -32700
JsonRpcErrorCode.InvalidRequest   // -32600
JsonRpcErrorCode.MethodNotFound   // -32601
JsonRpcErrorCode.InvalidParams    // -32602
JsonRpcErrorCode.InternalError    // -32603
```

## Supported Methods

VoltaireRpcSchema includes all standard Ethereum JSON-RPC methods:

### eth namespace (52 methods)
- `eth_accounts`, `eth_blockNumber`, `eth_call`, `eth_chainId`
- `eth_getBalance`, `eth_getCode`, `eth_getTransactionCount`
- `eth_sendTransaction`, `eth_sendRawTransaction`
- `eth_getBlock*`, `eth_getTransaction*`
- `eth_getLogs`, `eth_subscribe`, `eth_unsubscribe`
- And 40+ more...

### debug namespace (5 methods)
- `debug_getBadBlocks`, `debug_getRawBlock`, `debug_getRawHeader`
- `debug_getRawReceipts`, `debug_getRawTransaction`

### engine namespace (20 methods)
- `engine_newPayloadV1` through `engine_newPayloadV5`
- `engine_getPayloadV1` through `engine_getPayloadV6`
- `engine_forkchoiceUpdatedV1` through `engine_forkchoiceUpdatedV3`
- And more consensus layer methods...

### anvil namespace (14 test methods)
- `anvil_impersonateAccount`, `anvil_setBalance`, `anvil_setCode`
- `evm_mine`, `evm_snapshot`, `evm_revert`
- And other testing utilities...

## Migration from Legacy Provider

If you're using the existing `Provider` interface:

```typescript
// Old (untyped)
import type { Provider } from '@tevm/voltaire/provider';

const provider: Provider = /* ... */;
const result = await provider.request({ method: 'eth_blockNumber' });
// result is typed as unknown

// New (typed)
import type { TypedProvider, VoltaireRpcSchema } from '@tevm/voltaire/provider';

const provider: TypedProvider<VoltaireRpcSchema> = /* ... */;
const result = await provider.request({ method: 'eth_blockNumber' });
// result is typed as string
```

The legacy `Provider` interface is still available for backward compatibility, but we recommend migrating to `TypedProvider` for improved type safety.

## References

- [EIP-1193: Ethereum Provider JavaScript API](https://eips.ethereum.org/EIPS/eip-1193)
- [JSON-RPC 2.0 Specification](https://www.jsonrpc.org/specification)
- [Ethereum JSON-RPC API](https://ethereum.org/en/developers/docs/apis/json-rpc/)
