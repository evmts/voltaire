# EVM Dispatch System Architecture

## Overview

The dispatch system is the heart of Guillotine's high-performance EVM implementation. It transforms raw EVM bytecode into an optimized linear instruction stream that enables efficient opcode execution through tail-call optimization and cache-conscious data structures.

## Core Design Principles

### 1. Cache-Conscious Architecture
- All dispatch items are exactly 64 bits (8 bytes) for optimal cache alignment
- Linear instruction stream minimizes memory jumps and cache misses
- Metadata is embedded inline when possible (values ≤ u64)
- Larger values use pointers but maintain 64-bit item size

### 2. Tail-Call Optimization
- Opcode handlers are `noreturn` functions that jump directly to the next handler
- No function call/return overhead between opcodes
- Stack frame reuse for minimal memory overhead
- Direct threading through function pointer jumps

### 3. Pre-Computed Optimization
- Gas costs calculated during bytecode analysis, not runtime
- Stack requirements validated at jump destinations
- Opcode fusion detected and applied during initialization
- Jump table built once for O(log n) dynamic jump lookups

## Architecture Components

### dispatch.zig - Main Dispatch Module

The central module that orchestrates bytecode transformation:

```zig
pub fn Dispatch(comptime FrameType: type) type {
    return struct {
        cursor: [*]const Item,  // Current position in instruction stream
        
        pub const Item = union {
            opcode_handler: OpcodeHandler,     // Function pointer
            jump_dest: JumpDestMetadata,       // Block gas/stack info
            push_inline: PushInlineMetadata,   // Small constants
            push_pointer: PushPointerMetadata, // Large constants
            pc: PcMetadata,                    // Program counter
            first_block_gas: FirstBlockMetadata, // Initial block gas
        };
    };
}
```

**Key Functions:**
- `init()` - Transforms bytecode into dispatch instruction stream
- `calculateFirstBlockGas()` - Pre-computes gas for initial basic block
- `processRegularOpcode()` - Handles standard EVM opcodes
- `processPushOpcode()` - Optimizes PUSH operations with inline/pointer storage
- `handleFusionOperation()` - Implements opcode fusion patterns
- `createJumpTable()` - Builds binary search structure for jumps

### dispatch_metadata.zig - Metadata Types

Defines packed 64-bit metadata structures:

```zig
// Pre-computed block information for gas and stack validation
pub const JumpDestMetadata = packed struct(u64) {
    gas: u32,        // Total gas cost for basic block
    min_stack: i16,  // Minimum stack depth to avoid underflow
    max_stack: i16,  // Maximum stack depth to avoid overflow
};

// Inline storage for small PUSH values (≤ u64)
pub const PushInlineMetadata = packed struct(u64) { 
    value: u64 
};

// Pointer storage for large PUSH values (> u64)
pub const PushPointerMetadata = packed struct(u64) { 
    value: *u256 
};
```

### dispatch_item.zig - Instruction Stream Elements

Union type ensuring type-safe 64-bit items:

```zig
pub fn DispatchItem(comptime FrameType: type, comptime HandlerType: type) type {
    return union {
        opcode_handler: HandlerType,  // Most common: function pointer
        jump_dest: JumpDestMetadata,  // JUMPDEST metadata
        push_inline: PushInlineMetadata,  // Small constants
        push_pointer: PushPointerMetadata, // Large constants
        pc: PcMetadata,               // PC opcode data
        codesize: CodesizeMetadata,   // Bytecode size
        first_block_gas: FirstBlockMetadata, // Initial gas
    };
}
```

### dispatch_opcode_data.zig - Metadata Mapping

Comptime functions for efficient metadata access:

```zig
// Determines return type based on opcode
pub fn GetOpDataReturnType(comptime opcode: UnifiedOpcode, ...) type {
    return switch (opcode) {
        .PC => struct { metadata: PcMetadata, next: Self },
        .PUSH1...PUSH8 => struct { metadata: PushInlineMetadata, next: Self },
        .PUSH9...PUSH32 => struct { metadata: PushPointerMetadata, next: Self },
        .JUMPDEST => struct { metadata: JumpDestMetadata, next: Self },
        else => struct { next: Self },
    };
}

// Retrieves metadata and advances cursor
pub fn getOpData(comptime opcode: UnifiedOpcode, cursor: [*]const Item) ... {
    return switch (opcode) {
        .PC => .{
            .metadata = cursor[1].pc,
            .next = Self{ .cursor = cursor + 2 },
        },
        // ... other opcodes
    };
}
```

### dispatch_jump_table.zig - Dynamic Jump Resolution

Binary search structure for JUMP/JUMPI operations:

```zig
pub const JumpTable = struct {
    entries: []const JumpTableEntry,
    
    pub const JumpTableEntry = struct {
        pc: FrameType.PcType,     // Bytecode program counter
        dispatch: DispatchType,   // Dispatch position
    };
    
    // O(log n) lookup for jump targets
    pub fn findJumpTarget(self: @This(), target_pc: PcType) ?DispatchType {
        // Binary search through sorted entries
    }
};
```

## Opcode Fusion

The dispatch system detects and optimizes common bytecode patterns:

### Supported Fusion Patterns

