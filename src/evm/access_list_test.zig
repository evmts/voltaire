const std = @import("std");
const testing = std.testing;
const primitives = @import("primitives");
const Address = primitives.Address.Address;
const u256 = primitives.u256;
const GasConstants = primitives.GasConstants;
const AccessList = @import("access_list.zig").AccessList;
const Evm = @import("evm.zig").Evm;
const MemoryDatabase = @import("memory_database.zig").MemoryDatabase;
const DatabaseInterface = @import("database_interface.zig").DatabaseInterface;
const BlockInfo = @import("block_info.zig").DefaultBlockInfo;
const TransactionContext = @import("transaction_context.zig").TransactionContext;
const CallParams = @import("call_params.zig").CallParams;

const ZERO_ADDRESS = [_]u8{0} ** 20;
const TEST_ADDRESS_1 = [_]u8{1} ** 20;
const TEST_ADDRESS_2 = [_]u8{2} ** 20;
const TEST_ADDRESS_3 = [_]u8{3} ** 20;

test "EIP-2929: warm/cold access - BALANCE opcode gas costs" {
    const allocator = testing.allocator;
    
    var memory_db = MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = DatabaseInterface.init(&memory_db);
    
    const block_info = BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30_000_000,
        .basefee = 10,
        .coinbase = ZERO_ADDRESS,
        .prevrandao = [_]u8{1} ** 32,
        .blob_base_fee = 1,
    };
    
    const tx_context = TransactionContext{
        .gas_price = 20,
        .gas_limit = 1_000_000,
        .origin = TEST_ADDRESS_1,
        .blob_hashes = &.{},
        .max_fee_per_blob_gas = null,
    };
    
    var evm = try Evm.init(allocator, db_interface, &block_info, &tx_context);
    defer evm.deinit();
    
    // Set up test accounts with balances
    const account1 = .{
        .nonce = 0,
        .balance = 1000,
        .code_hash = [_]u8{0} ** 32,
        .storage_root = [_]u8{0} ** 32,
    };
    try memory_db.set_account(TEST_ADDRESS_2, account1);
    
    // Test first access (cold) to an address
    const cold_cost = try evm.access_address(TEST_ADDRESS_2);
    try testing.expectEqual(GasConstants.ColdAccountAccessCost, cold_cost);
    
    // Test second access (warm) to the same address
    const warm_cost = try evm.access_address(TEST_ADDRESS_2);
    try testing.expectEqual(GasConstants.WarmAccessCost, warm_cost);
}

test "EIP-2929: warm/cold access - SLOAD opcode gas costs" {
    const allocator = testing.allocator;
    
    var memory_db = MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = DatabaseInterface.init(&memory_db);
    
    const block_info = BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30_000_000,
        .basefee = 10,
        .coinbase = ZERO_ADDRESS,
        .prevrandao = [_]u8{1} ** 32,
        .blob_base_fee = 1,
    };
    
    const tx_context = TransactionContext{
        .gas_price = 20,
        .gas_limit = 1_000_000,
        .origin = TEST_ADDRESS_1,
        .blob_hashes = &.{},
        .max_fee_per_blob_gas = null,
    };
    
    var evm = try Evm.init(allocator, db_interface, &block_info, &tx_context);
    defer evm.deinit();
    
    const slot: u256 = 42;
    
    // Test first access (cold) to a storage slot
    const cold_cost = try evm.access_storage_slot(TEST_ADDRESS_2, slot);
    try testing.expectEqual(GasConstants.ColdSloadCost, cold_cost);
    
    // Test second access (warm) to the same storage slot
    const warm_cost = try evm.access_storage_slot(TEST_ADDRESS_2, slot);
    try testing.expectEqual(GasConstants.WarmStorageReadCost, warm_cost);
}

