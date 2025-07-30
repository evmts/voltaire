# @evmts/guillotine

TypeScript bindings for the Guillotine EVM using WebAssembly, providing a high-performance, browser-compatible interface to the Ethereum Virtual Machine.

## Features

- **WebAssembly-Powered**: Direct WASM integration with the native Zig implementation
- **Browser & Node.js**: Universal compatibility across JavaScript environments
- **TypeScript-First**: Full type safety with comprehensive TypeScript definitions
- **High Performance**: Near-native execution speed with minimal overhead
- **Memory Efficient**: Optimized WASM builds with small bundle sizes
- **Modern APIs**: Promise-based APIs with async/await support

## Installation

```bash
npm install @evmts/guillotine
```

## Quick Start

```typescript
import { GuillotineEVM, Address, U256, Bytes } from '@evmts/guillotine';

async function main() {
  // Initialize the EVM
  const evm = await GuillotineEVM.create();

  // Execute bytecode
  const bytecode = Bytes.fromHex('0x6042'); // PUSH1 0x42
  const result = await evm.execute({
    bytecode,
    gasLimit: 1000000n,
  });

  console.log('Execution successful:', result.success);
  console.log('Gas used:', result.gasUsed);
}

main().catch(console.error);
```

## Core Types

### Primitives

- **`Address`**: 20-byte Ethereum addresses with validation and hex conversion
- **`U256`**: 256-bit unsigned integers with arithmetic operations
- **`Hash`**: 32-byte hash values for blockchain data
- **`Bytes`**: Variable-length byte arrays with hex encoding

### EVM Execution

- **`GuillotineEVM`**: Main execution engine with WASM integration
- **`ExecutionResult`**: Comprehensive execution results with gas usage and return data
- **`GuillotineError`**: Typed error handling for all EVM operations

## Examples

### Working with Addresses

```typescript
import { Address } from '@evmts/guillotine';

// Create from hex string
const address = Address.fromHex('0x1234567890123456789012345678901234567890');

// Create zero address
const zero = Address.zero();

// Convert to different formats
console.log(address.toHex());     // "0x1234567890123456789012345678901234567890"
console.log(address.toBytes());   // Uint8Array(20)
console.log(address.toString());  // "0x1234567890123456789012345678901234567890"
```

### Working with U256

```typescript
import { U256 } from '@evmts/guillotine';

// Create from different sources
const value1 = U256.fromNumber(12345);
const value2 = U256.fromBigInt(123456789012345678901234567890n);
const value3 = U256.fromHex('0x1fffffffffffffffffffffffffffffffffffff');

// Arithmetic operations
const sum = value1.add(value2);
const difference = value3.sub(value1);
const product = value1.mul(value2);
const quotient = value3.div(value1);

// Comparisons
console.log(value1.eq(value2));  // false
console.log(value1.lt(value2));  // true
console.log(value1.gt(value2));  // false
```

### EVM State Management

```typescript
import { GuillotineEVM, Address, U256, Bytes } from '@evmts/guillotine';

const evm = await GuillotineEVM.create();

// Set account balance
const address = Address.fromHex('0x1234567890123456789012345678901234567890');
await evm.setBalance(address, U256.fromNumber(1000));

// Deploy contract code
const contractCode = Bytes.fromHex('0x608060405234801561001057600080fd5b50...');
await evm.setCode(address, contractCode);

// Execute with parameters
const result = await evm.execute({
  bytecode: contractCode,
  caller: Address.zero(),
  to: address,
  value: U256.fromNumber(100),
  input: Bytes.fromHex('0x01020304'),
  gasLimit: 1000000n,
});

console.log('Success:', result.success);
console.log('Gas used:', result.gasUsed);
console.log('Return data:', result.returnData.toHex());
```

### Smart Contract Interaction

```typescript
import { GuillotineEVM, Address, U256, Bytes } from '@evmts/guillotine';

const evm = await GuillotineEVM.create();

// Deploy a simple storage contract
const deployBytecode = Bytes.fromHex('0x608060405234801561001057600080fd5b50...');
const contractAddress = Address.fromHex('0x1000000000000000000000000000000000000001');

await evm.setCode(contractAddress, deployBytecode);

// Call contract function
const callData = Bytes.fromHex('0x60fe47b1000000000000000000000000000000000000000000000000000000000000002a'); // set(42)
const result = await evm.execute({
  bytecode: deployBytecode,
  caller: Address.zero(),
  to: contractAddress,
  input: callData,
  gasLimit: 100000n,
});

if (result.success) {
  console.log('Contract call successful');
} else {
  console.log('Contract call failed:', result.revertReason?.toHex());
}
```

## Architecture

The TypeScript bindings use a three-layer architecture:

1. **WASM Layer**: Direct integration with Zig-compiled WebAssembly modules
2. **Primitives Layer**: Core Ethereum types with TypeScript-native APIs
3. **EVM Layer**: High-level execution engine with Promise-based APIs

### Performance Characteristics

- **Bundle Size**: ~200KB compressed WASM module
- **Initialization**: ~5ms cold start, ~1ms warm start
- **Execution Speed**: Near-native performance with WASM
- **Memory Usage**: Efficient memory management with WASM linear memory

### Browser Compatibility

- Chrome/Edge 57+
- Firefox 52+
- Safari 11+
- Node.js 18+

## Error Handling

The TypeScript bindings use typed error handling with detailed error information:

```typescript
try {
  const result = await evm.execute({ bytecode, gasLimit: 1000000n });
  // Handle successful execution
} catch (error) {
  if (error instanceof GuillotineError) {
    switch (error.type) {
      case 'ExecutionFailed':
        console.log('EVM execution failed:', error.message);
        break;
      case 'InvalidBytecode':
        console.log('Invalid bytecode provided:', error.message);
        break;
      case 'OutOfGas':
        console.log('Transaction ran out of gas:', error.message);
        break;
      default:
        console.log('Unknown error:', error.message);
    }
  } else {
    console.log('Unexpected error:', error);
  }
}
```

## Testing

Run the test suite:

```bash
npm test
```

Watch mode for development:

```bash
npm run test:watch
```

## Building from Source

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run type checking
npm run typecheck

# Lint the code
npm run lint
```

## Performance Tips

1. **Reuse EVM instances**: Creating new EVM instances has overhead
2. **Batch operations**: Group multiple state changes together
3. **Optimize gas limits**: Use appropriate gas limits to avoid waste
4. **Cache WASM**: The WASM module benefits from HTTP caching

## License

Same as the main Guillotine project.