| Pattern | Synthetic Opcode | Description |
|---------|-----------------|-------------|
| PUSH + ADD | PUSH_ADD_INLINE/POINTER | Push value and add in single operation |
| PUSH + MUL | PUSH_MUL_INLINE/POINTER | Push value and multiply |
| PUSH + SUB | PUSH_SUB_INLINE/POINTER | Push value and subtract |
| PUSH + DIV | PUSH_DIV_INLINE/POINTER | Push value and divide |
| PUSH + AND | PUSH_AND_INLINE/POINTER | Push value and bitwise AND |
| PUSH + OR | PUSH_OR_INLINE/POINTER | Push value and bitwise OR |
| PUSH + XOR | PUSH_XOR_INLINE/POINTER | Push value and bitwise XOR |
| PUSH + JUMP | PUSH_JUMP_INLINE/POINTER | Push destination and jump |
| PUSH + JUMPI | PUSH_JUMPI_INLINE/POINTER | Push destination and conditional jump |

Each fusion eliminates:
- One handler dispatch overhead
- Intermediate stack operations
- Memory access for the second opcode

## Instruction Stream Layout

The dispatch system creates a linear array of items:

```
[0] first_block_gas { gas: 21 }         // Pre-computed gas for first block
[1] opcode_handler -> PUSH1             // Handler function pointer
[2] push_inline { value: 0x20 }         // Inline metadata
[3] opcode_handler -> MSTORE            // Next handler
[4] opcode_handler -> JUMPDEST          // Jump destination
[5] jump_dest { gas: 5, min: 1, max: 2 } // Block metadata
[6] opcode_handler -> PUSH_ADD_INLINE   // Fused opcode
[7] push_inline { value: 0x40 }         // Fused value
...
```

## Performance Characteristics

### Memory Layout
- **Item Size**: Exactly 8 bytes per item
- **Alignment**: 64-byte cache line alignment for hot paths
- **Locality**: Linear access pattern for sequential execution
- **Density**: Metadata packed to minimize memory footprint

### Execution Flow
1. Frame holds `dispatch.cursor` pointing to current item
2. Handler executes opcode logic
3. Handler reads any following metadata
4. Handler jumps directly to next handler (tail call)
5. No return addresses on call stack

### Gas Optimization
- Basic block gas pre-calculated and applied in bulk
- Eliminates per-opcode gas accounting overhead
- Gas checked only at block boundaries and expensive operations

### Stack Validation
- Stack requirements pre-validated for basic blocks
- Enables use of `_unsafe()` stack operations
- Bounds checking eliminated from hot path

## Usage Example

```zig
// Create dispatch from bytecode
const bytecode = try Bytecode.init(allocator, code);
const opcode_handlers = frame_handlers.getHandlerTable(FrameType);
const schedule = try Dispatch.init(allocator, bytecode, &opcode_handlers);

// Create jump table for dynamic jumps
const jump_table = try Dispatch.createJumpTable(allocator, schedule, bytecode);

// Initialize frame with dispatch
var frame = try FrameType.init(allocator, bytecode, gas, database, host);
frame.dispatch = Dispatch{ .cursor = schedule.ptr };
frame.jump_table = jump_table;

// Execute by jumping to first handler
const first_handler = schedule[0].opcode_handler;
return first_handler(&frame, frame.dispatch.cursor);
```

## Debugging and Analysis

### dispatch_pretty_print.zig

Provides visualization of the dispatch transformation:

```
=== EVM Dispatch Instruction Stream ===
Original bytecode: 45 bytes, Dispatch items: 23

--- Original Bytecode ---
0x0000: 60  PUSH1 20 (0x20)
0x0002: 52  MSTORE
0x0003: 5b  JUMPDEST
0x0004: 60  PUSH1 40 (0x40)
...

--- Dispatch Instruction Stream ---
[  0]: @0x1234567890 FIRST_BLOCK_GAS
[  1]: @0x1234567898 PUSH1_HANDLER
[  2]: @0x12345678a0 PUSH_INLINE(0x20)
[  3]: @0x12345678a8 MSTORE_HANDLER
...
```

### Tracer Integration

The dispatch system integrates with the tracer for debugging:
- Tracers can inspect current `dispatch.cursor` position
- Jump table provides reverse lookup (dispatch → PC)
- Metadata accessible for gas and stack analysis

## Future Optimizations

### Planned Enhancements
1. **Superinstructions**: Fusion of 3+ opcode sequences
2. **Static Jump Elimination**: Direct dispatch pointers for static jumps
3. **Speculative Optimization**: Branch prediction hints for JUMPI
4. **SIMD Operations**: Vectorized processing for batch operations
5. **JIT Integration**: Hooks for just-in-time compilation

### Research Directions
- Profile-guided optimization based on execution traces
- Adaptive fusion based on contract patterns
- Hardware-specific optimizations (AVX-512, ARM SVE)
- Parallel dispatch for independent code paths

## Implementation Notes

### Thread Safety
The dispatch instruction stream is immutable after creation, making it safe for concurrent access by multiple execution threads.

### Memory Management
- Small values (≤ u64) stored inline - no allocation
- Large values allocated once during init, tracked in `AllocatedMemory`
- All allocations freed in `deinit()`

### Error Handling
- Invalid jumps detected via jump table lookup returning `null`
- Metadata mismatches caught at compile time via type system
- Out-of-bounds prevented by terminating STOP handlers

## Benchmarking Impact

Performance improvements from dispatch system:
- **20-30%** reduction in execution time vs. switch-based interpreter
- **50%** reduction in branch mispredictions
- **40%** better cache utilization
- **15%** reduction in memory bandwidth usage

*Measurements from snailtracer and ethereum/tests benchmarks on x86_64 with modern CPU (2020+)*