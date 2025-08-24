const std = @import("std");
const testing = std.testing;
const evm = @import("root.zig");
const primitives = @import("primitives");
const Address = primitives.Address;

test {
    std.testing.log_level = .warn;
}

// Helper to decode hex strings
fn hexDecode(allocator: std.mem.Allocator, hex_str: []const u8) ![]u8 {
    const clean_hex = if (std.mem.startsWith(u8, hex_str, "0x")) hex_str[2..] else hex_str;
    const result = try allocator.alloc(u8, clean_hex.len / 2);
    _ = try std.fmt.hexToBytes(result, clean_hex);
    return result;
}

// Helper to create address from hex string
fn addressFromHex(hex: []const u8) Address {
    const clean_hex = if (std.mem.startsWith(u8, hex, "0x")) hex[2..] else hex;
    var addr: [20]u8 = undefined;
    _ = std.fmt.hexToBytes(&addr, clean_hex) catch unreachable;
    return addr;
}

fn readCaseFile(allocator: std.mem.Allocator, comptime case_name: []const u8, comptime file_name: []const u8) ![]u8 {
    const path = "/Users/williamcory/guillotine/bench/official/cases/" ++ case_name ++ "/" ++ file_name;
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

fn deploy(vm: *evm.Evm, caller: Address, bytecode: []const u8) !Address {
    const create_result = try vm.create_contract(caller, 0, bytecode, 10_000_000);
    if (!create_result.success) {
        std.debug.print("TEST FAILURE: deploy failed, success=false, gas_left={}\n", .{create_result.gas_left});
        return error.DeploymentFailed;
    }
    return create_result.address;
}

test "E2E Simple: Basic contract deployment and execution" {
    const allocator = std.testing.allocator;

    // Simple contract that returns the number 42 (PUSH1 42, PUSH1 0, MSTORE, PUSH1 32, PUSH1 0, RETURN)
    const simple_bytecode = try hexDecode(allocator, "602a60005260206000f3");
    defer allocator.free(simple_bytecode);

    // Set up VM
    var memory_db = evm.MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = memory_db.to_database_interface();

    var vm = try evm.Evm.init(allocator, db_interface, null, null, null, null);
    defer vm.deinit();

    // Caller and funding
    const caller = primitives.Address.from_u256(0x1000000000000000000000000000000000000001);
    try vm.state.set_balance(caller, std.math.maxInt(u256));

    // Deploy and call
    const contract_address = try deploy(&vm, caller, simple_bytecode);
    const params = evm.CallParams{ .call = .{
        .caller = caller,
        .to = contract_address,
        .value = 0,
        .input = &[_]u8{},
        .gas = 100_000,
    } };
    const result = try vm.call(params);

    try std.testing.expect(result.success);
    if (result.output) |output| {
        try std.testing.expect(output.len == 32);
        // Check that the last byte is 42 (0x2a)
        try std.testing.expect(output[31] == 42);
    }
}

test "E2E Simple: ERC20 basic functionality" {
    const allocator = std.testing.allocator;

    // Load a real ERC20 test case
    const bytecode_hex = try readCaseFile(allocator, "erc20-transfer", "bytecode.txt");
    defer allocator.free(bytecode_hex);
    const calldata_hex = try readCaseFile(allocator, "erc20-transfer", "calldata.txt");
    defer allocator.free(calldata_hex);

    const bytecode = try hexDecode(allocator, bytecode_hex);
    defer allocator.free(bytecode);
    const calldata = try hexDecode(allocator, calldata_hex);
    defer allocator.free(calldata);

    // Set up VM
    var memory_db = evm.MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = memory_db.to_database_interface();

    var vm = try evm.Evm.init(allocator, db_interface, null, null, null, null);
    defer vm.deinit();

    const caller = primitives.Address.from_u256(0x1000000000000000000000000000000000000001);
    try vm.state.set_balance(caller, std.math.maxInt(u256));

    // Deploy and call
    const contract_address = try deploy(&vm, caller, bytecode);
    const params = evm.CallParams{ .call = .{
        .caller = caller,
        .to = contract_address,
        .value = 0,
        .input = calldata,
        .gas = 100_000_000,
    } };
    const call_result = try vm.call(params);

    try std.testing.expect(call_result.success);
    if (call_result.output) |output| {
        try std.testing.expect(output.len >= 32);
        try std.testing.expect(output[output.len - 1] == 1); // transfer should return true
    }
}