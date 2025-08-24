const std = @import("std");
const evm = @import("../evm.zig");
const MemoryDatabase = @import("../memory_database.zig").MemoryDatabase;
const primitives = @import("primitives");
const Address = primitives.Address.Address;
const block_info = @import("../block_info.zig");
const transaction_context = @import("../transaction_context.zig");

// ============================================================================
// Cross-Contract CREATE Interaction Tests
// ============================================================================

test "CREATE interaction - deployed contract can be called" {
    const allocator = std.testing.allocator;
    
    var memory_db = MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    
    const db_interface = memory_db.to_database_interface();
    var evm_instance = try evm.Evm(evm.DefaultEvmConfig).init(
        allocator,
        db_interface,
        block_info.DefaultBlockInfo{
            .number = 1,
            .timestamp = 1000,
            .difficulty = 100,
            .gas_limit = 30_000_000,
            .coinbase = Address{0} ** 20,
            .base_fee = 1_000_000_000,
            .prev_randao = [_]u8{0} ** 32,
        },
        transaction_context.TransactionContext{
            .nonce = 0,
            .gas_price = 20_000_000_000,
            .gas_limit = 10_000_000,
            .to = null,
            .value = 0,
            .data = &[_]u8{},
            .chain_id = 1,
            .origin = Address{0x01} ** 20,
            .blob_hashes = &[_][32]u8{},
            .max_fee_per_blob_gas = null,
        },
        20_000_000_000,
        Address{0x01} ** 20,
        .CANCUN,
    );
    defer evm_instance.deinit();
    
    // Step 1: Deploy a simple contract that returns 42
    // Init code: stores runtime code and returns it
    const runtime_code = [_]u8{
        0x60, 0x2A, // PUSH1 42
        0x60, 0x00, // PUSH1 0
        0x52,       // MSTORE
        0x60, 0x20, // PUSH1 32
        0x60, 0x00, // PUSH1 0
        0xF3,       // RETURN
    };
    
    var init_code = std.ArrayList(u8).init(allocator);
    defer init_code.deinit();
    
    // Store runtime code in memory
    for (runtime_code, 0..) |byte, i| {
        try init_code.append(0x60); // PUSH1
        try init_code.append(@intCast(i));
        try init_code.append(0x60); // PUSH1
        try init_code.append(byte);
        try init_code.append(0x53); // MSTORE8
    }
    
    // Return runtime code
    try init_code.append(0x60); // PUSH1
    try init_code.append(@intCast(runtime_code.len)); // size
    try init_code.append(0x60); // PUSH1
    try init_code.append(0x00); // offset
    try init_code.append(0xF3); // RETURN
    
    // Deploy the contract
    const create_result = try evm_instance.call(.{
        .create = .{
            .caller = Address{0x01} ** 20,
            .value = 0,
            .init_code = init_code.items,
            .gas = 1_000_000,
        },
    });
    defer if (create_result.output.len > 0) allocator.free(create_result.output);
    
    try std.testing.expect(create_result.success);
    try std.testing.expectEqual(@as(usize, 20), create_result.output.len);
    
    // Get deployed contract address
    var contract_address: Address = undefined;
    @memcpy(&contract_address, create_result.output[0..20]);
    
    // Step 2: Call the deployed contract
    const call_result = try evm_instance.call(.{
        .call = .{
            .caller = Address{0x01} ** 20,
            .to = contract_address,
            .value = 0,
            .input = &[_]u8{}, // No input data
            .gas = 100_000,
        },
    });
    defer if (call_result.output.len > 0) allocator.free(call_result.output);
    
    try std.testing.expect(call_result.success);
    try std.testing.expectEqual(@as(usize, 32), call_result.output.len);
    
    // Verify returned value is 42
    var returned_value: u256 = 0;
    for (call_result.output) |byte| {
        returned_value = (returned_value << 8) | byte;
    }
    try std.testing.expectEqual(@as(u256, 42), returned_value);
}

