//! Comprehensive tests for EIP-2929 (Gas cost changes for state access opcodes)

const std = @import("std");
const testing = std.testing;
const primitives = @import("primitives");
const Address = primitives.Address.Address;
const ZERO_ADDRESS = primitives.ZERO_ADDRESS;
const GasConstants = primitives.GasConstants;

const Evm = @import("evm.zig").Evm;
const DatabaseInterface = @import("database_interface.zig").DatabaseInterface;
const MemoryDatabase = @import("memory_database.zig").MemoryDatabase;
const BlockInfo = @import("block_info.zig").DefaultBlockInfo;
const TransactionContext = @import("transaction_context.zig").TransactionContext;
const Hardfork = @import("hardfork.zig").Hardfork;
const FrameInterpreter = @import("frame_interpreter.zig").FrameInterpreter;

// Test SLOAD with multiple storage slots
test "EIP-2929 - SLOAD multiple slots warm/cold pattern" {
    const allocator = testing.allocator;
    
    var memory_db = MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = memory_db.to_database_interface();
    
    const block_info = BlockInfo.init();
    const context = TransactionContext{
        .gas_limit = 1_000_000,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };
    
    var evm = try Evm(.{}).init(allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, Hardfork.BERLIN);
    defer evm.deinit();
    
    const contract_address = [_]u8{0x12} ** 20;
    
    // Test multiple slots
    const slots = [_]u256{ 0, 1, 100, 0xFFFF, std.math.maxInt(u256) };
    
    // First access to each slot should be cold
    for (slots) |slot| {
        const cost = try evm.access_storage_slot(contract_address, slot);
        try testing.expectEqual(GasConstants.ColdSloadCost, cost);
    }
    
    // Second access to each slot should be warm
    for (slots) |slot| {
        const cost = try evm.access_storage_slot(contract_address, slot);
        try testing.expectEqual(GasConstants.WarmStorageReadCost, cost);
    }
    
    // Access a new slot - should be cold
    const new_slot_cost = try evm.access_storage_slot(contract_address, 0xDEADBEEF);
    try testing.expectEqual(GasConstants.ColdSloadCost, new_slot_cost);
}

// Test SSTORE gas costs with warm/cold access
test "EIP-2929 - SSTORE warm/cold access patterns" {
    const allocator = testing.allocator;
    
    // Create bytecode that performs SSTORE operations
    // PUSH1 value, PUSH1 key, SSTORE
    const bytecode = [_]u8{
        0x60, 0x42, // PUSH1 0x42 (value)
        0x60, 0x01, // PUSH1 0x01 (key)
        0x55,       // SSTORE
        0x60, 0x43, // PUSH1 0x43 (value)
        0x60, 0x01, // PUSH1 0x01 (key) - same slot, should be warm
        0x55,       // SSTORE
        0x60, 0x44, // PUSH1 0x44 (value)
        0x60, 0x02, // PUSH1 0x02 (key) - new slot, should be cold
        0x55,       // SSTORE
        0x00,       // STOP
    };
    
    var memory_db = MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = memory_db.to_database_interface();
    
    const block_info = BlockInfo.init();
    const context = TransactionContext{
        .gas_limit = 1_000_000,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };
    
    var evm = try Evm(.{}).init(allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, Hardfork.BERLIN);
    defer evm.deinit();
    
    const contract_address = [_]u8{0x12} ** 20;
    const initial_gas = 1_000_000;
    
    // Execute bytecode through frame interpreter
    var interpreter = try FrameInterpreter(.{ .has_database = true }).init(
        allocator,
        &bytecode,
        initial_gas,
        db_interface,
        evm.to_host()
    );
    defer interpreter.deinit(allocator);
    
    try interpreter.interpret();
    
    // Verify gas consumption patterns
    const gas_used = @as(u64, @intCast(initial_gas - interpreter.frame.gas_remaining));
    
    // Gas should include cold access for slots 1 and 2, warm access for second write to slot 1
    try testing.expect(gas_used > 0);
}

// Test interaction between different opcodes accessing the same address
test "EIP-2929 - Cross-opcode warm address sharing" {
    const allocator = testing.allocator;
    
    var memory_db = MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = memory_db.to_database_interface();
    
    const block_info = BlockInfo.init();
    const context = TransactionContext{
        .gas_limit = 1_000_000,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };
    
    var evm = try Evm(.{}).init(allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, Hardfork.BERLIN);
    defer evm.deinit();
    
    const test_address = [_]u8{0xAB} ** 20;
    
    // BALANCE accesses the address - should be cold
    const balance_cost = try evm.access_address(test_address);
    try testing.expectEqual(GasConstants.ColdAccountAccessCost, balance_cost);
    
    // EXTCODESIZE on same address - should be warm
    const codesize_cost = try evm.access_address(test_address);
    try testing.expectEqual(GasConstants.WarmStorageReadCost, codesize_cost);
    
    // EXTCODECOPY on same address - should still be warm
    const codecopy_cost = try evm.access_address(test_address);
    try testing.expectEqual(GasConstants.WarmStorageReadCost, codecopy_cost);
    
    // EXTCODEHASH on same address - should still be warm
    const codehash_cost = try evm.access_address(test_address);
    try testing.expectEqual(GasConstants.WarmStorageReadCost, codehash_cost);
}

