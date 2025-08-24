# Memory

EVM-compliant memory system with lazy expansion and hierarchical isolation.

## Synopsis

```zig
const MemoryType = Memory(config);
var memory = try MemoryType.init(allocator);
try memory.set_u256_evm(offset, value);
const data = try memory.get_slice_evm(offset, length);
```

## Description

Implements EVM memory model with lazy expansion, hierarchical isolation for nested calls, and gas-aware operations. Features word-boundary alignment, zero-initialization semantics, and quadratic gas cost calculation.

## Architecture & Design

### Core Design Principles

1. **Lazy Expansion**: Memory only allocated when accessed, starting with configurable initial capacity
2. **Word-Boundary Alignment**: All EVM operations expand memory to 32-byte boundaries per specification
3. **Hierarchical Isolation**: Child memory contexts for nested calls with checkpoint-based isolation
4. **Gas Integration**: Cached expansion cost calculation for efficient gas accounting
5. **Zero Initialization**: All memory starts as zero per EVM semantics, never shrinks during execution

### Memory Model

```
Parent Memory Buffer:
┌──────────────┬──────────────┬──────────────┬──────────────┐
│   Parent     │   Child 1    │   Child 2    │   Unused     │
│   Data       │   Data       │   Data       │   Space      │
└──────────────┴──────────────┴──────────────┴──────────────┘
│              │              │              │
└─ checkpoint=0 └─ checkpoint=N └─ checkpoint=M
```

**Hierarchical Structure**:
- Parent memory owns the buffer and manages allocation
- Child memories share the buffer with isolated views
- Each child has a checkpoint marking its starting position
- Children can only access their own region and beyond

## API Reference

### Configuration

```zig
pub const MemoryConfig = struct {
    initial_capacity: usize = 4096,        // Starting capacity (4KB default)
    memory_limit: u64 = 0xFFFFFF,         // Maximum size (~16MB default)
    
    pub fn validate(comptime self: Self) void;  // Compile-time validation
};
```

**Configuration Guidelines**:
- `initial_capacity`: Balance between allocation overhead and memory usage
- `memory_limit`: Must not exceed u32 max, prevents DoS attacks via memory exhaustion
- Default values suitable for most EVM execution scenarios

### Factory Function

```zig
pub fn Memory(comptime config: MemoryConfig) type {
    // Returns specialized memory type with configuration
}
```

### Memory Instance Creation

#### Owner Memory (Primary)

```zig
// Create memory that owns its buffer
pub fn init(allocator: std.mem.Allocator) !Self

// Clean up owned memory
pub fn deinit(self: *Self) void
```

#### Borrowed Memory (Child)

```zig  
// Create child memory sharing parent's buffer
pub fn init_borrowed(
    allocator: std.mem.Allocator, 
    buffer_ptr: *std.ArrayList(u8), 
    checkpoint: usize
) !Self

// Create child from parent memory
pub fn init_child(self: *Self) !Self
```

### Capacity Management

```zig
// Get current memory size (accessible bytes)
pub fn size(self: *const Self) usize

// Ensure minimum capacity with lazy expansion
pub fn ensure_capacity(self: *Self, new_size: usize) !void

// Clear memory (reset size, preserve capacity)
pub fn clear(self: *Self) void
```

### EVM-Compliant Operations

These operations automatically expand to word boundaries per EVM specification:

```zig
// Write data with EVM word-boundary expansion
pub fn set_data_evm(self: *Self, offset: usize, data: []const u8) !void

// Write single byte with EVM expansion
pub fn set_byte_evm(self: *Self, offset: usize, value: u8) !void

// Write 256-bit word with EVM expansion  
pub fn set_u256_evm(self: *Self, offset: usize, value: u256) !void

// Read with automatic expansion if needed
pub fn get_u256_evm(self: *Self, offset: usize) !u256
```

**EVM Expansion Rules**:
- Operations expand to next 32-byte boundary: `((end + 31) / 32) * 32`
- Ensures all memory access is word-aligned as required by EVM specification
- New memory regions are zero-initialized

### Direct Operations  

These operations work with current memory size without expansion:

```zig
// Read slice of current memory
pub fn get_slice(self: *const Self, offset: usize, len: usize) ![]const u8

// Write data to current memory (expands only if needed)
pub fn set_data(self: *Self, offset: usize, data: []const u8) !void

// Single byte operations
pub fn get_byte(self: *const Self, offset: usize) !u8
pub fn set_byte(self: *Self, offset: usize, value: u8) !void

// 256-bit word operations
pub fn get_u256(self: *const Self, offset: usize) !u256
pub fn set_u256(self: *Self, offset: usize, value: u256) !void
```

### Gas Cost Calculation

```zig
// Calculate gas cost for memory expansion
pub fn get_expansion_cost(self: *Self, new_size: u64) u64

// Quadratic cost formula: 3 * words + (words * words) / 512
fn calculate_memory_cost(words: u64) u64
```

**Gas Cost Model**:
- Follows EVM specification for memory expansion costs
- Quadratic growth prevents unbounded memory usage
- Caches last calculation to avoid redundant computation
- Returns only the incremental cost for expansion

### Buffer Access

```zig
// Get reference to underlying buffer (advanced use)
pub fn get_buffer_ref(self: *Self) *std.ArrayList(u8)
```

## Performance Characteristics

### Lazy Expansion Strategy

