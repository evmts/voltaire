# ABI Error

Error ABI items represent custom errors that contracts can throw. Introduced in Solidity 0.8.4, custom errors provide a gas-efficient alternative to revert strings.

## Type Definition

```typescript
import { Abi } from '@tevm/voltaire';

type Abi.Error = {
  type: 'error';
  name: string;
  inputs: readonly Abi.Parameter[];
};
```

## Creating Error Definitions

### Basic Error

```typescript
const InsufficientBalance: Abi.Error = {
  type: 'error',
  name: 'InsufficientBalance',
  inputs: [
    { type: 'uint256', name: 'available' },
    { type: 'uint256', name: 'required' }
  ]
};
```

### Error Without Parameters

```typescript
const Unauthorized: Abi.Error = {
  type: 'error',
  name: 'Unauthorized',
  inputs: []
};
```

### Complex Error with Multiple Parameters

```typescript
const TransferFailed: Abi.Error = {
  type: 'error',
  name: 'TransferFailed',
  inputs: [
    { type: 'address', name: 'from' },
    { type: 'address', name: 'to' },
    { type: 'uint256', name: 'amount' },
    { type: 'string', name: 'reason' }
  ]
};
```

## Signature Generation

Generate the canonical signature string for an error:

```typescript
const sig = Abi.Error.getSignature.call(InsufficientBalance);
// Returns: "InsufficientBalance(uint256,uint256)"
```

The signature follows the same format as functions: error name followed by comma-separated parameter types.

## Selector Computation

The error selector is the first 4 bytes of the keccak256 hash of the error signature:

```typescript
const selector = Abi.Error.getSelector.call(InsufficientBalance);
// Returns: Uint8Array (4 bytes)
```

You can also compute selectors directly from signature strings:

```typescript
const selector = Abi.getErrorSelector('InsufficientBalance(uint256,uint256)');
// Returns: Uint8Array (4 bytes)
```

## Encoding Errors

Encode error data (selector + parameters):

```typescript
const errorData = Abi.Error.encodeParams.call(InsufficientBalance, [
  1000000n,  // available
  2000000n   // required
]);
// Returns: Uint8Array with selector followed by encoded parameters
```

The encoded data is what appears in the revert data when the error is thrown.

## Decoding Errors

Decode error data back to parameters:

```typescript
const params = Abi.Error.decodeParams.call(InsufficientBalance, errorData);
// Returns: [1000000n, 2000000n]
```

The function automatically validates that the selector matches before decoding.

## Type Inference

Extract TypeScript types from error definitions:

```typescript
type ErrorParams = Abi.ParametersToPrimitiveTypes<typeof InsufficientBalance.inputs>;
// [bigint, bigint]

type ErrorObject = Abi.ParametersToObject<typeof TransferFailed.inputs>;
// {
//   readonly from: Address;
//   readonly to: Address;
//   readonly amount: bigint;
//   readonly reason: string;
// }
```

## Formatting

### Format Error Definition

```typescript
const formatted = Abi.formatAbiItem(InsufficientBalance);
// "error InsufficientBalance(uint256 available, uint256 required)"
```

### Format Error with Arguments

```typescript
const formatted = Abi.formatAbiItemWithArgs(InsufficientBalance, [
  1000000n,
  2000000n
]);
// "InsufficientBalance(1000000, 2000000)"
```

## Complex Parameter Types

### Errors with Tuples

```typescript
const InvalidOrder: Abi.Error = {
  type: 'error',
  name: 'InvalidOrder',
  inputs: [
    {
      type: 'tuple',
      name: 'order',
      components: [
        { type: 'address', name: 'maker' },
        { type: 'uint256', name: 'amount' },
        { type: 'uint256', name: 'deadline' }
      ]
    },
    { type: 'string', name: 'reason' }
  ]
};

type InvalidOrderParams = Abi.ParametersToPrimitiveTypes<typeof InvalidOrder.inputs>;
// [{
//   readonly maker: Address;
//   readonly amount: bigint;
//   readonly deadline: bigint;
// }, string]
```

### Errors with Arrays

