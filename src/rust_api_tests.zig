//! Comprehensive tests for the Rust-like API wrapper
//!
//! These tests thoroughly exercise the Rust-inspired API patterns,
//! similar to the comprehensive evm_tests.zig

const std = @import("std");
const rust_api = @import("rust_api.zig");
const primitives = @import("primitives");
const Database = @import("storage/database.zig").Database;
const MemoryDatabase = @import("storage/memory_database.zig").MemoryDatabase;
const Account = @import("storage/database_interface_account.zig").Account;
const EvmConfig = @import("evm_config.zig").EvmConfig;
const Hardfork = @import("eips_and_hardforks/eips.zig").Hardfork;
const BlockInfo = @import("block/block_info.zig").BlockInfo;
const TransactionContext = @import("block/transaction_context.zig").TransactionContext;
const Evm = @import("evm.zig").Evm;

// ============================================================================
// Result Type Tests
// ============================================================================

test "Result type - comprehensive functionality" {
    // Test Ok variant
    const ok_result = rust_api.Result(i32, []const u8){ .ok = 42 };
    try std.testing.expect(ok_result.is_ok());
    try std.testing.expect(!ok_result.is_err());
    try std.testing.expectEqual(@as(i32, 42), ok_result.unwrap());
    
    // Test Err variant
    const err_result = rust_api.Result(i32, []const u8){ .err = "error message" };
    try std.testing.expect(!err_result.is_ok());
    try std.testing.expect(err_result.is_err());
    try std.testing.expectEqualStrings("error message", err_result.unwrap_err());
}

test "Result type - map function" {
    const double = struct {
        fn f(x: i32) i32 {
            return x * 2;
        }
    }.f;
    
    const ok_result = rust_api.Result(i32, []const u8){ .ok = 21 };
    const mapped = ok_result.map(i32, double);
    try std.testing.expectEqual(@as(i32, 42), mapped.unwrap());
    
    const err_result = rust_api.Result(i32, []const u8){ .err = "error" };
    const mapped_err = err_result.map(i32, double);
    try std.testing.expect(mapped_err.is_err());
    try std.testing.expectEqualStrings("error", mapped_err.unwrap_err());
}

test "Result type - with different types" {
    // Test with complex types
    const ComplexType = struct {
        value: u64,
        name: []const u8,
    };
    
    const ok_complex = rust_api.Result(ComplexType, error{TestError}){
        .ok = .{ .value = 100, .name = "test" },
    };
    try std.testing.expect(ok_complex.is_ok());
    try std.testing.expectEqual(@as(u64, 100), ok_complex.unwrap().value);
    
    const err_complex = rust_api.Result(ComplexType, error{TestError}){
        .err = error.TestError,
    };
    try std.testing.expect(err_complex.is_err());
    try std.testing.expectEqual(error.TestError, err_complex.unwrap_err());
}

// ============================================================================
// Transaction Type Tests
// ============================================================================

test "Transaction type - legacy transaction" {
    const tx = rust_api.Transaction{
        .from = primitives.ZERO_ADDRESS,
        .to = primitives.ZERO_ADDRESS,
        .value = 1000,
        .data = &.{},
        .gas_limit = 21000,
        .gas_price = 1_000_000_000,
        .nonce = 0,
        .tx_type = .legacy,
    };
    
    try std.testing.expectEqual(rust_api.Transaction.TxType.legacy, tx.tx_type);
    try std.testing.expectEqual(@as(u64, 21000), tx.gas_limit);
    try std.testing.expectEqual(@as(u256, 1000), tx.value);
}

test "Transaction type - EIP-1559 transaction" {
    const tx = rust_api.Transaction{
        .from = primitives.ZERO_ADDRESS,
        .to = primitives.ZERO_ADDRESS,
        .value = 0,
        .data = &.{},
        .gas_limit = 30000,
        .gas_price = 0,
        .nonce = 1,
        .tx_type = .eip1559,
        .max_fee_per_gas = 2_000_000_000,
        .max_priority_fee_per_gas = 100_000_000,
    };
    
    try std.testing.expectEqual(rust_api.Transaction.TxType.eip1559, tx.tx_type);
    try std.testing.expectEqual(@as(u256, 2_000_000_000), tx.max_fee_per_gas.?);
    try std.testing.expectEqual(@as(u256, 100_000_000), tx.max_priority_fee_per_gas.?);
}

