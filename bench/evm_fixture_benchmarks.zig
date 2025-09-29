const std = @import("std");
const zbench = @import("zbench");
const evm = @import("evm");
const primitives = @import("primitives");

const Address = primitives.Address.Address;
const MinimalEvm = evm.MinimalEvm;

// Pre-loaded bytecode storage
var snailtracer_bytecode: []u8 = undefined;
var bubblesort_bytecode: []u8 = undefined;
var erc20transfer_bytecode: []u8 = undefined;
var erc20mint_bytecode: []u8 = undefined;
var erc20approval_bytecode: []u8 = undefined;
var tenhashes_bytecode: []u8 = undefined;
var arithmetic_bytecode: []u8 = undefined;
var storage_bytecode: []u8 = undefined;

fn decodeHex(allocator: std.mem.Allocator, hex_str: []const u8) ![]u8 {
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

fn loadBytecode(allocator: std.mem.Allocator, fixture_name: []const u8) ![]u8 {
    const cache_path = try std.fmt.allocPrint(allocator, "bench/fixtures/cache/{s}.bin", .{fixture_name});
    defer allocator.free(cache_path);

    const bytecode_hex = std.fs.cwd().readFileAlloc(allocator, cache_path, 1_000_000) catch {
        return try allocator.alloc(u8, 0);
    };
    defer allocator.free(bytecode_hex);

    return try decodeHex(allocator, std.mem.trim(u8, bytecode_hex, " \n\r\t"));
}

// Snailtracer benchmark - Main EVM
fn benchMainEvmSnailtracer(allocator: std.mem.Allocator) void {
    if (snailtracer_bytecode.len == 0) return;

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

    const code_hash = database.set_code(snailtracer_bytecode) catch unreachable;
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
        .{ .gas_limit = 1000000000, .coinbase = primitives.ZERO_ADDRESS, .chain_id = 1, .blob_versioned_hashes = &.{}, .blob_base_fee = 0 },
        1_000_000_000,
        sender,
    ) catch unreachable;
    defer main_evm.deinit();

    const calldata = decodeHex(allocator, "30627b7c") catch unreachable;
    defer allocator.free(calldata);

    var result = main_evm.simulate(.{ .call = .{ .caller = sender, .to = contract, .value = 0, .input = calldata, .gas = 1000000000 } });
    defer result.deinit(allocator);
}

// Snailtracer benchmark - Minimal EVM
fn benchMinimalEvmSnailtracer(allocator: std.mem.Allocator) void {
    if (snailtracer_bytecode.len == 0) return;

    const sender = Address.fromBytes(&([_]u8{0} ** 19 ++ [_]u8{0x01})) catch unreachable;
    const contract = Address.fromBytes(&([_]u8{0} ** 19 ++ [_]u8{0x42})) catch unreachable;

    var min_evm = MinimalEvm.init(allocator) catch unreachable;
    defer min_evm.deinit();

    min_evm.setBlockchainContext(1, 1, 1000000, 0, 0, primitives.ZERO_ADDRESS, 30_000_000, 1_000_000_000, 0);
    min_evm.setTransactionContext(sender, 1_000_000_000);
    min_evm.setBalance(sender, 100_000_000_000_000_000_000) catch unreachable;
    min_evm.setCode(contract, snailtracer_bytecode) catch unreachable;

    const calldata = decodeHex(allocator, "30627b7c") catch unreachable;
    defer allocator.free(calldata);

    _ = min_evm.execute(snailtracer_bytecode, 1000000000, sender, contract, 0, calldata) catch return;
}

// BubbleSort benchmark - Main EVM
fn benchMainEvmBubblesort(allocator: std.mem.Allocator) void {
    if (bubblesort_bytecode.len == 0) return;

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

    const code_hash = database.set_code(bubblesort_bytecode) catch unreachable;
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
        .{ .gas_limit = 30000000, .coinbase = primitives.ZERO_ADDRESS, .chain_id = 1, .blob_versioned_hashes = &.{}, .blob_base_fee = 0 },
        1_000_000_000,
        sender,
    ) catch unreachable;
    defer main_evm.deinit();

    const calldata = decodeHex(allocator, "239b51bf0000000000000000000000000000000000000000000000000000000000000064") catch unreachable;
    defer allocator.free(calldata);

    var result = main_evm.simulate(.{ .call = .{ .caller = sender, .to = contract, .value = 0, .input = calldata, .gas = 30000000 } });
    defer result.deinit(allocator);
}

// BubbleSort benchmark - Minimal EVM
fn benchMinimalEvmBubblesort(allocator: std.mem.Allocator) void {
    if (bubblesort_bytecode.len == 0) return;

    const sender = Address.fromBytes(&([_]u8{0} ** 19 ++ [_]u8{0x01})) catch unreachable;
    const contract = Address.fromBytes(&([_]u8{0} ** 19 ++ [_]u8{0x42})) catch unreachable;

    var min_evm = MinimalEvm.init(allocator) catch unreachable;
    defer min_evm.deinit();

    min_evm.setBlockchainContext(1, 1, 1000000, 0, 0, primitives.ZERO_ADDRESS, 30_000_000, 1_000_000_000, 0);
    min_evm.setTransactionContext(sender, 1_000_000_000);
    min_evm.setBalance(sender, 100_000_000_000_000_000_000) catch unreachable;
    min_evm.setCode(contract, bubblesort_bytecode) catch unreachable;

    const calldata = decodeHex(allocator, "239b51bf0000000000000000000000000000000000000000000000000000000000000064") catch unreachable;
    defer allocator.free(calldata);

    _ = min_evm.execute(bubblesort_bytecode, 30000000, sender, contract, 0, calldata) catch return;
}

