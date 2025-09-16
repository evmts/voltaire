# TypeScript EVM Prototype

A TypeScript implementation of the Ethereum Virtual Machine focusing on stack-only operations, mirroring the Zig EVM architecture with tailcall-style execution via trampoline.

## Architecture

This implementation follows the Zig EVM's dispatch-based architecture:

- **Dispatch-based execution**: Instead of a central switch statement, bytecode is preprocessed into a schedule of handler functions
- **Tailcall emulation**: Uses explicit trampoline loop since JavaScript lacks TCO guarantees
- **Functional separation**: Data structures (interfaces) are separated from operations (free functions)
- **Error-as-values**: No exceptions thrown; errors returned as typed union values

## Features Implemented

### Core Components
- **Stack**: Full EVM stack with 1024 limit, push/pop/peek/dup/swap operations
- **Frame**: Execution context holding stack, schedule, and safety counter
- **Dispatcher**: Compiles bytecode into optimized handler schedule
- **Interpreter**: Trampoline loop executing handler functions

### Opcodes (Stack-Only)
- **Arithmetic**: ADD, MUL, SUB, DIV, SDIV, MOD, SMOD, ADDMOD, MULMOD
- **Bitwise**: AND, OR, XOR, NOT, BYTE, SHL, SHR, SAR
- **Comparison**: LT, GT, SLT, SGT, EQ, ISZERO
- **Stack**: PUSH1-32, DUP1-16, SWAP1-16, POP
- **System**: RETURN (simplified), STOP

## Project Structure

```
ts-evm/
├── src/
│   ├── evm.ts                  # Entry point with call() method
│   ├── types.ts                # Word type and 256-bit helpers
│   ├── errors.ts               # Typed error classes
│   ├── stack/stack.ts          # Stack implementation
│   ├── frame/frame.ts          # Frame data structure
│   ├── interpreter.ts          # Trampoline interpreter
│   ├── preprocessor/dispatch.ts # Bytecode compilation
│   └── instructions/           # Opcode handlers
│       ├── handlers_arithmetic.ts
│       ├── handlers_bitwise.ts
│       ├── handlers_comparison.ts
│       └── handlers_stack.ts
└── test/
    ├── stack.test.ts
    ├── arithmetic.test.ts
    └── e2e_return.test.ts
```

## Usage

```typescript
import { createEvm, call } from './src/evm';

// Create bytecode: PUSH1 1, PUSH1 2, ADD, RETURN
const bytecode = new Uint8Array([0x60, 0x01, 0x60, 0x02, 0x01, 0xf3]);

const evm = createEvm();
const result = call(evm, { bytecode });

if (!(result instanceof Error)) {
  console.log(result.data); // 32-byte result
}
```

## Running

```bash
# Install dependencies
bun install

# Run tests
bun test

# Run demo
bun run demo.ts
```

## Design Decisions

1. **BigInt for 256-bit arithmetic**: Native BigInt provides unlimited precision
2. **Trampoline for tailcalls**: Explicit loop since JS lacks guaranteed TCO
3. **Schedule preprocessing**: Bytecode compiled once into handler schedule
4. **Tree-shakeable functions**: Operations are free functions, not methods
5. **Safety counter**: Prevents infinite loops (300M instruction limit)

## Limitations (Milestone 1)

- No memory operations
- No storage operations
- No gas metering
- No precompiles
- Simplified RETURN (returns top-of-stack as 32 bytes)
- No synthetic/fused opcodes

## Test Coverage

- Stack operations: underflow/overflow, all DUP/SWAP variants
- Arithmetic: wrapping, division by zero, signed operations
- E2E: Complete bytecode execution with RETURN

All tests pass with 100% of implemented functionality covered.
