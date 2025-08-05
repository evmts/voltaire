const std = @import("std");
const FrameFat = @import("frame_fat.zig");
const ExecutionError = @import("../execution/execution_error.zig");

/// Return data operations for the fat frame structure.
///
/// This module provides functions to manage return data from CALL operations.
/// Return data is accessible via RETURNDATASIZE and RETURNDATACOPY opcodes
/// introduced in EIP-211 (Byzantium fork).
///
/// ## Return Data Model
/// - Set by CALL, DELEGATECALL, STATICCALL, CALLCODE operations
/// - Cleared before each new call
/// - Accessible for the remainder of the current frame
/// - Used for better error handling in smart contracts
///
/// ## EIP-211 Context
/// Before EIP-211, contracts couldn't access return data from failed calls,
/// making error handling difficult. This feature enables contracts to:
/// - Retrieve revert reasons from failed calls
/// - Access full return data regardless of pre-allocated buffer size
/// - Implement more sophisticated inter-contract communication

/// Return data error types
pub const ReturnDataError = error{
    ReturnDataOutOfBounds,
    OutOfMemory,
};

/// Get the size of current return data.
///
/// @param frame The frame containing return data
/// @return Size of return data in bytes
pub fn return_data_size(frame: *const FrameFat) usize {
    return frame.return_data.items.len;
}

/// Set new return data, replacing any existing data.
///
/// @param frame The frame containing return data
/// @param data New return data to set
/// @throws OutOfMemory if allocation fails
pub fn return_data_set(frame: *FrameFat, data: []const u8) ReturnDataError!void {
    frame.return_data.clearRetainingCapacity();
    try frame.return_data.appendSlice(data);
}

/// Clear return data.
///
/// @param frame The frame containing return data
pub fn return_data_clear(frame: *FrameFat) void {
    frame.return_data.clearRetainingCapacity();
}

/// Get a slice of return data.
///
/// @param frame The frame containing return data
/// @param offset Starting offset in return data
/// @param size Number of bytes to read
/// @return Slice of return data
/// @throws ReturnDataOutOfBounds if offset + size > return data size
pub fn return_data_get_slice(frame: *const FrameFat, offset: usize, size: usize) ReturnDataError![]const u8 {
    if (size == 0) {
        return &[_]u8{};
    }
    
    const data = frame.return_data.items;
    
    // Check bounds
    if (offset >= data.len) {
        return ReturnDataError.ReturnDataOutOfBounds;
    }
    
    const end = offset + size;
    if (end > data.len) {
        return ReturnDataError.ReturnDataOutOfBounds;
    }
    
    return data[offset..end];
}

/// Copy return data to memory (RETURNDATACOPY operation).
///
/// @param frame The frame containing return data and memory
/// @param mem_offset Destination offset in memory
/// @param return_offset Source offset in return data
/// @param size Number of bytes to copy
/// @throws ReturnDataOutOfBounds if return data access is out of bounds
/// @throws OutOfMemory if memory expansion fails
pub fn return_data_copy_to_memory(
    frame: *FrameFat,
    mem_offset: usize,
    return_offset: usize,
    size: usize,
) ReturnDataError!void {
    if (size == 0) {
        return;
    }
    
    // Get return data slice (this validates bounds)
    const data = try return_data_get_slice(frame, return_offset, size);
    
    // Copy to memory using memory operations
    const memory_ops = @import("memory_ops.zig");
    try memory_ops.memory_set_data(frame, mem_offset, data);
}

/// Check if return data offset + size would be out of bounds.
///
/// @param frame The frame containing return data
/// @param offset Starting offset
/// @param size Size to check
/// @return true if access would be out of bounds
pub fn return_data_check_bounds(frame: *const FrameFat, offset: u64, size: u64) bool {
    const data_len = frame.return_data.items.len;
    
    // Check for overflow
    if (offset > std.math.maxInt(usize) or size > std.math.maxInt(usize)) {
        return true;
    }
    
    // Check if offset alone is out of bounds
    if (offset > data_len) {
        return true;
    }
    
    // Check if offset + size overflows or exceeds bounds
    const end = std.math.add(u64, offset, size) catch return true;
    return end > data_len;
}

/// Get the full return data buffer.
///
/// @param frame The frame containing return data
/// @return The complete return data
pub fn return_data_get(frame: *const FrameFat) []const u8 {
    return frame.return_data.items;
}

/// Reserve capacity for return data.
///
/// Used to optimize allocations when the size is known in advance.
///
/// @param frame The frame containing return data
/// @param capacity Capacity to reserve
/// @throws OutOfMemory if allocation fails
pub fn return_data_ensure_capacity(frame: *FrameFat, capacity: usize) ReturnDataError!void {
    try frame.return_data.ensureUnusedCapacity(capacity);
}

// ===== Tests =====

test "return data basic operations" {
    const allocator = std.testing.allocator;
    
    var frame = try createTestFrame(allocator);
    defer frame.deinit();
    
    // Initially empty
    try std.testing.expectEqual(@as(usize, 0), return_data_size(&frame));
    
    // Set some data
    const test_data = "Hello, Ethereum!";
    try return_data_set(&frame, test_data);
    try std.testing.expectEqual(@as(usize, test_data.len), return_data_size(&frame));
    
    // Get the data back
    const retrieved = return_data_get(&frame);
    try std.testing.expectEqualSlices(u8, test_data, retrieved);
    
    // Clear data
    return_data_clear(&frame);
    try std.testing.expectEqual(@as(usize, 0), return_data_size(&frame));
}

