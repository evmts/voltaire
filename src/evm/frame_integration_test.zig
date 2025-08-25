//! Integration tests for Frame operations using real EVM components
//! instead of MockHost.

const std = @import("std");
const Evm = @import("evm.zig").DefaultEvm;
const MemoryDatabase = @import("memory_database.zig").MemoryDatabase;
const Address = @import("primitives").Address.Address;
const primitives = @import("primitives");
const CallParams = @import("call_params.zig").CallParams;
const BlockInfo = @import("block_info.zig").DefaultBlockInfo;
const TransactionContext = @import("transaction_context.zig").TransactionContext;
const Hardfork = @import("hardfork.zig").Hardfork;

// Helper to convert number to Address
fn to_address(value: u256) Address {
    var addr: Address = [_]u8{0} ** 20;
    var i: usize = 0;
    while (i < 20) : (i += 1) {
        addr[19 - i] = @truncate(value >> @intCast(i * 8));
    }
    return addr;
}

/// Helper to create a configured EVM instance for testing
fn createTestEvm(allocator: std.mem.Allocator) !struct { evm: *Evm, memory_db: *MemoryDatabase } {
    const memory_db = try allocator.create(MemoryDatabase);
    memory_db.* = MemoryDatabase.init(allocator);
    const db_interface = memory_db.to_database_interface();
    
    const block_info = BlockInfo.init();
    const tx_context = TransactionContext{
        .gas_limit = 30_000_000,
        .coinbase = primitives.ZERO_ADDRESS,
        .chain_id = 1,
    };
    const gas_price = 0;
    const origin = primitives.ZERO_ADDRESS;
    const hardfork = Hardfork.CANCUN;
    
    const evm = try allocator.create(Evm);
    evm.* = try Evm.init(allocator, db_interface, block_info, tx_context, gas_price, origin, hardfork);
    return .{ .evm = evm, .memory_db = memory_db };
}

test "EVM CALL operation - integration" {
    const allocator = std.testing.allocator;
    
    // Create real EVM instance
    const result = try createTestEvm(allocator);
    var evm = result.evm;
    var memory_db = result.memory_db;
    defer {
        evm.deinit();
        allocator.destroy(evm);
        memory_db.deinit();
        allocator.destroy(memory_db);
    }
    
    // Deploy a simple contract that returns success
    const target_bytecode = [_]u8{
        0x60, 0x01, // PUSH1 1
        0x60, 0x00, // PUSH1 0
        0x52,       // MSTORE (store 1 at memory offset 0)
        0x60, 0x20, // PUSH1 32
        0x60, 0x00, // PUSH1 0
        0xF3,       // RETURN (return 32 bytes from offset 0)
    };
    
    const target_address = to_address(0x2000);
    const code_hash = try evm.database.set_code(&target_bytecode);
    var account = @import("database_interface_account.zig").Account.zero();
    account.code_hash = code_hash;
    account.balance = 1000; // Give it some balance
    try evm.database.set_account(target_address, account);
    
    // Top-level CALL via EVM
    const caller_address = to_address(0x1000);
    const params = @import("call_params.zig").CallParams{ .call = .{
        .caller = caller_address,
        .to = target_address,
        .value = 0,
        .input = &.{},
        .gas = 100000,
    } };
    const result = try evm.call(params);
    try std.testing.expect(result.success);
    try std.testing.expectEqual(@as(usize, 32), result.output.len);
    try std.testing.expectEqual(@as(u8, 1), result.output[31]);
}

