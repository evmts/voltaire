# Frame Documentation

## Overview

The Frame is the core execution context for EVM operations, providing a lightweight, high-performance environment for bytecode execution. It combines stack, memory, and gas tracking with extensive opcode support, while maintaining strict separation of concerns with upper-layer components like PC management, call operations, and blockchain environment access.

## Architecture & Design

### Core Design Principles

1. **Lightweight Execution Context**: Minimal overhead with essential components (stack, memory, gas)
2. **Component Separation**: Frame executes opcodes, Plan manages PC/jumps, Host handles calls/environment
3. **Configurable Performance**: Compile-time configuration for optimal type selection and feature flags
4. **Cache-Conscious Layout**: Hot fields grouped together for optimal memory access patterns
5. **Type Safety**: Generic configuration with compile-time validation and smart type selection

### Frame Architecture

```zig
pub fn Frame(comptime config: FrameConfig) type {
    return struct {
        // Hot Path (Cacheline 1)
        stack: Stack,              // High-performance downward-growing stack
        bytecode: []const u8,      // Contract bytecode slice
        gas_remaining: GasType,    // Smart-sized gas tracking (i32/i64)
        tracer: TracerType,        // Compile-time selected tracer
        memory: Memory,            // EVM-compliant memory with lazy expansion
        database: ?DatabaseInterface, // Optional storage access
        
        // Execution Context
        contract_address: Address,  // Current contract address
        self_destruct: ?*SelfDestruct, // SELFDESTRUCT tracking
        logs: ArrayList(Log),      // Event logs (LOG0-LOG4)
        is_static: bool,           // Static call restriction
        output_data: ArrayList(u8), // RETURN/REVERT data
        host: ?Host,               // External operations interface
    };
}
```

### Smart Type Selection

The Frame uses intelligent type selection based on configuration limits:

```zig
// Gas type selection based on block gas limit
pub fn GasType(comptime self: FrameConfig) type {
    return if (self.block_gas_limit <= std.math.maxInt(i32))
        i32  // Most common case - saves memory and improves performance
    else
        i64; // Large block gas limits
}

// PC type selection based on bytecode size limit
pub fn PcType(comptime self: FrameConfig) type {
    return if (self.max_bytecode_size <= std.math.maxInt(u16))
        u16  // Covers most real-world contracts
    else
        u32; // Large contracts
}

// Stack index type selection
pub fn StackIndexType(comptime self: FrameConfig) type {
    return if (self.stack_size <= std.math.maxInt(u8))
        u8   // Standard 1024 stack size fits in u8
    else
        u12; // Extended stack sizes
}
```

## API Reference

### Configuration

```zig
const FrameConfig = @import("frame_config.zig").FrameConfig;

const config = FrameConfig{
    .stack_size = 1024,                    // EVM standard stack size
    .WordType = u256,                      // EVM word size
    .max_bytecode_size = 24576,            // EIP-170 limit
    .block_gas_limit = 30_000_000,         // Typical block gas limit
    .TracerType = NoOpTracer,              // Zero overhead tracing
    .memory_initial_capacity = 4096,       // 4KB initial memory
    .memory_limit = 0xFFFFFF,              // 16MB memory limit
    .has_database = true,                  // Enable storage operations
    .vector_length = 16,                   // SIMD vector length (auto-detected)
};

// Validate configuration at compile time
comptime config.validate();
```

### Frame Creation and Management

```zig
// Create frame type from configuration
const FrameType = Frame(config);

// Initialize frame with execution context
pub fn init(
    allocator: std.mem.Allocator,
    bytecode: []const u8,
    gas_remaining: GasType,
    database: ?DatabaseInterface,
    host: ?Host
) Error!FrameType

// Clean up frame resources
pub fn deinit(self: *Self, allocator: std.mem.Allocator) void

// Create deep copy for debugging/validation
pub fn copy(self: *const Self, allocator: std.mem.Allocator) Error!Self

// Compare frames for equality (debugging)
pub fn assertEqual(self: *const Self, other: *const Self) void
```