test "EIP-2929: transaction pre-warming" {
    const allocator = testing.allocator;
    
    var memory_db = MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = DatabaseInterface.init(&memory_db);
    
    const block_info = BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30_000_000,
        .basefee = 10,
        .coinbase = TEST_ADDRESS_3,
        .prevrandao = [_]u8{1} ** 32,
        .blob_base_fee = 1,
    };
    
    const tx_context = TransactionContext{
        .gas_price = 20,
        .gas_limit = 1_000_000,
        .origin = TEST_ADDRESS_1,
        .blob_hashes = &.{},
        .max_fee_per_blob_gas = null,
    };
    
    var evm = try Evm.init(allocator, db_interface, &block_info, &tx_context);
    defer evm.deinit();
    
    // Pre-warm addresses as per EIP-2929
    try evm.access_list.pre_warm_addresses(&[_]Address{
        TEST_ADDRESS_1, // tx.origin
        TEST_ADDRESS_2, // target
        TEST_ADDRESS_3, // coinbase
    });
    
    // All pre-warmed addresses should have warm access cost
    const origin_cost = try evm.access_address(TEST_ADDRESS_1);
    try testing.expectEqual(GasConstants.WarmAccessCost, origin_cost);
    
    const target_cost = try evm.access_address(TEST_ADDRESS_2);
    try testing.expectEqual(GasConstants.WarmAccessCost, target_cost);
    
    const coinbase_cost = try evm.access_address(TEST_ADDRESS_3);
    try testing.expectEqual(GasConstants.WarmAccessCost, coinbase_cost);
}

test "EIP-2929: SELFBALANCE always warm" {
    const allocator = testing.allocator;
    
    var memory_db = MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = DatabaseInterface.init(&memory_db);
    
    const block_info = BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30_000_000,
        .basefee = 10,
        .coinbase = ZERO_ADDRESS,
        .prevrandao = [_]u8{1} ** 32,
        .blob_base_fee = 1,
    };
    
    const tx_context = TransactionContext{
        .gas_price = 20,
        .gas_limit = 1_000_000,
        .origin = TEST_ADDRESS_1,
        .blob_hashes = &.{},
        .max_fee_per_blob_gas = null,
    };
    
    var evm = try Evm.init(allocator, db_interface, &block_info, &tx_context);
    defer evm.deinit();
    
    // Deploy contract
    const contract_address = TEST_ADDRESS_2;
    const bytecode = [_]u8{ 0x47, 0x00 }; // SELFBALANCE, STOP
    try memory_db.set_code(contract_address, &bytecode);
    
    // Pre-warm the contract address (as would happen during CALL)
    try evm.access_list.pre_warm_addresses(&[_]Address{contract_address});
    
    // Contract's own address should always be warm
    const self_cost = try evm.access_address(contract_address);
    try testing.expectEqual(GasConstants.WarmAccessCost, self_cost);
}

test "EIP-2929: access list cleared between transactions" {
    const allocator = testing.allocator;
    
    var memory_db = MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = DatabaseInterface.init(&memory_db);
    
    const block_info = BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30_000_000,
        .basefee = 10,
        .coinbase = ZERO_ADDRESS,
        .prevrandao = [_]u8{1} ** 32,
        .blob_base_fee = 1,
    };
    
    const tx_context = TransactionContext{
        .gas_price = 20,
        .gas_limit = 1_000_000,
        .origin = TEST_ADDRESS_1,
        .blob_hashes = &.{},
        .max_fee_per_blob_gas = null,
    };
    
    var evm = try Evm.init(allocator, db_interface, &block_info, &tx_context);
    defer evm.deinit();
    
    // Access an address to warm it
    _ = try evm.access_address(TEST_ADDRESS_2);
    try testing.expect(evm.access_list.is_address_warm(TEST_ADDRESS_2));
    
    // Clear access list (simulating new transaction)
    evm.access_list.clear();
    
    // Address should be cold again
    try testing.expect(!evm.access_list.is_address_warm(TEST_ADDRESS_2));
    const cost = try evm.access_address(TEST_ADDRESS_2);
    try testing.expectEqual(GasConstants.ColdAccountAccessCost, cost);
}

test "EIP-2929: correct gas costs" {
    // Verify that gas constants match EIP-2929 specification
    try testing.expectEqual(@as(u64, 2600), GasConstants.ColdAccountAccessCost);
    try testing.expectEqual(@as(u64, 100), GasConstants.WarmAccessCost);
    try testing.expectEqual(@as(u64, 2100), GasConstants.ColdSloadCost);
    try testing.expectEqual(@as(u64, 100), GasConstants.WarmStorageReadCost);
}