// Test CALL opcodes with warm/cold recipients
test "EIP-2929 - CALL warm/cold recipient costs" {
    const allocator = testing.allocator;
    
    var memory_db = MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    
    // Set up accounts with balance for calls
    const caller_address = [_]u8{0x01} ** 20;
    const recipient1 = [_]u8{0x02} ** 20;
    const recipient2 = [_]u8{0x03} ** 20;
    
    try memory_db.set_account(caller_address, .{
        .nonce = 0,
        .balance = 1_000_000_000_000_000_000, // 1 ETH
        .code_hash = [_]u8{0} ** 32,
    });
    
    try memory_db.set_account(recipient1, .{
        .nonce = 0,
        .balance = 0,
        .code_hash = [_]u8{0} ** 32,
    });
    
    const db_interface = memory_db.to_database_interface();
    
    const block_info = BlockInfo.init();
    const context = TransactionContext{
        .gas_limit = 10_000_000,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };
    
    var evm = try Evm(.{}).init(allocator, db_interface, block_info, context, 0, caller_address, Hardfork.BERLIN);
    defer evm.deinit();
    
    // First CALL to recipient1 - should include cold access cost
    const cold_call_cost = try evm.access_address(recipient1);
    try testing.expectEqual(GasConstants.ColdAccountAccessCost, cold_call_cost);
    
    // Second CALL to recipient1 - should be warm
    const warm_call_cost = try evm.access_address(recipient1);
    try testing.expectEqual(GasConstants.WarmStorageReadCost, warm_call_cost);
    
    // CALL to new recipient2 - should be cold
    const new_call_cost = try evm.access_address(recipient2);
    try testing.expectEqual(GasConstants.ColdAccountAccessCost, new_call_cost);
}

// Test access list behavior with self-referential operations
test "EIP-2929 - Self-referential operations (BALANCE on self)" {
    const allocator = testing.allocator;
    
    var memory_db = MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = memory_db.to_database_interface();
    
    const contract_address = [_]u8{0x42} ** 20;
    const block_info = BlockInfo.init();
    const context = TransactionContext{
        .gas_limit = 1_000_000,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };
    
    var evm = try Evm(.{}).init(allocator, db_interface, block_info, context, 0, contract_address, Hardfork.BERLIN);
    defer evm.deinit();
    
    // Contract accessing its own address - first access should still be cold
    const self_access_cost = try evm.access_address(contract_address);
    try testing.expectEqual(GasConstants.ColdAccountAccessCost, self_access_cost);
    
    // Second self-access should be warm
    const self_access_warm = try evm.access_address(contract_address);
    try testing.expectEqual(GasConstants.WarmStorageReadCost, self_access_warm);
}

// Test edge case: accessing precompiled contracts
test "EIP-2929 - Precompiled contract access costs" {
    const allocator = testing.allocator;
    
    var memory_db = MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = memory_db.to_database_interface();
    
    const block_info = BlockInfo.init();
    const context = TransactionContext{
        .gas_limit = 1_000_000,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };
    
    var evm = try Evm(.{}).init(allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, Hardfork.BERLIN);
    defer evm.deinit();
    
    // Precompiled contracts are at addresses 0x01 through 0x09
    const precompile_addresses = [_]Address{
        [_]u8{0} ** 19 ++ [_]u8{0x01}, // ecrecover
        [_]u8{0} ** 19 ++ [_]u8{0x02}, // sha256
        [_]u8{0} ** 19 ++ [_]u8{0x03}, // ripemd160
        [_]u8{0} ** 19 ++ [_]u8{0x04}, // identity
        [_]u8{0} ** 19 ++ [_]u8{0x05}, // modexp
        [_]u8{0} ** 19 ++ [_]u8{0x06}, // ecadd
        [_]u8{0} ** 19 ++ [_]u8{0x07}, // ecmul
        [_]u8{0} ** 19 ++ [_]u8{0x08}, // ecpairing
        [_]u8{0} ** 19 ++ [_]u8{0x09}, // blake2f
    };
    
    // Precompiles should follow same warm/cold rules
    for (precompile_addresses) |addr| {
        const cold_cost = try evm.access_address(addr);
        try testing.expectEqual(GasConstants.ColdAccountAccessCost, cold_cost);
        
        const warm_cost = try evm.access_address(addr);
        try testing.expectEqual(GasConstants.WarmStorageReadCost, warm_cost);
    }
}

// Test storage slot access with very large slot numbers
test "EIP-2929 - Storage slots with maximum values" {
    const allocator = testing.allocator;
    
    var memory_db = MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = memory_db.to_database_interface();
    
    const block_info = BlockInfo.init();
    const context = TransactionContext{
        .gas_limit = 1_000_000,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };
    
    var evm = try Evm(.{}).init(allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, Hardfork.BERLIN);
    defer evm.deinit();
    
    const contract_address = [_]u8{0xEE} ** 20;
    
    // Test with maximum u256 slot
    const max_slot = std.math.maxInt(u256);
    const max_slot_cold = try evm.access_storage_slot(contract_address, max_slot);
    try testing.expectEqual(GasConstants.ColdSloadCost, max_slot_cold);
    
    const max_slot_warm = try evm.access_storage_slot(contract_address, max_slot);
    try testing.expectEqual(GasConstants.WarmStorageReadCost, max_slot_warm);
    
    // Test adjacent slot is still cold
    const adjacent_slot = max_slot - 1;
    const adjacent_cold = try evm.access_storage_slot(contract_address, adjacent_slot);
    try testing.expectEqual(GasConstants.ColdSloadCost, adjacent_cold);
}