test "Transaction type - contract creation" {
    const init_code = [_]u8{ 0x60, 0x00, 0xF3 }; // PUSH1 0 RETURN
    const tx = rust_api.Transaction{
        .from = primitives.ZERO_ADDRESS,
        .to = null, // null indicates contract creation
        .value = 0,
        .data = &init_code,
        .gas_limit = 100000,
        .gas_price = 1_000_000_000,
        .nonce = 0,
    };
    
    try std.testing.expect(tx.to == null);
    try std.testing.expectEqual(@as(usize, 3), tx.data.len);
}

// ============================================================================
// EvmBuilder Tests
// ============================================================================

test "EvmBuilder - default configuration" {
    var db = Database.init(std.testing.allocator);
    defer db.deinit();
    
    const evm = try rust_api.EvmBuilder(EvmConfig{})
        .new(std.testing.allocator, &db)
        .build();
    defer evm.deinit();
    
    try std.testing.expectEqual(Hardfork.CANCUN, evm.evm.hardfork_config);
    try std.testing.expectEqual(@as(u256, 0), evm.evm.gas_price);
}

test "EvmBuilder - custom configuration" {
    var db = Database.init(std.testing.allocator);
    defer db.deinit();
    
    const custom_block = BlockInfo{
        .number = 15_000_000,
        .timestamp = 1_700_000_000,
        .difficulty = 0,
        .gas_limit = 30_000_000,
        .coinbase = primitives.ZERO_ADDRESS,
        .base_fee = 25_000_000_000,
        .prev_randao = [_]u8{0x42} ** 32,
        .chain_id = 1,
    };
    
    const custom_context = TransactionContext{
        .gas_limit = 5_000_000,
        .coinbase = primitives.ZERO_ADDRESS,
        .chain_id = 137, // Polygon
    };
    
    const origin = try primitives.Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7");
    
    const evm = try rust_api.EvmBuilder(EvmConfig{})
        .new(std.testing.allocator, &db)
        .with_hardfork(.LONDON)
        .with_block(custom_block)
        .with_tx_context(custom_context)
        .with_gas_price(30_000_000_000)
        .with_origin(origin)
        .build();
    defer evm.deinit();
    
    try std.testing.expectEqual(Hardfork.LONDON, evm.evm.hardfork_config);
    try std.testing.expectEqual(@as(u256, 30_000_000_000), evm.evm.gas_price);
    try std.testing.expectEqual(origin, evm.evm.origin);
    try std.testing.expectEqual(@as(u64, 15_000_000), evm.evm.block_info.number);
    try std.testing.expectEqual(@as(u16, 137), evm.evm.context.chain_id);
}

test "EvmBuilder - build_mainnet convenience method" {
    var db = Database.init(std.testing.allocator);
    defer db.deinit();
    
    const evm = try rust_api.EvmBuilder(EvmConfig{})
        .new(std.testing.allocator, &db)
        .build_mainnet();
    defer evm.deinit();
    
    try std.testing.expectEqual(Hardfork.CANCUN, evm.evm.hardfork_config);
}

test "EvmBuilder - with custom EVM config" {
    const custom_config = EvmConfig{
        .max_call_depth = 512,
        .max_input_size = 65536,
        .enable_precompiles = false,
        .enable_fusion = false,
    };
    
    var db = Database.init(std.testing.allocator);
    defer db.deinit();
    
    const evm = try rust_api.EvmBuilder(custom_config)
        .new(std.testing.allocator, &db)
        .build();
    defer evm.deinit();
    
    // The config is baked into the type at compile time
    comptime {
        try std.testing.expectEqual(@as(u11, 512), custom_config.max_call_depth);
        try std.testing.expectEqual(@as(u18, 65536), custom_config.max_input_size);
    }
}

// ============================================================================
// Transaction Execution Tests
// ============================================================================

