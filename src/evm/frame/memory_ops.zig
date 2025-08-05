const std = @import("std");
const FrameFat = @import("frame_fat.zig");
const ExecutionError = @import("../execution/execution_error.zig");
const gas_constants = @import("../constants/gas_constants.zig");

/// Memory operations for the fat frame structure.
///
/// This module provides all memory manipulation functions that operate on the
/// shared memory buffer within FrameFat. Memory in the EVM is a byte-addressable
/// array that expands as needed and charges gas quadratically for expansion.
///
/// ## Memory Model
/// - Byte-addressable array starting at 0
/// - Expands automatically when accessed
/// - Charges gas for expansion (quadratic cost)
/// - Isolated per call frame via checkpoints
/// - Word-aligned for 32-byte operations
///
/// ## Gas Costs
/// Memory expansion follows the formula:
/// - memory_cost = (memory_size_word ^ 2) / 512 + (3 * memory_size_word)
/// - Where memory_size_word = (memory_size + 31) / 32

/// Memory error types
pub const MemoryError = error{
    OutOfMemory,
    InvalidMemoryAccess,
    OutOfOffset,
};

/// Calculate number of words from byte size.
///
/// @param size Size in bytes
/// @return Number of 32-byte words (rounded up)
pub inline fn calculate_num_words(size: u64) u64 {
    return (size + 31) / 32;
}

/// Calculate gas cost for memory expansion.
///
/// @param new_size New memory size in bytes
/// @param current_size Current memory size in bytes
/// @return Gas cost for expansion
pub fn calculate_memory_gas_cost(new_size: u64, current_size: u64) u64 {
    if (new_size <= current_size) return 0;
    
    const new_words = calculate_num_words(new_size);
    const current_words = calculate_num_words(current_size);
    
    // Gas cost formula: memory_word^2 / 512 + 3 * memory_word
    const new_cost = (new_words * new_words) / 512 + (3 * new_words);
    const current_cost = (current_words * current_words) / 512 + (3 * current_words);
    
    return new_cost - current_cost;
}

/// Get the size of memory for this frame's context.
///
/// @param frame The frame containing memory
/// @return Current memory size in bytes
pub fn memory_size(frame: *const FrameFat) usize {
    return frame.memory_size;
}

/// Ensure memory capacity for the given size.
///
/// Expands memory if needed and updates memory_size.
///
/// @param frame The frame containing memory
/// @param size Required size in bytes
/// @throws OutOfMemory if allocation fails
pub fn memory_ensure_capacity(frame: *FrameFat, size: usize) MemoryError!void {
    const required_size = frame.memory_checkpoint + size;
    
    if (required_size > frame.memory_buffer.items.len) {
        // Expand buffer
        try frame.memory_buffer.resize(required_size);
        
        // Zero new memory (EVM requirement)
        const old_len = frame.memory_size + frame.memory_checkpoint;
        @memset(frame.memory_buffer.items[old_len..required_size], 0);
    }
    
    if (size > frame.memory_size) {
        frame.memory_size = size;
    }
}

/// Read a single byte from memory.
///
/// @param frame The frame containing memory
/// @param offset Byte offset to read from
/// @return The byte value at offset, or 0 if out of bounds
pub fn memory_get_byte(frame: *const FrameFat, offset: usize) u8 {
    if (offset >= frame.memory_size) {
        return 0;
    }
    return frame.memory_buffer.items[frame.memory_checkpoint + offset];
}

/// Write a single byte to memory.
///
/// Expands memory if needed.
///
/// @param frame The frame containing memory
/// @param offset Byte offset to write to
/// @param value Byte value to write
/// @throws OutOfMemory if expansion fails
pub fn memory_set_byte(frame: *FrameFat, offset: usize, value: u8) MemoryError!void {
    if (offset >= frame.memory_size) {
        try memory_ensure_capacity(frame, offset + 1);
    }
    frame.memory_buffer.items[frame.memory_checkpoint + offset] = value;
}

/// Read a 32-byte word from memory.
///
/// @param frame The frame containing memory
/// @param offset Byte offset to start reading from
/// @return 256-bit value read from memory (big-endian)
pub fn memory_get_word(frame: *const FrameFat, offset: usize) u256 {
    var result: u256 = 0;
    var i: usize = 0;
    while (i < 32) : (i += 1) {
        const byte = memory_get_byte(frame, offset + i);
        result = (result << 8) | byte;
    }
    return result;
}

/// Write a 32-byte word to memory.
///
/// @param frame The frame containing memory
/// @param offset Byte offset to start writing at
/// @param value 256-bit value to write (big-endian)
/// @throws OutOfMemory if expansion fails
pub fn memory_set_word(frame: *FrameFat, offset: usize, value: u256) MemoryError!void {
    // Ensure capacity for entire word
    if (offset + 32 > frame.memory_size) {
        try memory_ensure_capacity(frame, offset + 32);
    }
    
    // Write word in big-endian format
    var val = value;
    var i: usize = 32;
    while (i > 0) {
        i -= 1;
        frame.memory_buffer.items[frame.memory_checkpoint + offset + i] = @truncate(val);
        val >>= 8;
    }
}

