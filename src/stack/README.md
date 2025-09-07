# Stack Module

## Overview

The Stack module provides a high-performance EVM stack implementation with pointer-based operations and downward growth for optimal CPU cache performance. The stack supports up to 1024 256-bit words as per EVM specification with both safe and unsafe operation variants.

Key features include 64-byte cache line alignment, automatic index type selection based on capacity, zero-cost abstractions through compile-time configuration, and comprehensive bounds checking for memory safety.

## Core Components

### Primary Files

- **`stack.zig`** - Core stack implementation with pointer-based downward growth
- **`stack_config.zig`** - Configuration options for stack size, word type, and optimization settings  
- **`stack_c.zig`** - C interface bindings for external integration
- **`stack_bench.zig`** - Performance benchmarks for stack operations

## Key Data Structures

### Stack Structure
```zig
pub fn Stack(comptime config: StackConfig) type {
    return struct {
        pub const WordType = config.WordType;
        pub const IndexType = config.StackIndexType();
        pub const stack_capacity = config.stack_size;

        pub const Error = error{
            StackOverflow,
            StackUnderflow,
            AllocationError,
        };

        const Self = @This();

        // Ownership: pointer to aligned memory returned by alignedAlloc
        buf_ptr: [*]align(64) WordType,

        // Downward stack growth: stack_ptr points to next empty slot
        // Push: *stack_ptr = value; stack_ptr -= 1;
        // Pop: stack_ptr += 1; return *stack_ptr;
        stack_ptr: [*]WordType,
    };
}
```

### Stack Configuration
```zig
pub const StackConfig = struct {
    stack_size: u32 = 1024, // EVM standard
    WordType: type = u256,   // 256-bit words
    optimize_for_size: bool = false,

    pub fn StackIndexType(self: StackConfig) type {
        return if (self.stack_size <= 256) u8 else u16;
    }
    
    pub fn validate(self: StackConfig) void {
        std.debug.assert(self.stack_size > 0);
        std.debug.assert(self.stack_size <= 1024); // EVM limit
        std.debug.assert(@sizeOf(self.WordType) == 32); // 256-bit requirement
    }
};
```

## Performance Considerations

### Downward Growth Pattern
Stack grows downward for optimal cache locality and branch prediction:
```zig
// Push operation (fast path)
pub fn push(self: *Self, value: WordType) Error!void {
    if (self.size() >= stack_capacity) return Error.StackOverflow;
    self.stack_ptr[0] = value; // Store at current position
    self.stack_ptr -= 1;       // Move to next slot
}

// Pop operation (fast path)  
pub fn pop(self: *Self) Error!WordType {
    if (self.size() == 0) return Error.StackUnderflow;
    self.stack_ptr += 1;       // Move to last written slot
    return self.stack_ptr[0];  // Return value
}
```

### Cache Line Alignment
Stack memory is allocated with 64-byte alignment for optimal CPU cache utilization:
```zig
pub fn init(allocator: std.mem.Allocator) !Self {
    const aligned_mem = try allocator.alignedAlloc(WordType, 64, stack_capacity);
    return Self{
        .buf_ptr = aligned_mem.ptr,
        .stack_ptr = aligned_mem.ptr + stack_capacity - 1, // Start at top
    };
}
```

### Unsafe Operations
Performance-critical paths use unsafe variants with assertion-based validation:
```zig
pub fn push_unsafe(self: *Self, value: WordType) void {
    std.debug.assert(self.size() < stack_capacity);
    self.stack_ptr[0] = value;
    self.stack_ptr -= 1;
}

pub fn pop_unsafe(self: *Self) WordType {
    std.debug.assert(self.size() > 0);
    self.stack_ptr += 1;
    return self.stack_ptr[0];
}
```

### Index Type Optimization
Stack uses optimal index types based on capacity:
```zig
// Automatically selects u8 for stacks <= 256 items, u16 otherwise
pub fn StackIndexType(comptime stack_size: u32) type {
    return if (stack_size <= 256) u8 else u16;
}
```

## Usage Examples

### Basic Stack Operations
```zig
const StackConfig = @import("stack_config.zig").StackConfig;
const Stack = @import("stack.zig").Stack;

// Configure stack for EVM
const config = StackConfig{
    .stack_size = 1024,
    .WordType = u256,
    .optimize_for_size = false,
};

const StackType = Stack(config);
var stack = try StackType.init(allocator);
defer stack.deinit(allocator);

// Push values onto stack
try stack.push(0x123456789ABCDEF);
try stack.push(0xFEDCBA987654321);

// Pop values from stack (LIFO order)
const value1 = try stack.pop(); // 0xFEDCBA987654321
const value2 = try stack.pop(); // 0x123456789ABCDEF
```

### Stack Inspection
```zig
// Push some test values
try stack.push(100);
try stack.push(200);
try stack.push(300);

// Peek at top without removing
const top = try stack.peek(); // Returns 300
std.debug.assert(top == 300);
std.debug.assert(stack.size() == 3); // Size unchanged

// Access by index (0 = top, 1 = second, etc.)
const second = try stack.get(1); // Returns 200
const third = try stack.get(2);  // Returns 100
```