test "Transaction execution - simple value transfer" {
    var db = Database.init(std.testing.allocator);
    defer db.deinit();
    
    const alice = try primitives.Address.fromHex("0x1000000000000000000000000000000000000001");
    const bob = try primitives.Address.fromHex("0x2000000000000000000000000000000000000002");
    
    // Fund Alice's account
    try db.set_account(alice.bytes, Account{
        .balance = 10_000_000_000_000_000_000, // 10 ETH
        .nonce = 0,
        .code_hash = [_]u8{0} ** 32,
        .storage_root = [_]u8{0} ** 32,
    });
    
    const evm = try rust_api.EvmBuilder(EvmConfig{})
        .new(std.testing.allocator, &db)
        .build_mainnet();
    defer evm.deinit();
    
    const tx = rust_api.Transaction{
        .from = alice,
        .to = bob,
        .value = 1_000_000_000_000_000_000, // 1 ETH
        .data = &.{},
        .gas_limit = 21_000,
        .gas_price = 1_000_000_000,
        .nonce = 0,
    };
    
    const result = evm.transact(tx);
    try std.testing.expect(result.is_ok());
    
    const exec = result.unwrap();
    try std.testing.expectEqual(rust_api.ExecutionResult.Status.success, exec.status);
    try std.testing.expect(exec.gas_used > 0);
    try std.testing.expect(exec.gas_used <= 21_000);
    
    // Verify balances changed
    const alice_after = evm.get_account(alice).?;
    const bob_after = evm.get_account(bob).?;
    
    try std.testing.expect(alice_after.balance < 10_000_000_000_000_000_000);
    try std.testing.expectEqual(@as(u256, 1_000_000_000_000_000_000), bob_after.balance);
}

test "Transaction execution - contract creation" {
    var db = Database.init(std.testing.allocator);
    defer db.deinit();
    
    const creator = try primitives.Address.fromHex("0x1000000000000000000000000000000000000001");
    
    try db.set_account(creator.bytes, Account{
        .balance = 1_000_000_000_000_000_000,
        .nonce = 0,
        .code_hash = [_]u8{0} ** 32,
        .storage_root = [_]u8{0} ** 32,
    });
    
    const evm = try rust_api.EvmBuilder(EvmConfig{})
        .new(std.testing.allocator, &db)
        .build();
    defer evm.deinit();
    
    // Init code that stores 42 at slot 0 and returns runtime code
    const init_code = [_]u8{
        0x60, 0x2A, // PUSH1 42
        0x60, 0x00, // PUSH1 0
        0x55,       // SSTORE
        0x60, 0x01, // PUSH1 1 (size)
        0x60, 0x0C, // PUSH1 12 (offset)
        0xF3,       // RETURN
        0x00,       // Runtime code: STOP
    };
    
    const tx = rust_api.Transaction{
        .from = creator,
        .to = null,
        .value = 0,
        .data = &init_code,
        .gas_limit = 100_000,
        .gas_price = 1_000_000_000,
        .nonce = 0,
    };
    
    const result = evm.transact(tx);
    try std.testing.expect(result.is_ok());
    
    const exec = result.unwrap();
    try std.testing.expectEqual(rust_api.ExecutionResult.Status.success, exec.status);
    try std.testing.expect(exec.created_address != null);
    
    // Verify contract was created
    const contract_addr = exec.created_address.?;
    const contract_account = evm.get_account(contract_addr);
    try std.testing.expect(contract_account != null);
    
    // Verify storage was set
    const stored_value = evm.get_storage(contract_addr, 0);
    try std.testing.expectEqual(@as(u256, 42), stored_value);
}

test "Transaction execution - failed transfer (insufficient balance)" {
    var db = Database.init(std.testing.allocator);
    defer db.deinit();
    
    const poor_alice = try primitives.Address.fromHex("0x1000000000000000000000000000000000000001");
    const bob = try primitives.Address.fromHex("0x2000000000000000000000000000000000000002");
    
    try db.set_account(poor_alice.bytes, Account{
        .balance = 100, // Only 100 wei
        .nonce = 0,
        .code_hash = [_]u8{0} ** 32,
        .storage_root = [_]u8{0} ** 32,
    });
    
    const evm = try rust_api.EvmBuilder(EvmConfig{})
        .new(std.testing.allocator, &db)
        .build();
    defer evm.deinit();
    
    const tx = rust_api.Transaction{
        .from = poor_alice,
        .to = bob,
        .value = 1_000_000_000_000_000_000, // 1 ETH (way more than balance)
        .data = &.{},
        .gas_limit = 21_000,
        .gas_price = 1_000_000_000,
        .nonce = 0,
    };
    
    const result = evm.transact(tx);
    
    // Transaction should fail
    if (result.is_ok()) {
        const exec = result.unwrap();
        try std.testing.expect(exec.status != rust_api.ExecutionResult.Status.success);
    } else {
        // This is also acceptable - error at transaction level
        try std.testing.expect(result.is_err());
    }
}

