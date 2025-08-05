const std = @import("std");
const FrameFat = @import("frame_fat.zig");
const ExecutionError = @import("../execution/execution_error.zig");

/// Stack operations for the fat frame structure.
///
/// This module provides all stack manipulation functions that operate on the
/// embedded stack within FrameFat. These operations maintain the same semantics
/// as the original Stack implementation but work directly with the fat frame's
/// inline stack data.
///
/// ## Design Principles
/// - Zero allocation for all operations
/// - Direct array access for maximum performance
/// - Safe and unsafe variants for different contexts
/// - Maintains EVM stack semantics (1024 max depth)
///
/// ## Safety Model
/// Safe operations include bounds checking, while unsafe variants assume
/// preconditions are met (used after jump table validation).

/// Stack error types matching EVM specification
pub const StackError = error{
    StackOverflow,
    StackUnderflow,
};

/// Push a value onto the stack (safe version).
///
/// @param frame The frame containing the stack
/// @param value The 256-bit value to push
/// @throws StackOverflow if stack is at capacity
pub fn stack_push(frame: *FrameFat, value: u256) StackError!void {
    if (frame.stack_size >= FrameFat.STACK_CAPACITY) {
        return StackError.StackOverflow;
    }
    frame.stack_data[frame.stack_size] = value;
    frame.stack_size += 1;
}

/// Push a value onto the stack (unsafe version).
///
/// Assumes stack has capacity. Used in opcode implementations after validation.
///
/// @param frame The frame containing the stack
/// @param value The 256-bit value to push
pub inline fn stack_push_unsafe(frame: *FrameFat, value: u256) void {
    frame.stack_data[frame.stack_size] = value;
    frame.stack_size += 1;
}

/// Pop a value from the stack (safe version).
///
/// @param frame The frame containing the stack
/// @return The popped value
/// @throws StackUnderflow if stack is empty
pub fn stack_pop(frame: *FrameFat) StackError!u256 {
    if (frame.stack_size == 0) {
        return StackError.StackUnderflow;
    }
    frame.stack_size -= 1;
    return frame.stack_data[frame.stack_size];
}

/// Pop a value from the stack (unsafe version).
///
/// Assumes stack is not empty. Used in opcode implementations after validation.
///
/// @param frame The frame containing the stack
/// @return The popped value
pub inline fn stack_pop_unsafe(frame: *FrameFat) u256 {
    frame.stack_size -= 1;
    return frame.stack_data[frame.stack_size];
}

/// Peek at the top value without popping (safe version).
///
/// @param frame The frame containing the stack
/// @return The top value
/// @throws StackUnderflow if stack is empty
pub fn stack_peek(frame: *const FrameFat) StackError!u256 {
    if (frame.stack_size == 0) {
        return StackError.StackUnderflow;
    }
    return frame.stack_data[frame.stack_size - 1];
}

/// Peek at the top value without popping (unsafe version).
///
/// @param frame The frame containing the stack
/// @return The top value
pub inline fn stack_peek_unsafe(frame: *const FrameFat) u256 {
    return frame.stack_data[frame.stack_size - 1];
}

/// Get value at index from top (safe version).
///
/// Index 0 is the top of the stack, 1 is second from top, etc.
///
/// @param frame The frame containing the stack
/// @param index Distance from top (0-based)
/// @return Value at the specified position
/// @throws StackUnderflow if index >= stack size
pub fn stack_get(frame: *const FrameFat, index: usize) StackError!u256 {
    if (index >= frame.stack_size) {
        return StackError.StackUnderflow;
    }
    return frame.stack_data[frame.stack_size - 1 - index];
}

/// Get value at index from top (unsafe version).
///
/// @param frame The frame containing the stack
/// @param index Distance from top (0-based)
/// @return Value at the specified position
pub inline fn stack_get_unsafe(frame: *const FrameFat, index: usize) u256 {
    return frame.stack_data[frame.stack_size - 1 - index];
}

/// Set value at index from top (safe version).
///
/// @param frame The frame containing the stack
/// @param index Distance from top (0-based)
/// @param value New value to set
/// @throws StackUnderflow if index >= stack size
pub fn stack_set(frame: *FrameFat, index: usize, value: u256) StackError!void {
    if (index >= frame.stack_size) {
        return StackError.StackUnderflow;
    }
    frame.stack_data[frame.stack_size - 1 - index] = value;
}

