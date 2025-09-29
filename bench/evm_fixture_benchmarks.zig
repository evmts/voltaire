const std = @import("std");
const zbench = @import("zbench");
const evm = @import("evm");
const primitives = @import("primitives");
const fixtures = @import("fixtures");

const Address = primitives.Address.Address;
const MinimalEvm = evm.MinimalEvm;

// Pre-compiled fixtures
var compiled_fixtures: ?fixtures.Fixtures = null;

fn hexToBytes(allocator: std.mem.Allocator, hex_str: []const u8) ![]u8 {
    var str = hex_str;
    if (str.len >= 2 and (std.mem.eql(u8, str[0..2], "0x") or std.mem.eql(u8, str[0..2], "0X"))) {
        str = str[2..];
    }
    if (str.len % 2 != 0) return error.OddNumberOfDigits;
    
    const result = try allocator.alloc(u8, str.len / 2);
    for (result, 0..) |*byte, i| {
        const high = try std.fmt.charToDigit(str[i * 2], 16);
        const low = try std.fmt.charToDigit(str[i * 2 + 1], 16);
        byte.* = (high << 4) | low;
    }
    return result;
}

// Generic benchmark function for Main EVM
fn benchMainEvm(allocator: std.mem.Allocator, fixture_name: []const u8, calldata_hex: []const u8, gas: u64) void {
    const fx = compiled_fixtures orelse return;
    const bytecode = fx.getDeployedBytecode(fixture_name) orelse return;
    
    var database = evm.Database.init(allocator);
    defer database.deinit();
    
    const sender = Address.fromBytes(&([_]u8{0} ** 19 ++ [_]u8{0x01})) catch unreachable;
    const contract = Address.fromBytes(&([_]u8{0} ** 19 ++ [_]u8{0x42})) catch unreachable;
    
    database.set_account(sender.bytes, .{
        .balance = 100_000_000_000_000_000_000,
        .code_hash = [_]u8{0} ** 32,
        .storage_root = [_]u8{0} ** 32,
        .nonce = 0,
        .delegated_address = null,
    }) catch unreachable;
    
    const code_hash = database.set_code(bytecode) catch unreachable;
    database.set_account(contract.bytes, .{
        .balance = 0,
        .code_hash = code_hash,
        .storage_root = [_]u8{0} ** 32,
        .nonce = 0,
        .delegated_address = null,
    }) catch unreachable;
    
    var main_evm = evm.MainnetEvm.init(
        allocator,
        &database,
        .{ .number = 1, .timestamp = 1000000, .gas_limit = 30_000_000, .coinbase = primitives.ZERO_ADDRESS, .base_fee = 1_000_000_000, .chain_id = 1, .difficulty = 0, .prev_randao = [_]u8{0} ** 32, .blob_base_fee = 0, .blob_versioned_hashes = &.{} },
        .{ .gas_limit = gas, .coinbase = primitives.ZERO_ADDRESS, .chain_id = 1, .blob_versioned_hashes = &.{}, .blob_base_fee = 0 },
        1_000_000_000,
        sender,
    ) catch unreachable;
    defer main_evm.deinit();
    
    const calldata = hexToBytes(allocator, calldata_hex) catch unreachable;
    defer allocator.free(calldata);
    
    var result = main_evm.simulate(.{ .call = .{ .caller = sender, .to = contract, .value = 0, .input = calldata, .gas = gas } });
    defer result.deinit(allocator);
}

