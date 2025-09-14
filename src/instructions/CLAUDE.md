# CLAUDE.md - AI Assistant Context for Instructions Module

## Module Overview

The Instructions module is the **core execution engine** of the EVM implementation. Every EVM opcode is implemented here through handler functions that manipulate the execution frame state (stack, memory, storage, etc.).

**CRITICAL**: This module handles **financial operations** where bugs result in **fund loss**. Every change must be tested with `zig build test-opcodes`.

## Handler Architecture

### Function Signature Pattern
All handlers follow this exact pattern:
```zig
pub fn opcode_name(self: *FrameType, cursor: [*]const Dispatch.Item) Error!noreturn {
    // Implementation
    const dispatch = Dispatch{ .cursor = cursor };
    const op_data = dispatch.getOpData(.OPCODE_NAME);
    return @call(FrameType.getTailCallModifier(), op_data.next_handler, .{ self, op_data.next_cursor.cursor });
}
```

### Key Principles
1. **Tail call optimization** - All handlers MUST use tail calls for performance
2. **Unsafe operations** - Use `_unsafe` variants after validation for performance
3. **Cursor-based dispatch** - Handlers advance execution through cursor manipulation
4. **Gas accounting** - Critical for preventing DoS attacks

## File Organization

### Core Handlers (Standard EVM Opcodes)
- `handlers_arithmetic.zig` - Math operations (ADD, MUL, DIV, MOD, EXP, etc.)
- `handlers_bitwise.zig` - Bit operations (AND, OR, XOR, SHL, SHR, etc.)
- `handlers_comparison.zig` - Comparisons (LT, GT, EQ, ISZERO, etc.)
- `handlers_stack.zig` - Stack operations (PUSH, POP, DUP, SWAP)
- `handlers_memory.zig` - Memory operations (MLOAD, MSTORE, MSIZE, etc.)
- `handlers_storage.zig` - Storage operations (SLOAD, SSTORE, TLOAD, TSTORE)
- `handlers_jump.zig` - Control flow (JUMP, JUMPI, JUMPDEST, PC)
- `handlers_system.zig` - Contract calls and creation (CALL, CREATE, etc.)
- `handlers_context.zig` - Environment info (ADDRESS, BALANCE, CALLER, etc.)
- `handlers_keccak.zig` - Cryptographic hashing (KECCAK256)
- `handlers_log.zig` - Event emission (LOG0-LOG4)

### Synthetic Handlers (Performance Optimizations)
- `handlers_arithmetic_synthetic.zig` - Fused PUSH+arithmetic operations
- `handlers_bitwise_synthetic.zig` - Fused PUSH+bitwise operations
- `handlers_memory_synthetic.zig` - Fused PUSH+memory operations
- `handlers_jump_synthetic.zig` - Optimized jump operations
- `handlers_advanced_synthetic.zig` - Complex fusion patterns

## Critical Implementation Details

### Stack Operations
- Always validate stack size with `std.debug.assert(self.stack.size() >= N)`
- Use `_unsafe` variants after validation: `pop_unsafe()`, `push_unsafe()`, `peek_unsafe()`
- Stack has maximum size of 1024 items (EVM limit)

### Memory Operations
- Memory expansion follows EVM semantics with quadratic gas costs
- Use `calculateMemoryGas()` for proper gas accounting
- Memory is byte-addressed with 32-byte word operations

### Gas Accounting
- Every operation consumes gas: `self.gas_remaining -= cost`
- Check for out of gas: `if (self.gas_remaining < 0) return Error.OutOfGas`
- Gas costs are defined in opcodes module and must be exact

### Error Handling
```zig
pub const Error = error{
    StackOverflow,
    StackUnderflow,
    InvalidJumpDestination,
    OutOfGas,
    StaticViolation,
    InvalidOpcode,
    // ... other errors
};
```

## Testing Requirements

### Mandatory Testing
- **EVERY change**: Run `zig build test-opcodes`
- **Differential testing**: Compare against revm for correctness
- **Gas accuracy**: Ensure gas costs match Yellow Paper specification

