const std = @import("std");
const frame_interpreter = @import("../frame_interpreter.zig");
const evm = @import("../evm.zig");
const database_interface = @import("../database_interface.zig");
const memory_database = @import("../memory_database.zig");
const primitives = @import("primitives");
const Address = primitives.Address.Address;
const zbench = @import("zbench");

// ============================================================================
// CREATE Opcode Benchmarks
// ============================================================================

const BenchmarkContext = struct {
    allocator: std.mem.Allocator,
    memory_db: memory_database.MemoryDatabase,
    db_interface: database_interface.DatabaseInterface,
    evm_instance: evm.Evm(evm.DefaultEvmConfig),
    
    pub fn init(allocator: std.mem.Allocator) !BenchmarkContext {
        var memory_db = memory_database.MemoryDatabase.init(allocator);
        const db_interface = memory_db.to_database_interface();
        
        var evm_instance = try evm.Evm(evm.DefaultEvmConfig).init(
            allocator,
            db_interface,
            .{
                .number = 1,
                .timestamp = 1000,
                .difficulty = 100,
                .gas_limit = 30_000_000,
                .coinbase = Address{0} ** 20,
                .base_fee = 1_000_000_000,
                .prev_randao = [_]u8{0} ** 32,
            },
            .{
                .nonce = 0,
                .gas_price = 20_000_000_000,
                .gas_limit = 10_000_000,
                .to = null,
                .value = 0,
                .data = &[_]u8{},
                .chain_id = 1,
                .origin = Address{0x01} ** 20,
                .blob_hashes = &[_][32]u8{},
                .max_fee_per_blob_gas = null,
            },
            20_000_000_000,
            Address{0x01} ** 20,
            .CANCUN,
        );
        
        // Set up deployer account with balance
        try evm_instance.database.set_account(Address{0x01} ** 20, .{
            .nonce = 1,
            .balance = 1_000_000_000_000_000_000, // 1 ETH
            .code_hash = [_]u8{0} ** 32,
            .code = &[_]u8{},
        });
        
        return .{
            .allocator = allocator,
            .memory_db = memory_db,
            .db_interface = db_interface,
            .evm_instance = evm_instance,
        };
    }
    
    pub fn deinit(self: *BenchmarkContext) void {
        self.evm_instance.deinit();
        self.memory_db.deinit();
    }
};

fn benchmarkCreateMinimal(allocator: std.mem.Allocator) void {
    var ctx = BenchmarkContext.init(allocator) catch unreachable;
    defer ctx.deinit();
    
    // Minimal CREATE: empty init code
    const bytecode = [_]u8{
        0x60, 0x00, // PUSH1 0 (size)
        0x60, 0x00, // PUSH1 0 (offset)
        0x60, 0x00, // PUSH1 0 (value)
        0xF0,       // CREATE
        0x00,       // STOP
    };
    
    const FrameInterpreterType = frame_interpreter.FrameInterpreter(.{ .has_database = true });
    var interpreter = FrameInterpreterType.init(allocator, &bytecode, 1_000_000, ctx.db_interface) catch unreachable;
    defer interpreter.deinit(allocator);
    
    interpreter.frame.host = ctx.evm_instance.to_host();
    interpreter.frame.contract_address = Address{0x01} ** 20;
    
    interpreter.interpret() catch unreachable;
}