test "EVM CALL with value transfer - integration" {
    const allocator = std.testing.allocator;
    
    // Create real EVM instance
    const result = try createTestEvm(allocator);
    var evm = result.evm;
    var memory_db = result.memory_db;
    defer {
        evm.deinit();
        allocator.destroy(evm);
        memory_db.deinit();
        allocator.destroy(memory_db);
    }
    
    // Set up accounts with balances
    const caller_address = to_address(0x1000);
    const target_address = to_address(0x2000);
    
    var caller_account = @import("database_interface_account.zig").Account.zero();
    caller_account.balance = 10000; // Caller has 10000 wei
    try evm.database.set_account(caller_address, caller_account);
    
    var target_account = @import("database_interface_account.zig").Account.zero();
    target_account.balance = 500; // Target starts with 500 wei
    try evm.database.set_account(target_address, target_account);
    
    // Direct CALL via EVM with value
    const params = @import("call_params.zig").CallParams{ .call = .{
        .caller = caller_address,
        .to = target_address,
        .value = 1000,
        .input = &.{},
        .gas = 100000,
    } };
    const result_call = try evm.call(params);
    try std.testing.expect(result_call.success);
    
    // Verify balances were updated
    const caller_after = try evm.database.get_account(caller_address);
    const target_after = try evm.database.get_account(target_address);
    
    try std.testing.expectEqual(@as(u256, 9000), caller_after.?.balance);  // 10000 - 1000
    try std.testing.expectEqual(@as(u256, 1500), target_after.?.balance);  // 500 + 1000
}

test "Frame DELEGATECALL preserves context - real integration test" {
    const allocator = std.testing.allocator;
    
    // Create real EVM instance
    const result = try createTestEvm(allocator);
    var evm = result.evm;
    var memory_db = result.memory_db;
    defer {
        evm.deinit();
        allocator.destroy(evm);
        memory_db.deinit();
        allocator.destroy(memory_db);
    }
    
    // Deploy a contract that reads CALLER and VALUE and returns their sum
    const target_bytecode = [_]u8{
        0x33,       // CALLER
        0x34,       // CALLVALUE
        0x01,       // ADD (combine them)
        0x60, 0x00, // PUSH1 0
        0x52,       // MSTORE
        0x60, 0x20, // PUSH1 32
        0x60, 0x00, // PUSH1 0
        0xF3,       // RETURN
    };
    
    const original_caller = to_address(0x1111);
    const caller_address = to_address(0x2222);
    const target_address = to_address(0x3333);
    
    const code_hash = try evm.database.set_code(&target_bytecode);
    var account = @import("database_interface_account.zig").Account.zero();
    account.code_hash = code_hash;
    try evm.database.set_account(target_address, account);
    
    // Execute top-level DELEGATECALL (preserves caller, value is 0 at top-level)
    const params = @import("call_params.zig").CallParams{ .delegatecall = .{
        .caller = original_caller,
        .to = target_address,
        .input = &.{},
        .gas = 100000,
    } };
    const result = try evm.call(params);
    try std.testing.expect(result.success);
    try std.testing.expectEqual(@as(usize, 32), result.output.len);
    const returned_value = std.mem.readInt(u256, result.output[0..32], .big);
    // At top-level: expected = original_caller + 0
    const expected = to_u256(original_caller) + 0;
    try std.testing.expectEqual(expected, returned_value);
}

test "Frame STATICCALL prevents state changes - real integration test" {
    const allocator = std.testing.allocator;
    
    // Create real EVM instance
    const result = try createTestEvm(allocator);
    var evm = result.evm;
    var memory_db = result.memory_db;
    defer {
        evm.deinit();
        allocator.destroy(evm);
        memory_db.deinit();
        allocator.destroy(memory_db);
    }
    
    // Deploy a contract that tries to modify storage
    const target_bytecode = [_]u8{
        0x60, 0x42, // PUSH1 0x42
        0x60, 0x00, // PUSH1 0
        0x55,       // SSTORE (try to store 0x42 at slot 0) - should fail in static context
        0x60, 0x01, // PUSH1 1
        0x60, 0x00, // PUSH1 0
        0x52,       // MSTORE
        0x60, 0x20, // PUSH1 32
        0x60, 0x00, // PUSH1 0
        0xF3,       // RETURN
    };
    
    const target_address = to_address(0x4000);
    const code_hash = try evm.database.set_code(&target_bytecode);
    var account = @import("database_interface_account.zig").Account.zero();
    account.code_hash = code_hash;
    try evm.database.set_account(target_address, account);
    
    // Create frame
    const F = Frame(.{ .has_database = true });
    const bytecode = [_]u8{ 0xFA, 0x00 }; // STATICCALL STOP
    const host = evm.to_host();
    
    var frame = try F.init(allocator, &bytecode, 100000, evm.database, host);
    defer frame.deinit(allocator);
    
    // Setup stack for STATICCALL: [gas, address, input_offset, input_size, output_offset, output_size]
    try frame.stack.push(50000);                    // gas
    try frame.stack.push(to_u256(target_address)); // address
    try frame.stack.push(0);                        // input_offset
    try frame.stack.push(0);                        // input_size
    try frame.stack.push(0);                        // output_offset
    try frame.stack.push(32);                       // output_size
    
    // Execute STATICCALL
    try frame.staticcall();
    
    // Should fail because the called contract tries to modify state
    const stack_result = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 0), stack_result); // Failure
    
    // Verify storage was not modified
    const storage_value = try evm.database.get_storage(target_address, 0);
    try std.testing.expectEqual(@as(u256, 0), storage_value); // Should still be 0
}