### Test Patterns
```zig
test "opcode_name basic functionality" {
    // Setup frame with required stack items
    // Execute opcode
    // Verify stack/memory/storage state
    // Verify gas consumption
}
```

## Common Patterns

### Binary Operations (ADD, MUL, AND, OR, etc.)
```zig
pub fn binary_op(self: *FrameType, cursor: [*]const Dispatch.Item) Error!noreturn {
    std.debug.assert(self.stack.size() >= 2);
    self.stack.binary_op_unsafe(struct {
        fn op(a: WordType, b: WordType) WordType {
            return a +% b; // or other operation
        }
    }.op);
    // Dispatch to next instruction
}
```

### Unary Operations (NOT, ISZERO, etc.)
```zig
pub fn unary_op(self: *FrameType, cursor: [*]const Dispatch.Item) Error!noreturn {
    std.debug.assert(self.stack.size() >= 1);
    const value = self.stack.peek_unsafe();
    self.stack.set_top_unsafe(~value); // or other operation
    // Dispatch to next instruction
}
```

### Memory Operations
```zig
pub fn memory_op(self: *FrameType, cursor: [*]const Dispatch.Item) Error!noreturn {
    const offset = self.stack.pop_unsafe();

    // Calculate and charge for memory expansion
    const memory_cost = try self.calculateMemoryGas(offset, size);
    self.gas_remaining -= @intCast(memory_cost);
    if (self.gas_remaining < 0) return Error.OutOfGas;

    // Perform memory operation
    // Dispatch to next instruction
}
```

## Synthetic Optimizations

### Inline vs Pointer Values
- **Inline**: Values ≤8 bytes stored directly in dispatch metadata
- **Pointer**: Values >8 bytes stored in constant pool

### Fusion Patterns
- **PUSH+OP**: Combine PUSH with subsequent operation
- **Multi-operations**: Batch multiple stack operations
- **Static jumps**: Direct jumps without binary search

## Debugging Guidelines

### Adding Debug Output
```zig
const log = @import("../log.zig");

// In handler function
log.debug("executing {s} with stack size: {}", .{ "ADD", self.stack.size() });
```

### Common Issues
1. **Stack underflow** - Check stack size before operations
2. **Memory expansion** - Ensure gas calculation is correct
3. **Jump validation** - Verify JUMPDEST targets are valid
4. **Gas accounting** - Every operation must charge gas

## Performance Considerations

### Critical Path Optimizations
- Tail call optimization eliminates function call overhead
- Unsafe operations skip bounds checking after validation
- Inline assembly for critical mathematical operations
- Cache-friendly memory layouts

### Gas Cost Accuracy
Gas costs must match the Yellow Paper exactly:
- Base costs for each opcode
- Memory expansion costs (quadratic)
- Storage access costs (cold/warm)
- Call operation costs (various)

## Integration Points

### With Frame Module
- Stack manipulation through `self.stack.*`
- Memory access through `self.memory.*`
- Gas accounting through `self.gas_remaining`
- Storage access through `self.host.*`

### With Dispatch Module
- Cursor-based execution flow
- Opcode data retrieval
- Next instruction dispatch

### With Host Module
- External calls and contract creation
- Storage and balance queries
- Event emission
- Block information access

## Maintenance Notes

### When Adding New Opcodes
1. Implement handler function following standard pattern
2. Add to appropriate handler file (or create new one)
3. Register in dispatch system
4. Add comprehensive tests
5. Verify gas costs match specification

### When Modifying Existing Opcodes
1. Understand current implementation thoroughly
2. Maintain backward compatibility
3. Update tests to cover edge cases
4. Run full differential test suite
5. Verify performance impact

## Security Considerations

### Input Validation
- Always validate stack depth before operations
- Check for integer overflows in calculations
- Validate jump destinations
- Enforce static context restrictions

### Gas DoS Prevention
- Accurate gas metering prevents DoS attacks
- Memory expansion costs prevent memory exhaustion
- Call depth limits prevent stack exhaustion

### State Consistency
- Revert all changes on error conditions
- Maintain transactional semantics
- Properly handle reentrancy scenarios

Remember: **Every bug in this module can result in financial loss. There is zero tolerance for errors.**