```typescript
const BatchProcessingFailed: Abi.Error = {
  type: 'error',
  name: 'BatchProcessingFailed',
  inputs: [
    { type: 'uint256[]', name: 'failedIndices' },
    { type: 'string[]', name: 'reasons' }
  ]
};

type BatchErrorParams = Abi.ParametersToPrimitiveTypes<typeof BatchProcessingFailed.inputs>;
// [readonly bigint[], readonly string[]]
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
  const data = Abi.Error.encodeParams.call(error, params);
} catch (err) {
  if (err instanceof AbiEncodingError) {
    console.error('Error encoding failed:', err.message);
  }
  if (err instanceof AbiParameterMismatchError) {
    console.error('Parameters do not match error inputs:', err.message);
  }
}

// Decoding errors
try {
  const params = Abi.Error.decodeParams.call(error, data);
} catch (err) {
  if (err instanceof AbiDecodingError) {
    console.error('Error decoding failed:', err.message);
  }
  if (err instanceof AbiInvalidSelectorError) {
    console.error('Selector mismatch:', err.message);
  }
}
```

## Performance

Based on benchmark results:

- **Signature generation**: ~20,000,000 operations/second
- **Selector computation**: ~325,000 operations/second (dominated by keccak256)
- **Parameter encoding**: ~2,700,000 operations/second
- **Parameter decoding**: ~2,700,000 operations/second

## Standard Errors

### Panic Errors

Solidity has built-in panic errors with specific codes:

```typescript
// Panic(uint256)
const Panic: Abi.Error = {
  type: 'error',
  name: 'Panic',
  inputs: [{ type: 'uint256', name: 'code' }]
};

// Panic codes:
// 0x00: Generic compiler inserted panic
// 0x01: Assert failed
// 0x11: Arithmetic overflow/underflow
// 0x12: Division by zero
// 0x21: Enum conversion error
// 0x22: Invalid storage byte array access
// 0x31: Pop on empty array
// 0x32: Array out of bounds access
// 0x41: Memory allocation overflow
// 0x51: Invalid internal function call
```

### Error String

The legacy error format using a string message:

```typescript
// Error(string)
const Error: Abi.Error = {
  type: 'error',
  name: 'Error',
  inputs: [{ type: 'string', name: 'message' }]
};
```

This is equivalent to `revert("message")` or `require(false, "message")` in Solidity.

## Detecting Error Types

When decoding revert data, you can identify which error was thrown by checking the selector:

```typescript
const revertData = new Uint8Array([/* ... */]);
const selector = revertData.slice(0, 4);

// Check if it matches InsufficientBalance
const expectedSelector = Abi.Error.getSelector.call(InsufficientBalance);
if (selector.every((byte, i) => byte === expectedSelector[i])) {
  const params = Abi.Error.decodeParams.call(InsufficientBalance, revertData);
  console.log('InsufficientBalance:', params);
}
```

## Custom Error vs Revert String

Custom errors offer several advantages over revert strings:

| Feature | Custom Error | Revert String |
|---------|-------------|---------------|
| Gas Cost | Lower | Higher |
| Type Safety | Strong | None |
| Structured Data | Yes | No |
| Deployment Size | Smaller | Larger |

Example gas comparison:

```solidity
// Custom error: ~140 gas
error InsufficientBalance(uint256 available, uint256 required);
revert InsufficientBalance(available, required);

// Revert string: ~200+ gas
revert("Insufficient balance");
```

## Best Practices

1. **Use descriptive error names**:

```typescript
// Good
const InsufficientBalance: Abi.Error = {
  type: 'error',
  name: 'InsufficientBalance',
  inputs: [{ type: 'uint256', name: 'available' }]
};

// Avoid
const Error1: Abi.Error = {
  type: 'error',
  name: 'Error1',
  inputs: [{ type: 'uint256', name: 'value' }]
};
```

2. **Include relevant context in parameters**:

```typescript
const TransferFailed: Abi.Error = {
  type: 'error',
  name: 'TransferFailed',
  inputs: [
    { type: 'address', name: 'from' },
    { type: 'address', name: 'to' },
    { type: 'uint256', name: 'amount' }
  ]
};
```

