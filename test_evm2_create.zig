const std = @import("std");
const testing = std.testing;

// Import the minimal set of EVM2 components we need
const primitives = @import("primitives");
const Address = primitives.Address.Address;
const ZERO_ADDRESS = primitives.Address.ZERO_ADDRESS;

const ExecutionError = @import("evm").ExecutionError;

const evm2 = @import("evm2");
const DefaultEvm = evm2.Evm(.{});
const BlockInfo = evm2.BlockInfo;
const MemoryDatabase = evm2.MemoryDatabase;
const DatabaseInterface = evm2.DatabaseInterface;
const hardfork = @import("evm").hardforks.hardfork;

// TDD Tests for CREATE operations
test "CREATE operation deploys simple contract" {
    // Create test database
    var memory_db = MemoryDatabase.init(testing.allocator);
    defer memory_db.deinit();
    const db_interface = DatabaseInterface.init(&memory_db);
    
    const block_info = BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 1000000000,
        .prev_randao = [_]u8{0} ** 32,
    };
    
    const context = DefaultEvm.TransactionContext{
        .gas_limit = 1000000,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };
    
    var evm = try DefaultEvm.init(testing.allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN);
    defer evm.deinit();
    
    // Set the caller to have nonce 0 for predictable address calculation
    const caller_address = primitives.Address.from_hex("0x1234567890123456789012345678901234567890") catch ZERO_ADDRESS;
    const caller_account = evm2.Account{
        .balance = 1000000000000000000, // 1 ETH
        .nonce = 0,
        .code_hash = [_]u8{0} ** 32,
        .storage_root = [_]u8{0} ** 32,
    };
    try memory_db.set_account(caller_address, caller_account);
    
    // Simple init code that returns a single byte (0x60) as the deployed contract
    // PUSH1 0x60, PUSH1 0x00, MSTORE8, PUSH1 0x01, PUSH1 0x00, RETURN
    const init_code = [_]u8{ 0x60, 0x60, 0x60, 0x00, 0x53, 0x60, 0x01, 0x60, 0x00, 0xF3 };
    
    const create_params = DefaultEvm.CallParams{
        .create = .{
            .caller = caller_address,
            .value = 0,
            .init_code = &init_code,
            .gas = 100000,
        },
    };
    
    const result = try evm.call(create_params);
    
    // Should succeed and return the deployed contract address
    try testing.expect(result.success);
    try testing.expect(result.gas_left > 0);
    try testing.expect(result.output.len == 20); // Address is 20 bytes
    
    // The returned address should be the calculated contract address
    // For CREATE: keccak256(rlp([sender, nonce]))[12:]
    // Expected address for sender=0x1234... nonce=0
    const contract_address = result.output[0..20].*;
    
    // Verify the contract was actually deployed
    const deployed_account = (try memory_db.get_account(contract_address)) orelse {
        try testing.expect(false); // Account should exist
        return;
    };
    try testing.expect(deployed_account.nonce == 1); // Contract accounts start with nonce 1
    try testing.expect(!std.mem.eql(u8, &deployed_account.code_hash, &[_]u8{0} ** 32)); // Should have code hash
    
    // Verify the caller's nonce was incremented
    const updated_caller = (try memory_db.get_account(caller_address)) orelse {
        try testing.expect(false); // Account should exist
        return;
    };
    try testing.expect(updated_caller.nonce == 1);
}

test "CREATE2 operation deploys contract at deterministic address" {
    // Create test database
    var memory_db = MemoryDatabase.init(testing.allocator);
    defer memory_db.deinit();
    const db_interface = DatabaseInterface.init(&memory_db);
    
    const block_info = BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 1000000000,
        .prev_randao = [_]u8{0} ** 32,
    };
    
    const context = DefaultEvm.TransactionContext{
        .gas_limit = 1000000,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };
    
    var evm = try DefaultEvm.init(testing.allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN);
    defer evm.deinit();
    
    const caller_address = primitives.Address.from_hex("0x1234567890123456789012345678901234567890") catch ZERO_ADDRESS;
    const caller_account = evm2.Account{
        .balance = 1000000000000000000, // 1 ETH
        .nonce = 5, // Different nonce shouldn't affect CREATE2
        .code_hash = [_]u8{0} ** 32,
        .storage_root = [_]u8{0} ** 32,
    };
    try memory_db.set_account(caller_address, caller_account);
    
    // Simple init code and salt
    const init_code = [_]u8{ 0x60, 0x60, 0x60, 0x00, 0x53, 0x60, 0x01, 0x60, 0x00, 0xF3 };
    const salt: u256 = 42;
    
    const create2_params = DefaultEvm.CallParams{
        .create2 = .{
            .caller = caller_address,
            .value = 0,
            .init_code = &init_code,
            .salt = salt,
            .gas = 100000,
        },
    };
    
    const result = try evm.call(create2_params);
    
    try testing.expect(result.success);
    try testing.expect(result.gas_left > 0);
    try testing.expect(result.output.len == 20);
    
    _ = result.output[0..20].*;
    
    // CREATE2 with same parameters should produce same address
    var evm2_instance = try DefaultEvm.init(testing.allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN);
    defer evm2_instance.deinit();
    
    // Reset database for second call
    var memory_db2 = MemoryDatabase.init(testing.allocator);
    defer memory_db2.deinit();
    const db_interface2 = DatabaseInterface.init(&memory_db2);
    try memory_db2.set_account(caller_address, caller_account);
    
    var evm3 = try DefaultEvm.init(testing.allocator, db_interface2, block_info, context, 0, ZERO_ADDRESS, .CANCUN);
    defer evm3.deinit();
    
    const result2 = try evm3.call(create2_params);
    
    try testing.expect(result2.success);
    try testing.expect(std.mem.eql(u8, result.output, result2.output)); // Same address
}

