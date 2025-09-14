# CLAUDE.md - Stack Module AI Context

## MISSION CRITICAL: EVM Stack Invariants

The EVM stack is a fundamental component where **ANY violation of stack invariants can cause consensus failures and loss of funds.** The stack must maintain exact EVM specification compliance with zero tolerance for deviation.

## Critical Implementation Details

### EVM Stack Specifications (IMMUTABLE REQUIREMENTS)

**Stack Capacity**: Exactly 1024 elements maximum (per EVM Yellow Paper)
**Element Size**: 256-bit words (u256) - never smaller, never larger
**Stack Behavior**: LIFO (Last In, First Out) with strict overflow/underflow checking
**Growth Direction**: Downward growth for optimal CPU cache performance

### Core Files and Responsibilities

**File: `stack.zig`**
- Main stack implementation with pointer-based design
- Safe and unsafe operation variants for performance
- Memory-aligned allocation for cache optimization
- Compile-time configuration support

**File: `stack_config.zig`**
- Stack configuration parameters validation
- Automatic index type selection (u4/u8/u12 based on capacity)
- Compile-time safety checks and optimization

**File: `stack_c.zig`**
- C FFI interface for language bindings
- Error code mapping to C-compatible integers
- Memory management for cross-language usage

**File: `stack_bench.zig`**
- Performance benchmarking infrastructure
- Stack operation timing measurements

## Memory Safety - ZERO TOLERANCE FOR BUGS

### Allocation Pattern (CRITICAL)
```zig
// CORRECT: Aligned allocation with proper cleanup
buf_ptr: [*]align(64) WordType = try allocator.alignedAlloc(WordType, 64, capacity);
defer allocator.free(buf_ptr[0..capacity]);

// Stack pointer initialization: points to END of buffer (downward growth)
stack_ptr: [*]WordType = buf_ptr + capacity;
```

### Memory Ownership Rules
1. **Allocation**: Stack owns aligned memory buffer
2. **Lifetime**: Buffer lives for entire stack lifetime
3. **Cleanup**: MUST free aligned memory on destruction
4. **Alignment**: 64-byte alignment for cache line optimization

## Stack Operation Invariants

### Push Operation Safety
```zig
// SAFE VERSION: Bounds checking
pub fn push(self: *Self, value: WordType) Error!void {
    if (self.len() >= stack_capacity) return Error.StackOverflow;
    self.stack_ptr -= 1;
    self.stack_ptr[0] = value;
}

// UNSAFE VERSION: Assertion-based (performance critical paths)
pub fn push_unsafe(self: *Self, value: WordType) void {
    std.debug.assert(self.len() < stack_capacity);
    self.stack_ptr -= 1;
    self.stack_ptr[0] = value;
}
```

### Pop Operation Safety
```zig
// SAFE VERSION: Underflow protection
pub fn pop(self: *Self) Error!WordType {
    if (self.len() == 0) return Error.StackUnderflow;
    const value = self.stack_ptr[0];
    self.stack_ptr += 1;
    return value;
}

// UNSAFE VERSION: Performance optimized
pub fn pop_unsafe(self: *Self) WordType {
    std.debug.assert(self.len() > 0);
    const value = self.stack_ptr[0];
    self.stack_ptr += 1;
    return value;
}
```

### Stack Size Calculation (CRITICAL)
```zig
// CORRECT: Pointer arithmetic for current length
pub fn len(self: *const Self) IndexType {
    const capacity_ptr = self.buf_ptr + stack_capacity;
    return @intCast(capacity_ptr - self.stack_ptr);
}
```

## Performance Optimization Strategies

### Cache Line Optimization
- **64-byte alignment**: Stack buffer aligns with CPU cache lines
- **Downward growth**: Sequential memory access pattern
- **Pointer arithmetic**: Single-instruction operations where possible

### Index Type Selection
- **u4**: Stack size ≤ 15 elements (4 bits sufficient)
- **u8**: Stack size ≤ 255 elements (8 bits)
- **u12**: Stack size ≤ 4095 elements (12 bits maximum)

### Safe vs Unsafe Operations
- **Safe operations**: Bounds checking, return errors
- **Unsafe operations**: Assertions only, maximum performance
- **Usage pattern**: Safe for external calls, unsafe for hot paths

## Critical Error Conditions

### Stack Overflow (CONSENSUS CRITICAL)
```zig
// MUST detect before modification
if (self.len() >= stack_capacity) {
    return Error.StackOverflow;
}
```

### Stack Underflow (CONSENSUS CRITICAL)
```zig
// MUST detect before access
if (self.len() == 0) {
    return Error.StackUnderflow;
}
```

