# CLAUDE.md - Memory Module AI Context

## MISSION CRITICAL: EVM Memory Semantics

EVM memory operations are fundamental to smart contract execution. **ANY deviation from EVM memory semantics can cause consensus failures and loss of funds.** Memory must expand correctly, maintain byte-addressability, and calculate gas costs precisely.

## Critical Implementation Details

### EVM Memory Specifications (IMMUTABLE REQUIREMENTS)

**Word Size**: Exactly 32 bytes per word (256 bits)
**Growth Strategy**: Memory expands in 32-byte word boundaries only
**Addressing**: Byte-addressable from offset 0 to maximum limit
**Initialization**: All memory MUST be zero-initialized on expansion
**Gas Costs**: Quadratic expansion cost formula (EIP-150)

### Core Files and Responsibilities

**File: `memory.zig`**
- Main EVM memory implementation with lazy expansion
- Byte-addressable operations (MLOAD, MSTORE, MSTORE8)
- Checkpoint system for nested execution contexts
- Gas cost calculation and caching

**File: `memory_config.zig`**
- Memory configuration parameters and validation
- Initial capacity and maximum limit settings
- Performance tuning parameters

**File: `memory_c.zig`**
- C FFI interface for language bindings
- Cross-language memory management
- Error code mapping

**File: `memory_bench.zig`**
- Performance benchmarking infrastructure
- Memory operation profiling

## Memory Layout and Growth

### Word-Aligned Expansion (CRITICAL)
```zig
// CORRECT: Always expand to 32-byte boundaries
const WORD_SIZE = 32;
const WORD_MASK = 31; // 32 - 1

fn expand_to_word_boundary(offset: u64, size: u64) u64 {
    const end_offset = offset + size;
    return (end_offset + WORD_MASK) & ~@as(u64, WORD_MASK);
}
```

### Memory Operations Safety
```zig
// MLOAD: Read 32-byte word from memory
pub fn mload(self: *Self, offset: u64) !u256 {
    try self.ensure_capacity(offset + 32);
    return std.mem.readInt(u256, self.buffer_ptr.items[offset..offset+32], .big);
}

// MSTORE: Write 32-byte word to memory
pub fn mstore(self: *Self, offset: u64, value: u256) !void {
    try self.ensure_capacity(offset + 32);
    std.mem.writeInt(u256, self.buffer_ptr.items[offset..offset+32], value, .big);
}

// MSTORE8: Write single byte to memory
pub fn mstore8(self: *Self, offset: u64, value: u8) !void {
    try self.ensure_capacity(offset + 1);
    self.buffer_ptr.items[offset] = value;
}
```

## Gas Cost Calculation (CONSENSUS CRITICAL)

### Memory Expansion Formula
```zig
// EIP-150 quadratic memory expansion cost
fn calculate_memory_gas(old_size: u64, new_size: u64) u64 {
    if (new_size <= old_size) return 0;

    const old_cost = memory_word_cost(old_size);
    const new_cost = memory_word_cost(new_size);
    return new_cost - old_cost;
}

fn memory_word_cost(size_bytes: u64) u64 {
    const words = (size_bytes + 31) / 32; // Round up to words
    const linear_cost = words * 3; // 3 gas per word
    const quadratic_cost = words * words / 512; // Quadratic component
    return linear_cost + quadratic_cost;
}
```

### Memory Access Gas Costs
- **MLOAD**: Base cost + memory expansion cost
- **MSTORE**: Base cost + memory expansion cost
- **MSTORE8**: Base cost + memory expansion cost
- **CALLDATACOPY/CODECOPY**: Base cost + memory expansion + copy cost

## Memory Safety and Bounds Checking

### Capacity Management
```zig
// CRITICAL: Always check bounds before access
pub fn ensure_capacity(self: *Self, required_size: u64) !void {
    if (required_size > MEMORY_LIMIT) {
        return MemoryError.MemoryOverflow;
    }

    if (required_size > self.buffer_ptr.items.len) {
        const new_size = expand_to_word_boundary(0, required_size);
        try self.buffer_ptr.resize(new_size);

        // CRITICAL: Zero-initialize expanded memory
        const old_len = self.buffer_ptr.items.len - (new_size - required_size);
        @memset(self.buffer_ptr.items[old_len..], 0);
    }
}
```

### Buffer Overflow Prevention
```zig
// NEVER allow out-of-bounds access
pub fn get_slice(self: *Self, offset: u64, size: u64) ![]u8 {
    if (offset > self.buffer_ptr.items.len or
        size > self.buffer_ptr.items.len - offset) {
        return MemoryError.OutOfBounds;
    }

    try self.ensure_capacity(offset + size);
    return self.buffer_ptr.items[offset..offset + size];
}
```

## Checkpoint System for Nested Contexts

