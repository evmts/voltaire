# EVM Module

A high-performance Ethereum Virtual Machine implementation in Zig with configurable components and advanced optimization capabilities.

## Overview

This EVM implementation is designed from the ground up with a focus on:
- **Performance**: Cache-conscious data structures, pointer-based stack, and optimized bytecode execution
- **Modularity**: Pluggable components allow customization for different use cases
- **Type Safety**: Compile-time configuration and platform-specific optimizations
- **Research-Friendly**: Easy to extend with new optimizations and execution strategies

## Architecture

### Core Components

#### 1. **EVM** (`evm.zig`)
The main orchestrator that manages transaction-level execution, including:
- Call stack management
- State journaling for reverts
- Integration with Host for external operations
- Access list tracking (EIP-2929)
- Contract creation and self-destruct tracking

#### 2. **Frame** (`frame.zig`)
Lightweight execution context for individual opcodes:
- Stack operations (PUSH, POP, DUP, SWAP)
- Arithmetic and bitwise operations
- Memory operations (MLOAD, MSTORE, MCOPY)
- Storage operations via database interface
- Hashing and logging

**Note**: Frame does NOT handle PC tracking, jumps, or calls - these are managed by the Plan and Host respectively.

#### 3. **Stack** (`stack.zig`)
High-performance 256-bit word stack:
- Pointer-based implementation with downward growth
- Cache-aligned for optimal CPU performance
- Configurable size (default 1024 elements)
- Safe and unsafe variants for different use cases

#### 4. **Memory** (`memory.zig`)
EVM-compliant byte-addressable memory:
- Lazy expansion with word-boundary alignment
- Hierarchical checkpoints for nested calls
- Configurable initial capacity and limits
- Integrated gas calculation for expansion

#### 5. **Planner** (`planner.zig`)
Bytecode analysis and optimization engine:
- Jump destination validation
- Opcode fusion for common patterns
- Constant inlining
- Platform-specific optimizations
- Multiple strategies: minimal, advanced, debug

#### 6. **Database Interface** (`database_interface.zig`)
Type-safe storage abstraction:
- VTable-based polymorphism for zero overhead
- Support for accounts, storage, transient storage
- Pluggable backends (memory, file, network)
- Rich error handling

## Configuration

The EVM is highly configurable through compile-time parameters:

```zig
const evm_config = EvmConfig{
    .frame_config = .{
        .stack_size = 1024,
        .WordType = u256,
        .max_bytecode_size = 24576,
        .block_gas_limit = 30_000_000,
        .has_database = true,
        .TracerType = NoOpTracer,
    },
    .max_call_depth = 1024,
    .planner_strategy = .standard,
};

const EvmType = Evm(evm_config);
```

## Usage Example

```zig
const std = @import("std");
const evm = @import("evm");

// Create database
var memory_db = evm.MemoryDatabase.init(allocator);
defer memory_db.deinit();

// Create EVM instance
const EvmType = evm.Evm(.{});
var vm = try EvmType.init(
    allocator,
    memory_db.database(),
    .{}, // Transaction context
    .{}, // Block info
);
defer vm.deinit();

// Deploy contract
const bytecode = &[_]u8{ /* ... */ };
try vm.database.set_account(contract_address, .{
    .balance = 0,
    .nonce = 0,
    .code = bytecode,
});

// Execute call
const result = try vm.call(.{
    .caller = caller_address,
    .target = contract_address,
    .value = 0,
    .data = calldata,
    .gas_limit = 100_000,
    .is_static = false,
});
```

## Optimization Features

### Opcode Fusion
The planner can detect and fuse common opcode patterns:
- `PUSH + ADD` → `PUSH_ADD_INLINE`
- `PUSH + MUL` → `PUSH_MUL_INLINE`
- `PUSH + JUMP` → `PUSH_JUMP_INLINE`

### Constant Inlining
Small constants are embedded directly in the instruction stream, reducing memory accesses.

### Platform-Specific Optimizations
- 64-bit platforms: Larger inline constants, more aggressive fusion
- 32-bit platforms: Optimized for smaller memory footprint

## Tracing and Debugging

Multiple tracer implementations are available:
- **NoOpTracer**: Zero overhead for production use
- **DebuggingTracer**: Full execution history with breakpoints
- **LoggingTracer**: Structured logging to stdout
- **FileTracer**: High-performance file output

Enable tracing by configuring the Frame:
```zig
.TracerType = DebuggingTracer,
```

## Testing

The module includes comprehensive tests colocated with implementation files. Run tests with:
```bash
zig build test
```

## Performance Considerations

1. **Cache-Conscious Design**: Hot data structures are aligned and grouped
2. **Unsafe Operations**: Use `_unsafe` variants when bounds are pre-validated
3. **Memory Pooling**: Reuse allocations where possible
4. **Branch Hints**: Critical paths use `@branchHint` for better prediction

## Future Improvements

- Complete advanced planner implementation
- SIMD optimizations for bulk operations
- JIT compilation for hot paths
- More sophisticated opcode fusion patterns
- Tail call optimization investigation

## Contributing

See the main project's CONTRIBUTING.md for guidelines. Key points:
- Follow Zig naming conventions
- Write tests for new features
- Maintain backward compatibility
- Document complex optimizations