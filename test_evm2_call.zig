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

// TDD Tests for call method implementation
test "call method basic functionality - simple STOP" {
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
    
    const call_params = DefaultEvm.CallParams{
        .call = .{
            .caller = ZERO_ADDRESS,
            .to = ZERO_ADDRESS,
            .value = 0,
            .input = &.{},
            .gas = 100000,
        },
    };
    
    // This should work when call method is properly implemented
    const result = try evm.call(call_params);
    
    try testing.expect(result.success);
    try testing.expect(result.gas_left > 0);
}

test "call method loads contract code from state" {
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
    
    // Set up contract with bytecode [0x00] (STOP)
    const contract_address = primitives.Address.from_hex("0x1234567890123456789012345678901234567890") catch ZERO_ADDRESS;
    const bytecode = [_]u8{0x00};
    const code_hash = try memory_db.set_code(&bytecode);
    
    // Create an account with the code hash
    const account = evm2.Account{
        .balance = 0,
        .nonce = 0,
        .code_hash = code_hash,
        .storage_root = [_]u8{0} ** 32,
    };
    try memory_db.set_account(contract_address, account);
    
    const call_params = DefaultEvm.CallParams{
        .call = .{
            .caller = ZERO_ADDRESS,
            .to = contract_address,
            .value = 0,
            .input = &.{},
            .gas = 100000,
        },
    };
    
    const result = try evm.call(call_params);
    
    try testing.expect(result.success);
    try testing.expect(result.gas_left > 0);
}

test "call method handles CREATE operation" {
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
    
    // Create contract with simple init code that returns [0x00] (STOP)
    const init_code = [_]u8{ 0x60, 0x01, 0x60, 0x00, 0x52, 0x60, 0x01, 0x60, 0x00, 0xF3 }; // PUSH1 1 PUSH1 0 MSTORE PUSH1 1 PUSH1 0 RETURN
    
    const create_params = DefaultEvm.CallParams{
        .create = .{
            .caller = ZERO_ADDRESS,
            .value = 0,
            .init_code = &init_code,
            .gas = 100000,
        },
    };
    
    const result = try evm.call(create_params);
    
    try testing.expect(result.success);
    try testing.expect(result.gas_left > 0);
}

test "call method handles gas limit properly" {
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
    
    // Call with very low gas (should fail or return with low gas left)
    const call_params = DefaultEvm.CallParams{
        .call = .{
            .caller = ZERO_ADDRESS,
            .to = ZERO_ADDRESS,
            .value = 0,
            .input = &.{},
            .gas = 10, // Very low gas
        },
    };
    
    const result = try evm.call(call_params);
    
    // Should either fail or consume most/all gas
    try testing.expect(result.gas_left <= 10);
}

test "call method handles nested calls with proper depth tracking" {
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
    
    // Test depth tracking
    try testing.expectEqual(@as(u11, 0), evm.depth);
    
    // Test nested call
    const call_params = DefaultEvm.CallParams{
        .call = .{
            .caller = ZERO_ADDRESS,
            .to = ZERO_ADDRESS,
            .value = 0,
            .input = &.{},
            .gas = 100000,
        },
    };
    
    const result = try evm.inner_call(call_params);
    
    try testing.expect(result.success);
    try testing.expect(result.gas_left > 0);
    try testing.expectEqual(@as(u11, 0), evm.depth); // Should be restored after call
}

test "call method rejects calls exceeding max depth" {
    // Create EVM with very low max depth
    const LowDepthEvm = evm2.Evm(.{ .max_call_depth = 2 });
    
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
    
    const context = LowDepthEvm.TransactionContext{
        .gas_limit = 1000000,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };
    
    var evm = try LowDepthEvm.init(testing.allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN);
    defer evm.deinit();
    
    // Set depth to max
    evm.depth = 2;
    
    const call_params = LowDepthEvm.CallParams{
        .call = .{
            .caller = ZERO_ADDRESS,
            .to = ZERO_ADDRESS,
            .value = 0,
            .input = &.{},
            .gas = 100000,
        },
    };
    
    // This should fail due to depth limit
    const result = try evm.inner_call(call_params);
    
    try testing.expect(!result.success);
    try testing.expectEqual(@as(u64, 0), result.gas_left);
}