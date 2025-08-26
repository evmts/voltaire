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
const BENCHMARK_GAS_LIMIT: u64 = 100_000_000; // Need high gas limit for large operations
const CALLER_ADDRESS: Address = [_]u8{0x11} ** 20;
const CONTRACT_ADDRESS: Address = [_]u8{0x22} ** 20;

// ============================================================================
// Benchmark Registration
// ============================================================================

pub fn bench(b: *zbench.Benchmark) !void {
    // TODO: Fix EVM execution issues with custom bytecode
    // try b.add("EVM: Stack Push/Pop (10 values)", benchmark_evm_large_stack, .{});
    try b.add("REVM: Stack Push/Pop (10 values)", benchmark_revm_large_stack, .{});
}

// ============================================================================
// Bytecode Generation
// ============================================================================

fn generateLargeStackBytecode(allocator: std.mem.Allocator) ![]u8 {
    // Calculate bytecode size:
    // - 10 pushes: all PUSH2 (3 bytes each) = 30 bytes
    // - 10 pops: 10 bytes
    // - Return sequence: 5 bytes
    // Total: ~45 bytes (allocate 100 to be safe)
    var bytecode = try allocator.alloc(u8, 500);
    var index: usize = 0;
    
    // Push numbers from 1000 to 10000 (in increments of 1000) - only 10 values
    // EVM stack limit is 1024, so we'll use fewer values
    var value: u32 = 1000;
    while (value <= 10000) : (value += 1000) {
        // For values that fit in 2 bytes, use PUSH2
        if (value <= 0xFFFF) {
            bytecode[index] = 0x61; // PUSH2
            index += 1;
            bytecode[index] = @intCast((value >> 8) & 0xFF);
            index += 1;
            bytecode[index] = @intCast(value & 0xFF);
            index += 1;
        } else {
            // For larger values, use PUSH3
            bytecode[index] = 0x62; // PUSH3
            index += 1;
            bytecode[index] = @intCast((value >> 16) & 0xFF);
            index += 1;
            bytecode[index] = @intCast((value >> 8) & 0xFF);
            index += 1;
            bytecode[index] = @intCast(value & 0xFF);
            index += 1;
        }
    }
    
    // Now pop all 10 values
    var i: u32 = 0;
    while (i < 10) : (i += 1) {
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
    index += 1;
    
    // Return only the used portion
    const result = try allocator.alloc(u8, index);
    @memcpy(result, bytecode[0..index]);
    allocator.free(bytecode);
    
    return result;
}

// ============================================================================
// EVM Benchmark
// ============================================================================

fn benchmark_evm_large_stack(allocator: std.mem.Allocator) void {
    // Generate bytecode
    const bytecode = generateLargeStackBytecode(allocator) catch |err| {
        std.log.err("EVM large stack benchmark failed to generate bytecode: {}", .{err});
        @panic("EVM large stack benchmark failed");
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
        std.log.err("EVM large stack benchmark failed to init VM: {}", .{err});
        @panic("EVM large stack benchmark failed");
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
        std.log.err("EVM large stack benchmark failed to set code: {}", .{err});
        @panic("EVM large stack benchmark failed");
    };
    
    var account = db_interface.get_account(CONTRACT_ADDRESS) catch null orelse evm_mod.Account{
        .balance = 0,
        .nonce = 0,
        .code_hash = HashUtils.EMPTY_KECCAK256,
        .storage_root = [_]u8{0} ** 32,
    };
    
    account.code_hash = code_hash;
    db_interface.set_account(CONTRACT_ADDRESS, account) catch |err| {
        std.log.err("EVM large stack benchmark failed to set account: {}", .{err});
        @panic("EVM large stack benchmark failed");
    };
    
    // Execute the call
    const result = vm.call(call_params) catch |err| {
        std.log.err("EVM large stack benchmark failed to call: {}", .{err});
        @panic("EVM large stack benchmark failed");
    };
    _ = result;
}

// ============================================================================
// REVM Benchmark
// ============================================================================

fn benchmark_revm_large_stack(allocator: std.mem.Allocator) void {
    // Generate bytecode
    const bytecode = generateLargeStackBytecode(allocator) catch |err| {
        std.log.err("REVM large stack benchmark failed to generate bytecode: {}", .{err});
        @panic("REVM large stack benchmark failed");
    };
    defer allocator.free(bytecode);
    
    // Set up REVM
    const settings = revm.RevmSettings{
        .gas_limit = BENCHMARK_GAS_LIMIT,
        .chain_id = 1,
    };
    
    var vm = revm.Revm.init(allocator, settings) catch |err| {
        std.log.err("REVM large stack benchmark failed to init VM: {}", .{err});
        @panic("REVM large stack benchmark failed");
    };
    defer vm.deinit();
    
    // Deploy contract
    vm.setCode(CONTRACT_ADDRESS, bytecode) catch |err| {
        std.log.err("REVM large stack benchmark failed to set code: {}", .{err});
        @panic("REVM large stack benchmark failed");
    };
    
    // Set balance for caller
    vm.setBalance(CALLER_ADDRESS, 1000000) catch |err| {
        std.log.err("REVM large stack benchmark failed to set balance: {}", .{err});
        @panic("REVM large stack benchmark failed");
    };
    
    // Execute the call
    var result = vm.call(CALLER_ADDRESS, CONTRACT_ADDRESS, 0, &.{}, BENCHMARK_GAS_LIMIT) catch |err| {
        std.log.err("REVM large stack benchmark failed to call: {}", .{err});
        @panic("REVM large stack benchmark failed");
    };
    defer result.deinit();
}

test "Large stack bytecode generation" {
    const allocator = std.testing.allocator;
    
    const bytecode = try generateLargeStackBytecode(allocator);
    defer allocator.free(bytecode);
    
    // Verify bytecode length
    // 10 pushes (3 bytes each) + 10 pops (1 byte each) + 5 bytes for return = 45 bytes
    try std.testing.expect(bytecode.len >= 45);
    try std.testing.expect(bytecode.len <= 50);
    
    // Verify it starts with PUSH2 1000 (0x61 0x03 0xE8)
    try std.testing.expectEqual(@as(u8, 0x61), bytecode[0]);
    try std.testing.expectEqual(@as(u8, 0x03), bytecode[1]);
    try std.testing.expectEqual(@as(u8, 0xE8), bytecode[2]);
    
    // Verify it ends with RETURN (0xf3)
    try std.testing.expectEqual(@as(u8, 0xf3), bytecode[bytecode.len - 1]);
}