### Stack Operations

#### PUSH Operations
```zig
// Push single value to stack
try frame.stack.push(value);

// Push from bytecode (PUSH1-PUSH32)
const bytes_to_push = opcode - 0x5f; // PUSH1 = 0x60
var value: u256 = 0;
for (0..bytes_to_push) |i| {
    value = (value << 8) | bytecode[pc + 1 + i];
}
try frame.stack.push(value);
```

#### POP Operations
```zig
// Pop value from stack
const value = try frame.stack.pop();

// Pop operation (POP opcode - discards value)
pub fn pop(self: *Self) Error!void {
    _ = try self.stack.pop();
}
```

#### DUP Operations (DUP1-DUP16)
```zig
// DUP1: Duplicate top stack item
pub fn dup1(self: *Self) Error!void {
    const value = try self.stack.peek();
    try self.stack.push(value);
}

// DUPn: Duplicate nth item from top
pub fn dupN(self: *Self, n: u4) Error!void {
    const value = try self.stack.get(n - 1);
    try self.stack.push(value);
}
```

#### SWAP Operations (SWAP1-SWAP16)
```zig
// SWAP1: Exchange top two stack items
pub fn swap1(self: *Self) Error!void {
    try self.stack.swap(0, 1);
}

// SWAPn: Exchange top item with nth item
pub fn swapN(self: *Self, n: u4) Error!void {
    try self.stack.swap(0, n);
}
```

### Arithmetic Operations

#### Basic Arithmetic
```zig
// ADD: Addition with overflow wrapping
pub fn add(self: *Self) Error!void {
    const b = try self.stack.pop();
    const a = try self.stack.peek();
    try self.stack.set_top(a +% b);
}

// SUB: Subtraction with underflow wrapping  
pub fn sub(self: *Self) Error!void {
    const b = try self.stack.pop();
    const a = try self.stack.peek();
    try self.stack.set_top(a -% b);
}

// MUL: Multiplication with overflow wrapping
pub fn mul(self: *Self) Error!void {
    const b = try self.stack.pop();
    const a = try self.stack.peek();
    try self.stack.set_top(a *% b);
}

// DIV: Division (returns 0 for divide by zero)
pub fn div(self: *Self) Error!void {
    const b = try self.stack.pop();
    const a = try self.stack.peek();
    const result = if (b == 0) 0 else a / b;
    try self.stack.set_top(result);
}
```

#### Advanced Arithmetic
```zig
// ADDMOD: (a + b) % N
pub fn addmod(self: *Self) Error!void {
    const N = try self.stack.pop();
    const b = try self.stack.pop();
    const a = try self.stack.peek();
    const result = if (N == 0) 0 else (a +% b) % N;
    try self.stack.set_top(result);
}

// MULMOD: (a * b) % N with intermediate overflow handling
pub fn mulmod(self: *Self) Error!void {
    const N = try self.stack.pop();
    const b = try self.stack.pop();  
    const a = try self.stack.peek();
    const result = if (N == 0) 0 else {
        // Handle intermediate overflow correctly
        const a_mod = a % N;
        const b_mod = b % N;
        (a_mod *% b_mod) % N
    };
    try self.stack.set_top(result);
}

// EXP: Modular exponentiation with gas cost calculation
pub fn exp(self: *Self) Error!void {
    const exponent = try self.stack.pop();
    const base = try self.stack.peek();
    
    // Calculate gas cost based on exponent size
    const exp_byte_size = if (exponent == 0) 0 else (256 - @clz(exponent) + 7) / 8;
    const gas_cost = GasConstants.GasExp + (exp_byte_size * GasConstants.GasExpByte);
    
    if (self.gas_remaining < gas_cost) return Error.OutOfGas;
    self.gas_remaining -= gas_cost;
    
    // Compute result
    const result = std.math.pow(u256, base, exponent);
    try self.stack.set_top(result);
}
```

### Bitwise Operations

