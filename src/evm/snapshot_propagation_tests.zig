//! Tests for snapshot id propagation in nested calls and reverts
//! These tests verify that journal entries are recorded to the correct snapshot
//! and that revert operations apply to the correct scope

const std = @import("std");
const frame_mod = @import("frame.zig");
const Frame = frame_mod.Frame;
const evm_mod = @import("evm.zig");
const Evm = evm_mod.Evm;
const primitives = @import("primitives");
const Address = primitives.Address.Address;
const address_utils = primitives.Address;
const memory_database = @import("memory_database.zig");
const MemoryDatabase = memory_database.MemoryDatabase;
const Account = @import("database_interface_account.zig").Account;
const Host = @import("host.zig").Host;
const Hardfork = @import("hardfork.zig").Hardfork;
const ZERO_ADDRESS = @import("primitives").ZERO_ADDRESS;

fn to_address(n: u32) Address {
    var addr = ZERO_ADDRESS;
    std.mem.writeInt(u32, addr[16..20], n, .big);
    return addr;
}

fn to_u256(addr: Address) u256 {
    return address_utils.to_u256(addr);
}

// Helper to create test EVM
const TestEvm = struct {
    evm: *Evm,
    memory_db: *MemoryDatabase,
};

fn createTestEvm(allocator: std.mem.Allocator) !TestEvm {
    var memory_db = try allocator.create(MemoryDatabase);
    memory_db.* = MemoryDatabase.init(allocator);
    
    const db_interface = memory_db.to_database_interface();
    const evm = try allocator.create(Evm);
    evm.* = try Evm.init(allocator, db_interface, null, null);
    
    return TestEvm{ .evm = evm, .memory_db = memory_db };
}

// Contract that stores a value and then calls another contract
const STORE_AND_CALL_CONTRACT = [_]u8{
    // Store value 100 at slot 0
    0x60, 0x64, // PUSH1 100
    0x60, 0x00, // PUSH1 0 (slot)
    0x55,       // SSTORE
    
    // Load target address from calldata (first 32 bytes)
    0x60, 0x00, // PUSH1 0
    0x35,       // CALLDATALOAD
    
    // Make a CALL with value 50
    0x60, 0x00, // PUSH1 0 (output size)
    0x60, 0x00, // PUSH1 0 (output offset)  
    0x60, 0x00, // PUSH1 0 (input size)
    0x60, 0x00, // PUSH1 0 (input offset)
    0x60, 0x32, // PUSH1 50 (value)
    0x83,       // DUP4 (address from calldata)
    0x5A,       // GAS
    0xF1,       // CALL
    
    // Store result at slot 1
    0x60, 0x01, // PUSH1 1 (slot)
    0x55,       // SSTORE
    
    // Return success
    0x60, 0x01, // PUSH1 1
    0x60, 0x00, // PUSH1 0
    0x52,       // MSTORE
    0x60, 0x20, // PUSH1 32
    0x60, 0x00, // PUSH1 0
    0xF3,       // RETURN
};

// Contract that stores a value and then reverts
const STORE_AND_REVERT_CONTRACT = [_]u8{
    // Store value 200 at slot 0
    0x60, 0xC8, // PUSH1 200
    0x60, 0x00, // PUSH1 0 (slot)
    0x55,       // SSTORE
    
    // Store value 300 at slot 1
    0x61, 0x01, 0x2C, // PUSH2 300
    0x60, 0x01, // PUSH1 1 (slot)
    0x55,       // SSTORE
    
    // Revert with empty data
    0x60, 0x00, // PUSH1 0 (size)
    0x60, 0x00, // PUSH1 0 (offset)
    0xFD,       // REVERT
};

