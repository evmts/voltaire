const std = @import("std");
const zbench = @import("zbench");
const primitives = @import("primitives");
const evm_mod = @import("evm");
const revm = @import("revm");
const crypto = @import("crypto");
const HashUtils = crypto.HashUtils;
const Address = primitives.Address.Address;
const ZERO_ADDRESS = primitives.ZERO_ADDRESS;
const TransactionContext = evm_mod.TransactionContext;

// Configuration
const BENCHMARK_GAS_LIMIT: u64 = 30_000_000;
const CALLER_ADDRESS: Address = [_]u8{0x11} ** 20;
const CONTRACT_ADDRESS: Address = [_]u8{0x22} ** 20;

// ============================================================================
// Benchmark Registration
// ============================================================================

pub fn bench(b: *zbench.Benchmark) !void {
    try b.add("EVM: Snailtracer", benchmark_evm_snailtracer, .{});
    try b.add("REVM: Snailtracer", benchmark_revm_snailtracer, .{});
}

// ============================================================================
// Helper Functions
// ============================================================================

fn loadBytecode(allocator: std.mem.Allocator) ![]u8 {
    const file = try std.fs.cwd().openFile("bench/cases/snailtracer/bytecode.txt", .{});
    defer file.close();
    
    const file_size = try file.getEndPos();
    const hex_content = try allocator.alloc(u8, file_size);
    defer allocator.free(hex_content);
    
    _ = try file.read(hex_content);
    
    // Count hex characters
    var hex_count: usize = 0;
    for (hex_content) |c| {
        if (std.ascii.isHex(c)) {
            hex_count += 1;
        }
    }
    
    // Allocate clean hex buffer
    const clean_hex = try allocator.alloc(u8, hex_count);
    defer allocator.free(clean_hex);
    
    // Copy only hex characters
    var idx: usize = 0;
    for (hex_content) |c| {
        if (std.ascii.isHex(c)) {
            clean_hex[idx] = c;
            idx += 1;
        }
    }
    
    // Convert hex string to bytes
    const bytecode = try allocator.alloc(u8, clean_hex.len / 2);
    _ = try std.fmt.hexToBytes(bytecode, clean_hex);
    
    return bytecode;
}

fn loadCalldata(allocator: std.mem.Allocator) ![]u8 {
    const file = try std.fs.cwd().openFile("bench/cases/snailtracer/calldata.txt", .{});
    defer file.close();
    
    const file_size = try file.getEndPos();
    const hex_content = try allocator.alloc(u8, file_size);
    defer allocator.free(hex_content);
    
    _ = try file.read(hex_content);
    
    // Count hex characters
    var hex_count: usize = 0;
    for (hex_content) |c| {
        if (std.ascii.isHex(c)) {
            hex_count += 1;
        }
    }
    
    // Allocate clean hex buffer
    const clean_hex = try allocator.alloc(u8, hex_count);
    defer allocator.free(clean_hex);
    
    // Copy only hex characters
    var idx: usize = 0;
    for (hex_content) |c| {
        if (std.ascii.isHex(c)) {
            clean_hex[idx] = c;
            idx += 1;
        }
    }
    
    // Convert hex string to bytes
    const calldata = try allocator.alloc(u8, clean_hex.len / 2);
    _ = try std.fmt.hexToBytes(calldata, clean_hex);
    
    return calldata;
}

// ============================================================================
// EVM Benchmark
// ============================================================================

