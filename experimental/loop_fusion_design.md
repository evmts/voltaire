# Backward Loop Fusion Design Document

## Overview

This document describes the implementation of backward loop detection and fusion optimization for the Guillotine EVM. The optimization replaces repetitive loop patterns in EVM bytecode with a single synthetic opcode that executes the loop body efficiently in native Zig code, eliminating redundant jump table lookups and gas calculations.

## Problem Statement

EVM loops create inefficiencies through:
1. Repeated JUMPDEST validations
2. Multiple jump table lookups per iteration
3. Per-instruction gas calculations instead of bulk calculations
4. Stack validation on every iteration
5. Dispatch overhead for loop control instructions

## Solution: Loop Fusion

Replace the loop control bytecode pattern with a synthetic `BACKWARD_LOOP_FUSION` opcode that:
- Executes the loop counter management in native code
- Performs bulk gas calculation upfront
- Validates stack requirements once for the entire loop
- Maintains a single dispatch cursor for the loop body
- Eliminates jump table lookups during iteration

## Loop Pattern Detection

### Target Pattern

The backward loop pattern we detect consists of:

```
LOOP_HEADER:
    PUSH <end_value>     // Loop end condition
    DUP2                 // Duplicate counter
    LT/GT/EQ            // Compare
    ISZERO              // Negate for exit condition
    PUSH <exit_pc>      // Exit destination
    JUMPI               // Conditional exit

LOOP_BODY:
    ... operations ...  // Preserved as-is

LOOP_TAIL:
    PUSH <increment>    // Increment value
    ADD                 // Increment counter
    PUSH <loop_header>  // Loop start
    JUMP                // Back jump
```

### Example: Ten Thousand Hashes Loop

From `@src/_test_utils/fixtures/ten-thousand-hashes/bytecode.txt`:

```
PC 0x34: JUMPDEST       // Loop header
PC 0x35: PUSH2 0x4e20   // End value (20,000)
PC 0x38: DUP2           // Duplicate counter
PC 0x39: LT             // Check if counter < 20,000
PC 0x3a: ISZERO         // Negate (jump if counter >= 20,000)
PC 0x3b: PUSH1 0x5e     // Exit destination
PC 0x3d: JUMPI          // Exit if done

// Loop body (26 bytes)
PC 0x3e-0x57: [PUSH1, PUSH1, MSTORE, PUSH1, PUSH1, PUSH1, SHA3]

PC 0x58: PUSH1 0x01     // Increment
PC 0x5a: ADD            // counter++
PC 0x5b: PUSH1 0x34     // Loop header address
PC 0x5d: JUMP           // Back jump

PC 0x5e: JUMPDEST       // Exit point
```

### Bytecode Segments for Replacement

**Loop control bytecode to replace** (17 bytes total):
- Header: `5b 61 4e20 81 10 15 60 5e 57` (9 bytes)
- Tail: `60 01 01 60 34 56` (6 bytes)
- Exit jumpdest: `5b` (1 byte) 
- Plus terminator: `00` (1 byte)

**Loop body to preserve** (26 bytes):
- Bytes 0x3e-0x57 execute unchanged each iteration

## Implementation Architecture

### 1. New Synthetic Opcodes

Add to `@src/opcodes/opcode_synthetic.zig`:

```zig
pub const OpcodeSynthetic = enum(u8) {
    // ... existing opcodes ...
    
    // Loop fusion opcodes (use 0x80-0x8F range)
    BACKWARD_LOOP_ENTRY = 0x80,   // Loop entry point handler
    BACKWARD_LOOP_EXIT = 0x81,    // Loop exit point handler
    
    // Future: forward loops, nested loops
    FORWARD_LOOP_ENTRY = 0x82,
    FORWARD_LOOP_EXIT = 0x83,
};
```

Add to `@src/opcodes/opcode.zig` UnifiedOpcode:

```zig
pub const UnifiedOpcode = enum {
    // ... existing opcodes ...
    
    // Loop fusion opcodes
    BACKWARD_LOOP_ENTRY,
    BACKWARD_LOOP_EXIT,
};
```

### 2. Loop Metadata Structure

Create new metadata type in `@src/preprocessor/dispatch_metadata.zig`:

