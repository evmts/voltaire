const std = @import("std");
const Allocator = std.mem.Allocator;
const zbench = @import("zbench");

// Export modules for use by other files in bench folder
pub const Evm = @import("evm");
pub const primitives = @import("primitives");

// Conditionally export revm if available
pub const revm = if (@hasDecl(@import("root"), "revm")) @import("revm") else undefined;

pub const zbench_runner = @import("zbench_runner.zig");
pub const precompile_benchmark = @import("precompile_benchmark.zig");
pub const opcode_benchmarks = @import("opcode_benchmarks.zig");
pub const benchmarks = @import("benchmarks.zig");
pub const evm_integration_benchmark = @import("evm_integration_benchmark.zig");
pub const root_module_benchmark = @import("root_module_benchmark.zig");
pub const hardfork_benchmark = @import("hardfork_benchmark.zig");
pub const stack_performance_benchmark = @import("stack_performance_benchmark.zig");

pub fn run(allocator: Allocator) !void {
    std.log.info("Starting EVM benchmark suite", .{});
    
    // DISABLED: Run the comprehensive opcode benchmarks (Issue #62) - needs fixing
    // std.log.info("Running comprehensive opcode benchmarks", .{});
    // try opcode_benchmarks.run_comprehensive_opcode_benchmarks(allocator);
    
    // Run the comprehensive precompile benchmarks (Issue #68)
    // TODO: Fix testing allocator usage in benchmarks.zig
    // std.log.info("Running comprehensive precompile benchmarks", .{});
    // try benchmarks.run_all_precompile_benchmarks(allocator);
    
    // DISABLED: Run the zbench-based benchmarks - needs fixing
    // std.log.info("Running zbench benchmarks", .{});
    // try zbench_runner.run_benchmarks(allocator, zbench);
    
    // Run original precompile dispatch benchmarks for comparison
    // TODO: Fix ChainRules issue in precompile_benchmark.zig
    // std.log.info("Running precompile dispatch benchmarks", .{});
    // try precompile_benchmark.run_precompile_benchmarks(allocator);
    
    // DISABLED: Run EVM module integration and error handling benchmarks (Issue #49) - needs API fixes
    // std.log.info("Running EVM integration and error handling benchmarks (Issue #49)", .{});
    // try evm_integration_benchmark.run_integration_benchmarks(allocator);
    // try evm_integration_benchmark.run_error_handling_benchmarks(allocator);
    
    // DISABLED: Run root module specific benchmarks (Issue #49) - needs import fixes
    // std.log.info("Running root.zig module benchmarks (Issue #49)", .{});
    // try root_module_benchmark.run_root_module_benchmarks(allocator);
    
    // Run hardfork logic benchmarks (Issue #71)
    std.log.info("Running hardfork logic and chain rules benchmarks (Issue #71)", .{});
    try hardfork_benchmark.run_all_hardfork_benchmarks(allocator);
    
    // Run stack performance benchmarks (Issue #34)
    std.log.info("Running stack performance benchmarks (Issue #34)", .{});
    try stack_performance_benchmark.run_stack_performance_benchmarks(allocator);
    
    // Run all benchmarks including revm comparison
    std.log.info("Running comprehensive benchmark suite", .{});
    try benchmarks.run_all_benchmarks(allocator);
    
    std.log.info("Benchmark suite completed", .{});
}

test {
    std.testing.refAllDeclsRecursive(@This());
}