fn benchmark_evm_snailtracer(allocator: std.mem.Allocator) void {
    // Load bytecode and calldata
    const bytecode = loadBytecode(allocator) catch |err| {
        std.log.err("EVM snailtracer benchmark failed to load bytecode: {}", .{err});
        @panic("EVM snailtracer benchmark failed");
    };
    defer allocator.free(bytecode);
    
    const calldata = loadCalldata(allocator) catch |err| {
        std.log.err("EVM snailtracer benchmark failed to load calldata: {}", .{err});
        @panic("EVM snailtracer benchmark failed");
    };
    defer allocator.free(calldata);
    
    // Create memory database
    var memory_db = evm_mod.MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    
    const db_interface = memory_db.to_database_interface();
    
    // Set up block info
    const block_info = evm_mod.BlockInfo{
        .number = 1,
        .timestamp = 1640995200,
        .gas_limit = BENCHMARK_GAS_LIMIT,
        .difficulty = 0,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 0,
        .prev_randao = [_]u8{0} ** 32,
    };
    
    // Set up transaction context
    const context = TransactionContext{
        .gas_limit = BENCHMARK_GAS_LIMIT,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };
    
    // Create EVM instance
    var vm = evm_mod.Evm(.{}).init(allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN) catch |err| {
        std.log.err("EVM snailtracer benchmark failed to init VM: {}", .{err});
        @panic("EVM snailtracer benchmark failed");
    };
    defer vm.deinit();
    
    // Set up call parameters
    const call_params = evm_mod.CallParams{
        .call = .{
            .caller = CALLER_ADDRESS,
            .to = CONTRACT_ADDRESS,
            .value = 0,
            .input = calldata,
            .gas = BENCHMARK_GAS_LIMIT,
        },
    };
    
    // Deploy contract
    const code_hash = db_interface.set_code(bytecode) catch |err| {
        std.log.err("EVM snailtracer benchmark failed to set code: {}", .{err});
        @panic("EVM snailtracer benchmark failed");
    };
    
    var account = db_interface.get_account(CONTRACT_ADDRESS) catch null orelse evm_mod.Account{
        .balance = 0,
        .nonce = 0,
        .code_hash = HashUtils.EMPTY_KECCAK256,
        .storage_root = [_]u8{0} ** 32,
    };
    
    account.code_hash = code_hash;
    db_interface.set_account(CONTRACT_ADDRESS, account) catch |err| {
        std.log.err("EVM snailtracer benchmark failed to set account: {}", .{err});
        @panic("EVM snailtracer benchmark failed");
    };
    
    // Execute the call
    const result = vm.call(call_params) catch |err| {
        std.log.err("EVM snailtracer benchmark failed to call: {}", .{err});
        @panic("EVM snailtracer benchmark failed");
    };
    _ = result;
}

// ============================================================================
// REVM Benchmark
// ============================================================================

fn benchmark_revm_snailtracer(allocator: std.mem.Allocator) void {
    // Load bytecode and calldata
    const bytecode = loadBytecode(allocator) catch |err| {
        std.log.err("REVM snailtracer benchmark failed to load bytecode: {}", .{err});
        @panic("REVM snailtracer benchmark failed");
    };
    defer allocator.free(bytecode);
    
    const calldata = loadCalldata(allocator) catch |err| {
        std.log.err("REVM snailtracer benchmark failed to load calldata: {}", .{err});
        @panic("REVM snailtracer benchmark failed");
    };
    defer allocator.free(calldata);
    
    // Set up REVM
    const settings = revm.RevmSettings{
        .gas_limit = BENCHMARK_GAS_LIMIT,
        .chain_id = 1,
    };
    
    var vm = revm.Revm.init(allocator, settings) catch |err| {
        std.log.err("REVM snailtracer benchmark failed to init VM: {}", .{err});
        @panic("REVM snailtracer benchmark failed");
    };
    defer vm.deinit();
    
    // Deploy contract
    vm.setCode(CONTRACT_ADDRESS, bytecode) catch |err| {
        std.log.err("REVM snailtracer benchmark failed to set code: {}", .{err});
        @panic("REVM snailtracer benchmark failed");
    };
    
    // Set balance for caller
    vm.setBalance(CALLER_ADDRESS, 1000000) catch |err| {
        std.log.err("REVM snailtracer benchmark failed to set balance: {}", .{err});
        @panic("REVM snailtracer benchmark failed");
    };
    
    // Execute the call
    var result = vm.call(CALLER_ADDRESS, CONTRACT_ADDRESS, 0, calldata, BENCHMARK_GAS_LIMIT) catch |err| {
        std.log.err("REVM snailtracer benchmark failed to call: {}", .{err});
        @panic("REVM snailtracer benchmark failed");
    };
    defer result.deinit();
}

test "Snailtracer benchmark compilation" {
    const allocator = std.testing.allocator;
    
    // Test loading functions compile
    const bytecode = try loadBytecode(allocator);
    defer allocator.free(bytecode);
    
    const calldata = try loadCalldata(allocator);
    defer allocator.free(calldata);
    
    // Verify we got some data
    try std.testing.expect(bytecode.len > 0);
    try std.testing.expect(calldata.len > 0);
}