3. **Use `as const satisfies Abi.Error`** for full type inference:

```typescript
const error = {
  type: 'error',
  name: 'InsufficientBalance',
  inputs: [{ type: 'uint256', name: 'available' }]
} as const satisfies Abi.Error;
```

4. **Prefer custom errors over revert strings**:

```typescript
// Preferred (gas efficient, type safe)
const error = Abi.Error.encodeParams.call(InsufficientBalance, [available, required]);

// Avoid (more gas, no type safety)
const Error = { type: 'error', name: 'Error', inputs: [{ type: 'string' }] } as const;
const error = Abi.Error.encodeParams.call(Error, ['Insufficient balance']);
```

5. **Handle standard errors**:

```typescript
// Always handle Panic and Error
const standardErrors = [
  { type: 'error', name: 'Panic', inputs: [{ type: 'uint256' }] },
  { type: 'error', name: 'Error', inputs: [{ type: 'string' }] }
] as const;
```

## Common Patterns

### Access Control Errors

```typescript
const Unauthorized: Abi.Error = {
  type: 'error',
  name: 'Unauthorized',
  inputs: []
};

const OnlyOwner: Abi.Error = {
  type: 'error',
  name: 'OnlyOwner',
  inputs: [
    { type: 'address', name: 'caller' },
    { type: 'address', name: 'owner' }
  ]
};
```

### Token Errors

```typescript
const InsufficientBalance: Abi.Error = {
  type: 'error',
  name: 'InsufficientBalance',
  inputs: [
    { type: 'uint256', name: 'available' },
    { type: 'uint256', name: 'required' }
  ]
};

const InsufficientAllowance: Abi.Error = {
  type: 'error',
  name: 'InsufficientAllowance',
  inputs: [
    { type: 'uint256', name: 'allowance' },
    { type: 'uint256', name: 'required' }
  ]
};
```

### Validation Errors

```typescript
const InvalidAddress: Abi.Error = {
  type: 'error',
  name: 'InvalidAddress',
  inputs: [{ type: 'address', name: 'addr' }]
};

const InvalidAmount: Abi.Error = {
  type: 'error',
  name: 'InvalidAmount',
  inputs: [{ type: 'uint256', name: 'amount' }]
};

const DeadlineExpired: Abi.Error = {
  type: 'error',
  name: 'DeadlineExpired',
  inputs: [
    { type: 'uint256', name: 'deadline' },
    { type: 'uint256', name: 'currentTime' }
  ]
};
```

## Decoding Revert Data

Complete example of handling revert data:

```typescript
function decodeRevertData(revertData: Uint8Array) {
  const selector = revertData.slice(0, 4);

  // Check standard Error(string)
  const errorSelector = Abi.getErrorSelector('Error(string)');
  if (selector.every((b, i) => b === errorSelector[i])) {
    const Error = { type: 'error', name: 'Error', inputs: [{ type: 'string' }] } as const;
    const [message] = Abi.Error.decodeParams.call(Error, revertData);
    return { type: 'Error', message };
  }

  // Check standard Panic(uint256)
  const panicSelector = Abi.getErrorSelector('Panic(uint256)');
  if (selector.every((b, i) => b === panicSelector[i])) {
    const Panic = { type: 'error', name: 'Panic', inputs: [{ type: 'uint256' }] } as const;
    const [code] = Abi.Error.decodeParams.call(Panic, revertData);
    return { type: 'Panic', code };
  }

  // Check custom errors
  const insufficientBalanceSelector = Abi.Error.getSelector.call(InsufficientBalance);
  if (selector.every((b, i) => b === insufficientBalanceSelector[i])) {
    const params = Abi.Error.decodeParams.call(InsufficientBalance, revertData);
    return { type: 'InsufficientBalance', params };
  }

  // Unknown error
  return { type: 'Unknown', data: revertData };
}
```

## See Also

- [ABI Overview](./abi.md)
- [ABI Functions](./abi.function.md)
- [ABI Events](./abi.event.md)
- [ABI Types](./abi.types.md)
- [ABI Encoding](./abi.encoding.md)