test "Transaction execution - contract call with input/output" {
    var db = Database.init(std.testing.allocator);
    defer db.deinit();
    
    const caller = try primitives.Address.fromHex("0x1000000000000000000000000000000000000001");
    const contract = try primitives.Address.fromHex("0x2000000000000000000000000000000000000002");
    
    // Simple contract that returns its input
    // CALLDATASIZE PUSH1 0 PUSH1 0 CALLDATACOPY
    // CALLDATASIZE PUSH1 0 RETURN
    const bytecode = [_]u8{
        0x36,       // CALLDATASIZE
        0x60, 0x00, // PUSH1 0
        0x60, 0x00, // PUSH1 0
        0x37,       // CALLDATACOPY
        0x36,       // CALLDATASIZE
        0x60, 0x00, // PUSH1 0
        0xF3,       // RETURN
    };
    
    const code_hash = try db.set_code(&bytecode);
    try db.set_account(contract.bytes, Account{
        .balance = 0,
        .nonce = 1,
        .code_hash = code_hash,
        .storage_root = [_]u8{0} ** 32,
    });
    
    try db.set_account(caller.bytes, Account{
        .balance = 1_000_000_000,
        .nonce = 0,
        .code_hash = [_]u8{0} ** 32,
        .storage_root = [_]u8{0} ** 32,
    });
    
    const evm = try rust_api.EvmBuilder(EvmConfig{})
        .new(std.testing.allocator, &db)
        .build();
    defer evm.deinit();
    
    const input_data = "Hello, EVM!";
    const tx = rust_api.Transaction{
        .from = caller,
        .to = contract,
        .value = 0,
        .data = input_data,
        .gas_limit = 100_000,
        .gas_price = 1_000_000_000,
        .nonce = 0,
    };
    
    const result = evm.transact(tx);
    try std.testing.expect(result.is_ok());
    
    const exec = result.unwrap();
    try std.testing.expectEqual(rust_api.ExecutionResult.Status.success, exec.status);
    try std.testing.expectEqualStrings(input_data, exec.output);
}

// ============================================================================
// Simulation Tests
// ============================================================================

test "Simulate transaction - state not modified" {
    var db = Database.init(std.testing.allocator);
    defer db.deinit();
    
    const alice = try primitives.Address.fromHex("0x1000000000000000000000000000000000000001");
    const bob = try primitives.Address.fromHex("0x2000000000000000000000000000000000000002");
    
    const initial_balance: u256 = 10_000_000_000_000_000_000;
    try db.set_account(alice.bytes, Account{
        .balance = initial_balance,
        .nonce = 0,
        .code_hash = [_]u8{0} ** 32,
        .storage_root = [_]u8{0} ** 32,
    });
    
    const evm = try rust_api.EvmBuilder(EvmConfig{})
        .new(std.testing.allocator, &db)
        .build();
    defer evm.deinit();
    
    const tx = rust_api.Transaction{
        .from = alice,
        .to = bob,
        .value = 1_000_000_000_000_000_000,
        .data = &.{},
        .gas_limit = 21_000,
        .gas_price = 1_000_000_000,
        .nonce = 0,
    };
    
    // Simulate the transaction
    const result = evm.simulate(tx);
    try std.testing.expect(result.is_ok());
    
    const exec = result.unwrap();
    try std.testing.expectEqual(rust_api.ExecutionResult.Status.success, exec.status);
    
    // Verify state was NOT modified
    const alice_after = evm.get_account(alice).?;
    const bob_after = evm.get_account(bob);
    
    try std.testing.expectEqual(initial_balance, alice_after.balance);
    try std.testing.expect(bob_after == null or bob_after.?.balance == 0);
}

