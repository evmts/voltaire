# ABI Module

Complete ABI (Application Binary Interface) encoding/decoding with type inference matching viem. All types namespaced under `Abi` for intuitive access.

## Overview

The ABI module provides strongly-typed encoding and decoding of Ethereum contract calls, events, and errors. It uses abitype for complete type inference including:
- uint/int variants → bigint
- address → Address (custom type)
- bool → boolean
- bytes/bytesN → Uint8Array
- string → string
- arrays → Array<T>
- tuples → readonly [T1, T2, ...]
- nested structs with full inference

## Core Types

```typescript
import { Abi } from './abi.js';

// ABI items
type Abi.Function = { type: 'function', name: string, inputs: Parameter[], outputs: Parameter[], ... };
type Abi.Event = { type: 'event', name: string, inputs: Parameter[], ... };
type Abi.Error = { type: 'error', name: string, inputs: Parameter[], ... };
type Abi.Constructor = { type: 'constructor', inputs: Parameter[], ... };
type Abi.Fallback = { type: 'fallback', stateMutability: StateMutability };
type Abi.Receive = { type: 'receive', stateMutability: 'payable' };

// Parameter definition
type Abi.Parameter = {
  type: string;        // e.g., 'uint256', 'address', 'tuple'
  name?: string;
  indexed?: boolean;   // for event parameters
  components?: readonly Parameter[];  // for tuples
};

// Complete ABI (array of items)
type Abi = readonly Abi.Item[];
```

## Signature Generation

### Function Signatures

```typescript
const transferFunc: Abi.Function = {
  type: 'function',
  name: 'transfer',
  stateMutability: 'nonpayable',
  inputs: [
    { type: 'address', name: 'to' },
    { type: 'uint256', name: 'amount' },
  ],
  outputs: [{ type: 'bool', name: '' }],
};

// Generate signature
const sig = Abi.Function.getSignature.call(transferFunc);
// "transfer(address,uint256)"
```

### Event Signatures

```typescript
const transferEvent: Abi.Event = {
  type: 'event',
  name: 'Transfer',
  inputs: [
    { type: 'address', name: 'from', indexed: true },
    { type: 'address', name: 'to', indexed: true },
    { type: 'uint256', name: 'value', indexed: false },
  ],
};

const sig = Abi.Event.getSignature.call(transferEvent);
// "Transfer(address,address,uint256)"
```

### Error Signatures

```typescript
const error: Abi.Error = {
  type: 'error',
  name: 'InsufficientBalance',
  inputs: [
    { type: 'uint256', name: 'available' },
    { type: 'uint256', name: 'required' },
  ],
};

const sig = Abi.Error.getSignature.call(error);
// "InsufficientBalance(uint256,uint256)"
```

## Selector Computation

### Function Selectors (4 bytes)

```typescript
// From function definition
const selector = Abi.Function.getSelector.call(transferFunc);
// Uint8Array([0xa9, 0x05, 0x9c, 0xbb]) = keccak256("transfer(address,uint256)")[0:4]

// From signature string
const selector = Abi.getFunctionSelector("transfer(address,uint256)");
// Uint8Array([0xa9, 0x05, 0x9c, 0xbb])
```

### Event Selectors (32 bytes, topic0)

```typescript
// From event definition
const selector = Abi.Event.getSelector.call(transferEvent);
// Full 32-byte hash = keccak256("Transfer(address,address,uint256)")

// From signature string
const selector = Abi.getEventSelector("Transfer(address,address,uint256)");
// 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
```

### Error Selectors (4 bytes)

```typescript
// From error definition
const selector = Abi.Error.getSelector.call(error);
// Uint8Array([...]) = keccak256("InsufficientBalance(uint256,uint256)")[0:4]

// From signature string
const selector = Abi.getErrorSelector("InsufficientBalance(uint256,uint256)");
```

## Encoding/Decoding (Not Yet Implemented)

The following operations are defined but throw "Not implemented" errors:

### Function Encoding/Decoding

```typescript
// Encode function call
const data = Abi.Function.encodeParams.call(transferFunc, [address, amount]);
// selector (4 bytes) + encoded parameters

// Decode function call
const args = Abi.Function.decodeParams.call(transferFunc, data);

// Encode function result
const result = Abi.Function.encodeResult.call(balanceOfFunc, [balance]);

// Decode function result
const values = Abi.Function.decodeResult.call(balanceOfFunc, data);
```

### Event Encoding/Decoding

```typescript
// Encode event topics (indexed parameters)
const topics = Abi.Event.encodeTopics.call(transferEvent, { from, to });
// [topic0, indexed_param1, indexed_param2, ...]

// Decode event log
const decoded = Abi.Event.decodeLog.call(transferEvent, data, topics);
// { from: Address, to: Address, value: bigint }
```

