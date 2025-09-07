# Guillotine EVM TypeScript API Design

## Overview

The Guillotine EVM TypeScript API provides a comprehensive, type-safe interface to the high-performance Guillotine EVM implementation. This API wraps the underlying WASM-compiled Zig implementation with an ergonomic TypeScript facade that feels natural to JavaScript developers while maintaining the performance benefits of the native implementation.

## Core Design Principles

1. **Type Safety**: Full TypeScript support with strict typing
2. **Ergonomic API**: Natural JavaScript patterns and conventions
3. **Zero-Copy Where Possible**: Minimize data copying between JS and WASM
4. **Async-First**: All potentially blocking operations are async
5. **Resource Management**: Automatic cleanup with proper lifecycle management
6. **Error Handling**: Rich error types with detailed context
7. **Modular Architecture**: Separate modules for different EVM components

## Architecture

```typescript
// High-level architecture
guillotine-ts/
├── core/           // Core EVM functionality
│   ├── evm.ts     // Main EVM class
│   ├── frame.ts   // Frame execution context
│   ├── stack.ts   // Stack operations
│   └── memory.ts  // Memory management
├── primitives/     // Ethereum primitives
│   ├── address.ts // Address type
│   ├── u256.ts    // 256-bit unsigned integer
│   ├── bytes.ts   // Byte arrays
│   └── hash.ts    // Hash type
├── bytecode/       // Bytecode analysis
│   ├── bytecode.ts // Bytecode representation
│   └── planner.ts  // Bytecode optimization
├── state/          // State management
│   ├── database.ts // State database interface
│   └── journal.ts  // State journaling
├── wasm/           // WASM integration
│   └── bindings.ts // Low-level WASM bindings
└── index.ts        // Main exports
```

## API Reference

### Main EVM Class

```typescript
import { EVM, ExecutionResult, TransactionContext } from '@evmts/guillotine';

// Create an EVM instance
const evm = await EVM.create({
  // Optional configuration
  hardfork: 'shanghai',
  enableTracing: false,
  customPrecompiles: []
});

// Execute a transaction
const result: ExecutionResult = await evm.execute({
  // Transaction context
  caller: Address.from('0x1234...'),
  to: Address.from('0x5678...'),
  value: U256.from('1000000000000000000'), // 1 ETH
  input: Bytes.from('0x...'),
  gasLimit: 100000n,
  gasPrice: U256.from('20000000000'), // 20 gwei
  
  // Block context
  blockNumber: 1000000n,
  timestamp: 1234567890n,
  coinbase: Address.from('0xabcd...'),
  difficulty: U256.zero(),
  gasLimit: 30000000n,
  baseFee: U256.from('10000000000')
});

// Check execution result
if (result.success) {
  console.log('Gas used:', result.gasUsed);
  console.log('Return data:', result.output.toHex());
  console.log('Logs:', result.logs);
} else {
  console.log('Execution failed:', result.error);
  if (result.revertReason) {
    console.log('Revert reason:', result.revertReason);
  }
}

// State management
await evm.stateDB.setBalance(address, U256.from('1000000000000000000'));
await evm.stateDB.setCode(address, Bytes.from('0x6060...'));
await evm.stateDB.setStorage(address, key, value);

// Cleanup when done
evm.destroy();
```

### Frame API (Low-Level Execution)

```typescript
import { Frame, Opcode } from '@evmts/guillotine';

// Create a frame for direct bytecode execution
const frame = await Frame.create({
  bytecode: Bytes.from('0x6001600201'), // PUSH1 1 PUSH1 2 ADD
  gasLimit: 100000n
});

// Execute until completion
const result = await frame.execute();

// Or step through execution
frame.enableStepping();
while (!frame.isStopped()) {
  const step = await frame.step();
  console.log('PC:', step.pc);
  console.log('Opcode:', Opcode[step.opcode]);
  console.log('Gas remaining:', step.gasRemaining);
  console.log('Stack:', step.stack);
}

// Access frame state
const stackTop = await frame.stack.peek();
const memorySize = frame.memory.size();
const gasUsed = frame.gasUsed();

// Cleanup
frame.destroy();
```

### Stack API

```typescript
import { Stack, U256 } from '@evmts/guillotine';

// Stack is typically accessed through Frame, but can be used standalone
const stack = Stack.create();

// Push values
await stack.push(U256.from(42));
await stack.push(U256.from('0xdeadbeef'));

// Pop values
const value = await stack.pop();

// Peek without removing
const top = await stack.peek();
const secondFromTop = await stack.peek(1);

// Duplicate values
await stack.dup(1); // Duplicate top
await stack.dup(3); // Duplicate 3rd from top

// Swap values
await stack.swap(1); // Swap top two
await stack.swap(5); // Swap top with 6th

// Get stack info
const size = stack.size();
const isEmpty = stack.isEmpty();

stack.destroy();
```

### Memory API

