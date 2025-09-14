# Dispatch System Architecture

## Overview

The dispatch system is the heart of Guillotine's performance advantage. Instead of interpreting bytecode instruction-by-instruction like traditional EVMs, we **preprocess bytecode into a dispatch schedule** - a linear array of function pointers and inline metadata that executes via tail calls.

## Traditional Interpreter vs Dispatch-Based Execution

### Traditional Interpreter (MinimalEvm)
```zig
// Simplified MinimalEvm execution loop
pub fn execute(self: *Self) !void {
    while (self.pc < self.bytecode.len) {
        const opcode = self.bytecode[self.pc];
        switch (opcode) {
            0x01 => { // ADD
                const a = self.popStack();
                const b = self.popStack();
                self.pushStack(a + b);
                self.pc += 1;
            },
            0x56 => { // JUMP
                const dest = self.popStack();
                if (!isValidJumpDest(dest)) return error.InvalidJump;
                self.pc = dest;
            },
            // ... 256+ cases ...
        }
    }
}
```

**Problems:**
- Giant switch statement (poor branch prediction)
- PC-based execution (sequential bytecode reads)
- Runtime validation on every jump
- Gas calculation per instruction
- Cache misses from bytecode reads

### Dispatch-Based Execution (Frame)
```zig
// Dispatch schedule execution
pub fn execute(frame: *Frame, cursor: [*]const Dispatch.Item) !noreturn {
    // Direct function pointer call - no switch!
    return cursor[0].opcode_handler(frame, cursor);
}

// Each handler tail-calls the next
pub fn add(self: *Frame, cursor: [*]const Dispatch.Item) !noreturn {
    const a = self.stack.pop_unsafe();  // Pre-validated, no checks
    const b = self.stack.peek_unsafe();
    self.stack.set_top_unsafe(a +% b);

    // Tail call to next handler
    const next = cursor + 2;  // Skip current handler + any metadata
    return @call(.always_tail, next[0].opcode_handler, .{self, next});
}
```

**Advantages:**
- No switch statement (direct function calls)
- Perfect branch prediction (linear execution)
- Pre-validated jumps (no runtime checks)
- Gas batched per basic block
- Data inlined in schedule (no bytecode reads)

## Dispatch Schedule Structure

### Schedule Items
```zig
pub const Item = union(enum) {
    opcode_handler: *const fn(*Frame, [*]const Item) Error!noreturn,
    jump_dest: JumpDestMetadata,      // Gas cost, stack requirements
    push_inline: PushInlineMetadata,  // Values ≤8 bytes
    push_pointer: PushPointerMetadata,// Values >8 bytes (pointer to u256 storage)
    pc: PcMetadata,                   // PC instruction value
    jump_static: JumpStaticMetadata, // Pre-resolved jump destination
    first_block_gas: FirstBlockMetadata, // Gas for entire basic block
};
```

### Example: Bytecode to Schedule Transformation

**Bytecode:**
```
[0x60, 0x05, 0x60, 0x03, 0x01, 0x56, 0x5b, 0x00]
 PUSH1  5    PUSH1  3    ADD   JUMP  JUMPDEST STOP
```

**Traditional Execution:**
```
PC=0: Read 0x60, push handler, read immediate 0x05, push to stack
PC=2: Read 0x60, push handler, read immediate 0x03, push to stack
PC=4: Read 0x01, add handler, pop 2, push result
PC=5: Read 0x56, jump handler, pop dest, validate, set PC
PC=6: Read 0x5b, jumpdest handler, validate, continue
PC=7: Read 0x00, stop handler
```

**Dispatch Schedule:**
```
[0] = first_block_gas { gas: 18 }     // Pre-calculated for block
[1] = &push1_handler                  // Function pointer
[2] = push_inline { value: 5 }        // Data inline, no bytecode read
[3] = &push1_handler
[4] = push_inline { value: 3 }
[5] = &add_handler                    // No metadata needed
[6] = &jump_handler                   // Will use jump table
[7] = &jumpdest_handler
[8] = jump_dest { gas: 0, min: 0, max: 0 } // Validation metadata
[9] = &stop_handler
```

## Jump Handling: The Key Difference

### Traditional Jump (MinimalEvm)
```zig
// JUMP in MinimalEvm - runtime validation every time
0x56 => {
    const dest = try self.popStack();

    // Must validate EVERY jump at runtime
    if (dest >= self.bytecode.len) return error.InvalidJump;
    if (self.bytecode[dest] != 0x5b) return error.InvalidJump;

    self.pc = dest;  // Update PC
}
```

