const std = @import("std");
const zbench = @import("zbench");
const evm = @import("evm");
const Stack = evm.Stack;

// ============================================================================
// Benchmark Registration
// ============================================================================

pub fn bench(b: *zbench.Benchmark) !void {
    try b.add("Stack: Push/Pop 100 values", push_pop_100, .{});
    try b.add("Stack: Push/Pop 1000 values", push_pop_1000, .{});
}

// ============================================================================
// Benchmark Functions
// ============================================================================

fn push_pop_100(allocator: std.mem.Allocator) void {
    var stack = Stack(.{
        .stack_size = std.math.maxInt(u12),
        .WordType = u256,
    }).init(allocator) catch |err| {
        std.log.err("Stack benchmark failed to init stack: {}", .{err});
        @panic("Stack benchmark failed");
    };
    defer stack.deinit(allocator);
    
    // Push values from 1000 to 100000 (in increments of 1000)
    var value: u256 = 1000;
    var count: u32 = 0;
    while (count < 100) : (count += 1) {
        stack.push_unsafe(value);
        value += 1000;
    }
    
    // Pop all 100 values
    count = 0;
    while (count < 100) : (count += 1) {
        _ = stack.pop_unsafe();
    }
}

fn push_pop_1000(allocator: std.mem.Allocator) void {
    var stack = Stack(.{
        .stack_size = std.math.maxInt(u12),
        .WordType = u256,
    }).init(allocator) catch |err| {
        std.log.err("Stack benchmark failed to init stack: {}", .{err});
        @panic("Stack benchmark failed");
    };
    defer stack.deinit(allocator);
    
    // Push 1000 values 
    var value: u256 = 1000;
    var count: u32 = 0;
    while (count < 1000) : (count += 1) {
        stack.push_unsafe(value);
        value += 1;
    }
    
    // Pop all 1000 values
    count = 0;
    while (count < 1000) : (count += 1) {
        _ = stack.pop_unsafe();
    }
}