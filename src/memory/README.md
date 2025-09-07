# Memory Module

## Overview

The Memory module provides EVM-compliant memory management with byte-addressable storage, lazy expansion, and hierarchical isolation for nested execution contexts. Memory expands to 32-byte word boundaries as per EVM specification and supports checkpoint-based isolation for CALL operations.

Key features include lazy allocation on first access, zero-initialization guarantees, cached gas cost calculations, and configurable memory limits for different execution environments.

## Core Components

### Primary Files

- **`memory.zig`** - Core memory implementation with lazy expansion and word-aligned operations  
- **`memory_config.zig`** - Configuration options for initial capacity, memory limits, and ownership
- **`memory_c.zig`** - C interface bindings for external integration
- **`memory_bench.zig`** - Performance benchmarks for memory operations

## Key Data Structures

### Memory Structure
```zig
pub fn Memory(comptime config: MemoryConfig) type {
    return struct {
        const Self = @This();
        
        pub const INITIAL_CAPACITY = config.initial_capacity;
        pub const MEMORY_LIMIT = config.memory_limit;
        pub const is_owned = config.owned;
        
        checkpoint: u24,
        buffer_ptr: *std.ArrayList(u8),
        
        // Core operations
        pub fn init(allocator: std.mem.Allocator) !Self
        pub fn deinit(self: *Self, allocator: std.mem.Allocator) void
        pub fn expand_to(self: *Self, offset: u64) !void
        pub fn load_word(self: *const Self, offset: u64) MemoryError!u256
        pub fn store_word(self: *Self, offset: u64, value: u256) MemoryError!void
    };
}
```

### Memory Configuration
```zig
pub const MemoryConfig = struct {
    initial_capacity: u32 = 0,
    memory_limit: u64 = 0x100000000, // 4GB default
    owned: bool = true,
    
    pub fn validate(self: MemoryConfig) void {
        std.debug.assert(self.memory_limit > 0);
        std.debug.assert(self.memory_limit <= 0x100000000);
    }
};
```

### Error Types
```zig
pub const MemoryError = error{
    OutOfMemory,
    MemoryOverflow,
    OutOfBounds,
};
```

## Performance Considerations

### Lazy Expansion
Memory is allocated only when accessed, minimizing overhead for contracts with small memory usage:
```zig
pub fn expand_to(self: *Self, offset: u64) !void {
    const required_size = offset + 32; // Always expand to word boundary
    if (required_size > self.buffer_ptr.capacity) {
        try self.buffer_ptr.ensureTotalCapacity(required_size);
        // Zero-initialize new memory
        @memset(self.buffer_ptr.items[self.buffer_ptr.items.len..required_size], 0);
    }
}
```

### Word-Aligned Operations
All memory operations align to 32-byte boundaries for optimal performance:
```zig
const WORD_SIZE = 32;
const WORD_SHIFT = 5; // log2(32)
const WORD_MASK = 31;  // 32 - 1

pub inline fn word_offset(offset: u64) u64 {
    return offset & ~WORD_MASK; // Align to word boundary
}
```

### Fast Path Optimization
Common operations use optimized paths for small offsets:
```zig
const FAST_PATH_THRESHOLD = 32;

pub fn load_byte(self: *const Self, offset: u64) MemoryError!u8 {
    if (offset < FAST_PATH_THRESHOLD and offset < self.buffer_ptr.items.len) {
        return self.buffer_ptr.items[offset]; // Fast path
    }
    return self.load_byte_slow(offset); // Bounds checking path
}
```

### Memory Layout
Memory buffer uses ArrayList for dynamic growth with efficient resizing strategies:
- Initial capacity configurable per use case
- Exponential growth for large expansions
- Zero-initialization of new regions

## Usage Examples

### Basic Memory Operations
```zig
const MemoryConfig = @import("memory_config.zig").MemoryConfig;
const Memory = @import("memory.zig").Memory;

// Configure memory with limits
const config = MemoryConfig{
    .initial_capacity = 1024,
    .memory_limit = 1024 * 1024, // 1MB limit
    .owned = true,
};

const MemoryType = Memory(config);
var memory = try MemoryType.init(allocator);
defer memory.deinit(allocator);

// Store a 256-bit word at offset 0
const value: u256 = 0x123456789ABCDEF;
try memory.store_word(0, value);

// Load the word back
const loaded = try memory.load_word(0);
std.debug.assert(loaded == value);
```

