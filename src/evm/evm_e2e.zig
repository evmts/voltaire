const std = @import("std");
const testing = std.testing;
const evm = @import("root.zig");
const primitives = @import("primitives");
const Address = primitives.Address;

test {
    std.testing.log_level = .warn;
}

fn hexDecode(allocator: std.mem.Allocator, hex_str: []const u8) ![]u8 {
    const clean_hex = if (std.mem.startsWith(u8, hex_str, "0x")) hex_str[2..] else hex_str;
    const result = try allocator.alloc(u8, clean_hex.len / 2);
    _ = try std.fmt.hexToBytes(result, clean_hex);
    return result;
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

fn deploy(vm: *evm.Evm, caller: Address.Address, bytecode: []const u8) !Address.Address {
    const create_result = try vm.create_contract(caller, 0, bytecode, 10_000_000);
    if (!create_result.success) {
        std.debug.print("TEST FAILURE: deploy failed, success=false, gas_left={}\n", .{create_result.gas_left});
        return error.DeploymentFailed;
    }
    return create_result.address;
}

// E2E Tests migrated from legacy test files

test "E2E: snailtracer benchmark executes successfully" {
    const allocator = std.testing.allocator;

    // Load bytecode and calldata from official case
    const bytecode_hex = try readCaseFile(allocator, "snailtracer", "bytecode.txt");
    defer allocator.free(bytecode_hex);
    const calldata_hex = try readCaseFile(allocator, "snailtracer", "calldata.txt");
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

    // Caller and funding
    const caller = primitives.Address.from_u256(0x1000000000000000000000000000000000000001);
    try vm.state.set_balance(caller, std.math.maxInt(u256));

    // Deploy and call
    const contract_address = try deploy(&vm, caller, bytecode);
    const initial_gas: u64 = 100_000_000;
    const params = evm.CallParams{ .call = .{
        .caller = caller,
        .to = contract_address,
        .value = 0,
        .input = calldata,
        .gas = initial_gas,
    } };
    const call_result = try vm.call(params);

    if (!call_result.success) {
        evm.Log.debug("[snailtracer-e2e] Call failed with gas_left={d}", .{call_result.gas_left});
        evm.Log.debug("[snailtracer-e2e] Contract deployed at: {x}", .{Address.to_u256(contract_address)});
        evm.Log.debug("[snailtracer-e2e] Calldata length: {d}", .{calldata.len});
        if (calldata.len >= 4) {
            evm.Log.debug("[snailtracer-e2e] Function selector: 0x{x:0>8}", .{std.mem.readInt(u32, calldata[0..4], .big)});
        }
    }

    try std.testing.expect(call_result.success);
    const gas_used = initial_gas - call_result.gas_left;
    try std.testing.expect(gas_used > 0);

    // Snailtracer should produce output
    if (call_result.output) |output| {
        try std.testing.expect(output.len > 0);
    } else {
        return error.NoOutput;
    }
}

test "E2E: snailtracer high gas consumption" {
    const allocator = std.testing.allocator;

    // Load bytecode and calldata
    const bytecode_hex = try readCaseFile(allocator, "snailtracer", "bytecode.txt");
    defer allocator.free(bytecode_hex);
    const calldata_hex = try readCaseFile(allocator, "snailtracer", "calldata.txt");
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

    const caller = Address.from_u256(0x1000000000000000000000000000000000000001);
    try vm.state.set_balance(caller, std.math.maxInt(u256));

    // Deploy and call with gas tracking
    const contract_address = try deploy(&vm, caller, bytecode);
    const initial_gas: u64 = 100_000_000;
    const params = evm.CallParams{ .call = .{
        .caller = caller,
        .to = contract_address,
        .value = 0,
        .input = calldata,
        .gas = initial_gas,
    } };
    const call_result = try vm.call(params);

    try std.testing.expect(call_result.success);

    // Snailtracer is computationally intensive - should use significant gas
    const gas_used = initial_gas - call_result.gas_left;
    try std.testing.expect(gas_used > 1_000_000); // Should use at least 1M gas
}

test "E2E: ten-thousand-hashes benchmark executes successfully" {
    const allocator = std.testing.allocator;

    // Load bytecode and calldata from official case
    const bytecode_hex = try readCaseFile(allocator, "ten-thousand-hashes", "bytecode.txt");
    defer allocator.free(bytecode_hex);
    const calldata_hex = try readCaseFile(allocator, "ten-thousand-hashes", "calldata.txt");
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

    // Caller and funding
    const caller = primitives.Address.from_u256(0x1000000000000000000000000000000000000001);
    try vm.state.set_balance(caller, std.math.maxInt(u256));

    // Deploy and call
    const contract_address = try deploy(&vm, caller, bytecode);
    const params = evm.CallParams{ .call = .{
        .caller = caller,
        .to = contract_address,
        .value = 0,
        .input = calldata,
        .gas = 1_000_000_000,
    } };
    const call_result = try vm.call(params);

    try std.testing.expect(call_result.success);
}

test "E2E: ten-thousand-hashes gas consumption" {
    const allocator = std.testing.allocator;

    // Load bytecode and calldata
    const bytecode_hex = try readCaseFile(allocator, "ten-thousand-hashes", "bytecode.txt");
    defer allocator.free(bytecode_hex);
    const calldata_hex = try readCaseFile(allocator, "ten-thousand-hashes", "calldata.txt");
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

    const caller = Address.from_u256(0x1000000000000000000000000000000000000001);
    try vm.state.set_balance(caller, std.math.maxInt(u256));

    // Deploy and call
    const contract_address = try deploy(&vm, caller, bytecode);
    const initial_gas: u64 = 10_000_000;
    const params = evm.CallParams{ .call = .{
        .caller = caller,
        .to = contract_address,
        .value = 0,
        .input = calldata,
        .gas = initial_gas,
    } };
    const call_result = try vm.call(params);

    try std.testing.expect(call_result.success);

    // Verify significant gas was consumed (10,000 hashes should use substantial gas)
    const gas_used = initial_gas - call_result.gas_left;
    try std.testing.expect(gas_used > 100_000); // Should use at least 100k gas
}

test "E2E: erc20 transfer benchmark executes successfully" {
    const allocator = std.testing.allocator;

    // Load bytecode and calldata from official case (erc20-transfer)
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

    // Caller and funding
    const caller = primitives.Address.from_u256(0x1000000000000000000000000000000000000001);
    try vm.state.set_balance(caller, std.math.maxInt(u256));

    // Deploy and call
    const contract_address = try deploy(&vm, caller, bytecode);
    const initial_gas: u64 = 100_000_000;
    const params = evm.CallParams{ .call = .{
        .caller = caller,
        .to = contract_address,
        .value = 0,
        .input = calldata,
        .gas = initial_gas,
    } };
    const call_result = try vm.call(params);

    if (!call_result.success) {
        evm.Log.debug("[erc20-e2e] Call failed with gas_left={d}, initial_gas={d}", .{ call_result.gas_left, initial_gas });
        evm.Log.debug("[erc20-e2e] Contract deployed at: {x}", .{Address.to_u256(contract_address)});
        evm.Log.debug("[erc20-e2e] Calldata length: {d}", .{calldata.len});
        if (calldata.len >= 4) {
            evm.Log.debug("[erc20-e2e] Function selector: 0x{x:0>8}", .{std.mem.readInt(u32, calldata[0..4], .big)});
        }
    }

    try std.testing.expect(call_result.success);
    const gas_used = initial_gas - call_result.gas_left;
    try std.testing.expect(gas_used > 0);

    // transfer(address,uint256) should return 32-byte true
    if (call_result.output) |output| {
        try std.testing.expect(output.len >= 32);
        try std.testing.expect(output[output.len - 1] == 1);
    } else {
        return error.MissingReturnData;
    }
}

test "E2E: erc20 mint benchmark executes successfully" {
    const allocator = std.testing.allocator;

    // Load bytecode and calldata from official case (erc20-mint)
    const bytecode_hex = try readCaseFile(allocator, "erc20-mint", "bytecode.txt");
    defer allocator.free(bytecode_hex);
    const calldata_hex = try readCaseFile(allocator, "erc20-mint", "calldata.txt");
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

    // Caller and funding
    const caller = primitives.Address.from_u256(0x1000000000000000000000000000000000000001);
    try vm.state.set_balance(caller, std.math.maxInt(u256));

    // Deploy and call
    const contract_address = try deploy(&vm, caller, bytecode);
    const initial_gas: u64 = 100_000_000;
    const params = evm.CallParams{ .call = .{
        .caller = caller,
        .to = contract_address,
        .value = 0,
        .input = calldata,
        .gas = initial_gas,
    } };
    const call_result = try vm.call(params);

    try std.testing.expect(call_result.success);
    const gas_used = initial_gas - call_result.gas_left;
    try std.testing.expect(gas_used > 0);

    // Many mint implementations return bool; accept either true or empty (if non-standard)
    if (call_result.output) |output| {
        if (output.len > 0) {
            try std.testing.expect(output.len >= 32);
            try std.testing.expect(output[output.len - 1] == 1);
        }
    }
}

test "E2E: erc20 approval-transfer benchmark executes successfully" {
    const allocator = std.testing.allocator;

    // Load bytecode and calldata from official case (erc20-approval-transfer)
    const bytecode_hex = try readCaseFile(allocator, "erc20-approval-transfer", "bytecode.txt");
    defer allocator.free(bytecode_hex);
    const calldata_hex = try readCaseFile(allocator, "erc20-approval-transfer", "calldata.txt");
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

    // Caller and funding
    const caller = primitives.Address.from_u256(0x1000000000000000000000000000000000000001);
    try vm.state.set_balance(caller, std.math.maxInt(u256));

    // Deploy and call
    const contract_address = try deploy(&vm, caller, bytecode);
    const initial_gas: u64 = 100_000_000;
    const params = evm.CallParams{ .call = .{
        .caller = caller,
        .to = contract_address,
        .value = 0,
        .input = calldata,
        .gas = initial_gas,
    } };
    const call_result = try vm.call(params);

    try std.testing.expect(call_result.success);
    const gas_used = initial_gas - call_result.gas_left;
    try std.testing.expect(gas_used > 0);

    // approve->transfer flow should return bool true on the last call
    if (call_result.output) |output| {
        try std.testing.expect(output.len >= 32);
        try std.testing.expect(output[output.len - 1] == 1);
    } else {
        return error.MissingReturnData;
    }
}