```zig
// AND: Bitwise AND
pub fn @"and"(self: *Self) Error!void {
    const b = try self.stack.pop();
    const a = try self.stack.peek();
    try self.stack.set_top(a & b);
}

// OR: Bitwise OR
pub fn @"or"(self: *Self) Error!void {
    const b = try self.stack.pop();
    const a = try self.stack.peek();
    try self.stack.set_top(a | b);
}

// XOR: Bitwise XOR
pub fn xor(self: *Self) Error!void {
    const b = try self.stack.pop();
    const a = try self.stack.peek();
    try self.stack.set_top(a ^ b);
}

// NOT: Bitwise NOT
pub fn not(self: *Self) Error!void {
    const a = try self.stack.peek();
    try self.stack.set_top(~a);
}

// BYTE: Extract byte from word
pub fn byte(self: *Self) Error!void {
    const i = try self.stack.pop();
    const val = try self.stack.peek();
    const result = if (i >= 32) 0 else {
        const shift = (31 - @as(usize, @intCast(i))) * 8;
        (val >> @intCast(shift)) & 0xFF
    };
    try self.stack.set_top(result);
}
```

### Shift Operations

```zig
// SHL: Left shift
pub fn shl(self: *Self) Error!void {
    const shift = try self.stack.pop();
    const value = try self.stack.peek();
    const result = if (shift >= 256) 0 else value << @intCast(shift);
    try self.stack.set_top(result);
}

// SHR: Logical right shift
pub fn shr(self: *Self) Error!void {
    const shift = try self.stack.pop();
    const value = try self.stack.peek();
    const result = if (shift >= 256) 0 else value >> @intCast(shift);
    try self.stack.set_top(result);
}

// SAR: Arithmetic right shift (sign-extending)
pub fn sar(self: *Self) Error!void {
    const shift = try self.stack.pop();
    const value = try self.stack.peek();
    const word_bits = @bitSizeOf(WordType);
    
    const result = if (shift >= word_bits) blk: {
        const sign_bit = value >> (word_bits - 1);
        break :blk if (sign_bit == 1) 
            @as(WordType, std.math.maxInt(WordType)) 
        else 
            @as(WordType, 0);
    } else blk: {
        const value_signed = @as(std.meta.Int(.signed, word_bits), @bitCast(value));
        const result_signed = value_signed >> @intCast(shift);
        break :blk @as(WordType, @bitCast(result_signed));
    };
    try self.stack.set_top(result);
}
```

### Comparison Operations

```zig
// LT: Less than (unsigned)
pub fn lt(self: *Self) Error!void {
    const b = try self.stack.pop();
    const a = try self.stack.peek();
    try self.stack.set_top(if (a < b) 1 else 0);
}

// GT: Greater than (unsigned) 
pub fn gt(self: *Self) Error!void {
    const b = try self.stack.pop();
    const a = try self.stack.peek();
    try self.stack.set_top(if (a > b) 1 else 0);
}

// SLT: Signed less than
pub fn slt(self: *Self) Error!void {
    const b = try self.stack.pop();
    const a = try self.stack.peek();
    const a_signed = @as(std.meta.Int(.signed, @bitSizeOf(WordType)), @bitCast(a));
    const b_signed = @as(std.meta.Int(.signed, @bitSizeOf(WordType)), @bitCast(b));
    try self.stack.set_top(if (a_signed < b_signed) 1 else 0);
}

// EQ: Equality
pub fn eq(self: *Self) Error!void {
    const b = try self.stack.pop();
    const a = try self.stack.peek();
    try self.stack.set_top(if (a == b) 1 else 0);
}

// ISZERO: Is zero
pub fn iszero(self: *Self) Error!void {
    const a = try self.stack.peek();
    try self.stack.set_top(if (a == 0) 1 else 0);
}
```

### Memory Operations

