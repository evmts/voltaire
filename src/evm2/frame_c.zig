const std = @import("std");
const frame_mod = @import("frame.zig");

// ============================================================================
// FRAME C API - EVM Frame operations exported to C
// ============================================================================

// Create our frame type with default config for C API
pub const Frame = frame_mod.createColdFrame(.{});
pub const allocator = std.heap.c_allocator;

// ============================================================================
// ERROR CODES
// ============================================================================

pub const EVM_SUCCESS: c_int = 0;
pub const EVM_ERROR_STACK_OVERFLOW: c_int = -1;
pub const EVM_ERROR_STACK_UNDERFLOW: c_int = -2;
pub const EVM_ERROR_OUT_OF_GAS: c_int = -3;
pub const EVM_ERROR_INVALID_JUMP: c_int = -4;
pub const EVM_ERROR_INVALID_OPCODE: c_int = -5;
pub const EVM_ERROR_OUT_OF_BOUNDS: c_int = -6;
pub const EVM_ERROR_ALLOCATION: c_int = -7;
pub const EVM_ERROR_BYTECODE_TOO_LARGE: c_int = -8;
pub const EVM_ERROR_STOP: c_int = -9;
pub const EVM_ERROR_NULL_POINTER: c_int = -10;

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

pub fn zigErrorToCError(err: Frame.Error) c_int {
    return switch (err) {
        Frame.Error.StackOverflow => EVM_ERROR_STACK_OVERFLOW,
        Frame.Error.StackUnderflow => EVM_ERROR_STACK_UNDERFLOW,
        Frame.Error.OutOfGas => EVM_ERROR_OUT_OF_GAS,
        Frame.Error.InvalidJump => EVM_ERROR_INVALID_JUMP,
        Frame.Error.InvalidOpcode => EVM_ERROR_INVALID_OPCODE,
        Frame.Error.OutOfBounds => EVM_ERROR_OUT_OF_BOUNDS,
        Frame.Error.AllocationError => EVM_ERROR_ALLOCATION,
        Frame.Error.BytecodeTooLarge => EVM_ERROR_BYTECODE_TOO_LARGE,
        Frame.Error.STOP => EVM_ERROR_STOP,
    };
}

// Wrapper struct to hold frame and owned bytecode
pub const FrameHandle = struct {
    frame: Frame,
    bytecode_owned: []u8,
    initial_gas: u64,
    is_stopped: bool,
};

// ============================================================================
// FRAME LIFECYCLE
// ============================================================================

/// Create a new EVM frame with the given bytecode and initial gas
/// Returns opaque pointer to frame handle, or null on failure
export fn evm_frame_create(
    bytecode: [*]const u8,
    bytecode_len: usize,
    initial_gas: u64
) ?*anyopaque {
    // Validate inputs
    if (bytecode_len == 0) {
        return null;
    }
    
    // Create handle
    const handle = allocator.create(FrameHandle) catch return null;
    errdefer allocator.destroy(handle);
    
    // Copy bytecode (we own it)
    const bytecode_slice = bytecode[0..bytecode_len];
    handle.bytecode_owned = allocator.dupe(u8, bytecode_slice) catch {
        allocator.destroy(handle);
        return null;
    };
    errdefer allocator.free(handle.bytecode_owned);
    
    // Initialize frame
    handle.frame = Frame.init(allocator, handle.bytecode_owned, @intCast(initial_gas)) catch {
        allocator.free(handle.bytecode_owned);
        allocator.destroy(handle);
        return null;
    };
    
    handle.initial_gas = initial_gas;
    handle.is_stopped = false;
    
    return @ptrCast(handle);
}

/// Destroy frame and free all associated memory
export fn evm_frame_destroy(frame_ptr: ?*anyopaque) void {
    if (frame_ptr) |ptr| {
        const handle: *FrameHandle = @ptrCast(@alignCast(ptr));
        handle.frame.deinit(allocator);
        allocator.free(handle.bytecode_owned);
        allocator.destroy(handle);
    }
}