// Generic benchmark function for Minimal EVM
fn benchMinimalEvm(allocator: std.mem.Allocator, fixture_name: []const u8, calldata_hex: []const u8, gas: u64) void {
    const fx = compiled_fixtures orelse return;
    const bytecode = fx.getDeployedBytecode(fixture_name) orelse return;
    
    const sender = Address.fromBytes(&([_]u8{0} ** 19 ++ [_]u8{0x01})) catch unreachable;
    const contract = Address.fromBytes(&([_]u8{0} ** 19 ++ [_]u8{0x42})) catch unreachable;
    
    var min_evm = MinimalEvm.init(allocator) catch unreachable;
    defer min_evm.deinit();
    
    min_evm.setBlockchainContext(1, 1, 1000000, 0, 0, primitives.ZERO_ADDRESS, 30_000_000, 1_000_000_000, 0);
    min_evm.setTransactionContext(sender, 1_000_000_000);
    min_evm.setBalance(sender, 100_000_000_000_000_000_000) catch unreachable;
    min_evm.setCode(contract, bytecode) catch unreachable;
    
    const calldata = hexToBytes(allocator, calldata_hex) catch unreachable;
    defer allocator.free(calldata);
    
    _ = min_evm.execute(bytecode, gas, sender, contract, 0, calldata) catch return;
}

// Specific benchmark functions
fn benchMainEvmBubblesort(allocator: std.mem.Allocator) void {
    benchMainEvm(allocator, "bubblesort", "0x239b51bf0000000000000000000000000000000000000000000000000000000000000064", 30000000);
}

fn benchMinimalEvmBubblesort(allocator: std.mem.Allocator) void {
    benchMinimalEvm(allocator, "bubblesort", "0x239b51bf0000000000000000000000000000000000000000000000000000000000000064", 30000000);
}

fn benchMainEvmArithmetic(allocator: std.mem.Allocator) void {
    benchMainEvm(allocator, "arithmetic", "0x", 1000000);
}

fn benchMinimalEvmArithmetic(allocator: std.mem.Allocator) void {
    benchMinimalEvm(allocator, "arithmetic", "0x", 1000000);
}

fn benchMainEvmStorage(allocator: std.mem.Allocator) void {
    benchMainEvm(allocator, "storage", "0x", 1000000);
}

fn benchMinimalEvmStorage(allocator: std.mem.Allocator) void {
    benchMinimalEvm(allocator, "storage", "0x", 1000000);
}

fn benchMainEvmHashing(allocator: std.mem.Allocator) void {
    benchMainEvm(allocator, "hashing", "0x", 1000000);
}

fn benchMinimalEvmHashing(allocator: std.mem.Allocator) void {
    benchMinimalEvm(allocator, "hashing", "0x", 1000000);
}

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();
    
    std.debug.print("\n=== EVM Fixture Benchmarks ===\n\n", .{});
    std.debug.print("Compiling fixtures...\n", .{});
    
    // Initialize and compile all fixtures
    var fx = try fixtures.Fixtures.init(allocator);
    defer fx.deinit();
    
    try fx.compileAll();
    compiled_fixtures = fx;
    
    // List available fixtures
    fx.listFixtures();
    std.debug.print("\n", .{});
    
    // Create benchmark
    var bench = zbench.Benchmark.init(allocator, .{
        .time_budget_ns = 100_000_000, // 100ms per benchmark
    });
    defer bench.deinit();
    
    // Add benchmarks
    if (fx.getContract("arithmetic") != null) {
        try bench.add("MainEvm/arithmetic", benchMainEvmArithmetic, .{});
        try bench.add("MinimalEvm/arithmetic", benchMinimalEvmArithmetic, .{});
    }
    
    if (fx.getContract("storage") != null) {
        try bench.add("MainEvm/storage", benchMainEvmStorage, .{});
        try bench.add("MinimalEvm/storage", benchMinimalEvmStorage, .{});
    }
    
    if (fx.getContract("hashing") != null) {
        try bench.add("MainEvm/hashing", benchMainEvmHashing, .{});
        try bench.add("MinimalEvm/hashing", benchMinimalEvmHashing, .{});
    }
    
    if (fx.getContract("bubblesort") != null) {
        try bench.add("MainEvm/bubblesort", benchMainEvmBubblesort, .{});
        try bench.add("MinimalEvm/bubblesort", benchMinimalEvmBubblesort, .{});
    }
    
    // Run benchmarks
    var buf: [4096]u8 = undefined;
    var writer = std.fs.File.stdout().writer(&buf);
    try bench.run(&writer.interface);
}