```zig
pub const LoopMetadata = struct {
    // Loop control parameters
    start_value: u256,           // Initial counter value
    end_value: u256,             // End condition value
    increment: u256,             // Increment per iteration
    comparison: enum { LT, GT, LE, GE, EQ, NE }, // Comparison type
    
    // Dispatch information
    body_start: usize,           // Schedule index of loop body start
    body_length: usize,          // Number of dispatch items in body
    exit_dispatch: *const anyopaque, // Dispatch pointer to exit
    
    // Validation data
    total_gas: u64,             // Total gas for all iterations
    min_stack: u16,             // Minimum stack requirement
    max_stack: u16,             // Maximum stack growth
    
    // Nested loop support
    loop_id: u32,               // Unique loop identifier
    parent_loop_id: ?u32,       // Parent loop ID if nested
};
```

Update `dispatch_item.zig`:

```zig
pub const Item = union(enum) {
    // ... existing items ...
    loop_metadata: LoopMetadata,
};
```

### 3. Loop Detection in Bytecode Analysis

Update `@src/bytecode/bytecode.zig`:

```zig
// Add loop tracking state to BytecodeIterator
pub const BytecodeIterator = struct {
    // ... existing fields ...
    
    // Loop detection state
    loop_stack: ArrayList(LoopCandidate),
    detected_loops: ArrayList(DetectedLoop),
};

const LoopCandidate = struct {
    header_pc: u32,
    end_value: u256,
    comparison: ComparisonOp,
    exit_pc: u32,
    body_start_pc: u32,
};

const DetectedLoop = struct {
    header_pc: u32,
    tail_pc: u32,
    body_slice: []const u8,
    metadata: LoopMetadata,
};

// In createIterator, add loop detection logic
pub fn detectBackwardLoop(self: *BytecodeIterator) ?DetectedLoop {
    // Stack-based pattern matching:
    
    // 1. Detect loop header pattern
    if (self.current_op == .JUMPDEST) {
        const next_ops = self.peekAhead(8);
        if (matchesLoopHeader(next_ops)) {
            // Extract end_value, comparison, exit_pc
            const candidate = LoopCandidate{...};
            self.loop_stack.append(candidate);
        }
    }
    
    // 2. Detect loop tail (backward jump)
    if (self.current_op == .JUMP) {
        const target = self.stack_top();
        // Check if target matches a loop header
        for (self.loop_stack.items) |candidate| {
            if (candidate.header_pc == target) {
                // Found complete loop!
                return DetectedLoop{
                    .header_pc = candidate.header_pc,
                    .tail_pc = self.pc,
                    .body_slice = self.bytecode[candidate.body_start_pc..self.pc-6],
                    .metadata = calculateLoopMetadata(candidate, self),
                };
            }
        }
    }
    
    return null;
}

// Add to OpData enum
pub const OpData = union(enum) {
    // ... existing variants ...
    backward_loop_fusion: struct {
        loop: DetectedLoop,
    },
};
```

### 4. Dispatch Schedule Building

Update `@src/preprocessor/dispatch.zig`:

```zig
// In init() function, handle loop fusion
switch (op_data) {
    // ... existing cases ...
    
    .backward_loop_fusion => |loop_data| {
        // Emit BACKWARD_LOOP_ENTRY handler
        const frame_handlers = @import("../frame/frame_handlers.zig");
        const entry_handler = frame_handlers.getSyntheticHandler(
            FrameType, 
            @intFromEnum(OpcodeSynthetic.BACKWARD_LOOP_ENTRY)
        );
        try schedule_items.append(allocator, .{ .opcode_handler = entry_handler });
        
        // Emit loop metadata
        const loop_meta = LoopMetadata{
            .start_value = 0,  // Or extracted from context
            .end_value = loop_data.loop.metadata.end_value,
            .increment = loop_data.loop.metadata.increment,
            .comparison = loop_data.loop.metadata.comparison,
            .body_start = schedule_items.items.len + 1,
            .body_length = loop_data.loop.body_slice.len / average_opcode_size,
            .exit_dispatch = null, // Resolved later
            .total_gas = calculateLoopGas(loop_data.loop),
            .min_stack = loop_data.loop.metadata.min_stack,
            .max_stack = loop_data.loop.metadata.max_stack,
            .loop_id = allocator.random.int(u32),
            .parent_loop_id = current_loop_id,
        };
        try schedule_items.append(allocator, .{ .loop_metadata = loop_meta });
        
        // Emit loop body opcodes (preserved as normal dispatch items)
        // The body executes through normal tail-call dispatch
        for (parseLoopBody(loop_data.loop.body_slice)) |body_op| {
            try processOpcode(schedule_items, allocator, body_op);
        }
        
        // Emit BACKWARD_LOOP_EXIT handler
        const exit_handler = frame_handlers.getSyntheticHandler(
            FrameType,
            @intFromEnum(OpcodeSynthetic.BACKWARD_LOOP_EXIT)
        );
        try schedule_items.append(allocator, .{ .opcode_handler = exit_handler });
        
        // Store for exit resolution
        try unresolved_loops.append(allocator, .{
            .loop_index = schedule_items.items.len - 2, // Metadata index
            .exit_pc = loop_data.loop.metadata.exit_pc,
        });
    },
}

// After schedule building, resolve loop exits
fn resolveLoopExits(schedule: []Item, unresolved_loops: []UnresolvedLoop) !void {
    for (unresolved_loops) |unresolved| {
        // Find the exit JUMPDEST in schedule
        const exit_dispatch = findJumpDest(schedule, unresolved.exit_pc);
        
        // Update loop metadata with resolved exit
        schedule[unresolved.loop_index].loop_metadata.exit_dispatch = exit_dispatch;
    }
}
```

