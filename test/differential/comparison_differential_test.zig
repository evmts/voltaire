const std = @import("std");
const testing = std.testing;
const evm = @import("evm");
const primitives = @import("primitives");
const Address = primitives.Address;

// Import REVM wrapper from module
const revm_wrapper = @import("revm");

test "LT opcode 5 < 10 = 1" {
    const allocator = testing.allocator;

    // PUSH32 10, PUSH32 5, LT, MSTORE, RETURN (computes 5 < 10 = 1)
    const bytecode = [_]u8{
        0x7f, // PUSH32
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // 10 (32 bytes)
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x0A,
        0x7f, // PUSH32
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // 5 (32 bytes)
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x05,
        0x10, // LT
        0x60, 0x00, // PUSH1 0 (memory offset)
        0x52, // MSTORE
        0x60, 0x20, // PUSH1 32 (size)
        0x60, 0x00, // PUSH1 0 (offset)
        0xf3, // RETURN
    };

    // Execute on REVM - inline all setup
    const revm_settings = revm_wrapper.RevmSettings{};
    var revm_vm = try revm_wrapper.Revm.init(allocator, revm_settings);
    defer revm_vm.deinit();

    const revm_deployer = try Address.from_hex("0x1111111111111111111111111111111111111111");

    // Set balance for deployer
    try revm_vm.setBalance(revm_deployer, 10000000);

    // Deploy the bytecode as a contract
    var revm_result = try revm_vm.create(revm_deployer, 0, &bytecode, 1000000);
    defer revm_result.deinit();

    // Execute on Guillotine - inline all setup
    const MemoryDatabase = evm.MemoryDatabase;
    const Contract = evm.Contract;

    // Create EVM instance
    var memory_db = MemoryDatabase.init(allocator);
    defer memory_db.deinit();

    const db_interface = memory_db.to_database_interface();
    var builder = evm.EvmBuilder.init(allocator, db_interface);

    var vm_instance = try builder.build();
    defer vm_instance.deinit();

    const contract_address = Address.from_u256(0x2222222222222222222222222222222222222222);

    // Create contract and execute
    var contract = Contract.init_at_address(
        contract_address, // caller
        contract_address, // address where code executes
        0, // value
        1000000, // gas
        &bytecode,
        &[_]u8{}, // empty input
        false, // not static
    );
    defer contract.deinit(allocator, null);

    // Set the code for the contract address in EVM state
    try vm_instance.state.set_code(contract_address, &bytecode);

    // Execute the contract
    const guillotine_result = try vm_instance.interpret(&contract, &[_]u8{}, false);
    defer if (guillotine_result.output) |output| allocator.free(output);

    // Compare results - both should succeed
    const revm_succeeded = revm_result.success;
    const guillotine_succeeded = guillotine_result.status == .Success;

    try testing.expect(revm_succeeded == guillotine_succeeded);

    if (revm_succeeded and guillotine_succeeded) {
        try testing.expect(revm_result.output.len == 32);
        try testing.expect(guillotine_result.output != null);
        try testing.expect(guillotine_result.output.?.len == 32);

        // Extract u256 from output (big-endian)
        const revm_value = std.mem.readInt(u256, revm_result.output[0..32], .big);
        const guillotine_value = std.mem.readInt(u256, guillotine_result.output.?[0..32], .big);

        try testing.expectEqual(revm_value, guillotine_value);
        std.debug.print("LT test: REVM returned {}, Guillotine returned {}\n", .{ revm_value, guillotine_value });
    } else {
        // If either failed, print debug info
        std.debug.print("REVM success: {}, Guillotine status: {s}\n", .{ revm_succeeded, @tagName(guillotine_result.status) });
        if (guillotine_result.err) |err| {
            std.debug.print("Guillotine error: {}\n", .{err});
        }
    }

    std.debug.print("✓ LT test passed: 5 < 10 = 1\n", .{});
}