/// Set value at index from top (unsafe version).
///
/// @param frame The frame containing the stack
/// @param index Distance from top (0-based)
/// @param value New value to set
pub inline fn stack_set_unsafe(frame: *FrameFat, index: usize, value: u256) void {
    frame.stack_data[frame.stack_size - 1 - index] = value;
}

/// Duplicate the nth value from top (safe version).
///
/// DUP1 duplicates top (n=1), DUP2 duplicates second (n=2), etc.
///
/// @param frame The frame containing the stack
/// @param n Position to duplicate (1-based)
/// @throws StackUnderflow if n > stack size
/// @throws StackOverflow if stack is full
pub fn stack_dup(frame: *FrameFat, n: usize) StackError!void {
    if (n == 0 or n > frame.stack_size) {
        return StackError.StackUnderflow;
    }
    if (frame.stack_size >= FrameFat.STACK_CAPACITY) {
        return StackError.StackOverflow;
    }
    const value = frame.stack_data[frame.stack_size - n];
    frame.stack_data[frame.stack_size] = value;
    frame.stack_size += 1;
}

/// Duplicate the nth value from top (unsafe version).
///
/// @param frame The frame containing the stack
/// @param n Position to duplicate (1-based)
pub inline fn stack_dup_unsafe(frame: *FrameFat, n: usize) void {
    const value = frame.stack_data[frame.stack_size - n];
    frame.stack_data[frame.stack_size] = value;
    frame.stack_size += 1;
}

/// Swap the top value with the nth value (safe version).
///
/// SWAP1 swaps top with second (n=1), SWAP2 with third (n=2), etc.
///
/// @param frame The frame containing the stack
/// @param n Position to swap with (1-based)
/// @throws StackUnderflow if n+1 > stack size
pub fn stack_swap(frame: *FrameFat, n: usize) StackError!void {
    if (n == 0 or n >= frame.stack_size) {
        return StackError.StackUnderflow;
    }
    const top_index = frame.stack_size - 1;
    const swap_index = frame.stack_size - 1 - n;
    const temp = frame.stack_data[top_index];
    frame.stack_data[top_index] = frame.stack_data[swap_index];
    frame.stack_data[swap_index] = temp;
}

/// Swap the top value with the nth value (unsafe version).
///
/// @param frame The frame containing the stack
/// @param n Position to swap with (1-based)
pub inline fn stack_swap_unsafe(frame: *FrameFat, n: usize) void {
    const top_index = frame.stack_size - 1;
    const swap_index = frame.stack_size - 1 - n;
    const temp = frame.stack_data[top_index];
    frame.stack_data[top_index] = frame.stack_data[swap_index];
    frame.stack_data[swap_index] = temp;
}

/// Clear the stack.
///
/// @param frame The frame containing the stack
pub fn stack_clear(frame: *FrameFat) void {
    frame.stack_size = 0;
}

/// Get current stack size.
///
/// @param frame The frame containing the stack
/// @return Number of elements on the stack
pub inline fn stack_len(frame: *const FrameFat) usize {
    return frame.stack_size;
}

/// Check if stack is empty.
///
/// @param frame The frame containing the stack
/// @return true if stack has no elements
pub inline fn stack_is_empty(frame: *const FrameFat) bool {
    return frame.stack_size == 0;
}

/// Check if stack is full.
///
/// @param frame The frame containing the stack
/// @return true if stack is at capacity
pub inline fn stack_is_full(frame: *const FrameFat) bool {
    return frame.stack_size >= FrameFat.STACK_CAPACITY;
}

// ===== Tests =====

test "stack push and pop operations" {
    const allocator = std.testing.allocator;
    
    var frame = try createTestFrame(allocator);
    defer frame.deinit();
    
    // Test push and pop
    try stack_push(&frame, 100);
    try stack_push(&frame, 200);
    try stack_push(&frame, 300);
    
    try std.testing.expectEqual(@as(usize, 3), stack_len(&frame));
    
    try std.testing.expectEqual(@as(u256, 300), try stack_pop(&frame));
    try std.testing.expectEqual(@as(u256, 200), try stack_pop(&frame));
    try std.testing.expectEqual(@as(u256, 100), try stack_pop(&frame));
    
    try std.testing.expectEqual(@as(usize, 0), stack_len(&frame));
    try std.testing.expect(stack_is_empty(&frame));
}

