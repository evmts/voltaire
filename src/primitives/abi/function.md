# ABI Function

Function ABI items represent callable contract functions. They define the function's name, inputs, outputs, and state mutability.

## Type Definition

```typescript
import { Abi } from '@tevm/voltaire';

type Abi.Function = {
  type: 'function';
  name: string;
  inputs: readonly Abi.Parameter[];
  outputs: readonly Abi.Parameter[];
  stateMutability: 'pure' | 'view' | 'nonpayable' | 'payable';
};
```

## Creating Function Definitions

### Basic Function

```typescript
const transfer: Abi.Function = {
  type: 'function',
  name: 'transfer',
  stateMutability: 'nonpayable',
  inputs: [
    { type: 'address', name: 'to' },
    { type: 'uint256', name: 'amount' }
  ],
  outputs: [{ type: 'bool', name: '' }]
};
```

### View Function

```typescript
const balanceOf: Abi.Function = {
  type: 'function',
  name: 'balanceOf',
  stateMutability: 'view',
  inputs: [{ type: 'address', name: 'account' }],
  outputs: [{ type: 'uint256', name: '' }]
};
```

### Pure Function

```typescript
const add: Abi.Function = {
  type: 'function',
  name: 'add',
  stateMutability: 'pure',
  inputs: [
    { type: 'uint256', name: 'a' },
    { type: 'uint256', name: 'b' }
  ],
  outputs: [{ type: 'uint256', name: '' }]
};
```

### Payable Function

```typescript
const deposit: Abi.Function = {
  type: 'function',
  name: 'deposit',
  stateMutability: 'payable',
  inputs: [],
  outputs: []
};
```

## Signature Generation

Generate the canonical signature string for a function:

```typescript
const sig = Abi.Function.getSignature.call(transfer);
// Returns: "transfer(address,uint256)"
```

The signature includes the function name followed by comma-separated parameter types in parentheses.

## Selector Computation

The function selector is the first 4 bytes of the keccak256 hash of the function signature:

```typescript
const selector = Abi.Function.getSelector.call(transfer);
// Returns: Uint8Array([0xa9, 0x05, 0x9c, 0xbb])
```

You can also compute selectors directly from signature strings:

```typescript
const selector = Abi.getFunctionSelector('transfer(address,uint256)');
// Returns: Uint8Array([0xa9, 0x05, 0x9c, 0xbb])
```

## Encoding Function Calls

Encode function call data (selector + parameters):

```typescript
const to = Address.from('0x742d35Cc6634C0532925a3b844Bc9e7595f251e3');
const amount = 1000000000000000000n;

const calldata = Abi.Function.encodeParams.call(transfer, [to, amount]);
// Returns: Uint8Array with selector followed by encoded parameters
```

The encoded data is ready to be sent as transaction calldata.

## Decoding Function Calls

Decode function call data back to parameters:

```typescript
const args = Abi.Function.decodeParams.call(transfer, calldata);
// Returns: [Address, bigint]
```

The function automatically validates that the selector matches before decoding.

## Encoding Function Results

Encode function return values:

```typescript
const resultData = Abi.Function.encodeResult.call(balanceOf, [1000000n]);
// Returns: Uint8Array with encoded return value
```

## Decoding Function Results

Decode function return data:

```typescript
const returnData = new Uint8Array([/* ... */]);
const [balance] = Abi.Function.decodeResult.call(balanceOf, returnData);
// Returns: [bigint]
```

## Type Inference

Extract TypeScript types from function definitions:

```typescript
type TransferInputs = Abi.ParametersToPrimitiveTypes<typeof transfer.inputs>;
// [Address, bigint]

type TransferOutputs = Abi.ParametersToPrimitiveTypes<typeof transfer.outputs>;
// [boolean]
```

## Formatting

### Format Function Definition

```typescript
const formatted = Abi.formatAbiItem(transfer);
// "function transfer(address to, uint256 amount) returns (bool)"
```

The format includes state mutability when it is not `nonpayable`:

```typescript
const formatted = Abi.formatAbiItem(balanceOf);
// "function balanceOf(address account) returns (uint256) view"
```

### Format Function Call with Arguments

