# ABI Types

The ABI type system provides complete type inference for Ethereum contract interfaces. All types are powered by [abitype](https://abitype.dev/) for maximum type safety.

## Core Type Definitions

### ABI Item Types

```typescript
import { Abi } from '@tevm/voltaire';

// Complete ABI (array of items)
type Abi = readonly Abi.Item[];

// Individual item types
type Abi.Item =
  | Abi.Function
  | Abi.Event
  | Abi.Error
  | Abi.Constructor
  | Abi.Fallback
  | Abi.Receive;
```

### Parameter Definition

```typescript
type Abi.Parameter = {
  type: string;              // Solidity type (e.g., 'uint256', 'address', 'tuple')
  name?: string;             // Parameter name
  indexed?: boolean;         // For event parameters only
  components?: readonly Abi.Parameter[];  // For tuple types
};
```

### Function Types

```typescript
type Abi.Function = {
  type: 'function';
  name: string;
  inputs: readonly Abi.Parameter[];
  outputs: readonly Abi.Parameter[];
  stateMutability: 'pure' | 'view' | 'nonpayable' | 'payable';
};
```

### Event Types

```typescript
type Abi.Event = {
  type: 'event';
  name: string;
  inputs: readonly Abi.Parameter[];
  anonymous?: boolean;
};
```

### Error Types

```typescript
type Abi.Error = {
  type: 'error';
  name: string;
  inputs: readonly Abi.Parameter[];
};
```

### Constructor Types

```typescript
type Abi.Constructor = {
  type: 'constructor';
  inputs: readonly Abi.Parameter[];
  stateMutability: 'payable' | 'nonpayable';
};
```

### Special Function Types

```typescript
// Fallback function
type Abi.Fallback = {
  type: 'fallback';
  stateMutability: 'pure' | 'view' | 'nonpayable' | 'payable';
};

// Receive function
type Abi.Receive = {
  type: 'receive';
  stateMutability: 'payable';
};
```

## Solidity Type Mappings

The ABI type system automatically converts Solidity types to TypeScript:

### Primitive Types

| Solidity Type | TypeScript Type | Notes |
|---------------|----------------|-------|
| `uint8` - `uint256` | `bigint` | All uint variants |
| `int8` - `int248` | `bigint` | int256 not supported (Zig limitation) |
| `address` | `Address` | Custom branded type |
| `bool` | `boolean` | Boolean |
| `bytes` | `Uint8Array` | Dynamic byte array |
| `bytes1` - `bytes32` | `Uint8Array` | Fixed-size byte array |
| `string` | `string` | UTF-8 string |

### Complex Types

| Solidity Type | TypeScript Type | Example |
|---------------|----------------|---------|
| `uint256[]` | `readonly bigint[]` | Dynamic array |
| `address[5]` | `readonly [Address, Address, Address, Address, Address]` | Fixed array |
| `tuple` | `{ readonly field: Type; ... }` | Struct |
| `uint256[][]` | `readonly (readonly bigint[])[]` | Nested array |

## Type Inference Utilities

### Parameter Type Conversion

Convert ABI parameters to TypeScript types:

```typescript
// Array of types
type ParametersToPrimitiveTypes<T extends readonly Abi.Parameter[]> = ...;

// Example
const params = [
  { type: 'address', name: 'to' },
  { type: 'uint256', name: 'amount' }
] as const;

type Types = Abi.ParametersToPrimitiveTypes<typeof params>;
// [Address, bigint]
```

### Parameter to Object Conversion

Convert parameters to a named object:

```typescript
type ParametersToObject<T extends readonly Abi.Parameter[]> = ...;

// Example
const params = [
  { type: 'address', name: 'from', indexed: true },
  { type: 'address', name: 'to', indexed: true },
  { type: 'uint256', name: 'value' }
] as const;

type Obj = Abi.ParametersToObject<typeof params>;
// {
//   readonly from: Address;
//   readonly to: Address;
//   readonly value: bigint;
// }
```

### Extract Names from ABI

```typescript
// Extract function names
type ExtractFunctionNames<TAbi extends Abi> = ...;

// Extract event names
type ExtractEventNames<TAbi extends Abi> = ...;

// Extract error names
type ExtractErrorNames<TAbi extends Abi> = ...;

// Example
const abi = [
  { type: 'function', name: 'transfer', ... },
  { type: 'function', name: 'approve', ... },
  { type: 'event', name: 'Transfer', ... }
] as const satisfies Abi;

type FunctionNames = Abi.ExtractFunctionNames<typeof abi>;
// "transfer" | "approve"

type EventNames = Abi.ExtractEventNames<typeof abi>;
// "Transfer"
```

### Get Specific Items

```typescript
// Get function by name
type GetFunction<TAbi extends Abi, TName extends string> = ...;

// Get event by name
type GetEvent<TAbi extends Abi, TName extends string> = ...;

// Get error by name
type GetError<TAbi extends Abi, TName extends string> = ...;

// Example
type TransferFunc = Abi.GetFunction<typeof abi, "transfer">;
// The specific function definition with name "transfer"
```

## Type Inference Examples

### Simple Function Types

```typescript
const balanceOf = {
  type: 'function',
  name: 'balanceOf',
  stateMutability: 'view',
  inputs: [{ type: 'address', name: 'account' }],
  outputs: [{ type: 'uint256', name: 'balance' }]
} as const satisfies Abi.Function;

type Inputs = Abi.ParametersToPrimitiveTypes<typeof balanceOf.inputs>;
// [Address]

type Outputs = Abi.ParametersToPrimitiveTypes<typeof balanceOf.outputs>;
// [bigint]
```

### Array Types

```typescript
const batchFunc = {
  type: 'function',
  name: 'batchTransfer',
  inputs: [
    { type: 'address[]', name: 'recipients' },
    { type: 'uint256[]', name: 'amounts' }
  ],
  outputs: []
} as const satisfies Abi.Function;

type Inputs = Abi.ParametersToPrimitiveTypes<typeof batchFunc.inputs>;
// [readonly Address[], readonly bigint[]]
```

### Tuple (Struct) Types

```typescript
const swapFunc = {
  type: 'function',
  name: 'swap',
  inputs: [
    {
      type: 'tuple',
      name: 'params',
      components: [
        { type: 'address', name: 'tokenIn' },
        { type: 'address', name: 'tokenOut' },
        { type: 'uint256', name: 'amountIn' }
      ]
    }
  ],
  outputs: [{ type: 'uint256', name: 'amountOut' }]
} as const satisfies Abi.Function;

type Inputs = Abi.ParametersToPrimitiveTypes<typeof swapFunc.inputs>;
// [{
//   readonly tokenIn: Address;
//   readonly tokenOut: Address;
//   readonly amountIn: bigint;
// }]
```

### Nested Structures

```typescript
const complexFunc = {
  type: 'function',
  name: 'processOrder',
  inputs: [
    {
      type: 'tuple',
      name: 'order',
      components: [
        { type: 'address', name: 'maker' },
        {
          type: 'tuple',
          name: 'asset',
          components: [
            { type: 'address', name: 'token' },
            { type: 'uint256', name: 'amount' }
          ]
        },
        { type: 'uint256[]', name: 'fees' }
      ]
    }
  ],
  outputs: []
} as const satisfies Abi.Function;

type Inputs = Abi.ParametersToPrimitiveTypes<typeof complexFunc.inputs>;
// [{
//   readonly maker: Address;
//   readonly asset: {
//     readonly token: Address;
//     readonly amount: bigint;
//   };
//   readonly fees: readonly bigint[];
// }]
```

### Event Parameter Types

```typescript
const transferEvent = {
  type: 'event',
  name: 'Transfer',
  inputs: [
    { type: 'address', name: 'from', indexed: true },
    { type: 'address', name: 'to', indexed: true },
    { type: 'uint256', name: 'value', indexed: false }
  ]
} as const satisfies Abi.Event;

type EventParams = Abi.ParametersToObject<typeof transferEvent.inputs>;
// {
//   readonly from: Address;
//   readonly to: Address;
//   readonly value: bigint;
// }
```

## Complete ABI Type Inference

### Defining a Complete ABI

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
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ type: 'address', name: 'account' }],
    outputs: [{ type: 'uint256' }]
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
```

### Type-Safe Function Access

```typescript
// Extract all function names
type FunctionNames = Abi.ExtractFunctionNames<typeof erc20Abi>;
// "transfer" | "balanceOf"