test "stack underflow and overflow" {
    const allocator = std.testing.allocator;
    
    var frame = try createTestFrame(allocator);
    defer frame.deinit();
    
    // Test underflow
    try std.testing.expectError(StackError.StackUnderflow, stack_pop(&frame));
    try std.testing.expectError(StackError.StackUnderflow, stack_peek(&frame));
    
    // Fill stack to capacity
    var i: usize = 0;
    while (i < FrameFat.STACK_CAPACITY) : (i += 1) {
        try stack_push(&frame, i);
    }
    
    try std.testing.expect(stack_is_full(&frame));
    
    // Test overflow
    try std.testing.expectError(StackError.StackOverflow, stack_push(&frame, 9999));
}

test "stack peek and get operations" {
    const allocator = std.testing.allocator;
    
    var frame = try createTestFrame(allocator);
    defer frame.deinit();
    
    try stack_push(&frame, 10);
    try stack_push(&frame, 20);
    try stack_push(&frame, 30);
    
    // Test peek (doesn't modify stack)
    try std.testing.expectEqual(@as(u256, 30), try stack_peek(&frame));
    try std.testing.expectEqual(@as(usize, 3), stack_len(&frame));
    
    // Test get at various indices
    try std.testing.expectEqual(@as(u256, 30), try stack_get(&frame, 0)); // top
    try std.testing.expectEqual(@as(u256, 20), try stack_get(&frame, 1)); // second
    try std.testing.expectEqual(@as(u256, 10), try stack_get(&frame, 2)); // third
    
    // Test out of bounds
    try std.testing.expectError(StackError.StackUnderflow, stack_get(&frame, 3));
}

test "stack dup operations" {
    const allocator = std.testing.allocator;
    
    var frame = try createTestFrame(allocator);
    defer frame.deinit();
    
    try stack_push(&frame, 10);
    try stack_push(&frame, 20);
    try stack_push(&frame, 30);
    
    // DUP1 (duplicate top)
    try stack_dup(&frame, 1);
    try std.testing.expectEqual(@as(usize, 4), stack_len(&frame));
    try std.testing.expectEqual(@as(u256, 30), try stack_peek(&frame));
    
    // DUP3 (duplicate third from top)
    try stack_dup(&frame, 3);
    try std.testing.expectEqual(@as(usize, 5), stack_len(&frame));
    try std.testing.expectEqual(@as(u256, 20), try stack_peek(&frame));
    
    // Test invalid dup
    try std.testing.expectError(StackError.StackUnderflow, stack_dup(&frame, 10));
}

test "stack swap operations" {
    const allocator = std.testing.allocator;
    
    var frame = try createTestFrame(allocator);
    defer frame.deinit();
    
    try stack_push(&frame, 10);
    try stack_push(&frame, 20);
    try stack_push(&frame, 30);
    try stack_push(&frame, 40);
    
    // SWAP1 (swap top with second)
    try stack_swap(&frame, 1);
    try std.testing.expectEqual(@as(u256, 30), try stack_get(&frame, 0));
    try std.testing.expectEqual(@as(u256, 40), try stack_get(&frame, 1));
    
    // SWAP3 (swap top with fourth)
    try stack_swap(&frame, 3);
    try std.testing.expectEqual(@as(u256, 10), try stack_get(&frame, 0));
    try std.testing.expectEqual(@as(u256, 30), try stack_get(&frame, 3));
    
    // Test invalid swap
    try std.testing.expectError(StackError.StackUnderflow, stack_swap(&frame, 4));
}

test "stack unsafe operations" {
    const allocator = std.testing.allocator;
    
    var frame = try createTestFrame(allocator);
    defer frame.deinit();
    
    // Test unsafe push/pop
    stack_push_unsafe(&frame, 100);
    stack_push_unsafe(&frame, 200);
    
    try std.testing.expectEqual(@as(u256, 200), stack_pop_unsafe(&frame));
    try std.testing.expectEqual(@as(u256, 100), stack_peek_unsafe(&frame));
    
    // Test unsafe dup/swap
    stack_push_unsafe(&frame, 300);
    stack_dup_unsafe(&frame, 1);
    try std.testing.expectEqual(@as(u256, 300), stack_get_unsafe(&frame, 0));
    try std.testing.expectEqual(@as(u256, 300), stack_get_unsafe(&frame, 1));
    
    stack_swap_unsafe(&frame, 2);
    try std.testing.expectEqual(@as(u256, 100), stack_get_unsafe(&frame, 0));
    try std.testing.expectEqual(@as(u256, 300), stack_get_unsafe(&frame, 2));
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