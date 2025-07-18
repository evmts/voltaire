const std = @import("std");
const Allocator = std.mem.Allocator;

pub fn run_benchmarks(allocator: Allocator, zbench: anytype) !void {
    var benchmark = zbench.Benchmark.init(allocator, .{});
    defer benchmark.deinit();
    
    // Hello World benchmark
    try benchmark.add("Hello World", hello_world, .{});
    
    // Simple computation benchmark
    try benchmark.add("Simple Computation", simple_computation, .{});
    
    // Memory allocation benchmark
    try benchmark.add("Memory Allocation", memory_allocation, .{});
    
    // Run all benchmarks
    try benchmark.run(std.io.getStdOut().writer());
}

fn hello_world(allocator: Allocator) void {
    _ = allocator;
    std.debug.print("Hello World from Guillotine benchmarks!\n", .{});
}

fn simple_computation(allocator: Allocator) void {
    _ = allocator;
    var sum: u64 = 0;
    var i: u32 = 0;
    while (i < 1000) : (i += 1) {
        sum += i * i;
    }
    // Prevent optimization
    std.mem.doNotOptimizeAway(sum);
}

fn memory_allocation(allocator: Allocator) void {
    const data = allocator.alloc(u8, 1024) catch return;
    defer allocator.free(data);
    
    for (data, 0..) |*byte, idx| {
        byte.* = @as(u8, @intCast(idx % 256));
    }
}

// EVM-specific benchmarks can be added here
pub fn add_evm_benchmarks(benchmark: anytype, allocator: Allocator) !void {
    _ = allocator;
    
    // Placeholder for EVM benchmarks
    try benchmark.add("EVM Stack Operations", evm_stack_operations, .{});
    try benchmark.add("EVM Memory Operations", evm_memory_operations, .{});
    try benchmark.add("EVM Arithmetic", evm_arithmetic, .{});
}

fn evm_stack_operations(allocator: Allocator) void {
    _ = allocator;
    // TODO: Add actual EVM stack operation benchmarks
    var stack_simulation: [1024]u256 = undefined;
    var top: usize = 0;
    
    // Simulate stack operations
    var i: u32 = 0;
    while (i < 100) : (i += 1) {
        if (top < stack_simulation.len) {
            stack_simulation[top] = i;
            top += 1;
        }
        if (top > 0) {
            top -= 1;
        }
    }
    
    std.mem.doNotOptimizeAway(stack_simulation);
}

fn evm_memory_operations(allocator: Allocator) void {
    _ = allocator;
    // TODO: Add actual EVM memory operation benchmarks
    var memory: [1024]u8 = undefined;
    
    // Simulate memory operations
    var i: u32 = 0;
    while (i < 100) : (i += 1) {
        const addr = i % memory.len;
        memory[addr] = @as(u8, @intCast(i % 256));
    }
    
    std.mem.doNotOptimizeAway(memory);
}

fn evm_arithmetic(allocator: Allocator) void {
    _ = allocator;
    // TODO: Add actual EVM arithmetic operation benchmarks
    var result: u256 = 0;
    
    // Simulate arithmetic operations
    var i: u32 = 0;
    while (i < 100) : (i += 1) {
        result += i;
        result *= 2;
        result /= 2;
    }
    
    std.mem.doNotOptimizeAway(result);
}

test "zbench runner" {
    const allocator = std.testing.allocator;
    
    // Note: We can't easily test the actual run() function in a test
    // as it depends on zbench being available, but we can test that
    // the individual benchmark functions compile and run
    simple_computation(allocator);
    memory_allocation(allocator);
}