/// Read a slice of memory.
///
/// @param frame The frame containing memory
/// @param offset Starting byte offset
/// @param size Number of bytes to read
/// @return Slice of memory data (may be shorter if out of bounds)
pub fn memory_get_slice(frame: *const FrameFat, offset: usize, size: usize) []const u8 {
    if (offset >= frame.memory_size) {
        return &[_]u8{};
    }
    
    const available = frame.memory_size - offset;
    const read_size = @min(size, available);
    const start = frame.memory_checkpoint + offset;
    
    return frame.memory_buffer.items[start..start + read_size];
}

/// Copy data into memory.
///
/// @param frame The frame containing memory
/// @param offset Destination offset in memory
/// @param data Source data to copy
/// @throws OutOfMemory if expansion fails
pub fn memory_set_data(frame: *FrameFat, offset: usize, data: []const u8) MemoryError!void {
    if (data.len == 0) return;
    
    const end_offset = offset + data.len;
    if (end_offset > frame.memory_size) {
        try memory_ensure_capacity(frame, end_offset);
    }
    
    const dest_start = frame.memory_checkpoint + offset;
    @memcpy(frame.memory_buffer.items[dest_start..dest_start + data.len], data);
}

/// Copy data within memory (MCOPY operation).
///
/// Handles overlapping regions correctly.
///
/// @param frame The frame containing memory
/// @param dest Destination offset
/// @param src Source offset
/// @param size Number of bytes to copy
/// @throws OutOfMemory if expansion fails
pub fn memory_copy(frame: *FrameFat, dest: usize, src: usize, size: usize) MemoryError!void {
    if (size == 0) return;
    
    // Ensure both source and destination regions are in bounds
    const max_offset = @max(dest + size, src + size);
    if (max_offset > frame.memory_size) {
        try memory_ensure_capacity(frame, max_offset);
    }
    
    const base = frame.memory_checkpoint;
    const src_start = base + src;
    const dest_start = base + dest;
    
    // Use memmove for overlapping regions
    std.mem.copyForwards(u8, frame.memory_buffer.items[dest_start..dest_start + size], 
                         frame.memory_buffer.items[src_start..src_start + size]);
}

/// Set a bounded region of memory to a specific byte value.
///
/// Used for CALLDATACOPY with out-of-bounds source.
///
/// @param frame The frame containing memory
/// @param offset Starting offset
/// @param size Number of bytes to set
/// @param data Source data (may be shorter than size)
/// @throws OutOfMemory if expansion fails
pub fn memory_set_data_bounded(frame: *FrameFat, offset: usize, size: usize, data: []const u8) MemoryError!void {
    if (size == 0) return;
    
    const end_offset = offset + size;
    if (end_offset > frame.memory_size) {
        try memory_ensure_capacity(frame, end_offset);
    }
    
    const base = frame.memory_checkpoint + offset;
    const copy_size = @min(size, data.len);
    
    // Copy available data
    if (copy_size > 0) {
        @memcpy(frame.memory_buffer.items[base..base + copy_size], data[0..copy_size]);
    }
    
    // Zero pad the rest
    if (copy_size < size) {
        @memset(frame.memory_buffer.items[base + copy_size..base + size], 0);
    }
}

/// Clear memory for this frame (reset to checkpoint).
///
/// @param frame The frame containing memory
pub fn memory_clear(frame: *FrameFat) void {
    frame.memory_size = 0;
}

/// Check if offset would cause overflow.
///
/// @param offset Base offset
/// @param size Size to add
/// @return true if offset + size would overflow
pub fn memory_check_overflow(offset: u256, size: u256) bool {
    const max_u64 = std.math.maxInt(u64);
    return offset > max_u64 or size > max_u64 or offset + size > max_u64;
}

// ===== Tests =====

test "memory basic read/write operations" {
    const allocator = std.testing.allocator;
    
    var frame = try createTestFrame(allocator);
    defer frame.deinit();
    
    // Test byte operations
    try memory_set_byte(&frame, 0, 0xFF);
    try memory_set_byte(&frame, 100, 0xAB);
    
    try std.testing.expectEqual(@as(u8, 0xFF), memory_get_byte(&frame, 0));
    try std.testing.expectEqual(@as(u8, 0xAB), memory_get_byte(&frame, 100));
    try std.testing.expectEqual(@as(u8, 0), memory_get_byte(&frame, 50)); // unwritten = 0
    
    try std.testing.expectEqual(@as(usize, 101), memory_size(&frame));
}