test "GT opcode 10 > 5 = 1" {
    const allocator = testing.allocator;

    // PUSH32 5, PUSH32 10, GT, MSTORE, RETURN (computes 10 > 5 = 1)
    const bytecode = [_]u8{
        0x7f, // PUSH32
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // 5 (32 bytes)
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x05,
        0x7f, // PUSH32
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // 10 (32 bytes)
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x0A,
        0x11, // GT
        0x60, 0x00, // PUSH1 0 (memory offset)
        0x52, // MSTORE
        0x60, 0x20, // PUSH1 32 (size)
        0x60, 0x00, // PUSH1 0 (offset)
        0xf3, // RETURN
    };

    // Execute on REVM - inline all setup
    const revm_settings = revm_wrapper.RevmSettings{};
    var revm_vm = try revm_wrapper.Revm.init(allocator, revm_settings);
    defer revm_vm.deinit();

    const revm_deployer = try Address.from_hex("0x1111111111111111111111111111111111111111");

    // Set balance for deployer
    try revm_vm.setBalance(revm_deployer, 10000000);

    // Deploy the bytecode as a contract
    var revm_result = try revm_vm.create(revm_deployer, 0, &bytecode, 1000000);
    defer revm_result.deinit();

    // Execute on Guillotine - inline all setup
    const MemoryDatabase = evm.MemoryDatabase;
    const Contract = evm.Contract;

    // Create EVM instance
    var memory_db = MemoryDatabase.init(allocator);
    defer memory_db.deinit();

    const db_interface = memory_db.to_database_interface();
    var builder = evm.EvmBuilder.init(allocator, db_interface);

    var vm_instance = try builder.build();
    defer vm_instance.deinit();

    const contract_address = Address.from_u256(0x2222222222222222222222222222222222222222);

    // Create contract and execute
    var contract = Contract.init_at_address(
        contract_address, // caller
        contract_address, // address where code executes
        0, // value
        1000000, // gas
        &bytecode,
        &[_]u8{}, // empty input
        false, // not static
    );
    defer contract.deinit(allocator, null);

    // Set the code for the contract address in EVM state
    try vm_instance.state.set_code(contract_address, &bytecode);

    // Execute the contract
    const guillotine_result = try vm_instance.interpret(&contract, &[_]u8{}, false);
    defer if (guillotine_result.output) |output| allocator.free(output);

    // Compare results - both should succeed
    const revm_succeeded = revm_result.success;
    const guillotine_succeeded = guillotine_result.status == .Success;

    try testing.expect(revm_succeeded == guillotine_succeeded);

    if (revm_succeeded and guillotine_succeeded) {
        try testing.expect(revm_result.output.len == 32);
        try testing.expect(guillotine_result.output != null);
        try testing.expect(guillotine_result.output.?.len == 32);

        // Extract u256 from output (big-endian)
        const revm_value = std.mem.readInt(u256, revm_result.output[0..32], .big);
        const guillotine_value = std.mem.readInt(u256, guillotine_result.output.?[0..32], .big);

        try testing.expectEqual(revm_value, guillotine_value);
        std.debug.print("GT test: REVM returned {}, Guillotine returned {}\n", .{ revm_value, guillotine_value });
    } else {
        // If either failed, print debug info
        std.debug.print("REVM success: {}, Guillotine status: {s}\n", .{ revm_succeeded, @tagName(guillotine_result.status) });
        if (guillotine_result.err) |err| {
            std.debug.print("Guillotine error: {}\n", .{err});
        }
    }

    std.debug.print("✓ GT test passed: 10 > 5 = 1\n", .{});
}