### Error Encoding/Decoding

```typescript
// Encode error
const data = Abi.Error.encodeParams.call(error, [available, required]);
// selector (4 bytes) + encoded parameters

// Decode error
const params = Abi.Error.decodeParams.call(error, data);
```

### Constructor Encoding/Decoding

```typescript
const constructor: Abi.Constructor = {
  type: 'constructor',
  stateMutability: 'nonpayable',
  inputs: [{ type: 'uint256', name: 'initialSupply' }],
};

// Encode constructor with bytecode
const deployData = Abi.Constructor.encodeParams.call(constructor, bytecode, [1000n]);
// bytecode + encoded constructor args

// Decode constructor args
const args = Abi.Constructor.decodeParams.call(constructor, data, bytecode.length);
```

### Parameter Encoding/Decoding

```typescript
// Encode generic parameters
const params = [{ type: 'address' }, { type: 'uint256' }];
const encoded = Abi.encodeParameters(params, [address, amount]);

// Decode generic parameters
const values = Abi.decodeParameters(params, encoded);
```

## ABI-Level Operations

### Get Item from ABI

```typescript
const abi: Abi = [
  { type: 'function', name: 'transfer', ... },
  { type: 'event', name: 'Transfer', ... },
];

// Find by name
const func = Abi.getItem.call(abi, 'transfer', 'function');
const event = Abi.getItem.call(abi, 'Transfer', 'event');
```

### Encode/Decode by Function Name (Not Implemented)

```typescript
// Encode function call by name
const data = Abi.encode.call(abi, 'transfer', [address, amount]);

// Decode function result by name
const result = Abi.decode.call(abi, 'balanceOf', data);

// Decode calldata (infer function from selector)
const { functionName, args } = Abi.decodeData.call(abi, calldata);

// Parse event logs
const parsed = Abi.parseLogs.call(abi, logs);
```

## Formatting Functions

### Format ABI Items

```typescript
// Function
const formatted = Abi.formatAbiItem(transferFunc);
// "function transfer(address to, uint256 amount) returns (bool)"

// Event
const formatted = Abi.formatAbiItem(transferEvent);
// "event Transfer(address from, address to, uint256 value)"

// Error
const formatted = Abi.formatAbiItem(error);
// "error InsufficientBalance(uint256 available, uint256 required)"

// With state mutability
const viewFunc: Abi.Function = {
  type: 'function',
  name: 'balanceOf',
  stateMutability: 'view',
  inputs: [{ type: 'address', name: 'account' }],
  outputs: [{ type: 'uint256', name: '' }],
};

const formatted = Abi.formatAbiItem(viewFunc);
// "function balanceOf(address account) returns (uint256) view"
```

### Format with Arguments

```typescript
// Function call with args
const formatted = Abi.formatAbiItemWithArgs(transferFunc, [
  "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
  1000000000000000000n,
]);
// "transfer(0x742d35Cc6634C0532925a3b844Bc9e7595f251e3, 1000000000000000000)"

// Event with args
const formatted = Abi.formatAbiItemWithArgs(transferEvent, [
  "0x0000000000000000000000000000000000000000",
  "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
  1000n,
]);
// "Transfer(0x0000000000000000000000000000000000000000, ...)"
```

## Type Inference

### Parameter Type Conversion

```typescript
// Convert ABI parameters to TypeScript types
type InputTypes = Abi.ParametersToPrimitiveTypes<typeof transferFunc.inputs>;
// [Address, bigint]

type OutputTypes = Abi.ParametersToPrimitiveTypes<typeof transferFunc.outputs>;
// [boolean]

// Convert to named object
type EventParams = Abi.ParametersToObject<typeof transferEvent.inputs>;
// { from: Address, to: Address, value: bigint }
```

### ABI Type Extraction

```typescript
const abi = [
  { type: 'function', name: 'transfer', ... },
  { type: 'function', name: 'balanceOf', ... },
  { type: 'event', name: 'Transfer', ... },
] as const satisfies Abi;

// Extract function names
type FunctionNames = Abi.ExtractFunctionNames<typeof abi>;
// "transfer" | "balanceOf"

// Extract event names
type EventNames = Abi.ExtractEventNames<typeof abi>;
// "Transfer"

// Get specific function
type TransferFunc = Abi.GetFunction<typeof abi, "transfer">;
// The transfer function definition

// Get specific event
type TransferEvent = Abi.GetEvent<typeof abi, "Transfer">;
// The Transfer event definition
```

### Complex Type Inference

