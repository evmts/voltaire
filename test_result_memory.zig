const std = @import("std");

// Simulating the EVM result pattern
const CallResult = struct {
    success: bool,
    output: []const u8,
};

const FakeEVM = struct {
    allocator: std.mem.Allocator,
    
    fn init(allocator: std.mem.Allocator) FakeEVM {
        return .{ .allocator = allocator };
    }
    
    fn call(self: *FakeEVM) !CallResult {
        // Allocate output using EVM's allocator
        const output = try self.allocator.alloc(u8, 32);
        @memset(output, 42);
        
        return CallResult{
            .success = true,
            .output = output,
        };
    }
    
    fn deinit(self: *FakeEVM) void {
        _ = self;
        // In real EVM, this would free the allocator
    }
};

pub fn main() !void {
    std.debug.print("=== Testing EVM Result Memory Pattern ===\n", .{});
    
    // Simulate the benchmark pattern
    var arena = std.heap.ArenaAllocator.init(std.heap.page_allocator);
    
    var evm = FakeEVM.init(arena.allocator());
    const result = try evm.call();
    
    std.debug.print("1. Call succeeded, output len: {}, first byte: {}\n", .{result.output.len, result.output[0]});
    
    // Save pointer
    const output_ptr = result.output.ptr;
    
    // Deinit EVM (doesn't free arena in this fake version)
    evm.deinit();
    
    // Now free the arena (simulating what happens when EVM's internal allocator is freed)
    std.debug.print("2. Freeing arena allocator...\n", .{});
    arena.deinit();
    
    // Try to access result - this should crash
    std.debug.print("3. Attempting to access result output...\n", .{});
    std.debug.print("4. First byte: {}\n", .{output_ptr[0]});
}