```typescript
const formatted = Abi.formatAbiItemWithArgs(transfer, [
  '0x742d35Cc6634C0532925a3b844Bc9e7595f251e3',
  1000000000000000000n
]);
// "transfer(0x742d35Cc6634C0532925a3b844Bc9e7595f251e3, 1000000000000000000)"
```

## Complex Parameter Types

### Arrays

```typescript
const batchTransfer: Abi.Function = {
  type: 'function',
  name: 'batchTransfer',
  stateMutability: 'nonpayable',
  inputs: [
    { type: 'address[]', name: 'recipients' },
    { type: 'uint256[]', name: 'amounts' }
  ],
  outputs: []
};

type Inputs = Abi.ParametersToPrimitiveTypes<typeof batchTransfer.inputs>;
// [readonly Address[], readonly bigint[]]
```

### Tuples (Structs)

```typescript
const swap: Abi.Function = {
  type: 'function',
  name: 'swap',
  stateMutability: 'nonpayable',
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
};

type SwapInputs = Abi.ParametersToPrimitiveTypes<typeof swap.inputs>;
// [{
//   readonly tokenIn: Address;
//   readonly tokenOut: Address;
//   readonly amountIn: bigint;
// }]
```

### Nested Structures

```typescript
const processOrder: Abi.Function = {
  type: 'function',
  name: 'processOrder',
  stateMutability: 'nonpayable',
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
};

type OrderInputs = Abi.ParametersToPrimitiveTypes<typeof processOrder.inputs>;
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
import {
  AbiEncodingError,
  AbiDecodingError,
  AbiParameterMismatchError,
  AbiInvalidSelectorError
} from '@tevm/voltaire';

// Encoding errors
try {
  const data = Abi.Function.encodeParams.call(func, args);
} catch (err) {
  if (err instanceof AbiEncodingError) {
    console.error('Encoding failed:', err.message);
  }
  if (err instanceof AbiParameterMismatchError) {
    console.error('Arguments do not match function inputs:', err.message);
  }
}

// Decoding errors
try {
  const args = Abi.Function.decodeParams.call(func, data);
} catch (err) {
  if (err instanceof AbiDecodingError) {
    console.error('Decoding failed:', err.message);
  }
  if (err instanceof AbiInvalidSelectorError) {
    console.error('Selector mismatch:', err.message);
  }
}
```

## Performance

Based on benchmark results:

- **Signature generation**: ~20,000,000 operations/second
- **Selector computation**: ~320,000 operations/second (dominated by keccak256)
- **Parameter encoding**: ~2,800,000 operations/second
- **Parameter decoding**: ~2,700,000 operations/second
- **Formatting**: 7,000,000 - 20,000,000 operations/second

## State Mutability

Function state mutability determines what operations the function can perform:

| Mutability | Can Read State | Can Modify State | Can Receive Ether |
|------------|---------------|------------------|-------------------|
| `pure` | No | No | No |
| `view` | Yes | No | No |
| `nonpayable` | Yes | Yes | No |
| `payable` | Yes | Yes | Yes |

## Best Practices

1. **Use `as const satisfies Abi.Function`** for full type inference:

```typescript
const transfer = {
  type: 'function',
  name: 'transfer',
  inputs: [{ type: 'address', name: 'to' }],
  outputs: []
} as const satisfies Abi.Function;
```

2. **Validate parameter counts** before encoding:

```typescript
if (args.length !== func.inputs.length) {
  throw new Error('Argument count mismatch');
}
```

3. **Use utility functions** for simple operations:

```typescript
// Preferred
const selector = Abi.getFunctionSelector('transfer(address,uint256)');

// Alternative
const selector = Abi.Function.getSelector.call(func);
```

4. **Handle errors specifically**:

```typescript
try {
  const data = Abi.Function.encodeParams.call(func, args);
} catch (err) {
  if (err instanceof AbiParameterMismatchError) {
    // Handle argument mismatch
  } else if (err instanceof AbiEncodingError) {
    // Handle general encoding error
  }
  throw err;
}
```

## See Also

- [ABI Overview](./abi.md)
- [ABI Events](./abi.event.md)
- [ABI Errors](./abi.error.md)
- [ABI Types](./abi.types.md)
- [ABI Encoding](./abi.encoding.md)