```typescript
// Arrays
const batchFunc: Abi.Function = {
  type: 'function',
  name: 'batchTransfer',
  inputs: [
    { type: 'address[]', name: 'recipients' },
    { type: 'uint256[]', name: 'amounts' },
  ],
  outputs: [],
};

type Inputs = Abi.ParametersToPrimitiveTypes<typeof batchFunc.inputs>;
// [readonly Address[], readonly bigint[]]

// Tuples (structs)
const swapFunc: Abi.Function = {
  type: 'function',
  name: 'swap',
  inputs: [{
    type: 'tuple',
    name: 'params',
    components: [
      { type: 'address', name: 'tokenIn' },
      { type: 'address', name: 'tokenOut' },
      { type: 'uint256', name: 'amountIn' },
    ],
  }],
  outputs: [{ type: 'uint256', name: 'amountOut' }],
};

type SwapInputs = Abi.ParametersToPrimitiveTypes<typeof swapFunc.inputs>;
// [{
//   readonly tokenIn: Address;
//   readonly tokenOut: Address;
//   readonly amountIn: bigint;
// }]

// Nested tuples
const complexFunc: Abi.Function = {
  type: 'function',
  name: 'processOrder',
  inputs: [{
    type: 'tuple',
    name: 'order',
    components: [
      { type: 'address', name: 'maker' },
      {
        type: 'tuple',
        name: 'asset',
        components: [
          { type: 'address', name: 'token' },
          { type: 'uint256', name: 'amount' },
        ],
      },
      { type: 'uint256[]', name: 'fees' },
    ],
  }],
  outputs: [],
};

type OrderInputs = Abi.ParametersToPrimitiveTypes<typeof complexFunc.inputs>;
// [{
//   readonly maker: Address;
//   readonly asset: {
//     readonly token: Address;
//     readonly amount: bigint;
//   };
//   readonly fees: readonly bigint[];
// }]
```

## Error Handling

```typescript
// Custom error types
import {
  AbiEncodingError,
  AbiDecodingError,
  AbiParameterMismatchError,
  AbiItemNotFoundError,
  AbiInvalidSelectorError,
} from './abi.js';

// Encoding errors
try {
  const data = Abi.Function.encodeParams.call(func, args);
} catch (err) {
  if (err instanceof AbiEncodingError) {
    console.error("Encoding failed:", err.message);
  }
  if (err instanceof AbiParameterMismatchError) {
    console.error("Args don't match function inputs:", err.message);
  }
}

// Decoding errors
try {
  const args = Abi.Function.decodeParams.call(func, data);
} catch (err) {
  if (err instanceof AbiDecodingError) {
    console.error("Decoding failed:", err.message);
  }
  if (err instanceof AbiInvalidSelectorError) {
    console.error("Selector mismatch:", err.message);
  }
}

// Item not found
try {
  const data = Abi.encode.call(abi, 'nonexistent', []);
} catch (err) {
  if (err instanceof AbiItemNotFoundError) {
    console.error("Function not found in ABI");
  }
}
```

## Common Patterns

### ERC-20 Token Interface

```typescript
const erc20Abi = [
  {
    type: 'function',
    name: 'transfer',
    stateMutability: 'nonpayable',
    inputs: [
      { type: 'address', name: 'to' },
      { type: 'uint256', name: 'amount' },
    ],
    outputs: [{ type: 'bool', name: '' }],
  },
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ type: 'address', name: 'account' }],
    outputs: [{ type: 'uint256', name: '' }],
  },
  {
    type: 'event',
    name: 'Transfer',
    inputs: [
      { type: 'address', name: 'from', indexed: true },
      { type: 'address', name: 'to', indexed: true },
      { type: 'uint256', name: 'value', indexed: false },
    ],
  },
] as const satisfies Abi;

// Get selectors
const transferSel = Abi.getFunctionSelector("transfer(address,uint256)");
// 0xa9059cbb

const transferEventSel = Abi.getEventSelector("Transfer(address,address,uint256)");
// 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef

// Type-safe function access
type FunctionNames = Abi.ExtractFunctionNames<typeof erc20Abi>;
// "transfer" | "balanceOf"
```

### Custom Error Handling

```typescript
const customErrors = [
  {
    type: 'error',
    name: 'InsufficientBalance',
    inputs: [
      { type: 'uint256', name: 'available' },
      { type: 'uint256', name: 'required' },
    ],
  },
  {
    type: 'error',
    name: 'InsufficientAllowance',
    inputs: [
      { type: 'uint256', name: 'allowance' },
      { type: 'uint256', name: 'required' },
    ],
  },
] as const satisfies Abi;

// Get error selectors
const insufficientBalanceSel = Abi.getErrorSelector(
  "InsufficientBalance(uint256,uint256)"
);
```