### 5. Update dispatch_opcode_data.zig

```zig
// In GetOpDataReturnType
.BACKWARD_LOOP_ENTRY => struct { 
    metadata: LoopMetadata, 
    next_handler: OpcodeHandler, 
    next_cursor: Self 
},
.BACKWARD_LOOP_EXIT => struct { 
    loop_entry: *const Item,  // Pointer back to loop entry
    next_handler: OpcodeHandler, 
    next_cursor: Self 
},

// In getOpData
.BACKWARD_LOOP_ENTRY => .{
    .metadata = cursor[1].loop_metadata,
    .next_handler = cursor[2].opcode_handler,  // First body instruction
    .next_cursor = Self{ .cursor = cursor + 2 },
},
.BACKWARD_LOOP_EXIT => .{
    .loop_entry = cursor - cursor[1].loop_metadata.body_length - 2, // Back to entry
    .next_handler = cursor[2].opcode_handler,
    .next_cursor = Self{ .cursor = cursor + 2 },
},
```

### 6. Loop Execution Handlers

Create `@src/instructions/handlers_loop.zig`:

```zig
const std = @import("std");
const log = @import("../log.zig");

pub fn Handlers(comptime FrameType: type) type {
    return struct {
        pub const Error = FrameType.Error;
        pub const Dispatch = FrameType.Dispatch;
        pub const WordType = FrameType.WordType;
        
        // Thread-local loop state for nested loops
        threadlocal var loop_states: [16]LoopState = undefined;
        threadlocal var loop_depth: u8 = 0;
        
        const LoopState = struct {
            counter: WordType,
            end_value: WordType,
            increment: WordType,
            comparison: ComparisonOp,
            iteration: u64,
            entry_cursor: [*]const Dispatch.Item,
        };
        
        /// BACKWARD_LOOP_ENTRY - Initialize loop and check condition
        pub fn backward_loop_entry(self: *FrameType, cursor: [*]const Dispatch.Item) Error!noreturn {
            self.beforeInstruction(.BACKWARD_LOOP_ENTRY, cursor);
            
            const dispatch = Dispatch{ .cursor = cursor };
            const op_data = dispatch.getOpData(.BACKWARD_LOOP_ENTRY);
            const loop_meta = op_data.metadata;
            
            // JUMPDEST responsibilities: bulk gas and stack validation
            // Check gas for all iterations upfront
            self.gas_remaining -= @intCast(loop_meta.total_gas);
            if (self.gas_remaining < 0) {
                log.warn("BACKWARD_LOOP: Out of gas - required={}", .{loop_meta.total_gas});
                self.afterComplete(.BACKWARD_LOOP_ENTRY);
                return Error.OutOfGas;
            }
            
            // Validate stack requirements for entire loop
            const current_stack_size = self.stack.size();
            if (loop_meta.min_stack > 0 and current_stack_size < loop_meta.min_stack) {
                log.warn("BACKWARD_LOOP: Stack underflow - required={}", .{loop_meta.min_stack});
                self.afterComplete(.BACKWARD_LOOP_ENTRY);
                return Error.StackUnderflow;
            }
            
            // Initialize loop counter from stack or metadata
            const counter = if (self.stack.size() > 0) 
                self.stack.pop_unsafe()  // Counter might be on stack
            else 
                loop_meta.start_value;    // Or use default start
            
            // Check loop condition
            const should_enter = evaluateComparison(
                counter, 
                loop_meta.end_value, 
                loop_meta.comparison
            );
            
            if (!should_enter) {
                // Skip to exit
                const exit_dispatch = @ptrCast(*const Dispatch.Item, loop_meta.exit_dispatch);
                self.afterInstruction(.BACKWARD_LOOP_ENTRY, 
                    exit_dispatch[0].opcode_handler, 
                    exit_dispatch);
                return @call(FrameType.getTailCallModifier(), 
                    exit_dispatch[0].opcode_handler, 
                    .{ self, exit_dispatch });
            }
            
            // Enter loop - save state for nested loops
            loop_states[loop_depth] = LoopState{
                .counter = counter,
                .end_value = loop_meta.end_value,
                .increment = loop_meta.increment,
                .comparison = loop_meta.comparison,
                .iteration = 0,
                .entry_cursor = cursor,
            };
            loop_depth += 1;
            
            // Push counter for body to use
            self.stack.push_unsafe(counter);
            
            // Continue to loop body
            self.afterInstruction(.BACKWARD_LOOP_ENTRY, 
                op_data.next_handler, 
                op_data.next_cursor.cursor);
            return @call(FrameType.getTailCallModifier(), 
                op_data.next_handler, 
                .{ self, op_data.next_cursor.cursor });
        }
        
        /// BACKWARD_LOOP_EXIT - Increment and check for next iteration
        pub fn backward_loop_exit(self: *FrameType, cursor: [*]const Dispatch.Item) Error!noreturn {
            self.beforeInstruction(.BACKWARD_LOOP_EXIT, cursor);
            
            // Get current loop state
            const loop_state = &loop_states[loop_depth - 1];
            
            // Pop and increment counter
            _ = self.stack.pop_unsafe(); // Remove old counter
            loop_state.counter +%= loop_state.increment;
            loop_state.iteration += 1;
            
            // Re-evaluate condition
            const dispatch = Dispatch{ .cursor = loop_state.entry_cursor };
            const entry_data = dispatch.getOpData(.BACKWARD_LOOP_ENTRY);
            const loop_meta = entry_data.metadata;
            
            const should_continue = evaluateComparison(
                loop_state.counter,
                loop_state.end_value,
                loop_state.comparison
            );
            
            if (should_continue and loop_state.iteration < 300_000_000) { // Safety limit
                // Back to loop body start
                self.stack.push_unsafe(loop_state.counter);
                
                // Jump back to first body instruction
                const body_start = loop_state.entry_cursor + 2; // Skip handler + metadata
                self.afterInstruction(.BACKWARD_LOOP_EXIT,
                    body_start[0].opcode_handler,
                    body_start);
                return @call(FrameType.getTailCallModifier(),
                    body_start[0].opcode_handler,
                    .{ self, body_start });
            } else {
                // Exit loop
                loop_depth -= 1;
                
                // Jump to exit point
                const exit_dispatch = @ptrCast(*const Dispatch.Item, loop_meta.exit_dispatch);
                self.afterInstruction(.BACKWARD_LOOP_EXIT,
                    exit_dispatch[0].opcode_handler,
                    exit_dispatch);
                return @call(FrameType.getTailCallModifier(),
                    exit_dispatch[0].opcode_handler,
                    .{ self, exit_dispatch });
            }
        }
        
        fn evaluateComparison(a: WordType, b: WordType, op: ComparisonOp) bool {
            return switch (op) {
                .LT => a < b,
                .GT => a > b,
                .LE => a <= b,
                .GE => a >= b,
                .EQ => a == b,
                .NE => a != b,
            };
        }
    };
}
```

