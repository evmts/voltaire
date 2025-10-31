# ABI Encoding

ABI encoding converts Ethereum types to their binary representation according to the [Ethereum ABI specification](https://docs.soliditylang.org/en/latest/abi-spec.html). All encoding is performed in pure TypeScript with optional WASM acceleration planned.

## Encoding Fundamentals

### Encoding Rules

The ABI uses a standardized encoding scheme:

- **Head**: Fixed 32-byte slots containing either the value itself (for static types) or a pointer to the data location (for dynamic types)
- **Tail**: Variable-length data for dynamic types

### Static vs Dynamic Types

| Type | Category | Head Size | Tail Size |
|------|----------|-----------|-----------|
| uint, int | Static | 32 bytes | None |
| address | Static | 32 bytes | None |
| bool | Static | 32 bytes | None |
| bytesN | Static | 32 bytes | None |
| bytes | Dynamic | 32 bytes (pointer) | Variable |
| string | Dynamic | 32 bytes (pointer) | Variable |
| T[] | Dynamic | 32 bytes (pointer) | Variable |
| tuple | Depends on components | Varies | Varies |

## Generic Parameter Encoding

### Encode Parameters

Encode an array of parameters according to their types:

```typescript
const params: readonly Abi.Parameter[] = [
  { type: 'address', name: 'to' },
  { type: 'uint256', name: 'amount' }
];

const encoded = Abi.encodeParameters(params, [
  Address.from('0x742d35Cc6634C0532925a3b844Bc9e7595f251e3'),
  1000000000000000000n
]);
// Returns: Uint8Array with ABI-encoded data
```

### Decode Parameters

Decode binary data back to parameter values:

```typescript
const values = Abi.decodeParameters(params, encoded);
// Returns: [Address, bigint]
```

## Function Encoding

### Encode Function Call

Encode a complete function call (selector + parameters):

```typescript
const transfer: Abi.Function = {
  type: 'function',
  name: 'transfer',
  stateMutability: 'nonpayable',
  inputs: [
    { type: 'address', name: 'to' },
    { type: 'uint256', name: 'amount' }
  ],
  outputs: [{ type: 'bool' }]
};

const calldata = Abi.Function.encodeParams.call(transfer, [
  Address.from('0x742d35Cc6634C0532925a3b844Bc9e7595f251e3'),
  1000000000000000000n
]);
// Returns: [selector: 4 bytes][encoded params: variable]
```

### Decode Function Call

Decode function calldata back to parameters:

```typescript
const args = Abi.Function.decodeParams.call(transfer, calldata);
// Returns: [Address, bigint]
```

The function validates that the selector matches before decoding.

### Encode Function Result

Encode function return values:

```typescript
const balanceOf: Abi.Function = {
  type: 'function',
  name: 'balanceOf',
  stateMutability: 'view',
  inputs: [{ type: 'address' }],
  outputs: [{ type: 'uint256', name: 'balance' }]
};

const resultData = Abi.Function.encodeResult.call(balanceOf, [1000000n]);
// Returns: Uint8Array with encoded return value
```

### Decode Function Result

Decode function return data:

```typescript
const [balance] = Abi.Function.decodeResult.call(balanceOf, returnData);
// Returns: [bigint]
```

## Event Encoding

### Encode Event Topics

Encode indexed event parameters as topics:

```typescript
const Transfer: Abi.Event = {
  type: 'event',
  name: 'Transfer',
  inputs: [
    { type: 'address', name: 'from', indexed: true },
    { type: 'address', name: 'to', indexed: true },
    { type: 'uint256', name: 'value', indexed: false }
  ]
};

const topics = Abi.Event.encodeTopics.call(Transfer, {
  from: Address.from('0x0000000000000000000000000000000000000000'),
  to: Address.from('0x742d35Cc6634C0532925a3b844Bc9e7595f251e3')
});
// Returns: [topic0 (selector), topic1 (from), topic2 (to)]
```

You can provide partial indexed parameters for filtering:

```typescript
// Only filter by 'to' address
const topics = Abi.Event.encodeTopics.call(Transfer, {
  to: Address.from('0x742d35Cc6634C0532925a3b844Bc9e7595f251e3')
});
// Returns: [topic0, null, topic2]
```

### Decode Event Log

Decode a complete event log (topics + data):

```typescript
const log = {
  topics: [
    '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
    '0x0000000000000000000000000000000000000000000000000000000000000000',
    '0x000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f251e3'
  ],
  data: '0x0000000000000000000000000000000000000000000000000de0b6b3a7640000'
};

const decoded = Abi.Event.decodeLog.call(Transfer, log.data, log.topics);
// Returns: {
//   from: Address('0x0000000000000000000000000000000000000000'),
//   to: Address('0x742d35Cc6634C0532925a3b844Bc9e7595f251e3'),
//   value: 1000000000000000000n
// }
```

## Error Encoding

### Encode Error

Encode custom error data (selector + parameters):

```typescript
const InsufficientBalance: Abi.Error = {
  type: 'error',
  name: 'InsufficientBalance',
  inputs: [
    { type: 'uint256', name: 'available' },
    { type: 'uint256', name: 'required' }
  ]
};

const errorData = Abi.Error.encodeParams.call(InsufficientBalance, [
  1000000n,
  2000000n
]);
// Returns: [selector: 4 bytes][encoded params: variable]
```

### Decode Error

Decode error revert data:

```typescript
const [available, required] = Abi.Error.decodeParams.call(
  InsufficientBalance,
  errorData
);
// Returns: [1000000n, 2000000n]
```

## Constructor Encoding

### Encode Constructor Arguments

Append constructor arguments to contract bytecode:

```typescript
const constructor: Abi.Constructor = {
  type: 'constructor',
  stateMutability: 'nonpayable',
  inputs: [
    { type: 'string', name: 'name' },
    { type: 'string', name: 'symbol' },
    { type: 'uint256', name: 'totalSupply' }
  ]
};

const bytecode = new Uint8Array([/* contract bytecode */]);

const deployData = Abi.Constructor.encodeParams.call(
  constructor,
  bytecode,
  ['MyToken', 'MTK', 1000000n]
);
// Returns: [bytecode][encoded constructor args]
```

### Decode Constructor Arguments

Extract constructor arguments from deployment data:

```typescript
const args = Abi.Constructor.decodeParams.call(
  constructor,
  deployData,
  bytecode.length
);
// Returns: ['MyToken', 'MTK', 1000000n]
```

## Type-Specific Encoding

### Integer Types (uint, int)

Integers are encoded as big-endian 32-byte values:

```typescript
// uint256
const encoded = Abi.encodeParameters(
  [{ type: 'uint256' }],
  [1000000n]
);
// 0x00000000000000000000000000000000000000000000000000000000000f4240

// uint8 (still padded to 32 bytes)
const encoded = Abi.encodeParameters(
  [{ type: 'uint8' }],
  [255n]
);
// 0x00000000000000000000000000000000000000000000000000000000000000ff
```

### Address

Addresses are encoded as 32-byte values with left padding:

```typescript
const encoded = Abi.encodeParameters(
  [{ type: 'address' }],
  [Address.from('0x742d35Cc6634C0532925a3b844Bc9e7595f251e3')]
);
// 0x000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f251e3
```

### Boolean

Booleans are encoded as 32-byte values (0 or 1):

```typescript
const encoded = Abi.encodeParameters(
  [{ type: 'bool' }],
  [true]
);
// 0x0000000000000000000000000000000000000000000000000000000000000001
```

### Fixed Bytes (bytesN)

Fixed-size bytes are right-padded to 32 bytes:

```typescript
const encoded = Abi.encodeParameters(
  [{ type: 'bytes4' }],
  [new Uint8Array([0xa9, 0x05, 0x9c, 0xbb])]
);
// 0xa9059cbb00000000000000000000000000000000000000000000000000000000
```

### Dynamic Bytes

Dynamic bytes include length prefix:

```typescript
const encoded = Abi.encodeParameters(
  [{ type: 'bytes' }],
  [new Uint8Array([0x01, 0x02, 0x03])]
);
// [offset: 32 bytes]
// [length: 32 bytes] = 3
// [data: padded to 32 bytes] = 0x010203...
```

### String

Strings are encoded like dynamic bytes (UTF-8):

```typescript
const encoded = Abi.encodeParameters(
  [{ type: 'string' }],
  ['Hello']
);
// [offset: 32 bytes]
// [length: 32 bytes] = 5
// [data: padded to 32 bytes] = 0x48656c6c6f...
```

### Dynamic Arrays

Dynamic arrays include length prefix followed by elements:

```typescript
const encoded = Abi.encodeParameters(
  [{ type: 'uint256[]' }],
  [[1n, 2n, 3n]]
);
// [offset: 32 bytes]
// [length: 32 bytes] = 3
// [element 0: 32 bytes] = 1
// [element 1: 32 bytes] = 2
// [element 2: 32 bytes] = 3
```

### Tuples (Structs)

Tuples encode their components sequentially:

```typescript
const encoded = Abi.encodeParameters(
  [
    {
      type: 'tuple',
      components: [
        { type: 'address', name: 'token' },
        { type: 'uint256', name: 'amount' }
      ]
    }
  ],
  [
    {
      token: Address.from('0x742d35Cc6634C0532925a3b844Bc9e7595f251e3'),
      amount: 1000n
    }
  ]
);
// [address: 32 bytes]
// [amount: 32 bytes]
```

## Complex Encoding Examples

### Multiple Parameters

Mix of static and dynamic types:

```typescript
const params = [
  { type: 'address', name: 'to' },
  { type: 'uint256', name: 'amount' },
  { type: 'bytes', name: 'data' }
];

const encoded = Abi.encodeParameters(params, [
  Address.from('0x742d35Cc6634C0532925a3b844Bc9e7595f251e3'),
  1000n,
  new Uint8Array([0x01, 0x02])
]);
// [address: 32 bytes]
// [amount: 32 bytes]
// [offset to data: 32 bytes]
// [data length: 32 bytes]
// [data: padded to 32 bytes]
```

### Nested Tuples

```typescript
const params = [
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
      }
    ]
  }
];

const encoded = Abi.encodeParameters(params, [
  {
    maker: Address.from('0x742d35Cc6634C0532925a3b844Bc9e7595f251e3'),
    asset: {
      token: Address.from('0x0000000000000000000000000000000000000000'),
      amount: 1000n
    }
  }
]);
// [maker: 32 bytes]
// [asset.token: 32 bytes]
// [asset.amount: 32 bytes]
```

### Array of Tuples

```typescript
const params = [
  {
    type: 'tuple[]',
    components: [
      { type: 'address', name: 'token' },
      { type: 'uint256', name: 'amount' }
    ]
  }
];

const encoded = Abi.encodeParameters(params, [
  [
    { token: Address.from('0x1111...'), amount: 100n },
    { token: Address.from('0x2222...'), amount: 200n }
  ]
]);
// [offset: 32 bytes]
// [length: 32 bytes] = 2
// [tuple 0 token: 32 bytes]
// [tuple 0 amount: 32 bytes]
// [tuple 1 token: 32 bytes]
// [tuple 1 amount: 32 bytes]
```

## Error Handling

```typescript
import {
  AbiEncodingError,
  AbiDecodingError,
  AbiParameterMismatchError
} from '@tevm/voltaire';

// Encoding errors
try {
  const encoded = Abi.encodeParameters(params, values);
} catch (err) {
  if (err instanceof AbiEncodingError) {
    console.error('Encoding failed:', err.message);
  }
  if (err instanceof AbiParameterMismatchError) {
    console.error('Value count does not match parameter count');
  }
}

// Decoding errors
try {
  const decoded = Abi.decodeParameters(params, data);
} catch (err) {
  if (err instanceof AbiDecodingError) {
    console.error('Decoding failed:', err.message);
    console.error('Invalid data or corrupted encoding');
  }
}
```

## Performance

Based on benchmark results:

| Operation | Performance | Notes |
|-----------|-------------|-------|
| encodeParameters (simple) | 2,800,000 ops/sec | Single uint/address |
| decodeParameters (simple) | 2,700,000 ops/sec | Single uint/address |
| encodeTopics | 2,600,000 ops/sec | Event topics |
| encodeError | 2,700,000 ops/sec | Error data |

Performance varies based on:
- Type complexity (static vs dynamic)
- Data size (small vs large arrays/strings)
- Nesting depth (tuples within tuples)

## WASM Acceleration

WASM-accelerated encoding is planned but not yet implemented:

### API (Planned)

```typescript
import {
  encodeParametersWasm,
  decodeParametersWasm,
  encodeFunctionDataWasm,
  decodeFunctionDataWasm
} from '@tevm/voltaire';

// API is defined but not yet functional
// Will throw error: "WASM ABI encoding not yet implemented"
```

### Status Check

```typescript
import { isWasmAbiAvailable, getWasmImplementationStatus } from '@tevm/voltaire';

console.log(isWasmAbiAvailable());
// false (C layer not implemented)

console.log(getWasmImplementationStatus());
// {
//   available: false,
//   reason: "C ABI encoding/decoding layer not yet implemented",
//   fallback: "Pure TypeScript implementations available"
// }
```

### Expected Performance (When Available)

Once implemented, WASM is expected to provide:

- Simple encoding: 2-5x faster
- Complex nested types: 3-10x faster
- Batch operations: 5-15x faster

## Packed Encoding

Packed encoding (`abi.encodePacked` in Solidity) is not yet implemented. This encoding scheme removes padding for gas savings:

```typescript
// Not yet available
// const packed = Abi.encodePacked(params, values);
```

Packed encoding differences:
- No padding to 32 bytes
- No length prefix for dynamic types
- More gas efficient
- Cannot be reliably decoded

## Best Practices

1. **Validate parameter counts**:

```typescript
if (values.length !== params.length) {
  throw new Error('Parameter count mismatch');
}
```

2. **Handle encoding errors**:

```typescript
try {
  const encoded = Abi.encodeParameters(params, values);
} catch (err) {
  // Log error with context
  console.error('Failed to encode:', { params, values, err });
  throw err;
}
```

3. **Verify decoded data**:

```typescript
const decoded = Abi.decodeParameters(params, data);
// Validate decoded values make sense
if (decoded[0] === Address.zero()) {
  console.warn('Decoded zero address');
}
```

4. **Use specific encoding functions** when possible:

```typescript
// Preferred (includes selector)
const calldata = Abi.Function.encodeParams.call(func, args);

// Generic (no selector)
const encoded = Abi.encodeParameters(func.inputs, args);
```

5. **Cache selectors** for repeated operations:

```typescript
// Cache selector
const selector = Abi.Function.getSelector.call(func);

// Reuse in encoding
const calldata = new Uint8Array([
  ...selector,
  ...Abi.encodeParameters(func.inputs, args)
]);
```

## Current Limitations

### Type Support

- ✅ All uint variants (uint8 - uint256)
- ⚠️ Most int variants (int8 - int248, not int256)
- ✅ address, bool, string, bytes, bytesN
- ✅ Dynamic arrays (T[])
- ❌ Fixed arrays (T[N])
- ❌ Nested arrays (T[][])
- ⚠️ Tuples (basic support, limited testing)

### Missing Features

- ❌ Packed encoding (`abi.encodePacked`)
- ❌ WASM acceleration
- ❌ Calldata decoding with selector inference
- ❌ Batch log parsing

## See Also

- [ABI Overview](./abi.md)
- [ABI Functions](./abi.function.md)
- [ABI Events](./abi.event.md)
- [ABI Errors](./abi.error.md)
- [ABI Constructor](./abi.constructor.md)
- [ABI Types](./abi.types.md)
- [Ethereum ABI Specification](https://docs.soliditylang.org/en/latest/abi-spec.html)
