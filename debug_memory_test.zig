const std = @import("std");

// Minimal reproduction of the memory casting issue
const Frame = opaque {};
const State = opaque {};

fn test_unsafe_cast() void {
    // Create a stack-allocated frame-like structure
    var dummy_frame: [1024]u8 align(8) = undefined;
    const frame_ptr = @as(*Frame, @ptrCast(&dummy_frame));
    
    std.log.debug("Original frame pointer: 0x{x}", .{@intFromPtr(frame_ptr)});
    std.log.debug("Frame alignment: {}", .{@alignOf(*Frame)});
    
    // Cast to opaque State (like we do in the test)
    const state_ptr: *State = @ptrCast(frame_ptr);
    std.log.debug("State pointer: 0x{x}", .{@intFromPtr(state_ptr)});
    std.log.debug("State alignment: {}", .{@alignOf(*State)});
    
    // Cast back to Frame (like jump_table.zig does)
    const restored_frame = @as(*Frame, @ptrCast(@alignCast(state_ptr)));
    std.log.debug("Restored frame pointer: 0x{x}", .{@intFromPtr(restored_frame)});
    
    // Check if addresses match
    if (@intFromPtr(frame_ptr) == @intFromPtr(restored_frame)) {
        std.log.debug("✓ Pointer roundtrip successful", .{});
    } else {
        std.log.debug("✗ Pointer roundtrip failed!", .{});
    }
}

test "memory casting safety" {
    std.testing.log_level = .debug;
    test_unsafe_cast();
}