### Memory Allocation Failure
```zig
// MUST handle allocation failure gracefully
const buf_ptr = allocator.alignedAlloc(WordType, 64, capacity)
    catch return Error.AllocationError;
```

## Stack Operations - EVM Compliance

### PUSH Operations (0x60-0x7F)
- Push 1-32 byte immediate values
- Values left-padded with zeros to 256 bits
- Stack overflow check MUST occur before push

### POP Operations (0x50)
- Remove and return top stack element
- Stack underflow check MUST occur before pop
- Exactly one element consumed

### DUP Operations (0x80-0x8F)
- Duplicate stack element at position N (1-16)
- Does NOT consume original element
- Increases stack size by exactly 1

### SWAP Operations (0x90-0x9F)
- Exchange top element with element at position N+1 (1-16)
- Does NOT change stack size
- Both positions must be valid

## Debugging Strategies

### Stack State Inspection
1. **Length Tracking**: Monitor stack depth continuously
2. **Pointer Validation**: Verify stack_ptr within bounds
3. **Content Inspection**: Log stack values for debugging
4. **Operation Tracing**: Track push/pop sequences

### Memory Corruption Detection
1. **Bounds Checking**: Verify all pointer arithmetic
2. **Alignment Validation**: Check 64-byte alignment maintained
3. **Buffer Integrity**: Guard bytes around stack buffer
4. **Double-Free Prevention**: Clear pointers after deallocation

### Performance Analysis
1. **Cache Miss Analysis**: Monitor L1/L2 cache performance
2. **Branch Prediction**: Minimize conditional branches in hot paths
3. **Instruction Counting**: Measure cycles per stack operation
4. **Memory Bandwidth**: Track memory access patterns

## Integration Requirements

### Dependencies
- Memory allocator (for aligned allocation)
- Primitives module (for u256 type)
- Standard library (for assertions and utilities)

### Used By
- EVM execution engine (all opcode handlers)
- Frame execution context
- Bytecode interpreter
- Debugging and tracing systems

## Testing Requirements

### Unit Tests MUST Cover
- Stack creation and destruction
- Push operations with overflow detection
- Pop operations with underflow detection
- DUP operations for all positions (1-16)
- SWAP operations for all positions (1-16)
- Stack size calculation accuracy
- Memory alignment verification

### Boundary Condition Tests
- Empty stack operations
- Full stack operations (1024 elements)
- Maximum value storage (2^256 - 1)
- Zero value storage and retrieval
- Pointer arithmetic edge cases

### Performance Tests
- Stack operation throughput
- Cache miss rate measurements
- Memory allocation overhead
- FFI interface performance

## Security Considerations

### Memory Safety
- All pointer arithmetic MUST be bounds-checked
- Stack buffer MUST remain within allocated bounds
- No buffer overflows/underflows allowed
- Proper cleanup prevents memory leaks

### Consensus Security
- Stack operations MUST match EVM specification exactly
- No undefined behavior in any operation
- Deterministic behavior across all platforms
- Exact error condition handling

## Emergency Procedures

### Stack Corruption Detection
1. **Immediate Halt**: Stop execution on corruption detection
2. **State Dump**: Log complete stack contents and pointers
3. **Memory Analysis**: Check for buffer overflows/underflows
4. **Reference Comparison**: Compare with known-good implementation

### Performance Regression
1. **Benchmark Comparison**: Compare with baseline performance
2. **Profile Analysis**: Identify bottleneck operations
3. **Cache Analysis**: Check for cache line misalignment
4. **Optimization Implementation**: Maintain correctness first

### Memory Leak Detection
1. **Allocation Tracking**: Monitor all alignedAlloc calls
2. **Cleanup Verification**: Ensure all cleanup paths work
3. **Long-running Tests**: Check for gradual memory growth
4. **Automated Testing**: Include leak detection in CI/CD

## Configuration Best Practices

### Production Configuration
```zig
const ProductionStackConfig = StackConfig{
    .stack_size = 1024,        // EVM standard
    .WordType = u256,          // EVM standard
    .fusions_enabled = true,   // Performance optimization
};
```

### Debug Configuration
```zig
const DebugStackConfig = StackConfig{
    .stack_size = 1024,        // EVM standard
    .WordType = u256,          // EVM standard
    .fusions_enabled = false,  // Disable for debugging
};
```

Remember: **The EVM stack is not negotiable.** Any deviation from the specification, no matter how small, can lead to consensus failures. Always prioritize correctness over performance, and test extensively against known implementations.