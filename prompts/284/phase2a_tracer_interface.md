# Phase 2A: Tracer Interface and Data Structures Implementation

## Context
You are implementing the first atomic component of Phase 2: the core tracer interface and execution trace data structures. This establishes the foundation for EVM execution tracing that will enable detailed comparison between our implementation and network execution traces.

## Prerequisites
- **Phase 1C must be completed**: This prompt builds on the ExecutionTrace primitives
- **EVM architecture understanding**: Familiarity with existing EVM execution flow

## Objective
Create a robust, extensible tracer interface in `src/evm/tracing/tracer.zig` that can capture detailed EVM execution information with zero overhead when tracing is disabled.

## Technical Specification

### Tracer Interface Design Philosophy
The tracer uses a **vtable pattern** for:
- **Zero overhead when disabled**: No function calls when tracer is null
- **Extensibility**: Multiple tracer implementations (standard, minimal, custom)
- **Type safety**: Compile-time interface validation
- **Performance**: Inline-able interface methods

### Core Interface Architecture
The tracer interface captures execution at three key points:
1. **Before Step**: Opcode about to execute (PC, gas, stack size)
2. **After Step**: Opcode completed (gas cost, state changes)
3. **Finalization**: Execution completed (final gas usage, return value)

## Implementation Requirements

### File Structure
```zig
//! EVM Tracer Interface - Extensible execution tracing system
//!
//! Provides a vtable-based interface for capturing detailed EVM execution
//! information. Designed for zero overhead when tracing is disabled and
//! maximum flexibility when enabled.
//!
//! ## Design Principles
//! - Zero overhead when tracer is null
//! - Extensible vtable pattern for multiple implementations
//! - Comprehensive execution detail capture
//! - Memory-efficient state tracking
//!
//! ## Usage Example
//! ```zig
//! var standard_tracer = StandardTracer.init(allocator);
//! defer standard_tracer.deinit();
//! 
//! const tracer = standard_tracer.toTracer();
//! evm.setTracer(tracer);
//! 
//! // Execute with tracing
//! const result = try evm.execute(contract, input);
//! const trace = try tracer.getTrace(allocator);
//! defer trace.deinit(allocator);
//! ```

const std = @import("std");
const testing = std.testing;
const primitives = @import("primitives");
const Address = primitives.Address;
const ExecutionTrace = primitives.ExecutionTrace;
const StructLog = primitives.StructLog;
const crypto_pkg = @import("crypto");
const Hash = crypto_pkg.Hash;
const Allocator = std.mem.Allocator;

/// Tracer interface for capturing EVM execution details
pub const Tracer = struct {
    ptr: *anyopaque,
    vtable: *const VTable,
    
    pub const VTable = struct {
        /// Called before each opcode execution
        step_before: *const fn (ptr: *anyopaque, step_info: StepInfo) void,
        /// Called after each opcode execution
        step_after: *const fn (ptr: *anyopaque, step_result: StepResult) void,
        /// Called when execution completes
        finalize: *const fn (ptr: *anyopaque, final_result: FinalResult) void,
        /// Get the complete execution trace
        get_trace: *const fn (ptr: *anyopaque, allocator: Allocator) anyerror!ExecutionTrace,
        /// Clean up tracer resources
        deinit: *const fn (ptr: *anyopaque, allocator: Allocator) void,
    };
    
    /// Record information before opcode execution
    pub fn stepBefore(self: Tracer, step_info: StepInfo) void {
        self.vtable.step_before(self.ptr, step_info);
    }
    
    /// Record information after opcode execution
    pub fn stepAfter(self: Tracer, step_result: StepResult) void {
        self.vtable.step_after(self.ptr, step_result);
    }
    
    /// Finalize execution tracing
    pub fn finalize(self: Tracer, final_result: FinalResult) void {
        self.vtable.finalize(self.ptr, final_result);
    }
    
    /// Get the complete execution trace
    pub fn getTrace(self: Tracer, allocator: Allocator) !ExecutionTrace {
        return self.vtable.get_trace(self.ptr, allocator);
    }
    
    /// Clean up tracer resources
    pub fn deinit(self: Tracer, allocator: Allocator) void {
        self.vtable.deinit(self.ptr, allocator);
    }
};