test "return data slice operations" {
    const allocator = std.testing.allocator;
    
    var frame = try createTestFrame(allocator);
    defer frame.deinit();
    
    const test_data = [_]u8{ 0x00, 0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77 };
    try return_data_set(&frame, &test_data);
    
    // Test valid slice
    const slice = try return_data_get_slice(&frame, 2, 4);
    try std.testing.expectEqualSlices(u8, &[_]u8{ 0x22, 0x33, 0x44, 0x55 }, slice);
    
    // Test empty slice
    const empty = try return_data_get_slice(&frame, 0, 0);
    try std.testing.expectEqual(@as(usize, 0), empty.len);
    
    // Test out of bounds
    try std.testing.expectError(
        ReturnDataError.ReturnDataOutOfBounds,
        return_data_get_slice(&frame, 10, 1)
    );
    
    try std.testing.expectError(
        ReturnDataError.ReturnDataOutOfBounds,
        return_data_get_slice(&frame, 4, 5)
    );
}

test "return data bounds checking" {
    const allocator = std.testing.allocator;
    
    var frame = try createTestFrame(allocator);
    defer frame.deinit();
    
    try return_data_set(&frame, "12345678");
    
    // Valid accesses
    try std.testing.expect(!return_data_check_bounds(&frame, 0, 8));
    try std.testing.expect(!return_data_check_bounds(&frame, 4, 4));
    try std.testing.expect(!return_data_check_bounds(&frame, 7, 1));
    
    // Invalid accesses
    try std.testing.expect(return_data_check_bounds(&frame, 8, 1));
    try std.testing.expect(return_data_check_bounds(&frame, 0, 9));
    try std.testing.expect(return_data_check_bounds(&frame, 10, 0));
    
    // Overflow checks
    try std.testing.expect(return_data_check_bounds(&frame, std.math.maxInt(u64), 1));
    try std.testing.expect(return_data_check_bounds(&frame, 1, std.math.maxInt(u64)));
}

test "return data copy to memory" {
    const allocator = std.testing.allocator;
    
    var frame = try createTestFrame(allocator);
    defer frame.deinit();
    
    // Set up return data
    const return_data = [_]u8{ 0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0xFF };
    try return_data_set(&frame, &return_data);
    
    // Copy to memory
    try return_data_copy_to_memory(&frame, 32, 1, 4);
    
    // Verify memory contents
    const memory_ops = @import("memory_ops.zig");
    try std.testing.expectEqual(@as(u8, 0xBB), memory_ops.memory_get_byte(&frame, 32));
    try std.testing.expectEqual(@as(u8, 0xCC), memory_ops.memory_get_byte(&frame, 33));
    try std.testing.expectEqual(@as(u8, 0xDD), memory_ops.memory_get_byte(&frame, 34));
    try std.testing.expectEqual(@as(u8, 0xEE), memory_ops.memory_get_byte(&frame, 35));
    
    // Test out of bounds copy
    try std.testing.expectError(
        ReturnDataError.ReturnDataOutOfBounds,
        return_data_copy_to_memory(&frame, 0, 4, 4)
    );
}

test "return data replacement" {
    const allocator = std.testing.allocator;
    
    var frame = try createTestFrame(allocator);
    defer frame.deinit();
    
    // Set initial data
    try return_data_set(&frame, "First return data");
    try std.testing.expectEqual(@as(usize, 17), return_data_size(&frame));
    
    // Replace with new data
    try return_data_set(&frame, "Second");
    try std.testing.expectEqual(@as(usize, 6), return_data_size(&frame));
    try std.testing.expectEqualSlices(u8, "Second", return_data_get(&frame));
    
    // Replace with empty
    try return_data_set(&frame, "");
    try std.testing.expectEqual(@as(usize, 0), return_data_size(&frame));
}

test "return data capacity optimization" {
    const allocator = std.testing.allocator;
    
    var frame = try createTestFrame(allocator);
    defer frame.deinit();
    
    // Reserve capacity
    try return_data_ensure_capacity(&frame, 1024);
    
    // Multiple sets should reuse capacity
    var i: usize = 0;
    while (i < 10) : (i += 1) {
        const data = [_]u8{@intCast(i)} ** 100;
        try return_data_set(&frame, &data);
        try std.testing.expectEqual(@as(usize, 100), return_data_size(&frame));
    }
}

// Helper function to create a test frame
fn createTestFrame(allocator: std.mem.Allocator) !FrameFat {
    const Context = @import("../access_list/context.zig");
    const primitives = @import("primitives");
    const Contract = @import("./contract.zig");
    
    var context = Context{};
    var vm = struct {
        depth: u16 = 0,
        context: Context,
    }{
        .context = context,
    };
    
    const code = [_]u8{0};
    var contract = Contract{
        .address = primitives.Address.ZERO_ADDRESS,
        .code = &code,
        .code_hash = [_]u8{0} ** 32,
        .value = 0,
        .caller = primitives.Address.ZERO_ADDRESS,
        .call_type = .Call,
        .allocator = allocator,
        .accessed_storage_slots = null,
        .storage_pool = null,
        .gas_remaining = 0,
        .gas_refund_counter = 0,
        .last_opcode = 0,
        .is_static = false,
        .is_deployment = false,
    };
    
    return try FrameFat.init(
        allocator,
        &vm,
        100000,
        &contract,
        primitives.Address.ZERO_ADDRESS,
        &[_]u8{},
    );
}