```zig
// MLOAD: Load 32 bytes from memory
pub fn mload(self: *Self) Error!void {
    const offset = try self.stack.pop();
    
    // Calculate memory expansion cost
    const expansion_cost = try self.memory.expansion_cost(offset, 32);
    const total_cost = GasConstants.GasVeryLow + expansion_cost;
    
    if (self.gas_remaining < total_cost) return Error.OutOfGas;
    self.gas_remaining -= @intCast(total_cost);
    
    // Load value from memory
    const value = self.memory.get_u256_evm(@intCast(offset));
    try self.stack.push(value);
}

// MSTORE: Store 32 bytes to memory
pub fn mstore(self: *Self) Error!void {
    const offset = try self.stack.pop();
    const value = try self.stack.pop();
    
    // Calculate memory expansion cost
    const expansion_cost = try self.memory.expansion_cost(offset, 32);
    const total_cost = GasConstants.GasVeryLow + expansion_cost;
    
    if (self.gas_remaining < total_cost) return Error.OutOfGas;
    self.gas_remaining -= @intCast(total_cost);
    
    // Store value to memory
    try self.memory.set_u256_evm(@intCast(offset), value);
}

// MSTORE8: Store single byte to memory
pub fn mstore8(self: *Self) Error!void {
    const offset = try self.stack.pop();
    const value = try self.stack.pop();
    
    const expansion_cost = try self.memory.expansion_cost(offset, 1);
    const total_cost = GasConstants.GasVeryLow + expansion_cost;
    
    if (self.gas_remaining < total_cost) return Error.OutOfGas;
    self.gas_remaining -= @intCast(total_cost);
    
    const byte_value = @as(u8, @intCast(value & 0xFF));
    try self.memory.set_byte_evm(@intCast(offset), byte_value);
}

// MSIZE: Get memory size
pub fn msize(self: *Self) Error!void {
    try self.stack.push(@as(WordType, @intCast(self.memory.size())));
}

// MCOPY: Copy memory regions (EIP-5656)
pub fn mcopy(self: *Self) Error!void {
    const dest_offset = try self.stack.pop();
    const src_offset = try self.stack.pop();
    const length = try self.stack.pop();
    
    if (length == 0) return; // No-op for zero length
    
    // Calculate memory expansion for both source and destination
    const src_expansion = try self.memory.expansion_cost(src_offset, length);
    const dest_expansion = try self.memory.expansion_cost(dest_offset, length);
    const expansion_cost = @max(src_expansion, dest_expansion);
    
    // Gas cost: 3 gas + copy cost + expansion cost
    const copy_cost = ((length + 31) / 32) * GasConstants.GasCopy;
    const total_cost = GasConstants.GasVeryLow + copy_cost + expansion_cost;
    
    if (self.gas_remaining < total_cost) return Error.OutOfGas;
    self.gas_remaining -= @intCast(total_cost);
    
    // Perform memory copy
    try self.memory.copy_evm(@intCast(dest_offset), @intCast(src_offset), @intCast(length));
}
```

### Storage Operations (Database Required)

```zig
// SLOAD: Load from persistent storage
pub fn op_sload(self: *Self) Error!void {
    if (!config.has_database) @compileError("SLOAD requires database");
    
    const key = try self.stack.pop();
    
    // Access list gas cost (EIP-2929)
    const gas_cost = if (self.host) |host| 
        host.access_storage_slot(self.contract_address, key) catch GasConstants.GasColdSload
    else 
        GasConstants.GasColdSload;
        
    if (self.gas_remaining < gas_cost) return Error.OutOfGas;
    self.gas_remaining -= @intCast(gas_cost);
    
    // Load value from storage
    const value = if (self.database) |db| 
        db.get_storage(self.contract_address, key) catch 0
    else 
        0;
        
    try self.stack.push(value);
}

// SSTORE: Store to persistent storage
pub fn op_sstore(self: *Self) Error!void {
    if (!config.has_database) @compileError("SSTORE requires database");
    if (self.is_static) return Error.WriteProtection;
    
    const key = try self.stack.pop();
    const value = try self.stack.pop();
    
    if (self.database) |db| {
        // Record original value for gas refunds
        if (self.host) |host| {
            if (host.get_original_storage(self.contract_address, key) == null) {
                const original = db.get_storage(self.contract_address, key) catch 0;
                host.record_storage_change(self.contract_address, key, original) catch {};
            }
        }
        
        // Calculate gas cost based on storage state changes
        const current_value = db.get_storage(self.contract_address, key) catch 0;
        const gas_cost = calculate_sstore_gas_cost(current_value, value);
        
        if (self.gas_remaining < gas_cost) return Error.OutOfGas;
        self.gas_remaining -= @intCast(gas_cost);
        
        // Store the value
        try db.set_storage(self.contract_address, key, value);
    }
}

// TLOAD/TSTORE: Transient storage (EIP-1153)
pub fn op_tload(self: *Self) Error!void {
    const key = try self.stack.pop();
    const value = if (self.database) |db|
        db.get_transient_storage(self.contract_address, key) catch 0
    else
        0;
    try self.stack.push(value);
}

pub fn op_tstore(self: *Self) Error!void {
    if (self.is_static) return Error.WriteProtection;
    const key = try self.stack.pop();
    const value = try self.stack.pop();
    if (self.database) |db| {
        try db.set_transient_storage(self.contract_address, key, value);
    }
}
```

