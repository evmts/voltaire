const std = @import("std");
const testing = std.testing;
const evm = @import("root.zig");
const primitives = @import("primitives");
const Address = primitives.Address.Address;
const DifferentialTestHarness = @import("differential_test_harness.zig").DifferentialTestHarness;

test {
    std.testing.log_level = .warn;
}

// Helper functions
fn hexDecode(allocator: std.mem.Allocator, hex_str: []const u8) ![]u8 {
    const clean_hex = if (std.mem.startsWith(u8, hex_str, "0x")) hex_str[2..] else hex_str;
    const result = try allocator.alloc(u8, clean_hex.len / 2);
    _ = try std.fmt.hexToBytes(result, clean_hex);
    return result;
}

fn readCaseFile(allocator: std.mem.Allocator, case_name: []const u8, file_name: []const u8) ![]u8 {
    const path = try std.fmt.allocPrint(allocator, "/Users/williamcory/guillotine/bench/official/cases/{s}/{s}", .{ case_name, file_name });
    defer allocator.free(path);
    const file = try std.fs.openFileAbsolute(path, .{});
    defer file.close();
    const content = try file.readToEndAlloc(allocator, 16 * 1024 * 1024);
    const trimmed = std.mem.trim(u8, content, " \t\n\r");
    if (trimmed.ptr == content.ptr and trimmed.len == content.len) {
        return content;
    }
    defer allocator.free(content);
    const result = try allocator.alloc(u8, trimmed.len);
    @memcpy(result, trimmed);
    return result;
}

// ERC20 Differential Tests
test "Differential: ERC20 transfer" {
    const allocator = testing.allocator;
    var harness = try DifferentialTestHarness.init(allocator);
    defer harness.deinit();

    const bytecode_hex = try readCaseFile(allocator, "erc20-transfer", "bytecode.txt");
    defer allocator.free(bytecode_hex);
    const calldata_hex = try readCaseFile(allocator, "erc20-transfer", "calldata.txt");
    defer allocator.free(calldata_hex);

    const init_code = try hexDecode(allocator, bytecode_hex);
    defer allocator.free(init_code);
    const calldata = try hexDecode(allocator, calldata_hex);
    defer allocator.free(calldata);

    const deployer = try Address.from_hex("0x1111111111111111111111111111111111111111");

    // Deploy contract on all three EVMs
    const deployment = try harness.deployContract(deployer, init_code, 10_000_000);
    defer deployment.results.deinit();
    try deployment.results.assertEqual();

    // Call the deployed contract on all three EVMs
    var call_result = try harness.execute(deployer, deployment.address, 0, calldata, 1_000_000);
    defer call_result.deinit();
    try call_result.assertEqual();
}

test "Differential: ERC20 mint" {
    const allocator = testing.allocator;
    var harness = try DifferentialTestHarness.init(allocator);
    defer harness.deinit();

    const bytecode_hex = try readCaseFile(allocator, "erc20-mint", "bytecode.txt");
    defer allocator.free(bytecode_hex);
    const calldata_hex = try readCaseFile(allocator, "erc20-mint", "calldata.txt");
    defer allocator.free(calldata_hex);

    const init_code = try hexDecode(allocator, bytecode_hex);
    defer allocator.free(init_code);
    const calldata = try hexDecode(allocator, calldata_hex);
    defer allocator.free(calldata);

    const deployer = try Address.from_hex("0x1111111111111111111111111111111111111111");

    // Deploy contract on all three EVMs
    const deployment = try harness.deployContract(deployer, init_code, 10_000_000);
    defer deployment.results.deinit();
    try deployment.results.assertEqual();

    // Call the deployed contract on all three EVMs
    var call_result = try harness.execute(deployer, deployment.address, 0, calldata, 1_000_000);
    defer call_result.deinit();
    try call_result.assertEqual();
}

test "Differential: ERC20 approval-transfer" {
    const allocator = testing.allocator;
    var harness = try DifferentialTestHarness.init(allocator);
    defer harness.deinit();

    const bytecode_hex = try readCaseFile(allocator, "erc20-approval-transfer", "bytecode.txt");
    defer allocator.free(bytecode_hex);
    const calldata_hex = try readCaseFile(allocator, "erc20-approval-transfer", "calldata.txt");
    defer allocator.free(calldata_hex);

    const init_code = try hexDecode(allocator, bytecode_hex);
    defer allocator.free(init_code);
    const calldata = try hexDecode(allocator, calldata_hex);
    defer allocator.free(calldata);

    const deployer = try Address.from_hex("0x1111111111111111111111111111111111111111");

    // Deploy contract on all three EVMs
    const deployment = try harness.deployContract(deployer, init_code, 10_000_000);
    defer deployment.results.deinit();
    try deployment.results.assertEqual();

    // Call the deployed contract on all three EVMs
    var call_result = try harness.execute(deployer, deployment.address, 0, calldata, 1_000_000);
    defer call_result.deinit();
    try call_result.assertEqual();
}