### 7. Integration Points

#### Frame Handler Registration

Update `@src/frame/frame_handlers.zig`:

```zig
pub fn getSyntheticHandler(comptime FrameType: type, opcode: u8) OpcodeHandler {
    const handlers = struct {
        // ... existing handlers ...
        const loop_handlers = @import("../instructions/handlers_loop.zig").Handlers(FrameType);
    };
    
    return switch (opcode) {
        // ... existing cases ...
        @intFromEnum(OpcodeSynthetic.BACKWARD_LOOP_ENTRY) => handlers.loop_handlers.backward_loop_entry,
        @intFromEnum(OpcodeSynthetic.BACKWARD_LOOP_EXIT) => handlers.loop_handlers.backward_loop_exit,
        else => unreachable,
    };
}
```

#### Tracer Integration

Update tracer to handle loop opcodes:

```zig
// In executeMinimalEvmForOpcode
.BACKWARD_LOOP_ENTRY => {
    // Execute equivalent MinimalEvm steps:
    // JUMPDEST + PUSH + DUP + comparison + ISZERO + PUSH + JUMPI
    for (0..7) |_| {
        try self.minimal_evm.step();
    }
},
.BACKWARD_LOOP_EXIT => {
    // Execute equivalent MinimalEvm steps:
    // PUSH + ADD + PUSH + JUMP
    for (0..4) |_| {
        try self.minimal_evm.step();
    }
},
```

