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

Configure EVM through compile-time parameters:

```zig
const config = EvmConfig{
    .frame_config = .{
        .stack_size = 1024,
        .WordType = u256,
        .max_bytecode_size = 24576,
        .block_gas_limit = 30_000_000,
        .has_database = true,
        .TracerType = NoOpTracer,
    },
    .max_call_depth = 1024,
    .planner_strategy = .minimal,
};
const EvmType = Evm(config);
```

## Usage

Initialize and execute:

```zig
// Create database
var memory_db = evm.MemoryDatabase.init(allocator);
defer memory_db.deinit();

// Create EVM
const EvmType = evm.Evm(.{});
var vm = try EvmType.init(allocator, memory_db.database(), context, block_info);
defer vm.deinit();

// Deploy contract
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

## Plan Interface

Unified interface enables same frame interpreter code to work with different plan implementations (minimal, advanced, debug). Provides zero-cost abstraction across optimization strategies.

### Interface Methods

```zig
pub fn getMetadata(self: *const Self, idx: *InstructionIndexType, comptime opcode: anytype) MetadataType
pub fn getNextInstruction(self: *const Self, idx: *InstructionIndexType, comptime opcode: anytype) *const HandlerFn
pub fn isValidJumpDest(self: *const Self, pc: PcType) bool
```

### Plan Types

**PlanMinimal**: `idx` represents actual PC in bytecode. Reads opcodes directly at runtime. No preprocessing. Minimal memory footprint.

**Plan (Advanced)**: `idx` represents instruction stream index. Pre-processes bytecode into handler pointers with inline metadata. Supports opcode fusion and constant inlining.

### Handler Pattern

Standard opcode handler pattern:

```zig
fn handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
    const self = @as(*Frame, @ptrCast(@alignCast(frame)));
    const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
    const interpreter = @as(*Self, @fieldParentPtr("frame", self));
    
    try self.stack.push(value);
    
    const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .OPCODE);
    return @call(.always_tail, next_handler, .{ self, plan_ptr });
}
```

## Optimizations

### Opcode Fusion
Fuses common patterns: `PUSH + ADD` → `PUSH_ADD_INLINE`, `PUSH + MUL` → `PUSH_MUL_INLINE`, `PUSH + JUMP` → `PUSH_JUMP_INLINE`.

### Constant Inlining
Embeds small constants directly in instruction stream to reduce memory accesses.

### Platform Adaptation
- 64-bit: Larger inline constants, aggressive fusion
- 32-bit: Optimized memory footprint

## Tracing

Available tracer implementations:

- `NoOpTracer`: Zero overhead for production
- `DebuggingTracer`: Full execution history with breakpoints  
- `LoggingTracer`: Structured logging to stdout
- `FileTracer`: High-performance file output

Configure in Frame:
```zig
.TracerType = DebuggingTracer,
```

## Testing

Run tests:
```bash
zig build test
```

Tests colocated with implementation files.

## Performance Notes

- Cache-conscious design with aligned data structures
- Use `_unsafe` variants when bounds pre-validated
- Memory pooling for allocation reuse
- Branch hints on critical paths

## Building

Standard Zig build:
```bash
zig build
zig build test
zig build bench
```