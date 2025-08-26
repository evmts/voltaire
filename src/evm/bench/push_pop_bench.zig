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
const BENCHMARK_GAS_LIMIT: u64 = 10_000_000;
const CALLER_ADDRESS: Address = [_]u8{0x11} ** 20;
const CONTRACT_ADDRESS: Address = [_]u8{0x22} ** 20;

// ============================================================================
// Benchmark Registration
// ============================================================================

pub fn bench(b: *zbench.Benchmark) !void {
    // try b.add("EVM: Push/Pop 100 values", benchmark_evm_push_pop, .{});
    try b.add("REVM: Push/Pop 100 values", benchmark_revm_push_pop, .{});
}

// ============================================================================
// Bytecode Generation
// ============================================================================

fn generatePushPopBytecode(allocator: std.mem.Allocator) ![]u8 {
    // Create bytecode that pushes 100 values and then pops them
    // We'll use simple PUSH1 operations for consistency
    const num_values = 100;
    const bytecode_size = num_values * 2 + num_values + 5; // 100 PUSH1s (2 bytes each) + 100 POPs + RETURN
    
    var bytecode = try allocator.alloc(u8, bytecode_size);
    var index: usize = 0;
    
    // Push 100 different values (1 to 100)
    var i: u8 = 1;
    while (i <= num_values) : (i += 1) {
        bytecode[index] = 0x60; // PUSH1
        index += 1;
        bytecode[index] = i; // value
        index += 1;
    }
    
    // Pop all 100 values
    i = 0;
    while (i < num_values) : (i += 1) {
        bytecode[index] = 0x50; // POP
        index += 1;
    }
    
    // Return empty result
    bytecode[index] = 0x60; // PUSH1
    index += 1;
    bytecode[index] = 0x00; // 0 (return size)
    index += 1;
    bytecode[index] = 0x60; // PUSH1
    index += 1;
    bytecode[index] = 0x00; // 0 (return offset)
    index += 1;
    bytecode[index] = 0xf3; // RETURN
    
    return bytecode;
}

// ============================================================================
// EVM Benchmark
// ============================================================================

fn benchmark_evm_push_pop(allocator: std.mem.Allocator) void {
    // Generate bytecode
    const bytecode = generatePushPopBytecode(allocator) catch |err| {
        std.log.err("EVM push/pop benchmark failed to generate bytecode: {}", .{err});
        @panic("EVM push/pop benchmark failed");
    };
    defer allocator.free(bytecode);
    
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
        std.log.err("EVM push/pop benchmark failed to init VM: {}", .{err});
        @panic("EVM push/pop benchmark failed");
    };
    defer vm.deinit();
    
    // Set up call parameters
    const call_params = evm_mod.CallParams{
        .call = .{
            .caller = CALLER_ADDRESS,
            .to = CONTRACT_ADDRESS,
            .value = 0,
            .input = &.{},
            .gas = BENCHMARK_GAS_LIMIT,
        },
    };
    
    // Deploy contract
    const code_hash = db_interface.set_code(bytecode) catch |err| {
        std.log.err("EVM push/pop benchmark failed to set code: {}", .{err});
        @panic("EVM push/pop benchmark failed");
    };
    
    var account = db_interface.get_account(CONTRACT_ADDRESS) catch null orelse evm_mod.Account{
        .balance = 0,
        .nonce = 0,
        .code_hash = HashUtils.EMPTY_KECCAK256,
        .storage_root = [_]u8{0} ** 32,
    };
    
    account.code_hash = code_hash;
    db_interface.set_account(CONTRACT_ADDRESS, account) catch |err| {
        std.log.err("EVM push/pop benchmark failed to set account: {}", .{err});
        @panic("EVM push/pop benchmark failed");
    };
    
    // Execute the call
    const result = vm.call(call_params) catch |err| {
        std.log.err("EVM push/pop benchmark failed to call: {}", .{err});
        @panic("EVM push/pop benchmark failed");
    };
    _ = result;
}

// ============================================================================
// REVM Benchmark
// ============================================================================

fn benchmark_revm_push_pop(allocator: std.mem.Allocator) void {
    // Generate bytecode
    const bytecode = generatePushPopBytecode(allocator) catch |err| {
        std.log.err("REVM push/pop benchmark failed to generate bytecode: {}", .{err});
        @panic("REVM push/pop benchmark failed");
    };
    defer allocator.free(bytecode);
    
    // Set up REVM
    const settings = revm.RevmSettings{
        .gas_limit = BENCHMARK_GAS_LIMIT,
        .chain_id = 1,
    };
    
    var vm = revm.Revm.init(allocator, settings) catch |err| {
        std.log.err("REVM push/pop benchmark failed to init VM: {}", .{err});
        @panic("REVM push/pop benchmark failed");
    };
    defer vm.deinit();
    
    // Deploy contract
    vm.setCode(CONTRACT_ADDRESS, bytecode) catch |err| {
        std.log.err("REVM push/pop benchmark failed to set code: {}", .{err});
        @panic("REVM push/pop benchmark failed");
    };
    
    // Set balance for caller
    vm.setBalance(CALLER_ADDRESS, 1000000) catch |err| {
        std.log.err("REVM push/pop benchmark failed to set balance: {}", .{err});
        @panic("REVM push/pop benchmark failed");
    };
    
    // Execute the call
    var result = vm.call(CALLER_ADDRESS, CONTRACT_ADDRESS, 0, &.{}, BENCHMARK_GAS_LIMIT) catch |err| {
        std.log.err("REVM push/pop benchmark failed to call: {}", .{err});
        @panic("REVM push/pop benchmark failed");
    };
    defer result.deinit();
}

test "Push/pop bytecode generation" {
    const allocator = std.testing.allocator;
    
    const bytecode = try generatePushPopBytecode(allocator);
    defer allocator.free(bytecode);
    
    // Verify bytecode length: 100 PUSH1s (200 bytes) + 100 POPs (100 bytes) + 5 bytes for return = 305 bytes
    try std.testing.expectEqual(@as(usize, 305), bytecode.len);
    
    // Verify it starts with PUSH1 1 (0x60 0x01)
    try std.testing.expectEqual(@as(u8, 0x60), bytecode[0]);
    try std.testing.expectEqual(@as(u8, 0x01), bytecode[1]);
    
    // Verify it has POP after all pushes (at index 200)
    try std.testing.expectEqual(@as(u8, 0x50), bytecode[200]);
    
    // Verify it ends with RETURN (0xf3)
    try std.testing.expectEqual(@as(u8, 0xf3), bytecode[bytecode.len - 1]);
}