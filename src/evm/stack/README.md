# EVM Stack Implementation

High-performance, fixed-capacity stack implementation for EVM execution with a two-phase validation approach that maximizes both safety and performance.

## Purpose

The stack module provides:
- Fixed-capacity stack with 1024 element limit (EVM specification)
- Safe and unsafe operation variants for different contexts
- Centralized validation for binary size optimization
- Zero-copy operations for performance
- Strong memory safety guarantees

## Architecture

The stack uses a two-phase approach:
1. **Validation Phase**: Jump table validates all requirements
2. **Execution Phase**: Operations use unsafe variants for speed

This design eliminates redundant bounds checking across ~140 opcodes while maintaining safety.

## Files

### `stack.zig`
Core stack implementation with fixed-capacity storage.

**Structure**:
```zig
Stack = struct {
    items: []u256,                           // Slice view of data
    data: [CAPACITY]u256 align(@alignOf(u256)), // Stack-allocated storage
}
```

**Key Design Decisions**:
- **Stack-allocated**: 1024 × 32 bytes = 32KB on stack
- **32-byte aligned**: Optimal for modern CPU cache lines
- **Zero-copy operations**: Direct array manipulation
- **Explicit unsafe API**: Clear performance/safety tradeoff

**Safe Operations**:
- `init()`: Create new empty stack
- `append(value)`: Push with overflow check
- `pop()`: Pop with underflow check
- `dup(n)`: Duplicate with bounds check
- `swap(n)`: Swap with bounds check
- `len()`: Current stack depth
- `clear()`: Zero all elements

**Unsafe Operations** (assume validation passed):
- `append_unsafe(value)`: Push without checks
- `pop_unsafe()`: Pop without checks
- `pop2_unsafe()`: Pop two elements
- `pop3_unsafe()`: Pop three elements
- `dup_unsafe(n)`: Duplicate without checks
- `swap_unsafe(n)`: Swap without checks
- `peek_unsafe()`: Read top without checks
- `set_top_unsafe(value)`: Modify top directly

**Performance Optimizations**:
- Direct array indexing (no method calls)
- Multi-pop operations for common patterns
- Branch hints for predictable paths
- Alignment for cache efficiency

**Security Features**:
- Popped values are zeroed
- Clear operation zeros entire array
- No information leakage between operations

**Used By**: Frame execution, all stack operations

### `stack_validation.zig`
Validation logic for stack operations.

**Key Function**:
```zig
pub fn validate_stack_requirements(
    stack: *const Stack,
    operation: *const Operation
) Error!void
```

**Validation Checks**:
1. **Underflow**: `stack.len() >= operation.min_stack`
2. **Overflow**: `stack.len() + operation.max_stack <= 1024`

**Compile-Time Function**:
```zig
pub fn validateStackRequirements(
    comptime opcode: Opcode,
    comptime min_stack: u32,
    comptime max_stack: u32
) void
```

**Compile-Time Guarantees**:
- Operations can push at most 1 element net
- Maximum 16 inputs per operation
- Maximum 16 outputs per operation
- Build fails if invariants violated

**Error Types**:
- `StackUnderflow`: Not enough elements
- `StackOverflow`: Would exceed 1024 limit

**Used By**: Jump table dispatcher

### `validation_patterns.zig`
Common validation patterns for operation types.

**Pattern Functions**:
```zig
// Binary operations (pop 2, push 1)
validate_binary_op(stack: *const Stack) !void

// Ternary operations (pop 3, push 1)
validate_ternary_op(stack: *const Stack) !void

// Push operations (push 1)
validate_push(stack: *const Stack) !void

// Pop operations (pop 1)
validate_pop(stack: *const Stack) !void

// DUP operations (duplicate element)
validate_dup(stack: *const Stack, n: u8) !void

// SWAP operations (swap elements)
validate_swap(stack: *const Stack, n: u8) !void
```

**Benefits**:
- Reusable validation logic
- Consistent error handling
- Clear operation categorization
- Simplified testing

**Used By**: Operation implementations

## Stack Operation Patterns

### Binary Operations (ADD, MUL, etc.)
```zig
// After validation by jump table
const b = stack.pop_unsafe();
const a = stack.pop_unsafe();
const result = a + b;
stack.append_unsafe(result);
```

### Ternary Operations (ADDMOD, MULMOD)
```zig
// After validation
const n = stack.pop_unsafe();
const b = stack.pop_unsafe();
const a = stack.pop_unsafe();
const result = (a + b) % n;
stack.append_unsafe(result);
```

### DUP Operations
```zig
// After validation
const value = stack.dup_unsafe(position);
stack.append_unsafe(value);
```

### SWAP Operations
```zig
// After validation
stack.swap_unsafe(position);
```

## Two-Phase Execution Model

### Phase 1: Validation (Jump Table)
```zig
// In jump table
const operation = operations[opcode];
try validate_stack_requirements(&frame.stack, &operation);
```

### Phase 2: Execution (Opcode Implementation)
```zig
// In opcode implementation - no checks needed!
const a = state.stack.pop_unsafe();
const b = state.stack.pop_unsafe();
state.stack.append_unsafe(a + b);
```

## Performance Characteristics

### Benchmarks Results
- **Safe append**: ~3-5 ns per operation
- **Unsafe append**: ~1-2 ns per operation
- **Safe pop**: ~3-5 ns per operation
- **Unsafe pop**: ~1-2 ns per operation
- **Multi-pop**: Faster than individual pops

### Memory Layout
- **Size**: 32KB stack allocation
- **Alignment**: 32-byte aligned for cache
- **Locality**: Contiguous memory access
- **No allocations**: Zero heap usage

### Branch Prediction
- Error paths marked `@branchHint(.cold)`
- Success paths marked `@branchHint(.likely)`
- Predictable patterns in loops

## Safety Guarantees

### Memory Safety
- Stack isolation (no shared state)
- Bounds checking in safe operations
- Zero-initialization on clear
- No buffer overflows possible

### Information Security
- Popped values are zeroed
- No data leakage between frames
- Timing-attack resistant operations
- Secure clear operation

### Validation Safety
- Centralized validation point
- Type-safe error handling
- Compile-time invariant checking
- Runtime validation before unsafe ops

## Usage Guidelines

### When to Use Safe Operations
- Initial prototyping
- Error-prone code paths
- Debugging scenarios
- Unit tests

### When to Use Unsafe Operations
- After jump table validation
- Performance-critical paths
- Well-tested code
- Size-optimized builds

### Best Practices
```zig
// Good - validation then unsafe
try validate_stack_requirements(stack, operation);
const value = stack.pop_unsafe();

// Bad - unsafe without validation
const value = stack.pop_unsafe(); // Dangerous!

// Good - explicit about safety
if (stack.len() >= 2) {
    const a = stack.pop_unsafe();
    const b = stack.pop_unsafe();
}

// Bad - mixing safe and unsafe
const a = try stack.pop();      // Redundant check
const b = stack.pop_unsafe();   // Inconsistent
```

## Testing

Comprehensive test coverage includes:
- Unit tests for all operations
- Fuzz tests for edge cases
- Security tests for information leakage
- Performance benchmarks
- EVM pattern testing

## Design Benefits

1. **Binary Size**: Centralized validation reduces code size
2. **Performance**: Unsafe operations in hot paths
3. **Safety**: Clear validation/execution separation
4. **Debugging**: Explicit unsafe operations aid debugging
5. **Maintenance**: Modular design simplifies updates

## Future Considerations

- SIMD operations for parallel stack manipulation
- Custom allocator for larger stacks
- Stack compression for snapshots
- Hardware-specific optimizations