test "CREATE interaction - factory creates and initializes child contracts" {
    const allocator = std.testing.allocator;
    
    var memory_db = MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    
    const db_interface = memory_db.to_database_interface();
    var evm_instance = try evm.Evm(evm.DefaultEvmConfig).init(
        allocator,
        db_interface,
        block_info.DefaultBlockInfo{
            .number = 1,
            .timestamp = 1000,
            .difficulty = 100,
            .gas_limit = 30_000_000,
            .coinbase = Address{0} ** 20,
            .base_fee = 1_000_000_000,
            .prev_randao = [_]u8{0} ** 32,
        },
        transaction_context.TransactionContext{
            .nonce = 0,
            .gas_price = 20_000_000_000,
            .gas_limit = 10_000_000,
            .to = null,
            .value = 0,
            .data = &[_]u8{},
            .chain_id = 1,
            .origin = Address{0x01} ** 20,
            .blob_hashes = &[_][32]u8{},
            .max_fee_per_blob_gas = null,
        },
        20_000_000_000,
        Address{0x01} ** 20,
        .CANCUN,
    );
    defer evm_instance.deinit();
    
    // Child contract: stores initialization value and returns it
    const child_runtime = [_]u8{
        0x60, 0x00, // PUSH1 0
        0x54,       // SLOAD (load value from slot 0)
        0x60, 0x00, // PUSH1 0
        0x52,       // MSTORE
        0x60, 0x20, // PUSH1 32
        0x60, 0x00, // PUSH1 0
        0xF3,       // RETURN
    };
    
    // Child init code: stores constructor argument in slot 0
    var child_init = std.ArrayList(u8).init(allocator);
    defer child_init.deinit();
    
    // Store caller-provided value in slot 0
    try child_init.append(0x60); // PUSH1
    try child_init.append(0x00); // 0 (calldata offset)
    try child_init.append(0x35); // CALLDATALOAD
    try child_init.append(0x60); // PUSH1
    try child_init.append(0x00); // 0 (storage slot)
    try child_init.append(0x55); // SSTORE
    
    // Store runtime code in memory
    for (child_runtime, 0..) |byte, i| {
        try child_init.append(0x60); // PUSH1
        try child_init.append(@intCast(i));
        try child_init.append(0x60); // PUSH1
        try child_init.append(byte);
        try child_init.append(0x53); // MSTORE8
    }
    
    // Return runtime code
    try child_init.append(0x60); // PUSH1
    try child_init.append(@intCast(child_runtime.len));
    try child_init.append(0x60); // PUSH1
    try child_init.append(0x00);
    try child_init.append(0xF3); // RETURN
    
    // Factory contract: creates child with initialization value
    var factory_code = std.ArrayList(u8).init(allocator);
    defer factory_code.deinit();
    
    // Load initialization value from calldata
    try factory_code.append(0x60); // PUSH1
    try factory_code.append(0x00); // 0
    try factory_code.append(0x35); // CALLDATALOAD
    
    // Store child init code in memory (with constructor arg appended)
    for (child_init.items, 0..) |byte, i| {
        try factory_code.append(0x60); // PUSH1
        try factory_code.append(byte);
        try factory_code.append(0x60); // PUSH1
        try factory_code.append(@intCast(i));
        try factory_code.append(0x53); // MSTORE8
    }
    
    // Append constructor argument to init code
    const init_size = child_init.items.len;
    try factory_code.append(0x60); // PUSH1
    try factory_code.append(@intCast(init_size)); // offset for constructor arg
    try factory_code.append(0x52); // MSTORE (store 32-byte constructor arg)
    
    // CREATE child contract
    try factory_code.append(0x60); // PUSH1
    try factory_code.append(@intCast(init_size + 32)); // size including constructor arg
    try factory_code.append(0x60); // PUSH1
    try factory_code.append(0x00); // offset
    try factory_code.append(0x60); // PUSH1
    try factory_code.append(0x00); // value
    try factory_code.append(0xF0); // CREATE
    
    // Return created address
    try factory_code.append(0x60); // PUSH1
    try factory_code.append(0x00); // 0
    try factory_code.append(0x52); // MSTORE
    try factory_code.append(0x60); // PUSH1
    try factory_code.append(0x20); // 32
    try factory_code.append(0x60); // PUSH1
    try factory_code.append(0x00); // 0
    try factory_code.append(0xF3); // RETURN
    
    // Deploy factory with initialization value 123
    var deploy_data = std.ArrayList(u8).init(allocator);
    defer deploy_data.deinit();
    try deploy_data.appendSlice(&[32]u8{0} ** 31 ++ [_]u8{123}); // 123 as uint256
    
    const factory_result = try evm_instance.call(.{
        .call = .{
            .caller = Address{0x01} ** 20,
            .to = null, // Contract creation
            .value = 0,
            .input = deploy_data.items,
            .gas = 5_000_000,
        },
    });
    defer if (factory_result.output.len > 0) allocator.free(factory_result.output);
    
    try std.testing.expect(factory_result.success);
    
    // Extract child contract address from output
    var child_address: Address = undefined;
    @memcpy(&child_address, factory_result.output[12..32]); // Address is in bytes 12-31
    
    // Call child contract to verify initialization
    const verify_result = try evm_instance.call(.{
        .call = .{
            .caller = Address{0x01} ** 20,
            .to = child_address,
            .value = 0,
            .input = &[_]u8{},
            .gas = 100_000,
        },
    });
    defer if (verify_result.output.len > 0) allocator.free(verify_result.output);
    
    try std.testing.expect(verify_result.success);
    
    // Verify returned value is 123
    var returned_value: u256 = 0;
    for (verify_result.output) |byte| {
        returned_value = (returned_value << 8) | byte;
    }
    try std.testing.expectEqual(@as(u256, 123), returned_value);
}

