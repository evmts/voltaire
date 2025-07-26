# Phase 1C: Execution Trace Primitives Implementation

## Context
You are implementing the third atomic component of Phase 1: the ExecutionTrace and StructLog primitive types. These structures represent detailed EVM execution traces obtained from `debug_traceTransaction` RPC calls, which are essential for comparing our EVM implementation against reference implementations.

## Prerequisites
- **No dependencies on other Phase 1 components**: This can be implemented independently
- **Basic primitives only**: Uses Hash and basic types from existing primitives

## Objective
Create robust, well-tested execution trace primitives in `src/primitives/trace.zig` that can handle complex EVM execution traces with proper memory management for large trace data.

## Technical Specification

### ExecutionTrace Structure
The ExecutionTrace represents the complete execution trace of a transaction:

**Execution Results**:
- `gas_used: u64` - Total gas consumed during execution
- `failed: bool` - Whether the transaction execution failed
- `return_value: []u8` - Data returned by the transaction (owned)

**Detailed Trace Data**:
- `struct_logs: []StructLog` - Array of execution steps (owned)

### StructLog Structure
Each StructLog represents a single EVM execution step:

**Execution Context**:
- `pc: u64` - Program counter (instruction pointer)
- `op: []const u8` - Opcode name (e.g., "PUSH1", "SSTORE") (owned)
- `gas: u64` - Gas remaining before this operation
- `gas_cost: u64` - Gas consumed by this operation
- `depth: u32` - Call depth (0 for main execution, 1+ for sub-calls)

**EVM State**:
- `stack: []u256` - EVM stack contents (owned)
- `memory: []u8` - EVM memory contents (owned)
- `storage: std.HashMap(Hash, Hash, std.hash_map.StringContext, 80)` - Storage changes (owned)

### Debug Tracing Concepts
- **Struct Logs**: Step-by-step execution trace showing each opcode
- **Gas Tracking**: Precise gas consumption at each step
- **State Capture**: Stack, memory, and storage state at each step
- **Call Depth**: Tracking of CALL, DELEGATECALL, STATICCALL nesting
- **Storage Changes**: Only modified storage slots are included

## Implementation Requirements

### File Structure
```zig
//! EVM Execution Trace - Debug trace data structures
//!
//! Represents detailed execution traces from debug_traceTransaction RPC calls.
//! These structures capture step-by-step EVM execution including opcode execution,
//! gas consumption, and state changes.
//!
//! ## Debug Tracing Overview
//! Debug tracing provides detailed insight into EVM execution:
//! - Each opcode execution is recorded as a StructLog
//! - Gas consumption is tracked at each step
//! - Stack, memory, and storage state is captured
//! - Call depth tracks nested contract calls
//!
//! ## Memory Management
//! ExecutionTrace and StructLog own their data and are responsible for cleanup.
//! Always call deinit() to prevent memory leaks.
//!
//! ## Usage Example
//! ```zig
//! var trace = ExecutionTrace{
//!     .return_value = try allocator.dupe(u8, return_data),
//!     .struct_logs = try allocator.alloc(StructLog, log_count),
//!     // ... other fields
//! };
//! defer trace.deinit(allocator);
//! ```

const std = @import("std");
const testing = std.testing;
const crypto_pkg = @import("crypto");
const Hash = crypto_pkg.Hash;
const Allocator = std.mem.Allocator;

pub const ExecutionTrace = struct {
    gas_used: u64,
    failed: bool,
    return_value: []u8, // Owned data
    struct_logs: []StructLog, // Owned array
    
    /// Clean up allocated memory for trace data
    pub fn deinit(self: *const ExecutionTrace, allocator: Allocator) void {
        allocator.free(self.return_value);
        for (self.struct_logs) |*log| {
            log.deinit(allocator);
        }
        allocator.free(self.struct_logs);
    }
    
    /// Get the number of execution steps
    pub fn getStepCount(self: *const ExecutionTrace) usize {
        return self.struct_logs.len;
    }
    
    /// Check if execution was successful
    pub fn isSuccess(self: *const ExecutionTrace) bool {
        return !self.failed;
    }
    
    /// Check if execution failed
    pub fn isFailure(self: *const ExecutionTrace) bool {
        return self.failed;
    }
    
    /// Get execution step by index
    pub fn getStep(self: *const ExecutionTrace, index: usize) ?*const StructLog {
        if (index >= self.struct_logs.len) return null;
        return &self.struct_logs[index];
    }
    
    /// Get the final execution step
    pub fn getFinalStep(self: *const ExecutionTrace) ?*const StructLog {
        if (self.struct_logs.len == 0) return null;
        return &self.struct_logs[self.struct_logs.len - 1];
    }
    
    /// Check if trace is empty (no steps)
    pub fn isEmpty(self: *const ExecutionTrace) bool {
        return self.struct_logs.len == 0;
    }
};