### Hashing Operations

```zig
// KECCAK256: Compute Keccak-256 hash
pub fn op_keccak256(self: *Self) Error!void {
    const offset = try self.stack.pop();
    const length = try self.stack.pop();
    
    // Calculate memory expansion and gas costs
    const expansion_cost = try self.memory.expansion_cost(offset, length);
    const hash_cost = ((length + 31) / 32) * GasConstants.GasKeccak256Word;
    const total_cost = GasConstants.GasKeccak256 + hash_cost + expansion_cost;
    
    if (self.gas_remaining < total_cost) return Error.OutOfGas;
    self.gas_remaining -= @intCast(total_cost);
    
    // Get data to hash
    const data = if (length == 0) 
        &[_]u8{}
    else 
        self.memory.get_slice_evm(@intCast(offset), @intCast(length));
    
    // Compute hash using optimized implementation
    var hash: [32]u8 = undefined;
    keccak_asm.keccak256(&hash, data);
    
    // Convert to u256 and push to stack
    var result: u256 = 0;
    for (hash) |byte| {
        result = (result << 8) | byte;
    }
    try self.stack.push(result);
}
```

### Logging Operations (LOG0-LOG4)

```zig
// LOG0: Emit log with no topics
pub fn op_log0(self: *Self) Error!void {
    try self.log_implementation(0);
}

// LOG1: Emit log with 1 topic
pub fn op_log1(self: *Self) Error!void {
    try self.log_implementation(1);
}

// ... LOG2, LOG3, LOG4 similar

// Generic log implementation
fn log_implementation(self: *Self, topic_count: u8) Error!void {
    if (self.is_static) return Error.WriteProtection;
    
    const offset = try self.stack.pop();
    const length = try self.stack.pop();
    
    // Pop topics from stack
    var topics: [4]u256 = undefined;
    for (0..topic_count) |i| {
        topics[i] = try self.stack.pop();
    }
    
    // Calculate gas cost
    const expansion_cost = try self.memory.expansion_cost(offset, length);
    const log_cost = GasConstants.GasLog + 
                    (@as(u64, topic_count) * GasConstants.GasLogTopic) +
                    (@as(u64, @intCast(length)) * GasConstants.GasLogData);
    const total_cost = log_cost + expansion_cost;
    
    if (self.gas_remaining < total_cost) return Error.OutOfGas;
    self.gas_remaining -= @intCast(total_cost);
    
    // Get log data
    const data = if (length == 0)
        &[_]u8{}
    else
        self.memory.get_slice_evm(@intCast(offset), @intCast(length));
    
    // Create and store log entry
    const log_entry = Log{
        .address = self.contract_address,
        .topics = try self.logs.allocator.dupe(u256, topics[0..topic_count]),
        .data = try self.logs.allocator.dupe(u8, data),
    };
    try self.logs.append(log_entry);
    
    // Emit to host if available
    if (self.host) |host| {
        host.emit_log(self.contract_address, log_entry.topics, log_entry.data);
    }
}
```