test "Simulate transaction - gas estimation" {
    var db = Database.init(std.testing.allocator);
    defer db.deinit();
    
    const alice = try primitives.Address.fromHex("0x1000000000000000000000000000000000000001");
    
    try db.set_account(alice.bytes, Account{
        .balance = 10_000_000_000_000_000_000,
        .nonce = 0,
        .code_hash = [_]u8{0} ** 32,
        .storage_root = [_]u8{0} ** 32,
    });
    
    const evm = try rust_api.EvmBuilder(EvmConfig{})
        .new(std.testing.allocator, &db)
        .build();
    defer evm.deinit();
    
    // Simulate contract creation to estimate gas
    const init_code = [_]u8{
        0x60, 0x2A, // PUSH1 42
        0x60, 0x00, // PUSH1 0
        0x55,       // SSTORE
        0x00,       // STOP
    };
    
    const tx = rust_api.Transaction{
        .from = alice,
        .to = null,
        .value = 0,
        .data = &init_code,
        .gas_limit = 1_000_000, // High limit to see actual usage
        .gas_price = 1_000_000_000,
        .nonce = 0,
    };
    
    const result = evm.simulate(tx);
    try std.testing.expect(result.is_ok());
    
    const exec = result.unwrap();
    try std.testing.expect(exec.gas_used > 0);
    try std.testing.expect(exec.gas_used < 1_000_000);
    
    // State should not be modified
    const alice_after = evm.get_account(alice).?;
    try std.testing.expectEqual(@as(u64, 0), alice_after.nonce);
}

// ============================================================================
// State Access Tests
// ============================================================================

test "State access - get_account" {
    var db = Database.init(std.testing.allocator);
    defer db.deinit();
    
    const addr = try primitives.Address.fromHex("0x1234567890123456789012345678901234567890");
    const account = Account{
        .balance = 999_999,
        .nonce = 42,
        .code_hash = [_]u8{0xAB} ** 32,
        .storage_root = [_]u8{0xCD} ** 32,
    };
    
    try db.set_account(addr.bytes, account);
    
    const evm = try rust_api.EvmBuilder(EvmConfig{})
        .new(std.testing.allocator, &db)
        .build();
    defer evm.deinit();
    
    const retrieved = evm.get_account(addr);
    try std.testing.expect(retrieved != null);
    try std.testing.expectEqual(@as(u256, 999_999), retrieved.?.balance);
    try std.testing.expectEqual(@as(u64, 42), retrieved.?.nonce);
    
    const non_existent = try primitives.Address.fromHex("0x0000000000000000000000000000000000000999");
    const missing = evm.get_account(non_existent);
    try std.testing.expect(missing == null);
}

test "State access - get_storage and get_code" {
    var db = Database.init(std.testing.allocator);
    defer db.deinit();
    
    const addr = try primitives.Address.fromHex("0x5555555555555555555555555555555555555555");
    
    // Set up contract with code and storage
    const bytecode = [_]u8{ 0x60, 0x00, 0x60, 0x00, 0xF3 }; // PUSH1 0 PUSH1 0 RETURN
    const code_hash = try db.set_code(&bytecode);
    
    try db.set_account(addr.bytes, Account{
        .balance = 0,
        .nonce = 1,
        .code_hash = code_hash,
        .storage_root = [_]u8{0} ** 32,
    });
    
    // Set storage values
    try db.set_storage(addr.bytes, 100, 0xDEADBEEF);
    try db.set_storage(addr.bytes, 200, 0xCAFEBABE);
    
    const evm = try rust_api.EvmBuilder(EvmConfig{})
        .new(std.testing.allocator, &db)
        .build();
    defer evm.deinit();
    
    // Test get_storage
    const value1 = evm.get_storage(addr, 100);
    const value2 = evm.get_storage(addr, 200);
    const value3 = evm.get_storage(addr, 300); // Non-existent
    
    try std.testing.expectEqual(@as(u256, 0xDEADBEEF), value1);
    try std.testing.expectEqual(@as(u256, 0xCAFEBABE), value2);
    try std.testing.expectEqual(@as(u256, 0), value3);
    
    // Test get_code
    const code = evm.get_code(addr);
    try std.testing.expectEqualSlices(u8, &bytecode, code);
    
    // Test empty code for EOA
    const eoa = try primitives.Address.fromHex("0x9999999999999999999999999999999999999999");
    const empty_code = evm.get_code(eoa);
    try std.testing.expectEqual(@as(usize, 0), empty_code.len);
}

