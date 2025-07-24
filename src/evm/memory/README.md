# EVM Memory Management

Byte-addressable memory implementation for the EVM with gas-efficient expansion and optimized read/write operations. This folder contains the memory subsystem that provides the ephemeral storage space for smart contract execution.

## Purpose

The memory subsystem provides:
- Byte-addressable volatile memory for each execution context
- Automatic memory expansion with gas cost tracking
- Efficient read/write operations with bounds checking
- Shared buffer architecture for memory efficiency
- Custom allocator for optimal page management

## Architecture

The memory system uses a checkpoint-based architecture where:
1. All execution contexts share a single underlying buffer
2. Each context has a checkpoint marking its memory start
3. Memory expands dynamically based on access patterns
4. Gas costs are calculated using optimized lookup tables

## Files

### `memory.zig`
Core memory implementation with shared buffer management.

**Key Types**:
- `Memory`: Main memory struct with checkpoint tracking
- `SharedMemoryBuffer`: Global buffer shared across contexts

**Structure**:
```zig
Memory = struct {
    checkpoint: u64,           // Start offset in shared buffer
    size: u64,                // Current memory size
    buffer: *SharedMemoryBuffer, // Shared buffer reference
}
```

**Key Methods**:
- `init()`: Create memory with initial capacity
- `deinit()`: Release memory checkpoint
- `expand()`: Grow memory to new size
- `slice()`: Get mutable slice for direct access

**Gas Cost Optimization**:
- Lookup table for sizes 0-4KB (common case)
- Cached gas costs for repeated expansions
- Efficient quadratic formula for large sizes

**Performance**: 
- O(1) memory access after expansion
- O(1) gas calculation for cached sizes
- Minimal allocation overhead via sharing

**Used By**: Frame execution, memory opcodes

### `read.zig`
Memory read operations with bounds checking.

**Functions**:
- `readBytes()`: Read arbitrary byte range
- `readWord()`: Read 32-byte word (optimized)
- `readByte()`: Read single byte

**Key Features**:
- Automatic zero-padding for out-of-bounds reads
- Optimized word-aligned reads
- No memory expansion on read
- Comprehensive bounds checking

**Safety**:
```zig
// Reading past memory returns zeros
const value = memory.readByte(offset); // Returns 0 if offset >= size
const word = memory.readWord(offset);  // Zero-padded if partially OOB
```

**Performance**:
- Word reads use direct memory copy
- Byte reads optimized for common cases
- Zero allocation for all read operations

**Used By**: MLOAD, CALLDATACOPY, RETURNDATACOPY, etc.

### `write.zig`
Memory write operations with automatic expansion.

**Functions**:
- `writeByte()`: Write single byte
- `writeBytes()`: Write byte array
- `writeWord()`: Write 32-byte word
- `copyFromMemory()`: Internal memory copy

**Key Features**:
- Automatic memory expansion
- Gas cost tracking for expansion
- Optimized word-aligned writes
- Error on expansion failure

**Expansion Logic**:
```zig
// Writing expands memory if needed
try memory.writeByte(offset, value, gas_remaining);
// Memory size is now at least offset + 1
```

**Gas Handling**:
- Calculates expansion cost before write
- Deducts gas atomically
- Reverts on insufficient gas

**Used By**: MSTORE, MSTORE8, CALLDATACOPY, etc.

### `evm_allocator.zig`
Custom allocator optimized for EVM memory patterns.

**Features**:
- Page-based allocation (4KB pages)
- Arena-style memory management
- Configurable growth strategies
- Alignment guarantees

**Allocator Types**:
```zig
EvmAllocator = struct {
    child_allocator: Allocator,  // Backing allocator
    arena: Arena,                // Arena for allocations
    config: Config,              // Growth configuration
}
```

**Growth Strategies**:
- `Doubling`: Double capacity on growth
- `Page`: Grow by single pages (memory efficient)

**Key Methods**:
- `create()`: Allocate single item
- `alloc()`: Allocate array
- `resize()`: Grow allocation
- `free()`: No-op (arena-based)

**Used By**: SharedMemoryBuffer initialization

### `constants.zig`
Memory-related constants and configuration.

**Constants**:
- `PAGE_SIZE`: 4096 bytes (system page)
- `WORD_SIZE`: 32 bytes (EVM word)
- `MAX_MEMORY_SIZE`: 2^32 bytes (4GB limit)
- `GAS_MEMORY_WORD`: 3 gas per word