```typescript
import { Memory, U256, Bytes } from '@evmts/guillotine';

// Memory is typically accessed through Frame
const memory = Memory.create();

// Write data
await memory.writeU256(0, U256.from('0xdeadbeef'));
await memory.writeBytes(32, Bytes.from('0x6060604052'));

// Read data
const value = await memory.readU256(0);
const data = await memory.readBytes(32, 5);

// Get memory info
const size = memory.size();
const expansionCost = memory.expansionCost(1000);

memory.destroy();
```

### Bytecode Analysis API

```typescript
import { Bytecode, Planner, Plan } from '@evmts/guillotine';

// Analyze bytecode
const bytecode = Bytecode.from('0x6060604052...');
const analysis = await bytecode.analyze();

console.log('Valid jumpdests:', analysis.validJumpdests);
console.log('Has invalid opcodes:', analysis.hasInvalidOpcodes);
console.log('Code sections:', analysis.codeSections);

// Create optimized execution plan
const planner = Planner.create({
  strategy: 'advanced', // or 'minimal'
  enableFusion: true
});

const plan = await planner.analyze(bytecode);
console.log('Optimized instructions:', plan.instructionCount);
console.log('Fused operations:', plan.fusedOps);

// Use plan for execution
const frame = await Frame.createWithPlan(plan, { gasLimit: 100000n });
```

### State Database API

```typescript
import { StateDB, Address, U256, Bytes } from '@evmts/guillotine';

// Create in-memory state database
const stateDB = StateDB.createMemory();

// Account operations
await stateDB.createAccount(address);
await stateDB.setBalance(address, U256.from('1000000000000000000'));
await stateDB.setNonce(address, 1n);
await stateDB.setCode(address, contractBytecode);

// Storage operations
await stateDB.setStorage(address, slot, value);
const storedValue = await stateDB.getStorage(address, slot);

// Transient storage (EIP-1153)
await stateDB.setTransientStorage(address, slot, value);
const transientValue = await stateDB.getTransientStorage(address, slot);

// Access list (EIP-2930)
stateDB.accessList.addAddress(address);
stateDB.accessList.addSlot(address, slot);
const isWarm = stateDB.accessList.isAddressWarm(address);

// Journaling for reverts
const snapshot = stateDB.snapshot();
await stateDB.setBalance(address, U256.zero());
await stateDB.revert(snapshot); // Restores previous balance

// Commit changes
await stateDB.commit();
```

### Primitives

```typescript
import { Address, U256, Bytes, Hash } from '@evmts/guillotine';

// Address (20 bytes)
const addr1 = Address.from('0x742d35Cc6634C0532925a3b844Bc9e7595f7BBDc');
const addr2 = Address.fromBytes(new Uint8Array(20));
const zeroAddr = Address.zero();
console.log(addr1.toString()); // "0x742d35Cc6634C0532925a3b844Bc9e7595f7BBDc"
console.log(addr1.equals(addr2)); // false

// U256 (256-bit unsigned integer)
const value1 = U256.from(123456789);
const value2 = U256.from('0xdeadbeef');
const value3 = U256.from('1000000000000000000'); // 1 ETH in wei
const max = U256.max();
const result = value1.add(value2).mul(value3);
console.log(result.toString()); // decimal string
console.log(result.toHex()); // "0x..."

// Bytes (variable length byte array)
const bytes1 = Bytes.from('0x6060604052');
const bytes2 = Bytes.fromString('Hello, EVM!');
const bytes3 = Bytes.fromArray([1, 2, 3, 4, 5]);
const concatenated = bytes1.concat(bytes2);
const slice = bytes1.slice(2, 4);
console.log(bytes1.toHex()); // "0x6060604052"

// Hash (32 bytes)
const hash1 = Hash.from('0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470');
const hash2 = Hash.keccak256(Bytes.from('Hello'));
const emptyHash = Hash.empty();
console.log(hash1.equals(hash2)); // false
```

### Error Handling

```typescript
import { EVMError, ErrorCode } from '@evmts/guillotine';

try {
  const result = await evm.execute(transaction);
} catch (error) {
  if (error instanceof EVMError) {
    switch (error.code) {
      case ErrorCode.OUT_OF_GAS:
        console.log('Transaction ran out of gas');
        break;
      case ErrorCode.STACK_OVERFLOW:
        console.log('Stack overflow at PC:', error.pc);
        break;
      case ErrorCode.INVALID_JUMP:
        console.log('Invalid jump destination:', error.destination);
        break;
      case ErrorCode.REVERT:
        console.log('Execution reverted:', error.reason);
        break;
      default:
        console.log('EVM error:', error.message);
    }
  }
}
```

### Tracing and Debugging

```typescript
import { EVM, Tracer, TraceStep } from '@evmts/guillotine';

// Create custom tracer
class CustomTracer implements Tracer {
  async onStep(step: TraceStep): Promise<void> {
    console.log(`[${step.depth}] PC: ${step.pc}, Op: ${step.opcode}`);
  }
  
  async onCall(depth: number, callType: string, from: Address, to: Address, value: U256): Promise<void> {
    console.log(`CALL at depth ${depth}: ${from} -> ${to}`);
  }
}

// Create EVM with tracer
const evm = await EVM.create({
  tracer: new CustomTracer()
});

// Or enable built-in debugging
const debugFrame = await Frame.createDebug({
  bytecode,
  gasLimit: 100000n,
  breakpoints: [10, 20, 30] // Break at these PCs
});

// Step through with debugging
while (!debugFrame.isStopped()) {
  const state = await debugFrame.debug.step();
  console.log('Stack:', state.stack);
  console.log('Memory:', state.memory);
  console.log('Storage changes:', state.storageChanges);
}
```