test "State access - set_block and set_tx_context" {
    var db = Database.init(std.testing.allocator);
    defer db.deinit();
    
    const initial_block = BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30_000_000,
        .coinbase = primitives.ZERO_ADDRESS,
        .base_fee = 0,
        .prev_randao = [_]u8{0} ** 32,
        .chain_id = 1,
    };
    
    const evm = try rust_api.EvmBuilder(EvmConfig{})
        .new(std.testing.allocator, &db)
        .with_block(initial_block)
        .build();
    defer evm.deinit();
    
    try std.testing.expectEqual(@as(u64, 1), evm.evm.block_info.number);
    
    // Update block
    const new_block = BlockInfo{
        .number = 1000,
        .timestamp = 2000,
        .difficulty = 200,
        .gas_limit = 40_000_000,
        .coinbase = primitives.ZERO_ADDRESS,
        .base_fee = 1_000_000_000,
        .prev_randao = [_]u8{0xFF} ** 32,
        .chain_id = 1,
    };
    
    evm.set_block(new_block);
    try std.testing.expectEqual(@as(u64, 1000), evm.evm.block_info.number);
    try std.testing.expectEqual(@as(u64, 2000), evm.evm.block_info.timestamp);
    
    // Update transaction context
    const new_context = TransactionContext{
        .gas_limit = 5_000_000,
        .coinbase = primitives.ZERO_ADDRESS,
        .chain_id = 137,
    };
    
    evm.set_tx_context(new_context);
    try std.testing.expectEqual(@as(u16, 137), evm.evm.context.chain_id);
    try std.testing.expectEqual(@as(u64, 5_000_000), evm.evm.context.gas_limit);
}

// ============================================================================
// Inspector Tests
// ============================================================================

test "Inspector - NoOpInspector creation" {
    const inspector = rust_api.NoOpInspector.init();
    
    // Test that all methods can be called without crashing
    inspector.step(0, 0x60, 100000, &.{});
    inspector.call(0, primitives.ZERO_ADDRESS, primitives.ZERO_ADDRESS, 0);
    inspector.return_fn(0, &.{});
    inspector.log(primitives.ZERO_ADDRESS, &.{}, &.{});
    
    // NoOp inspector does nothing, so we just verify it doesn't crash
    try std.testing.expect(true);
}

test "Inspector - custom inspector implementation" {
    const TestInspector = struct {
        step_count: usize = 0,
        call_count: usize = 0,
        
        const Self = @This();
        
        pub fn init(self: *Self) rust_api.Inspector {
            return rust_api.Inspector{
                .ptr = self,
                .vtable = &.{
                    .step = step,
                    .call = call,
                    .return_fn = return_fn,
                    .log = log,
                },
            };
        }
        
        fn step(ptr: *anyopaque, _: usize, _: u8, _: u64, _: []const u256) void {
            const self: *Self = @ptrCast(@alignCast(ptr));
            self.step_count += 1;
        }
        
        fn call(ptr: *anyopaque, _: usize, _: primitives.Address, _: primitives.Address, _: u256) void {
            const self: *Self = @ptrCast(@alignCast(ptr));
            self.call_count += 1;
        }
        
        fn return_fn(_: *anyopaque, _: usize, _: []const u8) void {}
        fn log(_: *anyopaque, _: primitives.Address, _: []const u256, _: []const u8) void {}
    };
    
    var test_inspector = TestInspector{};
    const inspector = test_inspector.init();
    
    // Call methods through the vtable
    inspector.step(0, 0x60, 100000, &.{});
    inspector.step(1, 0x01, 99999, &.{1});
    inspector.call(0, primitives.ZERO_ADDRESS, primitives.ZERO_ADDRESS, 0);
    
    try std.testing.expectEqual(@as(usize, 2), test_inspector.step_count);
    try std.testing.expectEqual(@as(usize, 1), test_inspector.call_count);
}

// ============================================================================
// Error Handling Tests
// ============================================================================

test "Error handling - invalid transactions" {
    var db = Database.init(std.testing.allocator);
    defer db.deinit();
    
    const evm = try rust_api.EvmBuilder(EvmConfig{})
        .new(std.testing.allocator, &db)
        .build();
    defer evm.deinit();
    
    // Transaction with no gas
    const no_gas_tx = rust_api.Transaction{
        .from = primitives.ZERO_ADDRESS,
        .to = primitives.ZERO_ADDRESS,
        .value = 0,
        .data = &.{},
        .gas_limit = 0, // No gas!
        .gas_price = 1_000_000_000,
        .nonce = 0,
    };
    
    const result = evm.transact(no_gas_tx);
    if (result.is_ok()) {
        const exec = result.unwrap();
        try std.testing.expect(exec.status != rust_api.ExecutionResult.Status.success);
    } else {
        try std.testing.expect(result.is_err());
    }
}

