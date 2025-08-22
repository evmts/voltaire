const std = @import("std");
const frame_mod = @import("frame.zig");
const debugging_tracer = @import("debugging_tracer.zig");

// ============================================================================
// FRAME C API - EVM Frame operations exported to C
// ============================================================================

// Create our frame type with default config for C API
// TODO: We should somehow allow end user to configure this even if it's just showing them how to build from scratch
// Since the configuration is comptime we can't do this dynamically over FFI
// We might just want to make an instance for every hardfork as it's own different build target we expose
pub const Frame = frame_mod.createFrame(.{});

// Create debug frame type with debugging tracer
pub const DebugFrame = frame_mod.createFrame(.{
    .TracerType = debugging_tracer.DebuggingTracer,
});

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

pub fn zigErrorToCError(err: anytype) c_int {
    return switch (err) {
        error.StackOverflow => EVM_ERROR_STACK_OVERFLOW,
        error.StackUnderflow => EVM_ERROR_STACK_UNDERFLOW,
        error.OutOfGas => EVM_ERROR_OUT_OF_GAS,
        error.InvalidJump => EVM_ERROR_INVALID_JUMP,
        error.InvalidOpcode => EVM_ERROR_INVALID_OPCODE,
        error.OutOfBounds => EVM_ERROR_OUT_OF_BOUNDS,
        error.AllocationError => EVM_ERROR_ALLOCATION,
        error.BytecodeTooLarge => EVM_ERROR_BYTECODE_TOO_LARGE,
        error.STOP => EVM_ERROR_STOP,
    };
}

// Wrapper struct to hold frame and owned bytecode
pub const FrameHandle = struct {
    frame: Frame,
    bytecode_owned: []u8,
    initial_gas: u64,
    is_stopped: bool,
};

// Debug frame handle with debugging tracer
pub const DebugFrameHandle = struct {
    frame: DebugFrame,
    bytecode_owned: []u8,
    initial_gas: u64,
    is_stopped: bool,
};

// ============================================================================
// FRAME LIFECYCLE
// ============================================================================