### Precompiled Contracts

```typescript
import { Precompile, PrecompileRegistry } from '@evmts/guillotine';

// Access built-in precompiles
const ecrecover = PrecompileRegistry.get(0x01);
const sha256 = PrecompileRegistry.get(0x02);
const ripemd160 = PrecompileRegistry.get(0x03);

// Execute precompile
const result = await ecrecover.execute({
  input: Bytes.from('0x...'),
  gasLimit: 3000n
});

// Register custom precompile
class CustomPrecompile implements Precompile {
  address = Address.from('0x0000000000000000000000000000000000000100');
  
  async execute(input: Bytes, gasLimit: bigint): Promise<PrecompileResult> {
    // Custom logic
    return {
      output: Bytes.from('0x...'),
      gasUsed: 100n
    };
  }
}

PrecompileRegistry.register(new CustomPrecompile());
```

### Gas Metering

```typescript
import { GasCalculator, GasConstants } from '@evmts/guillotine';

// Calculate gas for operations
const memoryCost = GasCalculator.memory(1024); // Memory expansion to 1024 bytes
const storageCost = GasCalculator.sstore(U256.zero(), U256.from(42), false); // Cold storage
const callCost = GasCalculator.call(100000n, Address.zero(), U256.zero(), true); // Warm call

// Access gas constants
console.log('Gas for ADD:', GasConstants.ADD); // 3
console.log('Gas for SLOAD (cold):', GasConstants.SLOAD_COLD); // 2100
console.log('Gas for SLOAD (warm):', GasConstants.SLOAD_WARM); // 100
```

### Advanced Usage

```typescript
// Batch operations for efficiency
const batch = evm.createBatch();
batch.setBalance(addr1, value1);
batch.setBalance(addr2, value2);
batch.setStorage(addr3, slot1, data1);
await batch.commit();

// Fork from existing state
const forkedEVM = await EVM.fork({
  url: 'https://mainnet.infura.io/v3/YOUR-PROJECT-ID',
  blockNumber: 18000000n
});

// Custom hardfork rules
const customEVM = await EVM.create({
  hardfork: 'custom',
  eips: [1559, 3675, 4844], // Enable specific EIPs
  customOpcodes: {
    0xf5: { // Custom opcode
      name: 'CUSTOM_OP',
      gasCost: 10,
      execute: async (frame) => {
        // Custom implementation
      }
    }
  }
});
```

## Performance Considerations

1. **Resource Management**: Always call `destroy()` on EVM instances, frames, and other resources when done
2. **Batch Operations**: Use batch operations when modifying multiple state values
3. **Plan Reuse**: Cache and reuse execution plans for frequently executed bytecode
4. **Memory Pooling**: The WASM implementation uses memory pooling for efficiency
5. **Async Operations**: All potentially blocking operations are async to prevent blocking the event loop

## Migration from Other EVM Libraries

### From ethereumjs-evm

```typescript
// ethereumjs-evm
const evm = new EVM({ common, stateManager });
const result = await evm.runCode({ code, gasLimit });

// Guillotine
const evm = await EVM.create();
const result = await evm.execute({ bytecode: code, gasLimit });
```

### From evm-ts

```typescript
// evm-ts
const vm = createVM({ fork: { url } });
await vm.runTx({ tx });

// Guillotine
const evm = await EVM.fork({ url });
await evm.execute(tx);
```

## Testing

```typescript
import { TestUtils } from '@evmts/guillotine/test';

// Create test environment
const env = await TestUtils.createTestEnv();

// Deploy contract
const contract = await env.deploy({
  bytecode: compiledBytecode,
  args: [arg1, arg2]
});

// Test contract execution
const result = await env.call(contract, 'transfer', [recipient, amount]);
expect(result.success).toBe(true);

// Snapshot and revert for test isolation
const snapshot = await env.snapshot();
// ... make changes ...
await env.revert(snapshot);
```

## Best Practices

1. **Always handle errors**: EVM execution can fail in many ways
2. **Use appropriate types**: Use Address, U256, etc. instead of strings
3. **Resource cleanup**: Always destroy resources when done
4. **Gas limits**: Always specify reasonable gas limits
5. **Input validation**: Validate inputs before passing to WASM

## Future Enhancements

- **Streaming execution**: Stream execution steps for large traces
- **Parallel execution**: Execute independent transactions in parallel
- **State proof generation**: Generate Merkle proofs for state access
- **JIT compilation**: JIT compile hot bytecode paths
- **WebGPU acceleration**: Accelerate certain operations with WebGPU