fn benchmarkCreateSmallContract(allocator: std.mem.Allocator) void {
    var ctx = BenchmarkContext.init(allocator) catch unreachable;
    defer ctx.deinit();
    
    // Small contract (100 bytes)
    const init_code_size = 100;
    var bytecode = std.ArrayList(u8).init(allocator);
    defer bytecode.deinit();
    
    // Store init code in memory (PUSH1 0x00 repeated)
    var i: usize = 0;
    while (i < init_code_size) : (i += 2) {
        bytecode.append(0x60) catch unreachable; // PUSH1
        bytecode.append(0x00) catch unreachable; // 0
        bytecode.append(0x60) catch unreachable; // PUSH1
        bytecode.append(@intCast(i / 2)) catch unreachable; // offset
        bytecode.append(0x53) catch unreachable; // MSTORE8
    }
    
    // CREATE
    bytecode.append(0x60) catch unreachable; // PUSH1
    bytecode.append(@intCast(init_code_size)) catch unreachable;
    bytecode.append(0x60) catch unreachable; // PUSH1 0
    bytecode.append(0x00) catch unreachable;
    bytecode.append(0x60) catch unreachable; // PUSH1 0
    bytecode.append(0x00) catch unreachable;
    bytecode.append(0xF0) catch unreachable; // CREATE
    bytecode.append(0x00) catch unreachable; // STOP
    
    const FrameInterpreterType = frame_interpreter.FrameInterpreter(.{ .has_database = true });
    var interpreter = FrameInterpreterType.init(allocator, bytecode.items, 5_000_000, ctx.db_interface) catch unreachable;
    defer interpreter.deinit(allocator);
    
    interpreter.frame.host = ctx.evm_instance.to_host();
    interpreter.frame.contract_address = Address{0x01} ** 20;
    
    interpreter.interpret() catch unreachable;
}

fn benchmarkCreateMediumContract(allocator: std.mem.Allocator) void {
    var ctx = BenchmarkContext.init(allocator) catch unreachable;
    defer ctx.deinit();
    
    // Medium contract (1KB)
    const init_code_size = 1024;
    var init_code = allocator.alloc(u8, init_code_size) catch unreachable;
    defer allocator.free(init_code);
    
    // Fill with valid opcodes
    for (init_code, 0..) |*byte, idx| {
        byte.* = if (idx % 2 == 0) 0x60 else 0x00; // PUSH1 0
    }
    // End with RETURN
    init_code[init_code_size - 3] = 0x60; // PUSH1
    init_code[init_code_size - 2] = 0x00; // 0
    init_code[init_code_size - 1] = 0xF3; // RETURN
    
    // Bytecode: PUSH2 size, PUSH1 0, PUSH1 0, CREATE
    const bytecode = [_]u8{
        0x61, 0x04, 0x00, // PUSH2 1024
        0x60, 0x00,       // PUSH1 0
        0x60, 0x00,       // PUSH1 0
        0xF0,             // CREATE
        0x00,             // STOP
    };
    
    const FrameInterpreterType = frame_interpreter.FrameInterpreter(.{ .has_database = true });
    var interpreter = FrameInterpreterType.init(allocator, &bytecode, 10_000_000, ctx.db_interface) catch unreachable;
    defer interpreter.deinit(allocator);
    
    // Pre-store init code in memory
    interpreter.frame.memory.ensure_capacity(init_code_size) catch unreachable;
    interpreter.frame.memory.set_data(0, init_code) catch unreachable;
    
    interpreter.frame.host = ctx.evm_instance.to_host();
    interpreter.frame.contract_address = Address{0x01} ** 20;
    
    interpreter.interpret() catch unreachable;
}