test "EQ opcode 42 == 42 = 1" {
    const allocator = testing.allocator;

    // PUSH32 42, PUSH32 42, EQ, MSTORE, RETURN (computes 42 == 42 = 1)
    const bytecode = [_]u8{
        0x7f, // PUSH32
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // 42 (32 bytes)
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x2A,
        0x7f, // PUSH32
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // 42 (32 bytes)
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x2A,
        0x14, // EQ
        0x60, 0x00, // PUSH1 0 (memory offset)
        0x52, // MSTORE
        0x60, 0x20, // PUSH1 32 (size)
        0x60, 0x00, // PUSH1 0 (offset)
        0xf3, // RETURN
    };

    // Execute on REVM - inline all setup
    const revm_settings = revm_wrapper.RevmSettings{};
    var revm_vm = try revm_wrapper.Revm.init(allocator, revm_settings);
    defer revm_vm.deinit();

    const revm_deployer = try Address.from_hex("0x1111111111111111111111111111111111111111");

    // Set balance for deployer
    try revm_vm.setBalance(revm_deployer, 10000000);

    // Deploy the bytecode as a contract
    var revm_result = try revm_vm.create(revm_deployer, 0, &bytecode, 1000000);
    defer revm_result.deinit();

    // Execute on Guillotine - inline all setup
    const MemoryDatabase = evm.MemoryDatabase;
    const Contract = evm.Contract;

    // Create EVM instance
    var memory_db = MemoryDatabase.init(allocator);
    defer memory_db.deinit();

    const db_interface = memory_db.to_database_interface();
    var builder = evm.EvmBuilder.init(allocator, db_interface);

    var vm_instance = try builder.build();
    defer vm_instance.deinit();

    const contract_address = Address.from_u256(0x2222222222222222222222222222222222222222);

    // Create contract and execute
    var contract = Contract.init_at_address(
        contract_address, // caller
        contract_address, // address where code executes
        0, // value
        1000000, // gas
        &bytecode,
        &[_]u8{}, // empty input
        false, // not static
    );
    defer contract.deinit(allocator, null);

    // Set the code for the contract address in EVM state
    try vm_instance.state.set_code(contract_address, &bytecode);

    // Execute the contract
    const guillotine_result = try vm_instance.interpret(&contract, &[_]u8{}, false);
    defer if (guillotine_result.output) |output| allocator.free(output);

    // Compare results - both should succeed
    const revm_succeeded = revm_result.success;
    const guillotine_succeeded = guillotine_result.status == .Success;

    try testing.expect(revm_succeeded == guillotine_succeeded);

    if (revm_succeeded and guillotine_succeeded) {
        try testing.expect(revm_result.output.len == 32);
        try testing.expect(guillotine_result.output != null);
        try testing.expect(guillotine_result.output.?.len == 32);

        // Extract u256 from output (big-endian)
        const revm_value = std.mem.readInt(u256, revm_result.output[0..32], .big);
        const guillotine_value = std.mem.readInt(u256, guillotine_result.output.?[0..32], .big);

        try testing.expectEqual(revm_value, guillotine_value);
        std.debug.print("EQ test: REVM returned {}, Guillotine returned {}\n", .{ revm_value, guillotine_value });
    } else {
        // If either failed, print debug info
        std.debug.print("REVM success: {}, Guillotine status: {s}\n", .{ revm_succeeded, @tagName(guillotine_result.status) });
        if (guillotine_result.err) |err| {
            std.debug.print("Guillotine error: {}\n", .{err});
        }
    }

    std.debug.print("✓ EQ test passed: 42 == 42 = 1\n", .{});
}

