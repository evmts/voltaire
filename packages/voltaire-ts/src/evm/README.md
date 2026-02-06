# EVM (Ethereum Virtual Machine)

Complete EVM implementation with execution frame, host interface, and all opcode handlers.

## Architecture

Based on [guillotine-mini](https://github.com/DelphinusLab/guillotine-mini) architecture:
- **Frame**: Execution context (stack, memory, gas, PC)
- **Host**: External state interface (storage, accounts, block data)
- **Handlers**: Pure functions implementing EVM opcodes

### Dual Implementation
- **TypeScript**: High-level API, instruction handlers
- **Zig**: Performance-critical operations, cryptographic primitives

## Frame Structure

The `Frame` represents a single execution context:

```typescript
import * as Frame from './evm/Frame/index.js';
import type { BrandedFrame } from './evm/Frame/BrandedFrame.js';

const frame: BrandedFrame = Frame.from({
  code: bytecode,
  data: calldata,
  gas: 30_000_000n,
});

// Stack operations
Frame.pushStack(frame, value);
const top = Frame.popStack(frame);
const peek = Frame.peekStack(frame, 0);

// Memory operations
Frame.writeMemory(frame, offset, data);
const data = Frame.readMemory(frame, offset, length);

// Gas operations
Frame.consumeGas(frame, cost);
const expansion = Frame.memoryExpansionCost(frame, newSize);
```

### Frame Properties

```typescript
type BrandedFrame = {
  // Code execution
  code: Uint8Array;           // Bytecode being executed
  pc: number;                 // Program counter

  // Stack (max 1024 items, 256-bit values)
  stack: bigint[];

  // Memory (byte-addressable, expandable)
  memory: Uint8Array;

  // Gas tracking
  gas: bigint;                // Gas remaining
  gasUsed: bigint;            // Gas consumed

  // Call context
  data: Uint8Array;           // Calldata
  value: bigint;              // ETH value
  caller: Uint8Array;         // Caller address (20 bytes)
  address: Uint8Array;        // Current address (20 bytes)
  origin: Uint8Array;         // Transaction origin (20 bytes)

  // Return/revert data
  returnData: Uint8Array;

  // Execution status
  stopped: boolean;           // STOP/RETURN/REVERT
  reverted: boolean;          // REVERT called
};
```

## Host Interface

The `Host` provides access to external state:

```typescript
import * as Host from './evm/Host/index.js';
import type { BrandedHost } from './evm/Host/BrandedHost.js';

// Create in-memory host for testing
const host: BrandedHost = Host.createMemoryHost();

// Custom host implementation
const customHost: BrandedHost = Host.from({
  getBalance: (address) => 1000000000000000000n,
  getCode: (address) => new Uint8Array([0x60, 0x00, 0x60, 0x00, 0xf3]),
  getStorage: (address, key) => new Uint8Array(32),
  setStorage: (address, key, value) => {},
  getBlockHash: (number) => new Uint8Array(32),
  // ... other methods
});
```

### Host Methods

```typescript
type BrandedHost = {
  // Account state
  getBalance(address: Uint8Array): bigint;
  getCode(address: Uint8Array): Uint8Array;
  getCodeHash(address: Uint8Array): Uint8Array;
  getCodeSize(address: Uint8Array): number;
  accountExists(address: Uint8Array): boolean;

  // Storage
  getStorage(address: Uint8Array, key: Uint8Array): Uint8Array;
  setStorage(address: Uint8Array, key: Uint8Array, value: Uint8Array): void;

  // Transient storage (EIP-1153)
  getTransientStorage(address: Uint8Array, key: Uint8Array): Uint8Array;
  setTransientStorage(address: Uint8Array, key: Uint8Array, value: Uint8Array): void;

  // Block context
  getBlockHash(number: bigint): Uint8Array;
  getBlockNumber(): bigint;
  getBlockTimestamp(): bigint;
  getBlockCoinbase(): Uint8Array;
  getBlockGasLimit(): bigint;
  getBlockDifficulty(): bigint;
  getChainId(): bigint;
  getBaseFee(): bigint;
  getBlobBaseFee(): bigint;
  getBlobHash(index: number): Uint8Array;

  // Transaction context
  getGasPrice(): bigint;
  getOrigin(): Uint8Array;

  // Logging
  emitLog(address: Uint8Array, topics: Uint8Array[], data: Uint8Array): void;
};
```

## Instruction Handlers

All EVM opcodes organized by category:

### Arithmetic (0x01-0x0b)
```typescript
import * as Arithmetic from './evm/arithmetic/index.js';

// ADD, MUL, SUB, DIV, SDIV, MOD, SMOD, ADDMOD, MULMOD, EXP, SIGNEXTEND
Arithmetic.add(frame, host);
Arithmetic.mul(frame, host);
Arithmetic.exp(frame, host);
```

### Comparison (0x10-0x15)
```typescript
import * as Comparison from './evm/comparison/index.js';

// LT, GT, SLT, SGT, EQ, ISZERO
Comparison.LT(frame, host);
Comparison.EQ(frame, host);
```

### Bitwise (0x16-0x1d)
```typescript
import * as Bitwise from './evm/bitwise/index.js';

// AND, OR, XOR, NOT, BYTE, SHL, SHR, SAR
Bitwise.AND(frame, host);
Bitwise.SHL(frame, host);
```

### Keccak (0x20)
```typescript
import * as Keccak from './evm/keccak/index.js';

// SHA3 (Keccak256)
Keccak.sha3(frame, host);
```

### Context (0x30-0x3f)
```typescript
import * as Context from './evm/context/index.js';

// ADDRESS, BALANCE, ORIGIN, CALLER, CALLVALUE, CALLDATALOAD, CALLDATASIZE,
// CALLDATACOPY, CODESIZE, CODECOPY, GASPRICE, EXTCODESIZE, EXTCODECOPY,
// RETURNDATASIZE, RETURNDATACOPY, EXTCODEHASH
Context.address(frame, host);
Context.calldataload(frame, host);
Context.balance(frame, host);
```

### Block (0x40-0x4a)
```typescript
import * as Block from './evm/block/index.js';

// BLOCKHASH, COINBASE, TIMESTAMP, NUMBER, DIFFICULTY, GASLIMIT, CHAINID,
// SELFBALANCE, BASEFEE, BLOBHASH, BLOBBASEFEE
Block.handler_0x42_TIMESTAMP(frame, host);
Block.handler_0x46_CHAINID(frame, host);
```

### Stack (0x50, 0x5f-0x9f)
```typescript
import * as Stack from './evm/stack/handlers/index.js';

// POP, PUSH0, PUSH1-PUSH32, DUP1-DUP16, SWAP1-SWAP16
Stack.handler_0x50_POP(frame, host);
Stack.handler_0x60_PUSH1(frame, host);
Stack.handler_0x80_DUP1(frame, host);
Stack.handler_0x90_SWAP1(frame, host);
```

### Memory (0x51-0x53, 0x5e)
```typescript
import * as Memory from './evm/memory/index.js';

// MLOAD, MSTORE, MSTORE8, MCOPY
Memory.mload(frame, host);
Memory.mstore(frame, host);
Memory.mcopy(frame, host);
```

### Storage (0x54-0x55, 0x5c-0x5d)
```typescript
import * as Storage from './evm/storage/handlers/index.js';

// SLOAD, SSTORE, TLOAD, TSTORE
Storage.sload(frame, host);
Storage.sstore(frame, host);
Storage.tload(frame, host);  // EIP-1153 transient storage
```

### Control Flow (0x00, 0x56-0x58, 0x5b, 0xf3, 0xfd)
```typescript
import * as Control from './evm/control/index.js';

// STOP, JUMP, JUMPI, PC, JUMPDEST, RETURN, REVERT
Control.handler_0x00_STOP(frame, host);
Control.handler_0x56_JUMP(frame, host);
Control.handler_0xf3_RETURN(frame, host);
Control.handler_0xfd_REVERT(frame, host);
```

### Log (0xa0-0xa4)
```typescript
import * as Log from './evm/log/index.js';

// LOG0, LOG1, LOG2, LOG3, LOG4
Log.handler_0xa0_LOG0(frame, host);
Log.handler_0xa1_LOG1(frame, host);
```

### System (0xf0-0xf2, 0xf4-0xf5, 0xfa, 0xff)
```typescript
import * as System from './evm/system/index.js';

// CREATE, CALL, CALLCODE, DELEGATECALL, CREATE2, STATICCALL, SELFDESTRUCT
System.create(frame, host);
System.call(frame, host);
System.delegatecall(frame, host);
System.selfdestruct(frame, host);
```

## Usage Example

Complete execution flow:

```typescript
import * as Frame from './evm/Frame/index.js';
import * as Host from './evm/Host/index.js';
import * as Arithmetic from './evm/arithmetic/index.js';
import * as Stack from './evm/stack/handlers/index.js';
import * as Control from './evm/control/index.js';

// Setup
const host = Host.createMemoryHost();
const frame = Frame.from({
  code: new Uint8Array([
    0x60, 0x02,  // PUSH1 2
    0x60, 0x03,  // PUSH1 3
    0x01,        // ADD
    0x00,        // STOP
  ]),
  gas: 1_000_000n,
});

// Execute (simplified - actual implementation would use opcode dispatch)
Stack.handler_0x60_PUSH1(frame, host);  // PUSH1 2
Stack.handler_0x60_PUSH1(frame, host);  // PUSH1 3
Arithmetic.add(frame, host);            // ADD
Control.handler_0x00_STOP(frame, host); // STOP

// Result
const result = Frame.peekStack(frame, 0);  // 5n
```

## Handler Signature

All instruction handlers follow the same signature:

```typescript
type Handler = (frame: BrandedFrame, host: BrandedHost) => void;
```

Handlers mutate the frame directly:
- Push/pop stack values
- Read/write memory
- Consume gas
- Update PC
- Set stopped/reverted flags
- Access host for external state

## Error Handling

Frame operations throw `EvmError`:

```typescript
type EvmError =
  | { type: 'StackUnderflow' }
  | { type: 'StackOverflow' }
  | { type: 'OutOfGas' }
  | { type: 'InvalidJump' }
  | { type: 'InvalidOpcode', opcode: number }
  | { type: 'MemoryAccessViolation' };
```

Handlers should propagate errors:

```typescript
try {
  Frame.popStack(frame);
} catch (error) {
  if (error.type === 'StackUnderflow') {
    // Handle error
  }
  throw error;
}
```

## Gas Metering

All operations consume gas according to EVM specification:

```typescript
// Fixed costs
const GAS_VERY_LOW = 3n;
const GAS_LOW = 5n;
const GAS_MID = 8n;
const GAS_HIGH = 10n;

// Memory expansion
const expansion = Frame.memoryExpansionCost(frame, newSize);
Frame.consumeGas(frame, GAS_VERY_LOW + expansion);

// Dynamic costs (e.g., KECCAK256)
const wordCount = (length + 31n) / 32n;
Frame.consumeGas(frame, 30n + 6n * wordCount);
```

## Testing

All handlers have comprehensive test coverage:

```bash
# TypeScript tests
bun run test -- evm

# Zig tests
zig build test -Dtest-filter=evm
```

Test files colocated with handlers:
- `0x01_ADD.test.ts`
- `0x20_SHA3.test.ts`
- `Frame.test.ts`

## Reference

Based on guillotine-mini architecture:
- https://github.com/DelphinusLab/guillotine-mini

EVM specification:
- Ethereum Yellow Paper
- EIPs (Ethereum Improvement Proposals)
- Execution Specs: https://github.com/ethereum/execution-specs

## Module Organization

```
src/evm/
├── index.ts                  # Main exports
├── README.md                 # This file
├── Frame/                    # Execution frame
│   ├── BrandedFrame.ts
│   ├── from.js
│   ├── pushStack.js
│   ├── popStack.js
│   └── ...
├── Host/                     # Host interface
│   ├── BrandedHost.ts
│   ├── from.js
│   └── createMemoryHost.js
├── arithmetic/               # 0x01-0x0b
├── comparison/               # 0x10-0x15
├── bitwise/                  # 0x16-0x1d
├── keccak/                   # 0x20
├── context/                  # 0x30-0x3f
├── block/                    # 0x40-0x4a
├── stack/handlers/           # 0x50, 0x5f-0x9f
├── memory/                   # 0x51-0x53, 0x5e
├── storage/handlers/         # 0x54-0x55, 0x5c-0x5d
├── control/                  # 0x00, 0x56-0x58, 0x5b, 0xf3, 0xfd
├── log/                      # 0xa0-0xa4
├── system/                   # 0xf0-0xf2, 0xf4-0xf5, 0xfa, 0xff
├── evm.zig                   # Zig implementation
├── frame.zig                 # Zig frame
└── host.zig                  # Zig host
```

## Notes

- All handlers are pure functions (side effects via frame mutation)
- Memory is expandable, grows in 32-byte words
- Stack is fixed at 1024 items max
- Gas costs follow latest EVM specification
- Precompiles handled separately in `src/precompiles/`
- Cryptographic operations delegated to `src/crypto/`
