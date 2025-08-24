const std = @import("std");
const zbench = @import("zbench");
const stack_mod = @import("../stack.zig");
const stack_config_mod = @import("../stack_config.zig");

const StackConfig = stack_config_mod.StackConfig;
const Stack = stack_mod.Stack;

// Test configuration
const test_config = StackConfig{
    .stack_size = 1024,
    .WordType = u256,
};

const TestStack = Stack(test_config);

fn benchStackPush(allocator: std.mem.Allocator) void {
    var stack = TestStack.init(allocator) catch return;
    defer stack.deinit();
    
    var i: u256 = 0;
    while (i < 500) : (i += 1) {
        stack.push(i) catch break;
    }
}

fn benchStackPop(allocator: std.mem.Allocator) void {
    var stack = TestStack.init(allocator) catch return;
    defer stack.deinit();
    
    // Pre-fill stack
    var i: u256 = 0;
    while (i < 500) : (i += 1) {
        stack.push(i) catch break;
    }
    
    // Pop everything
    while (stack.size() > 0) {
        _ = stack.pop() catch break;
    }
}

fn benchStackDup(allocator: std.mem.Allocator) void {
    var stack = TestStack.init(allocator) catch return;
    defer stack.deinit();
    
    // Pre-fill stack with some values
    var i: u256 = 0;
    while (i < 10) : (i += 1) {
        stack.push(i) catch break;
    }
    
    // Perform DUP operations
    i = 0;
    while (i < 100) : (i += 1) {
        stack.dup(1) catch break;
        _ = stack.pop() catch break; // Remove duplicated item
    }
}

fn benchStackSwap(allocator: std.mem.Allocator) void {
    var stack = TestStack.init(allocator) catch return;
    defer stack.deinit();
    
    // Pre-fill stack with values
    var i: u256 = 0;
    while (i < 10) : (i += 1) {
        stack.push(i) catch break;
    }
    
    // Perform SWAP operations
    i = 0;
    while (i < 100) : (i += 1) {
        stack.swap(1) catch break;
    }
}

fn benchStackPeek(allocator: std.mem.Allocator) void {
    var stack = TestStack.init(allocator) catch return;
    defer stack.deinit();
    
    // Pre-fill stack
    var i: u256 = 0;
    while (i < 100) : (i += 1) {
        stack.push(i) catch break;
    }
    
    // Perform peek operations
    i = 0;
    while (i < 1000) : (i += 1) {
        _ = stack.peek() catch break;
    }
}

fn benchStackUnsafeOperations(allocator: std.mem.Allocator) void {
    var stack = TestStack.init(allocator) catch return;
    defer stack.deinit();
    
    // Pre-fill stack
    var i: u256 = 0;
    while (i < 500) : (i += 1) {
        stack.push_unsafe(i);
    }
    
    // Pop with unsafe operations
    while (stack.size() > 0) {
        _ = stack.pop_unsafe();
    }
}

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    const stdout = std.io.getStdOut().writer();
    
    var bench = zbench.Benchmark.init(allocator, .{});
    defer bench.deinit();
    
    try bench.add("Stack Push Operations", benchStackPush, .{});
    try bench.add("Stack Pop Operations", benchStackPop, .{});
    try bench.add("Stack DUP Operations", benchStackDup, .{});
    try bench.add("Stack SWAP Operations", benchStackSwap, .{});
    try bench.add("Stack Peek Operations", benchStackPeek, .{});
    try bench.add("Stack Unsafe Operations", benchStackUnsafeOperations, .{});
    
    try stdout.print("Running Stack Benchmarks...\n");
    try bench.run(stdout);
}