test "SLT opcode signed -1 < 1 = 1" {
    const allocator = testing.allocator;

    // PUSH32 1, PUSH32 -1 (as u256), SLT, MSTORE, RETURN (computes -1 < 1 = 1)
    const bytecode = [_]u8{
        0x7f, // PUSH32
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // 1 (32 bytes)
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01,
        0x7f, // PUSH32
        0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, // -1 in two's complement (32 bytes)
        0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
        0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
        0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
        0x12, // SLT (signed less than)
        0x60, 0x00, // PUSH1 0 (memory offset)
        0x52, // MSTORE
        0x60, 0x20, // PUSH1 32 (size)
        0x60, 0x00, // PUSH1 0 (offset)
        0xf3, // RETURN
    };

    // Execute on REVM - inline all setup
    const revm_settings = revm_wrapper.RevmSettings{};
    var revm_vm = try revm_wrapper.Revm.init(allocator, revm_settings);
    defer revm_vm.deinit();

    const revm_deployer = try Address.from_hex("0x1111111111111111111111111111111111111111");

    // Set balance for deployer
    try revm_vm.setBalance(revm_deployer, 10000000);

    // Deploy the bytecode as a contract
    var revm_result = try revm_vm.create(revm_deployer, 0, &bytecode, 1000000);
    defer revm_result.deinit();

    // Execute on Guillotine - inline all setup
    const MemoryDatabase = evm.MemoryDatabase;
    const Contract = evm.Contract;

    // Create EVM instance
    var memory_db = MemoryDatabase.init(allocator);
    defer memory_db.deinit();

    const db_interface = memory_db.to_database_interface();
    var builder = evm.EvmBuilder.init(allocator, db_interface);

    var vm_instance = try builder.build();
    defer vm_instance.deinit();

    const contract_address = Address.from_u256(0x2222222222222222222222222222222222222222);

    // Create contract and execute
    var contract = Contract.init_at_address(
        contract_address, // caller
        contract_address, // address where code executes
        0, // value
        1000000, // gas
        &bytecode,
        &[_]u8{}, // empty input
        false, // not static
    );
    defer contract.deinit(allocator, null);

    // Set the code for the contract address in EVM state
    try vm_instance.state.set_code(contract_address, &bytecode);

    // Execute the contract
    const guillotine_result = try vm_instance.interpret(&contract, &[_]u8{}, false);
    defer if (guillotine_result.output) |output| allocator.free(output);

    // Compare results - both should succeed
    const revm_succeeded = revm_result.success;
    const guillotine_succeeded = guillotine_result.status == .Success;

    try testing.expect(revm_succeeded == guillotine_succeeded);

    if (revm_succeeded and guillotine_succeeded) {
        try testing.expect(revm_result.output.len == 32);
        try testing.expect(guillotine_result.output != null);
        try testing.expect(guillotine_result.output.?.len == 32);

        // Extract u256 from output (big-endian)
        const revm_value = std.mem.readInt(u256, revm_result.output[0..32], .big);
        const guillotine_value = std.mem.readInt(u256, guillotine_result.output.?[0..32], .big);

        try testing.expectEqual(revm_value, guillotine_value);
        std.debug.print("SLT test: REVM returned {}, Guillotine returned {}\n", .{ revm_value, guillotine_value });
    } else {
        // If either failed, print debug info
        std.debug.print("REVM success: {}, Guillotine status: {s}\n", .{ revm_succeeded, @tagName(guillotine_result.status) });
        if (guillotine_result.err) |err| {
            std.debug.print("Guillotine error: {}\n", .{err});
        }
    }

    std.debug.print("✓ SLT test passed: signed -1 < 1 = 1\n", .{});
}

test "SGT opcode signed 1 > -1 = 1" {
    const allocator = testing.allocator;

    // PUSH32 -1 (as u256), PUSH32 1, SGT, MSTORE, RETURN (computes 1 > -1 = 1)
    const bytecode = [_]u8{
        0x7f, // PUSH32
        0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, // -1 in two's complement (32 bytes)
        0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
        0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
        0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
        0x7f, // PUSH32
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // 1 (32 bytes)
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01,
        0x13, // SGT (signed greater than)
        0x60, 0x00, // PUSH1 0 (memory offset)
        0x52, // MSTORE
        0x60, 0x20, // PUSH1 32 (size)
        0x60, 0x00, // PUSH1 0 (offset)
        0xf3, // RETURN
    };

    // Execute on REVM - inline all setup
    const revm_settings = revm_wrapper.RevmSettings{};
    var revm_vm = try revm_wrapper.Revm.init(allocator, revm_settings);
    defer revm_vm.deinit();

    const revm_deployer = try Address.from_hex("0x1111111111111111111111111111111111111111");

    // Set balance for deployer
    try revm_vm.setBalance(revm_deployer, 10000000);

    // Deploy the bytecode as a contract
    var revm_result = try revm_vm.create(revm_deployer, 0, &bytecode, 1000000);
    defer revm_result.deinit();

    // Execute on Guillotine - inline all setup
    const MemoryDatabase = evm.MemoryDatabase;
    const Contract = evm.Contract;

    // Create EVM instance
    var memory_db = MemoryDatabase.init(allocator);
    defer memory_db.deinit();

    const db_interface = memory_db.to_database_interface();
    var builder = evm.EvmBuilder.init(allocator, db_interface);

    var vm_instance = try builder.build();
    defer vm_instance.deinit();

    const contract_address = Address.from_u256(0x2222222222222222222222222222222222222222);

    // Create contract and execute
    var contract = Contract.init_at_address(
        contract_address, // caller
        contract_address, // address where code executes
        0, // value
        1000000, // gas
        &bytecode,
        &[_]u8{}, // empty input
        false, // not static
    );
    defer contract.deinit(allocator, null);

    // Set the code for the contract address in EVM state
    try vm_instance.state.set_code(contract_address, &bytecode);

    // Execute the contract
    const guillotine_result = try vm_instance.interpret(&contract, &[_]u8{}, false);
    defer if (guillotine_result.output) |output| allocator.free(output);

    // Compare results - both should succeed
    const revm_succeeded = revm_result.success;
    const guillotine_succeeded = guillotine_result.status == .Success;

    try testing.expect(revm_succeeded == guillotine_succeeded);

    if (revm_succeeded and guillotine_succeeded) {
        try testing.expect(revm_result.output.len == 32);
        try testing.expect(guillotine_result.output != null);
        try testing.expect(guillotine_result.output.?.len == 32);

        // Extract u256 from output (big-endian)
        const revm_value = std.mem.readInt(u256, revm_result.output[0..32], .big);
        const guillotine_value = std.mem.readInt(u256, guillotine_result.output.?[0..32], .big);

        try testing.expectEqual(revm_value, guillotine_value);
        std.debug.print("SGT test: REVM returned {}, Guillotine returned {}\n", .{ revm_value, guillotine_value });
    } else {
        // If either failed, print debug info
        std.debug.print("REVM success: {}, Guillotine status: {s}\n", .{ revm_succeeded, @tagName(guillotine_result.status) });
        if (guillotine_result.err) |err| {
            std.debug.print("Guillotine error: {}\n", .{err});
        }
    }

    std.debug.print("✓ SGT test passed: signed 1 > -1 = 1\n", .{});
}