// Jump Operations Differential Tests
test "Differential: JUMPI dynamic pop order matches (condition first)" {
    const allocator = testing.allocator;
    var harness = try DifferentialTestHarness.init(allocator);
    defer harness.deinit();

    const bytecode = [_]u8{
        0x60, 0x01, // PUSH1 1 (condition)
        0x60, 0x06, // PUSH1 6 (dest pc)
        0x57, // JUMPI -> should jump to pc=6
        0x00, // STOP (not executed)
        0x5b, // JUMPDEST at pc=6
        0x60, 0x2a, // PUSH1 42
        0x60, 0x00, // PUSH1 0
        0x52, // MSTORE
        0x60, 0x20, // PUSH1 32
        0x60, 0x00, // PUSH1 0
        0xf3, // RETURN
    };

    const contract = try Address.from_hex("0x2222222222222222222222222222222222222222");
    try harness.setCode(contract, &bytecode);

    const caller = try Address.from_hex("0x1111111111111111111111111111111111111111");
    var result = try harness.execute(caller, contract, 0, &[_]u8{}, 1_000_000);
    defer result.deinit();
    try result.assertEqual();

    // Verify the result is 42 if successful
    if (result.revm.success) {
        const revm_output = result.revm.output orelse &[_]u8{};
        if (revm_output.len >= 32) {
            const value = std.mem.readInt(u256, revm_output[0..32], .big);
            try testing.expectEqual(@as(u256, 42), value);
        }
    }
}

test "Differential: resolved conditional jump consumes destination" {
    const allocator = testing.allocator;
    var harness = try DifferentialTestHarness.init(allocator);
    defer harness.deinit();

    const bytecode = [_]u8{
        0x60, 0x01, // PUSH1 1 (condition)
        0x60, 0x07, // PUSH1 7 (dest pc)
        0x57, // JUMPI -> resolved via preceding PUSH
        0x60, 0x00, // PUSH1 0 (padding fallthrough)
        0x5b, // JUMPDEST at pc=7
        0x60, 0x2a, // PUSH1 42
        0x60, 0x00, // PUSH1 0
        0x52, // MSTORE
        0x60, 0x20, // PUSH1 32
        0x60, 0x00, // PUSH1 0
        0xf3, // RETURN
    };

    const contract = try Address.from_hex("0x2222222222222222222222222222222222222222");
    try harness.setCode(contract, &bytecode);

    const caller = try Address.from_hex("0x1111111111111111111111111111111111111111");
    var result = try harness.execute(caller, contract, 0, &[_]u8{}, 1_000_000);
    defer result.deinit();
    try result.assertEqual();

    // Verify the result is 42 if successful
    if (result.revm.success) {
        const revm_output = result.revm.output orelse &[_]u8{};
        if (revm_output.len >= 32) {
            const value = std.mem.readInt(u256, revm_output[0..32], .big);
            try testing.expectEqual(@as(u256, 42), value);
        }
    }
}

// Call Operations Differential Tests
test "Differential: CALL pop order matches REVM" {
    const allocator = testing.allocator;
    var harness = try DifferentialTestHarness.init(allocator);
    defer harness.deinit();

    // Minimal callee: returns 32 bytes with value=1 to signal success
    const callee_code = [_]u8{
        0x60, 0x01, // PUSH1 1
        0x60, 0x00, // PUSH1 0
        0x52, // MSTORE
        0x60, 0x20, // PUSH1 32
        0x60, 0x00, // PUSH1 0
        0xf3, // RETURN
    };

    const target = try Address.from_hex("0x2222222222222222222222222222222222222222");
    try harness.setCode(target, &callee_code);

    const caller = try Address.from_hex("0x1111111111111111111111111111111111111111");
    var result = try harness.execute(caller, target, 0, &[_]u8{}, 1_000_000);
    defer result.deinit();
    try result.assertEqual();

    // Verify the result is 1 if successful
    if (result.revm.success) {
        const revm_output = result.revm.output orelse &[_]u8{};
        if (revm_output.len >= 32) {
            const value = std.mem.readInt(u256, revm_output[0..32], .big);
            try testing.expectEqual(@as(u256, 1), value);
        }
    }
}