### Stack Manipulation
```zig
// Set top value directly  
try stack.push(42);
try stack.set_top(99); // Changes top from 42 to 99

// Duplicate values (DUP operations)
try stack.push(123);
try stack.push(456);
try stack.dup(1); // Duplicate second item (123) to top
// Stack now: [456, 123, 456, ...]

// Swap values (SWAP operations)
try stack.push(111);
try stack.push(222);
try stack.swap(1); // Swap top two items
// Stack now: [111, 222, ...]
```

### Unsafe Operations (Performance Critical)
```zig
// In performance-critical code with pre-validated conditions
std.debug.assert(stack.size() >= 2); // Ensure sufficient items

const b = stack.pop_unsafe();   // No bounds checking
const a = stack.peek_unsafe();  // No bounds checking
const result = a + b;
stack.set_top_unsafe(result);   // No bounds checking
```

### Batch Operations
```zig
// Push multiple values efficiently
const values = [_]u256{100, 200, 300, 400};
for (values) |value| {
    try stack.push(value);
}

// Pop multiple values
var results: [4]u256 = undefined;
var i: usize = 0;
while (i < 4) : (i += 1) {
    results[i] = try stack.pop();
}
```

## EVM Integration

### Opcode Support
Stack operations directly support EVM opcodes:

#### PUSH Operations
```zig
// PUSH1-PUSH32 implementation
pub fn push_bytes(self: *Self, bytes: []const u8) Error!void {
    std.debug.assert(bytes.len <= 32);
    var value: u256 = 0;
    for (bytes, 0..) |byte, i| {
        value |= (@as(u256, byte) << @intCast(8 * (31 - i)));
    }
    try self.push(value);
}
```

#### DUP Operations  
```zig
// DUP1-DUP16 implementation
pub fn dup(self: *Self, n: u4) Error!void {
    if (n == 0 or n > 16) return Error.InvalidIndex;
    if (self.size() < n) return Error.StackUnderflow;
    if (self.size() >= stack_capacity) return Error.StackOverflow;
    
    const value = self.get_unsafe(n - 1); // Get nth item (0-indexed)
    self.push_unsafe(value);
}
```

#### SWAP Operations
```zig
// SWAP1-SWAP16 implementation
pub fn swap(self: *Self, n: u4) Error!void {
    if (n == 0 or n > 16) return Error.InvalidIndex;
    if (self.size() <= n) return Error.StackUnderflow;
    
    const top_value = self.peek_unsafe();
    const nth_value = self.get_unsafe(n);
    self.set_top_unsafe(nth_value);
    self.set_unsafe(n, top_value);
}
```

### Gas Integration
Stack operations have minimal gas costs in EVM:
```zig
pub const StackGasCosts = struct {
    pub const PUSH = 3;   // PUSH1-PUSH32
    pub const POP = 2;    // POP  
    pub const DUP = 3;    // DUP1-DUP16
    pub const SWAP = 3;   // SWAP1-SWAP16
};
```

## Error Handling

Stack uses comprehensive error types for different failure modes:

### Error Categories
```zig
pub const Error = error{
    StackOverflow,    // Exceeds maximum capacity (1024 items)
    StackUnderflow,   // Pop/access on empty stack
    AllocationError,  // Memory allocation failure
    InvalidIndex,     // Index out of valid range for operation
};
```

### Error Propagation
```zig
// Safe operations propagate errors
const result = stack.pop() catch |err| switch (err) {
    Error.StackUnderflow => {
        log.debug("Stack underflow detected", .{});
        return Error.StackUnderflow;
    },
    else => return err,
};

// Unsafe operations assert preconditions
std.debug.assert(stack.size() > 0); // Must verify before unsafe pop
const value = stack.pop_unsafe(); // No error handling needed
```

## Integration Notes

### With Frame Module
Stack integrates with Frame for:
- Opcode parameter extraction and validation
- Result storage for arithmetic and logical operations
- Gas cost accounting for stack operations

### With Instructions Module
Stack handlers provide:
- Direct manipulation for all stack-based opcodes
- Efficient bulk operations for complex instructions
- Type-safe value exchange with other components

### With Memory Module
Coordination with Memory for:
- Offset validation from stack values
- Size parameters for memory operations
- Error propagation for resource limits

## Memory Management

Stack manages its own aligned memory allocation:

### Initialization
```zig
pub fn init(allocator: std.mem.Allocator) !Self {
    const aligned_mem = try allocator.alignedAlloc(WordType, 64, stack_capacity);
    return Self{
        .buf_ptr = aligned_mem.ptr,
        .stack_ptr = aligned_mem.ptr + stack_capacity - 1,
    };
}
```

### Cleanup
```zig
pub fn deinit(self: *Self, allocator: std.mem.Allocator) void {
    const slice = self.buf_ptr[0..stack_capacity];
    allocator.free(slice);
}
```

All memory operations use defer patterns for guaranteed cleanup and proper error handling throughout the execution chain.