/// Information available before opcode execution
pub const StepInfo = struct {
    /// Program counter (instruction pointer)
    pc: u64,
    /// Opcode byte value
    opcode: u8,
    /// Gas remaining before this operation
    gas_remaining: u64,
    /// Call depth (0 for main execution, 1+ for sub-calls)
    depth: u32,
    /// Address of the executing contract
    address: Address,
    /// Current stack size (number of items)
    stack_size: usize,
    /// Current memory size in bytes
    memory_size: usize,
    
    /// Check if this is main execution (depth 0)
    pub fn isMainExecution(self: *const StepInfo) bool {
        return self.depth == 0;
    }
    
    /// Check if this is a sub-call (depth > 0)
    pub fn isSubCall(self: *const StepInfo) bool {
        return self.depth > 0;
    }
};

/// Information available after opcode execution
pub const StepResult = struct {
    /// Gas consumed by this operation
    gas_cost: u64,
    /// Gas remaining after this operation
    gas_remaining: u64,
    /// Stack state changes during execution
    stack_changes: StackChanges,
    /// Memory state changes during execution
    memory_changes: MemoryChanges,
    /// Storage changes during execution
    storage_changes: []StorageChange,
    /// Log entries emitted during execution
    logs_emitted: []LogEntry,
    /// Error that occurred during execution (null if successful)
    error_occurred: ?ExecutionError,
    
    /// Clean up allocated memory for step result
    pub fn deinit(self: *const StepResult, allocator: Allocator) void {
        self.stack_changes.deinit(allocator);
        self.memory_changes.deinit(allocator);
        allocator.free(self.storage_changes);
        for (self.logs_emitted) |*log| {
            log.deinit(allocator);
        }
        allocator.free(self.logs_emitted);
    }
    
    /// Check if operation was successful
    pub fn isSuccess(self: *const StepResult) bool {
        return self.error_occurred == null;
    }
    
    /// Check if operation failed
    pub fn isFailure(self: *const StepResult) bool {
        return self.error_occurred != null;
    }
};

/// Final execution result information
pub const FinalResult = struct {
    /// Total gas consumed during execution
    gas_used: u64,
    /// Whether execution failed
    failed: bool,
    /// Data returned by execution
    return_value: []const u8,
    /// Final execution status
    status: ExecutionStatus,
    
    /// Check if execution was successful
    pub fn isSuccess(self: *const FinalResult) bool {
        return !self.failed and self.status == .Success;
    }
    
    /// Check if execution was reverted
    pub fn isRevert(self: *const FinalResult) bool {
        return self.failed and self.status == .Revert;
    }
};

/// Execution status enumeration
pub const ExecutionStatus = enum {
    Success,
    Revert,
    OutOfGas,
    InvalidOpcode,
    StackUnderflow,
    StackOverflow,
    InvalidJump,
    
    /// Convert status to string for debugging
    pub fn toString(self: ExecutionStatus) []const u8 {
        return switch (self) {
            .Success => "Success",
            .Revert => "Revert",
            .OutOfGas => "OutOfGas",
            .InvalidOpcode => "InvalidOpcode",
            .StackUnderflow => "StackUnderflow",
            .StackOverflow => "StackOverflow",
            .InvalidJump => "InvalidJump",
        };
    }
};

/// Stack state changes during opcode execution
pub const StackChanges = struct {
    /// Items pushed onto the stack
    items_pushed: []u256,
    /// Items popped from the stack
    items_popped: []u256,
    /// Current stack contents after operation
    current_stack: []u256,
    
    /// Clean up allocated memory for stack changes
    pub fn deinit(self: *const StackChanges, allocator: Allocator) void {
        allocator.free(self.items_pushed);
        allocator.free(self.items_popped);
        allocator.free(self.current_stack);
    }
    
    /// Get number of items pushed
    pub fn getPushCount(self: *const StackChanges) usize {
        return self.items_pushed.len;
    }
    
    /// Get number of items popped
    pub fn getPopCount(self: *const StackChanges) usize {
        return self.items_popped.len;
    }
    
    /// Get current stack depth
    pub fn getCurrentDepth(self: *const StackChanges) usize {
        return self.current_stack.len;
    }
};