test "CREATE interaction - contract creates contract that creates contract" {
    const allocator = std.testing.allocator;
    
    var memory_db = MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    
    const db_interface = memory_db.to_database_interface();
    var evm_instance = try evm.Evm(evm.DefaultEvmConfig).init(
        allocator,
        db_interface,
        block_info.DefaultBlockInfo{
            .number = 1,
            .timestamp = 1000,
            .difficulty = 100,
            .gas_limit = 30_000_000,
            .coinbase = Address{0} ** 20,
            .base_fee = 1_000_000_000,
            .prev_randao = [_]u8{0} ** 32,
        },
        transaction_context.TransactionContext{
            .nonce = 0,
            .gas_price = 20_000_000_000,
            .gas_limit = 20_000_000,
            .to = null,
            .value = 0,
            .data = &[_]u8{},
            .chain_id = 1,
            .origin = Address{0x01} ** 20,
            .blob_hashes = &[_][32]u8{},
            .max_fee_per_blob_gas = null,
        },
        20_000_000_000,
        Address{0x01} ** 20,
        .CANCUN,
    );
    defer evm_instance.deinit();
    
    // Level 3 contract (grandchild): returns constant 99
    const level3_runtime = [_]u8{
        0x60, 0x63, // PUSH1 99
        0x60, 0x00, // PUSH1 0
        0x52,       // MSTORE
        0x60, 0x20, // PUSH1 32
        0x60, 0x00, // PUSH1 0
        0xF3,       // RETURN
    };
    
    // Level 3 init code
    var level3_init = std.ArrayList(u8).init(allocator);
    defer level3_init.deinit();
    for (level3_runtime, 0..) |byte, i| {
        try level3_init.append(0x60); // PUSH1
        try level3_init.append(@intCast(i));
        try level3_init.append(0x60); // PUSH1
        try level3_init.append(byte);
        try level3_init.append(0x53); // MSTORE8
    }
    try level3_init.append(0x60); // PUSH1
    try level3_init.append(@intCast(level3_runtime.len));
    try level3_init.append(0x60); // PUSH1
    try level3_init.append(0x00);
    try level3_init.append(0xF3); // RETURN
    
    // Level 2 contract (child): creates level 3 and returns its address
    var level2_runtime = std.ArrayList(u8).init(allocator);
    defer level2_runtime.deinit();
    
    // Store level 3 init code
    for (level3_init.items, 0..) |byte, i| {
        try level2_runtime.append(0x60); // PUSH1
        try level2_runtime.append(byte);
        try level2_runtime.append(0x60); // PUSH1
        try level2_runtime.append(@intCast(i));
        try level2_runtime.append(0x53); // MSTORE8
    }
    
    // CREATE level 3
    try level2_runtime.append(0x60); // PUSH1
    try level2_runtime.append(@intCast(level3_init.items.len));
    try level2_runtime.append(0x60); // PUSH1
    try level2_runtime.append(0x00); // offset
    try level2_runtime.append(0x60); // PUSH1
    try level2_runtime.append(0x00); // value
    try level2_runtime.append(0xF0); // CREATE
    
    // Return address
    try level2_runtime.append(0x60); // PUSH1
    try level2_runtime.append(0x00); // 0
    try level2_runtime.append(0x52); // MSTORE
    try level2_runtime.append(0x60); // PUSH1
    try level2_runtime.append(0x20); // 32
    try level2_runtime.append(0x60); // PUSH1
    try level2_runtime.append(0x00); // 0
    try level2_runtime.append(0xF3); // RETURN
    
    // Level 2 init code
    var level2_init = std.ArrayList(u8).init(allocator);
    defer level2_init.deinit();
    for (level2_runtime.items, 0..) |byte, i| {
        try level2_init.append(0x60); // PUSH1
        try level2_init.append(@intCast(i));
        try level2_init.append(0x60); // PUSH1
        try level2_init.append(byte);
        try level2_init.append(0x53); // MSTORE8
    }
    try level2_init.append(0x61); // PUSH2
    try level2_init.append(@intCast(level2_runtime.items.len >> 8));
    try level2_init.append(@intCast(level2_runtime.items.len & 0xFF));
    try level2_init.append(0x60); // PUSH1
    try level2_init.append(0x00);
    try level2_init.append(0xF3); // RETURN
    
    // Level 1 contract (parent): creates level 2
    var level1_code = std.ArrayList(u8).init(allocator);
    defer level1_code.deinit();
    
    // Store level 2 init code
    for (level2_init.items, 0..) |byte, i| {
        try level1_code.append(0x60); // PUSH1
        try level1_code.append(byte);
        try level1_code.append(0x61); // PUSH2
        try level1_code.append(@intCast(i >> 8));
        try level1_code.append(@intCast(i & 0xFF));
        try level1_code.append(0x53); // MSTORE8
    }
    
    // CREATE level 2
    try level1_code.append(0x61); // PUSH2
    try level1_code.append(@intCast(level2_init.items.len >> 8));
    try level1_code.append(@intCast(level2_init.items.len & 0xFF));
    try level1_code.append(0x60); // PUSH1
    try level1_code.append(0x00); // offset
    try level1_code.append(0x60); // PUSH1
    try level1_code.append(0x00); // value
    try level1_code.append(0xF0); // CREATE
    
    // Store level 2 address
    try level1_code.append(0x60); // PUSH1
    try level1_code.append(0x00); // slot 0
    try level1_code.append(0x55); // SSTORE
    try level1_code.append(0x00); // STOP
    
    // Execute level 1
    const result1 = try evm_instance.call(.{
        .call = .{
            .caller = Address{0x01} ** 20,
            .to = null,
            .value = 0,
            .input = level1_code.items,
            .gas = 10_000_000,
        },
    });
    defer if (result1.output.len > 0) allocator.free(result1.output);
    
    try std.testing.expect(result1.success);
    
    // Get level 2 address from storage
    const level2_addr_u256 = evm_instance.get_storage(Address{0x01} ** 20, 0);
    var level2_addr: Address = undefined;
    const bytes = std.mem.toBytes(level2_addr_u256);
    @memcpy(&level2_addr, bytes[12..32]);
    
    // Call level 2 to get level 3 address
    const result2 = try evm_instance.call(.{
        .call = .{
            .caller = Address{0x01} ** 20,
            .to = level2_addr,
            .value = 0,
            .input = &[_]u8{},
            .gas = 1_000_000,
        },
    });
    defer if (result2.output.len > 0) allocator.free(result2.output);
    
    try std.testing.expect(result2.success);
    
    // Get level 3 address
    var level3_addr: Address = undefined;
    @memcpy(&level3_addr, result2.output[12..32]);
    
    // Call level 3 to verify it returns 99
    const result3 = try evm_instance.call(.{
        .call = .{
            .caller = Address{0x01} ** 20,
            .to = level3_addr,
            .value = 0,
            .input = &[_]u8{},
            .gas = 100_000,
        },
    });
    defer if (result3.output.len > 0) allocator.free(result3.output);
    
    try std.testing.expect(result3.success);
    
    var returned_value: u256 = 0;
    for (result3.output) |byte| {
        returned_value = (returned_value << 8) | byte;
    }
    try std.testing.expectEqual(@as(u256, 99), returned_value);
}