// Get specific function
type TransferFunc = Abi.GetFunction<typeof erc20Abi, "transfer">;

// Get function input types
type TransferInputs = Abi.ParametersToPrimitiveTypes<TransferFunc['inputs']>;
// [Address, bigint]

// Get function output types
type TransferOutputs = Abi.ParametersToPrimitiveTypes<TransferFunc['outputs']>;
// [boolean]
```

### Type-Safe Event Access

```typescript
// Extract all event names
type EventNames = Abi.ExtractEventNames<typeof erc20Abi>;
// "Transfer"

// Get specific event
type TransferEvent = Abi.GetEvent<typeof erc20Abi, "Transfer">;

// Get event parameter types
type TransferParams = Abi.ParametersToObject<TransferEvent['inputs']>;
// {
//   readonly from: Address;
//   readonly to: Address;
//   readonly value: bigint;
// }
```

## Branded Types

### Address Type

The `Address` type is a branded `string` type:

```typescript
type Address = string & { readonly __brand: 'Address' };

// Create addresses
const addr = Address.from('0x742d35Cc6634C0532925a3b844Bc9e7595f251e3');

// Type checking
function transfer(to: Address, amount: bigint) {
  // to is guaranteed to be an Address
}

// Cannot pass regular strings
transfer('0x123...', 100n);  // Type error