/// Create a new EVM frame with the given bytecode and initial gas
/// Returns opaque pointer to frame handle, or null on failure
export fn evm_frame_create(bytecode: [*]const u8, bytecode_len: usize, initial_gas: u64) ?*anyopaque {
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

// ============================================================================
// DEBUGGING AND TRACING FUNCTIONS
// ============================================================================

/// Create a debugging frame with tracing capabilities
export fn evm_debug_frame_create(bytecode: [*]const u8, bytecode_len: usize, initial_gas: u64) ?*anyopaque {
    // Validate inputs
    if (bytecode_len == 0) {
        return null;
    }

    // Create debug handle
    const handle = allocator.create(DebugFrameHandle) catch return null;
    errdefer allocator.destroy(handle);

    // Copy bytecode (we own it)
    const bytecode_slice = bytecode[0..bytecode_len];
    handle.bytecode_owned = allocator.dupe(u8, bytecode_slice) catch {
        allocator.destroy(handle);
        return null;
    };
    errdefer allocator.free(handle.bytecode_owned);

    // Initialize debug frame
    handle.frame = DebugFrame.init(allocator, handle.bytecode_owned, @intCast(initial_gas)) catch {
        allocator.free(handle.bytecode_owned);
        allocator.destroy(handle);
        return null;
    };

    handle.initial_gas = initial_gas;
    handle.is_stopped = false;

    return @ptrCast(handle);
}

/// Set step mode for debugging frame
export fn evm_debug_set_step_mode(frame_ptr: ?*anyopaque, enabled: bool) c_int {
    const handle: *DebugFrameHandle = @ptrCast(@alignCast(frame_ptr orelse return EVM_ERROR_NULL_POINTER));

    var tracer_ptr = &handle.frame.tracer;
    tracer_ptr.setStepMode(enabled);
    return EVM_SUCCESS;
}

/// Check if frame is currently paused
export fn evm_debug_is_paused(frame_ptr: ?*anyopaque) bool {
    const handle: *DebugFrameHandle = @ptrCast(@alignCast(frame_ptr orelse return false));
    return handle.frame.tracer.paused;
}

/// Resume execution from paused state
export fn evm_debug_resume(frame_ptr: ?*anyopaque) c_int {
    const handle: *DebugFrameHandle = @ptrCast(@alignCast(frame_ptr orelse return EVM_ERROR_NULL_POINTER));

    // Get pointer to tracer and call resumeExecution
    var tracer_ptr = &handle.frame.tracer;
    tracer_ptr.resumeExecution();
    return EVM_SUCCESS;
}

/// Execute a single step and pause
export fn evm_debug_step(frame_ptr: ?*anyopaque) c_int {
    const handle: *DebugFrameHandle = @ptrCast(@alignCast(frame_ptr orelse return EVM_ERROR_NULL_POINTER));

    // Enable step mode and execute one instruction
    var tracer_ptr = &handle.frame.tracer;
    tracer_ptr.setStepMode(true);
    tracer_ptr.resumeExecution();

    // Execute until next pause (should be immediate in step mode)
    handle.frame.interpret(allocator) catch |err| {
        if (err == error.STOP) {
            handle.is_stopped = true;
            return EVM_ERROR_STOP;
        }
        return zigErrorToCError(err);
    };

    return EVM_SUCCESS;
}

/// Add a breakpoint at the given PC
export fn evm_debug_add_breakpoint(frame_ptr: ?*anyopaque, pc: u32) c_int {
    const handle: *DebugFrameHandle = @ptrCast(@alignCast(frame_ptr orelse return EVM_ERROR_NULL_POINTER));

    var tracer_ptr = &handle.frame.tracer;
    tracer_ptr.addBreakpoint(pc) catch return EVM_ERROR_ALLOCATION;
    return EVM_SUCCESS;
}

/// Remove a breakpoint at the given PC
export fn evm_debug_remove_breakpoint(frame_ptr: ?*anyopaque, pc: u32) c_int {
    const handle: *DebugFrameHandle = @ptrCast(@alignCast(frame_ptr orelse return 0));

    var tracer_ptr = &handle.frame.tracer;
    return if (tracer_ptr.removeBreakpoint(pc)) 1 else 0;
}

/// Check if there's a breakpoint at the given PC
export fn evm_debug_has_breakpoint(frame_ptr: ?*anyopaque, pc: u32) c_int {
    const handle: *DebugFrameHandle = @ptrCast(@alignCast(frame_ptr orelse return 0));

    var tracer_ptr = &handle.frame.tracer;
    return if (tracer_ptr.hasBreakpoint(pc)) 1 else 0;
}

/// Clear all breakpoints
export fn evm_debug_clear_breakpoints(frame_ptr: ?*anyopaque) c_int {
    const handle: *DebugFrameHandle = @ptrCast(@alignCast(frame_ptr orelse return EVM_ERROR_NULL_POINTER));

    var tracer_ptr = &handle.frame.tracer;
    tracer_ptr.clearBreakpoints();
    return EVM_SUCCESS;
}

/// Get the number of execution steps taken
export fn evm_debug_get_step_count(frame_ptr: ?*anyopaque) u64 {
    const handle: *DebugFrameHandle = @ptrCast(@alignCast(frame_ptr orelse return 0));
    var tracer_ptr = &handle.frame.tracer;
    return tracer_ptr.getStepCount();
}

/// Get current stack contents
export fn evm_frame_get_stack(frame_ptr: ?*anyopaque, stack_out: [*]u8, max_items: u32, count_out: *u32) c_int {
    const handle: *FrameHandle = @ptrCast(@alignCast(frame_ptr orelse return EVM_ERROR_NULL_POINTER));

    const stack_depth = handle.frame.next_stack_index;
    const items_to_copy = @min(stack_depth, max_items);

    // Copy stack items (32 bytes each)
    for (0..items_to_copy) |i| {
        const stack_item = handle.frame.stack[i];
        const bytes: [32]u8 = @bitCast(stack_item);

        // Copy to output buffer
        const dest_offset = i * 32;
        @memcpy(stack_out[dest_offset .. dest_offset + 32], &bytes);
    }

    count_out.* = @intCast(items_to_copy);
    return EVM_SUCCESS;
}

/// Get stack item at specific index (0 = bottom, top = depth-1)
export fn evm_frame_get_stack_item(frame_ptr: ?*anyopaque, index: u32, item_out: [*]u8) c_int {
    const handle: *FrameHandle = @ptrCast(@alignCast(frame_ptr orelse return EVM_ERROR_NULL_POINTER));

    if (index >= handle.frame.next_stack_index) {
        return EVM_ERROR_OUT_OF_BOUNDS;
    }

    const stack_item = handle.frame.stack[index];
    const bytes: [32]u8 = @bitCast(stack_item);
    @memcpy(item_out[0..32], &bytes);

    return EVM_SUCCESS;
}

/// Get memory contents
export fn evm_frame_get_memory(frame_ptr: ?*anyopaque, offset: u32, length: u32, data_out: [*]u8) c_int {
    const handle: *FrameHandle = @ptrCast(@alignCast(frame_ptr orelse return EVM_ERROR_NULL_POINTER));

    // Check if frame has memory field
    if (!@hasField(@TypeOf(handle.frame), "memory")) {
        return EVM_ERROR_OUT_OF_BOUNDS;
    }

    const memory_size = handle.frame.memory.size();
    if (offset >= memory_size or offset + length > memory_size) {
        return EVM_ERROR_OUT_OF_BOUNDS;
    }

    // Copy memory data
    const memory_slice = handle.frame.memory.get_slice(offset, length) catch {
        return EVM_ERROR_OUT_OF_BOUNDS;
    };
    @memcpy(data_out[0..length], memory_slice);

    return EVM_SUCCESS;
}

/// Get current memory size
export fn evm_frame_get_memory_size(frame_ptr: ?*anyopaque) u32 {
    const handle: *FrameHandle = @ptrCast(@alignCast(frame_ptr orelse return 0));

    // Check if frame has memory field
    if (!@hasField(@TypeOf(handle.frame), "memory")) {
        return 0;
    }

    return @intCast(handle.frame.memory.size());
}

/// C structure for debugging statistics
pub const DebugStats = extern struct {
    total_instructions: u64,
    total_gas_used: u64,
    breakpoint_count: u64,
    history_size: u64,
    snapshot_count: u64,
};

/// Get debugging statistics
export fn evm_debug_get_stats(frame_ptr: ?*anyopaque, stats_out: *DebugStats) c_int {
    const handle: *DebugFrameHandle = @ptrCast(@alignCast(frame_ptr orelse return EVM_ERROR_NULL_POINTER));

    var tracer_ptr = &handle.frame.tracer;
    const stats = tracer_ptr.getStats();
    stats_out.total_instructions = stats.total_instructions;
    stats_out.total_gas_used = stats.total_gas_used;
    stats_out.breakpoint_count = @intCast(stats.breakpoint_count);
    stats_out.history_size = @intCast(stats.history_size);
    stats_out.snapshot_count = @intCast(stats.snapshot_count);

    return EVM_SUCCESS;
}
