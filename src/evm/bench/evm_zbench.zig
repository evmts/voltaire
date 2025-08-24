const std = @import("std");
const zbench = @import("zbench");
const Frame = @import("../frame.zig").Frame;
const FrameConfig = @import("../frame_config.zig").FrameConfig;
const MemoryDatabase = @import("../memory_database.zig").MemoryDatabase;

// Create a test frame configuration for benchmarks
const TestConfig = FrameConfig{
    .stack_size = 1024,
    .WordType = u256,
    .TracerType = @import("../tracer.zig").NoOpTracer,
    .max_bytecode_size = 24576,
    .block_gas_limit = 30_000_000,
    .memory_limit = 1024 * 1024, // 1MB memory limit
    .memory_initial_capacity = 1024,
    .has_database = true,
};

const TestFrame = Frame(TestConfig);

// Test data for benchmarks
const test_bytecode = [_]u8{0x60, 0x01, 0x60, 0x02}; // PUSH1 0x01, PUSH1 0x02
const large_bytecode = [_]u8{0x60} ++ [_]u8{0x01} ** 1000; // PUSH1 with large data

fn create_test_frame(allocator: std.mem.Allocator) !TestFrame {
    var memory_db = MemoryDatabase.init(allocator);
    const db_interface = memory_db.to_database_interface();
    
    return TestFrame.init(
        allocator,
        &test_bytecode,
        1000000, // gas limit
        db_interface,
        null, // host
        null, // self_destruct
    );
}

fn benchmark_arithmetic_add(allocator: std.mem.Allocator) void {
    var frame = create_test_frame(allocator) catch return;
    defer frame.deinit(allocator);
    
    // Setup: Push two values onto stack
    frame.stack.push(100) catch return;
    frame.stack.push(200) catch return;
    
    // Benchmark: ADD operation
    frame.add() catch return;
}

fn benchmark_arithmetic_mul(allocator: std.mem.Allocator) void {
    var frame = create_test_frame(allocator) catch return;
    defer frame.deinit(allocator);
    
    // Setup: Push two values onto stack  
    frame.stack.push(123) catch return;
    frame.stack.push(456) catch return;
    
    // Benchmark: MUL operation
    frame.mul() catch return;
}

fn benchmark_arithmetic_div(allocator: std.mem.Allocator) void {
    var frame = create_test_frame(allocator) catch return;
    defer frame.deinit(allocator);
    
    // Setup: Push two values onto stack
    frame.stack.push(1000) catch return;
    frame.stack.push(10) catch return;
    
    // Benchmark: DIV operation
    frame.div() catch return;
}

fn benchmark_arithmetic_sub(allocator: std.mem.Allocator) void {
    var frame = create_test_frame(allocator) catch return;
    defer frame.deinit(allocator);
    
    // Setup: Push two values onto stack
    frame.stack.push(500) catch return;
    frame.stack.push(200) catch return;
    
    // Benchmark: SUB operation
    frame.sub() catch return;
}

fn benchmark_stack_push(allocator: std.mem.Allocator) void {
    var frame = create_test_frame(allocator) catch return;
    defer frame.deinit(allocator);
    
    // Benchmark: Stack push operation
    frame.stack.push(0x123456789abcdef0) catch return;
}

fn benchmark_stack_pop(allocator: std.mem.Allocator) void {
    var frame = create_test_frame(allocator) catch return;
    defer frame.deinit(allocator);
    
    // Setup: Push a value first
    frame.stack.push(0x123456789abcdef0) catch return;
    
    // Benchmark: Stack pop operation  
    _ = frame.stack.pop() catch return;
}

fn benchmark_bitwise_and(allocator: std.mem.Allocator) void {
    var frame = create_test_frame(allocator) catch return;
    defer frame.deinit(allocator);
    
    // Setup: Push two values onto stack
    frame.stack.push(0xFFFF0000FFFF0000) catch return;
    frame.stack.push(0x0000FFFF0000FFFF) catch return;
    
    // Benchmark: AND operation
    frame.bit_and() catch return;
}

fn benchmark_bitwise_or(allocator: std.mem.Allocator) void {
    var frame = create_test_frame(allocator) catch return;
    defer frame.deinit(allocator);
    
    // Setup: Push two values onto stack
    frame.stack.push(0xFFFF0000FFFF0000) catch return;
    frame.stack.push(0x0000FFFF0000FFFF) catch return;
    
    // Benchmark: OR operation
    frame.bit_or() catch return;
}

fn benchmark_comparison_lt(allocator: std.mem.Allocator) void {
    var frame = create_test_frame(allocator) catch return;
    defer frame.deinit(allocator);
    
    // Setup: Push two values onto stack
    frame.stack.push(100) catch return;
    frame.stack.push(200) catch return;
    
    // Benchmark: LT (less than) operation
    frame.lt() catch return;
}

fn benchmark_comparison_eq(allocator: std.mem.Allocator) void {
    var frame = create_test_frame(allocator) catch return;
    defer frame.deinit(allocator);
    
    // Setup: Push two values onto stack
    frame.stack.push(100) catch return;
    frame.stack.push(100) catch return;
    
    // Benchmark: EQ (equal) operation
    frame.eq() catch return;
}