pub const StructLog = struct {
    // Execution context
    pc: u64,
    op: []const u8, // Owned string (e.g., "PUSH1", "SSTORE")
    gas: u64,
    gas_cost: u64,
    depth: u32,
    
    // EVM state
    stack: []u256, // Owned array
    memory: []u8, // Owned array
    storage: std.HashMap(Hash, Hash, std.hash_map.StringContext, 80), // Owned map
    
    /// Clean up allocated memory for struct log data
    pub fn deinit(self: *const StructLog, allocator: Allocator) void {
        allocator.free(self.op);
        allocator.free(self.stack);
        allocator.free(self.memory);
        // Note: HashMap.deinit() handles its own cleanup
        self.storage.deinit();
    }
    
    /// Get stack depth (number of items on stack)
    pub fn getStackDepth(self: *const StructLog) usize {
        return self.stack.len;
    }
    
    /// Get memory size in bytes
    pub fn getMemorySize(self: *const StructLog) usize {
        return self.memory.len;
    }
    
    /// Get number of storage changes
    pub fn getStorageChangeCount(self: *const StructLog) usize {
        return self.storage.count();
    }
    
    /// Get stack item by index (0 = top of stack)
    pub fn getStackItem(self: *const StructLog, index: usize) ?u256 {
        if (index >= self.stack.len) return null;
        return self.stack[index];
    }
    
    /// Get top of stack
    pub fn getStackTop(self: *const StructLog) ?u256 {
        if (self.stack.len == 0) return null;
        return self.stack[0];
    }
    
    /// Check if this is a main execution step (depth 0)
    pub fn isMainExecution(self: *const StructLog) bool {
        return self.depth == 0;
    }
    
    /// Check if this is a sub-call step (depth > 0)
    pub fn isSubCall(self: *const StructLog) bool {
        return self.depth > 0;
    }
    
    /// Get storage value for a key
    pub fn getStorageValue(self: *const StructLog, key: Hash) ?Hash {
        return self.storage.get(key);
    }
    
    /// Check if storage was modified
    pub fn hasStorageChanges(self: *const StructLog) bool {
        return self.storage.count() > 0;
    }
};

/// Helper function to create an empty ExecutionTrace
pub fn createEmptyTrace(allocator: Allocator) !ExecutionTrace {
    return ExecutionTrace{
        .gas_used = 0,
        .failed = false,
        .return_value = try allocator.alloc(u8, 0),
        .struct_logs = try allocator.alloc(StructLog, 0),
    };
}

/// Helper function to create an empty StructLog
pub fn createEmptyStructLog(allocator: Allocator, pc: u64, op: []const u8) !StructLog {
    return StructLog{
        .pc = pc,
        .op = try allocator.dupe(u8, op),
        .gas = 0,
        .gas_cost = 0,
        .depth = 0,
        .stack = try allocator.alloc(u256, 0),
        .memory = try allocator.alloc(u8, 0),
        .storage = std.HashMap(Hash, Hash, std.hash_map.StringContext, 80).init(allocator),
    };
}
```

### Memory Management Requirements
1. **Ownership**: ExecutionTrace owns all its data (return_value, struct_logs)
2. **StructLog Ownership**: Each StructLog owns its op, stack, memory, storage data
3. **Cleanup**: Must call `deinit()` on both ExecutionTrace and each StructLog
4. **Error Handling**: Use `errdefer` when transferring ownership to caller
5. **HashMap Management**: Storage HashMap handles its own memory management

### Helper Methods
Implement these convenience methods:

**ExecutionTrace Methods**:
- `getStepCount()` - Returns number of execution steps
- `isSuccess()` / `isFailure()` - Check execution result
- `getStep()` - Get step by index
- `getFinalStep()` - Get last execution step
- `isEmpty()` - Check if trace has no steps

**StructLog Methods**:
- `getStackDepth()` - Returns stack size
- `getMemorySize()` - Returns memory size
- `getStorageChangeCount()` - Returns number of storage changes
- `getStackItem()` / `getStackTop()` - Access stack data
- `isMainExecution()` / `isSubCall()` - Check call depth
- `getStorageValue()` - Get storage value by key
- `hasStorageChanges()` - Check if storage was modified

## Testing Requirements

### Test Categories
1. **Basic Construction** - Create traces with minimal data
2. **Memory Management** - Verify proper cleanup with deinit()
3. **Helper Methods** - Test all convenience methods
4. **Complex Traces** - Handle large traces with many steps
5. **Storage Management** - Test HashMap operations
6. **Edge Cases** - Handle empty traces, failed executions

### Required Test Cases

```zig
test "ExecutionTrace basic construction and cleanup" {
    const allocator = testing.allocator;
    
    // Create empty trace
    var trace = try createEmptyTrace(allocator);
    defer trace.deinit(allocator);
    
    try testing.expectEqual(@as(u64, 0), trace.gas_used);
    try testing.expect(trace.isSuccess());
    try testing.expect(!trace.isFailure());
    try testing.expect(trace.isEmpty());
    try testing.expectEqual(@as(usize, 0), trace.getStepCount());
}