test "CREATE operation fails with insufficient gas" {
    var memory_db = MemoryDatabase.init(testing.allocator);
    defer memory_db.deinit();
    const db_interface = DatabaseInterface.init(&memory_db);
    
    const block_info = BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 1000000000,
        .prev_randao = [_]u8{0} ** 32,
    };
    
    const context = DefaultEvm.TransactionContext{
        .gas_limit = 1000000,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };
    
    var evm = try DefaultEvm.init(testing.allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN);
    defer evm.deinit();
    
    const caller_address = ZERO_ADDRESS;
    const init_code = [_]u8{ 0x60, 0x60, 0x60, 0x00, 0x53, 0x60, 0x01, 0x60, 0x00, 0xF3 };
    
    const create_params = DefaultEvm.CallParams{
        .create = .{
            .caller = caller_address,
            .value = 0,
            .init_code = &init_code,
            .gas = 100, // Very low gas - should fail
        },
    };
    
    const result = try evm.call(create_params);
    
    try testing.expect(!result.success); // Should fail
    try testing.expect(result.gas_left == 0); // Should consume all gas
    try testing.expect(result.output.len == 0); // No output on failure
}

test "CREATE operation handles contract initialization failure" {
    var memory_db = MemoryDatabase.init(testing.allocator);
    defer memory_db.deinit();
    const db_interface = DatabaseInterface.init(&memory_db);
    
    const block_info = BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 1000000000,
        .prev_randao = [_]u8{0} ** 32,
    };
    
    const context = DefaultEvm.TransactionContext{
        .gas_limit = 1000000,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };
    
    var evm = try DefaultEvm.init(testing.allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN);
    defer evm.deinit();
    
    // Init code that reverts (PUSH1 0, PUSH1 0, REVERT)
    const failing_init_code = [_]u8{ 0x60, 0x00, 0x60, 0x00, 0xFD };
    
    const create_params = DefaultEvm.CallParams{
        .create = .{
            .caller = ZERO_ADDRESS,
            .value = 0,
            .init_code = &failing_init_code,
            .gas = 100000,
        },
    };
    
    const result = try evm.call(create_params);
    
    try testing.expect(!result.success); // Should fail due to revert
    try testing.expect(result.output.len == 0); // No contract address returned
}

test "CREATE operation with value transfer" {
    var memory_db = MemoryDatabase.init(testing.allocator);
    defer memory_db.deinit();
    const db_interface = DatabaseInterface.init(&memory_db);
    
    const block_info = BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 1000000000,
        .prev_randao = [_]u8{0} ** 32,
    };
    
    const context = DefaultEvm.TransactionContext{
        .gas_limit = 1000000,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };
    
    var evm = try DefaultEvm.init(testing.allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN);
    defer evm.deinit();
    
    const caller_address = primitives.Address.from_hex("0x1234567890123456789012345678901234567890") catch ZERO_ADDRESS;
    const initial_balance = 2000000000000000000; // 2 ETH
    const transfer_value = 1000000000000000000; // 1 ETH
    
    const caller_account = evm2.Account{
        .balance = initial_balance,
        .nonce = 0,
        .code_hash = [_]u8{0} ** 32,
        .storage_root = [_]u8{0} ** 32,
    };
    try memory_db.set_account(caller_address, caller_account);
    
    const init_code = [_]u8{ 0x60, 0x60, 0x60, 0x00, 0x53, 0x60, 0x01, 0x60, 0x00, 0xF3 };
    
    const create_params = DefaultEvm.CallParams{
        .create = .{
            .caller = caller_address,
            .value = transfer_value,
            .init_code = &init_code,
            .gas = 100000,
        },
    };
    
    const result = try evm.call(create_params);
    
    try testing.expect(result.success);
    try testing.expect(result.output.len == 20);
    
    const contract_address = result.output[0..20].*;
    
    // Verify balance transfer
    const updated_caller = (try memory_db.get_account(caller_address)) orelse {
        try testing.expect(false); // Account should exist
        return;
    };
    const contract_account = (try memory_db.get_account(contract_address)) orelse {
        try testing.expect(false); // Account should exist
        return;
    };
    
    try testing.expect(updated_caller.balance == initial_balance - transfer_value);
    try testing.expect(contract_account.balance == transfer_value);
}