fn benchmark_memory_store(allocator: std.mem.Allocator) void {
    var frame = create_test_frame(allocator) catch return;
    defer frame.deinit(allocator);
    
    // Setup: Push offset and value onto stack
    frame.stack.push(0) catch return;     // offset
    frame.stack.push(0x123456789abcdef0) catch return; // value
    
    // Benchmark: MSTORE operation
    frame.mstore() catch return;
}

fn benchmark_memory_load(allocator: std.mem.Allocator) void {
    var frame = create_test_frame(allocator) catch return;
    defer frame.deinit(allocator);
    
    // Setup: Store a value first
    frame.stack.push(0) catch return;
    frame.stack.push(0x123456789abcdef0) catch return;
    frame.mstore() catch return;
    
    // Setup: Push offset for load
    frame.stack.push(0) catch return;
    
    // Benchmark: MLOAD operation
    frame.mload() catch return;
}

fn benchmark_keccak256(allocator: std.mem.Allocator) void {
    var frame = create_test_frame(allocator) catch return;
    defer frame.deinit(allocator);
    
    // Setup: Store some data in memory first
    frame.stack.push(0) catch return;     // offset
    frame.stack.push(0x123456789abcdef0) catch return; // value
    frame.mstore() catch return;
    
    // Setup: Push offset and length for KECCAK256
    frame.stack.push(0) catch return;  // offset
    frame.stack.push(32) catch return; // length
    
    // Benchmark: KECCAK256 operation
    frame.op_keccak256() catch return;
}

fn benchmark_frame_init(allocator: std.mem.Allocator) void {
    var memory_db = MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = memory_db.to_database_interface();
    
    // Benchmark: Frame initialization
    var frame = TestFrame.init(
        allocator,
        &test_bytecode,
        1000000,
        db_interface,
        null,
        null,
    ) catch return;
    defer frame.deinit(allocator);
}

fn benchmark_frame_init_large_bytecode(allocator: std.mem.Allocator) void {
    var memory_db = MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = memory_db.to_database_interface();
    
    // Benchmark: Frame initialization with large bytecode
    var frame = TestFrame.init(
        allocator,
        &large_bytecode,
        1000000,
        db_interface,
        null,
        null,
    ) catch return;
    defer frame.deinit(allocator);
}

// Complex operations benchmark
fn benchmark_arithmetic_sequence(allocator: std.mem.Allocator) void {
    var frame = create_test_frame(allocator) catch return;
    defer frame.deinit(allocator);
    
    // Benchmark: Sequence of arithmetic operations
    // ADD, MUL, SUB, DIV
    frame.stack.push(100) catch return;
    frame.stack.push(200) catch return;
    frame.add() catch return;
    
    frame.stack.push(3) catch return;
    frame.mul() catch return;
    
    frame.stack.push(50) catch return;
    frame.sub() catch return;
    
    frame.stack.push(5) catch return;  
    frame.div() catch return;
}

pub fn main() !void {
    const stdout = std.io.getStdOut().writer();
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    var bench = zbench.Benchmark.init(allocator, .{});
    defer bench.deinit();

    try stdout.print("\\n🚀 EVM Frame Benchmarks\\n");
    try stdout.print("========================\\n\\n");

    // Arithmetic Operations Benchmarks
    try bench.add("Frame Init", benchmark_frame_init, .{});
    try bench.add("Frame Init (Large Bytecode)", benchmark_frame_init_large_bytecode, .{});
    
    // Arithmetic operations
    try bench.add("Arithmetic ADD", benchmark_arithmetic_add, .{});
    try bench.add("Arithmetic MUL", benchmark_arithmetic_mul, .{});
    try bench.add("Arithmetic SUB", benchmark_arithmetic_sub, .{});
    try bench.add("Arithmetic DIV", benchmark_arithmetic_div, .{});
    
    // Stack operations
    try bench.add("Stack PUSH", benchmark_stack_push, .{});
    try bench.add("Stack POP", benchmark_stack_pop, .{});
    
    // Bitwise operations
    try bench.add("Bitwise AND", benchmark_bitwise_and, .{});
    try bench.add("Bitwise OR", benchmark_bitwise_or, .{});
    
    // Comparison operations
    try bench.add("Comparison LT", benchmark_comparison_lt, .{});
    try bench.add("Comparison EQ", benchmark_comparison_eq, .{});
    
    // Memory operations
    try bench.add("Memory STORE", benchmark_memory_store, .{});
    try bench.add("Memory LOAD", benchmark_memory_load, .{});
    
    // Cryptographic operations
    try bench.add("KECCAK256", benchmark_keccak256, .{});
    
    // Complex sequences
    try bench.add("Arithmetic Sequence", benchmark_arithmetic_sequence, .{});

    try stdout.print("Running benchmarks...\\n\\n");
    try bench.run(stdout);
    
    try stdout.print("\\n✅ EVM benchmarks completed!\\n");
}

test "benchmark compilation" {
    // Basic compilation test to ensure all benchmark functions compile
    const allocator = std.testing.allocator;
    
    // Test frame creation
    var memory_db = MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = memory_db.to_database_interface();
    
    var frame = TestFrame.init(
        allocator,
        &test_bytecode,
        1000000,
        db_interface,
        null,
        null,
    ) catch return;
    defer frame.deinit(allocator);
    
    // Test basic operations
    try frame.stack.push(100);
    try frame.stack.push(200);
    try frame.add();
    
    const result = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 300), result);
}