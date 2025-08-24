const std = @import("std");
const zbench = @import("zbench");
const planner_mod = @import("../planner.zig");
const planner_config_mod = @import("../planner_config.zig");
const bytecode_mod = @import("../bytecode.zig");

const PlannerConfig = planner_config_mod.PlannerConfig;
const Planner = planner_mod.Planner;

// Test configuration
const test_config = PlannerConfig{
    .WordType = u256,
    .maxBytecodeSize = 24576,
    .enableLruCache = true,
    .vector_length = 16,
    .stack_size = 1024,
};

const TestPlanner = Planner(test_config);

// Sample EVM bytecode patterns for testing
const simple_bytecode = [_]u8{
    0x60, 0x10,           // PUSH1 0x10
    0x60, 0x20,           // PUSH1 0x20
    0x01,                 // ADD
    0x60, 0x00,           // PUSH1 0x00
    0x52,                 // MSTORE
    0x60, 0x20,           // PUSH1 0x20
    0x60, 0x00,           // PUSH1 0x00
    0xf3,                 // RETURN
};

const complex_bytecode = [_]u8{
    0x60, 0x01,           // PUSH1 0x01
    0x60, 0x02,           // PUSH1 0x02
    0x60, 0x03,           // PUSH1 0x03
    0x60, 0x04,           // PUSH1 0x04
    0x60, 0x05,           // PUSH1 0x05
    0x01,                 // ADD
    0x02,                 // MUL
    0x90,                 // SWAP1
    0x91,                 // SWAP2
    0x80,                 // DUP1
    0x81,                 // DUP2
    0x50,                 // POP
    0x51,                 // POP
    0x56,                 // JUMP (invalid without JUMPDEST)
};

const loop_bytecode = [_]u8{
    0x60, 0x00,           // PUSH1 0x00 (counter)
    0x5b,                 // JUMPDEST (loop start at PC 2)
    0x80,                 // DUP1
    0x60, 0x0a,           // PUSH1 0x0a (loop limit)
    0x10,                 // LT
    0x60, 0x10,           // PUSH1 0x10 (exit jump target)
    0x57,                 // JUMPI
    0x60, 0x01,           // PUSH1 0x01
    0x01,                 // ADD (increment counter)
    0x60, 0x02,           // PUSH1 0x02 (loop back to JUMPDEST)
    0x56,                 // JUMP
    0x5b,                 // JUMPDEST (exit target at PC 16)
    0x50,                 // POP (cleanup counter)
    0x00,                 // STOP
};

fn benchPlannerSimple(allocator: std.mem.Allocator) void {
    var planner = TestPlanner.init(allocator) catch return;
    defer planner.deinit();
    
    var i: u32 = 0;
    while (i < 100) : (i += 1) {
        _ = planner.plan(&simple_bytecode, allocator) catch break;
    }
}

fn benchPlannerComplex(allocator: std.mem.Allocator) void {
    var planner = TestPlanner.init(allocator) catch return;
    defer planner.deinit();
    
    var i: u32 = 0;
    while (i < 100) : (i += 1) {
        _ = planner.plan(&complex_bytecode, allocator) catch break;
    }
}

fn benchPlannerWithJumps(allocator: std.mem.Allocator) void {
    var planner = TestPlanner.init(allocator) catch return;
    defer planner.deinit();
    
    var i: u32 = 0;
    while (i < 50) : (i += 1) {
        _ = planner.plan(&loop_bytecode, allocator) catch break;
    }
}

fn benchPlannerCache(allocator: std.mem.Allocator) void {
    var planner = TestPlanner.init(allocator) catch return;
    defer planner.deinit();
    
    // First planning (cache miss)
    _ = planner.plan(&simple_bytecode, allocator) catch return;
    
    // Subsequent plannings (cache hits)
    var i: u32 = 0;
    while (i < 200) : (i += 1) {
        _ = planner.plan(&simple_bytecode, allocator) catch break;
    }
}

fn benchPlannerLargeBytecode(allocator: std.mem.Allocator) void {
    var planner = TestPlanner.init(allocator) catch return;
    defer planner.deinit();
    
    // Generate large bytecode (repetitive pattern)
    var large_bytecode = std.ArrayList(u8).init(allocator);
    defer large_bytecode.deinit();
    
    // Repeat the simple pattern many times
    var i: u32 = 0;
    while (i < 100) : (i += 1) {
        large_bytecode.appendSlice(&simple_bytecode) catch break;
    }
    
    // Plan the large bytecode
    _ = planner.plan(large_bytecode.items, allocator) catch return;
}

fn benchPlannerVaryingSize(allocator: std.mem.Allocator) void {
    var planner = TestPlanner.init(allocator) catch return;
    defer planner.deinit();
    
    const bytecodes = [_][]const u8{
        &simple_bytecode,
        &complex_bytecode,
        &loop_bytecode,
    };
    
    var i: u32 = 0;
    while (i < 150) : (i += 1) {
        const code = bytecodes[i % bytecodes.len];
        _ = planner.plan(code, allocator) catch break;
    }
}

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    const stdout = std.io.getStdOut().writer();
    
    var bench = zbench.Benchmark.init(allocator, .{});
    defer bench.deinit();
    
    try bench.add("Planner Simple Bytecode", benchPlannerSimple, .{});
    try bench.add("Planner Complex Bytecode", benchPlannerComplex, .{});
    try bench.add("Planner With Jumps", benchPlannerWithJumps, .{});
    try bench.add("Planner Cache Performance", benchPlannerCache, .{});
    try bench.add("Planner Large Bytecode", benchPlannerLargeBytecode, .{});
    try bench.add("Planner Varying Sizes", benchPlannerVaryingSize, .{});
    
    try stdout.print("Running Planner Benchmarks...\n");
    try bench.run(stdout);
}