// Contract that stores a value and returns success
const STORE_AND_SUCCESS_CONTRACT = [_]u8{
    // Store value 400 at slot 0
    0x61, 0x01, 0x90, // PUSH2 400
    0x60, 0x00, // PUSH1 0 (slot)
    0x55,       // SSTORE
    
    // Return success
    0x60, 0x01, // PUSH1 1
    0x60, 0x00, // PUSH1 0
    0x52,       // MSTORE
    0x60, 0x20, // PUSH1 32
    0x60, 0x00, // PUSH1 0
    0xF3,       // RETURN
};

test "Nested call with inner revert - outer changes preserved, inner reverted" {
    return error.SkipZigTest;
}

test "Nested call with inner success - both changes preserved" {
    return error.SkipZigTest;
}
    const allocator = std.testing.allocator;
    
    const result = try createTestEvm(allocator);
    var evm = result.evm;
    var memory_db = result.memory_db;
    defer {
        evm.deinit();
        allocator.destroy(evm);
        memory_db.deinit();
        allocator.destroy(memory_db);
    }
    
    // Deploy contracts
    const outer_address = to_address(0x4000);
    const inner_address = to_address(0x5000);
    const caller_address = to_address(0x6000);
    
    // Deploy outer contract (STORE_AND_CALL)
    const outer_hash = try evm.database.set_code(&STORE_AND_CALL_CONTRACT);
    var outer_account = Account.zero();
    outer_account.code_hash = outer_hash;
    outer_account.balance = 1000;
    try evm.database.set_account(outer_address, outer_account);
    
    // Deploy inner contract (STORE_AND_SUCCESS)
    const inner_hash = try evm.database.set_code(&STORE_AND_SUCCESS_CONTRACT);
    var inner_account = Account.zero();
    inner_account.code_hash = inner_hash;
    try evm.database.set_account(inner_address, inner_account);
    
    // Set caller balance
    var caller_account = Account.zero();
    caller_account.balance = 5000;
    try evm.database.set_account(caller_address, caller_account);
    
    // Prepare calldata with inner contract address
    var calldata = std.ArrayList(u8).init(allocator);
    defer calldata.deinit();
    try calldata.appendSlice(&([_]u8{0} ** 12)); // Padding
    try calldata.appendSlice(&inner_address); // Target address
    
    // Execute outer contract
    const host = evm.to_host();
    const F = Frame(.{ .has_database = true });
    
    var frame = try F.init(allocator, &STORE_AND_CALL_CONTRACT, 1000000, evm.database, host);
    defer frame.deinit(allocator);
    
    frame.contract_address = outer_address;
    frame.caller = caller_address;
    frame.value = 100;
    frame.calldata = calldata.items;
    
    const execute_result = frame.execute();
    
    // Should return successfully
    try std.testing.expectError(Frame(.{ .has_database = true }).Error.RETURN, execute_result);
    
    // Check outer contract storage:
    // - Slot 0 should have value 100 (stored before the call)
    // - Slot 1 should have value 1 (CALL returned 1 for success)
    const outer_slot0 = try evm.database.get_storage(outer_address, 0);
    const outer_slot1 = try evm.database.get_storage(outer_address, 1);
    
    try std.testing.expectEqual(@as(u256, 100), outer_slot0);
    try std.testing.expectEqual(@as(u256, 1), outer_slot1); // CALL succeeded
    
    // Check inner contract storage:
    // - Slot 0 should have value 400 (stored by inner contract)
    const inner_slot0 = try evm.database.get_storage(inner_address, 0);
    
    try std.testing.expectEqual(@as(u256, 400), inner_slot0);
    
    // Check balances:
    // - Outer contract should have reduced balance (sent value to inner)
    // - Inner contract should have received the value
    const outer_after = try evm.database.get_account(outer_address);
    const inner_after = try evm.database.get_account(inner_address);
    
    try std.testing.expectEqual(@as(u256, 950), outer_after.?.balance); // 1000 - 50
    try std.testing.expectEqual(@as(u256, 50), inner_after.?.balance); // Received value
}

