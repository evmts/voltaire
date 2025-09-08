# Bytecode Preprocessor

Advanced bytecode preprocessing and optimization system for maximizing EVM execution performance through dispatch optimization, instruction fusion, and jump table generation.

## Overview

The preprocessor module transforms raw EVM bytecode into highly optimized dispatch schedules, enabling Guillotine to achieve superior performance through compile-time analysis and runtime optimization. It implements sophisticated bytecode analysis, instruction fusion, and jump table generation.

## Components

### Core Processing

- **`dispatch.zig`** - Main dispatch schedule generation and optimization
- **`dispatch_item.zig`** - Individual dispatch item definitions and utilities
- **`dispatch_metadata.zig`** - Metadata structures for dispatch optimization
- **`dispatch_test.zig`** - Comprehensive testing suite for dispatch functionality

### Specialized Modules

- **`dispatch_jump_table.zig`** - Jump table generation and management
- **`dispatch_jump_table_builder.zig`** - Builder pattern for jump table construction
- **`dispatch_opcode_data.zig`** - Opcode-specific data extraction and handling
- **`dispatch_pretty_print.zig`** - Human-readable dispatch schedule visualization
- **`dispatch_allocated_memory.zig`** - Memory allocation tracking for dispatch items

## Features

### Bytecode Analysis

- **Complete parsing** - Full bytecode analysis with opcode recognition
- **Jump destination mapping** - Comprehensive JUMPDEST location tracking
- **Control flow analysis** - Static analysis of execution paths
- **Gas cost calculation** - Precise gas cost computation for optimization

### Instruction Fusion

- **Push-operation fusion** - Combine PUSH instructions with following operations
- **Static jump optimization** - Convert dynamic jumps to static when possible
- **Arithmetic optimization** - Fuse common arithmetic patterns
- **Memory access optimization** - Optimize memory operation sequences

### Dispatch Optimization

- O(1) dispatch via prebuilt schedule
- Inline constants for small immediates
- Pointer metadata for large immediates
- Cache‑friendly layout and prefetching

### Jump Table Generation

- Static resolution when possible
- Validation against bytecode bitmaps
- Compact entries with fast lookup used by handlers

## Usage Examples

### Basic Dispatch Generation

```zig
const std = @import("std");
const Dispatch = @import("dispatch.zig").Dispatch;
const Frame = @import("../frame/frame.zig").Frame;

pub fn createDispatch(allocator: std.mem.Allocator, bytecode: []const u8) ![]Dispatch(Frame).Item {
    const opcode_handlers = &frame_handlers.OPCODE_HANDLERS;
    
    // Generate optimized dispatch schedule
    const schedule = try Dispatch(Frame).init(
        allocator,
        bytecode,
        opcode_handlers,
    );
    
    return schedule;
}
```

### Jump Table Creation

```zig
const JumpTable = Dispatch(Frame).JumpTable;

pub fn createJumpTable(
    allocator: std.mem.Allocator,
    schedule: []const Dispatch(Frame).Item,
    bytecode: []const u8,
) !JumpTable {
    return try Dispatch(Frame).createJumpTable(
        allocator,
        schedule,
        bytecode,
    );
}
```

### Dispatch Execution

```zig
pub fn executeWithDispatch(
    frame: *Frame,
    schedule: []const Dispatch(Frame).Item,
) !void {
    var dispatch = Dispatch(Frame){
        .cursor = schedule.ptr,
    };
    
    while (true) {
        const item = dispatch.cursor[0];
        dispatch.cursor += 1;
        
        switch (item) {
            .opcode_handler => |handler| {
                try handler(frame, dispatch.cursor);
                // Handler is responsible for advancing cursor
            },
            .jump_dest => |metadata| {
                // Handle jump destination metadata
                frame.gas.consume(metadata.gas) catch return error.OutOfGas;
            },
            .push_inline => |metadata| {
                try frame.stack.append(@intCast(metadata.value));
                dispatch.cursor += 1;
            },
            .push_pointer => |metadata| {
                try frame.stack.append(metadata.value.*);
                dispatch.cursor += 1;
            },
        }
    }
}
```

### Instruction Fusion

```zig
// Example of PUSH1 + ADD fusion
const FusionType = enum { push_add, push_mul, push_sub };

fn handleFusionOperation(
    schedule_items: *ArrayList(Item),
    allocator: std.mem.Allocator,
    value: u256,
    fusion_type: FusionType,
) !void {
    // Generate fused instruction
    const synthetic_handler = getSyntheticHandler(fusion_type);
    try schedule_items.append(.{ .opcode_handler = synthetic_handler });
    
    // Add value metadata
    if (value <= std.math.maxInt(u64)) {
        try schedule_items.append(.{ 
            .push_inline = .{ .value = @intCast(value) }
        });
    } else {
        const value_ptr = try allocator.create(u256);
        value_ptr.* = value;
        try schedule_items.append(.{ 
            .push_pointer = .{ .value = value_ptr }
        });
    }
}
```