/// Memory changes during opcode execution
pub const MemoryChanges = struct {
    /// Offset where memory was modified
    offset: u64,
    /// Data that was written to memory
    data: []u8,
    /// Current memory contents after operation
    current_memory: []u8,
    
    /// Clean up allocated memory for memory changes
    pub fn deinit(self: *const MemoryChanges, allocator: Allocator) void {
        allocator.free(self.data);
        allocator.free(self.current_memory);
    }
    
    /// Get size of memory modification
    pub fn getModificationSize(self: *const MemoryChanges) usize {
        return self.data.len;
    }
    
    /// Get current memory size
    pub fn getCurrentSize(self: *const MemoryChanges) usize {
        return self.current_memory.len;
    }
    
    /// Check if memory was modified
    pub fn wasModified(self: *const MemoryChanges) bool {
        return self.data.len > 0;
    }
};

/// Storage slot change during execution
pub const StorageChange = struct {
    /// Address of the contract whose storage changed
    address: Address,
    /// Storage slot that was modified
    slot: Hash,
    /// Previous value in the slot
    old_value: Hash,
    /// New value in the slot
    new_value: Hash,
    
    /// Check if this is a storage write (new value different from old)
    pub fn isWrite(self: *const StorageChange) bool {
        return !std.mem.eql(u8, &self.old_value.bytes, &self.new_value.bytes);
    }
    
    /// Check if this is a storage clear (new value is zero)
    pub fn isClear(self: *const StorageChange) bool {
        const zero_hash = Hash{ .bytes = [_]u8{0} ** 32 };
        return std.mem.eql(u8, &self.new_value.bytes, &zero_hash.bytes);
    }
};

/// Log entry emitted by LOG opcodes
pub const LogEntry = struct {
    /// Address of the contract that emitted the log
    address: Address,
    /// Log topics (indexed parameters)
    topics: []Hash,
    /// Log data (non-indexed parameters)
    data: []u8,
    
    /// Clean up allocated memory for log entry
    pub fn deinit(self: *const LogEntry, allocator: Allocator) void {
        allocator.free(self.topics);
        allocator.free(self.data);
    }
    
    /// Get number of topics
    pub fn getTopicCount(self: *const LogEntry) usize {
        return self.topics.len;
    }
    
    /// Get data size
    pub fn getDataSize(self: *const LogEntry) usize {
        return self.data.len;
    }
    
    /// Check if log has topics
    pub fn hasTopics(self: *const LogEntry) bool {
        return self.topics.len > 0;
    }
    
    /// Check if log has data
    pub fn hasData(self: *const LogEntry) bool {
        return self.data.len > 0;
    }
};

/// Execution error information
pub const ExecutionError = struct {
    /// Error type
    error_type: ErrorType,
    /// Human-readable error message
    message: []const u8,
    /// Program counter where error occurred
    pc: u64,
    /// Gas remaining when error occurred
    gas_remaining: u64,
    
    pub const ErrorType = enum {
        OutOfGas,
        InvalidOpcode,
        StackUnderflow,
        StackOverflow,
        InvalidJump,
        InvalidMemoryAccess,
        InvalidStorageAccess,
        RevertExecution,
        
        /// Convert error type to string
        pub fn toString(self: ErrorType) []const u8 {
            return switch (self) {
                .OutOfGas => "OutOfGas",
                .InvalidOpcode => "InvalidOpcode",
                .StackUnderflow => "StackUnderflow",
                .StackOverflow => "StackOverflow",
                .InvalidJump => "InvalidJump",
                .InvalidMemoryAccess => "InvalidMemoryAccess",
                .InvalidStorageAccess => "InvalidStorageAccess",
                .RevertExecution => "RevertExecution",
            };
        }
    };
    
    /// Check if error is recoverable
    pub fn isRecoverable(self: *const ExecutionError) bool {
        return self.error_type == .RevertExecution;
    }
    
    /// Check if error is fatal
    pub fn isFatal(self: *const ExecutionError) bool {
        return !self.isRecoverable();
    }
};