### Complex Struct Encoding

```typescript
// UniswapV3 style swap parameters
const swapFunc: Abi.Function = {
  type: 'function',
  name: 'swap',
  stateMutability: 'nonpayable',
  inputs: [{
    type: 'tuple',
    name: 'params',
    components: [
      { type: 'address', name: 'tokenIn' },
      { type: 'address', name: 'tokenOut' },
      { type: 'uint24', name: 'fee' },
      { type: 'address', name: 'recipient' },
      { type: 'uint256', name: 'deadline' },
      { type: 'uint256', name: 'amountIn' },
      { type: 'uint256', name: 'amountOutMinimum' },
      { type: 'uint160', name: 'sqrtPriceLimitX96' },
    ],
  }],
  outputs: [{ type: 'uint256', name: 'amountOut' }],
};

// Type inference works automatically
type SwapParams = Abi.ParametersToPrimitiveTypes<typeof swapFunc.inputs>[0];
// {
//   readonly tokenIn: Address;
//   readonly tokenOut: Address;
//   readonly fee: bigint;
//   readonly recipient: Address;
//   readonly deadline: bigint;
//   readonly amountIn: bigint;
//   readonly amountOutMinimum: bigint;
//   readonly sqrtPriceLimitX96: bigint;
// }
```

## Performance Characteristics

Based on benchmark results (see `abi.bench.ts`):

### Signature Generation
- **Simple signatures**: ~20M ops/sec
- **Complex tuples**: ~25M ops/sec
- Very fast string formatting operations

### Selector Computation
- **Function selectors**: ~320K ops/sec
- **Event selectors**: ~325K ops/sec
- **Error selectors**: ~325K ops/sec
- **Utility functions**: ~330K ops/sec
- Dominated by keccak256 hashing cost

### Formatting
- **formatAbiItem**: 7-20M ops/sec
- **formatAbiItemWithArgs**: 9-11M ops/sec
- Simple string operations

### ABI Lookup
- **getItem**: ~35M ops/sec
- Very fast array search

### Not Yet Implemented
- Encoding/decoding performance TBD
- Expected: ~100-500K ops/sec for typical parameters
- Will depend on type complexity and data size

## Implementation Status

### ✅ Implemented
- Signature generation (Function, Event, Error)
- Selector computation (4-byte and 32-byte)
- Utility selector functions
- ABI formatting functions
- Type inference with abitype
- Type extraction utilities
- ABI item lookup

### ⏳ Not Yet Implemented
- Parameter encoding/decoding
- Function call encoding/decoding
- Event topic encoding/log decoding
- Error encoding/decoding
- Constructor encoding/decoding
- encodePacked
- Calldata decoding (selector inference)
- Log parsing

These will require:
- Cursor-based byte manipulation
- Static vs dynamic type routing
- Offset calculation for dynamic types
- Proper padding (left for numbers, right for bytes)
- Recursive tuple/array handling

## Best Practices

### Use Type Inference

```typescript
// Define ABI with 'as const satisfies Abi' for full type inference
const abi = [
  { type: 'function', name: 'transfer', ... },
] as const satisfies Abi;

// TypeScript will infer function names, parameter types, etc.
type Names = Abi.ExtractFunctionNames<typeof abi>;
```

### Validate Inputs

```typescript
// Check ABI item exists before operations
const func = Abi.getItem.call(abi, 'transfer', 'function');
if (!func) {
  throw new Error('Function not found');
}
```

### Use Utility Functions

```typescript
// Prefer utility functions for simple operations
const selector = Abi.getFunctionSelector(signature);

// vs
const func = { type: 'function', name: 'foo', ... };
const selector = Abi.Function.getSelector.call(func);
```

### Handle Errors Appropriately

```typescript
// Use specific error types for better error handling
try {
  const data = Abi.encode.call(abi, functionName, args);
} catch (err) {
  if (err instanceof AbiItemNotFoundError) {
    // Handle missing function
  } else if (err instanceof AbiParameterMismatchError) {
    // Handle argument mismatch
  } else if (err instanceof AbiEncodingError) {
    // Handle general encoding error
  }
}
```

## References

- [Ethereum Contract ABI Specification](https://docs.soliditylang.org/en/latest/abi-spec.html)
- [abitype](https://github.com/wevm/abitype) - Type utilities for Ethereum ABIs
- [viem](https://viem.sh) - TypeScript Ethereum library (API inspiration)
- [ethers.js](https://docs.ethers.org) - Contract ABI encoding reference
