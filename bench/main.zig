const std = @import("std");
const root = @import("root.zig");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.log.info("Guillotine Benchmark Suite", .{});
    std.log.info("Hello World from the bench crate!", .{});
    
    try root.run(allocator);
    
    std.log.info("Benchmark suite completed successfully!", .{});
}