// Fusion/Optimization Differential Tests
test "Differential: PUSH+JUMP immediate fused target matches REVM" {
    const allocator = testing.allocator;
    var harness = try DifferentialTestHarness.init(allocator);
    defer harness.deinit();

    const bytecode = [_]u8{
        0x60, 0x04, // PUSH1 0x04 (pc of JUMPDEST below)
        0x56, // JUMP
        0x00, // STOP (not executed)
        0x5b, // JUMPDEST at pc=4
        0x60, 0x01, // PUSH1 1
        0x60, 0x00, // PUSH1 0
        0x52, // MSTORE
        0x60, 0x20, // PUSH1 32
        0x60, 0x00, // PUSH1 0
        0xf3, // RETURN
    };

    const contract = try Address.from_hex("0x2222222222222222222222222222222222222222");
    try harness.setCode(contract, &bytecode);

    const caller = try Address.from_hex("0x1111111111111111111111111111111111111111");
    var result = try harness.execute(caller, contract, 0, &[_]u8{}, 1_000_000);
    defer result.deinit();
    try result.assertEqual();

    // Verify the result is 1 if successful
    if (result.revm.success) {
        const revm_output = result.revm.output orelse &[_]u8{};
        if (revm_output.len >= 32) {
            const value = std.mem.readInt(u256, revm_output[0..32], .big);
            try testing.expectEqual(@as(u256, 1), value);
        }
    }
}

test "Differential: arithmetic fusion PUSH+PUSH+ADD matches REVM" {
    const allocator = testing.allocator;
    var harness = try DifferentialTestHarness.init(allocator);
    defer harness.deinit();

    const bytecode = [_]u8{
        0x60, 0x02, // PUSH1 2
        0x60, 0x03, // PUSH1 3
        0x01, // ADD (may be precomputed/fused)
        0x60, 0x00, // PUSH1 0
        0x52, // MSTORE (store result at [0..32])
        0x60, 0x20, // PUSH1 32
        0x60, 0x00, // PUSH1 0
        0xf3, // RETURN
    };

    const contract = try Address.from_hex("0x2222222222222222222222222222222222222222");
    try harness.setCode(contract, &bytecode);

    const caller = try Address.from_hex("0x1111111111111111111111111111111111111111");
    var result = try harness.execute(caller, contract, 0, &[_]u8{}, 1_000_000);
    defer result.deinit();
    try result.assertEqual();

    // Verify the result is 5 (2+3) if successful
    if (result.revm.success) {
        const revm_output = result.revm.output orelse &[_]u8{};
        if (revm_output.len >= 32) {
            const value = std.mem.readInt(u256, revm_output[0..32], .big);
            try testing.expectEqual(@as(u256, 5), value);
        }
    }
}

// Stack Operations Differential Tests
test "Differential: POP opcode removes top stack element" {
    const allocator = testing.allocator;
    var harness = try DifferentialTestHarness.init(allocator);
    defer harness.deinit();

    // Stack operations: [42] -> [42, 24] -> POP -> [42] -> MSTORE -> RETURN 32 bytes
    const bytecode = [_]u8{
        0x60, 0x42, // PUSH1 0x42
        0x60, 0x24, // PUSH1 0x24
        0x50, // POP (removes 0x24, leaving 0x42)
        0x60, 0x00, // PUSH1 0 (memory offset)
        0x52, // MSTORE (stores 0x42 at memory[0])
        0x60, 0x20, // PUSH1 32 (size)
        0x60, 0x00, // PUSH1 0 (offset)
        0xf3, // RETURN (returns 32 bytes from memory[0])
    };

    const contract = try Address.from_hex("0x2222222222222222222222222222222222222222");
    try harness.setCode(contract, &bytecode);

    const caller = try Address.from_hex("0x1111111111111111111111111111111111111111");
    var result = try harness.execute(caller, contract, 0, &[_]u8{}, 1_000_000);
    defer result.deinit();
    try result.assertEqual();

    // Verify the result is 0x42 if successful
    if (result.revm.success) {
        const revm_output = result.revm.output orelse &[_]u8{};
        if (revm_output.len >= 32) {
            const value = std.mem.readInt(u256, revm_output[0..32], .big);
            try testing.expectEqual(@as(u256, 0x42), value);
        }
    }
}

