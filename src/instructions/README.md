# Instructions Module

## Overview

The Instructions module contains the complete implementation of EVM opcodes organized into semantic handler groups. Each handler file provides optimized implementations of related EVM operations with consistent interfaces and performance characteristics.

This module implements the full EVM instruction set according to the Ethereum Yellow Paper specification, with handlers organized by functional categories for maintainability and efficient dispatch.

## Core Components

### Handler Files

- **`handlers_arithmetic.zig`** - Arithmetic operations (ADD, MUL, SUB, DIV, MOD, EXP, etc.)
- **`handlers_bitwise.zig`** - Bitwise logic operations (AND, OR, XOR, NOT, SHL, SHR, SAR, BYTE)
- **`handlers_comparison.zig`** - Comparison operations (LT, GT, SLT, SGT, EQ, ISZERO)
- **`handlers_context.zig`** - Environment and context queries (ADDRESS, BALANCE, CALLER, etc.)
- **`handlers_jump.zig`** - Control flow operations (JUMP, JUMPI, JUMPDEST, PC)
- **`handlers_keccak.zig`** - Cryptographic hash operations (KECCAK256)
- **`handlers_log.zig`** - Event logging operations (LOG0, LOG1, LOG2, LOG3, LOG4)
- **`handlers_memory.zig`** - Memory operations (MLOAD, MSTORE, MSTORE8, MSIZE)
- **`handlers_stack.zig`** - Stack manipulation operations (PUSH1-32, POP, DUP1-16, SWAP1-16)
- **`handlers_storage.zig`** - Persistent storage operations (SLOAD, SSTORE, TLOAD, TSTORE)
- **`handlers_system.zig`** - System operations (CALL, CREATE, RETURN, REVERT, SELFDESTRUCT)

### Synthetic Variants

Several handler files include synthetic variants optimized for specific execution contexts:
- **`handlers_arithmetic_synthetic.zig`** - Optimized arithmetic for synthetic execution
- **`handlers_bitwise_synthetic.zig`** - Optimized bitwise operations 
- **`handlers_jump_synthetic.zig`** - Optimized jump handling
- **`handlers_memory_synthetic.zig`** - Optimized memory access patterns

## Key Data Structures

### Handler Function Signature
```zig
pub fn opcode_handler(
    self: *FrameType, 
    cursor: [*]const Dispatch.Item
) Error!noreturn {
    // Opcode implementation
    // Tail call to next instruction
    return @call(.always_tail, next_cursor[0].opcode_handler, .{ self, next_cursor });
}
```

### Handler Registration
```zig
pub fn Handlers(comptime FrameType: type) type {
    return struct {
        pub const Error = FrameType.Error;
        pub const Dispatch = FrameType.Dispatch;
        pub const WordType = FrameType.WordType;
        
        // Handler implementations...
    };
}
```

### Dispatch Integration
Handlers integrate with the dispatch system through:
- Cursor-based execution chains
- Tail call optimization
- Type-safe opcode binding

## Performance Considerations

### Tail Call Optimization
All handlers use Zig's tail call optimization to eliminate function call overhead:
```zig
const next_cursor = cursor + 1;
return @call(.always_tail, next_cursor[0].opcode_handler, .{ self, next_cursor });
```

### Stack Validation
Handlers use assertion-based validation for performance:
```zig
std.debug.assert(self.stack.size() >= 2); // Required stack items
const b = self.stack.pop_unsafe(); // No bounds checking in release
```

### Memory Alignment  
Critical data structures maintain proper alignment for optimal memory access patterns.

### Branch Prediction
Handler organization minimizes branch mispredictions through:
- Consistent control flow patterns
- Predictable error handling paths
- Optimized common case execution

## Usage Examples

### Basic Arithmetic Handler
```zig
/// ADD opcode (0x01) - Addition with overflow wrapping
pub fn add(self: *FrameType, cursor: [*]const Dispatch.Item) Error!noreturn {
    std.debug.assert(self.stack.size() >= 2);
    const b = self.stack.pop_unsafe(); // Second operand
    const a = self.stack.peek_unsafe(); // First operand  
    const result = a +% b; // Wrapping addition
    self.stack.set_top_unsafe(result);
    const next_cursor = cursor + 1;
    return @call(.always_tail, next_cursor[0].opcode_handler, .{ self, next_cursor });
}
```

