# EVM Module

High-performance Ethereum Virtual Machine implementation in Zig.

## Synopsis

```zig
const evm_config = EvmConfig{
    .max_call_depth = 1024,
    .frame_config = .{ .stack_size = 1024, .has_database = true },
    .planner_strategy = .minimal,
};
const EvmType = Evm(evm_config);
```

## Description

Implements EVM bytecode execution with configurable components and optimization strategies. Features cache-conscious data structures, pointer-based stack operations, and platform-specific optimizations.

## Components

### EVM (`evm.zig`)
Transaction-level execution orchestrator. Manages call stack, state journaling, Host integration, access list tracking (EIP-2929), and contract lifecycle.

### Frame (`frame.zig`)
Opcode execution context. Handles stack operations, arithmetic, memory operations, storage access via database interface, hashing, and logging. Does not manage PC tracking, jumps, or calls.

### Stack (`stack.zig`)
Pointer-based 256-bit word stack. Features downward growth, cache alignment, configurable size (default 1024), safe and unsafe operation variants.

### Memory (`memory.zig`)
EVM-compliant byte-addressable memory. Supports lazy expansion with word-boundary alignment, hierarchical checkpoints for nested calls, integrated gas calculation.

### Planner (`planner.zig`)
Bytecode analysis and optimization. Validates jump destinations, performs opcode fusion, constant inlining, platform-specific optimizations. Supports minimal, advanced, and debug strategies.

### Frame Interpreter (`frame_interpreter.zig`)
Unified execution engine. Works with different plan strategies through single codebase. Uses tail-call execution model with zero-cost abstraction.

### Database Interface (`database_interface.zig`)
Type-safe storage abstraction. VTable-based polymorphism with zero overhead. Supports accounts, storage, transient storage. Pluggable backends.

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

## Unified Plan Interface

The EVM uses a unified interface pattern that allows the same frame interpreter code to work with different plan implementations (minimal, advanced, debug). This achieves zero-cost abstraction while supporting different optimization strategies.

### How It Works

All plan types implement the same core interface:

```zig
// Common interface methods all plans must implement
pub fn getMetadata(self: *const Self, idx: *InstructionIndexType, comptime opcode: anytype) MetadataType
pub fn getNextInstruction(self: *const Self, idx: *InstructionIndexType, comptime opcode: anytype) *const HandlerFn
pub fn isValidJumpDest(self: *const Self, pc: PcType) bool
```

### Key Differences Between Plans

**PlanMinimal**:
- `idx` represents the actual PC (program counter) in bytecode
- Reads opcodes and data directly from bytecode at runtime
- No preprocessing or optimization
- Minimal memory footprint

**Plan (Advanced)**:
- `idx` represents an index into an optimized instruction stream
- Pre-processes bytecode into handler pointers + inline metadata
- Supports opcode fusion and constant inlining
- PC to instruction index mapping for jumps

### Handler Pattern

All opcode handlers follow the same pattern regardless of plan type:

```zig
fn handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
    const self = @as(*Frame, @ptrCast(@alignCast(frame)));
    const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
    const interpreter = @as(*Self, @fieldParentPtr("frame", self));
    
    // Execute opcode operation
    try self.stack.push(value);
    
    // Get next handler - works with any plan type
    const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .OPCODE);
    return @call(.always_tail, next_handler, .{ self, plan_ptr });
}
```

This design enables:
- Single interpreter implementation for all strategies
- Runtime selection of optimization level
- Easy addition of new plan strategies
- Zero overhead through compile-time dispatch

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