// Must create Address first
transfer(Address.from('0x123...'), 100n);  // OK
```

### Custom Branded Types

You can create your own branded types:

```typescript
type Hex = string & { readonly __brand: 'Hex' };
type Bytes32 = Uint8Array & { readonly __brand: 'Bytes32', readonly length: 32 };
```

## Type Validation

### Runtime vs Compile-Time

Type inference happens at compile time only. Runtime validation is separate:

```typescript
// Compile-time: TypeScript checks types
const inputs: [Address, bigint] = [addr, amount];

// Runtime: Validate at encoding time
try {
  const data = Abi.Function.encodeParams.call(func, inputs);
} catch (err) {
  // Runtime validation errors
}
```

### Parameter Count Validation

```typescript
const func: Abi.Function = {
  type: 'function',
  name: 'transfer',
  inputs: [
    { type: 'address', name: 'to' },
    { type: 'uint256', name: 'amount' }
  ],
  outputs: []
};

// Compile-time: TypeScript knows we need 2 parameters
type Inputs = Abi.ParametersToPrimitiveTypes<typeof func.inputs>;
// [Address, bigint]

// Runtime: Validate count matches
if (args.length !== func.inputs.length) {
  throw new Error('Argument count mismatch');
}
```

## Type Limitations

### Current Limitations

1. **int256 not supported**: Zig's `@bitCast` limitation
   - Supported: `int8` through `int248`
   - Workaround: Use `uint256` where possible

2. **Fixed-size arrays limited**: `uint256[5]`
   - Dynamic arrays work: `uint256[]`
   - Workaround: Use tuples for small fixed arrays

3. **Nested arrays limited**: `uint256[][]`
   - Single-level arrays work: `uint256[]`
   - Workaround: Use array of tuples

### Type Support Matrix

| Type Category | Supported | Notes |
|---------------|-----------|-------|
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
| Complex tuples | ⚠️ | Limited testing |

## Best Practices

1. **Always use `as const satisfies`** for full type inference:

```typescript
const abi = [
  { type: 'function', name: 'transfer', ... }
] as const satisfies Abi;
```

2. **Extract types for reuse**:

```typescript
type TransferInputs = Abi.ParametersToPrimitiveTypes<
  Abi.GetFunction<typeof abi, "transfer">['inputs']
>;

function transfer(...args: TransferInputs) {
  // Strongly typed
}
```

3. **Use branded types** for primitives:

```typescript
// Good
function transfer(to: Address, amount: bigint) { }

// Avoid
function transfer(to: string, amount: bigint) { }
```

4. **Define ABIs in separate files**:

```typescript
// erc20.abi.ts
export const erc20Abi = [
  { type: 'function', name: 'transfer', ... }
] as const satisfies Abi;

// usage.ts
import { erc20Abi } from './erc20.abi';
type FunctionNames = Abi.ExtractFunctionNames<typeof erc20Abi>;
```

5. **Document complex types**:

```typescript
/**
 * Swap parameters for Uniswap V3 style swaps
 */
type SwapParams = Abi.ParametersToPrimitiveTypes<typeof swapFunc.inputs>[0];
```

## See Also

- [ABI Overview](./abi.md)
- [ABI Functions](./abi.function.md)
- [ABI Events](./abi.event.md)
- [ABI Errors](./abi.error.md)
- [ABI Constructor](./abi.constructor.md)
- [ABI Encoding](./abi.encoding.md)
- [abitype Documentation](https://abitype.dev/)