1. **Initial Allocation**: Configurable starting size (default 4KB)
2. **On-Demand Growth**: Memory allocated only when accessed
3. **Capacity Management**: ArrayList handles capacity doubling automatically
4. **Zero-Fill**: New regions automatically zero-initialized

### Hierarchical Isolation Benefits

1. **Memory Sharing**: Multiple contexts share single buffer
2. **Checkpoint Isolation**: Each child sees only its region
3. **Efficient Cleanup**: Child deinit doesn't affect parent buffer
4. **Call Stack Support**: Perfect for EVM's nested call model

### Caching Optimization

The memory system caches expansion cost calculations:

```zig
cached_expansion: struct {
    last_size: u64,     // Last calculated size
    last_words: u64,    // Word count for last calculation
    last_cost: u64,     // Total cost for last size
}
```

**Benefits**:
- Avoids redundant quadratic calculations
- Particularly beneficial for sequential memory access patterns
- Gas metering becomes nearly O(1) for cached sizes

## Testing

### Test Coverage

The memory implementation includes comprehensive tests covering:

1. **Basic Operations**: Read/write operations, size tracking, capacity management
2. **EVM Compliance**: Word-boundary expansion, zero-initialization semantics
3. **Hierarchical Memory**: Parent-child relationships, checkpoint isolation
4. **Capacity Limits**: Memory limit enforcement, overflow detection
5. **Gas Calculation**: Expansion cost accuracy, caching behavior
6. **Edge Cases**: Boundary conditions, error handling, cleanup

### Test Execution

```bash
# Run all memory tests
zig build test

# Run memory-specific tests
zig build test -- --test-filter "Memory"
```

### Critical Test Scenarios

1. **Owner/Borrowed Separation**: Parent and child memories operate independently
2. **EVM Expansion Compliance**: All _evm operations expand to word boundaries
3. **Limit Enforcement**: Memory limits prevent excessive allocation
4. **Gas Cost Accuracy**: Expansion costs match EVM specification
5. **Zero-Fill Verification**: New memory regions properly zero-initialized

## Context within EVM

### Integration with Frame

Memory is embedded within Frame for opcode execution:

```zig
// Frame contains configured memory instance
pub const Frame = struct {
    memory: MemoryType,  // Configured Memory type
    // ... other frame components
    
    pub fn op_mstore(self: *Self) Error!void {
        const offset = try self.stack.pop();
        const value = try self.stack.pop();
        
        // Calculate gas cost for expansion
        const expansion_cost = self.memory.get_expansion_cost(offset + 32);
        if (self.gas_remaining < GasFastestStep + expansion_cost) {
            return Error.OutOfGas;
        }
        self.gas_remaining -= @intCast(GasFastestStep + expansion_cost);
        
        // Perform EVM-compliant write
        try self.memory.set_u256_evm(@intCast(offset), value);
    }
};
```

### Integration with Host/EVM

Memory provides data for external operations:

```zig
// RETURN opcode returns memory slice
pub fn op_return(self: *Self) Error!void {
    const offset = try self.stack.pop();
    const length = try self.stack.pop();
    
    // Get return data from memory
    const return_data = try self.memory.get_slice(
        @intCast(offset), 
        @intCast(length)
    );
    
    // Return to caller with data
    return Error.Return(return_data);
}
```

### Nested Call Support

Child memory enables nested contract calls:

```zig
// Create child memory for nested call
var child_memory = try parent_memory.init_child();
defer child_memory.deinit();

// Child inherits parent state but has isolated view
// Changes to child don't affect parent
child_memory.set_data_evm(0, call_data);
```

## EVM Specification Compliance

### Memory Expansion Rules

1. **Word Alignment**: All operations expand to 32-byte boundaries
2. **Zero Initialization**: New memory regions filled with zeros
3. **No Shrinking**: Memory size never decreases during execution
4. **Gas Costs**: Quadratic expansion costs per EVM specification

### Memory Operations Support

1. **MLOAD/MSTORE**: 32-byte word operations with automatic expansion
2. **MSTORE8**: Single byte operations with expansion
3. **MCOPY**: Memory copying with source/destination expansion
4. **RETURN/REVERT**: Memory slice extraction for transaction results
5. **CREATE/CREATE2**: Contract initialization data from memory

### Gas Calculation Accuracy

The implementation follows EVM gas schedule:
- Base cost: 3 gas per word
- Quadratic component: words² / 512 gas
- Only expansion portion charged (incremental cost)
- Matches reference implementations (geth, revm)

## Data-Oriented Design

### Memory Layout Optimization

```zig
pub const Memory = struct {
    // Hot data (frequently accessed)
    checkpoint: usize,                    // Current position marker
    buffer_ptr: *std.ArrayList(u8),       // Buffer reference
    allocator: std.mem.Allocator,         // Allocator reference
    owns_buffer: bool,                    // Ownership flag
    
    // Cold data (less frequently accessed)  
    cached_expansion: struct {            // Gas calculation cache
        last_size: u64,
        last_words: u64,
        last_cost: u64,
    },
};
```

### Cache-Friendly Access Patterns

1. **Sequential Access**: Most EVM operations access memory sequentially
2. **Locality**: Related data stored contiguously in buffer
3. **Caching**: Expansion cost calculations cached for repeated access
4. **Minimal Indirection**: Direct buffer access where possible

The memory system provides EVM-compliant memory management with performance optimizations for typical smart contract execution patterns, supporting both simple linear memory access and complex nested call scenarios.