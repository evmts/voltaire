// ============================================================================
// EVM C API ROOT - Main entry point for C API exports
// ============================================================================
//
// This file serves as the main entry point for the EVM C API. It re-exports
// all C API modules to create a unified interface for C/FFI consumers.
//
// Usage:
//   zig build-lib -dynamic root_c.zig  # Creates shared library
//   zig build-lib root_c.zig           # Creates static library
//
// The generated library can be used from C, Python, JavaScript, Go, Rust, etc.

const std = @import("std");
const frame_c = @import("frame_c.zig");
const bytecode_c = @import("bytecode_c.zig");
const memory_c = @import("memory_c.zig");
const stack_c = @import("stack_c.zig");

// Export all C API modules
pub usingnamespace frame_c;
pub usingnamespace bytecode_c;
pub usingnamespace memory_c;
pub usingnamespace stack_c;

const allocator = std.heap.c_allocator;

// ============================================================================
// LIBRARY METADATA AND VERSION INFO
// ============================================================================

/// Get library version string
export fn evm_version() [*:0]const u8 {
    return "0.1.0";
}

/// Get library build info
export fn evm_build_info() [*:0]const u8 {
    return "EVM C API - Built with Zig " ++ @import("builtin").zig_version_string;
}

/// Initialize library (currently a no-op, but reserves API for future use)
export fn evm_init() c_int {
    return 0; // Success
}

/// Cleanup library resources (currently a no-op, but reserves API for future use)
export fn evm_cleanup() void {
    // Future: global cleanup if needed
}

// ============================================================================
// TESTING FUNCTIONS (DEBUG BUILDS ONLY)
// ============================================================================

/// Simple test function - executes PUSH1 5, PUSH1 10, ADD, STOP
export fn evm_test_simple_execution() c_int {
    // Bytecode: PUSH1 5, PUSH1 10, ADD, STOP
    const bytecode = [_]u8{ 0x60, 0x05, 0x60, 0x0A, 0x01, 0x00 };

    // Create frame directly (since export functions can't be called from Zig)
    const handle = allocator.create(frame_c.FrameHandle) catch return -1;
    errdefer allocator.destroy(handle);

    // Copy bytecode
    handle.bytecode_owned = allocator.dupe(u8, &bytecode) catch {
        allocator.destroy(handle);
        return -1;
    };
    errdefer allocator.free(handle.bytecode_owned);

    // Initialize frame
    handle.frame = frame_c.Frame.init(allocator, handle.bytecode_owned, 1000000) catch {
        allocator.free(handle.bytecode_owned);
        allocator.destroy(handle);
        return -1;
    };

    handle.initial_gas = 1000000;
    handle.is_stopped = false;

    defer {
        handle.frame.deinit(allocator);
        allocator.free(handle.bytecode_owned);
        allocator.destroy(handle);
    }

    // Execute
    handle.frame.interpret(allocator) catch |err| {
        handle.is_stopped = true;
        return frame_c.zigErrorToCError(err);
    };

    // Check that we have one value on stack (15)
    if (handle.frame.next_stack_index != 1) return -100;

    const value = handle.frame.stack.pop() catch return -101;
    if (value != 15) return -102;

    return frame_c.EVM_SUCCESS;
}

/// Test stack operations
export fn evm_test_stack_operations() c_int {
    // Empty bytecode (just for frame creation)
    const bytecode = [_]u8{0x00}; // STOP

    // Create frame directly
    const handle = allocator.create(frame_c.FrameHandle) catch return -1;
    errdefer allocator.destroy(handle);

    handle.bytecode_owned = allocator.dupe(u8, &bytecode) catch {
        allocator.destroy(handle);
        return -1;
    };
    errdefer allocator.free(handle.bytecode_owned);

    handle.frame = frame_c.Frame.init(allocator, handle.bytecode_owned, 1000000) catch {
        allocator.free(handle.bytecode_owned);
        allocator.destroy(handle);
        return -1;
    };

    handle.initial_gas = 1000000;
    handle.is_stopped = false;

    defer {
        handle.frame.deinit(allocator);
        allocator.free(handle.bytecode_owned);
        allocator.destroy(handle);
    }

    // Test push/pop operations
    handle.frame.stack.push(42) catch return -1;
    handle.frame.stack.push(100) catch return -2;

    if (handle.frame.next_stack_index != 2) return -3;

    const value1 = handle.frame.stack.pop() catch return -4;
    if (value1 != 100) return -5;

    const value2 = handle.frame.stack.pop() catch return -6;
    if (value2 != 42) return -7;

    if (handle.frame.next_stack_index != 0) return -8;

    return frame_c.EVM_SUCCESS;
}

// ============================================================================
// COMPOSITE TESTING FUNCTIONS
// ============================================================================

/// Test integration of multiple C API modules
export fn evm_test_integration() c_int {
    // Create a stack
    const stack = stack_c.evm_stack_create() orelse return -1;
    defer stack_c.evm_stack_destroy(stack);
    
    // Create memory
    const memory = memory_c.evm_memory_create(0) orelse return -2;
    defer memory_c.evm_memory_destroy(memory);
    
    // Create bytecode
    const bytecode_data = [_]u8{
        0x60, 0x42, // PUSH1 0x42
        0x60, 0x00, // PUSH1 0x00
        0x52,       // MSTORE
        0x00,       // STOP
    };
    const bytecode = bytecode_c.evm_bytecode_create(&bytecode_data, bytecode_data.len) orelse return -3;
    defer bytecode_c.evm_bytecode_destroy(bytecode);
    
    // Analyze bytecode
    if (bytecode_c.evm_bytecode_analyze(bytecode) != 0) return -4;
    
    // Execute bytecode operations manually
    // PUSH1 0x42
    if (stack_c.evm_stack_push_u64(stack, 0x42) != 0) return -5;
    
    // PUSH1 0x00
    if (stack_c.evm_stack_push_u64(stack, 0x00) != 0) return -6;
    
    // MSTORE - pop offset and value
    var offset: u64 = 0;
    var value: u64 = 0;
    if (stack_c.evm_stack_pop_u64(stack, &offset) != 0) return -7;
    if (stack_c.evm_stack_pop_u64(stack, &value) != 0) return -8;
    
    // Write to memory
    const value_bytes = [32]u8{0} ** 31 ++ [_]u8{@intCast(value)};
    if (memory_c.evm_memory_write_u256(memory, @intCast(offset), &value_bytes) != 0) return -9;
    
    // Verify memory contents
    var read_bytes: [32]u8 = undefined;
    if (memory_c.evm_memory_read_u256(memory, 0, &read_bytes) != 0) return -10;
    if (read_bytes[31] != 0x42) return -11;
    
    return 0;
}