### Memory Operation Handler
```zig
/// MSTORE opcode (0x52) - Store word to memory (EVM expansion semantics)
pub fn mstore(self: *FrameType, cursor: [*]const Dispatch.Item) Error!noreturn {
    std.debug.assert(self.stack.size() >= 2);
    const offset = self.stack.pop_unsafe();
    const value = self.stack.pop_unsafe();

    // Charge memory expansion gas (32 bytes) and store using EVM helpers
    const end = @as(usize, @intCast(offset)) + 32;
    const cost = self.memory.get_expansion_cost(@as(u24, @intCast(end)));
    self.gas_remaining -= @intCast(cost);
    if (self.gas_remaining < 0) return Error.OutOfGas;

    self.memory.set_u256_evm(self.getAllocator(), @as(u24, @intCast(offset)), @as(u256, value)) catch {
        return Error.AllocationError;
    };

    const next_cursor = cursor + 1;
    return @call(.always_tail, next_cursor[0].opcode_handler, .{ self, next_cursor });
}
```

### Control Flow Handler
```zig
/// JUMPI opcode (0x57) - Conditional jump  
pub fn jumpi(self: *FrameType, cursor: [*]const Dispatch.Item) Error!noreturn {
    std.debug.assert(self.stack.size() >= 2);
    const dest = self.stack.pop_unsafe();
    const condition = self.stack.pop_unsafe();
    
    if (condition != 0) {
        // Validate jump destination
        if (!self.jump_table.is_valid_dest(dest)) {
            return Error.InvalidJumpDestination;
        }
        // Jump to destination
        const jump_cursor = self.dispatch.get_cursor_at(dest);
        return @call(.always_tail, jump_cursor[0].opcode_handler, .{ self, jump_cursor });
    } else {
        // Continue to next instruction
        const next_cursor = cursor + 1;
        return @call(.always_tail, next_cursor[0].opcode_handler, .{ self, next_cursor });
    }
}
```

## Handler Categories

### Arithmetic Handlers (0x01-0x0B)
- Basic operations: ADD, MUL, SUB, DIV, MOD
- Signed operations: SDIV, SMOD
- Modular arithmetic: ADDMOD, MULMOD
- Advanced: EXP (exponentiation), SIGNEXTEND

### Bitwise Handlers (0x16-0x1D)
- Logic operations: AND, OR, XOR, NOT
- Byte operations: BYTE (extract byte from word)
- Shift operations: SHL, SHR, SAR (arithmetic shift)

### Comparison Handlers (0x10-0x15)
- Unsigned comparison: LT, GT, EQ
- Signed comparison: SLT, SGT
- Boolean operations: ISZERO

### Stack Handlers (0x50, 0x60-0x7F, 0x80-0x8F, 0x90-0x9F)
- Stack removal: POP
- Push operations: PUSH1-PUSH32
- Duplication: DUP1-DUP16  
- Swapping: SWAP1-SWAP16

### Memory Handlers (0x51-0x59)
- Word operations: MLOAD, MSTORE
- Byte operations: MSTORE8
- Size queries: MSIZE
- Data copying: CALLDATACOPY, CODECOPY, RETURNDATACOPY

### Storage Handlers (0x54-0x55, EIP-1153)
- Persistent storage: SLOAD, SSTORE
- Transient storage: TLOAD, TSTORE (EIP-1153)

### System Handlers (0xF0-0xFF)
- Contract creation: CREATE, CREATE2
- External calls: CALL, STATICCALL, DELEGATECALL, CALLCODE
- Execution termination: RETURN, REVERT, SELFDESTRUCT

## Error Handling

Handler errors are propagated through the execution chain with specific error types:
- `StackOverflow`/`StackUnderflow` - Stack constraint violations
- `InvalidJumpDestination` - Invalid JUMP/JUMPI targets
- `OutOfGas` - Insufficient gas for operation
- `StaticViolation` - State modification in static context
- `InvalidOpcode` - Unrecognized instruction

All handlers maintain clean error propagation with proper resource cleanup through defer patterns.

## Integration Notes

### With Frame Module
Handlers receive frame context and manipulate:
- Stack state through safe/unsafe operations
- Memory through expansion and access APIs  
- Storage through database interface
- Gas accounting through frame gas tracker

### With Dispatch Module
Handlers integrate with dispatch through:
- Cursor-based instruction iteration
- Tail call chaining for performance
- Type-safe opcode binding

### With Opcodes Module
Handler binding relies on opcode definitions for:
- Instruction identification
- Gas cost lookup
- Validation requirements