**Utility Functions**:
- `wordCount()`: Calculate words from bytes
- `expandSize()`: Calculate expansion size
- `isWordAligned()`: Check alignment

**Used By**: All memory operations

### `context.zig`
Memory context for cross-module communication.

**Purpose**: Provides memory interface without circular dependencies

**Interface**:
```zig
Context = struct {
    expand: fn(self: *Context, size: u64) MemoryError!void,
    slice: fn(self: *Context) []u8,
    size: fn(self: *Context) u64,
}
```

**Used By**: Operations that need memory access

### `errors.zig`
Memory-specific error definitions.

**Error Types**:
- `OutOfGas`: Insufficient gas for expansion
- `AllocationError`: Failed to allocate memory
- `Overflow`: Size calculation overflow
- `OutOfMemory`: Exceeded memory limits

**Used By**: All memory operations

### `slice.zig`
Memory slice utilities and bounds checking.

**Features**:
- Safe slice creation
- Bounds validation
- Zero-padding support
- Overflow protection

**Key Functions**:
- `getSlice()`: Get bounded slice
- `getZeroPaddedSlice()`: Read with padding
- `validateBounds()`: Check access validity

**Used By**: Read/write operations

### `package.zig`
Module exports and documentation.

**Exports**: All public types and functions

**Used By**: External modules importing memory

### `fuzz_tests.zig`
Comprehensive fuzz testing for memory operations.

**Test Categories**:
- Memory expansion patterns
- Read/write combinations
- Gas cost calculations
- Bounds checking
- Edge cases

**Coverage**: Tests millions of memory access patterns

### `evm_allocator_example.zig`
Example usage of the EVM allocator.

**Demonstrates**:
- Allocator initialization
- Memory allocation patterns
- Growth strategies
- Integration examples

## Memory Model

### Addressing
- Byte-addressable (0-indexed)
- 256-bit addressing space (practically limited by gas)
- Word-aligned operations optimized

### Expansion
- Lazy expansion (only on write)
- Expands to next word boundary
- Gas charged for expansion only

### Gas Costs
```
cost = 3 * words + words² / 512
```
- Linear component: 3 gas per word
- Quadratic component: Prevents excessive expansion

## Usage Patterns

### Basic Read/Write
```zig
// Read a word
const value = try memory.readWord(offset);

// Write a byte with gas tracking
try memory.writeByte(offset, byte_value, &gas_remaining);

// Copy data
try memory.writeBytes(dest_offset, data, &gas_remaining);
```

### Memory Expansion
```zig
// Check if expansion needed
const new_size = offset + 32;
if (new_size > memory.size) {
    const gas_cost = memory.expansionGasCost(new_size);
    if (gas_cost > gas_remaining) return error.OutOfGas;
    try memory.expand(new_size);
    gas_remaining -= gas_cost;
}
```

### Direct Access
```zig
// Get direct slice for bulk operations
const mem_slice = memory.slice();
@memcpy(mem_slice[dest..][0..len], source_data);
```

## Performance Optimizations

1. **Shared Buffer**: Reduces allocations across contexts
2. **Gas Table**: O(1) lookup for common sizes
3. **Word Alignment**: Optimized 32-byte operations
4. **Arena Allocator**: Fast allocation, bulk deallocation
5. **Inline Functions**: Critical paths optimized

## Safety Guarantees

- All reads bounds-checked
- Writes validate gas before expansion
- Overflow protection in size calculations
- Zero-initialization of new memory
- No buffer overruns possible

## Testing

Comprehensive test coverage including:
- Unit tests for each operation
- Fuzz tests for edge cases
- Gas cost verification
- Benchmark tests
- Integration tests with opcodes

## Integration with EVM

Memory is used by numerous opcodes:
- **MLOAD/MSTORE**: Direct memory access
- **CALLDATACOPY**: Copy calldata to memory
- **CODECOPY**: Copy code to memory
- **RETURNDATACOPY**: Copy return data
- **CREATE/CREATE2**: Init code from memory
- **CALL family**: Input/output buffers
- **RETURN/REVERT**: Output from memory
- **LOG operations**: Log data from memory
- **KECCAK256**: Hash memory range