/// Helper function to create empty stack changes
pub fn createEmptyStackChanges(allocator: Allocator) !StackChanges {
    return StackChanges{
        .items_pushed = try allocator.alloc(u256, 0),
        .items_popped = try allocator.alloc(u256, 0),
        .current_stack = try allocator.alloc(u256, 0),
    };
}

/// Helper function to create empty memory changes
pub fn createEmptyMemoryChanges(allocator: Allocator) !MemoryChanges {
    return MemoryChanges{
        .offset = 0,
        .data = try allocator.alloc(u8, 0),
        .current_memory = try allocator.alloc(u8, 0),
    };
}

/// Helper function to create empty step result
pub fn createEmptyStepResult(allocator: Allocator) !StepResult {
    return StepResult{
        .gas_cost = 0,
        .gas_remaining = 0,
        .stack_changes = try createEmptyStackChanges(allocator),
        .memory_changes = try createEmptyMemoryChanges(allocator),
        .storage_changes = try allocator.alloc(StorageChange, 0),
        .logs_emitted = try allocator.alloc(LogEntry, 0),
        .error_occurred = null,
    };
}
```

### Interface Design Requirements
1. **Vtable Pattern**: Use function pointers for extensibility
2. **Zero Overhead**: No calls when tracer is null
3. **Memory Management**: Clear ownership and cleanup patterns
4. **Type Safety**: Compile-time interface validation
5. **Extensibility**: Support for multiple tracer implementations

### Data Structure Requirements
- **StepInfo**: Capture pre-execution state
- **StepResult**: Capture post-execution changes
- **FinalResult**: Capture execution completion
- **Helper Types**: Stack/memory/storage change tracking
- **Error Handling**: Comprehensive execution error information

## Testing Requirements

### Test Categories
1. **Interface Validation** - Test vtable pattern works correctly
2. **Data Structure Creation** - Test all helper creation functions
3. **Memory Management** - Verify proper cleanup of all structures
4. **Helper Methods** - Test all convenience methods
5. **Error Handling** - Test error type conversions and checks

### Required Test Cases

```zig
test "Tracer interface vtable pattern" {
    const allocator = testing.allocator;
    
    // Mock tracer implementation for testing
    const MockTracer = struct {
        step_before_called: bool = false,
        step_after_called: bool = false,
        finalize_called: bool = false,
        
        fn stepBefore(ptr: *anyopaque, step_info: StepInfo) void {
            const self: *@This() = @ptrCast(@alignCast(ptr));
            self.step_before_called = true;
            _ = step_info;
        }
        
        fn stepAfter(ptr: *anyopaque, step_result: StepResult) void {
            const self: *@This() = @ptrCast(@alignCast(ptr));
            self.step_after_called = true;
            _ = step_result;
        }
        
        fn finalize(ptr: *anyopaque, final_result: FinalResult) void {
            const self: *@This() = @ptrCast(@alignCast(ptr));
            self.finalize_called = true;
            _ = final_result;
        }
        
        fn getTrace(ptr: *anyopaque, alloc: Allocator) !ExecutionTrace {
            _ = ptr;
            return try primitives.createEmptyTrace(alloc);
        }
        
        fn deinitTracer(ptr: *anyopaque, alloc: Allocator) void {
            _ = ptr;
            _ = alloc;
        }
        
        fn toTracer(self: *@This()) Tracer {
            return Tracer{
                .ptr = self,
                .vtable = &.{
                    .step_before = stepBefore,
                    .step_after = stepAfter,
                    .finalize = finalize,
                    .get_trace = getTrace,
                    .deinit = deinitTracer,
                },
            };
        }
    };
    
    var mock_tracer = MockTracer{};
    const tracer = mock_tracer.toTracer();
    
    // Test interface calls
    const step_info = StepInfo{
        .pc = 0,
        .opcode = 0x01, // ADD
        .gas_remaining = 1000,
        .depth = 0,
        .address = Address.ZERO,
        .stack_size = 2,
        .memory_size = 0,
    };
    
    tracer.stepBefore(step_info);
    try testing.expect(mock_tracer.step_before_called);
    
    var step_result = try createEmptyStepResult(allocator);
    defer step_result.deinit(allocator);
    
    tracer.stepAfter(step_result);
    try testing.expect(mock_tracer.step_after_called);
    
    const final_result = FinalResult{
        .gas_used = 100,
        .failed = false,
        .return_value = &[_]u8{},
        .status = .Success,
    };
    
    tracer.finalize(final_result);
    try testing.expect(mock_tracer.finalize_called);
    
    // Test trace retrieval
    const trace = try tracer.getTrace(allocator);
    defer trace.deinit(allocator);
    
    try testing.expect(trace.isEmpty());
}