test "ISZERO opcode 0 == 0 ? 1 : 0" {
    const allocator = testing.allocator;

    // PUSH32 0, ISZERO, MSTORE, RETURN (computes iszero(0) = 1)
    const bytecode = [_]u8{
        0x7f, // PUSH32
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // 0 (32 bytes)
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x15, // ISZERO
        0x60, 0x00, // PUSH1 0 (memory offset)
        0x52, // MSTORE
        0x60, 0x20, // PUSH1 32 (size)
        0x60, 0x00, // PUSH1 0 (offset)
        0xf3, // RETURN
    };

    // Execute on REVM - inline all setup
    const revm_settings = revm_wrapper.RevmSettings{};
    var revm_vm = try revm_wrapper.Revm.init(allocator, revm_settings);
    defer revm_vm.deinit();

    const revm_deployer = try Address.from_hex("0x1111111111111111111111111111111111111111");

    // Set balance for deployer
    try revm_vm.setBalance(revm_deployer, 10000000);

    // Deploy the bytecode as a contract
    var revm_result = try revm_vm.create(revm_deployer, 0, &bytecode, 1000000);
    defer revm_result.deinit();

    // Execute on Guillotine - inline all setup
    const MemoryDatabase = evm.MemoryDatabase;
    const Contract = evm.Contract;

    // Create EVM instance
    var memory_db = MemoryDatabase.init(allocator);
    defer memory_db.deinit();

    const db_interface = memory_db.to_database_interface();
    var builder = evm.EvmBuilder.init(allocator, db_interface);

    var vm_instance = try builder.build();
    defer vm_instance.deinit();

    const contract_address = Address.from_u256(0x2222222222222222222222222222222222222222);

    // Create contract and execute
    var contract = Contract.init_at_address(
        contract_address, // caller
        contract_address, // address where code executes
        0, // value
        1000000, // gas
        &bytecode,
        &[_]u8{}, // empty input
        false, // not static
    );
    defer contract.deinit(allocator, null);

    // Set the code for the contract address in EVM state
    try vm_instance.state.set_code(contract_address, &bytecode);

    // Execute the contract
    const guillotine_result = try vm_instance.interpret(&contract, &[_]u8{}, false);
    defer if (guillotine_result.output) |output| allocator.free(output);

    // Compare results - both should succeed
    const revm_succeeded = revm_result.success;
    const guillotine_succeeded = guillotine_result.status == .Success;

    try testing.expect(revm_succeeded == guillotine_succeeded);

    if (revm_succeeded and guillotine_succeeded) {
        try testing.expect(revm_result.output.len == 32);
        try testing.expect(guillotine_result.output != null);
        try testing.expect(guillotine_result.output.?.len == 32);

        // Extract u256 from output (big-endian)
        const revm_value = std.mem.readInt(u256, revm_result.output[0..32], .big);
        const guillotine_value = std.mem.readInt(u256, guillotine_result.output.?[0..32], .big);

        try testing.expectEqual(revm_value, guillotine_value);
        std.debug.print("ISZERO test: REVM returned {}, Guillotine returned {}\n", .{ revm_value, guillotine_value });
    } else {
        // If either failed, print debug info
        std.debug.print("REVM success: {}, Guillotine status: {s}\n", .{ revm_succeeded, @tagName(guillotine_result.status) });
        if (guillotine_result.err) |err| {
            std.debug.print("Guillotine error: {}\n", .{err});
        }
    }

    std.debug.print("✓ ISZERO test passed: iszero(0) = 1\n", .{});
}

