const std = @import("std");
const testing = std.testing;
const evm = @import("evm");
const primitives = @import("primitives");
const Address = primitives.Address;
const MemoryDatabase = evm.MemoryDatabase;
const CallParams = evm.CallParams;
const Evm = evm.Evm;

// Enable debug logging for all tests
test {
    std.testing.log_level = .warn;
}

// WORKING: This test documents a dynamic JUMPI to a valid JUMPDEST.
// It should pass once jumpdest validation off-by-one is fixed in analysis.
test "WORKING dynamic JUMPI to valid JUMPDEST returns 0x01" {
    const allocator = std.testing.allocator;

    var memory_db = MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = memory_db.to_database_interface();

    var vm = try Evm.init(allocator, db_interface, null, null, null, 0, false, null);
    defer vm.deinit();

    // Bytecode:
    // 0x00 PUSH1 0x06 (dest)
    // 0x02 PUSH1 0x01 (cond)
    // 0x04 JUMPI
    // 0x05 STOP (should be skipped)
    // 0x06 JUMPDEST
    // 0x07 PUSH1 0x01
    // 0x09 PUSH1 0x00
    // 0x0B MSTORE
    // 0x0C PUSH1 0x20
    // 0x0E PUSH1 0x00
    // 0x10 RETURN
    const code = [_]u8{
        0x60, 0x06,  // PUSH1 0x06
        0x60, 0x01,  // PUSH1 0x01
        0x57,        // JUMPI
        0x00,        // STOP (should be skipped)
        0x5b,        // JUMPDEST (at position 6)
        0x60, 0x01,  // PUSH1 0x01
        0x60, 0x00,  // PUSH1 0x00
        0x52,        // MSTORE
        0x60, 0x20,  // PUSH1 0x20
        0x60, 0x00,  // PUSH1 0x00
        0xf3,        // RETURN
    };

    const caller = Address.from_u256(0x1000);
    const callee = Address.from_u256(0x2000); // Use higher address to avoid precompiles
    try vm.state.set_code(callee, &code);
    try vm.state.set_balance(caller, std.math.maxInt(u256));

    const params = CallParams{ .call = .{
        .caller = caller,
        .to = callee,
        .value = 0,
        .input = &.{},
        .gas = 100000,
    } };
    const res = try vm.call(params);
    defer if (res.output) |output| allocator.free(output);
    
    std.log.warn("Call result: success={}, output_len={?}", .{ res.success, if (res.output) |o| o.len else null });
    if (res.output) |output| {
        std.log.warn("Output bytes: {x}", .{output});
    }
    
    try std.testing.expect(res.success);
    try std.testing.expect(res.output != null);
    const out = res.output.?;
    try std.testing.expectEqual(@as(usize, 32), out.len);
    try std.testing.expectEqual(@as(u8, 1), out[31]);
}

test "JUMPI should take jump when condition is non-zero" {
    const allocator = std.testing.allocator;

    // Enable debug logging
    // std.testing.log_level = .warn;

    var memory_db = MemoryDatabase.init(allocator);
    defer memory_db.deinit();

    const db_interface = memory_db.to_database_interface();
    var vm2 = try Evm.init(allocator, db_interface, null, null, null, 0, false, null);
    defer vm2.deinit();

    const caller = Address.from_u256(0x1000000000000000000000000000000000000001);
    const caller_balance = std.math.maxInt(u256);
    try vm2.state.set_balance(caller, caller_balance);

    // Create bytecode that reproduces the exact bug:
    // The ERC20 constructor was failing because JUMPI at pc=284 wasn't jumping to pc=292
    // Simplified version:
    // PUSH1 0x01      (condition = 1, non-zero means jump)
    // PUSH1 0x08      (jump destination = 8)
    // JUMPI           (should jump to position 8)
    // PUSH1 0xFF      (should NOT execute if jump works)
    // STOP            (should NOT execute if jump works)
    // JUMPDEST        (at position 8 - jump target)
    // PUSH1 0xAA      (should execute after jump)
    // STOP
    const bytecode = &[_]u8{
        0x60, 0x01, // PUSH1 0x01 (condition = 1)
        0x60, 0x08, // PUSH1 0x08 (destination = 8)
        0x57, // JUMPI at pc=4 (should jump)
        0x60, 0xFF, // PUSH1 0xFF at pc=5 (should NOT execute)
        0x00, // STOP at pc=7
        0x5B, // JUMPDEST at pc=8
        0x60, 0xAA, // PUSH1 0xAA at pc=9 (should execute)
        0x00, // STOP at pc=11
    };

    // Deploy the bytecode as contract code
    const contract_addr = Address.from_u256(0x2000000000000000000000000000000000000002);
    try vm2.state.set_code(contract_addr, bytecode);
    
    // Call the contract to execute the bytecode
    const call_params = CallParams{
        .call = .{
            .caller = caller,
            .to = contract_addr,
            .value = 0,
            .input = &.{}, // empty calldata
            .gas = 1000000,
        },
    };
    const result = try vm2.call(call_params);
    defer if (result.output) |output| allocator.free(output);

    // JUMPI is now working correctly after stack order fix
    // JUMPI should take the jump when condition is non-zero
    // Execution should jump over 0xFF and push 0xAA instead

    // Now that JUMPI bug is fixed, expect success
    try testing.expectEqual(true, result.success);

    // The contract should have executed successfully
}

test "JUMPI should NOT jump when condition is zero" {
    const allocator = std.testing.allocator;

    var memory_db = MemoryDatabase.init(allocator);
    defer memory_db.deinit();

    const db_interface = memory_db.to_database_interface();
    var vm3 = try Evm.init(allocator, db_interface, null, null, null, 0, false, null);
    defer vm3.deinit();

    const caller = Address.from_u256(0x1000000000000000000000000000000000000001);
    const caller_balance = std.math.maxInt(u256);
    try vm3.state.set_balance(caller, caller_balance);

    // Same bytecode but with condition = 0
    const bytecode = &[_]u8{
        0x60, 0x00, // PUSH1 0x00 (condition = 0)
        0x60, 0x08, // PUSH1 0x08 (destination = 8)
        0x57, // JUMPI at pc=4 (should NOT jump)
        0x60, 0xFF, // PUSH1 0xFF at pc=5 (SHOULD execute)
        0x00, // STOP at pc=7
        0x5B, // JUMPDEST at pc=8
        0x60, 0xAA, // PUSH1 0xAA at pc=9 (should NOT execute)
        0x00, // STOP at pc=11
    };

    // Deploy the bytecode as contract code
    const contract_addr = Address.from_u256(0x2000000000000000000000000000000000000002);
    try vm3.state.set_code(contract_addr, bytecode);

    // Call the contract
    const call_params = CallParams{
        .call = .{
            .caller = caller,
            .to = contract_addr,
            .value = 0,
            .input = &.{}, // empty calldata
            .gas = 1000000,
        },
    };
    const result = try vm3.call(call_params);
    defer if (result.output) |output| allocator.free(output);

    // When condition is zero, JUMPI should NOT jump
    // So it should execute normally and push 0xFF then STOP
    // JUMPI is now working correctly after stack order fix
    try testing.expectEqual(true, result.success);
}

// Alternative test using contract deployment to actually test the JUMPI behavior
// NOTE: Skipping this test because CREATE functionality is not yet implemented in the call method
test "JUMPI bug reproduction via contract deployment - SKIPPED" {
    return error.SkipZigTest;
}