### Frame Isolation
```zig
// Create checkpoint for nested call
pub fn create_checkpoint(self: *Self) u24 {
    const checkpoint = @intCast(self.buffer_ptr.items.len);
    self.checkpoint = checkpoint;
    return checkpoint;
}

// Restore to checkpoint on call failure
pub fn restore_checkpoint(self: *Self, checkpoint: u24) !void {
    if (checkpoint > self.buffer_ptr.items.len) {
        return MemoryError.InvalidCheckpoint;
    }

    try self.buffer_ptr.resize(checkpoint);
}
```

## Performance Optimization Strategies

### Lazy Allocation
- Memory only allocated when first accessed
- Initial capacity prevents frequent reallocations
- Word-aligned growth reduces fragmentation

### Cache-Friendly Access Patterns
- Sequential memory access optimization
- Minimize memory allocation/deallocation
- Reuse buffers where possible

### SIMD Optimization Potential
- Vectorized memory operations for large copies
- Parallel zero-initialization of memory regions
- Batch memory validation operations

## Integration Requirements

### Dependencies
- `std.ArrayList` for dynamic buffer management
- Memory allocator for buffer growth
- Primitives module for u256 operations

### Used By
- EVM execution engine (MLOAD/MSTORE operations)
- Frame execution context
- Contract call handling
- Debugging and tracing systems

## Critical Error Conditions

### Memory Overflow
```zig
// MUST prevent memory exhaustion attacks
if (required_size > MEMORY_LIMIT) {
    return MemoryError.MemoryOverflow;
}
```

### Out of Bounds Access
```zig
// MUST validate all memory access
if (offset >= self.buffer_ptr.items.len) {
    return MemoryError.OutOfBounds;
}
```

### Allocation Failure
```zig
// MUST handle system memory exhaustion
self.buffer_ptr.resize(new_size) catch |err| switch (err) {
    error.OutOfMemory => return MemoryError.OutOfMemory,
};
```

## Debugging Strategies

### Memory State Inspection
1. **Size Tracking**: Monitor current memory size and capacity
2. **Access Patterns**: Log memory read/write operations
3. **Growth Analysis**: Track memory expansion events
4. **Checkpoint Validation**: Verify checkpoint restore operations

### Performance Analysis
1. **Allocation Frequency**: Monitor buffer reallocation events
2. **Memory Usage**: Track peak memory consumption
3. **Copy Performance**: Profile large memory copy operations
4. **Gas Calculation**: Verify gas cost accuracy

### Memory Corruption Detection
1. **Bounds Validation**: Check all array access operations
2. **Zero-Fill Verification**: Ensure expanded memory is zeroed
3. **Checkpoint Integrity**: Validate checkpoint operations
4. **Buffer Consistency**: Check buffer state consistency

## Testing Requirements

### Unit Tests MUST Cover
- Memory expansion with proper word alignment
- MLOAD/MSTORE operations with various offsets
- MSTORE8 single-byte operations
- Out-of-bounds access detection
- Memory limit enforcement
- Checkpoint creation and restoration
- Gas cost calculation accuracy

### Edge Case Testing
- Zero-offset operations
- Maximum memory limit operations
- Large memory copy operations
- Nested checkpoint scenarios
- Memory overlap conditions

### Performance Testing
- Memory allocation overhead
- Large buffer operations
- Repeated allocation/deallocation cycles
- Memory usage growth patterns

## Security Considerations

### DoS Prevention
- Memory limit prevents resource exhaustion
- Quadratic gas costs limit memory abuse
- Proper bounds checking prevents crashes

### Memory Safety
- All allocations checked for success
- Buffer overflows prevented by bounds checking
- Proper cleanup prevents memory leaks

### Consensus Security
- Exact gas cost calculation
- Deterministic memory expansion
- Consistent behavior across platforms

## Emergency Procedures

### Memory Corruption Detection
1. **Immediate Halt**: Stop execution on corruption
2. **State Dump**: Log memory contents and metadata
3. **Bounds Analysis**: Check for buffer overruns
4. **Reference Comparison**: Compare with known-good state

### Memory Exhaustion
1. **Resource Monitoring**: Track system memory usage
2. **Graceful Failure**: Return appropriate error codes
3. **Recovery Strategy**: Clean up and retry if possible
4. **Limit Adjustment**: Review memory limits if needed

### Performance Regression
1. **Benchmark Analysis**: Compare with baseline performance
2. **Allocation Profiling**: Identify allocation hotspots
3. **Optimization**: Implement fixes while maintaining correctness
4. **Validation**: Ensure no behavioral changes

Remember: **EVM memory semantics are sacred.** Any deviation from the specification, including gas cost calculations or memory expansion behavior, can lead to consensus failures. Always prioritize correctness over performance and test extensively against reference implementations.