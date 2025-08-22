// ============================================================================
// EVM2 C API ROOT - Main entry point for C API exports
// ============================================================================
//
// This file serves as the main entry point for the EVM2 C API. It re-exports
// all C API modules to create a unified interface for C/FFI consumers.
//
// Usage:
//   zig build-lib -dynamic root_c.zig  # Creates shared library
//   zig build-lib root_c.zig           # Creates static library
//
// The generated library can be used from C, Python, JavaScript, Go, Rust, etc.

const std = @import("std");
const frame_c = @import("frame_c.zig");

pub usingnamespace frame_c;

const allocator = std.heap.c_allocator;

// ============================================================================
// LIBRARY METADATA AND VERSION INFO
// ============================================================================

/// Get library version string
export fn evm2_version() [*:0]const u8 {
    return "0.1.0";
}

/// Get library build info
export fn evm2_build_info() [*:0]const u8 {
    return "EVM2 C API - Built with Zig " ++ @import("builtin").zig_version_string;
}

/// Initialize library (currently a no-op, but reserves API for future use)
export fn evm2_init() c_int {
    return 0; // Success
}

/// Cleanup library resources (currently a no-op, but reserves API for future use)
export fn evm2_cleanup() void {
    // Future: global cleanup if needed
}

// ============================================================================
// TESTING FUNCTIONS (DEBUG BUILDS ONLY)
// ============================================================================

/// Simple test function - executes PUSH1 5, PUSH1 10, ADD, STOP
export fn evm2_test_simple_execution() c_int {
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

    const value = handle.frame.pop() catch return -101;
    if (value != 15) return -102;

    return frame_c.EVM_SUCCESS;
}

/// Test stack operations
export fn evm2_test_stack_operations() c_int {
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
    handle.frame.push(42) catch return -1;
    handle.frame.push(100) catch return -2;

    if (handle.frame.next_stack_index != 2) return -3;

    const value1 = handle.frame.pop() catch return -4;
    if (value1 != 100) return -5;

    const value2 = handle.frame.pop() catch return -6;
    if (value2 != 42) return -7;

    if (handle.frame.next_stack_index != 0) return -8;

    return frame_c.EVM_SUCCESS;
}

// ============================================================================
// FUTURE MODULE IMPORTS
// ============================================================================

// As we add more modules to the C API, import them here:
// pub usingnamespace @import("memory_c.zig");
// pub usingnamespace @import("state_c.zig");
// pub usingnamespace @import("vm_c.zig");