test "StepInfo helper methods" {
    const step_info = StepInfo{
        .pc = 100,
        .opcode = 0x60, // PUSH1
        .gas_remaining = 5000,
        .depth = 0,
        .address = Address.ZERO,
        .stack_size = 5,
        .memory_size = 64,
    };
    
    try testing.expect(step_info.isMainExecution());
    try testing.expect(!step_info.isSubCall());
    
    const sub_call_info = StepInfo{
        .pc = 200,
        .opcode = 0xf1, // CALL
        .gas_remaining = 3000,
        .depth = 1,
        .address = Address.ZERO,
        .stack_size = 10,
        .memory_size = 128,
    };
    
    try testing.expect(!sub_call_info.isMainExecution());
    try testing.expect(sub_call_info.isSubCall());
}

test "StepResult creation and cleanup" {
    const allocator = testing.allocator;
    
    var step_result = try createEmptyStepResult(allocator);
    defer step_result.deinit(allocator);
    
    try testing.expect(step_result.isSuccess());
    try testing.expect(!step_result.isFailure());
    try testing.expectEqual(@as(u64, 0), step_result.gas_cost);
    try testing.expectEqual(@as(u64, 0), step_result.gas_remaining);
}

test "StackChanges functionality" {
    const allocator = testing.allocator;
    
    // Create stack changes with some data
    var items_pushed = try allocator.alloc(u256, 2);
    items_pushed[0] = 0x42;
    items_pushed[1] = 0x1337;
    
    var items_popped = try allocator.alloc(u256, 1);
    items_popped[0] = 0xDEAD;
    
    var current_stack = try allocator.alloc(u256, 3);
    current_stack[0] = 0x42;
    current_stack[1] = 0x1337;
    current_stack[2] = 0xBEEF;
    
    const stack_changes = StackChanges{
        .items_pushed = items_pushed,
        .items_popped = items_popped,
        .current_stack = current_stack,
    };
    defer stack_changes.deinit(allocator);
    
    try testing.expectEqual(@as(usize, 2), stack_changes.getPushCount());
    try testing.expectEqual(@as(usize, 1), stack_changes.getPopCount());
    try testing.expectEqual(@as(usize, 3), stack_changes.getCurrentDepth());
}

test "MemoryChanges functionality" {
    const allocator = testing.allocator;
    
    const data = try allocator.dupe(u8, &[_]u8{ 0xDE, 0xAD, 0xBE, 0xEF });
    const current_memory = try allocator.alloc(u8, 64);
    @memset(current_memory, 0);
    @memcpy(current_memory[32..36], data);
    
    const memory_changes = MemoryChanges{
        .offset = 32,
        .data = data,
        .current_memory = current_memory,
    };
    defer memory_changes.deinit(allocator);
    
    try testing.expectEqual(@as(u64, 32), memory_changes.offset);
    try testing.expectEqual(@as(usize, 4), memory_changes.getModificationSize());
    try testing.expectEqual(@as(usize, 64), memory_changes.getCurrentSize());
    try testing.expect(memory_changes.wasModified());
}

