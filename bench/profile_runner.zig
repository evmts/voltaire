const std = @import("std");
const root = @import("root.zig");
const Allocator = std.mem.Allocator;

pub const BenchmarkProfile = enum {
    all,
    stack_operations,
    memory_operations,
    precompiles,
    hardfork_checks,
};

pub fn run_profiling_workload(allocator: Allocator, profile: BenchmarkProfile) !void {
    // Run longer iterations for better profiling data
    const profile_iterations = 100_000;
    
    switch (profile) {
        .all => try run_all_profiles(allocator, profile_iterations),
        .stack_operations => try profile_stack_ops(allocator, profile_iterations),
        .memory_operations => try profile_memory_ops(allocator, profile_iterations),
        .precompiles => try profile_precompiles(allocator, profile_iterations),
        .hardfork_checks => try profile_hardfork_checks(allocator, profile_iterations),
    }
}

fn run_all_profiles(allocator: Allocator, iterations: usize) !void {
    std.log.info("Running all profiling workloads", .{});
    try profile_stack_ops(allocator, iterations / 4);
    try profile_memory_ops(allocator, iterations / 4);
    try profile_precompiles(allocator, iterations / 4);
    try profile_hardfork_checks(allocator, iterations / 4);
}

fn profile_stack_ops(_: Allocator, iterations: usize) !void {
    std.log.info("Profiling stack operations ({} iterations)", .{iterations});
    
    var stack = root.Evm.Stack{};
    
    var i: usize = 0;
    while (i < iterations) : (i += 1) {
        // Push and pop sequence - using the optimized unsafe operations for profiling
        stack.append_unsafe(i);
        stack.append_unsafe(i + 1);
        stack.append_unsafe(i + 2);
        stack.append_unsafe(i + 3);
        
        _ = stack.pop_unsafe();
        _ = stack.pop_unsafe();
        _ = stack.pop_unsafe();
        _ = stack.pop_unsafe();
        
        // DUP operations
        stack.append_unsafe(100);
        stack.append_unsafe(200);
        stack.append_unsafe(300);
        stack.append_unsafe(400);
        
        // Simulate DUP4
        const dup_value = stack.data[stack.size - 4];
        stack.append_unsafe(dup_value);
        
        // Simulate SWAP2
        const temp = stack.data[stack.size - 1];
        stack.data[stack.size - 1] = stack.data[stack.size - 3];
        stack.data[stack.size - 3] = temp;
        
        // Clear stack for next iteration
        stack.size = 0;
    }
}

fn profile_memory_ops(allocator: Allocator, iterations: usize) !void {
    std.log.info("Profiling memory operations ({} iterations)", .{iterations});
    
    // Simple memory allocation benchmark
    var i: usize = 0;
    while (i < iterations) : (i += 1) {
        const size = 32 + (i % 256);
        const mem = try allocator.alloc(u8, size);
        defer allocator.free(mem);
        
        // Write pattern
        for (mem) |*byte| {
            byte.* = @intCast(i & 0xFF);
        }
        
        // Read pattern
        var sum: u64 = 0;
        for (mem) |byte| {
            sum += byte;
        }
        // Use sum to prevent optimization
        if (sum == 0) {
            std.log.warn("Unexpected zero sum", .{});
        }
    }
}

fn profile_precompiles(allocator: Allocator, iterations: usize) !void {
    std.log.info("Profiling precompile execution ({} iterations)", .{iterations});
    
    // Simulate precompile-like computation
    const test_data = [_]u8{0xFF} ** 64; // 64 bytes of data
    
    var i: usize = 0;
    while (i < iterations) : (i += 1) {
        const output = try allocator.alloc(u8, 32);
        defer allocator.free(output);
        
        // Simulate hash computation
        var hasher = std.hash.Wyhash.init(i);
        hasher.update(&test_data);
        const hash = hasher.final();
        std.mem.writeInt(u64, output[0..8], hash, .big);
    }
}

fn profile_hardfork_checks(_: Allocator, iterations: usize) !void {
    std.log.info("Profiling hardfork checks ({} iterations)", .{iterations});
    
    // Simulate hardfork-like checks without using actual Hardfork types
    const chain_id: u64 = 1;
    
    var i: usize = 0;
    while (i < iterations) : (i += 1) {
        // Simulate various checks
        const block_number = i % 20_000_000;
        
        // Simulate hardfork activation checks
        const is_london = block_number >= 12_965_000;
        const is_shanghai = block_number >= 17_034_870;
        const is_cancun = block_number >= 19_426_587;
        
        // Simulate chain rule checks
        const is_mainnet = chain_id == 1;
        const is_sepolia = chain_id == 11155111;
        
        // Use results to prevent optimization
        if (is_london and is_shanghai and is_cancun and is_mainnet and !is_sepolia) {
            // Most common case - do nothing
        }
    }
}