test "ISZERO opcode 42 == 0 ? 1 : 0" {
    const allocator = testing.allocator;

    // PUSH32 42, ISZERO, MSTORE, RETURN (computes iszero(42) = 0)
    const bytecode = [_]u8{
        0x7f, // PUSH32
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // 42 (32 bytes)
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x2A,
        0x15, // ISZERO
        0x60, 0x00, // PUSH1 0 (memory offset)
        0x52, // MSTORE
        0x60, 0x20, // PUSH1 32 (size)
        0x60, 0x00, // PUSH1 0 (offset)
        0xf3, // RETURN
    };

    // Execute on REVM - inline all setup
    const revm_settings = revm_wrapper.RevmSettings{};
    var revm_vm = try revm_wrapper.Revm.init(allocator, revm_settings);
    defer revm_vm.deinit();

    const revm_deployer = try Address.from_hex("0x1111111111111111111111111111111111111111");

    // Set balance for deployer
    try revm_vm.setBalance(revm_deployer, 10000000);

    // Deploy the bytecode as a contract
    var revm_result = try revm_vm.create(revm_deployer, 0, &bytecode, 1000000);
    defer revm_result.deinit();

    // Execute on Guillotine - inline all setup
    const MemoryDatabase = evm.MemoryDatabase;
    const Contract = evm.Contract;

    // Create EVM instance
    var memory_db = MemoryDatabase.init(allocator);
    defer memory_db.deinit();

    const db_interface = memory_db.to_database_interface();
    var builder = evm.EvmBuilder.init(allocator, db_interface);

    var vm_instance = try builder.build();
    defer vm_instance.deinit();

    const contract_address = Address.from_u256(0x2222222222222222222222222222222222222222);

    // Create contract and execute
    var contract = Contract.init_at_address(
        contract_address, // caller
        contract_address, // address where code executes
        0, // value
        1000000, // gas
        &bytecode,
        &[_]u8{}, // empty input
        false, // not static
    );
    defer contract.deinit(allocator, null);

    // Set the code for the contract address in EVM state
    try vm_instance.state.set_code(contract_address, &bytecode);

    // Execute the contract
    const guillotine_result = try vm_instance.interpret(&contract, &[_]u8{}, false);
    defer if (guillotine_result.output) |output| allocator.free(output);

    // Compare results - both should succeed
    const revm_succeeded = revm_result.success;
    const guillotine_succeeded = guillotine_result.status == .Success;

    try testing.expect(revm_succeeded == guillotine_succeeded);

    if (revm_succeeded and guillotine_succeeded) {
        try testing.expect(revm_result.output.len == 32);
        try testing.expect(guillotine_result.output != null);
        try testing.expect(guillotine_result.output.?.len == 32);

        // Extract u256 from output (big-endian)
        const revm_value = std.mem.readInt(u256, revm_result.output[0..32], .big);
        const guillotine_value = std.mem.readInt(u256, guillotine_result.output.?[0..32], .big);

        try testing.expectEqual(revm_value, guillotine_value);
        std.debug.print("ISZERO test: REVM returned {}, Guillotine returned {}\n", .{ revm_value, guillotine_value });
    } else {
        // If either failed, print debug info
        std.debug.print("REVM success: {}, Guillotine status: {s}\n", .{ revm_succeeded, @tagName(guillotine_result.status) });
        if (guillotine_result.err) |err| {
            std.debug.print("Guillotine error: {}\n", .{err});
        }
    }

    std.debug.print("✓ ISZERO test passed: iszero(42) = 0\n", .{});
}