test "ExecutionTrace failed execution" {
    const allocator = testing.allocator;
    
    const return_data = try allocator.dupe(u8, "revert reason");
    var struct_logs = try allocator.alloc(StructLog, 0);
    
    const trace = ExecutionTrace{
        .gas_used = 50000,
        .failed = true,
        .return_value = return_data,
        .struct_logs = struct_logs,
    };
    defer trace.deinit(allocator);
    
    try testing.expect(trace.isFailure());
    try testing.expect(!trace.isSuccess());
    try testing.expectEqual(@as(u64, 50000), trace.gas_used);
    try testing.expectEqualStrings("revert reason", trace.return_value);
}

test "StructLog basic construction and cleanup" {
    const allocator = testing.allocator;
    
    var log = try createEmptyStructLog(allocator, 0, "PUSH1");
    defer log.deinit(allocator);
    
    try testing.expectEqual(@as(u64, 0), log.pc);
    try testing.expectEqualStrings("PUSH1", log.op);
    try testing.expect(log.isMainExecution());
    try testing.expect(!log.isSubCall());
    try testing.expectEqual(@as(usize, 0), log.getStackDepth());
    try testing.expectEqual(@as(usize, 0), log.getMemorySize());
    try testing.expect(!log.hasStorageChanges());
}

test "StructLog with stack data" {
    const allocator = testing.allocator;
    
    // Create stack with some values
    var stack = try allocator.alloc(u256, 3);
    stack[0] = 0x42; // Top of stack
    stack[1] = 0x1337;
    stack[2] = 0xDEADBEEF;
    
    var log = StructLog{
        .pc = 10,
        .op = try allocator.dupe(u8, "ADD"),
        .gas = 1000,
        .gas_cost = 3,
        .depth = 0,
        .stack = stack,
        .memory = try allocator.alloc(u8, 0),
        .storage = std.HashMap(Hash, Hash, std.hash_map.StringContext, 80).init(allocator),
    };
    defer log.deinit(allocator);
    
    try testing.expectEqual(@as(usize, 3), log.getStackDepth());
    try testing.expectEqual(@as(u256, 0x42), log.getStackTop().?);
    try testing.expectEqual(@as(u256, 0x42), log.getStackItem(0).?);
    try testing.expectEqual(@as(u256, 0x1337), log.getStackItem(1).?);
    try testing.expectEqual(@as(u256, 0xDEADBEEF), log.getStackItem(2).?);
    
    // Test out of bounds
    try testing.expect(log.getStackItem(3) == null);
}

test "StructLog with memory data" {
    const allocator = testing.allocator;
    
    // Create memory with some data
    var memory = try allocator.alloc(u8, 64);
    @memset(memory, 0);
    memory[0] = 0xFF;
    memory[31] = 0xAA;
    memory[32] = 0xBB;
    memory[63] = 0xCC;
    
    var log = StructLog{
        .pc = 20,
        .op = try allocator.dupe(u8, "MSTORE"),
        .gas = 2000,
        .gas_cost = 6,
        .depth = 1, // Sub-call
        .stack = try allocator.alloc(u256, 0),
        .memory = memory,
        .storage = std.HashMap(Hash, Hash, std.hash_map.StringContext, 80).init(allocator),
    };
    defer log.deinit(allocator);
    
    try testing.expectEqual(@as(usize, 64), log.getMemorySize());
    try testing.expect(log.isSubCall());
    try testing.expect(!log.isMainExecution());
    try testing.expectEqual(@as(u8, 0xFF), log.memory[0]);
    try testing.expectEqual(@as(u8, 0xAA), log.memory[31]);
    try testing.expectEqual(@as(u8, 0xBB), log.memory[32]);
    try testing.expectEqual(@as(u8, 0xCC), log.memory[63]);
}

