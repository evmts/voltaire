# ABI Module

Complete ABI (Application Binary Interface) encoding/decoding with type inference. All types namespaced under `Abi` for intuitive access.

## Overview

The ABI module provides strongly-typed encoding and decoding of Ethereum contract calls, events, and errors. It uses [abitype](https://abitype.dev/) for complete type inference including:

- uint/int variants → bigint
- address → Address (custom type)
- bool → boolean
- bytes/bytesN → Uint8Array
- string → string
- arrays → Array\<T\>
- tuples → readonly [T1, T2, ...]
- nested structs with full inference

## Quick Start

```typescript
import { Abi } from '@tevm/voltaire';

// Define ABI
const erc20Abi = [
  {
    type: 'function',
    name: 'transfer',
    stateMutability: 'nonpayable',
    inputs: [
      { type: 'address', name: 'to' },
      { type: 'uint256', name: 'amount' }
    ],
    outputs: [{ type: 'bool' }]
  }
] as const satisfies Abi;

// Encode function call
const calldata = Abi.Function.encodeParams.call(
  erc20Abi[0],
  [Address.from('0x742d35Cc...'), 1000n]
);

// Decode function result
const [success] = Abi.Function.decodeResult.call(erc20Abi[0], returnData);
```

## Documentation

### Core Concepts

- **[ABI Types](./abi.types.md)** - Type system, inference, and TypeScript mappings
- **[ABI Encoding](./abi.encoding.md)** - Encoding/decoding fundamentals and rules

### ABI Items

- **[Functions](./abi.function.md)** - Contract function definitions, encoding, and decoding
- **[Events](./abi.event.md)** - Event definitions, topics, and log decoding
- **[Errors](./abi.error.md)** - Custom error definitions and revert data
- **[Constructor](./abi.constructor.md)** - Constructor parameters and deployment

## Core Types

```typescript
import { Abi } from '@tevm/voltaire';

// Complete ABI (array of items)
type Abi = readonly Abi.Item[];

// ABI items
type Abi.Function = { type: 'function', name: string, inputs: Parameter[], outputs: Parameter[], stateMutability: StateMutability };
type Abi.Event = { type: 'event', name: string, inputs: Parameter[], anonymous?: boolean };
type Abi.Error = { type: 'error', name: string, inputs: Parameter[] };
type Abi.Constructor = { type: 'constructor', inputs: Parameter[], stateMutability: 'payable' | 'nonpayable' };
type Abi.Fallback = { type: 'fallback', stateMutability: StateMutability };
type Abi.Receive = { type: 'receive', stateMutability: 'payable' };

// Parameter definition
type Abi.Parameter = {
  type: string;                              // Solidity type
  name?: string;                             // Parameter name
  indexed?: boolean;                         // For event parameters
  components?: readonly Abi.Parameter[];     // For tuple types
};
```

See [ABI Types](./abi.types.md) for complete type documentation.

## API Reference

### Signature Generation

```typescript
// Function signature
const sig = Abi.Function.getSignature.call(func);

// Event signature
const sig = Abi.Event.getSignature.call(event);

// Error signature
const sig = Abi.Error.getSignature.call(error);
```

See [Functions](./abi.function.md), [Events](./abi.event.md), [Errors](./abi.error.md)

### Selector Computation

```typescript
// Function selector (4 bytes)
const selector = Abi.Function.getSelector.call(func);
const selector = Abi.getFunctionSelector('transfer(address,uint256)');

// Event selector (32 bytes)
const selector = Abi.Event.getSelector.call(event);
const selector = Abi.getEventSelector('Transfer(address,address,uint256)');

// Error selector (4 bytes)
const selector = Abi.Error.getSelector.call(error);
const selector = Abi.getErrorSelector('InsufficientBalance(uint256,uint256)');
```

See [Functions](./abi.function.md), [Events](./abi.event.md), [Errors](./abi.error.md)

### Encoding/Decoding

```typescript
// Generic parameters
const encoded = Abi.encodeParameters(params, values);
const decoded = Abi.decodeParameters(params, encoded);

// Function calls
const calldata = Abi.Function.encodeParams.call(func, args);
const args = Abi.Function.decodeParams.call(func, calldata);

// Function results
const resultData = Abi.Function.encodeResult.call(func, returnValues);
const returnValues = Abi.Function.decodeResult.call(func, resultData);

// Event topics
const topics = Abi.Event.encodeTopics.call(event, indexedParams);
const eventData = Abi.Event.decodeLog.call(event, data, topics);

// Errors
const errorData = Abi.Error.encodeParams.call(error, params);
const params = Abi.Error.decodeParams.call(error, errorData);

// Constructor
const deployData = Abi.Constructor.encodeParams.call(constructor, bytecode, args);
const args = Abi.Constructor.decodeParams.call(constructor, deployData, bytecodeLength);
```

See [ABI Encoding](./abi.encoding.md) for detailed encoding rules.

### ABI Operations

```typescript
// Get item by name
const func = Abi.getItem.call(abi, 'transfer', 'function');
const event = Abi.getItem.call(abi, 'Transfer', 'event');

// Format items
const formatted = Abi.formatAbiItem(func);
const formattedWithArgs = Abi.formatAbiItemWithArgs(func, args);
```

### Type Inference

```typescript
// Parameter types
type InputTypes = Abi.ParametersToPrimitiveTypes<typeof func.inputs>;
type OutputTypes = Abi.ParametersToPrimitiveTypes<typeof func.outputs>;

// Named object types
type EventParams = Abi.ParametersToObject<typeof event.inputs>;

// Extract names
type FunctionNames = Abi.ExtractFunctionNames<typeof abi>;
type EventNames = Abi.ExtractEventNames<typeof abi>;

// Get specific items
type TransferFunc = Abi.GetFunction<typeof abi, 'transfer'>;
type TransferEvent = Abi.GetEvent<typeof abi, 'Transfer'>;
```

See [ABI Types](./abi.types.md) for complete type inference documentation.

## Error Handling

```typescript
import {
  AbiEncodingError,
  AbiDecodingError,
  AbiParameterMismatchError,
  AbiItemNotFoundError,
  AbiInvalidSelectorError
} from '@tevm/voltaire';

try {
  const data = Abi.Function.encodeParams.call(func, args);
} catch (err) {
  if (err instanceof AbiEncodingError) {
    console.error('Encoding failed:', err.message);
  }
  if (err instanceof AbiParameterMismatchError) {
    console.error('Arguments do not match function inputs');
  }
}
```

## Performance

Based on benchmark results:

| Operation | Performance | Notes |
|-----------|-------------|-------|
| Signature generation | 20,000,000 ops/sec | String formatting |
| Selector computation | 320,000 ops/sec | Dominated by keccak256 |
| Parameter encoding | 2,800,000 ops/sec | Simple types |
| Parameter decoding | 2,700,000 ops/sec | Simple types |
| ABI item lookup | 35,000,000 ops/sec | Array search |
| Formatting | 7,000,000 - 20,000,000 ops/sec | String operations |

Performance varies based on type complexity and data size.

## Implementation Status

### ✅ Fully Implemented

- Signature generation (Function, Event, Error)
- Selector computation (4-byte and 32-byte)
- Parameter encoding/decoding (Pure TypeScript)
- Function call encoding/decoding
- Event topic encoding
- Error encoding/decoding
- Constructor encoding/decoding
- Type inference with abitype
- ABI formatting functions
- ABI item lookup

### ⏳ Partial Implementation

- Event log decoding (basic support)
- WASM variants (API defined, C layer not implemented)

### 🚧 Not Yet Implemented

- encodePacked (Solidity abi.encodePacked)
- Calldata decoding with selector inference
- Batch log parsing
- WASM-accelerated encoding/decoding

## Type Support

| Type Category | Status | Notes |
|---------------|--------|-------|
| uint variants | ✅ | uint8 - uint256 |
| int variants | ⚠️ | int8 - int248 (not int256) |
| address | ✅ | Branded type |
| bool | ✅ | Boolean |
| string | ✅ | UTF-8 |
| bytes | ✅ | Dynamic |
| bytesN | ✅ | bytes1 - bytes32 |
| Dynamic arrays | ✅ | T[] |
| Fixed arrays | ❌ | T[N] |
| Nested arrays | ❌ | T[][] |
| Tuples | ✅ | Basic support |

See [ABI Types](./abi.types.md) for detailed type support information.

## WASM Acceleration

WASM-accelerated variants are planned but not yet implemented. API is defined and stable:

```typescript
import {
  encodeParametersWasm,
  decodeParametersWasm,
  isWasmAbiAvailable,
  getWasmImplementationStatus
} from '@tevm/voltaire';

console.log(isWasmAbiAvailable());
// false (C API layer not implemented)

console.log(getWasmImplementationStatus());
// {
//   available: false,
//   reason: "C ABI encoding/decoding layer not yet implemented",
//   fallback: "Pure TypeScript implementations available"
// }
```

Expected performance improvements once implemented:
- Simple encoding: 2-5x faster
- Complex nested types: 3-10x faster
- Batch operations: 5-15x faster

See [ABI Encoding](./abi.encoding.md) for WASM details.

## Best Practices

1. **Use `as const satisfies Abi`** for full type inference
2. **Validate inputs** before encoding
3. **Handle errors** with specific error types
4. **Use utility functions** for simple operations
5. **Cache selectors** for repeated operations

See individual documentation pages for detailed best practices.

## Common Patterns

### ERC-20 Interface

```typescript
const erc20Abi = [
  {
    type: 'function',
    name: 'transfer',
    stateMutability: 'nonpayable',
    inputs: [
      { type: 'address', name: 'to' },
      { type: 'uint256', name: 'amount' }
    ],
    outputs: [{ type: 'bool' }]
  },
  {
    type: 'event',
    name: 'Transfer',
    inputs: [
      { type: 'address', name: 'from', indexed: true },
      { type: 'address', name: 'to', indexed: true },
      { type: 'uint256', name: 'value' }
    ]
  }
] as const satisfies Abi;

type FunctionNames = Abi.ExtractFunctionNames<typeof erc20Abi>;
```

More patterns in [Functions](./abi.function.md), [Events](./abi.event.md), [Errors](./abi.error.md)

## References

- [Ethereum Contract ABI Specification](https://docs.soliditylang.org/en/latest/abi-spec.html)
- [abitype](https://github.com/wevm/abitype) - Type utilities for Ethereum ABIs
- [viem](https://viem.sh) - TypeScript Ethereum library
- [ethers.js](https://docs.ethers.org) - Contract ABI encoding reference