### Memory Expansion
```zig
// Expand memory to accommodate offset
const offset = 1024;
try memory.expand_to(offset);

// Check memory size
const size = memory.size();
std.debug.assert(size >= offset + 32); // Word boundary expansion
```

### Byte Operations
```zig
// Store individual bytes
try memory.store_byte(10, 0xFF);
try memory.store_byte(11, 0xAB);

// Load individual bytes
const byte1 = try memory.load_byte(10);
const byte2 = try memory.load_byte(11);
std.debug.assert(byte1 == 0xFF);
std.debug.assert(byte2 == 0xAB);
```

### Bulk Data Operations
```zig
// Copy data to memory
const data = [_]u8{1, 2, 3, 4, 5, 6, 7, 8};
try memory.copy_from_slice(100, &data);

// Copy data from memory  
var output: [8]u8 = undefined;
memory.copy_to_slice(100, &output);
std.debug.assert(std.mem.eql(u8, &data, &output));
```

### Checkpoint Operations
```zig
// Create checkpoint for nested context
const checkpoint = memory.create_checkpoint();

// Modify memory in nested context
try memory.store_word(0, 0xDEADBEEF);

// Revert to checkpoint
memory.revert_to_checkpoint(checkpoint);

// Memory reverted to original state
const reverted_value = try memory.load_word(0);
std.debug.assert(reverted_value == 0); // Zero-initialized
```

## Gas Cost Integration

Memory expansion follows EVM gas cost rules:

### Gas Calculation
```zig
pub fn expansion_gas_cost(old_size: u64, new_size: u64) u64 {
    if (new_size <= old_size) return 0;
    
    const old_cost = memory_gas_cost(old_size);
    const new_cost = memory_gas_cost(new_size);
    return new_cost - old_cost;
}

fn memory_gas_cost(size: u64) u64 {
    const size_word = (size + 31) / 32;
    return GasConstants.MEMORY * size_word + size_word * size_word / 512;
}
```

### Integration with Frame
```zig
// Frame integration for gas accounting
pub fn expand_to_with_gas(
    self: *Self, 
    offset: u64, 
    gas_tracker: *GasTracker
) !void {
    const old_size = self.size();
    const new_size = offset + 32;
    const gas_cost = expansion_gas_cost(old_size, new_size);
    
    try gas_tracker.consume(gas_cost);
    try self.expand_to(offset);
}
```

## Checkpoint System

Memory supports hierarchical checkpoints for nested execution contexts:

### Checkpoint Creation
```zig
pub const Checkpoint = struct {
    size: u32,
    timestamp: u64,
};

pub fn create_checkpoint(self: *Self) Checkpoint {
    return Checkpoint{
        .size = @intCast(self.buffer_ptr.items.len),
        .timestamp = std.time.timestamp(),
    };
}
```

### Checkpoint Reversion
```zig
pub fn revert_to_checkpoint(self: *Self, checkpoint: Checkpoint) void {
    if (checkpoint.size < self.buffer_ptr.items.len) {
        self.buffer_ptr.shrinkAndFree(checkpoint.size);
        // Memory beyond checkpoint is automatically freed
    }
}
```

## Integration Notes

### With Frame Module
Memory integrates with Frame for:
- Gas cost accounting during expansion
- Opcode-specific memory operations (MLOAD, MSTORE, etc.)
- Context isolation during CALL operations

### With Instructions Module  
Memory handlers provide:
- Word-aligned load/store operations
- Byte-level access for MSTORE8
- Size queries for MSIZE opcode
- Data copying for CALLDATACOPY, CODECOPY

### With Stack Module
Coordination with stack for:
- Offset validation from stack values
- Word size validation for operations
- Error propagation patterns

## Error Handling

Memory operations use comprehensive error handling:
- `OutOfMemory` - System allocation failure
- `MemoryOverflow` - Size exceeds configured limits  
- `OutOfBounds` - Access beyond valid memory range

All errors propagate cleanly through the execution chain with proper resource cleanup via defer patterns.