### Gas Cost Optimization

```zig
pub fn calculateFirstBlockGas(bytecode: []const u8) u64 {
    var gas: u64 = 0;
    var iter = bytecode.createIterator();
    const opcode_info = @import("../opcodes/opcode_data.zig").OPCODE_INFO;
    
    while (iter.next()) |op_data| {
        switch (op_data) {
            .regular => |data| {
                const gas_cost = opcode_info[data.opcode].gas_cost;
                gas = std.math.add(u64, gas, gas_cost) catch gas;
                
                // Stop at control flow instructions
                switch (data.opcode) {
                    0x56, 0x57, 0x00, 0xf3, 0xfd, 0xfe, 0xff => return gas,
                    else => {},
                }
            },
            .push => |data| {
                const push_opcode = 0x60 + data.size - 1;
                const gas_cost = opcode_info[push_opcode].gas_cost;
                gas = std.math.add(u64, gas, gas_cost) catch gas;
            },
            .jumpdest => return gas,
            else => gas += 6, // Default cost
        }
    }
    
    return gas;
}
```

## API Reference

### Dispatch Types

#### Main Dispatch

```zig
pub fn Dispatch(comptime FrameType: type) type {
    return struct {
        cursor: [*]const Item,
        
        pub const Item = union(enum) {
            opcode_handler: OpcodeHandler,
            jump_dest: JumpDestMetadata,
            push_inline: PushInlineMetadata,
            push_pointer: PushPointerMetadata,
            pc: PcMetadata,
            jump_static: JumpStaticMetadata,
            first_block_gas: FirstBlockMetadata,
        };
    };
}
```

#### Metadata Types

- `JumpDestMetadata` - Jump destination information and gas costs
- `PushInlineMetadata` - Small values embedded directly in dispatch
- `PushPointerMetadata` - Large values stored as heap pointers
- `PcMetadata` - Program counter values for PC instruction
- `JumpStaticMetadata` - Static jump destination pointers

### Core Functions

- `init()` - Create optimized dispatch schedule from bytecode
- `createJumpTable()` - Generate jump table for efficient JUMPDEST lookup
- `calculateFirstBlockGas()` - Compute gas cost for initial execution block
- `getOpData()` - Extract opcode-specific data from dispatch cursor

### Optimization Features

#### Instruction Fusion Types

- `push_add_fusion` - PUSH followed by ADD
- `push_mul_fusion` - PUSH followed by MUL
- `push_sub_fusion` - PUSH followed by SUB
- `push_div_fusion` - PUSH followed by DIV
- `push_and_fusion` - PUSH followed by AND
- `push_or_fusion` - PUSH followed by OR
- `push_xor_fusion` - PUSH followed by XOR
- `push_jump_fusion` - PUSH followed by JUMP (static jumps)
- `push_jumpi_fusion` - PUSH followed by JUMPI (conditional static jumps)

## Important Considerations

### Memory Management

- **Pointer ownership** - Push pointer metadata owns heap-allocated values
- **Cleanup responsibility** - Caller must free dispatch schedule memory
- **Value lifetime** - Pointer values must outlive dispatch schedule usage
- **Allocation tracking** - Optional memory allocation tracking for debugging

### Performance Optimization

- **Single-pass analysis** - Bytecode is analyzed only once during preprocessing
- **Cache-friendly access** - Sequential memory access patterns for dispatch
- **Minimal overhead** - Optimized for high-frequency execution paths
- **Static resolution** - Maximum resolution at preprocessing time

### Validation and Safety

- **Jump validation** - All jump destinations are validated during preprocessing
- **Gas calculation accuracy** - Precise gas cost computation prevents underflow
- **Error propagation** - Preprocessing errors are properly propagated
- **Runtime safety** - Invalid operations result in proper error handling

### Advanced Features

- **Forward reference resolution** - Handles forward jumps without second pass
- **Fusion pattern recognition** - Automatic detection of fusable instruction patterns
- **Binary search optimization** - Efficient jump table lookup implementation
- **Pretty printing** - Human-readable dispatch schedule visualization

## Testing and Validation

The preprocessor includes extensive tests covering:

- **Unit tests** - Individual component functionality
- **Integration tests** - End-to-end bytecode processing
- **Fuzzing tests** - Robustness against malformed bytecode
- **Performance benchmarks** - Optimization effectiveness measurement

## Development Workflow

1. **Parse** - Analyze raw bytecode structure and opcodes
2. **Optimize** - Apply instruction fusion and static analysis
3. **Generate** - Create optimized dispatch schedule
4. **Validate** - Verify jump destinations and gas calculations
5. **Execute** - Use preprocessed schedule for high-performance execution

The preprocessor is a critical component enabling Guillotine's exceptional performance, transforming bytecode analysis from a runtime cost to a one-time preprocessing step that enables optimal execution performance.
