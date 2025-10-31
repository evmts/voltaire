# ABI Constructor

Constructor ABI items represent contract constructors used during contract deployment. They define the initialization parameters for a new contract instance.

## Type Definition

```typescript
import { Abi } from '@tevm/voltaire';

type Abi.Constructor = {
  type: 'constructor';
  inputs: readonly Abi.Parameter[];
  stateMutability: 'payable' | 'nonpayable';
};
```

Unlike functions, constructors do not have a name or outputs. They are called once during contract deployment.

## Creating Constructor Definitions

### Basic Constructor

```typescript
const constructor: Abi.Constructor = {
  type: 'constructor',
  stateMutability: 'nonpayable',
  inputs: [
    { type: 'uint256', name: 'initialSupply' }
  ]
};
```

### Constructor Without Parameters

```typescript
const constructor: Abi.Constructor = {
  type: 'constructor',
  stateMutability: 'nonpayable',
  inputs: []
};
```

### Payable Constructor

```typescript
const constructor: Abi.Constructor = {
  type: 'constructor',
  stateMutability: 'payable',
  inputs: [
    { type: 'address', name: 'owner' },
    { type: 'uint256', name: 'minDeposit' }
  ]
};
```

Payable constructors can receive Ether during deployment.

## Encoding Constructor Arguments

Constructor arguments are appended to the contract bytecode during deployment:

```typescript
const bytecode = new Uint8Array([/* contract bytecode */]);
const initialSupply = 1000000n;

const deployData = Abi.Constructor.encodeParams.call(
  constructor,
  bytecode,
  [initialSupply]
);
// Returns: bytecode + encoded constructor arguments
```

The result is the complete deployment data to be sent in a transaction.

## Decoding Constructor Arguments

Extract constructor arguments from deployment data:

```typescript
const deployData = new Uint8Array([/* bytecode + args */]);
const bytecodeLength = bytecode.length;

const args = Abi.Constructor.decodeParams.call(
  constructor,
  deployData,
  bytecodeLength
);
// Returns: [1000000n]
```

You must provide the bytecode length to know where the arguments begin.

## Type Inference

Extract TypeScript types from constructor definitions:

```typescript
type ConstructorInputs = Abi.ParametersToPrimitiveTypes<typeof constructor.inputs>;
// [bigint]

type ConstructorParams = Abi.ParametersToObject<typeof constructor.inputs>;
// { readonly initialSupply: bigint }
```

## Formatting

### Format Constructor Definition

```typescript
const formatted = Abi.formatAbiItem(constructor);
// "constructor(uint256 initialSupply)"
```

For payable constructors:

```typescript
const payableConstructor: Abi.Constructor = {
  type: 'constructor',
  stateMutability: 'payable',
  inputs: [{ type: 'address', name: 'owner' }]
};

const formatted = Abi.formatAbiItem(payableConstructor);
// "constructor(address owner) payable"
```

### Format Constructor with Arguments

```typescript
const formatted = Abi.formatAbiItemWithArgs(constructor, [1000000n]);
// "constructor(1000000)"
```

## Complex Parameter Types

### Constructor with Tuples

```typescript
const constructor: Abi.Constructor = {
  type: 'constructor',
  stateMutability: 'nonpayable',
  inputs: [
    {
      type: 'tuple',
      name: 'config',
      components: [
        { type: 'address', name: 'owner' },
        { type: 'uint256', name: 'maxSupply' },
        { type: 'uint256', name: 'mintPrice' }
      ]
    },
    { type: 'string', name: 'baseURI' }
  ]
};

type ConstructorInputs = Abi.ParametersToPrimitiveTypes<typeof constructor.inputs>;
// [{
//   readonly owner: Address;
//   readonly maxSupply: bigint;
//   readonly mintPrice: bigint;
// }, string]
```

### Constructor with Arrays

```typescript
const constructor: Abi.Constructor = {
  type: 'constructor',
  stateMutability: 'nonpayable',
  inputs: [
    { type: 'address[]', name: 'admins' },
    { type: 'uint256[]', name: 'votingWeights' }
  ]
};

type ConstructorInputs = Abi.ParametersToPrimitiveTypes<typeof constructor.inputs>;
// [readonly Address[], readonly bigint[]]
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
  const data = Abi.Constructor.encodeParams.call(constructor, bytecode, args);
} catch (err) {
  if (err instanceof AbiEncodingError) {
    console.error('Constructor encoding failed:', err.message);
  }
  if (err instanceof AbiParameterMismatchError) {
    console.error('Arguments do not match constructor inputs:', err.message);
  }
}

// Decoding errors
try {
  const args = Abi.Constructor.decodeParams.call(constructor, data, bytecodeLength);
} catch (err) {
  if (err instanceof AbiDecodingError) {
    console.error('Constructor decoding failed:', err.message);
  }
}
```

## Performance

Constructor encoding and decoding has similar performance to function parameter encoding:

- **Parameter encoding**: ~2,800,000 operations/second
- **Parameter decoding**: ~2,700,000 operations/second

Performance varies based on parameter complexity and bytecode size.

## Contract Deployment Flow

Complete deployment example:

```typescript
// 1. Define constructor
const constructor: Abi.Constructor = {
  type: 'constructor',
  stateMutability: 'nonpayable',
  inputs: [
    { type: 'string', name: 'name' },
    { type: 'string', name: 'symbol' },
    { type: 'uint256', name: 'totalSupply' }
  ]
};

// 2. Get contract bytecode
const bytecode = new Uint8Array([/* ... */]);

// 3. Encode constructor arguments
const deployData = Abi.Constructor.encodeParams.call(
  constructor,
  bytecode,
  ['MyToken', 'MTK', 1000000n]
);

// 4. Send deployment transaction
const tx = {
  data: deployData,
  value: 0n  // or > 0n for payable constructors
};

// 5. After deployment, decode args from deployed contract
const args = Abi.Constructor.decodeParams.call(
  constructor,
  deployData,
  bytecode.length
);
```

## State Mutability

Constructors have two state mutability options:

| Mutability | Can Receive Ether | Description |
|------------|-------------------|-------------|
| `nonpayable` | No | Standard constructor |
| `payable` | Yes | Can receive Ether during deployment |

Unlike functions, constructors cannot be `pure` or `view`.

## Best Practices

1. **Use `as const satisfies Abi.Constructor`** for full type inference:

```typescript
const constructor = {
  type: 'constructor',
  stateMutability: 'nonpayable',
  inputs: [{ type: 'uint256', name: 'initialSupply' }]
} as const satisfies Abi.Constructor;
```

2. **Validate parameter counts** before encoding:

```typescript
if (args.length !== constructor.inputs.length) {
  throw new Error('Argument count mismatch');
}
```

3. **Know your bytecode length** for decoding:

```typescript
// Store bytecode length for later decoding
const bytecodeLength = bytecode.length;
const args = Abi.Constructor.decodeParams.call(
  constructor,
  deployData,
  bytecodeLength
);
```

4. **Handle payable constructors** appropriately:

```typescript
const tx = {
  data: deployData,
  value: constructor.stateMutability === 'payable' ? depositAmount : 0n
};
```

5. **Include initialization parameters** in constructor:

```typescript
// Good: Immutable state in constructor
const constructor: Abi.Constructor = {
  type: 'constructor',
  stateMutability: 'nonpayable',
  inputs: [
    { type: 'address', name: 'owner' },
    { type: 'uint256', name: 'maxSupply' }
  ]
};

// Avoid: Empty constructor with separate initialization
const constructor: Abi.Constructor = {
  type: 'constructor',
  stateMutability: 'nonpayable',
  inputs: []
};
```

## Common Patterns

### ERC-20 Token Constructor

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
```

### ERC-721 NFT Constructor

```typescript
const constructor: Abi.Constructor = {
  type: 'constructor',
  stateMutability: 'nonpayable',
  inputs: [
    { type: 'string', name: 'name' },
    { type: 'string', name: 'symbol' },
    { type: 'string', name: 'baseTokenURI' }
  ]
};
```

### Ownable Contract Constructor

```typescript
const constructor: Abi.Constructor = {
  type: 'constructor',
  stateMutability: 'nonpayable',
  inputs: [
    { type: 'address', name: 'initialOwner' }
  ]
};
```

### Upgradeable Proxy Constructor

```typescript
const constructor: Abi.Constructor = {
  type: 'constructor',
  stateMutability: 'nonpayable',
  inputs: [
    { type: 'address', name: 'implementation' },
    { type: 'bytes', name: 'initData' }
  ]
};
```

### Factory with Configuration

```typescript
const constructor: Abi.Constructor = {
  type: 'constructor',
  stateMutability: 'payable',
  inputs: [
    {
      type: 'tuple',
      name: 'config',
      components: [
        { type: 'address', name: 'owner' },
        { type: 'address', name: 'treasury' },
        { type: 'uint256', name: 'fee' },
        { type: 'bool', name: 'paused' }
      ]
    }
  ]
};
```

## No Signature or Selector

Unlike functions and errors, constructors do not have signatures or selectors:

```typescript
// Functions have selectors
const funcSelector = Abi.Function.getSelector.call(func);

// Constructors do not
// Abi.Constructor.getSelector.call(constructor);  // Does not exist
```

Constructor arguments are simply appended to the bytecode without a selector prefix.

## Verifying Deployment

To verify a contract deployment:

```typescript
// 1. Get deployment transaction data
const deployTx = await provider.getTransaction(txHash);
const deployData = deployTx.data;

// 2. Extract bytecode and constructor args
const bytecodeLength = bytecode.length;
const constructorData = deployData.slice(bytecodeLength);

// 3. Decode constructor args
const args = Abi.Constructor.decodeParams.call(
  constructor,
  new Uint8Array([...bytecode, ...constructorData]),
  bytecodeLength
);

// 4. Verify args match expected values
console.log('Deployed with args:', args);
```

## Deployment Data Structure

The complete deployment data structure:

```
[--- Contract Bytecode ---][--- Constructor Arguments ---]
|                         |                              |
|    Fixed length         |    Variable length          |
|    (known)              |    (ABI encoded)            |
```

The bytecode is fixed and known ahead of time. Constructor arguments are ABI-encoded and appended at the end.

## See Also

- [ABI Overview](./abi.md)
- [ABI Functions](./abi.function.md)
- [ABI Events](./abi.event.md)
- [ABI Errors](./abi.error.md)
- [ABI Types](./abi.types.md)
- [ABI Encoding](./abi.encoding.md)