/// Reset frame to initial state with new gas amount
export fn evm_frame_reset(frame_ptr: ?*anyopaque, new_gas: u64) c_int {
    const handle: *FrameHandle = @ptrCast(@alignCast(frame_ptr orelse return EVM_ERROR_NULL_POINTER));
    
    // Deinitialize current frame
    handle.frame.deinit(allocator);
    
    // Reinitialize with same bytecode
    handle.frame = Frame.init(allocator, handle.bytecode_owned, @intCast(new_gas)) catch |err| {
        return zigErrorToCError(err);
    };
    
    handle.initial_gas = new_gas;
    handle.is_stopped = false;
    return EVM_SUCCESS;
}

// ============================================================================
// EXECUTION
// ============================================================================

/// Execute frame until completion or error
export fn evm_frame_execute(frame_ptr: ?*anyopaque) c_int {
    const handle: *FrameHandle = @ptrCast(@alignCast(frame_ptr orelse return EVM_ERROR_NULL_POINTER));
    
    if (handle.is_stopped) return EVM_ERROR_STOP;
    
    handle.frame.interpret(allocator) catch |err| {
        handle.is_stopped = true;
        return zigErrorToCError(err);
    };
    
    handle.is_stopped = true;
    return EVM_SUCCESS;
}

// ============================================================================
// STACK OPERATIONS
// ============================================================================

/// Push a 64-bit value onto the stack (zero-extended to 256 bits)
export fn evm_frame_push_u64(frame_ptr: ?*anyopaque, value: u64) c_int {
    const handle: *FrameHandle = @ptrCast(@alignCast(frame_ptr orelse return EVM_ERROR_NULL_POINTER));
    
    handle.frame.push(@as(u256, value)) catch |err| {
        return zigErrorToCError(err);
    };
    
    return EVM_SUCCESS;
}

/// Push a 32-bit value onto the stack (zero-extended to 256 bits)
export fn evm_frame_push_u32(frame_ptr: ?*anyopaque, value: u32) c_int {
    const handle: *FrameHandle = @ptrCast(@alignCast(frame_ptr orelse return EVM_ERROR_NULL_POINTER));
    
    handle.frame.push(@as(u256, value)) catch |err| {
        return zigErrorToCError(err);
    };
    
    return EVM_SUCCESS;
}

/// Push 256-bit value from byte array (big-endian)
export fn evm_frame_push_bytes(frame_ptr: ?*anyopaque, bytes: [*]const u8, len: usize) c_int {
    const handle: *FrameHandle = @ptrCast(@alignCast(frame_ptr orelse return EVM_ERROR_NULL_POINTER));
    
    if (len > 32) return EVM_ERROR_OUT_OF_BOUNDS;
    
    var value: u256 = 0;
    const bytes_slice = bytes[0..len];
    
    // Convert big-endian bytes to u256
    for (bytes_slice) |byte| {
        value = (value << 8) | byte;
    }
    
    handle.frame.push(value) catch |err| {
        return zigErrorToCError(err);
    };
    
    return EVM_SUCCESS;
}

/// Pop value from stack and return as 64-bit (truncated if larger)
export fn evm_frame_pop_u64(frame_ptr: ?*anyopaque, value_out: *u64) c_int {
    const handle: *FrameHandle = @ptrCast(@alignCast(frame_ptr orelse return EVM_ERROR_NULL_POINTER));
    
    const result = handle.frame.pop() catch |err| {
        return zigErrorToCError(err);
    };
    
    value_out.* = @truncate(result);
    return EVM_SUCCESS;
}

/// Pop value from stack and return as 32-bit (truncated if larger)
export fn evm_frame_pop_u32(frame_ptr: ?*anyopaque, value_out: *u32) c_int {
    const handle: *FrameHandle = @ptrCast(@alignCast(frame_ptr orelse return EVM_ERROR_NULL_POINTER));
    
    const result = handle.frame.pop() catch |err| {
        return zigErrorToCError(err);
    };
    
    value_out.* = @truncate(result);
    return EVM_SUCCESS;
}

/// Pop value from stack and return as byte array (big-endian, 32 bytes)
export fn evm_frame_pop_bytes(frame_ptr: ?*anyopaque, bytes_out: [*]u8) c_int {
    const handle: *FrameHandle = @ptrCast(@alignCast(frame_ptr orelse return EVM_ERROR_NULL_POINTER));
    
    const result = handle.frame.pop() catch |err| {
        return zigErrorToCError(err);
    };
    
    // Convert u256 to big-endian bytes
    var value = result;
    var i: usize = 32;
    while (i > 0) {
        i -= 1;
        bytes_out[i] = @truncate(value & 0xFF);
        value >>= 8;
    }
    
    return EVM_SUCCESS;
}