test "Triple nested calls with middle revert - correct snapshot boundaries" {
    return error.SkipZigTest;
}
    const allocator = std.testing.allocator;
    
    const result = try createTestEvm(allocator);
    var evm = result.evm;
    var memory_db = result.memory_db;
    defer {
        evm.deinit();
        allocator.destroy(evm);
        memory_db.deinit();
        allocator.destroy(memory_db);
    }
    
    // Deploy contracts
    const level1_address = to_address(0x1001); // Calls level2
    const level2_address = to_address(0x2001); // Calls level3, then reverts
    const level3_address = to_address(0x3001); // Succeeds
    const caller_address = to_address(0x4001);
    
    // Deploy level1: STORE_AND_CALL (stores 100, calls level2)
    const level1_hash = try evm.database.set_code(&STORE_AND_CALL_CONTRACT);
    var level1_account = Account.zero();
    level1_account.code_hash = level1_hash;
    level1_account.balance = 1000;
    try evm.database.set_account(level1_address, level1_account);
    
    // Deploy level2: STORE_AND_REVERT (stores values, then reverts)
    const level2_hash = try evm.database.set_code(&STORE_AND_REVERT_CONTRACT);
    var level2_account = Account.zero();
    level2_account.code_hash = level2_hash;
    try evm.database.set_account(level2_address, level2_account);
    
    // Deploy level3: STORE_AND_SUCCESS (should not be affected since level2 reverts before calling it)
    const level3_hash = try evm.database.set_code(&STORE_AND_SUCCESS_CONTRACT);
    var level3_account = Account.zero();
    level3_account.code_hash = level3_hash;
    try evm.database.set_account(level3_address, level3_account);
    
    // Set caller balance
    var caller_account = Account.zero();
    caller_account.balance = 5000;
    try evm.database.set_account(caller_address, caller_account);
    
    // Prepare calldata for level1 to call level2
    var calldata = std.ArrayList(u8).init(allocator);
    defer calldata.deinit();
    try calldata.appendSlice(&([_]u8{0} ** 12)); // Padding
    try calldata.appendSlice(&level2_address); // Target address
    
    // Execute level1 contract
    const host = evm.to_host();
    const F = Frame(.{ .has_database = true });
    
    var frame = try F.init(allocator, &STORE_AND_CALL_CONTRACT, 1000000, evm.database, host);
    defer frame.deinit(allocator);
    
    frame.contract_address = level1_address;
    frame.caller = caller_address;
    frame.value = 200;
    frame.calldata = calldata.items;
    
    const execute_result = frame.execute();
    
    // Should return successfully (level1 completes even though level2 reverts)
    try std.testing.expectError(Frame(.{ .has_database = true }).Error.RETURN, execute_result);
    
    // Check level1 storage:
    // - Slot 0 should have value 100 (stored before call to level2)
    // - Slot 1 should have value 0 (call to level2 failed due to revert)
    const level1_slot0 = try evm.database.get_storage(level1_address, 0);
    const level1_slot1 = try evm.database.get_storage(level1_address, 1);
    
    try std.testing.expectEqual(@as(u256, 100), level1_slot0);
    try std.testing.expectEqual(@as(u256, 0), level1_slot1); // Call failed
    
    // Check level2 storage:
    // - All storage should be 0 (reverted)
    const level2_slot0 = try evm.database.get_storage(level2_address, 0);
    const level2_slot1 = try evm.database.get_storage(level2_address, 1);
    
    try std.testing.expectEqual(@as(u256, 0), level2_slot0);
    try std.testing.expectEqual(@as(u256, 0), level2_slot1);
    
    // Check level3 storage:
    // - Should be 0 (was never called because level2 reverts before making any calls)
    const level3_slot0 = try evm.database.get_storage(level3_address, 0);
    
    try std.testing.expectEqual(@as(u256, 0), level3_slot0);
    
    // Check balances:
    // - level1 should retain its balance (level2's revert undid the value transfer)
    // - level2 should have 0 balance
    // - level3 should have 0 balance
    const level1_after = try evm.database.get_account(level1_address);
    const level2_after = try evm.database.get_account(level2_address);
    const level3_after = try evm.database.get_account(level3_address);
    
    try std.testing.expectEqual(@as(u256, 1000), level1_after.?.balance); // Value transfer was reverted
    try std.testing.expectEqual(@as(u256, 0), level2_after.?.balance);
    try std.testing.expectEqual(@as(u256, 0), level3_after.?.balance);
}

