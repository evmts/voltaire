const std = @import("std");
const Allocator = std.mem.Allocator;
const zbench = @import("zbench");

pub const zbench_runner = @import("zbench_runner.zig");

pub fn run(allocator: Allocator) !void {
    std.log.info("Starting EVM benchmark suite", .{});
    
    try zbench_runner.run_benchmarks(allocator, zbench);
    
    std.log.info("Benchmark suite completed", .{});
}

test {
    std.testing.refAllDeclsRecursive(@This());
}