test "StorageChange functionality" {
    const old_value = Hash{ .bytes = [_]u8{0} ** 32 };
    const new_value = Hash{ .bytes = [_]u8{0xFF} ** 32 };
    const zero_value = Hash{ .bytes = [_]u8{0} ** 32 };
    
    const storage_change = StorageChange{
        .address = Address.ZERO,
        .slot = Hash{ .bytes = [_]u8{1} ** 32 },
        .old_value = old_value,
        .new_value = new_value,
    };
    
    try testing.expect(storage_change.isWrite());
    try testing.expect(!storage_change.isClear());
    
    const clear_change = StorageChange{
        .address = Address.ZERO,
        .slot = Hash{ .bytes = [_]u8{1} ** 32 },
        .old_value = new_value,
        .new_value = zero_value,
    };
    
    try testing.expect(clear_change.isWrite());
    try testing.expect(clear_change.isClear());
}

test "LogEntry functionality" {
    const allocator = testing.allocator;
    
    var topics = try allocator.alloc(Hash, 2);
    topics[0] = Hash{ .bytes = [_]u8{1} ** 32 };
    topics[1] = Hash{ .bytes = [_]u8{2} ** 32 };
    
    const data = try allocator.dupe(u8, "test log data");
    
    const log_entry = LogEntry{
        .address = Address.ZERO,
        .topics = topics,
        .data = data,
    };
    defer log_entry.deinit(allocator);
    
    try testing.expectEqual(@as(usize, 2), log_entry.getTopicCount());
    try testing.expectEqual(@as(usize, 13), log_entry.getDataSize());
    try testing.expect(log_entry.hasTopics());
    try testing.expect(log_entry.hasData());
}

test "ExecutionError functionality" {
    const error_info = ExecutionError{
        .error_type = .OutOfGas,
        .message = "insufficient gas",
        .pc = 150,
        .gas_remaining = 0,
    };
    
    try testing.expect(error_info.isFatal());
    try testing.expect(!error_info.isRecoverable());
    try testing.expectEqualStrings("OutOfGas", error_info.error_type.toString());
    
    const revert_error = ExecutionError{
        .error_type = .RevertExecution,
        .message = "execution reverted",
        .pc = 200,
        .gas_remaining = 1000,
    };
    
    try testing.expect(!revert_error.isFatal());
    try testing.expect(revert_error.isRecoverable());
}

test "ExecutionStatus functionality" {
    try testing.expectEqualStrings("Success", ExecutionStatus.Success.toString());
    try testing.expectEqualStrings("Revert", ExecutionStatus.Revert.toString());
    try testing.expectEqualStrings("OutOfGas", ExecutionStatus.OutOfGas.toString());
}

test "FinalResult functionality" {
    const success_result = FinalResult{
        .gas_used = 21000,
        .failed = false,
        .return_value = &[_]u8{0x42},
        .status = .Success,
    };
    
    try testing.expect(success_result.isSuccess());
    try testing.expect(!success_result.isRevert());
    
    const revert_result = FinalResult{
        .gas_used = 15000,
        .failed = true,
        .return_value = "revert reason",
        .status = .Revert,
    };
    
    try testing.expect(!revert_result.isSuccess());
    try testing.expect(revert_result.isRevert());
}