test "Error handling - call depth limit" {
    // Use a small depth limit for testing
    const shallow_config = EvmConfig{ .max_call_depth = 2 };
    
    var db = Database.init(std.testing.allocator);
    defer db.deinit();
    
    // Create a contract that calls itself recursively
    // This would exceed the depth limit
    const recursive_bytecode = [_]u8{
        // PUSH20 <own address>
        0x73, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x99,
        0x60, 0x00, // PUSH1 0 (value)
        0x60, 0x00, // PUSH1 0 (argsOffset)
        0x60, 0x00, // PUSH1 0 (argsLength)
        0x60, 0x00, // PUSH1 0 (retOffset)
        0x60, 0x00, // PUSH1 0 (retLength)
        0x86,       // DUP7 (address)
        0x5A,       // GAS
        0xF1,       // CALL
        0x00,       // STOP
    };
    
    const contract_addr = try primitives.Address.fromHex("0x0000000000000000000000000000000000000099");
    const code_hash = try db.set_code(&recursive_bytecode);
    
    try db.set_account(contract_addr.bytes, Account{
        .balance = 0,
        .nonce = 1,
        .code_hash = code_hash,
        .storage_root = [_]u8{0} ** 32,
    });
    
    const evm = try rust_api.EvmBuilder(shallow_config)
        .new(std.testing.allocator, &db)
        .build();
    defer evm.deinit();
    
    const tx = rust_api.Transaction{
        .from = primitives.ZERO_ADDRESS,
        .to = contract_addr,
        .value = 0,
        .data = &.{},
        .gas_limit = 1_000_000,
        .gas_price = 1_000_000_000,
        .nonce = 0,
    };
    
    const result = evm.transact(tx);
    // Should not crash, but might fail due to depth limit
    _ = result;
}

// ============================================================================
// Logs and Events Tests
// ============================================================================

test "Logs - transaction with LOG opcodes" {
    var db = Database.init(std.testing.allocator);
    defer db.deinit();
    
    // Contract that emits LOG1 with a topic
    const log_bytecode = [_]u8{
        0x60, 0x20,       // PUSH1 32 (data size)
        0x60, 0x00,       // PUSH1 0 (data offset)
        0x60, 0x42,       // PUSH1 0x42 (topic)
        0xA1,             // LOG1
        0x00,             // STOP
    };
    
    const contract = try primitives.Address.fromHex("0x1111111111111111111111111111111111111111");
    const code_hash = try db.set_code(&log_bytecode);
    
    try db.set_account(contract.bytes, Account{
        .balance = 0,
        .nonce = 1,
        .code_hash = code_hash,
        .storage_root = [_]u8{0} ** 32,
    });
    
    const evm = try rust_api.EvmBuilder(EvmConfig{})
        .new(std.testing.allocator, &db)
        .build();
    defer evm.deinit();
    
    const tx = rust_api.Transaction{
        .from = primitives.ZERO_ADDRESS,
        .to = contract,
        .value = 0,
        .data = &.{},
        .gas_limit = 100_000,
        .gas_price = 1_000_000_000,
        .nonce = 0,
    };
    
    const result = evm.transact(tx);
    try std.testing.expect(result.is_ok());
    
    const exec = result.unwrap();
    defer {
        // Clean up logs
        for (exec.logs) |log| {
            std.testing.allocator.free(log.topics);
            std.testing.allocator.free(log.data);
        }
        std.testing.allocator.free(exec.logs);
    }
    
    try std.testing.expectEqual(@as(usize, 1), exec.logs.len);
    
    const log = exec.logs[0];
    try std.testing.expectEqual(contract, log.address);
    try std.testing.expectEqual(@as(usize, 1), log.topics.len);
    try std.testing.expectEqual(@as(u256, 0x42), log.topics[0]);
    try std.testing.expectEqual(@as(usize, 32), log.data.len);
}

// ============================================================================
// Edge Cases and Stress Tests
// ============================================================================

test "Edge case - empty transaction data" {
    var db = Database.init(std.testing.allocator);
    defer db.deinit();
    
    const evm = try rust_api.EvmBuilder(EvmConfig{})
        .new(std.testing.allocator, &db)
        .build();
    defer evm.deinit();
    
    const tx = rust_api.Transaction{
        .from = primitives.ZERO_ADDRESS,
        .to = primitives.ZERO_ADDRESS,
        .value = 0,
        .data = &.{}, // Empty data
        .gas_limit = 21_000,
        .gas_price = 1_000_000_000,
        .nonce = 0,
    };
    
    const result = evm.transact(tx);
    try std.testing.expect(result.is_ok());
}