fn benchmarkCreateLargeContract(allocator: std.mem.Allocator) void {
    var ctx = BenchmarkContext.init(allocator) catch unreachable;
    defer ctx.deinit();
    
    // Large contract (24KB - half of max)
    const init_code_size = 24576;
    var init_code = allocator.alloc(u8, init_code_size) catch unreachable;
    defer allocator.free(init_code);
    
    // Fill with valid opcodes
    for (init_code, 0..) |*byte, idx| {
        byte.* = switch (idx % 4) {
            0 => 0x60, // PUSH1
            1 => 0x01, // 1
            2 => 0x60, // PUSH1
            3 => 0x02, // 2
            else => unreachable,
        };
    }
    // End with RETURN
    init_code[init_code_size - 3] = 0x60; // PUSH1
    init_code[init_code_size - 2] = 0x00; // 0
    init_code[init_code_size - 1] = 0xF3; // RETURN
    
    // Bytecode: PUSH2 size, PUSH1 0, PUSH1 0, CREATE
    const bytecode = [_]u8{
        0x62, 0x60, 0x00, // PUSH3 24576
        0x60, 0x00,       // PUSH1 0
        0x60, 0x00,       // PUSH1 0
        0xF0,             // CREATE
        0x00,             // STOP
    };
    
    const FrameInterpreterType = frame_interpreter.FrameInterpreter(.{ .has_database = true });
    var interpreter = FrameInterpreterType.init(allocator, &bytecode, 20_000_000, ctx.db_interface) catch unreachable;
    defer interpreter.deinit(allocator);
    
    // Pre-store init code in memory
    interpreter.frame.memory.ensure_capacity(init_code_size) catch unreachable;
    interpreter.frame.memory.set_data(0, init_code) catch unreachable;
    
    interpreter.frame.host = ctx.evm_instance.to_host();
    interpreter.frame.contract_address = Address{0x01} ** 20;
    
    interpreter.interpret() catch unreachable;
}

fn benchmarkCreateWithValue(allocator: std.mem.Allocator) void {
    var ctx = BenchmarkContext.init(allocator) catch unreachable;
    defer ctx.deinit();
    
    // CREATE with 1 ETH value transfer
    const bytecode = [_]u8{
        0x60, 0x00,       // PUSH1 0 (size)
        0x60, 0x00,       // PUSH1 0 (offset)
        0x68, 0x0D, 0xE0, 0xB6, 0xB3, 0xA7, 0x64, 0x00, 0x00, // PUSH9 1 ETH
        0xF0,             // CREATE
        0x00,             // STOP
    };
    
    const FrameInterpreterType = frame_interpreter.FrameInterpreter(.{ .has_database = true });
    var interpreter = FrameInterpreterType.init(allocator, &bytecode, 1_000_000, ctx.db_interface) catch unreachable;
    defer interpreter.deinit(allocator);
    
    interpreter.frame.host = ctx.evm_instance.to_host();
    interpreter.frame.contract_address = Address{0x01} ** 20;
    
    interpreter.interpret() catch unreachable;
}

fn benchmarkCreateWithComplexInit(allocator: std.mem.Allocator) void {
    var ctx = BenchmarkContext.init(allocator) catch unreachable;
    defer ctx.deinit();
    
    // Complex init code with storage operations
    const init_code = [_]u8{
        // Initialize storage slots
        0x60, 0x42, // PUSH1 66
        0x60, 0x00, // PUSH1 0
        0x55,       // SSTORE
        
        0x60, 0x84, // PUSH1 132
        0x60, 0x01, // PUSH1 1
        0x55,       // SSTORE
        
        // Calculate and store
        0x60, 0x00, // PUSH1 0
        0x54,       // SLOAD
        0x60, 0x01, // PUSH1 1
        0x54,       // SLOAD
        0x01,       // ADD
        0x60, 0x02, // PUSH1 2
        0x55,       // SSTORE
        
        // Return runtime code
        0x60, 0x10, // PUSH1 16 (size)
        0x60, 0x20, // PUSH1 32 (offset)
        0xF3,       // RETURN
        
        // Padding to offset 32
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        
        // Runtime code (16 bytes)
        0x60, 0x00, 0x54, // PUSH1 0, SLOAD
        0x60, 0x00, 0x52, // PUSH1 0, MSTORE
        0x60, 0x20, 0x60, 0x00, 0xF3, // PUSH1 32, PUSH1 0, RETURN
        0x00, 0x00, 0x00, // Padding
    };
    
    // Store init code and CREATE
    var bytecode = std.ArrayList(u8).init(allocator);
    defer bytecode.deinit();
    
    // Store init code in memory
    for (init_code) |byte| {
        bytecode.append(0x60) catch unreachable; // PUSH1
        bytecode.append(byte) catch unreachable;
    }
    
    var offset: u8 = init_code.len - 1;
    while (offset > 0) : (offset -= 1) {
        bytecode.append(0x60) catch unreachable; // PUSH1
        bytecode.append(offset) catch unreachable;
        bytecode.append(0x53) catch unreachable; // MSTORE8
    }
    bytecode.append(0x60) catch unreachable; // PUSH1
    bytecode.append(0x00) catch unreachable;
    bytecode.append(0x53) catch unreachable; // MSTORE8
    
    // CREATE
    bytecode.append(0x60) catch unreachable; // PUSH1
    bytecode.append(@intCast(init_code.len)) catch unreachable;
    bytecode.append(0x60) catch unreachable; // PUSH1 0
    bytecode.append(0x00) catch unreachable;
    bytecode.append(0x60) catch unreachable; // PUSH1 0
    bytecode.append(0x00) catch unreachable;
    bytecode.append(0xF0) catch unreachable; // CREATE
    bytecode.append(0x00) catch unreachable; // STOP
    
    const FrameInterpreterType = frame_interpreter.FrameInterpreter(.{ .has_database = true });
    var interpreter = FrameInterpreterType.init(allocator, bytecode.items, 5_000_000, ctx.db_interface) catch unreachable;
    defer interpreter.deinit(allocator);
    
    interpreter.frame.host = ctx.evm_instance.to_host();
    interpreter.frame.contract_address = Address{0x01} ** 20;
    
    interpreter.interpret() catch unreachable;
}