// ERC20 Transfer benchmark - Main EVM
fn benchMainEvmErc20Transfer(allocator: std.mem.Allocator) void {
    if (erc20transfer_bytecode.len == 0) return;

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

    const code_hash = database.set_code(erc20transfer_bytecode) catch unreachable;
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
        .{ .gas_limit = 100000, .coinbase = primitives.ZERO_ADDRESS, .chain_id = 1, .blob_versioned_hashes = &.{}, .blob_base_fee = 0 },
        1_000_000_000,
        sender,
    ) catch unreachable;
    defer main_evm.deinit();

    const calldata = decodeHex(allocator, "a9059cbb000000000000000000000000000000000000000000000000000000000000002a0000000000000000000000000000000000000000000000000000000000000064") catch unreachable;
    defer allocator.free(calldata);

    var result = main_evm.simulate(.{ .call = .{ .caller = sender, .to = contract, .value = 0, .input = calldata, .gas = 100000 } });
    defer result.deinit(allocator);
}

// ERC20 Transfer benchmark - Minimal EVM
fn benchMinimalEvmErc20Transfer(allocator: std.mem.Allocator) void {
    if (erc20transfer_bytecode.len == 0) return;

    const sender = Address.fromBytes(&([_]u8{0} ** 19 ++ [_]u8{0x01})) catch unreachable;
    const contract = Address.fromBytes(&([_]u8{0} ** 19 ++ [_]u8{0x42})) catch unreachable;

    var min_evm = MinimalEvm.init(allocator) catch unreachable;
    defer min_evm.deinit();

    min_evm.setBlockchainContext(1, 1, 1000000, 0, 0, primitives.ZERO_ADDRESS, 30_000_000, 1_000_000_000, 0);
    min_evm.setTransactionContext(sender, 1_000_000_000);
    min_evm.setBalance(sender, 100_000_000_000_000_000_000) catch unreachable;
    min_evm.setCode(contract, erc20transfer_bytecode) catch unreachable;

    const calldata = decodeHex(allocator, "a9059cbb000000000000000000000000000000000000000000000000000000000000002a0000000000000000000000000000000000000000000000000000000000000064") catch unreachable;
    defer allocator.free(calldata);

    _ = min_evm.execute(erc20transfer_bytecode, 100000, sender, contract, 0, calldata) catch return;
}

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("\n=== EVM Fixture Benchmarks ===\n\n", .{});
    std.debug.print("Loading bytecode fixtures...\n", .{});

    // Load bytecode for all fixtures
    snailtracer_bytecode = try loadBytecode(allocator, "snailtracer");
    defer allocator.free(snailtracer_bytecode);

    bubblesort_bytecode = try loadBytecode(allocator, "bubblesort");
    defer allocator.free(bubblesort_bytecode);

    erc20transfer_bytecode = try loadBytecode(allocator, "erc20transfer");
    defer allocator.free(erc20transfer_bytecode);

    erc20mint_bytecode = try loadBytecode(allocator, "erc20mint");
    defer allocator.free(erc20mint_bytecode);

    erc20approval_bytecode = try loadBytecode(allocator, "erc20approval");
    defer allocator.free(erc20approval_bytecode);

    tenhashes_bytecode = try loadBytecode(allocator, "ten-thousand-hashes");
    defer allocator.free(tenhashes_bytecode);

    arithmetic_bytecode = try loadBytecode(allocator, "arithmetic");
    defer allocator.free(arithmetic_bytecode);

    storage_bytecode = try loadBytecode(allocator, "storage");
    defer allocator.free(storage_bytecode);

    var loaded_count: u32 = 0;
    if (snailtracer_bytecode.len > 0) loaded_count += 1;
    if (bubblesort_bytecode.len > 0) loaded_count += 1;
    if (erc20transfer_bytecode.len > 0) loaded_count += 1;
    if (erc20mint_bytecode.len > 0) loaded_count += 1;
    if (erc20approval_bytecode.len > 0) loaded_count += 1;
    if (tenhashes_bytecode.len > 0) loaded_count += 1;
    if (arithmetic_bytecode.len > 0) loaded_count += 1;
    if (storage_bytecode.len > 0) loaded_count += 1;

    std.debug.print("Loaded {} fixtures successfully\n\n", .{loaded_count});

    // Create benchmark
    var bench = zbench.Benchmark.init(allocator, .{
        .time_budget_ns = 100_000_000, // 100ms per benchmark for faster testing
    });
    defer bench.deinit();

    // Add benchmarks - start with simpler ones
    if (erc20transfer_bytecode.len > 0) {
        try bench.add("MainEvm/erc20transfer", benchMainEvmErc20Transfer, .{});
        try bench.add("MinimalEvm/erc20transfer", benchMinimalEvmErc20Transfer, .{});
    }

    if (bubblesort_bytecode.len > 0) {
        try bench.add("MainEvm/bubblesort", benchMainEvmBubblesort, .{});
        try bench.add("MinimalEvm/bubblesort", benchMinimalEvmBubblesort, .{});
    }

    // Snailtracer is complex and might cause issues, add it last
    // if (snailtracer_bytecode.len > 0) {
    //     try bench.add("MainEvm/snailtracer", benchMainEvmSnailtracer, .{});
    //     try bench.add("MinimalEvm/snailtracer", benchMinimalEvmSnailtracer, .{});
    // }

    // Run benchmarks
    var buf: [4096]u8 = undefined;
    var writer = std.fs.File.stdout().writer(&buf);
    try bench.run(&writer.interface);
}