test "Frame CREATE operation - real integration test" {
    const allocator = std.testing.allocator;
    
    // Create real EVM instance
    const result = try createTestEvm(allocator);
    var evm = result.evm;
    var memory_db = result.memory_db;
    defer {
        evm.deinit();
        allocator.destroy(evm);
        memory_db.deinit();
        allocator.destroy(memory_db);
    }
    
    // Set up creator account with balance
    const creator_address = to_address(0x5000);
    var creator_account = @import("database_interface_account.zig").Account.zero();
    creator_account.balance = 10000;
    try evm.database.set_account(creator_address, creator_account);
    
    // Prepare init code that deploys a simple contract
    const init_code = [_]u8{
        // Constructor: return a simple contract that stores 42
        0x60, 0x0A, // PUSH1 10 (size of runtime code)
        0x60, 0x0C, // PUSH1 12 (offset of runtime code)
        0x60, 0x00, // PUSH1 0 (destination in memory)
        0x39,       // CODECOPY
        0x60, 0x0A, // PUSH1 10 (size)
        0x60, 0x00, // PUSH1 0 (offset)
        0xF3,       // RETURN
        // Runtime code (10 bytes):
        0x60, 0x2A, // PUSH1 42
        0x60, 0x00, // PUSH1 0
        0x52,       // MSTORE
        0x60, 0x20, // PUSH1 32
        0x60, 0x00, // PUSH1 0
        0xF3,       // RETURN
    };
    
    // Create frame
    const F = Frame(.{ .has_database = true });
    const bytecode = [_]u8{ 0xF0, 0x00 }; // CREATE STOP
    const host = evm.to_host();
    
    var frame = try F.init(allocator, &bytecode, 200000, evm.database, host);
    defer frame.deinit(allocator);
    
    frame.contract_address = creator_address;
    
    // Store init code in memory
    try frame.memory.set_data(0, &init_code);
    
    // Setup stack for CREATE: [value, offset, size]
    try frame.stack.push(1000);          // value (send 1000 wei)
    try frame.stack.push(0);             // offset
    try frame.stack.push(init_code.len); // size
    
    // Execute CREATE
    try frame.create();
    
    // Get the created contract address from stack
    const created_address_u256 = try frame.stack.pop();
    
    // Verify contract was created (non-zero address)
    try std.testing.expect(created_address_u256 != 0);
    
    // Convert to address and verify the account exists
    const created_address = from_u256(created_address_u256);
    const created_account = try evm.database.get_account(created_address);
    
    try std.testing.expect(created_account != null);
    try std.testing.expectEqual(@as(u256, 1000), created_account.?.balance); // Should have the transferred value
    
    // Verify creator's balance was reduced
    const creator_after = try evm.database.get_account(creator_address);
    try std.testing.expect(creator_after.?.balance < 10000); // Balance reduced by value + gas
}

// Helper to convert u256 to Address
fn from_u256(value: u256) Address {
    var addr: Address = [_]u8{0} ** 20;
    var i: usize = 0;
    while (i < 20) : (i += 1) {
        addr[19 - i] = @truncate(value >> @intCast(i * 8));
    }
    return addr;
}

// Helper to convert Address to u256
fn to_u256(addr: Address) u256 {
    var result: u256 = 0;
    for (addr, 0..) |byte, i| {
        result |= @as(u256, byte) << @intCast((19 - i) * 8);
    }
    return result;
}