### Dispatch Jump (Frame)
```zig
// JUMP in Frame - pre-validated via jump table
pub fn jump(self: *Frame, cursor: [*]const Dispatch.Item) !noreturn {
    const dest = self.stack.pop_unsafe();

    // Binary search in pre-built jump table (validated once)
    if (self.jump_table.findJumpTarget(dest)) |dispatch| {
        // Direct tail call to destination - no PC update!
        return @call(.always_tail, dispatch.cursor[0].opcode_handler, .{self, dispatch.cursor});
    }
    return error.InvalidJump;
}
```

### Static Jump Optimization
```zig
// Even better: PUSH + JUMP fusion with static resolution
// Bytecode: [0x60, 0x10, 0x56] (PUSH1 16, JUMP)

// Traditional: 3 operations, runtime validation
// Dispatch: Single synthetic opcode!

pub fn jump_to_static_location(self: *Frame, cursor: [*]const Dispatch.Item) !noreturn {
    // No stack operations! Destination pre-resolved at build time
    const jump_dispatch = cursor[1].jump_static.dispatch;
    return @call(.always_tail, jump_dispatch[0].opcode_handler, .{self, jump_dispatch});
}
```

## Opcode Fusion

The dispatch system detects common patterns and replaces them with synthetic opcodes:

### Example: PUSH + MSTORE
```zig
// Bytecode: [0x60, 0x20, 0x52] (PUSH1 32, MSTORE)

// Traditional: 2 operations
// 1. Push 32 to stack
// 2. Pop offset, pop value, store

// Dispatch: Single fused operation
pub fn push_mstore_inline(self: *Frame, cursor: [*]const Dispatch.Item) !noreturn {
    const offset = cursor[1].push_inline.value;  // 32
    const value = self.stack.pop_unsafe();       // Only 1 stack op!
    self.memory.store_word(offset, value);

    return @call(.always_tail, cursor[2].opcode_handler, .{self, cursor + 2});
}
```

## Gas Optimization: Basic Block Batching

Instead of checking gas per instruction, we calculate gas for entire basic blocks:

```zig
// JUMPDEST marks basic block boundaries
pub fn jumpdest(self: *Frame, cursor: [*]const Dispatch.Item) !noreturn {
    const metadata = cursor[1].jump_dest;

    // Single gas check for entire block!
    self.gas_remaining -= metadata.gas;
    if (self.gas_remaining < 0) return error.OutOfGas;

    // Also validates stack requirements for block
    if (self.stack.size() < metadata.min_stack) return error.StackUnderflow;
    if (self.stack.size() + metadata.max_stack > 1024) return error.StackOverflow;

    return @call(.always_tail, cursor[2].opcode_handler, .{self, cursor + 2});
}
```

## Building the Dispatch Schedule

The `Dispatch.init()` function transforms bytecode into a schedule:

1. **First Pass**: Analyze bytecode
   - Calculate gas for basic blocks
   - Identify JUMPDEST locations
   - Detect fusion patterns
   - Build jump table

2. **Schedule Generation**: Create dispatch items
   - Convert opcodes to handler pointers
   - Inline small PUSH values
   - Store large values in deduplicated storage
   - Add metadata items

3. **Jump Resolution**: Link jumps
   - Build sorted JUMPDEST table
   - Resolve static jumps to dispatch pointers
   - Create binary-searchable jump table

## Performance Impact

### Branch Prediction
- **Traditional**: Unpredictable switch branches (256+ cases)
- **Dispatch**: Perfect prediction (linear tail calls)

### Cache Efficiency
- **Traditional**: Random bytecode access, cache misses
- **Dispatch**: Sequential schedule access, prefetch-friendly

### Validation Overhead
- **Traditional**: Runtime validation on every jump
- **Dispatch**: One-time validation during preprocessing

### Gas Checking
- **Traditional**: Per-instruction overhead
- **Dispatch**: Per-basic-block (10-100x fewer checks)

## Debugging Considerations

The dispatch model requires special handling for debugging:

1. **No PC in Frame**: Cursor position doesn't map to bytecode PC
2. **Schedule != Bytecode**: Schedule has metadata items
3. **Fusion Mapping**: One synthetic op = multiple bytecode ops
4. **Tracer Sync**: MinimalEvm must execute N steps for fused ops

See `src/tracer/CLAUDE.md` for tracer synchronization details.

## Key Takeaways

1. **Dispatch is NOT interpretation** - it's compiled execution via function pointers
2. **Preprocessing is key** - one-time cost for repeated execution benefit
3. **Tail calls are critical** - enables linear execution without call stack growth
4. **Metadata inlining** - no bytecode reads during execution
5. **Pre-validation** - safety checks done once, not every execution