test "Helper creation functions" {
    const allocator = testing.allocator;
    
    // Test empty stack changes creation
    var stack_changes = try createEmptyStackChanges(allocator);
    defer stack_changes.deinit(allocator);
    
    try testing.expectEqual(@as(usize, 0), stack_changes.getPushCount());
    try testing.expectEqual(@as(usize, 0), stack_changes.getPopCount());
    try testing.expectEqual(@as(usize, 0), stack_changes.getCurrentDepth());
    
    // Test empty memory changes creation
    var memory_changes = try createEmptyMemoryChanges(allocator);
    defer memory_changes.deinit(allocator);
    
    try testing.expectEqual(@as(u64, 0), memory_changes.offset);
    try testing.expectEqual(@as(usize, 0), memory_changes.getModificationSize());
    try testing.expectEqual(@as(usize, 0), memory_changes.getCurrentSize());
    try testing.expect(!memory_changes.wasModified());
    
    // Test empty step result creation
    var step_result = try createEmptyStepResult(allocator);
    defer step_result.deinit(allocator);
    
    try testing.expect(step_result.isSuccess());
    try testing.expectEqual(@as(u64, 0), step_result.gas_cost);
}
```

### Edge Case Testing
- **Null Tracer**: Test interface behavior with null tracer
- **Memory Pressure**: Test with large stack/memory/storage changes
- **Error Conditions**: Test all execution error types
- **Deep Call Stacks**: Test with high depth values
- **Large Data**: Test with large memory and storage changes

## Integration Requirements

### Export to EVM Module
Add to `src/evm/root.zig`:
```zig
pub const Tracer = @import("tracing/tracer.zig").Tracer;
pub const StepInfo = @import("tracing/tracer.zig").StepInfo;
pub const StepResult = @import("tracing/tracer.zig").StepResult;
pub const FinalResult = @import("tracing/tracer.zig").FinalResult;
pub const ExecutionError = @import("tracing/tracer.zig").ExecutionError;
pub const StackChanges = @import("tracing/tracer.zig").StackChanges;
pub const MemoryChanges = @import("tracing/tracer.zig").MemoryChanges;
pub const StorageChange = @import("tracing/tracer.zig").StorageChange;
pub const LogEntry = @import("tracing/tracer.zig").LogEntry;
```

### Dependencies
- **Phase 1C primitives**: ExecutionTrace and StructLog types
- **Address and Hash**: From primitives package
- **Standard library**: For allocator and testing

## Success Criteria
- [ ] `src/evm/tracing/tracer.zig` compiles without errors
- [ ] All test cases pass with `zig build test`
- [ ] Vtable pattern works correctly with mock implementations
- [ ] All data structures have proper memory management
- [ ] Helper methods work correctly for all types
- [ ] Error handling covers all execution error types
- [ ] Export added to `src/evm/root.zig`
- [ ] Code follows CLAUDE.md standards (camelCase, defer patterns)

## Common Pitfalls to Avoid
1. **Vtable Alignment**: Incorrect pointer casting in vtable implementations
2. **Memory Leaks**: Not properly cleaning up nested data structures
3. **Interface Violations**: Vtable functions not matching expected signatures
4. **Null Pointer Issues**: Not handling optional tracer correctly
5. **Data Ownership**: Confusion about who owns allocated data
6. **Type Safety**: Incorrect anyopaque pointer casting

## Performance Considerations
- **Zero Overhead**: Interface must have no cost when tracer is null
- **Vtable Efficiency**: Function pointers should be cache-friendly
- **Memory Layout**: Struct fields ordered for optimal packing
- **Allocation Strategy**: Minimize allocations in hot paths
- **Inline Functions**: Interface methods should be inlinable

## Future Compatibility
- **Multiple Tracers**: Interface supports different tracer implementations
- **Extended Data**: Structure allows for additional trace information
- **Custom Tracers**: Framework for user-defined tracing logic
- **Performance Tracers**: Support for minimal overhead tracing modes

## Integration with Future Phases
This interface will be used by:
- **Phase 2B**: StandardTracer will implement this interface
- **Phase 2C**: EVM will use this interface for execution hooks
- **Phase 2D**: State capture utilities will populate these data structures
- **Phase 4**: Main test will use traces for comparison with network data

This atomic prompt focuses solely on implementing the core tracer interface and data structures that will serve as the foundation for all EVM execution tracing capabilities.