## Testing Strategy

### 1. Unit Tests

- Loop detection in bytecode analyzer
- Metadata calculation accuracy
- Stack validation for loops
- Gas calculation for iterations

### 2. Differential Tests

Use ten-thousand-hashes fixture:

```zig
test "backward loop fusion - ten thousand hashes" {
    const bytecode = try loadFixture("ten-thousand-hashes/bytecode.txt");
    
    // Execute with fusion
    var frame_with_fusion = try createFrame(bytecode, .{ .enable_loop_fusion = true });
    const result_fusion = try frame_with_fusion.execute();
    
    // Execute without fusion
    var frame_without = try createFrame(bytecode, .{ .enable_loop_fusion = false });
    const result_normal = try frame_without.execute();
    
    // Results must match exactly
    try testing.expectEqual(result_normal.gas_used, result_fusion.gas_used);
    try testing.expectEqual(result_normal.output, result_fusion.output);
    try testing.expectEqual(result_normal.storage, result_fusion.storage);
}
```

### 3. Nested Loop Tests

```zig
test "nested backward loops" {
    // Create bytecode with nested loops
    const nested_loop_bytecode = 
        \\PUSH1 0x00  // Outer counter
        \\JUMPDEST    // Outer loop start
        \\  PUSH1 0x00  // Inner counter
        \\  JUMPDEST    // Inner loop start
        \\    // Inner body
        \\    PUSH1 0x01
        \\    ADD
        \\    DUP1
        \\    PUSH1 0x10
        \\    LT
        \\    PUSH1 [inner_loop]
        \\    JUMPI
        \\  POP         // Clean inner counter
        \\  PUSH1 0x01
        \\  ADD
        \\  DUP1
        \\  PUSH1 0x10
        \\  LT
        \\  PUSH1 [outer_loop]
        \\  JUMPI
        ;
    
    // Both loops should be detected and fused
    const analysis = try analyzeBytecode(nested_loop_bytecode);
    try testing.expectEqual(@as(usize, 2), analysis.detected_loops.len);
}
```

## Performance Expectations

### Ten Thousand Hashes Benchmark

**Without fusion:**
- 20,000 iterations × 11 instructions = 220,000 instruction dispatches
- 20,000 JUMPDEST validations
- 40,000 jump table lookups

**With fusion:**
- 2 synthetic handlers (entry/exit)
- 20,000 iterations × 7 body instructions = 140,000 dispatches
- 1 bulk gas calculation
- 0 jump table lookups during iteration

**Expected improvement:** ~40% reduction in dispatch overhead

## Future Enhancements

1. **Forward Loop Detection** - Detect loops with forward jumps
2. **While Loop Pattern** - Detect while(true) with break patterns
3. **For-Each Pattern** - Detect iteration over storage/memory arrays
4. **Loop Unrolling** - Unroll small loops with known bounds
5. **JIT Compilation** - Compile hot loops to native code
6. **Parallel Loop Execution** - Detect parallelizable loops

## Implementation Checklist

- [ ] Add synthetic opcodes to opcode definitions
- [ ] Create LoopMetadata structure
- [ ] Implement loop detection in bytecode analyzer
- [ ] Add loop handlers to instruction set
- [ ] Update dispatch schedule builder
- [ ] Integrate with dispatch_opcode_data
- [ ] Add tracer support for loop opcodes
- [ ] Create unit tests for detection
- [ ] Create differential tests with fixtures
- [ ] Benchmark performance improvements
- [ ] Document loop fusion in main README

## Conclusion

Backward loop fusion provides significant performance improvements for iterative EVM code by:
1. Reducing dispatch overhead by ~40%
2. Eliminating redundant validations
3. Enabling bulk gas calculations
4. Preserving exact EVM semantics
5. Supporting nested loops

The implementation maintains compatibility with existing code while providing transparent optimization for loop-heavy contracts.