test "StructLog with storage changes" {
    const allocator = testing.allocator;
    
    var storage = std.HashMap(Hash, Hash, std.hash_map.StringContext, 80).init(allocator);
    
    // Add some storage changes
    const key1 = Hash{ .bytes = [_]u8{1} ** 32 };
    const value1 = Hash{ .bytes = [_]u8{2} ** 32 };
    const key2 = Hash{ .bytes = [_]u8{3} ** 32 };
    const value2 = Hash{ .bytes = [_]u8{4} ** 32 };
    
    try storage.put(key1, value1);
    try storage.put(key2, value2);
    
    var log = StructLog{
        .pc = 30,
        .op = try allocator.dupe(u8, "SSTORE"),
        .gas = 5000,
        .gas_cost = 20000,
        .depth = 0,
        .stack = try allocator.alloc(u256, 0),
        .memory = try allocator.alloc(u8, 0),
        .storage = storage,
    };
    defer log.deinit(allocator);
    
    try testing.expect(log.hasStorageChanges());
    try testing.expectEqual(@as(usize, 2), log.getStorageChangeCount());
    
    // Test storage retrieval
    const retrieved1 = log.getStorageValue(key1);
    try testing.expect(retrieved1 != null);
    try testing.expectEqualSlices(u8, &value1.bytes, &retrieved1.?.bytes);
    
    const retrieved2 = log.getStorageValue(key2);
    try testing.expect(retrieved2 != null);
    try testing.expectEqualSlices(u8, &value2.bytes, &retrieved2.?.bytes);
    
    // Test non-existent key
    const key3 = Hash{ .bytes = [_]u8{5} ** 32 };
    const retrieved3 = log.getStorageValue(key3);
    try testing.expect(retrieved3 == null);
}

test "ExecutionTrace with multiple steps" {
    const allocator = testing.allocator;
    
    // Create multiple struct logs
    var struct_logs = try allocator.alloc(StructLog, 3);
    
    struct_logs[0] = try createEmptyStructLog(allocator, 0, "PUSH1");
    struct_logs[0].gas = 1000;
    struct_logs[0].gas_cost = 3;
    
    struct_logs[1] = try createEmptyStructLog(allocator, 2, "PUSH1");
    struct_logs[1].gas = 997;
    struct_logs[1].gas_cost = 3;
    
    struct_logs[2] = try createEmptyStructLog(allocator, 4, "ADD");
    struct_logs[2].gas = 994;
    struct_logs[2].gas_cost = 3;
    
    const return_data = try allocator.dupe(u8, &[_]u8{0x42});
    
    const trace = ExecutionTrace{
        .gas_used = 9,
        .failed = false,
        .return_value = return_data,
        .struct_logs = struct_logs,
    };
    defer trace.deinit(allocator);
    
    try testing.expectEqual(@as(usize, 3), trace.getStepCount());
    try testing.expect(!trace.isEmpty());
    
    // Test step access
    const step0 = trace.getStep(0);
    try testing.expect(step0 != null);
    try testing.expectEqualStrings("PUSH1", step0.?.op);
    try testing.expectEqual(@as(u64, 0), step0.?.pc);
    
    const step1 = trace.getStep(1);
    try testing.expect(step1 != null);
    try testing.expectEqualStrings("PUSH1", step1.?.op);
    try testing.expectEqual(@as(u64, 2), step1.?.pc);
    
    const step2 = trace.getStep(2);
    try testing.expect(step2 != null);
    try testing.expectEqualStrings("ADD", step2.?.op);
    try testing.expectEqual(@as(u64, 4), step2.?.pc);
    
    // Test final step
    const final_step = trace.getFinalStep();
    try testing.expect(final_step != null);
    try testing.expectEqualStrings("ADD", final_step.?.op);
    
    // Test out of bounds
    const invalid_step = trace.getStep(3);
    try testing.expect(invalid_step == null);
}