test "CREATE interaction - created contract modifies parent storage" {
    const allocator = std.testing.allocator;
    
    var memory_db = MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    
    const db_interface = memory_db.to_database_interface();
    var evm_instance = try evm.Evm(evm.DefaultEvmConfig).init(
        allocator,
        db_interface,
        block_info.DefaultBlockInfo{
            .number = 1,
            .timestamp = 1000,
            .difficulty = 100,
            .gas_limit = 30_000_000,
            .coinbase = Address{0} ** 20,
            .base_fee = 1_000_000_000,
            .prev_randao = [_]u8{0} ** 32,
        },
        transaction_context.TransactionContext{
            .nonce = 0,
            .gas_price = 20_000_000_000,
            .gas_limit = 10_000_000,
            .to = null,
            .value = 0,
            .data = &[_]u8{},
            .chain_id = 1,
            .origin = Address{0x01} ** 20,
            .blob_hashes = &[_][32]u8{},
            .max_fee_per_blob_gas = null,
        },
        20_000_000_000,
        Address{0x01} ** 20,
        .CANCUN,
    );
    defer evm_instance.deinit();
    
    // Child contract that calls back to parent
    const child_runtime = [_]u8{
        // Call parent's setValue(42) function
        0x60, 0x2A, // PUSH1 42 (value to set)
        0x60, 0x00, // PUSH1 0
        0x52,       // MSTORE (store at memory[0])
        
        0x60, 0x20, // PUSH1 32 (return data size)
        0x60, 0x00, // PUSH1 0 (return data offset)
        0x60, 0x20, // PUSH1 32 (input size)
        0x60, 0x00, // PUSH1 0 (input offset)
        0x60, 0x00, // PUSH1 0 (value)
        0x33,       // CALLER (parent address)
        0x5A,       // GAS
        0xF1,       // CALL parent
        
        // Return success
        0x60, 0x00, // PUSH1 0
        0x52,       // MSTORE
        0x60, 0x20, // PUSH1 32
        0x60, 0x00, // PUSH1 0
        0xF3,       // RETURN
    };
    
    // Child init code
    var child_init = std.ArrayList(u8).init(allocator);
    defer child_init.deinit();
    for (child_runtime, 0..) |byte, i| {
        try child_init.append(0x60); // PUSH1
        try child_init.append(@intCast(i));
        try child_init.append(0x60); // PUSH1
        try child_init.append(byte);
        try child_init.append(0x53); // MSTORE8
    }
    try child_init.append(0x60); // PUSH1
    try child_init.append(@intCast(child_runtime.len));
    try child_init.append(0x60); // PUSH1
    try child_init.append(0x00);
    try child_init.append(0xF3); // RETURN
    
    // Parent contract with setValue function
    var parent_code = std.ArrayList(u8).init(allocator);
    defer parent_code.deinit();
    
    // Check if being called (calldata size > 0)
    try parent_code.append(0x36); // CALLDATASIZE
    try parent_code.append(0x60); // PUSH1
    try parent_code.append(0x23); // Jump destination for setValue
    try parent_code.append(0x57); // JUMPI
    
    // CREATE path (no calldata)
    // Store child init code
    for (child_init.items, 0..) |byte, i| {
        try parent_code.append(0x60); // PUSH1
        try parent_code.append(byte);
        try parent_code.append(0x60); // PUSH1
        try parent_code.append(@intCast(i));
        try parent_code.append(0x53); // MSTORE8
    }
    
    // CREATE child
    try parent_code.append(0x60); // PUSH1
    try parent_code.append(@intCast(child_init.items.len));
    try parent_code.append(0x60); // PUSH1
    try parent_code.append(0x00); // offset
    try parent_code.append(0x60); // PUSH1
    try parent_code.append(0x00); // value
    try parent_code.append(0xF0); // CREATE
    
    // Store child address at slot 1
    try parent_code.append(0x60); // PUSH1
    try parent_code.append(0x01); // slot 1
    try parent_code.append(0x55); // SSTORE
    try parent_code.append(0x00); // STOP
    
    // setValue function (JUMPDEST at 0x23)
    try parent_code.append(0x5B); // JUMPDEST
    try parent_code.append(0x60); // PUSH1
    try parent_code.append(0x00); // 0
    try parent_code.append(0x35); // CALLDATALOAD (load value)
    try parent_code.append(0x60); // PUSH1
    try parent_code.append(0x00); // slot 0
    try parent_code.append(0x55); // SSTORE
    try parent_code.append(0x00); // STOP
    
    // Deploy parent contract
    const deploy_result = try evm_instance.call(.{
        .call = .{
            .caller = Address{0x01} ** 20,
            .to = null,
            .value = 0,
            .input = parent_code.items,
            .gas = 5_000_000,
        },
    });
    defer if (deploy_result.output.len > 0) allocator.free(deploy_result.output);
    
    try std.testing.expect(deploy_result.success);
    
    // Get parent address (deterministic based on sender nonce)
    const parent_addr = Address{0x01} ** 20; // Simplified for test
    
    // Get child address from parent's storage
    const child_addr_u256 = evm_instance.get_storage(parent_addr, 1);
    var child_addr: Address = undefined;
    const bytes = std.mem.toBytes(child_addr_u256);
    @memcpy(&child_addr, bytes[12..32]);
    
    // Verify parent's value storage is initially 0
    const initial_value = evm_instance.get_storage(parent_addr, 0);
    try std.testing.expectEqual(@as(u256, 0), initial_value);
    
    // Call child contract, which should call back to parent
    const call_result = try evm_instance.call(.{
        .call = .{
            .caller = Address{0x02} ** 20,
            .to = child_addr,
            .value = 0,
            .input = &[_]u8{},
            .gas = 1_000_000,
        },
    });
    defer if (call_result.output.len > 0) allocator.free(call_result.output);
    
    try std.testing.expect(call_result.success);
    
    // Verify parent's storage was modified by child
    const final_value = evm_instance.get_storage(parent_addr, 0);
    try std.testing.expectEqual(@as(u256, 42), final_value);
}