const std = @import("std");
const root = @import("root.zig");
const profile_runner = @import("profile_runner.zig");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();
    
    // Check for profiling mode
    const args = try std.process.argsAlloc(allocator);
    defer std.process.argsFree(allocator, args);
    
    if (args.len > 1 and std.mem.eql(u8, args[1], "--profile")) {
        const profile_type = if (args.len > 2) 
            std.meta.stringToEnum(profile_runner.BenchmarkProfile, args[2]) orelse .all
        else 
            .all;
            
        std.log.info("Running in profiling mode: {}", .{profile_type});
        try profile_runner.run_profiling_workload(allocator, profile_type);
    } else {
        // Normal benchmark mode
        std.log.info("Guillotine Benchmark Suite", .{});
        std.log.info("Hello World from the bench crate!", .{});
        
        try root.run(allocator);
        
        std.log.info("Benchmark suite completed successfully!", .{});
    }
}