/// Peek at top of stack without removing (return as 64-bit)
export fn evm_frame_peek_u64(frame_ptr: ?*anyopaque, value_out: *u64) c_int {
    const handle: *FrameHandle = @ptrCast(@alignCast(frame_ptr orelse return EVM_ERROR_NULL_POINTER));
    
    const result = handle.frame.peek() catch |err| {
        return zigErrorToCError(err);
    };
    
    value_out.* = @truncate(result);
    return EVM_SUCCESS;
}

/// Get current stack depth
export fn evm_frame_stack_size(frame_ptr: ?*anyopaque) u32 {
    const handle: *FrameHandle = @ptrCast(@alignCast(frame_ptr orelse return 0));
    return @intCast(handle.frame.next_stack_index);
}

/// Get maximum stack capacity
export fn evm_frame_stack_capacity(frame_ptr: ?*anyopaque) u32 {
    _ = frame_ptr;
    // Default frame config uses 1024 stack size
    return 1024;
}

// ============================================================================
// STATE INSPECTION
// ============================================================================

/// Get remaining gas
export fn evm_frame_get_gas_remaining(frame_ptr: ?*anyopaque) u64 {
    const handle: *FrameHandle = @ptrCast(@alignCast(frame_ptr orelse return 0));
    return if (handle.frame.gas_remaining < 0) 0 else @intCast(handle.frame.gas_remaining);
}

/// Get gas used so far
export fn evm_frame_get_gas_used(frame_ptr: ?*anyopaque) u64 {
    const handle: *FrameHandle = @ptrCast(@alignCast(frame_ptr orelse return 0));
    const remaining = if (handle.frame.gas_remaining < 0) 0 else @as(u64, @intCast(handle.frame.gas_remaining));
    return handle.initial_gas - remaining;
}

/// Get current program counter
export fn evm_frame_get_pc(frame_ptr: ?*anyopaque) u32 {
    const handle: *FrameHandle = @ptrCast(@alignCast(frame_ptr orelse return 0));
    return @intCast(handle.frame.pc);
}

/// Get bytecode length
export fn evm_frame_get_bytecode_len(frame_ptr: ?*anyopaque) usize {
    const handle: *FrameHandle = @ptrCast(@alignCast(frame_ptr orelse return 0));
    return handle.frame.bytecode.len;
}

/// Get current opcode at PC (returns 0xFF if out of bounds)
export fn evm_frame_get_current_opcode(frame_ptr: ?*anyopaque) u8 {
    const handle: *FrameHandle = @ptrCast(@alignCast(frame_ptr orelse return 0xFF));
    
    if (handle.frame.pc >= handle.frame.bytecode.len) return 0xFF;
    return handle.frame.bytecode[handle.frame.pc];
}

/// Check if execution has stopped
export fn evm_frame_is_stopped(frame_ptr: ?*anyopaque) bool {
    const handle: *FrameHandle = @ptrCast(@alignCast(frame_ptr orelse return true));
    return handle.is_stopped;
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/// Convert error code to human-readable string
export fn evm_error_string(error_code: c_int) [*:0]const u8 {
    return switch (error_code) {
        EVM_SUCCESS => "Success",
        EVM_ERROR_STACK_OVERFLOW => "Stack overflow",
        EVM_ERROR_STACK_UNDERFLOW => "Stack underflow", 
        EVM_ERROR_OUT_OF_GAS => "Out of gas",
        EVM_ERROR_INVALID_JUMP => "Invalid jump destination",
        EVM_ERROR_INVALID_OPCODE => "Invalid opcode",
        EVM_ERROR_OUT_OF_BOUNDS => "Out of bounds access",
        EVM_ERROR_ALLOCATION => "Memory allocation failed",
        EVM_ERROR_BYTECODE_TOO_LARGE => "Bytecode too large",
        EVM_ERROR_STOP => "Execution stopped",
        EVM_ERROR_NULL_POINTER => "Null pointer",
        else => "Unknown error",
    };
}

/// Check if error represents a normal stop condition
export fn evm_error_is_stop(error_code: c_int) bool {
    return error_code == EVM_ERROR_STOP;
}