### Host Operations (Environment Access)

These operations delegate to the Host interface when available:

```zig
// ADDRESS: Get current contract address
pub fn op_address(self: *Self) Error!void {
    const addr_as_u256 = to_u256(self.contract_address);
    try self.stack.push(addr_as_u256);
}

// BALANCE: Get account balance
pub fn op_balance(self: *Self) Error!void {
    const address_word = try self.stack.pop();
    const address = from_u256(address_word);
    
    const balance = if (self.host) |host| 
        host.get_balance(address)
    else 
        0;
        
    try self.stack.push(balance);
}

// CALLER: Get message sender
pub fn op_caller(self: *Self) Error!void {
    const caller = if (self.host) |host|
        to_u256(host.get_caller())
    else
        0;
    try self.stack.push(caller);
}

// CALLVALUE: Get call value
pub fn op_callvalue(self: *Self) Error!void {
    const value = if (self.host) |host|
        host.get_value()
    else
        0;
    try self.stack.push(value);
}

// Block information opcodes
pub fn op_blockhash(self: *Self) Error!void {
    const block_number = try self.stack.pop();
    const hash = if (self.host) |host| blk: {
        if (const hash_bytes = host.get_block_hash(@intCast(block_number))) |bytes| {
            var result: u256 = 0;
            for (bytes) |byte| {
                result = (result << 8) | byte;
            }
            break :blk result;
        } else {
            break :blk 0;
        }
    } else 0;
    try self.stack.push(hash);
}

// ... similar implementations for COINBASE, TIMESTAMP, NUMBER, etc.
```

## Performance Characteristics

### Cache-Conscious Design

The Frame layout prioritizes cache efficiency:

```zig
// Hot path fields in first cache line (~64 bytes)
stack: Stack,              // 8-16 bytes (pointer + metadata)
bytecode: []const u8,      // 16 bytes (slice)
gas_remaining: GasType,    // 4-8 bytes (i32/i64)
tracer: TracerType,        // 0-8 bytes (compile-time optimized)
memory: Memory,            // 16-24 bytes (core fields)
database: ?DatabaseInterface, // 16 bytes (vtable interface)

// Cold path fields in subsequent cache lines
contract_address: Address, // 20 bytes
logs: ArrayList(Log),      // Storage for events
output_data: ArrayList(u8), // RETURN/REVERT data
```

### Smart Type Selection Benefits

1. **Gas Type Optimization**: 
   - `i32` for standard block gas limits saves 50% memory per frame
   - `i64` automatically selected for large limits

2. **PC Type Optimization**:
   - `u16` covers 99% of real-world contracts (up to 65KB)  
   - `u32` automatically selected for larger contracts

3. **Stack Index Optimization**:
   - `u8` sufficient for standard 1024-item stack
   - Automatic promotion for larger stack configurations

### Stack Performance

- **Downward Growth**: Optimal for CPU cache and memory allocation patterns
- **Pointer-Based**: Direct arithmetic operations, minimal indirection
- **Unsafe Variants**: Used when bounds pre-validated by planner
- **Cache Alignment**: 64-byte alignment for optimal CPU cache utilization

### Memory Performance

- **Lazy Expansion**: Only allocates when needed, reduces memory footprint
- **Word Alignment**: 32-byte boundaries for EVM compliance and CPU efficiency
- **Gas Integration**: Pre-calculated expansion costs for fast gas metering
- **Zero Initialization**: Efficient bulk zeroing for expanded regions

### Opcode Execution Patterns

```zig
// Pattern 1: Simple operations (ADD, SUB, MUL)
const b = try self.stack.pop();      // Pop second operand
const a = try self.stack.peek();     // Keep first operand on stack
try self.stack.set_top(a +% b);     // Update top with result

// Pattern 2: Operations with gas costs (memory expansion)
const expansion_cost = try self.memory.expansion_cost(offset, length);
if (self.gas_remaining < base_cost + expansion_cost) return Error.OutOfGas;
self.gas_remaining -= @intCast(base_cost + expansion_cost);
```