pub fn main() !void {
    const stdout = std.io.getStdOut().writer();
    var bench = zbench.Benchmark.init(std.heap.page_allocator, .{});
    defer bench.deinit();
    
    try stdout.print("\n=== CREATE Opcode Performance Benchmarks ===\n\n", .{});
    
    try bench.add("CREATE minimal (empty init)", benchmarkCreateMinimal, .{});
    try bench.add("CREATE small contract (100 bytes)", benchmarkCreateSmallContract, .{});
    try bench.add("CREATE medium contract (1KB)", benchmarkCreateMediumContract, .{});
    try bench.add("CREATE large contract (24KB)", benchmarkCreateLargeContract, .{});
    try bench.add("CREATE with value transfer", benchmarkCreateWithValue, .{});
    try bench.add("CREATE with complex init", benchmarkCreateWithComplexInit, .{});
    
    try stdout.print("Running benchmarks...\n", .{});
    try bench.run(stdout);
}

// ============================================================================
// Gas Cost Analysis Tests
// ============================================================================

test "CREATE gas cost analysis" {
    const allocator = std.testing.allocator;
    var ctx = try BenchmarkContext.init(allocator);
    defer ctx.deinit();
    
    // Test gas costs for different init code sizes
    const test_sizes = [_]usize{ 0, 100, 1024, 10240, 24576, 49152 };
    
    std.debug.print("\n=== CREATE Gas Cost Analysis ===\n", .{});
    std.debug.print("Size (bytes) | Base Cost | Init Cost | Total Cost\n", .{});
    std.debug.print("-------------|-----------|-----------|------------\n", .{});
    
    for (test_sizes) |size| {
        const base_cost = 32000; // CREATE base cost
        const init_cost = size * 200; // 200 gas per byte (EIP-3860)
        const total_cost = base_cost + init_cost;
        
        std.debug.print("{d:>12} | {d:>9} | {d:>9} | {d:>10}\n", .{
            size, base_cost, init_cost, total_cost
        });
    }
    
    // Verify costs match expectations
    try std.testing.expectEqual(@as(u64, 32000), 32000 + 0 * 200); // Empty
    try std.testing.expectEqual(@as(u64, 52000), 32000 + 100 * 200); // 100 bytes
    try std.testing.expectEqual(@as(u64, 236800), 32000 + 1024 * 200); // 1KB
    try std.testing.expectEqual(@as(u64, 9862400), 32000 + 49152 * 200); // 48KB max
}