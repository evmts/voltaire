const std = @import("std");
const testing = std.testing;
const evm = @import("evm");
const primitives = @import("primitives");
const Address = primitives.Address;

// Import REVM wrapper from module
const revm_wrapper = @import("revm");

/// Create bytecode for ADD operation that stores result in memory and returns it
fn createAddBytecode(a: u256, b: u256) [75]u8 {
    var bytecode: [75]u8 = undefined;
    var pos: usize = 0;

    // PUSH32 a
    bytecode[pos] = 0x7f;
    pos += 1;
    var a_bytes: [32]u8 = undefined;
    std.mem.writeInt(u256, &a_bytes, a, .big);
    @memcpy(bytecode[pos .. pos + 32], &a_bytes);
    pos += 32;

    // PUSH32 b
    bytecode[pos] = 0x7f;
    pos += 1;
    var b_bytes: [32]u8 = undefined;
    std.mem.writeInt(u256, &b_bytes, b, .big);
    @memcpy(bytecode[pos .. pos + 32], &b_bytes);
    pos += 32;

    // ADD
    bytecode[pos] = 0x01;
    pos += 1;

    // Store result in memory and return it
    // PUSH1 0x00 (memory offset)
    bytecode[pos] = 0x60;
    bytecode[pos + 1] = 0x00;
    pos += 2;

    // MSTORE (store the ADD result in memory)
    bytecode[pos] = 0x52;
    pos += 1;

    // PUSH1 0x20 (32 bytes size)
    bytecode[pos] = 0x60;
    bytecode[pos + 1] = 0x20;
    pos += 2;

    // PUSH1 0x00 (memory offset)
    bytecode[pos] = 0x60;
    bytecode[pos + 1] = 0x00;
    pos += 2;

    // RETURN (return 32 bytes from memory offset 0)
    bytecode[pos] = 0xf3;

    return bytecode;
}

test "ADD opcode: differential test against revm" {
    const allocator = testing.allocator;

    // Test cases for ADD opcode
    const test_cases = [_]struct {
        a: u256,
        b: u256,
        expected: u256,
        desc: []const u8,
    }{
        // Basic cases
        .{ .a = 0, .b = 0, .expected = 0, .desc = "0 + 0 = 0" },
        .{ .a = 1, .b = 1, .expected = 2, .desc = "1 + 1 = 2" },
        .{ .a = 10, .b = 20, .expected = 30, .desc = "10 + 20 = 30" },

        // Large numbers
        .{ .a = std.math.maxInt(u128), .b = 1, .expected = @as(u256, std.math.maxInt(u128)) + 1, .desc = "max_u128 + 1" },

        // Overflow case (wraps around in u256)
        .{ .a = std.math.maxInt(u256), .b = 1, .expected = 0, .desc = "max_u256 + 1 = 0 (overflow)" },
        .{ .a = std.math.maxInt(u256), .b = std.math.maxInt(u256), .expected = std.math.maxInt(u256) - 1, .desc = "max + max = max - 1" },
        };
    
    for (test_cases) |tc| {
        // Create bytecode for ADD operation
        const bytecode = createAddBytecode(tc.a, tc.b);

        // Execute on REVM
        var revm_result = try execute_on_revm(allocator, &bytecode);
        defer revm_result.deinit();

        // Execute on Guillotine
        const guillotine_result = try execute_on_guillotine(allocator, &bytecode);
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
            try testing.expectEqual(tc.expected, revm_value);
        } else {
            // If either failed, print debug info
            std.debug.print("REVM success: {}, Guillotine status: {s}\n", .{ revm_succeeded, @tagName(guillotine_result.status) });
            if (guillotine_result.err) |err| {
                std.debug.print("Guillotine error: {}\n", .{err});
            }
        }

        std.debug.print("✓ ADD test passed: {s}\n", .{tc.desc});
    }
}

/// Execute bytecode on REVM and return the result
fn execute_on_revm(allocator: std.mem.Allocator, bytecode: []const u8) !revm_wrapper.ExecutionResult {
    const settings = revm_wrapper.RevmSettings{};
    var vm = try revm_wrapper.Revm.init(allocator, settings);
    defer vm.deinit();

    const deployer = try Address.from_hex("0x1111111111111111111111111111111111111111");

    // Set balance for deployer
    try vm.setBalance(deployer, 10000000);

    // Deploy the bytecode as a contract
    const result = try vm.create(deployer, 0, bytecode, 1000000);
    return result;
}

/// Execute bytecode on Guillotine EVM and return the result
fn execute_on_guillotine(allocator: std.mem.Allocator, bytecode: []const u8) !evm.RunResult {
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
        bytecode,
        &[_]u8{}, // empty input
        false, // not static
    );
    defer contract.deinit(allocator, null);

    // Set the code for the contract address in EVM state
    try vm_instance.state.set_code(contract_address, bytecode);

    // Execute the contract
    return try vm_instance.interpret(&contract, &[_]u8{}, false);
}