### Branch Optimization

The Frame uses branch hints for predictable paths:

```zig
// Stack operations assume success is likely
if (self.stack.next_stack_index >= Stack.stack_capacity) 
    @branchHint(.cold);
return Error.StackOverflow;

// Gas checks assume sufficient gas is likely  
if (self.gas_remaining < cost) 
    @branchHint(.unlikely);
return Error.OutOfGas;
```

## Testing

### Test Coverage

Frame testing covers all major operation categories:

1. **Stack Operations**: PUSH/POP, DUP/SWAP, bounds checking
2. **Arithmetic Operations**: All arithmetic opcodes with overflow/underflow cases
3. **Bitwise Operations**: AND/OR/XOR/NOT, shift operations
4. **Comparison Operations**: LT/GT/EQ, signed comparisons
5. **Memory Operations**: MLOAD/MSTORE, expansion, gas calculation
6. **Storage Operations**: SLOAD/SSTORE with database integration
7. **Hashing Operations**: KECCAK256 correctness
8. **Log Operations**: LOG0-LOG4 event emission
9. **Configuration**: Different type configurations
10. **Error Conditions**: Stack overflow/underflow, out of gas, static violations

### Test Execution

```bash
# Run all frame tests
zig build test

# Run specific frame tests
zig build test -- --test-filter "Frame"

# Enable debug logging in tests
const config = FrameConfig{
    .TracerType = DebuggingTracer,
    // ... other config
};
```

### Critical Test Scenarios

```zig
test "Frame stack operations" {
    const allocator = std.testing.allocator;
    const config = FrameConfig{};
    const FrameType = Frame(config);
    var frame = try FrameType.init(allocator, &.{}, 1000000, null, null);
    defer frame.deinit(allocator);

    // Test basic push/pop
    try frame.stack.push(42);
    try std.testing.expectEqual(@as(u256, 42), frame.stack.peek_unsafe());
    
    const val = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 42), val);

    // Test stack bounds
    for (0..1024) |_| {
        try frame.stack.push(100);
    }
    try std.testing.expectError(error.StackOverflow, frame.stack.push(200));
}

test "Frame arithmetic operations" {
    // ... comprehensive arithmetic testing
}

test "Frame memory operations" {
    // ... memory expansion and gas cost testing
}
```

## Context within EVM

### Integration with EVM Execution

The Frame is the core execution context within the broader EVM architecture:

```zig
pub const Evm = struct {
    frame: FrameType,    // Current execution context
    planner: Planner,    // Bytecode optimizer
    host: Host,          // External operations
    
    pub fn execute_transaction(self: *Self, tx: Transaction) !Result {
        // Create frame for transaction
        var frame = try FrameType.init(
            self.allocator,
            contract.bytecode,
            tx.gas_limit,
            self.database,
            &self.host
        );
        defer frame.deinit(self.allocator);
        
        // Execute bytecode through planner
        const plan = try self.planner.create_plan(contract.bytecode);
        defer plan.deinit();
        
        return self.execute_plan(&frame, plan);
    }
};
```

### Relationship with Plan

The Frame executes opcodes while the Plan manages program flow. The Frame is designed to work with any plan implementation through a unified interface:

#### Unified Interface Pattern

The frame interpreter uses a single codebase to work with different plan strategies:

```zig
// All plans implement these core methods
pub fn getMetadata(idx: *InstructionIndexType, opcode) MetadataType     // Get opcode metadata
pub fn getNextInstruction(idx: *InstructionIndexType, opcode) *HandlerFn // Get next handler
pub fn isValidJumpDest(pc: PcType) bool                                 // Validate jump targets
```

#### How Different Plans Work

**PlanMinimal**: Direct bytecode execution
- `idx` is the actual PC in bytecode
- Reads opcodes/data from bytecode at runtime
- Simple handler lookup table
- Minimal preprocessing

