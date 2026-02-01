# EIP-1193 Strongly-Typed Provider Implementation Summary

## Overview

Implemented a strongly-typed EIP-1193 Ethereum Provider interface for Voltaire with full compile-time type safety for JSON-RPC methods, parameters, and return values.

## What Was Implemented

### 1. Core Type System

**RpcSchema.ts** - Base type system for defining RPC methods
- `RpcSchema` - Readonly array of method definitions
- `RpcMethodNames<T>` - Extracts method names from schema
- `RpcMethodParameters<T, M>` - Extracts parameters for specific method
- `RpcMethodReturnType<T, M>` - Extracts return type for specific method

### 2. Request Module (`request/`)

**RequestArguments.ts** - Type-safe request arguments
- `RequestArguments<TSchema, TMethod>` - Generic request args with method validation

**EIP1193RequestOptions.ts** - Request configuration
- `EIP1193RequestOptions` - Retry, delay, and timeout options

**EIP1193RequestFn.ts** - Request function type
- `EIP1193RequestFn<TSchema>` - Type-safe request function with method inference

### 3. Events Module (`events/`)

**ProviderRpcError.ts** - Error handling
- `ProviderRpcError` - Error class with code and data
- `EIP1193ErrorCode` - Standard EIP-1193 error codes (4001, 4100, 4200, 4900, 4901)
- `JsonRpcErrorCode` - JSON-RPC 2.0 error codes (-32700 to -32603)

**EIP1193Provider.ts** - Supporting types
- `ProviderConnectInfo` - Connection info for connect event
- `ProviderMessage` - Message structure for message event
- `EthSubscription` - Specialized subscription message type

**EIP1193Events.ts** - Event system
- `EIP1193EventMap` - Interface defining five standard events:
  - `connect(connectInfo: ProviderConnectInfo): void`
  - `disconnect(error: ProviderRpcError): void`
  - `chainChanged(chainId: string): void`
  - `accountsChanged(accounts: string[]): void`
  - `message(message: ProviderMessage): void`
- `EIP1193EventEmitter<TEventMap>` - Generic event emitter interface

### 4. Provider Interfaces

**TypedProvider.ts** - Generic provider interface
- `TypedProvider<TRpcSchema, TEventMap>` - Generic provider with:
  - `request: EIP1193RequestFn<TRpcSchema>` - Type-safe request method
  - `on<TEvent>(event, listener): this` - Event listener registration
  - `removeListener<TEvent>(event, listener): this` - Event listener removal
- `EIP1193Provider` - Type alias for standard provider

### 5. Schemas Module (`schemas/`)

**VoltaireRpcSchema.ts** - Default RPC schema
- Complete schema with 88 methods across 4 namespaces:
  - `eth` - 52 methods (eth_accounts, eth_call, eth_getBalance, etc.)
  - `debug` - 5 methods (debug_getRawBlock, debug_getRawTransaction, etc.)
  - `engine` - 20 methods (engine_newPayloadV1-V5, engine_getPayloadV1-V6, etc.)
  - `anvil` - 14 test methods (anvil_impersonateAccount, evm_mine, etc.)

**DerivedRpcSchema.ts** - Schema composition utilities
- `DerivedRpcSchema<TBase, TOverride>` - Merge/override schemas
- `RpcSchemaOverride` - Type for schema overrides

### 6. Tests

**ProviderRpcError.test.ts** - Error class tests
- Error construction with code/message/data
- Standard error code validation
- Error throwing and catching
- Stack trace preservation
- JSON serialization

**VoltaireRpcSchema.test.ts** - Schema type tests
- Method name extraction validation
- Parameter type extraction for various methods
- Return type extraction for various methods
- Type-level validation using `expectTypeOf`

**TypedProvider.test.ts** - Integration tests
- Type-safe request method usage
- Parameter validation at compile time
- Event listener type safety
- Method chaining support

### 7. Documentation

**EIP1193_TYPES.md** - Comprehensive usage guide
- Basic usage examples
- Advanced patterns (custom schemas, custom events)
- Type utilities documentation
- Error handling patterns
- Migration guide from legacy Provider