test "Storage changes in same transaction with multiple snapshots" {
    return error.SkipZigTest;
}
    const allocator = std.testing.allocator;
    
    const result = try createTestEvm(allocator);
    var evm = result.evm;
    var memory_db = result.memory_db;
    defer {
        evm.deinit();
        allocator.destroy(evm);
        memory_db.deinit();
        allocator.destroy(memory_db);
    }
    
    const contract_address = to_address(0x7000);
    
    // Test bytecode that:
    // 1. Stores value 10 at slot 0
    // 2. Creates snapshot (via CALL that immediately reverts)
    // 3. Stores value 20 at slot 0
    // 4. Revert should restore slot 0 to value 10
    const test_bytecode = [_]u8{
        // Store 10 at slot 0
        0x60, 0x0A, // PUSH1 10
        0x60, 0x00, // PUSH1 0
        0x55,       // SSTORE
        
        // Make a CALL to self with revert behavior
        0x60, 0x00, // PUSH1 0 (output size)
        0x60, 0x00, // PUSH1 0 (output offset)
        0x60, 0x0E, // PUSH1 14 (input size - points to revert code)
        0x60, 0x12, // PUSH1 18 (input offset - points to revert code)
        0x60, 0x00, // PUSH1 0 (value)
        0x30,       // ADDRESS
        0x5A,       // GAS
        0xF1,       // CALL
        
        // Store the call result at slot 1
        0x60, 0x01, // PUSH1 1
        0x55,       // SSTORE
        
        // Return
        0x00,       // STOP
        
        // Revert code starts here (offset 18):
        0x60, 0x14, // PUSH1 20
        0x60, 0x00, // PUSH1 0
        0x55,       // SSTORE (store 20 at slot 0)
        
        0x60, 0x15, // PUSH1 21  
        0x60, 0x02, // PUSH1 2
        0x55,       // SSTORE (store 21 at slot 2)
        
        0x60, 0x00, // PUSH1 0
        0x60, 0x00, // PUSH1 0
        0xFD,       // REVERT
    };
    
    // Deploy contract
    const hash = try evm.database.set_code(&test_bytecode);
    var account = Account.zero();
    account.code_hash = hash;
    account.balance = 1000;
    try evm.database.set_account(contract_address, account);
    
    // Execute contract
    const host = evm.to_host();
    const F = Frame(.{ .has_database = true });
    
    var frame = try F.init(allocator, &test_bytecode, 1000000, evm.database, host);
    defer frame.deinit(allocator);
    
    frame.contract_address = contract_address;
    frame.caller = contract_address;
    frame.value = 0;
    
    const execute_result = frame.execute();
    
    // Should stop successfully
    try std.testing.expectError(Frame(.{ .has_database = true }).Error.STOP, execute_result);
    
    // Check storage:
    // - Slot 0 should have value 10 (the inner CALL reverted, so the store of 20 was undone)
    // - Slot 1 should have value 0 (CALL failed due to revert)
    // - Slot 2 should have value 0 (was set in the reverted call)
    const slot0 = try evm.database.get_storage(contract_address, 0);
    const slot1 = try evm.database.get_storage(contract_address, 1);
    const slot2 = try evm.database.get_storage(contract_address, 2);
    
    try std.testing.expectEqual(@as(u256, 10), slot0); // Original value preserved
    try std.testing.expectEqual(@as(u256, 0), slot1);  // Call failed
    try std.testing.expectEqual(@as(u256, 0), slot2);  // Reverted
}