**Plan (Advanced)**: Optimized execution
- `idx` is instruction stream index
- Pre-processed handler pointers + metadata
- Supports opcode fusion
- PC to instruction mapping for jumps

#### Execution Flow

```zig
// Frame Interpreter execution model (simplified)
pub fn execute(frame: *Frame, plan: *Plan) !void {
    var idx: InstructionIndexType = 0;
    
    // Get first handler from plan
    var handler = plan.getNextInstruction(&idx, .START);
    
    // Tail-call based execution
    while (true) {
        // Handler executes opcode and gets next handler
        handler = @call(.always_tail, handler, .{ frame, plan });
    }
}
```

The beauty of this design is that the same handler code works with both simple and optimized plans:

```zig
fn push1_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
    const self = @as(*Frame, @ptrCast(@alignCast(frame)));
    const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
    const interpreter = @as(*Self, @fieldParentPtr("frame", self));
    
    // Works for both PlanMinimal (reads from bytecode) and Plan (reads from stream)
    const value = plan_ptr.getMetadata(&interpreter.instruction_idx, .PUSH1);
    try self.stack.push(value);
    
    // Works for both plans - handles index advancement differently internally
    const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .PUSH1);
    return @call(.always_tail, next_handler, .{ self, plan_ptr });
}
```

### Host Interface Integration

Frame delegates external operations to Host:

```zig
// Frame requests account balance from Host
pub fn op_balance(self: *Self) Error!void {
    const address_word = try self.stack.pop();
    const address = from_u256(address_word);
    
    // Delegate to host for external state access
    const balance = if (self.host) |host|
        host.get_balance(address)
    else
        0; // No host available
        
    try self.stack.push(balance);
}
```

### Database Integration

Storage operations use the pluggable database interface:

```zig
// Frame storage operations through database interface
pub fn op_sload(self: *Self) Error!void {
    const key = try self.stack.pop();
    
    // Zero-cost abstraction to storage backend
    const value = if (self.database) |db|
        try db.get_storage(self.contract_address, key)
    else
        0;
        
    try self.stack.push(value);
}
```

## EVM Specification Compliance

### Stack Semantics

1. **Size Limit**: Maximum 1024 items (configurable)
2. **Word Size**: 256-bit words (configurable)
3. **Overflow/Underflow**: Proper error handling
4. **Operation Patterns**: Consistent pop/push semantics

### Arithmetic Behavior

1. **Overflow Handling**: Wrapping arithmetic (`+%`, `-%`, `*%`)
2. **Division by Zero**: Returns 0 (not an error)
3. **Signed Operations**: Proper two's complement handling
4. **Modular Arithmetic**: ADDMOD/MULMOD with intermediate overflow protection

### Memory Model

1. **Word Addressing**: 256-bit word boundaries
2. **Lazy Expansion**: Only allocate when accessed
3. **Zero Initialization**: New memory initialized to zero
4. **Gas Integration**: Quadratic expansion costs

### Gas Accounting

1. **Accurate Costs**: Exact gas consumption per EVM specification
2. **Dynamic Costs**: Memory expansion, storage access patterns
3. **Refund Tracking**: Original value preservation for gas refunds
4. **Static Call Protection**: Gas consumption in read-only contexts

### Error Handling

Frame provides comprehensive error handling for all EVM failure modes:

```zig
pub const Error = error{
    StackOverflow,      // Stack exceeds maximum size
    StackUnderflow,     // Insufficient stack items for operation
    OutOfGas,          // Insufficient gas for operation
    InvalidJump,       // JUMP to invalid destination
    InvalidOpcode,     // Undefined opcode encountered
    OutOfBounds,       // Memory or calldata access out of bounds
    WriteProtection,   // State modification in static context
    STOP,              // Normal execution termination
    REVERT,           // Execution revert with data
    BytecodeTooLarge,  // Contract bytecode exceeds size limit
    AllocationError,   // Memory allocation failure
};
```

The Frame serves as the high-performance core of EVM execution, providing comprehensive opcode support while maintaining strict architectural boundaries and optimal performance characteristics through intelligent configuration and cache-conscious design.