test "Edge case - maximum values" {
    var db = Database.init(std.testing.allocator);
    defer db.deinit();
    
    const max_addr = try primitives.Address.fromHex("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF");
    
    try db.set_account(max_addr.bytes, Account{
        .balance = std.math.maxInt(u256),
        .nonce = std.math.maxInt(u64),
        .code_hash = [_]u8{0xFF} ** 32,
        .storage_root = [_]u8{0xFF} ** 32,
    });
    
    const evm = try rust_api.EvmBuilder(EvmConfig{})
        .new(std.testing.allocator, &db)
        .build();
    defer evm.deinit();
    
    const account = evm.get_account(max_addr);
    try std.testing.expect(account != null);
    try std.testing.expectEqual(std.math.maxInt(u256), account.?.balance);
    try std.testing.expectEqual(std.math.maxInt(u64), account.?.nonce);
}

test "Integration - complete transaction lifecycle" {
    var db = Database.init(std.testing.allocator);
    defer db.deinit();
    
    // Setup accounts
    const deployer = try primitives.Address.fromHex("0xDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD");
    const user = try primitives.Address.fromHex("0xEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE");
    
    try db.set_account(deployer.bytes, Account{
        .balance = 10_000_000_000_000_000_000,
        .nonce = 0,
        .code_hash = [_]u8{0} ** 32,
        .storage_root = [_]u8{0} ** 32,
    });
    
    try db.set_account(user.bytes, Account{
        .balance = 5_000_000_000_000_000_000,
        .nonce = 0,
        .code_hash = [_]u8{0} ** 32,
        .storage_root = [_]u8{0} ** 32,
    });
    
    const evm = try rust_api.EvmBuilder(EvmConfig{})
        .new(std.testing.allocator, &db)
        .with_hardfork(.CANCUN)
        .build();
    defer evm.deinit();
    
    // 1. Deploy a contract
    const init_code = [_]u8{
        0x60, 0x0A, // PUSH1 10
        0x60, 0x00, // PUSH1 0
        0x55,       // SSTORE
        0x60, 0x01, // PUSH1 1
        0x60, 0x0F, // PUSH1 15
        0xF3,       // RETURN
        0x00,       // Runtime: STOP
    };
    
    const deploy_tx = rust_api.Transaction{
        .from = deployer,
        .to = null,
        .value = 1_000_000_000_000_000, // Send 0.001 ETH to contract
        .data = &init_code,
        .gas_limit = 200_000,
        .gas_price = 1_000_000_000,
        .nonce = 0,
    };
    
    const deploy_result = evm.transact(deploy_tx);
    try std.testing.expect(deploy_result.is_ok());
    
    const deploy_exec = deploy_result.unwrap();
    try std.testing.expect(deploy_exec.created_address != null);
    const contract_addr = deploy_exec.created_address.?;
    
    // 2. Interact with the deployed contract
    const call_tx = rust_api.Transaction{
        .from = user,
        .to = contract_addr,
        .value = 500_000_000_000_000, // Send 0.0005 ETH
        .data = &.{},
        .gas_limit = 50_000,
        .gas_price = 1_000_000_000,
        .nonce = 0,
    };
    
    const call_result = evm.transact(call_tx);
    try std.testing.expect(call_result.is_ok());
    
    // 3. Verify final state
    const deployer_final = evm.get_account(deployer).?;
    const user_final = evm.get_account(user).?;
    const contract_final = evm.get_account(contract_addr).?;
    
    // Deployer spent gas and sent value
    try std.testing.expect(deployer_final.balance < 10_000_000_000_000_000_000);
    try std.testing.expectEqual(@as(u64, 1), deployer_final.nonce);
    
    // User spent gas and sent value
    try std.testing.expect(user_final.balance < 5_000_000_000_000_000_000);
    try std.testing.expectEqual(@as(u64, 1), user_final.nonce);
    
    // Contract received value from both transactions
    try std.testing.expectEqual(
        @as(u256, 1_000_000_000_000_000 + 500_000_000_000_000),
        contract_final.balance
    );
    
    // Verify storage was set during deployment
    const stored_value = evm.get_storage(contract_addr, 0);
    try std.testing.expectEqual(@as(u256, 10), stored_value);
}