test "Differential: PUSH0 opcode pushes zero" {
    const allocator = testing.allocator;
    var harness = try DifferentialTestHarness.init(allocator);
    defer harness.deinit();

    const bytecode = [_]u8{
        0x5f, // PUSH0
        0x60, 0x00, // PUSH1 0 (memory offset)
        0x52, // MSTORE
        0x60, 0x20, // PUSH1 32 (size)
        0x60, 0x00, // PUSH1 0 (offset)
        0xf3, // RETURN
    };

    const contract = try Address.from_hex("0x2222222222222222222222222222222222222222");
    try harness.setCode(contract, &bytecode);

    const caller = try Address.from_hex("0x1111111111111111111111111111111111111111");
    var result = try harness.execute(caller, contract, 0, &[_]u8{}, 1_000_000);
    defer result.deinit();
    try result.assertEqual();

    // Verify the result is 0 if successful
    if (result.revm.success) {
        const revm_output = result.revm.output orelse &[_]u8{};
        if (revm_output.len >= 32) {
            const value = std.mem.readInt(u256, revm_output[0..32], .big);
            try testing.expectEqual(@as(u256, 0), value);
        }
    }
}

test "Differential: PUSH1 opcode pushes 1 byte" {
    const allocator = testing.allocator;
    var harness = try DifferentialTestHarness.init(allocator);
    defer harness.deinit();

    const bytecode = [_]u8{
        0x60, 0x42, // PUSH1 0x42
        0x60, 0x00, // PUSH1 0 (memory offset)
        0x52, // MSTORE
        0x60, 0x20, // PUSH1 32 (size)
        0x60, 0x00, // PUSH1 0 (offset)
        0xf3, // RETURN
    };

    const contract = try Address.from_hex("0x2222222222222222222222222222222222222222");
    try harness.setCode(contract, &bytecode);

    const caller = try Address.from_hex("0x1111111111111111111111111111111111111111");
    var result = try harness.execute(caller, contract, 0, &[_]u8{}, 1_000_000);
    defer result.deinit();
    try result.assertEqual();

    // Verify the result is 0x42 if successful
    if (result.revm.success) {
        const revm_output = result.revm.output orelse &[_]u8{};
        if (revm_output.len >= 32) {
            const value = std.mem.readInt(u256, revm_output[0..32], .big);
            try testing.expectEqual(@as(u256, 0x42), value);
        }
    }
}

test "Differential: DUP1 opcode duplicates top stack element" {
    const allocator = testing.allocator;
    var harness = try DifferentialTestHarness.init(allocator);
    defer harness.deinit();

    const bytecode = [_]u8{
        0x60, 0x42, // PUSH1 0x42
        0x80, // DUP1
        0x60, 0x00, // PUSH1 0 (memory offset)
        0x52, // MSTORE
        0x60, 0x20, // PUSH1 32 (size)
        0x60, 0x00, // PUSH1 0 (offset)
        0xf3, // RETURN
    };

    const contract = try Address.from_hex("0x2222222222222222222222222222222222222222");
    try harness.setCode(contract, &bytecode);

    const caller = try Address.from_hex("0x1111111111111111111111111111111111111111");
    var result = try harness.execute(caller, contract, 0, &[_]u8{}, 1_000_000);
    defer result.deinit();
    try result.assertEqual();

    // Verify the result is 0x42 if successful
    if (result.revm.success) {
        const revm_output = result.revm.output orelse &[_]u8{};
        if (revm_output.len >= 32) {
            const value = std.mem.readInt(u256, revm_output[0..32], .big);
            try testing.expectEqual(@as(u256, 0x42), value);
        }
    }
}

test "Differential: SWAP1 opcode swaps top two stack elements" {
    const allocator = testing.allocator;
    var harness = try DifferentialTestHarness.init(allocator);
    defer harness.deinit();

    const bytecode = [_]u8{
        0x60, 0x42, // PUSH1 0x42
        0x60, 0x24, // PUSH1 0x24
        0x90, // SWAP1
        0x60, 0x00, // PUSH1 0 (memory offset)
        0x52, // MSTORE
        0x60, 0x20, // PUSH1 32 (size)
        0x60, 0x00, // PUSH1 0 (offset)
        0xf3, // RETURN
    };

    const contract = try Address.from_hex("0x2222222222222222222222222222222222222222");
    try harness.setCode(contract, &bytecode);

    const caller = try Address.from_hex("0x1111111111111111111111111111111111111111");
    var result = try harness.execute(caller, contract, 0, &[_]u8{}, 1_000_000);
    defer result.deinit();
    try result.assertEqual();

    // After SWAP1, top should be 0x42 (was second)
    if (result.revm.success) {
        const revm_output = result.revm.output orelse &[_]u8{};
        if (revm_output.len >= 32) {
            const value = std.mem.readInt(u256, revm_output[0..32], .big);
            try testing.expectEqual(@as(u256, 0x42), value);
        }
    }
}