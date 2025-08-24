const std = @import("std");

// Minimal reproduction of use-after-free scenario
pub fn main() !void {
    std.debug.print("=== Minimal Use-After-Free Test ===\n", .{});
    
    // Create an arena allocator
    var arena = std.heap.ArenaAllocator.init(std.heap.page_allocator);
    
    // Allocate some memory
    const data = try arena.allocator().alloc(u8, 100);
    data[0] = 42;
    
    // Save the pointer
    const data_ptr = data.ptr;
    std.debug.print("1. Data allocated at: {*}, first byte: {}\n", .{data_ptr, data[0]});
    
    // Free the arena
    std.debug.print("2. Deinitializing arena...\n", .{});
    arena.deinit();
    std.debug.print("3. Arena deinitialized\n", .{});
    
    // Try to access the freed memory - this should crash
    std.debug.print("4. Attempting to read freed memory at {*}...\n", .{data_ptr});
    const value = data_ptr[0];
    std.debug.print("5. Value read: {} (if you see this, no crash occurred)\n", .{value});
}