test "ExecutionTrace memory management with complex data" {
    const allocator = testing.allocator;
    
    // Create a complex trace with nested data
    var struct_logs = try allocator.alloc(StructLog, 1);
    
    // Create complex struct log with all data types
    var stack = try allocator.alloc(u256, 2);
    stack[0] = 0x123456789ABCDEF0;
    stack[1] = 0xFEDCBA9876543210;
    
    var memory = try allocator.alloc(u8, 32);
    @memset(memory, 0xAB);
    
    var storage = std.HashMap(Hash, Hash, std.hash_map.StringContext, 80).init(allocator);
    const key = Hash{ .bytes = [_]u8{0xFF} ** 32 };
    const value = Hash{ .bytes = [_]u8{0x00} ** 32 };
    try storage.put(key, value);
    
    struct_logs[0] = StructLog{
        .pc = 100,
        .op = try allocator.dupe(u8, "COMPLEX_OP"),
        .gas = 10000,
        .gas_cost = 1000,
        .depth = 2,
        .stack = stack,
        .memory = memory,
        .storage = storage,
    };
    
    const return_data = try allocator.dupe(u8, "complex return data");
    
    const trace = ExecutionTrace{
        .gas_used = 1000,
        .failed = false,
        .return_value = return_data,
        .struct_logs = struct_logs,
    };
    defer trace.deinit(allocator);
    
    // Verify all data is accessible
    const step = trace.getStep(0).?;
    try testing.expectEqual(@as(usize, 2), step.getStackDepth());
    try testing.expectEqual(@as(usize, 32), step.getMemorySize());
    try testing.expectEqual(@as(usize, 1), step.getStorageChangeCount());
    try testing.expectEqualStrings("COMPLEX_OP", step.op);
    try testing.expectEqualStrings("complex return data", trace.return_value);
}
```

### Edge Case Testing
- **Empty Traces**: Traces with no execution steps
- **Failed Executions**: Traces with failed=true and revert data
- **Large Traces**: Traces with many execution steps
- **Deep Call Stacks**: High depth values for nested calls
- **Large Memory**: Memory arrays with significant size
- **Many Storage Changes**: Storage maps with many entries

## Integration Requirements

### Export to Primitives Module
Add to `src/primitives/root.zig`:
```zig
pub const ExecutionTrace = @import("trace.zig").ExecutionTrace;
pub const StructLog = @import("trace.zig").StructLog;
pub const createEmptyTrace = @import("trace.zig").createEmptyTrace;
pub const createEmptyStructLog = @import("trace.zig").createEmptyStructLog;
```

### Dependencies
- `Hash` from crypto package - For storage keys and values
- `std.HashMap` - For storage change tracking
- Basic Zig types (u64, u256, []u8, etc.)

## Success Criteria
- [ ] `src/primitives/trace.zig` compiles without errors
- [ ] All test cases pass with `zig build test`
- [ ] Memory management verified (no leaks in tests)
- [ ] Helper methods work correctly for all trace types
- [ ] HashMap storage management works properly
- [ ] Export added to `src/primitives/root.zig`
- [ ] Code follows CLAUDE.md standards (camelCase, defer patterns)
- [ ] Handles complex traces with large data structures

## Common Pitfalls to Avoid
1. **Memory Leaks**: Forgetting to call deinit() on HashMap or arrays
2. **HashMap Cleanup**: Not properly managing HashMap memory
3. **String Ownership**: Not properly managing opcode string memory
4. **Array Bounds**: Not checking stack/memory access bounds
5. **Null Pointer Issues**: Not handling empty traces/logs properly
6. **Storage Key Comparison**: Incorrect hash comparison for storage lookups

## Performance Considerations
- **Memory Layout**: Struct fields ordered for optimal packing
- **HashMap Efficiency**: Using appropriate HashMap configuration
- **Large Traces**: Consider memory pressure with complex traces
- **Stack Access**: Efficient stack item access patterns
- **Memory Copying**: Minimize unnecessary data copying
- **Storage Lookups**: Efficient hash-based storage access

## Future Compatibility
- **Extended Tracing**: Structure supports additional trace fields
- **New Opcodes**: Opcode string field supports future opcodes
- **Enhanced Storage**: Storage structure supports future enhancements
- **Call Frame Data**: Structure supports future call frame information

## Debug Tracing Context
Understanding debug traces is crucial for EVM verification:
- **Step-by-step Execution**: Each opcode execution is recorded
- **Gas Accounting**: Precise gas consumption tracking
- **State Snapshots**: Complete EVM state at each step
- **Call Tracking**: Nested contract call depth tracking
- **Storage Monitoring**: Only modified storage slots are recorded

This atomic prompt focuses solely on implementing robust, well-tested execution trace primitives that will serve as the foundation for EVM execution comparison and debugging in later phases.