test "memory word operations" {
    const allocator = std.testing.allocator;
    
    var frame = try createTestFrame(allocator);
    defer frame.deinit();
    
    // Test word read/write
    const test_value: u256 = 0xDEADBEEFCAFEBABE;
    try memory_set_word(&frame, 64, test_value);
    
    const read_value = memory_get_word(&frame, 64);
    try std.testing.expectEqual(test_value, read_value);
    
    // Test partial overlap read
    const overlap_value = memory_get_word(&frame, 80);
    try std.testing.expect(overlap_value != 0); // Should contain part of our value
}

test "memory slice operations" {
    const allocator = std.testing.allocator;
    
    var frame = try createTestFrame(allocator);
    defer frame.deinit();
    
    const test_data = "Hello, Ethereum!";
    try memory_set_data(&frame, 32, test_data);
    
    const read_data = memory_get_slice(&frame, 32, test_data.len);
    try std.testing.expectEqualSlices(u8, test_data, read_data);
    
    // Test out of bounds read
    const oob_data = memory_get_slice(&frame, 1000, 10);
    try std.testing.expectEqual(@as(usize, 0), oob_data.len);
}

test "memory copy operations" {
    const allocator = std.testing.allocator;
    
    var frame = try createTestFrame(allocator);
    defer frame.deinit();
    
    // Set up source data
    const src_data = [_]u8{ 1, 2, 3, 4, 5, 6, 7, 8 };
    try memory_set_data(&frame, 0, &src_data);
    
    // Test non-overlapping copy
    try memory_copy(&frame, 100, 0, 8);
    const copied = memory_get_slice(&frame, 100, 8);
    try std.testing.expectEqualSlices(u8, &src_data, copied);
    
    // Test overlapping copy (forward)
    try memory_copy(&frame, 4, 0, 8);
    try std.testing.expectEqual(@as(u8, 1), memory_get_byte(&frame, 4));
    try std.testing.expectEqual(@as(u8, 2), memory_get_byte(&frame, 5));
    
    // Test overlapping copy (backward)
    try memory_copy(&frame, 0, 4, 4);
    try std.testing.expectEqual(@as(u8, 1), memory_get_byte(&frame, 0));
    try std.testing.expectEqual(@as(u8, 2), memory_get_byte(&frame, 1));
}

test "memory bounded set operations" {
    const allocator = std.testing.allocator;
    
    var frame = try createTestFrame(allocator);
    defer frame.deinit();
    
    // Test with data shorter than requested size
    const short_data = [_]u8{ 0xAA, 0xBB };
    try memory_set_data_bounded(&frame, 10, 6, &short_data);
    
    // First two bytes should be our data
    try std.testing.expectEqual(@as(u8, 0xAA), memory_get_byte(&frame, 10));
    try std.testing.expectEqual(@as(u8, 0xBB), memory_get_byte(&frame, 11));
    
    // Rest should be zero-padded
    try std.testing.expectEqual(@as(u8, 0), memory_get_byte(&frame, 12));
    try std.testing.expectEqual(@as(u8, 0), memory_get_byte(&frame, 15));
}

test "memory expansion and gas calculation" {
    // Test gas cost calculation
    try std.testing.expectEqual(@as(u64, 0), calculate_memory_gas_cost(0, 0));
    try std.testing.expectEqual(@as(u64, 0), calculate_memory_gas_cost(32, 32));
    
    // First word costs 3 gas
    try std.testing.expectEqual(@as(u64, 3), calculate_memory_gas_cost(32, 0));
    
    // Second word costs 6 gas total (3 + 3)
    try std.testing.expectEqual(@as(u64, 3), calculate_memory_gas_cost(64, 32));
    
    // Larger expansions
    const large_cost = calculate_memory_gas_cost(1024, 0);
    try std.testing.expect(large_cost > 96); // 32 words * 3 minimum
}

test "memory overflow protection" {
    // Test overflow detection
    try std.testing.expect(memory_check_overflow(std.math.maxInt(u256), 1));
    try std.testing.expect(memory_check_overflow(std.math.maxInt(u64) + 1, 0));
    try std.testing.expect(!memory_check_overflow(1000, 1000));
}

test "memory child frame isolation" {
    const allocator = std.testing.allocator;
    
    var parent = try createTestFrame(allocator);
    defer parent.deinit();
    
    // Parent writes some data
    try memory_set_word(&parent, 0, 0x1111);
    
    // Create child frame
    var child = try FrameFat.init_child(&parent, 50000, parent.contract, parent.caller, &[_]u8{});
    defer child.deinit();
    
    // Child writes at same offset
    try memory_set_word(&child, 0, 0x2222);
    
    // Child's view should show its data
    try std.testing.expectEqual(@as(u256, 0x2222), memory_get_word(&child, 0));
    
    // Parent's view should be unchanged (due to checkpoint)
    try std.testing.expectEqual(@as(u256, 0x1111), memory_get_word(&parent, 0));
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