**examples/typed-provider-example.ts** - Working examples
- Mock provider creation
- Type-safe RPC calls
- Event handling
- Error handling
- Request options usage
- Compile-time error examples

## Key Features

### Type Safety

```typescript
// Method names are validated
await provider.request({ method: 'eth_blockNumber' }); // ✅
await provider.request({ method: 'invalid_method' });  // ❌ Compile error

// Parameters are validated
await provider.request({
  method: 'eth_getBalance',
  params: ['0x...', 'latest']  // ✅
});
await provider.request({
  method: 'eth_getBalance',
  params: [123, true]  // ❌ Compile error
});

// Return types are inferred
const blockNumber = await provider.request({ method: 'eth_blockNumber' });
// blockNumber is typed as string, not unknown
```

### Extensibility

```typescript
// Custom schema
type CustomSchema = readonly [
  { Method: 'custom_method'; Parameters: [string]; ReturnType: number }
];

const provider: TypedProvider<CustomSchema> = /* ... */;

// Custom events
interface CustomEventMap extends EIP1193EventMap {
  newBlock(block: Block): void;
}

const provider: TypedProvider<VoltaireRpcSchema, CustomEventMap> = /* ... */;
```

### Backward Compatibility

- Legacy `Provider` interface remains unchanged
- New types exported with clear naming
- Legacy types aliased with `Legacy` prefix where conflicts exist
- Gradual migration path available

## File Structure

```
src/provider/
├── RpcSchema.ts                    # Base type system
├── TypedProvider.ts                # Generic provider interface
├── request/
│   ├── RequestArguments.ts
│   ├── EIP1193RequestOptions.ts
│   ├── EIP1193RequestFn.ts
│   └── index.ts
├── events/
│   ├── ProviderRpcError.ts
│   ├── EIP1193Provider.ts
│   ├── EIP1193Events.ts
│   └── index.ts
├── schemas/
│   ├── VoltaireRpcSchema.ts
│   ├── DerivedRpcSchema.ts
│   └── index.ts
├── examples/
│   └── typed-provider-example.ts
├── EIP1193_TYPES.md
└── IMPLEMENTATION_SUMMARY.md
```

## Test Results

```
✓ src/provider/events/ProviderRpcError.test.ts (7 tests)
✓ src/provider/schemas/VoltaireRpcSchema.test.ts (9 tests)
✓ src/provider/TypedProvider.test.ts (4 tests)
✓ src/provider/EIP1193Provider.test.ts (32 tests)

Test Files  4 passed (4)
Tests       52 passed (52)
Type Errors no errors
```

## Standards Compliance

### EIP-1193 Specification

✅ Single `request()` method for all RPC calls
✅ Five standard events (connect, disconnect, chainChanged, accountsChanged, message)
✅ Standard error codes (4001, 4100, 4200, 4900, 4901)
✅ ProviderRpcError with code, message, and optional data
✅ Promise-based async interface
✅ EventEmitter pattern with on/removeListener

### JSON-RPC 2.0 Specification

✅ Standard error codes (-32700 to -32603)
✅ Method and params structure
✅ Error object structure

## Benefits

1. **Compile-time validation** - Catch errors before runtime
2. **IntelliSense support** - Full autocomplete for methods, params, and return types
3. **Refactoring safety** - Breaking changes are caught by TypeScript
4. **Documentation through types** - Types serve as inline documentation
5. **Extensibility** - Easy to add custom methods and events
6. **Zero runtime overhead** - Pure type system, no runtime code
7. **Tree-shakable** - Import only what you use
8. **Backward compatible** - Existing code continues to work

## Future Work

- Implement concrete provider classes using TypedProvider
- Add batch request support
- Add subscription helpers
- Create transport abstraction layer
- Add middleware support for request/response transformation
- Create testing utilities for mocking typed providers

## References

- [EIP-1193: Ethereum Provider JavaScript API](https://eips.ethereum.org/EIPS/eip-1193)
- [JSON-RPC 2.0 Specification](https://www.jsonrpc.org/specification)
- Inspired by viem's type system and TEVM's decorators package
